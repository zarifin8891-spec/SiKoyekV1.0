-- STAGING CANDIDATE ONLY. NOT AUTHORIZED FOR PRODUCTION.
-- Applies to the 15 public SiKoyek tables audited on 2026-11-08 in MASTER and KONSTRUVA.
-- PREREQUISITES: isolated database built from the exact tenant schema/migrations; full tests.
-- Never paste directly in a production SQL editor.
-- SELECT access to finance/RAP is intentionally restricted: current Dashboard and
-- security_invoker project_summary/project_cost_control views MUST be adapted before rollout.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';

-- Abort before destructive changes if the tenant inventory drifts.
DO $preflight$
DECLARE
  expected text[] := ARRAY['audit_logs','financial_transactions','health_rules','payment_methods','permissions','profiles','progress_records','project_categories','project_managers','project_rap','project_work_items','projects','role_permissions','roles','transaction_categories'];
  actual text[];
  r record;
BEGIN
  SELECT array_agg(tablename::text ORDER BY tablename::text COLLATE "C") INTO actual
  FROM pg_tables WHERE schemaname='public';
  IF actual IS DISTINCT FROM (SELECT array_agg(x ORDER BY x COLLATE "C") FROM unnest(expected) x) THEN
    RAISE EXCEPTION 'SiKoyek public table drift: actual %, expected %', actual, (SELECT array_agg(x ORDER BY x COLLATE "C") FROM unnest(expected) x);
  END IF;
  FOR r IN SELECT c.relname, c.relrowsecurity FROM pg_class c
      WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p')
  LOOP
    IF NOT r.relrowsecurity THEN
      RAISE EXCEPTION 'RLS not enabled on public.%', r.relname;
    END IF;
  END LOOP;
  -- Only known permissive legacy policies may be replaced. Any existing restrictive
  -- or third-party policy must be manually reviewed rather than silently deleted.
  IF EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public'
      AND (
         p.roles::text <> '{authenticated}'
         OR (p.cmd IN ('SELECT','UPDATE','DELETE') AND p.qual IS DISTINCT FROM 'true')
         OR (p.cmd IN ('INSERT','UPDATE') AND p.with_check IS DISTINCT FROM 'true')
         OR p.cmd NOT IN ('SELECT','INSERT','UPDATE','DELETE')
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected policy definitions: manual review required';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public') <> 41 THEN
    RAISE EXCEPTION 'Legacy policy count drift; inspect pg_policies before proceeding';
  END IF;
END;
$preflight$;

-- Private schema is not exposed by Supabase Data API.
CREATE SCHEMA IF NOT EXISTS sikoyek_authz;
REVOKE ALL ON SCHEMA sikoyek_authz FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA sikoyek_authz TO authenticated;

CREATE OR REPLACE FUNCTION sikoyek_authz.active_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr JOIN public.roles rr ON rr.id=pr.role_id
    WHERE pr.id=(SELECT auth.uid()) AND pr.is_active IS TRUE AND rr.is_active IS TRUE
  )
$fn$;
REVOKE ALL ON FUNCTION sikoyek_authz.active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sikoyek_authz.active_user() TO authenticated;

CREATE OR REPLACE FUNCTION sikoyek_authz.can(p_module text,p_action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
      JOIN public.roles rr ON rr.id=pr.role_id
      JOIN public.role_permissions rp ON rp.role_id=rr.id
      JOIN public.permissions per ON per.id=rp.permission_id
    WHERE pr.id=(SELECT auth.uid()) AND pr.is_active IS TRUE AND rr.is_active IS TRUE
      AND upper(per.action)=upper(p_action)
      AND (CASE WHEN upper(per.module) IN ('FINANCE','KEUANGAN') THEN 'KEUANGAN' ELSE upper(per.module) END)
       =  (CASE WHEN upper(p_module) IN ('FINANCE','KEUANGAN') THEN 'KEUANGAN' ELSE upper(p_module) END)
  )
$fn$;
REVOKE ALL ON FUNCTION sikoyek_authz.can(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sikoyek_authz.can(text,text) TO authenticated;

-- Remove the mutually OR-ed unconditional legacy policies after preflight.
-- The old policy NAME differs across MASTER/KONSTRUVA; definitions are verified above.
DO $drop_legacy$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',r.policyname,r.tablename);
  END LOOP;
END;
$drop_legacy$;

-- Authenticated users do not inherit administrative writes to security tables.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT,UPDATE,DELETE ON
  public.profiles,public.roles,public.permissions,public.role_permissions,
  public.audit_logs,public.health_rules FROM authenticated;
REVOKE DELETE ON public.project_rap FROM authenticated;

-- Dedicated user/role metadata reads. The Edge Function uses the service_role.
CREATE POLICY sikoyek_profiles_read ON public.profiles FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid()) OR (SELECT sikoyek_authz.can('USERS','VIEW')));
CREATE POLICY sikoyek_roles_read ON public.roles FOR SELECT TO authenticated
 USING ((SELECT sikoyek_authz.active_user()));
CREATE POLICY sikoyek_permissions_read ON public.permissions FOR SELECT TO authenticated
 USING ((SELECT sikoyek_authz.active_user()));
CREATE POLICY sikoyek_role_permissions_read ON public.role_permissions FOR SELECT TO authenticated
 USING (role_id=(SELECT pr.role_id FROM public.profiles pr WHERE pr.id=(SELECT auth.uid()))
        OR (SELECT sikoyek_authz.can('USERS','VIEW')));
-- The own-role subquery above can only see own profile via profiles SELECT, avoiding loops.


-- projects: PROJECTS
CREATE POLICY sikoyek_projects_select ON public.projects FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','VIEW')));
CREATE POLICY sikoyek_projects_insert ON public.projects FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('PROJECTS','ADD')));
CREATE POLICY sikoyek_projects_update ON public.projects FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('PROJECTS','EDIT')));
CREATE POLICY sikoyek_projects_delete ON public.projects FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','DELETE')));

-- project_work_items: PROJECTS
CREATE POLICY sikoyek_project_work_items_select ON public.project_work_items FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','VIEW')));
CREATE POLICY sikoyek_project_work_items_insert ON public.project_work_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('PROJECTS','ADD')));
CREATE POLICY sikoyek_project_work_items_update ON public.project_work_items FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('PROJECTS','EDIT')));
CREATE POLICY sikoyek_project_work_items_delete ON public.project_work_items FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROJECTS','DELETE')));

-- project_rap: RAP
CREATE POLICY sikoyek_project_rap_select ON public.project_rap FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('RAP','VIEW')));
CREATE POLICY sikoyek_project_rap_insert ON public.project_rap FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('RAP','ADD')));
CREATE POLICY sikoyek_project_rap_update ON public.project_rap FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('RAP','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('RAP','EDIT')));

-- progress_records: PROGRESS
CREATE POLICY sikoyek_progress_records_select ON public.progress_records FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('PROGRESS','VIEW')));
CREATE POLICY sikoyek_progress_records_insert ON public.progress_records FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('PROGRESS','ADD')));
CREATE POLICY sikoyek_progress_records_update ON public.progress_records FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROGRESS','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('PROGRESS','EDIT')));
CREATE POLICY sikoyek_progress_records_delete ON public.progress_records FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('PROGRESS','DELETE')));

-- financial_transactions: KEUANGAN
CREATE POLICY sikoyek_financial_transactions_select ON public.financial_transactions FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('KEUANGAN','VIEW')));
CREATE POLICY sikoyek_financial_transactions_insert ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('KEUANGAN','ADD')));
CREATE POLICY sikoyek_financial_transactions_update ON public.financial_transactions FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('KEUANGAN','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('KEUANGAN','EDIT')));
CREATE POLICY sikoyek_financial_transactions_delete ON public.financial_transactions FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('KEUANGAN','DELETE')));

-- project_categories: MASTER_DATA
CREATE POLICY sikoyek_project_categories_select ON public.project_categories FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')));
CREATE POLICY sikoyek_project_categories_insert ON public.project_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','ADD')));
CREATE POLICY sikoyek_project_categories_update ON public.project_categories FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT')));
CREATE POLICY sikoyek_project_categories_delete ON public.project_categories FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','DELETE')));

-- project_managers: MASTER_DATA
CREATE POLICY sikoyek_project_managers_select ON public.project_managers FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')));
CREATE POLICY sikoyek_project_managers_insert ON public.project_managers FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','ADD')));
CREATE POLICY sikoyek_project_managers_update ON public.project_managers FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT')));
CREATE POLICY sikoyek_project_managers_delete ON public.project_managers FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','DELETE')));

-- payment_methods: MASTER_DATA
CREATE POLICY sikoyek_payment_methods_select ON public.payment_methods FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')));
CREATE POLICY sikoyek_payment_methods_insert ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','ADD')));
CREATE POLICY sikoyek_payment_methods_update ON public.payment_methods FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT')));
CREATE POLICY sikoyek_payment_methods_delete ON public.payment_methods FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','DELETE')));

-- transaction_categories: MASTER_DATA
CREATE POLICY sikoyek_transaction_categories_select ON public.transaction_categories FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','VIEW')));
CREATE POLICY sikoyek_transaction_categories_insert ON public.transaction_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','ADD')));
CREATE POLICY sikoyek_transaction_categories_update ON public.transaction_categories FOR UPDATE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT'))) WITH CHECK ((SELECT sikoyek_authz.can('MASTER_DATA','EDIT')));
CREATE POLICY sikoyek_transaction_categories_delete ON public.transaction_categories FOR DELETE TO authenticated
  USING ((SELECT sikoyek_authz.can('MASTER_DATA','DELETE')));

-- health_rules: DASHBOARD
CREATE POLICY sikoyek_health_rules_select ON public.health_rules FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('DASHBOARD','VIEW')));

-- audit_logs: USERS
CREATE POLICY sikoyek_audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING ((SELECT sikoyek_authz.can('USERS','VIEW')));

-- Only finance-authorized roles can query security_invoker project_summary
-- with fully-populated financial columns; restricted role Dashboard must use
-- separate permission-safe data source prior to production.
DO $postflight$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public') <> 41 THEN
   RAISE EXCEPTION 'Unexpected number of hardening policies';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public'
           AND (qual='true' OR with_check='true')) THEN
   RAISE EXCEPTION 'Unrestricted policy still present';
 END IF;
END;
$postflight$;
COMMIT;
