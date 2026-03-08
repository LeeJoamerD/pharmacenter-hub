-- 1. Create SECURITY DEFINER function to check workspace membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_workspace_member(
  _workspace_id UUID,
  _pharmacy_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = _workspace_id
      AND pharmacy_id = _pharmacy_id
      AND status = 'active'
  );
$$;

-- 2. Create SECURITY DEFINER function to get workspace tenant_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_workspace_tenant_id(_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM collaborative_workspaces WHERE id = _workspace_id;
$$;

-- 3. Create SECURITY DEFINER function to get workspace owner
CREATE OR REPLACE FUNCTION public.get_workspace_owner(_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_pharmacy_id FROM collaborative_workspaces WHERE id = _workspace_id;
$$;

-- 4. Drop the circular SELECT policy on collaborative_workspaces
DROP POLICY IF EXISTS "Users can view network workspaces they are members of" ON public.collaborative_workspaces;

-- 5. Recreate it using the SECURITY DEFINER function (no more recursion)
CREATE POLICY "Users can view network workspaces they are members of"
ON public.collaborative_workspaces
FOR SELECT
USING (
  is_network_workspace = true
  AND public.is_workspace_member(id, public.get_current_user_tenant_id())
);

-- 6. Drop all circular policies on workspace_members
DROP POLICY IF EXISTS "Users can view members of accessible workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can add members to own workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update members in own workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can remove members from own workspaces" ON public.workspace_members;

-- 7. Recreate workspace_members policies using SECURITY DEFINER functions
CREATE POLICY "Users can view members of accessible workspaces"
ON public.workspace_members
FOR SELECT
USING (
  public.get_workspace_tenant_id(workspace_id) = public.get_current_user_tenant_id()
  OR public.get_workspace_owner(workspace_id) = public.get_current_user_tenant_id()
  OR pharmacy_id = public.get_current_user_tenant_id()
);

CREATE POLICY "Users can add members to own workspaces"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  public.get_workspace_tenant_id(workspace_id) = public.get_current_user_tenant_id()
  OR public.get_workspace_owner(workspace_id) = public.get_current_user_tenant_id()
);

CREATE POLICY "Users can update members in own workspaces"
ON public.workspace_members
FOR UPDATE
USING (
  public.get_workspace_tenant_id(workspace_id) = public.get_current_user_tenant_id()
  OR public.get_workspace_owner(workspace_id) = public.get_current_user_tenant_id()
);

CREATE POLICY "Users can remove members from own workspaces"
ON public.workspace_members
FOR DELETE
USING (
  public.get_workspace_tenant_id(workspace_id) = public.get_current_user_tenant_id()
  OR public.get_workspace_owner(workspace_id) = public.get_current_user_tenant_id()
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_tenant_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_owner(UUID) TO authenticated;