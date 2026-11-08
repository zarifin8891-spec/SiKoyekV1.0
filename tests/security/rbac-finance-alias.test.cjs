'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../../rbac-nav-v1.js'), 'utf8');

function makeClient(permissions, role = 'KEUANGAN', active = true) {
  const rows = permissions.map((p, i) => ({ ...p, id: String(i + 1) }));
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'synthetic-user' } }, error: null }) },
    from(table) {
      if (table === 'profiles') return { select: () => ({ eq: () => ({
        maybeSingle: async () => ({ data: { is_active: active, role_id: 'synthetic-role', roles: { name: role } }, error: null })
      }) }) };
      if (table === 'role_permissions') return { select: () => ({ eq: async () => ({
        data: rows.map(row => ({ permission_id: row.id })), error: null
      }) }) };
      if (table === 'permissions') return { select: () => ({ in: async () => ({
        data: rows, error: null
      }) }) };
      throw new Error('Unexpected table: ' + table);
    }
  };
}

async function loadPermissionEngine(permissions, role = 'KEUANGAN', active = true) {
  const client = makeClient(permissions, role, active);
  const document = {
    readyState: 'loading', body: {},
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }
  };
  const window = {
    SK: { sb: client },
    SiKoyekFoundation: {
      singleFlight: fn => fn,
      Observer: class { observe() {} }
    }
  };
  const context = vm.createContext({ window, document, setTimeout() {}, clearTimeout() {}, console });
  vm.runInContext(source, context, { filename: 'rbac-nav-v1.js' });
  await window.applyRBACNav();
  return window;
}

test('KONSTRUVA finance VIEW maps to frontend KEUANGAN and FINANCE', async () => {
  const window = await loadPermissionEngine([{ module: 'finance', action: 'view' }]);
  assert.equal(window.sikoyekCanView('KEUANGAN'), true);
  assert.equal(window.sikoyekCanView('FINANCE'), true);
  assert.equal(window.sikoyekCan('KEUANGAN', 'ADD'), false);
  assert.equal(window.sikoyekCanView('PROGRESS'), false);
});

test('KONSTRUVA finance ADD grants ADD only, not EDIT or DELETE', async () => {
  const window = await loadPermissionEngine([{ module: 'finance', action: 'add' }]);
  assert.equal(window.sikoyekCan('KEUANGAN', 'ADD'), true);
  assert.equal(window.sikoyekCan('FINANCE', 'ADD'), true);
  assert.equal(window.sikoyekCan('KEUANGAN', 'EDIT'), false);
  assert.equal(window.sikoyekCan('KEUANGAN', 'DELETE'), false);
});

test('MASTER KEUANGAN uppercase remains compatible', async () => {
  const window = await loadPermissionEngine([{ module: 'KEUANGAN', action: 'ADD' }]);
  assert.equal(window.sikoyekCan('KEUANGAN', 'ADD'), true);
  assert.equal(window.sikoyekCan('FINANCE', 'ADD'), true);
});

test('Permission checks never grant unrelated modules', async () => {
  const window = await loadPermissionEngine([
    { module: 'finance', action: 'view' }, { module: 'projects', action: 'view' }
  ]);
  assert.equal(window.sikoyekCanView('PROJECTS'), true);
  assert.equal(window.sikoyekCan('PROJECTS', 'DELETE'), false);
  assert.equal(window.sikoyekCanView('USERS'), false);
});

test('A non-admin with no assigned permissions has no access', async () => {
  const window = await loadPermissionEngine([], 'MARKETING');
  assert.equal(window.sikoyekCanView('KEUANGAN'), false);
  assert.equal(window.sikoyekCan('PROJECTS', 'ADD'), false);
});

test('Inactive profile cannot load any permissions', async () => {
  const window = await loadPermissionEngine([{ module: 'finance', action: 'view' }], 'KEUANGAN', false);
  assert.equal(window.sikoyekCanView('KEUANGAN'), false);
  assert.equal(window.sikoyekCan('KEUANGAN', 'ADD'), false);
});

test('Admin UI permission behavior is preserved', async () => {
  const window = await loadPermissionEngine([], 'ADMIN');
  assert.equal(window.sikoyekCanView('KEUANGAN'), true);
  assert.equal(window.sikoyekCan('KEUANGAN', 'DELETE'), true);
});

// UI tests only. Authorization to read or mutate data MUST be enforced by backend RLS.
