

# Correction : Mise a jour du statut de la vente apres retour valide

## Probleme confirme

La vente `POS-20260207-0062` a le statut `En cours` malgre **deux retours termines** (RET-20260208-0001 et RET-20260209-0001). La fonction `processReturnMutation` dans `useReturnsExchanges.ts` reintegre le stock et marque le retour comme "Termine", mais **ne met jamais a jour le statut de la vente originale**. La vente reste donc visible dans la session de caisse.

## Solution

Modifier `processReturnMutation` dans `src/hooks/useReturnsExchanges.ts` pour, apres le traitement du retour :

1. Mettre a jour le statut de la vente originale vers `Retournée` (ou `Validée` selon le contexte - retour partiel vs total)
2. Invalider le cache des transactions en attente pour que l'affichage en caisse se mette a jour

### Logique de decision du statut

- **Retour total** (toutes les lignes de la vente sont retournees) : statut de la vente passe a `Retournée`
- **Retour partiel** : le statut reste `En cours` (la vente doit toujours etre encaissee pour le montant restant)

Pour simplifier et couvrir le cas actuel, on comparera la somme des quantites retournees (tous retours confondus) avec les quantites de la vente originale.

## Fichier modifie

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useReturnsExchanges.ts` | Dans `processReturnMutation`, ajouter la mise a jour du statut de la vente originale apres traitement du retour + invalidation du cache `pending-transactions` et `ventes` |

## Detail technique

Dans la fonction `processReturnMutation` (ligne 375), apres la ligne qui marque le retour comme "Termine" (ligne 431-437), ajouter :

1. Recuperer les quantites de la vente originale depuis `lignes_ventes`
2. Recuperer les quantites totales retournees depuis `lignes_retours` (pour tous les retours "Termine" lies a cette vente)
3. Comparer : si tout est retourne, passer la vente en `Retournée`
4. Ajouter l'invalidation des query keys `pending-transactions` et `ventes` dans le `onSuccess`

```text
// Pseudo-code de la logique ajoutee :
// 1. Recuperer vente_origine_id depuis le retour
// 2. Charger lignes_ventes de la vente originale (quantites vendues)
// 3. Charger tous les retours "Termine" pour cette vente
// 4. Sommer les quantites retournees par produit
// 5. Si toutes les quantites sont couvertes -> statut = "Retournée"
// 6. Invalider caches "pending-transactions", "ventes"
```

Aucune migration SQL requise - le statut `Retournée` est deja un type valide dans la contrainte de la colonne `statut` de la table `ventes`.

