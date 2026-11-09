-- Requires the reviewed Security Hardening V1 authorization helpers.
DO $prerequisites$
BEGIN
  IF to_regprocedure('sikoyek_authz.can(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Install the reviewed SiKoyek security policies before project milestones';
  END IF;
END;
$prerequisites$;

CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  target_date date NOT NULL CHECK (isfinite(target_date)),
  completed_date date CHECK (isfinite(completed_date)),
  notes text CHECK (char_length(notes) <= 1000)
);

CREATE INDEX project_milestones_project_date_idx
  ON public.project_milestones (project_id, target_date, id);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_milestones FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.project_milestones TO authenticated;
GRANT UPDATE (title, target_date, completed_date, notes) ON public.project_milestones TO authenticated;

CREATE POLICY project_milestones_read ON public.project_milestones
  FOR SELECT TO authenticated USING ((SELECT sikoyek_authz.can('PROJECTS','VIEW')));

CREATE POLICY project_milestones_add ON public.project_milestones
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );

CREATE POLICY project_milestones_update ON public.project_milestones
  FOR UPDATE TO authenticated USING (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  ) WITH CHECK (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );

CREATE POLICY project_milestones_delete ON public.project_milestones
  FOR DELETE TO authenticated USING (
    (SELECT sikoyek_authz.can('PROJECTS','VIEW')) AND (SELECT sikoyek_authz.can('PROJECTS','EDIT'))
  );
