-- Fix create_pharmacy_session RPC to use extensions.gen_random_bytes with schema prefix
-- The pgcrypto extension is installed in the 'extensions' schema, not 'public'

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
  SET LOCAL row_security = off;
  
  -- Vérifier que la pharmacie existe et est active
  IF NOT EXISTS (
    SELECT 1 FROM public.pharmacies 
    WHERE id = p_pharmacy_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pharmacie non trouvée ou inactive');
  END IF;
  
  -- Désactiver les sessions existantes pour cette pharmacie
  UPDATE public.pharmacy_sessions
  SET is_active = false
  WHERE pharmacy_id = p_pharmacy_id AND is_active = true;
  
  -- CORRECTION : Utiliser extensions.gen_random_bytes avec le préfixe de schéma complet
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := now() + INTERVAL '7 days';
  
  -- Récupérer l'ID utilisateur actuel (peut être NULL pour session pharmacie indépendante)
  v_user_id := auth.uid();
  
  -- Créer la nouvelle session
  INSERT INTO public.pharmacy_sessions (
    user_id, pharmacy_id, session_token, is_active,
    ip_address, user_agent, expires_at, created_at, last_activity
  ) VALUES (
    v_user_id, p_pharmacy_id, v_session_token, true,
    p_ip_address, p_user_agent, v_expires_at, now(), now()
  ) RETURNING id INTO v_session_id;
  
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