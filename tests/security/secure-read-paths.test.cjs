'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const paths=[
  'foundation/data-access.js',
  'health-dashboard-integration-v1.js',
  'decision-dashboard-integration-v1.js',
  'dashboard-data-fallback-v1.js',
  'workspace.html',
  'daftar-proyek.html',
  'laporan-v1.js',
  'laporan-kinerja-proyek-v1.js',
  'laporan-kinerja-proyek-v2.js',
  'laporan-progress-project-v1.js',
  'laporan-extra-tabs-v1.js',
  'laporan-extra-tabs-v2.js',
  'laporan-extra-tabs-v3.js',
  'laporan-period-fill-v2.js',
  'laporan-unified-v3.js',
  'laporan-rap-biaya-v1.js',
  'cashflow-decision-dashboard-v1.js',
  'foundation/repository.js'
];
for(const filename of paths){
 test(filename+' does not bypass protected financial view RPCs',()=>{
   const source=fs.readFileSync(path.join(root,filename),'utf8');
   assert.doesNotMatch(source,/\.from\(\s*['"`]project_summary['"`]\s*\)/);
   assert.doesNotMatch(source,/\.from\(\s*['"`]project_cost_control['"`]\s*\)/);
   assert.doesNotMatch(source,/\.from\(\s*['"`]projects['"`]\s*\)\s*\.select\(\s*['"`][^'"`]*contract_value/);
 });
}
test('protected Supabase RPC names remain explicitly referenced by browser data access',()=>{
 const source=fs.readFileSync(path.join(root,'foundation/data-access.js'),'utf8');
 assert.match(source,/\.rpc\(['"`]sikoyek_secure_project_summary['"`]/);
 assert.match(source,/\.rpc\(['"`]sikoyek_secure_project_detail['"`]/);
 assert.match(source,/SAFE_PROJECT_COLUMNS=/);
});
test('staging-only SQL explicitly revokes public select on sensitive financial views',()=>{
 const source=fs.readFileSync(path.join(root,'docs/security-hardening/STAGING_ONLY_secure_financial_projection.sql'),'utf8');
 assert.match(source,/REVOKE ALL ON public\.project_summary,public\.project_cost_control/);
 assert.match(source,/REVOKE SELECT ON public\.projects FROM PUBLIC, anon, authenticated/);
 assert.match(source,/SECURITY DEFINER SET search_path=''/);
});

test('lifecycle cannot trust filtered finance transaction counts',()=>{
 const repository=fs.readFileSync(path.join(root,'foundation/repository.js'),'utf8');
 assert.match(repository,/sikoyek_secure_project_lifecycle/);
 assert.doesNotMatch(repository,/\.from\(['"`]financial_transactions['"`]\)/);
 assert.doesNotMatch(repository,/\.from\(['"`]projects['"`]\)\.select\(['"`]\*['"`]\)/);
});
test('read-only reports cannot query raw finance-bearing summary from Data API',()=>{
 for(const filename of ['laporan-rap-biaya-v1.js','cashflow-decision-dashboard-v1.js']){
  const source=fs.readFileSync(path.join(root,filename),'utf8');
  assert.match(source,/SiKoyekDataAccess\.loadSummary/);
 }
});
