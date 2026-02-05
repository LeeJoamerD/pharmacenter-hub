
# Plan de Correction - Colonne prix_vente inexistante

## Problème Identifié

L'erreur `column "prix_vente" does not exist` avec le hint `Perhaps you meant to reference the column "produits.prix_vente_ht"` indique que la fonction RPC `calculate_data_quality_metrics` utilise une colonne inexistante.

### Analyse du schéma réel de la table `produits`

| Colonne supposée | Colonne réelle | Statut |
|------------------|----------------|--------|
| `prix_vente` | `prix_vente_ht` | Erreur |
| `prix_achat` | `prix_achat` | OK |
| `statut` | `is_active` | Déjà corrigé dans dernière migration |

La migration `20260205161237` a corrigé `statut` mais utilise toujours `prix_vente` au lieu de `prix_vente_ht`.

---

## Plan de Correction

### Phase 1 : Nouvelle Migration SQL

Créer une migration qui corrige la fonction RPC en remplaçant toutes les occurrences de `prix_vente` par `prix_vente_ht`.

**Corrections à apporter :**

| Ligne | Avant | Après |
|-------|-------|-------|
| Complétude | `AND prix_vente IS NOT NULL AND prix_vente > 0` | `AND prix_vente_ht IS NOT NULL AND prix_vente_ht > 0` |
| Cohérence | `AND prix_vente >= prix_achat` | `AND prix_vente_ht >= prix_achat` |

### Phase 2 : Notification PostgREST

Ajouter `NOTIFY pgrst, 'reload schema';` à la fin de la migration pour forcer le rafraîchissement du cache.

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/migrations/20260205_fix_prix_vente_column.sql` | Nouvelle migration corrigeant `prix_vente` en `prix_vente_ht` |

---

## Structure de la Migration

```text
-- Drop existing function
DROP FUNCTION IF EXISTS public.calculate_data_quality_metrics(UUID);

-- Recreate with correct column names
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ...
BEGIN
  -- Utiliser is_active = true (déjà corrigé)
  -- Utiliser prix_vente_ht au lieu de prix_vente (NOUVEAU)
  
  SELECT COUNT(*) INTO v_products_with_price
  FROM produits
  WHERE tenant_id = p_tenant_id 
    AND is_active = true 
    AND prix_vente_ht IS NOT NULL 
    AND prix_vente_ht > 0;

  -- Cohérence : prix_vente_ht >= prix_achat
  ...
  
  RETURN v_result;
END;
$$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## Note sur l'erreur CORS (manifest.json)

L'erreur CORS concernant `auth-bridge` et `manifest.json` est spécifique à l'environnement de preview Lovable. Elle n'impacte pas le fonctionnement de l'application et disparaîtra en production. Aucune action requise.

---

## Ordre d'Exécution

1. Créer la migration SQL avec les colonnes corrigées
2. Appliquer la migration (automatique via Lovable)
3. Vérifier que le module IA/Prédictif charge sans erreur

---

## Garanties

- Aucune suppression de fonctionnalité
- Correction ciblée des colonnes référencées
- Compatibilité avec le schéma réel de la table `produits`
- Cache PostgREST rafraîchi après migration
