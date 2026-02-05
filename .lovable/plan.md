
# Plan de Correction - Colonne stock_alerte inexistante

## Problème Identifié

La fonction RPC `calculate_data_quality_metrics` (ligne 53) référence `stock_alerte` qui n'existe pas dans la table `produits`.

### Colonnes réelles du schéma produits (seuils de stock)

| Colonne utilisée | Colonne réelle | Statut |
|------------------|----------------|--------|
| `stock_alerte` | N'existe pas | Erreur |
| `stock_limite` | `stock_limite` | OK |
| `stock_faible` | `stock_faible` | OK |
| `stock_critique` | `stock_critique` | OK |

---

## Plan de Correction

### Phase 1 : Nouvelle Migration SQL

Créer une migration qui remplace `stock_alerte` par `stock_critique` (conformément au choix utilisateur).

**Correction à apporter (ligne 53) :**

| Avant | Après |
|-------|-------|
| `AND (stock_limite IS NOT NULL OR stock_alerte IS NOT NULL)` | `AND (stock_limite IS NOT NULL OR stock_critique IS NOT NULL OR stock_faible IS NOT NULL)` |

Cette correction utilise toutes les colonnes de seuils existantes pour une mesure plus complète de la qualité des données stock.

---

## Fichier à Créer

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/[timestamp]_fix_stock_alerte_column.sql` | Migration corrigeant la référence de colonne |

---

## Structure de la Migration

```sql
-- Drop existing function
DROP FUNCTION IF EXISTS public.calculate_data_quality_metrics(UUID);

-- Recreate with correct stock threshold columns
CREATE OR REPLACE FUNCTION public.calculate_data_quality_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Remplacer ligne 53:
  -- stock_alerte → stock_critique ou stock_faible
$$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## Garanties

- Aucune suppression de fonctionnalité
- Correction ciblée de la colonne référencée
- Compatibilité avec le schéma réel de la table `produits`
- Utilisation des colonnes existantes (`stock_limite`, `stock_critique`, `stock_faible`)
