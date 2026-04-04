

# Fix: clone_tenant_referential — colonne systeme_anatomique manquante

## Problème
La fonction `clone_tenant_referential` insère dans `classes_therapeutiques` sans inclure la colonne `systeme_anatomique`, qui a une contrainte `NOT NULL`. L'INSERT échoue dès qu'une classe thérapeutique a cette colonne remplie (ou vide, car NULL n'est pas accepté).

## Correction

### Migration SQL unique

Mettre à jour la fonction `clone_tenant_referential` : modifier l'INSERT des classes thérapeutiques (section 6) pour inclure `systeme_anatomique` :

```sql
INSERT INTO classes_therapeutiques (tenant_id, libelle_classe, systeme_anatomique, description)
SELECT p_target_tenant, libelle_classe, systeme_anatomique, description
FROM classes_therapeutiques WHERE tenant_id = p_source_tenant
```

C'est la seule ligne à changer. Le reste de la fonction reste identique.

## Fichier modifié
- Nouvelle migration SQL (CREATE OR REPLACE FUNCTION clone_tenant_referential)

