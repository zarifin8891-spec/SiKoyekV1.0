-- Requires the reviewed Security Hardening V1 authorization helpers.
DO $prerequisites$
BEGIN
  IF to_regprocedure('sikoyek_authz.can(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Install the reviewed SiKoyek security policies before project staff assignments';
  END IF;
END;
$prerequisites$;

CREATE TABLE public.project_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_name text NOT NULL CHECK (char_length(btrim(employee_name)) BETWEEN 1 AND 120),
  assignment_role text NOT NULL CHECK (char_length(btrim(assignment_role)) BETWEEN 1 AND 100),
  start_date date NOT NULL CHECK (isfinite(start_date)),
  end_date date CHECK (isfinite(end_date) AND end_date >= start_date)
);

CREATE INDEX project_staff_assignments_project_date_idx
  ON public.project_staff_assignments (project_id, start_date, id);

ALTER TABLE public.project_staff_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_staff_assignments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.project_staff_assignments TO authenticated;
GRANT UPDATE (employee_name, assignment_role, start_date, end_date) ON public.project_staff_assignments TO authenticated;

CREATE POLICY project_staff_assignments_read ON public.project_staff_assignments
  FOR SELECT TO authenticated USING ((SELECT sikoyek_authz.can('PROJECTS','VIEW')));

CREATE POLICY project_staff_assignments_add ON public.project_staff_assignments
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );

CREATE POLICY project_staff_assignments_update ON public.project_staff_assignments
  FOR UPDATE TO authenticated USING (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  ) WITH CHECK (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );

CREATE POLICY project_staff_assignments_delete ON public.project_staff_assignments
  FOR DELETE TO authenticated USING (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );
