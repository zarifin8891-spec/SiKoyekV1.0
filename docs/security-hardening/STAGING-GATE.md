# SiKoyek Cloud — Security Hardening V1 staging gate

Date: 2026-11-08. **DRAFT / NOT PRODUCTION READY**.

## Scope and isolation
- Baseline GitHub main: `15473331c88f5464b271e72755c0690277ad4d62`.
- MASTER Supabase project: `mmkusplegmittrlxqxby`; KONSTRUVA Supabase project: `fadxsycdgzuctvmhhjty`.
- This GitHub branch is **NOT** a database branch. Never execute migrations on either production project as a staging substitute.
- No production SQL, Edge deployment, frontend publication, or migration is authorized by this checklist.

## Confirmed production issues (read-only evidence)
- Both databases have broad `authenticated` RLS rules (`USING (true)` and `WITH CHECK (true)`) across project, progress, RAP, finance, and master tables.
- MASTER grants `anon` and `authenticated` `EXECUTE` on 4 `SECURITY DEFINER` functions; KONSTRUVA does not.
- Authorization source must be `profiles.role_id -> roles -> role_permissions -> permissions`, checking `profiles.is_active` and `roles.is_active`.
- Normalize `FINANCE` to `KEUANGAN` and action casing (database conventions differ).
- KONSTRUVA `user-management` Edge Function uses legacy `profiles.role` to authorize admins, while MASTER uses `roles(name)`.
- Current Dashboard fetches raw `financial_transactions`, `project_rap`, and `progress_records` in some paths. Tightening SELECT without UI/summary adaptation will break role views.
- `main` is not branch-protected; publisher is tied to Main.

## Verification completed
- Read-only SQL against both production projects: 22 / 22 positive/negative permission matrix checks per project.
- Local Python policy-model and SQL-file structure checks: 452 / 452 passed.
- These tests **do not execute PostgreSQL RLS policies**. They do not prove the candidate migration is safe to deploy.

## Release blocker checklist
- [ ] Provision a **separate** staging PostgreSQL/Supabase environment (cost must be approved if billable).
- [ ] Clone structure/migration history to staging, use synthetic users/data only; never copy live personal/financial records to staging.
- [ ] Execute candidate SQL exclusively in staging; run role impersonation tests using five synthetic JWT identities and `SET ROLE authenticated`.
- [ ] Verify RLS CRUD (positive & negative), inactive/no-role profiles, privilege escalation, foreign project ID, and trigger status updates.
- [ ] Adapt Dashboard/Health/Decision data loading; validate finance masking and summaries for five roles.
- [ ] Align KONSTRUVA Edge authorization to role_id and verify all user-management operations, including role changes.
- [ ] Pin Supabase JS dependencies and audit unsafe inline HTML event handlers.
- [ ] Protect main with review/checks, validate preview and backend migrations, backup/restore both production databases.
- [ ] Approval gate **separate from staging** before either production database is changed.
- [ ] Deploy tenant by tenant with end-to-end smoke test and rollback drill.

## Existing candidate package (not committed here)
Previously generated, explicitly staging-only: `SiKoyek_Security_Hardening_V1_DRAFT_STAGING_ONLY.sql` and local pytest fixtures. This file is a release checklist, **not an executable migration**.
