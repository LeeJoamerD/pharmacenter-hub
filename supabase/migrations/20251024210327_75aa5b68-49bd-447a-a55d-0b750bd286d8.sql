-- =====================================================
-- Migration 01: Fonctions de Base
-- Description: Fonctions SQL utilitaires essentielles
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction de sécurité pour récupérer le tenant_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Récupérer le tenant_id depuis la table personnel
    SELECT p.tenant_id INTO current_tenant_id
    FROM personnel p
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1;
    
    RETURN current_tenant_id;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO authenticated;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Fonction trigger pour mettre à jour automatiquement la colonne updated_at';
COMMENT ON FUNCTION public.get_current_user_tenant_id() IS 'Récupère le tenant_id de l''utilisateur authentifié depuis la table personnel';