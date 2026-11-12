-- Run against a disposable database with both multi-company migrations.
begin;
insert into auth.users (id,email) values
  ('11000000-0000-4000-8000-000000000001','platform-ops@example.invalid'),
  ('11000000-0000-4000-8000-000000000002','admin-a-ops@example.invalid'),
  ('11000000-0000-4000-8000-000000000003','admin-b-ops@example.invalid'),
  ('11000000-0000-4000-8000-000000000004','staff-a-ops@example.invalid');
insert into public.companies (id,name) values
  ('21000000-0000-4000-8000-000000000001','Operasional A'),
  ('21000000-0000-4000-8000-000000000002','Operasional B');
insert into public.company_accounts (user_id,company_id,access_role,full_name) values
  ('11000000-0000-4000-8000-000000000001',null,'platform_admin','Platform'),
  ('11000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000001','company_admin','Admin A'),
  ('11000000-0000-4000-8000-000000000003','21000000-0000-4000-8000-000000000002','company_admin','Admin B'),
  ('11000000-0000-4000-8000-000000000004','21000000-0000-4000-8000-000000000001','staff','Staf A');

set local role authenticated;
select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000002',true);
insert into public.company_projects (id,code,name,contract_value)
values ('31000000-0000-4000-8000-000000000001','P001','Proyek A',1000);
insert into public.company_master_data (id,kind,name)
values ('41000000-0000-4000-8000-000000000001','transaction_category','Material');
insert into public.company_transactions (project_id,category_id,transaction_date,transaction_type,amount)
values ('31000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',date '2026-11-12','KELUAR',150);
insert into public.company_staff_permissions (user_id,module)
values ('11000000-0000-4000-8000-000000000004','projects');

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000003',true);
insert into public.company_projects (id,code,name,contract_value)
values ('31000000-0000-4000-8000-000000000002','P001','Proyek B',3000);
insert into public.company_master_data (kind,name) values ('transaction_category','Material'), ('goods','Barang B');
do $$
begin
  if (select count(*) from public.company_projects) <> 1
    or (select count(*) from public.company_master_data) <> 2
    or (select count(*) from public.company_financial_report where spent = 0 and name = 'Proyek B') <> 1
    or exists(select 1 from public.company_transactions)
    or exists(select 1 from public.company_staff_permissions) then
    raise exception 'Pembacaan lintas perusahaan terdeteksi.';
  end if;
  update public.company_projects set name='Akses silang' where id='31000000-0000-4000-8000-000000000001';
  if found then raise exception 'Proyek perusahaan lain dapat diubah.'; end if;
  begin
    insert into public.company_transactions (project_id,transaction_date,transaction_type,amount)
    values ('31000000-0000-4000-8000-000000000001',date '2026-11-12','KELUAR',50);
    raise exception 'Transaksi lintas perusahaan lolos.';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.company_transactions (project_id,category_id,transaction_date,transaction_type,amount)
    values ('31000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000001',date '2026-11-12','KELUAR',50);
    raise exception 'Kategori lintas perusahaan lolos.';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.company_projects (company_id,code,name)
    values ('21000000-0000-4000-8000-000000000001','P999','Akses silang');
    raise exception 'Pemalsuan perusahaan lolos.';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000004',true);
do $$
begin
  if (select count(*) from public.company_projects) <> 1
    or exists(select 1 from public.company_master_data)
    or exists(select 1 from public.company_financial_report) then
    raise exception 'Hak akses baca staf tidak sesuai.';
  end if;
  update public.company_projects set name='Tidak diizinkan';
  if found then raise exception 'Staf dengan akses baca bisa menulis.'; end if;
end $$;

select set_config('request.jwt.claim.sub','11000000-0000-4000-8000-000000000001',true);
do $$
begin
  if exists(select 1 from public.company_projects) or exists(select 1 from public.company_master_data)
    or exists(select 1 from public.company_transactions) or exists(select 1 from public.company_financial_report) then
    raise exception 'Admin Platform dapat membaca data operasional.';
  end if;
end $$;
rollback;
