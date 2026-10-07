-- SiKoyek V1.0 RLS / authenticated policies

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.project_categories enable row level security;
alter table public.project_managers enable row level security;
alter table public.projects enable row level security;
alter table public.project_work_items enable row level security;
alter table public.progress_records enable row level security;
alter table public.project_rap enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.health_rules enable row level security;
alter table public.audit_logs enable row level security;

-- Idempotent policy creation for fresh customer projects.

do $$
begin
  create policy roles_authenticated_select on public.roles for select to authenticated using (true);
  create policy permissions_authenticated_select on public.permissions for select to authenticated using (true);
  create policy role_permissions_authenticated_select on public.role_permissions for select to authenticated using (true);
  create policy profiles_authenticated_select on public.profiles for select to authenticated using (true);
  create policy project_categories_authenticated_select on public.project_categories for select to authenticated using (true);
  create policy project_categories_authenticated_insert on public.project_categories for insert to authenticated with check (true);
  create policy project_categories_authenticated_update on public.project_categories for update to authenticated using (true) with check (true);
  create policy project_categories_authenticated_delete on public.project_categories for delete to authenticated using (true);
  create policy project_managers_authenticated_select on public.project_managers for select to authenticated using (true);
  create policy project_managers_authenticated_insert on public.project_managers for insert to authenticated with check (true);
  create policy project_managers_authenticated_update on public.project_managers for update to authenticated using (true) with check (true);
  create policy project_managers_authenticated_delete on public.project_managers for delete to authenticated using (true);
  create policy projects_authenticated_select on public.projects for select to authenticated using (true);
  create policy projects_authenticated_insert on public.projects for insert to authenticated with check (true);
  create policy projects_authenticated_update on public.projects for update to authenticated using (true) with check (true);
  create policy projects_authenticated_delete on public.projects for delete to authenticated using (true);
  create policy project_work_items_authenticated_select on public.project_work_items for select to authenticated using (true);
  create policy project_work_items_authenticated_insert on public.project_work_items for insert to authenticated with check (true);
  create policy project_work_items_authenticated_update on public.project_work_items for update to authenticated using (true) with check (true);
  create policy project_work_items_authenticated_delete on public.project_work_items for delete to authenticated using (true);
  create policy progress_records_authenticated_select on public.progress_records for select to authenticated using (true);
  create policy progress_records_authenticated_insert on public.progress_records for insert to authenticated with check (true);
  create policy progress_records_authenticated_update on public.progress_records for update to authenticated using (true) with check (true);
  create policy progress_records_authenticated_delete on public.progress_records for delete to authenticated using (true);
  create policy project_rap_authenticated_select on public.project_rap for select to authenticated using (true);
  create policy project_rap_authenticated_insert on public.project_rap for insert to authenticated with check (true);
  create policy project_rap_authenticated_update on public.project_rap for update to authenticated using (true) with check (true);
  create policy transaction_categories_authenticated_select on public.transaction_categories for select to authenticated using (true);
  create policy transaction_categories_authenticated_insert on public.transaction_categories for insert to authenticated with check (true);
  create policy transaction_categories_authenticated_update on public.transaction_categories for update to authenticated using (true) with check (true);
  create policy transaction_categories_authenticated_delete on public.transaction_categories for delete to authenticated using (true);
  create policy payment_methods_authenticated_select on public.payment_methods for select to authenticated using (true);
  create policy payment_methods_authenticated_insert on public.payment_methods for insert to authenticated with check (true);
  create policy payment_methods_authenticated_update on public.payment_methods for update to authenticated using (true) with check (true);
  create policy payment_methods_authenticated_delete on public.payment_methods for delete to authenticated using (true);
  create policy financial_transactions_authenticated_select on public.financial_transactions for select to authenticated using (true);
  create policy financial_transactions_authenticated_insert on public.financial_transactions for insert to authenticated with check (true);
  create policy financial_transactions_authenticated_update on public.financial_transactions for update to authenticated using (true) with check (true);
  create policy financial_transactions_authenticated_delete on public.financial_transactions for delete to authenticated using (true);
  create policy health_rules_authenticated_select on public.health_rules for select to authenticated using (true);
  create policy audit_logs_authenticated_select on public.audit_logs for select to authenticated using (true);
exception when duplicate_object then null;
end $$;
