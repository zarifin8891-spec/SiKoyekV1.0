(function () {
  "use strict";

  window.createCompanyOperations = function (client, notify, onRoutesChanged) {
    const get = id => document.getElementById(id);
    const root = get("operations");
    const forms = ["master-entry", "project-entry", "transaction-entry"];
    const panels = ["master-data-panel", "project-panel", "transaction-panel", "report-panel"];
    const tables = ["master-rows", "project-rows", "transaction-rows", "report-rows"];
    const format = window.SiKoyekFoundation;
    const planning = window.createCompanyPlanning(client);
    let generation = 0;
    let account = null;

    function clear() {
      generation++;
      account = null;
      planning.clear();
      root.hidden = true;
      panels.forEach(id => { get(id).hidden = true; });
      forms.forEach(id => get(id).reset());
      tables.forEach(id => get(id).replaceChildren());
    }

    function rows(id, values) {
      const table = get(id);
      table.replaceChildren();
      for (const valuesForRow of values) {
        const row = table.insertRow();
        for (const value of valuesForRow) row.insertCell().textContent = value;
      }
      if (!values.length) {
        const cell = table.insertRow().insertCell();
        cell.colSpan = table.closest("table").tHead.rows[0].cells.length;
        cell.textContent = "Belum ada data.";
      }
    }

    async function load(nextAccount) {
      const current = ++generation;
      account = nextAccount;
      const administrator = account.access_role === "company_admin";
      const grants = administrator ? { data: [] } : await client.from("company_staff_permissions")
        .select("module,can_write").eq("user_id", account.user_id);
      if (generation !== current) return;
      if (grants.error) throw grants.error;
      const allowed = new Map(grants.data.map(grant => [grant.module, grant.can_write]));
      const canRead = module => administrator || allowed.has(module);
      const canWrite = module => administrator || allowed.get(module) === true;
      const master = canRead("master_data");
      const projects = canRead("projects");
      const transactions = canRead("transactions");
      root.hidden = !(master || projects || transactions || canRead("rap") || canRead("progress"));

      const empty = { data: [] };
      const [catalog, projectList, ledger, report] = await Promise.all([
        master ? client.from("company_master_data").select("id,kind,name,is_active").order("name") : empty,
        projects ? client.from("company_projects").select("id,code,name,contract_value,starts_on,ends_on").order("code") : empty,
        transactions ? client.from("company_transactions").select("project_id,transaction_date,transaction_type,amount").order("transaction_date", { ascending: false }) : empty,
        projects && transactions ? client.from("company_financial_report").select("name,contract_value,received,spent").order("code") : empty
      ]);
      if (generation !== current) return;
      if ([catalog, projectList, ledger, report].some(result => result.error)) throw new Error("Data belum dapat dimuat.");

      const projectNames = new Map(projectList.data.map(project => [project.id, project.name]));
      const masterNames = new Map([...get("master-entry").elements.kind.options].map(option => [option.value, option.text]));
      rows("master-rows", catalog.data.map(item => [masterNames.get(item.kind), item.name, item.is_active ? "Aktif" : "Nonaktif"]));
      rows("project-rows", projectList.data.map(project => [project.code, project.name, format.money(project.contract_value), format.formatDate(project.starts_on), format.formatDate(project.ends_on)]));
      rows("transaction-rows", ledger.data.map(entry => [format.formatDate(entry.transaction_date), projectNames.get(entry.project_id) || "—", entry.transaction_type, format.money(entry.amount)]));
      rows("report-rows", report.data.map(entry => [entry.name, format.money(entry.contract_value), format.money(entry.received), format.money(entry.spent)]));

      const transactionForm = get("transaction-entry");
      transactionForm.elements.project_id.replaceChildren(...projectList.data.map(project => new Option(project.name, project.id)));
      transactionForm.elements.category_id.replaceChildren(new Option("Tanpa kategori", ""),
        ...catalog.data.filter(item => item.kind === "transaction_category" && item.is_active)
          .map(item => new Option(item.name, item.id)));
      get("master-entry").hidden = !canWrite("master_data");
      get("project-entry").hidden = !canWrite("projects");
      transactionForm.hidden = !canWrite("transactions") || !projectList.data.length;
      [master, projects, transactions, projects && transactions].forEach((visible, index) => {
        get(panels[index]).hidden = !visible;
      });
      await planning.load(canRead, canWrite);
      if (generation === current) onRoutesChanged();
    }

    function bind(formId, table) {
      const form = get(formId);
      const button = form.querySelector("button");
      form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!account || form.hidden || button.disabled) return;
        const current = generation;
        const payload = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim() || null]));
        button.disabled = true;
        notify("");
        try {
          const { error } = await client.from(table).insert(payload);
          if (generation !== current) return;
          if (error) {
            notify("Data belum tersimpan. Periksa isian dan hak akses.", true);
            return;
          }
          form.reset();
          notify("Data berhasil disimpan.");
          try { await load(account); }
          catch { notify("Data tersimpan. Daftar belum berhasil diperbarui.", true); }
        } catch {
          if (generation === current) notify("Status penyimpanan belum dapat dipastikan.", true);
        } finally {
          button.disabled = false;
        }
      });
    }

    bind("master-entry", "company_master_data");
    bind("project-entry", "company_projects");
    bind("transaction-entry", "company_transactions");
    return { clear, load };
  };
})();
