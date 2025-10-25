-- Create report_templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_template_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create report_template_versions table
CREATE TABLE IF NOT EXISTS public.report_template_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_template_version UNIQUE (tenant_id, template_id, version)
);

-- Create report_permissions table
CREATE TABLE IF NOT EXISTS public.report_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subject_type TEXT NOT NULL CHECK (subject_type IN ('role', 'user')),
    subject_id UUID NOT NULL,
    report_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_modify BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_export BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT unique_permission_per_subject UNIQUE (tenant_id, subject_type, subject_id, report_key)
);

-- Create report_schedules table
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('cron', 'daily', 'weekly', 'monthly')),
    cron_expr TEXT,
    time_of_day TIME,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    template_id UUID REFERENCES public.report_templates(id) ON DELETE CASCADE,
    report_key TEXT,
    format TEXT NOT NULL DEFAULT 'pdf',
    active BOOLEAN NOT NULL DEFAULT true,
    recipients JSONB NOT NULL DEFAULT '[]',
    options JSONB NOT NULL DEFAULT '{}',
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Create report_connectors table
CREATE TABLE IF NOT EXISTS public.report_connectors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('powerbi', 'tableau', 'qlik')),
    config JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT unique_provider_per_tenant UNIQUE (tenant_id, provider)
);

-- Create report_api_tokens table
CREATE TABLE IF NOT EXISTS public.report_api_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID
);

-- Create report_archiving_policies table
CREATE TABLE IF NOT EXISTS public.report_archiving_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    retention_days INTEGER NOT NULL DEFAULT 365,
    purge_enabled BOOLEAN NOT NULL DEFAULT false,
    storage_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID,
    CONSTRAINT one_policy_per_tenant UNIQUE (tenant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_archiving_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their tenant report_templates" ON public.report_templates FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_templates" ON public.report_templates FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_templates" ON public.report_templates FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_templates" ON public.report_templates FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_template_versions" ON public.report_template_versions FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_template_versions" ON public.report_template_versions FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_permissions" ON public.report_permissions FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_permissions" ON public.report_permissions FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_permissions" ON public.report_permissions FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_permissions" ON public.report_permissions FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_schedules" ON public.report_schedules FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_schedules" ON public.report_schedules FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_schedules" ON public.report_schedules FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_schedules" ON public.report_schedules FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_connectors" ON public.report_connectors FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_connectors" ON public.report_connectors FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_connectors" ON public.report_connectors FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_connectors" ON public.report_connectors FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_api_tokens" ON public.report_api_tokens FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_api_tokens" ON public.report_api_tokens FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_api_tokens" ON public.report_api_tokens FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_api_tokens" ON public.report_api_tokens FOR DELETE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view their tenant report_archiving_policies" ON public.report_archiving_policies FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can insert their tenant report_archiving_policies" ON public.report_archiving_policies FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can update their tenant report_archiving_policies" ON public.report_archiving_policies FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Users can delete their tenant report_archiving_policies" ON public.report_archiving_policies FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON public.report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON public.report_templates(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_report_template_versions_tenant_template ON public.report_template_versions(tenant_id, template_id);
CREATE INDEX IF NOT EXISTS idx_report_permissions_tenant_subject ON public.report_permissions(tenant_id, subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant_active ON public.report_schedules(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_report_connectors_tenant_provider ON public.report_connectors(tenant_id, provider);
CREATE INDEX IF NOT EXISTS idx_report_api_tokens_tenant_active ON public.report_api_tokens(tenant_id, is_active);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_permissions_updated_at BEFORE UPDATE ON public.report_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON public.report_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_connectors_updated_at BEFORE UPDATE ON public.report_connectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_archiving_policies_updated_at BEFORE UPDATE ON public.report_archiving_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC Functions
CREATE OR REPLACE FUNCTION reports_get_configuration()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}';
    tenant_uuid UUID;
BEGIN
    tenant_uuid := get_current_user_tenant_id();
    
    -- Get general settings
    SELECT COALESCE(jsonb_object_agg(setting_key, setting_value), '{}')
    INTO result
    FROM network_admin_settings 
    WHERE tenant_id = tenant_uuid AND setting_category = 'reports';
    
    RETURN jsonb_build_object(
        'general_settings', result,
        'templates_count', (SELECT COUNT(*) FROM report_templates WHERE tenant_id = tenant_uuid),
        'schedules_count', (SELECT COUNT(*) FROM report_schedules WHERE tenant_id = tenant_uuid AND active = true),
        'permissions_count', (SELECT COUNT(*) FROM report_permissions WHERE tenant_id = tenant_uuid),
        'connectors_count', (SELECT COUNT(*) FROM report_connectors WHERE tenant_id = tenant_uuid AND is_enabled = true)
    );
END;
$$;

CREATE OR REPLACE FUNCTION reports_upsert_settings(payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_uuid UUID;
    key TEXT;
    value TEXT;
BEGIN
    tenant_uuid := get_current_user_tenant_id();
    
    FOR key, value IN SELECT * FROM jsonb_each_text(payload) LOOP
        INSERT INTO network_admin_settings (tenant_id, setting_category, setting_key, setting_value, setting_type)
        VALUES (tenant_uuid, 'reports', key, value, 'string')
        ON CONFLICT (tenant_id, setting_category, setting_key)
        DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = now();
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION reports_upsert_template(template JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_uuid UUID;
    template_id UUID;
    new_version INTEGER;
BEGIN
    tenant_uuid := get_current_user_tenant_id();
    
    IF (template->>'id') IS NULL THEN
        -- Insert new template
        INSERT INTO report_templates (
            tenant_id, name, category, description, content, created_by, updated_by
        ) VALUES (
            tenant_uuid,
            template->>'name',
            template->>'category',
            template->>'description',
            template->'content',
            auth.uid(),
            auth.uid()
        ) RETURNING id INTO template_id;
        
        -- Create first version
        INSERT INTO report_template_versions (
            tenant_id, template_id, version, content, updated_by
        ) VALUES (
            tenant_uuid, template_id, 1, template->'content', auth.uid()
        );
    ELSE
        -- Update existing template
        template_id := (template->>'id')::UUID;
        
        -- Get next version number
        SELECT COALESCE(MAX(version), 0) + 1 
        INTO new_version 
        FROM report_template_versions 
        WHERE tenant_id = tenant_uuid AND template_id = (template->>'id')::UUID;
        
        -- Update template
        UPDATE report_templates SET
            name = template->>'name',
            category = template->>'category',
            description = template->>'description',
            content = template->'content',
            version = new_version,
            updated_by = auth.uid(),
            updated_at = now()
        WHERE id = template_id AND tenant_id = tenant_uuid;
        
        -- Create new version
        INSERT INTO report_template_versions (
            tenant_id, template_id, version, content, updated_by
        ) VALUES (
            tenant_uuid, template_id, new_version, template->'content', auth.uid()
        );
    END IF;
    
    RETURN template_id;
END;
$$;

CREATE OR REPLACE FUNCTION reports_apply_archiving_policy()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_uuid UUID;
    policy_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    tenant_uuid := get_current_user_tenant_id();
    
    SELECT * INTO policy_record 
    FROM report_archiving_policies 
    WHERE tenant_id = tenant_uuid AND purge_enabled = true;
    
    IF policy_record IS NOT NULL THEN
        -- Delete old report template versions (keep latest)
        WITH latest_versions AS (
            SELECT template_id, MAX(version) as max_version
            FROM report_template_versions 
            WHERE tenant_id = tenant_uuid
            GROUP BY template_id
        )
        DELETE FROM report_template_versions rtv
        WHERE rtv.tenant_id = tenant_uuid 
        AND rtv.created_at < (now() - (policy_record.retention_days || ' days')::INTERVAL)
        AND EXISTS (
            SELECT 1 FROM latest_versions lv 
            WHERE lv.template_id = rtv.template_id 
            AND rtv.version < lv.max_version
        );
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    RETURN deleted_count;
END;
$$;