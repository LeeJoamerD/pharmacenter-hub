

# Exclure le fond de caisse du montant theorique

## Changement de formule

Actuellement : **Montant Theorique = Fond de caisse + Entrees - Sorties**
Nouveau : **Montant Theorique = Total Entrees (Ventes + Entrees) - Total Sorties (Sorties + Depenses)**

## Fichiers a modifier

### 1. Migration SQL - RPC `calculate_expected_closing`

Creer une nouvelle migration pour modifier la fonction RPC. Retirer `v_fond_ouverture` du calcul :

```text
Avant : v_montant_theorique := v_fond_ouverture + v_total_mouvements
Apres : v_montant_theorique := v_total_mouvements
```

La variable `v_fond_ouverture` et sa lecture restent pour ne pas casser la signature, mais elle n'est plus ajoutee au resultat.

### 2. `src/hooks/useCashRegister.ts` (ligne 429)

Modifier `getSessionBalance` pour retourner uniquement `totalMovements` au lieu de `session.fond_caisse_ouverture + totalMovements`. C'est cette fonction qui alimente le montant theorique dans le modal de fermeture.

### 3. `src/components/dashboard/modules/sales/cash/CloseSessionModal.tsx` (ligne 297)

Mettre a jour le texte descriptif sous le Montant Theorique :
- Avant : "Fond de caisse + Encaissements - Retraits"
- Apres : "Total Entrees (Ventes + Entrees) - Total Sorties (Sorties + Depenses)"

### 4. `src/hooks/useDashboardData.ts` (ligne 380)

Modifier le calcul de `currentAmount` pour les sessions du tableau de bord :
- Avant : `(session.fond_caisse_ouverture || 0) + ventesTotal`
- Apres : `ventesTotal`

### 5. `src/components/dashboard/modules/sales/POSInterface.tsx` (ligne 991)

Modifier le calcul de `currentBalance` passe au modal de depenses :
- Avant : `activeSession.fond_caisse_ouverture + (activeSession.montant_total_ventes || 0)`
- Apres : `activeSession.montant_total_ventes || 0`

## Ce qui ne change pas

- L'affichage du "Fond de caisse" reste visible dans le modal et les rapports (c'est une information, pas un composant du calcul)
- Les totaux Entrees/Sorties restent calcules de la meme facon
- L'ecart (Montant Reel - Montant Theorique) continue a fonctionner normalement
- Les rapports de session (`SessionReports.tsx`) affichent la valeur stockee en base (`montant_theorique_fermeture`) qui sera correcte apres la mise a jour de la RPC

