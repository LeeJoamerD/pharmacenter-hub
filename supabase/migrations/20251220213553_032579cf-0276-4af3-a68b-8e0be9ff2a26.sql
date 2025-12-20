-- Ajouter les colonnes de traçabilité pour les annulations de dépenses de caisse
ALTER TABLE public.mouvements_caisse 
ADD COLUMN IF NOT EXISTS est_annule BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS annule_par UUID REFERENCES public.personnel(id),
ADD COLUMN IF NOT EXISTS date_annulation TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS motif_annulation TEXT;

-- Créer un index pour les requêtes sur les dépenses non annulées
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_est_annule 
ON public.mouvements_caisse(est_annule) 
WHERE est_annule = FALSE;

-- Commenter les colonnes
COMMENT ON COLUMN public.mouvements_caisse.est_annule IS 'Indique si le mouvement a été annulé (soft delete)';
COMMENT ON COLUMN public.mouvements_caisse.annule_par IS 'ID du personnel qui a effectué l''annulation';
COMMENT ON COLUMN public.mouvements_caisse.date_annulation IS 'Date et heure de l''annulation';
COMMENT ON COLUMN public.mouvements_caisse.motif_annulation IS 'Motif de l''annulation';