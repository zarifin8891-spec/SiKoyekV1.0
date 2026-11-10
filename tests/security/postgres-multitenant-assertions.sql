-- Both tenants share one database and can reuse the same local role/employee names.
INSERT INTO public.roles(id, name, tenant_id)
VALUES ('20000000-0000-4000-8000-000000000001','ADMIN','konstruva');

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT '20000000-0000-4000-8000-000000000001', permission_id
FROM public.role_permissions WHERE role_id='22222222-2222-4222-8222-222222222222';

INSERT INTO public.profiles(id,role_id,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','konstruva');

INSERT INTO public.projects(id,project_name,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000003','Proyek KONSTRUVA','konstruva');

INSERT INTO public.financial_transactions(id,project_id,amount,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003',25000,'konstruva');

INSERT INTO public.employees(id,code,name,tenant_id) VALUES
('10000000-0000-4000-8000-000000000005','KRY-01','Personel MASTER','master'),
('20000000-0000-4000-8000-000000000005','KRY-01','Personel KONSTRUVA','konstruva');

INSERT INTO public.project_staff_assignments(project_id,employee_id,assignment_role,start_date,tenant_id) VALUES
('12345678-1234-4234-8234-123456789010','10000000-0000-4000-8000-000000000005','Pelaksana',current_date-1,'master'),
('20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000005','Pelaksana',current_date-1,'konstruva');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $master$
DECLARE affected int;
BEGIN
  IF (SELECT array_agg(name) FROM public.tenants) IS DISTINCT FROM ARRAY['MASTER']
    OR public.sikoyek_current_company() IS DISTINCT FROM '{"id":"master","name":"MASTER"}'::jsonb
    OR (SELECT array_agg(project_name) FROM public.projects) IS DISTINCT FROM ARRAY['TEST PROJECT']
    OR (SELECT sum(amount) FROM public.financial_transactions) IS DISTINCT FROM 10000::numeric
    OR (SELECT array_agg(name) FROM public.employees) IS DISTINCT FROM ARRAY['Personel MASTER']
    OR EXISTS (SELECT FROM public.profiles WHERE tenant_id='konstruva')
    OR EXISTS (SELECT FROM public.roles WHERE tenant_id='konstruva')
    OR EXISTS (SELECT FROM public.role_permissions WHERE role_id='20000000-0000-4000-8000-000000000001')
    OR public.sikoyek_project_staff_headcount() IS DISTINCT FROM
      '{"total":1,"projects":{"12345678-1234-4234-8234-123456789010":1}}'::jsonb THEN
    RAISE EXCEPTION 'MASTER scope leaked or omitted own data';
  END IF;

  UPDATE public.projects SET project_name='cross-tenant edit'
    WHERE id='20000000-0000-4000-8000-000000000003';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-tenant edit succeeded'; END IF;

  DELETE FROM public.projects WHERE id='20000000-0000-4000-8000-000000000003';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-tenant delete succeeded'; END IF;

  BEGIN
    INSERT INTO public.projects(id,project_name,tenant_id)
    VALUES (gen_random_uuid(),'Cross-tenant insert','konstruva');
    RAISE EXCEPTION 'Cross-tenant insert succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    UPDATE public.projects SET tenant_id='konstruva' WHERE id='12345678-1234-4234-8234-123456789010';
    RAISE EXCEPTION 'Project reassignment succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    INSERT INTO public.financial_transactions(id,project_id,amount)
    VALUES (gen_random_uuid(),'20000000-0000-4000-8000-000000000003',1);
    RAISE EXCEPTION 'Foreign project accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.project_staff_assignments(project_id,employee_id,assignment_role,start_date)
    VALUES ('12345678-1234-4234-8234-123456789010','20000000-0000-4000-8000-000000000005','Pelaksana',current_date);
    RAISE EXCEPTION 'Foreign employee accepted';
  EXCEPTION WHEN foreign_key_violation OR insufficient_privilege THEN NULL;
  END;
END;
$master$;

SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',false);
DO $konstruva$
BEGIN
  IF (SELECT array_agg(name) FROM public.tenants) IS DISTINCT FROM ARRAY['KONSTRUVA']
    OR public.sikoyek_current_company() IS DISTINCT FROM '{"id":"konstruva","name":"KONSTRUVA"}'::jsonb
    OR (SELECT array_agg(project_name) FROM public.projects) IS DISTINCT FROM ARRAY['Proyek KONSTRUVA']
    OR (SELECT sum(amount) FROM public.financial_transactions) IS DISTINCT FROM 25000::numeric
    OR (SELECT array_agg(name) FROM public.employees) IS DISTINCT FROM ARRAY['Personel KONSTRUVA']
    OR EXISTS (SELECT FROM public.profiles WHERE tenant_id='master')
    OR public.sikoyek_project_staff_headcount() IS DISTINCT FROM
      '{"total":1,"projects":{"20000000-0000-4000-8000-000000000003":1}}'::jsonb THEN
    RAISE EXCEPTION 'KONSTRUVA scope leaked or omitted own data';
  END IF;

  INSERT INTO public.projects(id,project_name) VALUES (gen_random_uuid(),'KONSTRUVA baru');
  IF NOT EXISTS (SELECT FROM public.projects WHERE project_name='KONSTRUVA baru') THEN
    RAISE EXCEPTION 'New project did not inherit the authenticated company';
  END IF;
END;
$konstruva$;

SELECT set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
DO $worker$
BEGIN
  IF (SELECT count(*) FROM public.projects)<>1 OR EXISTS (SELECT FROM public.financial_transactions) THEN
    RAISE EXCEPTION 'Company access changed the existing finance permission';
  END IF;
END;
$worker$;

SELECT set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
DO $inactive$
BEGIN
  IF EXISTS (SELECT FROM public.tenants) OR EXISTS (SELECT FROM public.projects)
    OR public.sikoyek_current_company() IS NOT NULL THEN
    RAISE EXCEPTION 'Inactive account retains company access';
  END IF;
END;
$inactive$;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
DO $unassigned$
BEGIN
  IF public.sikoyek_current_company() IS NOT NULL THEN
    RAISE EXCEPTION 'Account without membership resolved to a company';
  END IF;
END;
$unassigned$;
RESET ROLE;

-- Match Supabase's server-only service role in this disposable PostgreSQL fixture.
ALTER ROLE service_role BYPASSRLS;
GRANT SELECT ON public.profiles, public.roles, public.permissions TO service_role;
GRANT UPDATE ON public.profiles TO service_role;
GRANT UPDATE ON public.roles TO service_role;
GRANT SELECT, INSERT, DELETE ON public.role_permissions TO service_role;
SET ROLE service_role;
DO $administration$
DECLARE
  master_admin uuid := '11111111-1111-4111-8111-111111111111';
  konstruva_role uuid := '20000000-0000-4000-8000-000000000001';
  master_role uuid := '22222222-2222-4222-8222-222222222222';
  konstruva_count integer;
  original_master_permissions uuid[];
BEGIN
  SELECT array_agg(permission_id) INTO original_master_permissions
  FROM public.role_permissions WHERE role_id=master_role;
  SELECT count(*) INTO konstruva_count FROM public.role_permissions WHERE role_id=konstruva_role;
  BEGIN
    PERFORM public.replace_tenant_role_permissions_atomic(master_admin,konstruva_role,ARRAY[]::uuid[]);
    RAISE EXCEPTION 'Admin changed another company role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  IF (SELECT count(*) FROM public.role_permissions WHERE role_id=konstruva_role)<>konstruva_count
    OR public.replace_tenant_role_permissions_atomic(master_admin,master_role,ARRAY[md5('PROJECTS_VIEW')::uuid])<>1 THEN
    RAISE EXCEPTION 'Atomic scope check failed';
  END IF;
  PERFORM public.replace_tenant_role_permissions_atomic(master_admin,master_role,original_master_permissions);
END;
$administration$;
RESET ROLE;
DO $execute_acl$
BEGIN
  IF has_function_privilege('authenticated','public.replace_tenant_role_permissions_atomic(uuid,uuid,uuid[])','EXECUTE')
    OR has_function_privilege('anon','public.replace_tenant_role_permissions_atomic(uuid,uuid,uuid[])','EXECUTE') THEN
    RAISE EXCEPTION 'Company role mutation is exposed to a browser role';
  END IF;
END;
$execute_acl$;
