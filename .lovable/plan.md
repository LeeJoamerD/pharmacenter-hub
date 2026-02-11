

# Investigation et Correction: Mouvements de Stock Manquants dans le POS

## Diagnostic

L'investigation du code source revele **3 problemes distincts** qui expliquent pourquoi certaines ventes n'ont pas de mouvement enregistre dans `mouvements_lots`:

### Probleme 1: Vente POS sans reference de vente (usePOSData.ts, ligne 338)

```text
updateStockAfterSale(item.product.id, item.quantity, tenantId)
                     ^-- PAS de vente.id passe!
```

La fonction `updateStockAfterSale` accepte un parametre optionnel `referenceId`, mais le POS ne le transmet jamais. Resultat: les mouvements dans `mouvements_lots` ont `reference_id: null`, rendant impossible le lien avec la vente d'origine.

### Probleme 2: Double insertion dans stock_mouvements (usePOSData.ts, lignes 336-368)

Le flux actuel cree des doublons:
1. `updateStockAfterSale` appelle `rpc_stock_record_movement` qui insere dans `mouvements_lots` ET `stock_mouvements`
2. Puis le code (etape 9, lignes 342-368) insere **a nouveau** dans `stock_mouvements`

Chaque vente POS cree donc **2 enregistrements** dans `stock_mouvements` pour le meme mouvement.

### Probleme 3: Mises a jour directes sans mouvement (2 fichiers)

Deux composants mettent a jour `lots.quantite_restante` directement apres avoir deja appele la RPC (qui le fait deja), causant des doubles mises a jour:

- **BulkActionsModal.tsx** (ligne 96-99): `.update({ quantite_restante })` apres appel RPC
- **InventoryIntegration.tsx** (ligne 320-326): `.update({ quantite_restante })` apres appel RPC

---

## Plan de correction

### 1. Corriger usePOSData.ts - Passer le vente.id et supprimer le doublon

- Ligne 338: Passer `vente.id` comme `referenceId` a `updateStockAfterSale`
- Lignes 342-368: Supprimer entierement l'etape 9 (insertion dupliquee dans `stock_mouvements`) car la RPC le fait deja

### 2. Corriger BulkActionsModal.tsx - Supprimer la double mise a jour

- Supprimer les lignes 96-99 qui font `.update({ quantite_restante })` car la RPC `rpc_stock_record_movement` met deja a jour `lots.quantite_restante`

### 3. Corriger InventoryIntegration.tsx - Supprimer la double mise a jour

- Supprimer les lignes 320-326 qui font `.update({ quantite_restante })` car la RPC met deja a jour le lot

### 4. Ajouter un outil de detection d'incoherences

Creer un nouveau composant `StockConsistencyChecker.tsx` accessible depuis l'onglet Audit du module Stock/Mouvements qui:

- Compare `quantite_apres` d'un mouvement avec `quantite_avant` du suivant (ordonne chronologiquement par lot)
- Signale les gaps (ex: mouvement N se termine a 9, mouvement N+1 commence a 8 = gap de 1)
- Compare `quantite_restante` actuelle du lot avec le dernier `quantite_apres` connu
- Affiche un rapport avec les lots incohérents, la taille du gap, et les dates concernées
- Permet d'exporter le rapport

---

## Fichiers modifies

| Fichier | Action |
|---------|--------|
| `src/hooks/usePOSData.ts` | Passer `vente.id` a `updateStockAfterSale`, supprimer etape 9 (doublon stock_mouvements) |
| `src/components/dashboard/modules/stock/current/modals/BulkActionsModal.tsx` | Supprimer la mise a jour directe de `quantite_restante` (lignes 96-99) |
| `src/components/dashboard/modules/stock/integrations/InventoryIntegration.tsx` | Supprimer la mise a jour directe de `quantite_restante` (lignes 320-326) |
| `src/components/dashboard/modules/stock/StockConsistencyChecker.tsx` | Nouveau - outil de detection d'incoherences |
| `src/components/dashboard/modules/stock/StockAudit.tsx` | Integrer le bouton d'acces au verificateur de coherence |

