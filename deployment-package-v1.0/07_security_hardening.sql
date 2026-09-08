-- SiKoyek V1.0 security hardening
-- Purpose: remove anonymous table/view privileges and explicitly grant only
-- the privileges required by the authenticated application layer.
-- RLS remains the authorization boundary for authenticated users.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Base application tables used by the authenticated client.
grant select, insert, update, delete on table
  public.roles,
  public.permissions,
  public.role_permissions,
  public.profiles,
  public.project_categories,
  public.projects,
  public.project_managers,
  public.project_work_items,
  public.progress_records,
  public.project_rap,
  public.transaction_categories,
  public.payment_methods,
  public.financial_transactions,
  public.health_rules,
  public.audit_logs
  to authenticated;

-- Reporting views are read-only from the application perspective.
grant select on table public.project_summary, public.project_cost_control to authenticated;

-- Keep anonymous access disabled explicitly for the reporting views as well.
revoke all on table public.project_summary, public.project_cost_control from anon;

-- UUID generation uses pgcrypto/gen_random_uuid(), so no public sequence
-- privilege is required by this deployment package.
