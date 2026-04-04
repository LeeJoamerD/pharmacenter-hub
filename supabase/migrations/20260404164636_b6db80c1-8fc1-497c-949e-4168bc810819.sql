CREATE OR REPLACE FUNCTION public.clone_tenant_referential(p_source_tenant UUID, p_target_tenant UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count_formes INT := 0;
  v_count_familles INT := 0;
  v_count_rayons INT := 0;
  v_count_categories INT := 0;
  v_count_dci INT := 0;
  v_count_classes INT := 0;
  v_count_labos INT := 0;
  v_count_produits INT := 0;
  v_count_produits_dci INT := 0;
BEGIN
  SET LOCAL row_security = off;

  CREATE TEMP TABLE _map_formes (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_familles (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_rayons (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_categories (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_dci (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_classes (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_labos (old_id UUID, new_id UUID) ON COMMIT DROP;
  CREATE TEMP TABLE _map_produits (old_id UUID, new_id UUID) ON COMMIT DROP;

  -- 1. Formes galéniques
  WITH ins AS (
    INSERT INTO formes_galeniques (tenant_id, libelle_forme, description)
    SELECT p_target_tenant, libelle_forme, description
    FROM formes_galeniques WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_formes FROM ins;

  INSERT INTO _map_formes (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM formes_galeniques t WHERE t.libelle_forme = s.libelle_forme AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM formes_galeniques s
  WHERE s.tenant_id = p_source_tenant;

  -- 2. Familles
  WITH ins AS (
    INSERT INTO famille_produit (tenant_id, libelle_famille, description)
    SELECT p_target_tenant, libelle_famille, description
    FROM famille_produit WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_familles FROM ins;

  INSERT INTO _map_familles (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM famille_produit t WHERE t.libelle_famille = s.libelle_famille AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM famille_produit s
  WHERE s.tenant_id = p_source_tenant;

  -- 3. Rayons
  WITH ins AS (
    INSERT INTO rayons_produits (tenant_id, libelle_rayon, description)
    SELECT p_target_tenant, libelle_rayon, description
    FROM rayons_produits WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_rayons FROM ins;

  INSERT INTO _map_rayons (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM rayons_produits t WHERE t.libelle_rayon = s.libelle_rayon AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM rayons_produits s
  WHERE s.tenant_id = p_source_tenant;

  -- 4. Catégories de tarification
  WITH ins AS (
    INSERT INTO categorie_tarification (tenant_id, libelle_categorie, description)
    SELECT p_target_tenant, libelle_categorie, description
    FROM categorie_tarification WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_categories FROM ins;

  INSERT INTO _map_categories (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM categorie_tarification t WHERE t.libelle_categorie = s.libelle_categorie AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM categorie_tarification s
  WHERE s.tenant_id = p_source_tenant;

  -- 5. DCI
  WITH ins AS (
    INSERT INTO dci (tenant_id, nom_dci, description)
    SELECT p_target_tenant, nom_dci, description
    FROM dci WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_dci FROM ins;

  INSERT INTO _map_dci (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM dci t WHERE t.nom_dci = s.nom_dci AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM dci s
  WHERE s.tenant_id = p_source_tenant;

  -- 6. Classes thérapeutiques
  WITH ins AS (
    INSERT INTO classes_therapeutiques (tenant_id, libelle_classe, systeme_anatomique, description)
    SELECT p_target_tenant, libelle_classe, systeme_anatomique, description
    FROM classes_therapeutiques WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_classes FROM ins;

  INSERT INTO _map_classes (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM classes_therapeutiques t WHERE t.libelle_classe = s.libelle_classe AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM classes_therapeutiques s
  WHERE s.tenant_id = p_source_tenant;

  -- 7. Laboratoires
  WITH ins AS (
    INSERT INTO laboratoires (tenant_id, libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local)
    SELECT p_target_tenant, libelle, pays_siege, email_siege, email_delegation_local, telephone_appel_delegation_local, telephone_whatsapp_delegation_local
    FROM laboratoires WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_labos FROM ins;

  INSERT INTO _map_labos (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM laboratoires t WHERE t.libelle = s.libelle AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM laboratoires s
  WHERE s.tenant_id = p_source_tenant;

  -- 8. Produits (avec ON CONFLICT pour résilience)
  WITH ins AS (
    INSERT INTO produits (
      tenant_id, libelle_produit, code_cip,
      prix_achat, prix_vente_ht, prix_vente_ttc, tva, centime_additionnel,
      stock_limite, stock_faible, niveau_detail, is_active,
      famille_id, rayon_id, forme_id, dci_id, classe_therapeutique_id,
      categorie_tarification_id, laboratoires_id, rayon_produit_id,
      taux_tva, taux_centime_additionnel, prescription_requise,
      code_barre_externe, scanner_config, stock_critique,
      conditions_conservation, ancien_code_cip,
      is_stupefiant, is_controlled_substance,
      quantite_unites_details_source
    )
    SELECT
      p_target_tenant, s.libelle_produit, s.code_cip,
      s.prix_achat, s.prix_vente_ht, s.prix_vente_ttc, s.tva, s.centime_additionnel,
      s.stock_limite, s.stock_faible, s.niveau_detail, s.is_active,
      mf.new_id,
      mr.new_id,
      mfo.new_id,
      md.new_id,
      mcl.new_id,
      mc.new_id,
      ml.new_id,
      mr2.new_id,
      s.taux_tva, s.taux_centime_additionnel, s.prescription_requise,
      s.code_barre_externe, s.scanner_config, s.stock_critique,
      s.conditions_conservation, s.ancien_code_cip,
      s.is_stupefiant, s.is_controlled_substance,
      s.quantite_unites_details_source
    FROM produits s
    LEFT JOIN _map_familles mf ON mf.old_id = s.famille_id
    LEFT JOIN _map_rayons mr ON mr.old_id = s.rayon_id
    LEFT JOIN _map_formes mfo ON mfo.old_id = s.forme_id
    LEFT JOIN _map_dci md ON md.old_id = s.dci_id
    LEFT JOIN _map_classes mcl ON mcl.old_id = s.classe_therapeutique_id
    LEFT JOIN _map_categories mc ON mc.old_id = s.categorie_tarification_id
    LEFT JOIN _map_labos ml ON ml.old_id = s.laboratoires_id
    LEFT JOIN _map_rayons mr2 ON mr2.old_id = s.rayon_produit_id
    WHERE s.tenant_id = p_source_tenant
    ON CONFLICT (tenant_id, code_cip) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_produits FROM ins;

  -- Build product mapping (by code_cip, then by libelle for products without code_cip)
  INSERT INTO _map_produits (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM produits t WHERE t.code_cip = s.code_cip AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM produits s
  WHERE s.tenant_id = p_source_tenant
    AND s.code_cip IS NOT NULL;

  INSERT INTO _map_produits (old_id, new_id)
  SELECT s.id, (SELECT t.id FROM produits t WHERE t.libelle_produit = s.libelle_produit AND t.tenant_id = p_target_tenant LIMIT 1)
  FROM produits s
  WHERE s.tenant_id = p_source_tenant
    AND s.code_cip IS NULL
    AND NOT EXISTS (SELECT 1 FROM _map_produits mp WHERE mp.old_id = s.id);

  -- Remap id_produit_source for detail products
  UPDATE produits t
  SET id_produit_source = mp.new_id
  FROM produits s
  JOIN _map_produits mp ON mp.old_id = s.id_produit_source
  JOIN _map_produits mp_self ON mp_self.old_id = s.id
  WHERE s.tenant_id = p_source_tenant
    AND s.id_produit_source IS NOT NULL
    AND t.id = mp_self.new_id;

  -- 9. Produits-DCI (table de liaison)
  WITH ins AS (
    INSERT INTO produits_dci (tenant_id, produit_id, dci_id, is_principal)
    SELECT p_target_tenant, mp.new_id, md.new_id, s.is_principal
    FROM produits_dci s
    JOIN _map_produits mp ON mp.old_id = s.produit_id
    JOIN _map_dci md ON md.old_id = s.dci_id
    WHERE s.tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_produits_dci FROM ins;

  RETURN jsonb_build_object(
    'formes', v_count_formes,
    'familles', v_count_familles,
    'rayons', v_count_rayons,
    'categories', v_count_categories,
    'dci', v_count_dci,
    'classes', v_count_classes,
    'laboratoires', v_count_labos,
    'produits', v_count_produits,
    'produits_dci', v_count_produits_dci
  );
END;
$$;