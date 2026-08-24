const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('project-health-engine-v1.js', 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);

const evaluate = sandbox.window.SiKoyekHealthEngine.evaluate;
assert.equal(typeof evaluate, 'function');

// Stable / healthy baseline from P26001.
assert.equal(evaluate({ project_progress: 20, cost_ratio: 8.95, rap_consumption: 12.78 }).status, 'SEHAT');

// Cost deviation >= 5 percentage points -> monitoring.
assert.equal(evaluate({ project_progress: 20, cost_ratio: 25, rap_consumption: 12.78 }).status, 'PERLU PENGAWASAN');

// RAP deviation >= 10 percentage points -> monitoring.
assert.equal(evaluate({ project_progress: 20, cost_ratio: 8.95, rap_consumption: 31 }).status, 'PERLU PENGAWASAN');

// Cost deviation >= 15 percentage points -> risk.
assert.equal(evaluate({ project_progress: 20, cost_ratio: 35, rap_consumption: 12.78 }).status, 'BERISIKO');

// RAP deviation >= 20 percentage points -> risk.
assert.equal(evaluate({ project_progress: 20, cost_ratio: 8.95, rap_consumption: 41 }).status, 'BERISIKO');

// Zero progress with spending -> monitoring.
assert.equal(evaluate({ project_progress: 0, cost_ratio: 0.1, rap_consumption: 0 }).status, 'PERLU PENGAWASAN');

console.log('Health Engine V1.0 tests: PASS');
