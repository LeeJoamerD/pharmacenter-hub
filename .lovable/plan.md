

# Diagnostic et correction : changements invisibles dans /platform-admin

## Constat

Le code source est **correct** dans les deux fichiers :
- `PlatformAdminLayout.tsx` : contient bien les 6 menus dont "Emails Test" (ligne 50-53)
- `GlobalCatalogTable.tsx` : contient bien les 4 colonnes groupees (lignes 357-404)

Pourtant, l'UI affichee montre l'ancienne version (5 menus, 7 colonnes).

## Cause probable

Le projet utilise **VitePWA** avec un service worker qui cache tous les fichiers JS/CSS/HTML (`globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]`). Le service worker peut servir une version cachee meme apres un Ctrl+Shift+R car il intercepte les requetes reseau AVANT le navigateur.

## Correction

1. **Forcer un changement visible** dans `PlatformAdminLayout.tsx` — ajouter un commentaire de version pour forcer le hash du bundle a changer
2. **Forcer un changement visible** dans `GlobalCatalogTable.tsx` — meme approche
3. **Ajouter `skipWaiting`** dans la configuration PWA (`vite.config.ts`) pour que le nouveau service worker prenne effet immediatement au lieu d'attendre le prochain chargement

```typescript
// vite.config.ts - dans la config VitePWA
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  // ... reste inchange
}
```

Cela garantit que quand un nouveau build est deploye, le service worker se met a jour immediatement sans attendre que l'utilisateur ferme tous les onglets.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `vite.config.ts` | Ajout `skipWaiting: true` et `clientsClaim: true` dans la config workbox |
| `PlatformAdminLayout.tsx` | Commentaire de version force (declencheur de rebuild) |
| `GlobalCatalogTable.tsx` | Commentaire de version force (declencheur de rebuild) |

