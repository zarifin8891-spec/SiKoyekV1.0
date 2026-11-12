-- Run only against a disposable database after applying the company foundation.
begin;

insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'platform@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'admin-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000003', 'admin-b@example.invalid'),
  ('10000000-0000-4000-8000-000000000004', 'staff-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000005', 'spare@example.invalid');
insert into public.companies (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Uji Perusahaan A'),
  ('20000000-0000-4000-8000-000000000002', 'Uji Perusahaan B');
insert into public.company_accounts (user_id, access_role, full_name)
values ('10000000-0000-4000-8000-000000000001', 'platform_admin', 'Admin Platform');

set local role service_role;
do $$
declare
  platform constant uuid := '10000000-0000-4000-8000-000000000001';
  admin_a constant uuid := '10000000-0000-4000-8000-000000000002';
  admin_b constant uuid := '10000000-0000-4000-8000-000000000003';
  staff_a constant uuid := '10000000-0000-4000-8000-000000000004';
  spare constant uuid := '10000000-0000-4000-8000-000000000005';
  company_a constant uuid := '20000000-0000-4000-8000-000000000001';
  company_b constant uuid := '20000000-0000-4000-8000-000000000002';
begin
  perform public.attach_new_company_account(platform,admin_a,company_a,'company_admin','Admin A');
  perform public.attach_new_company_account(platform,admin_b,company_b,'company_admin','Admin B');
  perform public.attach_new_company_account(admin_a,staff_a,company_a,'staff','Staf A');

  begin
    perform public.attach_new_company_account(admin_a,spare,company_b,'staff','Akses silang');
    raise exception 'Admin A dapat membuat staf untuk Perusahaan B';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.attach_new_company_account(platform,spare,company_a,'staff','Staf dari platform');
    raise exception 'Admin Platform dapat membuat staf';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.attach_new_company_account(admin_a,spare,company_a,'company_admin','Admin tambahan');
    raise exception 'Admin Perusahaan dapat membuat Admin Perusahaan';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
begin
  if (select count(*) from public.companies) <> 2
    or exists(select 1 from public.company_accounts where access_role = 'staff') then
    raise exception 'Batas akses Admin Platform tidak sesuai';
  end if;
  if has_function_privilege(current_user, 'public.attach_new_company_account(uuid,uuid,uuid,text,text)', 'EXECUTE') then
    raise exception 'RPC server dapat dipanggil langsung dari klien';
  end if;
end $$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$
begin
  if (select count(*) from public.companies) <> 1
    or (select count(*) from public.company_accounts) <> 2
    or exists(select 1 from public.company_accounts where company_id = '20000000-0000-4000-8000-000000000002') then
    raise exception 'Isolasi pembacaan akun antarperusahaan gagal';
  end if;
  update public.companies set name='Tidak diizinkan';
  if found then raise exception 'Admin Perusahaan dapat mengubah perusahaan'; end if;
end $$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
do $$
begin
  if (select count(*) from public.company_accounts) <> 1 then
    raise exception 'Staf dapat membaca akun pengguna lain';
  end if;
end $$;

reset role;
update public.companies set is_active=false where id='20000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$
begin
  if exists(select 1 from public.companies) or (select sikoyek_private.active_company()) is not null then
    raise exception 'Akun masih memiliki akses ke perusahaan nonaktif';
  end if;
end $$;

rollback;
