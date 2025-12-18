-- Supprimer et recréer la fonction pour forcer le rechargement du cache PostgREST
DROP FUNCTION IF EXISTS public.validate_pharmacy_session(text);

-- Recréer la fonction avec la même définition
CREATE OR REPLACE FUNCTION public.validate_pharmacy_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- GRANT explicites pour s'assurer que anon et authenticated peuvent exécuter
GRANT EXECUTE ON FUNCTION public.validate_pharmacy_session(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_pharmacy_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pharmacy_session(text) TO service_role;

-- Commenter la fonction
COMMENT ON FUNCTION public.validate_pharmacy_session(text) IS 'Valide une session pharmacie par token - accessible sans authentification utilisateur';