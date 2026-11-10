-- Extend the existing synthetic projection fixture for the repository reporting views.
DROP VIEW public.project_summary, public.project_cost_control;
ALTER TABLE public.financial_transactions
  ADD COLUMN transaction_type text NOT NULL DEFAULT 'KELUAR',
  ADD COLUMN category text NOT NULL DEFAULT 'Material';
ALTER TABLE public.project_work_items ADD COLUMN weight numeric NOT NULL DEFAULT 1;
ALTER TABLE public.progress_records ADD COLUMN work_item_id uuid;
ALTER TABLE public.project_rap
  ADD COLUMN labor numeric NOT NULL DEFAULT 0,
  ADD COLUMN equipment numeric NOT NULL DEFAULT 0,
  ADD COLUMN operational numeric NOT NULL DEFAULT 0,
  ADD COLUMN subcontract numeric NOT NULL DEFAULT 0,
  ADD COLUMN other numeric NOT NULL DEFAULT 0;

INSERT INTO public.project_work_items(id,project_id,work_name)
VALUES ('12345678-1234-4234-8234-123456789029','12345678-1234-4234-8234-123456789010','Synthetic Work');

UPDATE public.progress_records SET work_item_id='12345678-1234-4234-8234-123456789029',progress_percentage=.7;
UPDATE public.project_rap SET material=100000 WHERE project_id='12345678-1234-4234-8234-123456789010';
ALTER TABLE public.progress_records ALTER COLUMN work_item_id SET NOT NULL;
