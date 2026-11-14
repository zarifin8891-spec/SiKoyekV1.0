begin;

create function sikoyek_private.company_user_directory()
returns table (id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security definer set search_path = ''
as $$
  select a.user_id, a.full_name, u.email::text, a.access_role, a.is_active
  from public.company_accounts a
  join auth.users u on u.id = a.user_id
  where a.company_id = sikoyek_private.active_company('company_admin')
  order by a.full_name, a.user_id;
$$;

create function public.company_user_directory()
returns table (id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security invoker set search_path = ''
as $$ select * from sikoyek_private.company_user_directory(); $$;

revoke all on function sikoyek_private.company_user_directory(), public.company_user_directory() from public, anon;
grant execute on function sikoyek_private.company_user_directory(), public.company_user_directory() to authenticated;
grant update (full_name, is_active) on public.company_accounts to service_role;

commit;
