

# Correction des erreurs 400 - Module Business Intelligence

## Diagnostic

Les erreurs 400 Bad Request sont causées par l'utilisation de **noms de colonnes incorrects** dans les requêtes sur la vue `produits_with_stock`.

### Requêtes problématiques identifiées :

| Requête | Colonnes utilisées (erreur) | Colonnes réelles |
|---------|----------------------------|------------------|
| executiveKPIsQuery | `statut`, `stock_total`, `seuil_stock_minimum` | `is_active`, `stock_actuel`, `stock_critique` |
| stockWidgetQuery | `statut`, `stock_total`, `seuil_stock_minimum` | `is_active`, `stock_actuel`, `stock_critique` |
| predictiveInsightsQuery | `statut`, `stock_total`, `seuil_stock_minimum` | `is_active`, `stock_actuel`, `stock_critique` |
| alertsQuery | `statut`, `stock_total` | `is_active`, `stock_actuel` |

### Structure réelle de `produits_with_stock` :

| Colonne réelle | Type | Colonne erronée utilisée |
|----------------|------|-------------------------|
| `is_active` | boolean | ~~`statut = 'Actif'`~~ |
| `stock_actuel` | integer | ~~`stock_total`~~ |
| `stock_critique` | integer | ~~`seuil_stock_minimum`~~ |

---

## Solution

Modifier `useBIDashboard.ts` pour utiliser les noms de colonnes corrects.

### Fichier : `src/hooks/useBIDashboard.ts`

#### Modification 1 - executiveKPIsQuery (lignes 111-121)

**Avant :**
```typescript
const { data: stockData } = await supabase
  .from('produits_with_stock' as any)
  .select('id, stock_total, seuil_stock_minimum')
  .eq('tenant_id', tenantId)
  .eq('statut', 'Actif');

const healthyStock = (stockData as any[])?.filter(p => 
  (p.stock_total || 0) > (p.seuil_stock_minimum || 10)
).length || 0;
```

**Après :**
```typescript
const { data: stockData } = await supabase
  .from('produits_with_stock')
  .select('id, stock_actuel, stock_critique')
  .eq('tenant_id', tenantId)
  .eq('is_active', true);

const healthyStock = (stockData as any[])?.filter(p => 
  (p.stock_actuel || 0) > (p.stock_critique || 10)
).length || 0;
```

#### Modification 2 - stockWidgetQuery (lignes 201-209)

**Avant :**
```typescript
const { data: produits } = await supabase
  .from('produits_with_stock' as any)
  .select('id, stock_total, seuil_stock_minimum')
  .eq('tenant_id', tenantId)
  .eq('statut', 'Actif');

const criticalCount = (produits as any[])?.filter(p => 
  (p.stock_total || 0) <= (p.seuil_stock_minimum || 10)
).length || 0;
```

**Après :**
```typescript
const { data: produits } = await supabase
  .from('produits_with_stock')
  .select('id, stock_actuel, stock_critique')
  .eq('tenant_id', tenantId)
  .eq('is_active', true);

const criticalCount = (produits as any[])?.filter(p => 
  (p.stock_actuel || 0) <= (p.stock_critique || 10)
).length || 0;
```

#### Modification 3 - predictiveInsightsQuery (lignes 297-306)

**Avant :**
```typescript
const { data: lowStock } = await supabase
  .from('produits_with_stock' as any)
  .select('libelle_produit, stock_total, seuil_stock_minimum')
  .eq('tenant_id', tenantId)
  .eq('statut', 'Actif')
  .order('stock_total', { ascending: true })
  .limit(5);

(lowStock as any[])?.forEach(product => {
  if ((product.stock_total || 0) <= (product.seuil_stock_minimum || 10)) {
```

**Après :**
```typescript
const { data: lowStock } = await supabase
  .from('produits_with_stock')
  .select('libelle_produit, stock_actuel, stock_critique')
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .order('stock_actuel', { ascending: true })
  .limit(5);

(lowStock as any[])?.forEach(product => {
  if ((product.stock_actuel || 0) <= (product.stock_critique || 10)) {
```

#### Modification 4 - alertsQuery (lignes 351-356)

**Avant :**
```typescript
const { count: criticalStock } = await supabase
  .from('produits_with_stock' as any)
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .eq('statut', 'Actif')
  .lte('stock_total', 10);
```

**Après :**
```typescript
const { count: criticalStock } = await supabase
  .from('produits_with_stock')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .lte('stock_actuel', 10);
```

---

## Résumé des corrections

| Ligne | Avant | Après |
|-------|-------|-------|
| 113 | `stock_total, seuil_stock_minimum` | `stock_actuel, stock_critique` |
| 115 | `.eq('statut', 'Actif')` | `.eq('is_active', true)` |
| 119 | `p.stock_total`, `p.seuil_stock_minimum` | `p.stock_actuel`, `p.stock_critique` |
| 203 | `stock_total, seuil_stock_minimum` | `stock_actuel, stock_critique` |
| 205 | `.eq('statut', 'Actif')` | `.eq('is_active', true)` |
| 208 | `p.stock_total`, `p.seuil_stock_minimum` | `p.stock_actuel`, `p.stock_critique` |
| 299 | `stock_total, seuil_stock_minimum` | `stock_actuel, stock_critique` |
| 301 | `.eq('statut', 'Actif')` | `.eq('is_active', true)` |
| 302 | `.order('stock_total', ...)` | `.order('stock_actuel', ...)` |
| 306 | `product.stock_total`, `product.seuil_stock_minimum` | `product.stock_actuel`, `product.stock_critique` |
| 355 | `.eq('statut', 'Actif')` | `.eq('is_active', true)` |
| 356 | `.lte('stock_total', 10)` | `.lte('stock_actuel', 10)` |

---

## Nettoyage additionnel

Supprimer les casts `as any` maintenant que les noms de colonnes sont corrects :

```typescript
// Avant
.from('produits_with_stock' as any)

// Après  
.from('produits_with_stock')
```

---

## Fichier impacté

| Fichier | Type de modification |
|---------|---------------------|
| `src/hooks/useBIDashboard.ts` | Correction des noms de colonnes (statut→is_active, stock_total→stock_actuel, seuil_stock_minimum→stock_critique) |

---

## Validation attendue

Après les corrections :
1. Le dashboard Business Intelligence se chargera sans erreur 400
2. Les KPIs exécutifs afficheront les données de performance
3. Le widget Stock affichera le nombre de produits critiques
4. Les insights prédictifs analyseront les produits à stock bas
5. Les alertes intelligentes détecteront les ruptures

