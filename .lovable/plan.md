

# Refonte du bouton "Aide" — Panneau latéral droit style Microsoft Word

## Résumé

Transformer le centre d'aide actuel (Dialog modal) en un **panneau latéral droit** persistant (comme Opera AI dans l'image), avec 4 sous-menus inspirés de Microsoft Word : Aide, Contacter le support, Commentaires, Afficher la formation.

## Architecture actuelle

- Le bouton "Aide" dans le header ouvre un `Dialog` modal (`HelpCenterDialog.tsx`)
- 5 fichiers dans `src/components/help/` : `HelpCenterDialog`, `HelpArticleDialog`, `HelpSearchResults`, `HelpAdminPanel`, `HelpCategoryTree`
- Le hook `useHelpCenter.ts` gère les données (articles, catégories, recherche, historique)
- Layout dans `src/pages/Tableau de bord.tsx` : sidebar gauche + main content

## Plan d'implémentation

### 1. Créer le panneau latéral principal `HelpSidePanel.tsx`

Nouveau composant qui remplace le Dialog modal. Panel fixé à droite de l'écran (largeur ~380px), avec animation slide-in/out. Structure :
- **Header** : titre du sous-menu actif + bouton fermer (X)
- **Barre de navigation** : 4 icônes (Aide, Support, Commentaires, Formation) — inspirée de l'image Microsoft Word (image-479)
- **Zone de contenu** : change selon le sous-menu sélectionné

Le main content se réduit quand le panel est ouvert (pas de superposition).

### 2. Sous-menu "Aide" — `HelpGuideView.tsx`

Inspiré des images Microsoft Word (image-477, image-478) :
- **Barre de recherche** en haut avec icône loupe
- **Navigation fil d'Ariane** : bouton retour ← + bouton accueil 🏠
- **Liste des catégories principales** avec icônes (Prise en main, Tableau de bord, Stock, Ventes, Comptabilité, Rapports, Administration, Assistant IA, Paramètres)
- Clic sur une catégorie → affiche les articles de cette catégorie
- Clic sur un article → affiche le contenu détaillé dans le même panel
- **Vote "Ces informations vous ont-elles été utiles ?"** : boutons Oui/Non (image-478)
- **Guide utilisateur complet** avec contenu statique détaillé pour chaque module (hardcodé + articles DB)

### 3. Sous-menu "Contacter le support" — `HelpContactView.tsx`

Inspiré de l'image Microsoft Word (image-480) :
- Titre "Nous sommes là pour vous aider"
- Description
- Champ de recherche/description du problème
- Bouton "Obtenir de l'aide" → envoie un email ou crée un ticket support
- Liens vers politique de confidentialité

### 4. Sous-menu "Commentaires" — `HelpFeedbackView.tsx`

Inspiré de l'image Microsoft Word (image-481) :
- 3 boutons colorés :
  - 💜 Complimenter
  - 📋 Signaler un problème
  - 💡 Faire une suggestion
- Formulaire contextuel selon le choix

### 5. Sous-menu "Afficher la formation" — `HelpTrainingView.tsx`

Inspiré de l'image Microsoft Word (image-482, image-483) :
- Liste structurée par thème (comme "Formation Word") :
  - Qu'est-ce que PharmaSoft ?
  - Créer une vente
  - Gérer le stock
  - etc.
- Chaque item avec icône ▷ et lien externe possible
- Vote utile en bas

### 6. Contenu du guide utilisateur (hardcodé)

Créer un fichier `src/data/helpGuideContent.ts` avec le contenu détaillé de toutes les fonctionnalités :
- **Prise en main** : premier accès, navigation, raccourcis
- **Tableau de bord** : widgets, métriques, visibilité
- **Administration** : personnel, partenaires, référentiels, clients
- **Stock** : stock actuel, réception, inventaire, transferts
- **Ventes** : point de vente, encaissement, proforma, retours, fidélité, ordonnances
- **Comptabilité** : journaux, plan comptable, salaires
- **Rapports** : génération, export
- **Assistant IA** : utilisation du chatbot
- **Paramètres** : interface, système

### 7. Modifier le layout principal (`Tableau de bord.tsx`)

- Remplacer `HelpCenterDialog` par `HelpSidePanel`
- Le `<main>` prend `flex-1` mais réduit sa largeur quand le panel est ouvert
- Structure : `<div flex> <main flex-1> <HelpSidePanel width=380px si ouvert>`
- Le bouton "Aide" du header toggle le panel au lieu d'ouvrir un dialog

### 8. Supprimer/refactorer les anciens composants

- `HelpCenterDialog.tsx` → remplacé par `HelpSidePanel.tsx`
- `HelpArticleDialog.tsx` → le contenu article s'affiche dans le panel (pas de dialog)
- `HelpSearchResults.tsx` → réutilisé tel quel dans le panel
- `HelpAdminPanel.tsx` → conservé (admin)
- `HelpCategoryTree.tsx` → conservé

## Fichiers créés

| Fichier | Description |
|---------|-------------|
| `src/components/help/HelpSidePanel.tsx` | Panel latéral principal |
| `src/components/help/HelpGuideView.tsx` | Vue Aide (recherche + catégories + articles) |
| `src/components/help/HelpContactView.tsx` | Vue Contacter le support |
| `src/components/help/HelpFeedbackView.tsx` | Vue Commentaires |
| `src/components/help/HelpTrainingView.tsx` | Vue Formation |
| `src/components/help/HelpArticleView.tsx` | Affichage article dans le panel |
| `src/data/helpGuideContent.ts` | Contenu statique du guide utilisateur |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/pages/Tableau de bord.tsx` | Remplacer Dialog par SidePanel, ajuster layout |

## Détails techniques

- Le panel utilise `transition-all duration-300` pour l'animation
- Le contenu principal utilise `mr-[380px]` ou `flex` pour s'adapter
- Le panel est positionné en `fixed right-0 top-0 h-full z-40` ou intégré dans le flex layout
- Les données articles viennent toujours du hook `useHelpCenter` pour le contenu DB
- Le contenu statique du guide (hardcodé) est affiché même sans données en base

