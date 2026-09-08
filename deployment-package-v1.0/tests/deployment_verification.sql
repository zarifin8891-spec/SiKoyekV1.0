-- SiKoyek V1.0 — Deployment Verification Test
-- Run on a fresh customer deployment after scripts 01..07.
-- Result: one row per verification with PASS / FAIL.

with expected_tables(name) as (
  values
    ('roles'),('permissions'),('role_permissions'),('profiles'),
    ('project_categories'),('projects'),('project_managers'),
    ('project_work_items'),('progress_records'),('project_rap'),
    ('transaction_categories'),('payment_methods'),('financial_transactions'),
    ('health_rules'),('audit_logs')
),
checks as (
  select 'BASE_TABLES_15' as test_name,
    case when (select count(*) from expected_tables e join information_schema.tables t
      on t.table_schema='public' and t.table_name=e.name and t.table_type='BASE TABLE')=15
    then 'PASS' else 'FAIL' end as result,
    '15 expected public base tables exist' as detail
  union all
  select 'RLS_15',
    case when (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relname in (select name from expected_tables) and c.relrowsecurity)=15
    then 'PASS' else 'FAIL' end,
    'All 15 application tables have RLS enabled'
  union all
  select 'FUNCTIONS_7',
    case when (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('set_updated_at','validate_progress_project_match','validate_progress_total','refresh_project_status','refresh_all_project_statuses','trg_refresh_project_status','trg_project_initial_status'))=7
    then 'PASS' else 'FAIL' end,
    'Expected 7 public functions exist'
  union all
  select 'REPORTING_VIEWS',
    case when (select count(*) from information_schema.views where table_schema='public' and table_name in ('project_summary','project_cost_control'))=2
    then 'PASS' else 'FAIL' end,
    'Both reporting views exist'
  union all
  select 'PROJECT_SUMMARY_PROGRESS_ALIAS',
    case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='project_summary' and column_name='project_progress')
    then 'PASS' else 'FAIL' end,
    'project_summary exposes project_progress for frontend compatibility'
  union all
  select 'RBAC_ROLES', case when (select count(*) from public.roles)=5 then 'PASS' else 'FAIL' end,
    'Fresh deployment has 5 roles'
  union all
  select 'RBAC_PERMISSIONS', case when (select count(*) from public.permissions)=26 then 'PASS' else 'FAIL' end,
    'Fresh deployment has 26 permissions'
  union all
  select 'RBAC_ROLE_PERMISSIONS', case when (select count(*) from public.role_permissions)=58 then 'PASS' else 'FAIL' end,
    'Fresh deployment has 58 role-permission mappings'
  union all
  select 'HEALTH_RULES', case when (select count(*) from public.health_rules)=1 then 'PASS' else 'FAIL' end,
    'One generic health_rules row exists'
  union all
  select 'ANON_TABLE_PRIVILEGES',
    case when not exists (
      select 1 from information_schema.role_table_grants
      where grantee='anon' and table_schema='public'
        and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
    ) then 'PASS' else 'FAIL' end,
    'Anonymous role has no public table privileges'
  union all
  select 'ANON_VIEW_PRIVILEGES',
    case when not exists (
      select 1 from information_schema.role_table_grants
      where grantee='anon' and table_schema='public'
        and table_name in ('project_summary','project_cost_control')
        and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
    ) then 'PASS' else 'FAIL' end,
    'Anonymous role has no reporting-view privileges'
  union all
  select 'FRESH_PROJECTS_EMPTY', case when (select count(*) from public.projects)=0 then 'PASS' else 'FAIL' end,
    'Fresh deployment contains no customer projects'
  union all
  select 'FRESH_PROGRESS_EMPTY', case when (select count(*) from public.progress_records)=0 then 'PASS' else 'FAIL' end,
    'Fresh deployment contains no progress data'
  union all
  select 'FRESH_RAP_EMPTY', case when (select count(*) from public.project_rap)=0 then 'PASS' else 'FAIL' end,
    'Fresh deployment contains no RAP data'
  union all
  select 'FRESH_FINANCE_EMPTY', case when (select count(*) from public.financial_transactions)=0 then 'PASS' else 'FAIL' end,
    'Fresh deployment contains no financial transactions'
  union all
  select 'FRESH_AUDIT_EMPTY', case when (select count(*) from public.audit_logs)=0 then 'PASS' else 'FAIL' end,
    'Fresh deployment contains no audit history'
)
select test_name, result, detail from checks order by test_name;

-- Expected health boundary logic in project_summary:
-- GAP = project_progress - rap_consumption
-- GAP >= 0       => SEHAT
-- -5 <= GAP < 0  => AWASI
-- GAP < -5       => BERISIKO
-- Boundary assertion against the view definition text is intentionally omitted;
-- validate with a controlled project fixture or inspect the view SQL during parity audit.
