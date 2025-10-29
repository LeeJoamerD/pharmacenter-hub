-- =====================================================
-- MIGRATION: Restauration Configuration Comptable
-- Date: 2025-01-29
-- Description: Création des tables accounting_* manquantes
-- =====================================================

-- ===========================
-- PHASE 1: CRÉATION DES TABLES
-- ===========================

-- 1.1) accounting_general_config
CREATE TABLE IF NOT EXISTS public.accounting_general_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  plan_comptable TEXT NOT NULL DEFAULT 'ohada',
  decimal_places INTEGER NOT NULL DEFAULT 2,
  auto_lettrage BOOLEAN NOT NULL DEFAULT true,
  controle_equilibre BOOLEAN NOT NULL DEFAULT true,
  saisie_analytique BOOLEAN NOT NULL DEFAULT false,
  regime_tva TEXT NOT NULL DEFAULT 'reel',
  taux_tva_normal NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  taux_tva_reduit NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  periodicite_tva TEXT NOT NULL DEFAULT 'mensuelle',
  auto_calcul_tva BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_general_config_tenant 
  ON public.accounting_general_config (tenant_id);

-- 1.2) accounting_journals
CREATE TABLE IF NOT EXISTS public.accounting_journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  auto_generation BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_journals_tenant_code 
  ON public.accounting_journals (tenant_id, code);

-- 1.3) accounting_numbering_rules
CREATE TABLE IF NOT EXISTS public.accounting_numbering_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rule_type TEXT NOT NULL,
  format_pattern TEXT NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 1,
  reset_frequency TEXT NOT NULL DEFAULT 'annuel',
  last_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_numbering_rules_tenant_rule 
  ON public.accounting_numbering_rules (tenant_id, rule_type);

-- 1.4) accounting_currencies
CREATE TABLE IF NOT EXISTS public.accounting_currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_base_currency BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_currencies_tenant_code 
  ON public.accounting_currencies (tenant_id, code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_currencies_base_per_tenant
  ON public.accounting_currencies (tenant_id)
  WHERE is_base_currency = true;

-- 1.5) accounting_exchange_rates
CREATE TABLE IF NOT EXISTS public.accounting_exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  currency_id UUID NOT NULL REFERENCES public.accounting_currencies(id) ON DELETE CASCADE,
  rate NUMERIC(15,6) NOT NULL,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  auto_update_enabled BOOLEAN NOT NULL DEFAULT false,
  update_frequency TEXT NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_exchange_rates_tenant_currency_date 
  ON public.accounting_exchange_rates (tenant_id, currency_id, rate_date);

-- ===========================
-- PHASE 2: MIGRATION DES DONNÉES
-- ===========================

-- Migrer depuis journaux_comptables vers accounting_journals (corriger la colonne code)
INSERT INTO public.accounting_journals 
  (tenant_id, code, name, type, is_active, created_at, updated_at)
SELECT 
  tenant_id, 
  code_journal,
  COALESCE(libelle_journal, 'Journal sans nom'), 
  COALESCE(type_journal, 'general'), 
  COALESCE(is_active, true),
  created_at, 
  updated_at
FROM public.journaux_comptables
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ===========================
-- PHASE 3: FONCTION RPC
-- ===========================

CREATE OR REPLACE FUNCTION public.get_next_accounting_number(
  p_tenant_id UUID,
  p_rule_type TEXT,
  p_journal_code TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule_record RECORD;
  next_number INTEGER;
  formatted_number TEXT;
  reset_needed BOOLEAN := false;
BEGIN
  -- Get the numbering rule
  SELECT * INTO rule_record
  FROM public.accounting_numbering_rules
  WHERE tenant_id = p_tenant_id AND rule_type = p_rule_type;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle de numérotation non trouvée pour le type: %', p_rule_type;
  END IF;
  
  -- Check if reset is needed
  IF rule_record.reset_frequency = 'annuel' AND 
     (rule_record.last_reset_date IS NULL OR 
      EXTRACT(YEAR FROM rule_record.last_reset_date) < EXTRACT(YEAR FROM CURRENT_DATE)) THEN
    reset_needed := true;
  ELSIF rule_record.reset_frequency = 'mensuel' AND 
        (rule_record.last_reset_date IS NULL OR 
         rule_record.last_reset_date < date_trunc('month', CURRENT_DATE)) THEN
    reset_needed := true;
  END IF;
  
  -- Reset counter if needed
  IF reset_needed THEN
    next_number := 1;
    UPDATE public.accounting_numbering_rules 
    SET current_number = 2, last_reset_date = CURRENT_DATE
    WHERE id = rule_record.id;
  ELSE
    next_number := rule_record.current_number;
    UPDATE public.accounting_numbering_rules 
    SET current_number = current_number + 1
    WHERE id = rule_record.id;
  END IF;
  
  -- Format the number according to pattern
  formatted_number := rule_record.format_pattern;
  formatted_number := replace(formatted_number, '{YYYY}', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT);
  formatted_number := replace(formatted_number, '{YY}', to_char(CURRENT_DATE, 'YY'));
  formatted_number := replace(formatted_number, '{MM}', to_char(CURRENT_DATE, 'MM'));
  formatted_number := replace(formatted_number, '{DD}', to_char(CURRENT_DATE, 'DD'));
  formatted_number := replace(formatted_number, '{####}', lpad(next_number::TEXT, 4, '0'));
  
  IF p_journal_code IS NOT NULL THEN
    formatted_number := replace(formatted_number, '{JOURNAL}', p_journal_code);
  END IF;
  
  RETURN formatted_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_accounting_number(UUID, TEXT, TEXT) TO authenticated;

-- ===========================
-- PHASE 4: RLS POLICIES
-- ===========================

-- Enable RLS on all tables
ALTER TABLE public.accounting_general_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_numbering_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policies pour accounting_general_config
DROP POLICY IF EXISTS "Users can view general config from their tenant" ON public.accounting_general_config;
CREATE POLICY "Users can view general config from their tenant" 
ON public.accounting_general_config FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Accountants can manage general config in their tenant" ON public.accounting_general_config;
CREATE POLICY "Accountants can manage general config in their tenant" 
ON public.accounting_general_config FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- Policies pour accounting_journals
DROP POLICY IF EXISTS "Users can view journals from their tenant" ON public.accounting_journals;
CREATE POLICY "Users can view journals from their tenant" 
ON public.accounting_journals FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Accountants can manage journals in their tenant" ON public.accounting_journals;
CREATE POLICY "Accountants can manage journals in their tenant" 
ON public.accounting_journals FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- Policies pour accounting_numbering_rules
DROP POLICY IF EXISTS "Users can view numbering rules from their tenant" ON public.accounting_numbering_rules;
CREATE POLICY "Users can view numbering rules from their tenant" 
ON public.accounting_numbering_rules FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Accountants can manage numbering rules in their tenant" ON public.accounting_numbering_rules;
CREATE POLICY "Accountants can manage numbering rules in their tenant" 
ON public.accounting_numbering_rules FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- Policies pour accounting_currencies
DROP POLICY IF EXISTS "Users can view currencies from their tenant" ON public.accounting_currencies;
CREATE POLICY "Users can view currencies from their tenant" 
ON public.accounting_currencies FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Accountants can manage currencies in their tenant" ON public.accounting_currencies;
CREATE POLICY "Accountants can manage currencies in their tenant" 
ON public.accounting_currencies FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- Policies pour accounting_exchange_rates
DROP POLICY IF EXISTS "Users can view exchange rates from their tenant" ON public.accounting_exchange_rates;
CREATE POLICY "Users can view exchange rates from their tenant" 
ON public.accounting_exchange_rates FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Accountants can manage exchange rates in their tenant" ON public.accounting_exchange_rates;
CREATE POLICY "Accountants can manage exchange rates in their tenant" 
ON public.accounting_exchange_rates FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- Corriger les policies de exercices_comptables
DROP POLICY IF EXISTS "tenant_access_exercices" ON public.exercices_comptables;
DROP POLICY IF EXISTS "Users can view fiscal years from their tenant" ON public.exercices_comptables;
DROP POLICY IF EXISTS "Accountants can manage fiscal years in their tenant" ON public.exercices_comptables;

CREATE POLICY "Users can view fiscal years from their tenant" 
ON public.exercices_comptables FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Accountants can manage fiscal years in their tenant" 
ON public.exercices_comptables FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
) WITH CHECK (
  tenant_id = get_current_user_tenant_id()
);

-- ===========================
-- PHASE 5: TRIGGERS
-- ===========================

CREATE TRIGGER update_accounting_general_config_updated_at
BEFORE UPDATE ON public.accounting_general_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_journals_updated_at
BEFORE UPDATE ON public.accounting_journals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_numbering_rules_updated_at
BEFORE UPDATE ON public.accounting_numbering_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_currencies_updated_at
BEFORE UPDATE ON public.accounting_currencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_exchange_rates_updated_at
BEFORE UPDATE ON public.accounting_exchange_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================
-- PHASE 6: DONNÉES PAR DÉFAUT
-- ===========================

-- Config générale pour tous les tenants
INSERT INTO public.accounting_general_config (tenant_id)
SELECT DISTINCT tenant_id FROM public.pharmacies 
ON CONFLICT (tenant_id) DO NOTHING;

-- Journaux par défaut (si pas déjà présents via migration depuis journaux_comptables)
INSERT INTO public.accounting_journals (tenant_id, code, name, type, auto_generation)
SELECT DISTINCT tenant_id, 'VTE', 'Journal des Ventes', 'ventes', true FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.accounting_journals (tenant_id, code, name, type, auto_generation)
SELECT DISTINCT tenant_id, 'ACH', 'Journal des Achats', 'achats', true FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.accounting_journals (tenant_id, code, name, type, auto_generation)
SELECT DISTINCT tenant_id, 'BQ1', 'Banque Principale', 'banque', false FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.accounting_journals (tenant_id, code, name, type, auto_generation)
SELECT DISTINCT tenant_id, 'CAI', 'Journal de Caisse', 'caisse', false FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.accounting_journals (tenant_id, code, name, type, auto_generation)
SELECT DISTINCT tenant_id, 'OD', 'Opérations Diverses', 'operations_diverses', false FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Règles de numérotation par défaut
INSERT INTO public.accounting_numbering_rules (tenant_id, rule_type, format_pattern)
SELECT DISTINCT tenant_id, 'facture', 'FAC-{YYYY}-{MM}-{####}' FROM public.pharmacies 
ON CONFLICT (tenant_id, rule_type) DO NOTHING;

INSERT INTO public.accounting_numbering_rules (tenant_id, rule_type, format_pattern)
SELECT DISTINCT tenant_id, 'facture_achat', 'FACH-{YYYY}-{MM}-{####}' FROM public.pharmacies 
ON CONFLICT (tenant_id, rule_type) DO NOTHING;

INSERT INTO public.accounting_numbering_rules (tenant_id, rule_type, format_pattern)
SELECT DISTINCT tenant_id, 'piece_comptable', '{JOURNAL}-{YYYY}{MM}-{####}' FROM public.pharmacies 
ON CONFLICT (tenant_id, rule_type) DO NOTHING;

-- Devise de base (XOF) pour tous
INSERT INTO public.accounting_currencies (tenant_id, code, name, is_base_currency)
SELECT DISTINCT tenant_id, 'XOF', 'Franc CFA', true FROM public.pharmacies 
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Taux de change pour devise de base (toujours 1.0)
INSERT INTO public.accounting_exchange_rates (tenant_id, currency_id, rate, rate_date)
SELECT DISTINCT 
  c.tenant_id, 
  c.id, 
  1.0,
  CURRENT_DATE
FROM public.accounting_currencies c
WHERE c.is_base_currency = true
ON CONFLICT (tenant_id, currency_id, rate_date) DO NOTHING;