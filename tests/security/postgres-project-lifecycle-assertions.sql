-- Disposable PostgreSQL 17 only. Requires RLS, secure projections, lifecycle gate.
\set ON_ERROR_STOP on
DO $grants$
BEGIN
  IF has_function_privilege('anon','public.sikoyek_secure_project_lifecycle(uuid[])','EXECUTE')
  OR NOT has_function_privilege('authenticated','public.sikoyek_secure_project_lifecycle(uuid[])','EXECUTE')
  THEN RAISE EXCEPTION 'Lifecycle RPC privilege grant error'; END IF;
END;
$grants$;
SET ROLE authenticated;
DO $lifecycle$
DECLARE j jsonb; n integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
  SELECT v INTO j FROM public.sikoyek_secure_project_lifecycle(
    ARRAY['12345678-1234-4234-8234-123456789010'::uuid]) AS v LIMIT 1;
  IF j IS NULL OR (j->>'started')::boolean IS DISTINCT FROM TRUE
     OR (j->>'txCount')::int<>1 OR (j->>'progressCount')::int<>1
     OR (j->'project'->>'contract_value')::numeric<>300000000
  THEN RAISE EXCEPTION 'Admin lifecycle authorization or activity flags invalid'; END IF;

  PERFORM set_config('request.jwt.claim.sub','ffffffff-ffff-4fff-8fff-ffffffffffff',false);
  SELECT v INTO j FROM public.sikoyek_secure_project_lifecycle(
    ARRAY['12345678-1234-4234-8234-123456789010'::uuid]) AS v LIMIT 1;
  IF j IS NULL OR (j->>'started')::boolean IS DISTINCT FROM TRUE
     OR (j->>'txCount')::int<>1 OR (j->>'progressCount')::int<>1
     OR (j->'project' ? 'contract_value') THEN
    RAISE EXCEPTION 'Marketing lifecycle leaks contract or omits activity'; END IF;
  IF (j->'project'->>'project_name') IS NULL
  THEN RAISE EXCEPTION 'Marketing edit form lacks project name'; END IF;

  PERFORM set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_lifecycle(
      ARRAY['12345678-1234-4234-8234-123456789010'::uuid]);
    RAISE EXCEPTION 'Read-only project user accessed mutation validation' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_lifecycle(ARRAY[]::uuid[]);
    RAISE EXCEPTION 'Inactive admin accessed lifecycle' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  PERFORM set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
  BEGIN
    PERFORM public.sikoyek_secure_project_lifecycle(ARRAY[NULL]::uuid[]);
    RAISE EXCEPTION 'Invalid lifecycle input accepted' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
  SELECT count(*) INTO n FROM public.sikoyek_secure_project_lifecycle(ARRAY[]::uuid[]);
  IF n<>0 THEN RAISE EXCEPTION 'Empty request should return no projects'; END IF;
  RAISE NOTICE 'PASS: authoritative lifecycle flags, restricted contract, inactive and read-only denial';
END;
$lifecycle$;
RESET ROLE;
