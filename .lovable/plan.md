
## Plan d’implémentation — Articles manquants du module Ventes

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Ventes** couvre toutes les fonctionnalités réellement exposées dans l’application :

```text
Ventes
├── Tableau de bord ventes
├── Caisses
├── Point de Vente
├── Encaissements
├── Historique
├── Retours
├── Facturation
├── Analytics
├── Crédit
├── Promotions
├── Configuration
└── Dépenses
```

Le format restera identique aux modules précédents : chaque article respectera la structure `GuideArticle` avec :

```ts
id, title, objective, location, audience, intro,
steps, callouts, bestPractices, faq, related, keywords
```

Le fichier principal à enrichir sera :

```text
src/components/help/guide/content/ventes.ts
```

Aucun changement UI n’est requis : les nouveaux articles seront automatiquement intégrés à la sidebar, la recherche, la page d’accueil du guide et les articles liés via `registry.ts`.

---

## 1. État actuel du guide Ventes

Le guide actuel contient seulement deux articles :

```text
ventes-point-de-vente
ventes-retours
```

Ces articles seront conservés, enrichis et replacés dans une architecture complète.

---

## 2. Organisation cible du guide Ventes

Je restructurerai `ventesModule.sections` en sections fonctionnelles :

```text
Ventes
├── Pilotage des ventes
├── Caisses et sessions
├── Point de vente
├── Encaissements
├── Historique des transactions
├── Retours et échanges
├── Facturation client
├── Analytics ventes
├── Crédit client
├── Promotions et fidélité
├── Dépenses de caisse
└── Configuration ventes
```

---

## 3. Convention des identifiants

Tous les nouveaux articles utiliseront le préfixe :

```text
ventes-
```

Exemples :

```text
ventes-dashboard-vue-ensemble
ventes-caisses-sessions
ventes-pos-proforma
ventes-encaissements-rapports
ventes-credit-echeanciers
ventes-promotions-recompenses
ventes-configuration-impression
```

---

## 4. Articles à créer ou enrichir

### A. Pilotage des ventes

#### 1. `ventes-dashboard-vue-ensemble`
**Titre :** Comprendre le tableau de bord Ventes  
**Location :** Ventes  
**Couvre :**
- CA journalier ;
- nombre de transactions ;
- panier moyen ;
- objectif mensuel ;
- évolution par rapport à hier ;
- visibilité du dashboard.

**Callouts :**
- Info : les métriques sont filtrées par pharmacie/tenant.
- Warning : l’affichage du dashboard est contrôlé par les permissions.

---

#### 2. `ventes-dashboard-caisses`
**Titre :** Lire l’état des caisses depuis le dashboard  
**Location :** Ventes  
**Couvre :**
- caisses ouvertes/fermées ;
- session active ;
- agent ou caissier associé ;
- montant courant ;
- dernière transaction ;
- absence de caisse configurée.

---

#### 3. `ventes-dashboard-actions-rapides`
**Titre :** Utiliser les actions rapides des ventes  
**Location :** Ventes  
**Couvre :**
- Nouvelle vente ;
- Encaissement ;
- Retour ;
- Rapports ;
- navigation interne vers les sous-modules.

**Callouts :**
- Info : la navigation doit rester interne au Dashboard via le contexte de navigation.
- Tip : utiliser les actions rapides pendant les heures de forte affluence.

---

#### 4. `ventes-dashboard-transactions-recentes`
**Titre :** Consulter les transactions récentes  
**Location :** Ventes  
**Couvre :**
- liste paginée des ventes récentes ;
- détail transaction ;
- réimpression de reçu ;
- annulation de vente ;
- mode de paiement ;
- client et agent.

**Callouts :**
- Warning : une annulation influence les rapports de ventes et le suivi caisse.
- Info : les reçus respectent la configuration d’impression du tenant.

---

### B. Caisses et sessions

#### 5. `ventes-caisses-vue-ensemble`
**Titre :** Comprendre la gestion des caisses  
**Location :** Ventes → Caisses  
**Couvre :**
- sessions actives ;
- solde actuel ;
- caisses disponibles ;
- mouvements ;
- alertes d’absence de session ouverte.

---

#### 6. `ventes-caisses-ouverture-session`
**Titre :** Ouvrir une session de caisse  
**Location :** Ventes → Caisses → Sessions  
**Couvre :**
- choix caisse ;
- type de session Matin/Midi/Soir ;
- fonds de caisse d’ouverture ;
- agent ou caissier ;
- validation.

**Callouts :**
- Warning : une vente en mode non séparé nécessite une session ouverte.
- Tip : ouvrir une session par période facilite le rapprochement.

---

#### 7. `ventes-caisses-fermeture-session`
**Titre :** Fermer une session de caisse  
**Location :** Ventes → Caisses → Historique / Fermeture  
**Couvre :**
- sélection d’une session ouverte ;
- montant théorique ;
- montant réel ;
- écarts ;
- total ventes ;
- total bons non encaissés ;
- marge et marque ;
- clôture.

**Callouts :**
- Info : les métriques de clôture sont persistées dans `sessions_caisse`.
- Warning : vérifier les écarts avant validation définitive.

---

#### 8. `ventes-caisses-gestion-caisses`
**Titre :** Gérer les caisses disponibles  
**Location :** Ventes → Caisses → Caisses  
**Couvre :**
- liste des caisses ;
- création ou modification ;
- statut ;
- association aux sessions ;
- suivi des points de vente.

---

#### 9. `ventes-caisses-historique-sessions`
**Titre :** Consulter l’historique des sessions  
**Location :** Ventes → Caisses → Historique  
**Couvre :**
- filtres ;
- pagination ;
- caissier ;
- caisse ;
- dates ;
- statut ;
- total solde ;
- export Excel/PDF.

---

#### 10. `ventes-caisses-rapports-session`
**Titre :** Exploiter les rapports de session  
**Location :** Ventes → Caisses → Rapports  
**Couvre :**
- rapport par session ;
- ventes ;
- encaissements ;
- bons non encaissés ;
- mouvements ;
- impression/export.

---

#### 11. `ventes-caisses-mouvements`
**Titre :** Enregistrer les mouvements de caisse  
**Location :** Ventes → Caisses  
**Couvre :**
- entrée ;
- sortie ;
- motif ;
- montant ;
- justification ;
- impact sur le solde.

**Callouts :**
- Warning : un mouvement de caisse doit toujours être justifié.
- Info : les mouvements contribuent au rapprochement de fermeture.

---

### C. Point de vente

#### 12. `ventes-point-de-vente`
**Titre :** Réaliser une vente au Point de Vente  
**Location :** Ventes → Point de Vente → Vente  
**Action :** enrichir l’article existant.  
**Couvre :**
- recherche produit ;
- scan code-barres ;
- ajout panier ;
- sélection client ;
- calcul HT/TVA/TTC ;
- assurance ;
- remise ;
- paiement simple ;
- impression.

**Callouts :**
- Info : le POS utilise les lots comme source de vérité pour les prix et le stock.
- Warning : le stock insuffisant bloque l’ajout au panier.

---

#### 13. `ventes-pos-scanner-code-barres`
**Titre :** Utiliser le lecteur de codes-barres  
**Location :** Ventes → Point de Vente  
**Couvre :**
- scan douchette ;
- recherche par code-barres ;
- ajout automatique ;
- normalisation clavier ;
- produit introuvable.

**Callouts :**
- Tip : scanner les produits réduit les erreurs de saisie.
- Info : le POS est optimisé pour les lecteurs physiques rapides.

---

#### 14. `ventes-pos-recherche-produits`
**Titre :** Rechercher les produits au POS  
**Location :** Ventes → Point de Vente → Recherche produits  
**Couvre :**
- recherche serveur ;
- pagination ;
- disponibilité ;
- lots valides ;
- expiration ;
- prix TTC ;
- produit sans stock.

**Callouts :**
- Info : les lots expirés ou invalides ne doivent pas être utilisés pour la vente.
- Warning : vérifier le lot pour les produits sensibles.

---

#### 15. `ventes-pos-selection-lots`
**Titre :** Sélectionner les lots de vente  
**Location :** Ventes → Point de Vente → Sélection lot  
**Couvre :**
- sélection lot ;
- quantité disponible ;
- date de péremption ;
- prix du lot ;
- traçabilité ;
- FIFO/FEFO selon la politique.

---

#### 16. `ventes-pos-panier`
**Titre :** Gérer le panier de vente  
**Location :** Ventes → Point de Vente → Panier  
**Couvre :**
- modification quantité ;
- suppression ligne ;
- vidage panier ;
- prix unitaire ;
- total ligne ;
- nombre d’articles.

---

#### 17. `ventes-pos-modification-prix`
**Titre :** Modifier un prix à la vente  
**Location :** Ventes → Point de Vente → Panier  
**Couvre :**
- option `allowPriceEditAtSale` ;
- ouverture du dialogue de prix ;
- validation ;
- impact sur les totaux ;
- contrôle des droits.

**Callouts :**
- Warning : la modification de prix doit rester contrôlée par permission et configuration.
- Info : les montants FCFA respectent les règles d’arrondi du projet.

---

#### 18. `ventes-pos-client`
**Titre :** Sélectionner le client au POS  
**Location :** Ventes → Point de Vente → Client  
**Couvre :**
- client ordinaire ;
- conventionné ;
- entreprise ;
- personnel ;
- téléphone/email ;
- remise automatique ;
- crédit/caution.

---

#### 19. `ventes-pos-assurance`
**Titre :** Appliquer une couverture assurance  
**Location :** Ventes → Point de Vente → Client / Assurance  
**Couvre :**
- assureur ;
- numéro assurance ;
- taux de couverture ;
- part assurance ;
- part client ;
- bascule Agent / Ayant Droit.

**Callouts :**
- Info : les taux Agent et Ayant Droit recalculent instantanément les parts patient/assureur.
- Warning : vérifier la couverture avant validation.

---

#### 20. `ventes-pos-ticket-moderateur`
**Titre :** Comprendre le ticket modérateur et les remises  
**Location :** Ventes → Point de Vente → Totaux  
**Couvre :**
- remise automatique ;
- ticket modérateur ;
- part client ;
- part assurance ;
- total à payer.

---

#### 21. `ventes-pos-paiement-simple`
**Titre :** Encaisser une vente en paiement simple  
**Location :** Ventes → Point de Vente → Paiement simple  
**Couvre :**
- espèces ;
- carte ;
- mobile money ;
- assurance ;
- montant reçu ;
- rendu monnaie ;
- référence paiement ;
- impression reçu.

---

#### 22. `ventes-pos-paiement-fractionne`
**Titre :** Encaisser une vente en paiement fractionné  
**Location :** Ventes → Point de Vente → Paiement fractionné  
**Couvre :**
- répartition du total ;
- plusieurs moyens de paiement ;
- validation des montants ;
- contrôle du solde restant ;
- finalisation.

---

#### 23. `ventes-pos-mode-separe-vente`
**Titre :** Utiliser le mode Vente seule  
**Location :** Ventes → Point de Vente → Vente seule  
**Couvre :**
- séparation Vente/Caisse ;
- création d’une vente sans encaissement immédiat ;
- choix session ouverte ;
- génération ticket de vente ;
- transaction en attente d’encaissement.

**Callouts :**
- Info : le mode séparé est activé dans Configuration Ventes → Général.
- Warning : la vente seule ne remplace pas l’encaissement.

---

#### 24. `ventes-pos-mode-separe-encaissement`
**Titre :** Encaisser les ventes en attente  
**Location :** Ventes → Point de Vente → Encaissement  
**Couvre :**
- ventes en attente ;
- sélection session ;
- recherche par numéro ;
- paiement ;
- restriction au caissier assigné ;
- impression reçu.

**Callouts :**
- Warning : seuls les profils autorisés ou le caissier assigné peuvent encaisser.
- Info : les transactions retournées ou orphelines sont filtrées pour éviter les blocages.

---

#### 25. `ventes-pos-proforma`
**Titre :** Créer une facture proforma depuis le POS  
**Location :** Ventes → Point de Vente → Proforma  
**Couvre :**
- recherche catalogue ;
- ajout panier ;
- client optionnel ;
- validité ;
- notes ;
- génération PDF ;
- liste des proformas.

**Callouts :**
- Info : une proforma utilise le catalogue global sans déduction immédiate du stock.
- Warning : la sortie de stock intervient uniquement lors de la conversion en vente réelle.

---

#### 26. `ventes-pos-proformas-liste`
**Titre :** Consulter les proformas existantes  
**Location :** Ventes → Point de Vente → Proforma → Voir les proformas  
**Couvre :**
- liste ;
- statut ;
- client ;
- montant ;
- conversion éventuelle ;
- impression ou consultation.

---

#### 27. `ventes-pos-ordonnance`
**Titre :** Associer une ordonnance à une vente  
**Location :** Ventes → Point de Vente → Ordonnance  
**Couvre :**
- ouverture du modal ordonnance ;
- informations patient ;
- références ordonnance ;
- produits prescrits ;
- lien avec la vente.

---

#### 28. `ventes-pos-produit-demande`
**Titre :** Enregistrer un produit demandé  
**Location :** Ventes → Point de Vente → Produit demandé  
**Couvre :**
- produit absent ou non trouvé ;
- demande client ;
- quantité souhaitée ;
- commentaire ;
- exploitation future pour stock/approvisionnement.

---

#### 29. `ventes-pos-mise-en-detail`
**Titre :** Fractionner une unité de vente  
**Location :** Ventes → Point de Vente → Mise en détail  
**Couvre :**
- produit éligible ;
- conversion boîte/plaquette/unité ;
- décrément produit source ;
- incrément produit détail ;
- invalidation cache stock.

**Callouts :**
- Warning : le fractionnement modifie le stock en temps réel.
- Info : l’action est disponible pour les produits configurés avec un niveau de détail compatible.

---

#### 30. `ventes-pos-fidelite`
**Titre :** Utiliser la fidélité au POS  
**Location :** Ventes → Point de Vente → Fidélité  
**Couvre :**
- consultation points ;
- application récompense ;
- calcul points gagnés ;
- remise fidélité ;
- historique client.

---

#### 31. `ventes-pos-analytiques`
**Titre :** Lire les analytiques intégrées du POS  
**Location :** Ventes → Point de Vente → Analytiques  
**Couvre :**
- ventes POS ;
- performance ;
- panier moyen ;
- modes de paiement ;
- tendances rapides.

---

### D. Encaissements

#### 32. `ventes-encaissements-vue-ensemble`
**Titre :** Comprendre le dashboard Encaissements  
**Location :** Ventes → Encaissements  
**Couvre :**
- total aujourd’hui ;
- total semaine ;
- total mois ;
- panier moyen ;
- comparaison avec hier.

---

#### 33. `ventes-encaissements-transactions`
**Titre :** Consulter les transactions encaissées  
**Location :** Ventes → Encaissements → Transactions  
**Couvre :**
- recherche ;
- filtres ;
- pagination ;
- mode paiement ;
- statut ;
- détail transaction ;
- export CSV/Excel/PDF.

---

#### 34. `ventes-encaissements-resume`
**Titre :** Lire le résumé des encaissements  
**Location :** Ventes → Encaissements → Résumé  
**Couvre :**
- ventilation par paiement ;
- évolution des ventes ;
- synthèse de période ;
- tendances.

---

#### 35. `ventes-encaissements-rapports`
**Titre :** Générer les rapports d’encaissement  
**Location :** Ventes → Encaissements → Rapports  
**Couvre :**
- rapport journalier ;
- hebdomadaire ;
- mensuel ;
- fiscal ;
- téléchargement/export.

**Callouts :**
- Info : les montants respectent la devise et les paramètres régionaux du tenant.
- Warning : les rapports fiscaux doivent rester cohérents avec Comptabilité/SYSCOHADA.

---

### E. Historique des transactions

#### 36. `ventes-historique-liste`
**Titre :** Consulter la liste des transactions  
**Location :** Ventes → Historique → Liste  
**Couvre :**
- recherche ;
- filtres avancés ;
- tri date/montant/référence ;
- pagination ;
- détail ;
- annulation ;
- export Excel/PDF.

---

#### 37. `ventes-historique-filtres`
**Titre :** Filtrer l’historique des ventes  
**Location :** Ventes → Historique → Liste → Filtres  
**Couvre :**
- période ;
- mode de paiement ;
- statut ;
- caissier ;
- caisse ;
- montant minimum/maximum ;
- recherche texte.

---

#### 38. `ventes-historique-details`
**Titre :** Lire le détail d’une transaction  
**Location :** Ventes → Historique → Liste → Détails  
**Couvre :**
- lignes de vente ;
- client ;
- agent ;
- caisse ;
- paiement ;
- taxes ;
- remises ;
- statut.

---

#### 39. `ventes-historique-analyses`
**Titre :** Analyser l’historique des ventes  
**Location :** Ventes → Historique → Analyses  
**Couvre :**
- évolution des ventes ;
- méthodes de paiement ;
- performance caissier ;
- performance caisse ;
- distribution horaire.

---

#### 40. `ventes-historique-timeline`
**Titre :** Suivre la timeline des transactions  
**Location :** Ventes → Historique → Timeline  
**Couvre :**
- chronologie ;
- événements ;
- ventes récentes ;
- consultation rapide ;
- anomalies.

---

#### 41. `ventes-historique-rapports`
**Titre :** Exporter les rapports d’historique  
**Location :** Ventes → Historique → Rapports  
**Couvre :**
- PDF ;
- Excel ;
- période ;
- filtres appliqués ;
- usage comptable ou managérial.

---

### F. Retours et échanges

#### 42. `ventes-retours`
**Titre :** Traiter les retours et avoirs  
**Location :** Ventes → Retours  
**Action :** enrichir l’article existant.  
**Couvre :**
- recherche transaction origine ;
- sélection articles ;
- quantité retournée ;
- état produit ;
- taux de remboursement ;
- motif ;
- validation.

**Callouts :**
- Warning : un retour validé influence stock, caisse, rapports et comptabilité.
- Info : le traitement final est atomique via la logique de retour centralisée.

---

#### 43. `ventes-retours-nouveau`
**Titre :** Créer une demande de retour  
**Location :** Ventes → Retours → Nouveau Retour  
**Couvre :**
- numéro transaction ;
- recherche ;
- sélection lignes ;
- raison globale ;
- motif par article ;
- notes ;
- soumission.

---

#### 44. `ventes-retours-attente`
**Titre :** Valider ou rejeter les retours en attente  
**Location :** Ventes → Retours → Retours en Attente  
**Couvre :**
- liste des retours ;
- statut ;
- approbation ;
- rejet ;
- notes de validation ;
- contrôle responsable.

---

#### 45. `ventes-retours-traitement`
**Titre :** Finaliser le traitement d’un retour  
**Location :** Ventes → Retours → Traitement  
**Couvre :**
- retour approuvé ;
- remboursement ;
- remise en stock ou non ;
- impact financier ;
- clôture du retour.

**Callouts :**
- Warning : les retours intégraux peuvent supprimer la transaction d’origine après détachement sécurisé des liens.
- Info : les transactions sans lignes sont filtrées pour préserver les clôtures de caisse.

---

#### 46. `ventes-retours-historique`
**Titre :** Consulter l’historique des retours  
**Location :** Ventes → Retours → Historique  
**Couvre :**
- filtres ;
- statut ;
- client ;
- transaction origine ;
- montant ;
- export Excel/PDF.

---

### G. Facturation client

#### 47. `ventes-facturation-vue-ensemble`
**Titre :** Comprendre la facturation client  
**Location :** Ventes → Facturation  
**Couvre :**
- statistiques factures ;
- brouillons ;
- émises ;
- payées ;
- en retard ;
- montants.

---

#### 48. `ventes-facturation-creer`
**Titre :** Créer une facture client  
**Location :** Ventes → Facturation → Nouvelle facture  
**Couvre :**
- client ;
- lignes de facture ;
- produits du catalogue ;
- quantités ;
- taxes ;
- total ;
- enregistrement.

**Callouts :**
- Info : la facturation peut utiliser le catalogue global même hors stock.
- Warning : garder la cohérence avec le module Comptabilité.

---

#### 49. `ventes-facturation-rechercher-filtrer`
**Titre :** Rechercher et filtrer les factures  
**Location :** Ventes → Facturation  
**Couvre :**
- recherche numéro ;
- client ;
- libellé ;
- statut ;
- factures en retard ;
- suivi paiement.

---

#### 50. `ventes-facturation-statut`
**Titre :** Modifier le statut d’une facture  
**Location :** Ventes → Facturation → Statut  
**Couvre :**
- brouillon ;
- émise ;
- payée ;
- en retard ;
- annulée ;
- envoi.

---

#### 51. `ventes-facturation-paiement`
**Titre :** Enregistrer un paiement de facture  
**Location :** Ventes → Facturation → Paiement  
**Couvre :**
- sélection facture ;
- montant ;
- date paiement ;
- mode ;
- référence ;
- statut paiement.

---

#### 52. `ventes-facturation-relance`
**Titre :** Envoyer une relance de facture  
**Location :** Ventes → Facturation → Relance  
**Couvre :**
- facture en retard ;
- date de relance ;
- message ;
- suivi ;
- historique de relance.

---

#### 53. `ventes-facturation-impression-export`
**Titre :** Imprimer et exporter les factures  
**Location :** Ventes → Facturation  
**Couvre :**
- génération PDF ;
- impression ;
- téléchargement ;
- lignes de facture ;
- paramètres régionaux.

**Callouts :**
- Info : la génération PDF suit le standard jsPDF du projet.
- Warning : les factures doivent rester alignées avec le module Comptabilité.

---

### H. Analytics ventes

#### 54. `ventes-analytics-vue-ensemble`
**Titre :** Comprendre Analytics & Statistiques  
**Location :** Ventes → Analytics  
**Couvre :**
- période jour/semaine/mois/année/personnalisée ;
- filtres ;
- KPI ;
- actualisation ;
- export PDF/Excel.

---

#### 55. `ventes-analytics-revenus`
**Titre :** Analyser les revenus  
**Location :** Ventes → Analytics → Revenus  
**Couvre :**
- évolution du chiffre d’affaires ;
- performance hebdomadaire ;
- tendance ;
- comparaison par période.

---

#### 56. `ventes-analytics-transactions`
**Titre :** Analyser les transactions  
**Location :** Ventes → Analytics → Transactions  
**Couvre :**
- nombre de transactions ;
- panier moyen ;
- évolution ;
- fréquence ;
- variations.

---

#### 57. `ventes-analytics-produits`
**Titre :** Identifier les meilleurs produits vendus  
**Location :** Ventes → Analytics → Produits  
**Couvre :**
- top produits ;
- CA ;
- quantité ;
- marge ;
- catégories.

**Callouts :**
- Info : les produits doivent être référencés avec `libelle_produit`.
- Tip : croiser ces données avec Stock → Analyse ABC.

---

#### 58. `ventes-analytics-paiements`
**Titre :** Analyser les modes de paiement  
**Location :** Ventes → Analytics → Paiements  
**Couvre :**
- espèces ;
- carte ;
- mobile money ;
- assurance ;
- distribution ;
- tendance.

---

#### 59. `ventes-analytics-performance`
**Titre :** Suivre la performance du personnel  
**Location :** Ventes → Analytics → Performance  
**Couvre :**
- ventes par agent ;
- nombre transactions ;
- panier moyen ;
- performance relative ;
- suivi équipe.

---

#### 60. `ventes-analytics-insights`
**Titre :** Exploiter les insights de vente  
**Location :** Ventes → Analytics  
**Couvre :**
- alertes de performance ;
- opportunités ;
- variations anormales ;
- recommandations ;
- lecture managériale.

---

### I. Crédit client

#### 61. `ventes-credit-vue-ensemble`
**Titre :** Comprendre la gestion du crédit client  
**Location :** Ventes → Crédit  
**Couvre :**
- comptes crédit ;
- encours ;
- échéanciers ;
- alertes ;
- rapports ;
- paiements.

---

#### 62. `ventes-credit-comptes`
**Titre :** Gérer les comptes crédit  
**Location :** Ventes → Crédit → Comptes Crédit  
**Couvre :**
- recherche ;
- filtre statut ;
- nouveau compte ;
- limite crédit ;
- suspension ;
- ajustement limite ;
- paiement depuis compte.

**Callouts :**
- Warning : une limite crédit mal configurée peut exposer la pharmacie à un risque financier.
- Info : le crédit est lié au suivi client et aux bons non encaissés.

---

#### 63. `ventes-credit-paiement`
**Titre :** Enregistrer un paiement crédit  
**Location :** Ventes → Crédit → Enregistrer Paiement  
**Couvre :**
- choix compte ;
- montant ;
- référence ;
- date ;
- solde restant ;
- validation.

---

#### 64. `ventes-credit-historique`
**Titre :** Consulter l’historique crédit  
**Location :** Ventes → Crédit → Historique  
**Couvre :**
- transactions crédit ;
- paiements ;
- ajustements ;
- suspension ;
- audit.

---

#### 65. `ventes-credit-echeanciers`
**Titre :** Suivre les échéanciers de paiement  
**Location :** Ventes → Crédit → Échéanciers  
**Couvre :**
- paiements à venir ;
- retards ;
- dates d’échéance ;
- statut ;
- priorisation.

---

#### 66. `ventes-credit-alertes`
**Titre :** Traiter les alertes crédit  
**Location :** Ventes → Crédit → Alertes  
**Couvre :**
- paiements en retard ;
- dépassement limite ;
- relances ;
- suspension éventuelle.

---

#### 67. `ventes-credit-rapports`
**Titre :** Exploiter les rapports crédit  
**Location :** Ventes → Crédit → Rapports  
**Couvre :**
- encours total ;
- comptes à risque ;
- remboursements ;
- retards ;
- export.

---

### J. Promotions et fidélité

#### 68. `ventes-promotions-vue-ensemble`
**Titre :** Comprendre Promotions & Fidélité  
**Location :** Ventes → Promotions  
**Couvre :**
- statistiques ;
- promotions ;
- programme fidélité ;
- récompenses ;
- analytics.

---

#### 69. `ventes-promotions-gestion`
**Titre :** Créer et gérer les promotions  
**Location :** Ventes → Promotions → Promotions  
**Couvre :**
- recherche ;
- filtre type ;
- création ;
- modification ;
- activation/désactivation ;
- détail ;
- limite d’utilisation.

**Callouts :**
- Warning : contrôler les dates et limites avant activation.
- Tip : désactiver une promotion expirée évite les remises non souhaitées.

---

#### 70. `ventes-promotions-types`
**Titre :** Comprendre les types de promotions  
**Location :** Ventes → Promotions → Promotions  
**Couvre :**
- pourcentage ;
- montant fixe ;
- achetez/obtenez ;
- quantité ;
- valeur ;
- période.

---

#### 71. `ventes-fidelite-membres`
**Titre :** Gérer les membres du programme fidélité  
**Location :** Ventes → Promotions → Programme Fidélité  
**Couvre :**
- recherche membre ;
- numéro carte ;
- niveau Bronze/Silver/Gold/Platinum ;
- points ;
- total dépensé ;
- dernière activité.

---

#### 72. `ventes-fidelite-recompenses`
**Titre :** Gérer les récompenses fidélité  
**Location :** Ventes → Promotions → Récompenses  
**Couvre :**
- nouvelle récompense ;
- type remise/produit gratuit/cashback ;
- coût en points ;
- valeur ;
- niveau requis ;
- stock disponible ;
- activation.

---

#### 73. `ventes-promotions-analytics`
**Titre :** Analyser les performances des promotions  
**Location :** Ventes → Promotions → Analytics  
**Couvre :**
- période ;
- utilisations ;
- remises totales ;
- membres fidélité ;
- taux conversion ;
- performance par promotion ;
- distribution par niveau.

---

### K. Dépenses de caisse

#### 74. `ventes-depenses-vue-ensemble`
**Titre :** Comprendre les dépenses de caisse  
**Location :** Ventes → Dépenses  
**Couvre :**
- dépenses depuis les caisses ;
- liste ;
- statistiques ;
- actualisation ;
- exports.

---

#### 75. `ventes-depenses-liste`
**Titre :** Consulter et filtrer les dépenses de caisse  
**Location :** Ventes → Dépenses → Liste des dépenses  
**Couvre :**
- filtres serveur ;
- pagination ;
- total montant ;
- tri ;
- export Excel/PDF ;
- édition ;
- annulation.

**Callouts :**
- Warning : une dépense annulée doit conserver un motif.
- Info : les permissions déterminent les actions possibles.

---

#### 76. `ventes-depenses-modifier-annuler`
**Titre :** Modifier ou annuler une dépense  
**Location :** Ventes → Dépenses → Liste des dépenses  
**Couvre :**
- sélection dépense ;
- modification montant/description/motif ;
- annulation ;
- justification ;
- rafraîchissement liste.

---

#### 77. `ventes-depenses-statistiques`
**Titre :** Analyser les dépenses de caisse  
**Location :** Ventes → Dépenses → Statistiques  
**Couvre :**
- statistiques globales ;
- répartition par motif ;
- graphique catégories ;
- suivi des sorties.

---

### L. Configuration ventes

#### 78. `ventes-configuration-generale`
**Titre :** Configurer les paramètres généraux de vente  
**Location :** Ventes → Configuration → Général  
**Couvre :**
- sauvegarde automatique ;
- scanner code-barres ;
- affichage stock ;
- client obligatoire ;
- modification prix ;
- remise par défaut ;
- remise maximum ;
- stock négatif ;
- séparation Vente/Caisse.

**Callouts :**
- Warning : autoriser le stock négatif ou la modification de prix doit être réservé aux profils habilités.
- Info : la séparation Vente/Caisse modifie les onglets visibles du POS.

---

#### 79. `ventes-configuration-tva`
**Titre :** Configurer la TVA et les taxes  
**Location :** Ventes → Configuration → TVA  
**Couvre :**
- paramètres de taxation ;
- taux TVA ;
- calculs ;
- impact sur HT/TTC ;
- cohérence fiscale.

**Callouts :**
- Info : les calculs de prix et taxes appliquent les règles d’arrondi FCFA.
- Warning : vérifier la cohérence avec Comptabilité/SYSCOHADA.

---

#### 80. `ventes-configuration-paiement`
**Titre :** Configurer les moyens de paiement  
**Location :** Ventes → Configuration → Paiement  
**Couvre :**
- espèces ;
- carte ;
- mobile money ;
- assurance ;
- références ;
- activation/désactivation.

---

#### 81. `ventes-configuration-impression`
**Titre :** Configurer l’impression des reçus et tickets  
**Location :** Ventes → Configuration → Impression  
**Couvre :**
- autoprint ;
- logo ;
- code-barres ;
- format papier ;
- en-tête ;
- pied de page ;
- message personnalisé.

**Callouts :**
- Info : l’impression suit la hiérarchie PharmaSoft : label système, informations tenant, puis texte personnalisé.
- Warning : éviter les textes fictifs ou doublons dans les en-têtes/pieds.

---

#### 82. `ventes-configuration-caisses`
**Titre :** Configurer les caisses de vente  
**Location :** Ventes → Configuration → Caisses  
**Couvre :**
- paramètres caisse ;
- comportements par défaut ;
- association aux sessions ;
- suivi des points de vente.

---

#### 83. `ventes-configuration-alertes`
**Titre :** Configurer les alertes de ventes  
**Location :** Ventes → Configuration → Alertes  
**Couvre :**
- seuils ;
- alertes caisse ;
- alertes factures ;
- alertes performance ;
- notifications.

---

## 5. Règles métier à intégrer dans les articles

Les callouts et bonnes pratiques intégreront les règles existantes du projet :

- **Permissions** : accès Ventes via `sales.view`, vente via `sales.create`, encaissement via `sales.cashier`.
- **Dashboard** : visibilité contrôlée et masquée par défaut selon les droits.
- **POS** : recherche serveur, lots valides, stock vérifié avant ajout panier.
- **Codes-barres** : compatibilité douchettes physiques et normalisation clavier.
- **Prix** : source de vérité issue des lots pour le POS.
- **Arrondis FCFA** : appliquer les standards de rounding du projet.
- **Assurance** : taux Agent/Ayant Droit avec recalcul instantané.
- **Proforma** : catalogue global, pas de déduction stock avant conversion.
- **Retours** : traitement atomique, impact stock/caisse/finance/comptabilité.
- **Caisse** : clôture avec total ventes, bons non encaissés, marge et marque persistés.
- **Impression** : tickets/reçus respectant la configuration unifiée.
- **Multi-tenant/RLS** : toutes les données ventes restent isolées par pharmacie.
- **Facturation** : cohérence avec le module Comptabilité et les exports PDF.

---

## 6. Maillage des articles liés

Je relierai les articles pour guider l’utilisateur entre les workflows dépendants.

Exemples :

```text
ventes-dashboard-vue-ensemble
→ ventes-dashboard-caisses
→ ventes-dashboard-transactions-recentes
→ ventes-analytics-vue-ensemble

ventes-point-de-vente
→ ventes-pos-client
→ ventes-pos-assurance
→ ventes-pos-paiement-simple
→ ventes-dashboard-transactions-recentes

ventes-pos-mode-separe-vente
→ ventes-pos-mode-separe-encaissement
→ ventes-caisses-ouverture-session
→ ventes-caisses-fermeture-session

ventes-pos-proforma
→ ventes-pos-proformas-liste
→ ventes-facturation-creer
→ ventes-point-de-vente

ventes-retours
→ ventes-retours-attente
→ ventes-retours-traitement
→ ventes-historique-details

ventes-facturation-creer
→ ventes-facturation-paiement
→ ventes-facturation-relance
→ comptabilite-facturation

ventes-credit-comptes
→ ventes-credit-echeanciers
→ ventes-credit-alertes
→ ventes-caisses-fermeture-session

ventes-promotions-gestion
→ ventes-fidelite-membres
→ ventes-fidelite-recompenses
→ ventes-promotions-analytics

ventes-configuration-generale
→ ventes-pos-mode-separe-vente
→ ventes-configuration-impression
→ ventes-configuration-paiement
```

---

## 7. Étapes d’implémentation proposées

### Étape 1 — Restructuration du fichier Ventes

Modifier :

```text
src/components/help/guide/content/ventes.ts
```

Créer les sections cibles :

```text
Pilotage des ventes
Caisses et sessions
Point de vente
Encaissements
Historique des transactions
Retours et échanges
Facturation client
Analytics ventes
Crédit client
Promotions et fidélité
Dépenses de caisse
Configuration ventes
```

Replacer et enrichir les deux articles existants.

---

### Étape 2 — Articles opérationnels prioritaires

Ajouter les articles les plus utilisés au quotidien :

- dashboard ventes ;
- caisses et sessions ;
- point de vente ;
- paiements ;
- encaissements ;
- historique ;
- retours.

---

### Étape 3 — Articles financiers et administratifs

Ajouter les articles liés au suivi financier :

- facturation client ;
- crédit client ;
- dépenses de caisse ;
- rapports ;
- exports.

---

### Étape 4 — Articles marketing et pilotage

Ajouter les articles sur :

- analytics ventes ;
- promotions ;
- fidélité ;
- récompenses ;
- performance.

---

### Étape 5 — Articles configuration

Ajouter les articles sur :

- général ;
- TVA ;
- paiement ;
- impression ;
- caisses ;
- alertes.

---

### Étape 6 — Recherche et mots-clés

Chaque article recevra 3 à 5 mots-clés ciblés :

```text
pos, vente, panier, paiement, reçu
caisse, session, clôture, solde, écart
encaissement, transaction, rapport, export
retour, avoir, remboursement, stock
facture, paiement, relance, PDF
crédit, échéancier, limite, retard
promotion, fidélité, récompense, points
configuration, TVA, impression, scanner
```

---

### Étape 7 — Vérifications

Après implémentation, je vérifierai :

1. Le build TypeScript/Vite.
2. Le respect strict du type `GuideArticle`.
3. L’affichage des 12 sections dans la sidebar du guide.
4. La recherche full-text sur les nouveaux articles.
5. Le fonctionnement des `related[]`.
6. L’absence de références LodgeSoft ou PharmaCenter.
7. La cohérence des `location` avec les sous-modules réels.
8. La lisibilité en mode fenêtre et panneau latéral.
9. La couverture complète des onglets réels du module Ventes.
10. L’absence de doublons d’identifiants.

---

## Résultat attendu

Le module **Ventes** du Guide Utilisateur passera de 2 articles partiels à environ **83 articles structurés**, couvrant toutes les fonctionnalités visibles dans l’application :

- tableau de bord ventes ;
- caisses et sessions ;
- POS ;
- mode Vente/Caisse séparé ;
- proformas ;
- paiements simples et fractionnés ;
- assurances ;
- encaissements ;
- historique ;
- retours ;
- facturation ;
- analytics ;
- crédit ;
- promotions ;
- fidélité ;
- dépenses ;
- configuration.

Le guide deviendra une documentation utilisateur complète pour les caissiers, pharmaciens, responsables de caisse, comptables, administrateurs et responsables commerciaux PharmaSoft.
