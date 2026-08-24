const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('project-cashflow-decision-engine-v1.js','utf8');
const context={window:{}};
vm.runInNewContext(source,context);
const engine=context.window.SiKoyekCashflowDecisionEngine;
assert.ok(engine,'Cash Flow Decision Engine export missing');

// Snapshot of the six current project cashflow rows from project_summary.
// This is a validation fixture, not production data storage.
const projects=[
  {code:'P26001',cash_in:55000000,cash_out:24600000,net_cashflow:30400000},
  {code:'P26002',cash_in:78000000,cash_out:50718000,net_cashflow:27282000},
  {code:'P26003',cash_in:29000000,cash_out:9500000,net_cashflow:19500000},
  {code:'P26004',cash_in:36000000,cash_out:20000000,net_cashflow:16000000},
  {code:'P26005',cash_in:7400000,cash_out:0,net_cashflow:7400000},
  {code:'P26006',cash_in:175600000,cash_out:0,net_cashflow:175600000}
];

for(const p of projects){
  const result=engine.evaluate(p);
  assert.equal(result.netCashflow,p.net_cashflow,p.code);
  assert.equal(result.status,'SEHAT',p.code);
  assert.equal(result.priority,'RENDAH',p.code);
  assert.ok(result.reason&&result.action,p.code);
}

console.log(`Current project cashflow validation: PASS (${projects.length} projects)`);
