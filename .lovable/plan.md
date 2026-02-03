
# Plan - Correction de l'erreur "duplicate key value" sur ventes_numero_vente_key

## Diagnostic

### Problème identifié
L'erreur `duplicate key value violates unique constraint "ventes_numero_vente_key"` (code 23505) se produit lors de la création d'une vente dans le POS.

### Cause racine

1. **Contrainte UNIQUE globale** : L'index `ventes_numero_vente_key` impose l'unicité sur `numero_vente` **sans tenir compte du `tenant_id`** :
   ```sql
   CREATE UNIQUE INDEX ventes_numero_vente_key ON public.ventes USING btree (numero_vente)
   ```

2. **Génération de numéro par tenant** : La fonction RPC `generate_pos_invoice_number` génère des numéros séquentiels **par tenant**, ce qui est correct pour l'isolation multi-tenant.

3. **Collision inévitable** : Quand Pharmacie MAZAYU (tenant `aa8717d1-...`) essaie de créer `POS-20260203-0001`, ce numéro existe déjà pour un autre tenant (`5b752062-...`).

### Données observées

| Numéro | Tenant | Conflit |
|--------|--------|---------|
| `POS-20260203-0001` à `0042` | `5b752062-...` (autre pharmacie) | Existe déjà |
| `POS-20260203-0001` | `aa8717d1-...` (MAZAYU) | Génère conflit |

---

## Solution proposée

### Option retenue : Modifier la contrainte UNIQUE pour inclure le tenant_id

Ceci permet à chaque tenant d'avoir sa propre séquence de numéros de vente.

---

## Modifications à effectuer

### 1. Migration SQL pour corriger la contrainte

**Fichier** : `supabase/migrations/XXXXXXXX_fix_ventes_numero_vente_unique_constraint.sql`

```sql
-- Supprimer l'ancienne contrainte unique globale
DROP INDEX IF EXISTS public.ventes_numero_vente_key;

-- Créer la nouvelle contrainte unique incluant le tenant_id
-- Chaque tenant peut avoir son propre POS-20260203-0001
ALTER TABLE public.ventes 
  ADD CONSTRAINT ventes_tenant_numero_vente_unique 
  UNIQUE (tenant_id, numero_vente);

-- Créer un index pour optimiser les recherches par numero_vente seul (reporting)
CREATE INDEX idx_ventes_numero_vente ON public.ventes(numero_vente);
```

Cette modification :
- Supprime la contrainte globale qui causait les conflits
- Crée une contrainte composite `(tenant_id, numero_vente)` permettant le même numéro dans différents tenants
- Conserve un index simple sur `numero_vente` pour les recherches

---

## Résumé des modifications

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/XXXXXXXX_fix_ventes_numero_vente_unique_constraint.sql` | **Créer** | Migration pour modifier la contrainte UNIQUE |

---

## Résultat attendu

Après cette migration :
1. Pharmacie MAZAYU pourra créer `POS-20260203-0001` sans conflit
2. Chaque tenant aura sa propre séquence indépendante
3. L'unicité reste garantie au sein de chaque tenant
4. La fonction RPC `generate_pos_invoice_number` continuera à fonctionner correctement

---

## Risques et mitigation

| Risque | Mitigation |
|--------|------------|
| Historique de doublons | Aucun risque - les données existantes respectent déjà l'unicité par tenant |
| Performance | L'index composite est plus efficace car filtré par tenant |

---

## Vérification post-migration

```sql
-- Vérifier la nouvelle contrainte
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ventes' 
AND indexname LIKE '%numero%';

-- Attendu : ventes_tenant_numero_vente_unique
```
