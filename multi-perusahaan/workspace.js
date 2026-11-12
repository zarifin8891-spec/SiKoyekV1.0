(function () {
  "use strict";
  const byId = id => document.getElementById(id);
  const login = byId("login");
  const signedIn = byId("signed-in");
  const logout = byId("logout");
  const companyPanel = byId("company-panel");
  const accountPanel = byId("account-panel");
  const companySelect = byId("account-form").elements.company_id;
  let client;
  let generation = 0;

  function notify(message, error = false) {
    const notice = byId("notice");
    notice.textContent = message;
    notice.dataset.error = String(error);
  }

  function appendRow(table, values) {
    const row = table.insertRow();
    for (const value of values) row.insertCell().textContent = value;
    return row;
  }

  function setSignedOut() {
    login.hidden = false;
    logout.hidden = signedIn.hidden = companyPanel.hidden = accountPanel.hidden = true;
    byId("companies").replaceChildren();
    byId("accounts").replaceChildren();
    byId("account-form").reset();
  }

  async function loadWorkspace() {
    const current = ++generation;
    const { data: { session } } = await client.auth.getSession();
    if (current !== generation) return;
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
      logout.hidden = false;
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
      logout.hidden = false;
      notify("Perusahaan belum aktif atau belum dapat dimuat.", true);
      return;
    }

    signedIn.hidden = logout.hidden = false;
    login.hidden = true;
    companyPanel.hidden = !platform;
    accountPanel.hidden = !(platform || manager);
    byId("workspace-title").textContent = platform ? "Admin Platform" : ownCompany.name;
    byId("account-name").textContent = account.full_name;
    if (!(platform || manager)) return;

    renderCompanies(companies, platform, ownCompany);
    const { data: users, error: usersError } = await client.from("company_accounts")
      .select("full_name,company_id,access_role").order("full_name");
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
      appendRow(list, [user.full_name, names.get(user.company_id) || "—",
        user.access_role === "company_admin" ? "Admin Perusahaan" : "Staf"]);
    }
    if (!list.rows.length) appendRow(list, ["Belum ada pengguna.", "—", "—"]);
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
    bindSubmit("login-form", async (form, values) => {
      form.elements.password.value = "";
      const { error } = await client.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
      if (error) throw new Error("Tidak dapat masuk. Periksa email dan password.");
      await loadWorkspace();
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
      if (event === "SIGNED_OUT") {
        generation++;
        setSignedOut();
      }
    });
    await loadWorkspace();
  }

  start().catch(() => notify("Ruang kerja belum dapat dimuat. Periksa konfigurasi dan koneksi.", true));
})();
