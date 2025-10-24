-- ==========================
-- Recréation Fonctions de Base
-- ==========================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT p.tenant_id INTO current_tenant_id
    FROM personnel p
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1;
    RETURN current_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO authenticated;