-- Create factures_importees table for storing imported invoices
CREATE TABLE IF NOT EXISTS public.factures_importees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  numero_facture TEXT NOT NULL,
  date_facture DATE NOT NULL,
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  fournisseur_nom TEXT,
  montant_ht NUMERIC(15, 2) DEFAULT 0,
  montant_tva NUMERIC(15, 2) DEFAULT 0,
  montant_ttc NUMERIC(15, 2) DEFAULT 0,
  devise TEXT DEFAULT 'XAF',
  statut TEXT DEFAULT 'importee' CHECK (statut IN ('importee', 'validee', 'comptabilisee', 'annulee')),
  source_import TEXT,
  fichier_original TEXT,
  lignes JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES public.personnel(id),
  validated_by UUID REFERENCES public.personnel(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.factures_importees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using tenant_id (not user_id)
CREATE POLICY "Users can view imported invoices in their tenant" 
ON public.factures_importees 
FOR SELECT 
USING (tenant_id IN (
  SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()
));

CREATE POLICY "Users can create imported invoices in their tenant" 
ON public.factures_importees 
FOR INSERT 
WITH CHECK (tenant_id IN (
  SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()
));

CREATE POLICY "Users can update imported invoices in their tenant" 
ON public.factures_importees 
FOR UPDATE 
USING (tenant_id IN (
  SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()
));

CREATE POLICY "Users can delete imported invoices in their tenant" 
ON public.factures_importees 
FOR DELETE 
USING (tenant_id IN (
  SELECT p.tenant_id FROM public.personnel p WHERE p.auth_user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_factures_importees_tenant ON public.factures_importees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_factures_importees_fournisseur ON public.factures_importees(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_factures_importees_date ON public.factures_importees(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_importees_statut ON public.factures_importees(statut);

-- Create trigger for updated_at
CREATE TRIGGER update_factures_importees_updated_at 
BEFORE UPDATE ON public.factures_importees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();