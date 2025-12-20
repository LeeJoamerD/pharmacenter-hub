-- Phase 1: Enrichir la table journaux_comptables avec les colonnes manquantes
-- Ces colonnes étaient présentes dans accounting_journals mais pas dans journaux_comptables

ALTER TABLE public.journaux_comptables 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS prefixe VARCHAR(10),
  ADD COLUMN IF NOT EXISTS sequence_courante INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS auto_generation BOOLEAN DEFAULT false;