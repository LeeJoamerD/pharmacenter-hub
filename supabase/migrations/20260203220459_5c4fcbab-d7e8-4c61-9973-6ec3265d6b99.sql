-- ============================================
-- Migration: Corriger contraintes UNIQUE multi-tenant
-- 4 tables: prescriptions, retours, programme_fidelite, personnel
-- ============================================

-- 1. PRESCRIPTIONS : Remplacer contrainte globale par tenant-scoped
ALTER TABLE public.prescriptions 
  DROP CONSTRAINT IF EXISTS prescriptions_numero_prescription_key;
ALTER TABLE public.prescriptions 
  ADD CONSTRAINT prescriptions_tenant_numero_unique 
  UNIQUE (tenant_id, numero_prescription);

-- 2. RETOURS : Remplacer contrainte globale par tenant-scoped
ALTER TABLE public.retours 
  DROP CONSTRAINT IF EXISTS retours_numero_retour_key;
ALTER TABLE public.retours 
  ADD CONSTRAINT retours_tenant_numero_retour_unique 
  UNIQUE (tenant_id, numero_retour);

-- 3. PROGRAMME_FIDELITE : Remplacer contrainte globale par tenant-scoped
ALTER TABLE public.programme_fidelite 
  DROP CONSTRAINT IF EXISTS programme_fidelite_numero_carte_key;
ALTER TABLE public.programme_fidelite 
  ADD CONSTRAINT programme_fidelite_tenant_numero_carte_unique 
  UNIQUE (tenant_id, numero_carte);

-- 4. PERSONNEL : Remplacer contrainte globale par tenant-scoped
ALTER TABLE public.personnel 
  DROP CONSTRAINT IF EXISTS personnel_reference_agent_key;
ALTER TABLE public.personnel 
  ADD CONSTRAINT personnel_tenant_reference_agent_unique 
  UNIQUE (tenant_id, reference_agent);

-- Index de performance pour recherches par numéro seul (reporting)
CREATE INDEX IF NOT EXISTS idx_prescriptions_numero ON public.prescriptions(numero_prescription);
CREATE INDEX IF NOT EXISTS idx_retours_numero ON public.retours(numero_retour);
CREATE INDEX IF NOT EXISTS idx_programme_fidelite_numero_carte ON public.programme_fidelite(numero_carte);
CREATE INDEX IF NOT EXISTS idx_personnel_reference_agent ON public.personnel(reference_agent);

-- Notifier PostgREST du changement de schéma
NOTIFY pgrst, 'reload schema';