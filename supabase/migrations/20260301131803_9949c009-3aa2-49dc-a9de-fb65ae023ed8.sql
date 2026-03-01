
-- Enrichir bulletins_paie avec les colonnes de primes détaillées
ALTER TABLE public.bulletins_paie
  ADD COLUMN IF NOT EXISTS detail_primes_imposables JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detail_primes_non_imposables JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detail_retenues JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conges_payes NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qte_presences INTEGER DEFAULT 26,
  ADD COLUMN IF NOT EXISTS acompte NUMERIC DEFAULT 0;

-- Enrichir parametres_paie avec les primes par défaut
ALTER TABLE public.parametres_paie
  ADD COLUMN IF NOT EXISTS primes_defaut JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS taux_conge_paye NUMERIC DEFAULT 8.33,
  ADD COLUMN IF NOT EXISTS tol_defaut NUMERIC DEFAULT 0;
