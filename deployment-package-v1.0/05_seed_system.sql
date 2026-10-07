-- Generic system configuration. Do not copy customer business data.
insert into public.health_rules (warning_threshold,risk_threshold)
select 5,15
where not exists (select 1 from public.health_rules);

-- Customer master-data tables intentionally remain empty on first deployment.
