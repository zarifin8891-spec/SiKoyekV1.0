const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const before=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),after=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
assert.equal(before.length,after.length);
const results=before.map((old,i)=>{const next=after[i];assert.equal(next.role,old.role);assert.equal(next.name,old.name);const checks={};for(const field of ['text','controls','styles']){checks[field]=JSON.stringify(old[field])===JSON.stringify(next[field]);}return {role:old.role,scenario:old.name,checks,pass:Object.values(checks).every(Boolean),hashes:Object.fromEntries(['text','controls','styles'].map(k=>[k,{before:crypto.createHash('sha256').update(JSON.stringify(old[k])).digest('hex'),after:crypto.createHash('sha256').update(JSON.stringify(next[k])).digest('hex')}]))}});
const summary={snapshots:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>({role:r.role,scenario:r.scenario,checks:r.checks})),results};
if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify(summary,null,2));
console.log(JSON.stringify({snapshots:summary.snapshots,passed:summary.passed,failed:summary.failed},null,2));
if(summary.failed.length)process.exitCode=1;
