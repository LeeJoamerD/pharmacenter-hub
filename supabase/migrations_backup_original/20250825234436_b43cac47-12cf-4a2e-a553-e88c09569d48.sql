-- Create printers table for print settings
CREATE TABLE public.print_printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'receipt', 'thermal'
  connection_type TEXT NOT NULL DEFAULT 'usb', -- 'usb', 'network', 'bluetooth'
  ip_address TEXT,
  port TEXT,
  driver_name TEXT,
  paper_sizes TEXT[] DEFAULT ARRAY['A4'],
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_printers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view printers from their tenant"
ON public.print_printers
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert printers in their tenant"
ON public.print_printers
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update printers from their tenant"
ON public.print_printers
FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete printers from their tenant"
ON public.print_printers
FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create updated_at trigger
CREATE TRIGGER update_print_printers_updated_at
  BEFORE UPDATE ON public.print_printers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default printers for existing tenants (optional)
INSERT INTO public.print_printers (tenant_id, name, type, connection_type)
SELECT DISTINCT tenant_id, 'Imprimante par défaut', 'standard', 'usb'
FROM public.pharmacies
WHERE status = 'active';