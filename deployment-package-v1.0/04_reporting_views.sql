-- SiKoyek V1.0 reporting views
-- Health source of truth: Progress - RAP Consumption.

create or replace view public.project_summary as
with progress_totals as (
  select pwi.project_id,
         coalesce(sum(pwi.weight * least(1::numeric, coalesce(prt.progress_total,0))) * 100,0) as progress_total
  from project_work_items pwi
  left join (
    select work_item_id, sum(progress_percentage) as progress_total
    from progress_records
    group by work_item_id
  ) prt on prt.work_item_id = pwi.id
  group by pwi.project_id
),
financial_totals as (
  select project_id,
         coalesce(sum(amount) filter (where transaction_type='MASUK'),0) as cash_in,
         coalesce(sum(amount) filter (where transaction_type='KELUAR'),0) as cash_out
  from financial_transactions
  group by project_id
),
rap_totals as (
  select project_id,
    coalesce(material,0)+coalesce(labor,0)+coalesce(equipment,0)+coalesce(operational,0)+coalesce(subcontract,0)+coalesce(other,0) as total_rap
  from project_rap
),
base as (
  select p.id as project_id,p.project_code,p.project_date,p.project_name,p.owner_name,p.category,
         p.location,p.contract_value,p.start_date,p.end_date,p.project_manager,p.status,
         coalesce(pt.progress_total,0) as progress_total,
         coalesce(ft.cash_in,0) as cash_in,
         coalesce(ft.cash_out,0) as cash_out,
         coalesce(rt.total_rap,0) as total_rap
  from projects p
  left join progress_totals pt on pt.project_id=p.id
  left join financial_totals ft on ft.project_id=p.id
  left join rap_totals rt on rt.project_id=p.id
)
select project_id,project_code,project_date,project_name,owner_name,category,location,contract_value,
       start_date,end_date,project_manager,status,progress_total,cash_in,cash_out,total_rap,
       cash_out as total_realization,
       cash_in-cash_out as net_cashflow,
       case when contract_value>0 then (cash_out/contract_value)*100 else 0 end as cost_ratio,
       case when total_rap>0 then (cash_out/total_rap)*100 else 0 end as rap_consumption,
       contract_value-total_rap as estimated_profit,
       case when contract_value>0 then ((contract_value-total_rap)/contract_value)*100 else 0 end as estimated_margin,
       case
         when (progress_total - case when total_rap>0 then (cash_out/total_rap)*100 else 0 end) < -5 then 'RISIKO'
         when (progress_total - case when total_rap>0 then (cash_out/total_rap)*100 else 0 end) < 0 then 'AWASI'
         else 'SEHAT'
       end as health_status,
       case
         when total_rap<=0 then 'RAP belum tersedia untuk menilai konsumsi biaya'
         when (progress_total - ((cash_out/total_rap)*100)) < -5 then 'Konsumsi biaya jauh lebih cepat daripada progress'
         when (progress_total - ((cash_out/total_rap)*100)) < 0 then 'Konsumsi biaya mulai lebih cepat daripada progress'
         else 'Progress sejalan atau lebih cepat daripada konsumsi biaya'
       end as control_message,
       progress_total as project_progress
from base;

create or replace view public.project_cost_control as
with categories as (
  select 'Material'::text category_name,'material'::text rap_column,1 sort_order union all
  select 'Upah','labor',2 union all
  select 'Alat','equipment',3 union all
  select 'Operasional','operational',4 union all
  select 'Subkon','subcontract',5 union all
  select 'Lain-Lain','other',6
),
realization as (
  select project_id,category,
         coalesce(sum(amount) filter(where transaction_type='KELUAR'),0) as realization
  from financial_transactions
  group by project_id,category
)
select p.id project_id,p.project_code,p.project_name,c.category_name,
       case c.rap_column
         when 'material' then coalesce(r.material,0)
         when 'labor' then coalesce(r.labor,0)
         when 'equipment' then coalesce(r.equipment,0)
         when 'operational' then coalesce(r.operational,0)
         when 'subcontract' then coalesce(r.subcontract,0)
         when 'other' then coalesce(r.other,0)
       end as rap,
       coalesce(x.realization,0) as realization,
       (case c.rap_column
         when 'material' then coalesce(r.material,0)
         when 'labor' then coalesce(r.labor,0)
         when 'equipment' then coalesce(r.equipment,0)
         when 'operational' then coalesce(r.operational,0)
         when 'subcontract' then coalesce(r.subcontract,0)
         when 'other' then coalesce(r.other,0)
       end - coalesce(x.realization,0)) as variance,
       case
         when (case c.rap_column
           when 'material' then coalesce(r.material,0)
           when 'labor' then coalesce(r.labor,0)
           when 'equipment' then coalesce(r.equipment,0)
           when 'operational' then coalesce(r.operational,0)
           when 'subcontract' then coalesce(r.subcontract,0)
           when 'other' then coalesce(r.other,0)
         end)>0 then coalesce(x.realization,0) /
           (case c.rap_column
             when 'material' then coalesce(r.material,0)
             when 'labor' then coalesce(r.labor,0)
             when 'equipment' then coalesce(r.equipment,0)
             when 'operational' then coalesce(r.operational,0)
             when 'subcontract' then coalesce(r.subcontract,0)
             when 'other' then coalesce(r.other,0)
           end)*100
         else 0
       end as consumption_pct,
       c.sort_order
from projects p
cross join categories c
left join project_rap r on r.project_id=p.id
left join realization x on x.project_id=p.id and lower(trim(x.category))=lower(trim(c.category_name));
