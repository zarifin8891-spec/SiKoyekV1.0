create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_categories_name_unique
  on public.project_categories (lower(name));

alter table public.project_categories enable row level security;

drop policy if exists "authenticated users can read project categories" on public.project_categories;
create policy "authenticated users can read project categories"
  on public.project_categories for select to authenticated using (true);

drop policy if exists "authenticated users can insert project categories" on public.project_categories;
create policy "authenticated users can insert project categories"
  on public.project_categories for insert to authenticated with check (true);

drop policy if exists "authenticated users can update project categories" on public.project_categories;
create policy "authenticated users can update project categories"
  on public.project_categories for update to authenticated using (true) with check (true);

insert into public.project_categories(name,sort_order)
select v.name, v.sort_order
from (values ('Renovasi',1),('Bangun Baru',2),('Interior',3),('Instalasi',4),('Pemeliharaan',5),('Lainnya',6)) v(name,sort_order)
where not exists (
  select 1 from public.project_categories pc where lower(pc.name)=lower(v.name)
);
