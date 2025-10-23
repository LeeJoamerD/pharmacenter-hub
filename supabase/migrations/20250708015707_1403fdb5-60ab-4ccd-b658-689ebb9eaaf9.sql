-- Phase 2: Configuration Authentification Multi-Tenant avec RLS

-- Enable RLS on all tenant-isolated tables
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_presence ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for pharmacies (admins can see all, users see only their own)
CREATE POLICY "Users can view their own pharmacy" 
ON public.pharmacies 
FOR SELECT 
USING (
  id = public.get_current_user_tenant_id() OR 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role = 'Admin'
  )
);

CREATE POLICY "Only admins can update pharmacies" 
ON public.pharmacies 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = pharmacies.id 
    AND role = 'Admin'
  )
);

-- RLS Policies for personnel (tenant isolation)
CREATE POLICY "Users can view personnel from their tenant" 
ON public.personnel 
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update their own profile" 
ON public.personnel 
FOR UPDATE 
USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can insert personnel in their tenant" 
ON public.personnel 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "Admins can update personnel in their tenant" 
ON public.personnel 
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- RLS Policies for network_channels
CREATE POLICY "Users can view channels from their tenant" 
ON public.network_channels 
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can create channels in their tenant" 
ON public.network_channels 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update channels from their tenant" 
ON public.network_channels 
FOR UPDATE 
USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for network_messages
CREATE POLICY "Users can view messages from their tenant" 
ON public.network_messages 
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can create messages in their tenant" 
ON public.network_messages 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update their own messages" 
ON public.network_messages 
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id() AND
  sender_pharmacy_id = public.get_current_user_tenant_id()
);

-- RLS Policies for channel_participants
CREATE POLICY "Users can view participants from their tenant" 
ON public.channel_participants 
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can insert participants in their tenant" 
ON public.channel_participants 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update participants from their tenant" 
ON public.channel_participants 
FOR UPDATE 
USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for pharmacy_presence
CREATE POLICY "Users can view presence from their tenant" 
ON public.pharmacy_presence 
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update presence for their tenant" 
ON public.pharmacy_presence 
FOR UPDATE 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can insert presence for their tenant" 
ON public.pharmacy_presence 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_user_tenant_id());