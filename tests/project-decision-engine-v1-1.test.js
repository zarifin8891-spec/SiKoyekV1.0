const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('project-decision-engine-v1-1.js','utf8');
const context={window:{}};
vm.runInNewContext(source,context);
const engine=context.window.SiKoyekUnifiedDecisionEngine;
assert.ok(engine,'Unified Decision Engine V1.1 export missing');

const cases=[
  {name:'healthy all around',input:{project_progress:50,cost_ratio:40,rap_consumption:45,cash_in:100,cash_out:30,net_cashflow:70},status:'SEHAT',priority:'RENDAH'},
  {name:'health warning only',input:{project_progress:40,cost_ratio:46,rap_consumption:42,cash_in:100,cash_out:30,net_cashflow:70},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'cash warning only',input:{project_progress:40,cost_ratio:40,rap_consumption:42,cash_in:100,cash_out:85,net_cashflow:15},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'combined warning',input:{project_progress:20,cost_ratio:28,rap_consumption:31,cash_in:100,cash_out:85,net_cashflow:15},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'health risk only',input:{project_progress:20,cost_ratio:38,rap_consumption:25,cash_in:100,cash_out:30,net_cashflow:70},status:'BERISIKO',priority:'TINGGI'},
  {name:'cash risk only',input:{project_progress:50,cost_ratio:40,rap_consumption:45,cash_in:50,cash_out:60,net_cashflow:-10},status:'BERISIKO',priority:'TINGGI'},
  {name:'combined risk',input:{project_progress:20,cost_ratio:40,rap_consumption:45,cash_in:50,cash_out:60,net_cashflow:-10},status:'BERISIKO',priority:'TINGGI'}
];

for(const c of cases){
  const r=engine.evaluate(c.input);
  assert.equal(r.status,c.status,c.name);
  assert.equal(r.priority,c.priority,c.name);
  assert.ok(r.reason&&r.action,c.name);
  assert.ok(r.health&&r.cash,c.name);
}

console.log(`Unified Decision Engine V1.1: PASS (${cases.length} scenarios)`);
