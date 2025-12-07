
-- =============================================
-- AI ACCOUNTING EXPERT TABLES
-- =============================================

-- Table pour les consultations IA comptables
CREATE TABLE IF NOT EXISTS public.ai_accounting_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_response TEXT,
  consultation_type TEXT DEFAULT 'general' CHECK (consultation_type IN ('general', 'fiscal', 'accounting', 'tax_optimization', 'compliance', 'audit')),
  context_data JSONB DEFAULT '{}',
  related_accounts TEXT[],
  related_entries UUID[],
  confidence NUMERIC(3,2) DEFAULT 0.85,
  is_useful BOOLEAN,
  feedback TEXT,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les anomalies comptables détectées par l'IA
CREATE TABLE IF NOT EXISTS public.ai_accounting_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('balance_error', 'duplicate_entry', 'missing_document', 'unusual_amount', 'sequence_gap', 'tax_discrepancy', 'reconciliation_issue', 'period_mismatch')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_accounts TEXT[],
  affected_entries UUID[],
  suggested_correction TEXT,
  correction_steps JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_by TEXT DEFAULT 'ai_system',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.personnel(id),
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les optimisations fiscales suggérées par l'IA
CREATE TABLE IF NOT EXISTS public.ai_tax_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('deduction', 'credit', 'timing', 'structure', 'investment', 'provision', 'depreciation', 'loss_carryforward')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'tva', 'is', 'patente', 'charges', 'amortissement', 'provisions')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_savings NUMERIC(15,2),
  confidence NUMERIC(3,2) DEFAULT 0.75,
  implementation_steps JSONB,
  legal_references TEXT[],
  applicable_period TEXT,
  deadline DATE,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'under_review', 'approved', 'implemented', 'rejected')),
  implemented_at TIMESTAMPTZ,
  implemented_by UUID REFERENCES public.personnel(id),
  rejected_reason TEXT,
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table de configuration de l'expert comptable IA
CREATE TABLE IF NOT EXISTS public.ai_accounting_expert_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  enable_auto_anomaly_detection BOOLEAN DEFAULT true,
  anomaly_detection_frequency TEXT DEFAULT 'daily' CHECK (anomaly_detection_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  enable_tax_optimization_suggestions BOOLEAN DEFAULT true,
  optimization_check_frequency TEXT DEFAULT 'weekly' CHECK (optimization_check_frequency IN ('daily', 'weekly', 'monthly')),
  enable_fiscal_reminders BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  accounting_system TEXT DEFAULT 'SYSCOHADA',
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  auto_reconciliation BOOLEAN DEFAULT false,
  min_anomaly_severity TEXT DEFAULT 'medium' CHECK (min_anomaly_severity IN ('low', 'medium', 'high', 'critical')),
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_accounting_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_accounting_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tax_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_accounting_expert_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_accounting_consultations
CREATE POLICY "Users can view their tenant consultations"
  ON public.ai_accounting_consultations FOR SELECT
  USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can create consultations for their tenant"
  ON public.ai_accounting_consultations FOR INSERT
  WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update their tenant consultations"
  ON public.ai_accounting_consultations FOR UPDATE
  USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_accounting_anomalies
CREATE POLICY "Users can view their tenant anomalies"
  ON public.ai_accounting_anomalies FOR SELECT
  USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage their tenant anomalies"
  ON public.ai_accounting_anomalies FOR ALL
  USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_tax_optimizations
CREATE POLICY "Users can view their tenant optimizations"
  ON public.ai_tax_optimizations FOR SELECT
  USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage their tenant optimizations"
  ON public.ai_tax_optimizations FOR ALL
  USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for ai_accounting_expert_config
CREATE POLICY "Users can view their tenant config"
  ON public.ai_accounting_expert_config FOR SELECT
  USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage their tenant config"
  ON public.ai_accounting_expert_config FOR ALL
  USING (tenant_id = public.get_current_user_tenant_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_accounting_consultations_tenant ON public.ai_accounting_consultations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_accounting_consultations_type ON public.ai_accounting_consultations(consultation_type);
CREATE INDEX IF NOT EXISTS idx_ai_accounting_consultations_created ON public.ai_accounting_consultations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_accounting_anomalies_tenant ON public.ai_accounting_anomalies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_accounting_anomalies_status ON public.ai_accounting_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_ai_accounting_anomalies_severity ON public.ai_accounting_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_ai_accounting_anomalies_type ON public.ai_accounting_anomalies(anomaly_type);

CREATE INDEX IF NOT EXISTS idx_ai_tax_optimizations_tenant ON public.ai_tax_optimizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_tax_optimizations_status ON public.ai_tax_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_ai_tax_optimizations_category ON public.ai_tax_optimizations(category);

-- Triggers for updated_at
CREATE TRIGGER update_ai_accounting_anomalies_updated_at
  BEFORE UPDATE ON public.ai_accounting_anomalies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tax_optimizations_updated_at
  BEFORE UPDATE ON public.ai_tax_optimizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_accounting_expert_config_updated_at
  BEFORE UPDATE ON public.ai_accounting_expert_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Function to get accounting expert metrics
CREATE OR REPLACE FUNCTION public.get_accounting_expert_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_entries INTEGER;
  v_balanced_entries INTEGER;
  v_pending_anomalies INTEGER;
  v_resolved_anomalies INTEGER;
  v_total_optimizations INTEGER;
  v_implemented_optimizations INTEGER;
  v_estimated_savings NUMERIC;
  v_realized_savings NUMERIC;
  v_fiscal_compliance_rate NUMERIC;
  v_upcoming_obligations INTEGER;
  v_overdue_obligations INTEGER;
BEGIN
  -- Count accounting entries
  SELECT COUNT(*), COUNT(*) FILTER (WHERE statut = 'validee')
  INTO v_total_entries, v_balanced_entries
  FROM public.ecritures_comptables
  WHERE tenant_id = p_tenant_id;

  -- Count anomalies
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('pending', 'investigating')),
    COUNT(*) FILTER (WHERE status = 'resolved')
  INTO v_pending_anomalies, v_resolved_anomalies
  FROM public.ai_accounting_anomalies
  WHERE tenant_id = p_tenant_id;

  -- Count optimizations and savings
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'implemented'),
    COALESCE(SUM(estimated_savings), 0),
    COALESCE(SUM(estimated_savings) FILTER (WHERE status = 'implemented'), 0)
  INTO v_total_optimizations, v_implemented_optimizations, v_estimated_savings, v_realized_savings
  FROM public.ai_tax_optimizations
  WHERE tenant_id = p_tenant_id;

  -- Calculate fiscal compliance rate
  SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE statut = 'payee')::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 100
    END
  INTO v_fiscal_compliance_rate
  FROM public.obligations_fiscales
  WHERE tenant_id = p_tenant_id;

  -- Count fiscal obligations
  SELECT 
    COUNT(*) FILTER (WHERE date_echeance > CURRENT_DATE AND date_echeance <= CURRENT_DATE + INTERVAL '30 days' AND statut = 'en_attente'),
    COUNT(*) FILTER (WHERE date_echeance < CURRENT_DATE AND statut = 'en_attente')
  INTO v_upcoming_obligations, v_overdue_obligations
  FROM public.obligations_fiscales
  WHERE tenant_id = p_tenant_id;

  v_result := jsonb_build_object(
    'entries', jsonb_build_object(
      'total', COALESCE(v_total_entries, 0),
      'balanced', COALESCE(v_balanced_entries, 0),
      'balance_rate', CASE WHEN v_total_entries > 0 THEN ROUND((v_balanced_entries::NUMERIC / v_total_entries::NUMERIC) * 100, 1) ELSE 100 END
    ),
    'anomalies', jsonb_build_object(
      'pending', COALESCE(v_pending_anomalies, 0),
      'resolved', COALESCE(v_resolved_anomalies, 0),
      'total', COALESCE(v_pending_anomalies, 0) + COALESCE(v_resolved_anomalies, 0)
    ),
    'optimizations', jsonb_build_object(
      'total', COALESCE(v_total_optimizations, 0),
      'implemented', COALESCE(v_implemented_optimizations, 0),
      'estimated_savings', COALESCE(v_estimated_savings, 0),
      'realized_savings', COALESCE(v_realized_savings, 0)
    ),
    'fiscal', jsonb_build_object(
      'compliance_rate', COALESCE(v_fiscal_compliance_rate, 100),
      'upcoming', COALESCE(v_upcoming_obligations, 0),
      'overdue', COALESCE(v_overdue_obligations, 0)
    ),
    'calculated_at', now()
  );

  RETURN v_result;
END;
$$;

-- Function to detect accounting anomalies
CREATE OR REPLACE FUNCTION public.detect_accounting_anomalies(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anomalies_created INTEGER := 0;
  v_entry RECORD;
  v_total_debit NUMERIC;
  v_total_credit NUMERIC;
BEGIN
  -- Detect unbalanced entries
  FOR v_entry IN
    SELECT 
      ec.id,
      ec.numero_piece,
      ec.libelle,
      SUM(le.debit) as total_debit,
      SUM(le.credit) as total_credit
    FROM public.ecritures_comptables ec
    LEFT JOIN public.lignes_ecriture le ON le.ecriture_id = ec.id
    WHERE ec.tenant_id = p_tenant_id
      AND ec.statut != 'validee'
    GROUP BY ec.id, ec.numero_piece, ec.libelle
    HAVING ABS(SUM(le.debit) - SUM(le.credit)) > 0.01
  LOOP
    -- Check if anomaly already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.ai_accounting_anomalies
      WHERE tenant_id = p_tenant_id
        AND anomaly_type = 'balance_error'
        AND affected_entries @> ARRAY[v_entry.id]
        AND status != 'resolved'
    ) THEN
      INSERT INTO public.ai_accounting_anomalies (
        tenant_id, anomaly_type, severity, title, description,
        affected_entries, suggested_correction
      ) VALUES (
        p_tenant_id,
        'balance_error',
        'high',
        'Écriture déséquilibrée: ' || v_entry.numero_piece,
        'L''écriture ' || v_entry.libelle || ' présente un déséquilibre de ' || 
          ABS(v_entry.total_debit - v_entry.total_credit) || ' FCFA',
        ARRAY[v_entry.id],
        'Vérifier et corriger les montants débit/crédit pour équilibrer l''écriture'
      );
      v_anomalies_created := v_anomalies_created + 1;
    END IF;
  END LOOP;

  -- Detect missing document references
  FOR v_entry IN
    SELECT id, numero_piece, libelle
    FROM public.ecritures_comptables
    WHERE tenant_id = p_tenant_id
      AND (piece_justificative IS NULL OR piece_justificative = '')
      AND statut = 'brouillon'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.ai_accounting_anomalies
      WHERE tenant_id = p_tenant_id
        AND anomaly_type = 'missing_document'
        AND affected_entries @> ARRAY[v_entry.id]
        AND status != 'resolved'
    ) THEN
      INSERT INTO public.ai_accounting_anomalies (
        tenant_id, anomaly_type, severity, title, description,
        affected_entries, suggested_correction
      ) VALUES (
        p_tenant_id,
        'missing_document',
        'medium',
        'Pièce justificative manquante: ' || v_entry.numero_piece,
        'L''écriture ' || v_entry.libelle || ' n''a pas de pièce justificative attachée',
        ARRAY[v_entry.id],
        'Joindre le document justificatif (facture, reçu, etc.) à cette écriture'
      );
      v_anomalies_created := v_anomalies_created + 1;
    END IF;
  END LOOP;

  RETURN v_anomalies_created;
END;
$$;

-- Function to get fiscal calendar
CREATE OR REPLACE FUNCTION public.get_fiscal_calendar(p_tenant_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_result JSONB;
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'type', type_obligation,
      'description', description,
      'due_date', date_echeance,
      'amount', montant,
      'status', statut,
      'period', periode_concernee,
      'days_until_due', date_echeance - CURRENT_DATE,
      'is_overdue', date_echeance < CURRENT_DATE AND statut = 'en_attente'
    ) ORDER BY date_echeance
  )
  INTO v_result
  FROM public.obligations_fiscales
  WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM date_echeance) = v_year;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- Function to generate accounting report summary
CREATE OR REPLACE FUNCTION public.generate_accounting_report_summary(p_tenant_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_debit NUMERIC;
  v_total_credit NUMERIC;
  v_entries_count INTEGER;
  v_accounts_used INTEGER;
BEGIN
  -- Get totals from entries in period
  SELECT 
    COUNT(DISTINCT ec.id),
    COALESCE(SUM(le.debit), 0),
    COALESCE(SUM(le.credit), 0),
    COUNT(DISTINCT le.compte_id)
  INTO v_entries_count, v_total_debit, v_total_credit, v_accounts_used
  FROM public.ecritures_comptables ec
  LEFT JOIN public.lignes_ecriture le ON le.ecriture_id = ec.id
  WHERE ec.tenant_id = p_tenant_id
    AND ec.date_ecriture BETWEEN p_start_date AND p_end_date;

  v_result := jsonb_build_object(
    'period', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'summary', jsonb_build_object(
      'entries_count', COALESCE(v_entries_count, 0),
      'total_debit', COALESCE(v_total_debit, 0),
      'total_credit', COALESCE(v_total_credit, 0),
      'accounts_used', COALESCE(v_accounts_used, 0),
      'is_balanced', ABS(COALESCE(v_total_debit, 0) - COALESCE(v_total_credit, 0)) < 0.01
    ),
    'generated_at', now()
  );

  RETURN v_result;
END;
$$;
