begin;

create table public.company_master_data (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company() references public.companies(id),
  kind text not null check (kind in (
    'project_category', 'project_manager', 'transaction_category', 'payment_method', 'employee', 'equipment', 'goods'
  )),
  name text not null check (length(btrim(name)) between 1 and 160),
  is_active boolean not null default true,
  unique (company_id, kind, id)
);
create unique index company_master_names on public.company_master_data (company_id, kind, lower(btrim(name)));

create table public.company_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company() references public.companies(id),
  code text not null check (length(btrim(code)) between 1 and 40),
  name text not null check (length(btrim(name)) between 1 and 160),
  contract_value numeric(18,2) not null default 0 check (contract_value >= 0),
  starts_on date,
  ends_on date check (ends_on >= starts_on),
  status text not null default 'RENCANA' check (status in ('RENCANA', 'JALAN', 'PENDING', 'SELESAI')),
  unique (company_id, id)
);
create unique index company_projects_code on public.company_projects (company_id, upper(btrim(code)));

create table public.company_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default sikoyek_private.active_company(),
  project_id uuid not null,
  category_id uuid,
  category_kind text generated always as ('transaction_category') stored,
  transaction_date date not null,
  transaction_type text not null check (transaction_type in ('MASUK', 'KELUAR')),
  amount numeric(18,2) not null check (amount > 0),
  description text,
  foreign key (company_id, project_id) references public.company_projects(company_id, id) on delete restrict,
  foreign key (company_id, category_kind, category_id)
    references public.company_master_data(company_id, kind, id) on delete restrict
);
create index company_transactions_project_date on public.company_transactions (company_id, project_id, transaction_date);
create index company_transactions_category on public.company_transactions (company_id, category_kind, category_id);

-- Staff permissions are assigned explicitly per module. Until configured, staff have no operational access.
create table public.company_staff_permissions (
  user_id uuid not null references public.company_accounts(user_id) on delete cascade,
  module text not null check (module in ('master_data', 'projects', 'transactions')),
  can_write boolean not null default false,
  primary key (user_id, module)
);
alter table public.company_staff_permissions enable row level security;
revoke all on public.company_staff_permissions from public, anon, authenticated;
grant select, insert, update, delete on public.company_staff_permissions to authenticated;

create policy staff_permissions_read on public.company_staff_permissions for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.company_accounts a where a.user_id = company_staff_permissions.user_id
    and a.access_role = 'staff' and a.company_id = (select sikoyek_private.active_company('company_admin'))
));
create policy staff_permissions_manage on public.company_staff_permissions for all to authenticated
using (exists (
  select 1 from public.company_accounts a where a.user_id = company_staff_permissions.user_id
    and a.access_role = 'staff' and a.company_id = (select sikoyek_private.active_company('company_admin'))
))
with check (exists (
  select 1 from public.company_accounts a where a.user_id = company_staff_permissions.user_id
    and a.access_role = 'staff' and a.company_id = (select sikoyek_private.active_company('company_admin'))
));

create function sikoyek_private.company_for_operation(required_module text, needs_write boolean)
returns uuid language sql stable security definer set search_path = ''
as $$
  select coalesce(
    sikoyek_private.active_company('company_admin'),
    case when exists (
      select 1 from public.company_staff_permissions p where p.user_id = auth.uid()
        and p.module = required_module and (not needs_write or p.can_write)
    ) then sikoyek_private.active_company('staff') end
  );
$$;
revoke all on function sikoyek_private.company_for_operation(text, boolean) from public;
grant execute on function sikoyek_private.company_for_operation(text, boolean) to authenticated;

do $$
declare
  entry record;
begin
  for entry in select * from (values
    ('company_master_data', 'master_data'),
    ('company_projects', 'projects'),
    ('company_transactions', 'transactions')
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

create view public.company_financial_report with (security_invoker = true) as
select p.company_id, p.id as project_id, p.code, p.name, p.contract_value,
  coalesce(sum(t.amount) filter (where t.transaction_type = 'MASUK'), 0) as received,
  coalesce(sum(t.amount) filter (where t.transaction_type = 'KELUAR'), 0) as spent
from public.company_projects p
left join public.company_transactions t on t.company_id = p.company_id and t.project_id = p.id
where p.company_id = (select sikoyek_private.company_for_operation('transactions', false))
group by p.company_id, p.id, p.code, p.name, p.contract_value;
revoke all on public.company_financial_report from public, anon, authenticated;
grant select on public.company_financial_report to authenticated;

commit;
