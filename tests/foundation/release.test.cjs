const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {buildRelease}=require('../../deployment/build-release.cjs');
const {verifyRelease}=require('../../deployment/verify-release.cjs');
const sourceRoot=path.resolve('.');
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'sikoyek-release-'))}
test('all Cloud clients receive identical application bytes with only environment configuration differing',()=>{
 const outRoot=temp(),tenants=['master','konstruva'].map(id=>JSON.parse(fs.readFileSync('deployment/environments/'+id+'.json'))).concat({id:'new-client',name:'New Client',backend:'cloud',url:'https://newclientfixture.supabase.co',key:'sb_publishable_fixture'});
 try{const manifest=buildRelease({sourceRoot,outRoot,tenants});assert.equal(new Set(manifest.tenants.map(t=>t.applicationRevision)).size,1);for(const file of Object.keys(manifest.sourceFiles)){const first=fs.readFileSync(path.join(outRoot,'Master',file));for(const directory of ['konstruva','new-client'])assert.deepEqual(fs.readFileSync(path.join(outRoot,directory,file)),first,file)}assert.match(fs.readFileSync(path.join(outRoot,'konstruva/environment.js'),'utf8'),/fadxsycdgzuctvmhhjty/);assert.match(fs.readFileSync(path.join(outRoot,'index.html'),'utf8'),/\.\/Master\//)}finally{fs.rmSync(outRoot,{recursive:true,force:true})}
});
test('release verification rejects changed bytes and checks shared assets without a backend',()=>{
 const outRoot=temp(),tenants=['master','konstruva'].map(id=>JSON.parse(fs.readFileSync('deployment/environments/'+id+'.json')));
 try{const manifest=buildRelease({sourceRoot,outRoot,tenants});assert.equal(verifyRelease(outRoot).passed,true);
  assert.ok(fs.readFileSync(path.join(outRoot,'Master/index.html'),'utf8').includes('environment.js?v='+manifest.applicationRevision));
  assert.ok(fs.readFileSync(path.join(outRoot,'Master/core-unified-shell-v2.js'),'utf8').includes('laporan-finance-period-fix-v2.js?v='+manifest.applicationRevision));
  fs.appendFileSync(path.join(outRoot,'konstruva/index.html'),'tampered');assert.throws(()=>verifyRelease(outRoot));
  fs.copyFileSync(path.join(outRoot,'Master/index.html'),path.join(outRoot,'konstruva/index.html'));
  fs.appendFileSync(path.join(outRoot,'konstruva/environment.js'),'// changed tenant');assert.throws(()=>verifyRelease(outRoot));
 }finally{fs.rmSync(outRoot,{recursive:true,force:true})}
});
test('preview package includes no production URL/key, SDK or executable tests and forbids connections',()=>{
 const outRoot=temp();try{buildRelease({sourceRoot,outRoot,preview:true,tenants:[{id:'master',name:'MASTER',backend:'preview',url:'https://master.invalid',key:'preview-only'}]});const inspect=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())inspect(file);else if(/\.(js|html|css)$/.test(file)){const text=fs.readFileSync(file,'utf8');assert.doesNotMatch(text,/mmkusplegmittrlxqxby|fadxsycdgzuctvmhhjty|supabase-js@2|sb_publishable_m9q|sb_publishable_kdVG/,file);if(file.endsWith('.html'))assert.match(text,/connect-src 'none'/,file)}}};inspect(outRoot);assert.equal(fs.existsSync(path.join(outRoot,'master/tests')),false);assert.equal(fs.existsSync(path.join(outRoot,'master/supabase')),false)}finally{fs.rmSync(outRoot,{recursive:true,force:true})}
});
test('build rejects unsafe/duplicate folders, invalid configuration and nonempty output',()=>{
 const outRoot=temp(),config=JSON.parse(fs.readFileSync('deployment/environments/master.json'));try{assert.throws(()=>buildRelease({sourceRoot,outRoot,tenants:[{...config,directory:'../wrong'}]}));assert.throws(()=>buildRelease({sourceRoot,outRoot,tenants:[config,config]}));fs.writeFileSync(path.join(outRoot,'keep'),'keep');assert.throws(()=>buildRelease({sourceRoot,outRoot,tenants:[config]}));assert.equal(fs.readFileSync(path.join(outRoot,'keep'),'utf8'),'keep')}finally{fs.rmSync(outRoot,{recursive:true,force:true})}
});
