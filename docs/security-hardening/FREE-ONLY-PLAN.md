# Security Hardening V1 — Free-only execution plan

Date: 2026-11-08
Status: **WORK IN PROGRESS; NO PRODUCTION DEPLOYMENT AUTHORIZED**.

## Decision
The project owner has requested **zero additional paid hosting/database services** for this phase.
- Do not create billable Supabase branches, paid staging projects, VPS instances, or other paid resources.
- Keep MASTER (`mmkusplegmittrlxqxby`) and KONSTRUVA (`fadxsycdgzuctvmhhjty`) unchanged.
- Keep GitHub `main` and the Pages publisher unchanged; use the isolated branch `security/hardening-v1-staging-20261108`.

## Verified free work
1. Read-only production schema, grants, policies, roles and permission matrix audits have been performed; both production projects are accessible.
2. Existing offline RBAC model and draft SQL tests were rerun on 2026-11-08: **452 passed**. This is NOT a PostgreSQL RLS integration test.
3. No PostgreSQL server or Docker engine is installed in the current assistant's local runtime; cannot claim a real staging database test happened.

## No-cost test alternatives
Preferred: use PostgreSQL 17 on an isolated local machine (or local Supabase CLI with Docker when available), with **synthetic fixtures only**. This does not require a Supabase paid plan, but requires compatible local prerequisites. PostgreSQL-only setup must supply the required Supabase auth schema/function stubs for simulations; a complete Supabase CLI local stack is preferable for JWT/Edge integration.

Test gates:
- Build a disposable local database independent of production; never point local tools to either real Supabase project ID.
- Inspect and review the staging-only candidate SQL before running it, including schema-specific policy name checks.
- Verify unauthorized versus authorized SELECT/INSERT/UPDATE/DELETE for ADMIN/DIREKTUR/KEUANGAN/MARKETING/PELAKSANA, disabled users, and missing profiles.
- Test status refresh triggers and function EXECUTE grants, including direct anon RPC denial.
- Confirm Dashboard/Health/Decision KPIs remain correct when raw financial reads are disallowed.
- Align KONSTRUVA `user-management` Edge authorization to canonical `profiles.role_id -> roles.name`; test admin management using synthetic users only.
- Keep and compare read-only production drift reports; stop if schema or policy inventories change.

## Release blockers / safety
- Do **not** paste the staging-only DDL into production SQL editors.
- Do **not** mistake 452 offline model checks for database or browser integration.
- A direct production RLS change risks blocking legitimate UI reads and writes.
- The future production rollout requires verified backup/restore, compatible code, post-migration tests, and explicit separate approval.
- No database migration has been executed in MASTER or KONSTRUVA.

## Next development steps on this GitHub branch
1. Integrate reproducible policy-model tests and fixtures into branch CI (no network, no production credentials).
2. Fix frontend alias mapping `FINANCE` <-> `KEUANGAN` without changing business rules.
3. Prepare independent tests for Edge user-management role lookup and Dashboard read contracts.
4. Once a local PostgreSQL test environment is available, validate the full database migration there before requesting a production rollout.

See `STAGING-GATE.md` for the full risk inventory. This file is a **plan**, not an executable database migration.
