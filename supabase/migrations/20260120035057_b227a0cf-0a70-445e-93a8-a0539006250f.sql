-- Nettoyage des données de migration pour le tenant Pharmacie MAZAYU
-- tenant_id: aa8717d1-d450-48dd-a484-66402e435797

DO $$
DECLARE
  v_tenant_id UUID := 'aa8717d1-d450-48dd-a484-66402e435797';
  v_mouvements_deleted INT;
  v_lots_deleted INT;
  v_lignes_deleted INT;
  v_receptions_deleted INT;
  v_commandes_deleted INT;
BEGIN
  -- 1. Supprimer les mouvements de lots
  DELETE FROM mouvements_lots WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_mouvements_deleted = ROW_COUNT;
  RAISE NOTICE 'Mouvements supprimés: %', v_mouvements_deleted;
  
  -- 2. Supprimer tous les lots
  DELETE FROM lots WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_lots_deleted = ROW_COUNT;
  RAISE NOTICE 'Lots supprimés: %', v_lots_deleted;
  
  -- 3. Supprimer les lignes de réception
  DELETE FROM lignes_reception_fournisseur 
  WHERE reception_id IN (
    SELECT id FROM receptions_fournisseurs WHERE tenant_id = v_tenant_id
  );
  GET DIAGNOSTICS v_lignes_deleted = ROW_COUNT;
  RAISE NOTICE 'Lignes de réception supprimées: %', v_lignes_deleted;
  
  -- 4. Supprimer les réceptions
  DELETE FROM receptions_fournisseurs WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_receptions_deleted = ROW_COUNT;
  RAISE NOTICE 'Réceptions supprimées: %', v_receptions_deleted;
  
  -- 5. Supprimer les commandes
  DELETE FROM commandes_fournisseurs WHERE tenant_id = v_tenant_id;
  GET DIAGNOSTICS v_commandes_deleted = ROW_COUNT;
  RAISE NOTICE 'Commandes supprimées: %', v_commandes_deleted;
  
  RAISE NOTICE '=== NETTOYAGE TERMINÉ ===';
  RAISE NOTICE 'Résumé: % mouvements, % lots, % lignes, % réceptions, % commandes supprimés',
    v_mouvements_deleted, v_lots_deleted, v_lignes_deleted, v_receptions_deleted, v_commandes_deleted;
END $$;