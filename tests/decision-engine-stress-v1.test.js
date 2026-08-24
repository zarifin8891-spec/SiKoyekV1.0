const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('project-decision-engine-v1.js','utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(code,ctx);
const evaluate=ctx.window.SiKoyekDecisionEngine.evaluate;
function health(status){return {status};}
const cases=[
  {name:'Healthy baseline',row:{project_progress:20,cost_ratio:8.95,rap_consumption:12.78},status:'SEHAT',priority:'RENDAH'},
  {name:'Healthy zero activity',row:{project_progress:0,cost_ratio:0,rap_consumption:0},status:'SEHAT',priority:'RENDAH'},
  {name:'Warning cost only',row:{project_progress:20,cost_ratio:25,rap_consumption:12.78},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'Warning RAP only',row:{project_progress:20,cost_ratio:20,rap_consumption:31},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'Warning zero progress with cost',row:{project_progress:0,cost_ratio:0.1,rap_consumption:0},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'Risk cost only',row:{project_progress:20,cost_ratio:35,rap_consumption:12.78},status:'BERISIKO',priority:'TINGGI'},
  {name:'Risk RAP only',row:{project_progress:20,cost_ratio:8.95,rap_consumption:45},status:'BERISIKO',priority:'TINGGI'},
  {name:'Risk both',row:{project_progress:20,cost_ratio:40,rap_consumption:45},status:'BERISIKO',priority:'TINGGI'},
  {name:'Boundary warning cost',row:{project_progress:20,cost_ratio:25,rap_consumption:12.78},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'Boundary risk cost',row:{project_progress:20,cost_ratio:35,rap_consumption:12.78},status:'BERISIKO',priority:'TINGGI'},
  {name:'Boundary warning RAP',row:{project_progress:20,cost_ratio:20,rap_consumption:30},status:'PERLU PENGAWASAN',priority:'SEDANG'},
  {name:'Boundary risk RAP',row:{project_progress:20,cost_ratio:8.95,rap_consumption:40},status:'BERISIKO',priority:'TINGGI'}
];
for(const c of cases){
  const out=evaluate(c.row,health(c.status));
  assert.equal(out.status,c.status,`${c.name}: status`);
  assert.equal(out.priority,c.priority,`${c.name}: priority`);
  assert.equal(typeof out.reason,'string',`${c.name}: reason`);
  assert.equal(typeof out.action,'string',`${c.name}: action`);
  assert.ok(out.reason.length>10,`${c.name}: reason empty`);
  assert.ok(out.action.length>10,`${c.name}: action empty`);
}
console.log(`Decision Engine V1.0 stress test: PASS (${cases.length} scenarios)`);
