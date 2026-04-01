CREATE OR REPLACE FUNCTION public.clone_tenant_referential(
  p_source_tenant uuid,
  p_target_tenant uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
  r record;
BEGIN
  SET LOCAL row_security = off;

  -- Safety: check target has no products
  SELECT count(*) INTO v_count FROM produits WHERE tenant_id = p_target_tenant;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Target tenant already has % products', v_count;
  END IF;

  -- Temp mapping tables
  CREATE TEMP TABLE _map_classes (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_formes (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_familles (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_rayons (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_categories (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_labos (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_dci (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_produits (old_id uuid, new_id uuid) ON COMMIT DROP;

  -- 1. classes_therapeutiques
  INSERT INTO _map_classes (old_id, new_id)
  SELECT id, gen_random_uuid() FROM classes_therapeutiques WHERE tenant_id = p_source_tenant;

  INSERT INTO classes_therapeutiques (id, tenant_id, libelle_classe, systeme_anatomique, description, code_atc, vidal_classification_id, parent_id, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle_classe, s.systeme_anatomique, s.description, s.code_atc, s.vidal_classification_id,
    (SELECT m2.new_id FROM _map_classes m2 WHERE m2.old_id = s.parent_id),
    now(), now()
  FROM classes_therapeutiques s JOIN _map_classes m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('classes_therapeutiques', v_count);

  -- 2. formes_galeniques
  INSERT INTO _map_formes (old_id, new_id)
  SELECT id, gen_random_uuid() FROM formes_galeniques WHERE tenant_id = p_source_tenant;

  INSERT INTO formes_galeniques (id, tenant_id, libelle_forme, description, voie_administration, vidal_form_id, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle_forme, s.description, s.voie_administration, s.vidal_form_id, now(), now()
  FROM formes_galeniques s JOIN _map_formes m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('formes_galeniques', v_count);

  -- 3. famille_produit
  INSERT INTO _map_familles (old_id, new_id)
  SELECT id, gen_random_uuid() FROM famille_produit WHERE tenant_id = p_source_tenant;

  INSERT INTO famille_produit (id, tenant_id, libelle_famille, description, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle_famille, s.description, now(), now()
  FROM famille_produit s JOIN _map_familles m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('famille_produit', v_count);

  -- 4. rayons_produits
  INSERT INTO _map_rayons (old_id, new_id)
  SELECT id, gen_random_uuid() FROM rayons_produits WHERE tenant_id = p_source_tenant;

  INSERT INTO rayons_produits (id, tenant_id, libelle_rayon, description, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle_rayon, s.description, now(), now()
  FROM rayons_produits s JOIN _map_rayons m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('rayons_produits', v_count);

  -- 5. categorie_tarification
  INSERT INTO _map_categories (old_id, new_id)
  SELECT id, gen_random_uuid() FROM categorie_tarification WHERE tenant_id = p_source_tenant;

  INSERT INTO categorie_tarification (id, tenant_id, libelle_categorie, taux_tva, taux_centime_additionnel, coefficient_prix_vente, description, is_active, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle_categorie, s.taux_tva, s.taux_centime_additionnel, s.coefficient_prix_vente, s.description, s.is_active, now(), now()
  FROM categorie_tarification s JOIN _map_categories m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('categorie_tarification', v_count);

  -- 6. laboratoires
  INSERT INTO _map_labos (old_id, new_id)
  SELECT id, gen_random_uuid() FROM laboratoires WHERE tenant_id = p_source_tenant;

  INSERT INTO laboratoires (id, tenant_id, libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.libelle, s.pays_siege, s.email_siege, s.email_delegation_local, s.telephone_appel_delegation_local, s.telephone_whatsapp_delegation_local, now(), now()
  FROM laboratoires s JOIN _map_labos m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('laboratoires', v_count);

  -- 7. dci (FK -> classes_therapeutiques)
  INSERT INTO _map_dci (old_id, new_id)
  SELECT id, gen_random_uuid() FROM dci WHERE tenant_id = p_source_tenant;

  INSERT INTO dci (id, tenant_id, nom_dci, description, classe_therapeutique_id, contre_indications, effets_secondaires, posologie, produits_associes, vidal_substance_id, vidal_name, created_at, updated_at)
  SELECT m.new_id, p_target_tenant, s.nom_dci, s.description,
    (SELECT mc.new_id FROM _map_classes mc WHERE mc.old_id = s.classe_therapeutique_id),
    s.contre_indications, s.effets_secondaires, s.posologie, 0, s.vidal_substance_id, s.vidal_name, now(), now()
  FROM dci s JOIN _map_dci m ON m.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('dci', v_count);

  -- 8. produits (FK -> famille, rayon, forme, dci, classe, categorie, laboratoires)
  INSERT INTO _map_produits (old_id, new_id)
  SELECT id, gen_random_uuid() FROM produits WHERE tenant_id = p_source_tenant;

  INSERT INTO produits (id, tenant_id, libelle_produit, code_cip, prix_achat, prix_vente_ht, prix_vente_ttc, tva, centime_additionnel, stock_limite, stock_faible, niveau_detail, is_active,
    famille_id, rayon_id, forme_id, dci_id, classe_therapeutique_id, categorie_tarification_id, laboratoires_id, rayon_produit_id,
    taux_tva, taux_centime_additionnel, prescription_requise, code_barre_externe, scanner_config, stock_critique, conditions_conservation, ancien_code_cip, is_stupefiant, is_controlled_substance,
    created_at, updated_at)
  SELECT mp.new_id, p_target_tenant, s.libelle_produit, s.code_cip, s.prix_achat, s.prix_vente_ht, s.prix_vente_ttc, s.tva, s.centime_additionnel, s.stock_limite, s.stock_faible, s.niveau_detail, s.is_active,
    (SELECT mf.new_id FROM _map_familles mf WHERE mf.old_id = s.famille_id),
    (SELECT mr.new_id FROM _map_rayons mr WHERE mr.old_id = s.rayon_id),
    (SELECT mfo.new_id FROM _map_formes mfo WHERE mfo.old_id = s.forme_id),
    (SELECT md.new_id FROM _map_dci md WHERE md.old_id = s.dci_id),
    (SELECT mc.new_id FROM _map_classes mc WHERE mc.old_id = s.classe_therapeutique_id),
    (SELECT mca.new_id FROM _map_categories mca WHERE mca.old_id = s.categorie_tarification_id),
    (SELECT ml.new_id FROM _map_labos ml WHERE ml.old_id = s.laboratoires_id),
    (SELECT mr2.new_id FROM _map_rayons mr2 WHERE mr2.old_id = s.rayon_produit_id),
    s.taux_tva, s.taux_centime_additionnel, s.prescription_requise, s.code_barre_externe, s.scanner_config, s.stock_critique, s.conditions_conservation, s.ancien_code_cip, s.is_stupefiant, s.is_controlled_substance,
    now(), now()
  FROM produits s JOIN _map_produits mp ON mp.old_id = s.id
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('produits', v_count);

  -- 9. produits_dci (FK -> produits, dci)
  INSERT INTO produits_dci (id, produit_id, dci_id, tenant_id, created_at)
  SELECT gen_random_uuid(),
    (SELECT mp.new_id FROM _map_produits mp WHERE mp.old_id = s.produit_id),
    (SELECT md.new_id FROM _map_dci md WHERE md.old_id = s.dci_id),
    p_target_tenant, now()
  FROM produits_dci s
  WHERE s.tenant_id = p_source_tenant;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('produits_dci', v_count);

  RETURN v_counts;
END;
$$;