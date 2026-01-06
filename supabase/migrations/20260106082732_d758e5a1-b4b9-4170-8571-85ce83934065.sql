-- Step 1: Create junction table for products-DCI many-to-many relationship
CREATE TABLE IF NOT EXISTS public.produits_dci (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  dci_id UUID NOT NULL REFERENCES public.dci(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produit_id, dci_id, tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_produits_dci_produit ON public.produits_dci(produit_id);
CREATE INDEX IF NOT EXISTS idx_produits_dci_dci ON public.produits_dci(dci_id);
CREATE INDEX IF NOT EXISTS idx_produits_dci_tenant ON public.produits_dci(tenant_id);

-- Enable RLS
ALTER TABLE public.produits_dci ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Users can view produits_dci from their tenant" ON public.produits_dci;
DROP POLICY IF EXISTS "Users can insert produits_dci in their tenant" ON public.produits_dci;
DROP POLICY IF EXISTS "Users can update produits_dci from their tenant" ON public.produits_dci;
DROP POLICY IF EXISTS "Users can delete produits_dci from their tenant" ON public.produits_dci;

CREATE POLICY "Users can view produits_dci from their tenant" 
ON public.produits_dci 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert produits_dci in their tenant" 
ON public.produits_dci 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update produits_dci from their tenant" 
ON public.produits_dci 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete produits_dci from their tenant" 
ON public.produits_dci 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Migrate existing dci_id values to the junction table
INSERT INTO public.produits_dci (produit_id, dci_id, tenant_id)
SELECT id, dci_id, tenant_id 
FROM public.produits 
WHERE dci_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 2: Drop dependent view first
DROP VIEW IF EXISTS public.v_produits_with_famille;

-- Step 3: Update the produits_with_stock view to include aggregated DCI names
DROP VIEW IF EXISTS public.produits_with_stock;

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
  (COALESCE(sum(l.quantite_restante), 0))::integer AS stock_actuel,
  -- DCI names aggregated with "/" separator (no spaces)
  (
    SELECT string_agg(d.nom_dci, '/' ORDER BY d.nom_dci)
    FROM public.produits_dci pd
    JOIN public.dci d ON d.id = pd.dci_id
    WHERE pd.produit_id = p.id
  ) AS dci_noms
FROM public.produits p
LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.ancien_code_cip, p.famille_id, p.rayon_id, p.forme_id, p.laboratoires_id, p.dci_id, p.classe_therapeutique_id, p.categorie_tarification_id, p.prix_achat, p.prix_vente_ht, p.prix_vente_ttc, p.tva, p.taux_tva, p.centime_additionnel, p.taux_centime_additionnel, p.stock_limite, p.stock_faible, p.stock_critique, p.is_active, p.created_at, p.updated_at, p.id_produit_source, p.quantite_unites_details_source, p.niveau_detail;

-- Step 4: Recreate the v_produits_with_famille view with the new dci_noms field
CREATE VIEW public.v_produits_with_famille AS
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
FROM public.produits_with_stock pws
LEFT JOIN public.famille_produit fp ON fp.id = pws.famille_id
LEFT JOIN public.rayons_produits rp ON rp.id = pws.rayon_id
LEFT JOIN public.formes_galeniques fg ON fg.id = pws.forme_id
LEFT JOIN public.dci d ON d.id = pws.dci_id
LEFT JOIN public.classes_therapeutiques ct ON ct.id = pws.classe_therapeutique_id
LEFT JOIN public.laboratoires lab ON lab.id = pws.laboratoires_id
LEFT JOIN public.categorie_tarification cat ON cat.id = pws.categorie_tarification_id;