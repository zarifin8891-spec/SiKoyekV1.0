-- Applies only after the synthetic shared schema and the existing hardened RPCs.
DO $guard$
BEGIN
  IF current_setting('sikoyek.disposable_fixture',true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Reporting prototype requires a disposable synthetic fixture';
  END IF;
END;
$guard$;

-- A progress record cannot contribute to an item belonging to another project or company.
ALTER TABLE public.project_work_items ADD CONSTRAINT work_items_tenant_project_id_key
  UNIQUE (tenant_id,project_id,id);
ALTER TABLE public.progress_records ADD CONSTRAINT progress_tenant_project_item_fk
  FOREIGN KEY (tenant_id,project_id,work_item_id)
  REFERENCES public.project_work_items(tenant_id,project_id,id);

-- These functions use privileged reads to preserve existing field-level permission behavior.
-- Join by globally unique project ID and enforce the verified company explicitly.
-- CREATE OR REPLACE preserves the restricted EXECUTE grants of the staged baseline.
CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_summary()
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE company text := sikoyek_authz.current_tenant();
BEGIN
  IF company IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('RAP','VIEW')) THEN
    RAISE EXCEPTION 'Financial project summary access denied' USING ERRCODE='42501';
  END IF;
  IF (SELECT sikoyek_authz.can('PROGRESS','VIEW')) THEN
    RETURN QUERY SELECT to_jsonb(s) FROM public.project_summary s
    JOIN public.projects p ON p.id=s.project_id AND p.tenant_id=company;
  ELSE
    -- Some tenants include progress_total, project_progress or health_gap.
    -- Remove all derived operational/health fields from finance-only responses.
    RETURN QUERY SELECT to_jsonb(s) - ARRAY[
      'progress_total','project_progress','health_gap',
      'health_status','control_message'
    ] FROM public.project_summary s
    JOIN public.projects p ON p.id=s.project_id AND p.tenant_id=company;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_detail(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
  company text := sikoyek_authz.current_tenant();
  data jsonb;
BEGIN
  IF company IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
    RAISE EXCEPTION 'Project contract detail access denied' USING ERRCODE='42501';
  END IF;
  SELECT to_jsonb(p) INTO data FROM public.projects p
  WHERE p.id=p_project_id AND p.tenant_id=company;
  RETURN data;
END;
$function$;

-- Kinerja requires contract values but does not require access to RAP or health.
CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_contracts()
RETURNS TABLE(project_id uuid, contract_value numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE company text := sikoyek_authz.current_tenant();
BEGIN
  IF company IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW')) THEN
    RAISE EXCEPTION 'Project contract list access denied' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT p.id,p.contract_value FROM public.projects p
  WHERE p.tenant_id=company ORDER BY p.project_code,p.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_cost_control()
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE company text := sikoyek_authz.current_tenant();
BEGIN
  IF company IS NULL
     OR NOT (SELECT sikoyek_authz.can('PROJECTS','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('KEUANGAN','VIEW'))
     OR NOT (SELECT sikoyek_authz.can('RAP','VIEW')) THEN
    RAISE EXCEPTION 'Cost control access denied' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT to_jsonb(v) FROM public.project_cost_control v
  JOIN public.projects p ON p.id=v.project_id AND p.tenant_id=company;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sikoyek_secure_project_lifecycle(
  p_project_ids uuid[]
)
RETURNS SETOF jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE company text := sikoyek_authz.current_tenant();
BEGIN
  IF company IS NULL
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
         SELECT 1 FROM public.progress_records r WHERE r.project_id=p.id AND r.tenant_id=company
       ) THEN 1 ELSE 0 END,
       'txCount',CASE WHEN EXISTS(
         SELECT 1 FROM public.financial_transactions f WHERE f.project_id=p.id AND f.tenant_id=company
       ) THEN 1 ELSE 0 END,
       'started',
         (coalesce(upper(p.status),'RENCANA')<>'RENCANA'
          OR EXISTS(SELECT 1 FROM public.progress_records r WHERE r.project_id=p.id AND r.tenant_id=company)
          OR EXISTS(SELECT 1 FROM public.financial_transactions f WHERE f.project_id=p.id AND f.tenant_id=company))
    )
    FROM public.projects p
    WHERE p.tenant_id=company AND p.id=ANY(p_project_ids)
    ORDER BY p.project_code,p.id;
END;
$function$;
