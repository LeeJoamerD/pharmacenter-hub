

# Correction: Contrainte CHECK sur inventaire_sessions bloque les nouveaux types

## Probleme

La table `inventaire_sessions` possede une contrainte CHECK qui limite les valeurs de la colonne `type` a seulement 3 valeurs :

```text
CHECK (type IN ('complet', 'partiel', 'cyclique'))
```

Les nouveaux types `'reception'` et `'vente'` sont rejetes par cette contrainte, ce qui genere l'erreur 400 "Bad Request".

Le message exact dans les logs Postgres confirme:
> "new row for relation inventaire_sessions violates check constraint inventaire_sessions_type_check"

## Solution

Une seule migration SQL est necessaire pour mettre a jour la contrainte:

```text
ALTER TABLE public.inventaire_sessions DROP CONSTRAINT IF EXISTS inventaire_sessions_type_check;
ALTER TABLE public.inventaire_sessions 
  ADD CONSTRAINT inventaire_sessions_type_check 
  CHECK (type IN ('complet', 'partiel', 'cyclique', 'reception', 'vente'));

NOTIFY pgrst, 'reload schema';
```

## Fichier modifie

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | Supprimer et recreer la contrainte CHECK avec les 5 types autorises |

Aucune modification de code frontend n'est necessaire, le code envoie deja les bonnes valeurs `'reception'` et `'vente'`.

