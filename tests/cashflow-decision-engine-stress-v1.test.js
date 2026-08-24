const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('project-cashflow-decision-engine-v1.js','utf8');
const context={window:{}};vm.runInNewContext(source,context);
const engine=context.window.SiKoyekCashflowDecisionEngine;
assert.ok(engine);
const scenarios=[
  {name:'large positive buffer',cash_in:1000,cash_out:100,expected:'SEHAT'},
  {name:'80 percent boundary',cash_in:1000,cash_out:800,expected:'PERLU PENGAWASAN'},
  {name:'80 percent plus',cash_in:1000,cash_out:800.01,expected:'PERLU PENGAWASAN'},
  {name:'20 percent margin boundary',cash_in:1000,cash_out:800,net_cashflow:200,expected:'PERLU PENGAWASAN'},
  {name:'19.99 percent margin',cash_in:1000,cash_out:800.1,net_cashflow:199.9,expected:'PERLU PENGAWASAN'},
  {name:'negative net overrides positive reported ratio',cash_in:1000,cash_out:200,net_cashflow:-1,expected:'BERISIKO'},
  {name:'no inflow with outflow',cash_in:0,cash_out:50,expected:'BERISIKO'},
  {name:'no movement',cash_in:0,cash_out:0,expected:'SEHAT'},
  {name:'very small inflow and outflow',cash_in:1,cash_out:0.9,expected:'PERLU PENGAWASAN'},
  {name:'very strong inflow',cash_in:5000,cash_out:500,expected:'SEHAT'}
];
for(const s of scenarios){const r=engine.evaluate(s);assert.equal(r.status,s.expected,s.name);assert.ok(r.priority&&r.reason&&r.action,s.name);}
console.log(`Cash Flow Decision Engine stress: PASS (${scenarios.length} scenarios)`);
