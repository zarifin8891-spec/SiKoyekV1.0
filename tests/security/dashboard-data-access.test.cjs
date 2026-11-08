'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../foundation/data-access.js'),'utf8');
const PROJECT={id:'p1',project_code:'P-1',project_name:'Synthetic Project',start_date:'2026-10-01'};
const FIN_SUMMARY={project_id:'p1',project_code:'P-1',project_name:'Synthetic Project',
  total_rap:5000,contract_value:10000,cash_in:2000,cash_out:1000,
  project_progress:70,health_status:'SEHAT',control_message:'OK'};
const permissionSets={
  MARKETING:[['PROJECTS','VIEW'],['PROJECTS','EDIT'],['DASHBOARD','VIEW']],
  PELAKSANA:[['PROJECTS','VIEW'],['PROGRESS','VIEW'],['PROGRESS','ADD'],['DASHBOARD','VIEW']],
  KEUANGAN:[['PROJECTS','VIEW'],['FINANCE','VIEW'],['RAP','VIEW'],['DASHBOARD','VIEW']],
  ADMIN:[['PROJECTS','VIEW'],['KEUANGAN','VIEW'],['RAP','VIEW'],['PROGRESS','VIEW'],['USERS','VIEW'],['DASHBOARD','VIEW']]
};
function harness(role,{active=true,roleActive=true}={}){
  const events=[];
  const permissions=(permissionSets[role]||[]).map(([module,action],i)=>({id:String(i),module,action}));
  const profile={role_id:'role-id',is_active:active,roles:{name:role,is_active:roleActive}};
  const client={
    auth:{getUser:async()=>({data:{user:{id:'synthetic-user'}},error:null})},
    from(table){
      let operation='';let columns='';
      const query={
        select(fields){operation='select';columns=fields;return this;},
        eq(){return this;},in(){return this;},order(){return this;},
        async maybeSingle(){return await this;},
        async single(){return await this;},
        then(resolve,reject){
          const result=()=>{
            events.push({table,columns,operation});
            if(table==='profiles')return {data:profile,error:null};
            if(table==='role_permissions')return {data:permissions.map(p=>({permission_id:p.id})),error:null};
            if(table==='permissions')return {data:permissions,error:null};
            if(table==='projects')return {data:columns.includes('*')?{...PROJECT,contract_value:10000}:columns.includes('id,')? [PROJECT] : PROJECT,error:null};
            if(table==='project_summary')return {data:[FIN_SUMMARY],error:null};
            if(table==='project_work_items')return {data:[],error:null};
            if(table==='project_rap')return {data:{material:5000},error:null};
            if(table==='financial_transactions')return {data:[{id:'t1',amount:1000}],error:null};
            if(table==='progress_records')return {data:[],error:null};
            throw Error('Unexpected '+table);
          };
          return Promise.resolve().then(result).then(resolve,reject);
        }
      };
      return query;
    }
  };
  const window={};
  vm.runInNewContext(source,{window,console});
  return {api:window.SiKoyekDataAccess,client,events};
}
test('MARKETING reads safe project columns but never project_summary or financial transactions',async()=>{
  const h=harness('MARKETING');
  const s=await h.api.loadSummary(h.client);
  assert.equal(s.access.finance,false);
  assert.equal(s.summary.length,1);
  assert.equal(s.summary[0].contract_value,null);
  assert.equal(s.summary[0].total_rap,null);
  assert.equal(h.events.some(x=>x.table==='project_summary'),false);
  assert.equal(h.events.some(x=>x.table==='financial_transactions'),false);
  const d=await h.api.loadDetail(h.client,'p1',s.access);
  assert.equal(d.fin.length,0);assert.equal(d.rap,null);
  assert.equal(h.events.some(x=>x.table==='financial_transactions'),false);
  assert.equal(h.events.some(x=>x.table==='project_rap'),false);
  assert.equal(h.events.some(x=>x.table==='progress_records'),false);
  assert.equal(h.events.filter(x=>x.table==='projects').some(x=>x.columns==='*'),false);
});
test('PELAKSANA gets progress records but cannot query finance or RAP',async()=>{
  const h=harness('PELAKSANA');const s=await h.api.loadSummary(h.client);
  assert.equal(s.access.full,false);
  await h.api.loadDetail(h.client,'p1',s.access);
  assert.equal(h.events.some(x=>x.table==='progress_records'),true);
  assert.equal(h.events.some(x=>x.table==='financial_transactions'),false);
  assert.equal(h.events.some(x=>x.table==='project_summary'),false);
});
test('KEUANGAN can fetch finance summary but hides unverified progress and health metrics',async()=>{
  const h=harness('KEUANGAN');const s=await h.api.loadSummary(h.client);
  assert.equal(s.access.finance,true);
  assert.equal(s.access.progress,false);
  assert.equal(s.access.full,false);
  assert.equal(s.summary[0].total_rap,5000);
  assert.equal(s.summary[0].project_progress,null);
  assert.equal(s.summary[0].health_status,null);
  assert.equal(h.events.some(x=>x.table==='project_summary'),true);
  const d=await h.api.loadDetail(h.client,'p1',s.access);
  assert.equal(d.fin.length,1);
  assert.equal(d.progress.length,0);
  assert.equal(h.events.some(x=>x.table==='progress_records'),false);
});
test('ADMIN may query full authorized summary and detail financial records',async()=>{
  const h=harness('ADMIN');const s=await h.api.loadSummary(h.client);
  assert.equal(s.access.full,true);
  assert.equal(s.summary[0].project_progress,70);
  const d=await h.api.loadDetail(h.client,'p1',s.access);
  assert.equal(d.fin[0].amount,1000);
  assert.equal(h.events.some(x=>x.table==='progress_records'),true);
});
test('inactive user and inactive role deny all project and summary fetches',async()=>{
  for(const opts of [{active:false},{roleActive:false}]){
    const h=harness('ADMIN',opts);const s=await h.api.loadSummary(h.client);
    assert.equal(s.summary.length,0);
    assert.equal(s.access.projects,false);
    assert.equal(h.events.some(x=>['projects','project_summary','financial_transactions'].includes(x.table)),false);
  }
});
