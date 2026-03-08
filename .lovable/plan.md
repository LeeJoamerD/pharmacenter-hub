

# Scan : Section « Automatisation » du module « Assistant IA »

## Erreurs identifiees

### Erreur 1 : Champs nullable non geres dans `loadWorkflows`
**Fichier :** `src/hooks/useAIAutomation.ts` (lignes 160-166)

La transformation utilise `...item` (spread) qui propage les valeurs `null` de la base de donnees. Or, l'interface `AutomationWorkflow` declare ces champs comme non-nullable :

| Champ DB (nullable) | Interface (non-nullable) | Risque |
|---------------------|-------------------------|--------|
| `execution_count: number \| null` | `execution_count: number` | `.toString()` sur null = crash |
| `success_count: number \| null` | `success_count: number` | Affichage "null" |
| `failure_count: number \| null` | `failure_count: number` | Affichage "null" |
| `avg_execution_time_ms: number \| null` | `avg_execution_time_ms: number` | Affichage "null" |
| `priority: number \| null` | `priority: number` | Affichage "null" |
| `is_active: boolean \| null` | `is_active: boolean` | Switch toujours off |

Le spread `...item` ecrase les valeurs typees, donc un workflow avec `execution_count = null` affichera "null" au lieu de "0" dans l'UI (ligne 275 de AIAutomation.tsx : `Executions: {wf.execution_count}`).

### Erreur 2 : `started_at` nullable dans les executions
**Fichier :** `src/hooks/useAIAutomation.ts` (ligne 200) et `AIAutomation.tsx` (ligne 338)

La colonne `started_at` est `string | null` en base, mais l'interface declare `started_at: string`. La ligne 338 fait `format(new Date(execution.started_at), ...)` — si `started_at` est null, cela produit un `Invalid Date` et un crash du formatage.

### Erreur 3 : `icon` nullable dans les templates
**Fichier :** `src/hooks/useAIAutomation.ts` (ligne 250-255)

La colonne `icon` est `string | null` en base, mais l'interface declare `icon: string`. Le `TemplateGalleryDialog` appelle `getIconComponent(template.icon)` qui recevrait `null`, ce qui ne crash pas (cas default) mais represente une incoherence de type.

## Composants sans erreur

| Composant | Statut |
|-----------|--------|
| `CreateWorkflowDialog.tsx` | OK |
| `EditWorkflowDialog.tsx` | OK |
| `ExecutionDetailDialog.tsx` | OK |
| `TemplateGalleryDialog.tsx` | OK (sauf reception de `icon: null`) |
| `automationExportUtils.ts` | OK |
| `AIAutomation.tsx` | OK (layout) |
| RPC `execute_ai_workflow` | OK — signature correcte |
| RPC `get_automation_metrics` | OK — retourne Json |

## Corrections

### Fichier : `src/hooks/useAIAutomation.ts`

**Correction 1** — `loadWorkflows` (lignes 160-166) : Ajouter des valeurs par defaut pour tous les champs nullable lors de la transformation :
```
execution_count: item.execution_count ?? 0,
success_count: item.success_count ?? 0,
failure_count: item.failure_count ?? 0,
avg_execution_time_ms: item.avg_execution_time_ms ?? 0,
priority: item.priority ?? 5,
is_active: item.is_active ?? false,
```

**Correction 2** — `loadExecutions` (ligne 200) : Ajouter un default pour `started_at` :
```
started_at: item.started_at || new Date().toISOString(),
```

Et dans la transformation du workflow imbrique (lignes 204-227), ajouter les memes defaults pour les champs nullable du workflow.

**Correction 3** — `loadTemplates` (lignes 250-255) : Ajouter un default pour `icon`, `is_system`, `is_active` :
```
icon: item.icon || 'zap',
is_system: item.is_system ?? false,
is_active: item.is_active ?? true,
```

### Aucune suppression d'element frontend.

