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


insert into public.project_categories(name,sort_order) values ('Konstruksi',1);
insert into public.goods_master(code,name,unit) values ('G01','Semen','sak');
insert into public.project_material_stocks(project_id,goods_id,name,unit,quantity,minimum_quantity)
select '35000000-0000-4000-8000-000000000001',id,name,unit,10,3 from public.goods_master;
insert into public.project_field_logs(project_id,logged_at,description)
values ('35000000-0000-4000-8000-000000000001',now(),'Pengecoran');
insert into public.project_weather_observations(project_id,observed_at,condition,temperature_c)
values ('35000000-0000-4000-8000-000000000001',now(),'Cerah',28);
insert into public.project_document_links(project_id,title,url)
values ('35000000-0000-4000-8000-000000000001','Dokumen Uji','https://example.invalid/');

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000002',true);
insert into public.project_categories(name) values ('Konstruksi');
do $$
begin
  if (select count(*) from public.project_categories) <> 1
    or exists(select 1 from public.goods_master) or exists(select 1 from public.project_material_stocks)
    or exists(select 1 from public.project_field_logs) or exists(select 1 from public.project_weather_observations)
    or exists(select 1 from public.project_document_links) then
    raise exception 'Master Data atau data lapangan terlihat lintas perusahaan.';
  end if;
  begin
    insert into public.project_field_logs(project_id,logged_at,description)
    values ('35000000-0000-4000-8000-000000000001',now(),'Akses silang');
    raise exception 'Log lintas perusahaan dapat ditulis.';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000003',true);
do $$
begin
  if exists(select 1 from public.project_categories) or exists(select 1 from public.project_field_logs)
    or exists(select 1 from public.project_document_links) then
    raise exception 'Data operasional terlihat untuk Admin Platform.';
  end if;
end $$;

select set_config('request.jwt.claim.sub','15000000-0000-4000-8000-000000000001',true);
do $$
begin
  if not exists (select 1 from public.company_master_data where name='Konstruksi' and kind='project_category')
    or not exists (select 1 from public.project_material_stocks where quantity=10)
    or not exists (select 1 from public.project_field_logs where description='Pengecoran') then
    raise exception 'Data MASTER tidak tersimpan pada perusahaan yang aktif.';
  end if;
  begin
    insert into public.goods_master(name,kind) values ('Kategori Salah','employee');
    raise exception 'Jenis katalog yang salah dapat ditulis melalui view barang.';
  exception when with_check_option_violation then null;
  end;
end $$;
rollback;
