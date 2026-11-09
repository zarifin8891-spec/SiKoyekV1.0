import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const [statusFile, tenant] = process.argv.slice(2);
assert.ok(['MASTER', 'KONSTRUVA'].includes(tenant), 'Use a named synthetic tenant');
const config = Object.fromEntries(readFileSync(statusFile, 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z_]+)="([^"]+)"$/);
  return match ? [[match[1], match[2]]] : [];
}));
assert.equal(config.API_URL, 'http://127.0.0.1:54321', 'Only the disposable local API is allowed');
const anonKey = config.ANON_KEY;
const serviceKey = config.SERVICE_ROLE_KEY;
assert.ok(anonKey && serviceKey, 'Local Supabase JWT keys are required');

async function request(path, { method = 'GET', body, token = anonKey, key = anonKey } = {}) {
  const response = await fetch(config.API_URL + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(25_000),
    headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.text();
  return { status: response.status, data: payload ? JSON.parse(payload) : null };
}

function expectStatus(result, status, label) {
  const accepted = Array.isArray(status) ? status : [status];
  const reason = result.status >= 400 ? (result.data?.code ?? result.data?.error_code ?? '') : '';
  assert.ok(accepted.includes(result.status), `${tenant} ${label}: HTTP ${result.status} ${reason}, expected ${accepted.join('/')}`);
  return result.data;
}

const auth = '/auth/v1';
const rest = '/rest/v1';
const edge = '/functions/v1/user-management';
const service = { key: serviceKey, token: serviceKey };
const edgeCall = (token, body) => request(edge, { method: 'POST', token, body });
const password = randomUUID() + '!Aa1';
const nextPassword = randomUUID() + '!Aa2';
const domain = 'example.com';
const login = (email, credential = password) => request(auth + '/token?grant_type=password', {
  method: 'POST', body: { email, password: credential },
});
const refresh = refresh_token => request(auth + '/token?grant_type=refresh_token', {
  method: 'POST', body: { refresh_token },
});
const jwtSubject = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).sub;
const roles = expectStatus(await request(rest + '/roles?select=id,name', service), 200, 'read seeded roles');
const roleIds = Object.fromEntries(roles.map(role => [role.name, role.id]));
for (const role of ['ADMIN', 'DIREKTUR', 'KEUANGAN', 'MARKETING', 'PELAKSANA']) {
  assert.ok(roleIds[role], `Missing synthetic role ${role}`);
}

const adminEmail = 'admin-' + randomUUID() + '@' + domain;
const admin = expectStatus(await request(auth + '/admin/users', {
  ...service, method: 'POST', body: { email: adminEmail, password, email_confirm: true },
}), [200, 201], 'bootstrap Auth admin');
expectStatus(await request(rest + '/profiles', {
  ...service, method: 'POST',
  body: { id: admin.id, email: adminEmail, full_name: 'Staging Admin', role: 'STAFF', role_id: roleIds.ADMIN },
}), 201, 'bootstrap Admin profile');
const adminSession = expectStatus(await login(adminEmail), 200, 'Admin password sign-in');
assert.equal(adminSession.user.id, admin.id);
assert.equal(jwtSubject(adminSession.access_token), admin.id);
expectStatus(await login(adminEmail, 'incorrect-password'), 400, 'wrong password');
expectStatus(await edgeCall(anonKey, { action: 'create' }), 401, 'anonymous Edge access');
expectStatus(await edgeCall('invalid.jwt.token', { action: 'create' }), 401, 'forged Edge token');

const activeAdmin = expectStatus(await refresh(adminSession.refresh_token), 200, 'Admin refresh');
assert.notEqual(activeAdmin.refresh_token, adminSession.refresh_token, 'GoTrue must rotate the refresh token');
const adminToken = activeAdmin.access_token;
assert.equal(jwtSubject(adminToken), admin.id);
assert.equal(expectStatus(await request(auth + '/user', { token: adminToken }), 200, 'getUser after refresh').id, admin.id);

const accounts = {};
for (const role of ['DIREKTUR', 'KEUANGAN', 'MARKETING', 'PELAKSANA']) {
  const email = role.toLowerCase() + '-' + randomUUID() + '@' + domain;
  const created = expectStatus(await edgeCall(adminToken, {
    action: 'create', email, password, role_id: roleIds[role], full_name: 'Synthetic ' + role,
  }), 200, 'Edge create ' + role);
  assert.equal(created.success, true);
  const session = expectStatus(await login(email), 200, 'password sign-in ' + role);
  assert.equal(session.user.id, created.user_id);
  accounts[role] = { id: created.user_id, email, session };
}
accounts.ADMIN = { id: admin.id, email: adminEmail, session: activeAdmin };

// Put a misleading legacy role on Marketing and ensure the canonical role_id still wins.
expectStatus(await request(rest + '/profiles?id=eq.' + accounts.MARKETING.id, {
  ...service, method: 'PATCH', body: { role: 'ADMIN' },
}), 204, 'seed a misleading legacy Marketing role');

for (const [role, account] of Object.entries(accounts)) {
  const token = account.session.access_token;
  const profile = expectStatus(await request(rest + '/profiles?select=id,role_id&id=eq.' + account.id, { token }), 200, 'own profile ' + role);
  assert.deepEqual(profile, [{ id: account.id, role_id: roleIds[role] }]);
  const projects = expectStatus(await request(rest + '/projects?select=id,project_code', { token }), 200, 'project visibility ' + role);
  assert.equal(projects.length, 1, `${role} should read the staging project`);
  expectStatus(await request(rest + '/projects?select=contract_value', { token }), 403, 'deny raw contract ' + role);
  const finance = ['ADMIN', 'DIREKTUR', 'KEUANGAN'].includes(role);
  const contracts = expectStatus(await request(rest + '/rpc/sikoyek_secure_project_contracts', { token }), finance ? 200 : 403, 'contract RPC ' + role);
  if (finance) assert.equal(contracts[0].contract_value, 9000000);
  if (role !== 'ADMIN') expectStatus(await edgeCall(token, { action: 'delete', id: admin.id }), 403, 'deny account management ' + role);
}
console.log(tenant + ' PASS real password login, refresh rotation, Edge authorization and RLS for five roles');

const target = accounts.MARKETING;
const oldTargetToken = target.session.access_token;
expectStatus(await edgeCall(adminToken, {
  action: 'update', id: target.id, role_id: roleIds.KEUANGAN, full_name: 'Changed in staging',
}), 200, 'change role through Edge');
expectStatus(await request(rest + '/rpc/sikoyek_secure_project_contracts', { token: oldTargetToken }), 200, 'changed role applies to existing JWT');
expectStatus(await edgeCall(adminToken, { action: 'update', id: target.id, is_active: false }), 200, 'disable profile');
assert.deepEqual(expectStatus(await request(rest + '/projects?select=id', { token: oldTargetToken }), 200, 'inactive user loses project access'), []);
expectStatus(await request(rest + '/rpc/sikoyek_secure_project_contracts', { token: oldTargetToken }), 403, 'inactive user loses financial access');
const inactiveSession = expectStatus(await refresh(target.session.refresh_token), 200, 'Auth may refresh an application-disabled profile');
assert.deepEqual(expectStatus(await request(rest + '/projects?select=id', { token: inactiveSession.access_token }), 200, 'refreshed token still has no access'), []);
expectStatus(await edgeCall(adminToken, { action: 'update', id: target.id, is_active: true }), 200, 'reactivate profile');
expectStatus(await edgeCall(adminToken, {
  action: 'reset_password', id: target.id, password: nextPassword, password_confirm: nextPassword,
}), 200, 'reset password through Edge');
expectStatus(await login(target.email), 400, 'old password after reset');
const resetSession = expectStatus(await login(target.email, nextPassword), 200, 'new password after reset');
expectStatus(await request(auth + '/logout?scope=local', { method: 'POST', token: resetSession.access_token }), 204, 'local sign-out');
expectStatus(await refresh(resetSession.refresh_token), [400, 401], 'signed-out refresh token rejected');

const view = expectStatus(await request(rest + '/permissions?select=id&name=eq.projects.view', service), 200, 'load a valid permission');
const updated = expectStatus(await edgeCall(adminToken, {
  action: 'update_permissions', role_id: roleIds.MARKETING, permission_ids: [view[0].id],
}), 200, 'atomic permission update through Edge');
assert.equal(updated.count, 1);
const granted = expectStatus(await request(rest + '/role_permissions?select=permission_id&role_id=eq.' + roleIds.MARKETING, service), 200, 'verify permission persisted');
assert.deepEqual(granted, [{ permission_id: view[0].id }]);
expectStatus(await request(rest + '/rpc/replace_role_permissions_atomic', {
  method: 'POST', token: adminToken,
  body: { p_actor_id: admin.id, p_role_id: roleIds.MARKETING, p_permission_ids: [] },
}), [403, 404], 'atomic RPC unavailable to authenticated role directly');

expectStatus(await edgeCall(adminToken, { action: 'delete', id: target.id }), 200, 'delete Auth user through Edge');
expectStatus(await login(target.email, nextPassword), 400, 'deleted account cannot sign in');
assert.deepEqual(expectStatus(await request(rest + '/profiles?select=id&id=eq.' + target.id, service), 200, 'Auth cascade removes profile'), []);
assert.deepEqual(expectStatus(await request(rest + '/projects?select=id', { token: oldTargetToken }), 200, 'deleted profile denies previously issued JWT'), []);
console.log(tenant + ' PASS role change, suspension, password reset, sign-out, atomic permissions and Auth deletion');
