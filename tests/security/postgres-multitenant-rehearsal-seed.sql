-- Synthetic MASTER data with overlapping reference names for the import checks.
INSERT INTO auth.users(id,email) VALUES ('11111111-1111-4111-8111-111111111111','master@preview.invalid');
INSERT INTO public.profiles(id,full_name,email,role_id)
SELECT '11111111-1111-4111-8111-111111111111','Admin MASTER','master@preview.invalid',id
FROM public.roles WHERE name='ADMIN';

INSERT INTO public.project_categories(name) VALUES ('Bangunan');
INSERT INTO public.project_managers(name,code) VALUES ('Pengawas Uji','PM-01');
INSERT INTO public.payment_methods(name) VALUES ('Transfer');
INSERT INTO public.transaction_categories(name) VALUES ('Material');

INSERT INTO public.projects(id,project_code,project_name,contract_value)
VALUES ('10000000-0000-4000-8000-000000000001','DEMO-001','Proyek MASTER',300000);
INSERT INTO public.project_rap(project_id,material)
VALUES ('10000000-0000-4000-8000-000000000001',100000);
INSERT INTO public.project_work_items(id,project_id,work_name,weight)
VALUES ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Pondasi',1);
INSERT INTO public.progress_records(project_id,work_item_id,progress_date,progress_percentage,updated_by)
VALUES ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',current_date,.7,'11111111-1111-4111-8111-111111111111');
INSERT INTO public.financial_transactions(project_id,transaction_date,transaction_type,category,description,amount,input_by)
VALUES ('10000000-0000-4000-8000-000000000001',current_date,'KELUAR','Material','Synthetic transaction',12345.67,'11111111-1111-4111-8111-111111111111');
