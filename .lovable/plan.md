
## Plan d’implémentation — Import du guide utilisateur LodgeSoft adapté à PharmaSoft

### Objectif

Remplacer l’onglet actuel **Aide** par un vrai **Guide Utilisateur PharmaSoft**, aligné sur l’architecture, le design, l’ergonomie et la rédaction du guide utilisateur du projet [Remix of Pharmasoft / LodgeSoft](/projects/41313a12-090b-4eff-8f67-e03af272dec3), tout en conservant inchangés les onglets :

- Support
- Commentaires
- Formation

Le guide sera adapté au contexte PharmaSoft : pharmacie, stock, ventes, comptabilité SYSCOHADA, rapports, assistant IA, Chat-PharmaSoft, administration, paramètres, etc.

---

## 1. Nouvelle architecture du guide utilisateur

Je vais créer une architecture extensible sous :

```text
src/components/help/guide/
├── types.ts
├── registry.ts
├── GuideHome.tsx
├── GuideSidebar.tsx
├── GuideArticleView.tsx
└── content/
    ├── presentation.ts
    ├── administration.ts
    ├── stock.ts
    ├── ventes.ts
    ├── comptabilite.ts
    ├── rapports.ts
    ├── assistant.ts
    ├── chat.ts
    └── parametres.ts
```

Chaque futur module pourra être ajouté en créant simplement :

```text
src/components/help/guide/content/<module>.ts
```

puis en l’ajoutant dans :

```text
src/components/help/guide/registry.ts
```

Aucune modification UI ne sera nécessaire pour intégrer un nouveau module.

---

## 2. Modèle de contenu homogène

Chaque article suivra le format professionnel inspiré de LodgeSoft :

```text
Objectif
Localisation
Audience
Présentation
Procédure pas à pas
Bonnes pratiques
Callouts : Astuce / Attention / Info / Bon à savoir
FAQ
Articles liés
Mots-clés
```

Le type de données sera basé sur le modèle LodgeSoft :

```ts
GuideModule
GuideSection
GuideArticle
GuideStep
GuideCallout
GuideFAQ
```

Mais avec une adaptation complète à PharmaSoft.

Exemples de modules PharmaSoft prévus :

| Module | Contenu adapté |
|---|---|
| Présentation de PharmaSoft | Vision produit, concepts clés, premiers pas, navigation |
| Administration | Personnel, utilisateurs, rôles, partenaires, référentiels, audit |
| Stock | Stock actuel, réceptions, lots, inventaires, unités gratuites, étiquettes |
| Ventes | Point de vente, clients, assurances, factures, proformas, retours |
| Comptabilité | Journaux, factures, règlements, fiscalité, SYSCOHADA |
| Rapports | Tableaux de bord, ventes, stock, fiscalité, stupéfiants |
| Assistant IA | Assistant BI, assistant pharma, usages et bonnes pratiques |
| Chat-PharmaSoft | Messages réseau, collaborations, alertes, annuaire officines |
| Paramètres | Système, impression, devise, localisation, sécurité |

---

## 3. Nouvelle interface du Guide Utilisateur

Je vais remplacer l’ancienne vue `HelpGuideView` par une interface plein écran structurée en 3 zones :

```text
┌──────────────────────────────────────────────────────────────┐
│ Header : titre, recherche, toggle fenêtre/panneau, fermer     │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ Zone de lecture                              │
│ arborescente  │ - Accueil du guide                           │
│ modules       │ - Résultats de recherche                     │
│ sections      │ - Article détaillé                           │
│ articles      │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### Accueil du guide

La page d’accueil contiendra :

- Hero “Guide Utilisateur PharmaSoft”
- Nombre total d’articles
- Raccourci clavier `Ctrl + H`
- Tuiles de modules en dégradé
- Raccourcis “Démarrer ici”
- Navigation immédiate vers le premier article de chaque module

### Recherche full-text instantanée

La recherche filtrera instantanément sur :

- titres
- objectifs
- présentations
- étapes
- bonnes pratiques
- FAQ
- mots-clés

Les résultats seront classés par pertinence comme dans LodgeSoft.

---

## 4. Nouveau conteneur d’aide avec deux modes d’affichage

Je vais introduire un conteneur commun :

```text
src/components/help/HelpCenterContent.tsx
```

Il servira à la fois :

- au mode fenêtre modale
- au mode panneau latéral droit

Les onglets seront unifiés dans :

```text
src/components/help/HelpTabsBar.tsx
```

Les libellés seront :

```text
Guide Utilisateur
Support
Commentaires
Formation
```

Le contenu des onglets Support, Commentaires et Formation restera celui de PharmaSoft, sans refonte fonctionnelle.

---

## 5. Mode Fenêtre par défaut

Le mode par défaut sera une modale centrée :

```text
max-w-6xl
w-[95vw]
h-[88vh]
```

Ce mode correspondra à :

```text
Fenêtre
```

Il sera ouvert par défaut lors de la première utilisation.

---

## 6. Mode panneau latéral droit

Un bouton-icône dans le header du guide permettra de basculer vers :

```text
Panneau latéral droit
```

Caractéristiques :

```text
plein hauteur
border-left
bg-background
max-w-3xl
largeur adaptée au viewport
non-modal
l’application reste utilisable
```

En mode panneau latéral, la sidebar arborescente ne restera pas affichée en permanence pour préserver la largeur de lecture. Elle sera accessible via un bouton menu :

```text
☰ Sommaire
```

Ce sommaire s’ouvrira dans un `Sheet` latéral gauche.

---

## 7. Préférence mémorisée dans localStorage

Je vais créer un hook contrôleur dédié :

```text
src/hooks/useHelpCenterController.ts
```

Il gérera :

```ts
open
displayMode: 'dialog' | 'side'
selectedArticleId
searchQuery
activeTab
toggleDisplayMode()
```

La préférence sera stockée dans :

```text
localStorage['pharmasoft.help.displayMode']
```

Ainsi, si l’utilisateur choisit le mode panneau latéral, il retrouvera ce choix à la prochaine session.

Sur mobile ou largeur insuffisante, le mode panneau repassera automatiquement en mode fenêtre pour éviter de casser l’interface.

---

## 8. Intégration dans le Header du Dashboard

Dans :

```text
src/pages/Tableau de bord.tsx
```

Je remplacerai l’ouverture actuelle du simple `HelpSidePanel` par le nouveau contrôleur :

- bouton du header toujours présent
- libellé cohérent avec le nouveau guide
- ouverture du mode sauvegardé
- rendu conditionnel :
  - `HelpCenterDialog` si mode fenêtre
  - `HelpSidePanel` si mode panneau latéral

Le bouton actuel “Aide” deviendra cohérent avec le nouveau centre :

```text
Guide Utilisateur
```

ou restera compact selon l’espace disponible, avec tooltip explicite :

```text
Guide Utilisateur (Ctrl+H)
```

---

## 9. Adaptation depuis LodgeSoft vers PharmaSoft

Je vais réutiliser la structure et les composants du projet LodgeSoft :

- `HelpCenterDialog`
- `HelpSidePanel`
- `HelpCenterContent`
- `HelpTabsBar`
- `GuideHome`
- `GuideSidebar`
- `GuideArticleView`
- `registry.ts`
- `types.ts`

Mais je remplacerai toutes les références LodgeSoft par PharmaSoft :

```text
LodgeSoft → PharmaSoft
PMS hôtelier → gestion pharmaceutique
complexe hôtelier → officine / réseau d’officines
hébergement / chambres → stock / ventes / comptabilité / pharmacie
rôles hôteliers → rôles PharmaSoft
```

Aucun texte hôtelier ne sera importé tel quel s’il n’a pas de sens pour PharmaSoft.

---

## 10. Nettoyage et compatibilité

Je conserverai les vues existantes suivantes, car elles doivent rester inchangées :

```text
HelpContactView.tsx
HelpFeedbackView.tsx
HelpTrainingView.tsx
```

Je remplacerai uniquement leur intégration dans le nouveau shell d’aide.

Je n’écraserai pas le hook existant :

```text
src/hooks/useHelpCenter.ts
```

car il est encore utilisé par l’administration du centre d’aide et les anciennes données dynamiques.

Le nouveau contrôleur sera séparé :

```text
src/hooks/useHelpCenterController.ts
```

pour éviter les régressions.

---

## 11. Vérifications prévues après implémentation

Après les modifications, je vérifierai :

1. Build TypeScript/Vite sans erreur.
2. Le bouton du header ouvre bien le guide.
3. Le mode par défaut est bien “Fenêtre”.
4. Le bouton-icône bascule correctement vers “Panneau latéral”.
5. Le choix est bien restauré via `localStorage`.
6. En mode panneau latéral, le sommaire devient bien un menu déroulant.
7. L’onglet “Guide Utilisateur” affiche la nouvelle page d’accueil.
8. La recherche full-text retourne les articles pertinents.
9. Les articles affichent correctement :
   - Objectif
   - Localisation
   - Audience
   - Présentation
   - Procédure
   - Bonnes pratiques
   - Callouts
   - FAQ
   - Articles liés
10. Les onglets Support, Commentaires et Formation restent fonctionnels.
11. Aucune référence visible à LodgeSoft ou PharmaCenter ne subsiste dans le guide PharmaSoft.

---

## Résultat attendu

L’application disposera d’un Guide Utilisateur PharmaSoft professionnel, structuré, extensible et ergonomique, avec :

- une modale pleine largeur moderne par défaut
- un panneau latéral optionnel mémorisé
- une recherche instantanée
- une navigation arborescente modules → sections → articles
- des articles homogènes et pédagogiques
- un design aligné sur le guide LodgeSoft, mais entièrement adapté à PharmaSoft
- une architecture prête pour ajouter facilement de nouveaux modules de documentation
