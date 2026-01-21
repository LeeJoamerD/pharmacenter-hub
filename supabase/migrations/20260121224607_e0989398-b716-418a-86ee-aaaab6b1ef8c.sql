
-- Migration B — Journaux + Exercice 2026 + config générale minimale

-- 1) Journal VT (Ventes)
INSERT INTO public.journaux_comptables (
  tenant_id,
  code_journal,
  libelle_journal,
  type_journal,
  auto_generation,
  is_active,
  sequence_courante
)
SELECT
  'aa8717d1-d450-48dd-a484-66402e435797',
  'VT',
  'Journal des Ventes',
  'Ventes',
  false,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM public.journaux_comptables
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797'
    AND code_journal = 'VT'
);

-- 2) Exercice 2026 (Ouvert)
INSERT INTO public.exercices_comptables (
  tenant_id,
  libelle_exercice,
  date_debut,
  date_fin,
  statut
)
SELECT
  'aa8717d1-d450-48dd-a484-66402e435797',
  'Exercice 2026',
  '2026-01-01'::date,
  '2026-12-31'::date,
  'Ouvert'
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercices_comptables
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797'
    AND (libelle_exercice = 'Exercice 2026' OR (date_debut = '2026-01-01'::date AND date_fin = '2026-12-31'::date))
);

-- 3) accounting_general_config minimale (auto_calcul_tva=true requis par le service)
INSERT INTO public.accounting_general_config (
  tenant_id,
  plan_comptable,
  regime_tva,
  periodicite_tva,
  auto_calcul_tva,
  auto_lettrage,
  controle_equilibre,
  saisie_analytique,
  decimal_places,
  taux_tva_normal,
  taux_tva_reduit
)
SELECT
  'aa8717d1-d450-48dd-a484-66402e435797',
  'ohada',
  'reel',
  'mensuelle',
  true,
  true,
  true,
  false,
  2,
  18,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounting_general_config
  WHERE tenant_id = 'aa8717d1-d450-48dd-a484-66402e435797'
);
