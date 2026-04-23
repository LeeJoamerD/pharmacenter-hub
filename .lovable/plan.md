
## Audit et remplacement de l’ancien nom "PharmaCenter" par "PharmaSoft"

### Diagnostic

L’audit texte dans le code source montre que les références restantes à l’ancien nom sont concentrées dans le module d’aide affiché par le bouton **Aide**.

Occurrences trouvées : **48 correspondances dans 4 fichiers**.

| Fichier | Type de contenu concerné |
|---|---|
| `src/data/helpGuideContent.ts` | Articles d’aide, contenus de formation, titres et descriptions |
| `src/components/help/HelpTrainingView.tsx` | Titre de la section Formation |
| `src/components/help/HelpFeedbackView.tsx` | Textes de commentaires/feedback |
| `src/components/help/HelpContactView.tsx` | Adresse e-mail de support affichée |

Le cas visible sur votre capture correspond à :

```ts
"L'interface de PharmaCenter est organisée..."
```

dans `src/data/helpGuideContent.ts`.

---

## Correctif prévu

### 1. Remplacer toutes les références textuelles visibles

Je remplacerai toutes les occurrences :

```text
PharmaCenter
```

par :

```text
PharmaSoft
```

dans les textes affichés à l’utilisateur.

Exemples concernés :

```text
Premiers pas avec PharmaCenter
```

deviendra :

```text
Premiers pas avec PharmaSoft
```

```text
L'interface de PharmaCenter est organisée...
```

deviendra :

```text
L'interface de PharmaSoft est organisée...
```

```text
Découvrir PharmaCenter
```

deviendra :

```text
Découvrir PharmaSoft
```

```text
Qu'est-ce que PharmaCenter ?
```

deviendra :

```text
Qu'est-ce que PharmaSoft ?
```

---

### 2. Corriger les textes spécifiques du panneau Aide

Dans les vues du bouton **Aide**, je mettrai à jour :

| Vue | Correction |
|---|---|
| Aide / Guides | Remplacement dans tous les articles et descriptions |
| Aide / Formation | `Formation PharmaCenter` → `Formation PharmaSoft` |
| Aide / Commentaires | `améliorer PharmaCenter` → `améliorer PharmaSoft` |
| Aide / Support | `support@pharmacenter.com` → `support@pharmasoft.com` |

---

### 3. Vérifier l’ensemble du code après correction

Après modification, je relancerai une recherche globale insensible à la casse sur :

```text
PharmaCenter
pharmacenter
pharma center
```

Objectif : obtenir **0 occurrence restante** dans le code applicatif.

---

### 4. Vérifier la compilation

Je lancerai ensuite le build du projet pour confirmer que les changements de texte n’introduisent aucune régression TypeScript/Vite.

---

## Fichiers à modifier

| Fichier | Action |
|---|---|
| `src/data/helpGuideContent.ts` | Remplacer toutes les occurrences dans les guides et formations |
| `src/components/help/HelpTrainingView.tsx` | Corriger le titre de formation |
| `src/components/help/HelpFeedbackView.tsx` | Corriger les textes de feedback |
| `src/components/help/HelpContactView.tsx` | Corriger l’e-mail support affiché |

---

## Résultat attendu

- Le panneau **Aide** n’affichera plus jamais "PharmaCenter".
- Tous les contenus d’aide utiliseront le nom actuel **PharmaSoft**.
- Les sections **Aide**, **Support**, **Commentaires** et **Formation** seront cohérentes.
- Une recherche globale confirmera l’absence de références restantes à l’ancien nom dans le code applicatif.
