-- Fix numeric field overflow for tva and centime_additionnel columns
-- These columns were NUMERIC(5,2) which caused overflow when calculating values for expensive products

-- Step 1: Drop dependent views in correct order
DROP VIEW IF EXISTS v_produits_with_famille;
DROP VIEW IF EXISTS produits_with_stock;

-- Step 2: Increase precision of columns from NUMERIC(5,2) to NUMERIC(15,2)
ALTER TABLE public.produits 
  ALTER COLUMN tva TYPE NUMERIC(15, 2),
  ALTER COLUMN centime_additionnel TYPE NUMERIC(15, 2);

-- Step 3: Recreate produits_with_stock view
CREATE OR REPLACE VIEW produits_with_stock AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.famille_id,
  p.rayon_id,
  p.forme_id,
  p.laboratoires_id,
  p.dci_id,
  p.classe_therapeutique_id,
  p.categorie_tarification_id,
  p.prix_achat,
  p.prix_vente_ht,
  p.prix_vente_ttc,
  p.tva,
  p.taux_tva,
  p.centime_additionnel,
  p.taux_centime_additionnel,
  p.stock_limite,
  p.stock_faible,
  p.stock_critique,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.id_produit_source,
  p.quantite_unites_details_source,
  p.niveau_detail,
  COALESCE(SUM(l.quantite_restante), 0::bigint)::integer AS stock_actuel
FROM produits p
LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.famille_id, p.rayon_id, p.forme_id, 
         p.laboratoires_id, p.dci_id, p.classe_therapeutique_id, p.categorie_tarification_id, 
         p.prix_achat, p.prix_vente_ht, p.prix_vente_ttc, p.tva, p.taux_tva, p.centime_additionnel, 
         p.taux_centime_additionnel, p.stock_limite, p.stock_faible, p.stock_critique, p.is_active, 
         p.created_at, p.updated_at, p.id_produit_source, p.quantite_unites_details_source, p.niveau_detail;

-- Step 4: Recreate v_produits_with_famille view
CREATE OR REPLACE VIEW v_produits_with_famille AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.famille_id,
  p.rayon_id,
  p.forme_id,
  p.laboratoires_id,
  p.dci_id,
  p.classe_therapeutique_id,
  p.categorie_tarification_id,
  p.prix_achat,
  p.prix_vente_ht,
  p.prix_vente_ttc,
  p.tva,
  p.taux_tva,
  p.centime_additionnel,
  p.taux_centime_additionnel,
  p.stock_limite,
  p.stock_faible,
  p.stock_critique,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.id_produit_source,
  p.quantite_unites_details_source,
  p.niveau_detail,
  p.stock_actuel,
  f.libelle_famille
FROM produits_with_stock p
LEFT JOIN famille_produit f ON f.id = p.famille_id;