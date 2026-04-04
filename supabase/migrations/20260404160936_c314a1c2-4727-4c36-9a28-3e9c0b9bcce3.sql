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

  IF EXISTS (SELECT 1 FROM produits WHERE tenant_id = p_target_tenant LIMIT 1) THEN
    RAISE EXCEPTION 'Le tenant cible a déjà des produits. Clonage annulé.';
  END IF;

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
  SELECT s.id, t.id
  FROM formes_galeniques s
  JOIN formes_galeniques t ON t.libelle_forme = s.libelle_forme AND t.tenant_id = p_target_tenant
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
  SELECT s.id, t.id
  FROM famille_produit s
  JOIN famille_produit t ON t.libelle_famille = s.libelle_famille AND t.tenant_id = p_target_tenant
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
  SELECT s.id, t.id
  FROM rayons_produits s
  JOIN rayons_produits t ON t.libelle_rayon = s.libelle_rayon AND t.tenant_id = p_target_tenant
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
  SELECT s.id, t.id
  FROM categorie_tarification s
  JOIN categorie_tarification t ON t.libelle_categorie = s.libelle_categorie AND t.tenant_id = p_target_tenant
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
  SELECT s.id, t.id
  FROM dci s
  JOIN dci t ON t.nom_dci = s.nom_dci AND t.tenant_id = p_target_tenant
  WHERE s.tenant_id = p_source_tenant;

  -- 6. Classes thérapeutiques (FIX: inclure systeme_anatomique)
  WITH ins AS (
    INSERT INTO classes_therapeutiques (tenant_id, libelle_classe, systeme_anatomique, description)
    SELECT p_target_tenant, libelle_classe, systeme_anatomique, description
    FROM classes_therapeutiques WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_classes FROM ins;

  INSERT INTO _map_classes (old_id, new_id)
  SELECT s.id, t.id
  FROM classes_therapeutiques s
  JOIN classes_therapeutiques t ON t.libelle_classe = s.libelle_classe AND t.tenant_id = p_target_tenant
  WHERE s.tenant_id = p_source_tenant;

  -- 7. Laboratoires
  WITH ins AS (
    INSERT INTO laboratoires (tenant_id, nom_laboratoire, pays, contact_info)
    SELECT p_target_tenant, nom_laboratoire, pays, contact_info
    FROM laboratoires WHERE tenant_id = p_source_tenant
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_count_labos FROM ins;

  INSERT INTO _map_labos (old_id, new_id)
  SELECT s.id, t.id
  FROM laboratoires s
  JOIN laboratoires t ON t.nom_laboratoire = s.nom_laboratoire AND t.tenant_id = p_target_tenant
  WHERE s.tenant_id = p_source_tenant;

  -- 8. Produits (avec remappage FK + id_produit_source)
  WITH ins AS (
    INSERT INTO produits (
      tenant_id, libelle_produit, description, code_produit, code_barre, code_cip,
      prix_achat, prix_vente, stock_limite, stock_actuel, unite_mesure,
      laboratoire, forme_pharmaceutique, dosage, is_active,
      famille_id, rayon_id, dci_id, categorie_tarification_id,
      taux_tva, quantite_stock, niveau_detail, quantite_unites_details_source
    )
    SELECT
      p_target_tenant, s.libelle_produit, s.description, s.code_produit, s.code_barre, s.code_cip,
      s.prix_achat, s.prix_vente, s.stock_limite, 0, s.unite_mesure,
      s.laboratoire, s.forme_pharmaceutique, s.dosage, s.is_active,
      mf.new_id, mr.new_id, md.new_id, mc.new_id,
      s.taux_tva, 0, s.niveau_detail, s.quantite_unites_details_source
    FROM produits s
    LEFT JOIN _map_familles mf ON mf.old_id = s.famille_id
    LEFT JOIN _map_rayons mr ON mr.old_id = s.rayon_id
    LEFT JOIN _map_dci md ON md.old_id = s.dci_id
    LEFT JOIN _map_categories mc ON mc.old_id = s.categorie_tarification_id
    WHERE s.tenant_id = p_source_tenant
    RETURNING id
  )
  SELECT count(*) INTO v_count_produits FROM ins;

  INSERT INTO _map_produits (old_id, new_id)
  SELECT s.id, t.id
  FROM produits s
  JOIN produits t ON t.code_cip = s.code_cip AND t.tenant_id = p_target_tenant
  WHERE s.tenant_id = p_source_tenant
    AND s.code_cip IS NOT NULL;

  INSERT INTO _map_produits (old_id, new_id)
  SELECT s.id, t.id
  FROM produits s
  JOIN produits t ON t.libelle_produit = s.libelle_produit AND t.tenant_id = p_target_tenant
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