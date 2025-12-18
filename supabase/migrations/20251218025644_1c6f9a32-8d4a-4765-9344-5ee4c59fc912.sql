-- Forcer le rechargement du cache de schéma PostgREST
-- Nécessaire après la création de nouvelles fonctions RPC
NOTIFY pgrst, 'reload schema';

-- Ajouter des commentaires aux fonctions pour s'assurer qu'elles sont bien exposées
COMMENT ON FUNCTION public.validate_pharmacy_session(text) IS 'Valide une session pharmacie par token sans authentification utilisateur';
COMMENT ON FUNCTION public.create_pharmacy_session(uuid, text, text) IS 'Crée une session pharmacie indépendante de auth.uid()';
COMMENT ON FUNCTION public.disconnect_pharmacy_session(text) IS 'Déconnecte une session pharmacie par token';