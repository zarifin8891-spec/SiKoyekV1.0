const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('ui-revamp-v1.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const deploy = fs.readFileSync('.github/workflows/pages.yml', 'utf8');

assert.ok(css.includes('--ux-primary'), 'Design token primary missing');
assert.ok(css.includes('.ui-wizard'), 'Wizard styling missing');
assert.ok(css.includes('.ui-progress-card'), 'Progress styling missing');
assert.match(index, /function openProjectForm\(\)/, 'Project form missing');
assert.match(index, /function openItemForm\(\)/, 'Work-item form missing');
assert.match(index, /function openRapForm\(\)/, 'RAP form missing');
assert.match(index, /function progressView\(d\)/, 'Progress view missing');
assert.ok(deploy.includes('ui-revamp-v1.css'), 'UI revamp stylesheet must be injected by deployment');
assert.ok(deploy.includes('ui-revamp-v1.js'), 'UI revamp module must be injected by deployment');

console.log('UI Revamp V1: PASS');
