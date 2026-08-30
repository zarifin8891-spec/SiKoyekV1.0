create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transaction_categories_name_unique
  on public.transaction_categories (lower(name));

alter table public.transaction_categories enable row level security;

 drop policy if exists "authenticated users can read transaction categories" on public.transaction_categories;
create policy "authenticated users can read transaction categories"
  on public.transaction_categories for select to authenticated using (true);

drop policy if exists "authenticated users can insert transaction categories" on public.transaction_categories;
create policy "authenticated users can insert transaction categories"
  on public.transaction_categories for insert to authenticated with check (true);

drop policy if exists "authenticated users can update transaction categories" on public.transaction_categories;
create policy "authenticated users can update transaction categories"
  on public.transaction_categories for update to authenticated using (true) with check (true);

drop policy if exists "authenticated users can delete transaction categories" on public.transaction_categories;
create policy "authenticated users can delete transaction categories"
  on public.transaction_categories for delete to authenticated using (true);

insert into public.transaction_categories(name,sort_order)
select v.name, v.sort_order
from (values
  ('Material',1),('Upah',2),('Alat',3),('Operasional',4),('Subkon',5),('Uang Muka',6),('Lain-Lain',7)
) v(name,sort_order)
where not exists (
  select 1 from public.transaction_categories tc where lower(tc.name)=lower(v.name)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_methods_name_unique
  on public.payment_methods (lower(name));

alter table public.payment_methods enable row level security;

drop policy if exists "authenticated users can read payment methods" on public.payment_methods;
create policy "authenticated users can read payment methods"
  on public.payment_methods for select to authenticated using (true);

drop policy if exists "authenticated users can insert payment methods" on public.payment_methods;
create policy "authenticated users can insert payment methods"
  on public.payment_methods for insert to authenticated with check (true);

drop policy if exists "authenticated users can update payment methods" on public.payment_methods;
create policy "authenticated users can update payment methods"
  on public.payment_methods for update to authenticated using (true) with check (true);

drop policy if exists "authenticated users can delete payment methods" on public.payment_methods;
create policy "authenticated users can delete payment methods"
  on public.payment_methods for delete to authenticated using (true);

insert into public.payment_methods(name,sort_order)
select v.name, v.sort_order
from (values ('Cash',1),('Transfer',2),('QRIS',3),('Giro',4)) v(name,sort_order)
where not exists (
  select 1 from public.payment_methods pm where lower(pm.name)=lower(v.name)
);
