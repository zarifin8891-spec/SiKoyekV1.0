const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('project-health-engine-v1.js','utf8'),sandbox);
const evaluate=sandbox.window.SiKoyekHealthEngine.evaluate;
// Preserve the Health V2 formula already deployed in both Cloud environments.
for(const [progress,rap,status] of [[20,12.78,'SEHAT'],[20,20,'SEHAT'],[20,20.01,'AWASI'],[20,25,'AWASI'],[20,25.01,'BERISIKO'],[0,0.1,'AWASI'],[0,6,'BERISIKO']]){
 const actual=evaluate({project_progress:progress,rap_consumption:rap,cost_ratio:99});
 assert.equal(actual.status,status);assert.equal(actual.gap,progress-rap);assert.equal(actual.engineVersion,'2.0');
}
assert.equal(evaluate({project_progress:20,cost_ratio:99,rap_consumption:10}).status,'SEHAT');
console.log('Deployed Health V2 boundary contracts: PASS');
