

# Plan de correction : Administration Réseau Avancée (Chat-PharmaSoft)

## Erreur identifiée

### Bug critique : Violation des règles React Hooks

Dans `useNetworkAdministration.ts`, lignes 460-468, la fonction `updateBackupJob` appelle `useTenantMutation` a l'interieur d'une fonction async. Les hooks React doivent etre appeles au niveau superieur du composant/hook, jamais dans des callbacks ou fonctions asynchrones. Cela provoque une erreur React a l'execution.

```typescript
// PROBLEME (ligne 463)
const updateBackupJob = async (id: string, data: Partial<BackupJob>) => {
  const updateMutation = useTenantMutation(  // ❌ Hook dans une fonction async
    'network_backup_jobs', 'update',
    { invalidateQueries: ['network-backup-jobs'] }
  );
  await updateMutation.mutateAsync({ id, ...data });
};
```

### Verification des schemas

| Element | Statut |
|---------|--------|
| `network_system_components` — colonnes vs interface | OK |
| `network_admin_settings` — colonnes vs interface | OK |
| `network_security_assets` — colonnes vs interface | OK |
| `network_backup_jobs` — colonnes vs interface | OK |
| `network_backup_runs` — jointure FK `backup_job_id` | OK |
| `network_system_stats` — colonnes vs interface | OK |
| `network_audit_logs` — colonnes vs interface | OK |
| `network_partner_accounts` — colonnes vs interface | OK |
| `network_chat_permissions` — colonnes vs interface | OK |
| `network_channel_invitations` — colonnes vs interface | OK |
| `network_chat_config` — colonnes vs interface | OK |
| `user_sessions` — jointure `personnel(noms, prenoms, role)` | OK |
| RPCs `network_*` (7 fonctions) | OK — Existent toutes |
| Composant `NetworkAdvancedAdministration.tsx` | OK — Safe access |
| Dialogs (5 dialogues) | OK — Props alignees |

## Correction

### Fichier : `src/hooks/useNetworkAdministration.ts`

Declarer le mutation `backupUpdateMutation` au niveau superieur du hook (a cote de `backupMutation` ligne 191-195), puis l'utiliser dans `updateBackupJob` au lieu d'appeler `useTenantMutation` a l'interieur de la fonction.

```typescript
// Ajouter au niveau superieur (apres ligne 195)
const backupUpdateMutation = useTenantMutation(
  'network_backup_jobs',
  'update',
  { invalidateQueries: ['network-backup-jobs'] }
);

// Corriger updateBackupJob (lignes 460-481)
const updateBackupJob = async (id: string, data: Partial<BackupJob>) => {
  try {
    setLoading(true);
    await backupUpdateMutation.mutateAsync({ id, ...data });
    toast({ title: "Tache de sauvegarde mise a jour", ... });
  } catch (error) { ... }
  finally { setLoading(false); }
};
```

Aucun changement frontend. Aucune suppression d'element UI.

## Fichiers impactes

| Action | Fichier |
|--------|---------|
| Corriger hook violation | `src/hooks/useNetworkAdministration.ts` |

