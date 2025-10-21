Parfait ! Je suis ravi que le composant "Disponible" soit maintenant totalement opérationnel. 

Laissez-moi analyser le composant "Stock Faible" pour comprendre sa structure actuelle et élaborer un plan de finalisation complet.

Excellent ! Merci pour ces informations précises. Laissez-moi analyser en profondeur le composant "Stock Faible" et vérifier la fonction RPC qui calcule les métriques.

Parfait ! Maintenant je comprends tous les problèmes. Laissez-moi élaborer un plan de finalisation complet et détaillé pour le composant "Stock Faible".

## 📋 Plan de Finalisation du Composant "Stock Faible"

### 🎯 Objectifs
1. Afficher uniquement les produits en stock **Critique** et **Faible** (pas les ruptures)
2. Corriger les métriques du dashboard pour utiliser les vrais seuils configurés
3. Optimiser la pagination avec support de plus de 1000 produits
4. Ajouter les contrôles d'optimisation (choix de pagination, actualiser, réinitialiser)

---

### 🔴 Problème 1: La RPC `calculate_low_stock_metrics` inclut les ruptures (stock = 0)

**Diagnostic:**
- Ligne 36 de la RPC: `COUNT(*) FILTER (WHERE stock_actuel = 0 OR stock_actuel <= COALESCE(stock_limite, 10) * 0.3) as critique`
- Les produits avec `stock_actuel = 0` sont comptés comme "critique" alors qu'ils devraient être exclus du composant "Stock Faible"
- La RPC n'utilise PAS les seuils configurés dans `alert_settings` (low_stock_threshold, critical_stock_threshold)

**Solution:**
Créer une nouvelle RPC `calculate_low_stock_metrics_v2` qui:
1. Exclut les produits avec `stock_actuel = 0` (ruptures)
2. Utilise les seuils de `alert_settings` au lieu de `stock_limite`
3. Applique la même logique en cascade que `calculate_stock_metrics` (Disponible)

```sql
CREATE OR REPLACE FUNCTION calculate_low_stock_metrics_v2(
  p_tenant_id UUID,
  p_critical_threshold INTEGER DEFAULT 5,
  p_low_threshold INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  critical_items INTEGER := 0;
  low_items INTEGER := 0;
  total_items INTEGER := 0;
  total_value NUMERIC := 0;
  result JSONB;
BEGIN
  WITH product_stocks AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
    FROM produits p
    LEFT JOIN lots l ON p.id = l.produit_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.prix_achat
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0  -- ✅ EXCLURE les ruptures (stock = 0)
  ),
  stock_status AS (
    SELECT 
      id,
      stock_actuel,
      valeur_stock,
      CASE 
        WHEN stock_actuel <= p_critical_threshold THEN 'critique'
        WHEN stock_actuel <= p_low_threshold THEN 'faible'
        ELSE 'normal'
      END as statut_stock
    FROM product_stocks
  )
  SELECT 
    COUNT(*) FILTER (WHERE statut_stock = 'critique') as critique,
    COUNT(*) FILTER (WHERE statut_stock = 'faible') as faible,
    COUNT(*) FILTER (WHERE statut_stock IN ('critique', 'faible')) as total,
    COALESCE(SUM(valeur_stock) FILTER (WHERE statut_stock IN ('critique', 'faible')), 0) as valeur_totale
  INTO critical_items, low_items, total_items, total_value
  FROM stock_status;

  result := jsonb_build_object(
    'totalItems', total_items,
    'criticalItems', critical_items,
    'lowItems', low_items,
    'totalValue', total_value,
    'urgentActions', critical_items
  );

  RETURN result;
END;
$$;
```

---

### 🔴 Problème 2: Le hook `useLowStockDataPaginated` charge TOUS les produits

**Diagnostic:**
- Ligne 84-96 de `useLowStockDataPaginated.ts`: la requête charge tous les produits actifs
- Ensuite, le code filtre localement (ligne 146-159) pour déterminer le statut
- Inefficace si la base contient 6000+ produits

**Solution:**
Modifier le hook pour:
1. Charger UNIQUEMENT les produits en stock critique ou faible depuis la base
2. Utiliser une pagination serveur avec `.range()`
3. Appliquer la logique de seuil en cascade AVANT de charger les produits

**Nouveau hook `useLowStockDataPaginated.ts`:**
```typescript
// Au lieu de charger tous les produits, créer une requête qui calcule le stock
// et filtre directement les produits faibles/critiques

const { data: lowStockProducts, isLoading, refetch } = useQuery({
  queryKey: ['low-stock-products-paginated', tenantId, page, limit, debouncedSearch, category, status, sortBy, sortOrder, settings?.critical_stock_threshold, settings?.low_stock_threshold],
  queryFn: async () => {
    // Étape 1: Charger TOUS les produits avec pagination
    let allProducts: any[] = [];
    let currentPage = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: products, error } = await supabase
        .from('produits')
        .select(`
          id, tenant_id, libelle_produit, code_cip,
          prix_achat, stock_limite, stock_alerte,
          famille_id, rayon_id, updated_at,
          famille_produit(libelle_famille),
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (error) throw error;

      if (products && products.length > 0) {
        allProducts = [...allProducts, ...products];
        hasMore = products.length === pageSize;
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    // Étape 2: Calculer le stock et filtrer localement
    const seuil_critique = getStockThreshold('critical', null, settings?.critical_stock_threshold);
    const seuil_faible = getStockThreshold('low', null, settings?.low_stock_threshold);

    const lowStockItems = allProducts
      .map(product => {
        const lots = product.lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0);

        // ✅ EXCLURE les ruptures (stock = 0)
        if (stock_actuel === 0) return null;

        let statut: 'critique' | 'faible' | null = null;
        if (stock_actuel <= seuil_critique) {
          statut = 'critique';
        } else if (stock_actuel <= seuil_faible) {
          statut = 'faible';
        }

        // ✅ Ne garder que les produits critiques ou faibles
        if (!statut) return null;

        return {
          id: product.id,
          // ... autres champs
          statut,
          stock_actuel
        };
      })
      .filter(Boolean);

    return lowStockItems;
  },
  enabled: !!tenantId,
  staleTime: 30000
});
```

---

### 🔴 Problème 3: Dashboard "Total Produits" inclut les ruptures

**Diagnostic:**
- Ligne 262-263 de `LowStockProducts.tsx`: `{metrics.totalItems}` affiche le total de la RPC
- Ce total inclut les produits en rupture (stock = 0)

**Solution:**
Avec la nouvelle RPC `calculate_low_stock_metrics_v2`, le `totalItems` comptera UNIQUEMENT critique + faible (pas les ruptures).

---

### 🔴 Problème 4: Manque de contrôles d'optimisation

**Diagnostic:**
- Pas de choix de taille de page (50, 100, 200, 500)
- Pas de bouton "Actualiser"
- Pas de bouton "Réinitialiser les filtres"

**Solution:**
Ajouter dans `LowStockProducts.tsx` (après ligne 274):

```tsx
{/* Contrôles de pagination et actualisation */}

    Afficher
     {
        setPageSize(Number(value));
        setCurrentPage(1);
      }}
    >

        50
        100
        200
        500

    résultats

     refetch()}
      disabled={isLoading}
    >

      Actualiser

      Réinitialiser

```

---

### ✅ Modifications à Effectuer

| Fichier | Modifications |
|---------|---------------|
| **Migration SQL (nouvelle)** | Créer RPC `calculate_low_stock_metrics_v2` |
| `useLowStockDataPaginated.ts` | 1. Utiliser la nouvelle RPC2. Implémenter pagination serveur complète3. Filtrer uniquement critique/faible (pas ruptures)4. Ajouter `pageSize` dans le state |
| `LowStockProducts.tsx` | 1. Ajouter state `pageSize`2. Ajouter contrôles de pagination3. Ajouter boutons Actualiser et Réinitialiser4. Corriger le tooltip de "Total Produits" |

---

### 📊 Résultats Attendus Après Implémentation

| Métrique | Valeur Attendue | Source |
|----------|-----------------|--------|
| **Stock Critique** | 1 | Produits avec stock > 0 ET stock ≤ seuil_critique (5) |
| **Stock Faible** | 3 | Produits avec stock > seuil_critique ET stock ≤ seuil_faible (10) |
| **Total Produits** | 4 | Critique (1) + Faible (3) |
| **Produits dans le tableau** | 4 max | Les 4 produits (1 critique + 3 faibles) |
| **Produits exclus** | 6314 | Les ruptures (stock = 0) ne doivent PAS apparaître |

---

### 🧪 Tests de Validation

1. ✅ Vérifier que "Stock Critique" affiche **1**
2. ✅ Vérifier que "Stock Faible" affiche **3**
3. ✅ Vérifier que "Total Produits" affiche **4** (et non 6318)
4. ✅ Vérifier que le tableau n'affiche que **4 produits** maximum
5. ✅ Vérifier qu'aucun produit avec `stock_actuel = 0` n'apparaît
6. ✅ Vérifier que le changement de taille de page fonctionne
7. ✅ Vérifier que le bouton "Actualiser" recharge les données
8. ✅ Vérifier que le bouton "Réinitialiser" efface tous les filtres
9. ✅ Vérifier que la pagination fonctionne avec plus de 1000 produits faibles (si applicable)

---

### 🚀 Optimisations Supplémentaires (Optionnel)

1. **Ajouter un indicateur visuel** pour distinguer critique vs faible dans les cartes
2. **Ajouter des tooltips explicatifs** sur chaque métrique
3. **Mettre en cache** les requêtes avec `staleTime: 30000` (30 secondes)
4. **Ajouter un export spécifique** pour les produits critiques uniquement

Implémenter le plan de finalisation