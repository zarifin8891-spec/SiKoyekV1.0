-- Apply only to the disposable fixture after the existing staging RLS and feature SQL.
DO $guard$
BEGIN
  IF current_setting('sikoyek.disposable_fixture', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'This prototype requires a disposable synthetic fixture';
  END IF;
END;
$guard$;

CREATE TABLE public.tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.tenants(id, name) VALUES ('master','MASTER'),('konstruva','KONSTRUVA');

-- All initial fixture data belongs to MASTER. This is not a production backfill.
DO $ownership$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles','roles','audit_logs','financial_transactions','health_rules',
    'payment_methods','progress_records','project_categories','project_managers',
    'project_rap','project_work_items','projects','transaction_categories',
    'employees','project_milestones','project_staff_assignments'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN tenant_id text NOT NULL DEFAULT %L REFERENCES public.tenants(id)',
      table_name, 'master'
    );
  END LOOP;
END;
$ownership$;

ALTER TABLE public.roles
  DROP CONSTRAINT roles_name_key,
  ADD CONSTRAINT roles_tenant_name_key UNIQUE (tenant_id,name),
  ADD CONSTRAINT roles_tenant_id_key UNIQUE (tenant_id,id);

ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_role_id_fkey,
  ADD CONSTRAINT profiles_tenant_role_fk FOREIGN KEY (tenant_id,role_id) REFERENCES public.roles(tenant_id,id);

ALTER TABLE public.projects ADD CONSTRAINT projects_tenant_id_key UNIQUE (tenant_id,id);
DROP INDEX public.employees_code_key;
CREATE UNIQUE INDEX employees_tenant_code_key ON public.employees (tenant_id,lower(btrim(code)));

ALTER TABLE public.employees
  ADD CONSTRAINT employees_tenant_parallel_key UNIQUE (tenant_id,id,allow_parallel_projects);

ALTER TABLE public.project_staff_assignments
  DROP CONSTRAINT project_staff_assignments_employee_fk,
  ADD CONSTRAINT project_staff_assignments_employee_fk
    FOREIGN KEY (tenant_id,employee_id,allow_parallel_projects)
    REFERENCES public.employees(tenant_id,id,allow_parallel_projects) ON UPDATE CASCADE;

DO $children$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'financial_transactions','progress_records','project_rap','project_work_items',
    'project_milestones','project_staff_assignments'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id,project_id)
        REFERENCES public.projects(tenant_id,id) ON DELETE CASCADE',
      table_name, table_name || '_tenant_project_fk'
    );
  END LOOP;
END;
$children$;

-- Resolve company from protected account membership. Keep this helper out of the exposed schema.
CREATE FUNCTION sikoyek_authz.current_tenant()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $tenant$
  SELECT profile.tenant_id
  FROM public.profiles AS profile
  JOIN public.roles AS role ON role.id=profile.role_id AND role.tenant_id=profile.tenant_id
  JOIN public.tenants AS tenant ON tenant.id=profile.tenant_id
  WHERE profile.id=(SELECT auth.uid()) AND profile.is_active AND role.is_active AND tenant.is_active
$tenant$;
REVOKE ALL ON FUNCTION sikoyek_authz.current_tenant() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sikoyek_authz.current_tenant() TO authenticated;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tenants TO authenticated;
CREATE POLICY own_tenant ON public.tenants FOR SELECT TO authenticated
  USING (id=(SELECT sikoyek_authz.current_tenant()));

-- Restrictive policies add tenant isolation to the existing module-based policies.
DO $policies$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles','roles','audit_logs','financial_transactions','health_rules',
    'payment_methods','progress_records','project_categories','project_managers',
    'project_rap','project_work_items','projects','transaction_categories',
    'employees','project_milestones','project_staff_assignments'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT sikoyek_authz.current_tenant()',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY tenant_boundary ON public.%I AS RESTRICTIVE TO authenticated
       USING (tenant_id=(SELECT sikoyek_authz.current_tenant()))
       WITH CHECK (tenant_id=(SELECT sikoyek_authz.current_tenant()))',
      table_name
    );
  END LOOP;
END;
$policies$;

CREATE POLICY tenant_roles_boundary ON public.role_permissions AS RESTRICTIVE TO authenticated
  USING (EXISTS (
    SELECT FROM public.roles AS role
    WHERE role.id=role_id AND role.tenant_id=(SELECT sikoyek_authz.current_tenant())
  ));
