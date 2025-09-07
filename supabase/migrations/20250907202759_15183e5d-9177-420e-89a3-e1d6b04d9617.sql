
-- 1) Table des Formes galéniques
create table if not exists public.formes_galeniques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  libelle_forme text not null,
  description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour éviter les doublons par tenant (insensible à la casse)
create unique index if not exists formes_galeniques_tenant_libelle_unique
  on public.formes_galeniques (tenant_id, lower(libelle_forme));

-- RLS
alter table public.formes_galeniques enable row level security;

-- Policies CRUD limitées au tenant
drop policy if exists "Users can view formes from their tenant" on public.formes_galeniques;
create policy "Users can view formes from their tenant"
  on public.formes_galeniques
  for select
  using (tenant_id = get_current_user_tenant_id());

drop policy if exists "Users can insert formes in their tenant" on public.formes_galeniques;
create policy "Users can insert formes in their tenant"
  on public.formes_galeniques
  for insert
  with check (tenant_id = get_current_user_tenant_id());

drop policy if exists "Users can update formes from their tenant" on public.formes_galeniques;
create policy "Users can update formes from their tenant"
  on public.formes_galeniques
  for update
  using (tenant_id = get_current_user_tenant_id());

drop policy if exists "Users can delete formes from their tenant" on public.formes_galeniques;
create policy "Users can delete formes from their tenant"
  on public.formes_galeniques
  for delete
  using (tenant_id = get_current_user_tenant_id());

-- 2) Lier aux produits
alter table public.produits
  add column if not exists forme_id uuid null;

-- Clé étrangère vers formes_galeniques
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_type = 'FOREIGN KEY'
      and table_schema = 'public'
      and table_name = 'produits'
      and constraint_name = 'produits_forme_id_fkey'
  ) then
    alter table public.produits
      add constraint produits_forme_id_fkey
      foreign key (forme_id)
      references public.formes_galeniques(id);
  end if;
end $$;

-- Index pour accélérer les jointures/filtrages
create index if not exists produits_forme_id_idx
  on public.produits (forme_id);

-- Optionnel: trigger d'update du updated_at (si vous souhaitez le maintenir automatiquement)
-- Si vous avez déjà une fonction générique, vous pouvez l'utiliser ici. Sinon on le laisse tel quel pour cohérence avec les autres tables référentielles.
