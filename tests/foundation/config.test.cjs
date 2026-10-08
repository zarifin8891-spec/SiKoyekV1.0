const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('foundation/config.js','utf8');
const config={id:'master',backend:'cloud',url:'https://mmkusplegmittrlxqxby.supabase.co',key:'sb_publishable_test_only'};
function load(input){const sandbox={window:{SIKOYEK_CONFIG:input},URL,atob:value=>Buffer.from(value,'base64').toString()};vm.runInNewContext(script,sandbox);return sandbox.window.SiKoyekConfig}
test('each real environment selects exactly its own project and session key',()=>{
 for(const name of ['master','konstruva']){const env=JSON.parse(fs.readFileSync('deployment/environments/'+name+'.json'));const actual=load(env);assert.equal(actual.url,env.url);assert.equal(actual.storageKey,'sb-'+new URL(env.url).hostname.split('.')[0]+'-auth-token');assert.ok(Object.isFrozen(actual))}
});
test('missing or template configuration cannot fall back to MASTER',()=>{assert.throws(()=>load(undefined));assert.throws(()=>load(JSON.parse(fs.readFileSync('deployment/environments/client-template.json'))));assert.throws(()=>load({...config,id:'../master'}));});
test('secret/service-role credentials cannot be placed in a browser package',()=>{for(const key of ['sb_secret_not_allowed','', 'eyJ.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature'])assert.throws(()=>load({...config,key}));const anon='eyJ.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';assert.equal(load({...config,key:anon}).key,anon)});
test('preview configuration rejects a production database and credential',()=>{assert.throws(()=>load({...config,backend:'preview',key:'preview-only'}));assert.throws(()=>load({...config,backend:'preview',url:'https://test.invalid'}));assert.equal(load({...config,backend:'preview',url:'https://test.invalid',key:'preview-only'}).backend,'preview')});
