

# Correction : Champ "Date d'expiration" dans Unites gratuites

## Probleme

Dans `FreeUnitsTab.tsx`, le champ date d'expiration utilise `type="month"` (ligne 319), ce qui produit une valeur au format **"2028-10"**. La base de donnees attend un format complet **"YYYY-MM-DD"**, d'ou l'erreur PostgreSQL `22007`.

Dans `ReceptionForm.tsx`, le meme champ utilise `type="date"` (ligne 1210), ce qui produit directement une valeur au format **"2025-06-15"** compatible avec la base de donnees.

## Correction

### Fichier : `src/components/dashboard/modules/stock/FreeUnitsTab.tsx`

1. **Ligne 319** : Changer `type="month"` en `type="date"` pour aligner le comportement avec le composant Receptions

```text
Avant :  type="month"
Apres :  type="date"
```

Aucune transformation de date necessaire cote envoi (ligne 183) puisque `type="date"` produit directement le format `YYYY-MM-DD` attendu par PostgreSQL. La ligne existante `date_expiration: line.dateExpiration || undefined` reste correcte telle quelle.

| Fichier | Modification |
|---------|-------------|
| `FreeUnitsTab.tsx` | Ligne 319 : remplacer `type="month"` par `type="date"` |

