const test = require('node:test');
const assert = require('node:assert/strict');

const origin = 'https://staging.example.invalid';
const tenants = {
  master: { url: 'https://stagingmaster.supabase.co', key: 'sb_publishable_testmaster' },
  konstruva: { url: 'https://stagingkonstruva.supabase.co', key: 'sb_publishable_testkonstruva' }
};
const accounts = [
  { email: 'master@preview.invalid', tenant: 'master' },
  { email: 'konstruva@preview.invalid', tenant: 'konstruva' }
];
const config = { origin, tenants, accounts };
const request = (body, from = origin, method = 'POST') => new Request(origin, {
  method, headers: { Origin: from, 'Content-Type': 'application/json' },
  ...(method === 'POST' && { body: JSON.stringify(body) })
});
const create = async (...args) =>
  (await import('../../supabase/functions/tenant-login/gateway.mjs')).createTenantLogin(...args);

test('password and profile requests are sent only to the mapped tenant', async () => {
  const user = { id: '00000000-0000-4000-8000-000000000001' };
  const session = { user, access_token: 'test-access', refresh_token: 'test-refresh' };
  for (const { email, tenant } of accounts) {
    const calls = [];
    const gateway = await create(config, async (url, options) => {
      calls.push({ url: new URL(url), options });
      return Response.json(calls.length === 1 ? session : [{ is_active: true, roles: { is_active: true } }]);
    });
    const response = await gateway(request({ email: '  ' + email.toUpperCase(), password: ' synthetic ' }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.deepEqual(await response.json(), { tenant, access_token: 'test-access', refresh_token: 'test-refresh' });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.url.origin === tenants[tenant].url && call.options.redirect === 'error'));
    assert.deepEqual(JSON.parse(calls[0].options.body), { email, password: ' synthetic ' });
    assert.equal(calls[1].options.headers.Authorization, 'Bearer test-access');
    assert.equal(calls[1].url.searchParams.get('id'), 'eq.' + user.id);
  }
});

test('unknown emails, bad passwords and inactive profiles return the same failure without trying other tenants', async () => {
  const calls = [];
  const gateway = await create(config, async (url, options) => {
    calls.push(new URL(url));
    if (options.method === 'POST') {
      if (JSON.parse(options.body).password === 'wrong') return new Response(null, { status: 400 });
      return Response.json({ user: { id: '00000000-0000-4000-8000-000000000001' }, access_token: 'test-access', refresh_token: 'test-refresh' });
    }
    return Response.json([{ is_active: true, roles: { is_active: false } }]);
  });
  let response = await gateway(request({ email: 'unknown@preview.invalid', password: 'synthetic' }));
  assert.equal(calls.length, 0);
  assert.equal(response.status, 401);
  const failure = await response.text();
  response = await gateway(request({ email: accounts[0].email, password: 'wrong' }));
  assert.equal(calls.length, 1);
  assert.equal(response.status, 401);
  assert.equal(await response.text(), failure);
  response = await gateway(request({ email: accounts[0].email, password: 'synthetic' }));
  assert.equal(calls.length, 3);
  assert.equal(response.status, 401);
  assert.equal(await response.text(), failure);
  assert.ok(calls.every(url => url.origin === tenants.master.url));
});

test('gateway blocks production targets, duplicate accounts, and requests from other origins', async () => {
  await assert.rejects(create({ ...config, accounts: [...accounts, { email: accounts[0].email.toUpperCase(), tenant: 'konstruva' }] }), /duplicate/);
  await assert.rejects(create({ ...config, tenants: { ...tenants, master: { ...tenants.master, url: 'https://mmkusplegmittrlxqxby.supabase.co' } } }), /staging tenant/);
  const gateway = await create(config, () => { throw Error('Unexpected upstream request'); });
  assert.equal((await gateway(request({}, 'https://wrong.invalid'))).status, 403);
  assert.equal((await gateway(request({}, origin, 'OPTIONS'))).status, 204);
  assert.equal((await gateway(request({ password: 'X'.repeat(9000) }))).status, 413);
});
