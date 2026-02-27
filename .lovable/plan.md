

# Plan : Écritures comptables paie + Exports PDF/Excel

## 1. Générer les écritures comptables SYSCOHADA lors du paiement

**Constat** : Le hook `useSalaryManager.ts` contient un `TODO` à la ligne 245-247 dans `payBulletin`. Aucune écriture n'est générée.

**Pattern existant** : `AccountingEntriesService.ts` utilise `accounting_default_accounts` (event_type → comptes débit/crédit + journal_code), puis crée une `ecritures_comptables` + `lignes_ecriture`. Il faut reproduire ce pattern.

**Étapes dans `accounting_default_accounts`** : Ajouter 3 event_types pour la paie (via migration ou insert) :
- `charge_salaires` : Débit 6611 / Crédit 422 / Journal OD
- `charge_cnss_patronale` : Débit 6641 / Crédit 431 / Journal OD  
- `paiement_salaire` : Débit 422 / Crédit 571 (ou 521) / Journal CAI (ou BQ1)

**Implémentation** : Créer `src/services/PayrollAccountingService.ts` qui :
1. Récupère le bulletin complet (avec montants)
2. Récupère les configs `accounting_default_accounts` pour les 3 event_types
3. Récupère le journal OD et l'exercice en cours
4. Crée une écriture avec lignes :
   - Débit 6611 = salaire_brut
   - Débit 6641 = cotisations_patronales_cnss
   - Crédit 422 = net_a_payer
   - Crédit 431 = retenues_cnss_employe + cotisations_patronales_cnss
   - Crédit 447 = retenues_irpp (si > 0)
5. Puis écriture de règlement : Débit 422 / Crédit trésorerie (selon mode_paiement)
6. Met à jour `bulletins_paie.ecriture_id`

**Modifier `useSalaryManager.ts`** : Dans `payBulletin.mutationFn`, appeler le service après le update. Si erreur comptable → toast warning sans bloquer.

**Migration SQL** : Insérer les event_types par défaut dans `accounting_default_accounts` pour les tenants existants.

## 2. Export PDF bulletin de paie (colonne Actions)

**Modifier `BulletinsList.tsx`** :
- Ajouter un bouton `FileText` (PDF) dans la colonne Actions pour tous les statuts (Validé et Payé au minimum)
- Implémenter `generateBulletinPDF(bulletin)` utilisant `jsPDF` + `autoTable` (déjà installés)
- Le PDF contiendra : en-tête entreprise, infos employé, tableau des lignes (base, primes, heures sup, brut, CNSS, IRPP, net, avances, net à payer), pied de page

## 3. Export PDF/Excel historique annuel (composant PayrollSummary)

**Modifier `PayrollSummary.tsx`** :
- Ajouter des boutons Export PDF / Excel dans le header
- Réutiliser `jsPDF`/`autoTable` pour PDF et `xlsx` pour Excel (les deux sont installés)
- Exporter le tableau mensuel avec les totaux annuels

## Fichiers à créer/modifier

| Fichier | Action |
|---|---|
| `src/services/PayrollAccountingService.ts` | Nouveau — génération écritures comptables paie |
| `src/hooks/useSalaryManager.ts` | Modifier `payBulletin` pour appeler le service comptable |
| `src/components/dashboard/modules/accounting/salary/BulletinsList.tsx` | Ajouter bouton PDF + fonction export |
| `src/components/dashboard/modules/accounting/salary/PayrollSummary.tsx` | Ajouter boutons PDF/Excel + fonctions export |
| Migration SQL | Insérer les event_types paie dans `accounting_default_accounts` |

