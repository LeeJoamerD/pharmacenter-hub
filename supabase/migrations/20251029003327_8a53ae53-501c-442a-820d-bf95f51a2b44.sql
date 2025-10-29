-- Create cross_tenant_permissions table for security validation
CREATE TABLE public.cross_tenant_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  source_tenant_id UUID NOT NULL,
  target_tenant_id UUID NOT NULL,
  permission_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_cross_tenant_permissions_tenant 
    FOREIGN KEY (tenant_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cross_tenant_permissions_source 
    FOREIGN KEY (source_tenant_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cross_tenant_permissions_target 
    FOREIGN KEY (target_tenant_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cross_tenant_permissions_granted_by 
    FOREIGN KEY (granted_by) REFERENCES public.personnel(id) ON DELETE SET NULL,
    
  -- Business constraints
  CONSTRAINT check_different_tenants 
    CHECK (source_tenant_id != target_tenant_id),
  CONSTRAINT check_valid_permission_type 
    CHECK (permission_type IN ('read', 'write', 'admin', 'share', 'delegate'))
);

-- Create indexes for performance
CREATE INDEX idx_cross_tenant_permissions_tenant 
  ON public.cross_tenant_permissions(tenant_id);

CREATE INDEX idx_cross_tenant_permissions_source 
  ON public.cross_tenant_permissions(source_tenant_id);

CREATE INDEX idx_cross_tenant_permissions_target 
  ON public.cross_tenant_permissions(target_tenant_id);

CREATE INDEX idx_cross_tenant_permissions_active 
  ON public.cross_tenant_permissions(is_active) WHERE is_active = true;

CREATE INDEX idx_cross_tenant_permissions_expires 
  ON public.cross_tenant_permissions(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.cross_tenant_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only Admin/Pharmacien can manage cross-tenant permissions
CREATE POLICY "Admin can view all cross-tenant permissions"
  ON public.cross_tenant_permissions
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

CREATE POLICY "Admin can create cross-tenant permissions"
  ON public.cross_tenant_permissions
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

CREATE POLICY "Admin can update cross-tenant permissions"
  ON public.cross_tenant_permissions
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

CREATE POLICY "Admin can delete cross-tenant permissions"
  ON public.cross_tenant_permissions
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

-- Trigger for automatic updated_at
CREATE TRIGGER update_cross_tenant_permissions_updated_at
  BEFORE UPDATE ON public.cross_tenant_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if a cross-tenant access is authorized
CREATE OR REPLACE FUNCTION public.is_cross_tenant_authorized(
  p_source_tenant_id UUID,
  p_target_tenant_id UUID,
  p_permission_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_authorized BOOLEAN := false;
BEGIN
  -- Check if there's an active permission
  SELECT EXISTS(
    SELECT 1 
    FROM public.cross_tenant_permissions
    WHERE source_tenant_id = p_source_tenant_id
      AND target_tenant_id = p_target_tenant_id
      AND permission_type = p_permission_type
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (p_resource_type IS NULL OR resource_type = p_resource_type)
      AND (p_resource_id IS NULL OR resource_id = p_resource_id)
  ) INTO v_authorized;
  
  RETURN v_authorized;
END;
$$;

-- Add audit logging for cross-tenant permission changes
CREATE OR REPLACE FUNCTION public.log_cross_tenant_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      status
    ) VALUES (
      NEW.tenant_id,
      auth.uid(),
      'CROSS_TENANT_PERMISSION_GRANTED',
      'cross_tenant_permissions',
      NEW.id,
      to_jsonb(NEW),
      'success'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      status
    ) VALUES (
      NEW.tenant_id,
      auth.uid(),
      'CROSS_TENANT_PERMISSION_UPDATED',
      'cross_tenant_permissions',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'success'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      status
    ) VALUES (
      OLD.tenant_id,
      auth.uid(),
      'CROSS_TENANT_PERMISSION_REVOKED',
      'cross_tenant_permissions',
      OLD.id,
      to_jsonb(OLD),
      'success'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach audit trigger
CREATE TRIGGER audit_cross_tenant_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.cross_tenant_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cross_tenant_permission_change();