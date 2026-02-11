
-- Ajouter les colonnes de liaison aux sessions d'inventaire
ALTER TABLE public.inventaire_sessions
  ADD COLUMN IF NOT EXISTS reception_id UUID REFERENCES public.receptions_fournisseurs(id),
  ADD COLUMN IF NOT EXISTS session_caisse_id UUID REFERENCES public.sessions_caisse(id);

-- Ajouter les colonnes de tracking dans inventaire_items
ALTER TABLE public.inventaire_items
  ADD COLUMN IF NOT EXISTS quantite_initiale INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantite_mouvement INTEGER DEFAULT 0;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_inventaire_sessions_reception_id ON public.inventaire_sessions(reception_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_sessions_session_caisse_id ON public.inventaire_sessions(session_caisse_id);

NOTIFY pgrst, 'reload schema';
