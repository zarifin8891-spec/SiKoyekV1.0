begin;

create function sikoyek_private.validate_company_progress_total()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare existing_total numeric;
begin
  -- Serialize changes for the project before reading its progress.
  perform pg_advisory_xact_lock(hashtextextended(new.project_id::text, 0));
  select coalesce(sum(progress_percentage), 0) into existing_total
  from public.company_progress_records
  where company_id = new.company_id and project_id = new.project_id
    and work_item_id = new.work_item_id and id <> new.id;
  if existing_total + new.progress_percentage > 1 then
    raise exception 'Total progress untuk item pekerjaan tidak boleh melebihi 100%%. Sisa yang dapat diinput: %',
      round(greatest(0, 1 - existing_total) * 100, 2) using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function sikoyek_private.validate_company_progress_total() from public, anon, authenticated;
create trigger validate_company_progress_total before insert or update on public.company_progress_records
for each row execute function sikoyek_private.validate_company_progress_total();

CREATE OR REPLACE FUNCTION sikoyek_private.set_equipment_assignment_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'UPDATE' then
    if new.equipment_id is not distinct from old.equipment_id then
      new.equipment_code := old.equipment_code;
      new.name := old.name;
      return new;
    end if;
  end if;
  select coalesce(code,name), name into new.equipment_code, new.name
  from public.company_master_data
  where company_id = new.company_id and kind = 'equipment' and id = new.equipment_id and is_active;
  if not found then
    raise exception 'Pilih alat aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $function$;
revoke all on function sikoyek_private.set_equipment_assignment_identity() from public, anon, authenticated;
create trigger set_equipment_assignment_identity before insert or update on public.company_equipment_assignments
for each row execute function sikoyek_private.set_equipment_assignment_identity();

CREATE OR REPLACE FUNCTION sikoyek_private.set_material_stock_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'UPDATE' then
    if new.goods_id is not distinct from old.goods_id then
      new.name := old.name;
      new.unit := old.unit;
      return new;
    end if;
  end if;
  select name, unit into new.name, new.unit
  from public.company_master_data
  where company_id = new.company_id and kind = 'goods' and id = new.goods_id and is_active;
  if not found then
    raise exception 'Pilih barang aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $function$;
revoke all on function sikoyek_private.set_material_stock_identity() from public, anon, authenticated;
create trigger set_material_stock_identity before insert or update on public.company_material_stocks
for each row execute function sikoyek_private.set_material_stock_identity();

CREATE OR REPLACE FUNCTION sikoyek_private.set_worker_assignment_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'UPDATE' then
    if new.employee_id is not distinct from old.employee_id then
      new.worker_code := old.worker_code;
      new.worker_name := old.worker_name;
      return new;
    end if;
  end if;
  select coalesce(code,name), name into new.worker_code, new.worker_name
  from public.company_master_data
  where company_id = new.company_id and kind = 'employee' and id = new.employee_id and is_active;
  if not found then
    raise exception 'Pilih karyawan aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $function$;
revoke all on function sikoyek_private.set_worker_assignment_identity() from public, anon, authenticated;
create trigger set_worker_assignment_identity before insert or update on public.company_worker_assignments
for each row execute function sikoyek_private.set_worker_assignment_identity();

commit;
