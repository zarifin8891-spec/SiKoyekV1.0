import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const config = Object.fromEntries(readFileSync(process.argv[2], 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z_]+)="([^"]+)"$/);
  return match ? [[match[1], match[2]]] : [];
}));
assert.equal(config.API_URL, 'http://127.0.0.1:54321', 'Only the disposable local stack is allowed');
assert.ok(config.ANON_KEY && config.SERVICE_ROLE_KEY, 'Local test keys are required');

const auth = '/auth/v1';
const rest = '/rest/v1';
const edge = '/functions/v1/user-management-shared';
const service = { key: config.SERVICE_ROLE_KEY, token: config.SERVICE_ROLE_KEY };
const password = randomUUID() + '!Aa1';
const resetPassword = randomUUID() + '!Aa2';
const sampleEmail = company => company + '-' + randomUUID() + '@example.com';

async function request(path, label, expected, options = {}) {
  const { method = 'GET', body, token = config.ANON_KEY, key = config.ANON_KEY } = options;
  const response = await fetch(config.API_URL + path, {
    method, redirect: 'error', signal: AbortSignal.timeout(25_000),
    headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.text();
  let payload = null;
  try { if (data) payload = JSON.parse(data); } catch { /* A gateway failure can be plain text. */ }
  const statuses = Array.isArray(expected) ? expected : [expected];
  assert.ok(statuses.includes(response.status), `${label}: HTTP ${response.status} ${payload?.code ?? ''}, expected ${statuses.join('/')}`);
  return payload;
}

const post = body => ({ method: 'POST', body });
const login = (email, credential = password, expected = 200) => request(
  auth + '/token?grant_type=password', 'Password sign-in', expected, post({ email, password: credential })
);
const refresh = (refresh_token, expected = 200) => request(
  auth + '/token?grant_type=refresh_token', 'Refresh', expected, post({ refresh_token })
);
const scoped = (token, action, expected = 200) => request(edge, action.action, expected, { ...post(action), token });
const company = token => request(rest + '/rpc/sikoyek_current_company', 'Company from Auth', 200, { token });

const roles = await request(rest + '/roles?select=id,name,tenant_id', 'Seeded roles', 200, service);
const role = (tenant, name) => roles.find(row => row.tenant_id === tenant && row.name === name).id;
async function bootstrap(tenant) {
  const email = sampleEmail(tenant);
  const { id } = await request(auth + '/admin/users', 'Bootstrap Auth identity', [200, 201], {
    ...service, ...post({ email, password, email_confirm: true })
  });
  await request(rest + '/profiles', 'Link company profile', 201, {
    ...service, ...post({ id, email, full_name: 'Synthetic ' + tenant, role_id: role(tenant, 'ADMIN'), tenant_id: tenant })
  });
  const session = await login(email);
  assert.equal(session.user.id, id);
  return { email, id, token: session.access_token, session };
}

const master = await bootstrap('master');
const konstruva = await bootstrap('konstruva');
assert.equal((await company(master.token)).id, 'master');
assert.equal((await company(konstruva.token)).id, 'konstruva');
const renewed = await refresh(konstruva.session.refresh_token);
assert.equal((await company(renewed.access_token)).id, 'konstruva');
assert.notEqual(renewed.refresh_token, konstruva.session.refresh_token);
konstruva.token = renewed.access_token;

const projects = token => request(rest + '/projects?select=id,project_code', 'Read own projects', 200, { token });
assert.deepEqual((await projects(master.token)).map(row => row.project_code), ['MASTER-UJI']);
assert.deepEqual(await projects(konstruva.token), []);
await request(rest + '/projects', 'Create own project', 201, {
  ...post({ project_code: 'KON-UJI', project_name: 'Konstruva synthetic', contract_value: 987654 }), token: konstruva.token
});
assert.deepEqual((await projects(konstruva.token)).map(row => row.project_code), ['KON-UJI']);
assert.deepEqual((await projects(master.token)).map(row => row.project_code), ['MASTER-UJI']);
for (const [token, value] of [[master.token, 123456], [konstruva.token, 987654]]) {
  const contracts = await request(rest + '/rpc/sikoyek_secure_project_contracts', 'Own contracts only', 200, { token });
  assert.deepEqual(contracts.map(row => row.contract_value), [value]);
}
console.log('PASS real Auth sign-in, refresh rotation, company resolution and scoped project/contract data');

await scoped(master.token, { action: 'reset_password', id: konstruva.id, password: resetPassword }, 403);
await scoped(konstruva.token, { action: 'delete', id: master.id }, 403);
await scoped(master.token, { action: 'update_permissions', role_id: role('konstruva', 'PELAKSANA'), permission_ids: [] }, 400);
await login(konstruva.email);
const email = sampleEmail('worker');
const { user_id: worker } = await scoped(konstruva.token, {
  action: 'create', email, password, full_name: 'Synthetic worker', role_id: role('konstruva', 'PELAKSANA'), tenant_id: 'master',
});
const workerSession = await login(email);
assert.equal((await company(workerSession.access_token)).id, 'konstruva');
await scoped(konstruva.token, { action: 'reset_password', id: worker, password: resetPassword });
await login(email, password, 400);
await login(email, resetPassword);
await scoped(konstruva.token, { action: 'delete', id: worker });
await login(email, resetPassword, 400);

const unassigned = sampleEmail('unassigned');
await request(auth + '/admin/users', 'Create isolated identity without a profile', [200, 201], {
  ...service, ...post({ email: unassigned, password, email_confirm: true })
});
const noProfile = await login(unassigned);
assert.equal(await company(noProfile.access_token), null);
assert.deepEqual(await projects(noProfile.access_token), []);
await request(auth + '/logout?scope=local', 'Local logout', 204, { method: 'POST', token: konstruva.token });
await refresh(renewed.refresh_token, [400, 401]);
console.log('PASS real Edge account creation, same-company reset and deletion, foreign actions denied, and logout');
