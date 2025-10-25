-- Migration pour renforcer la sécurité RLS sur les sessions d'inventaire

-- 1. Restreindre l'accès anonyme sur accounting_currencies
DROP POLICY IF EXISTS "Users can view accounting_currencies from their tenant" ON public.accounting_currencies;
CREATE POLICY "Authenticated users can view accounting_currencies from their tenant"
ON public.accounting_currencies
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- 2. Ajouter validation stricte du personnel sur inventaire_sessions
CREATE POLICY "Only authenticated personnel can insert sessions"
ON public.inventaire_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND agent_id IN (
    SELECT id FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
  )
);

-- 3. Bloquer les UUID invalides pour agent_id
CREATE POLICY "Block invalid agent_id on sessions"
ON public.inventaire_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE id = agent_id 
    AND tenant_id = inventaire_sessions.tenant_id
  )
);

-- 4. Politique stricte pour les lignes d'inventaire
DROP POLICY IF EXISTS "Users can insert inventory lines in their tenant" ON public.inventaire_lignes;
CREATE POLICY "Authenticated personnel can insert inventory lines"
ON public.inventaire_lignes
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
  )
);

-- 5. Ajouter une fonction de sécurité pour valider les opérations sensibles
CREATE OR REPLACE FUNCTION validate_reconciliation_operation(
  p_tenant_id UUID,
  p_agent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  -- Vérifier que l'agent appartient au tenant
  SELECT EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE id = p_agent_id 
    AND tenant_id = p_tenant_id
    AND auth_user_id = auth.uid()
    AND is_active = true
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$;

-- 6. Trigger pour valider automatiquement les opérations de réconciliation
CREATE OR REPLACE FUNCTION validate_reconciliation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Valider que l'agent_id est légitime
  IF NOT validate_reconciliation_operation(NEW.tenant_id, NEW.agent_id) THEN
    RAISE EXCEPTION 'Agent ID invalide ou utilisateur non autorisé';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_reconciliation ON public.inventaire_sessions;
CREATE TRIGGER trigger_validate_reconciliation
  BEFORE INSERT ON public.inventaire_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validate_reconciliation_insert();