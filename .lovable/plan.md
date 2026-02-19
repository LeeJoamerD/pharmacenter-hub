
# Corriger l'affichage de tous les produits au lieu de ceux de la commande selectionnee

## Cause racine

Un probleme de "race condition" entre deux effets React :

1. `useOrderLines('')` est appele initialement sans filtre, ce qui charge **toutes** les lignes de commande du tenant
2. Quand l'utilisateur selectionne une commande, le `selectedOrder` change
3. L'effet de mapping s'execute immediatement avec les anciennes donnees (toutes les lignes) AVANT que le hook ne relance la requete filtree
4. Le `mappedOrderRef` est verrouille, donc quand les donnees filtrees arrivent, elles sont ignorees

## Correction

### Fichier : `src/hooks/useOrderLines.ts`

Deux modifications :

**A) Ne pas fetcher si pas d'ID (ligne 31-44)** : Quand `orderId` est vide/absent, retourner un tableau vide au lieu de charger toutes les lignes. C'est la correction principale.

```text
Avant :
  if (orderId) {
    query = query.eq('commande_id', orderId);
  }

Apres :
  if (!orderId) {
    setOrderLines([]);
    setLoading(false);
    return;
  }
  query = query.eq('commande_id', orderId);
```

**B) Reinitialiser les lignes quand commandeId change (ligne 181-183)** : Vider `orderLines` immediatement avant le fetch pour eviter que des donnees perimees ne soient utilisees.

```text
Avant :
  useEffect(() => {
    fetchOrderLines(commandeId);
  }, [commandeId]);

Apres :
  useEffect(() => {
    setOrderLines([]);
    fetchOrderLines(commandeId);
  }, [commandeId]);
```

Ces deux corrections eliminent definitivement la race condition. Le mapping dans `ReceptionForm` ne s'executera que lorsque les lignes filtrees pour la commande selectionnee seront disponibles.
