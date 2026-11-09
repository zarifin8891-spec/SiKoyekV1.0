CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = pg_catalog, public, extensions;

ALTER TABLE public.employees
  ADD COLUMN allow_parallel_projects boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT employees_parallel_key UNIQUE (id, allow_parallel_projects);

GRANT UPDATE (allow_parallel_projects) ON public.employees TO authenticated;

ALTER TABLE public.project_staff_assignments
  ADD COLUMN allow_parallel_projects boolean NOT NULL DEFAULT false,
  DROP CONSTRAINT project_staff_assignments_employee_fk,
  ADD CONSTRAINT project_staff_assignments_employee_fk
    FOREIGN KEY (employee_id, allow_parallel_projects)
    REFERENCES public.employees (id, allow_parallel_projects) ON UPDATE CASCADE,
  ADD CONSTRAINT project_staff_assignments_no_overlap
    EXCLUDE USING gist (
      employee_id WITH =,
      project_id WITH <>,
      daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (NOT allow_parallel_projects);

-- The composite FK prevents a project editor from granting an exception on insert.
-- Turning off an exception cascades to placements and is rejected if they still conflict.
