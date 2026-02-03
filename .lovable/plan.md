
# Audit Multi-Tenant - Contraintes UNIQUE et Génération de Numéros Séquentiels

## Résumé Exécutif

L'audit a identifié **7 contraintes UNIQUE problématiques** et **3 fonctions de génération de numéros** dans le code frontend qui ne respectent pas correctement l'isolation multi-tenant.

---

## 1. Contraintes UNIQUE Sans tenant_id (CRITIQUES)

Ces contraintes peuvent provoquer des erreurs `409 Conflict` lorsque deux tenants différents tentent d'utiliser le même numéro.

| Table | Colonne | Contrainte Actuelle | Risque |
|-------|---------|---------------------|--------|
| `prescriptions` | `numero_prescription` | `UNIQUE(numero_prescription)` | **ÉLEVÉ** - Collision entre pharmacies |
| `retours` | `numero_retour` | `UNIQUE(numero_retour)` | **ÉLEVÉ** - Collision entre pharmacies |
| `programme_fidelite` | `numero_carte` | `UNIQUE(numero_carte)` | **ÉLEVÉ** - Collision entre pharmacies |
| `personnel` | `reference_agent` | `UNIQUE(reference_agent)` | **MOYEN** - Peut bloquer l'ajout d'employés |

### Contraintes Acceptables (ne pas modifier)

| Table | Colonne | Contrainte | Justification |
|-------|---------|------------|---------------|
| `pharmacies` | `code` | `UNIQUE(code)` | ✅ Unicité globale nécessaire (identifiant pharmacie) |
| `transactions_bancaires` | `reference, compte_bancaire_id` | `UNIQUE(reference, compte_bancaire_id)` | ✅ Déjà scopé par compte bancaire |
| `lignes_echeancier` | `echeancier_id, numero_echeance` | `UNIQUE(echeancier_id, numero_echeance)` | ✅ Déjà scopé par échéancier |

---

## 2. Fonctions Frontend de Génération de Numéros (PROBLÉMATIQUES)

Ces fonctions génèrent des numéros séquentiels sans utiliser une fonction RPC atomique, ce qui peut causer des collisions.

### 2.1 Numéro de Retour (`useReturnsExchanges.ts`)

**Fichier** : `src/hooks/useReturnsExchanges.ts` (lignes 244-248)

```typescript
// PROBLÈME : Utilise le count local qui peut être incorrect
const count = (returns?.length || 0) + 1;
const numero = `RET-${dateStr}-${String(count).padStart(4, '0')}`;
```

**Risque** : Deux retours créés simultanément peuvent avoir le même numéro.

---

### 2.2 Numéro de Carte Fidélité (`useLoyaltyProgram.ts`)

**Fichier** : `src/hooks/useLoyaltyProgram.ts` (lignes 109-111)

```typescript
// PROBLÈME : Utilise le count local au lieu d'une séquence atomique
const count = (programs?.length || 0) + 1;
const numero = `FID-${String(count).padStart(8, '0')}`;
```

**Risque** : Deux inscriptions simultanées peuvent générer le même numéro.

---

### 2.3 Numéro de Transfert (`StockTransfers.tsx`)

**Fichier** : `src/components/dashboard/modules/stock/StockTransfers.tsx` (lignes 100-106)

```typescript
// OK mais peut être amélioré : Utilise timestamp donc peu de collision
const generateTransferNumber = () => {
  const timestamp = Date.now().toString().slice(-4);
  return `TRF${year}${month}${timestamp}`;
};
```

**Risque** : Faible car utilise le timestamp, mais pas de contrainte UNIQUE en base.

---

## 3. Fonctions RPC Correctes (Aucune Action)

Ces fonctions utilisent correctement le `tenant_id` :

| Fonction | Paramètre tenant_id | Statut |
|----------|---------------------|--------|
| `generate_pos_invoice_number(p_tenant_id)` | ✅ Explicite | Correct |
| `generate_invoice_number(p_tenant_id, p_type)` | ✅ Explicite | Correct |
| `generate_avoir_number(p_tenant_id)` | ✅ Explicite | Correct |
| `generate_allocation_number(p_tenant_id)` | ✅ Explicite | Correct |
| `generate_piece_number(p_journal_id, p_date)` | ✅ Via journal | Correct |
| `generate_session_number()` | ✅ Via `get_current_user_tenant_id()` | Correct |
| `generate_reception_number()` | ✅ Via trigger avec `NEW.tenant_id` | Correct |

---

## 4. Plan de Correction

### Phase 1 : Migration SQL pour corriger les contraintes UNIQUE

**Fichier** : `supabase/migrations/XXXXXXXX_fix_multi_tenant_unique_constraints.sql`

```sql
-- 1. PRESCRIPTIONS : Ajouter tenant_id à la contrainte unique
ALTER TABLE public.prescriptions 
  DROP CONSTRAINT IF EXISTS prescriptions_numero_prescription_key;
ALTER TABLE public.prescriptions 
  ADD CONSTRAINT prescriptions_tenant_numero_unique 
  UNIQUE (tenant_id, numero_prescription);

-- 2. RETOURS : Ajouter tenant_id à la contrainte unique
ALTER TABLE public.retours 
  DROP CONSTRAINT IF EXISTS retours_numero_retour_key;
ALTER TABLE public.retours 
  ADD CONSTRAINT retours_tenant_numero_retour_unique 
  UNIQUE (tenant_id, numero_retour);

-- 3. PROGRAMME_FIDELITE : Ajouter tenant_id à la contrainte unique
ALTER TABLE public.programme_fidelite 
  DROP CONSTRAINT IF EXISTS programme_fidelite_numero_carte_key;
ALTER TABLE public.programme_fidelite 
  ADD CONSTRAINT programme_fidelite_tenant_numero_carte_unique 
  UNIQUE (tenant_id, numero_carte);

-- 4. PERSONNEL : Ajouter tenant_id à la contrainte unique
ALTER TABLE public.personnel 
  DROP CONSTRAINT IF EXISTS personnel_reference_agent_key;
ALTER TABLE public.personnel 
  ADD CONSTRAINT personnel_tenant_reference_agent_unique 
  UNIQUE (tenant_id, reference_agent);

-- Notifier PostgREST
NOTIFY pgrst, 'reload schema';
```

---

### Phase 2 : Créer des fonctions RPC atomiques

#### 2.1 Fonction pour numéro de retour

```sql
CREATE OR REPLACE FUNCTION public.generate_retour_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
BEGIN
  v_date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  v_lock_key := hashtext(p_tenant_id::TEXT || 'RET' || v_date_prefix);
  
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_retour FROM 'RET-\d{8}-(\d{4})') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.retours
  WHERE tenant_id = p_tenant_id
    AND numero_retour LIKE 'RET-' || v_date_prefix || '-%';
  
  v_numero := 'RET-' || v_date_prefix || '-' || LPAD(v_sequence::TEXT, 4, '0');
  RETURN v_numero;
END;
$$;
```

#### 2.2 Fonction pour numéro de carte fidélité

```sql
CREATE OR REPLACE FUNCTION public.generate_fidelite_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequence INTEGER;
  v_numero TEXT;
  v_lock_key BIGINT;
BEGIN
  v_lock_key := hashtext(p_tenant_id::TEXT || 'FID');
  
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_carte FROM 'FID-(\d{8})') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.programme_fidelite
  WHERE tenant_id = p_tenant_id;
  
  v_numero := 'FID-' || LPAD(v_sequence::TEXT, 8, '0');
  RETURN v_numero;
END;
$$;
```

---

### Phase 3 : Modifier le code Frontend

#### 3.1 `useReturnsExchanges.ts`

```typescript
// Remplacer les lignes 244-248 par :
const { data: numero } = await supabase.rpc('generate_retour_number', {
  p_tenant_id: tenantId
});
```

#### 3.2 `useLoyaltyProgram.ts`

```typescript
// Remplacer les lignes 109-111 par :
const { data: numero } = await supabase.rpc('generate_fidelite_number', {
  p_tenant_id: tenantId
});
```

---

## 5. Résumé des Fichiers à Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/XXXXXXXX_fix_multi_tenant_unique_constraints.sql` | **Créer** | Corriger 4 contraintes UNIQUE |
| `supabase/migrations/XXXXXXXX_create_rpc_generate_numbers.sql` | **Créer** | 2 nouvelles fonctions RPC |
| `src/hooks/useReturnsExchanges.ts` | **Modifier** | Utiliser RPC pour numéro retour |
| `src/hooks/useLoyaltyProgram.ts` | **Modifier** | Utiliser RPC pour numéro carte |

---

## 6. Risques Actuels par Module

| Module | Niveau de Risque | Commentaire |
|--------|------------------|-------------|
| **Ventes (POS)** | ✅ Corrigé | Migration appliquée (ventes_tenant_numero_vente_unique) |
| **Retours** | ⚠️ Critique | Contrainte UNIQUE globale + génération frontend |
| **Fidélité** | ⚠️ Critique | Contrainte UNIQUE globale + génération frontend |
| **Prescriptions** | ⚠️ Critique | Contrainte UNIQUE globale |
| **Personnel** | ⚠️ Moyen | Contrainte UNIQUE globale sur reference_agent |
| **Comptabilité** | ✅ OK | Fonctions RPC correctes |
| **Réceptions** | ✅ OK | Trigger avec tenant_id |
| **Sessions caisse** | ✅ OK | RPC avec get_current_user_tenant_id() |
