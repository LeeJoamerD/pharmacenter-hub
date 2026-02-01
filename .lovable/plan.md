# Plan: Génération automatique de codes-barres pour les lots

## Statut: ✅ IMPLÉMENTÉ

### Phase A — Migration base de données ✅
1. ✅ Colonne `code_barre` ajoutée à `public.lots`
2. ✅ Index uniques et de recherche créés
3. ✅ Table `public.lot_barcode_sequences` créée
4. ✅ RLS configuré sur `lot_barcode_sequences`
5. ✅ RPC `generate_lot_barcode(p_tenant_id, p_fournisseur_id)` créée
6. ✅ PostgREST rechargé (NOTIFY pgrst)

### Phase B — Vérifications ✅
- Colonne `code_barre` confirmée dans `information_schema`
- Fonction `generate_lot_barcode(uuid, uuid)` confirmée dans `pg_proc`

### Prochaines étapes
- Tester une nouvelle réception sur Preview
- Publier vers Live une fois validé
