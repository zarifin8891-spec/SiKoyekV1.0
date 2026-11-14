begin;

create table public.company_role_overrides (
  company_id uuid not null references public.companies(id) on delete cascade,
  role_name text not null references public.company_role_templates(name),
  grants jsonb not null check (jsonb_typeof(grants) = 'array'),
  primary key (company_id, role_name),
  check (role_name <> 'ADMIN')
);
alter table public.company_role_overrides enable row level security;
revoke all on public.company_role_overrides from public, anon, authenticated;
grant select on public.company_role_overrides to authenticated;
create policy company_role_overrides_read on public.company_role_overrides
  for select to authenticated
  using (company_id = (select sikoyek_private.active_company()));

create function sikoyek_private.effective_role_grants(company uuid, role_name text, defaults jsonb)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce((select r.grants from public.company_role_overrides r
    where r.company_id = $1 and r.role_name = $2), defaults);
$$;
revoke all on function sikoyek_private.effective_role_grants(uuid,text,jsonb) from public, anon;

create function public.save_company_role_grants(target_role text, new_grants jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller_company uuid := sikoyek_private.active_company('company_admin');
  allowed jsonb;
begin
  if caller_company is null then
    raise exception 'Hanya Admin Perusahaan aktif yang dapat mengubah hak akses.' using errcode = '42501';
  end if;
  if target_role is null or target_role = 'ADMIN' or not exists (
    select 1 from public.company_role_templates where name = target_role
  ) then
    raise exception 'Role ini tidak dapat diubah.' using errcode = '22023';
  end if;
  select grants into strict allowed from public.company_role_templates where name = 'ADMIN';
  if jsonb_typeof(new_grants) is distinct from 'array' or not (allowed @> new_grants) then
    raise exception 'Hak akses tidak valid.' using errcode = '22023';
  end if;

  insert into public.company_role_overrides (company_id, role_name, grants)
  values (caller_company, target_role, new_grants)
  on conflict (company_id, role_name) do update set grants = excluded.grants;
end;
$$;
revoke all on function public.save_company_role_grants(text,jsonb) from public, anon;
grant execute on function public.save_company_role_grants(text,jsonb) to authenticated;

create or replace function sikoyek_private.template_allows(module text, action text)
returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce((select sikoyek_private.effective_role_grants(a.company_id,t.name,t.grants) @> jsonb_build_array(jsonb_build_array(module,action))
  from public.company_accounts a join public.company_role_templates t on t.name=a.template_role
  where a.user_id=auth.uid()),true);
$$;
revoke all on function sikoyek_private.template_allows(text,text) from public,anon;
grant execute on function sikoyek_private.template_allows(text,text) to authenticated;

create or replace function sikoyek_private.company_for_operation(required_module text, needs_write boolean)
returns uuid language sql stable security definer set search_path = '' as $$
 select coalesce(sikoyek_private.active_company('company_admin'), case when exists (
  select 1 from public.company_accounts a
  left join public.company_role_templates t on t.name=a.template_role
  where a.user_id=auth.uid() and (
   (a.template_role is null and exists(select 1 from public.company_staff_permissions p
    where p.user_id=a.user_id and p.module=required_module and (not needs_write or p.can_write)))
   or (t.name is not null and exists(select 1 from jsonb_array_elements(sikoyek_private.effective_role_grants(a.company_id,t.name,t.grants)) g
    where g->>0 = case required_module when 'transactions' then 'KEUANGAN' else upper(required_module) end
    and ((not needs_write and g->>1='VIEW') or (needs_write and g->>1 in ('ADD','EDIT','DELETE')))))
  )
 ) then sikoyek_private.active_company('staff') end);
$$;

create or replace function sikoyek_private.company_user_directory()
returns table (id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security definer set search_path = '' as $$
 select a.user_id,a.full_name,u.email::text,a.access_role,a.is_active
 from public.company_accounts a join auth.users u on u.id=a.user_id
 where a.company_id=sikoyek_private.active_company()
 and (sikoyek_private.active_company('company_admin') is not null or exists (
   select 1 from public.company_accounts self join public.company_role_templates t on t.name=self.template_role
   where self.user_id=auth.uid() and sikoyek_private.effective_role_grants(self.company_id,t.name,t.grants) @> '[["USERS","VIEW"]]'::jsonb))
 order by a.full_name,a.user_id;
$$;
commit;
