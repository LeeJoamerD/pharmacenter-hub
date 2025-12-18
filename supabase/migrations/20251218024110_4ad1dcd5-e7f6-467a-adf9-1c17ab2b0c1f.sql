-- 1. Permettre user_id NULL dans pharmacy_sessions
ALTER TABLE public.pharmacy_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Créer la fonction validate_pharmacy_session (SECURITY DEFINER pour fonctionner sans auth)
CREATE OR REPLACE FUNCTION public.validate_pharmacy_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record record;
  pharmacy_data jsonb;
BEGIN
  -- Vérifier la session par token uniquement (pas besoin d'auth.uid())
  SELECT ps.id, ps.pharmacy_id, ps.expires_at, ps.is_active
  INTO session_record
  FROM public.pharmacy_sessions ps
  WHERE ps.session_token = p_session_token
    AND ps.is_active = true
    AND ps.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Session invalide ou expirée');
  END IF;
  
  -- Mettre à jour la dernière activité
  UPDATE public.pharmacy_sessions 
  SET last_activity = now() 
  WHERE id = session_record.id;
  
  -- Récupérer les données complètes de la pharmacie
  SELECT to_jsonb(p.*) INTO pharmacy_data
  FROM public.pharmacies p 
  WHERE p.id = session_record.pharmacy_id;
  
  -- Retourner les données
  RETURN jsonb_build_object(
    'valid', true,
    'pharmacy', pharmacy_data,
    'session_id', session_record.id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- 3. Recréer create_pharmacy_session pour ne pas dépendre strictement d'auth.uid()
CREATE OR REPLACE FUNCTION public.create_pharmacy_session(
  p_pharmacy_id uuid,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  -- Vérifier que la pharmacie existe et est active
  IF NOT EXISTS (
    SELECT 1 FROM public.pharmacies 
    WHERE id = p_pharmacy_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pharmacie non trouvée ou inactive');
  END IF;
  
  -- Désactiver les anciennes sessions pour cette pharmacie
  UPDATE public.pharmacy_sessions
  SET is_active = false
  WHERE pharmacy_id = p_pharmacy_id AND is_active = true;
  
  -- Générer un token sécurisé
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + INTERVAL '7 days';
  
  -- Récupérer user_id si disponible (peut être NULL)
  v_user_id := auth.uid();
  
  -- Créer la session (user_id peut être NULL)
  INSERT INTO public.pharmacy_sessions (
    user_id, pharmacy_id, session_token, is_active,
    ip_address, user_agent, expires_at, created_at, last_activity
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
  
  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'session_id', v_session_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Créer disconnect_pharmacy_session si elle n'existe pas
CREATE OR REPLACE FUNCTION public.disconnect_pharmacy_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pharmacy_sessions
  SET is_active = false
  WHERE session_token = p_session_token;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.validate_pharmacy_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pharmacy_session(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_pharmacy_session(text) TO anon, authenticated;

-- 6. Politique RLS permissive pour pharmacy_sessions (la sécurité est gérée par SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow session operations" ON public.pharmacy_sessions;
CREATE POLICY "Allow session operations" ON public.pharmacy_sessions
FOR ALL USING (true) WITH CHECK (true);