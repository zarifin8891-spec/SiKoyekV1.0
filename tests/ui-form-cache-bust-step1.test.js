const assert=require('node:assert/strict');
const fs=require('node:fs');
const pages=fs.readFileSync('.github/workflows/pages.yml','utf8');
assert.match(pages,/ui-form-pass6\.css\?v=2/,'Pass 6 CSS cache-bust missing');
assert.match(pages,/ui-form-pass6\.js\?v=2/,'Pass 6 JS cache-bust missing');
assert.match(pages,/ui-form-step1\.css\?v=2/,'Step 1 CSS cache-bust missing');
assert.match(pages,/ui-form-step1\.js\?v=2/,'Step 1 JS cache-bust missing');
console.log('UI form cache bust: PASS');
