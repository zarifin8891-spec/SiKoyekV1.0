(() => {
  const config = window.SiKoyekStagingLogin;
  const form = document.getElementById('staging-login');
  const submit = document.getElementById('sign-in');
  const password = document.getElementById('password');
  const toggle = document.getElementById('show-password');
  const status = document.getElementById('login-status');
  if (!config || !window.supabase?.createClient) {
    status.textContent = 'Login staging belum tersedia.';
    return;
  }
  submit.disabled = false;
  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Sembunyikan' : 'Tampilkan';
    toggle.setAttribute('aria-pressed', String(show));
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    status.textContent = 'Memeriksa akun…';
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: password.value })
      });
      if (response.status === 401) {
        status.textContent = 'Email atau kata sandi tidak valid.';
        return;
      }
      if (!response.ok) throw Error('Gateway unavailable');
      const { tenant, access_token, refresh_token } = await response.json();
      if (!Object.hasOwn(config.tenants, tenant) || typeof access_token !== 'string' || typeof refresh_token !== 'string') {
        throw Error('Invalid tenant session');
      }
      const target = config.tenants[tenant];
      const client = window.supabase.createClient(target.url, target.key, {
        auth: { storage: window.sessionStorage, storageKey: target.storageKey, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { data, error } = await client.auth.setSession({ access_token, refresh_token });
      if (error || !data.session) throw Error('Session unavailable');
      window.location.assign(target.entry);
    } catch (_) {
      status.textContent = 'Login staging gagal. Coba kembali.';
    } finally {
      password.value = '';
      submit.disabled = false;
    }
  });
})();
