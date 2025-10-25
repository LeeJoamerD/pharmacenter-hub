-- Restauration complète du système de sessions pharmacie

-- Étape 1: Créer la table pharmacy_sessions
CREATE TABLE IF NOT EXISTS public.pharmacy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '48 hours'),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_sessions_user_id ON public.pharmacy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sessions_pharmacy_id ON public.pharmacy_sessions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sessions_session_token ON public.pharmacy_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sessions_active ON public.pharmacy_sessions(is_active, expires_at);

-- Étape 2: Activer RLS sur la table
ALTER TABLE public.pharmacy_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux pharmacies d'accéder à leurs propres sessions
CREATE POLICY "Pharmacies can manage their own sessions"
ON public.pharmacy_sessions
FOR ALL
USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies 
    WHERE id = get_current_user_tenant_id()
  )
  OR user_id = auth.uid()
);

-- Étape 3: Créer la fonction create_pharmacy_session
CREATE OR REPLACE FUNCTION public.create_pharmacy_session(
  p_pharmacy_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
BEGIN
  -- Récupérer l'utilisateur authentifié
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié'
    );
  END IF;
  
  -- Vérifier que la pharmacie existe et est active
  IF NOT EXISTS (
    SELECT 1 FROM public.pharmacies 
    WHERE id = p_pharmacy_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pharmacie non trouvée ou inactive'
    );
  END IF;
  
  -- Désactiver les anciennes sessions de cet utilisateur pour cette pharmacie
  UPDATE public.pharmacy_sessions
  SET is_active = false
  WHERE user_id = v_user_id 
    AND pharmacy_id = p_pharmacy_id
    AND is_active = true;
  
  -- Générer un token de session sécurisé
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + INTERVAL '48 hours';
  
  -- Créer la nouvelle session
  INSERT INTO public.pharmacy_sessions (
    user_id,
    pharmacy_id,
    session_token,
    is_active,
    ip_address,
    user_agent,
    expires_at,
    created_at,
    last_activity
  ) VALUES (
    v_user_id,
    p_pharmacy_id,
    v_session_token,
    true,
    p_ip_address,
    p_user_agent,
    v_expires_at,
    now(),
    now()
  ) RETURNING id INTO v_session_id;
  
  -- Logger l'événement dans audit_logs
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    status
  ) VALUES (
    p_pharmacy_id,
    v_user_id,
    'PHARMACY_SESSION_CREATED',
    'pharmacy_sessions',
    v_session_id,
    jsonb_build_object(
      'pharmacy_id', p_pharmacy_id,
      'session_id', v_session_id,
      'ip_address', p_ip_address::text
    ),
    'success'
  );
  
  -- Retourner les données de session
  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'session_id', v_session_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_pharmacy_session(UUID, INET, TEXT) 
TO authenticated;

-- Étape 4: Fonction utilitaire pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_pharmacy_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.pharmacy_sessions
  WHERE expires_at < now()
    OR (is_active = false AND created_at < now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_pharmacy_sessions() 
TO authenticated;

-- Documentation
COMMENT ON TABLE public.pharmacy_sessions IS 
'Gestion des sessions de connexion des pharmacies avec tokens sécurisés et expiration';

COMMENT ON FUNCTION public.create_pharmacy_session IS 
'Crée une nouvelle session de pharmacie pour l''utilisateur authentifié avec génération de token sécurisé';

COMMENT ON FUNCTION public.cleanup_expired_pharmacy_sessions IS 
'Nettoie automatiquement les sessions expirées ou inactives depuis plus de 7 jours';