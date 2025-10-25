
-- 1) ACCOUNTING JOURNALS: alias + description + synchro

ALTER TABLE public.accounting_journals
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.accounting_journals
  ADD COLUMN IF NOT EXISTS code_journal text,
  ADD COLUMN IF NOT EXISTS libelle_journal text,
  ADD COLUMN IF NOT EXISTS type_journal text;

-- Trigger de synchronisation pour journaux
CREATE OR REPLACE FUNCTION public.sync_accounting_journals_aliases()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Code
  IF NEW.code IS NULL AND NEW.code_journal IS NOT NULL THEN
    NEW.code := NEW.code_journal;
  END IF;
  IF NEW.code_journal IS NULL AND NEW.code IS NOT NULL THEN
    NEW.code_journal := NEW.code;
  END IF;

  -- Name / Libellé
  IF NEW.name IS NULL AND NEW.libelle_journal IS NOT NULL THEN
    NEW.name := NEW.libelle_journal;
  END IF;
  IF NEW.libelle_journal IS NULL AND NEW.name IS NOT NULL THEN
    NEW.libelle_journal := NEW.name;
  END IF;

  -- Type
  IF NEW.type IS NULL AND NEW.type_journal IS NOT NULL THEN
    NEW.type := NEW.type_journal;
  END IF;
  IF NEW.type_journal IS NULL AND NEW.type IS NOT NULL THEN
    NEW.type_journal := NEW.type;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_accounting_journals_aliases ON public.accounting_journals;
CREATE TRIGGER trg_sync_accounting_journals_aliases
BEFORE INSERT OR UPDATE ON public.accounting_journals
FOR EACH ROW EXECUTE FUNCTION public.sync_accounting_journals_aliases();

-- Index unicité code par tenant (si absent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND indexname='uq_accounting_journals_tenant_code'
  ) THEN
    CREATE UNIQUE INDEX uq_accounting_journals_tenant_code
      ON public.accounting_journals (tenant_id, code);
  END IF;
END$$;

-- 2) ACCOUNTING CURRENCIES: alias + contraintes

ALTER TABLE public.accounting_currencies
  ADD COLUMN IF NOT EXISTS currency_code text;

-- Trigger de synchronisation pour devises
CREATE OR REPLACE FUNCTION public.sync_accounting_currencies_aliases()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL AND NEW.currency_code IS NOT NULL THEN
    NEW.code := NEW.currency_code;
  END IF;
  IF NEW.currency_code IS NULL AND NEW.code IS NOT NULL THEN
    NEW.currency_code := NEW.code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_accounting_currencies_aliases ON public.accounting_currencies;
CREATE TRIGGER trg_sync_accounting_currencies_aliases
BEFORE INSERT OR UPDATE ON public.accounting_currencies
FOR EACH ROW EXECUTE FUNCTION public.sync_accounting_currencies_aliases();

-- Unicité code/currency_code par tenant (si absents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND indexname='uq_accounting_currencies_tenant_code'
  ) THEN
    CREATE UNIQUE INDEX uq_accounting_currencies_tenant_code
      ON public.accounting_currencies (tenant_id, code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND indexname='uq_accounting_currencies_tenant_currency_code'
  ) THEN
    CREATE UNIQUE INDEX uq_accounting_currencies_tenant_currency_code
      ON public.accounting_currencies (tenant_id, currency_code);
  END IF;

  -- Une seule devise de base par tenant
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND indexname='uq_accounting_currencies_base_per_tenant'
  ) THEN
    CREATE UNIQUE INDEX uq_accounting_currencies_base_per_tenant
      ON public.accounting_currencies (tenant_id)
      WHERE is_base_currency = true;
  END IF;
END$$;

-- 3) ACCOUNTING NUMBERING RULES: contrainte pour UPSERT

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND indexname='uq_accounting_numbering_rules_tenant_rule'
  ) THEN
    CREATE UNIQUE INDEX uq_accounting_numbering_rules_tenant_rule
      ON public.accounting_numbering_rules (tenant_id, rule_type);
  END IF;
END$$;

-- 4) RLS/POLICIES: activer et créer si manquants
-- Helper: crée RLS + policies standard si absents pour une table donnée
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'accounting_journals',
    'accounting_currencies',
    'accounting_numbering_rules',
    'exercices_comptables'
  ]) LOOP
    -- Activer RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Policy SELECT (si absente)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename=t AND policyname='Users can view '||t||' from their tenant'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (tenant_id = get_current_user_tenant_id())',
        'Users can view '||t||' from their tenant', t
      );
    END IF;

    -- Policy ALL (INSERT/UPDATE/DELETE) pour rôles comptables/admin/pharmacien
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename=t AND policyname='Accountants can manage '||t||' in their tenant'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (
           tenant_id = get_current_user_tenant_id() AND EXISTS (
             SELECT 1 FROM public.personnel p
             WHERE p.auth_user_id = auth.uid()
               AND p.tenant_id = get_current_user_tenant_id()
               AND p.role = ANY(ARRAY[''Admin'',''Pharmacien'',''Comptable''])
           )
         ) WITH CHECK (
           tenant_id = get_current_user_tenant_id()
         )',
        'Accountants can manage '||t||' in their tenant', t
      );
    END IF;
  END LOOP;
END$$;

