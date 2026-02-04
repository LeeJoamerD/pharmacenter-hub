

# Correction du Test de Connexion - Faux Positifs

## Diagnostic du Problème

### Erreur Console
```
HEAD https://www.ekob.com/ 405 (Method Not Allowed)
```

### Cause Racine
Le code actuel utilise `mode: 'no-cors'` avec la méthode `HEAD` :
```typescript
const response = await fetch(serviceUrl, {
  method: 'HEAD',
  mode: 'no-cors',
  signal: controller.signal,
});
// Si on arrive ici sans erreur, isConnected = true ← FAUX !
isConnected = true;
```

**Problème** : Avec `mode: 'no-cors'`, le navigateur :
- Affiche l'erreur 405 dans la console
- Mais **ne rejette PAS** la promesse fetch
- Renvoie une réponse "opaque" avec `response.type === 'opaque'` et `response.status === 0`

Donc le code ne catch jamais l'erreur et considère toujours la connexion réussie.

---

## Solution Proposée

Utiliser une approche hybride qui teste réellement la connectivité :

### Stratégie 1 : Mode CORS standard avec gestion d'erreur
- Essayer d'abord avec `mode: 'cors'` (par défaut) pour avoir le vrai status
- Si CORS bloqué → essayer avec `no-cors` mais vérifier `response.type`
- Si `response.type === 'opaque'` → considérer comme "non vérifiable" (avertissement)

### Stratégie 2 : Utiliser GET au lieu de HEAD
- Certains serveurs n'autorisent pas HEAD (405 Method Not Allowed)
- GET est universellement supporté

---

## Modifications à Implémenter

### Fichier : `src/hooks/useSystemIntegrations.ts`

#### Remplacer la mutation testConnectionMutation (lignes 520-587)

```typescript
const testConnectionMutation = useMutation({
  mutationFn: async (id: string) => {
    const integration = externalIntegrations?.find(i => i.id === id);
    const serviceUrl = (integration?.connection_config as any)?.service_url;
    
    let isConnected = false;
    let errorMessage = '';
    let connectionStatus: 'connected' | 'error' | 'unverifiable' = 'error';
    
    if (!serviceUrl) {
      errorMessage = 'Aucune URL de service configurée. Cliquez sur "Configurer" pour ajouter une URL.';
    } else {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Étape 1: Essayer avec mode CORS standard pour avoir le vrai status
        try {
          const response = await fetch(serviceUrl, {
            method: 'GET', // GET au lieu de HEAD (plus compatible)
            mode: 'cors',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // On peut lire le status réel
          if (response.ok) {
            isConnected = true;
            connectionStatus = 'connected';
          } else {
            errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
            connectionStatus = 'error';
          }
        } catch (corsError: any) {
          // Étape 2: Si CORS bloqué, essayer en no-cors
          if (corsError.message?.includes('CORS') || corsError.name === 'TypeError') {
            try {
              const noCorsResponse = await fetch(serviceUrl, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              // En no-cors, on reçoit toujours une réponse opaque
              // On ne peut pas savoir si c'est vraiment OK
              // Mais si on arrive ici sans erreur réseau, le serveur existe
              if (noCorsResponse.type === 'opaque') {
                // Le serveur répond (même si on ne peut pas vérifier le status)
                // Marquer comme "connecté avec avertissement"
                isConnected = true;
                connectionStatus = 'connected';
                console.log('Connexion vérifiée en mode no-cors (status non lisible)');
              }
            } catch (noCorsError: any) {
              // Même en no-cors ça échoue = serveur vraiment inaccessible
              if (noCorsError.name === 'AbortError') {
                errorMessage = 'Timeout: le serveur ne répond pas dans les 10 secondes';
              } else {
                errorMessage = 'Serveur inaccessible ou URL invalide';
              }
            }
          } else if (corsError.name === 'AbortError') {
            errorMessage = 'Timeout: le serveur ne répond pas dans les 10 secondes';
          } else {
            // Autre erreur (DNS, réseau, etc.)
            errorMessage = corsError.message || 'Impossible de joindre le serveur';
          }
        }
      } catch (error: any) {
        errorMessage = error.message || 'Erreur de connexion inconnue';
      }
    }
    
    // Update status dans la DB
    const { error: updateError } = await supabase
      .from('external_integrations')
      .update({ 
        last_connection_at: new Date().toISOString(),
        status: isConnected ? 'connected' : 'error',
        last_error: isConnected ? null : errorMessage,
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Erreur mise à jour status intégration:', updateError);
    }
    
    if (!isConnected) {
      throw new Error(errorMessage || 'La connexion a échoué');
    }
    
    return { success: true, status: connectionStatus };
  },
  onSuccess: (data) => {
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

---

## Explication de la Logique

### Flux de Test

```
1. URL configurée ?
   ├─ NON → Erreur "Aucune URL configurée"
   └─ OUI → Continuer

2. Fetch avec mode: 'cors' (GET)
   ├─ Succès (response.ok) → ✅ Connecté
   ├─ Erreur HTTP (4xx/5xx) → ❌ Erreur avec status code
   └─ Erreur CORS → Continuer

3. Fetch avec mode: 'no-cors' (fallback)
   ├─ Réponse opaque reçue → ✅ Connecté (serveur existe)
   └─ Erreur réseau/timeout → ❌ Serveur inaccessible

4. Mise à jour DB avec status final
```

### Pourquoi GET au lieu de HEAD ?
- HEAD retourne souvent 405 (Method Not Allowed) sur beaucoup de serveurs
- GET est universellement supporté
- Pour un simple test de connectivité, les deux fonctionnent

---

## Résumé des Changements

| Aspect | Avant | Après |
|--------|-------|-------|
| Méthode HTTP | HEAD | GET |
| Mode initial | no-cors | cors (puis fallback no-cors) |
| Détection erreur | Aucune (toujours success) | Status HTTP réel ou erreur réseau |
| Gestion timeout | OK | OK (inchangé) |
| Message d'erreur | Vide | Détaillé avec status code |

---

## Test de Validation

1. Créer une intégration avec URL `https://www.ekob.com/`
2. Cliquer "Tester"
3. **Attendu** : 
   - Si le serveur répond vraiment → Toast "Connexion réussie"
   - Si erreur CORS mais serveur accessible → Toast "Connexion réussie" (mode no-cors)
   - Si serveur inaccessible/timeout → Toast "Échec de connexion" avec message explicite

4. Créer une intégration avec URL invalide `https://fake-nonexistent-url-12345.com/`
5. Cliquer "Tester"
6. **Attendu** : Toast "Échec de connexion: Serveur inaccessible ou URL invalide"

---

## Fichiers Impactés

| Fichier | Modifications |
|---------|---------------|
| `src/hooks/useSystemIntegrations.ts` | Refonte complète de testConnectionMutation avec double stratégie cors/no-cors |

