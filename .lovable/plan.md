
# Plan de correction - Ignorer les dates de péremption NULL

## Problème identifié

Actuellement, les produits avec `date_peremption` NULL ou vide sont traités comme expirés à cause de la logique SQL qui vérifie `l.date_peremption > CURRENT_DATE`. Quand la valeur est NULL, cette comparaison retourne NULL (pas TRUE), donc le lot est considéré invalide.

## Solution en 2 parties

### Partie 1 : Correction des fonctions RPC SQL

Modifier les fonctions `get_pos_products` et `search_product_by_barcode` pour traiter les dates NULL comme valides.

**Logique actuelle :**
```sql
AND l.date_peremption > CURRENT_DATE
```

**Nouvelle logique :**
```sql
AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
```

Cette modification s'applique à 2 sous-requêtes dans chaque fonction :
- `has_valid_stock` : EXISTS avec condition date
- `all_lots_expired` : NOT EXISTS avec condition date

---

### Partie 2 : Correction des composants frontend

Modifier les fonctions helper `isExpired` et `isExpiringSoon` dans 3 fichiers pour retourner `false` quand la date est NULL.

**Fichiers concernés :**

| Fichier | Modification |
|---------|--------------|
| `src/components/dashboard/modules/sales/pos/ShoppingCartComponent.tsx` | Déjà correct (vérifie `!datePeremption`) |
| `src/components/dashboard/modules/sales/pos/LotSelectorModal.tsx` | Ajouter vérification NULL |
| `src/hooks/usePOSProductsPaginated.ts` | Gérer date NULL dans le mapping |

---

## Détail technique

### Migration SQL

Créer une migration pour recréer les 2 fonctions avec la nouvelle logique :

```sql
-- get_pos_products : modifier has_valid_stock (ligne 93-99)
EXISTS(
  SELECT 1 FROM lots l
  WHERE l.produit_id = p.id 
    AND l.tenant_id = p_tenant_id
    AND l.quantite_restante > 0
    AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
) AS has_valid_stock

-- get_pos_products : modifier all_lots_expired (ligne 109-115)
NOT EXISTS(
  SELECT 1 FROM lots l
  WHERE l.produit_id = p.id 
    AND l.tenant_id = p_tenant_id
    AND l.quantite_restante > 0
    AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
)
```

Même modification pour `search_product_by_barcode`.

### LotSelectorModal.tsx

```typescript
// Avant
const isExpiringSoon = (datePeremption: Date | string): boolean => {
  const expirationDate = new Date(datePeremption);
  ...
};

const isExpired = (datePeremption: Date | string): boolean => {
  return isBefore(new Date(datePeremption), new Date());
};

// Après
const isExpiringSoon = (datePeremption: Date | string | null | undefined): boolean => {
  if (!datePeremption) return false; // NULL = pas d'alerte
  const expirationDate = new Date(datePeremption);
  if (isNaN(expirationDate.getTime())) return false; // Date invalide = pas d'alerte
  ...
};

const isExpired = (datePeremption: Date | string | null | undefined): boolean => {
  if (!datePeremption) return false; // NULL = pas expiré
  const expirationDate = new Date(datePeremption);
  if (isNaN(expirationDate.getTime())) return false;
  return isBefore(expirationDate, new Date());
};
```

### usePOSProductsPaginated.ts

```typescript
// Ligne 116 - Gérer date NULL
date_peremption: lot.date_peremption ? new Date(lot.date_peremption) : null,
```

### Mise à jour du type LotInfo

```typescript
// src/types/pos.ts ligne 41
date_peremption: Date | null;  // Permettre null
```

---

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| Migration SQL | Recréer `get_pos_products` et `search_product_by_barcode` avec `IS NULL OR` |
| `src/components/dashboard/modules/sales/pos/LotSelectorModal.tsx` | Ajouter guards NULL dans les fonctions helper |
| `src/hooks/usePOSProductsPaginated.ts` | Gérer mapping date NULL |
| `src/types/pos.ts` | Type `date_peremption: Date \| null` |

## Résultat attendu

Après correction :
- Les produits avec `date_peremption` NULL ne seront plus marqués en rouge
- Ces produits pourront être ajoutés au panier sans blocage
- Aucun avertissement d'expiration ne s'affichera pour ces lots
- Le tri FIFO placera les lots sans date en dernier (grâce à `NULLS LAST` existant)
