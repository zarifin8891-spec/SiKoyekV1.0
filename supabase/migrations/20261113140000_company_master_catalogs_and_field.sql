begin;

alter table public.company_master_data
  add column sort_order integer not null default 0,
  add column phone text,
  add column email text;

create view public.project_categories with (security_invoker = true) as
select id, name, is_active, kind, sort_order from public.company_master_data
where kind = 'project_category' with local check option;

create view public.project_managers with (security_invoker = true) as
select id, name, is_active, kind, code, phone, email, sort_order from public.company_master_data
where kind = 'project_manager' with local check option;

create view public.transaction_categories with (security_invoker = true) as
select id, name, is_active, kind, sort_order from public.company_master_data
where kind = 'transaction_category' with local check option;

create view public.payment_methods with (security_invoker = true) as
select id, name, is_active, kind, sort_order from public.company_master_data
where kind = 'payment_method' with local check option;

create view public.employee_master with (security_invoker = true) as
select id, name, is_active, kind, code from public.company_master_data
where kind = 'employee' with local check option;

create view public.equipment_master with (security_invoker = true) as
select id, name, is_active, kind, code from public.company_master_data
where kind = 'equipment' with local check option;

create view public.goods_master with (security_invoker = true) as
select id, name, is_active, kind, code, unit from public.company_master_data
where kind = 'goods' with local check option;

alter view public.project_categories alter column kind set default 'project_category';
alter view public.project_managers alter column kind set default 'project_manager';
alter view public.transaction_categories alter column kind set default 'transaction_category';
alter view public.payment_methods alter column kind set default 'payment_method';
alter view public.employee_master alter column kind set default 'employee';
alter view public.equipment_master alter column kind set default 'equipment';
alter view public.goods_master alter column kind set default 'goods';


create view public.project_material_stocks with (security_invoker = true) as
select id, project_id, goods_id, name, unit, quantity, minimum_quantity from public.company_material_stocks;
create view public.project_worker_assignments with (security_invoker = true) as
select id, project_id, employee_id, worker_code, worker_name, starts_on, ends_on from public.company_worker_assignments;
create view public.project_equipment_assignments with (security_invoker = true) as
select id, project_id, equipment_id, equipment_code, name, starts_on, ends_on from public.company_equipment_assignments;

revoke all on public.project_categories, public.project_managers, public.transaction_categories,
  public.payment_methods, public.employee_master, public.equipment_master, public.goods_master,
  public.project_material_stocks, public.project_worker_assignments, public.project_equipment_assignments from public, anon, authenticated;
grant select, insert, update, delete on public.project_categories, public.project_managers, public.transaction_categories,
  public.payment_methods, public.employee_master, public.equipment_master, public.goods_master,
  public.project_material_stocks, public.project_worker_assignments, public.project_equipment_assignments to authenticated;

create table public.project_field_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  logged_at timestamptz not null,
  description text not null check (length(btrim(description)) > 0)
);
create index on public.project_field_logs (company_id, project_id, logged_at desc);

create table public.project_weather_observations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  observed_at timestamptz not null,
  condition text not null check (length(btrim(condition)) > 0),
  temperature_c numeric(4,2) check (temperature_c between -60 and 65)
);
create index on public.project_weather_observations (company_id, project_id, observed_at desc);

create table public.project_document_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  url text not null check (url ~* '^https://[^[:space:]]+$')
);
create index on public.project_document_links (company_id, project_id);


do $$
declare item record;
begin
  for item in select * from (values
    ('project_field_logs','progress'), ('project_weather_observations','progress'),
    ('project_document_links','transactions')
  ) as rules(table_name, permission)
  loop
    execute format('alter table public.%I enable row level security', item.table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', item.table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', item.table_name);
    execute format('create policy company_read on public.%I for select to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(%L, false)))', item.table_name,item.permission);
    execute format('create policy company_write on public.%I for all to authenticated
      using (company_id = (select sikoyek_private.company_for_operation(%L, true)))
      with check (company_id = (select sikoyek_private.company_for_operation(%L, true)))', item.table_name,item.permission,item.permission);
  end loop;
end $$;

commit;
