begin;

create table public.employee_master (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  is_active boolean not null default true
);
create unique index employee_master_code_unique on public.employee_master (upper(btrim(code)));

create table public.equipment_master (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  is_active boolean not null default true
);
create unique index equipment_master_code_unique on public.equipment_master (upper(btrim(code)));

alter table public.project_worker_assignments
  add column employee_id uuid references public.employee_master(id) on delete restrict;
alter table public.project_equipment_assignments
  add column equipment_id uuid references public.equipment_master(id) on delete restrict;
create unique index project_worker_assignments_employee_idx on public.project_worker_assignments (employee_id, project_id, starts_on);
create unique index project_equipment_assignments_equipment_idx on public.project_equipment_assignments (equipment_id, project_id, starts_on);

do $$
declare
  catalog text;
  action record;
  read_access constant text := '(select public.sikoyek_can_manage_project_control(''master_data'', ''view''))';
  write_access text;
begin
  foreach catalog in array array['employee_master', 'equipment_master'] loop
    execute format('alter table public.%I enable row level security', catalog);
    execute format('revoke all on table public.%I from public, anon, authenticated', catalog);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', catalog);
    execute format('create policy catalog_read on public.%I for select to authenticated using (%s or (select public.sikoyek_can_manage_project_control(''progress'', ''view'')))', catalog, read_access);
    for action in select * from (values ('insert','add'),('update','edit'),('delete','delete')) as rules(command, permission)
    loop
      write_access := format('%s and (select public.sikoyek_can_manage_project_control(''master_data'', %L))', read_access, action.permission);
      execute format('create policy %I on public.%I for %s to authenticated %s',
        'catalog_' || action.command, catalog, action.command,
        case action.command
          when 'insert' then format('with check (%s)', write_access)
          when 'update' then format('using (%s) with check (%s)', write_access, write_access)
          else format('using (%s)', write_access)
        end);
    end loop;
  end loop;
end $$;

create function public.set_worker_assignment_identity()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.employee_id is not distinct from old.employee_id then
      new.worker_code := old.worker_code;
      new.worker_name := old.worker_name;
      return new;
    end if;
  end if;
  select code, name into new.worker_code, new.worker_name
  from public.employee_master where id = new.employee_id and is_active;
  if not found then
    raise exception 'Pilih karyawan aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $$;

create function public.set_equipment_assignment_identity()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.equipment_id is not distinct from old.equipment_id then
      new.equipment_code := old.equipment_code;
      new.name := old.name;
      return new;
    end if;
  end if;
  select code, name into new.equipment_code, new.name
  from public.equipment_master where id = new.equipment_id and is_active;
  if not found then
    raise exception 'Pilih alat aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger worker_assignment_identity before insert or update on public.project_worker_assignments
for each row execute function public.set_worker_assignment_identity();
create trigger equipment_assignment_identity before insert or update on public.project_equipment_assignments
for each row execute function public.set_equipment_assignment_identity();
revoke all on function public.set_worker_assignment_identity() from public, anon, authenticated;
revoke all on function public.set_equipment_assignment_identity() from public, anon, authenticated;

commit;
