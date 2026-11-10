\set ON_ERROR_STOP on
\ir postgres-multitenant-rehearsal-base.sql
\ir ../../deployment-package-v1.0/02_functions_triggers.sql
\ir ../../deployment-package-v1.0/03_rls_policies.sql
\ir ../../deployment-package-v1.0/04_reporting_views.sql
\ir ../../deployment-package-v1.0/05_seed_system.sql
\ir ../../deployment-package-v1.0/06_seed_rbac.sql
\ir postgres-multitenant-rehearsal-seed.sql
\ir ../../docs/security-hardening/STAGING_ONLY_full_rls_15_tables.sql
\ir ../../docs/security-hardening/STAGING_ONLY_revoke_legacy_definers.sql
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
\ir postgres-multitenant-rehearsal-import.sql
ROLLBACK;
