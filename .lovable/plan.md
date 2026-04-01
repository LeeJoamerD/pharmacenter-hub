

# Fonction de clonage des lots entre tenants

## Objectif
Créer une RPC `clone_tenant_lots` qui copie tous les lots d'un tenant source vers un tenant cible, en remappant les `produit_id` et `fournisseur_id` vers les IDs du tenant cible.

## Prérequis
Le tenant cible doit déjà avoir son référentiel cloné (via `clone_tenant_referential`) pour que le remappage des FK fonctionne.

## Logique
1. Construire un mapping `ancien_produit_id → nouveau_produit_id` en se basant sur le `code_cip` (identifiant unique du produit)
2. Construire un mapping `ancien_fournisseur_id → nouveau_fournisseur_id` en se basant sur le `nom`
3. Insérer les lots avec nouveaux UUIDs, tenant cible, et FK remappées
4. Retourner le nombre de lots clonés

## Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.clone_tenant_lots(
  p_source_tenant uuid,
  p_target_tenant uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SET LOCAL row_security = off;

  -- Vérification : le tenant cible ne doit pas déjà avoir des lots
  IF (SELECT count(*) FROM lots WHERE tenant_id = p_target_tenant) > 0 THEN
    RAISE EXCEPTION 'Le tenant cible a déjà des lots';
  END IF;

  -- Créer tables temporaires de mapping par code_cip / nom
  CREATE TEMP TABLE _map_produits_lots ON COMMIT DROP AS
    SELECT s.id as old_id, t.id as new_id
    FROM produits s
    JOIN produits t ON t.code_cip = s.code_cip AND t.tenant_id = p_target_tenant
    WHERE s.tenant_id = p_source_tenant;

  CREATE TEMP TABLE _map_fournisseurs_lots ON COMMIT DROP AS
    SELECT s.id as old_id, t.id as new_id
    FROM fournisseurs s
    JOIN fournisseurs t ON t.nom = s.nom AND t.tenant_id = p_target_tenant
    WHERE s.tenant_id = p_source_tenant;

  -- Insérer les lots
  INSERT INTO lots (
    id, tenant_id, produit_id, numero_lot, fournisseur_id,
    date_fabrication, date_reception, date_peremption,
    quantite_initiale, quantite_restante,
    prix_achat_unitaire, prix_vente_suggere,
    statut, emplacement, notes
  )
  SELECT
    gen_random_uuid(), p_target_tenant,
    mp.new_id,
    s.numero_lot,
    mf.new_id,
    s.date_fabrication, s.date_reception, s.date_peremption,
    s.quantite_initiale, s.quantite_restante,
    s.prix_achat_unitaire, s.prix_vente_suggere,
    s.statut, s.emplacement, s.notes
  FROM lots s
  JOIN _map_produits_lots mp ON mp.old_id = s.produit_id
  LEFT JOIN _map_fournisseurs_lots mf ON mf.old_id = s.fournisseur_id
  WHERE s.tenant_id = p_source_tenant;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('lots_clones', v_count);
END;
$$;
```

## SQL à exécuter dans le SQL Editor

Après création de la fonction, pour l'appeler :

```sql
SELECT clone_tenant_lots(
  'UUID_TENANT_SOURCE',
  'UUID_TENANT_CIBLE'
);
```

## Fichier modifié
- Nouvelle migration SQL uniquement

