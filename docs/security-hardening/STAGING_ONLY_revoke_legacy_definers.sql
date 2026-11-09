-- STAGING-ONLY security-function grants parity; not applied on either live database.
-- Verified in read-only production audits on 2026-11-08: both tenants have these 4
-- SECURITY DEFINER functions; MASTER permits anon/authenticated EXECUTE, KONSTRUVA denies.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $preflight$
DECLARE r record;
BEGIN
 FOR r IN
  SELECT signature FROM (VALUES
    ('public.refresh_all_project_statuses()'),
    ('public.refresh_project_status(uuid)'),
    ('public.trg_project_initial_status()'),
    ('public.trg_refresh_project_status()')
  ) AS names(signature)
 LOOP
   IF to_regprocedure(r.signature) IS NULL THEN
     RAISE EXCEPTION 'Expected database function missing: %',r.signature;
   END IF;
   IF NOT (SELECT prosecdef FROM pg_proc WHERE oid=to_regprocedure(r.signature)) THEN
     RAISE EXCEPTION 'Function SECURITY DEFINER status changed: %',r.signature;
   END IF;
 END LOOP;
END;
$preflight$;

-- Trigger execution is governed by trigger ownership; revoking direct
-- EXECUTE does not remove the installed trigger or alter its callback.
REVOKE ALL ON FUNCTION public.refresh_all_project_statuses()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.refresh_project_status(uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.trg_project_initial_status()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.trg_refresh_project_status()
 FROM PUBLIC,anon,authenticated;

-- Internal scheduled maintenance may continue to use service_role.
GRANT EXECUTE ON FUNCTION public.refresh_all_project_statuses()
 TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_project_status(uuid)
 TO service_role;

DO $postflight$
DECLARE r record;
BEGIN
 FOR r IN SELECT signature FROM (VALUES
    ('public.refresh_all_project_statuses()'),
    ('public.refresh_project_status(uuid)'),
    ('public.trg_project_initial_status()'),
    ('public.trg_refresh_project_status()')
 ) AS names(signature)
 LOOP
   IF has_function_privilege('anon',to_regprocedure(r.signature),'EXECUTE')
      OR has_function_privilege('authenticated',to_regprocedure(r.signature),'EXECUTE')
   THEN RAISE EXCEPTION 'Public RPC privilege remains: %',r.signature; END IF;
 END LOOP;
END;
$postflight$;
COMMIT;
