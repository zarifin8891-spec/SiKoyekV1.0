'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../../dashboard-graphs.js'), 'utf8');

async function harness({ hasRBAC = true, finance = false, resolveRBAC = false, existingChart = false } = {}) {
  let queries = 0;
  let inserted = 0;
  let removed = 0;
  const events = {};
  const panel = { parentNode: { insertBefore: () => { inserted++; } } };
  const chart = existingChart ? { remove: () => { removed++; } } : null;
  const page = { querySelector: selector => {
    if (selector === '.dashboard-panels') return panel;
    if (selector === '.dashboard-graphs-section') return chart;
    return null;
  } };
  const document = {
    body: {},
    head: { appendChild: () => {} },
    getElementById: name => name === 'page' ? page : null,
    createElement: tag => ({ tagName: tag.toUpperCase(), style: {}, innerHTML: '' }),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const window = {
    SiKoyekFoundation: {
      money: n => String(n),
      Observer: class { observe() {} },
    },
    sikoyekCanView: module => module === 'KEUANGAN' && finance,
    addEventListener: (event, cb) => { events[event] = cb; },
  };
  if (hasRBAC) window.__SIKOYEK_RBAC_PERMISSIONS_V6__ = { role: 'staff', views: { KEUANGAN: finance } };
  if (resolveRBAC) window.applyRBACNav = async () => {
    window.__SIKOYEK_RBAC_PERMISSIONS_V6__ = { role: 'staff', views: { KEUANGAN: finance } };
  };
  const sb = { from: table => {
    if (table !== 'financial_transactions') throw Error('Unexpected table ' + table);
    return { select: () => ({ in: async () => {
      queries++;
      return { data: [], error: null };
    } }) };
  } };
  const state = { page: 'dashboard', period: {}, summary: [{
    project_id: 'synthetic-project', project_code: 'SIM-001',
    project_name: 'Synthetic Test Project', project_progress: 10, cost_ratio: 15,
  }] };
  vm.runInNewContext(source, { document, window, sb, state, toast() {}, console, setTimeout }, {
    filename: 'dashboard-graphs.js',
  });
  await new Promise(resolve => setImmediate(resolve));
  return { queries, inserted, removed, events };
}

test('MARKETING/PELAKSANA without finance VIEW cannot query raw financial transactions', async () => {
  const result = await harness({ finance: false });
  assert.equal(result.queries, 0);
  assert.equal(result.inserted, 0);
});

test('Financial graphs do not query when RBAC is not loaded', async () => {
  const result = await harness({ hasRBAC: false, finance: true });
  assert.equal(result.queries, 0);
  assert.equal(result.inserted, 0);
});

test('Authorized role can query and render financial graphs', async () => {
  const result = await harness({ finance: true });
  assert.equal(result.queries, 1);
  assert.equal(result.inserted, 1);
});

test('When RBAC resolves after load, authorized role can query', async () => {
  const result = await harness({ hasRBAC: false, finance: true, resolveRBAC: true });
  assert.equal(result.queries, 1);
});

test('Restricted role removes existing graph, preventing leftover financial visuals', async () => {
  const result = await harness({ finance: false, existingChart: true });
  assert.equal(result.queries, 0);
  assert.equal(result.removed, 1);
});

test('Explicit RBAC-ready event is registered for late authorization', async () => {
  const result = await harness({ finance: false });
  assert.equal(typeof result.events['sikoyek:rbac-ready'], 'function');
});

// These tests cover this graph module only. Main dashboard, summary view,
// RLS and Edge Function still require independent staging integration tests.
