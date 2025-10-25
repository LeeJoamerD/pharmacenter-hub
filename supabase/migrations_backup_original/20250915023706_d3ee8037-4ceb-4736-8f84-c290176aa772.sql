-- Create compliance requirements table
CREATE TABLE public.compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  regulation_reference TEXT,
  priority_level TEXT NOT NULL DEFAULT 'moyenne' CHECK (priority_level IN ('basse', 'moyenne', 'haute', 'critique')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance controls table  
CREATE TABLE public.compliance_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requirement_id UUID NOT NULL REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  responsible_person_id UUID REFERENCES public.personnel(id),
  control_type TEXT NOT NULL DEFAULT 'manual',
  control_frequency TEXT NOT NULL DEFAULT 'monthly',
  last_control_date TIMESTAMP WITH TIME ZONE,
  next_control_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('conforme', 'non_conforme', 'en_cours', 'expire', 'pending')),
  compliance_score NUMERIC(5,2) DEFAULT 0.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  control_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance actions table
CREATE TABLE public.compliance_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  control_id UUID NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'corrective',
  action_description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.personnel(id),
  due_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance product requirements junction table
CREATE TABLE public.compliance_product_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requirement_id UUID NOT NULL REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.produits(id) ON DELETE CASCADE,
  product_family_id UUID REFERENCES public.famille_produit(id) ON DELETE CASCADE,
  specific_rules JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT compliance_product_requirements_product_check CHECK (
    (product_id IS NOT NULL AND product_family_id IS NULL) OR 
    (product_id IS NULL AND product_family_id IS NOT NULL)
  )
);

-- Create compliance metrics history table
CREATE TABLE public.compliance_metrics_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requirements INTEGER NOT NULL DEFAULT 0,
  compliant_count INTEGER NOT NULL DEFAULT 0,
  non_compliant_count INTEGER NOT NULL DEFAULT 0,
  in_progress_count INTEGER NOT NULL DEFAULT 0,
  expired_count INTEGER NOT NULL DEFAULT 0,
  global_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  category_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_product_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_metrics_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for compliance_requirements
CREATE POLICY "Users can view compliance requirements from their tenant"
ON public.compliance_requirements FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance requirements in their tenant"
ON public.compliance_requirements FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance requirements from their tenant"
ON public.compliance_requirements FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance requirements from their tenant"
ON public.compliance_requirements FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create RLS policies for compliance_controls
CREATE POLICY "Users can view compliance controls from their tenant"
ON public.compliance_controls FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance controls in their tenant"
ON public.compliance_controls FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance controls from their tenant"
ON public.compliance_controls FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance controls from their tenant"
ON public.compliance_controls FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create RLS policies for compliance_actions
CREATE POLICY "Users can view compliance actions from their tenant"
ON public.compliance_actions FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance actions in their tenant"
ON public.compliance_actions FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance actions from their tenant"
ON public.compliance_actions FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance actions from their tenant"
ON public.compliance_actions FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create RLS policies for compliance_product_requirements
CREATE POLICY "Users can view compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance product requirements in their tenant"
ON public.compliance_product_requirements FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance product requirements from their tenant"
ON public.compliance_product_requirements FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- Create RLS policies for compliance_metrics_history
CREATE POLICY "Users can view compliance metrics from their tenant"
ON public.compliance_metrics_history FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance metrics in their tenant"
ON public.compliance_metrics_history FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Create indexes for better performance
CREATE INDEX idx_compliance_requirements_tenant_category ON public.compliance_requirements(tenant_id, category);
CREATE INDEX idx_compliance_controls_tenant_status ON public.compliance_controls(tenant_id, status);
CREATE INDEX idx_compliance_controls_next_control ON public.compliance_controls(next_control_date) WHERE status != 'expire';
CREATE INDEX idx_compliance_actions_tenant_status ON public.compliance_actions(tenant_id, status);
CREATE INDEX idx_compliance_metrics_tenant_date ON public.compliance_metrics_history(tenant_id, metric_date);

-- Create function to calculate compliance metrics
CREATE OR REPLACE FUNCTION public.calculate_compliance_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metrics JSONB;
  total_count INTEGER;
  compliant_count INTEGER;
  non_compliant_count INTEGER;
  in_progress_count INTEGER;
  expired_count INTEGER;
  global_score NUMERIC(5,2);
BEGIN
  -- Count controls by status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'conforme'),
    COUNT(*) FILTER (WHERE status = 'non_conforme'),
    COUNT(*) FILTER (WHERE status = 'en_cours'),
    COUNT(*) FILTER (WHERE status = 'expire')
  INTO total_count, compliant_count, non_compliant_count, in_progress_count, expired_count
  FROM public.compliance_controls 
  WHERE tenant_id = p_tenant_id;
  
  -- Calculate global score
  SELECT COALESCE(AVG(compliance_score), 0)
  INTO global_score
  FROM public.compliance_controls 
  WHERE tenant_id = p_tenant_id AND compliance_score IS NOT NULL;
  
  -- Build metrics JSON
  metrics := jsonb_build_object(
    'total', total_count,
    'conformite', compliant_count,
    'nonConformite', non_compliant_count,
    'enCours', in_progress_count,
    'expire', expired_count,
    'scoreGlobal', global_score
  );
  
  RETURN metrics;
END;
$$;

-- Create function to update compliance control dates
CREATE OR REPLACE FUNCTION public.update_compliance_control_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate next control date based on frequency
  IF NEW.control_frequency = 'daily' THEN
    NEW.next_control_date := NEW.last_control_date + INTERVAL '1 day';
  ELSIF NEW.control_frequency = 'weekly' THEN
    NEW.next_control_date := NEW.last_control_date + INTERVAL '1 week';
  ELSIF NEW.control_frequency = 'monthly' THEN
    NEW.next_control_date := NEW.last_control_date + INTERVAL '1 month';
  ELSIF NEW.control_frequency = 'quarterly' THEN
    NEW.next_control_date := NEW.last_control_date + INTERVAL '3 months';
  ELSIF NEW.control_frequency = 'yearly' THEN
    NEW.next_control_date := NEW.last_control_date + INTERVAL '1 year';
  END IF;
  
  -- Check if control is expired
  IF NEW.next_control_date < CURRENT_DATE AND NEW.status != 'expire' THEN
    NEW.status := 'expire';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for compliance control dates
CREATE TRIGGER trigger_update_compliance_control_dates
BEFORE UPDATE ON public.compliance_controls
FOR EACH ROW
WHEN (OLD.last_control_date IS DISTINCT FROM NEW.last_control_date)
EXECUTE FUNCTION public.update_compliance_control_dates();

-- Insert default compliance requirements data
INSERT INTO public.compliance_requirements (tenant_id, category, title, description, regulation_reference, priority_level) VALUES
-- Use a placeholder tenant_id - will be replaced with actual tenant data when used
('00000000-0000-0000-0000-000000000000', 'Conservation', 'Température frigo (2-8°C)', 'Surveillance continue de la température pour les produits thermosensibles', 'Art. R.5124-49 CSP', 'haute'),
('00000000-0000-0000-0000-000000000000', 'Stupéfiants', 'Coffre-fort agréé', 'Stockage sécurisé des substances stupéfiantes selon réglementation', 'Art. R.5132-1 CSP', 'critique'),
('00000000-0000-0000-0000-000000000000', 'Traçabilité', 'Numéros de lot', 'Traçabilité complète des lots de la réception à la dispensation', 'Art. R.5124-57 CSP', 'haute'),
('00000000-0000-0000-0000-000000000000', 'Péremption', 'FIFO obligatoire', 'Application stricte de la règle First In, First Out', 'BPD Annexe 3', 'moyenne'),
('00000000-0000-0000-0000-000000000000', 'Documentation', 'Dossier qualité', 'Maintien à jour du dossier qualité pharmaceutique', 'Art. R.5124-36 CSP', 'haute'),
('00000000-0000-0000-0000-000000000000', 'Hygiène', 'Nettoyage quotidien', 'Protocole de nettoyage et désinfection des locaux', 'BPD Chapitre 3', 'moyenne'),
('00000000-0000-0000-0000-000000000000', 'Personnel', 'Formation continue', 'Formation réglementaire du personnel pharmaceutique', 'Art. R.5124-32 CSP', 'moyenne')
ON CONFLICT DO NOTHING;