const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
function storage(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}}
function setup(id='master',local=storage(),session=storage()){
 session.setItem('sikoyek-preview-role-'+id,'admin');
 const window={SIKOYEK_CONFIG:{id,backend:'preview',url:'https://'+id+'.invalid',key:'preview-only'}};
 const context=vm.createContext({window,URL,localStorage:local,sessionStorage:session,structuredClone,crypto:webcrypto,atob:s=>Buffer.from(s,'base64').toString()});
 for(const file of ['foundation/config.js','preview/seed.js','preview/backend.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return {client:window.supabase.createClient('https://'+id+'.invalid','preview-only'),window,local,session};
}
test('preview persists CRUD in its own environment, with no cross-client data',async()=>{
 const a=setup(),created=await a.client.from('projects').insert({project_code:'TEST-NEW',project_name:'New',status:'RENCANA'}).select().single();assert.equal(created.error,null);
 const b=setup('konstruva',a.local,a.session);assert.equal((await b.client.from('projects').select('*')).data.length,6);
 const reloaded=setup('master',a.local,a.session);assert.equal((await reloaded.client.from('projects').select('*')).data.length,7);
 await reloaded.client.from('projects').update({project_name:'Updated'}).eq('id',created.data.id);assert.equal((await reloaded.client.from('projects').select('*').eq('id',created.data.id).single()).data.project_name,'Updated');
 await reloaded.client.from('projects').delete().eq('id',created.data.id);assert.equal((await reloaded.client.from('projects').select('*')).data.length,6);
});
test('preview progress sums history and retains weighted contribution across periods',async()=>{
 const s=setup(),p=(await s.client.from('projects').insert({project_code:'P',project_name:'P',status:'RENCANA'}).select().single()).data;
 const item=(await s.client.from('project_work_items').insert({project_id:p.id,work_name:'Work',weight:0.4}).select().single()).data;
 await s.client.from('progress_records').insert([{project_id:p.id,work_item_id:item.id,progress_percentage:0.25},{project_id:p.id,work_item_id:item.id,progress_percentage:0.15}]);
 const summary=(await s.client.from('project_summary').select('*').eq('project_id',p.id).single()).data;assert.ok(Math.abs(summary.project_progress-16)<1e-9);
});
test('preview auth is tab scoped and direct unauthorized writes fail',async()=>{
 const s=setup();await s.client.auth.signOut();assert.equal((await s.client.auth.getSession()).data.session,null);
 assert.ok((await s.client.auth.signInWithPassword({email:'admin@preview.invalid',password:'wrong'})).error);
 assert.equal((await s.client.auth.signInWithPassword({email:'pelaksana@preview.invalid',password:'Preview123!'})).error,null);
 assert.ok((await s.client.from('projects').insert({project_code:'DENIED'})).error);
 assert.ok((await s.client.functions.invoke('user-management',{body:{action:'create'}})).error);
});
test('preview accepts only synthetic endpoints and serves exact filtered head counts',async()=>{
 const s=setup();assert.throws(()=>s.window.supabase.createClient('https://mmkusplegmittrlxqxby.supabase.co','preview-only'),/menolak/);
 const head=await s.client.from('progress_records').select('id',{head:true,count:'exact'}).eq('project_id','p0');assert.equal(head.count,2);assert.equal(head.data,null);
 const page=await s.client.from('projects').select('*').order('project_code').range(1,2);assert.equal(page.data.length,2);assert.equal(page.count,6);
});
