begin;

alter table public.project_work_items
  add column duration_days integer check (duration_days between 1 and 36500),
  add column planned_start_date date,
  add constraint work_item_planned_start_requires_duration
    check (planned_start_date is null or duration_days is not null);

create table public.goods_master (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  unit text not null check (length(btrim(unit)) > 0),
  is_active boolean not null default true
);
create unique index goods_master_code_unique on public.goods_master (upper(btrim(code)));

alter table public.project_material_stocks
  add column goods_id uuid references public.goods_master(id) on delete restrict;
create unique index project_material_stocks_goods_unique
  on public.project_material_stocks (goods_id, project_id) where goods_id is not null;

alter table public.goods_master enable row level security;
revoke all on table public.goods_master from public, anon, authenticated;
grant select, insert, update, delete on table public.goods_master to authenticated;

create policy goods_read on public.goods_master for select to authenticated using (
  (select public.sikoyek_can_manage_project_control('master_data', 'view'))
  or (select public.sikoyek_can_manage_project_control('progress', 'view'))
);
create policy goods_add on public.goods_master for insert to authenticated with check (
  (select public.sikoyek_can_manage_project_control('master_data', 'view'))
  and (select public.sikoyek_can_manage_project_control('master_data', 'add'))
);
create policy goods_edit on public.goods_master for update to authenticated
using (
  (select public.sikoyek_can_manage_project_control('master_data', 'view'))
  and (select public.sikoyek_can_manage_project_control('master_data', 'edit'))
)
with check (
  (select public.sikoyek_can_manage_project_control('master_data', 'view'))
  and (select public.sikoyek_can_manage_project_control('master_data', 'edit'))
);
create policy goods_delete on public.goods_master for delete to authenticated using (
  (select public.sikoyek_can_manage_project_control('master_data', 'view'))
  and (select public.sikoyek_can_manage_project_control('master_data', 'delete'))
);

create function public.set_material_stock_identity()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.goods_id is not distinct from old.goods_id then
      new.name := old.name;
      new.unit := old.unit;
      return new;
    end if;
  end if;
  select name, unit into new.name, new.unit
  from public.goods_master where id = new.goods_id and is_active;
  if not found then
    raise exception 'Pilih barang aktif dari Master Data.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger material_stock_identity before insert or update on public.project_material_stocks
for each row execute function public.set_material_stock_identity();
revoke all on function public.set_material_stock_identity() from public, anon, authenticated;

commit;
