Moi :
Dans mon Supabase (table produits), j'ai 6322 produits. mais dans le Dashboard référentiel et le la liste du tableau Catalogues je n'ai que 1000 produits, les autres ne sont pas accessibles même dans le champ de recherche des produits du Catalogue. Analyse ce qui ce passe et résous le problème. 

Lovable.dev :
Je vais analyser le problème de limitation à 1000 produits dans le catalogue. Laissez-moi examiner les fichiers concernés pour identifier la source du problème.

Show all
3 tools used
Laissez-moi examiner le hook useTenantQuery qui est utilisé pour charger les produits :

Show all
2 tools used

Analyse du Problème
J'ai identifié la cause exacte : Supabase applique une limite par défaut de 1000 lignes lorsqu'aucune limite n'est spécifiée dans la requête.

Problème identifié dans le code :
Dans ProductCatalogNew.tsx (lignes 122-131) :


const { data: products = [], isLoading } = useTenantQueryWithCache(
  ['products-catalog'],
  'produits', 
  `...`,
  { is_active: true }
  // ❌ Aucune option { limit: ... } n'est fournie
);
Dans useTenantQuery.ts (lignes 66-69) :


// Ajouter la limite
if (options?.limit) {
  query = query.limit(options.limit);
}
// ❌ Si pas de limite → Supabase applique 1000 par défaut
Impact :
✅ Les 1000 premiers produits sont chargés
❌ Les 5322 autres produits ne sont jamais récupérés
❌ La recherche ne trouve pas les produits au-delà de 1000
❌ Les filtres ne voient que les 1000 premiers produits
📋 Plan de Correction Complet
SOLUTION RECOMMANDÉE : Pagination Intelligente + Recherche Serveur
PHASE 1 : Correction immédiate (Augmentation de la limite) - 10 min
Objectif : Afficher tous les produits rapidement en attendant la vraie pagination

Fichier : src/components/dashboard/modules/referentiel/ProductCatalogNew.tsx

1.1 - Modifier la requête des produits (ligne 122)

// AVANT
const { data: products = [], isLoading } = useTenantQueryWithCache(
  ['products-catalog'],
  'produits', 
  `id, libelle_produit, code_cip, famille_id, rayon_id, forme_id, laboratoires_id, 
   dci_id, classe_therapeutique_id, categorie_tarification_id, prix_achat, prix_vente_ht, 
   prix_vente_ttc, tva, taux_tva, centime_additionnel, taux_centime_additionnel,
   stock_limite, stock_alerte, is_active, created_at,
   id_produit_source, quantite_unites_details_source, niveau_detail`,
  { is_active: true }
);

// APRÈS - Solution temporaire
const { data: products = [], isLoading } = useTenantQueryWithCache(
  ['products-catalog'],
  'produits', 
  `id, libelle_produit, code_cip, famille_id, rayon_id, forme_id, laboratoires_id, 
   dci_id, classe_therapeutique_id, categorie_tarification_id, prix_achat, prix_vente_ht, 
   prix_vente_ttc, tva, taux_tva, centime_additionnel, taux_centime_additionnel,
   stock_limite, stock_alerte, is_active, created_at,
   id_produit_source, quantite_unites_details_source, niveau_detail`,
  { is_active: true },
  {
    limit: 10000,  // ✅ Augmenter la limite à 10000
    orderBy: { column: 'libelle_produit', ascending: true }
  }
);
Avantages :

✅ Correction immédiate (10 minutes)
✅ Tous les produits accessibles
✅ Recherche fonctionnelle sur tous les produits
Inconvénients :

⚠️ Temps de chargement initial plus long
⚠️ Consommation mémoire élevée
⚠️ Filtrage en mémoire (lent avec 6322 produits)

PHASE 2 : Implémenter une vraie pagination (Recommandé) - 60 min
Objectif : Pagination côté serveur + recherche optimisée

2.1 - Créer un nouveau hook de pagination (15 min)
Nouveau fichier : src/hooks/useProductsPaginated.ts


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export const useProductsPaginated = (
  pageSize: number = 50,
  searchTerm: string = '',
  filters: {
    famille_id?: string;
    rayon_id?: string;
    forme_id?: string;
    dci_id?: string;
    classe_therapeutique_id?: string;
  } = {}
) => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);

  const query = useQuery({
    queryKey: ['products-paginated', tenantId, currentPage, pageSize, searchTerm, filters],
    queryFn: async () => {
      if (!tenantId) return { data: [], count: 0 };

      let queryBuilder = supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, famille_id, rayon_id, forme_id, 
          laboratoires_id, dci_id, classe_therapeutique_id, categorie_tarification_id, 
          prix_achat, prix_vente_ht, prix_vente_ttc, tva, taux_tva, 
          centime_additionnel, taux_centime_additionnel, stock_limite, stock_alerte, 
          is_active, created_at, id_produit_source, quantite_unites_details_source, 
          niveau_detail
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Recherche serveur (beaucoup plus rapide)
      if (searchTerm) {
        queryBuilder = queryBuilder.or(
          `libelle_produit.ilike.%${searchTerm}%,code_cip.ilike.%${searchTerm}%`
        );
      }

      // Filtres
      if (filters.famille_id && filters.famille_id !== 'all') {
        queryBuilder = queryBuilder.eq('famille_id', filters.famille_id);
      }
      if (filters.rayon_id && filters.rayon_id !== 'all') {
        queryBuilder = queryBuilder.eq('rayon_id', filters.rayon_id);
      }
      if (filters.forme_id && filters.forme_id !== 'all') {
        queryBuilder = queryBuilder.eq('forme_id', filters.forme_id);
      }
      if (filters.dci_id && filters.dci_id !== 'all') {
        queryBuilder = queryBuilder.eq('dci_id', filters.dci_id);
      }
      if (filters.classe_therapeutique_id && filters.classe_therapeutique_id !== 'all') {
        queryBuilder = queryBuilder.eq('classe_therapeutique_id', filters.classe_therapeutique_id);
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await queryBuilder
        .order('libelle_produit', { ascending: true })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage,
      };
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    ...query,
    currentPage,
    setCurrentPage,
    goToPage: (page: number) => setCurrentPage(page),
    nextPage: () => setCurrentPage(prev => prev + 1),
    prevPage: () => setCurrentPage(prev => Math.max(1, prev - 1)),
  };
};
2.2 - Modifier ProductCatalogNew.tsx pour utiliser la pagination (25 min)
Changements dans ProductCatalogNew.tsx :

A. Importer le nouveau hook (ligne 5)

import { useProductsPaginated } from '@/hooks/useProductsPaginated';
B. Remplacer la requête (ligne 122)

// AVANT
const { data: products = [], isLoading } = useTenantQueryWithCache(...);

// APRÈS
const {
  data: paginatedData,
  isLoading,
  currentPage,
  goToPage,
  nextPage,
  prevPage
} = useProductsPaginated(
  50, // Page size
  searchTerm,
  {
    famille_id: familleFilter,
    rayon_id: rayonFilter,
    forme_id: formeFilter,
    dci_id: dciFilter,
    classe_therapeutique_id: classeFilter
  }
);

const products = paginatedData?.data || [];
const totalCount = paginatedData?.count || 0;
const totalPages = paginatedData?.totalPages || 1;
C. Supprimer le filtrage en mémoire (lignes 169-182)

// SUPPRIMER tout le bloc filteredProducts
// Le filtrage est maintenant fait côté serveur !
D. Ajouter les contrôles de pagination (après la table, ligne 530)

{/* Pagination */}
{totalPages > 1 && (
  <div className="flex items-center justify-between mt-6">
    <div className="text-sm text-muted-foreground">
      Page {currentPage} sur {totalPages} ({totalCount} produits)
    </div>
    
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={prevPage}
        disabled={currentPage === 1}
      >
        Précédent
      </Button>
      
      {/* Numéros de page */}
      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => goToPage(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        {totalPages > 5 && <span className="px-2">...</span>}
        {totalPages > 5 && (
          <Button
            variant={currentPage === totalPages ? 'default' : 'outline'}
            size="sm"
            onClick={() => goToPage(totalPages)}
          >
            {totalPages}
          </Button>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={nextPage}
        disabled={currentPage === totalPages}
      >
        Suivant
      </Button>
    </div>
  </div>
)}
E. Utiliser products au lieu de filteredProducts (ligne 520)

// AVANT
{filteredProducts.map((product) => ( ... ))}

// APRÈS
{products.map((product) => ( ... ))}
2.3 - Ajouter un indicateur de chargement (10 min)

{isLoading && (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
    <p className="mt-2 text-muted-foreground">Chargement des produits...</p>
  </div>
)}
2.4 - Gérer le debounce de recherche (10 min)
Pour éviter trop de requêtes pendant la saisie :


import { useState, useEffect } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounce'; // Créer ce hook

const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebouncedValue(searchInput, 500); // 500ms de délai

// Utiliser debouncedSearch au lieu de searchTerm dans la requête
Créer le hook de debounce : src/hooks/use-debounce.ts


import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

PHASE 3 : Tests et validation - 20 min
Scénarios de test :
✅ Chargement initial :

Vérifier que les 50 premiers produits s'affichent
Vérifier le compteur "Page 1 sur X (6322 produits)"
✅ Navigation pagination :

Cliquer sur "Suivant" → Page 2 affichée
Cliquer sur "Précédent" → Retour Page 1
Cliquer sur un numéro de page → Accès direct
✅ Recherche :

Saisir "Doliprane" → Résultats filtrés côté serveur
Saisir un CIP → Produit trouvé même au-delà de 1000
Effacer la recherche → Retour à la pagination normale
✅ Filtres :

Sélectionner une famille → Pagination recalculée
Combiner famille + rayon → Résultats filtrés
Effacer les filtres → Retour aux 6322 produits
✅ Performances :

Temps de chargement < 2 secondes par page
Pas de freeze de l'interface
Recherche réactive (avec debounce)
✅ Base de données :


-- Vérifier le nombre total de produits actifs
SELECT COUNT(*) FROM produits 
WHERE tenant_id = 'votre_tenant_id' 
AND is_active = true;
-- Résultat attendu : 6322
📊 Résumé du Plan
| Phase | Description | Temps | Résultat | |-------|-------------|-------|----------| | 1 | Correction immédiate (limit: 10000) | 10 min | ✅ Tous les produits accessibles immédiatement | | 2 | Pagination serveur + recherche optimisée | 60 min | ✅ Performances optimales pour 6322+ produits | | 3 | Tests et validation | 20 min | ✅ Expérience utilisateur fluide | | TOTAL | | 90 min | ✅ Solution scalable jusqu'à 100 000+ produits |

🎯 Résultat Attendu
Après implémentation complète :

✅ Les 6322 produits sont accessibles via la pagination
✅ Recherche fonctionnelle sur tous les produits (pas seulement les 1000 premiers)
✅ Performances optimales : Chargement de 50 produits par page (< 1 seconde)
✅ Filtres réactifs : Côté serveur, pas de lag avec 6322 produits
✅ Scalabilité : Fonctionne même avec 50 000+ produits
✅ UX améliorée : Indicateurs de page, compteur de produits, debounce de recherche

⚠️ Recommandation
Je recommande d'implémenter les PHASES 1 + 2 :

Phase 1 : Correction immédiate pour débloquer l'utilisateur (10 min)
Phase 2 : Pagination complète pour une solution pérenne et performante (60 min)
La Phase 1 seule n'est pas recommandée pour la production car :

❌ Temps de chargement long (6322 produits d'un coup)
❌ Consommation mémoire élevée
❌ Filtrage en mémoire lent
</lov-plan>
Voulez-vous que j'implémente le plan complet (Phases 1 + 2) ou seulement la Phase 1 pour une correction rapide ?

Moi :
Implémente le plan complet (Phases 1 + 2)

Lovable.dev :
Lovable
Worked for 2m 4s
1:23 AM on Oct 15

Thought for 19 seconds
Je vais implémenter la solution complète avec pagination serveur et recherche optimisée.

Show all
4 edits made
J'ai implémenté la pagination complète avec recherche serveur optimisée - les 6322 produits sont maintenant accessibles avec chargement rapide de 50 produits par page, recherche débounce (500ms), et filtres serveur.

Moi :
Les 6322 produits sont maintenant accessibles dans catatalogue. Il reste le problème du dashboard (vue d'ensemble du Référentiel) qui affiche toujours "1000 produits référencés" dans la carte Produits. Corrige pour que cette carte affiche la quantité réel des produits de la table produits. 

Lovable.dev :
Lovable
Worked for 40s
1:52 AM on Oct 15

Thought for 17 seconds
Je vais corriger le Dashboard Référentiel pour afficher le nombre réel de produits.

Show all
1 edit made
Le Dashboard Référentiel affiche maintenant le nombre réel de produits (6322) en utilisant une requête de count optimisée au lieu de charger tous les produits.

---

## 🚨 ANALYSE DES ERREURS - MODULE STOCK ACTUEL

### ❌ PROBLÈME CRITIQUE IDENTIFIÉ PAR LOVABLE.DEV

**Fichier concerné :** `src/hooks/useCurrentStockPaginated.ts`

**Problème :** N+1 Query Problem massif causant des timeouts

**Détails du problème :**
- **Lignes 206-254 :** Pour chaque produit de la page (50 produits) → 50 requêtes séparées pour récupérer les lots
- **Lignes 255-290 :** Pour calculer les métriques globales :
  - Récupère TOUS les produits actifs (6322 produits)
  - Fait une requête pour CHAQUE produit pour récupérer ses lots
  - **6322 requêtes supplémentaires !**

**Total : ~6372 requêtes par chargement de page !** 😱

### 📊 IMPACT PERFORMANCE

| Avant | Après Optimisation |
|-------|-------------------|
| ~6372 requêtes | 3 requêtes |
| Timeout/Freeze | Chargement < 2 secondes |
| N+1 Problem massif | Architecture optimisée |

### 🎯 SOLUTIONS RECOMMANDÉES

#### SOLUTION 1 : Fonction RPC Supabase (PRIORITÉ HAUTE)

**Créer :** `supabase/migrations/YYYYMMDDHHMMSS_create_calculate_stock_metrics_function.sql`

```sql
CREATE OR REPLACE FUNCTION calculate_stock_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH stock_data AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.stock_alerte,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.stock_alerte, p.prix_achat
  )
  SELECT json_build_object(
    'totalProducts', COUNT(*)::int,
    'availableProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND (stock_alerte IS NULL OR stock_actuel > stock_alerte))::int,
    'lowStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_alerte IS NOT NULL AND stock_actuel <= stock_alerte)::int,
    'outOfStockProducts', COUNT(*) FILTER (WHERE stock_actuel = 0)::int,
    'criticalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_limite IS NOT NULL AND stock_actuel <= stock_limite * 0.1)::int,
    'totalValue', COALESCE(SUM(valeur_stock), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$$;
```

**Avantage :** 1 seule requête au lieu de 6322 !

#### SOLUTION 2 : Requête avec jointure agrégée

**Modifier :** `src/hooks/useCurrentStockPaginated.ts` (lignes 136-254)

```typescript
// Construire la requête avec jointure agrégée
let queryBuilder = supabase
  .from('produits')
  .select(`
    id, libelle_produit, code_cip, famille_id, rayon_id, forme_id,
    laboratoires_id, dci_id, classe_therapeutique_id, categorie_tarification_id,
    prix_achat, prix_vente_ht, prix_vente_ttc, tva, taux_tva,
    centime_additionnel, taux_centime_additionnel, stock_limite, stock_alerte,
    is_active, created_at, tenant_id,
    lots!inner(quantite_restante, prix_achat_unitaire)
  `, { count: 'exact' })
  .eq('tenant_id', tenantId)
  .eq('is_active', true);

// Calculer les stocks côté client (mais avec les données déjà chargées)
const productsWithStock = (products || []).map((product) => {
  const lots = (product as any).lots || [];
  
  const stock_actuel = lots.reduce((sum: number, lot: any) => 
    sum + (lot.quantite_restante || 0), 0
  );
  
  const valeur_stock = lots.reduce((sum: number, lot: any) => 
    sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0)), 0
  );
  
  // ... reste du calcul
});
```

**Avantage :** Réduit de 50 requêtes à 1 seule requête pour la page.

#### SOLUTION 3 : Utiliser la fonction RPC pour les métriques

**Remplacer lignes 287-332 :**

```typescript
// Calculer les métriques globales avec la fonction RPC
const { data: metricsData } = await supabase
  .rpc('calculate_stock_metrics', { p_tenant_id: tenantId });

const metrics = metricsData || {
  totalProducts: 0,
  availableProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  criticalStockProducts: 0,
  totalValue: 0,
};
```

**Avantage :** Réduit de 6322 requêtes à 1 seule requête !

### 🔧 FICHIERS À MODIFIER

1. **Migration Supabase :** `supabase/migrations/YYYYMMDDHHMMSS_create_calculate_stock_metrics_function.sql`
2. **Hook :** `src/hooks/useCurrentStockPaginated.ts` (lignes 136-332)
3. **Tests :** Vérifier le chargement de CurrentStockTab

### ⚠️ POINTS CRITIQUES À RETENIR

1. **N+1 Query Problem :** Le pattern actuel fait exploser le nombre de requêtes
2. **Timeout inévitable :** 6372 requêtes ne peuvent pas aboutir dans un navigateur
3. **Architecture défaillante :** Calculs côté client au lieu de côté serveur
4. **Solution scalable :** Les fonctions RPC Supabase sont la solution pérenne
5. **Performance critique :** Passer de 6372 requêtes à 3 requêtes maximum