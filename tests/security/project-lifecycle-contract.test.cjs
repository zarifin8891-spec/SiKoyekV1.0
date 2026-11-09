'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'foundation/repository.js'),'utf8');
function harness({fail=false}={}){
  const calls=[];
  const window={};
  vm.runInNewContext(source,{window});
  const client={
    rpc:async(name,args)=>{
      calls.push({name,args:Array.from(args.p_project_ids)});
      if(fail)return {data:null,error:new Error('Synthetic backend denial')};
      return {data:args.p_project_ids.map(id=>({
        id,project:{id,project_name:'Synthetic',status:'RENCANA'},
        started:id==='p1',txCount:id==='p1'?1:0,progressCount:0
      })),error:null};
    },
    from(){throw Error('Repository may not query raw finance/project tables');}
  };
  return {repository:window.SiKoyekRepository,client,calls};
}
test('lifecycle uses a single authorization-scoped RPC, not raw finance counts',async()=>{
  const h=harness();
  const result=await h.repository.lifecycle(h.client,'p1');
  assert.equal(result.started,true);
  assert.equal(result.project.id,'p1');
  assert.equal(result.txCount,1);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].name,'sikoyek_secure_project_lifecycle');
});
test('life-cycle failure denies edits rather than assuming no transactions',async()=>{
  const h=harness({fail:true});
  await assert.rejects(()=>h.repository.lifecycle(h.client,'p1'),/Synthetic backend denial/);
});
test('lifecycleList batches 100 project IDs and preserves authority flags',async()=>{
  const h=harness();
  const ids=['p1',...Array.from({length:209},(_,i)=>'p'+(i+2))];
  const results=await h.repository.lifecycleList(h.client,ids);
  assert.equal(results.size,210);
  assert.equal(h.calls.length,3);
  assert.deepEqual(h.calls.map(c=>c.args.length),[100,100,10]);
  assert.equal(results.get('p1').started,true);
});
test('unverified, filtered detail cannot infer a project has no activity',()=>{
  const h=harness();
  assert.equal(h.repository.lifecycleFromDetail({
    project:{id:'p1',status:'RENCANA'},progress:[],fin:[]
  }),null);
});
test('project and edit forms do not request or overwrite raw contract values for restricted users',()=>{
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const edit=fs.readFileSync(path.join(root,'ui-form-edit-final-v5.js'),'utf8');
  assert.match(index,/\.from\('projects'\)\.insert\(row\)\.select\('id'\)\.single\(\)/);
  assert.doesNotMatch(index,/\.from\('projects'\)\.insert\(row\)\.select\(\)\.single\(\)/);
  assert.match(index,/state\.access\?\.finance\?\{contract_value:/);
  assert.match(edit,/SiKoyekDataAccess\?\.resolve\(sb\)/);
  assert.match(edit,/p5_contract'\)\?\.closest\('\.ui-final-field'\)\?\.remove/);
});
