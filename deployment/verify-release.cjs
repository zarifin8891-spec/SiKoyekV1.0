/* Verify a prepared static artifact offline. Never connects to a backend. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function verifyRelease(root){
 root=path.resolve(root);const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
 assert.equal(manifest.mode,'cloud');assert.ok(manifest.tenants.length);assert.match(manifest.applicationRevision,/^[a-f0-9]{64}$/);
 const reference=manifest.tenants[0].entry.split('/')[0];let references=0;
 for(const tenant of manifest.tenants){
  assert.equal(tenant.applicationRevision,manifest.applicationRevision);assert.match(tenant.entry,/^[A-Za-z][A-Za-z0-9-]{0,63}\/index\.html$/);
  const directory=tenant.entry.split('/')[0],app=path.join(root,directory);
  const sandbox={window:{},URL,atob:s=>Buffer.from(s,'base64').toString('utf8')};
  const environment=fs.readFileSync(path.join(app,'environment.js'),'utf8');assert.equal(digest(environment),tenant.configurationHash,'Changed tenant configuration');
  vm.runInNewContext(environment,sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(app,'foundation/config.js'),'utf8'),sandbox);
  assert.equal(sandbox.window.SiKoyekConfig.id,tenant.id);assert.equal(sandbox.window.SiKoyekConfig.backend,'cloud');
  for(const [file,hash] of Object.entries(manifest.packageFiles)){
   assert.ok(!path.isAbsolute(file)&&!file.split('/').includes('..'));const bytes=fs.readFileSync(path.join(app,file));
   assert.equal(digest(bytes),hash,file);assert.deepEqual(bytes,fs.readFileSync(path.join(root,reference,file)),file);
   if(/\.(html|js|css)$/.test(file)){
    const text=bytes.toString();assert.doesNotMatch(text,/https:\/\/[a-z0-9]+\.supabase\.co|sb_secret_[A-Za-z0-9_-]{8,}|sb_publishable_[A-Za-z0-9_-]{8,}/,file);
    for(const match of text.matchAll(/["'](\.\/[^"'\s?]+\.(?:js|css))(?:\?[^"'\s]*)?["']/g)){
     const resolved=path.resolve(path.dirname(path.join(app,file)),match[1]);
     assert.ok(resolved.startsWith(app+path.sep)&&fs.existsSync(resolved),'Missing asset: '+file+' → '+match[1]);references++;
    }
    if(file.endsWith('.css'))for(const match of text.matchAll(/url\(["']?(\.\/[^"'\s)]+)["']?\)/g)){
     const resolved=path.resolve(path.dirname(path.join(app,file)),match[1]);assert.ok(resolved.startsWith(app+path.sep)&&fs.existsSync(resolved),'Missing CSS asset: '+file+' → '+match[1]);references++;
    }
   }
  }
  assert.ok(!fs.existsSync(path.join(app,'supabase')));assert.ok(!fs.existsSync(path.join(app,'deployment-package-v1.0')));
 }
 const selector=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const tenant of manifest.tenants)assert.ok(selector.includes('./'+tenant.entry.split('/')[0]+'/'));
 return {passed:true,applicationRevision:manifest.applicationRevision,tenants:manifest.tenants.map(t=>t.id),filesPerTenant:Object.keys(manifest.packageFiles).length,assetReferences:references};
}
module.exports={verifyRelease};
if(require.main===module)console.log(JSON.stringify(verifyRelease(process.argv[2]),null,2));
