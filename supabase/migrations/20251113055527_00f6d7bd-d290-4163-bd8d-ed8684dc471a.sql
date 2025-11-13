-- Phase 1: Créer une vue pour calculer automatiquement stock_actuel depuis les lots
-- Cette vue remplace progressivement la colonne stock_actuel de la table produits
-- On exclut la colonne physique stock_actuel et on la remplace par une version calculée

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
  -- Colonne calculée dynamiquement depuis les lots (source unique de vérité)
  COALESCE(SUM(l.quantite_restante), 0)::INTEGER as stock_actuel
FROM produits p
LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
GROUP BY 
  p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.famille_id, p.rayon_id, 
  p.forme_id, p.laboratoires_id, p.dci_id, p.classe_therapeutique_id, 
  p.categorie_tarification_id, p.prix_achat, p.prix_vente_ht, p.prix_vente_ttc, 
  p.tva, p.taux_tva, p.centime_additionnel, p.taux_centime_additionnel, 
  p.stock_limite, p.stock_faible, p.stock_critique, p.is_active, p.created_at, 
  p.updated_at, p.id_produit_source, p.quantite_unites_details_source, p.niveau_detail;

-- Accorder les permissions
GRANT SELECT ON produits_with_stock TO authenticated;

-- Documentation
COMMENT ON VIEW produits_with_stock IS 'Vue qui calcule automatiquement stock_actuel à partir des lots. Remplace progressivement la colonne stock_actuel de la table produits pour garantir la cohérence des données.';