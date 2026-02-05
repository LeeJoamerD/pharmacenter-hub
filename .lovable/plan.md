
# Correction des erreurs 400 - Module Rapports Stock

## Diagnostic

Les erreurs 400 Bad Request sont causées par des tentatives de jointure FK invalides sur la **vue** `produits_with_stock`.

### Requêtes problématiques :
```sql
produits_with_stock?select=...famille_produit!fk_produits_famille_id(libelle_famille),rayon!fk_produits_rayon_id(libelle_rayon)
```

### Cause racine :
- `produits_with_stock` est une **VIEW** PostgreSQL, pas une table
- PostgREST ne peut pas suivre les relations FK sur les vues (pas de métadonnées FK)
- La syntaxe `table!fk_constraint(column)` ne fonctionne que sur les tables avec des contraintes FK réelles

## Solution

Utiliser la vue `v_produits_with_famille` qui inclut déjà les libellés des familles et rayons :

| Vue | Colonnes disponibles |
|-----|---------------------|
| `produits_with_stock` | `famille_id`, `rayon_id` (IDs seulement) |
| `v_produits_with_famille` | `famille_id`, `rayon_id`, `libelle_famille`, `libelle_rayon` ✅ |

---

## Modifications à implémenter

### Fichier : `src/hooks/useStockReports.ts`

#### Modification 1 - Query stockLevels (lignes 129-143)

**Avant :**
```typescript
const { data: produits, error: produitsError } = await supabase
  .from('produits_with_stock')
  .select(`
    id,
    stock_actuel,
    stock_critique,
    stock_faible,
    stock_limite,
    prix_achat,
    famille_produit!fk_produits_famille_id(libelle_famille),
    rayon!fk_produits_rayon_id(libelle_rayon)
  `)
```

**Après :**
```typescript
const { data: produits, error: produitsError } = await supabase
  .from('v_produits_with_famille')
  .select(`
    id,
    stock_actuel,
    stock_critique,
    stock_faible,
    stock_limite,
    prix_achat,
    libelle_famille,
    libelle_rayon
  `)
```

#### Modification 2 - Query criticalStock (lignes 220-235)

**Avant :**
```typescript
const { data: produits, error } = await supabase
  .from('produits_with_stock')
  .select(`
    id,
    libelle_produit,
    stock_actuel,
    stock_critique,
    stock_faible,
    stock_limite,
    famille_produit!fk_produits_famille_id(libelle_famille),
    rayon!fk_produits_rayon_id(libelle_rayon)
  `)
```

**Après :**
```typescript
const { data: produits, error } = await supabase
  .from('v_produits_with_famille')
  .select(`
    id,
    libelle_produit,
    stock_actuel,
    stock_critique,
    stock_faible,
    stock_limite,
    libelle_famille,
    libelle_rayon
  `)
```

#### Modification 3 - Mise à jour du traitement famille (lignes 150-151 et 258-259)

**Avant :**
```typescript
const famille = p.famille_produit?.libelle_famille || p.rayon?.libelle_rayon || 'Non catégorisé';
```

**Après :**
```typescript
const famille = p.libelle_famille || p.libelle_rayon || 'Non catégorisé';
```

---

## Résumé des corrections

| Ligne | Avant | Après |
|-------|-------|-------|
| 130 | `produits_with_stock` | `v_produits_with_famille` |
| 138-139 | `famille_produit!fk...(libelle_famille), rayon!fk...(libelle_rayon)` | `libelle_famille, libelle_rayon` |
| 151 | `p.famille_produit?.libelle_famille` | `p.libelle_famille` |
| 221 | `produits_with_stock` | `v_produits_with_famille` |
| 229-230 | `famille_produit!fk...(libelle_famille), rayon!fk...(libelle_rayon)` | `libelle_famille, libelle_rayon` |
| 259 | `p.famille_produit?.libelle_famille` | `p.libelle_famille` |

---

## Fichier impacté

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useStockReports.ts` | Utiliser `v_produits_with_famille` au lieu de `produits_with_stock` avec jointures FK invalides |

---

## Validation

Après les corrections :
1. Le dashboard "Rapports Stock" se chargera sans erreur 400
2. Les niveaux de stock par catégorie s'afficheront correctement
3. Les produits en alerte critique afficheront leurs familles/rayons
