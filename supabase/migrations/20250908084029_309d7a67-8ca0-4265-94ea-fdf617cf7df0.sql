-- Créer la table inventaire_items pour stocker les articles à compter dans chaque session d'inventaire
CREATE TABLE public.inventaire_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.inventaire_sessions(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  code_barre TEXT NOT NULL,
  produit_nom TEXT NOT NULL,
  lot_numero TEXT,
  emplacement_theorique TEXT NOT NULL DEFAULT '',
  emplacement_reel TEXT,
  quantite_theorique INTEGER NOT NULL DEFAULT 0,
  quantite_comptee INTEGER,
  unite TEXT NOT NULL DEFAULT 'unités',
  statut TEXT NOT NULL DEFAULT 'non_compte' CHECK (statut IN ('non_compte', 'compte', 'ecart', 'valide')),
  date_comptage TIMESTAMP WITH TIME ZONE,
  operateur_id UUID REFERENCES public.personnel(id),
  operateur_nom TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.inventaire_items ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view inventory items from their tenant" 
ON public.inventaire_items 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert inventory items in their tenant" 
ON public.inventaire_items 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update inventory items from their tenant" 
ON public.inventaire_items 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete inventory items from their tenant" 
ON public.inventaire_items 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_inventaire_items_updated_at
  BEFORE UPDATE ON public.inventaire_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lots_timestamp();

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_inventaire_items_session_id ON public.inventaire_items(session_id);
CREATE INDEX idx_inventaire_items_tenant_id ON public.inventaire_items(tenant_id);
CREATE INDEX idx_inventaire_items_code_barre ON public.inventaire_items(code_barre);
CREATE INDEX idx_inventaire_items_statut ON public.inventaire_items(statut);