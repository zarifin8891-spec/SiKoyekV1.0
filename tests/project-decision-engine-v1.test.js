const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('project-decision-engine-v1.js','utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(code,ctx);
const {evaluate}=ctx.window.SiKoyekDecisionEngine;

function health(status){return {status};}
const baseline={project_progress:20,cost_ratio:8.95,rap_consumption:12.78};
const healthy=evaluate(baseline,health('SEHAT'));
assert.equal(healthy.priority,'RENDAH');
assert.equal(healthy.status,'SEHAT');
assert.match(healthy.action,/pemantauan rutin/i);

const warningCost=evaluate({project_progress:20,cost_ratio:25,rap_consumption:12.78},health('PERLU PENGAWASAN'));
assert.equal(warningCost.priority,'SEDANG');
assert.match(warningCost.reason,/Cost Ratio/i);
assert.match(warningCost.action,/realisasi biaya/i);

const warningZero=evaluate({project_progress:0,cost_ratio:0.1,rap_consumption:0},health('PERLU PENGAWASAN'));
assert.match(warningZero.reason,/biaya\/RAP/i);
assert.match(warningZero.action,/Validasi transaksi/i);

const riskCost=evaluate({project_progress:20,cost_ratio:35,rap_consumption:12.78},health('BERISIKO'));
assert.equal(riskCost.priority,'TINGGI');
assert.match(riskCost.action,/Audit realisasi biaya/i);

const riskRap=evaluate({project_progress:20,cost_ratio:8.95,rap_consumption:45},health('BERISIKO'));
assert.equal(riskRap.priority,'TINGGI');
assert.match(riskRap.action,/pemakaian RAP/i);

const riskBoth=evaluate({project_progress:20,cost_ratio:40,rap_consumption:45},health('BERISIKO'));
assert.match(riskBoth.reason,/sama-sama/i);
assert.match(riskBoth.action,/pengeluaran berikutnya/i);

console.log('Decision Engine V1.0: PASS');
