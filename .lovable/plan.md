

# Correction : Enregistrement des sorties de vente dans mouvements_lots

## Probleme identifie

Le systeme utilise **deux tables de mouvements differentes** :
- `stock_mouvements` : ou le POS ecrit les sorties de vente (etape 9 de `usePOSData.ts`)
- `mouvements_lots` : ou le dialogue "Details du Lot" et le journal des mouvements lisent les donnees

Lors d'une vente, `updateStockAfterSale()` met bien a jour `quantite_restante` dans `lots`, et un mouvement est insere dans `stock_mouvements`. Mais **aucun mouvement n'est cree dans `mouvements_lots`**, donc l'historique du lot reste vide pour les sorties.

Les 3 ventes (POS-20260208-0058, 0082, 0100) ont bien deduit le stock de 3 a 0, mais seule la table `stock_mouvements` en a la trace.

## Solution

Modifier `src/utils/stockUpdater.ts` pour qu'apres chaque deduction de lot, un mouvement de type `sortie` soit enregistre dans `mouvements_lots` via l'appel RPC `rpc_stock_record_movement`. Cette RPC est deja utilisee partout ailleurs (retours, ajustements, transferts, receptions) et garantit la coherence des donnees (quantite_avant, quantite_apres).

## Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/utils/stockUpdater.ts` | Remplacer la mise a jour directe de `quantite_restante` par un appel a `rpc_stock_record_movement` pour chaque lot utilise |

## Detail technique

Dans `updateStockAfterSale`, au lieu de :
```text
// Etape 3 actuelle : mise a jour directe
await supabase.from('lots').update({ quantite_restante: new_quantity }).eq('id', lot.id)
```

On utilisera :
```text
// Nouvelle etape 3 : utiliser la RPC atomique
await supabase.rpc('rpc_stock_record_movement', {
  p_lot_id: lot.id,
  p_produit_id: productId,
  p_type_mouvement: 'sortie',
  p_quantite_mouvement: qtyToDeduct,
  p_motif: 'Vente POS',
  p_reference_type: 'vente',
  p_reference_id: null  // sera enrichi par usePOSData si disponible
})
```

La RPC `rpc_stock_record_movement` gere automatiquement :
- La mise a jour de `quantite_restante` dans `lots`
- L'enregistrement du mouvement dans `mouvements_lots` avec `quantite_avant` et `quantite_apres`
- La coherence transactionnelle

Pour permettre de passer la reference de la vente, on ajoutera un parametre optionnel `referenceId` et `motif` a la fonction `updateStockAfterSale`.

L'insertion dans `stock_mouvements` (etape 9 de `usePOSData.ts`) sera conservee pour compatibilite, mais pourra etre supprimee ulterieurement.

