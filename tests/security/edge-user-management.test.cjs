'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

// Tests execute the staged Edge handler with synthetic clients; they do NOT call Supabase.
const filepath = path.resolve(__dirname, '../../supabase/functions/user-management/handler.ts');
const source = stripTypeScriptTypes(fs.readFileSync(filepath, 'utf8')
  .replace(/^import \{ createClient,[^\n]+\n/m, '')
  .replace(/^export function /m, 'function '));

const CALLER = '11111111-1111-4111-8111-111111111111';
const ROLE = '22222222-2222-4222-8222-222222222222';
const OTHER_ROLE = '33333333-3333-4333-8333-333333333333';
const USER = '44444444-4444-4444-8444-444444444444';

function makeHarness(options = {}) {
  const calls = [];
  const scope = options.shared ? 'master' : null;
  const read = resolve => {
    const filters = {};
    const query = {
      eq(key,value){filters[key]=value;return query},
      async maybeSingle(){return {data:resolve(filters),error:null}}
    };
    return query;
  };
  const adminRole = options.adminRole ?? { name: 'ADMIN', is_active: true };
  const profile = options.profile ?? { id: CALLER, role: 'STAFF', role_id: ROLE, is_active: true, roles: adminRole };
  const admin = {
    auth: { admin: {
      createUser: async fields => { calls.push(['createUser', fields]); return { data: { user: { id: USER } }, error: null }; },
      updateUserById: async (id, fields) => { calls.push(['updateUserById', id, fields]); return { error: null }; },
      deleteUser: async id => { calls.push(['deleteUser', id]); return { error: null }; },
    } },
    rpc: async (fn, args) => {
      calls.push(['rpc', fn, args]);
      if (options.rpcError) return { data: null, error: { message: 'synthetic RPC failure' } };
      if (options.rpcCountMismatch) return { data: -1, error: null };
      return { data: args.p_permission_ids.length, error: null };
    },
    from(table) {
      if (table === 'profiles') return {
        select: () => read(({id,tenant_id})=>{
          if(id===CALLER)return !scope||tenant_id===scope?profile:null;
          return scope&&tenant_id===scope&&options.foreignUser!==true&&id===USER?{id}:null;
        }),
        insert: async fields => { calls.push(['insertProfile', fields]); return { error: null }; },
        update: fields => ({
          eq(_field,id){
            if(!scope){calls.push(['updateProfile',id,fields]);return Promise.resolve({error:null})}
            return {eq(key,tenant){return {select(){return {async maybeSingle(){
              calls.push(['updateProfile',id,fields,key,tenant]);return {data:{id},error:null};
            }}}}}};
          }
        }),
      };
      if (table === 'roles') return {
        select: () => read(({id,tenant_id})=>{
          const valid=id===ROLE||id===OTHER_ROLE;
          const allowed=!scope||tenant_id===scope&&!(id===OTHER_ROLE&&options.foreignRole);
          return valid&&allowed?{id,name:id===ROLE?'ADMIN':'PELAKSANA',is_active:true}:null;
        }),
      };
      if (table === 'permissions') return {
        select: () => ({ in: async (_field, ids) => ({ data: ids.map(id => ({ id })), error: null }) }),
      };
      if (table === 'role_permissions') return {
        select: () => ({ eq: async () => ({ data: [], error: null }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
        insert: async () => ({ error: null }),
      };
      throw Error('Unexpected table: ' + table);
    },
  };
  const userClient = {
    rpc: async fn => {
      assert.equal(fn,'sikoyek_current_company');
      return {data:options.noCompany?null:{id:scope},error:null};
    },
    auth: { getUser: async () => ({
      data: { user: options.authed === false ? null : { id: CALLER } },
      error: null,
    }) },
  };
  const Deno = {
    env: { get: key => ({ SUPABASE_URL: options.url || 'https://test.invalid', SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'server-secret' })[key] },
  };
  const createClient = (_url, key) => key === 'anon' ? userClient : admin;
  const handler=vm.runInNewContext(source+'\ncreateUserManagementHandler(shared)', { shared:Boolean(scope),Deno,createClient,Response,Date,console,String,Object,Array,Set,URL }, {
    filename: 'user-management/handler.ts',
  });
  const send = async (body, method = 'POST', bearer = true) => {
    const req = new Request('https://test.invalid/functions/v1/user-management', {
      method, headers: bearer ? { Authorization: 'Bearer synthetic-access-token' } : {},
      ...(method !== 'GET' && method !== 'OPTIONS' ? { body: JSON.stringify(body) } : {}),
    });
    const response = await handler(req);
    return { status: response.status, data: await response.json() };
  };
  return { send, calls };
}

test('only POST/OPTIONS accepted', async () => {
  const h = makeHarness();
  assert.equal((await h.send({}, 'GET')).status, 405);
});

test('missing bearer is 401', async () => {
  const h = makeHarness();
  assert.equal((await h.send({ action: 'delete', id: USER }, 'POST', false)).status, 401);
  assert.equal(h.calls.length, 0);
});

test('invalid user session is 401', async () => {
  const h = makeHarness({ authed: false });
  assert.equal((await h.send({ action: 'delete', id: USER })).status, 401);
  assert.equal(h.calls.length, 0);
});

test('inactive user is 403', async () => {
  const h = makeHarness({ profile: { id: CALLER, is_active: false, role_id: ROLE,
    roles: { name: 'ADMIN', is_active: true } } });
  assert.equal((await h.send({ action: 'delete', id: USER })).status, 403);
  assert.equal(h.calls.length, 0);
});

test('legacy profiles.role=ADMIN without role_id is NOT trusted', async () => {
  const h = makeHarness({ profile: { id: CALLER, is_active: true, role: 'ADMIN', role_id: null, roles: null } });
  assert.equal((await h.send({ action: 'delete', id: USER })).status, 403);
  assert.equal(h.calls.length, 0);
});

test('inactive joined ADMIN role is 403', async () => {
  const h = makeHarness({ adminRole: { name: 'ADMIN', is_active: false } });
  assert.equal((await h.send({ action: 'delete', id: USER })).status, 403);
  assert.equal(h.calls.length, 0);
});

test('non-admin role is 403 even when profiles.role says ADMIN', async () => {
  const h = makeHarness({ profile: { id: CALLER, is_active: true, role: 'ADMIN',
    role_id: ROLE, roles: { name: 'PELAKSANA', is_active: true } } });
  assert.equal((await h.send({ action: 'delete', id: USER })).status, 403);
  assert.equal(h.calls.length, 0);
});

test('admin cannot delete own user', async () => {
  const h = makeHarness();
  assert.equal((await h.send({ action: 'delete', id: CALLER })).status, 400);
  assert.equal(h.calls.length, 0);
});

test('admin cannot remove own ADMIN role', async () => {
  const h = makeHarness();
  assert.equal((await h.send({ action: 'update', id: CALLER, role_id: OTHER_ROLE })).status, 403);
  assert.equal(h.calls.length, 0);
});

test('admin can update another user with canonical role_id', async () => {
  const h = makeHarness();
  const result = await h.send({ action: 'update', id: USER, full_name: 'Test User', role_id: OTHER_ROLE, is_active: true });
  assert.equal(result.status, 200);
  assert.ok(h.calls.some(c => c[0] === 'updateProfile' && c[1] === USER && c[2].role_id === OTHER_ROLE));
});

test('unknown role cannot be assigned at creation', async () => {
  const h = makeHarness();
  const result = await h.send({ action: 'create', email: 'example@test.invalid',
    full_name: 'Example', password: 'a-strong-password', role_id: USER });
  assert.equal(result.status, 400);
  assert.equal(h.calls.length, 0);
});

test('admin can create user with role_id and legacy STAFF compatibility', async () => {
  const h = makeHarness();
  const result = await h.send({ action: 'create', email: 'example@test.invalid',
    full_name: 'Example', password: 'a-strong-password', role_id: OTHER_ROLE });
  assert.equal(result.status, 200);
  assert.equal(result.data.user_id, USER);
  assert.ok(h.calls.some(c => c[0] === 'insertProfile' && c[1].role_id === OTHER_ROLE && c[1].role === 'STAFF'));
});

test('invalid role permission legacy payload is rejected without write', async () => {
  const h = makeHarness();
  assert.equal((await h.send({ action: 'update_permissions', user_id: USER, role_id: OTHER_ROLE })).status, 400);
  assert.equal(h.calls.length, 0);
});

test('admin can reset a password but not below 8 characters', async () => {
  const h = makeHarness();
  assert.equal((await h.send({ action: 'reset_password', id: USER, password: 'weak' })).status, 400);
  assert.equal((await h.send({ action: 'reset_password', id: USER, password: 'a-strong-password' })).status, 200);
  assert.ok(h.calls.some(c => c[0] === 'updateUserById' && c[1] === USER));
});

// This suite intentionally excludes production integration and atomicity testing.

test('updating role permissions uses one RPC call, never split DELETE and INSERT', async () => {
  const h = makeHarness();
  const res = await h.send({ action: 'update_permissions', role_id: ROLE, permission_ids: [OTHER_ROLE] });
  assert.equal(res.status, 200);
  assert.equal(res.data.count, 1);
  const rpc = h.calls.find(c => c[0] === 'rpc');
  assert.equal(rpc[1], 'replace_role_permissions_atomic');
  assert.equal(rpc[2].p_actor_id, CALLER);
  assert.equal(rpc[2].p_role_id, ROLE);
  assert.deepEqual(Array.from(rpc[2].p_permission_ids), [OTHER_ROLE]);
  assert.equal(h.calls.filter(c => c[0] === 'rpc').length, 1);
  assert.equal(h.calls.filter(c => /insert|delete/i.test(c[0])).length, 0);
});

test('permission replacement reports RPC failures without fallback writes', async () => {
  const h = makeHarness({ rpcError: true });
  const res = await h.send({ action: 'update_permissions', role_id: ROLE, permission_ids: [] });
  assert.equal(res.status, 500);
  assert.equal(h.calls.filter(c => c[0] === 'rpc').length, 1);
  assert.equal(h.calls.filter(c => /insert|delete/i.test(c[0])).length, 0);
});

test('permission replacement refuses a mismatching RPC result', async () => {
  const h = makeHarness({ rpcCountMismatch: true });
  const res = await h.send({ action: 'update_permissions', role_id: ROLE, permission_ids: [] });
  assert.equal(res.status, 500);
});

test('duplicate permission IDs are deduplicated before RPC', async () => {
  const h = makeHarness();
  const res = await h.send({ action: 'update_permissions', role_id: ROLE,
    permission_ids: [OTHER_ROLE, OTHER_ROLE] });
  assert.equal(res.status, 200);
  const rpc = h.calls.find(c => c[0] === 'rpc');
  assert.deepEqual(Array.from(rpc[2].p_permission_ids), [OTHER_ROLE]);
});

test('invalid permission ID does not invoke RPC', async () => {
  const h = makeHarness();
  const res = await h.send({ action: 'update_permissions', role_id: ROLE,
    permission_ids: ['invalid-id'] });
  assert.equal(res.status, 400);
  assert.equal(h.calls.filter(c => c[0] === 'rpc').length, 0);
});

test('shared Admin cannot update, reset, or delete an account in another company', async () => {
  for (const body of [
    {action:'update',full_name:'Changed'},
    {action:'reset_password',password:'synthetic-password'},
    {action:'delete'}
  ]){
    const h=makeHarness({shared:true,foreignUser:true});
    assert.equal((await h.send({...body,id:USER,tenant_id:'konstruva'})).status,403);
    assert.equal(h.calls.length,0);
  }
});

test('shared Admin cannot assign a role or change permissions in another company', async () => {
  const h=makeHarness({shared:true,foreignRole:true});
  for (const body of [
    {action:'create',email:'synthetic@preview.invalid',password:'synthetic-password',full_name:'Synthetic'},
    {action:'update',id:USER},
    {action:'update_permissions',permission_ids:[]}
  ]) assert.equal((await h.send({...body,role_id:OTHER_ROLE})).status,400);
  assert.equal(h.calls.length,0);
});

test('shared administration uses the verified company for all permitted operations', async () => {
  const h=makeHarness({shared:true});
  assert.equal((await h.send({action:'create',email:'synthetic@preview.invalid',password:'synthetic-password',
    full_name:'Synthetic',role_id:OTHER_ROLE,tenant_id:'konstruva'})).status,200);
  assert.equal(h.calls.find(call=>call[0]==='insertProfile')[1].tenant_id,'master');
  assert.equal((await h.send({action:'update',id:USER,full_name:'Changed'})).status,200);
  assert.deepEqual(h.calls.find(call=>call[0]==='updateProfile').slice(3),['tenant_id','master']);
  assert.equal((await h.send({action:'reset_password',id:USER,password:'synthetic-password'})).status,200);
  assert.equal((await h.send({action:'delete',id:USER})).status,200);
  assert.equal((await h.send({action:'update_permissions',role_id:OTHER_ROLE,permission_ids:[]})).status,200);
  assert.equal(h.calls.find(call=>call[0]==='rpc')[1],'replace_tenant_role_permissions_atomic');
});

test('shared endpoint refuses accounts without a company and refuses production references', async () => {
  for(const options of [{noCompany:true},{url:'https://mmkusplegmittrlxqxby.supabase.co'}]){
    const h=makeHarness({shared:true,...options});
    assert.equal((await h.send({action:'delete',id:USER})).status,403);
    assert.equal(h.calls.length,0);
  }
});
