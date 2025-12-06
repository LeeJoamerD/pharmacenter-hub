-- Add missing columns to network_channels table
ALTER TABLE public.network_channels 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS auto_archive_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create channel_keyword_alerts table for keyword monitoring
CREATE TABLE IF NOT EXISTS public.channel_keyword_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  channel_ids UUID[] DEFAULT '{}',
  alert_type TEXT NOT NULL DEFAULT 'immediate',
  recipients TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.channel_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  role TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'read',
  pharmacy_id UUID,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_channel_role_pharmacy UNIQUE (channel_id, role, pharmacy_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_keyword_alerts_tenant 
ON public.channel_keyword_alerts (tenant_id);

CREATE INDEX IF NOT EXISTS idx_channel_keyword_alerts_active 
ON public.channel_keyword_alerts (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_channel_permissions_tenant 
ON public.channel_permissions (tenant_id);

CREATE INDEX IF NOT EXISTS idx_channel_permissions_channel 
ON public.channel_permissions (channel_id);

CREATE INDEX IF NOT EXISTS idx_network_channels_status 
ON public.network_channels (tenant_id, status);

-- Enable RLS on new tables
ALTER TABLE public.channel_keyword_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for channel_keyword_alerts
CREATE POLICY "Users can view keyword alerts from their tenant" 
ON public.channel_keyword_alerts 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage keyword alerts in their tenant" 
ON public.channel_keyword_alerts 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for channel_permissions  
CREATE POLICY "Users can view permissions from their tenant" 
ON public.channel_permissions 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage permissions in their tenant" 
ON public.channel_permissions 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for updated_at on channel_keyword_alerts
CREATE TRIGGER update_channel_keyword_alerts_updated_at
BEFORE UPDATE ON public.channel_keyword_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on channel_permissions
CREATE TRIGGER update_channel_permissions_updated_at
BEFORE UPDATE ON public.channel_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();