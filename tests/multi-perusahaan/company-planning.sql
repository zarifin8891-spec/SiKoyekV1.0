begin;
insert into auth.users (id,email) values
  ('12000000-0000-4000-8000-000000000001','plan-a@example.invalid'),
  ('12000000-0000-4000-8000-000000000002','plan-b@example.invalid'),
  ('12000000-0000-4000-8000-000000000003','plan-staff@example.invalid'),
  ('12000000-0000-4000-8000-000000000004','plan-platform@example.invalid');
insert into public.companies (id,name) values
  ('22000000-0000-4000-8000-000000000001','Rencana A'),
  ('22000000-0000-4000-8000-000000000002','Rencana B');
insert into public.company_accounts (user_id,company_id,access_role,full_name) values
  ('12000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','company_admin','A'),
  ('12000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000002','company_admin','B'),
  ('12000000-0000-4000-8000-000000000003','22000000-0000-4000-8000-000000000001','staff','Staf'),
  ('12000000-0000-4000-8000-000000000004',null,'platform_admin','Platform');
set local role authenticated;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
insert into public.company_projects (id,code,name) values
  ('32000000-0000-4000-8000-000000000001','R01','Proyek A'),
  ('32000000-0000-4000-8000-000000000003','R02','Proyek A2');
insert into public.company_project_rap (project_id, material) values ('32000000-0000-4000-8000-000000000001',1000);
insert into public.company_work_items (id,project_id,work_name,weight,duration_days)
values ('42000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','Pondasi',1,14);
select public.set_company_staff_access('12000000-0000-4000-8000-000000000003','{"progress":"write","rap":"none"}');

select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000002',true);
insert into public.company_projects (id,code,name) values ('32000000-0000-4000-8000-000000000002','R01','Proyek B');
insert into public.company_project_rap (project_id, labor) values ('32000000-0000-4000-8000-000000000002',2000);
insert into public.company_work_items (id,project_id,work_name,weight,duration_days)
values ('42000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000002','Atap',1,7);
insert into public.company_progress_records (project_id,work_item_id,progress_date,progress_percentage)
values ('32000000-0000-4000-8000-000000000002','42000000-0000-4000-8000-000000000002','2026-11-12',0.2);
do $$
begin
  if (select count(*) from public.company_project_rap) <> 1
    or (select count(*) from public.company_work_items) <> 1
    or (select count(*) from public.project_planning_choices()) <> 1
    or (select count(*) from public.company_progress_records) <> 1
    or exists(select 1 from public.project_progress_item_choices('32000000-0000-4000-8000-000000000001')) then
    raise exception 'Isolasi data proyek gagal.';
  end if;
  update public.company_project_rap set material=500 where project_id='32000000-0000-4000-8000-000000000001';
  if found then raise exception 'RAP perusahaan lain dapat diubah.'; end if;
  begin
    insert into public.company_progress_records (project_id,work_item_id,progress_date,progress_percentage)
    values ('32000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','2026-11-12',0.1);
    raise exception 'Progress lintas perusahaan diterima.';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000003',true);
insert into public.company_progress_records (project_id,work_item_id,progress_date,progress_percentage)
values ('32000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001','2026-11-12',0.25);
do $$
begin
  if (select count(*) from public.company_progress_records) <> 1
    or (select count(*) from public.project_progress_item_choices('32000000-0000-4000-8000-000000000001')) <> 1
    or exists(select 1 from public.company_project_rap)
    or exists(select 1 from public.company_work_items)
    or exists(select 1 from public.company_projects) then
    raise exception 'Izin Progress membocorkan data modul lain.';
  end if;
  begin
    insert into public.company_progress_records (project_id,work_item_id,progress_date,progress_percentage)
    values ('32000000-0000-4000-8000-000000000003','42000000-0000-4000-8000-000000000001','2026-11-12',0.1);
    raise exception 'Item dari proyek lain diterima.';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
select public.set_company_staff_access('12000000-0000-4000-8000-000000000003','{"progress":"read","rap":"read"}');
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000003',true);
do $$
begin
  if (select material from public.company_project_rap) is distinct from 1000::numeric then
    raise exception 'Akses baca RAP gagal.';
  end if;
  update public.company_progress_records set progress_percentage=1;
  if found then raise exception 'Staf baca dapat mengubah progress.'; end if;
end $$;

select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000004',true);
do $$
begin
  if exists(select 1 from public.project_planning_choices())
    or exists(select 1 from public.company_project_rap)
    or exists(select 1 from public.company_progress_records)
    or exists(select 1 from public.project_progress_item_choices('32000000-0000-4000-8000-000000000001')) then
    raise exception 'Admin Platform dapat membaca data operasional proyek.';
  end if;
end $$;
rollback;
