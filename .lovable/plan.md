
# Correction des fonctionnalités Intégrations - Tests Réels et Actions Opérationnelles

## Problemes Identifiés

### 1. Intégrations Externes - Bouton "Tester la connexion"
**Localisation** : `useSystemIntegrations.ts` lignes 520-549

**Problème actuel** :
```typescript
const testConnectionMutation = useMutation({
  mutationFn: async (id: string) => {
    // Simuler test connexion ← SIMULATION SANS TEST RÉEL
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Toujours marque comme "connected" sans vérification
    await supabase.from('external_integrations').update({ 
      status: 'connected'  // ← Faux positif
    })
  }
});
```

**Solution** : Implémenter un test réel qui vérifie si l'URL du service répond.

---

### 2. API & Webhooks - Bouton "Tester le webhook"
**Localisation** : `useSystemIntegrations.ts` lignes 791-819

**Problème actuel** :
```typescript
const testWebhookMutation = useMutation({
  mutationFn: async (id: string) => {
    // Simuler test webhook ← SIMULATION SANS APPEL RÉEL
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Toujours log success: true sans appeler l'URL
    await supabase.from('webhooks_logs').insert({
      response_status: 200, // ← Faux !
      success: true,        // ← Toujours true
    });
  }
});
```

**Solution** : Appeler réellement l'URL du webhook et capturer le résultat.

---

### 3. Export FEC - Bouton "Télécharger" ne réagit pas
**Localisation** : `useSystemIntegrations.ts` lignes 663-700

**Analyse** : Le code semble correct, mais il peut échouer silencieusement si `personnelId` est undefined ou si l'update Supabase échoue. Le problème peut aussi venir d'une erreur non attrapée dans `downloadFile()`.

**Solution** : Ajouter des logs, améliorer la gestion d'erreur, et s'assurer que le téléchargement se déclenche même si l'update DB échoue.

---

### 4. Intégrations Externes - Configuration ne réagit pas
**Localisation** : `SystemIntegrations.tsx` lignes 348-360 et 722-786

**Analyse** : Le modal s'ouvre correctement (visible dans le code), mais le hook `updateExternalIntegration` peut ne pas se déclencher si l'intégration n'a pas de configuration initiale ou si les états ne sont pas bien initialisés.

**Solution** : Vérifier que les états locaux sont bien synchronisés et que l'update est bien appelé.

---

## Modifications à Implémenter

### Fichier 1 : `src/hooks/useSystemIntegrations.ts`

#### Modification 1 - Test de connexion réel pour intégrations externes (lignes 520-549)

```typescript
const testConnectionMutation = useMutation({
  mutationFn: async (id: string) => {
    // Récupérer l'intégration pour avoir l'URL de service
    const integration = externalIntegrations?.find(i => i.id === id);
    const serviceUrl = (integration?.connection_config as any)?.service_url;
    
    let isConnected = false;
    let errorMessage = '';
    
    if (serviceUrl) {
      try {
        // Test réel de l'URL (avec timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(serviceUrl, {
          method: 'HEAD',
          mode: 'no-cors', // Pour éviter les erreurs CORS
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        // En mode no-cors, on ne peut pas lire le status, mais si on arrive ici sans erreur, c'est OK
        isConnected = true;
      } catch (error: any) {
        isConnected = false;
        errorMessage = error.name === 'AbortError' 
          ? 'Timeout: le serveur ne répond pas' 
          : error.message || 'Connexion impossible';
      }
    } else {
      // Pas d'URL configurée - on simule un test basique
      isConnected = false;
      errorMessage = 'Aucune URL de service configurée';
    }
    
    // Update status selon le résultat
    await supabase
      .from('external_integrations')
      .update({ 
        last_connection_at: new Date().toISOString(),
        status: isConnected ? 'connected' : 'error',
        last_error: isConnected ? null : errorMessage,
      })
      .eq('id', id);
    
    if (!isConnected) {
      throw new Error(errorMessage || 'La connexion a échoué');
    }
    
    return { success: true };
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
    toast({
      title: 'Connexion réussie',
      description: 'Le service externe répond correctement',
    });
  },
  onError: (error: any) => {
    queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
    toast({
      title: 'Échec de connexion',
      description: error.message || 'Le service ne répond pas',
      variant: 'destructive',
    });
  },
});
```

#### Modification 2 - Test de webhook réel (lignes 791-819)

```typescript
const testWebhookMutation = useMutation({
  mutationFn: async (id: string) => {
    if (!tenantId) throw new Error('Tenant non défini');
    
    // Récupérer le webhook pour avoir l'URL
    const webhook = webhooksConfig?.find(w => w.id === id);
    if (!webhook?.url) {
      throw new Error('URL du webhook non configurée');
    }
    
    const startTime = Date.now();
    let success = false;
    let responseStatus = 0;
    let errorMessage = '';
    let responseBody = '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (webhook.timeout_seconds || 30) * 1000);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret_key && { 'X-Webhook-Secret': webhook.secret_key }),
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { test: true, source: 'pharmasoft' }
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      responseStatus = response.status;
      success = response.ok; // 2xx = success
      
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }
    } catch (error: any) {
      success = false;
      if (error.name === 'AbortError') {
        errorMessage = `Timeout après ${webhook.timeout_seconds || 30} secondes`;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'URL inaccessible ou invalide';
      } else {
        errorMessage = error.message || 'Erreur de connexion';
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log du test
    await supabase.from('webhooks_logs').insert({
      tenant_id: tenantId,
      webhook_id: id,
      event_type: 'test',
      payload: { test: true },
      response_status: responseStatus,
      response_body: responseBody?.slice(0, 1000), // Limiter la taille
      response_time_ms: responseTime,
      success,
      error_message: errorMessage || null,
      retry_count: 0,
    });
    
    // Mettre à jour les compteurs du webhook
    await supabase.from('webhooks_config').update({
      last_triggered_at: new Date().toISOString(),
      last_status: success ? 'success' : 'error',
      total_calls: (webhook.total_calls || 0) + 1,
      success_calls: success ? (webhook.success_calls || 0) + 1 : webhook.success_calls || 0,
      failed_calls: !success ? (webhook.failed_calls || 0) + 1 : webhook.failed_calls || 0,
    }).eq('id', id);
    
    if (!success) {
      throw new Error(errorMessage || `Échec HTTP ${responseStatus}`);
    }
    
    return { success: true, responseTime };
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['webhooks-logs', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['webhooks-config', tenantId] });
    toast({
      title: 'Webhook testé avec succès',
      description: `Réponse reçue en ${data.responseTime}ms`,
    });
  },
  onError: (error: any) => {
    queryClient.invalidateQueries({ queryKey: ['webhooks-logs', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['webhooks-config', tenantId] });
    toast({
      title: 'Échec du test webhook',
      description: error.message,
      variant: 'destructive',
    });
  },
});
```

#### Modification 3 - Améliorer le téléchargement FEC (lignes 663-700)

```typescript
const downloadFECExportMutation = useMutation({
  mutationFn: async (fecExport: FECExport) => {
    // Ne pas bloquer le téléchargement si personnelId manque
    // Générer et télécharger le fichier FEC en priorité
    const fileName = `FEC_${fecExport.start_date}_${fecExport.end_date}.${fecExport.format}`;
    const content = generateFECContent(fecExport);
    
    // Déclencher le téléchargement immédiatement
    downloadFile(content, fileName, fecExport.format);
    
    // Ensuite, mettre à jour la DB (non bloquant pour l'UX)
    if (personnelId) {
      try {
        await supabase
          .from('fec_exports')
          .update({ 
            download_count: (fecExport.download_count || 0) + 1,
            downloaded_at: new Date().toISOString(),
            downloaded_by: personnelId,
          })
          .eq('id', fecExport.id);
      } catch (dbError) {
        console.error('Erreur mise à jour compteur téléchargement:', dbError);
        // On ne throw pas, le fichier est déjà téléchargé
      }
    }
    
    return fecExport;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fec-exports', tenantId] });
    toast({
      title: 'Téléchargement démarré',
      description: 'Le fichier FEC a été téléchargé',
    });
  },
  onError: (error: any) => {
    toast({
      title: 'Erreur de téléchargement',
      description: error.message || 'Une erreur est survenue',
      variant: 'destructive',
    });
  },
});
```

---

### Fichier 2 : `src/components/dashboard/modules/accounting/SystemIntegrations.tsx`

#### Modification 4 - Améliorer l'initialisation du modal Configuration (lignes 348-360)

Ajouter une notification visuelle que le modal s'ouvre :

```typescript
<Button 
  size="sm" 
  variant="outline"
  onClick={() => {
    console.log('Opening config modal for:', integration.provider_name);
    setSelectedIntegration(integration);
    setIntegrationApiKey((integration.connection_config as any)?.api_key || '');
    setIntegrationServiceUrl((integration.connection_config as any)?.service_url || '');
    setConfigModalOpen(true);
  }}
  title="Configurer"
>
  <Settings className="h-4 w-4" />
</Button>
```

Le modal existe déjà et fonctionne, mais vérifier que l'import de `Dialog` est correct et que les états sont bien initialisés.

---

## Résumé des Changements

| Composant | Avant | Après |
|-----------|-------|-------|
| Test Intégration | Simulation (toujours succès) | Appel HTTP réel vers l'URL configurée |
| Test Webhook | Simulation (toujours succès) | Appel POST réel vers l'URL du webhook |
| Télécharger FEC | Peut échouer silencieusement | Téléchargement prioritaire, DB en arrière-plan |
| Config Modal | Fonctionne mais peut ne pas s'ouvrir | Ajout de logs et vérification des états |

---

## Tests de Validation

### Test 1 : Intégrations Externes - Test Connexion
1. Créer une intégration avec une URL invalide (ex: `https://fake-url-that-does-not-exist.com`)
2. Cliquer "Tester" → Attendu : Toast "Échec de connexion" + statut "Erreur"
3. Modifier l'intégration avec une URL valide (ex: `https://google.com`)
4. Cliquer "Tester" → Attendu : Toast "Connexion réussie" + statut "Connecté"

### Test 2 : Webhook - Test Réel
1. Créer un webhook avec URL inexistante
2. Cliquer "Tester" → Attendu : Toast "Échec du test webhook" + compteur failed +1
3. Créer un webhook avec URL valide (ex: `https://webhook.site/xxx`)
4. Cliquer "Tester" → Attendu : Toast "Webhook testé avec succès" + temps de réponse

### Test 3 : Export FEC - Téléchargement
1. Générer un FEC
2. Cliquer "Télécharger" → Attendu : Fichier `.txt` téléchargé immédiatement
3. Vérifier le contenu du fichier (header FEC standard)

### Test 4 : Configuration Intégration
1. Cliquer sur l'icône "Settings" d'une intégration
2. Attendu : Modal s'ouvre avec les champs API Key et URL
3. Modifier les valeurs et cliquer "Enregistrer"
4. Rouvrir le modal → Attendu : Valeurs sauvegardées visibles

---

## Fichiers Impactés

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useSystemIntegrations.ts` | Refonte testConnectionMutation, testWebhookMutation, downloadFECExportMutation |
| `src/components/dashboard/modules/accounting/SystemIntegrations.tsx` | Amélioration de l'initialisation du modal configuration |
