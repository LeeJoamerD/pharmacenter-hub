
# Corriger l'affichage et la recherche des sessions de caisse

## Probleme

Le chargement initial et la recherche affichent un sous-ensemble incomplet des sessions. Le comportement souhaite est :
- **Chargement par defaut** : sessions d'aujourd'hui et de la veille uniquement
- **Recherche** : toute session, quelle que soit sa date

## Cause probable

La requete `recentSessions` charge 100 sessions sans filtre de date, ce qui peut retourner des resultats inattendus selon le cache ou les conditions RLS. La recherche via `searchSessions` fonctionne en theorie mais pourrait etre affectee par le meme cache (elle retourne `recentSessions` si le terme fait moins de 2 caracteres).

## Corrections

### Fichier : `src/hooks/useSmartOrderSuggestions.ts`

**A) Query `recentSessions` (lignes 140-174)** : Ajouter un filtre de date pour ne charger que les sessions des 2 derniers jours (aujourd'hui et hier). Calculer la date seuil avec `new Date()` et soustraire 1 jour.

```text
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);

// Ajouter .gte('date_ouverture', yesterday.toISOString())
```

Cela garantit que le chargement par defaut n'affiche que les sessions du jour et de la veille.

**B) Query `searchSessions` (lignes 177-209)** : Retirer toute restriction de date pour que la recherche puisse trouver n'importe quelle session historique. Augmenter la limite de 20 a 50 pour avoir plus de resultats. Ne plus retourner `recentSessions` quand le terme est court -- retourner un tableau vide si le terme est trop court (moins de 2 caracteres), car les sessions recentes sont deja affichees en arriere-plan.

**C) Logique d'affichage dans `SaleSelectionDialog.tsx` (lignes 52-65)** : Modifier pour que `filteredSessions` combine les resultats : quand il n'y a pas de recherche, montrer `recentSessions`. Quand il y a une recherche, montrer les resultats de `searchSessions` uniquement. Cela evite que le cache des sessions recentes interfere avec la recherche.

## Resultat attendu

- A l'ouverture du modal : les sessions d'aujourd'hui et d'hier s'affichent
- En tapant un numero de session (ex: "SES-20260215") : la recherche retrouve les sessions correspondantes quelle que soit leur date
