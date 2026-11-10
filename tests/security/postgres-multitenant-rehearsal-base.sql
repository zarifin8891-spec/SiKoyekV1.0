-- Use a fresh disposable PostgreSQL 17 database.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE SET search_path=''
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
\ir ../../deployment-package-v1.0/01_schema.sql
-- Known differences in the MASTER target schema.
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN project_code SET NOT NULL,
  ALTER COLUMN project_name SET NOT NULL,
  ALTER COLUMN contract_value TYPE numeric(18,2);
ALTER TABLE public.financial_transactions ALTER COLUMN amount TYPE numeric(18,2);
ALTER TABLE public.progress_records ALTER COLUMN progress_percentage TYPE numeric(7,4);
ALTER TABLE public.project_work_items ALTER COLUMN weight TYPE numeric(7,4);
ALTER TABLE public.health_rules ALTER COLUMN warning_threshold TYPE numeric(7,4),
  ALTER COLUMN risk_threshold TYPE numeric(7,4);
ALTER TABLE public.project_rap ALTER COLUMN material TYPE numeric(18,2),
  ALTER COLUMN labor TYPE numeric(18,2), ALTER COLUMN equipment TYPE numeric(18,2),
  ALTER COLUMN operational TYPE numeric(18,2), ALTER COLUMN subcontract TYPE numeric(18,2),
  ALTER COLUMN other TYPE numeric(18,2);
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
