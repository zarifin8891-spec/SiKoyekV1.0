begin;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  is_active boolean not null default true
);
create unique index companies_name_unique on public.companies (lower(btrim(name)));

create table public.company_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete restrict,
  access_role text not null,
  full_name text not null check (length(btrim(full_name)) between 1 and 160),
  is_active boolean not null default true,
  constraint company_account_role_scope check (
    (access_role = 'platform_admin' and company_id is null)
    or (access_role in ('company_admin', 'staff') and company_id is not null)
  )
);
create index company_accounts_company_role on public.company_accounts (company_id, access_role);

alter table public.companies enable row level security;
alter table public.company_accounts enable row level security;
revoke all on public.companies, public.company_accounts from public, anon, authenticated;
grant select, insert (name), update (name, is_active) on public.companies to authenticated;
grant select on public.company_accounts to authenticated;
grant select on public.companies, public.company_accounts to service_role;

create schema if not exists sikoyek_private;
revoke all on schema sikoyek_private from public;
grant usage on schema sikoyek_private to authenticated;

create function sikoyek_private.active_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.company_accounts a
    where a.user_id = auth.uid() and a.access_role = 'platform_admin' and a.is_active
  );
$$;

create function sikoyek_private.active_company(required_role text default null)
returns uuid language sql stable security definer set search_path = ''
as $$
  select a.company_id
  from public.company_accounts a
  join public.companies c on c.id = a.company_id
  where a.user_id = auth.uid() and a.is_active and c.is_active
    and (required_role is null or a.access_role = required_role);
$$;

revoke all on function sikoyek_private.active_platform_admin(), sikoyek_private.active_company(text) from public;
grant execute on function sikoyek_private.active_platform_admin(), sikoyek_private.active_company(text) to authenticated;

create policy companies_read on public.companies for select to authenticated
using (
  (select sikoyek_private.active_platform_admin())
  or id = (select sikoyek_private.active_company())
);
create policy companies_create on public.companies for insert to authenticated
with check ((select sikoyek_private.active_platform_admin()));
create policy companies_update on public.companies for update to authenticated
using ((select sikoyek_private.active_platform_admin()))
with check ((select sikoyek_private.active_platform_admin()));

create policy company_accounts_read on public.company_accounts for select to authenticated
using (
  user_id = (select auth.uid())
  or (access_role = 'company_admin' and (select sikoyek_private.active_platform_admin()))
  or company_id = (select sikoyek_private.active_company('company_admin'))
);

-- Called only by the server after it verifies the caller and creates a new Auth account.
create function public.attach_new_company_account(
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
  if not found or new_user_id = caller_id or target_company_id is null or target_role is null or not (
    (caller.access_role = 'platform_admin' and target_role = 'company_admin')
    or (caller.access_role = 'company_admin' and caller.company_id = target_company_id and target_role = 'staff')
  ) then
    raise exception 'Akses pembuatan akun ditolak.' using errcode = '42501';
  end if;

  perform 1 from public.companies where id = target_company_id and is_active for share;
  if not found then
    raise exception 'Perusahaan tidak aktif atau tidak ditemukan.' using errcode = '42501';
  end if;

  insert into public.company_accounts (user_id, company_id, access_role, full_name)
  values (new_user_id, target_company_id, target_role, btrim(target_name));
end;
$$;

revoke all on function public.attach_new_company_account(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.attach_new_company_account(uuid, uuid, uuid, text, text) to service_role;

commit;
