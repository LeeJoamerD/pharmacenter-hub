

# Fix: `clone_tenant_referential` — colonne `is_principal` inexistante dans `produits_dci`

## Problème

La fonction référence `is_principal` dans `produits_dci`, mais cette colonne n'existe pas. Les seules colonnes sont : `id`, `produit_id`, `dci_id`, `tenant_id`, `created_at`.

## Correction

Nouvelle migration SQL : `CREATE OR REPLACE FUNCTION clone_tenant_referential` avec la section `produits_dci` corrigée :

```sql
-- Avant (ligne ~200)
INSERT INTO produits_dci (tenant_id, produit_id, dci_id, is_principal)
SELECT p_target_tenant, mp.new_id, md.new_id, s.is_principal

-- Après
INSERT INTO produits_dci (tenant_id, produit_id, dci_id)
SELECT p_target_tenant, mp.new_id, md.new_id
```

Retirer `is_principal` de l'INSERT et du SELECT. Le reste de la fonction reste identique.

## Fichier modifié
- Nouvelle migration SQL pour `CREATE OR REPLACE FUNCTION clone_tenant_referential`

