begin;

insert into auth.users(id,email) values
  ('13000000-0000-4000-8000-000000000001','resources-a@example.invalid'),
  ('13000000-0000-4000-8000-000000000002','resources-b@example.invalid'),
  ('13000000-0000-4000-8000-000000000003','resources-staff@example.invalid');
insert into public.companies(id,name) values
  ('23000000-0000-4000-8000-000000000001','Uji A'),
  ('23000000-0000-4000-8000-000000000002','Uji B');
insert into public.company_accounts(user_id,company_id,access_role,full_name) values
  ('13000000-0000-4000-8000-000000000001','23000000-0000-4000-8000-000000000001','company_admin','Admin A'),
  ('13000000-0000-4000-8000-000000000002','23000000-0000-4000-8000-000000000002','company_admin','Admin B'),
  ('13000000-0000-4000-8000-000000000003','23000000-0000-4000-8000-000000000001','staff','Staf A');

set local role authenticated;
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000001',true);
insert into public.company_projects(id,code,name) values
  ('33000000-0000-4000-8000-000000000001','A1','Proyek A1'),
  ('33000000-0000-4000-8000-000000000002','A2','Proyek A2');
insert into public.company_master_data(id,kind,name,code,unit) values
  ('43000000-0000-4000-8000-000000000001','employee','Karyawan A','K01',null),
  ('43000000-0000-4000-8000-000000000002','equipment','Alat A','A01',null),
  ('43000000-0000-4000-8000-000000000003','goods','Semen','B01','sak');
insert into public.company_material_stocks(project_id,goods_id,name,unit,quantity,minimum_quantity)
values ('33000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000003','Semen','sak',10,3);
insert into public.company_worker_assignments(project_id,employee_id,worker_code,worker_name,starts_on,ends_on)
values ('33000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000001','K01','Karyawan A','2026-11-10','2026-11-14');
insert into public.company_equipment_assignments(project_id,equipment_id,equipment_code,name,starts_on)
values ('33000000-0000-4000-8000-000000000001','43000000-0000-4000-8000-000000000002','A01','Alat A','2026-11-10');

do $$
begin
  begin
    insert into public.company_worker_assignments(project_id,employee_id,worker_code,worker_name,starts_on)
    values ('33000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000001','K01','Karyawan A','2026-11-14');
    raise exception 'Bentrok pada tanggal selesai lolos.';
  exception when exclusion_violation then null;
  end;
  begin
    insert into public.company_equipment_assignments(project_id,equipment_id,equipment_code,name,starts_on)
    values ('33000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000002','A01','Alat A','2026-11-20');
    raise exception 'Bentrok alat tanpa tanggal selesai lolos.';
  exception when exclusion_violation then null;
  end;
  begin
    update public.company_worker_assignments set project_id='33000000-0000-4000-8000-000000000002';
    raise exception 'Proyek penempatan lama bisa ditimpa.';
  exception when check_violation then null;
  end;
end $$;
insert into public.company_worker_assignments(project_id,employee_id,worker_code,worker_name,starts_on)
values ('33000000-0000-4000-8000-000000000002','43000000-0000-4000-8000-000000000001','K01','Karyawan A','2026-11-15');

select public.set_company_staff_access('13000000-0000-4000-8000-000000000003','{"progress":"read"}');
select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000003',true);
do $$
begin
  if (select count(*) from public.company_worker_assignments) <> 2
    or exists(select 1 from public.project_resource_choices('employee')) then
    raise exception 'Izin baca sumber daya keliru.';
  end if;
  update public.company_material_stocks set quantity=0;
  if found then raise exception 'Staf baca dapat mengubah saldo.'; end if;
end $$;

select set_config('request.jwt.claim.sub','13000000-0000-4000-8000-000000000002',true);
insert into public.company_projects(id,code,name) values ('33000000-0000-4000-8000-000000000003','B1','Proyek B1');
insert into public.company_master_data(id,kind,name,code) values
  ('43000000-0000-4000-8000-000000000004','employee','Karyawan B','K01');
insert into public.company_worker_assignments(project_id,employee_id,worker_code,worker_name,starts_on)
values ('33000000-0000-4000-8000-000000000003','43000000-0000-4000-8000-000000000004','K01','Karyawan B','2026-11-10');
do $$
begin
  if exists(select 1 from public.company_material_stocks)
    or (select count(*) from public.company_worker_assignments) <> 1
    or (select name from public.project_resource_choices('employee')) is distinct from 'Karyawan B' then
    raise exception 'Data sumber daya lintas perusahaan terlihat.';
  end if;
  begin
    insert into public.company_worker_assignments(project_id,employee_id,worker_code,worker_name,starts_on)
    values ('33000000-0000-4000-8000-000000000003','43000000-0000-4000-8000-000000000001','K01','Karyawan A','2026-11-30');
    raise exception 'Karyawan perusahaan lain dapat dipilih.';
  exception when foreign_key_violation then null;
  end;
end $$;
rollback;
