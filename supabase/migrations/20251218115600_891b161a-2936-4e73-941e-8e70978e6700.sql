-- Recréer la fonction create_pharmacy_session avec désactivation explicite de RLS
CREATE OR REPLACE FUNCTION public.create_pharmacy_session(
  p_pharmacy_id uuid, 
  p_ip_address text DEFAULT NULL, 
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  -- DÉSACTIVER RLS pour permettre l'insertion
  SET LOCAL row_security = off;
  
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
  
  -- Récupérer user_id si disponible
  v_user_id := auth.uid();
  
  -- Créer la session
  INSERT INTO public.pharmacy_sessions (
    user_id, pharmacy_id, session_token, is_active,
    ip_address, user_agent, expires_at, created_at, last_activity
  ) VALUES (
    v_user_id, p_pharmacy_id, v_session_token, true,
    p_ip_address, p_user_agent, v_expires_at, now(), now()
  ) RETURNING id INTO v_session_id;
  
  -- Vérifier que l'insertion a réussi
  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Échec de création de session');
  END IF;
  
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

-- S'assurer que les permissions sont correctes
GRANT EXECUTE ON FUNCTION public.create_pharmacy_session(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pharmacy_session(uuid, text, text) TO anon;