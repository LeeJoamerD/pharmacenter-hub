-- Fonction RPC pour importer le plan comptable global vers le tenant
-- Cette fonction gère les limites Supabase en travaillant côté serveur

CREATE OR REPLACE FUNCTION public.import_global_accounting_plan(
  p_tenant_id UUID,
  p_plan_global_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count INTEGER := 0;
  v_classes JSONB;
  v_plan_code TEXT;
  v_plan_nom TEXT;
  v_plan_version TEXT;
  v_plan_devise TEXT;
  v_current_tenant UUID;
BEGIN
  -- Vérifier que l'utilisateur appartient au tenant
  v_current_tenant := get_current_user_tenant_id();
  IF v_current_tenant IS NULL OR v_current_tenant != p_tenant_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé');
  END IF;

  -- 1. Vérifier que le plan global existe et est actif
  SELECT code, nom, version, devise_principale 
  INTO v_plan_code, v_plan_nom, v_plan_version, v_plan_devise
  FROM plans_comptables_globaux
  WHERE id = p_plan_global_id AND is_active = true;
  
  IF v_plan_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan comptable global non trouvé ou inactif');
  END IF;

  -- 2. Construire le JSONB des classes depuis classes_comptables_globales
  SELECT jsonb_agg(
    jsonb_build_object(
      'classe', numero,
      'nom', nom,
      'description', COALESCE(description, ''),
      'icon', COALESCE(icon, 'BookOpen'),
      'color', COALESCE(color, 'text-gray-600')
    ) ORDER BY numero
  ) INTO v_classes
  FROM classes_comptables_globales
  WHERE plan_comptable_id = p_plan_global_id;

  IF v_classes IS NULL THEN
    v_classes := '[]'::jsonb;
  END IF;

  -- 3. Supprimer tous les comptes existants du tenant
  DELETE FROM plan_comptable WHERE tenant_id = p_tenant_id;

  -- 4. Insérer tous les comptes depuis comptes_globaux
  -- Première passe : insérer tous les comptes sans compte_parent_id
  INSERT INTO plan_comptable (
    tenant_id, 
    numero_compte, 
    libelle_compte, 
    type_compte, 
    classe, 
    niveau,
    is_active, 
    analytique, 
    rapprochement, 
    description
  )
  SELECT 
    p_tenant_id,
    cg.numero_compte,
    cg.libelle_compte,
    COALESCE(cg.type_compte, 'detail'),
    cg.classe,
    COALESCE(cg.niveau, 1),
    COALESCE(cg.is_active, true),
    false,
    false,
    cg.description
  FROM comptes_globaux cg
  WHERE cg.plan_comptable_id = p_plan_global_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 5. Mise à jour des relations parent/enfant
  UPDATE plan_comptable pc
  SET compte_parent_id = parent.id
  FROM comptes_globaux cg
  JOIN plan_comptable parent 
    ON parent.numero_compte = cg.compte_parent_numero 
    AND parent.tenant_id = p_tenant_id
  WHERE pc.numero_compte = cg.numero_compte 
    AND pc.tenant_id = p_tenant_id
    AND cg.plan_comptable_id = p_plan_global_id
    AND cg.compte_parent_numero IS NOT NULL;

  -- 6. Mettre à jour ou insérer parametres_plan_comptable_regionaux avec les classes
  INSERT INTO parametres_plan_comptable_regionaux (
    tenant_id,
    classes_definition,
    systeme_comptable,
    version_systeme,
    devise_principale
  )
  VALUES (
    p_tenant_id,
    v_classes,
    v_plan_code,
    v_plan_version,
    v_plan_devise
  )
  ON CONFLICT (tenant_id) DO UPDATE SET 
    classes_definition = EXCLUDED.classes_definition,
    systeme_comptable = EXCLUDED.systeme_comptable,
    version_systeme = EXCLUDED.version_systeme,
    devise_principale = EXCLUDED.devise_principale,
    updated_at = NOW();

  -- 7. Mettre à jour accounting_general_config
  UPDATE accounting_general_config
  SET 
    plan_comptable = CASE 
      WHEN v_plan_code ILIKE '%SYSCOHADA%' THEN 'ohada'
      WHEN v_plan_code ILIKE '%PCG%' THEN 'pcg'
      ELSE LOWER(REPLACE(v_plan_code, '_', '-'))
    END,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'plan_code', v_plan_code,
    'plan_nom', v_plan_nom,
    'comptes_importes', v_count,
    'classes_count', jsonb_array_length(v_classes)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fonction pour obtenir le plan global correspondant à la config du tenant
CREATE OR REPLACE FUNCTION public.get_matching_global_plan(p_tenant_id UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_code TEXT,
  plan_nom TEXT,
  plan_version TEXT,
  comptes_count BIGINT,
  classes_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config_plan TEXT;
BEGIN
  -- Récupérer la configuration du tenant
  SELECT plan_comptable INTO v_config_plan
  FROM accounting_general_config
  WHERE tenant_id = p_tenant_id;

  -- Mapper vers le code du plan global
  -- ohada -> SYSCOHADA_REVISE
  -- pcg -> PCG_FRANCE
  IF v_config_plan = 'ohada' OR v_config_plan IS NULL THEN
    v_config_plan := 'SYSCOHADA_REVISE';
  ELSIF v_config_plan = 'pcg' THEN
    v_config_plan := 'PCG_FRANCE';
  ELSE
    v_config_plan := UPPER(REPLACE(v_config_plan, '-', '_'));
  END IF;

  RETURN QUERY
  SELECT 
    pg.id AS plan_id,
    pg.code AS plan_code,
    pg.nom AS plan_nom,
    pg.version AS plan_version,
    (SELECT COUNT(*) FROM comptes_globaux cg WHERE cg.plan_comptable_id = pg.id) AS comptes_count,
    (SELECT COUNT(*) FROM classes_comptables_globales ccg WHERE ccg.plan_comptable_id = pg.id) AS classes_count
  FROM plans_comptables_globaux pg
  WHERE pg.code = v_config_plan
    AND pg.is_active = true
  LIMIT 1;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.import_global_accounting_plan(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_matching_global_plan(UUID) TO authenticated;