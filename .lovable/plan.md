

# Plan de correction : Pharma Tools Réseau Spécialisés

## Erreur identifiée

La fonction RPC `get_drug_database_with_details` référence `d.libelle_dci` (lignes 207, 223, 253 de la migration) mais la colonne réelle dans la table `dci` est `nom_dci`. Cela provoque l'erreur `42703: column d.libelle_dci does not exist`.

De plus, la ligne 233 fait `COALESCE(d.contre_indications, ARRAY[]::TEXT[])` mais `contre_indications` est de type `text` (pas `text[]`), ce qui pourrait aussi causer une erreur de type.

## Correction

### Migration SQL unique

Recréer la fonction `get_drug_database_with_details` en remplaçant :

1. `d.libelle_dci` → `d.nom_dci` (3 occurrences : lignes 207, 223, 253)
2. `COALESCE(d.contre_indications, ARRAY[]::TEXT[])` → `CASE WHEN d.contre_indications IS NOT NULL THEN ARRAY[d.contre_indications] ELSE ARRAY[]::TEXT[] END` (pour convertir le text en array comme attendu par le frontend)

Aucun changement frontend. Seule la fonction SQL est corrigée.

## Fichiers impactés

| Action | Fichier |
|--------|---------|
| Migration SQL | Recréer `get_drug_database_with_details` |

