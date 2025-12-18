-- Fix create_pharmacy_session RPC to properly convert TEXT to INET type
-- Error: column "ip_address" is of type inet but expression is of type text

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
  v_ip_inet INET;
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
  
  -- Générer le token de session avec le préfixe de schéma complet
  v_session_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := now() + INTERVAL '7 days';
  
  -- Récupérer l'ID utilisateur actuel (peut être NULL pour session pharmacie indépendante)
  v_user_id := auth.uid();
  
  -- CORRECTION : Convertir TEXT en INET de manière sécurisée
  BEGIN
    IF p_ip_address IS NOT NULL AND p_ip_address != '' THEN
      v_ip_inet := p_ip_address::inet;
    ELSE
      v_ip_inet := NULL;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_ip_inet := NULL;
  END;
  
  -- Créer la nouvelle session avec le type INET correct
  INSERT INTO public.pharmacy_sessions (
    user_id, pharmacy_id, session_token, is_active,
    ip_address, user_agent, expires_at, created_at, last_activity
  ) VALUES (
    v_user_id, p_pharmacy_id, v_session_token, true,
    v_ip_inet, p_user_agent, v_expires_at, now(), now()
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