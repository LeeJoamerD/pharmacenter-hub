-- =====================================================
-- AJOUT COLONNES MANQUANTES + TRIGGERS COMPTABLES
-- =====================================================

-- Ajouter les colonnes manquantes à ecritures_comptables
ALTER TABLE public.ecritures_comptables 
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_debit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credit NUMERIC(15,2) DEFAULT 0;

-- =====================================================
-- PHASE 1 : COMPTES COMPTABLES MANQUANTS
-- =====================================================

INSERT INTO public.plan_comptable (tenant_id, numero_compte, libelle_compte, classe, type_compte, is_active)
SELECT p.id, '571', 'Caisse', '5', 'detail', true
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '571');

INSERT INTO public.plan_comptable (tenant_id, numero_compte, libelle_compte, classe, type_compte, is_active)
SELECT p.id, '572', 'Banque', '5', 'detail', true
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '572');

INSERT INTO public.plan_comptable (tenant_id, numero_compte, libelle_compte, classe, type_compte, is_active)
SELECT p.id, '4431', 'TVA collectée sur ventes', '4', 'detail', true
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '4431');

INSERT INTO public.plan_comptable (tenant_id, numero_compte, libelle_compte, classe, type_compte, is_active)
SELECT p.id, '4451', 'TVA déductible sur achats', '4', 'detail', true
FROM public.pharmacies p
WHERE NOT EXISTS (SELECT 1 FROM public.plan_comptable pc WHERE pc.tenant_id = p.id AND pc.numero_compte = '4451');

-- =====================================================
-- PHASE 2 : TABLE ACCOUNTING_DEFAULT_ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.accounting_default_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  compte_debit_numero TEXT NOT NULL,
  compte_credit_numero TEXT NOT NULL,
  journal_code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, event_type)
);

ALTER TABLE public.accounting_default_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounting_default_accounts_select') THEN
    CREATE POLICY "accounting_default_accounts_select" ON public.accounting_default_accounts FOR SELECT USING (tenant_id = get_current_user_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounting_default_accounts_insert') THEN
    CREATE POLICY "accounting_default_accounts_insert" ON public.accounting_default_accounts FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounting_default_accounts_update') THEN
    CREATE POLICY "accounting_default_accounts_update" ON public.accounting_default_accounts FOR UPDATE USING (tenant_id = get_current_user_tenant_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounting_default_accounts_delete') THEN
    CREATE POLICY "accounting_default_accounts_delete" ON public.accounting_default_accounts FOR DELETE USING (tenant_id = get_current_user_tenant_id());
  END IF;
END $$;

INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description)
SELECT p.id, 'vente_client', '411', '701', 'VTE', 'Vente à crédit' FROM public.pharmacies p ON CONFLICT DO NOTHING;

INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description)
SELECT p.id, 'vente_comptant', '571', '701', 'VTE', 'Vente au comptant' FROM public.pharmacies p ON CONFLICT DO NOTHING;

INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description)
SELECT p.id, 'achat_marchandises', '601', '401', 'ACH', 'Achat marchandises' FROM public.pharmacies p ON CONFLICT DO NOTHING;

INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description)
SELECT p.id, 'decaissement_especes', '401', '571', 'CAI', 'Paiement fournisseur espèces' FROM public.pharmacies p ON CONFLICT DO NOTHING;

INSERT INTO public.accounting_default_accounts (tenant_id, event_type, compte_debit_numero, compte_credit_numero, journal_code, description)
SELECT p.id, 'decaissement_banque', '401', '521', 'BQ1', 'Paiement fournisseur banque' FROM public.pharmacies p ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 3 : FONCTION GENERATE_ACCOUNTING_ENTRY
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_accounting_entry(
  p_tenant_id UUID, p_journal_code TEXT, p_date_ecriture DATE, p_libelle TEXT,
  p_reference_type TEXT, p_reference_id UUID, p_lines JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_ecriture_id UUID; v_journal_id UUID; v_numero_piece TEXT;
  v_total_debit NUMERIC := 0; v_total_credit NUMERIC := 0;
  v_line JSONB; v_compte_id UUID; v_exercice_id UUID;
BEGIN
  IF p_tenant_id IS NULL THEN RAISE EXCEPTION 'tenant_id requis'; END IF;

  SELECT id INTO v_journal_id FROM public.accounting_journals
  WHERE tenant_id = p_tenant_id AND code = p_journal_code AND is_active = true LIMIT 1;
  IF v_journal_id IS NULL THEN RAISE EXCEPTION 'Journal % non trouvé', p_journal_code; END IF;

  SELECT id INTO v_exercice_id FROM public.exercices_comptables
  WHERE tenant_id = p_tenant_id AND p_date_ecriture BETWEEN date_debut AND date_fin AND statut = 'ouvert' LIMIT 1;

  v_numero_piece := p_journal_code || '-' || TO_CHAR(p_date_ecriture, 'YYYYMM') || '-' || 
    LPAD((COALESCE((SELECT COUNT(*)+1 FROM public.ecritures_comptables WHERE tenant_id = p_tenant_id AND journal_id = v_journal_id AND date_ecriture >= DATE_TRUNC('month', p_date_ecriture)), 1))::TEXT, 4, '0');

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
    v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
  END LOOP;

  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Écriture déséquilibrée : Débit=% Crédit=%', v_total_debit, v_total_credit;
  END IF;

  INSERT INTO public.ecritures_comptables (tenant_id, journal_id, exercice_id, numero_piece, date_ecriture, libelle, statut, is_auto_generated, reference_type, reference_id, total_debit, total_credit)
  VALUES (p_tenant_id, v_journal_id, v_exercice_id, v_numero_piece, p_date_ecriture, p_libelle, 'brouillard', true, p_reference_type, p_reference_id, v_total_debit, v_total_credit)
  RETURNING id INTO v_ecriture_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT id INTO v_compte_id FROM public.plan_comptable
    WHERE tenant_id = p_tenant_id AND numero_compte = (v_line->>'numero_compte') AND is_active = true LIMIT 1;
    IF v_compte_id IS NULL THEN RAISE EXCEPTION 'Compte % non trouvé', (v_line->>'numero_compte'); END IF;

    INSERT INTO public.lignes_ecriture (tenant_id, ecriture_id, compte_id, libelle, debit, credit)
    VALUES (p_tenant_id, v_ecriture_id, v_compte_id, COALESCE(v_line->>'libelle_ligne', p_libelle),
            COALESCE((v_line->>'debit')::NUMERIC, 0), COALESCE((v_line->>'credit')::NUMERIC, 0));
  END LOOP;

  RETURN v_ecriture_id;
END;
$$;

-- =====================================================
-- PHASE 4 : TRIGGER VENTES
-- =====================================================

CREATE OR REPLACE FUNCTION public.trg_vente_accounting_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_montant_ht NUMERIC; v_montant_tva NUMERIC; v_montant_ttc NUMERIC;
  v_lines JSONB; v_compte_debit TEXT; v_libelle TEXT; v_client_name TEXT;
BEGIN
  IF NEW.statut != 'Validée' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.ecritures_comptables WHERE tenant_id = NEW.tenant_id AND reference_type = 'vente' AND reference_id = NEW.id) THEN RETURN NEW; END IF;

  v_montant_ttc := COALESCE(NEW.montant_total_ttc, 0);
  v_montant_tva := COALESCE(NEW.montant_tva, 0);
  v_montant_ht := v_montant_ttc - v_montant_tva;
  IF v_montant_ttc = 0 THEN RETURN NEW; END IF;

  v_compte_debit := CASE WHEN NEW.mode_paiement IN ('Espèces', 'Cash') OR NEW.client_id IS NULL THEN '571' ELSE '411' END;
  IF NEW.client_id IS NOT NULL THEN SELECT nom INTO v_client_name FROM public.clients WHERE id = NEW.client_id; END IF;
  v_libelle := 'Vente ' || COALESCE(NEW.numero_vente, NEW.id::TEXT) || COALESCE(' - ' || v_client_name, '');

  v_lines := jsonb_build_array(
    jsonb_build_object('numero_compte', v_compte_debit, 'debit', v_montant_ttc, 'credit', 0, 'libelle_ligne', v_libelle),
    jsonb_build_object('numero_compte', '701', 'debit', 0, 'credit', v_montant_ht, 'libelle_ligne', 'Ventes de marchandises')
  );
  IF v_montant_tva > 0 THEN
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('numero_compte', '4431', 'debit', 0, 'credit', v_montant_tva, 'libelle_ligne', 'TVA collectée'));
  END IF;

  PERFORM public.generate_accounting_entry(NEW.tenant_id, 'VTE', COALESCE(NEW.date_vente::DATE, CURRENT_DATE), v_libelle, 'vente', NEW.id, v_lines);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Erreur écriture vente %: %', NEW.id, SQLERRM; RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vente_accounting ON public.ventes;
CREATE TRIGGER trg_vente_accounting AFTER INSERT OR UPDATE OF statut ON public.ventes FOR EACH ROW EXECUTE FUNCTION public.trg_vente_accounting_fn();

-- =====================================================
-- PHASE 5 : TRIGGER ACHATS/RÉCEPTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.trg_achat_accounting_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_montant_ht NUMERIC; v_montant_tva NUMERIC; v_montant_ttc NUMERIC;
  v_lines JSONB; v_libelle TEXT; v_fournisseur_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.ecritures_comptables WHERE tenant_id = NEW.tenant_id AND reference_type = 'reception' AND reference_id = NEW.id) THEN RETURN NEW; END IF;

  v_montant_ttc := COALESCE(NEW.montant_total_ttc, NEW.montant_total, 0);
  v_montant_tva := COALESCE(NEW.montant_tva, 0);
  v_montant_ht := v_montant_ttc - v_montant_tva;
  IF v_montant_ttc = 0 THEN RETURN NEW; END IF;

  IF NEW.fournisseur_id IS NOT NULL THEN SELECT nom INTO v_fournisseur_name FROM public.fournisseurs WHERE id = NEW.fournisseur_id; END IF;
  v_libelle := 'Réception ' || COALESCE(NEW.numero_reception, NEW.id::TEXT) || COALESCE(' - ' || v_fournisseur_name, '');

  v_lines := jsonb_build_array(
    jsonb_build_object('numero_compte', '601', 'debit', v_montant_ht, 'credit', 0, 'libelle_ligne', 'Achats de marchandises'),
    jsonb_build_object('numero_compte', '401', 'debit', 0, 'credit', v_montant_ttc, 'libelle_ligne', v_libelle)
  );
  IF v_montant_tva > 0 THEN
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('numero_compte', '4451', 'debit', v_montant_tva, 'credit', 0, 'libelle_ligne', 'TVA déductible'));
  END IF;

  PERFORM public.generate_accounting_entry(NEW.tenant_id, 'ACH', COALESCE(NEW.date_reception::DATE, CURRENT_DATE), v_libelle, 'reception', NEW.id, v_lines);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Erreur écriture réception %: %', NEW.id, SQLERRM; RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_achat_accounting ON public.receptions_fournisseurs;
CREATE TRIGGER trg_achat_accounting AFTER INSERT ON public.receptions_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.trg_achat_accounting_fn();

-- =====================================================
-- PHASE 6 : TRIGGER DÉCAISSEMENTS
-- =====================================================

CREATE OR REPLACE FUNCTION public.trg_decaissement_accounting_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_lines JSONB; v_libelle TEXT; v_fournisseur_name TEXT; v_compte_credit TEXT; v_journal_code TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.ecritures_comptables WHERE tenant_id = NEW.tenant_id AND reference_type = 'paiement_fournisseur' AND reference_id = NEW.id) THEN RETURN NEW; END IF;
  IF COALESCE(NEW.montant, 0) = 0 THEN RETURN NEW; END IF;

  CASE NEW.mode_paiement
    WHEN 'Espèces', 'Cash' THEN v_compte_credit := '571'; v_journal_code := 'CAI';
    WHEN 'Virement', 'Virement bancaire', 'Chèque' THEN v_compte_credit := '521'; v_journal_code := 'BQ1';
    ELSE v_compte_credit := '571'; v_journal_code := 'CAI';
  END CASE;

  IF NEW.fournisseur_id IS NOT NULL THEN SELECT nom INTO v_fournisseur_name FROM public.fournisseurs WHERE id = NEW.fournisseur_id; END IF;
  v_libelle := 'Paiement ' || COALESCE(NEW.reference_paiement, NEW.id::TEXT) || COALESCE(' - ' || v_fournisseur_name, '');

  v_lines := jsonb_build_array(
    jsonb_build_object('numero_compte', '401', 'debit', NEW.montant, 'credit', 0, 'libelle_ligne', v_libelle),
    jsonb_build_object('numero_compte', v_compte_credit, 'debit', 0, 'credit', NEW.montant, 'libelle_ligne', 'Règlement ' || NEW.mode_paiement)
  );

  PERFORM public.generate_accounting_entry(NEW.tenant_id, v_journal_code, COALESCE(NEW.date_paiement, CURRENT_DATE), v_libelle, 'paiement_fournisseur', NEW.id, v_lines);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Erreur écriture paiement %: %', NEW.id, SQLERRM; RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decaissement_accounting ON public.paiements_fournisseurs;
CREATE TRIGGER trg_decaissement_accounting AFTER INSERT ON public.paiements_fournisseurs FOR EACH ROW EXECUTE FUNCTION public.trg_decaissement_accounting_fn();

-- =====================================================
-- PHASE 7 : INDEX DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ecritures_reference ON public.ecritures_comptables(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_auto_generated ON public.ecritures_comptables(is_auto_generated) WHERE is_auto_generated = true;
CREATE INDEX IF NOT EXISTS idx_ecritures_date ON public.ecritures_comptables(date_ecriture DESC);
CREATE INDEX IF NOT EXISTS idx_lignes_ecriture_compte ON public.lignes_ecriture(compte_id);
CREATE INDEX IF NOT EXISTS idx_accounting_default_accounts_tenant ON public.accounting_default_accounts(tenant_id);

GRANT EXECUTE ON FUNCTION public.generate_accounting_entry TO authenticated;