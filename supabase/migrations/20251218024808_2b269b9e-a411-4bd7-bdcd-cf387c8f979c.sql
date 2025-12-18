-- Supprimer l'ancienne fonction create_pharmacy_session avec paramètre INET
-- qui exigeait auth.uid() et causait l'erreur de connexion pharmacie
DROP FUNCTION IF EXISTS public.create_pharmacy_session(uuid, inet, text);