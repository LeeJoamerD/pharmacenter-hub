

# Sauvegarde des prix recalcules dans les tables Produits et Lots

## Probleme

Dans `LotDetailsDialog.tsx`, la fonction `handleSavePrixAchat` (ligne 127) ne sauvegarde que le champ `prix_achat_unitaire` dans la table `lots`. Les prix recalcules affiches dans le bloc "Prix de Vente Calcules" (HT, TVA, Centime Additionnel, TTC) ne sont jamais persistes. Apres le refetch, les anciennes valeurs de la base ecrasent l'affichage.

## Solution

Modifier `handleSavePrixAchat` pour sauvegarder tous les prix recalcules dans les deux tables :

### Table `lots` - colonnes a mettre a jour :
- `prix_achat_unitaire` (deja fait)
- `prix_vente_ht`
- `montant_tva`
- `montant_centime_additionnel`
- `taux_tva`
- `taux_centime_additionnel`
- `prix_vente_ttc`
- `prix_vente_suggere` (= prix_vente_ttc)

### Table `produits` - colonnes a mettre a jour :
- `prix_achat`
- `prix_vente_ht`
- `tva`
- `centime_additionnel`
- `taux_tva`
- `taux_centime_additionnel`
- `prix_vente_ttc`

## Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/components/dashboard/modules/stock/LotDetailsDialog.tsx` | Enrichir `handleSavePrixAchat` pour persister les prix calcules dans `lots` et `produits` via des appels Supabase directs |

## Detail technique

La fonction `handleSavePrixAchat` sera modifiee pour :

1. Verifier que `calculatedPrices` est disponible (sinon le recalculer a la volee)
2. Mettre a jour la table `lots` avec tous les champs prix en un seul appel
3. Mettre a jour la table `produits` (via `lot.produit_id`) avec les champs correspondants
4. Invalider les caches React Query pour `lots` et `produits` apres succes
5. Afficher un toast de confirmation

L'import de `supabase` et `useQueryClient` seront ajoutes si necessaire. Les appels se feront directement via `supabase.from()` au lieu de passer par le hook `updateLot` qui ne supporte pas tous les champs.

