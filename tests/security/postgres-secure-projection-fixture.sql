-- Synthetic-only schema extensions resembling the shared columns of MASTER/KONSTRUVA.
-- Executed after postgres-full-rls-fixture.sql, before full RLS and financial projection.
\set ON_ERROR_STOP on

ALTER TABLE public.projects
  ADD COLUMN project_code text,
  ADD COLUMN project_date date,
  ADD COLUMN owner_name text,
  ADD COLUMN category text,
  ADD COLUMN location text,
  ADD COLUMN contract_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  ADD COLUMN project_manager text,
  ADD COLUMN status text NOT NULL DEFAULT 'JALAN',
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.projects SET
  project_code='SIM-001', contract_value=300000000,
  project_date='2026-11-01', owner_name='Synthetic Owner';

-- Both tenant views are security_invoker and reference sensitive base fields.
-- Actual MASTER and KONSTRUVA view definitions differ and MUST undergo separate tests.
CREATE VIEW public.project_summary WITH (security_invoker=true) AS
SELECT p.id AS project_id, p.project_code, p.project_name,
  p.contract_value,
  COALESCE((SELECT sum(f.amount) FROM public.financial_transactions f
   WHERE f.project_id=p.id),0) AS total_realization,
  COALESCE((SELECT sum(x.progress_percentage) FROM public.progress_records x
   WHERE x.project_id=p.id),0) AS project_progress,
  'SEHAT'::text AS health_status,
  'Synthetic only'::text AS control_message
FROM public.projects p;
CREATE VIEW public.project_cost_control WITH (security_invoker=true) AS
SELECT p.id AS project_id, p.project_code, p.project_name,
  COALESCE((SELECT sum(r.material) FROM public.project_rap r
    WHERE r.project_id=p.id),0) AS rap,
  COALESCE((SELECT sum(f.amount) FROM public.financial_transactions f
   WHERE f.project_id=p.id),0) AS realization
FROM public.projects p;
GRANT SELECT ON public.project_summary,public.project_cost_control
TO authenticated;
