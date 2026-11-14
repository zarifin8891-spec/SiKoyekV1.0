begin;

create table sikoyek_private.platform_admin_guard (id boolean primary key check (id));
insert into sikoyek_private.platform_admin_guard values (true);
revoke all on sikoyek_private.platform_admin_guard from public, anon, authenticated, service_role;

create function sikoyek_private.keep_active_platform_admin()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.access_role = 'platform_admin' and old.is_active then
    if tg_op = 'UPDATE' then
      if new.access_role = 'platform_admin' and new.is_active then return new; end if;
    end if;
    update sikoyek_private.platform_admin_guard set id = true where id;
    if not exists (select 1 from public.company_accounts
      where access_role = 'platform_admin' and is_active and user_id <> old.user_id) then
      raise exception 'Admin Platform aktif terakhir harus dipertahankan.' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

revoke all on function sikoyek_private.keep_active_platform_admin() from public, anon, authenticated;
create trigger keep_active_platform_admin
before update of is_active, access_role or delete on public.company_accounts
for each row execute function sikoyek_private.keep_active_platform_admin();

create function sikoyek_private.platform_account_directory()
returns table (user_id uuid, company_id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security definer set search_path = ''
as $$
  select a.user_id, a.company_id, a.full_name, u.email::text, a.access_role, a.is_active
  from public.company_accounts a join auth.users u on u.id = a.user_id
  where sikoyek_private.active_platform_admin() and a.access_role in ('platform_admin', 'company_admin')
  order by a.full_name, a.user_id;
$$;

create function public.platform_account_directory()
returns table (user_id uuid, company_id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security invoker set search_path = ''
as $$ select * from sikoyek_private.platform_account_directory(); $$;

revoke all on function sikoyek_private.platform_account_directory(), public.platform_account_directory() from public, anon;
grant execute on function sikoyek_private.platform_account_directory(), public.platform_account_directory() to authenticated;

create or replace function public.attach_new_company_account(
  caller_id uuid,
  new_user_id uuid,
  target_company_id uuid,
  target_role text,
  target_name text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  caller public.company_accounts%rowtype;
begin
  select * into caller from public.company_accounts
  where user_id = caller_id and is_active for share;
  if not found or new_user_id = caller_id or target_role is null or not (
    (caller.access_role = 'platform_admin' and ((target_role = 'company_admin' and target_company_id is not null) or (target_role = 'platform_admin' and target_company_id is null)))
    or (caller.access_role = 'company_admin' and caller.company_id = target_company_id and target_role = 'staff')
  ) then
    raise exception 'Akses pembuatan akun ditolak.' using errcode = '42501';
  end if;

  if target_role <> 'platform_admin' then
    perform 1 from public.companies where id = target_company_id and is_active for share;
  if not found then
    raise exception 'Perusahaan tidak aktif atau tidak ditemukan.' using errcode = '42501';
  end if;

  end if;

  insert into public.company_accounts (user_id, company_id, access_role, full_name)
  values (new_user_id, target_company_id, target_role, btrim(target_name));
end;
$$;

commit;
