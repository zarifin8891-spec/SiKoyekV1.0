const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('project-decision-engine-v1-1.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const engine = context.window.SiKoyekUnifiedDecisionEngine;
assert.ok(engine, 'Unified Decision Engine V1.1 export missing');

// Snapshot of the six current production projects used only for validation.
// This test never writes to Supabase or production data.
const projects = [
  { code: 'P26001', project_progress: 20, cost_ratio: 8.9454545455, rap_consumption: 12.7792207792, cash_in: 55000000, cash_out: 24600000, net_cashflow: 30400000 },
  { code: 'P26002', project_progress: 100, cost_ratio: 65.0230769231, rap_consumption: 92.8901098901, cash_in: 78000000, cash_out: 50718000, net_cashflow: 27282000 },
  { code: 'P26003', project_progress: 10, cost_ratio: 6.5517241379, rap_consumption: 9.3596059113, cash_in: 29000000, cash_out: 9500000, net_cashflow: 19500000 },
  { code: 'P26004', project_progress: 20, cost_ratio: 11.1111111111, rap_consumption: 15.8730158730, cash_in: 36000000, cash_out: 20000000, net_cashflow: 16000000 },
  { code: 'P26005', project_progress: 0, cost_ratio: 0, rap_consumption: 0, cash_in: 7400000, cash_out: 0, net_cashflow: 7400000 },
  { code: 'P26006', project_progress: 0, cost_ratio: 0, rap_consumption: 0, cash_in: 175600000, cash_out: 0, net_cashflow: 175600000 },
];

for (const project of projects) {
  const result = engine.evaluate(project);
  assert.equal(result.status, 'SEHAT', project.code);
  assert.equal(result.priority, 'RENDAH', project.code);
  assert.ok(result.reason && result.action, project.code);
  assert.ok(result.health && result.cash, project.code);
}

assert.equal(projects.length, 6);
console.log('Unified Decision Engine V1.1 real-project validation: PASS (6/6 healthy-low)');
