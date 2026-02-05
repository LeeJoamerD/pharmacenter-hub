
# Plan de Correction des Design Tokens et Améliorations

## Contexte et Analyse

### Problèmes identifiés

1. **Design Tokens non mappés dans Tailwind**
   - Les variables CSS `--success`, `--warning`, `--info` existent dans `src/index.css` mais ne sont pas mappées dans `tailwind.config.ts`
   - Résultat : Les composants utilisent des couleurs brutes (`text-green-600`, `bg-blue-100`) au lieu de tokens sémantiques

2. **Couleurs hardcodées dans les composants**
   - `AIReports.tsx` : 15+ occurrences de couleurs hardcodées
   - `PredictionDetailModal.tsx` : 8+ occurrences
   - `RealTimeAnalysisModal.tsx` : 10+ occurrences
   - `ModelSettingsModal.tsx` : 6+ occurrences
   - `AIReportsService.ts` : Couleurs dans `MODEL_COLORS`

3. **Warnings React Router**
   - Warnings de deprecation pour `v7_startTransition` et `v7_relativeSplatPath`

---

## Phase 1 : Extension du Tailwind Config

### Fichier : `tailwind.config.ts`

Ajouter les tokens sémantiques manquants dans la section `colors` :

| Token | Variable CSS | Usage |
|-------|--------------|-------|
| `success` | `--success` | États positifs, validations |
| `success-foreground` | `--success-foreground` | Texte sur fond success |
| `warning` | `--warning` | Alertes, attention |
| `warning-foreground` | `--warning-foreground` | Texte sur fond warning |
| `info` | `--info` | Informations |
| `info-foreground` | `--info-foreground` | Texte sur fond info |

Structure ajoutée :
```text
colors: {
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))'
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))'
  },
  info: {
    DEFAULT: 'hsl(var(--info))',
    foreground: 'hsl(var(--info-foreground))'
  }
}
```

---

## Phase 2 : Refactoring des Composants IA

### 2.1 AIReports.tsx

Remplacements de couleurs :

| Avant | Après |
|-------|-------|
| `bg-green-100 text-green-800` | `bg-success/10 text-success` |
| `bg-blue-100 text-blue-800` | `bg-info/10 text-info` |
| `text-green-600` | `text-success` |
| `text-blue-600` | `text-info` |
| `bg-orange-100 text-orange-800` | `bg-warning/10 text-warning` |
| `text-yellow-600 bg-yellow-50` | `text-warning bg-warning/10` |

### 2.2 PredictionDetailModal.tsx

| Avant | Après |
|-------|-------|
| `bg-red-100 text-red-800` | `bg-destructive/10 text-destructive` |
| `bg-orange-100 text-orange-800` | `bg-warning/10 text-warning` |
| `bg-yellow-100 text-yellow-800` | `bg-warning/20 text-warning` |
| `bg-blue-100 text-blue-800` | `bg-info/10 text-info` |
| `bg-gray-100 text-gray-800` | `bg-muted text-muted-foreground` |

### 2.3 RealTimeAnalysisModal.tsx

| Avant | Après |
|-------|-------|
| `text-green-600` | `text-success` |
| `text-red-600` | `text-destructive` |
| `text-gray-600` | `text-muted-foreground` |
| `bg-green-100 text-green-800` | `bg-success/10 text-success` |
| `bg-red-100 text-red-800` | `bg-destructive/10 text-destructive` |
| `bg-orange-100 text-orange-800` | `bg-warning/10 text-warning` |
| `bg-gray-100 text-gray-800` | `bg-muted text-muted-foreground` |

### 2.4 ModelSettingsModal.tsx

| Avant | Après |
|-------|-------|
| `bg-green-100 text-green-800` | `bg-success/10 text-success` |
| `bg-blue-100 text-blue-800` | `bg-info/10 text-info` |
| `bg-gray-100 text-gray-800` | `bg-muted text-muted-foreground` |
| `bg-yellow-100 text-yellow-800` | `bg-warning/10 text-warning` |
| `bg-red-100 text-red-800` | `bg-destructive/10 text-destructive` |

### 2.5 AIReportsService.ts

Mettre à jour `MODEL_COLORS` pour utiliser les tokens sémantiques :

| Avant | Après |
|-------|-------|
| `text-blue-600` / `bg-blue-50` | `text-info` / `bg-info/10` |
| `text-red-600` / `bg-red-50` | `text-destructive` / `bg-destructive/10` |
| `text-green-600` / `bg-green-50` | `text-success` / `bg-success/10` |
| `text-purple-600` / `bg-purple-50` | `text-primary` / `bg-primary/10` |
| `text-orange-600` / `bg-orange-50` | `text-warning` / `bg-warning/10` |

---

## Phase 3 : Correction des Warnings React Router

### Fichier : `src/App.tsx`

Ajouter les future flags à `BrowserRouter` pour préparer la migration vers React Router v7 :

```text
<BrowserRouter future={{ 
  v7_startTransition: true,
  v7_relativeSplatPath: true 
}}>
```

---

## Phase 4 : Améliorations Fonctionnelles

### 4.1 Amélioration du Service AIReportsService

**Ajout de gestion d'erreurs améliorée :**
- Logging des erreurs de requêtes
- Messages d'erreur plus descriptifs
- Retry automatique pour les requêtes temporairement échouées

**Ajout de cache côté service :**
- Mise en cache des modèles par défaut
- Éviter les recalculs inutiles

### 4.2 Amélioration du Hook useAIReportsEnhanced

**Ajout de fonctionnalités :**
- `isUpdating` : état de mise à jour en cours
- `error` : erreur globale pour affichage utilisateur
- `lastUpdated` : horodatage de la dernière mise à jour

### 4.3 Amélioration du Composant AIReports

**Ajout de fonctionnalités UI :**
- Indicateur de dernière mise à jour dans l'en-tête
- Badge de connexion temps réel actif
- Bouton d'export pour les métriques ML
- Indicateur visuel de mutation en cours

---

## Phase 5 : Création d'un Utilitaire de Couleurs Sémantiques

### Fichier : `src/utils/colorTokens.ts`

Créer un utilitaire centralisé pour la gestion des couleurs sémantiques :

```text
// Fonctions utilitaires
getStatusColor(status: 'active' | 'training' | 'inactive' | 'error' | 'pending')
getImpactColor(impact: 'critical' | 'high' | 'medium' | 'low')
getTrendColor(trend: string) // + ou - prefix
getHealthColor(value: number) // 0-100 scale
```

Cet utilitaire sera utilisé par tous les composants du module IA pour garantir la cohérence des couleurs.

---

## Liste des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `tailwind.config.ts` | Ajout des tokens success, warning, info |
| `src/App.tsx` | Ajout des future flags React Router |
| `src/components/.../ai/AIReports.tsx` | Remplacement des couleurs hardcodées |
| `src/components/.../ai/modals/PredictionDetailModal.tsx` | Remplacement des couleurs |
| `src/components/.../ai/modals/RealTimeAnalysisModal.tsx` | Remplacement des couleurs |
| `src/components/.../ai/modals/ModelSettingsModal.tsx` | Remplacement des couleurs |
| `src/services/AIReportsService.ts` | Mise à jour MODEL_COLORS |
| `src/hooks/useAIReportsEnhanced.ts` | Ajout états error/lastUpdated |

### Nouveau fichier

| Fichier | Description |
|---------|-------------|
| `src/utils/colorTokens.ts` | Utilitaire de couleurs sémantiques |

---

## Ordre d'exécution

1. **Tailwind Config** - Ajouter les nouveaux tokens
2. **App.tsx** - Corriger les warnings React Router
3. **Utilitaire colorTokens** - Créer les fonctions centralisées
4. **Service et Hook** - Améliorer avec nouveaux états
5. **Composants** - Refactorer avec les tokens sémantiques
6. **Test visuel** - Vérifier que les couleurs sont cohérentes

---

## Garanties

- Aucune suppression de fonctionnalité UI
- Comportement visuel identique (mêmes teintes via tokens)
- Meilleure maintenabilité du code
- Support amélioré du dark mode via tokens CSS
- Warnings React Router résolus
- Code plus propre et cohérent
