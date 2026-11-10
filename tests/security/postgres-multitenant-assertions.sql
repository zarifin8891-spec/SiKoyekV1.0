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
    OR (SELECT array_agg(project_name) FROM public.projects) IS DISTINCT FROM ARRAY['Proyek KONSTRUVA']
    OR (SELECT sum(amount) FROM public.financial_transactions) IS DISTINCT FROM 25000::numeric
    OR (SELECT array_agg(name) FROM public.employees) IS DISTINCT FROM ARRAY['Personel KONSTRUVA']
    OR EXISTS (SELECT FROM public.profiles WHERE tenant_id='master')
    OR public.sikoyek_project_staff_headcount() IS DISTINCT FROM
      '{"total":1,"projects":{"20000000-0000-4000-8000-000000000003":1}}'::jsonb THEN
    RAISE EXCEPTION 'KONSTRUVA scope leaked or omitted own data';
  END IF;

  INSERT INTO public.projects(id,project_name) VALUES (gen_random_uuid(),'KONSTRUVA baru');
  IF NOT EXISTS (SELECT FROM public.projects WHERE project_name='KONSTRUVA baru' AND tenant_id='konstruva') THEN
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
  IF EXISTS (SELECT FROM public.tenants) OR EXISTS (SELECT FROM public.projects) THEN
    RAISE EXCEPTION 'Inactive account retains company access';
  END IF;
END;
$inactive$;
RESET ROLE;
