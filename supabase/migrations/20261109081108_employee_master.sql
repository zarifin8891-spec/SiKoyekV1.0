CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (char_length(btrim(code)) BETWEEN 1 AND 50),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  is_active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX employees_code_key ON public.employees (lower(btrim(code)));

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employees FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.employees TO authenticated;
GRANT UPDATE (code, name, is_active) ON public.employees TO authenticated;

CREATE POLICY employees_read ON public.employees FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')) OR (SELECT sikoyek_authz.can('PROJECTS','VIEW')));

CREATE POLICY employees_add ON public.employees FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')) AND (SELECT sikoyek_authz.can('MASTER_DATA','ADD')));

CREATE POLICY employees_edit ON public.employees FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')) AND (SELECT sikoyek_authz.can('MASTER_DATA','EDIT')))
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')) AND (SELECT sikoyek_authz.can('MASTER_DATA','EDIT')));

ALTER TABLE public.project_staff_assignments ADD COLUMN employee_id uuid;

-- Preserve each existing placement. A name alone cannot identify the same person across projects.
INSERT INTO public.employees (id, code, name)
  SELECT id, 'LAMA-' || id::text, employee_name FROM public.project_staff_assignments;

UPDATE public.project_staff_assignments SET employee_id = id;

ALTER TABLE public.project_staff_assignments
  ALTER COLUMN employee_id SET NOT NULL,
  ADD CONSTRAINT project_staff_assignments_employee_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  DROP COLUMN employee_name;

CREATE INDEX project_staff_assignments_employee_idx ON public.project_staff_assignments (employee_id);

ALTER POLICY project_staff_assignments_add ON public.project_staff_assignments
  WITH CHECK (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
    AND EXISTS (SELECT FROM public.employees WHERE id = employee_id AND is_active)
  );
