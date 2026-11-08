-- Disposable PostgreSQL 17 fixture, synthetic only. Execute in fresh isolated DB.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SET search_path=''
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;

CREATE TABLE public.roles (id uuid primary key, name text unique, is_active boolean not null default true);
CREATE TABLE public.profiles (id uuid primary key, role_id uuid references public.roles(id), is_active boolean not null default true);
CREATE TABLE public.permissions (id uuid primary key, module text, action text);
CREATE TABLE public.role_permissions (role_id uuid references public.roles(id),permission_id uuid references public.permissions(id),primary key(role_id,permission_id));
CREATE TABLE public.audit_logs (id uuid primary key, user_id uuid, action text);
CREATE TABLE public.financial_transactions (id uuid primary key, project_id uuid, amount numeric);
CREATE TABLE public.health_rules (id uuid primary key, warning_threshold numeric);
CREATE TABLE public.payment_methods (id uuid primary key, name text);
CREATE TABLE public.progress_records (id uuid primary key, project_id uuid, progress_percentage numeric);
CREATE TABLE public.project_categories (id uuid primary key, name text);
CREATE TABLE public.project_managers (id uuid primary key, name text);
CREATE TABLE public.project_rap (id uuid primary key, project_id uuid, material numeric);
CREATE TABLE public.project_work_items (id uuid primary key, project_id uuid, work_name text);
CREATE TABLE public.projects (id uuid primary key, project_name text);
CREATE TABLE public.transaction_categories (id uuid primary key, name text);

GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Exactly 15 tables, with the same *number and behavior* of permissive policies.
DO $legacy$
DECLARE t text; cmd text;
BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
 LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   FOR cmd IN SELECT unnest(
     CASE
       WHEN t IN ('audit_logs','health_rules','permissions','profiles','roles','role_permissions')
         THEN ARRAY['SELECT']
       WHEN t='project_rap' THEN ARRAY['SELECT','INSERT','UPDATE']
       ELSE ARRAY['SELECT','INSERT','UPDATE','DELETE']
     END
   ) LOOP
     EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated %s',
       'legacy_'||t||'_'||lower(cmd),t,cmd,
       CASE WHEN cmd='INSERT' THEN 'WITH CHECK (true)'
            WHEN cmd='UPDATE' THEN 'USING (true) WITH CHECK (true)'
            ELSE 'USING (true)' END);
   END LOOP;
 END LOOP;
END;
$legacy$;
INSERT INTO public.roles(id,name) VALUES ('22222222-2222-4222-8222-222222222222','ADMIN'),('33333333-3333-4333-8333-333333333333','PELAKSANA'),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DIREKTUR'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','KEUANGAN'),('cccccccc-cccc-4ccc-8ccc-cccccccccccc','MARKETING');
INSERT INTO public.profiles(id,role_id,is_active) VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',true),('77777777-7777-4777-8777-777777777777','33333333-3333-4333-8333-333333333333',true),('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true),('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true),('ffffffff-ffff-4fff-8fff-ffffffffffff','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true),('88888888-8888-4888-8888-888888888888','22222222-2222-4222-8222-222222222222',false);
INSERT INTO public.permissions(id,module,action) VALUES (md5('DASHBOARD_VIEW')::uuid,'DASHBOARD','VIEW'),(md5('PROJECTS_VIEW')::uuid,'PROJECTS','VIEW'),(md5('MASTER_DATA_VIEW')::uuid,'MASTER_DATA','VIEW'),(md5('PROJECTS_ADD')::uuid,'PROJECTS','ADD'),(md5('PROJECTS_EDIT')::uuid,'PROJECTS','EDIT'),(md5('PROJECTS_DELETE')::uuid,'PROJECTS','DELETE'),(md5('PROGRESS_VIEW')::uuid,'PROGRESS','VIEW'),(md5('PROGRESS_ADD')::uuid,'PROGRESS','ADD'),(md5('PROGRESS_EDIT')::uuid,'PROGRESS','EDIT'),(md5('PROGRESS_DELETE')::uuid,'PROGRESS','DELETE'),(md5('RAP_VIEW')::uuid,'RAP','VIEW'),(md5('RAP_ADD')::uuid,'RAP','ADD'),(md5('RAP_EDIT')::uuid,'RAP','EDIT'),(md5('RAP_DELETE')::uuid,'RAP','DELETE'),(md5('KEUANGAN_VIEW')::uuid,'KEUANGAN','VIEW'),(md5('KEUANGAN_ADD')::uuid,'KEUANGAN','ADD'),(md5('KEUANGAN_EDIT')::uuid,'KEUANGAN','EDIT'),(md5('KEUANGAN_DELETE')::uuid,'KEUANGAN','DELETE'),(md5('MASTER_DATA_ADD')::uuid,'MASTER_DATA','ADD'),(md5('MASTER_DATA_EDIT')::uuid,'MASTER_DATA','EDIT'),(md5('MASTER_DATA_DELETE')::uuid,'MASTER_DATA','DELETE'),(md5('USERS_VIEW')::uuid,'USERS','VIEW'),(md5('USERS_ADD')::uuid,'USERS','ADD'),(md5('USERS_EDIT')::uuid,'USERS','EDIT'),(md5('USERS_DELETE')::uuid,'USERS','DELETE');
INSERT INTO public.role_permissions(role_id,permission_id) VALUES ('22222222-2222-4222-8222-222222222222',md5('DASHBOARD_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROJECTS_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('MASTER_DATA_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('DASHBOARD_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('PROJECTS_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('MASTER_DATA_VIEW')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('DASHBOARD_VIEW')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('PROJECTS_VIEW')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('MASTER_DATA_VIEW')::uuid),('cccccccc-cccc-4ccc-8ccc-cccccccccccc',md5('DASHBOARD_VIEW')::uuid),('cccccccc-cccc-4ccc-8ccc-cccccccccccc',md5('PROJECTS_VIEW')::uuid),('cccccccc-cccc-4ccc-8ccc-cccccccccccc',md5('MASTER_DATA_VIEW')::uuid),('33333333-3333-4333-8333-333333333333',md5('DASHBOARD_VIEW')::uuid),('33333333-3333-4333-8333-333333333333',md5('PROJECTS_VIEW')::uuid),('33333333-3333-4333-8333-333333333333',md5('MASTER_DATA_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROJECTS_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROJECTS_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROJECTS_DELETE')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROGRESS_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROGRESS_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROGRESS_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('PROGRESS_DELETE')::uuid),('22222222-2222-4222-8222-222222222222',md5('RAP_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('RAP_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('RAP_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('RAP_DELETE')::uuid),('22222222-2222-4222-8222-222222222222',md5('KEUANGAN_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('KEUANGAN_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('KEUANGAN_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('KEUANGAN_DELETE')::uuid),('22222222-2222-4222-8222-222222222222',md5('MASTER_DATA_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('MASTER_DATA_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('MASTER_DATA_DELETE')::uuid),('22222222-2222-4222-8222-222222222222',md5('USERS_VIEW')::uuid),('22222222-2222-4222-8222-222222222222',md5('USERS_ADD')::uuid),('22222222-2222-4222-8222-222222222222',md5('USERS_EDIT')::uuid),('22222222-2222-4222-8222-222222222222',md5('USERS_DELETE')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('KEUANGAN_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('RAP_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('PROGRESS_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('USERS_VIEW')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('MASTER_DATA_ADD')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('MASTER_DATA_EDIT')::uuid),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',md5('MASTER_DATA_DELETE')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('KEUANGAN_VIEW')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('KEUANGAN_ADD')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('KEUANGAN_EDIT')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('KEUANGAN_DELETE')::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',md5('RAP_VIEW')::uuid),('cccccccc-cccc-4ccc-8ccc-cccccccccccc',md5('PROJECTS_ADD')::uuid),('cccccccc-cccc-4ccc-8ccc-cccccccccccc',md5('PROJECTS_EDIT')::uuid),('33333333-3333-4333-8333-333333333333',md5('PROGRESS_VIEW')::uuid),('33333333-3333-4333-8333-333333333333',md5('PROGRESS_ADD')::uuid),('33333333-3333-4333-8333-333333333333',md5('PROGRESS_EDIT')::uuid),('33333333-3333-4333-8333-333333333333',md5('PROGRESS_DELETE')::uuid);
INSERT INTO public.projects VALUES('12345678-1234-4234-8234-123456789010','TEST PROJECT');
INSERT INTO public.financial_transactions VALUES('12345678-1234-4234-8234-123456789011','12345678-1234-4234-8234-123456789010',10000);
INSERT INTO public.progress_records VALUES('12345678-1234-4234-8234-123456789020','12345678-1234-4234-8234-123456789010',50);
INSERT INTO public.project_rap VALUES('12345678-1234-4234-8234-123456789021','12345678-1234-4234-8234-123456789010',1000);
INSERT INTO public.payment_methods VALUES('12345678-1234-4234-8234-123456789022','Bank');
INSERT INTO public.audit_logs VALUES('12345678-1234-4234-8234-123456789023','11111111-1111-4111-8111-111111111111','TEST');
INSERT INTO public.health_rules VALUES('12345678-1234-4234-8234-123456789024',5);
