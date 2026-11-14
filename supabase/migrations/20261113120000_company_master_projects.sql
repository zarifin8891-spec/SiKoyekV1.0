begin;

alter table public.company_projects
  add column project_date date,
  add column owner_name text,
  add column category text,
  add column location text,
  add column project_manager text;

-- The approved app uses these column names. Keep writes on the same tenant-scoped rows.
create view public.projects with (security_invoker = true) as
select id, code as project_code, project_date, name as project_name, owner_name,
       category, location, contract_value, starts_on as start_date, ends_on as end_date,
       project_manager, status
from public.company_projects;

revoke all on public.projects from public, anon, authenticated;
grant select, insert, update, delete on public.projects to authenticated;

commit;
