

# Plan : Module de Gestion des Salaires (Paie)

## Constat

Le paiement des salaires n'est **pas du tout implémenté**. Les données existent partiellement dans la table `personnel` (`salaire_base`, `numero_cnss`, `situation_familiale`, `nombre_enfants`, `statut_contractuel`) mais aucune table de bulletins de paie, aucune interface, aucune écriture comptable liée aux salaires n'existe.

Le plan comptable SYSCOHADA du tenant contient tous les comptes nécessaires :
- **42x** : Personnel (422 Rémunérations dues, 421 Avances/Acomptes, 4281 Congés à payer)
- **43x** : Organismes sociaux (431 Sécurité sociale, 432 Retraite)
- **66x** : Charges de personnel (6611 Salaires, 6612 Primes, 6613 Congés payés)

## Architecture proposée

### 1. Tables Supabase (migration)

**`bulletins_paie`** — Table principale des bulletins de paie mensuels :
| Colonne | Type | Description |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| personnel_id | uuid FK → personnel | |
| periode_mois | integer (1-12) | Mois |
| periode_annee | integer | Année |
| salaire_base | numeric | Salaire de base |
| primes | numeric default 0 | Total primes |
| heures_sup | numeric default 0 | Heures supplémentaires |
| avances | numeric default 0 | Avances déjà versées |
| retenues_cnss_employe | numeric default 0 | Part salariale CNSS |
| retenues_irpp | numeric default 0 | Impôt sur le revenu |
| retenues_autres | numeric default 0 | Autres retenues |
| cotisations_patronales_cnss | numeric default 0 | Part patronale CNSS |
| cotisations_patronales_autres | numeric default 0 | Autres charges patronales |
| salaire_brut | numeric | Calculé : base + primes + heures_sup |
| salaire_net | numeric | Calculé : brut - retenues |
| net_a_payer | numeric | Net - avances |
| statut | text | 'Brouillon', 'Validé', 'Payé' |
| date_paiement | date | Date de règlement effectif |
| mode_paiement | text | Espèces, Virement, Mobile Money |
| reference_paiement | text | Référence du virement |
| notes | text | |
| ecriture_id | uuid FK nullable → ecritures_comptables | Écriture générée |
| created_by_id | uuid FK → personnel | Qui a créé |
| created_at, updated_at | timestamptz | |

+ Contrainte unique `(tenant_id, personnel_id, periode_mois, periode_annee)`
+ RLS : même tenant, rôles Admin/Pharmacien Titulaire

**`parametres_paie`** — Taux configurables par tenant :
| Colonne | Type | Description |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK unique | Un par tenant |
| taux_cnss_employe | numeric default 3.5 | Part salariale CNSS Congo |
| taux_cnss_patronal | numeric default 20.29 | Part patronale CNSS Congo |
| taux_irpp | numeric default 0 | Barème simplifié |
| smic | numeric default 90000 | SMIG Congo |
| created_at, updated_at | timestamptz | |

### 2. Entrée dans le sous-menu Comptabilité

Ajouter `{ name: 'Paie', icon: Users }` dans `subMenus.comptabilite` du sidebar, et le case `'paie'` dans `ComptabiliteModule.tsx` pointant vers un nouveau composant `SalaryManager`.

### 3. Composant principal `SalaryManager.tsx`

Interface avec 3 onglets :
- **Bulletins de paie** : Liste des bulletins par mois/année, filtrable. Bouton "Générer la paie du mois" qui crée un brouillon pour chaque employé actif ayant un `salaire_base`.
- **Paramètres** : Configuration des taux CNSS, IRPP, SMIG.
- **Historique** : Vue consolidée avec totaux mensuels.

### 4. Workflow de paie

1. **Génération** : L'utilisateur clique "Générer paie MM/AAAA" → Pour chaque employé actif avec salaire_base, un bulletin brouillon est créé avec calculs automatiques (CNSS = salaire_brut × taux, IRPP = barème).
2. **Édition** : L'utilisateur peut modifier primes, heures sup, retenues avant validation.
3. **Validation** : Passage du statut à "Validé", les montants deviennent non modifiables.
4. **Paiement** : Enregistrement du paiement effectif + génération automatique de l'écriture comptable SYSCOHADA :
   - **Débit** 6611 (Salaires) = salaire_brut
   - **Débit** 6641 (Charges sociales patronales CNSS) = cotisations_patronales
   - **Crédit** 422 (Rémunérations dues) = salaire_net
   - **Crédit** 431 (Sécurité sociale) = CNSS employé + CNSS patronal
   - **Crédit** 447 ou 4xx (IRPP) = retenue IRPP
   - Puis au règlement : **Débit** 422 / **Crédit** 521 ou 571 (Trésorerie)

### 5. Hook `useSalaryManager.ts`

CRUD bulletins, calculs automatiques, génération batch, génération écritures comptables (réutilisant le pattern existant de `accounting_default_accounts`).

### 6. Fichiers à créer/modifier

| Fichier | Action |
|---|---|
| `supabase/migrations/xxx_salary_tables.sql` | Créer `bulletins_paie` + `parametres_paie` + RLS |
| `src/components/dashboard/modules/accounting/SalaryManager.tsx` | Composant principal (onglets) |
| `src/components/dashboard/modules/accounting/salary/BulletinsList.tsx` | Liste/filtres bulletins |
| `src/components/dashboard/modules/accounting/salary/BulletinForm.tsx` | Formulaire édition bulletin |
| `src/components/dashboard/modules/accounting/salary/BulletinDetail.tsx` | Vue détaillée bulletin |
| `src/components/dashboard/modules/accounting/salary/PayrollSettings.tsx` | Config taux CNSS/IRPP |
| `src/components/dashboard/modules/accounting/salary/PayrollSummary.tsx` | Historique/résumés |
| `src/hooks/useSalaryManager.ts` | Hook principal CRUD + calculs |
| `src/components/dashboard/sidebar/AppSidebar.tsx` | Ajouter entrée "Paie" |
| `src/components/dashboard/modules/ComptabiliteModule.tsx` | Ajouter case 'paie' |

