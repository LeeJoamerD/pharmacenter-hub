

# Correction de "Produit inconnu" dans Par Reception

## Cause racine

La table `produits` contient **16 156 enregistrements**. La requete Supabase sur la ligne 136 de `useReceptionLabelPrinting.ts` ne retourne que les **1 000 premiers** (limite par defaut de PostgREST). Les produits au-dela de cette limite ne sont pas trouves dans le `produitMap`, d'ou l'affichage "Produit inconnu".

## Solution

Au lieu de charger les 16 000+ produits pour ensuite faire un lookup local, on ne chargera que les produits dont on a besoin : ceux references par les lots de la reception selectionnee.

### Strategie : Charger les lots d'abord, puis les produits concernes

1. Charger les lots de la reception en premier
2. Extraire les `produit_id` uniques depuis les lots
3. Charger uniquement ces produits via un filtre `.in('id', produitIds)`

Cela elimine le probleme de pagination et ameliore aussi les performances.

## Fichier modifie

`src/components/hooks/useReceptionLabelPrinting.ts` - fonction `selectReception`

### Modifications detaillees

1. **Deplacer la requete lots avant les requetes produits** : Executer d'abord la requete sur la table `lots` pour obtenir les `produit_id` et `fournisseur_id` concernes
2. **Filtrer les requetes produits et fournisseurs** : Utiliser `.in('id', [...uniqueIds])` pour ne charger que les enregistrements necessaires
3. **Charger les DCI uniquement pour les produits concernes** : Filtrer aussi la requete DCI par les `dci_id` trouves

### Pseudo-code du changement

```
// AVANT (problematique) :
// 1. Charger TOUS les produits (limite a 1000)
// 2. Charger TOUS les fournisseurs
// 3. Charger les lots de la reception
// 4. Lookup dans la map -> echec pour les produits au-dela de 1000

// APRES (corrige) :
// 1. Charger les lots de la reception (petit nombre)
// 2. Extraire les produit_id et fournisseur_id uniques
// 3. Charger SEULEMENT ces produits via .in('id', ids)
// 4. Charger SEULEMENT ces fournisseurs via .in('id', ids)
// 5. Charger les DCI correspondants
// 6. Lookup dans la map -> toujours complet
```

Aucune migration SQL requise.

