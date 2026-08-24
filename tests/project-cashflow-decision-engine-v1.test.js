const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('project-cashflow-decision-engine-v1.js','utf8');
const context={window:{}};vm.runInNewContext(source,context);
const engine=context.window.SiKoyekCashflowDecisionEngine;
assert.ok(engine,'Cash Flow Decision Engine export missing');
const cases=[
  {name:'zero cash activity',input:{cash_in:0,cash_out:0,net_cashflow:0},status:'SEHAT',priority:'RENDAH'},
  {name:'healthy buffer',input:{cash_in:100,cash_out:40,net_cashflow:60},status:'SEHAT',priority:'RENDAH'},
  {name:'exact 80 percent outflow',input:{cash_in:100,cash_out:80,net_cashflow:20},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'thin buffer',input:{cash_in:100,cash_out:81,net_cashflow:19},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'negative net',input:{cash_in:100,cash_out:101,net_cashflow:-1},status:'BERISIKO',priority:'TINGGI'},
  {name:'outflow without inflow',input:{cash_in:0,cash_out:5,net_cashflow:-5},status:'BERISIKO',priority:'TINGGI'},
  {name:'strong inflow',input:{cash_in:250,cash_out:50,net_cashflow:200},status:'SEHAT',priority:'RENDAH'},
  {name:'boundary below 80',input:{cash_in:100,cash_out:79.99,net_cashflow:20.01},status:'SEHAT',priority:'RENDAH'},
  {name:'boundary net margin 20',input:{cash_in:100,cash_out:80,net_cashflow:20},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'explicit net override',input:{cash_in:100,cash_out:30,net_cashflow:-5},status:'BERISIKO',priority:'TINGGI'}
];
for(const c of cases){const r=engine.evaluate(c.input);assert.equal(r.status,c.status,c.name);assert.equal(r.priority,c.priority,c.name);assert.ok(r.reason&&r.action,c.name);}
console.log(`Cash Flow Decision Engine V1.0: PASS (${cases.length} scenarios)`);
