begin;

create function public.set_company_staff_access(staff_id uuid, access_settings jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.company_accounts a
    where a.user_id = staff_id and a.access_role = 'staff' and a.is_active
      and a.company_id = (select sikoyek_private.active_company('company_admin'))
  ) then
    raise exception 'Hanya Admin Perusahaan yang dapat mengatur akses staf aktif di perusahaannya.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(access_settings) is distinct from 'object' or access_settings = '{}'::jsonb then
    raise exception 'Pengaturan akses tidak valid.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_each_text(access_settings) entry
    where entry.key not in ('master_data', 'projects', 'transactions')
      or entry.value is null or entry.value not in ('none', 'read', 'write')
  ) then
    raise exception 'Modul atau tingkat akses tidak valid.' using errcode = '22023';
  end if;

  -- Serialize changes made by different admins to the same staff account.
  perform pg_advisory_xact_lock(hashtextextended('company_staff_access:' || staff_id::text, 0));

  delete from public.company_staff_permissions
  where user_id = staff_id
    and access_settings ->> module = 'none';

  insert into public.company_staff_permissions (user_id, module, can_write)
  select staff_id, entry.key, entry.value = 'write'
  from jsonb_each_text(access_settings) entry
  where entry.value in ('read', 'write')
  on conflict (user_id, module) do update set can_write = excluded.can_write;
end;
$$;

revoke all on function public.set_company_staff_access(uuid, jsonb) from public, anon;
grant execute on function public.set_company_staff_access(uuid, jsonb) to authenticated;

commit;
