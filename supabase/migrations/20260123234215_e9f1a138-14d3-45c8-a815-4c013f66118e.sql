-- =====================================================
-- Migration: Créer table journaux_comptables_globaux, comptes et journaux SYSCOHADA
-- =====================================================

-- Section 1: Créer la table journaux_comptables_globaux
CREATE TABLE IF NOT EXISTS public.journaux_comptables_globaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_comptable_id UUID NOT NULL REFERENCES plans_comptables_globaux(id) ON DELETE CASCADE,
  code_journal VARCHAR(10) NOT NULL,
  libelle_journal TEXT NOT NULL,
  type_journal TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_comptable_id, code_journal)
);

-- RLS policies pour la table journaux_comptables_globaux
ALTER TABLE journaux_comptables_globaux ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent voir les journaux globaux
CREATE POLICY "Authenticated users can view global journals"
  ON journaux_comptables_globaux FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les platform admins peuvent insérer
CREATE POLICY "Platform admins can insert global journals"
  ON journaux_comptables_globaux FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

-- Seuls les platform admins peuvent modifier
CREATE POLICY "Platform admins can update global journals"
  ON journaux_comptables_globaux FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Seuls les platform admins peuvent supprimer
CREATE POLICY "Platform admins can delete global journals"
  ON journaux_comptables_globaux FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- Section 2: Ajouter les 3 comptes manquants au plan SYSCOHADA Révisé global
-- Classe 4 = Passif (selon le système SYSCOHADA)
INSERT INTO comptes_globaux (
  plan_comptable_id, numero_compte, libelle_compte, 
  classe, niveau, compte_parent_numero, type_compte, is_active
)
VALUES 
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4461', 'Centime additionnel sur chiffre d''affaires', 4, 4, '446', 'Passif', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4467', 'Centime additionnel déductible sur achats', 4, 4, '446', 'Passif', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', '4468', 'ASDI déductible sur achats', 4, 4, '446', 'Passif', true)
ON CONFLICT (plan_comptable_id, numero_compte) DO NOTHING;

-- Section 3: Ajouter les journaux standards SYSCOHADA au référentiel global
INSERT INTO journaux_comptables_globaux (
  plan_comptable_id, code_journal, libelle_journal, type_journal, is_active
)
VALUES 
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'VT', 'Journal des Ventes', 'Ventes', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'AC', 'Journal des Achats', 'Achats', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'BQ', 'Journal de Banque', 'Banque', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'CA', 'Journal de Caisse', 'Caisse', true),
  ('8d875fa6-4e4b-4f1d-a3ef-07ebf35743f4', 'OD', 'Journal des Opérations Diverses', 'Operations_Diverses', true)
ON CONFLICT (plan_comptable_id, code_journal) DO NOTHING;

-- Section 4: Ajouter contrainte unique sur journaux_comptables si absente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'journaux_comptables_tenant_code_unique'
  ) THEN
    ALTER TABLE journaux_comptables 
    ADD CONSTRAINT journaux_comptables_tenant_code_unique 
    UNIQUE (tenant_id, code_journal);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Section 5: Mettre à jour la fonction import_global_accounting_plan pour inclure les journaux
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
  v_journal_count INTEGER := 0;
  v_classes JSONB;
  v_plan_code TEXT;
  v_plan_nom TEXT;
  v_plan_version TEXT;
  v_plan_devise TEXT;
  v_current_tenant UUID;
  v_code_pays TEXT;
  v_pays TEXT;
  v_symbole_devise TEXT;
  v_systeme_comptable TEXT;
BEGIN
  -- Vérifications d'autorisation
  v_current_tenant := get_current_user_tenant_id();
  IF v_current_tenant IS NULL OR v_current_tenant != p_tenant_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès non autorisé');
  END IF;

  -- Récupérer les informations du plan global
  SELECT code, nom, version, devise_principale 
  INTO v_plan_code, v_plan_nom, v_plan_version, v_plan_devise
  FROM plans_comptables_globaux
  WHERE id = p_plan_global_id AND is_active = true;
  
  IF v_plan_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan comptable global non trouvé ou inactif');
  END IF;

  -- Déterminer le code pays depuis les paramètres régionaux existants
  SELECT code_pays INTO v_code_pays
  FROM parametres_plan_comptable_regionaux
  WHERE tenant_id = p_tenant_id
  LIMIT 1;
  
  -- Si pas de config existante, déduire du plan comptable
  IF v_code_pays IS NULL THEN
    v_code_pays := CASE 
      WHEN v_plan_code ILIKE '%SYSCOHADA%' THEN 'CG'
      WHEN v_plan_code ILIKE '%OHADA%' THEN 'CG'
      WHEN v_plan_code ILIKE '%PCG%' THEN 'FR'
      ELSE 'CG'
    END;
  END IF;

  -- Calculer le nom du pays (NOT NULL)
  v_pays := CASE v_code_pays
    WHEN 'CG' THEN 'Congo-Brazzaville'
    WHEN 'CD' THEN 'République Démocratique du Congo'
    WHEN 'FR' THEN 'France'
    WHEN 'CI' THEN 'Côte d''Ivoire'
    WHEN 'SN' THEN 'Sénégal'
    WHEN 'CM' THEN 'Cameroun'
    WHEN 'GA' THEN 'Gabon'
    WHEN 'BF' THEN 'Burkina Faso'
    WHEN 'ML' THEN 'Mali'
    WHEN 'NE' THEN 'Niger'
    WHEN 'TG' THEN 'Togo'
    WHEN 'BJ' THEN 'Bénin'
    ELSE 'Congo-Brazzaville'
  END;

  -- Calculer le symbole devise (NOT NULL)
  v_symbole_devise := CASE COALESCE(v_plan_devise, 'XAF')
    WHEN 'XAF' THEN 'FCFA'
    WHEN 'XOF' THEN 'FCFA'
    WHEN 'EUR' THEN '€'
    WHEN 'USD' THEN '$'
    WHEN 'GBP' THEN '£'
    ELSE COALESCE(v_plan_devise, 'FCFA')
  END;

  -- Normaliser le système comptable
  v_systeme_comptable := CASE 
    WHEN v_plan_code ILIKE '%SYSCOHADA%' THEN 'OHADA'
    WHEN v_plan_code ILIKE '%OHADA%' THEN 'OHADA'
    WHEN v_plan_code ILIKE '%PCG%' THEN 'PCG'
    ELSE v_plan_code
  END;

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

  -- =====================================================
  -- Import automatique des journaux depuis le référentiel global
  -- =====================================================
  
  INSERT INTO journaux_comptables (
    tenant_id, code_journal, libelle_journal, type_journal, 
    is_active, auto_generation, sequence_courante
  )
  SELECT 
    p_tenant_id,
    jcg.code_journal,
    jcg.libelle_journal,
    jcg.type_journal,
    jcg.is_active,
    false,
    1
  FROM journaux_comptables_globaux jcg
  WHERE jcg.plan_comptable_id = p_plan_global_id
  ON CONFLICT (tenant_id, code_journal) DO UPDATE SET
    libelle_journal = EXCLUDED.libelle_journal,
    type_journal = EXCLUDED.type_journal,
    is_active = EXCLUDED.is_active;

  GET DIAGNOSTICS v_journal_count = ROW_COUNT;

  -- Mise à jour des paramètres régionaux
  INSERT INTO parametres_plan_comptable_regionaux (
    tenant_id, code_pays, pays, classes_definition, 
    systeme_comptable, version_systeme, devise_principale, symbole_devise
  )
  VALUES (
    p_tenant_id, v_code_pays, v_pays, v_classes, 
    v_systeme_comptable, v_plan_version, COALESCE(v_plan_devise, 'XAF'), v_symbole_devise
  )
  ON CONFLICT (tenant_id, code_pays) DO UPDATE SET 
    pays = EXCLUDED.pays,
    classes_definition = EXCLUDED.classes_definition,
    systeme_comptable = EXCLUDED.systeme_comptable,
    version_systeme = EXCLUDED.version_systeme,
    devise_principale = EXCLUDED.devise_principale,
    symbole_devise = EXCLUDED.symbole_devise,
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
    'journaux_importes', v_journal_count,
    'classes_count', jsonb_array_length(v_classes)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;