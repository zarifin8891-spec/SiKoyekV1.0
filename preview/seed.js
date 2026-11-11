/* Synthetic preview seed only. No real client data or credentials. */
window.SiKoyekPreviewSeed=function(){
const role='admin',uid='00000000-0000-4000-8000-000000000001',user={email:'admin@preview.invalid'};
const summary=Array.from({length:6},(_,i)=>({project_id:'p'+i,project_code:'P26'+String(i+1).padStart(3,'0'),project_name:'Proyek Uji '+(i+1),contract_value:100000000+i*10000000,total_rap:80000000,project_progress:20+i*10,cost_ratio:10+i*12,rap_consumption:15+i*15,health_status:i<2?'SEHAT':i<4?'WASPADA':'BERISIKO',estimated_profit:20000000,cash_in:50000000,cash_out:30000000,net_cashflow:20000000,project_date:'2026-09-01',start_date:'2026-09-01',end_date:'2026-12-31',status:i===5?'RENCANA':'JALAN'}));
const modules=['DASHBOARD','PROJECTS','MASTER_DATA','PROGRESS','RAP','KEUANGAN','USERS','LAPORAN'];
const permissions=modules.flatMap(m=>['VIEW','ADD','EDIT','DELETE'].map(a=>({id:m+'_'+a,module:m,action:a,name:m+' '+a})));
const previewGrants={
  direktur:{view:['DASHBOARD','PROJECTS','PROGRESS','RAP','KEUANGAN','MASTER_DATA','USERS','LAPORAN'],write:['MASTER_DATA']},
  keuangan:{view:['DASHBOARD','PROJECTS','RAP','KEUANGAN','MASTER_DATA','LAPORAN'],write:['KEUANGAN']},
  marketing:{view:['DASHBOARD','PROJECTS','MASTER_DATA'],write:['PROJECTS']},
  pelaksana:{view:['DASHBOARD','PROJECTS','MASTER_DATA','PROGRESS'],write:['PROGRESS']}
};
const tables={project_summary:summary,projects:summary.map(p=>({...p,id:p.project_id,owner_name:'Pemilik Uji',location:'Tasikmalaya',category:'Perumahan',project_manager:'Mandor Uji'})),profiles:['admin','direktur','keuangan','marketing','pelaksana'].map((role,i)=>({id:i===0?uid:'preview-user-'+role,full_name:'Pengguna Uji '+role,email:role+'@preview.invalid',is_active:true,role_id:role,roles:{name:role,description:role},created_at:'2026-01-01'})),roles:['admin','direktur','keuangan','marketing','pelaksana'].map(name=>({id:name,name,is_active:true})),permissions,role_permissions:['admin','direktur','keuangan','marketing','pelaksana'].flatMap(name=>permissions.filter(p=>name==='admin'||(name!=='marketing'||p.action!=='DELETE')&&(p.action==='VIEW'?previewGrants[name].view:previewGrants[name].write).includes(p.module)).map(p=>({role_id:name,permission_id:p.id}))),project_work_items:summary.flatMap(p=>[{id:p.project_id+'i1',project_id:p.project_id,work_name:'Pondasi',weight:0.4,sort_order:1},{id:p.project_id+'i2',project_id:p.project_id,work_name:'Dinding',weight:0.6,sort_order:2}]),project_rap:summary.map(p=>({project_id:p.project_id,material:30000000,labor:20000000,equipment:10000000,operational:10000000,subcontract:5000000,other:5000000})),progress_records:summary.map(p=>({id:p.project_id+'pr',project_id:p.project_id,work_item_id:p.project_id+'i1',progress_date:'2026-10-01',progress_percentage:0.5,notes:'Uji'})),financial_transactions:summary.flatMap(p=>[{id:p.project_id+'t1',project_id:p.project_id,transaction_date:'2026-10-01',transaction_type:'MASUK',category:'Uang Muka',amount:50000000,description:'Uji masuk',payment_method:'Transfer'},{id:p.project_id+'t2',project_id:p.project_id,transaction_date:'2026-10-02',transaction_type:'KELUAR',category:'Material',amount:30000000,description:'Uji keluar',payment_method:'Cash'}]),project_categories:[{id:'c1',name:'Perumahan',is_active:true,sort_order:1}],project_managers:[{id:'m1',name:'Mandor Uji',is_active:true,sort_order:1}],transaction_categories:[{id:'tc1',name:'Material',transaction_type:'KELUAR',is_active:true,sort_order:1}],payment_methods:[{id:'pm1',name:'Transfer',is_active:true,sort_order:1}]};
// Keep table rows consistent with the synthetic history and financial totals.
const projectColumns=['id','project_code','project_date','project_name','owner_name','category','location','contract_value','start_date','end_date','project_manager','status','project_progress'];
tables.projects=tables.projects.map(p=>Object.fromEntries(projectColumns.map(key=>[key,p[key]])));
tables.progress_records=summary.flatMap(p=>[{id:p.project_id+'pr1',project_id:p.project_id,work_item_id:p.project_id+'i1',progress_date:'2026-10-01',progress_percentage:Math.min(1,p.project_progress/40),notes:'Data uji awal'},{id:p.project_id+'pr2',project_id:p.project_id,work_item_id:p.project_id+'i2',progress_date:'2026-10-01',progress_percentage:Math.max(0,p.project_progress-40)/60,notes:'Data uji awal'}]);
const spending=[12000000,25000000,40000000,48000000,68000000,78000000];
tables.financial_transactions.filter(t=>t.transaction_type==='KELUAR').forEach((t,i)=>{t.amount=spending[i]});
const now = new Date().toISOString();
const date = now.slice(0, 10);
tables.project_progress_targets = [
  {id:'target-1',project_id:'p0',target_date:'2026-09-01',target_percent:0},
  {id:'target-2',project_id:'p0',target_date:'2026-10-01',target_percent:30},
  {id:'target-3',project_id:'p0',target_date:'2026-11-01',target_percent:65},
  {id:'target-4',project_id:'p0',target_date:'2026-12-31',target_percent:100}
];
tables.project_milestones = [{id:'milestone-1',project_id:'p0',name:'Pondasi selesai',due_date:'2026-11-15',completed_on:null}];
tables.project_material_stocks = [
  {id:'stock-1',project_id:'p0',name:'Semen',unit:'sak',quantity:24,minimum_quantity:30},
  {id:'stock-2',project_id:'p0',name:'Besi Beton',unit:'batang',quantity:12,minimum_quantity:40},
  {id:'stock-3',project_id:'p0',name:'Pasir',unit:'m³',quantity:3,minimum_quantity:20}
];
tables.project_worker_assignments = summary.flatMap((p,i) => Array.from({length:4},(_,j) => ({
  id:'worker-'+i+'-'+j,project_id:p.project_id,worker_code:'TK-'+i+'-'+j,worker_name:'Pekerja Uji '+(i*4+j+1),starts_on:'2026-09-01',ends_on:null
})));
tables.project_equipment_assignments = [{id:'equipment-1',project_id:'p0',equipment_code:'AL-01',name:'Concrete mixer',starts_on:date,ends_on:null}];
tables.employee_master = tables.project_worker_assignments.map(row => ({
  id: 'master-' + row.id, code: row.worker_code, name: row.worker_name, is_active: true
}));
tables.equipment_master = tables.project_equipment_assignments.map(row => ({
  id: 'master-' + row.id, code: row.equipment_code, name: row.name, is_active: true
}));
tables.project_worker_assignments.forEach(row => { row.employee_id = 'master-' + row.id; });
tables.project_equipment_assignments.forEach(row => { row.equipment_id = 'master-' + row.id; });

tables.project_field_logs = [
  {id:'log-1',project_id:'p0',logged_at:now,description:'Pengiriman semen diterima'},
  {id:'log-2',project_id:'p0',logged_at:new Date(Date.now()-3600000).toISOString(),description:'Pengecoran pondasi dimulai'},
  {id:'log-3',project_id:'p0',logged_at:new Date(Date.now()-86400000).toISOString(),description:'Inspeksi K3 mingguan'}
];
tables.project_weather_observations = [{id:'weather-1',project_id:'p0',observed_at:now,condition:'Cerah berawan',temperature_c:28}];
tables.project_document_links = [];
return tables;
};
