# SiKoyek V1.0 — Customer Installation Checklist

## A. Customer Supabase project

- [ ] New Production Supabase project created for the customer.
- [ ] Region recorded.
- [ ] Project ID recorded.
- [ ] MASTER project remains separate.
- [ ] Frontend publishable/anon key recorded securely.
- [ ] Service-role key is NOT placed in frontend/GitHub Pages.

## B. Database

Run SQL in this order:

- [ ] `01_schema.sql`
- [ ] `02_functions_triggers.sql`
- [ ] `03_rls_policies.sql`
- [ ] `04_reporting_views.sql`
- [ ] `05_seed_system.sql`
- [ ] `06_seed_rbac.sql`
- [ ] `07_security_hardening.sql`

Expected initial data:

- roles = 5
- permissions = 26
- role_permissions = 58
- health_rules = 1
- customer business tables = 0 rows

Customer business tables that must start empty:

`projects`, `project_work_items`, `progress_records`, `project_rap`, `financial_transactions`, `transaction_categories`, `payment_methods`, `project_categories`, `project_managers`, `audit_logs`.

## C. Auth / ADMIN

- [ ] Create first customer ADMIN user in Supabase Auth.
- [ ] Create matching row in `public.profiles`.
- [ ] Set `role='ADMIN'` and the correct `role_id` from `roles`.
- [ ] Confirm ADMIN has 26 permissions.

## D. Edge Function

- [ ] Deploy `edge-functions/user-management`.
- [ ] `verify_jwt = true`.
- [ ] Confirm function is ACTIVE.
- [ ] Confirm privileged Auth operations remain server-side.

## E. Frontend

- [ ] Customer page uses customer Supabase URL.
- [ ] Customer page uses customer publishable/anon key.
- [ ] No MASTER URL/key remains in customer runtime modules.
- [ ] Dashboard Health uses active `window.SK?.sb || window.sb` client.
- [ ] Finance dashboard uses active client.
- [ ] Master Data save works.
- [ ] Report period filters work.
- [ ] Cost Control uses authoritative project summary progress.

## F. Smoke test

1. [ ] Login as ADMIN.
2. [ ] Create project.
3. [ ] Add work items.
4. [ ] Add RAP.
5. [ ] Add progress.
6. [ ] Add financial transaction.
7. [ ] Verify project status changes correctly.
8. [ ] Verify `Progress`, `RAP Consumption`, and `GAP HEALTH`.
9. [ ] Verify Health = SEHAT/AWASI/RISIKO according to GAP.
10. [ ] Verify Cost Control matches project summary.
11. [ ] Verify Dashboard totals.
12. [ ] Verify Laporan period filters.
13. [ ] Create a non-ADMIN test user and verify role permissions.
14. [ ] Confirm customer data is visible only in the customer project.

## G. Release gate

Do NOT label the customer deployment `DISTRIBUTION READY` until:

- [ ] MASTER/customer schema parity is audited.
- [ ] MASTER health compatibility view is reconciled.
- [ ] Canonical Pages workflow is green.
- [ ] Customer smoke test is green.
- [ ] Deployment package version is frozen.
- [ ] Anonymous public table/view privileges are revoked by `07_security_hardening.sql`.
