-- Real PostgreSQL 17 integration tests for secure column access & finance RPCs.
-- Disposable synthetic database only; no external Supabase connection.
\set ON_ERROR_STOP on

DO $catalog$
BEGIN
 IF has_column_privilege('authenticated','public.projects','contract_value','SELECT')
 THEN RAISE EXCEPTION 'Sensitive contract value is still readable'; END IF;
 IF NOT has_column_privilege('authenticated','public.projects','project_name','SELECT')
 THEN RAISE EXCEPTION 'Safe project name is not readable'; END IF;
 IF has_table_privilege('authenticated','public.project_summary','SELECT')
    OR has_table_privilege('authenticated','public.project_cost_control','SELECT')
 THEN RAISE EXCEPTION 'Sensitive views still exposed'; END IF;
 IF has_function_privilege('anon','public.sikoyek_secure_project_summary()','EXECUTE')
    OR has_function_privilege('anon','public.sikoyek_secure_project_detail(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.sikoyek_secure_project_contracts()','EXECUTE')
    OR has_function_privilege('anon','public.sikoyek_secure_project_cost_control()','EXECUTE')
 THEN RAISE EXCEPTION 'Anonymous financial RPC executable'; END IF;
 IF NOT has_function_privilege('authenticated','public.sikoyek_secure_project_summary()','EXECUTE')
 THEN RAISE EXCEPTION 'Authorized RPC unavailable'; END IF;
 RAISE NOTICE 'PASS: contract value column and views hidden, finance RPC grants restricted';
END;
$catalog$;

SET ROLE authenticated;
DO $scenario$
DECLARE
  n integer;
  jsonrow jsonb;
  projectid constant uuid := '12345678-1234-4234-8234-123456789010';
BEGIN
  -- Raw project contract is forbidden even to ADMIN; safe columns remain readable.
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
  IF (SELECT count(*) FROM public.projects WHERE id=projectid)<>1
  THEN RAISE EXCEPTION 'Admin cannot query safe project'; END IF;
  BEGIN
    PERFORM contract_value FROM public.projects;
    RAISE EXCEPTION 'Raw contract value readable' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    PERFORM 1 FROM public.project_summary;
    RAISE EXCEPTION 'Direct financial summary view readable' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    PERFORM 1 FROM public.project_cost_control;
    RAISE EXCEPTION 'Direct cost control view readable' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  SELECT public.sikoyek_secure_project_detail(projectid) INTO jsonrow;
  IF (jsonrow->>'contract_value')::numeric<>300000000
  THEN RAISE EXCEPTION 'Authorized admin cannot read contract via RPC'; END IF;
  SELECT count(*) INTO n FROM public.sikoyek_secure_project_summary();
  IF n<>1 THEN RAISE EXCEPTION 'Admin financial summary RPC empty'; END IF;
  SELECT count(*) INTO n FROM public.sikoyek_secure_project_cost_control();
  IF n<>1 THEN RAISE EXCEPTION 'Admin cost control RPC empty'; END IF;

  -- Finance user sees monetary fields but MUST NOT receive progress / health.
  PERFORM set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false);
  SELECT public.sikoyek_secure_project_detail(projectid) INTO jsonrow;
  IF (jsonrow->>'contract_value')::numeric<>300000000
  THEN RAISE EXCEPTION 'Finance user cannot read contract via authorized RPC'; END IF;
  SELECT to_jsonb(c) INTO jsonrow FROM public.sikoyek_secure_project_contracts() AS c;
  IF jsonrow IS DISTINCT FROM jsonb_build_object('project_id',projectid,'contract_value',300000000)
  THEN RAISE EXCEPTION 'Contract report projection does not match the allowlist'; END IF;
  SELECT value INTO jsonrow FROM public.sikoyek_secure_project_summary() AS value LIMIT 1;
  IF (jsonrow->>'contract_value')::numeric<>300000000
    OR jsonrow ? 'project_progress'
    OR jsonrow ? 'health_status'
    OR jsonrow ? 'control_message'
  THEN RAISE EXCEPTION 'Finance-only summary contains hidden progress fields or loses contract'; END IF;

  -- Marketing and field staff may read safe columns, but RPCs cannot leak money.
  PERFORM set_config('request.jwt.claim.sub','ffffffff-ffff-4fff-8fff-ffffffffffff',false);
  IF (SELECT count(*) FROM public.projects)<>1
  THEN RAISE EXCEPTION 'Marketing cannot read safe project columns'; END IF;
  BEGIN
    PERFORM public.sikoyek_secure_project_detail(projectid);
    RAISE EXCEPTION 'Marketing can read contract via detail RPC' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    PERFORM public.sikoyek_secure_project_summary();
    RAISE EXCEPTION 'Marketing can read financial summary' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    PERFORM public.sikoyek_secure_project_cost_control();
    RAISE EXCEPTION 'Marketing can read cost control' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  BEGIN
    PERFORM * FROM public.sikoyek_secure_project_contracts();
    RAISE EXCEPTION 'Marketing can read contract list' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  -- Marketing with PROJECTS EDIT must not be allowed to modify contract.
  BEGIN
    UPDATE public.projects SET contract_value=900000000 WHERE id=projectid;
    RAISE EXCEPTION 'Marketing changed protected contract' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    UPDATE public.projects SET contract_value=300000000 WHERE id=projectid;
    RAISE EXCEPTION 'Marketing can verify a guessed contract value' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  UPDATE public.projects SET project_name='Marketing edit allowed' WHERE id=projectid;

  PERFORM set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_detail(projectid);
    RAISE EXCEPTION 'Pelaksana can read contract via RPC' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  -- Inactive admin and unknown user fail closed.
  PERFORM set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_summary();
    RAISE EXCEPTION 'Inactive admin read finance' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  PERFORM set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_detail(projectid);
    RAISE EXCEPTION 'Unknown caller read finance' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  RAISE NOTICE 'PASS: Admin/Finance secure RPC, restricted roles blocked, protected contract writes denied';
END;
$scenario$;
RESET ROLE;

DO $final$
BEGIN
 IF (SELECT contract_value FROM public.projects
     WHERE id='12345678-1234-4234-8234-123456789010')<>300000000
 THEN RAISE EXCEPTION 'Contract value was changed despite guard'; END IF;
 IF (SELECT project_name FROM public.projects
     WHERE id='12345678-1234-4234-8234-123456789010')<>'Marketing edit allowed'
 THEN RAISE EXCEPTION 'Allowed project edit not persisted'; END IF;
 RAISE NOTICE 'ALL SENSITIVE-COLUMN AND SECURE-RPC TESTS PASSED';
END;
$final$;
