# SiKoyek V1.0 — Deployment Tests

## Purpose

These tests are release-gate checks for a fresh customer deployment. They verify the database structure, RLS, reporting compatibility, RBAC seed counts, and anonymous privilege hardening.

## Run order

1. Run `01_schema.sql`
2. Run `02_functions_triggers.sql`
3. Run `03_rls_policies.sql`
4. Run `04_reporting_views.sql`
5. Run `05_seed_system.sql`
6. Run `06_seed_rbac.sql`
7. Run `07_security_hardening.sql`
8. Run `tests/deployment_verification.sql`

## Expected result

Every verification row should return `PASS`.

This verification script is designed for a **fresh deployment**. The emptiness checks for projects, progress, RAP, finance, and audit logs will intentionally fail on a live customer system that already contains business data. For an existing pilot deployment, use the structural/security checks separately and perform the customer smoke test without deleting business data.

## Release gate

Do not mark the deployment `DISTRIBUTION READY` until:

- all applicable verification checks pass;
- MASTER/customer schema parity has been audited;
- MASTER health compatibility has been reconciled;
- canonical GitHub Pages deployment is green;
- customer login and core workflow smoke tests are green;
- deployment package version is frozen.
