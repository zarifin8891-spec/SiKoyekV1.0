-- STAGING ONLY. Apply AFTER STAGING_ONLY_full_rls_15_tables.sql.
-- NEVER execute on MASTER / KONSTRUVA without exact-schema staging tests, backups, review, approval.
-- Prevent authenticated Data API clients from reading public.projects.contract_value
-- or directly reading project_summary/project_cost_control.
-- Privileged RPC results are guarded by current active permissions (never user_metadata).
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects'
      AND column_name='contract_value' AND data_type='numeric'
  ) THEN
    RAISE EXCEPTION 'Project contract column mismatch';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('project_summary'),('project_cost_control')
    ) AS required(viewname)
    WHERE NOT EXISTS(
      SELECT 1 FROM pg_class c WHERE c.relnamespace='public'::regnamespace
        AND c.relname=required.viewname AND c.relkind='v'
        AND 'security_invoker=true'=ANY(COALESCE(c.reloptions,ARRAY[]::text[]))
    )
  ) THEN
    RAISE EXCEPTION 'Financial views missing or not security_invoker';
  END IF;
  IF to_regprocedure('sikoyek_authz.can(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Role-scoped policy migration must run first';
  END IF;
END;
$preflight$;

-- MASTER's legacy view divides by contract value in its health expressions.
-- The same application can create a RENCANA project with a zero contract.
-- Patch only the observed expression in the observed view shape. KONSTRUVA
-- already guards its ratio calculation, so leave its view definition alone.
DO $zero_contract$
DECLARE
  definition text := pg_get_viewdef('public.project_summary'::regclass,true);
  unsafe_ratio constant text := 'COALESCE(ft.cash_out, 0::numeric) / p.contract_value * 100::numeric';
  safe_ratio constant text := 'COALESCE(COALESCE(ft.cash_out, 0::numeric) / NULLIF(p.contract_value, 0::numeric) * 100::numeric, 0::numeric)';
  occurrences integer;
BEGIN
  occurrences := (length(definition)-length(replace(definition,unsafe_ratio,'')))/length(unsafe_ratio);
  IF occurrences=5 THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.project_summary WITH (security_invoker=true) AS '
      || replace(definition,unsafe_ratio,safe_ratio);
  ELSIF occurrences<>0 THEN
    RAISE EXCEPTION 'Legacy project_summary ratio expression changed';
  END IF;
END;
$zero_contract$;

-- Distinguish row permission from column permission: any authenticated user
-- may have PROJECTS VIEW, but cannot read value of the contract from Data API.
REVOKE SELECT ON public.projects FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, project_code, project_date, project_name, owner_name, category, location,
  start_date, end_date, project_manager, status, created_at, updated_at
) ON public.projects TO authenticated;

-- In both tenants the security_invoker views include financial aggregates.
-- Prevent direct API access. Backend-checked RPCs below are the only approved route.
REVOKE ALL ON public.project_summary,public.project_cost_control
  FROM PUBLIC,anon,authenticated;

-- Sensitive write guard; a PROJECTS EDIT role is not automatically entitled
-- to change contract values. Keep legitimate finance-authorized edits.
CREATE OR REPLACE FUNCTION sikoyek_authz.guard_contract_value()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $body$
BEGIN
  IF TG_OP='INSERT' THEN
    IF COALESCE(NEW.contract_value,0)<>0
       AND NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
      RAISE EXCEPTION 'Not authorized to set project contract value'
        USING ERRCODE='42501';
    END IF;
  -- UPDATE OF fires even if the supplied value matches the stored value.
  ELSIF NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
    RAISE EXCEPTION 'Not authorized to change project contract value'
      USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION sikoyek_authz.guard_contract_value() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS sikoyek_guard_contract_value ON public.projects;
CREATE TRIGGER sikoyek_guard_contract_value
BEFORE INSERT OR UPDATE OF contract_value ON public.projects
FOR EACH ROW EXECUTE FUNCTION sikoyek_authz.guard_contract_value();

-- Security definer functions are deliberately narrow, audited and role-checked.
-- They are not generic arbitrary-SQL / table access endpoints.
CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_summary()
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('RAP','VIEW')) THEN
    RAISE EXCEPTION 'Financial project summary access denied' USING ERRCODE='42501';
  END IF;
  IF (SELECT sikoyek_authz.can('PROGRESS','VIEW')) THEN
    RETURN QUERY SELECT to_jsonb(s) FROM public.project_summary s;
  ELSE
    -- Some tenants include progress_total, project_progress or health_gap.
    -- Remove all derived operational/health fields from finance-only responses.
    RETURN QUERY SELECT to_jsonb(s) - ARRAY[
      'progress_total','project_progress','health_gap',
      'health_status','control_message'
    ] FROM public.project_summary s;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_detail(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE data jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
    RAISE EXCEPTION 'Project contract detail access denied' USING ERRCODE='42501';
  END IF;
  SELECT to_jsonb(p) INTO data FROM public.projects p
  WHERE p.id=p_project_id;
  RETURN data;
END;
$function$;

-- Kinerja requires contract values but does not require access to RAP or health.
CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_contracts()
RETURNS TABLE(project_id uuid, contract_value numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
    RAISE EXCEPTION 'Project contract list access denied' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT p.id,p.contract_value FROM public.projects p ORDER BY p.project_code,p.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_cost_control()
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('RAP','VIEW')) THEN
    RAISE EXCEPTION 'Cost control access denied' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT to_jsonb(v) FROM public.project_cost_control v;
END;
$function$;

-- PostgreSQL grants EXECUTE to PUBLIC on newly created functions by default.
-- Revoke it in the SAME DDL transaction, then allow authenticated callers only.
REVOKE ALL ON FUNCTION public.sikoyek_secure_project_summary()
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.sikoyek_secure_project_detail(uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.sikoyek_secure_project_cost_control()
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.sikoyek_secure_project_contracts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_secure_project_contracts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_secure_project_summary()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_secure_project_detail(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_secure_project_cost_control()
  TO authenticated;

-- Non-destructive postflight: fail closed if any broad grants survive.
DO $postflight$
BEGIN
  IF has_table_privilege('authenticated','public.projects','SELECT')
     OR has_column_privilege('authenticated','public.projects','contract_value','SELECT')
     OR has_table_privilege('anon','public.projects','SELECT')
     OR has_table_privilege('authenticated','public.project_summary','SELECT')
     OR has_table_privilege('authenticated','public.project_cost_control','SELECT')
     OR has_function_privilege('anon','public.sikoyek_secure_project_detail(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.sikoyek_secure_project_contracts()','EXECUTE')
  THEN
    RAISE EXCEPTION 'Sensitive financial permissions are not sufficiently restricted';
  END IF;
END;
$postflight$;
COMMIT;
