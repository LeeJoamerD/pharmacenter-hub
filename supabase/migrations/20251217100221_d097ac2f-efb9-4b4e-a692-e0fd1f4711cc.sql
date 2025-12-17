-- Table de configuration des mappings Excel par fournisseur
CREATE TABLE IF NOT EXISTS public.supplier_excel_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  mapping_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_tenant_fournisseur UNIQUE(tenant_id, fournisseur_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_supplier_excel_mappings_tenant ON public.supplier_excel_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_excel_mappings_fournisseur ON public.supplier_excel_mappings(fournisseur_id);

-- Enable RLS
ALTER TABLE public.supplier_excel_mappings ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view their tenant mappings" 
ON public.supplier_excel_mappings 
FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their tenant mappings" 
ON public.supplier_excel_mappings 
FOR INSERT 
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their tenant mappings" 
ON public.supplier_excel_mappings 
FOR UPDATE 
USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their tenant mappings" 
ON public.supplier_excel_mappings 
FOR DELETE 
USING (tenant_id = (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_supplier_excel_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_supplier_excel_mappings_updated_at ON public.supplier_excel_mappings;
CREATE TRIGGER trigger_update_supplier_excel_mappings_updated_at
  BEFORE UPDATE ON public.supplier_excel_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_excel_mappings_updated_at();