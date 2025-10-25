-- Create classes_therapeutiques table
CREATE TABLE IF NOT EXISTS public.classes_therapeutiques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  libelle_classe TEXT NOT NULL,
  systeme_anatomique TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per tenant
  CONSTRAINT unique_classe_per_tenant UNIQUE (tenant_id, libelle_classe)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_id 
ON public.classes_therapeutiques (tenant_id);

CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_libelle 
ON public.classes_therapeutiques (tenant_id, libelle_classe);

CREATE INDEX IF NOT EXISTS idx_classes_therapeutiques_tenant_systeme 
ON public.classes_therapeutiques (tenant_id, systeme_anatomique);

-- Enable Row Level Security
ALTER TABLE public.classes_therapeutiques ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert therapeutic classes in their tenant" 
ON public.classes_therapeutiques 
FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete therapeutic classes from their tenant" 
ON public.classes_therapeutiques 
FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_classes_therapeutiques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_therapeutiques_updated_at
BEFORE UPDATE ON public.classes_therapeutiques
FOR EACH ROW
EXECUTE FUNCTION public.update_classes_therapeutiques_updated_at();