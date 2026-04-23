
## Plan d’implémentation — Articles manquants du module Stock

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Stock** couvre toutes les fonctionnalités réellement exposées dans l’application :

```text
Stock
├── Vue d’ensemble Stock
├── Approvisionnement
├── Stock Actuel
├── Lots
├── Mouvements
├── Inventaires
├── Alertes
├── Analyses
├── Étiquettes
└── Configuration
```

Le format restera strictement identique au module Administration : chaque article respectera `GuideArticle` avec `id`, `title`, `objective`, `location`, `audience`, `intro`, `steps`, `callouts`, `bestPractices`, `faq`, `related`, `keywords`.

Le fichier principal à enrichir sera :

```text
src/components/help/guide/content/stock.ts
```

Aucun changement UI n’est requis : le guide intégrera automatiquement les nouveaux articles via `registry.ts`.

---

## 1. Organisation cible du guide Stock

Je restructurerai le module Stock en sections fonctionnelles :

```text
Stock
├── Pilotage du stock
├── Approvisionnement
├── Stock actuel
├── Lots et traçabilité
├── Mouvements
├── Inventaires
├── Alertes
├── Analyses stock
├── Étiquettes
└── Configuration stock
```

Les deux articles existants seront conservés, enrichis et replacés :

- `stock-actuel-lots`
- `stock-reception-fournisseur`

---

## 2. Convention des identifiants

Tous les nouveaux articles utiliseront le préfixe :

```text
stock-
```

Exemples :

```text
stock-dashboard-vue-ensemble
stock-approvisionnement-commandes
stock-actuel-produits-disponibles
stock-lots-fifo
stock-inventaires-sessions
stock-alertes-peremption
stock-etiquettes-receptions
stock-configuration-pharmaml
```

---

## 3. Articles à créer ou enrichir

### A. Pilotage du stock

#### 1. `stock-dashboard-vue-ensemble`
**Titre :** Comprendre la vue d’ensemble Stock  
**Location :** Stock  
**Couvre :**
- KPI valeur stock, produits disponibles, ruptures, alertes, péremptions ;
- graphiques de distribution, valorisation par famille, mouvements, rotation ;
- filtre de période ;
- export des données ;
- actions rapides : approvisionnement, inventaire, ajustement.

**Callouts :**
- Info : les métriques sont filtrées par tenant/pharmacie.
- Warning : la visibilité du dashboard est contrôlée par les droits utilisateur.

---

#### 2. `stock-dashboard-actions-rapides`
**Titre :** Utiliser les actions rapides du stock  
**Location :** Stock  
**Couvre :**
- ouvrir un réapprovisionnement depuis un produit critique ;
- lancer un inventaire rapide ;
- créer un ajustement ;
- accéder aux rapports ;
- actualiser les données.

**Related :**
- `stock-approvisionnement-commandes`
- `stock-inventaires-sessions`
- `stock-mouvements-ajustements`

---

#### 3. `stock-dashboard-export-rapports`
**Titre :** Exporter les indicateurs du stock  
**Location :** Stock  
**Couvre :**
- export depuis le dashboard ;
- période analysée ;
- données incluses : KPI, graphiques, mouvements, valorisation ;
- cohérence avec les analyses stock.

---

### B. Approvisionnement

#### 4. `stock-approvisionnement-liste-commandes`
**Titre :** Suivre la liste des commandes fournisseurs  
**Location :** Stock → Approvisionnement → Liste des commandes  
**Couvre :**
- consultation des commandes ;
- statuts ;
- nombre de produits ;
- actualisation ;
- suppression ou changement de statut selon droits.

**Callouts :**
- Info : les compteurs de lignes doivent refléter les produits réellement liés à la commande.
- Warning : une suppression de commande peut impacter le suivi d’approvisionnement.

---

#### 5. `stock-approvisionnement-commandes`
**Titre :** Créer une commande fournisseur  
**Location :** Stock → Approvisionnement → Commandes  
**Couvre :**
- sélection du fournisseur ;
- ajout de produits ;
- quantités ;
- prix ;
- seuils ;
- validation de commande.

**Callouts :**
- Tip : utiliser les seuils pour proposer automatiquement les quantités à commander.
- Info : la quantité suggérée suit la logique `max(1, stock_max - stock_actuel)`.

---

#### 6. `stock-approvisionnement-modification-commandes`
**Titre :** Modifier une commande fournisseur  
**Location :** Stock → Approvisionnement → Modification  
**Couvre :**
- rechercher une commande ;
- modifier fournisseur, lignes et quantités ;
- modifier le statut ;
- contrôler l’impact avant validation.

---

#### 7. `stock-reception-fournisseur`
**Titre :** Réceptionner une livraison fournisseur  
**Location :** Stock → Approvisionnement → Réceptions  
**Action :** enrichir l’article existant.  
**Couvre :**
- sélection commande ou réception directe ;
- contrôle quantités livrées ;
- prix d’achat et prix de vente TTC ;
- lots ;
- dates de péremption ;
- unités gratuites ;
- validation avec mise à jour du stock.

**Callouts :**
- Warning : ne valider qu’après rapprochement avec le bon de livraison.
- Tip : renseigner les unités gratuites sans fausser le coût d’achat.

---

#### 8. `stock-approvisionnement-import-excel-reception`
**Titre :** Importer une réception depuis Excel  
**Location :** Stock → Approvisionnement → Import Excel  
**Couvre :**
- sélection fournisseur ;
- sélection ou création de réception ;
- mapping des colonnes ;
- contrôle avant import ;
- intégration des lots et quantités.

**Callouts :**
- Warning : les imports volumineux doivent être traités par lots pour éviter les blocages mémoire.
- Info : les produits doivent être rapprochés du référentiel via les champs corrects, notamment `libelle_produit`.

---

#### 9. `stock-approvisionnement-unites-gratuites-saisie`
**Titre :** Saisir les unités gratuites fournisseur  
**Location :** Stock → Approvisionnement → Unités gratuites → Saisie des UG  
**Couvre :**
- recherche produit ;
- choix fournisseur ;
- quantité achetée ;
- quantité gratuite ;
- motif ;
- validation.

**Callouts :**
- Info : les UG sont séparées de l’historique pour sécuriser le suivi.
- Tip : documenter le contexte de l’avantage fournisseur.

---

#### 10. `stock-approvisionnement-unites-gratuites-historique`
**Titre :** Consulter l’historique des unités gratuites  
**Location :** Stock → Approvisionnement → Unités gratuites → Historique des UG  
**Couvre :**
- recherche ;
- filtres ;
- consultation des UG enregistrées ;
- contrôle fournisseur/produit/date ;
- exploitation pour l’analyse commerciale.

---

#### 11. `stock-approvisionnement-historique-receptions`
**Titre :** Consulter l’historique des réceptions  
**Location :** Stock → Approvisionnement → Historique  
**Couvre :**
- liste des réceptions ;
- détail par réception ;
- lots créés ;
- montants ;
- suppression contrôlée.

**Callouts :**
- Warning : la suppression d’une réception utilise une logique en cascade et doit rester exceptionnelle.
- Info : l’historique conserve la traçabilité des entrées de stock.

---

#### 12. `stock-approvisionnement-fournisseurs`
**Titre :** Piloter les fournisseurs depuis le stock  
**Location :** Stock → Approvisionnement → Fournisseurs  
**Couvre :**
- recherche fournisseur ;
- statut actif/inactif/suspendu ;
- statistiques commandes ;
- délais de livraison ;
- fiche détail ;
- accès paramètres stock.

**Related :**
- `administration-partenaires-fournisseurs`
- `stock-configuration-integrations`

---

#### 13. `stock-approvisionnement-suivi-commandes`
**Titre :** Suivre l’acheminement des commandes  
**Location :** Stock → Approvisionnement → Suivi  
**Couvre :**
- commandes en cours ;
- transporteurs ;
- statut de livraison ;
- suivi logistique ;
- actions de relance.

---

#### 14. `stock-approvisionnement-parametres`
**Titre :** Configurer les paramètres rapides d’approvisionnement  
**Location :** Stock → Approvisionnement → Fournisseurs → Paramètres Stock  
**Couvre :**
- paramètres d’achat ;
- seuils ;
- comportements par défaut ;
- cohérence avec Configuration Stock.

---

### C. Stock actuel

#### 15. `stock-actuel-vue-temps-reel`
**Titre :** Lire le stock actuel en temps réel  
**Location :** Stock → Stock Actuel  
**Couvre :**
- métriques rapides ;
- produits totaux ;
- disponibles ;
- stock faible ;
- ruptures ;
- valorisation ;
- actualisation et vidage cache.

---

#### 16. `stock-actuel-produits-disponibles`
**Titre :** Consulter les produits disponibles  
**Location :** Stock → Stock Actuel → Disponible  
**Couvre :**
- recherche produit ;
- filtres famille/rayon ;
- tri par nom, stock, valorisation, rotation ;
- pagination ;
- export ;
- détail produit.

**Callouts :**
- Info : le stock affiché résulte des mouvements, ventes, réceptions, retours et inventaires.
- Warning : toujours vérifier les lots pour les produits sensibles.

---

#### 17. `stock-actuel-stock-faible`
**Titre :** Identifier les produits en stock faible  
**Location :** Stock → Stock Actuel → Stock faible  
**Couvre :**
- liste des produits sous seuil ;
- niveau actuel ;
- seuil limite ;
- actions de réapprovisionnement ;
- suivi des produits critiques.

---

#### 18. `stock-actuel-ruptures`
**Titre :** Traiter les ruptures de stock  
**Location :** Stock → Stock Actuel → Rupture  
**Couvre :**
- produits à stock nul ;
- priorisation ;
- réapprovisionnement ;
- substitution éventuelle ;
- impact sur les ventes.

---

#### 19. `stock-actuel-valorisation`
**Titre :** Analyser la valorisation du stock actuel  
**Location :** Stock → Stock Actuel → Valorisation  
**Couvre :**
- valeur d’achat ;
- valeur par produit ;
- valorisation globale ;
- export ;
- cohérence avec les rapports.

**Callouts :**
- Info : les montants suivent les paramètres régionaux et la devise du tenant.
- Warning : la valorisation doit être rapprochée des données comptables si elle sert à un reporting financier.

---

#### 20. `stock-actuel-verification-rapide`
**Titre :** Faire une vérification rapide de stock  
**Location :** Stock → Stock Actuel → Vérification rapide  
**Couvre :**
- recherche produit ;
- disponibilité immédiate ;
- lecture des informations critiques ;
- contrôle avant vente ou commande.

---

### D. Lots et traçabilité

#### 21. `stock-lots-suivi`
**Titre :** Suivre les lots  
**Location :** Stock → Lots → Suivi des lots  
**Couvre :**
- traçabilité par lot ;
- produit ;
- numéro de lot ;
- quantités ;
- dates ;
- mouvements associés.

---

#### 22. `stock-lots-details`
**Titre :** Consulter le détail d’un lot  
**Location :** Stock → Lots → Détails des lots  
**Couvre :**
- fiche lot ;
- quantité initiale/restante ;
- expiration ;
- origine ;
- mouvements ;
- historique.

---

#### 23. `stock-lots-expirations`
**Titre :** Surveiller les expirations des lots  
**Location :** Stock → Lots → Expirations  
**Couvre :**
- alertes de péremption ;
- filtres urgence/statut ;
- génération des alertes ;
- actions de traitement.

**Callouts :**
- Warning : les produits proches de péremption doivent être contrôlés avant toute nouvelle commande.
- Tip : prioriser les lots selon FEFO/FIFO selon la politique interne.

---

#### 24. `stock-lots-fifo`
**Titre :** Configurer la logique FIFO  
**Location :** Stock → Lots → Configuration FIFO  
**Couvre :**
- méthode premier entré, premier sorti ;
- règles d’écoulement ;
- contrôle des lots ;
- cohérence POS/stock.

---

#### 25. `stock-lots-integration-ventes`
**Titre :** Comprendre l’intégration des lots avec les ventes  
**Location :** Stock → Lots → Intégration ventes  
**Couvre :**
- sélection des lots au POS ;
- déduction du stock ;
- traçabilité de sortie ;
- impact sur les ruptures.

---

#### 26. `stock-lots-reconciliation-inventaire`
**Titre :** Réconcilier les lots avec l’inventaire  
**Location :** Stock → Lots → Réconciliation  
**Couvre :**
- comparaison lot théorique/réel ;
- corrections ;
- écarts ;
- inventaires ciblés.

---

#### 27. `stock-lots-analytics`
**Titre :** Analyser la performance des lots  
**Location :** Stock → Lots → Analytics  
**Couvre :**
- rotation par lot ;
- performance ;
- lots dormants ;
- lots sensibles ;
- indicateurs avancés.

---

#### 28. `stock-lots-optimisation`
**Titre :** Optimiser la gestion des lots  
**Location :** Stock → Lots → Optimisation  
**Couvre :**
- lancement d’une optimisation ;
- suggestions ;
- priorités ;
- règles actives ;
- application ou rejet des recommandations.

---

### E. Mouvements

#### 29. `stock-mouvements-journal`
**Titre :** Consulter le journal des mouvements  
**Location :** Stock → Mouvements → Journal  
**Couvre :**
- entrées ;
- sorties ;
- ajustements ;
- retours ;
- origine du mouvement ;
- historique.

---

#### 30. `stock-mouvements-ajustements`
**Titre :** Enregistrer un ajustement de stock  
**Location :** Stock → Mouvements → Ajustements  
**Couvre :**
- sélection produit ;
- sens de correction ;
- quantité ;
- motif ;
- validation ;
- traçabilité.

**Callouts :**
- Warning : un ajustement modifie le stock réel et doit toujours être justifié.
- Info : les ajustements doivent rester auditables.

---

#### 31. `stock-mouvements-transferts`
**Titre :** Gérer les transferts de stock  
**Location :** Stock → Mouvements → Transferts  
**Couvre :**
- transfert interne ;
- produit ;
- quantité ;
- source/destination ;
- validation ;
- suivi.

---

#### 32. `stock-mouvements-audit`
**Titre :** Auditer les mouvements de stock  
**Location :** Stock → Mouvements → Audit  
**Couvre :**
- contrôle des opérations ;
- utilisateur ;
- date ;
- type de mouvement ;
- traçabilité des changements.

**Callouts :**
- Info : l’audit contribue à la conformité et à la sécurité multi-tenant.
- Warning : les corrections sensibles doivent être réservées aux profils autorisés.

---

### F. Inventaires

#### 33. `stock-inventaires-sessions`
**Titre :** Créer et gérer les sessions d’inventaire  
**Location :** Stock → Inventaires → Sessions  
**Couvre :**
- création session ;
- type complet, partiel ou cyclique ;
- rayons, fournisseurs, emplacements ;
- participants ;
- démarrage, suspension, reprise, clôture ;
- suppression.

**Callouts :**
- Info : PharmaSoft supporte trois types d’inventaire : complet, partiel et cyclique.
- Warning : clôturer une session peut déclencher des écarts à valider.

---

#### 34. `stock-inventaires-saisie`
**Titre :** Saisir les comptages d’inventaire  
**Location :** Stock → Inventaires → Saisie  
**Couvre :**
- sélectionner une session ;
- saisir quantités comptées ;
- comparer au théorique ;
- enregistrer ;
- suivre l’avancement.

---

#### 35. `stock-inventaires-import-excel`
**Titre :** Importer un inventaire depuis Excel  
**Location :** Stock → Inventaires → Import Excel  
**Couvre :**
- fichier Excel ;
- mapping colonnes ;
- contrôle des produits ;
- import par lots ;
- validation des quantités.

**Callouts :**
- Warning : les gros fichiers doivent être importés en traitement séquentiel pour éviter les erreurs mémoire.
- Info : le rapprochement produit doit respecter les identifiants du référentiel.

---

#### 36. `stock-inventaires-reconciliation`
**Titre :** Réconcilier les écarts d’inventaire  
**Location :** Stock → Inventaires → Réconciliation  
**Couvre :**
- écarts positif/négatif ;
- validation ;
- génération d’ajustements ;
- justification ;
- clôture.

---

#### 37. `stock-inventaires-rapports`
**Titre :** Exploiter les rapports d’inventaire  
**Location :** Stock → Inventaires → Rapports  
**Couvre :**
- synthèse ;
- écarts ;
- avancement ;
- export ;
- suivi historique.

---

### G. Alertes

#### 38. `stock-alertes-dashboard`
**Titre :** Piloter le dashboard des alertes stock  
**Location :** Stock → Alertes → Dashboard  
**Couvre :**
- alertes actives ;
- criticité ;
- stock faible ;
- ruptures ;
- péremptions ;
- actions rapides.

---

#### 39. `stock-alertes-stock-faible`
**Titre :** Traiter les alertes de stock faible  
**Location :** Stock → Alertes → Stock faible  
**Couvre :**
- seuils ;
- produits concernés ;
- priorisation ;
- lancement commande ;
- suivi.

---

#### 40. `stock-alertes-peremption`
**Titre :** Traiter les alertes de péremption  
**Location :** Stock → Alertes → Péremption  
**Couvre :**
- dates d’expiration ;
- urgence ;
- lots concernés ;
- actions de retrait ou écoulement ;
- génération des alertes.

---

#### 41. `stock-alertes-configuration`
**Titre :** Configurer les alertes stock  
**Location :** Stock → Alertes → Configuration  
**Couvre :**
- seuils d’alerte ;
- règles ;
- notifications ;
- activation/désactivation ;
- criticité.

---

### H. Analyses stock

#### 42. `stock-analyses-valorisation`
**Titre :** Analyser la valorisation du stock  
**Location :** Stock → Analyses → Valorisation  
**Couvre :**
- valorisation globale ;
- valorisation par famille ;
- méthode de valorisation ;
- export ;
- interprétation des écarts.

---

#### 43. `stock-analyses-abc`
**Titre :** Utiliser l’analyse ABC  
**Location :** Stock → Analyses → Analyse ABC  
**Couvre :**
- méthode Pareto ;
- période ;
- classes A/B/C ;
- filtres avancés ;
- produits prioritaires.

**Callouts :**
- Tip : les produits de classe A doivent être suivis plus fréquemment.
- Info : l’analyse ABC nécessite des données de ventes suffisantes.

---

#### 44. `stock-analyses-rotation`
**Titre :** Analyser la rotation des stocks  
**Location :** Stock → Analyses → Rotation  
**Couvre :**
- rotation rapide/normale/lente ;
- familles ;
- produits dormants ;
- décision de réapprovisionnement.

---

#### 45. `stock-analyses-previsions`
**Titre :** Exploiter les prévisions de stock  
**Location :** Stock → Analyses → Prévisions  
**Couvre :**
- estimation des besoins ;
- tendances ;
- produits à surveiller ;
- anticipation des ruptures.

---

#### 46. `stock-analyses-conformite`
**Titre :** Produire les rapports de conformité stock  
**Location :** Stock → Analyses → Conformité  
**Couvre :**
- rapports réglementaires ;
- cohérence lots/stock ;
- péremptions ;
- produits sensibles ;
- exports.

---

### I. Étiquettes

#### 47. `stock-etiquettes-produits`
**Titre :** Imprimer des étiquettes produits  
**Location :** Stock → Étiquettes → Produits  
**Couvre :**
- recherche produit ;
- sélection ;
- génération de code si absent ;
- taille d’étiquette ;
- type de code-barres ;
- options DCI, lot, expiration, prix ;
- impression.

---

#### 48. `stock-etiquettes-lots`
**Titre :** Imprimer des étiquettes de lots  
**Location :** Stock → Étiquettes → Lots  
**Couvre :**
- recherche lot ;
- sélection ;
- code-barres unique lot ;
- numéro lot ;
- expiration ;
- quantité ;
- impression.

**Callouts :**
- Info : les codes-barres de lots suivent les règles contextuelles de génération du projet.
- Warning : une étiquette lot incorrecte compromet la traçabilité POS.

---

#### 49. `stock-etiquettes-receptions`
**Titre :** Imprimer les étiquettes d’une réception  
**Location :** Stock → Étiquettes → Par Réception  
**Couvre :**
- recherche réception ;
- sélection réception ;
- lots associés ;
- sélection totale ou partielle ;
- impression groupée.

**Callouts :**
- Tip : imprimer les étiquettes immédiatement après réception facilite la traçabilité en rayon.
- Info : le format standard du projet est 38 × 21,2 mm lorsque cette configuration est utilisée.

---

### J. Configuration stock

#### 50. `stock-configuration-generale`
**Titre :** Configurer les paramètres généraux du stock  
**Location :** Stock → Configuration → Général  
**Couvre :**
- unité par défaut ;
- méthode de valorisation ;
- précision d’arrondi ;
- stock minimum ;
- stock maximum ;
- point de commande ;
- stock de sécurité ;
- options avancées.

---

#### 51. `stock-configuration-alertes`
**Titre :** Configurer les seuils et alertes stock  
**Location :** Stock → Configuration → Alertes  
**Couvre :**
- seuils ;
- notifications ;
- dates de péremption ;
- règles de surveillance ;
- criticité.

---

#### 52. `stock-configuration-tarification`
**Titre :** Configurer la tarification stock  
**Location :** Stock → Configuration → Tarification  
**Couvre :**
- paramètres prix ;
- arrondis ;
- cohérence achat/vente ;
- impact sur la valorisation.

**Callouts :**
- Info : les montants FCFA doivent respecter les règles d’arrondi du projet avec `Math.round`.
- Warning : une mauvaise configuration tarifaire peut déséquilibrer les ventes et la comptabilité.

---

#### 53. `stock-configuration-mapping-excel`
**Titre :** Configurer le mapping Excel  
**Location :** Stock → Configuration → Mapping Excel  
**Couvre :**
- colonnes attendues ;
- correspondance produit ;
- lots ;
- prix ;
- dates ;
- validation import.

---

#### 54. `stock-configuration-integrations`
**Titre :** Configurer les intégrations fournisseurs  
**Location :** Stock → Configuration → Intégrations  
**Couvre :**
- sélection fournisseur ;
- activation PharmaML ;
- paramètres fournisseur ;
- historique des transmissions.

---

#### 55. `stock-configuration-pharmaml`
**Titre :** Configurer PharmaML pour un fournisseur  
**Location :** Stock → Configuration → Intégrations → Configuration  
**Couvre :**
- URL PharmaML ;
- code répartiteur ;
- identifiant répartiteur ;
- clé secrète ;
- identifiant officine ;
- pays ;
- test de connexion ;
- sauvegarde.

**Callouts :**
- Warning : les identifiants PharmaML sont sensibles et doivent rester limités aux utilisateurs autorisés.
- Info : les erreurs XML PharmaML/UBIPHARM doivent être diagnostiquées avec le fournisseur et le schéma attendu.

---

#### 56. `stock-configuration-pharmaml-historique`
**Titre :** Consulter l’historique PharmaML  
**Location :** Stock → Configuration → Intégrations → Historique  
**Couvre :**
- transmissions ;
- réponses fournisseur ;
- erreurs ;
- suivi des commandes ;
- audit d’intégration.

---

### K. Démonstration et intégration avancée

#### 57. `stock-integration-demo-vue-ensemble`
**Titre :** Comprendre la démonstration d’intégration stock  
**Location :** Stock → Démonstration intégration  
**Couvre :**
- vue d’ensemble ;
- notifications intelligentes ;
- réapprovisionnement ;
- valorisation ;
- test de mouvement ;
- actualisation.

---

#### 58. `stock-integration-demo-notifications`
**Titre :** Lire les notifications stock intelligentes  
**Location :** Stock → Démonstration intégration → Notifications  
**Couvre :**
- notifications générées par paramètres ;
- priorités ;
- produits concernés ;
- actions suggérées.

---

#### 59. `stock-integration-demo-reapprovisionnement`
**Titre :** Comprendre les suggestions de réapprovisionnement  
**Location :** Stock → Démonstration intégration → Réapprovisionnement  
**Couvre :**
- produits à recommander ;
- seuils configurés ;
- stock minimum ;
- point de commande ;
- quantité suggérée.

---

#### 60. `stock-integration-demo-valorisation`
**Titre :** Tester les calculs de valorisation intégrée  
**Location :** Stock → Démonstration intégration → Valorisation  
**Couvre :**
- calcul produit ;
- méthode de valorisation ;
- résumé valeur totale ;
- rotation moyenne.

---

## 4. Règles métier à intégrer dans les articles

Les callouts et bonnes pratiques intégreront les règles mémorisées du projet :

- Stock multi-tenant : données isolées par pharmacie.
- Dashboard : visibilité contrôlée par permissions.
- Produits : utiliser `libelle_produit`, jamais `nom`.
- Référentiel : éviter les doublons via contraintes `(tenant_id, label)`.
- Lots : toujours filtrer par `produit_id` et `tenant_id`.
- POS : les mouvements de vente doivent préserver la traçabilité des lots.
- Inventaires : types complet, partiel et cyclique.
- Réceptions : prise en compte de `prix_vente_ttc` et `date_peremption`.
- UG : séparation Saisie / Historique.
- Suppression réception : cascade contrôlée via RPC dédiée.
- Étiquettes : format 38 × 21,2 mm et règles de génération lot.
- Imports Excel : traitement séquentiel/chunking pour éviter les erreurs mémoire.
- Tarification : arrondis FCFA avec `Math.round`.
- PharmaML : configuration fournisseur sensible et diagnostic des erreurs XML.

---

## 5. Maillage des articles liés

Je relierai les articles pour guider l’utilisateur entre les fonctions dépendantes.

Exemples :

```text
stock-dashboard-vue-ensemble
→ stock-actuel-vue-temps-reel
→ stock-alertes-dashboard
→ stock-analyses-valorisation

stock-approvisionnement-commandes
→ stock-approvisionnement-liste-commandes
→ stock-reception-fournisseur
→ stock-approvisionnement-suivi-commandes

stock-reception-fournisseur
→ stock-etiquettes-receptions
→ stock-lots-suivi
→ stock-approvisionnement-historique-receptions

stock-inventaires-sessions
→ stock-inventaires-saisie
→ stock-inventaires-reconciliation
→ stock-mouvements-ajustements

stock-alertes-peremption
→ stock-lots-expirations
→ stock-lots-fifo
→ stock-approvisionnement-commandes

stock-configuration-pharmaml
→ stock-configuration-pharmaml-historique
→ stock-approvisionnement-fournisseurs
```

---

## 6. Étapes d’implémentation proposées

### Étape 1 — Restructuration du fichier Stock

Modifier `src/components/help/guide/content/stock.ts` pour créer les 10 sections cibles et replacer les articles existants.

### Étape 2 — Articles opérationnels prioritaires

Ajouter les articles sur :

- Dashboard Stock ;
- Approvisionnement ;
- Stock actuel ;
- Lots ;
- Mouvements.

### Étape 3 — Articles de contrôle et reporting

Ajouter les articles sur :

- Inventaires ;
- Alertes ;
- Analyses ;
- Rapports et exports.

### Étape 4 — Articles avancés

Ajouter les articles sur :

- Étiquettes ;
- Configuration ;
- PharmaML ;
- Démonstration intégration.

### Étape 5 — Optimisation recherche

Ajouter 3 à 5 mots-clés par article :

```text
stock, rupture, seuils, réapprovisionnement
lots, péremption, FIFO, traçabilité
inventaire, comptage, écarts, réconciliation
étiquettes, code-barres, réception, lot
PharmaML, fournisseur, intégration, transmission
```

### Étape 6 — Vérifications

Après implémentation, je vérifierai :

1. Build TypeScript/Vite.
2. Respect strict du type `GuideArticle`.
3. Affichage des 10 sections dans la sidebar du guide.
4. Recherche full-text sur les nouveaux articles.
5. Fonctionnement des liens `related[]`.
6. Absence de références LodgeSoft ou PharmaCenter.
7. Cohérence des chemins `location` avec les onglets réels.
8. Lisibilité en mode fenêtre et panneau latéral.
9. Couverture complète des onglets réels du module Stock.

---

## Résultat attendu

Le module **Stock** du Guide Utilisateur passera de 2 articles partiels à environ **60 articles structurés**, couvrant toutes les fonctionnalités visibles dans l’application :

- pilotage stock ;
- approvisionnement ;
- stock actuel ;
- lots ;
- mouvements ;
- inventaires ;
- alertes ;
- analyses ;
- étiquettes ;
- configuration ;
- intégrations avancées.

Le guide deviendra exploitable comme documentation utilisateur complète pour les gestionnaires stock, pharmaciens, responsables d’approvisionnement et administrateurs PharmaSoft.
