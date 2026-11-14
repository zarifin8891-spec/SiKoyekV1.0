begin;

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = pg_catalog, public, extensions;

alter table public.company_master_data
  add column code text check (code is null or length(btrim(code)) between 1 and 40),
  add column unit text check (unit is null or length(btrim(unit)) between 1 and 40);

create table public.company_material_stocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  goods_id uuid not null,
  catalog_kind text generated always as ('goods') stored,
  name text not null,
  unit text not null,
  quantity numeric(18,4) not null check (quantity >= 0 and quantity <> 'NaN'),
  minimum_quantity numeric(18,4) not null check (minimum_quantity >= 0 and minimum_quantity <> 'NaN'),
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  foreign key (company_id, catalog_kind, goods_id) references public.company_master_data(company_id, kind, id) on delete restrict,
  unique (company_id, project_id, goods_id)
);
create index company_material_stocks_goods on public.company_material_stocks (company_id, goods_id);

create table public.company_worker_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  employee_id uuid not null,
  catalog_kind text generated always as ('employee') stored,
  worker_code text not null,
  worker_name text not null,
  starts_on date not null,
  ends_on date check (ends_on >= starts_on),
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  foreign key (company_id, catalog_kind, employee_id) references public.company_master_data(company_id, kind, id) on delete restrict,
  exclude using gist (company_id with =, employee_id with =, daterange(starts_on, ends_on, '[]') with &&)
);
create index company_worker_assignments_project on public.company_worker_assignments (company_id, project_id, starts_on);

create table public.company_equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  equipment_id uuid not null,
  catalog_kind text generated always as ('equipment') stored,
  equipment_code text not null,
  name text not null,
  starts_on date not null,
  ends_on date check (ends_on >= starts_on),
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  foreign key (company_id, catalog_kind, equipment_id) references public.company_master_data(company_id, kind, id) on delete restrict,
  exclude using gist (company_id with =, equipment_id with =, daterange(starts_on, ends_on, '[]') with &&)
);
create index company_equipment_assignments_project on public.company_equipment_assignments (company_id, project_id, starts_on);

create function sikoyek_private.keep_resource_assignment_project()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.project_id is distinct from new.project_id or old.company_id is distinct from new.company_id then
    raise exception 'Akhiri penempatan lama, lalu buat penempatan baru di proyek tujuan.' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function sikoyek_private.keep_resource_assignment_project() from public, anon, authenticated;

create trigger company_worker_keep_project before update of project_id, company_id
on public.company_worker_assignments for each row execute function sikoyek_private.keep_resource_assignment_project();
create trigger company_equipment_keep_project before update of project_id, company_id
on public.company_equipment_assignments for each row execute function sikoyek_private.keep_resource_assignment_project();

do $$
declare table_name text;
begin
  foreach table_name in array array['company_material_stocks', 'company_worker_assignments', 'company_equipment_assignments']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy resource_read on public.%I for select to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(''progress'', false)))', table_name);
    execute format('create policy resource_write on public.%I for all to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(''progress'', true)))
      with check (company_id = (select sikoyek_private.company_for_operation(''progress'', true)))', table_name);
  end loop;
end $$;

create function sikoyek_private.project_resource_choices(resource_kind text)
returns table (id uuid, code text, name text, unit text)
language sql stable security definer set search_path = ''
as $$
  select m.id, coalesce(m.code, m.name), m.name, coalesce(m.unit, '—')
  from public.company_master_data m
  where m.company_id = sikoyek_private.company_for_operation('progress', true)
    and resource_kind in ('goods', 'employee', 'equipment')
    and m.kind = resource_kind and m.is_active;
$$;

create function public.project_resource_choices(resource_kind text)
returns table (id uuid, code text, name text, unit text)
language sql stable security invoker set search_path = ''
as $$ select * from sikoyek_private.project_resource_choices(resource_kind); $$;

revoke all on function sikoyek_private.project_resource_choices(text), public.project_resource_choices(text) from public, anon;
grant execute on function sikoyek_private.project_resource_choices(text), public.project_resource_choices(text) to authenticated;

commit;
