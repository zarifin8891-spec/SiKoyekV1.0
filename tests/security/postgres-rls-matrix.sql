-- Synthetic RLS authorization matrix on disposable PostgreSQL 17.
-- Representative PROJECTS and FINANCE permissions; NOT the complete production migration.
\set ON_ERROR_STOP on
RESET ROLE;
DROP TRIGGER synthetic_permission_failure ON public.role_permissions;
ALTER TABLE public.permissions ADD COLUMN module text;
ALTER TABLE public.permissions ADD COLUMN action text;
UPDATE public.permissions SET module='PROJECTS',action='VIEW'
 WHERE id='44444444-4444-4444-8444-444444444444';
UPDATE public.permissions SET module='PROGRESS',action='ADD'
 WHERE id='55555555-5555-4555-8555-555555555555';
UPDATE public.permissions SET module='finance',action='view'
 WHERE id='66666666-6666-4666-8666-666666666666';

INSERT INTO public.roles(id,name) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DIREKTUR'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','KEUANGAN'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','MARKETING');

INSERT INTO public.profiles(id,role_id,is_active) VALUES
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true),
 ('ffffffff-ffff-4fff-8fff-ffffffffffff','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);

INSERT INTO public.permissions (id,module,action) VALUES
 ('12345678-1234-4234-8234-123456789001','KEUANGAN','ADD'),
 ('12345678-1234-4234-8234-123456789002','PROJECTS','EDIT'),
 ('12345678-1234-4234-8234-123456789003','PROJECTS','DELETE');

INSERT INTO public.role_permissions(role_id,permission_id) VALUES
 -- ADMIN can read projects, read/write finance, delete projects
 ('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444'),
 ('22222222-2222-4222-8222-222222222222','66666666-6666-4666-8666-666666666666'),
 ('22222222-2222-4222-8222-222222222222','12345678-1234-4234-8234-123456789001'),
 ('22222222-2222-4222-8222-222222222222','12345678-1234-4234-8234-123456789003'),
 -- DIREKTUR can read finance and projects, cannot mutate finance
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','66666666-6666-4666-8666-666666666666'),
 -- KEUANGAN can read/write finance and read projects
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','66666666-6666-4666-8666-666666666666'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','12345678-1234-4234-8234-123456789001'),
 -- MARKETING can read/edit project (not read finance)
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','44444444-4444-4444-8444-444444444444'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','12345678-1234-4234-8234-123456789002'),
 -- PELAKSANA can read projects and write progress
 ('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'),
 ('33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555');

CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE SET search_path = '' AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
CREATE SCHEMA sikoyek_authz;
REVOKE ALL ON SCHEMA sikoyek_authz FROM PUBLIC;
GRANT USAGE ON SCHEMA sikoyek_authz TO authenticated;
CREATE FUNCTION sikoyek_authz.can(p_module text,p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT EXISTS (
   SELECT 1 FROM public.profiles p
   JOIN public.roles r ON r.id=p.role_id
   JOIN public.role_permissions rp ON rp.role_id=r.id
   JOIN public.permissions prm ON prm.id=rp.permission_id
   WHERE p.id=(SELECT auth.uid()) AND p.is_active AND r.is_active
     AND upper(prm.action)=upper(p_action)
     AND (CASE WHEN upper(prm.module) IN ('FINANCE','KEUANGAN') THEN 'KEUANGAN' ELSE upper(prm.module) END)
        =(CASE WHEN upper(p_module) IN ('FINANCE','KEUANGAN') THEN 'KEUANGAN' ELSE upper(p_module) END)
 );
$$;
REVOKE ALL ON FUNCTION sikoyek_authz.can(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION sikoyek_authz.can(text,text) TO authenticated;

CREATE TABLE public.projects (id uuid PRIMARY KEY, project_name text);
CREATE TABLE public.financial_transactions (id uuid PRIMARY KEY, project_id uuid REFERENCES public.projects(id), amount numeric);
INSERT INTO public.projects VALUES('12345678-1234-4234-8234-123456789010','TEST PROJECT');
INSERT INTO public.financial_transactions VALUES('12345678-1234-4234-8234-123456789011',
  '12345678-1234-4234-8234-123456789010',10000);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.projects,public.financial_transactions TO authenticated;
GRANT SELECT ON public.projects,public.financial_transactions TO anon;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_view ON public.projects FOR SELECT TO authenticated
 USING ((SELECT sikoyek_authz.can('PROJECTS','VIEW')));
CREATE POLICY project_edit ON public.projects FOR UPDATE TO authenticated
 USING ((SELECT sikoyek_authz.can('PROJECTS','EDIT')))
 WITH CHECK ((SELECT sikoyek_authz.can('PROJECTS','EDIT')));
CREATE POLICY project_delete ON public.projects FOR DELETE TO authenticated
 USING ((SELECT sikoyek_authz.can('PROJECTS','DELETE')));
CREATE POLICY finance_view ON public.financial_transactions FOR SELECT TO authenticated
 USING ((SELECT sikoyek_authz.can('KEUANGAN','VIEW')));
CREATE POLICY finance_add ON public.financial_transactions FOR INSERT TO authenticated
 WITH CHECK ((SELECT sikoyek_authz.can('KEUANGAN','ADD')));

SET ROLE authenticated;
DO $rls_test$
DECLARE
  project_id constant uuid := '12345678-1234-4234-8234-123456789010';
  tx_id constant uuid := '12345678-1234-4234-8234-123456789011';
  affected integer;
BEGIN
  -- Without a profile, no records are readable.
  PERFORM set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
  IF (SELECT count(*) FROM public.projects)<>0 OR
     (SELECT count(*) FROM public.financial_transactions)<>0
  THEN RAISE EXCEPTION 'unknown user can read protected rows'; END IF;

  -- ADMIN: view projects & finance; delete permission allowed.
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
  IF (SELECT count(*) FROM public.projects)<>1 OR
     (SELECT count(*) FROM public.financial_transactions)<>1 OR
     NOT sikoyek_authz.can('PROJECTS','DELETE')
  THEN RAISE EXCEPTION 'ADMIN permission check failed'; END IF;

  -- DIREKTUR: read finance, deny finance ADD.
  PERFORM set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',false);
  IF (SELECT count(*) FROM public.projects)<>1 OR
     (SELECT count(*) FROM public.financial_transactions)<>1
  THEN RAISE EXCEPTION 'DIREKTUR reads denied'; END IF;
  BEGIN
    INSERT INTO public.financial_transactions VALUES
      ('12345678-1234-4234-8234-123456789012',project_id,100);
    RAISE EXCEPTION 'DIREKTUR finance INSERT improperly allowed' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  -- KEUANGAN: finance VIEW and ADD allowed.
  PERFORM set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false);
  IF (SELECT count(*) FROM public.financial_transactions)<>1
     OR NOT sikoyek_authz.can('FINANCE','ADD')
  THEN RAISE EXCEPTION 'KEUANGAN permission check failed'; END IF;
  INSERT INTO public.financial_transactions VALUES
    ('12345678-1234-4234-8234-123456789013',project_id,100);

  -- MARKETING: can read/edit project, no raw finance SELECT.
  PERFORM set_config('request.jwt.claim.sub','ffffffff-ffff-4fff-8fff-ffffffffffff',false);
  IF (SELECT count(*) FROM public.projects)<>1
     OR (SELECT count(*) FROM public.financial_transactions)<>0
  THEN RAISE EXCEPTION 'MARKETING finance data exposed'; END IF;
  UPDATE public.projects SET project_name='MARKETING EDIT' WHERE id=project_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'MARKETING UPDATE should succeed'; END IF;

  -- PELAKSANA: sees projects, cannot read finance or update projects.
  PERFORM set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
  IF (SELECT count(*) FROM public.projects)<>1
     OR (SELECT count(*) FROM public.financial_transactions)<>0
  THEN RAISE EXCEPTION 'PELAKSANA financial data exposed'; END IF;
  UPDATE public.projects SET project_name='SHOULD NOT WRITE' WHERE id=project_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'PELAKSANA UPDATE improperly allowed'; END IF;

  -- Disabled account: all reads denied.
  PERFORM set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
  IF (SELECT count(*) FROM public.projects)<>0 OR
     (SELECT count(*) FROM public.financial_transactions)<>0
  THEN RAISE EXCEPTION 'disabled user can read rows'; END IF;
  RAISE NOTICE 'PASS: 5 role RLS cases, inactive, no profile, write/deny, finance read restrictions';
END;
$rls_test$;
RESET ROLE;

DO $final$
BEGIN
  IF (SELECT amount FROM public.financial_transactions
      WHERE id='12345678-1234-4234-8234-123456789013')<>100
  THEN RAISE EXCEPTION 'Financial insert not persisted'; END IF;
  IF (SELECT project_name FROM public.projects
      WHERE id='12345678-1234-4234-8234-123456789010')<>'MARKETING EDIT'
  THEN RAISE EXCEPTION 'Role-scope update mismatch'; END IF;
  RAISE NOTICE 'ALL REPRESENTATIVE RLS TESTS PASSED';
END;
$final$;
