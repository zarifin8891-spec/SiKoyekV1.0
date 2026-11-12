(function () {
  "use strict";
  const byId = id => document.getElementById(id);
  const login = byId("login");
  const signedIn = byId("signed-in");
  const logout = byId("logout");
  const companyPanel = byId("company-panel");
  const accountPanel = byId("account-panel");
  login.innerHTML = window.SiKoyekLogin.markup("../");
  const loginPanel = login.querySelector(".login-form-panel");
  const loginForm = document.createElement("form");
  loginForm.id = "login-form";
  loginForm.setAttribute("aria-label", "Masuk ke SiKoyek");
  const loginNotice = byId("loginErr");
  loginForm.append(...[...loginPanel.children].filter(child => child !== loginNotice));
  loginPanel.prepend(loginForm);
  loginNotice.before(byId("login-recovery-template").content.cloneNode(true));
  const recoveryForm = byId("login-recovery");
  for (const id of ["email", "password"]) {
    const field = byId(id);
    field.name = id;
    field.required = true;
  }
  byId("rememberLogin").name = "remember";
  byId("rememberLogin").closest("label").title = "Ingat alamat email pada perangkat ini";
  byId("loginBtn").type = "submit";

  const companySelect = byId("account-form").elements.company_id;
  let client;
  let operations;
  let staffAccess;
  let generation = 0;
  let recovering = false;
  let identity = "";
  let currentRoute = "";
  const routes = [
    ["dashboard", "Dashboard", "dashboard"],
    ["company", "Data Perusahaan", "project"],
    ["account", "Daftar User", "users"],
    ["project", "Daftar Proyek", "project"],
    ["planning", "Perincian Proyek", "activity"],
    ["transaction", "Transaksi", "document"],
    ["report", "Laporan", "document"],
    ["master-data", "Master Data", "settings"],
  ];

  function renderRoutes(next = currentRoute) {
    const available = routes.filter(([key]) => !byId(key + "-panel").hidden)
      .map(([key, label, icon]) => [key, key === "account" && !companyPanel.hidden ? "Admin Perusahaan" : label, icon]);
    currentRoute = available.some(([key]) => key === next) ? next : available[0]?.[0] || "";
    signedIn.querySelector(".control-sidebar")?.remove();
    signedIn.insertAdjacentHTML("afterbegin", window.SiKoyekControl.sidebar(
      currentRoute, available, { identity, assetRoot: "../" }));
    for (const [key] of routes) byId(key + "-panel").toggleAttribute("data-current", key === currentRoute);
    byId("workspace-empty").hidden = Boolean(currentRoute);
    byId("workspace-title").parentElement.hidden = currentRoute === "dashboard";
  }

  signedIn.addEventListener("click", event => {
    const route = event.target.closest("[data-workspace-route]");
    if (!route || byId(route.dataset.workspaceRoute + "-panel")?.hidden !== false) return;
    renderRoutes(route.dataset.workspaceRoute);
    signedIn.querySelector('[aria-current="page"]')?.focus();
  });

  function notify(message, error = false) {
    const workspaceNotice = byId("notice");
    const notice = login.hidden ? workspaceNotice : loginNotice;
    workspaceNotice.textContent = loginNotice.textContent = "";
    notice.textContent = message;
    notice.dataset.error = String(error);
  }

  function appendRow(table, values) {
    const row = table.insertRow();
    for (const value of values) row.insertCell().textContent = value;
    return row;
  }

  function setSignedOut() {
    currentRoute = identity = "";
    signedIn.querySelector(".control-sidebar")?.remove();
    operations?.clear();
    staffAccess?.clear();
    login.hidden = false;
    logout.hidden = signedIn.hidden = companyPanel.hidden = accountPanel.hidden = true;
    byId("companies").replaceChildren();
    byId("accounts").replaceChildren();
    byId("account-form").reset();
  }

  async function loadWorkspace() {
    const current = ++generation;
    const { data: { session } } = await client.auth.getSession();
    if (current !== generation || recovering) return;
    if (!session) {
      setSignedOut();
      return;
    }

    const { data: account, error } = await client.from("company_accounts")
      .select("user_id,company_id,access_role,full_name,is_active")
      .eq("user_id", session.user.id).maybeSingle();
    if (current !== generation) return;
    if (error || !account?.is_active) {
      setSignedOut();
      await client.auth.signOut({ scope: "local" });
      notify("Akun belum aktif atau belum terdaftar di ruang kerja.", true);
      return;
    }

    const platform = account.access_role === "platform_admin";
    const manager = account.access_role === "company_admin";
    const { data: companies, error: companyError } = await client.from("companies")
      .select("id,name,is_active").order("name");
    if (current !== generation) return;
    const ownCompany = companies?.find(company => company.id === account.company_id);
    if (companyError || (!platform && !ownCompany?.is_active)) {
      setSignedOut();
      await client.auth.signOut({ scope: "local" });
      notify("Perusahaan belum aktif atau belum dapat dimuat.", true);
      return;
    }

    signedIn.hidden = logout.hidden = false;
    login.hidden = true;
    companyPanel.hidden = !platform;
    accountPanel.hidden = !(platform || manager);
    byId("staff-access-column").hidden = !manager;
    byId("workspace-title").textContent = platform ? "Admin Platform" : ownCompany.name;
    identity = account.full_name;
    operations.clear();
    if (platform) renderRoutes();
    else operations.load(account).catch(() => {
      if (current !== generation) return;
      renderRoutes();
      notify("Data operasional belum dapat dimuat.", true);
    });
    if (!(platform || manager)) return;

    renderCompanies(companies, platform, ownCompany);
    const { data: users, error: usersError } = await client.from("company_accounts")
      .select("user_id,full_name,company_id,access_role,is_active").order("full_name");
    if (current !== generation) return;
    const list = byId("accounts");
    list.replaceChildren();
    if (usersError) {
      notify("Daftar pengguna belum dapat dimuat.", true);
      return;
    }
    const names = new Map(companies.map(company => [company.id, company.name]));
    for (const user of users) {
      if (platform && user.access_role !== "company_admin") continue;
      const row = appendRow(list, [user.full_name, names.get(user.company_id) || "—",
        user.access_role === "company_admin" ? "Admin Perusahaan" : "Staf"]);
      if (manager) {
        const action = row.insertCell();
        if (user.access_role === "staff" && user.is_active) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = "Hak Akses";
          button.addEventListener("click", () => staffAccess.open(user));
          action.append(button);
        }
      }
    }
    if (!list.rows.length) {
      const cell = list.insertRow().insertCell();
      cell.colSpan = manager ? 4 : 3;
      cell.textContent = "Belum ada pengguna.";
    }
  }

  function renderCompanies(companies, platform, ownCompany) {
    const list = byId("companies");
    list.replaceChildren();
    const companyChoices = platform ? companies.filter(company => company.is_active) : [ownCompany];
    const selected = companySelect.value;
    companySelect.replaceChildren(...companyChoices.map(company => new Option(company.name, company.id)));
    if (companyChoices.some(company => company.id === selected)) companySelect.value = selected;
    companySelect.disabled = !platform;
    companySelect.required = platform;
    const accountSubmit = byId("account-submit");
    accountSubmit.disabled = companyChoices.length === 0;
    accountSubmit.textContent = platform ? "Buat Admin Perusahaan" : "Buat Akun Staf";
    byId("account-heading").textContent = platform ? "Admin Perusahaan" : "Pengguna Perusahaan";
    if (!platform) return;

    for (const company of companies) {
      const actions = appendRow(list, [company.name, company.is_active ? "Aktif" : "Nonaktif", ""]).lastElementChild;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Ubah Nama";
      edit.onclick = () => {
        const name = window.prompt("Nama perusahaan", company.name)?.trim();
        if (!name || name === company.name) return;
        if (name.length > 160) return notify("Nama perusahaan maksimal 160 karakter.", true);
        changeCompany(edit, company.id, { name });
      };
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.textContent = company.is_active ? "Nonaktifkan" : "Aktifkan";
      toggle.onclick = () => {
        if (company.is_active && !window.confirm("Nonaktifkan akses perusahaan ini?")) return;
        changeCompany(toggle, company.id, { is_active: !company.is_active });
      };
      actions.append(edit, toggle);
    }
    if (!list.rows.length) appendRow(list, ["Belum ada perusahaan.", "—", "—"]);
  }

  async function run(button, task) {
    if (button.disabled) return;
    button.disabled = true;
    notify("");
    try {
      await task();
    } catch (error) {
      notify(error.message || "Terjadi kesalahan. Silakan coba lagi.", true);
    } finally {
      if (button !== byId("account-submit")) button.disabled = false;
    }
  }

  function changeCompany(button, id, values) {
    return run(button, async () => {
      const { data, error } = await client.from("companies").update(values).eq("id", id).select("id").maybeSingle();
      if (error || !data) throw new Error("Perusahaan belum berhasil diperbarui.");
      await loadWorkspace();
      notify("Data perusahaan diperbarui.");
    });
  }

  function bindSubmit(id, task) {
    const form = byId(id);
    const button = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", event => {
      event.preventDefault();
      run(button, async () => {
        try { await task(form, Object.fromEntries(new FormData(form))); }
        finally { if (id === "account-form") button.disabled = companySelect.options.length === 0; }
      });
    });
  }

  async function start() {
    const config = window.SiKoyekConfig;
    const legacy = ["mmkusplegmittrlxqxby", "fadxsycdgzuctvmhhjty"];
    if (config?.id !== "multi-perusahaan-development" ||
        legacy.includes(new URL(config.url).hostname.split(".")[0])) {
      notify("Siapkan koneksi ke database khusus multi-perusahaan.", true);
      return;
    }
    client = window.SiKoyekBackend.getClient();
    operations = window.createCompanyOperations(client, notify, renderRoutes);
    staffAccess = window.createCompanyStaffAccess(client);
    const password = loginForm.elements.password;
    const togglePassword = byId("togglePassword");
    const rememberKey = config.storageKey + "-remembered-email";
    try {
      const remembered = localStorage.getItem(rememberKey);
      loginForm.elements.email.value = remembered || "";
      loginForm.elements.remember.checked = Boolean(remembered);
    } catch {
      // Browsers can disable local storage. Sign-in still works.
    }
    togglePassword.addEventListener("click", () => {
      const visible = password.type === "password";
      password.type = visible ? "text" : "password";
      togglePassword.setAttribute("aria-pressed", String(visible));
      togglePassword.setAttribute("aria-label", visible ? "Sembunyikan password" : "Tampilkan password");
    });
    byId("forgotPassword").addEventListener("click", event => run(event.currentTarget, async () => {
      const email = loginForm.elements.email;
      if (!email.reportValidity()) return;
      const redirectTo = new URL(window.location.pathname, window.location.origin).href;
      const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo });
      if (error) throw new Error("Permintaan reset belum berhasil. Silakan coba lagi.");
      notify("Jika email terdaftar, tautan reset password akan dikirim.");
    }));
    bindSubmit("login-form", async (form, values) => {
      password.value = "";
      if (password.type === "text") togglePassword.click();
      const email = values.email.trim();
      const { error } = await client.auth.signInWithPassword({ email, password: values.password });
      if (error) throw new Error("Tidak dapat masuk. Periksa email dan password.");
      try {
        if (values.remember) localStorage.setItem(rememberKey, email);
        else localStorage.removeItem(rememberKey);
      } catch {
        // Remembering the address is optional.
      }
      await loadWorkspace();
    });
    bindSubmit("login-recovery", async (form, values) => {
      if (!recovering) return;
      const { error } = await client.auth.updateUser({ password: values.password });
      if (error) throw new Error("Password belum dapat diubah. Coba kembali dari tautan reset.");
      form.reset();
      recovering = false;
      recoveryForm.hidden = true;
      loginForm.hidden = false;
      await loadWorkspace();
      if (login.hidden) notify("Password berhasil diperbarui.");
    });
    bindSubmit("company-form", async (form, values) => {
      const name = values.name.trim();
      if (!name) throw new Error("Nama perusahaan wajib diisi.");
      const { error } = await client.from("companies").insert({ name });
      if (error) throw new Error("Perusahaan belum berhasil ditambahkan. Periksa apakah namanya sudah digunakan.");
      form.reset();
      await loadWorkspace();
      notify("Perusahaan ditambahkan.");
    });
    bindSubmit("account-form", async (form, values) => {
      form.elements.password.value = "";
      const { data, error } = await client.functions.invoke("company-accounts", { body: values });
      if (error || !data?.id) throw new Error("Akun belum berhasil dibuat. Periksa email dan data akun.");
      await loadWorkspace();
      form.reset();
      notify("Akun berhasil dibuat.");
    });
    logout.addEventListener("click", () => run(logout, async () => {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new Error("Sesi belum berhasil ditutup.");
      generation++;
      setSignedOut();
    }));
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recovering = true;
        generation++;
        setSignedOut();
        loginForm.hidden = true;
        recoveryForm.hidden = false;
        notify("");
      }
      if (event === "SIGNED_OUT") {
        recovering = false;
        loginForm.hidden = false;
        recoveryForm.hidden = true;
        recoveryForm.reset();
        generation++;
        setSignedOut();
      }
    });
    await loadWorkspace();
  }

  start().catch(() => notify("Ruang kerja belum dapat dimuat. Periksa konfigurasi dan koneksi.", true));
})();
