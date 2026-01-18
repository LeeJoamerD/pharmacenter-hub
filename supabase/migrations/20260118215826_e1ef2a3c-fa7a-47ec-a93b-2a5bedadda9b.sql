-- Fix ON CONFLICT to match unique constraint (tenant_id, code_pays)
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
  v_code_pays TEXT;
BEGIN
  -- Vérifications d'autorisation
  v_current_tenant := get_current_user_tenant_id();
  IF v_current_tenant IS NULL OR v_current_tenant != p_tenant_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé');
  END IF;

  -- Récupérer le code pays du tenant depuis accounting_general_config
  SELECT COALESCE(pays, 'CG') INTO v_code_pays
  FROM accounting_general_config
  WHERE tenant_id = p_tenant_id;
  
  -- Valeur par défaut si pas de config
  IF v_code_pays IS NULL THEN
    v_code_pays := 'CG';
  END IF;

  -- Récupérer les informations du plan global
  SELECT code, nom, version, devise_principale 
  INTO v_plan_code, v_plan_nom, v_plan_version, v_plan_devise
  FROM plans_comptables_globaux
  WHERE id = p_plan_global_id AND is_active = true;
  
  IF v_plan_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan comptable global non trouvé ou inactif');
  END IF;

  -- Construire les classes depuis le plan global
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

  -- Supprimer les comptes existants du tenant
  DELETE FROM plan_comptable WHERE tenant_id = p_tenant_id;

  -- Insérer les comptes avec le mapping correct
  INSERT INTO plan_comptable (
    tenant_id, numero_compte, libelle_compte, 
    type_compte, nature_compte, classe, niveau,
    is_active, analytique, rapprochement, description
  )
  SELECT 
    p_tenant_id,
    cg.numero_compte,
    cg.libelle_compte,
    CASE 
      WHEN cg.niveau = 1 THEN 'titre'
      WHEN cg.niveau = 2 THEN 'sous-titre'
      ELSE 'detail'
    END,
    cg.type_compte,
    cg.classe,
    COALESCE(cg.niveau, 1),
    COALESCE(cg.is_active, true),
    false,
    false,
    cg.description
  FROM comptes_globaux cg
  WHERE cg.plan_comptable_id = p_plan_global_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Mise à jour des relations parent/enfant
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

  -- Mise à jour des paramètres régionaux avec ON CONFLICT correct
  INSERT INTO parametres_plan_comptable_regionaux (
    tenant_id, code_pays, classes_definition, systeme_comptable, 
    version_systeme, devise_principale
  )
  VALUES (
    p_tenant_id, v_code_pays, v_classes, v_plan_code, 
    v_plan_version, v_plan_devise
  )
  ON CONFLICT (tenant_id, code_pays) DO UPDATE SET 
    classes_definition = EXCLUDED.classes_definition,
    systeme_comptable = EXCLUDED.systeme_comptable,
    version_systeme = EXCLUDED.version_systeme,
    devise_principale = EXCLUDED.devise_principale,
    updated_at = NOW();

  -- Mise à jour de la config comptable générale
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