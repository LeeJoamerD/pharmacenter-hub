CREATE OR REPLACE FUNCTION public.clone_tenant_lots(
  p_source_tenant uuid,
  p_target_tenant uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL row_security = off;

  IF (SELECT count(*) FROM lots WHERE tenant_id = p_target_tenant) > 0 THEN
    RAISE EXCEPTION 'Le tenant cible a déjà des lots';
  END IF;

  CREATE TEMP TABLE _map_produits_lots ON COMMIT DROP AS
    SELECT s.id as old_id, t.id as new_id
    FROM produits s
    JOIN produits t ON t.code_cip = s.code_cip AND t.tenant_id = p_target_tenant
    WHERE s.tenant_id = p_source_tenant;

  CREATE TEMP TABLE _map_fournisseurs_lots ON COMMIT DROP AS
    SELECT s.id as old_id, t.id as new_id
    FROM fournisseurs s
    JOIN fournisseurs t ON t.nom = s.nom AND t.tenant_id = p_target_tenant
    WHERE s.tenant_id = p_source_tenant;

  INSERT INTO lots (
    id, tenant_id, produit_id, numero_lot, fournisseur_id,
    date_fabrication, date_reception, date_peremption,
    quantite_initiale, quantite_restante,
    prix_achat_unitaire, prix_vente_suggere,
    statut, emplacement, notes
  )
  SELECT
    gen_random_uuid(), p_target_tenant,
    mp.new_id,
    s.numero_lot,
    mf.new_id,
    s.date_fabrication, s.date_reception, s.date_peremption,
    s.quantite_initiale, s.quantite_restante,
    s.prix_achat_unitaire, s.prix_vente_suggere,
    s.statut, s.emplacement, s.notes
  FROM lots s
  JOIN _map_produits_lots mp ON mp.old_id = s.produit_id
  LEFT JOIN _map_fournisseurs_lots mf ON mf.old_id = s.fournisseur_id
  WHERE s.tenant_id = p_source_tenant;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('lots_clones', v_count);
END;
$$;