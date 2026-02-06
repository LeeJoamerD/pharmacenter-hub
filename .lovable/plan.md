

# Correction du bug de comparaison de dates dans les composants Reception

## Probleme identifie

Le meme bug de comparaison UTC vs heure locale existe dans 3 autres endroits :

### 1. ReceptionForm.tsx (ligne 379-380)
```typescript
const today = new Date();              // heure locale avec composante horaire
const expDate = new Date(dateExpiration); // UTC si format "YYYY-MM-DD"
```
La fonction `validateExpirationDate` compare sans normaliser, ce qui peut rejeter des dates valides.

### 2. ReceptionExcelImport.tsx (ligne 1129, 1137)
```typescript
const now = new Date();                // heure locale avec composante horaire
const expDate = new Date(newDate);     // UTC si format "YYYY-MM-DD"
if (expDate < now) { ... }
```
La fonction `recalculateLineStatusFromDate` marque des dates comme "expirees" a tort.

### 3. ReceptionExcelImport.tsx (ligne 1170-1176)
Meme probleme dans le rendu du tableau, ou `now` et `expDate` ne sont pas normalises.

### 4. useLots.ts (ligne 223-224) - Risque mineur
```typescript
const expDate = new Date(expirationDate);
const today = new Date();
```
`calculateDaysToExpiration` peut donner un resultat faux d'1 jour a cause du decalage horaire.

---

## Plan de correction

### Fichier 1 : `src/components/dashboard/modules/stock/ReceptionForm.tsx`
- **Ligne 379-380** : Ajouter `+ 'T00:00:00'` au parsing de `dateExpiration` et `setHours(0,0,0,0)` sur `today`

### Fichier 2 : `src/components/dashboard/modules/stock/ReceptionExcelImport.tsx`
- **Ligne 1129** : Ajouter `now.setHours(0, 0, 0, 0)` apres la creation de `now`
- **Ligne 1137** : Changer en `new Date(newDate + 'T00:00:00')`
- **Ligne 1170-1176** : Meme normalisation pour le second bloc de calcul de statut

### Fichier 3 : `src/hooks/useLots.ts`
- **Ligne 223-224** : Normaliser les deux dates avec `setHours(0,0,0,0)` pour un calcul de jours precis

---

## Resume des modifications

| Fichier | Lignes | Correction |
|---------|--------|-----------|
| `ReceptionForm.tsx` | 379-380 | Normaliser `today` et `expDate` en minuit local |
| `ReceptionExcelImport.tsx` | 1129, 1137 | Normaliser `now` et `expDate` en minuit local |
| `ReceptionExcelImport.tsx` | 1170-1176 | Normaliser le second bloc de calcul |
| `useLots.ts` | 223-224 | Normaliser pour calcul de jours precis |

Correction minimale, meme pattern que celui applique dans `receptionValidationService.ts`.

