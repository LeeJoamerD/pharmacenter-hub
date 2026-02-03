-- Fix: Modifier la contrainte UNIQUE sur numero_vente pour inclure tenant_id
-- Permet à chaque tenant d'avoir sa propre séquence de numéros de vente

-- Supprimer l'ancienne contrainte unique globale (c'est une contrainte, pas un index simple)
ALTER TABLE public.ventes DROP CONSTRAINT IF EXISTS ventes_numero_vente_key;

-- Créer la nouvelle contrainte unique incluant le tenant_id
-- Chaque tenant peut avoir son propre POS-20260203-0001
ALTER TABLE public.ventes 
  ADD CONSTRAINT ventes_tenant_numero_vente_unique 
  UNIQUE (tenant_id, numero_vente);

-- Créer un index pour optimiser les recherches par numero_vente seul (reporting)
CREATE INDEX IF NOT EXISTS idx_ventes_numero_vente ON public.ventes(numero_vente);

-- Notifier PostgREST du changement de schéma
NOTIFY pgrst, 'reload schema';