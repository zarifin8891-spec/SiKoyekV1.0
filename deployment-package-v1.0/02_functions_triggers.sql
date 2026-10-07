-- SiKoyek V1.0 functions and triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_progress_project_match()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from public.project_work_items pwi
    where pwi.id = new.work_item_id
      and pwi.project_id = new.project_id
  ) then
    raise exception 'Progress project_id does not match the work item project';
  end if;
  return new;
end;
$$;

create or replace function public.validate_progress_total()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare existing_total numeric;
begin
  select coalesce(sum(progress_percentage),0)
    into existing_total
  from public.progress_records
  where work_item_id = new.work_item_id
    and id <> new.id;

  if existing_total + new.progress_percentage > 1 then
    raise exception 'Total progress untuk item pekerjaan tidak boleh melebihi 100%%. Sisa yang dapat diinput: %',
      round(greatest(0,1-existing_total)*100,2);
  end if;
  return new;
end;
$$;

create or replace function public.refresh_project_status(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_has_progress boolean;
  v_last_date date;
  v_progress numeric;
  v_status text;
begin
  select exists(select 1 from progress_records where project_id = p_project_id),
         max(progress_date)
    into v_has_progress, v_last_date
  from progress_records
  where project_id = p_project_id;

  select coalesce(
    sum(pwi.weight * least(1::numeric, coalesce(prt.progress_total,0))) * 100,
    0
  )
    into v_progress
  from project_work_items pwi
  left join (
    select work_item_id, sum(progress_percentage) progress_total
    from progress_records
    where project_id = p_project_id
    group by work_item_id
  ) prt on prt.work_item_id = pwi.id
  where pwi.project_id = p_project_id;

  if v_progress >= 99.9999 then
    v_status = 'SELESAI';
  elsif not v_has_progress then
    v_status = 'RENCANA';
  elsif v_last_date < current_date - 7 then
    v_status = 'PENDING';
  else
    v_status = 'JALAN';
  end if;

  update projects set status = v_status, updated_at = now()
  where id = p_project_id;
end;
$$;

create or replace function public.refresh_all_project_statuses()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare r record;
begin
  for r in select id from projects loop
    perform public.refresh_project_status(r.id);
  end loop;
end;
$$;

create or replace function public.trg_refresh_project_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_project_status(old.project_id);
  else
    perform public.refresh_project_status(new.project_id);
    if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
      perform public.refresh_project_status(old.project_id);
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.trg_project_initial_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.status = 'RENCANA';
  else
    perform public.refresh_project_status(new.id);
  end if;
  return new;
end;
$$;

create trigger trg_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger projects_initial_status before insert on public.projects
for each row execute function public.trg_project_initial_status();
create trigger trg_work_items_updated_at before update on public.project_work_items
for each row execute function public.set_updated_at();
create trigger trg_progress_updated_at before update on public.progress_records
for each row execute function public.set_updated_at();
create trigger trg_progress_project_match before insert or update on public.progress_records
for each row execute function public.validate_progress_project_match();
create trigger trg_progress_total before insert or update on public.progress_records
for each row execute function public.validate_progress_total();
create trigger progress_records_refresh_project_status after insert or update or delete on public.progress_records
for each row execute function public.trg_refresh_project_status();
create trigger trg_project_rap_updated_at before update on public.project_rap
for each row execute function public.set_updated_at();
create trigger trg_financial_updated_at before update on public.financial_transactions
for each row execute function public.set_updated_at();
create trigger trg_health_rules_updated_at before update on public.health_rules
for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
