

# Réduction de la taille des éléments dans /platform-admin

## Problème
Les composants de `/platform-admin` utilisent des tailles plus grandes que le dashboard principal : titres en `text-3xl`, icônes en `h-8 w-8`, sidebar en `w-64`, padding `p-6`, etc. L'objectif est d'aligner visuellement avec le dashboard.

## Fichiers modifiés

### 1. `PlatformAdminLayout.tsx` — Sidebar et conteneur principal
- Sidebar : `w-64` → `w-56` (plus proche du dashboard)
- Header sidebar : `p-4` → `p-3`, icône Shield `h-6 w-6` → `h-5 w-5`, titre `text-lg` → `text-sm`
- Nav : `p-4` → `p-2`, items `gap-3 px-3 py-2` → `gap-2 px-2 py-1.5`, icônes `h-5 w-5` → `h-4 w-4`, texte `font-medium` → `text-sm`
- Footer : `p-4` → `p-2`, `space-y-3` → `space-y-2`
- Main content : `p-6` → `p-4`

### 2. `PlatformOverview.tsx` — Vue d'ensemble
- Titre : `text-3xl` → `text-xl`
- Stat values : `text-2xl` → `text-lg`
- Quick actions : icônes `h-6 w-6` → `h-5 w-5`, `p-3` → `p-2`

### 3. `GlobalCatalogManager.tsx` — Catalogue
- Titre : `text-3xl` → `text-xl`, icône `h-8 w-8` → `h-5 w-5`

### 4. `GlobalAccountingPlanManager.tsx` — Plans Comptables
- Titre : `text-3xl` → `text-xl`, icône `h-8 w-8` → `h-5 w-5`

### 5. `AllowedTestEmailsManager.tsx` — Emails Test
- Titre : `text-2xl` → `text-xl`

### 6. `PlatformConfiguration.tsx` — Configuration
- Loader : `h-8 w-8` → `h-6 w-6`
- Titres si `text-2xl`/`text-3xl` → `text-xl`

### 7. `SecurityTestSuite.tsx` et `PlatformTestSuite.tsx`
- Stats values : `text-2xl` → `text-lg`

### 8. `GlobalCatalogCategoryUpdate.tsx`
- Stats values : `text-2xl` → `text-lg`

## Résumé des changements de taille
| Élément | Avant | Après |
|---------|-------|-------|
| Titres pages | text-3xl | text-xl |
| Sous-titres | text-2xl | text-lg |
| Icônes titres | h-8 w-8 | h-5 w-5 |
| Sidebar largeur | w-64 | w-56 |
| Sidebar nav items | py-2, h-5 | py-1.5, h-4 |
| Main padding | p-6 | p-4 |

