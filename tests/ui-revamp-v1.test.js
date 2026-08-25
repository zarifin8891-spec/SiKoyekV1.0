const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('ui-revamp-v1.css', 'utf8');
const polish = fs.readFileSync('ui-form-polish-v2.css', 'utf8');
const input = fs.readFileSync('ui-input-revamp-v1.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const deploy = fs.readFileSync('.github/workflows/pages.yml', 'utf8');

assert.ok(css.includes('--ux-primary'), 'Design token primary missing');
assert.ok(css.includes('.ui-wizard'), 'Wizard styling missing');
assert.ok(css.includes('.ui-progress-card'), 'Progress styling missing');
assert.ok(polish.includes('.modalhead:before'), 'Form polish modal accent missing');
assert.ok(polish.includes('.formactions{position:sticky'), 'Sticky form actions missing');
assert.ok(input.includes('replace(/\\s/g,\'\').replace(\',\',\'.\')'), 'Decimal comma normalization missing');
assert.match(index, /function openProjectForm\(\)/, 'Project form missing');
assert.match(index, /function openItemForm\(\)/, 'Work-item form missing');
assert.match(index, /function openRapForm\(\)/, 'RAP form missing');
assert.match(index, /function progressView\(d\)/, 'Progress view missing');
assert.ok(deploy.includes('ui-revamp-v1.css'), 'UI revamp stylesheet must be injected by deployment');
assert.ok(deploy.includes('ui-form-polish-v2.css'), 'Form polish stylesheet must be injected by deployment');
assert.ok(deploy.includes('ui-input-revamp-v1.js'), 'Input enhancement module must be injected by deployment');

console.log('UI Revamp V2 form polish: PASS');
