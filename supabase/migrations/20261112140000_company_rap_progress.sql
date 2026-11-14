begin;

alter table public.company_staff_permissions drop constraint company_staff_permissions_module_check;
alter table public.company_staff_permissions add check (module in ('master_data', 'projects', 'transactions', 'rap', 'progress'));

create table public.company_project_rap (
  project_id uuid primary key,
  company_id uuid not null default sikoyek_private.active_company(),
  material numeric(18,2) not null default 0 check (material >= 0 and material <> 'NaN'),
  labor numeric(18,2) not null default 0 check (labor >= 0 and labor <> 'NaN'),
  equipment numeric(18,2) not null default 0 check (equipment >= 0 and equipment <> 'NaN'),
  operational numeric(18,2) not null default 0 check (operational >= 0 and operational <> 'NaN'),
  subcontract numeric(18,2) not null default 0 check (subcontract >= 0 and subcontract <> 'NaN'),
  other numeric(18,2) not null default 0 check (other >= 0 and other <> 'NaN'),
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict
);

create table public.company_work_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  work_name text not null check (length(btrim(work_name)) between 1 and 160),
  weight numeric(7,6) not null check (weight between 0 and 1),
  duration_days integer check (duration_days between 1 and 36500),
  planned_start_date date check (planned_start_date is null or duration_days is not null),
  sort_order integer not null default 0 check (sort_order >= 0),
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  unique (company_id, project_id, id)
);

create table public.company_progress_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  work_item_id uuid not null,
  progress_date date not null,
  progress_percentage numeric(7,6) not null check (progress_percentage >= 0 and progress_percentage <= 1),
  notes text check (length(notes) <= 500),
  foreign key (company_id, project_id, work_item_id)
    references public.company_work_items(company_id, project_id, id) on delete restrict
);
create index company_progress_records_item on public.company_progress_records (company_id, project_id, work_item_id);

do $$
declare entry record;
begin
  for entry in select * from (values
    ('company_project_rap', 'rap'), ('company_work_items', 'rap'), ('company_progress_records', 'progress')
  ) as modules(table_name, module_name)
  loop
    execute format('alter table public.%I enable row level security', entry.table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', entry.table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', entry.table_name);
    execute format('create policy operational_read on public.%I for select to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(%L, false)))',
      entry.table_name, entry.module_name);
    execute format('create policy operational_write on public.%I for all to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(%L, true)))
      with check (company_id = (select sikoyek_private.company_for_operation(%L, true)))',
      entry.table_name, entry.module_name, entry.module_name);
  end loop;
end $$;

-- Allow project selection and progress entry without granting access to contract values or RAP.
create function sikoyek_private.project_planning_choices()
returns table (id uuid, code text, name text, starts_on date, ends_on date)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.code, p.name, p.starts_on, p.ends_on
  from public.company_projects p
  where p.company_id = coalesce(
    sikoyek_private.company_for_operation('rap', false),
    sikoyek_private.company_for_operation('progress', false)
  );
$$;

create function sikoyek_private.project_progress_item_choices(selected_project uuid)
returns table (id uuid, work_name text, sort_order integer)
language sql stable security definer set search_path = ''
as $$
  select w.id, w.work_name, w.sort_order from public.company_work_items w
  where w.company_id = sikoyek_private.company_for_operation('progress', false)
    and w.project_id = selected_project;
$$;

create function public.project_planning_choices()
returns table (id uuid, code text, name text, starts_on date, ends_on date)
language sql stable security invoker set search_path = ''
as $$ select * from sikoyek_private.project_planning_choices(); $$;

create function public.project_progress_item_choices(selected_project uuid)
returns table (id uuid, work_name text, sort_order integer)
language sql stable security invoker set search_path = ''
as $$ select * from sikoyek_private.project_progress_item_choices(selected_project); $$;

revoke all on function sikoyek_private.project_planning_choices(), sikoyek_private.project_progress_item_choices(uuid),
  public.project_planning_choices(), public.project_progress_item_choices(uuid) from public, anon;
grant execute on function sikoyek_private.project_planning_choices(), sikoyek_private.project_progress_item_choices(uuid),
  public.project_planning_choices(), public.project_progress_item_choices(uuid) to authenticated;

create or replace function public.set_company_staff_access(staff_id uuid, access_settings jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.company_accounts a
    where a.user_id = staff_id and a.access_role = 'staff' and a.is_active
      and a.company_id = (select sikoyek_private.active_company('company_admin'))
  ) then
    raise exception 'Hanya Admin Perusahaan yang dapat mengatur akses staf aktif di perusahaannya.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(access_settings) is distinct from 'object' or access_settings = '{}'::jsonb then
    raise exception 'Pengaturan akses tidak valid.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_each_text(access_settings) entry
    where entry.key not in ('master_data', 'projects', 'transactions', 'rap', 'progress')
      or entry.value is null or entry.value not in ('none', 'read', 'write')
  ) then
    raise exception 'Modul atau tingkat akses tidak valid.' using errcode = '22023';
  end if;

  -- Serialize changes made by different admins to the same staff account.
  perform pg_advisory_xact_lock(hashtextextended('company_staff_access:' || staff_id::text, 0));

  delete from public.company_staff_permissions
  where user_id = staff_id
    and access_settings ->> module = 'none';

  insert into public.company_staff_permissions (user_id, module, can_write)
  select staff_id, entry.key, entry.value = 'write'
  from jsonb_each_text(access_settings) entry
  where entry.value in ('read', 'write')
  on conflict (user_id, module) do update set can_write = excluded.can_write;
end;
$$;

commit;
