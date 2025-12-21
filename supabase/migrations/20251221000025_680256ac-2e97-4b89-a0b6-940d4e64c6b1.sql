-- Table des demandes de produits par les clients (rupture de stock)
CREATE TABLE IF NOT EXISTS public.demandes_produits_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  nombre_demandes INTEGER NOT NULL DEFAULT 1,
  derniere_demande TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.personnel(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, produit_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_produits_tenant ON public.demandes_produits_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demandes_produits_produit ON public.demandes_produits_clients(produit_id);
CREATE INDEX IF NOT EXISTS idx_demandes_produits_count ON public.demandes_produits_clients(tenant_id, nombre_demandes DESC);

-- Enable RLS
ALTER TABLE public.demandes_produits_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "demandes_produits_clients_select" ON public.demandes_produits_clients;
DROP POLICY IF EXISTS "demandes_produits_clients_insert" ON public.demandes_produits_clients;
DROP POLICY IF EXISTS "demandes_produits_clients_update" ON public.demandes_produits_clients;
DROP POLICY IF EXISTS "demandes_produits_clients_delete" ON public.demandes_produits_clients;

CREATE POLICY "demandes_produits_clients_select" ON public.demandes_produits_clients
  FOR SELECT USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "demandes_produits_clients_insert" ON public.demandes_produits_clients
  FOR INSERT WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "demandes_produits_clients_update" ON public.demandes_produits_clients
  FOR UPDATE USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "demandes_produits_clients_delete" ON public.demandes_produits_clients
  FOR DELETE USING (tenant_id = public.get_current_user_tenant_id());

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_demandes_produits_clients_updated_at ON public.demandes_produits_clients;
CREATE TRIGGER update_demandes_produits_clients_updated_at
  BEFORE UPDATE ON public.demandes_produits_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour supprimer automatiquement les demandes lors d'une entrée en stock
CREATE OR REPLACE FUNCTION public.fn_delete_demande_on_stock_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_produit_id UUID;
BEGIN
  -- Récupérer tenant_id et produit_id selon la table source
  IF TG_TABLE_NAME = 'lignes_reception_fournisseur' THEN
    -- Pour les réceptions, récupérer le tenant_id via la réception
    SELECT rf.tenant_id INTO v_tenant_id
    FROM public.receptions_fournisseurs rf
    WHERE rf.id = NEW.reception_id;
    v_produit_id := NEW.produit_id;
  ELSIF TG_TABLE_NAME = 'stock_mouvements' THEN
    v_tenant_id := NEW.tenant_id;
    v_produit_id := NEW.produit_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Supprimer la demande pour ce produit/tenant si elle existe
  IF v_tenant_id IS NOT NULL AND v_produit_id IS NOT NULL THEN
    DELETE FROM public.demandes_produits_clients 
    WHERE tenant_id = v_tenant_id AND produit_id = v_produit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sur lignes_reception_fournisseur (réceptions de commandes)
DROP TRIGGER IF EXISTS trg_delete_demande_on_reception ON public.lignes_reception_fournisseur;
CREATE TRIGGER trg_delete_demande_on_reception
  AFTER INSERT ON public.lignes_reception_fournisseur
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_delete_demande_on_stock_entry();

-- Trigger sur stock_mouvements (entrées manuelles, ajustements positifs)
DROP TRIGGER IF EXISTS trg_delete_demande_on_stock_mouvement ON public.stock_mouvements;
CREATE TRIGGER trg_delete_demande_on_stock_mouvement
  AFTER INSERT ON public.stock_mouvements
  FOR EACH ROW
  WHEN (NEW.type_mouvement IN ('Entrée', 'Réception', 'Ajustement_positif', 'Inventaire_positif', 'Transfert_entrant'))
  EXECUTE FUNCTION public.fn_delete_demande_on_stock_entry();