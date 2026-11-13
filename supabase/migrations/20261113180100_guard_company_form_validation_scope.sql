begin;

create function sikoyek_private.guard_company_form_validation_scope()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated'
    and new.company_id is distinct from sikoyek_private.active_company() then
    raise exception 'Akses data perusahaan ditolak.' using errcode = '42501';
  end if;
  return new;
end $$;

revoke all on function sikoyek_private.guard_company_form_validation_scope() from public, anon, authenticated;

-- Run before the form validators, which read related rows before the RLS write check.
create trigger a_guard_company_form_validation_scope before insert or update on public.company_progress_records
for each row execute function sikoyek_private.guard_company_form_validation_scope();
create trigger a_guard_company_form_validation_scope before insert or update on public.company_material_stocks
for each row execute function sikoyek_private.guard_company_form_validation_scope();
create trigger a_guard_company_form_validation_scope before insert or update on public.company_worker_assignments
for each row execute function sikoyek_private.guard_company_form_validation_scope();
create trigger a_guard_company_form_validation_scope before insert or update on public.company_equipment_assignments
for each row execute function sikoyek_private.guard_company_form_validation_scope();

commit;
