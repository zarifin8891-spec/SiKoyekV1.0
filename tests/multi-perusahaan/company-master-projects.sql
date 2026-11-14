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

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000002',true);
insert into public.projects(project_code,project_name) values ('P001','Proyek B');
do $$
begin
  if (select count(*) from public.projects) <> 1
    or (select project_name from public.projects) is distinct from 'Proyek B' then
    raise exception 'Daftar proyek lintas perusahaan terlihat.';
  end if;
  update public.projects set location='Lokasi silang'
  where id='35000000-0000-4000-8000-000000000001';
  if found then raise exception 'Proyek perusahaan lain dapat diubah.'; end if;
end $$;

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000003',true);
do $$
begin
  if exists(select 1 from public.projects) then raise exception 'Admin Platform dapat melihat proyek.'; end if;
end $$;

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000001',true);
do $$
begin
  update public.projects set end_date='2026-12-10' where project_code='P001';
  if not found or not exists (
    select 1 from public.company_projects
    where code='P001' and name='Proyek A' and location='Lokasi A' and ends_on='2026-12-10'
  ) then
    raise exception 'Perubahan dari tampilan MASTER tidak tersimpan ke data perusahaan.';
  end if;
end $$;
rollback;
