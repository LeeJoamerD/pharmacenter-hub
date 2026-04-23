
## Plan d’implémentation — Articles manquants du module Administration

### Objectif

Compléter le **Guide Utilisateur PharmaSoft** pour que le module **Administration** couvre réellement tous les sous-modules, onglets, composants et actions exposés dans l’application.

Le travail portera uniquement sur le contenu du guide, sans modifier les onglets Support, Commentaires et Formation.

---

## 1. Périmètre Administration à couvrir

Le module Administration réel regroupe les sous-modules suivants dans le Dashboard :

```text
Administration
├── Dashboard Administration
├── Personnel
│   ├── Employés
│   ├── Plannings
│   ├── Congés
│   └── Formations
├── Partenaires
│   ├── Vue d’ensemble
│   ├── Assureurs
│   ├── Sociétés
│   ├── Conventionnés
│   ├── Fournisseurs
│   └── Laboratoires
├── Référentiel Produits
│   ├── Vue d’ensemble
│   ├── Catalogue
│   ├── Formes
│   ├── Familles
│   ├── Rayons
│   ├── Catégories
│   ├── DCI
│   ├── Classes thérapeutiques
│   └── Réglementations
├── Clients
│   ├── Analytics
│   └── Clients
├── Documents
│   ├── Vue Grille
│   ├── Vue Liste
│   ├── Courriers
│   ├── Emails
│   ├── Rédaction IA
│   ├── Templates
│   └── Catégories
├── Analyses et Reporting
│   ├── Vue d’ensemble
│   ├── Ventes
│   ├── Inventaire
│   └── Rapports
└── Workflows & Automatisation
    ├── Workflows
    ├── Templates
    ├── Historique
    └── Configuration
```

Le guide actuel ne contient que deux articles Administration :

- `administration-personnel-roles`
- `administration-referentiel-produits`

Ces articles seront conservés mais enrichis/repositionnés si nécessaire.

---

## 2. Fichier principal à modifier

Le contenu Administration sera étendu dans :

```text
src/components/help/guide/content/administration.ts
```

Aucun changement UI n’est requis : le guide utilise déjà `registry.ts`, donc les nouveaux articles apparaîtront automatiquement dans la sidebar, la recherche full-text, les articles liés et la page d’accueil du Guide Utilisateur.

---

## 3. Convention de structure des articles

Chaque nouvel article respectera strictement le type existant :

```ts
GuideArticle {
  id: string;
  title: string;
  objective: string;
  location?: string;
  audience?: string[];
  intro: string;
  steps?: GuideStep[];
  callouts?: GuideCallout[];
  bestPractices?: string[];
  faq?: GuideFAQ[];
  related?: string[];
  keywords?: string[];
}
```

### Convention d’identifiants

Pour rester cohérent avec les articles existants, les nouveaux IDs utiliseront le préfixe :

```text
administration-
```

Exemples :

```text
administration-dashboard-vue-ensemble
administration-personnel-employes
administration-partenaires-assureurs
administration-referentiel-dci
administration-documents-courriers
administration-workflows-configuration
```

### Convention de localisation

Les chemins suivront la navigation réelle :

```text
Administration → Personnel → Employés
Administration → Partenaires → Assureurs
Administration → Référentiel Produits → Catalogue
Administration → Documents → Rédaction IA
Administration → Workflows & Automatisation → Configuration
```

---

## 4. Nouvelle organisation proposée dans le guide

Je restructurerai `administrationModule.sections` en sections lisibles :

```text
Administration
├── Pilotage administratif
├── Personnel
├── Partenaires
├── Référentiel produits
├── Clients
├── Documents et communications
├── Analyses administratives
└── Workflows et automatisation
```

Cela évite une longue liste plate et permet à l’utilisateur de retrouver les articles par logique métier.

---

## 5. Articles à ajouter

### A. Pilotage administratif

#### 1. `administration-dashboard-vue-ensemble`
**Titre :** Comprendre le Dashboard Administration  
**Location :** Administration  
**Couvre :**
- métriques Personnel, Partenaires, Référentiel, Alertes Système ;
- widgets Actions rapides, Alertes, Activité récente ;
- Approbations en attente ;
- indicateurs Documents, Clients, Workflows.

**Callouts prévus :**
- Info : les métriques sont isolées par pharmacie/tenant.
- Tip : utiliser Actualiser après une opération importante.

---

#### 2. `administration-dashboard-alertes-approbations`
**Titre :** Suivre les alertes, activités et approbations  
**Location :** Administration  
**Couvre :**
- alertes système ;
- approbations personnel/documents ;
- activité récente ;
- priorisation des éléments critiques.

**Callouts prévus :**
- Warning : une alerte critique doit être traitée avant les opérations sensibles.
- Info : les actions restent traçables dans le contexte multi-tenant.

---

### B. Personnel

#### 3. `administration-personnel-employes`
**Titre :** Gérer les fiches employés  
**Location :** Administration → Personnel → Employés  
**Couvre :**
- recherche ;
- filtres RH ;
- vue tableau/cartes ;
- création/modification/suppression ;
- informations personnelles, contractuelles et compte client associé.

**Callouts prévus :**
- Warning : le formulaire RH ne doit pas modifier le rôle utilisateur.
- Info : le rôle et le statut d’accès sont gérés dans Paramètres → Utilisateurs.

---

#### 4. `administration-personnel-plannings`
**Titre :** Planifier les horaires du personnel  
**Location :** Administration → Personnel → Plannings  
**Couvre :**
- création d’un planning ;
- employé, date, heure début/fin ;
- type de shift ;
- poste ;
- statuts Planifié, Confirmé, En cours, Terminé, Annulé.

**Callouts prévus :**
- Tip : vérifier les conflits de présence avant validation.
- Info : les plannings s’appuient sur les fiches personnel existantes.

---

#### 5. `administration-personnel-conges`
**Titre :** Gérer les demandes de congé  
**Location :** Administration → Personnel → Congés  
**Couvre :**
- création de demande ;
- type de congé ;
- dates début/fin ;
- motif/commentaires ;
- approbation/rejet ;
- suivi des statuts.

**Callouts prévus :**
- Warning : approuver un congé impacte l’organisation opérationnelle.
- Tip : renseigner un motif clair pour faciliter le suivi RH.

---

#### 6. `administration-personnel-formations`
**Titre :** Suivre les formations du personnel  
**Location :** Administration → Personnel → Formations  
**Couvre :**
- création d’une formation ;
- organisme ;
- période ;
- durée ;
- coût ;
- certificat requis ;
- statut Planifié, En cours, Terminé, Annulé.

**Callouts prévus :**
- Info : les formations aident à suivre les compétences réglementaires.
- Tip : utiliser le champ certificat pour les formations obligatoires.

---

### C. Partenaires

#### 7. `administration-partenaires-vue-ensemble`
**Titre :** Lire la vue d’ensemble des partenaires  
**Location :** Administration → Partenaires → Vue d’ensemble  
**Couvre :**
- compteurs Assureurs, Sociétés, Conventionnés, Fournisseurs, Laboratoires ;
- partenaires récents ;
- actions rapides.

---

#### 8. `administration-partenaires-assureurs`
**Titre :** Gérer les assureurs  
**Location :** Administration → Partenaires → Assureurs  
**Couvre :**
- création/modification/suppression ;
- nom assureur ;
- NIU ;
- contacts ;
- email ;
- limite de dette.

**Callouts prévus :**
- Warning : les limites de dette influencent les ventes assurées.
- Tip : vérifier les contacts WhatsApp/appel pour les relances.

---

#### 9. `administration-partenaires-societes`
**Titre :** Gérer les sociétés partenaires  
**Location :** Administration → Partenaires → Sociétés  
**Couvre :**
- création de société ;
- assureur associé ;
- taux agent / ayant droit ;
- remise automatique ;
- limite de dette ;
- bon autorisé ;
- ticket modérateur ;
- caution.

**Callouts prévus :**
- Info : la création d’une société synchronise le compte client associé.
- Warning : les taux de couverture doivent être validés avant les ventes.

---

#### 10. `administration-partenaires-conventionnes`
**Titre :** Gérer les clients conventionnés  
**Location :** Administration → Partenaires → Conventionnés  
**Couvre :**
- établissement ou personne conventionnée ;
- assureur associé ;
- limites financières ;
- couverture agent/ayant droit ;
- bons ;
- caution ;
- synchronisation client.

**Callouts prévus :**
- Info : les comptes clients conventionnés sont créés/mis à jour automatiquement.
- Warning : supprimer un conventionné peut impacter le suivi client lié.

---

#### 11. `administration-partenaires-fournisseurs`
**Titre :** Gérer les fournisseurs  
**Location :** Administration → Partenaires → Fournisseurs  
**Couvre :**
- informations fournisseur ;
- contacts ;
- NIU ;
- URL fournisseur/import ;
- identifiant et mot de passe fournisseur ;
- indicateur de configuration Browse AI.

**Callouts prévus :**
- Warning : les identifiants fournisseurs doivent rester confidentiels.
- Tip : compléter l’URL/import pour préparer les automatisations d’approvisionnement.

---

#### 12. `administration-partenaires-laboratoires`
**Titre :** Gérer les laboratoires pharmaceutiques  
**Location :** Administration → Partenaires → Laboratoires  
**Couvre :**
- laboratoire ;
- pays du siège ;
- email siège ;
- délégation locale ;
- téléphone appel/WhatsApp ;
- recherche et maintenance de la liste.

---

### D. Référentiel Produits

#### 13. `administration-referentiel-vue-ensemble`
**Titre :** Lire la vue d’ensemble du référentiel produits  
**Location :** Administration → Référentiel Produits → Vue d’ensemble  
**Couvre :**
- compteurs produits, familles, formes, rayons, catégories, DCI, réglementations ;
- produits récents ;
- actions rapides.

---

#### 14. `administration-referentiel-catalogue`
**Titre :** Gérer le catalogue produits  
**Location :** Administration → Référentiel Produits → Catalogue  
**Couvre :**
- recherche produit ;
- création/modification ;
- import ;
- contrôle des données produit ;
- dépendances avant désactivation.

**Callouts prévus :**
- Warning : utiliser `libelle_produit`, jamais `nom`, pour les références produit.
- Info : vérifier les dépendances avant de désactiver un produit.

---

#### 15. `administration-referentiel-formes`
**Titre :** Maintenir les formes galéniques  
**Location :** Administration → Référentiel Produits → Formes  
**Couvre :**
- forme galénique ;
- description ;
- recherche ;
- création/modification/suppression.

---

#### 16. `administration-referentiel-familles`
**Titre :** Organiser les familles de produits  
**Location :** Administration → Référentiel Produits → Familles  
**Couvre :**
- familles ;
- description ;
- classification commerciale ;
- cohérence du référentiel.

**Callouts prévus :**
- Warning : la table est `famille_produit`, pas `familles`.

---

#### 17. `administration-referentiel-rayons`
**Titre :** Organiser les rayons de produits  
**Location :** Administration → Référentiel Produits → Rayons  
**Couvre :**
- libellé rayon ;
- description ;
- organisation physique/logique ;
- recherche.

---

#### 18. `administration-referentiel-categories`
**Titre :** Configurer les catégories tarifaires  
**Location :** Administration → Référentiel Produits → Catégories  
**Couvre :**
- catégories ;
- logique de tarification ;
- usages dans les ventes et rapports.

---

#### 19. `administration-referentiel-dci`
**Titre :** Maintenir les DCI  
**Location :** Administration → Référentiel Produits → DCI  
**Couvre :**
- principes actifs ;
- recherche ;
- création/modification ;
- intérêt pharmaceutique pour l’identification produit.

---

#### 20. `administration-referentiel-classes-therapeutiques`
**Titre :** Classer les produits par classes thérapeutiques  
**Location :** Administration → Référentiel Produits → Classes thérapeutiques  
**Couvre :**
- libellé classe ;
- description ;
- rattachement fonctionnel ;
- usage dans la recherche et l’analyse.

**Callouts prévus :**
- Info : la colonne correcte est `libelle_classe`.

---

#### 21. `administration-referentiel-reglementations`
**Titre :** Suivre les réglementations produits  
**Location :** Administration → Référentiel Produits → Réglementations  
**Couvre :**
- statuts réglementaires ;
- suivi des produits sensibles ;
- mise à jour des informations réglementaires.

---

### E. Clients

#### 22. `administration-clients-analytics`
**Titre :** Analyser le fichier clients  
**Location :** Administration → Clients → Analytics  
**Couvre :**
- synthèse clients ;
- répartition ;
- remises ;
- types clients ;
- activité.

---

#### 23. `administration-clients-gestion`
**Titre :** Consulter et gérer les clients  
**Location :** Administration → Clients → Clients  
**Couvre :**
- recherche ;
- filtres par type et remise ;
- affichage tableau/cartes ;
- modification des clients ordinaires ;
- restriction sur les clients issus d’autres modules.

**Callouts prévus :**
- Warning : les clients Personnel, Entreprise et Conventionné doivent être modifiés depuis leur module d’origine.
- Info : les comptes clients sont créés automatiquement depuis Personnel, Sociétés et Conventionnés.

---

### F. Documents et communications

#### 24. `administration-documents-bibliotheque`
**Titre :** Utiliser la bibliothèque de documents  
**Location :** Administration → Documents → Vue Grille / Vue Liste  
**Couvre :**
- recherche ;
- filtre catégorie ;
- vue grille/liste ;
- upload ;
- édition métadonnées ;
- suppression ;
- téléchargement/consultation.

---

#### 25. `administration-documents-categories`
**Titre :** Classer les documents par catégories  
**Location :** Administration → Documents → Catégories  
**Couvre :**
- catégories système et personnalisées ;
- couleur ;
- description ;
- classement documentaire.

---

#### 26. `administration-documents-courriers`
**Titre :** Gérer les courriers administratifs  
**Location :** Administration → Documents → Courriers  
**Couvre :**
- création de courrier ;
- suivi ;
- contenu administratif ;
- organisation des correspondances.

---

#### 27. `administration-documents-emails`
**Titre :** Préparer et suivre les emails  
**Location :** Administration → Documents → Emails  
**Couvre :**
- rédaction email ;
- destinataire ;
- contenu ;
- suivi des communications.

---

#### 28. `administration-documents-redaction-ia`
**Titre :** Utiliser la rédaction IA documentaire  
**Location :** Administration → Documents → Rédaction IA  
**Couvre :**
- génération assistée ;
- choix du contexte ;
- relecture humaine ;
- transformation en document exploitable.

**Callouts prévus :**
- Warning : toujours relire un document généré par IA avant utilisation officielle.
- Tip : fournir un contexte précis pour améliorer la qualité de génération.

---

#### 29. `administration-documents-templates`
**Titre :** Gérer les templates de documents  
**Location :** Administration → Documents → Templates  
**Couvre :**
- modèles réutilisables ;
- standardisation des courriers ;
- gain de temps administratif.

---

### G. Analyses administratives

#### 30. `administration-analytics-vue-ensemble`
**Titre :** Lire les analyses administratives  
**Location :** Administration → Analyses et Reporting → Vue d’ensemble  
**Couvre :**
- période semaine/mois/trimestre/année ;
- KPI chiffre d’affaires, ventes, produits en stock, clients actifs ;
- rafraîchissement ;
- export global.

---

#### 31. `administration-analytics-ventes`
**Titre :** Analyser les ventes depuis l’administration  
**Location :** Administration → Analyses et Reporting → Ventes  
**Couvre :**
- évolution des ventes ;
- top produits ;
- distribution ;
- export PDF ventes.

---

#### 32. `administration-analytics-inventaire`
**Titre :** Analyser l’inventaire administratif  
**Location :** Administration → Analyses et Reporting → Inventaire  
**Couvre :**
- niveaux de stock ;
- alertes ;
- produits sensibles ;
- export inventaire.

---

#### 33. `administration-analytics-rapports`
**Titre :** Exporter les rapports administratifs  
**Location :** Administration → Analyses et Reporting → Rapports  
**Couvre :**
- PDF ventes ;
- PDF inventaire ;
- PDF clients ;
- PDF financier ;
- Excel global.

**Callouts prévus :**
- Info : les montants respectent la devise et le format régional du tenant.
- Warning : les rapports financiers doivent être rapprochés des modules Comptabilité/SYSCOHADA.

---

### H. Workflows et automatisation

#### 34. `administration-workflows-gestion`
**Titre :** Créer et piloter les workflows  
**Location :** Administration → Workflows & Automatisation → Workflows  
**Couvre :**
- création workflow ;
- catégorie ;
- priorité ;
- type de déclencheur ;
- statut Brouillon/Actif/Inactif ;
- lancement manuel ;
- suppression.

---

#### 35. `administration-workflows-templates`
**Titre :** Utiliser les templates de workflows  
**Location :** Administration → Workflows & Automatisation → Templates  
**Couvre :**
- modèles ;
- création depuis template ;
- duplication ;
- standardisation des processus.

---

#### 36. `administration-workflows-historique`
**Titre :** Suivre l’historique des exécutions  
**Location :** Administration → Workflows & Automatisation → Historique  
**Couvre :**
- exécutions ;
- statut Terminé, Échec, En cours, En pause ;
- progression ;
- logs ;
- résultat.

---

#### 37. `administration-workflows-configuration`
**Titre :** Configurer les règles d’automatisation  
**Location :** Administration → Workflows & Automatisation → Configuration  
**Couvre :**
- notifications ;
- délais ;
- concurrence ;
- déclencheurs automatiques ;
- surveillance stock ;
- événements ventes ;
- retry automatique ;
- audit ;
- accès strict ;
- chiffrement sensible ;
- alertes sécurité.

**Callouts prévus :**
- Warning : les automatisations doivent respecter les droits d’accès et l’isolation RLS.
- Info : activer l’audit facilite la traçabilité des opérations sensibles.

---

## 6. Règles métier à intégrer dans les callouts

Les articles Administration intégreront les contraintes déjà connues du projet :

- **RLS / multi-tenant** : les données administratives restent isolées par pharmacie.
- **Rôles** : ne pas stocker les rôles sur `profiles` ou `users`; utiliser une table dédiée.
- **Personnel** : le formulaire RH ne doit pas écraser les rôles utilisateurs.
- **Clients liés** : Personnel, Sociétés et Conventionnés peuvent synchroniser des comptes clients.
- **Référentiel** : éviter les doublons, respecter les contraintes d’unicité `(tenant_id, label)` quand applicable.
- **Produits** : utiliser `libelle_produit`, jamais `nom`.
- **Référentiel famille** : table `famille_produit`, pas `familles`.
- **Classes thérapeutiques** : utiliser `libelle_classe`.
- **Rapports financiers** : rester cohérent avec Comptabilité/SYSCOHADA.

---

## 7. Étapes d’implémentation proposées

### Étape 1 — Restructuration Administration

Modifier `src/components/help/guide/content/administration.ts` pour organiser le module en sections :

```text
Pilotage administratif
Personnel
Partenaires
Référentiel produits
Clients
Documents et communications
Analyses administratives
Workflows et automatisation
```

Les deux articles existants seront conservés et replacés dans les sections appropriées.

---

### Étape 2 — Ajout des articles Personnel, Partenaires et Référentiel

Ajouter en priorité les articles qui couvrent les modules les plus utilisés :

- Personnel : employés, plannings, congés, formations.
- Partenaires : assureurs, sociétés, conventionnés, fournisseurs, laboratoires.
- Référentiel : catalogue, formes, familles, rayons, catégories, DCI, classes, réglementations.

---

### Étape 3 — Ajout des articles Clients, Documents, Analytics et Workflows

Compléter ensuite les fonctions d’administration avancées :

- Clients analytics et gestion.
- Documents : bibliothèque, catégories, courriers, emails, rédaction IA, templates.
- Analyses : vue d’ensemble, ventes, inventaire, rapports.
- Workflows : gestion, templates, historique, configuration.

---

### Étape 4 — Maillage des articles liés

Ajouter les relations `related[]` pour guider l’utilisateur.

Exemples :

```text
administration-personnel-employes
→ administration-clients-gestion
→ administration-personnel-plannings
→ administration-personnel-conges

administration-partenaires-societes
→ administration-clients-gestion
→ administration-partenaires-assureurs

administration-referentiel-catalogue
→ administration-referentiel-dci
→ administration-referentiel-classes-therapeutiques
→ stock-produits-lots

administration-workflows-configuration
→ administration-dashboard-alertes-approbations
→ parametres-securite
```

---

### Étape 5 — Optimisation recherche

Chaque article recevra 3 à 5 mots-clés ciblés pour améliorer la recherche :

```text
personnel, employés, rôles, RH, accès
assureurs, couverture, dette, ticket modérateur
catalogue, libelle_produit, CIP, référentiel
documents, courriers, templates, rédaction IA
workflows, automatisation, audit, sécurité
```

---

### Étape 6 — Vérifications

Après implémentation, je vérifierai :

1. Le build TypeScript/Vite.
2. L’absence d’erreurs de structure `GuideArticle`.
3. L’affichage correct des nouvelles sections dans la sidebar.
4. La recherche full-text sur les nouveaux mots-clés.
5. L’ouverture des articles liés.
6. L’absence de référence LodgeSoft/PharmaCenter.
7. La cohérence des localisations avec la navigation réelle.
8. La lisibilité dans les deux modes du guide : fenêtre et panneau latéral.

---

## Résultat attendu

Le module **Administration** du Guide Utilisateur couvrira désormais toutes les fonctionnalités réellement exposées dans l’application, avec environ **37 articles structurés**, homogènes et adaptés à PharmaSoft.

L’utilisateur pourra chercher et consulter une aide complète pour :

- dashboard administratif ;
- personnel ;
- partenaires ;
- référentiel produits ;
- clients ;
- documents ;
- analytics ;
- workflows ;
- règles de sécurité, traçabilité et isolation multi-tenant.
