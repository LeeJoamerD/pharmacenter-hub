-- Corriger les vues avec SECURITY DEFINER pour utiliser SECURITY INVOKER
-- Cela permet d'appliquer les politiques RLS de l'utilisateur qui interroge la vue

-- Supprimer les vues dans l'ordre des dépendances (CASCADE)
DROP VIEW IF EXISTS public.v_produits_with_famille CASCADE;
DROP VIEW IF EXISTS public.produits_with_stock CASCADE;

-- 1. Recréer la vue produits_with_stock avec SECURITY INVOKER
CREATE VIEW public.produits_with_stock
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.tenant_id,
  p.libelle_produit,
  p.code_cip,
  p.ancien_code_cip,
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
  COALESCE(sum(l.quantite_restante), 0::bigint)::integer AS stock_actuel,
  (SELECT string_agg(d.nom_dci, '/' ORDER BY d.nom_dci)
   FROM produits_dci pd
   JOIN dci d ON d.id = pd.dci_id
   WHERE pd.produit_id = p.id) AS dci_noms
FROM produits p
LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.ancien_code_cip, 
         p.famille_id, p.rayon_id, p.forme_id, p.laboratoires_id, p.dci_id, 
         p.classe_therapeutique_id, p.categorie_tarification_id, p.prix_achat, 
         p.prix_vente_ht, p.prix_vente_ttc, p.tva, p.taux_tva, p.centime_additionnel, 
         p.taux_centime_additionnel, p.stock_limite, p.stock_faible, p.stock_critique, 
         p.is_active, p.created_at, p.updated_at, p.id_produit_source, 
         p.quantite_unites_details_source, p.niveau_detail;

-- 2. Recréer la vue v_produits_with_famille avec SECURITY INVOKER (basée sur produits_with_stock)
CREATE VIEW public.v_produits_with_famille
WITH (security_invoker = true)
AS
SELECT 
  pws.id,
  pws.tenant_id,
  pws.libelle_produit,
  pws.code_cip,
  pws.ancien_code_cip,
  pws.famille_id,
  pws.rayon_id,
  pws.forme_id,
  pws.laboratoires_id,
  pws.dci_id,
  pws.classe_therapeutique_id,
  pws.categorie_tarification_id,
  pws.prix_achat,
  pws.prix_vente_ht,
  pws.prix_vente_ttc,
  pws.tva,
  pws.taux_tva,
  pws.centime_additionnel,
  pws.taux_centime_additionnel,
  pws.stock_limite,
  pws.stock_faible,
  pws.stock_critique,
  pws.is_active,
  pws.created_at,
  pws.updated_at,
  pws.id_produit_source,
  pws.quantite_unites_details_source,
  pws.niveau_detail,
  pws.stock_actuel,
  pws.dci_noms,
  fp.libelle_famille,
  rp.libelle_rayon,
  fg.libelle_forme,
  d.nom_dci,
  ct.libelle_classe AS classe_therapeutique_libelle,
  lab.libelle AS laboratoire_nom,
  cat.libelle_categorie AS categorie_tarification_libelle
FROM produits_with_stock pws
LEFT JOIN famille_produit fp ON fp.id = pws.famille_id
LEFT JOIN rayons_produits rp ON rp.id = pws.rayon_id
LEFT JOIN formes_galeniques fg ON fg.id = pws.forme_id
LEFT JOIN dci d ON d.id = pws.dci_id
LEFT JOIN classes_therapeutiques ct ON ct.id = pws.classe_therapeutique_id
LEFT JOIN laboratoires lab ON lab.id = pws.laboratoires_id
LEFT JOIN categorie_tarification cat ON cat.id = pws.categorie_tarification_id;

-- Accorder les permissions aux utilisateurs authentifiés
GRANT SELECT ON public.produits_with_stock TO authenticated;
GRANT SELECT ON public.v_produits_with_famille TO authenticated;