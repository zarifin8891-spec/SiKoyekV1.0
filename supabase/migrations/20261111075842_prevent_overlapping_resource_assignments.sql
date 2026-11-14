begin;

create extension if not exists btree_gist with schema extensions;
set local search_path = pg_catalog, public, extensions;

-- Check both stable catalog IDs and historical codes for unlinked records.
alter table public.project_worker_assignments
  add constraint worker_assignment_employee_no_overlap exclude using gist
    (employee_id with =, daterange(starts_on, ends_on, '[]') with &&) where (employee_id is not null),
  add constraint worker_assignment_code_no_overlap exclude using gist
    ((upper(btrim(worker_code))) with =, daterange(starts_on, ends_on, '[]') with &&);

alter table public.project_equipment_assignments
  add constraint equipment_assignment_equipment_no_overlap exclude using gist
    (equipment_id with =, daterange(starts_on, ends_on, '[]') with &&) where (equipment_id is not null),
  add constraint equipment_assignment_code_no_overlap exclude using gist
    ((upper(btrim(equipment_code))) with =, daterange(starts_on, ends_on, '[]') with &&);

create function public.prevent_assignment_project_rewrite()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.project_id is distinct from new.project_id then
    raise exception 'Akhiri penempatan lama, lalu buat penempatan baru di proyek tujuan.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger worker_assignment_keep_project before update of project_id
on public.project_worker_assignments for each row execute function public.prevent_assignment_project_rewrite();
create trigger equipment_assignment_keep_project before update of project_id
on public.project_equipment_assignments for each row execute function public.prevent_assignment_project_rewrite();
revoke all on function public.prevent_assignment_project_rewrite() from public, anon, authenticated;

commit;
