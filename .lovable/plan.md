

# Correction du bug "Produit deja expire" - Import Excel Reception

## Probleme identifie

Dans `src/services/receptionValidationService.ts` (lignes 272-278), la comparaison de dates est incorrecte :

```typescript
const expirationDate = new Date(ligne.date_expiration); // UTC midnight
const today = new Date(); // Heure locale avec heures/minutes/secondes
```

`new Date("2026-03-15")` cree une date a **minuit UTC**, tandis que `new Date()` cree une date en **heure locale avec composante horaire**. Dans un fuseau horaire positif (comme UTC+1 pour le Cameroun), `today` peut etre en avance sur la date d'expiration parsee, ce qui declenche faussement l'erreur.

## Correction

Normaliser les deux dates en comparant uniquement les composantes annee/mois/jour en heure locale, sans composante horaire :

```typescript
// Avant (bugge)
const expirationDate = new Date(ligne.date_expiration);
const today = new Date();

// Apres (corrige)
const expirationDate = new Date(ligne.date_expiration + 'T00:00:00');
const today = new Date();
today.setHours(0, 0, 0, 0);
expirationDate.setHours(0, 0, 0, 0);
```

En ajoutant `T00:00:00` a la chaine de date, on force le parsing en heure locale (au lieu d'UTC). Puis `setHours(0,0,0,0)` sur les deux dates garantit une comparaison jour contre jour.

## Fichier concerne

| Fichier | Modification |
|---------|-------------|
| `src/services/receptionValidationService.ts` | Lignes 273-274 : normaliser les dates en heure locale sans composante horaire |

Correction minimale de 3 lignes, aucun autre fichier impacte.

