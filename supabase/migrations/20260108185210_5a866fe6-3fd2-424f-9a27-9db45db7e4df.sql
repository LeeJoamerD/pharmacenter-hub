-- ============================================
-- INTEGRATION PHARMAML UBIPHARM
-- ============================================

-- Ajouter les colonnes PharmaML à la table fournisseurs
ALTER TABLE public.fournisseurs 
ADD COLUMN IF NOT EXISTS pharmaml_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pharmaml_url text,
ADD COLUMN IF NOT EXISTS pharmaml_code_repartiteur text,
ADD COLUMN IF NOT EXISTS pharmaml_id_repartiteur text,
ADD COLUMN IF NOT EXISTS pharmaml_cle_secrete text,
ADD COLUMN IF NOT EXISTS pharmaml_id_officine text,
ADD COLUMN IF NOT EXISTS pharmaml_pays text;

-- Créer la table pour l'historique des transmissions PharmaML
CREATE TABLE IF NOT EXISTS public.pharmaml_transmissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  commande_id uuid NOT NULL REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE,
  fournisseur_id uuid NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  xml_envoye text,
  xml_reponse text,
  statut text NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'success', 'error', 'timeout')),
  code_erreur text,
  message text,
  numero_commande_pharmaml text,
  duree_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_pharmaml_transmissions_commande ON public.pharmaml_transmissions(commande_id);
CREATE INDEX IF NOT EXISTS idx_pharmaml_transmissions_fournisseur ON public.pharmaml_transmissions(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_pharmaml_transmissions_tenant ON public.pharmaml_transmissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmaml_transmissions_statut ON public.pharmaml_transmissions(statut);
CREATE INDEX IF NOT EXISTS idx_pharmaml_transmissions_created ON public.pharmaml_transmissions(created_at DESC);

-- Activer RLS
ALTER TABLE public.pharmaml_transmissions ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour pharmaml_transmissions
CREATE POLICY "Tenant isolation for pharmaml_transmissions" 
ON public.pharmaml_transmissions 
FOR ALL 
USING (
  tenant_id IN (
    SELECT p.tenant_id FROM public.personnel p 
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_pharmaml_transmissions_updated_at
BEFORE UPDATE ON public.pharmaml_transmissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE public.pharmaml_transmissions IS 'Historique des transmissions de commandes via le protocole PharmaML Ubipharm';
COMMENT ON COLUMN public.fournisseurs.pharmaml_enabled IS 'Active l''intégration PharmaML pour ce fournisseur';
COMMENT ON COLUMN public.fournisseurs.pharmaml_url IS 'URL du serveur PharmaML (ex: http://pharma-ml.ubipharm-congo.com/COOPHARCO)';
COMMENT ON COLUMN public.fournisseurs.pharmaml_code_repartiteur IS 'Code répartiteur Ubipharm (ex: 28 pour Afrique)';
COMMENT ON COLUMN public.fournisseurs.pharmaml_id_repartiteur IS 'ID répartiteur avec code établissement et société (ex: BZV04)';
COMMENT ON COLUMN public.fournisseurs.pharmaml_cle_secrete IS 'Clé secrète pour authentification (ex: PHDA)';
COMMENT ON COLUMN public.fournisseurs.pharmaml_id_officine IS 'Identifiant unique de la pharmacie chez Ubipharm';
COMMENT ON COLUMN public.fournisseurs.pharmaml_pays IS 'Code pays pour sélection automatique de l''URL';