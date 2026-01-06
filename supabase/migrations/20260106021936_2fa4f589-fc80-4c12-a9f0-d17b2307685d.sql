-- Ajouter la colonne ancien_code_cip à la table produits
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS ancien_code_cip TEXT;

-- Index pour les recherches sur ancien_code_cip
CREATE INDEX IF NOT EXISTS idx_produits_ancien_code_cip 
ON public.produits (tenant_id, ancien_code_cip);

-- Commentaire pour documentation
COMMENT ON COLUMN public.produits.ancien_code_cip IS 'Ancien code CIP (EAN7 ou autre format historique)';

-- Drop avec CASCADE pour supprimer les vues dépendantes
DROP VIEW IF EXISTS public.v_produits_with_famille CASCADE;
DROP VIEW IF EXISTS public.produits_with_stock CASCADE;

-- Recréer la vue produits_with_stock avec la nouvelle colonne
CREATE VIEW public.produits_with_stock AS
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
    (COALESCE(sum(l.quantite_restante), 0)::bigint)::integer AS stock_actuel
FROM produits p
LEFT JOIN lots l ON l.produit_id = p.id 
    AND l.tenant_id = p.tenant_id 
    AND l.quantite_restante > 0
GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.ancien_code_cip,
    p.famille_id, p.rayon_id, p.forme_id, p.laboratoires_id, p.dci_id, 
    p.classe_therapeutique_id, p.categorie_tarification_id, p.prix_achat, 
    p.prix_vente_ht, p.prix_vente_ttc, p.tva, p.taux_tva, p.centime_additionnel, 
    p.taux_centime_additionnel, p.stock_limite, p.stock_faible, p.stock_critique, 
    p.is_active, p.created_at, p.updated_at, p.id_produit_source, 
    p.quantite_unites_details_source, p.niveau_detail;

-- Recréer la vue v_produits_with_famille qui dépendait de produits_with_stock
CREATE VIEW public.v_produits_with_famille AS
SELECT 
    pws.*,
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