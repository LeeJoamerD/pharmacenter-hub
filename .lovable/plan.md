
# Plan de Correction Définitive : Persistance Session Pharmacie

## Diagnostic Approfondi

### Causes Racine Identifiées

| # | Problème | Localisation | Impact |
|---|----------|--------------|--------|
| 1 | **Nettoyage trop agressif** | `AuthContext.tsx:199-203` | Si l'Edge Function `validate-pharmacy-session` échoue (timeout, erreur réseau), le localStorage est supprimé immédiatement |
| 2 | **Pas de récupération automatique** | `AuthContext.tsx` | Quand un utilisateur est connecté avec un tenant (`pharmacy`) mais que `connectedPharmacy` est null, aucune session n'est recréée |
| 3 | **Désactivation des anciennes sessions** | `authenticate_pharmacy` RPC | Chaque nouvelle authentification pharmacie désactive TOUTES les sessions précédentes, y compris celle en cours d'utilisation |
| 4 | **Race condition au chargement** | `AuthContext.tsx:257-273` | Le listener `onAuthStateChange` peut déclencher des effets avant que `restorePharmacySession` ne soit terminé |

### Preuve du Problème
Les logs montrent :
```
AUTH: Aucune session pharmacie dans localStorage
HERO: isPharmacyConnected: false
```
Alors que le Dashboard reste accessible (car `TenantContext` utilise `pharmacy || connectedPharmacy`).

## Solution en 4 Parties

### Partie 1 : Tolérance aux Erreurs Réseau (AuthContext)

Ne plus supprimer le localStorage en cas d'erreur réseau. Distinguer :
- **Erreur de validation** (session expirée/invalide) → Supprimer
- **Erreur réseau** (timeout, 500, etc.) → Conserver et utiliser les données locales

```typescript
// Changement dans restorePharmacySession
if (error) {
  // NOUVEAU : Distinguer erreur réseau vs erreur de validation
  const isNetworkError = error.message?.includes('network') || 
                         error.message?.includes('timeout') ||
                         error.message?.includes('fetch');
  
  if (isNetworkError) {
    console.warn('AUTH: Erreur réseau, conservation session locale');
    // Restaurer depuis localStorage sans validation serveur
    setConnectedPharmacy({
      ...JSON.parse(savedPharmacySession),
      sessionToken: sessionData.sessionToken
    });
    return true; // Session restaurée localement
  }
  
  // Erreur de validation réelle → supprimer
  localStorage.removeItem('pharmacy_session');
  return false;
}
```

### Partie 2 : Récupération Automatique (AuthContext)

Ajouter une logique de "fallback" : si un utilisateur est connecté avec un `pharmacy` (via personnel/tenant), mais que `connectedPharmacy` est null, créer automatiquement une session.

```typescript
// Nouvelle fonction dans AuthContext
const ensurePharmacySession = async () => {
  // Si pharmacie via tenant mais pas de session pharmacie → créer
  if (pharmacy && !connectedPharmacy) {
    console.log('AUTH: Auto-récupération session pour pharmacie:', pharmacy.name);
    const { error } = await createPharmacySession();
    if (!error) {
      console.log('AUTH: Session pharmacie auto-récupérée avec succès');
    }
  }
};

// Appeler après fetchUserData
useEffect(() => {
  if (pharmacy && !connectedPharmacy && !loading) {
    ensurePharmacySession();
  }
}, [pharmacy, connectedPharmacy, loading]);
```

### Partie 3 : Stockage Enrichi du localStorage

Stocker plus d'informations dans `pharmacy_session` pour permettre une restauration hors-ligne :

```typescript
// Nouveau format localStorage
localStorage.setItem('pharmacy_session', JSON.stringify({
  sessionToken: result.session_token,
  expiresAt: result.expires_at,
  // NOUVEAU : Données pharmacie pour restauration offline
  pharmacy: {
    id: pharmacy.id,
    name: pharmacy.name,
    email: pharmacy.email,
    // ... autres champs essentiels
  }
}));
```

### Partie 4 : Validation Asynchrone Non-Bloquante

Changer la stratégie de validation : restaurer immédiatement depuis localStorage, puis valider en arrière-plan.

```typescript
const restorePharmacySession = async (): Promise<boolean> => {
  const saved = localStorage.getItem('pharmacy_session');
  if (!saved) return false;
  
  const sessionData = JSON.parse(saved);
  if (!sessionData.sessionToken) {
    localStorage.removeItem('pharmacy_session');
    return false;
  }
  
  // ÉTAPE 1 : Restauration immédiate depuis localStorage
  if (sessionData.pharmacy) {
    setConnectedPharmacy({
      ...sessionData.pharmacy,
      sessionToken: sessionData.sessionToken
    });
  }
  
  // ÉTAPE 2 : Validation asynchrone en arrière-plan
  supabase.functions.invoke('validate-pharmacy-session', {
    body: { session_token: sessionData.sessionToken }
  }).then(({ data, error }) => {
    if (error || !data?.valid) {
      console.warn('AUTH: Session invalidée côté serveur, déconnexion...');
      setConnectedPharmacy(null);
      localStorage.removeItem('pharmacy_session');
    } else {
      // Mettre à jour avec les données fraîches du serveur
      setConnectedPharmacy({
        ...data.pharmacy,
        sessionToken: sessionData.sessionToken
      });
    }
  });
  
  return true; // Session restaurée (validation en cours)
};
```

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/contexts/AuthContext.tsx` | Refactorer `restorePharmacySession`, ajouter `ensurePharmacySession`, enrichir le stockage localStorage |
| `src/hooks/usePharmacyConnection.ts` | Exposer la fonction de récupération automatique |

## Diagramme du Nouveau Flux

```text
┌──────────────────────────────────────────────────────────────────┐
│                    CHARGEMENT PAGE                               │
├──────────────────────────────────────────────────────────────────┤
│  1. Lire localStorage('pharmacy_session')                        │
│     ├── sessionToken présent ?                                   │
│     │   ├── OUI → Restaurer immédiatement connectedPharmacy     │
│     │   │         (affichage "Session active" instantané)        │
│     │   │         → Validation async en arrière-plan             │
│     │   │            ├── Valide → OK, mettre à jour données     │
│     │   │            └── Invalide → Déconnecter + nettoyer      │
│     │   └── NON → Pas de session                                 │
│                                                                  │
│  2. Vérifier session Supabase Auth (utilisateur)                 │
│     └── Utilisateur connecté avec pharmacy (tenant) ?            │
│         └── OUI + connectedPharmacy null ?                       │
│             → Auto-récupération : createPharmacySession()        │
│                                                                  │
│  3. Affichage Hero                                               │
│     └── isPharmacyConnected = !!connectedPharmacy.sessionToken   │
└──────────────────────────────────────────────────────────────────┘
```

## Critères de Succès

1. **Rechargements multiples** : La session pharmacie reste visible dans le Hero
2. **Erreurs réseau** : La session n'est pas perdue en cas de timeout Edge Function
3. **Connexion/déconnexion utilisateur** : N'impacte pas la session pharmacie
4. **Dashboard cohérent** : Hero et Dashboard affichent la même pharmacie

## Détails Techniques

### Gestion des Erreurs Edge Function

L'Edge Function `validate-pharmacy-session` peut échouer pour plusieurs raisons :
- **Timeout** (>10s) : Erreur réseau → Conserver session locale
- **500 Internal Error** : Erreur serveur → Conserver session locale  
- **`valid: false`** : Session réellement expirée → Supprimer

### Format localStorage Enrichi

```json
{
  "sessionToken": "abc123...",
  "expiresAt": "2026-02-05T22:57:48Z",
  "pharmacy": {
    "id": "uuid...",
    "name": "Pharmacie La Gloire",
    "email": "pharmacie@example.com",
    "city": "Brazzaville",
    "status": "active"
  }
}
```

### useEffect d'Auto-Récupération

```typescript
// Dans AuthContext, après l'initialisation
useEffect(() => {
  // Condition : utilisateur avec tenant mais pas de session pharmacie
  if (!loading && pharmacy && !connectedPharmacy) {
    console.log('AUTH: Tentative auto-récupération session pharmacie');
    createPharmacySession().then(({ error }) => {
      if (error) {
        console.error('AUTH: Échec auto-récupération:', error);
      } else {
        console.log('AUTH: Session pharmacie auto-récupérée');
      }
    });
  }
}, [loading, pharmacy, connectedPharmacy]);
```

## Risques et Mitigation

| Risque | Mitigation |
|--------|-----------|
| Session expirée affichée comme active | Validation async corrige sous ~2s |
| Données locales obsolètes | Mise à jour silencieuse après validation |
| Création de sessions multiples | RPC désactive les anciennes avant création |

