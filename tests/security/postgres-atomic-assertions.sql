-- Real PostgreSQL regression tests. Runs ONLY in GitHub Actions disposable postgres:17 service.
\set ON_ERROR_STOP on
DO $verify_grants$
BEGIN
  IF pg_catalog.has_function_privilege('anon',
     'public.replace_role_permissions_atomic(uuid,uuid,uuid[])', 'EXECUTE')
    OR pg_catalog.has_function_privilege('authenticated',
     'public.replace_role_permissions_atomic(uuid,uuid,uuid[])', 'EXECUTE')
    OR NOT pg_catalog.has_function_privilege('service_role',
     'public.replace_role_permissions_atomic(uuid,uuid,uuid[])', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'RPC privileges unsafe';
  END IF;
  RAISE NOTICE 'PASS: restricted RPC EXECUTE grants';
END;
$verify_grants$;

SET ROLE service_role;
DO $test_auth$
BEGIN
  BEGIN
    PERFORM public.replace_role_permissions_atomic(
      '77777777-7777-4777-8777-777777777777'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      ARRAY[]::uuid[]
    );
    RAISE EXCEPTION 'expected unauthorized actor to be rejected' USING ERRCODE = '22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  BEGIN
    PERFORM public.replace_role_permissions_atomic(
      '88888888-8888-4888-8888-888888888888'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      ARRAY[]::uuid[]
    );
    RAISE EXCEPTION 'expected inactive actor to be rejected' USING ERRCODE = '22000';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.role_permissions
       WHERE role_id='33333333-3333-4333-8333-333333333333')<>2
  THEN RAISE EXCEPTION 'unauthorized test changed data'; END IF;
  RAISE NOTICE 'PASS: non-admin and inactive actors denied; original data preserved';
END;
$test_auth$;

DO $test_validation$
DECLARE actor constant uuid := '11111111-1111-4111-8111-111111111111';
        target constant uuid := '33333333-3333-4333-8333-333333333333';
BEGIN
  BEGIN
    PERFORM public.replace_role_permissions_atomic(actor,target,
      ARRAY['44444444-4444-4444-8444-444444444444'::uuid,
            '44444444-4444-4444-8444-444444444444'::uuid]);
    RAISE EXCEPTION 'duplicate permission IDs unexpectedly allowed' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
  BEGIN
    PERFORM public.replace_role_permissions_atomic(actor,target,
      ARRAY['99999999-9999-4999-8999-999999999999'::uuid]);
    RAISE EXCEPTION 'unknown permission unexpectedly allowed' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
  BEGIN
    PERFORM public.replace_role_permissions_atomic(actor,target,
      ARRAY[NULL::uuid]);
    RAISE EXCEPTION 'NULL permission unexpectedly allowed' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.role_permissions WHERE role_id=target)<>2
  THEN RAISE EXCEPTION 'invalid permission test changed data'; END IF;
  RAISE NOTICE 'PASS: unknown, NULL, and duplicate IDs rejected';
END;
$test_validation$;
RESET ROLE;

CREATE FUNCTION public.synthetic_reject_permission() RETURNS trigger
LANGUAGE plpgsql AS $f$
BEGIN
  IF NEW.permission_id = '66666666-6666-4666-8666-666666666666'::uuid THEN
     RAISE EXCEPTION 'synthetic insertion failure';
  END IF;
  RETURN NEW;
END;
$f$;
CREATE TRIGGER synthetic_permission_failure BEFORE INSERT
ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.synthetic_reject_permission();

SET ROLE service_role;
DO $test_atomic$
DECLARE actor constant uuid := '11111111-1111-4111-8111-111111111111';
        target constant uuid := '33333333-3333-4333-8333-333333333333';
BEGIN
  BEGIN
    PERFORM public.replace_role_permissions_atomic(actor,target,
      ARRAY['66666666-6666-4666-8666-666666666666'::uuid]);
    RAISE EXCEPTION 'injected failure unexpectedly succeeded' USING ERRCODE='22000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.role_permissions WHERE role_id=target)<>2
     OR NOT EXISTS (SELECT 1 FROM public.role_permissions
                    WHERE role_id=target AND permission_id='44444444-4444-4444-8444-444444444444')
     OR NOT EXISTS (SELECT 1 FROM public.role_permissions
                    WHERE role_id=target AND permission_id='55555555-5555-4555-8555-555555555555')
  THEN RAISE EXCEPTION 'FAILED: partial delete was not rolled back'; END IF;
  RAISE NOTICE 'PASS: injected SQL INSERT failure rolled back DELETE atomically';
END;
$test_atomic$;

DO $test_success$
DECLARE actor constant uuid := '11111111-1111-4111-8111-111111111111';
        target constant uuid := '33333333-3333-4333-8333-333333333333';
        returned integer;
BEGIN
  SELECT public.replace_role_permissions_atomic(actor,target,
    ARRAY['44444444-4444-4444-8444-444444444444'::uuid]) INTO returned;
  IF returned <> 1
     OR (SELECT count(*) FROM public.role_permissions WHERE role_id=target)<>1
     OR NOT EXISTS(SELECT 1 FROM public.role_permissions WHERE role_id=target
                   AND permission_id='44444444-4444-4444-8444-444444444444')
  THEN RAISE EXCEPTION 'valid role replacement failed'; END IF;
  SELECT public.replace_role_permissions_atomic(actor,target, ARRAY[]::uuid[]) INTO returned;
  IF returned <> 0 OR (SELECT count(*) FROM public.role_permissions WHERE role_id=target)<>0
  THEN RAISE EXCEPTION 'empty replacement failed'; END IF;
  RAISE NOTICE 'PASS: valid and empty permission lists are applied';
END;
$test_success$;
RESET ROLE;

DO $postchecks$
BEGIN
  IF (SELECT count(*) FROM public.role_permissions WHERE role_id=
    '33333333-3333-4333-8333-333333333333'::uuid)<>0
  THEN RAISE EXCEPTION 'Postcondition failed'; END IF;
  RAISE NOTICE 'POSTGRESQL INTEGRATION: ALL CASES PASSED';
END;
$postchecks$;
