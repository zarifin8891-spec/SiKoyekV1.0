-- Additional target constraints observed during the read-only schema comparison.
ALTER TABLE public.projects DROP CONSTRAINT projects_project_code_key,
  ADD CONSTRAINT projects_company_code_key UNIQUE (tenant_id,project_code);
ALTER TABLE public.payment_methods DROP CONSTRAINT payment_methods_name_key;
ALTER TABLE public.transaction_categories DROP CONSTRAINT transaction_categories_name_key;
DROP INDEX public.project_categories_name_unique, public.project_managers_name_unique,
  public.project_managers_code_unique, public.payment_methods_name_unique,
  public.transaction_categories_name_unique;
CREATE UNIQUE INDEX project_categories_company_name_key ON public.project_categories (tenant_id,lower(name));
CREATE UNIQUE INDEX project_managers_company_name_key ON public.project_managers (tenant_id,lower(name));
CREATE UNIQUE INDEX project_managers_company_code_key ON public.project_managers (tenant_id,lower(code));
CREATE UNIQUE INDEX payment_methods_company_name_key ON public.payment_methods (tenant_id,lower(name));
CREATE UNIQUE INDEX transaction_categories_company_name_key ON public.transaction_categories (tenant_id,lower(name));

-- The optional actor remains nullable when an account is deleted.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_key UNIQUE (tenant_id,id);
ALTER TABLE public.progress_records DROP CONSTRAINT progress_records_updated_by_fkey,
  ADD CONSTRAINT progress_records_company_actor_fk FOREIGN KEY (tenant_id,updated_by)
    REFERENCES public.profiles(tenant_id,id) ON DELETE SET NULL (updated_by);
ALTER TABLE public.financial_transactions DROP CONSTRAINT financial_transactions_input_by_fkey,
  ADD CONSTRAINT financial_transactions_company_actor_fk FOREIGN KEY (tenant_id,input_by)
    REFERENCES public.profiles(tenant_id,id) ON DELETE SET NULL (input_by);
ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey,
  ADD CONSTRAINT audit_logs_company_actor_fk FOREIGN KEY (tenant_id,user_id)
    REFERENCES public.profiles(tenant_id,id) ON DELETE SET NULL (user_id);

-- Fixture imports one Auth identity. Production requires a supported Auth migration
-- or invitation and reconciliation against the actual imported user ID.
INSERT INTO auth.users(id,email) VALUES ('20000000-0000-4000-8000-000000000002','konstruva@preview.invalid');

-- Synthetic source role codes. Allocate separate role IDs by company.
INSERT INTO public.roles(tenant_id,name,is_active) VALUES
('konstruva','ADMIN',true),('konstruva','DIREKTUR',true),('konstruva','KEUANGAN',true),
('konstruva','MARKETING',true),('konstruva','PELAKSANA',true);

-- The read-only audit found matching permission pairs after normalization.
-- Reconfirm against the source snapshot before using the same mapping in production.
INSERT INTO public.role_permissions(role_id,permission_id)
SELECT target.id,mapping.permission_id
FROM public.roles AS target
JOIN public.roles AS source ON source.tenant_id='master' AND source.name=target.name
JOIN public.role_permissions AS mapping ON mapping.role_id=source.id
WHERE target.tenant_id='konstruva';

INSERT INTO public.profiles(id,tenant_id,full_name,email,role_id)
SELECT '20000000-0000-4000-8000-000000000002','konstruva','Admin KONSTRUVA','konstruva@preview.invalid',id
FROM public.roles WHERE tenant_id='konstruva' AND name='ADMIN';

INSERT INTO public.project_categories(tenant_id,name) VALUES ('konstruva','Bangunan'),('konstruva','Renovasi');
INSERT INTO public.project_managers(tenant_id,name,code) VALUES ('konstruva','Pengawas Uji','PM-01');
INSERT INTO public.payment_methods(tenant_id,name) VALUES ('konstruva','Transfer'),('konstruva','Tunai'),('konstruva','Giro');
INSERT INTO public.transaction_categories(tenant_id,name)
SELECT 'konstruva', name FROM unnest(ARRAY['Material','Upah','Alat','Operasional','Subkon','Administrasi','Transport','Lain-lain']) AS name;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',false);
DO $incoming$
BEGIN
  IF public.sikoyek_current_company()->>'id' IS DISTINCT FROM 'konstruva'
    OR (SELECT count(*) FROM public.project_categories)<>2
    OR (SELECT count(*) FROM public.project_managers)<>1
    OR (SELECT count(*) FROM public.payment_methods)<>3
    OR (SELECT count(*) FROM public.transaction_categories)<>8
    OR EXISTS (SELECT FROM public.projects)
    OR EXISTS (SELECT FROM public.sikoyek_secure_project_summary())
  THEN RAISE EXCEPTION 'Imported account, reference counts or project isolation incorrect'; END IF;

  -- A new project can reuse a code from another company.
  INSERT INTO public.projects(project_code,project_name) VALUES ('DEMO-001','Proyek KONSTRUVA');
  BEGIN
    INSERT INTO public.projects(project_code,project_name) VALUES ('DEMO-001','Duplicate');
    RAISE EXCEPTION 'Duplicate project code accepted within one company';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.financial_transactions(project_id,transaction_date,transaction_type,description,amount,input_by)
    SELECT id,current_date,'KELUAR','Cross-company actor',1,'11111111-1111-4111-8111-111111111111'
    FROM public.projects WHERE project_code='DEMO-001';
    RAISE EXCEPTION 'Cross-company actor accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END;
$incoming$;

SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $master$
BEGIN
  IF public.sikoyek_current_company()->>'id' IS DISTINCT FROM 'master'
    OR (SELECT count(*) FROM public.projects)<>1
    OR (SELECT count(*) FROM public.project_categories)<>1
    OR (SELECT sum(amount) FROM public.financial_transactions) IS DISTINCT FROM 12345.67::numeric
    OR EXISTS (SELECT FROM public.sikoyek_secure_project_summary() r WHERE r->>'project_name'='Proyek KONSTRUVA')
  THEN RAISE EXCEPTION 'MASTER totals changed or KONSTRUVA data leaked'; END IF;
END;
$master$;
RESET ROLE;
