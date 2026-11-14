(function () {
  "use strict";
  const { appendTableRow } = window.SiKoyekFoundation;
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

  for (const input of document.querySelectorAll('input[type="password"][autocomplete="new-password"]')) {
    const label = input.closest("label");
    if (!label) continue;
    const fieldName = label.textContent.trim().toLowerCase();
    const wrapper = document.createElement("span");
    wrapper.className = "sk-password-field";
    input.before(wrapper);
    wrapper.append(input);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "sk-password-toggle";
    toggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/><path class="sk-password-slash" d="m3 3 18 18"/></svg>';
    wrapper.append(toggle);
    const show = visible => {
      input.type = visible ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(visible));
      toggle.setAttribute("aria-label", (visible ? "Sembunyikan " : "Tampilkan ") + fieldName);
    };
    show(false);
    toggle.addEventListener("click", () => show(input.type === "password"));
    input.form?.addEventListener("reset", () => show(false));
    input.closest("dialog")?.addEventListener("close", () => show(false));
  }

  const companySelect = byId("account-form").elements.company_id;
  let client;
  let operations;
  let staffAccess;
  let generation = 0;
  let recovering = false;
  const platformDialog = byId("platform-account-dialog");
  const platformForm = byId("platform-account-form");
  const platformStatus = platformForm.querySelector('[role="status"]');
  const platformSave = platformForm.querySelector('[type="submit"]');
  let platformEdit = null;
  let callerId = "";
  const platformPanel = byId("platform-admin-panel");

  function openPlatformAccount(user, company, action) {
    if (companyPanel.hidden || !["company_admin", "platform_admin"].includes(user.access_role) || platformDialog.open) return;
    platformForm.reset();
    platformStatus.textContent = "";
    platformEdit = { id: user.user_id, action, account_type: user.access_role };
    const reset = action === "reset_password";
    byId("platform-account-heading").textContent = reset ? "Reset Password" : user.access_role === "platform_admin" ? "Edit Admin Platform" : "Edit Admin Perusahaan";
    byId("platform-account-target").textContent = [user.full_name, company].filter(Boolean).join(" · ");
    for (const [id, hidden] of [["platform-edit-fields", reset], ["platform-password-fields", !reset]]) {
      const group = byId(id);
      group.hidden = hidden;
      group.querySelectorAll("input,select").forEach(field => { field.disabled = hidden; });
    }
    byId("platform-edit-company").hidden = !company;
    byId("platform-company-value").textContent = company || "";
    byId("platform-email-value").textContent = user.email || "—";
    platformForm.elements.full_name.value = user.full_name;
    platformForm.elements.is_active.disabled = reset || user.user_id === callerId;
    platformForm.elements.is_active.value = String(user.is_active);
    platformDialog.showModal();
  }

  byId("platform-account-cancel").addEventListener("click", () => {
    if (!platformSave.disabled) platformDialog.close();
  });
  platformDialog.addEventListener("cancel", event => {
    if (platformSave.disabled) event.preventDefault();
  });
  platformDialog.addEventListener("close", () => {
    if (platformDialog.open) return;
    platformForm.reset();
    platformEdit = null;
  });
  platformForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!platformEdit || companyPanel.hidden || platformSave.disabled) return;
    const target = platformEdit;
    const values = Object.fromEntries(new FormData(platformForm));
    if (target.action === "reset_password" && values.password !== values.password_confirm) {
      platformStatus.textContent = "Konfirmasi password tidak sama.";
      return;
    }
    if (target.action === "update") {
      values.full_name = values.full_name.trim();
      if (!values.full_name) {
        platformStatus.textContent = "Nama lengkap wajib diisi.";
        return;
      }
      values.is_active = target.id === callerId || values.is_active === "true";
    }
    platformSave.disabled = true;
    platformStatus.textContent = "Menyimpan…";
    try {
      const { data, error } = await client.functions.invoke("company-accounts", { body: { ...values, ...target } });
      if (error || !data?.id) throw new Error("Perubahan belum berhasil disimpan.");
      if (platformEdit !== target) return;
      platformDialog.close();
      await loadWorkspace();
      notify(target.action === "reset_password" ? "Password berhasil direset." : "Akun diperbarui.");
    } catch (error) {
      if (platformEdit === target) platformStatus.textContent = error.message;
    } finally {
      platformSave.disabled = false;
    }
  });
  let identity = "";
  let currentRoute = "";
  const routes = [
    ["dashboard", "Dashboard", "dashboard"],
    ["project", "Daftar Proyek", "project"],
    ["report", "Laporan", "document"],
    ["master-data", "Master Data", "settings"],
    ["company", "Master Data Perusahaan", "project"],
    ["account", "Daftar User", "users"],
    ["platform-admin", "Admin Platform", "settings"],
  ];
  const nestedRoutes = [
    ["planning", "Perincian Proyek", "activity"],
    ["transaction", "Transaksi", "document"],
  ];

  function renderRoutes(next = currentRoute) {
    const visible = ([key]) => !byId(key + "-panel").hidden;
    const available = routes.filter(visible);
    if (!available.some(([key]) => key === "project") && visible(nestedRoutes[0])) available.push(nestedRoutes[0]);
    if (!available.some(([key]) => key === "report") && visible(nestedRoutes[1])) available.push(nestedRoutes[1]);
    const pages = [...routes, ...nestedRoutes];
    currentRoute = pages.some(route => route[0] === next && visible(route)) ? next : available[0]?.[0] || "";
    const active = currentRoute === "planning" && available.some(([key]) => key === "project") ? "project"
      : currentRoute === "transaction" && available.some(([key]) => key === "report") ? "report" : currentRoute;
    const sidebar = available.map(([key, label, icon]) => [
      key, key === "account" && !companyPanel.hidden ? "Data User" : label, icon,
    ]);
    signedIn.querySelector(".control-sidebar")?.remove();
    signedIn.insertAdjacentHTML("afterbegin", window.SiKoyekControl.sidebar(
      active, sidebar, { identity, assetRoot: "../" }));
    for (const [key] of pages) byId(key + "-panel").toggleAttribute("data-current", key === currentRoute);
    byId("workspace-empty").hidden = Boolean(currentRoute);
    byId("workspace-title").parentElement.hidden = currentRoute === "dashboard";
  }

  signedIn.addEventListener("click", event => {
    const route = event.target.closest("[data-workspace-route], [data-open-workspace-page]");
    const next = route?.dataset.workspaceRoute || route?.dataset.openWorkspacePage;
    if (!next || byId(next + "-panel")?.hidden !== false) return;
    renderRoutes(next);
    signedIn.querySelector('[aria-current="page"]')?.focus();
  });

  function notify(message, error = false) {
    const workspaceNotice = byId("notice");
    const notice = login.hidden ? workspaceNotice : loginNotice;
    workspaceNotice.textContent = loginNotice.textContent = "";
    notice.textContent = message;
    notice.dataset.error = String(error);
  }

  function setSignedOut() {
    platformEdit = null;
    callerId = "";
    platformPanel.hidden = true;
    byId("platform-admins").replaceChildren();
    byId("platform-create-form").reset();
    if (platformDialog.open) platformDialog.close();
    for (const dialog of document.querySelectorAll("dialog:has([data-editor-cancel])")) {
      if (dialog.open) dialog.close();
    }
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

    if (!platform) {
      location.replace("../index.html");
      return;
    }
    signedIn.hidden = logout.hidden = false;
    login.hidden = true;
    companyPanel.hidden = platformPanel.hidden = !platform;
    callerId = account.user_id;
    accountPanel.hidden = !(platform || manager);
    byId("staff-access-column").hidden = false;
    byId("staff-access-column").textContent = "Aksi";
    byId("workspace-title").textContent = platform ? "Admin Platform" : ownCompany.name;
    identity = account.full_name;
    operations.clear();
    renderRoutes();
    if (!(platform || manager)) return;

    renderCompanies(companies, platform, ownCompany);
    const { data: users, error: usersError } = await (platform ? client.rpc("platform_account_directory")
      : client.from("company_accounts").select("user_id,full_name,company_id,access_role,is_active").order("full_name"));
    if (current !== generation) return;
    const list = byId("accounts");
    list.replaceChildren();
    if (usersError) {
      notify("Daftar pengguna belum dapat dimuat.", true);
      return;
    }
    const names = new Map(companies.map(company => [company.id, company.name]));
    if (platform) renderPlatformAdmins(users.filter(user => user.access_role === "platform_admin"));
    for (const user of users) {
      if (platform && user.access_role !== "company_admin") continue;
      const company = names.get(user.company_id) || "—";
      const row = appendTableRow(list, [user.full_name, user.email || "—", company,
        user.access_role === "company_admin" ? "Admin Perusahaan" : "Staf", ""]);
      const status = document.createElement("span");
      status.className = "pill " + (user.is_active ? "green" : "amber");
      status.textContent = user.is_active ? "Aktif" : "Nonaktif";
      row.cells[4].append(status);
      if (platform) {
        const action = row.insertCell();
        action.className = "control-row-actions";
        for (const [label, mode] of [["Edit", "update"], ["Reset Password", "reset_password"]]) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn ghost";
          button.textContent = label;
          button.onclick = () => openPlatformAccount(user, company, mode);
          action.append(button);
        }
      } else if (manager) {
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
      cell.colSpan = 6;
      cell.textContent = "Belum ada pengguna.";
    }
  }

  function renderPlatformAdmins(users) {
    const list = byId("platform-admins");
    list.replaceChildren();
    for (const user of users) {
      const row = appendTableRow(list, [user.full_name, user.email || "—", user.is_active ? "Aktif" : "Nonaktif"]);
      const actions = row.insertCell();
      actions.className = "control-row-actions";
      for (const [label, mode] of [["Edit", "update"], ["Reset Password", "reset_password"], ["Hapus", "delete"]]) {
        if (mode === "delete" && user.user_id === callerId) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn ghost";
        button.textContent = label;
        button.onclick = () => {
          if (mode !== "delete") return openPlatformAccount(user, "", mode);
          if (!window.confirm("Hapus akun Admin Platform " + user.full_name + "?")) return;
          run(button, async () => {
            const { data, error } = await client.functions.invoke("company-accounts", {
              body: { action: "delete", id: user.user_id, account_type: "platform_admin" },
            });
            if (error || !data?.id) throw new Error("Akun belum berhasil dihapus.");
            await loadWorkspace();
            notify("Admin Platform dihapus.");
          });
        };
        actions.append(button);
      }
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
    byId("account-heading").textContent = platform ? "Data User — Admin Perusahaan" : "Pengguna Perusahaan";
    if (!platform) return;

    for (const company of companies) {
      const actions = appendTableRow(list, [company.name, company.is_active ? "Aktif" : "Nonaktif", ""]).lastElementChild;
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
    if (!list.rows.length) appendTableRow(list, ["Belum ada perusahaan.", "—", "—"]);
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
        const status = form.querySelector('[role="status"]');
        if (status) status.textContent = "";
        try { await task(form, Object.fromEntries(new FormData(form))); }
        catch (error) {
          if (!status) throw error;
          status.textContent = error.message;
        }
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
    for (const trigger of document.querySelectorAll("[data-editor-open]")) {
      const dialog = byId(trigger.dataset.editorOpen);
      const form = dialog.querySelector("form");
      const submit = form.querySelector('[type="submit"]');
      trigger.addEventListener("click", () => dialog.showModal());
      dialog.querySelector("[data-editor-cancel]").addEventListener("click", () => {
        if (!submit.disabled) dialog.close();
      });
      dialog.addEventListener("cancel", event => { if (submit.disabled) event.preventDefault(); });
      dialog.addEventListener("close", () => { form.reset(); form.querySelector('[role="status"]').textContent = ""; });
    }
    bindSubmit("platform-create-form", async (form, values) => {
      if (platformPanel.hidden) return;
      const { data, error } = await client.functions.invoke("company-accounts", {
        body: { ...values, account_type: "platform_admin" },
      });
      if (error || !data?.id) throw new Error("Admin Platform belum berhasil dibuat. Periksa email dan password.");
      form.closest("dialog").close();
      await loadWorkspace();
      notify("Admin Platform ditambahkan.");
    });
    bindSubmit("account-form", async (form, values) => {
      form.elements.password.value = "";
      const { data, error } = await client.functions.invoke("company-accounts", { body: values });
      if (error || !data?.id) throw new Error("Akun belum berhasil dibuat. Periksa email dan data akun.");
      form.closest("dialog").close();
      await loadWorkspace();
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
