
-- 1) Fonction robuste d'admin système (réutilisable dans les policies)
create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.personnel
    where auth_user_id = auth.uid()
      and tenant_id = public.get_current_user_tenant_id()
      and role in ('Admin','Pharmacien')
  );
$$;

grant execute on function public.is_system_admin to authenticated;

-- 2) Table personnel: supprimer les policies récursives et en recréer de sûres

-- Supprime les policies problématiques (noms d'après l'état actuel)
drop policy if exists "Admins can view all personnel data in their tenant" on public.personnel;
drop policy if exists "Authenticated admins can insert personnel in their tenant" on public.personnel;
drop policy if exists "Authenticated admins can update personnel in their tenant" on public.personnel;
drop policy if exists "Secure admin personnel view access" on public.personnel;
drop policy if exists "System admins can manage all personnel" on public.personnel;

-- NOTE: On conserve ces deux policies existantes (elles ne sont pas récursives)
-- - "Users can view their own complete profile" (SELECT USING (auth_user_id = auth.uid()))
-- - "Authenticated users can update their own profile" (UPDATE USING/CHECK (auth_user_id = auth.uid()))

-- Recrée des policies admin strictement bornées au tenant courant
create policy "Tenant admins can select personnel in their tenant"
  on public.personnel
  for select
  to authenticated
  using (
    tenant_id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  );

create policy "Tenant admins can insert personnel in their tenant"
  on public.personnel
  for insert
  to authenticated
  with check (
    tenant_id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  );

create policy "Tenant admins can update personnel in their tenant"
  on public.personnel
  for update
  to authenticated
  using (
    tenant_id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  )
  with check (
    tenant_id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  );

create policy "Tenant admins can delete personnel in their tenant"
  on public.personnel
  for delete
  to authenticated
  using (
    tenant_id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  );

comment on table public.personnel is
  'Contains sensitive employee data. RLS enforces per-tenant access; admins (Admin/Pharmacien) only within their tenant. Users can view/update their own row.';

-- 3) Table pharmacies: supprimer la policy qui référençait personnel
drop policy if exists "Secure authenticated users can view their pharmacy" on public.pharmacies;

-- On conserve:
-- - "Authenticated users can view their own pharmacy" (id = get_current_user_tenant_id())
-- - "Authenticated users can view network pharmacy directory" (status = ''active'')
-- Et on remplace la policy UPDATE admin par une version safe (sans sous-requête perso)

drop policy if exists "Authenticated admins can update pharmacies" on public.pharmacies;

create policy "Tenant admins can update their pharmacy"
  on public.pharmacies
  for update
  to authenticated
  using (
    id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  )
  with check (
    id = public.get_current_user_tenant_id()
    and public.is_system_admin()
  );
