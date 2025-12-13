-- Arrondir les prix pour supprimer les décimales (règles mathématiques)
UPDATE public.produits
SET 
  prix_achat = ROUND(COALESCE(prix_achat, 0)),
  prix_vente_ht = ROUND(COALESCE(prix_vente_ht, 0)),
  prix_vente_ttc = ROUND(COALESCE(prix_vente_ttc, 0)),
  updated_at = NOW()
WHERE 
  prix_achat != ROUND(COALESCE(prix_achat, 0))
  OR prix_vente_ht != ROUND(COALESCE(prix_vente_ht, 0))
  OR prix_vente_ttc != ROUND(COALESCE(prix_vente_ttc, 0));