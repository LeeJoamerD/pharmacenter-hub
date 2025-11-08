-- Vue pour éliminer l'ambiguïté PostgREST dans les relations produits-famille
-- Cette vue pré-joint les tables produits et famille_produit pour éviter l'erreur
-- "more than one relationship was found for 'produits' and 'famille_id'"

CREATE OR REPLACE VIEW public.v_produits_with_famille AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.famille_id,
  fp.libelle_famille,
  p.dci_id,
  p.rayon_id,
  p.stock_actuel,
  p.stock_limite,
  p.stock_alerte,
  p.prix_achat,
  p.prix_vente_ht,
  p.prix_vente_ttc,
  p.tva,
  p.is_active,
  p.categorie_tarification_id,
  p.created_at,
  p.updated_at
FROM public.produits p
LEFT JOIN public.famille_produit fp ON fp.id = p.famille_id;

-- Activer RLS sur la vue avec security_invoker pour hériter des permissions
ALTER VIEW public.v_produits_with_famille SET (security_invoker = true);

-- Commenter la vue pour documentation
COMMENT ON VIEW public.v_produits_with_famille IS 
'Vue qui pré-joint produits et famille_produit pour éliminer les ambiguïtés PostgREST dans les requêtes avec relations imbriquées';

-- Permissions
GRANT SELECT ON public.v_produits_with_famille TO authenticated;
GRANT SELECT ON public.v_produits_with_famille TO anon;