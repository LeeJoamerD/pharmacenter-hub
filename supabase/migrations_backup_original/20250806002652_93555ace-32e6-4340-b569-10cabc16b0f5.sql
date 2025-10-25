-- Migration pour les tables manquantes de la section Approvisionnement

-- Table pour les produits (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nom_produit text NOT NULL,
  code_barre text,
  famille_id uuid REFERENCES public.famille_produit(id),
  dci_id uuid REFERENCES public.dci(id),
  prix_achat_moyen numeric DEFAULT 0.00,
  prix_vente_unitaire numeric DEFAULT 0.00,
  tva_applicable numeric DEFAULT 0.18,
  stock_minimum integer DEFAULT 0,
  stock_maximum integer DEFAULT 1000,
  unite_mesure text DEFAULT 'Unité',
  forme_pharmaceutique text,
  dosage text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table pour le suivi des commandes
CREATE TABLE IF NOT EXISTS public.suivi_commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  commande_id uuid NOT NULL REFERENCES public.commandes_fournisseurs(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'preparation',
  date_changement timestamp with time zone DEFAULT now(),
  commentaire text,
  agent_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table pour les transporteurs
CREATE TABLE IF NOT EXISTS public.transporteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nom text NOT NULL,
  contact_principal text,
  telephone text,
  email text,
  adresse text,
  zones_livraison text[],
  delai_moyen_jours integer DEFAULT 7,
  tarif_base numeric DEFAULT 0.00,
  note_evaluation numeric DEFAULT 5.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table pour les paramètres d'approvisionnement
CREATE TABLE IF NOT EXISTS public.parametres_approvisionnement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  delai_commande_automatique_jours integer DEFAULT 7,
  seuil_stock_critique_pourcent numeric DEFAULT 20.00,
  montant_minimum_commande numeric DEFAULT 50000.00,
  taux_tva_defaut numeric DEFAULT 0.18,
  validation_automatique_reception boolean DEFAULT false,
  notification_commande_en_retard boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Ajouter des colonnes manquantes à la table commandes_fournisseurs
ALTER TABLE public.commandes_fournisseurs 
ADD COLUMN IF NOT EXISTS numero_commande text,
ADD COLUMN IF NOT EXISTS date_livraison_prevue date,
ADD COLUMN IF NOT EXISTS transporteur_id uuid REFERENCES public.transporteurs(id),
ADD COLUMN IF NOT EXISTS numero_suivi text,
ADD COLUMN IF NOT EXISTS montant_total_ht numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS montant_tva numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS montant_total_ttc numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS priorite text DEFAULT 'normale';

-- Ajouter des colonnes manquantes à la table receptions_fournisseurs
ALTER TABLE public.receptions_fournisseurs 
ADD COLUMN IF NOT EXISTS numero_bon_livraison text,
ADD COLUMN IF NOT EXISTS transporteur_id uuid REFERENCES public.transporteurs(id),
ADD COLUMN IF NOT EXISTS statut_reception text DEFAULT 'en_cours',
ADD COLUMN IF NOT EXISTS controle_qualite_valide boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS observations_qualite text;

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_approvisionnement ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour produits
CREATE POLICY "Users can view products from their tenant" ON public.produits
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert products in their tenant" ON public.produits
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update products from their tenant" ON public.produits
FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete products from their tenant" ON public.produits
FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour suivi_commandes
CREATE POLICY "Users can view order tracking from their tenant" ON public.suivi_commandes
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert order tracking in their tenant" ON public.suivi_commandes
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update order tracking from their tenant" ON public.suivi_commandes
FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete order tracking from their tenant" ON public.suivi_commandes
FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour transporteurs
CREATE POLICY "Users can view transporters from their tenant" ON public.transporteurs
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert transporters in their tenant" ON public.transporteurs
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update transporters from their tenant" ON public.transporteurs
FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete transporters from their tenant" ON public.transporteurs
FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour parametres_approvisionnement
CREATE POLICY "Users can view supply parameters from their tenant" ON public.parametres_approvisionnement
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert supply parameters in their tenant" ON public.parametres_approvisionnement
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update supply parameters from their tenant" ON public.parametres_approvisionnement
FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete supply parameters from their tenant" ON public.parametres_approvisionnement
FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_produits_updated_at
  BEFORE UPDATE ON public.produits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suivi_commandes_updated_at
  BEFORE UPDATE ON public.suivi_commandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transporteurs_updated_at
  BEFORE UPDATE ON public.transporteurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametres_approvisionnement_updated_at
  BEFORE UPDATE ON public.parametres_approvisionnement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_produits_tenant_id ON public.produits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produits_code_barre ON public.produits(code_barre);
CREATE INDEX IF NOT EXISTS idx_suivi_commandes_tenant_id ON public.suivi_commandes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suivi_commandes_commande_id ON public.suivi_commandes(commande_id);
CREATE INDEX IF NOT EXISTS idx_transporteurs_tenant_id ON public.transporteurs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parametres_approvisionnement_tenant_id ON public.parametres_approvisionnement(tenant_id);