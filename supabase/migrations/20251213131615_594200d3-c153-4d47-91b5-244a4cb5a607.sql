-- Forcer la suppression des décimales avec TRUNC + ROUND
UPDATE public.produits
SET 
  prix_achat = TRUNC(ROUND(COALESCE(prix_achat, 0), 0)),
  prix_vente_ht = TRUNC(ROUND(COALESCE(prix_vente_ht, 0), 0)),
  prix_vente_ttc = TRUNC(ROUND(COALESCE(prix_vente_ttc, 0), 0)),
  updated_at = NOW();