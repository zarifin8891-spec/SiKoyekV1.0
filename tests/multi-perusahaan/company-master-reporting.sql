begin;
insert into auth.users (id,email) values
  ('15000000-0000-4000-8000-000000000001','master-a@example.invalid'),
  ('15000000-0000-4000-8000-000000000002','master-b@example.invalid'),
  ('15000000-0000-4000-8000-000000000003','master-platform@example.invalid');
insert into public.companies (id,name) values
  ('25000000-0000-4000-8000-000000000001','MASTER A'),
  ('25000000-0000-4000-8000-000000000002','MASTER B');
insert into public.company_accounts (user_id,company_id,access_role,full_name) values
  ('15000000-0000-4000-8000-000000000001','25000000-0000-4000-8000-000000000001','company_admin','Admin A'),
  ('15000000-0000-4000-8000-000000000002','25000000-0000-4000-8000-000000000002','company_admin','Admin B'),
  ('15000000-0000-4000-8000-000000000003',null,'platform_admin','Platform');

set local role authenticated;
select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000001',true);
insert into public.projects(id,project_code,project_name,owner_name,location,start_date)
values ('35000000-0000-4000-8000-000000000001','P001','Proyek A','Pemilik A','Lokasi A','2026-11-13');


insert into public.project_work_items(id,project_id,work_name,weight)
values ('45000000-0000-4000-8000-000000000001','35000000-0000-4000-8000-000000000001','Pondasi',1);
insert into public.progress_records(project_id,work_item_id,progress_date,progress_percentage)
values ('35000000-0000-4000-8000-000000000001','45000000-0000-4000-8000-000000000001','2026-11-13',0.4);
do $$
begin
  begin
    insert into public.progress_records(project_id,work_item_id,progress_date,progress_percentage)
    values ('35000000-0000-4000-8000-000000000001','45000000-0000-4000-8000-000000000001','2026-11-14',0.7);
    raise exception 'Total Progress di atas 100%% diterima.';
  exception when check_violation then null;
  end;
end $$;
insert into public.project_rap(project_id,material) values ('35000000-0000-4000-8000-000000000001',1000)
on conflict (project_id) do update set material=excluded.material;
insert into public.project_rap(project_id,material) values ('35000000-0000-4000-8000-000000000001',1200)
on conflict (project_id) do update set material=excluded.material;
insert into public.financial_transactions(project_id,transaction_date,transaction_type,category,amount,description)
values ('35000000-0000-4000-8000-000000000001','2026-11-13','KELUAR','Material',300,'Uji');
do $$
begin
  if not exists (select 1 from public.project_summary where project_progress=40 and total_rap=1200 and cash_out=300 and rap_consumption=25)
    or not exists (select 1 from public.project_cost_control where category_name='Material' and realization=300) then
    raise exception 'Angka laporan MASTER tidak sesuai.';
  end if;
end $$;
select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000002',true);
insert into public.projects(project_code,project_name) values ('P001','Proyek B');
do $$
begin
  if exists(select 1 from public.project_rap) or exists(select 1 from public.project_work_items)
    or exists(select 1 from public.progress_records) or exists(select 1 from public.financial_transactions)
    or not exists(select 1 from public.project_summary where project_name='Proyek B' and cash_out=0 and total_rap=0) then
    raise exception 'Data laporan lintas perusahaan terlihat.';
  end if;
end $$;
select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000003',true);
do $$
begin
  if exists(select 1 from public.project_summary) or exists(select 1 from public.financial_transactions)
    or exists(select 1 from public.project_rap) or exists(select 1 from public.progress_records) then
    raise exception 'Data laporan terlihat untuk Admin Platform.';
  end if;
end $$;
rollback;
