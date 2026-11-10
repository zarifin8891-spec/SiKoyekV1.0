-- Additive project-control schema. Apply to a test database before a Cloud rollout.
begin;

create table public.project_progress_targets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  target_date date not null,
  target_percent numeric(5,2) not null check (target_percent between 0 and 100),
  unique (project_id, target_date)
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  due_date date not null,
  completed_on date
);
create index on public.project_milestones (project_id, due_date);

create table public.project_material_stocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  unit text not null check (length(btrim(unit)) > 0),
  quantity numeric(14,2) not null check (quantity >= 0),
  minimum_quantity numeric(14,2) not null check (minimum_quantity >= 0)
);
create unique index on public.project_material_stocks (project_id, lower(btrim(name)), lower(btrim(unit)));

create table public.project_worker_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  worker_code text not null check (length(btrim(worker_code)) > 0),
  worker_name text not null check (length(btrim(worker_name)) > 0),
  starts_on date not null,
  ends_on date check (ends_on >= starts_on)
);
create unique index on public.project_worker_assignments (project_id, upper(btrim(worker_code)), starts_on);

create table public.project_equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  equipment_code text not null check (length(btrim(equipment_code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  starts_on date not null,
  ends_on date check (ends_on >= starts_on)
);
create unique index on public.project_equipment_assignments (project_id, upper(btrim(equipment_code)), starts_on);

create table public.project_field_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  logged_at timestamptz not null,
  description text not null check (length(btrim(description)) > 0)
);
create index on public.project_field_logs (project_id, logged_at desc);

create table public.project_weather_observations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  observed_at timestamptz not null,
  condition text not null check (length(btrim(condition)) > 0),
  temperature_c numeric(4,2) check (temperature_c between -60 and 65)
);
create index on public.project_weather_observations (project_id, observed_at desc);

create table public.project_document_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  url text not null check (url ~* '^https://[^[:space:]]+$')
);
create index on public.project_document_links (project_id);

create function public.sikoyek_can_manage_project_control(requested_module text, requested_action text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.roles role on role.id = profile.role_id
    where profile.id = (select auth.uid())
      and profile.is_active
      and role.is_active
      and (
        lower(role.name) = 'admin' or exists (
          select 1
          from public.role_permissions assignment
          join public.permissions permission on permission.id = assignment.permission_id
          where assignment.role_id = role.id
            and lower(permission.module) = requested_module
            and lower(permission.action) = requested_action
        )
      )
  );
$$;
revoke all on function public.sikoyek_can_manage_project_control(text, text) from public, anon;
grant execute on function public.sikoyek_can_manage_project_control(text, text) to authenticated;

-- New tables inherit project visibility and use the app's existing module permissions.
do $$
declare
  config record;
  action record;
  scope text;
  can_view text;
  can_write text;
begin
  for config in select * from (values
    ('project_progress_targets', 'progress'),
    ('project_milestones', 'progress'),
    ('project_material_stocks', 'progress'),
    ('project_worker_assignments', 'progress'),
    ('project_equipment_assignments', 'progress'),
    ('project_field_logs', 'progress'),
    ('project_weather_observations', 'progress'),
    ('project_document_links', 'laporan')
  ) as cfg(table_name, module_name)
  loop
    execute format('alter table public.%I enable row level security', config.table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', config.table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', config.table_name);
    scope := format('exists (select 1 from public.projects p where p.id = %I.project_id)', config.table_name);
    can_view := format('%s and (select public.sikoyek_can_manage_project_control(%L, %L))', scope, config.module_name, 'view');
    execute format('create policy project_control_select on public.%I for select to authenticated using (%s)', config.table_name, can_view);
    for action in select * from (values ('insert', 'add'), ('update', 'edit'), ('delete', 'delete')) as actions(command, permission)
    loop
      can_write := format('%s and (select public.sikoyek_can_manage_project_control(%L, %L))',
        can_view, config.module_name, action.permission);
      execute format('create policy %I on public.%I for %s to authenticated %s',
        'project_control_' || action.command, config.table_name, action.command,
        case action.command
          when 'insert' then format('with check (%s)', can_write)
          when 'update' then format('using (%s) with check (%s)', can_write, can_write)
          else format('using (%s)', can_write)
        end);
    end loop;
  end loop;
end $$;

commit;
