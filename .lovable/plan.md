
# Plan de Correction - Erreurs IA/Prédictif

## Problèmes Identifiés

### Erreur 1 : RPC `calculate_data_quality_metrics` (400 Bad Request)
**Message** : `column "statut" does not exist`

**Cause** : La fonction RPC créée dans la migration `20260205145803` référence une colonne `statut` dans la table `produits`, mais cette colonne n'existe pas. La table `produits` utilise `is_active` (boolean) pour indiquer si un produit est actif.

**Lignes problématiques dans la fonction SQL** :
- Ligne 59 : `WHERE tenant_id = p_tenant_id AND statut = 'Actif'`
- Ligne 69 : `AND statut = 'Actif'`
- Ligne 82 : `AND statut = 'Actif'`
- Ligne 91 : `AND statut = 'Actif'`

### Erreur 2 : Requête `ai_reports_config` (406 Not Acceptable)
**Cause** : La méthode `getAIConfig()` dans `AIReportsService.ts` utilise `.single()` qui retourne une erreur 406 quand aucun enregistrement n'existe pour le tenant.

---

## Plan de Correction

### Phase 1 : Migration SQL de Correction

Créer une nouvelle migration pour mettre à jour la fonction RPC :

| Correction | Avant | Après |
|------------|-------|-------|
| Filtre statut | `statut = 'Actif'` | `is_active = true` |
| Notification | - | `NOTIFY pgrst, 'reload schema'` |

**Structure de la migration** :
```text
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
  - Remplacer toutes les occurrences de "statut = 'Actif'" par "is_active = true"
  - Ajouter NOTIFY pgrst, 'reload schema' à la fin
```

### Phase 2 : Correction du Service AIReportsService

**Fichier** : `src/services/AIReportsService.ts`

**Méthode `getAIConfig()`** (lignes 609-637) :
- Remplacer `.single()` par `.maybeSingle()` pour éviter l'erreur 406 quand aucun enregistrement n'existe

**Changement** :
```text
// Avant
.single()

// Après
.maybeSingle()
```

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/migrations/20260205_fix_calculate_data_quality_rpc.sql` | Nouvelle migration pour corriger la fonction RPC |
| `src/services/AIReportsService.ts` | Remplacer `.single()` par `.maybeSingle()` ligne 614 |

---

## Détails Techniques

### Migration SQL Corrigée

La fonction corrigée utilisera :
- `is_active = true` au lieu de `statut = 'Actif'` (4 occurrences)
- Cohérence avec le schéma réel de la table `produits`
- Notification PostgREST pour rafraîchir le cache

### Gestion des Cas Vides

La méthode `getAIConfig()` retournera déjà une configuration par défaut (lignes 629-636) si aucun enregistrement n'existe, mais `.maybeSingle()` empêchera l'erreur 406 de se produire.

---

## Ordre d'Exécution

1. **Migration SQL** : Corriger la fonction RPC avec les bonnes colonnes
2. **Service** : Corriger la requête `.single()` → `.maybeSingle()`
3. **Test** : Vérifier que le module charge sans erreur

---

## Garanties

- Aucune suppression de fonctionnalité
- Correction ciblée des erreurs identifiées
- Compatibilité multi-tenant préservée
- Retour silencieux aux valeurs par défaut si aucune donnée
