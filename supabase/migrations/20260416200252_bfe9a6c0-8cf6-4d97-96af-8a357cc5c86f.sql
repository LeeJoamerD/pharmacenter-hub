-- Table d'audit pour tracer toutes les tentatives de modification de rôle
CREATE TABLE IF NOT EXISTS public.audit_role_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  personnel_id uuid NOT NULL,
  old_role text,
  new_role text,
  changed_by_auth_uid uuid,
  changed_by_personnel_id uuid,
  was_blocked boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_role_changes ENABLE ROW LEVEL SECURITY;

-- Seuls les admins du tenant peuvent lire les logs d'audit
CREATE POLICY "Admins can view role change audit for their tenant"
ON public.audit_role_changes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.personnel p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = audit_role_changes.tenant_id
      AND p.role IN ('Admin', 'Pharmacien Titulaire')
  )
);

CREATE INDEX IF NOT EXISTS idx_audit_role_changes_tenant ON public.audit_role_changes(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_role_changes_personnel ON public.audit_role_changes(personnel_id, created_at DESC);

-- Fonction de protection : bloque les changements de rôle non autorisés
CREATE OR REPLACE FUNCTION public.protect_personnel_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_tenant uuid;
  v_caller_personnel_id uuid;
  v_is_authorized boolean := false;
BEGIN
  -- Si le rôle ne change pas, rien à faire
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'identité de l'appelant
  SELECT id, role, tenant_id
    INTO v_caller_personnel_id, v_caller_role, v_caller_tenant
  FROM public.personnel
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- Autoriser si:
  --  - l'appelant est Admin ou Pharmacien Titulaire du même tenant
  --  - OU appel système sans auth.uid() (migrations / service_role)
  IF auth.uid() IS NULL THEN
    v_is_authorized := true;
  ELSIF v_caller_tenant = NEW.tenant_id
        AND v_caller_role IN ('Admin', 'Pharmacien Titulaire') THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    -- Journaliser la tentative bloquée
    INSERT INTO public.audit_role_changes(
      tenant_id, personnel_id, old_role, new_role,
      changed_by_auth_uid, changed_by_personnel_id, was_blocked, reason
    ) VALUES (
      NEW.tenant_id, NEW.id, OLD.role, NEW.role,
      auth.uid(), v_caller_personnel_id, true,
      'Caller is not Admin/Pharmacien Titulaire of tenant'
    );

    -- Restaurer l'ancien rôle au lieu d'échouer (évite de casser l'UI RH)
    NEW.role := OLD.role;
    RETURN NEW;
  END IF;

  -- Changement autorisé : journaliser pour traçabilité
  INSERT INTO public.audit_role_changes(
    tenant_id, personnel_id, old_role, new_role,
    changed_by_auth_uid, changed_by_personnel_id, was_blocked, reason
  ) VALUES (
    NEW.tenant_id, NEW.id, OLD.role, NEW.role,
    auth.uid(), v_caller_personnel_id, false,
    'Authorized role change'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_personnel_role_change ON public.personnel;
CREATE TRIGGER trg_protect_personnel_role_change
BEFORE UPDATE OF role ON public.personnel
FOR EACH ROW
EXECUTE FUNCTION public.protect_personnel_role_change();