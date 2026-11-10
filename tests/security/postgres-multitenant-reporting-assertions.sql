-- Deliberately different contracts, spending and progress for the two companies.
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',false);
UPDATE public.projects SET project_code='KON-001',contract_value=500000
WHERE id='20000000-0000-4000-8000-000000000003';
INSERT INTO public.project_work_items(id,project_id,work_name,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000003','Synthetic Work','konstruva');
INSERT INTO public.progress_records(id,project_id,work_item_id,progress_percentage,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000006',.1,'konstruva');
INSERT INTO public.project_rap(id,project_id,material,tenant_id)
VALUES ('20000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000003',50000,'konstruva');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $master_reporting$
DECLARE
  own_id uuid := '12345678-1234-4234-8234-123456789010';
  other_id uuid := '20000000-0000-4000-8000-000000000003';
BEGIN
  IF (SELECT array_agg((row->>'project_id')::uuid) FROM public.sikoyek_secure_project_summary() row) IS DISTINCT FROM ARRAY[own_id]
    OR (SELECT row->>'health_status' FROM public.sikoyek_secure_project_summary() row) IS DISTINCT FROM 'SEHAT'
    OR (SELECT sum((row->>'total_realization')::numeric) FROM public.sikoyek_secure_project_summary() row) IS DISTINCT FROM 10000::numeric
    OR (SELECT sum((row->>'realization')::numeric) FROM public.sikoyek_secure_project_cost_control() row) IS DISTINCT FROM 10000::numeric
    OR (SELECT array_agg(contract_value) FROM public.sikoyek_secure_project_contracts()) IS DISTINCT FROM ARRAY[300000000::numeric]
    OR public.sikoyek_secure_project_detail(other_id) IS NOT NULL
    OR (SELECT array_agg((row->>'id')::uuid) FROM public.sikoyek_secure_project_lifecycle(ARRAY[own_id,other_id]) row) IS DISTINCT FROM ARRAY[own_id]
  THEN RAISE EXCEPTION 'MASTER reporting crossed the company boundary'; END IF;

  BEGIN
    INSERT INTO public.progress_records(id,project_id,work_item_id,progress_percentage)
    VALUES(gen_random_uuid(),own_id,'20000000-0000-4000-8000-000000000006',.9);
    RAISE EXCEPTION 'Foreign work item accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    PERFORM contract_value FROM public.projects;
    RAISE EXCEPTION 'Raw contract column exposed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM FROM public.project_summary;
    RAISE EXCEPTION 'Raw summary view exposed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$master_reporting$;

SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',false);
DO $konstruva_reporting$
DECLARE
  own_id uuid := '20000000-0000-4000-8000-000000000003';
  other_id uuid := '12345678-1234-4234-8234-123456789010';
BEGIN
  IF EXISTS (SELECT FROM public.sikoyek_secure_project_summary() row WHERE row->>'project_id'=other_id::text)
    OR (SELECT row->>'health_status' FROM public.sikoyek_secure_project_summary() row WHERE row->>'project_id'=own_id::text) IS DISTINCT FROM 'BERISIKO'
    OR (SELECT sum((row->>'total_realization')::numeric) FROM public.sikoyek_secure_project_summary() row) IS DISTINCT FROM 25000::numeric
    OR (SELECT sum((row->>'realization')::numeric) FROM public.sikoyek_secure_project_cost_control() row) IS DISTINCT FROM 25000::numeric
    OR EXISTS (SELECT FROM public.sikoyek_secure_project_contracts() WHERE project_id=other_id)
    OR public.sikoyek_secure_project_detail(other_id) IS NOT NULL
    OR EXISTS (SELECT FROM public.sikoyek_secure_project_lifecycle(ARRAY[other_id]))
  THEN RAISE EXCEPTION 'KONSTRUVA reporting crossed the company boundary'; END IF;
END;
$konstruva_reporting$;

SELECT set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false);
DO $finance_reporting$
BEGIN
  IF EXISTS (SELECT FROM public.sikoyek_secure_project_summary() row
      WHERE row ?| ARRAY['project_progress','progress_total','health_status','health_gap','control_message'])
    OR (SELECT sum((row->>'total_realization')::numeric) FROM public.sikoyek_secure_project_summary() row) IS DISTINCT FROM 10000::numeric
  THEN RAISE EXCEPTION 'Finance scope exposed progress, health, or foreign costs'; END IF;
END;
$finance_reporting$;

SELECT set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
DO $field_worker$
BEGIN
  BEGIN
    PERFORM public.sikoyek_secure_project_summary();
    RAISE EXCEPTION 'Field worker can read privileged project costs';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$field_worker$;
RESET ROLE;
