const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{},Map,Set};
vm.runInNewContext(fs.readFileSync('foundation/repository.js','utf8'),context);
const repo=context.window.SiKoyekRepository;

function client(rows, error=null){
  const calls=[];
  return {calls,async rpc(name,{p_project_ids:ids}){
    assert.equal(name,'sikoyek_secure_project_lifecycle');
    calls.push(ids);
    return {data:rows.filter(row=>ids.includes(row.project.id)),error};
  }};
}
test('server lifecycle results remain authoritative even without finance history in the browser',async()=>{
  const rows=[
    {project:{id:'new',status:'RENCANA'},started:false,txCount:0,progressCount:0},
    {project:{id:'activity',status:'RENCANA'},started:true,txCount:1,progressCount:0}
  ];
  const c=client(rows);
  const result=await repo.lifecycleList(c,['new','activity']);
  assert.equal(result.get('new').started,false);
  assert.equal(result.get('activity').started,true);
  assert.equal((await repo.lifecycle(c,'activity')).started,true);
  assert.deepEqual(c.calls.map(ids=>ids.length),[2,1]);
});
test('failed or missing lifecycle read cannot unlock project editing',async()=>{
  const c=client([],{message:'fixture error'});
  await assert.rejects(repo.lifecycleList(c,['p']));
  await assert.rejects(repo.lifecycle(c,'p'));
  await assert.rejects(repo.lifecycle(client([]),'p'),/tidak ditemukan/);
});
test('project list keeps RPC batches at 100 IDs',async()=>{
  const rows=Array.from({length:203},(_,i)=>({project:{id:'p'+i,status:'RENCANA'},started:false}));
  const c=client(rows);
  const result=await repo.lifecycleList(c,rows.map(row=>row.project.id));
  assert.equal(result.size,203);
  assert.deepEqual(c.calls.map(ids=>ids.length),[100,100,3]);
});
test('detail uses only verified activity history',()=>{
  const project={id:'p',status:'RENCANA'};
  const verified={activityVerified:true,project,progress:[],fin:[]};
  assert.equal(repo.lifecycleFromDetail(verified).started,false);
  assert.equal(repo.lifecycleFromDetail({...verified,progress:[{}]}).started,true);
  assert.equal(repo.lifecycleFromDetail({...verified,fin:[{}]}).started,true);
  assert.equal(repo.lifecycleFromDetail({...verified,readError:{message:'error'}}),null);
  assert.equal(repo.lifecycleFromDetail({...verified,activityVerified:false}),null);
  assert.equal(repo.lifecycleFromDetail({project}),null);
});
