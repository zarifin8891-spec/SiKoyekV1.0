-- STAGING ONLY: safe project lifecycle gate. Requires full RLS + secure projection.
-- Must never run against live MASTER/KONSTRUVA before integration and backup validation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $prerequisites$
BEGIN
  IF to_regprocedure('sikoyek_authz.can(text,text)') IS NULL THEN
    RAISE EXCEPTION 'RLS permission helper missing';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='projects' AND column_name='status')
    OR NOT EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='progress_records' AND column_name='project_id')
    OR NOT EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='financial_transactions' AND column_name='project_id')
  THEN RAISE EXCEPTION 'Project lifecycle schema drift'; END IF;
END;
$prerequisites$;

-- Only active users with PROJECTS read and write/delete capability can ask.
-- Returns no financial amount, descriptions, timestamps, or raw transaction rows.
-- Count fields intentionally return just 0/1 presence flags for legacy compatibility.
CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_lifecycle(
  p_project_ids uuid[]
)
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT ((SELECT sikoyek_authz.can('PROJECTS','EDIT'))
             OR (SELECT sikoyek_authz.can('PROJECTS','DELETE'))) THEN
    RAISE EXCEPTION 'Project lifecycle access denied' USING ERRCODE='42501';
  END IF;
  IF p_project_ids IS NULL OR cardinality(p_project_ids)>100
     OR array_position(p_project_ids,NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid project ids' USING ERRCODE='22023';
  END IF;
  RETURN QUERY
    SELECT jsonb_build_object(
       'id',p.id,
       'project',jsonb_build_object(
         'id',p.id,'project_code',p.project_code,'project_date',p.project_date,
         'project_name',p.project_name,'owner_name',p.owner_name,
         'category',p.category,'location',p.location,
         'project_manager',p.project_manager,'start_date',p.start_date,
         'end_date',p.end_date,'status',p.status
       ) || CASE WHEN (SELECT sikoyek_authz.can('KEUANGAN','VIEW'))
           THEN jsonb_build_object('contract_value',p.contract_value)
           ELSE '{}'::jsonb END,
       'progressCount',CASE WHEN EXISTS(
         SELECT 1 FROM public.progress_records r WHERE r.project_id=p.id
       ) THEN 1 ELSE 0 END,
       'txCount',CASE WHEN EXISTS(
         SELECT 1 FROM public.financial_transactions f WHERE f.project_id=p.id
       ) THEN 1 ELSE 0 END,
       'started',
         (coalesce(upper(p.status),'RENCANA')<>'RENCANA'
          OR EXISTS(SELECT 1 FROM public.progress_records r WHERE r.project_id=p.id)
          OR EXISTS(SELECT 1 FROM public.financial_transactions f WHERE f.project_id=p.id))
    )
    FROM public.projects p
    WHERE p.id=ANY(p_project_ids)
    ORDER BY p.project_code,p.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.sikoyek_secure_project_lifecycle(uuid[])
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_secure_project_lifecycle(uuid[])
 TO authenticated;
COMMIT;
