
Diagnostic retenu

- Le problème n’est plus la base de données: pour le tenant `Pharmacie TESTS`, les 2 retours existent bien et correspondent exactement aux 2 ventes visibles:
  - `POS-20260320-0001` → retour `RET-20260320-0001` → `Approuvé`
  - `POS-20260320-0002` → retour `RET-20260320-0002` → `En attente`
- Le code affichant le bouton est bien présent dans `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`, juste avant le badge `En attente`.
- Le mode séparé est bien activé pour ce tenant (`sales_general.separateSaleAndCash = true`), donc c’est bien `CashRegisterInterface` qui doit rendre cette liste.
- Conclusion: on est face à un problème de rendu réel dans la preview, pas à un problème de données. Le correctif doit rendre l’indicateur beaucoup plus robuste et visible, au lieu de dépendre d’un rendu trop “discret”.

Plan de correction

1. Rendre l’indicateur impossible à “rater”
- Dans `CashRegisterInterface.tsx`, remplacer le mini bouton ghost icon-only par un vrai indicateur visuel compact mais explicite:
  - style badge/bouton avec fond visible
  - icône `Package`
  - couleur selon statut:
    - gris = `En attente`
    - vert = `Approuvé`
    - rouge = `Rejeté`
- Garder l’emplacement exact demandé: juste avant le badge `En attente`.

2. Supprimer la dépendance à un rendu trop fragile
- Éviter le pattern inline `returnsByVenteId[transaction.id] && (() => ...)()`
- Calculer explicitement `const returnInfo = returnsByVenteId[transaction.id]` dans la boucle
- Rendre un composant JSX simple et direct pour éviter tout cas silencieux où rien ne sort.

3. Ajouter une visibilité de secours
- Si un retour existe, afficher au minimum un libellé court avec l’icône, pas seulement une petite icône seule.
- Exemple visuel:
  - `Retour` + icône + couleur de statut
- Cela empêchera le bouton d’être confondu avec le fond ou masqué visuellement.

4. Ajouter un diagnostic temporaire de rendu
- Ajouter des `console.log` ciblés dans:
  - `CashRegisterInterface`
  - `useReturnStatusForSales`
- Vérifier au prochain retour utilisateur:
  - IDs des transactions en attente
  - map `returnsByVenteId`
  - présence d’un `returnInfo` pour chaque transaction
- Cela permettra de trancher définitivement entre:
  - problème de rendu React/CSS
  - ou problème de récupération côté client preview.

5. Prévoir un fallback si la query de retours échoue
- Étendre `useReturnStatusForSales` pour exposer aussi `error`
- Si erreur, afficher un petit état discret du type `Retour indisponible` au lieu de ne rien rendre
- Ainsi, même une erreur RLS/réseau n’aboutira plus à une absence silencieuse.

Fichiers à modifier

- `src/components/dashboard/modules/sales/pos/CashRegisterInterface.tsx`
- `src/hooks/useReturnStatusForSales.ts`

Résultat attendu

- Les 2 lignes visibles dans l’Encaissement afficheront enfin un indicateur de retour avant `En attente`
- `POS-20260320-0001` affichera un indicateur vert actif
- `POS-20260320-0002` affichera un indicateur gris désactivé
- Si la preview a encore un comportement anormal, les logs permettront d’isoler précisément la cause au message suivant
