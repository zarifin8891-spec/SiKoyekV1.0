import { createTenantLogin } from './gateway.mjs';

const config = Deno.env.get('SIKOYEK_STAGING_LOGIN_CONFIG');
if (!config) throw new Error('Missing staging login configuration');
Deno.serve(createTenantLogin(JSON.parse(config)));
