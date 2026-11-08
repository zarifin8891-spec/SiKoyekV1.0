-- Real PostgreSQL test on disposable synthetic schema.
\set ON_ERROR_STOP on
DO $privileges$
BEGIN
 IF has_function_privilege('anon','public.refresh_project_status(uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.refresh_project_status(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.refresh_all_project_statuses()','EXECUTE')
    OR has_function_privilege('authenticated','public.trg_project_initial_status()','EXECUTE')
    OR NOT has_function_privilege('service_role','public.refresh_project_status(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'Legacy maintenance privileges not hardened'; END IF;
 RAISE NOTICE 'PASS: legacy SECURITY DEFINER direct access removed';
END;
$privileges$;
SET ROLE authenticated;
DO $trigger_test$
BEGIN
 PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
 BEGIN
   PERFORM public.refresh_project_status('12345678-1234-4234-8234-123456789010'::uuid);
   RAISE EXCEPTION 'Authenticated direct maintenance call unexpectedly permitted' USING ERRCODE='22000';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;
 INSERT INTO public.projects(id,project_code,project_name,status)
 VALUES('12345678-1234-4234-8234-123456789810','SIM-NEW','Synthetic new project','RENCANA');
 UPDATE public.projects SET project_name='Trigger still active'
 WHERE id='12345678-1234-4234-8234-123456789810';
 IF (SELECT count(*) FROM public.projects
     WHERE id='12345678-1234-4234-8234-123456789810' AND status='RENCANA')<>1
 THEN RAISE EXCEPTION 'Project trigger execution failed after EXECUTE revocation'; END IF;
 RAISE NOTICE 'PASS: project insert/update triggers still execute with revoked direct EXECUTE';
END;
$trigger_test$;
RESET ROLE;
SET ROLE service_role;
SELECT public.refresh_project_status('12345678-1234-4234-8234-123456789010'::uuid);
SELECT public.refresh_all_project_statuses();
RESET ROLE;
