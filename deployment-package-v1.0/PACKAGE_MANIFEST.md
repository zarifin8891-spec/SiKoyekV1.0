# SiKoyek V1.0 Deployment Package Manifest

**Package version:** 1.0-customer-deployment
**Created:** 2026-09-08
**Reference validated instance:** `sikoyek_konstruva`
**Repository:** `zarifin8891-spec/SiKoyekV1.0`

## Package contents

| File | Purpose |
|---|---|
| `README.md` | Package architecture, scope and release notes |
| `01_schema.sql` | 15-table PostgreSQL schema, constraints and indexes |
| `02_functions_triggers.sql` | Core functions and triggers |
| `03_rls_policies.sql` | RLS enablement and authenticated policies |
| `04_reporting_views.sql` | `project_summary` and `project_cost_control` |
| `05_seed_system.sql` | Generic health configuration |
| `06_seed_rbac.sql` | Roles, permissions and mappings |
| `edge-functions/user-management/index.ts` | Admin user-management Edge Function |
| `edge-functions/user-management/deno.json` | Edge Function runtime config |
| `INSTALLATION_CHECKLIST.md` | Repeatable customer installation and smoke test |
| `CUSTOMER_CONFIG_TEMPLATE.md` | Per-customer configuration template |

## RBAC baseline

- Roles: 5
- Permissions: 26
- Role mappings: 58

## Health baseline

`GAP HEALTH = Progress - RAP Consumption`

- GAP >= 0 pp → `SEHAT`
- -5 pp <= GAP < 0 pp → `AWASI`
- GAP < -5 pp → `RISIKO`

Cost Ratio remains a separate KPI.

## Data isolation

The package contains no Konstruva business records. Customer deployments must receive a clean database and a newly created ADMIN account.

## Release gate still open

This package is a **deployment candidate**, not yet the permanent frozen product release. Before distribution to additional companies, audit MASTER/customer parity and reconcile the MASTER health compatibility view.
