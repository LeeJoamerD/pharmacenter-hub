

# Correction : Lots non affichés dans le formulaire d'ajustement de stock

## Probleme

Le formulaire "Creer un Ajustement de Stock" utilise `useLotsQuery()` de `useLots.ts` qui execute une requete complexe avec des jointures imbriquees :

```text
SELECT *, 
  produit:produits!inner(..., produit_detail:produits!id_produit_source(...)),
  fournisseur:fournisseurs(...)
FROM lots
WHERE tenant_id = '...'
```

Avec 1860 lots dans le tenant "Pharmacie MAZAYU", cette requete avec jointure `!inner` et auto-reference imbriquee (`produits!id_produit_source`) echoue silencieusement ou retourne des resultats vides. En consequence, `lotsData` est null/vide et `availableLots` ne trouve aucun lot a afficher.

Le lot existe bien en base : `27012602-D` avec `quantite_restante = 1` pour le produit "DICLO DENK 100MG RETARD CPR B/100 (D)".

## Correction

### Fichier : `src/components/dashboard/modules/stock/StockAdjustments.tsx`

Remplacer l'utilisation de `useLotsQuery()` (qui charge les 1860 lots avec jointures lourdes) par une requete directe simple filtree par le produit selectionne.

**Changements :**

1. Supprimer l'import de `useLots` et ajouter l'import de `useTenant` et `useQuery` de tanstack
2. Supprimer la ligne `const { useLotsQuery } = useLots()` et `const { data: lotsData } = useLotsQuery()`
3. Ajouter une requete directe qui se declenche uniquement quand un produit est selectionne :

```text
Nouvelle requete :
  SELECT id, produit_id, numero_lot, quantite_restante
  FROM lots
  WHERE tenant_id = {tenantId}
  AND produit_id = {formData.produit_id}
  ORDER BY date_peremption ASC
```

4. Mettre a jour `availableLots` pour utiliser les donnees de cette nouvelle requete (plus besoin de filtrer cote client)

**Avantage** : Au lieu de charger 1860 lots avec des jointures complexes, on charge uniquement les lots du produit selectionne avec une requete minimale. Resultat immediat et fiable.

| Fichier | Modification |
|---------|-------------|
| `src/components/dashboard/modules/stock/StockAdjustments.tsx` | Remplacer `useLotsQuery()` par une requete directe filtree par produit selectionne |

