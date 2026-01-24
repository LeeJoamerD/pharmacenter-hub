-- Fonction pour vérifier si un utilisateur authentifié appartient au tenant spécifié
CREATE OR REPLACE FUNCTION public.verify_user_belongs_to_tenant(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
  personnel_record RECORD;
BEGIN
  -- Récupérer l'utilisateur actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('belongs', false, 'error', 'Utilisateur non authentifié');
  END IF;
  
  -- Vérifier si l'utilisateur appartient au tenant spécifié
  SELECT id, noms, prenoms INTO personnel_record
  FROM public.personnel
  WHERE auth_user_id = current_user_id 
    AND tenant_id = p_tenant_id
    AND is_active = true
  LIMIT 1;
  
  IF personnel_record IS NULL THEN
    RETURN jsonb_build_object(
      'belongs', false,
      'error', 'Utilisateur non trouvé dans cette pharmacie'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'belongs', true,
    'user_name', personnel_record.noms || ' ' || COALESCE(personnel_record.prenoms, ''),
    'personnel_id', personnel_record.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_user_belongs_to_tenant TO authenticated;

COMMENT ON FUNCTION public.verify_user_belongs_to_tenant IS 
  'Vérifie si l''utilisateur authentifié appartient au tenant spécifié et est actif';