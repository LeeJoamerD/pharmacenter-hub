-- Phase 1: Modifier le schéma pour permettre agent_id NULL

-- Permettre agent_id NULL dans sessions_caisse
ALTER TABLE public.sessions_caisse 
ALTER COLUMN agent_id DROP NOT NULL;

-- Permettre agent_id NULL dans mouvements_lots
ALTER TABLE public.mouvements_lots 
ALTER COLUMN agent_id DROP NOT NULL;