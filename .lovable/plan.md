
## Plan de correction — Accueil du guide et largeur du panneau alignés sur LodgeSoft

### Objectif

Corriger les deux écarts constatés dans le **Guide Utilisateur PharmaSoft** en l’alignant précisément sur le comportement et le rendu du guide utilisateur du projet LodgeSoft :

1. Afficher correctement l’**Accueil du guide** avec le bloc “Bienvenue dans votre centre d’aide”.
2. Réduire la largeur du **panneau latéral droit** pour reprendre la largeur LodgeSoft.
3. Conserver l’adaptation PharmaSoft, sans réintroduire les textes LodgeSoft.

---

## 1. Implémenter l’Accueil du guide comme dans LodgeSoft

### Problème identifié

Le composant `GuideHome.tsx` existe déjà, mais il n’est pas encore totalement aligné sur LodgeSoft :

- le rendu visuel du hero est légèrement différent ;
- le texte d’accueil n’a pas tous les détails de LodgeSoft ;
- le bloc de fin présent dans LodgeSoft n’a pas été repris ;
- l’ouverture contextuelle peut sélectionner automatiquement un article, ce qui empêche parfois l’utilisateur d’arriver sur l’Accueil du guide.

### Correction prévue

Dans `src/components/help/guide/GuideHome.tsx`, je vais aligner la structure sur LodgeSoft :

- hero en `rounded-2xl`
- gradient :
  ```text
  from-primary/10 via-primary/5 to-background
  ```
- badge :
  ```text
  Guide Utilisateur PharmaSoft
  ```
- titre :
  ```text
  Bienvenue dans votre centre d’aide
  ```
- texte adapté à PharmaSoft, dans le style LodgeSoft :
  ```text
  Apprenez à tirer le meilleur de PharmaSoft, la solution pensée pour la gestion moderne des officines et réseaux pharmaceutiques africains. Documentation pédagogique, illustrée et organisée par module.
  ```
- compteur d’articles
- raccourci :
  ```text
  Ctrl + H
  ```
- sections :
  - Modules disponibles
  - Démarrer ici
- ajout du texte de fin adapté à PharmaSoft :
  ```text
  Les guides des autres modules et fonctionnalités avancées seront enrichis progressivement : POS, Stock, Comptabilité SYSCOHADA, Réseau d’officines, Rapports, Assistant IA, Paramètres et Administration.
  ```

---

## 2. Garantir que “Accueil du guide” ouvre réellement la page d’accueil

### Problème identifié

Dans `HelpCenterContent.tsx`, une logique contextuelle peut sélectionner automatiquement le premier article du module courant :

```ts
if (activeTab !== 'guide' || selectedArticleId || !currentModule) return;
```

Cela peut empêcher l’affichage initial de la page d’accueil “Bienvenue dans votre centre d’aide”.

### Correction prévue

Je vais ajuster cette logique pour que :

- l’ouverture du Guide Utilisateur affiche par défaut `selectedArticleId = null` ;
- le bouton **Accueil du guide** dans la sidebar affiche toujours `GuideHome` ;
- la sélection automatique d’un article ne prenne pas le dessus sur l’accueil ;
- la recherche, la sidebar et les articles restent fonctionnels.

Le résultat attendu est :

```text
Ouverture du guide → Accueil du guide
Clic sur Accueil du guide → Accueil du guide
Clic sur un article → Article
Recherche → Résultats
```

---

## 3. Aligner la largeur du panneau latéral sur LodgeSoft

### Problème identifié

Le panneau latéral actuel de PharmaSoft est trop large :

```ts
w-[min(48rem,42vw)] max-w-3xl
```

Dans LodgeSoft, la largeur utilisée est :

```ts
w-[420px] xl:w-[460px]
```

### Correction prévue

Dans `src/components/help/HelpSidePanel.tsx`, je remplacerai la largeur actuelle par celle de LodgeSoft :

```tsx
className="h-full w-[420px] xl:w-[460px] shrink-0 border-l border-border bg-background flex flex-col animate-in slide-in-from-right duration-300"
```

Cela donnera un panneau :

- plus compact ;
- aligné avec LodgeSoft ;
- lisible en mode latéral ;
- moins envahissant pour le Dashboard.

---

## 4. Vérifier le comportement en mode panneau latéral

Le guide conservera le comportement prévu :

- le panneau latéral reste non-modal ;
- l’application reste utilisable à gauche ;
- la sidebar arborescente reste accessible via le bouton menu ;
- le contenu principal garde une largeur lisible ;
- le bouton de bascule fenêtre/panneau continue de fonctionner ;
- le choix reste mémorisé dans :
  ```text
  localStorage['pharmasoft.help.displayMode']
  ```

---

## 5. Fichiers concernés

| Fichier | Correction |
|---|---|
| `src/components/help/guide/GuideHome.tsx` | Alignement exact du hero, des sections, du texte et du footer sur LodgeSoft, adapté à PharmaSoft |
| `src/components/help/HelpCenterContent.tsx` | Garantir que l’accueil du guide s’affiche par défaut et reste accessible |
| `src/components/help/HelpSidePanel.tsx` | Remplacer la largeur actuelle par `w-[420px] xl:w-[460px]` comme LodgeSoft |

---

## 6. Vérifications après implémentation

Je vérifierai que :

1. Le guide s’ouvre sur **Accueil du guide**.
2. Le bloc “Bienvenue dans votre centre d’aide” est visible.
3. Le style du hero correspond à LodgeSoft.
4. Les textes sont adaptés à PharmaSoft, sans référence LodgeSoft.
5. Le bouton **Accueil du guide** affiche toujours la page d’accueil.
6. Le panneau latéral a la même largeur que LodgeSoft.
7. Le mode fenêtre reste inchangé.
8. Le mode panneau latéral reste mémorisé.
9. La recherche et l’ouverture des articles restent fonctionnelles.
10. Le build TypeScript/Vite passe sans erreur.

---

## Résultat attendu

Le Guide Utilisateur PharmaSoft affichera un véritable **Accueil du guide** professionnel, avec le même niveau de finition que LodgeSoft, et le panneau latéral droit aura exactement la largeur LodgeSoft, tout en conservant les contenus et libellés adaptés à PharmaSoft.
