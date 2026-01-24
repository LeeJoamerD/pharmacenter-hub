
# Plan de correction - Module Stock/Étiquettes

## Diagnostic

L'erreur "Impossible de charger les produits" est causée par deux problèmes dans le hook `useLabelPrinting.ts` :

1. **Absence de filtrage par tenant** : La requête ne filtre pas par `tenant_id`, contrairement aux autres hooks du projet
2. **Échec des jointures RLS** : Les jointures sur `dci(nom_dci)` et `laboratoires(libelle)` échouent car ces tables ont des politiques RLS restrictives basées sur `tenant_id = get_current_user_tenant_id()`

## Solution

### Fichier à modifier : `src/hooks/useLabelPrinting.ts`

**Changement 1 : Importer et utiliser le contexte Tenant**

Ajouter l'import du hook `useTenant` et l'utiliser dans le hook pour récupérer le `tenantId` de la pharmacie connectée.

**Changement 2 : Modifier la requête fetchProducts**

- Remplacer les jointures directes `dci(nom_dci)` et `laboratoires(libelle)` par une récupération des IDs uniquement (`dci_id`, `laboratoires_id`)
- Ajouter le filtre `.eq('tenant_id', tenantId)` à la requête
- Charger les tables de référence `dci` et `laboratoires` séparément dans des maps pour la résolution des noms
- Combiner les données localement

**Changement 3 : Adapter l'interface ProductForLabel**

Stocker directement les noms résolus au lieu de sous-objets imbriqués.

---

## Détail technique des modifications

### Import ajouté (ligne 4)
```typescript
import { useTenant } from '@/contexts/TenantContext';
```

### Dans la fonction useLabelPrinting (après ligne 40)
```typescript
const { tenantId } = useTenant();
```

### Nouvelle logique fetchProducts

1. Vérifier que `tenantId` est disponible avant d'exécuter la requête
2. Requête principale sur `produits` avec filtre tenant :
   ```typescript
   .select('id, libelle_produit, code_cip, code_barre_externe, prix_vente_ttc, dci_id, laboratoires_id')
   .eq('tenant_id', tenantId)
   .eq('is_active', true)
   ```
3. Charger les DCI et laboratoires du tenant séparément :
   ```typescript
   const { data: dciData } = await supabase
     .from('dci')
     .select('id, nom_dci');
   
   const { data: labData } = await supabase
     .from('laboratoires')
     .select('id, libelle');
   ```
4. Créer des maps de lookup pour résolution rapide
5. Combiner les données produits avec les noms DCI/laboratoires

---

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useLabelPrinting.ts` | Ajouter filtrage tenant + charger DCI/laboratoires séparément |

## Résultat attendu

- Les produits se chargent correctement au montage du composant
- La recherche fonctionne sans erreur
- Les noms DCI et laboratoires s'affichent correctement dans le tableau
