const fs=require('fs');
const assert=require('assert');
const js=fs.readFileSync('ui-form-pass7.js','utf8');
const css=fs.readFileSync('ui-form-pass7.css','utf8');
const pages=fs.readFileSync('.github/workflows/pages.yml','utf8');

assert.ok(js.includes('p6CloseCategoryMaster'),'Pass 7 close hook missing');
assert.ok(js.includes('window.p6CloseCategoryMaster=closeCategoryAndRestore'),'Category master close hook not replaced');
assert.ok(js.includes('const existing=document.querySelector(\'#modal .modalbox\')'),'Existing project modal restore guard missing');
assert.ok(js.includes('Do not call\n      // openProjectForm() here'),'Duplicate modal prevention guard missing');
assert.ok(css.includes('.p6-body>.modalhead h3{visibility:visible'),'Revamp modal header title must be visible');
assert.ok(css.includes('min-height:76px'),'Revamp modal header sizing missing');
assert.ok(pages.includes('ui-form-pass7.js?v=1'),'Pass 7 JS deployment missing');
assert.ok(pages.includes('ui-form-pass7.css?v=1'),'Pass 7 CSS deployment missing');
console.log('UI Form Pass 7: PASS');
