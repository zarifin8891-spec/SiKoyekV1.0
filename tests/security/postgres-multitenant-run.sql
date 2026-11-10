\set ON_ERROR_STOP on
\ir postgres-full-rls-fixture.sql
\ir postgres-secure-projection-fixture.sql
\ir postgres-multitenant-reporting-fixture.sql
\ir ../../deployment-package-v1.0/04_reporting_views.sql
\ir ../../docs/security-hardening/STAGING_ONLY_full_rls_15_tables.sql
\ir ../../docs/security-hardening/STAGING_ONLY_secure_financial_projection.sql
\ir ../../docs/security-hardening/STAGING_ONLY_project_lifecycle_gate.sql
\ir ../../docs/security-hardening/STAGING_ONLY_atomic_role_permissions.sql
BEGIN;
\ir ../../supabase/migrations/20261109075926_project_milestones.sql
\ir ../../supabase/migrations/20261109080521_project_staff_assignments.sql
\ir ../../supabase/migrations/20261109081108_employee_master.sql
\ir ../../supabase/migrations/20261109082416_staff_assignment_overlap.sql
\ir ../../supabase/migrations/20261109082940_project_staff_headcount.sql
SET LOCAL sikoyek.disposable_fixture='on';
\ir postgres-multitenant-prototype.sql
\ir postgres-multitenant-reporting.sql
\ir postgres-multitenant-assertions.sql
\ir postgres-multitenant-reporting-assertions.sql
ROLLBACK;
