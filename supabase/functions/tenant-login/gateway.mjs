// Staging only. Credentials are passed exclusively to the tenant's Auth endpoint.
const productionHosts = new Set(['mmkusplegmittrlxqxby.supabase.co', 'fadxsycdgzuctvmhhjty.supabase.co']);
const normalizeEmail = value => String(value ?? '').trim().toLowerCase();
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function createTenantLogin(config, requestUpstream = fetch) {
  const { origin, tenants, accounts } = config;
  if (new URL(origin).origin !== origin || !origin.startsWith('https://')) throw Error('Invalid staging origin');
  const registry = new Map();
  for (const [id, tenant] of Object.entries(tenants)) {
    const url = new URL(tenant.url);
    if (!/^[a-z][a-z0-9-]*$/.test(id) || url.origin !== tenant.url || url.protocol !== 'https:' ||
      !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || productionHosts.has(url.hostname) ||
      !/^sb_publishable_[\w-]+$/.test(tenant.key)) throw Error('Invalid staging tenant');
  }
  for (const account of accounts) {
    const email = normalizeEmail(account.email);
    if (!validEmail(email) || !Object.hasOwn(tenants, account.tenant) || registry.has(email)) {
      throw Error('Invalid or duplicate staging account');
    }
    registry.set(email, account.tenant);
  }

  return async request => {
    const headers = {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff'
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.get('Origin') !== origin) return reply(403, { error: 'Forbidden' });
    headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'content-type';
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json' || !request.body) {
      return reply(400, { error: 'Invalid request' });
    }

    let body;
    try {
      const reader = request.body.getReader();
      const decoder = new TextDecoder();
      let size = 0, json = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) {
          await reader.cancel();
          return reply(413, { error: 'Invalid request' });
        }
        json += decoder.decode(value, { stream: true });
      }
      body = JSON.parse(json + decoder.decode());
    } catch (_) {
      return reply(400, { error: 'Invalid request' });
    }

    const email = normalizeEmail(body?.email);
    const password = body?.password;
    const id = registry.get(email);
    const rejected = () => reply(401, { error: 'Email atau kata sandi tidak valid.' });
    if (!id || typeof password !== 'string' || !password || password.length > 1024) return rejected();
    const tenant = tenants[id];
    const upstreamHeaders = { apikey: tenant.key, 'Content-Type': 'application/json' };
    try {
      const auth = await requestUpstream(tenant.url + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: upstreamHeaders, body: JSON.stringify({ email, password }),
        redirect: 'error', signal: AbortSignal.timeout(8000)
      });
      if (!auth.ok) return rejected();
      const session = await auth.json();
      if (!session.access_token || !session.refresh_token ||
        !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(session.user?.id)) return rejected();
      const profile = new URL('/rest/v1/profiles', tenant.url);
      profile.search = new URLSearchParams({ select: 'is_active,roles(is_active)', id: 'eq.' + session.user.id }).toString();
      const result = await requestUpstream(profile, {
        headers: { ...upstreamHeaders, Authorization: 'Bearer ' + session.access_token },
        redirect: 'error', signal: AbortSignal.timeout(8000)
      });
      if (!result.ok) return rejected();
      const [user] = await result.json();
      if (user?.is_active !== true || user.roles?.is_active !== true) return rejected();
      return reply(200, { tenant: id, access_token: session.access_token, refresh_token: session.refresh_token });
    } catch (_) {
      return rejected();
    }
  };
}
