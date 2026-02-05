
# Plan de Correction des Erreurs 400 - Section Réglementaire

## Diagnostic

Les erreurs 400 Bad Request sont causées par des **incohérences entre le code et le schéma réel** de la base de données. Voici les problèmes identifiés:

| Table | Problème | Colonnes demandées | Colonnes réelles |
|-------|----------|-------------------|------------------|
| `compliance_actions` | Colonnes inexistantes | `title, description` | `action_description, action_type` |
| `audit_reports` | Colonnes inexistantes | `title, notes` | `report_name, metadata` |
| `pharmacovigilance_reports` | Jointure FK incorrecte | `personnel!pharmacovigilance_reports_declared_by_fkey` | FK n'existe pas avec ce nom exact |
| `narcotics_registry` | Jointures FK incorrectes | `personnel!narcotics_registry_agent_id_fkey` | FK n'existe pas avec ce nom |
| `mandatory_reports` | Jointure FK incorrecte | `personnel!mandatory_reports_responsable_id_fkey` | FK n'existe pas avec ce nom |

### Structure réelle des tables:

**compliance_actions:**
- `id`, `action_description`, `action_type`, `status`, `due_date`, `created_at`, `control_id`, `priority`
- PAS de colonnes `title` ou `description`

**audit_reports:**
- `id`, `report_name`, `report_type`, `status`, `period_start`, `period_end`, `metadata`
- PAS de colonne `title` ou `notes`

---

## Solution

### Fichier: `src/services/RegulatoryService.ts`

#### Correction 1 - getAuditHistory (ligne ~513)

**Avant:**
```typescript
.select('id, title, period_start, status, notes')
```

**Après:**
```typescript
.select('id, report_name, period_start, status, metadata')
```

Et adapter le mapping pour utiliser `report_name` comme `nom`.

#### Correction 2 - getComplianceActions (ligne ~530)

**Avant:**
```typescript
.select('id, title, description, status, due_date, created_at')
```

**Après:**
```typescript
.select('id, action_description, action_type, status, due_date, created_at, priority')
```

Et adapter le mapping pour utiliser `action_description` comme `titre`.

#### Correction 3 - getNarcoticMovements (ligne ~216)

**Avant:**
```typescript
.select(`
  *,
  produits(libelle_produit),
  agent:personnel!narcotics_registry_agent_id_fkey(nom, prenom),
  verifier:personnel!narcotics_registry_verified_by_fkey(nom, prenom)
`)
```

**Après (jointures sans nom FK explicite):**
```typescript
.select(`
  *,
  produits(libelle_produit)
`)
```

Puis récupérer les infos agents séparément ou simplifier sans jointure FK complexe.

#### Correction 4 - getPharmacovigilanceReports (ligne ~318)

**Avant:**
```typescript
.select(`
  *,
  produits(libelle_produit),
  declarant:personnel!pharmacovigilance_reports_declared_by_fkey(nom, prenom)
`)
```

**Après:**
```typescript
.select(`
  *,
  produits(libelle_produit)
`)
```

#### Correction 5 - getMandatoryReports (ligne ~382)

**Avant:**
```typescript
.select(`
  *,
  responsable:personnel!mandatory_reports_responsable_id_fkey(nom, prenom)
`)
```

**Après:**
```typescript
.select('*')
```

---

## Détail des Modifications

### 1. Simplifier les jointures FK

PostgREST nécessite des clés étrangères correctement définies avec des noms que PostgREST peut résoudre. Les jointures avec la syntaxe `!foreign_key_name` échouent car les noms ne correspondent pas.

**Solution:** Supprimer les jointures FK explicites et récupérer les données d'agents séparément, ou utiliser la jointure simple sans spécifier le nom FK.

### 2. Corriger les sélections de colonnes

| Requête | Correction |
|---------|------------|
| `audit_reports` | `title` → `report_name`, `notes` → supprimer ou utiliser `metadata` |
| `compliance_actions` | `title` → `action_description`, `description` → supprimer |

### 3. Adapter les types et mappings

**ComplianceAction (interface):**
```typescript
export interface ComplianceAction {
  id: string;
  titre: string;           // Mappé depuis action_description
  description: string;     // Mappé depuis action_type ou notes
  statut: string;
  echeance?: string;
  created_at: string;
}
```

**AuditEntry (interface):**
```typescript
export interface AuditEntry {
  id: string;
  nom: string;             // Mappé depuis report_name
  date: string;            // Mappé depuis period_start
  statut: string;
  notes?: string;          // Optionnel, depuis metadata si disponible
}
```

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/services/RegulatoryService.ts` | Corriger les requêtes select() et supprimer/simplifier les jointures FK |

---

## Impact

Après ces corrections:
1. Plus d'erreurs 400 sur les requêtes Supabase
2. Les onglets Stupéfiants, Pharmacovigilance, Rapports et Conformité se chargeront correctement
3. Les données réelles seront affichées (même si vides initialement)
