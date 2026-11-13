begin;
create table public.company_role_templates (
 name text primary key, description text, grants jsonb not null
);
alter table public.company_role_templates enable row level security;
revoke all on public.company_role_templates from public, anon, authenticated;
grant select on public.company_role_templates to authenticated;
create policy company_roles_read on public.company_role_templates for select to authenticated
using ((select sikoyek_private.active_company()) is not null);
insert into public.company_role_templates values
('ADMIN','Akses penuh sistem','[["DASHBOARD","VIEW"],["KEUANGAN","ADD"],["KEUANGAN","DELETE"],["KEUANGAN","EDIT"],["KEUANGAN","VIEW"],["LAPORAN","VIEW"],["MASTER_DATA","ADD"],["MASTER_DATA","DELETE"],["MASTER_DATA","EDIT"],["MASTER_DATA","VIEW"],["PROGRESS","ADD"],["PROGRESS","DELETE"],["PROGRESS","EDIT"],["PROGRESS","VIEW"],["PROJECTS","ADD"],["PROJECTS","DELETE"],["PROJECTS","EDIT"],["PROJECTS","VIEW"],["RAP","ADD"],["RAP","DELETE"],["RAP","EDIT"],["RAP","VIEW"],["USERS","ADD"],["USERS","DELETE"],["USERS","EDIT"],["USERS","VIEW"]]'),
('DIREKTUR','Monitoring portfolio dan pengambilan keputusan','[["DASHBOARD","VIEW"],["KEUANGAN","VIEW"],["LAPORAN","VIEW"],["MASTER_DATA","ADD"],["MASTER_DATA","DELETE"],["MASTER_DATA","EDIT"],["MASTER_DATA","VIEW"],["PROGRESS","VIEW"],["PROJECTS","VIEW"],["RAP","VIEW"],["USERS","VIEW"]]'),
('KEUANGAN','Pengelolaan transaksi dan kontrol keuangan','[["DASHBOARD","VIEW"],["KEUANGAN","ADD"],["KEUANGAN","DELETE"],["KEUANGAN","EDIT"],["KEUANGAN","VIEW"],["LAPORAN","VIEW"],["MASTER_DATA","VIEW"],["PROJECTS","VIEW"],["RAP","VIEW"]]'),
('MARKETING','Pengelolaan data proyek dan aktivitas pemasaran','[["DASHBOARD","VIEW"],["MASTER_DATA","VIEW"],["PROJECTS","ADD"],["PROJECTS","EDIT"],["PROJECTS","VIEW"]]'),
('PELAKSANA','Pengelolaan operasional dan progress proyek','[["DASHBOARD","VIEW"],["MASTER_DATA","VIEW"],["PROGRESS","ADD"],["PROGRESS","DELETE"],["PROGRESS","EDIT"],["PROGRESS","VIEW"],["PROJECTS","VIEW"]]');
alter table public.company_accounts add column template_role text references public.company_role_templates(name),
 add check (template_role is null or (access_role='staff' and template_role <> 'ADMIN'));
grant update (template_role) on public.company_accounts to service_role;

create function sikoyek_private.template_allows(module text, action text)
returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce((select t.grants @> jsonb_build_array(jsonb_build_array(module,action))
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
   or (t.name is not null and exists(select 1 from jsonb_array_elements(t.grants) g
    where g->>0 = case required_module when 'transactions' then 'KEUANGAN' else upper(required_module) end
    and ((not needs_write and g->>1='VIEW') or (needs_write and g->>1 in ('ADD','EDIT','DELETE')))))
  )
 ) then sikoyek_private.active_company('staff') end);
$$;

do $$
declare item record;
begin
 for item in select * from (values
 ('company_projects','PROJECTS'),('company_master_data','MASTER_DATA'),
 ('company_transactions','KEUANGAN'),('company_project_rap','RAP'),('company_work_items','RAP'),
 ('company_progress_records','PROGRESS'),('company_material_stocks','PROGRESS'),
 ('company_worker_assignments','PROGRESS'),('company_equipment_assignments','PROGRESS'),
 ('project_field_logs','PROGRESS'),('project_weather_observations','PROGRESS'),('project_document_links','KEUANGAN')
 ) as t(tbl,mod)
 loop
  execute format('create policy template_insert on public.%I as restrictive for insert to authenticated with check ((select sikoyek_private.template_allows(%L,%L)))',item.tbl,item.mod,'ADD');
  execute format('create policy template_update on public.%I as restrictive for update to authenticated using ((select sikoyek_private.template_allows(%L,%L))) with check ((select sikoyek_private.template_allows(%L,%L)))',item.tbl,item.mod,'EDIT',item.mod,'EDIT');
  execute format('create policy template_delete on public.%I as restrictive for delete to authenticated using ((select sikoyek_private.template_allows(%L,%L)))',item.tbl,item.mod,'DELETE');
 end loop;
end $$;

create or replace function sikoyek_private.company_user_directory()
returns table (id uuid, full_name text, email text, access_role text, is_active boolean)
language sql stable security definer set search_path = '' as $$
 select a.user_id,a.full_name,u.email::text,a.access_role,a.is_active
 from public.company_accounts a join auth.users u on u.id=a.user_id
 where a.company_id=sikoyek_private.active_company()
 and (sikoyek_private.active_company('company_admin') is not null or exists (
   select 1 from public.company_accounts self join public.company_role_templates t on t.name=self.template_role
   where self.user_id=auth.uid() and t.grants @> '[["USERS","VIEW"]]'::jsonb))
 order by a.full_name,a.user_id;
$$;
create function public.attach_company_account_with_template(caller_id uuid, new_user_id uuid,
 target_company_id uuid, target_role text, target_name text, selected_template text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 perform public.attach_new_company_account(caller_id,new_user_id,target_company_id,target_role,target_name);
 if selected_template is not null then
   update public.company_accounts set template_role=selected_template where user_id=new_user_id;
 end if;
end $$;
revoke all on function public.attach_company_account_with_template(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.attach_company_account_with_template(uuid,uuid,uuid,text,text,text) to service_role;
commit;
