

# Diagnostic : Menu "Emails Test" absent de l'interface

## Constat

Le code source est **correct** :
- `PlatformAdminLayout.tsx` lignes 48-52 : l'item "Emails Test" avec icône `MailCheck` et href `/platform-admin/emails-test` est bien présent dans le tableau `menuItems`
- `PlatformAdmin.tsx` ligne 39 : la route `emails-test` est bien définie avec le composant `AllowedTestEmailsManager`

Le build a réussi sans erreurs bloquantes. Le problème est que le **build déployé ne correspond pas au code source actuel** (cache CDN ou déploiement incomplet).

## Plan de résolution

1. **Forcer un redéploiement** en effectuant une modification mineure (ajout d'un commentaire) dans `PlatformAdminLayout.tsx` pour déclencher un nouveau build et un nouveau hash de fichier, forçant ainsi l'invalidation du cache

2. **Chemin d'accès** : Une fois déployé, le menu "Emails Test" apparaîtra en bas de la sidebar, sous "Configuration", accessible via `/platform-admin/emails-test`

## Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier (trivial) | `src/components/platform-admin/PlatformAdminLayout.tsx` |

