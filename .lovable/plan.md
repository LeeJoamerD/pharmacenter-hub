
## Plan d’implémentation — Articles manquants du module Comptabilité

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Comptabilité** couvre toutes les fonctionnalités réellement exposées dans l’application :

```text
Comptabilité
├── Tableaux de bord
├── Plan comptable
├── Journalisation
├── Factures
├── Paiements
├── Paie
├── Analytique
├── Fiscal
├── Bancaire
├── Rapports
├── Audit
├── Intégrations
└── Configuration
```

Le format restera identique aux modules précédents : chaque article respectera strictement la structure `GuideArticle` :

```ts
id, title, objective, location, audience, intro,
steps, callouts, bestPractices, faq, related, keywords
```

Le fichier principal à enrichir sera :

```text
src/components/help/guide/content/comptabilite.ts
```

Aucun changement UI n’est requis : les articles seront automatiquement intégrés à la sidebar, à la recherche, aux articles liés et à l’accueil du guide via le registre existant.

---

## 1. État actuel du guide Comptabilité

Le guide actuel contient seulement deux articles :

```text
comptabilite-journaux-ecritures
comptabilite-fiscalite-tva
```

Ces articles seront conservés, enrichis et replacés dans une architecture complète.

---

## 2. Organisation cible du guide Comptabilité

Je restructurerai `comptabiliteModule.sections` en sections fonctionnelles :

```text
Comptabilité
├── Pilotage comptable
├── Plan comptable SYSCOHADA
├── Journalisation et écritures
├── Facturation comptable
├── Paiements et règlements
├── Paie comptable
├── Comptabilité analytique
├── Fiscalité et déclarations
├── Banque et trésorerie
├── États financiers et rapports
├── Audit et sécurité
├── Intégrations système
└── Configuration comptable
```

---

## 3. Convention des identifiants

Tous les nouveaux articles utiliseront le préfixe :

```text
comptabilite-
```

Exemples :

```text
comptabilite-dashboard-vue-ensemble
comptabilite-plan-import-syscohada
comptabilite-journal-workflow-validation
comptabilite-factures-assureurs
comptabilite-fiscal-declaration-g10
comptabilite-bancaire-rapprochement
comptabilite-configuration-numerotation
```

---

## 4. Articles à créer ou enrichir

### A. Pilotage comptable

#### 1. `comptabilite-dashboard-vue-ensemble`
**Titre :** Comprendre le tableau de bord comptable  
**Location :** Comptabilité → Tableaux de bord  
**Couvre :** KPI comptables, recettes, dépenses, résultat, trésorerie, alertes, tâches, période semaine/mois/trimestre/année.  
**Callouts :**
- Info : les indicateurs sont isolés par pharmacie/tenant.
- Warning : la visibilité du dashboard est contrôlée par les permissions.

#### 2. `comptabilite-dashboard-etats-financiers`
**Titre :** Lire les états financiers depuis le dashboard  
**Location :** Comptabilité → Tableaux de bord → États financiers  
**Couvre :** aperçu bilan, compte de résultat, trésorerie, ratios et évolution.

#### 3. `comptabilite-dashboard-analyses`
**Titre :** Exploiter les analyses comptables rapides  
**Location :** Comptabilité → Tableaux de bord → Analyses  
**Couvre :** charges, évolution mensuelle, top clients, CA trimestriel, ratios financiers.

#### 4. `comptabilite-dashboard-taches-alertes`
**Titre :** Suivre les tâches, échéances et alertes comptables  
**Location :** Comptabilité → Tableaux de bord → Tâches  
**Couvre :** tâches en attente, alertes, priorités, échéances fiscales et actions de rafraîchissement.

---

### B. Plan comptable SYSCOHADA

#### 5. `comptabilite-plan-vue-ensemble`
**Titre :** Comprendre le plan comptable SYSCOHADA  
**Location :** Comptabilité → Plan comptable  
**Couvre :** structure OHADA, classes, comptes, soldes débiteurs/créditeurs, comptes actifs/inactifs.

#### 6. `comptabilite-plan-arbre-comptes`
**Titre :** Naviguer dans l’arbre des comptes  
**Location :** Comptabilité → Plan comptable → Arbre des comptes  
**Couvre :** hiérarchie, expansion/repli, recherche, filtre par classe, comptes fiscaux et centime additionnel.

#### 7. `comptabilite-plan-classes-syscohada`
**Titre :** Consulter les classes SYSCOHADA  
**Location :** Comptabilité → Plan comptable → Classes SYSCOHADA  
**Couvre :** classes comptables, regroupements, comptes de bilan, gestion, trésorerie et comptes spécifiques Congo.

#### 8. `comptabilite-plan-comptes-analytiques`
**Titre :** Identifier les comptes analytiques  
**Location :** Comptabilité → Plan comptable → Comptes analytiques  
**Couvre :** comptes marqués analytique, lien avec centres de coûts et répartition.

#### 9. `comptabilite-plan-creation-modification`
**Titre :** Créer ou modifier un compte comptable  
**Location :** Comptabilité → Plan comptable → Nouveau compte  
**Couvre :** code, libellé, classe, type, parent, niveau, actif, analytique, rapprochement.

#### 10. `comptabilite-plan-import-syscohada`
**Titre :** Importer le plan comptable global SYSCOHADA  
**Location :** Comptabilité → Plan comptable → Import global  
**Couvre :** import hiérarchique, structure SYSCOHADA 2025 Congo, comptes 81/82, 572, 358, contrôle avant exploitation.  
**Callouts :**
- Info : l’import utilise la configuration SYSCOHADA révisée adaptée au Congo.
- Warning : vérifier les comptes par défaut avant génération automatique d’écritures.

#### 11. `comptabilite-plan-configuration-regionale`
**Titre :** Configurer les paramètres régionaux du plan comptable  
**Location :** Comptabilité → Plan comptable → Configuration régionale  
**Couvre :** pays, devise, système comptable, longueur de code, mentions légales, organisme de référence.

---

### C. Journalisation et écritures

#### 12. `comptabilite-journaux-ecritures`
**Titre :** Journaux et écritures  
**Action :** enrichir l’article existant.  
**Location :** Comptabilité → Journalisation → Écritures  
**Couvre :** recherche, journal, numéro de pièce, statut, lignes débit/crédit, équilibre.

#### 13. `comptabilite-journal-journaux-types`
**Titre :** Comprendre les journaux comptables  
**Location :** Comptabilité → Journalisation → Journaux  
**Couvre :** Achats, Ventes, Caisse, Banque, Opérations diverses, code journal, usage métier.

#### 14. `comptabilite-journal-creer-ecriture`
**Titre :** Créer une écriture manuelle équilibrée  
**Location :** Comptabilité → Journalisation → Nouvelle écriture  
**Couvre :** journal, date, libellé, référence, lignes, compte, débit, crédit, validation d’équilibre.

#### 15. `comptabilite-journal-workflow-validation`
**Titre :** Valider et verrouiller les écritures  
**Location :** Comptabilité → Journalisation → Workflow  
**Couvre :** brouillon, validation, verrouillage, contrôle, traçabilité, impossibilité de modifier une écriture verrouillée.

#### 16. `comptabilite-journal-lettrage`
**Titre :** Comprendre le lettrage comptable  
**Location :** Comptabilité → Journalisation → Workflow  
**Couvre :** lettrage automatique ou manuel, rapprochement des tiers, cohérence règlements/factures.

#### 17. `comptabilite-journal-generation-automatique`
**Titre :** Comprendre la génération automatique des écritures  
**Location :** Comptabilité → Journalisation  
**Couvre :** ventes, règlements, factures, salaires, clôtures de caisse, comptes par défaut.  
**Callouts :**
- Info : les transactions métier ne sont pas bloquées si la configuration comptable est incomplète.
- Warning : les journaux, exercices et comptes par défaut doivent être configurés avant exploitation réelle.

---

### D. Facturation comptable

#### 18. `comptabilite-factures-vue-ensemble`
**Titre :** Comprendre la facturation comptable  
**Location :** Comptabilité → Factures  
**Couvre :** statistiques, brouillons, factures émises, payées, impayées, en retard.

#### 19. `comptabilite-factures-clients`
**Titre :** Gérer les factures clients  
**Location :** Comptabilité → Factures → Factures Clients  
**Couvre :** création, recherche, filtrage, ventes non facturées, lignes, taxes, PDF, paiement.

#### 20. `comptabilite-factures-assureurs`
**Titre :** Gérer les factures assureurs  
**Location :** Comptabilité → Factures → Factures Assureurs  
**Couvre :** ventes assurées, part assurance, assureur, facturation groupée, suivi règlement.

#### 21. `comptabilite-factures-fournisseurs`
**Titre :** Gérer les factures fournisseurs  
**Location :** Comptabilité → Factures → Factures Fournisseurs  
**Couvre :** réceptions non facturées, fournisseur, TVA déductible, centime additionnel, échéance.

#### 22. `comptabilite-factures-avoirs`
**Titre :** Créer et suivre les avoirs  
**Location :** Comptabilité → Factures → Avoirs  
**Couvre :** facture origine, motif, montants HT/TVA/TTC, statut, impact comptable.

#### 23. `comptabilite-factures-relances`
**Titre :** Suivre les relances de factures  
**Location :** Comptabilité → Factures → Relances  
**Couvre :** facture en retard, type de relance, destinataire, message, historique.

#### 24. `comptabilite-factures-pdf`
**Titre :** Télécharger et imprimer les factures PDF  
**Location :** Comptabilité → Factures  
**Couvre :** génération PDF, lignes de facture, paramètres régionaux, devise, téléchargement.  
**Callouts :**
- Info : les PDF suivent le standard jsPDF du projet.
- Warning : la logique de facturation doit rester cohérente avec le module Ventes.

---

### E. Paiements et règlements

#### 25. `comptabilite-paiements-vue-ensemble`
**Titre :** Comprendre le suivi des paiements  
**Location :** Comptabilité → Paiements  
**Couvre :** total encaissé, paiements en attente, cartes, mobile money, centime additionnel.

#### 26. `comptabilite-paiements-liste`
**Titre :** Consulter tous les paiements  
**Location :** Comptabilité → Paiements → Paiements  
**Couvre :** recherche, numéro de pièce, tiers, montant, mode, référence, statut.

#### 27. `comptabilite-paiements-rapprochement`
**Titre :** Rapprocher les paiements bancaires  
**Location :** Comptabilité → Paiements → Rapprochement bancaire  
**Couvre :** comptes, transactions, éléments rapprochés, suspects, ignorés, validation.

#### 28. `comptabilite-paiements-echeanciers`
**Titre :** Suivre les échéanciers de paiement  
**Location :** Comptabilité → Paiements → Échéanciers  
**Couvre :** échéances à venir, retards, périodicité, statut actif, alertes.

#### 29. `comptabilite-paiements-modes`
**Titre :** Configurer les modes de paiement  
**Location :** Comptabilité → Paiements → Modes de Paiement  
**Couvre :** espèces, carte, virement, mobile money, chèque, modes régionaux.

#### 30. `comptabilite-paiements-regionalisation`
**Titre :** Comprendre les paiements régionalisés  
**Location :** Comptabilité → Paiements  
**Couvre :** devise tenant, formats régionaux, mobile money, centime additionnel.

---

### F. Paie comptable

#### 31. `comptabilite-paie-vue-ensemble`
**Titre :** Comprendre la gestion de la paie  
**Location :** Comptabilité → Paie  
**Couvre :** bulletins, paramètres CNSS/IRPP, historique annuel, paiements salariés.

#### 32. `comptabilite-paie-generer-bulletins`
**Titre :** Générer les bulletins de paie  
**Location :** Comptabilité → Paie → Bulletins de paie  
**Couvre :** mois, année, personnel, salaire brut, net à payer, statut brouillon.

#### 33. `comptabilite-paie-modifier-rubriques`
**Titre :** Modifier les rubriques d’un bulletin  
**Location :** Comptabilité → Paie → Bulletins de paie → Modifier  
**Couvre :** primes imposables, primes non imposables, retenues, TOL, avances, acompte.  
**Callouts :**
- Info : les rubriques dynamiques utilisent des colonnes JSONB.
- Warning : vérifier les rubriques avant validation du bulletin.

#### 34. `comptabilite-paie-valider-payer`
**Titre :** Valider et payer un bulletin  
**Location :** Comptabilité → Paie → Bulletins de paie  
**Couvre :** validation, paiement, mode de paiement, référence, génération d’écriture comptable.

#### 35. `comptabilite-paie-parametres`
**Titre :** Configurer CNSS, IRPP, SMIG et primes par défaut  
**Location :** Comptabilité → Paie → Paramètres  
**Couvre :** CNSS employé, CNSS patronal, IRPP, SMIG, congés payés, TOL, primes.

#### 36. `comptabilite-paie-historique`
**Titre :** Exploiter l’historique annuel de la paie  
**Location :** Comptabilité → Paie → Historique  
**Couvre :** synthèse annuelle, masse brute, net versé, CNSS, IRPP, exports PDF/Excel.

---

### G. Comptabilité analytique

#### 37. `comptabilite-analytique-centres-couts`
**Titre :** Gérer les centres de coûts  
**Location :** Comptabilité → Analytique → Centres de Coûts  
**Couvre :** code, nom, type, responsable, centre parent, objectifs marge/rotation.

#### 38. `comptabilite-analytique-rentabilite`
**Titre :** Analyser la rentabilité analytique  
**Location :** Comptabilité → Analytique → Rentabilité  
**Couvre :** chiffre d’affaires, coûts, marge brute, taux de marge, taux de marque, pagination.

#### 39. `comptabilite-analytique-repartition`
**Titre :** Répartir les charges analytiques  
**Location :** Comptabilité → Analytique → Répartition  
**Couvre :** allocation de charges, lignes de répartition, validation, coefficients.

#### 40. `comptabilite-analytique-cles-repartition`
**Titre :** Configurer les clés et coefficients de répartition  
**Location :** Comptabilité → Analytique → Répartition  
**Couvre :** clés, coefficients, règles automatiques, modification et suppression contrôlée.

#### 41. `comptabilite-analytique-budgets`
**Titre :** Créer et suivre les budgets analytiques  
**Location :** Comptabilité → Analytique → Budgets  
**Couvre :** période, exercice, montant prévu, montant réalisé, validation, alertes.

#### 42. `comptabilite-analytique-tableaux-bord`
**Titre :** Lire les tableaux de bord analytiques  
**Location :** Comptabilité → Analytique → Tableaux de Bord  
**Couvre :** KPIs, performance centres, écarts, meilleurs centres, points d’attention.

#### 43. `comptabilite-analytique-exports`
**Titre :** Exporter les rapports analytiques  
**Location :** Comptabilité → Analytique  
**Couvre :** export PDF, export Excel, rentabilité, budgets, centres de coûts.

---

### H. Fiscalité et déclarations

#### 44. `comptabilite-fiscalite-tva`
**Titre :** Fiscalité et TVA  
**Action :** enrichir l’article existant.  
**Location :** Comptabilité → Fiscal → TVA  
**Couvre :** TVA collectée, TVA déductible, TVA à payer, taux moyen, centime additionnel.

#### 45. `comptabilite-fiscal-taux-tva`
**Titre :** Configurer les taux de TVA  
**Location :** Comptabilité → Fiscal → TVA  
**Couvre :** création, modification, suppression, taux normal/réduit, période d’application.

#### 46. `comptabilite-fiscal-declarations`
**Titre :** Créer et suivre les déclarations fiscales  
**Location :** Comptabilité → Fiscal → Déclarations  
**Couvre :** période, brouillon, dépôt, paiement, statut, justificatifs.

#### 47. `comptabilite-fiscal-obligations`
**Titre :** Suivre les obligations fiscales  
**Location :** Comptabilité → Fiscal → Obligations  
**Couvre :** échéances, retards, obligations récurrentes, priorisation.

#### 48. `comptabilite-fiscal-conformite`
**Titre :** Piloter la conformité fiscale  
**Location :** Comptabilité → Fiscal → Conformité  
**Couvre :** score global, contrôles, points à corriger, suivi réglementaire.

#### 49. `comptabilite-fiscal-rapports`
**Titre :** Générer les rapports fiscaux  
**Location :** Comptabilité → Fiscal → Rapports  
**Couvre :** journal TVA PDF, état TVA Excel, annexe fiscale PDF, export.

#### 50. `comptabilite-fiscal-declaration-g10`
**Titre :** Préparer la déclaration mensuelle G n°10 Congo  
**Location :** Comptabilité → Fiscal → Rapports  
**Couvre :** TVA, centimes additionnels, ASDI, déclaration néant, échéance du 20.  
**Callouts :**
- Warning : la déclaration G10 doit utiliser les montants réels stockés, sans recalcul client.
- Info : net à payer = TVA due + centimes additionnels - ASDI payé.

#### 51. `comptabilite-fiscal-parametres`
**Titre :** Configurer les paramètres fiscaux  
**Location :** Comptabilité → Fiscal → Paramètres  
**Couvre :** régime TVA, fréquence, archivage, règles locales, devise.

---

### I. Banque et trésorerie

#### 52. `comptabilite-bancaire-comptes`
**Titre :** Gérer les comptes bancaires  
**Location :** Comptabilité → Bancaire → Comptes  
**Couvre :** banque, compte, solde, statut actif, synchronisation, création/modification.

#### 53. `comptabilite-bancaire-transactions`
**Titre :** Consulter les transactions bancaires  
**Location :** Comptabilité → Bancaire → Transactions  
**Couvre :** recherche, filtres compte/statut/date, pagination, tri, détail transaction.

#### 54. `comptabilite-bancaire-import-releve`
**Titre :** Importer un relevé bancaire  
**Location :** Comptabilité → Bancaire → Transactions  
**Couvre :** import, mapping, contrôle, catégorisation, rapprochement potentiel.

#### 55. `comptabilite-bancaire-rapprochement`
**Titre :** Réaliser un rapprochement bancaire  
**Location :** Comptabilité → Bancaire → Rapprochement bancaire  
**Couvre :** transactions rapprochées, à rapprocher, écart total, validation, historique.

#### 56. `comptabilite-bancaire-categorisation`
**Titre :** Catégoriser les transactions bancaires  
**Location :** Comptabilité → Bancaire → Transactions  
**Couvre :** catégorie, règle automatique, affectation comptable, modification.

#### 57. `comptabilite-bancaire-tresorerie`
**Titre :** Suivre la trésorerie  
**Location :** Comptabilité → Bancaire → Trésorerie  
**Couvre :** solde total, entrées, sorties, flux net, graphique de cash-flow.

#### 58. `comptabilite-bancaire-previsions`
**Titre :** Construire les prévisions de trésorerie  
**Location :** Comptabilité → Bancaire → Prévisions  
**Couvre :** scénarios, engagements, échéances, tendances.

#### 59. `comptabilite-bancaire-configuration`
**Titre :** Configurer l’intégration bancaire  
**Location :** Comptabilité → Bancaire → Configuration  
**Couvre :** paramètres, règles de rapprochement, règles de catégorisation, synchronisation.

---

### J. États financiers et rapports

#### 60. `comptabilite-rapports-bilan`
**Titre :** Lire et exporter le bilan OHADA  
**Location :** Comptabilité → Rapports → Bilan  
**Couvre :** actif, passif, synthèse/détails, exercice, export PDF/Excel.

#### 61. `comptabilite-rapports-resultat`
**Titre :** Lire le compte de résultat OHADA  
**Location :** Comptabilité → Rapports → Compte de Résultat  
**Couvre :** produits, charges, résultat d’exploitation, résultat financier, résultat net.

#### 62. `comptabilite-rapports-flux-tresorerie`
**Titre :** Analyser les flux de trésorerie  
**Location :** Comptabilité → Rapports → Flux de Trésorerie  
**Couvre :** exploitation, investissement, financement, variation de trésorerie.

#### 63. `comptabilite-rapports-ratios`
**Titre :** Interpréter les ratios financiers  
**Location :** Comptabilité → Rapports → Ratios  
**Couvre :** rentabilité, liquidité, solvabilité, ratios clés.

#### 64. `comptabilite-rapports-annexes`
**Titre :** Produire les états annexes  
**Location :** Comptabilité → Rapports → États Annexes  
**Couvre :** annexes, amortissements, provisions, créances, dettes.

#### 65. `comptabilite-rapports-tableaux-specialises`
**Titre :** Utiliser les tableaux annexes spécialisés  
**Location :** Comptabilité → Rapports → États Annexes  
**Couvre :** amortissements, provisions, créances, dettes, pièces justificatives.

#### 66. `comptabilite-rapports-export`
**Titre :** Exporter les états financiers  
**Location :** Comptabilité → Rapports  
**Couvre :** PDF, Excel, exercice, devise, conformité SYSCOHADA.

---

### K. Audit et sécurité

#### 67. `comptabilite-audit-pistes`
**Titre :** Consulter les pistes d’audit  
**Location :** Comptabilité → Audit → Pistes d’Audit  
**Couvre :** utilisateur, action, table, enregistrement, IP, statut, filtres, export CSV.

#### 68. `comptabilite-audit-securite`
**Titre :** Suivre les alertes de sécurité comptable  
**Location :** Comptabilité → Audit → Sécurité  
**Couvre :** alertes, gravité, résolution, scan sécurité, contrôles.

#### 69. `comptabilite-audit-permissions`
**Titre :** Vérifier les permissions comptables  
**Location :** Comptabilité → Audit → Permissions  
**Couvre :** accès, sessions, utilisateurs, séparation des responsabilités.

#### 70. `comptabilite-audit-conformite`
**Titre :** Contrôler la conformité comptable  
**Location :** Comptabilité → Audit → Conformité  
**Couvre :** contrôles, statut, échéances, corrections.

#### 71. `comptabilite-audit-sauvegarde`
**Titre :** Suivre les sauvegardes comptables  
**Location :** Comptabilité → Audit → Sauvegarde  
**Couvre :** sauvegardes, statut, historique, création manuelle.

#### 72. `comptabilite-audit-rapports`
**Titre :** Générer les rapports d’audit  
**Location :** Comptabilité → Audit → Rapports  
**Couvre :** audit complet, connexions, conformité, risques, PDF.

---

### L. Intégrations système

#### 73. `comptabilite-integrations-modules`
**Titre :** Synchroniser les modules internes  
**Location :** Comptabilité → Intégrations → Modules Internes  
**Couvre :** stock, ventes, personnel, partenaires, auto-sync, dernière synchronisation.

#### 74. `comptabilite-integrations-externes`
**Titre :** Configurer les intégrations externes  
**Location :** Comptabilité → Intégrations → Intégrations Externes  
**Couvre :** banque, comptabilité, taxe, social, ERP, test de connexion.

#### 75. `comptabilite-integrations-fec`
**Titre :** Générer l’export FEC  
**Location :** Comptabilité → Intégrations → Export FEC  
**Couvre :** période, format TXT/XLSX/XML, analytique, téléchargement, suppression.

#### 76. `comptabilite-integrations-api-webhooks`
**Titre :** Configurer API et webhooks comptables  
**Location :** Comptabilité → Intégrations → API & Webhooks  
**Couvre :** URL, événements, retry, timeout, test, sécurité.

#### 77. `comptabilite-integrations-monitoring`
**Titre :** Surveiller les synchronisations comptables  
**Location :** Comptabilité → Intégrations  
**Couvre :** statuts, erreurs, dernière sync, relance manuelle, logs.

---

### M. Configuration comptable

#### 78. `comptabilite-configuration-generale`
**Titre :** Configurer les paramètres généraux comptables  
**Location :** Comptabilité → Configuration → Général  
**Couvre :** plan OHADA, lettrage automatique, TVA synchronisée, centime additionnel.

#### 79. `comptabilite-configuration-exercices`
**Titre :** Gérer les exercices comptables  
**Location :** Comptabilité → Configuration → Exercices  
**Couvre :** création, dates, statut ouvert/fermé, modification, suppression.

#### 80. `comptabilite-configuration-entreprise`
**Titre :** Renseigner les informations de l’entreprise  
**Location :** Comptabilité → Configuration → Entreprise  
**Couvre :** informations légales, coordonnées, identification, données reprises dans les exports.

#### 81. `comptabilite-configuration-journaux`
**Titre :** Configurer les journaux comptables  
**Location :** Comptabilité → Configuration → Journaux  
**Couvre :** code, type, libellé, description, actif/inactif, génération automatique.

#### 82. `comptabilite-configuration-numerotation`
**Titre :** Configurer les règles de numérotation  
**Location :** Comptabilité → Configuration → Numérotation  
**Couvre :** factures, avoirs, pièces comptables, variables, remise à zéro, aperçu.

#### 83. `comptabilite-configuration-devises`
**Titre :** Gérer les devises et taux de change  
**Location :** Comptabilité → Configuration → Devises  
**Couvre :** devise de base, devise active, taux, date, mise à jour automatique.

#### 84. `comptabilite-configuration-comptes-defaut`
**Titre :** Vérifier les comptes par défaut  
**Location :** Comptabilité → Configuration  
**Couvre :** comptes de ventes, achats, caisse, banque, salaires, CNSS, tiers.  
**Callouts :**
- Warning : une configuration manquante peut empêcher la génération automatique correcte des écritures.
- Info : les écritures métiers s’appuient sur `accounting_default_accounts`.

---

## 5. Règles métier à intégrer dans les articles

Les callouts et bonnes pratiques intégreront les règles existantes du projet :

- **SYSCOHADA 2025 Congo** : comptes 81/82, 572, 358, structure OHADA révisée.
- **Génération automatique** : ventes, règlements, factures, salaires et clôtures caisse génèrent des écritures si la configuration est complète.
- **Débit/crédit** : une écriture manuelle doit toujours être équilibrée.
- **Fiscalité Congo** : TVA, centimes additionnels, ASDI et déclaration G n°10.
- **Source de vérité G10** : utiliser les montants stockés en ventes/réceptions, sans recalcul client.
- **Paie** : rubriques dynamiques via JSONB, CNSS, IRPP, TOL, primes et retenues.
- **Facturation** : cohérence entre module Ventes et module Comptabilité.
- **PDF/Excel** : exports financiers et fiscaux doivent respecter devise et format régional.
- **Multi-tenant/RLS** : toutes les données comptables restent isolées par pharmacie.
- **Audit** : actions sensibles, écritures, exports et rapprochements doivent rester traçables.
- **Rôles** : ne jamais stocker les rôles sur profils ou utilisateurs ; utiliser une table dédiée.
- **Arrondis FCFA** : les montants doivent respecter les standards de rounding du projet.

---

## 6. Maillage des articles liés

Je relierai les articles pour guider l’utilisateur entre les workflows dépendants.

Exemples :

```text
comptabilite-dashboard-vue-ensemble
→ comptabilite-rapports-bilan
→ comptabilite-fiscal-declarations
→ comptabilite-audit-pistes

comptabilite-plan-import-syscohada
→ comptabilite-configuration-comptes-defaut
→ comptabilite-journal-generation-automatique

comptabilite-journal-creer-ecriture
→ comptabilite-journal-workflow-validation
→ comptabilite-audit-pistes

comptabilite-factures-clients
→ comptabilite-paiements-liste
→ comptabilite-journal-generation-automatique

comptabilite-fiscalite-tva
→ comptabilite-fiscal-declaration-g10
→ comptabilite-rapports-annexes

comptabilite-bancaire-rapprochement
→ comptabilite-paiements-rapprochement
→ comptabilite-audit-rapports

comptabilite-paie-generer-bulletins
→ comptabilite-paie-parametres
→ comptabilite-journal-generation-automatique
```

---

## 7. Étapes d’implémentation proposées

### Étape 1 — Restructuration du fichier Comptabilité

Modifier :

```text
src/components/help/guide/content/comptabilite.ts
```

Créer les 13 sections cibles et replacer les 2 articles existants.

---

### Étape 2 — Articles comptables fondamentaux

Ajouter les articles sur :

- tableau de bord ;
- plan comptable ;
- journalisation ;
- génération automatique ;
- configuration des comptes de base.

---

### Étape 3 — Articles financiers opérationnels

Ajouter les articles sur :

- factures clients, assureurs, fournisseurs ;
- avoirs et relances ;
- paiements ;
- rapprochement ;
- échéanciers.

---

### Étape 4 — Articles fiscalité, paie et analytique

Ajouter les articles sur :

- TVA ;
- G n°10 Congo ;
- obligations fiscales ;
- paie ;
- CNSS/IRPP ;
- comptabilité analytique ;
- budgets et répartitions.

---

### Étape 5 — Articles banque, rapports, audit et intégrations

Ajouter les articles sur :

- comptes bancaires ;
- transactions ;
- trésorerie ;
- prévisions ;
- états financiers OHADA ;
- audit ;
- sécurité ;
- FEC ;
- API/webhooks.

---

### Étape 6 — Recherche et mots-clés

Chaque article recevra 3 à 5 mots-clés ciblés :

```text
SYSCOHADA, OHADA, plan comptable, compte, classe
journal, écriture, débit, crédit, validation
facture, avoir, relance, paiement, tiers
TVA, centime additionnel, G10, ASDI, déclaration
paie, CNSS, IRPP, bulletin, salaire
banque, rapprochement, trésorerie, transaction
bilan, résultat, ratios, annexes, export
audit, sécurité, conformité, sauvegarde
configuration, exercice, numérotation, devise
```

---

### Étape 7 — Vérifications après implémentation

Après implémentation, je vérifierai :

1. Le build TypeScript/Vite.
2. Le respect strict du type `GuideArticle`.
3. L’affichage des 13 sections dans la sidebar du guide.
4. La recherche full-text sur les nouveaux articles.
5. Le fonctionnement des `related[]`.
6. L’absence de références LodgeSoft ou PharmaCenter.
7. La cohérence des `location` avec les sous-modules réels.
8. La lisibilité en mode fenêtre et panneau latéral.
9. La couverture complète des onglets réels du module Comptabilité.
10. L’absence de doublons d’identifiants.

---

## Résultat attendu

Le module **Comptabilité** du Guide Utilisateur passera de 2 articles partiels à environ **84 articles structurés**, couvrant toutes les fonctionnalités visibles dans l’application :

- tableau de bord comptable ;
- plan comptable SYSCOHADA ;
- journaux et écritures ;
- factures ;
- paiements ;
- paie ;
- analytique ;
- fiscalité ;
- banque ;
- états financiers ;
- audit ;
- intégrations ;
- configuration.

Le guide deviendra une documentation utilisateur complète pour les comptables, pharmaciens titulaires, administrateurs, responsables financiers et auditeurs PharmaSoft.
