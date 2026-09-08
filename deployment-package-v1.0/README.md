# SiKoyek V1.0 — Deployment Package

**Package type:** Customer Instance Deployment
**Version:** 1.0
**Source:** SiKoyek V1.0 production schema / application
**Reference customer validation:** `sikoyek_konstruva`

## Architecture

`SiKoyek MASTER` → `Deployment Package` → `Customer Instance`

This package deploys **structure and system configuration only**. Customer business/test data must NOT be copied from MASTER or another customer.

## Included

1. Core PostgreSQL schema for the 15 public tables.
2. Constraints and indexes.
3. Functions and triggers for status/progress integrity.
4. RLS and authenticated policies.
5. Reporting views: `project_summary` and `project_cost_control`.
6. Health logic: `Progress - RAP Consumption` with SEHAT / AWASI / RISIKO thresholds.
7. Generic `health_rules` seed.
8. RBAC seed: 5 roles, 26 permissions, 58 mappings, using generated UUIDs and name-based joins.
9. `user-management` Edge Function source.
10. Customer installation checklist and configuration template.

## Intentionally empty after installation

- `projects`
- `project_work_items`
- `progress_records`
- `project_rap`
- `financial_transactions`
- `transaction_categories`
- `payment_methods`
- `project_categories`
- `project_managers`
- `audit_logs`
- `profiles` (except the customer-created ADMIN account)

System tables/configuration that are seeded:

- `roles`
- `permissions`
- `role_permissions`
- `health_rules`

## Security rules

- Never put a Supabase `service_role` key in frontend code or GitHub Pages.
- Frontend uses the customer project's publishable/anon key.
- `user-management` requires JWT and performs privileged Auth operations server-side.
- Customer Supabase project must be isolated from MASTER.

## Installation order

1. `01_schema.sql`
2. `02_functions_triggers.sql`
3. `03_rls_policies.sql`
4. `04_reporting_views.sql`
5. `05_seed_system.sql`
6. `06_seed_rbac.sql`
7. Deploy `edge-functions/user-management`
8. Create the customer's first ADMIN Auth user and matching profile.
9. Configure frontend URL/key.
10. Run the smoke-test checklist.

## Important release note

The package reflects the validated **customer-instance architecture**. Before declaring this package the permanent product release, MASTER must be brought to the same health compatibility view and any remaining MASTER/customer parity differences must be reconciled.
