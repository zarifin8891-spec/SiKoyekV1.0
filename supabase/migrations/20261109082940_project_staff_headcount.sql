CREATE FUNCTION public.sikoyek_project_staff_headcount()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH today AS (
    SELECT (statement_timestamp() AT TIME ZONE 'Asia/Jakarta')::date AS day
  ),
  headcounts AS (
    SELECT assignment.project_id, count(DISTINCT assignment.employee_id) AS people
    FROM public.project_staff_assignments AS assignment
    JOIN public.employees AS employee ON employee.id = assignment.employee_id
    JOIN public.projects AS project ON project.id = assignment.project_id
    CROSS JOIN today
    WHERE employee.is_active
      AND assignment.start_date <= today.day
      AND (assignment.end_date IS NULL OR assignment.end_date >= today.day)
    GROUP BY GROUPING SETS ((), (assignment.project_id))
  )
  SELECT CASE WHEN (SELECT sikoyek_authz.can('PROJECTS', 'VIEW')) THEN jsonb_build_object(
    'total', max(people) FILTER (WHERE project_id IS NULL),
    'projects', coalesce(jsonb_object_agg(project_id, people) FILTER (WHERE project_id IS NOT NULL), '{}'::jsonb)
  ) END
  FROM headcounts;
$function$;

REVOKE ALL ON FUNCTION public.sikoyek_project_staff_headcount() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sikoyek_project_staff_headcount() TO authenticated;
