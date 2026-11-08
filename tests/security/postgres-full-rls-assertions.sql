-- Postgres 17 RLS regression tests for all 15 public synthetic tables.
-- Run only after fixture + STAGING_ONLY_full_rls_15_tables.sql on disposable database.
\set ON_ERROR_STOP on
DO $catalog$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM pg_policies WHERE schemaname='public';
 IF n<>41 THEN RAISE EXCEPTION 'Expected 41 restricted policies, got %',n; END IF;
 SELECT count(*) INTO n FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relkind='r' AND relrowsecurity;
 IF n<>15 THEN RAISE EXCEPTION 'RLS not enabled on all 15 tables'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'
           AND (qual='true' OR with_check='true'))
 THEN RAISE EXCEPTION 'Open-ended legacy policy remains'; END IF;
 IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public'
           AND has_table_privilege('anon',format('%I.%I',schemaname,tablename),'SELECT'))
 THEN RAISE EXCEPTION 'anon table SELECT still granted'; END IF;
 IF has_table_privilege('authenticated','public.role_permissions','UPDATE')
    OR has_table_privilege('authenticated','public.profiles','UPDATE')
 THEN RAISE EXCEPTION 'authenticated privilege can overwrite security tables'; END IF;
 RAISE NOTICE 'PASS: 15 RLS tables, 41 restricted policies, no anon grants';
END;
$catalog$;

SET ROLE authenticated;
DO $role_tests$
DECLARE
  projectid constant uuid:='12345678-1234-4234-8234-123456789010';
  updated integer;
BEGIN
 -- No caller profile / invalid identity.
 PERFORM set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
 IF (SELECT count(*) FROM public.profiles)<>0
    OR (SELECT count(*) FROM public.roles)<>0
    OR (SELECT count(*) FROM public.projects)<>0
    OR (SELECT count(*) FROM public.financial_transactions)<>0
 THEN RAISE EXCEPTION 'no-profile user got table access'; END IF;

 -- ADMIN: project/finance/RAP/progress/metadata/user log permissions.
 PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
 IF (SELECT count(*) FROM public.projects)<>1
    OR (SELECT count(*) FROM public.financial_transactions)<>1
    OR (SELECT count(*) FROM public.project_rap)<>1
    OR (SELECT count(*) FROM public.progress_records)<>1
    OR (SELECT count(*) FROM public.profiles)<>6
    OR (SELECT count(*) FROM public.audit_logs)<>1
    OR NOT sikoyek_authz.can('KEUANGAN','ADD')
 THEN RAISE EXCEPTION 'ADMIN role permissions incorrect'; END IF;
 INSERT INTO public.financial_transactions VALUES (
  '12345678-1234-4234-8234-123456789111',projectid,111);

 -- DIREKTUR: read finance, no finance write, can change Data Master.
 PERFORM set_config('request.jwt.claim.sub','dddddddd-dddd-4ddd-8ddd-dddddddddddd',false);
 IF (SELECT count(*) FROM public.financial_transactions)<>2
    OR (SELECT count(*) FROM public.project_rap)<>1
    OR (SELECT count(*) FROM public.profiles)<>6
 THEN RAISE EXCEPTION 'DIREKTUR read permissions incorrect'; END IF;
 BEGIN
   INSERT INTO public.financial_transactions VALUES
   ('12345678-1234-4234-8234-123456789112',projectid,112);
   RAISE EXCEPTION 'DIREKTUR finance insert incorrectly permitted' USING ERRCODE='22000';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;
 INSERT INTO public.payment_methods VALUES('12345678-1234-4234-8234-123456789113','Transfer');

 -- KEUANGAN: finance read & add, no PROGRESS records, no projects UPDATE.
 PERFORM set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false);
 IF (SELECT count(*) FROM public.financial_transactions)<>2
    OR (SELECT count(*) FROM public.progress_records)<>0
    OR (SELECT count(*) FROM public.project_rap)<>1
    OR NOT sikoyek_authz.can('FINANCE','ADD')
 THEN RAISE EXCEPTION 'KEUANGAN module mapping / permissions incorrect'; END IF;
 INSERT INTO public.financial_transactions VALUES
  ('12345678-1234-4234-8234-123456789114',projectid,114);
 UPDATE public.projects SET project_name='DENIED KEUANGAN' WHERE id=projectid;
 GET DIAGNOSTICS updated=ROW_COUNT;
 IF updated<>0 THEN RAISE EXCEPTION 'KEUANGAN changed project without PROJECTS EDIT'; END IF;

 -- MARKETING: own profile only, can change project, cannot view finance/RAP/progress.
 PERFORM set_config('request.jwt.claim.sub','ffffffff-ffff-4fff-8fff-ffffffffffff',false);
 IF (SELECT count(*) FROM public.projects)<>1
    OR (SELECT count(*) FROM public.financial_transactions)<>0
    OR (SELECT count(*) FROM public.project_rap)<>0
    OR (SELECT count(*) FROM public.progress_records)<>0
    OR (SELECT count(*) FROM public.profiles)<>1
    OR (SELECT count(*) FROM public.role_permissions)<>5
 THEN RAISE EXCEPTION 'MARKETING access isolation failed'; END IF;
 UPDATE public.projects SET project_name='MARKETING APPROVED' WHERE id=projectid;
 GET DIAGNOSTICS updated=ROW_COUNT;
 IF updated<>1 THEN RAISE EXCEPTION 'MARKETING project edit blocked'; END IF;
 BEGIN
   INSERT INTO public.financial_transactions VALUES
    ('12345678-1234-4234-8234-123456789115',projectid,115);
   RAISE EXCEPTION 'MARKETING finance insert incorrectly permitted' USING ERRCODE='22000';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;
 BEGIN
   INSERT INTO public.payment_methods VALUES('12345678-1234-4234-8234-123456789116','Forbidden');
   RAISE EXCEPTION 'MARKETING master data insert incorrectly permitted' USING ERRCODE='22000';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;

 -- PELAKSANA: progress write, no finance or RAP, cannot change PROJECTS.
 PERFORM set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
 IF (SELECT count(*) FROM public.progress_records)<>1
    OR (SELECT count(*) FROM public.financial_transactions)<>0
    OR (SELECT count(*) FROM public.project_rap)<>0
    OR (SELECT count(*) FROM public.audit_logs)<>0
 THEN RAISE EXCEPTION 'PELAKSANA access isolation failed'; END IF;
 INSERT INTO public.progress_records VALUES
  ('12345678-1234-4234-8234-123456789117',projectid,10);
 UPDATE public.projects SET project_name='DENIED PELAKSANA' WHERE id=projectid;
 GET DIAGNOSTICS updated=ROW_COUNT;
 IF updated<>0 THEN RAISE EXCEPTION 'PELAKSANA project edit improperly permitted'; END IF;

 -- Inactive ADMIN has no access, even though role has broad permissions.
 PERFORM set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
 IF (SELECT count(*) FROM public.projects)<>0
    OR (SELECT count(*) FROM public.financial_transactions)<>0
    OR (SELECT count(*) FROM public.roles)<>0
 THEN RAISE EXCEPTION 'inactive user got access'; END IF;
 RAISE NOTICE 'PASS: all 5 roles, no-profile and inactive profile, full table protections';
END;
$role_tests$;
RESET ROLE;

DO $post$
BEGIN
 IF (SELECT project_name FROM public.projects
     WHERE id='12345678-1234-4234-8234-123456789010')<>'MARKETING APPROVED'
 THEN RAISE EXCEPTION 'Unexpected project write result'; END IF;
 IF (SELECT count(*) FROM public.financial_transactions)<>3
    OR (SELECT count(*) FROM public.progress_records)<>2
 THEN RAISE EXCEPTION 'Mutation results did not match RLS allow/deny'; END IF;
 RAISE NOTICE 'POSTGRESQL FULL 15-TABLE RLS TESTS PASSED';
END;
$post$;
