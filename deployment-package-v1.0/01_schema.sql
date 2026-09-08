-- SiKoyek V1.0 customer deployment schema
-- Structure only. No customer business data.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  unique (module, action)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'STAFF',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role_id uuid references public.roles(id) on delete set null,
  email text,
  constraint profiles_role_check check (role = any (array['ADMIN','MANAGER','STAFF']::text[]))
);

create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  phone text,
  email text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique,
  project_date date,
  project_name text,
  owner_name text,
  category text,
  location text,
  contract_value numeric not null default 0,
  start_date date,
  end_date date,
  project_manager text,
  status text not null default 'RENCANA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_contract_value_check check (contract_value >= 0),
  constraint projects_check check (end_date is null or start_date is null or end_date >= start_date),
  constraint projects_status_check check (status = any (array['RENCANA','JALAN','PENDING','SELESAI']::text[]))
);

create table if not exists public.project_work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  work_name text not null,
  weight numeric not null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, work_name),
  constraint project_work_items_weight_check check (weight >= 0 and weight <= 100)
);

create table if not exists public.progress_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  work_item_id uuid not null references public.project_work_items(id) on delete cascade,
  progress_date date not null,
  progress_percentage numeric not null,
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_item_id, progress_date),
  constraint progress_records_progress_percentage_check check (progress_percentage >= 0 and progress_percentage <= 100)
);

create table if not exists public.project_rap (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  material numeric not null default 0,
  labor numeric not null default 0,
  equipment numeric not null default 0,
  operational numeric not null default 0,
  subcontract numeric not null default 0,
  other numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_rap_material_check check (material >= 0),
  constraint project_rap_labor_check check (labor >= 0),
  constraint project_rap_equipment_check check (equipment >= 0),
  constraint project_rap_operational_check check (operational >= 0),
  constraint project_rap_subcontract_check check (subcontract >= 0),
  constraint project_rap_other_check check (other >= 0)
);

create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  transaction_date date not null,
  transaction_type text not null,
  category text,
  description text not null,
  amount numeric not null,
  payment_method text,
  input_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_transactions_amount_check check (amount > 0),
  constraint financial_transactions_transaction_type_check check (transaction_type = any (array['MASUK','KELUAR']::text[]))
);

create table if not exists public.health_rules (
  id uuid primary key default gen_random_uuid(),
  warning_threshold numeric not null default 5,
  risk_threshold numeric not null default 15,
  updated_at timestamptz not null default now(),
  constraint health_rules_warning_threshold_check check (warning_threshold >= 0),
  constraint health_rules_check check (risk_threshold >= warning_threshold)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role_id on public.profiles(role_id);
create unique index if not exists idx_profiles_email_unique on public.profiles(lower(email)) where email is not null;
create unique index if not exists project_categories_name_unique on public.project_categories(lower(name));
create unique index if not exists project_managers_name_unique on public.project_managers(lower(name));
create unique index if not exists project_managers_code_unique on public.project_managers(lower(code));
create index if not exists idx_work_items_project on public.project_work_items(project_id, sort_order);
create index if not exists idx_progress_project_date on public.progress_records(project_id, progress_date);
create index if not exists idx_progress_work_item_date on public.progress_records(work_item_id, progress_date desc);
create index if not exists idx_progress_updated_by on public.progress_records(updated_by);
create index if not exists idx_financial_project_date on public.financial_transactions(project_id, transaction_date);
create index if not exists idx_financial_input_by on public.financial_transactions(input_by);
create index if not exists idx_audit_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_user_id on public.audit_logs(user_id);
create unique index if not exists transaction_categories_name_unique on public.transaction_categories(lower(name));
create unique index if not exists payment_methods_name_unique on public.payment_methods(lower(name));
create index if not exists idx_role_permissions_permission_id on public.role_permissions(permission_id);
