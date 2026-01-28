
# Plan de Consolidation des Comptes Email

## Objectif

Supprimer le compte `djl.computersciences@gmail.com` (ID `414f0849-...`) et transférer cet email au compte actuel de `lee.joamer@gmail.com` (ID `b9cc5585-...`).

## Etat Actuel

### Compte A : lee.joamer@gmail.com (a conserver)
| Ressource | ID | Details |
|-----------|-----|---------|
| auth.users | `b9cc5585-2d79-4efb-81d1-1d8eb69eea05` | Derniere connexion: 27/01/2026 |
| platform_admins | `fd9b4cff-f8d0-4d51-a25c-5a08a4589c06` | DIAMBOMBA LEE JOAMER, actif |
| catalogue_global_produits | - | 10 299 produits crees |
| audit_logs | - | 618 entrees |
| personnel (archive) | `7a3dcaaa-...` | is_active=false, auth_user_id=NULL |

### Compte B : djl.computersciences@gmail.com (a supprimer)
| Ressource | ID | Details |
|-----------|-----|---------|
| auth.users | `414f0849-d89d-48c0-bb7d-f14ae19aac07` | Derniere connexion: 16/01/2026 |
| personnel | `fce2a75d-a28f-49fa-9a34-66ca1a8f64c0` | Role "Invite", tenant DJL, actif |
| ventes | - | 1 vente associee |
| audit_logs | - | 6 entrees |

### Pharmacie DJL - Computer Sciences
| Champ | Valeur |
|-------|--------|
| ID | `b51e3719-13d1-4cfb-96ed-2429bb62b411` |
| Email actuel | lee.joamer@gmail.com |
| Statut | active |

## Schema de la Consolidation

```text
AVANT:
auth.users A (b9cc5585) ──── lee.joamer@gmail.com
    └── platform_admins (10 299 produits)
    
auth.users B (414f0849) ──── djl.computersciences@gmail.com
    └── personnel DJL (fce2a75d, 1 vente)

APRES:
auth.users A (b9cc5585) ──── djl.computersciences@gmail.com
    ├── platform_admins (10 299 produits conserves)
    └── personnel DJL (fce2a75d, 1 vente conservee)
    
Pharmacie DJL ──── djl.computersciences@gmail.com (mise a jour)
```

## Etapes d'Implementation

### Phase 1 : Preparation (Migration SQL)

Dissocier le personnel du compte B avant sa suppression :

```sql
-- Etape 1.1 : Dissocier le personnel du compte B
UPDATE public.personnel 
SET auth_user_id = NULL,
    updated_at = now()
WHERE id = 'fce2a75d-a28f-49fa-9a34-66ca1a8f64c0';
```

**Resultat** : Le personnel reste actif mais n'est plus lie au compte auth.users B.

### Phase 2 : Suppression du Compte B (Dashboard Supabase)

Cette etape doit etre effectuee manuellement dans le Dashboard Supabase :

1. Aller dans **Authentication > Users**
2. Rechercher `djl.computersciences@gmail.com`
3. Supprimer l'utilisateur `414f0849-d89d-48c0-bb7d-f14ae19aac07`

**Pourquoi manuel ?** : Supabase ne permet pas de supprimer des utilisateurs auth via SQL.

### Phase 3 : Changement d'Email du Compte A (Dashboard Supabase)

Mettre a jour l'email du compte A dans le Dashboard Supabase :

1. Aller dans **Authentication > Users**
2. Rechercher `lee.joamer@gmail.com`
3. Cliquer sur l'utilisateur `b9cc5585-2d79-4efb-81d1-1d8eb69eea05`
4. Modifier l'email vers `djl.computersciences@gmail.com`
5. Sauvegarder

### Phase 4 : Synchronisation des Tables (Migration SQL)

Mettre a jour toutes les tables pour refleter le nouvel email :

```sql
-- Etape 4.1 : Mettre a jour l'email de la pharmacie DJL
UPDATE public.pharmacies 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'b51e3719-13d1-4cfb-96ed-2429bb62b411';

-- Etape 4.2 : Mettre a jour l'email du platform_admin
UPDATE public.platform_admins 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'fd9b4cff-f8d0-4d51-a25c-5a08a4589c06';

-- Etape 4.3 : Re-lier le personnel DJL au compte A
UPDATE public.personnel 
SET auth_user_id = 'b9cc5585-2d79-4efb-81d1-1d8eb69eea05',
    email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = 'fce2a75d-a28f-49fa-9a34-66ca1a8f64c0';

-- Etape 4.4 : Mettre a jour le personnel archive (optionnel)
-- Pour coherence, on peut aussi mettre a jour l'email de l'ancien admin archive
UPDATE public.personnel 
SET email = 'djl.computersciences@gmail.com',
    updated_at = now()
WHERE id = '7a3dcaaa-1f81-4b46-86c5-12715ee00e7f';

-- Etape 4.5 : Transferer les audit_logs du compte B vers le compte A (optionnel)
UPDATE public.audit_logs 
SET user_id = 'b9cc5585-2d79-4efb-81d1-1d8eb69eea05'
WHERE user_id = '414f0849-d89d-48c0-bb7d-f14ae19aac07';
```

## Verification Post-Migration

Apres toutes les etapes, verifier :

| Element | Verification |
|---------|--------------|
| auth.users | Un seul compte avec email `djl.computersciences@gmail.com` |
| platform_admins | Email = `djl.computersciences@gmail.com`, 10 299 produits conserves |
| pharmacies DJL | Email = `djl.computersciences@gmail.com` |
| personnel DJL | Re-lie au compte A, email = `djl.computersciences@gmail.com` |
| Connexion | Tester la connexion avec `djl.computersciences@gmail.com` |

## Resume des Actions

| # | Action | Type | Responsable |
|---|--------|------|-------------|
| 1 | Dissocier personnel du compte B | Migration SQL | Lovable |
| 2 | Supprimer compte B (414f0849) | Dashboard | Utilisateur |
| 3 | Changer email compte A vers djl.computersciences | Dashboard | Utilisateur |
| 4 | Synchroniser pharmacies/platform_admins/personnel | Migration SQL | Lovable |
| 5 | Verification finale | Tests | Utilisateur |

## Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Perte de tracabilite des 10 299 produits | Critique | Le compte A est conserve, pas de risque |
| Perte de la vente associee au personnel | Faible | Le personnel est conserve et re-lie |
| Conflit d'email | Bloquant | On supprime B avant de renommer A |
| Echec de connexion | Moyen | Mot de passe inchange, seul l'email change |

## Note Importante

Apres cette consolidation, vous utiliserez **uniquement** `djl.computersciences@gmail.com` pour :
- Vous connecter comme platform_admin
- Vous connecter comme personnel DJL
- Connecter la pharmacie DJL (via `/pharmacy-connection`)

L'email `lee.joamer@gmail.com` sera completement libere et pourra etre reutilise pour autre chose si necessaire.
