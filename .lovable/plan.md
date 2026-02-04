
# Correction des erreurs 400 - Section Intégrations Comptabilité

## Diagnostic

L'erreur **400 Bad Request** lors de la création d'une intégration externe est causée par des **données invalides envoyées à Supabase**.

### Cause racine identifiée

Dans `SystemIntegrations.tsx`, le composant envoie des valeurs incorrectes :

| Champ | Valeur envoyée | Problème |
|-------|----------------|----------|
| `tenant_id` | `''` (chaîne vide) | UUID invalide |
| `created_at` | `''` (chaîne vide) | Timestamp invalide |
| `updated_at` | `''` (chaîne vide) | Timestamp invalide |

Même si le hook remplace `tenant_id`, le spread operator `{ ...integration, tenant_id }` conserve les autres valeurs vides, qui peuvent interférer avec les valeurs par défaut de la base.

---

## Problèmes détectés par composant

### 1. Intégrations Externes (onglet "Intégrations Externes")
**Fichier** : `src/components/dashboard/modules/accounting/SystemIntegrations.tsx` (lignes 122-137)

Problème :
- Passage de `tenant_id: ''`, `created_at: ''`, `updated_at: ''`
- Utilisation de `as any` qui masque les erreurs TypeScript

### 2. Webhooks (onglet "API et Webhooks")
**Fichier** : `src/components/dashboard/modules/accounting/SystemIntegrations.tsx` (lignes 139-159)

Problème :
- Même pattern avec des valeurs vides
- Passage de `total_calls`, `success_calls`, `failed_calls` alors que le hook les ignore (définis dans mutation)

### 3. Export FEC (onglet "Export FEC")
Aucun problème détecté - utilise les bons paramètres

### 4. Modules Internes (onglet "Modules Internes")
Aucun problème détecté - utilise `updateModuleSyncConfig` qui fonctionne correctement

---

## Solution

### Fichier 1 : `src/components/dashboard/modules/accounting/SystemIntegrations.tsx`

**Modification 1** - Corriger `handleCreateIntegration` (lignes 122-137)

Envoyer uniquement les champs métier nécessaires :

```typescript
const handleCreateIntegration = () => {
  if (!newIntegrationType || !newIntegrationName) return;
  
  createExternalIntegration({
    integration_type: newIntegrationType as 'bank' | 'accounting' | 'tax' | 'social' | 'erp',
    provider_name: newIntegrationName,
    status: 'configured',
    is_active: true,
  });
  
  setNewIntegrationType('');
  setNewIntegrationName('');
};
```

**Modification 2** - Corriger `handleCreateWebhook` (lignes 139-159)

```typescript
const handleCreateWebhook = () => {
  if (!newWebhookName || !newWebhookUrl) return;
  
  createWebhook({
    name: newWebhookName,
    url: newWebhookUrl,
    is_active: true,
    events: ['invoice.created', 'payment.received'],
    retry_count: 3,
    timeout_seconds: 30,
  });
  
  setNewWebhookName('');
  setNewWebhookUrl('');
};
```

### Fichier 2 : `src/hooks/useSystemIntegrations.ts`

**Modification 3** - Nettoyer les données avant insertion (lignes 432-450)

Pour plus de robustesse, filtrer explicitement les champs à insérer :

```typescript
const createExternalIntegrationMutation = useMutation({
  mutationFn: async (integration: {
    integration_type: 'bank' | 'accounting' | 'tax' | 'social' | 'erp';
    provider_name: string;
    status?: string;
    is_active?: boolean;
    connection_config?: any;
    sync_settings?: any;
    metadata?: any;
  }) => {
    if (!tenantId || !user?.id) throw new Error('Tenant ou utilisateur non défini');
    
    const { data, error } = await supabase
      .from('external_integrations')
      .insert({
        tenant_id: tenantId,
        created_by: user.id,
        integration_type: integration.integration_type,
        provider_name: integration.provider_name,
        status: integration.status || 'configured',
        is_active: integration.is_active ?? true,
        connection_config: integration.connection_config || {},
        sync_settings: integration.sync_settings || {},
        metadata: integration.metadata || {},
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  // ... rest unchanged
});
```

**Modification 4** - Améliorer `createWebhookMutation` (lignes 561-587)

```typescript
const createWebhookMutation = useMutation({
  mutationFn: async (webhook: {
    name: string;
    url: string;
    is_active?: boolean;
    events?: string[];
    retry_count?: number;
    timeout_seconds?: number;
    secret_key?: string;
  }) => {
    if (!tenantId || !user?.id) throw new Error('Tenant ou utilisateur non défini');
    
    const { data, error } = await supabase
      .from('webhooks_config')
      .insert({
        tenant_id: tenantId,
        created_by: user.id,
        name: webhook.name,
        url: webhook.url,
        is_active: webhook.is_active ?? true,
        events: webhook.events || [],
        retry_count: webhook.retry_count ?? 3,
        timeout_seconds: webhook.timeout_seconds ?? 30,
        total_calls: 0,
        success_calls: 0,
        failed_calls: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  // ... rest unchanged
});
```

---

## Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `src/components/dashboard/modules/accounting/SystemIntegrations.tsx` | Supprimer les champs inutiles dans les appels de mutation |
| `src/hooks/useSystemIntegrations.ts` | Typage explicite des paramètres et construction propre de l'objet d'insertion |

---

## Tests à effectuer après correction

### Test 1 : Intégrations Externes
1. Aller dans Comptabilité > Intégrations > Intégrations Externes
2. Sélectionner un type d'intégration (ex: "Banque")
3. Entrer un nom de service (ex: "Ecobank")
4. Cliquer "Configurer l'Intégration"
5. Attendu : L'intégration apparaît dans la liste, pas d'erreur 400

### Test 2 : Webhooks
1. Aller dans Comptabilité > Intégrations > API et Webhooks
2. Entrer un nom (ex: "Test Webhook")
3. Entrer une URL (ex: "https://example.com/webhook")
4. Cliquer "Créer Webhook"
5. Attendu : Le webhook apparaît dans la liste, pas d'erreur

### Test 3 : Export FEC
1. Aller dans Comptabilité > Intégrations > Export FEC
2. Sélectionner des dates et un format
3. Cliquer "Générer le FEC"
4. Attendu : L'export apparaît dans l'historique

### Test 4 : Modules Internes
1. Aller dans Comptabilité > Intégrations > Modules Internes
2. Activer/désactiver "Auto Sync" sur un module
3. Cliquer le bouton de synchronisation
4. Attendu : Le statut se met à jour

---

## Résumé des corrections

- Supprimer les champs vides (`tenant_id: ''`, `created_at: ''`, etc.) des appels de mutation
- Retirer les `as any` et utiliser un typage correct
- Construire explicitement l'objet d'insertion côté hook pour garantir des données valides
