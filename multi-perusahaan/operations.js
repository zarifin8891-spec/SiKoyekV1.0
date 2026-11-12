(function () {
  "use strict";

  window.createCompanyOperations = function (client, notify, onRoutesChanged) {
    const get = id => document.getElementById(id);
    const root = get("operations");
    const forms = ["master-entry", "project-entry", "transaction-entry"];
    const panels = ["master-data-panel", "project-panel", "transaction-panel", "report-panel", "dashboard-panel"];
    const tables = ["master-rows", "transaction-rows", "report-rows"];
    const format = window.SiKoyekFoundation;
    const control = window.SiKoyekControl;
    const { readPages } = control;
    const dashboardRoot = get("dashboard-panel");
    const projectRoot = get("company-project-list");
    const projectForm = get("project-entry");
    const planning = window.createCompanyPlanning(client, () => {
      if (account) load(account, true).catch(() => {});
    }, () => onRoutesChanged("project"));
    let generation = 0;
    let account = null;
    let period = { from: "", to: "" };
    let chartProject = "";
    const filters = { activeOnly: false, search: "" };

    const masterForm = get("master-entry");
    function updateCatalogFields() {
      const kind = masterForm.elements.kind.value;
      const hasCode = ["goods", "employee", "equipment"].includes(kind);
      get("master-code").hidden = masterForm.elements.code.disabled = !hasCode;
      get("master-unit").hidden = masterForm.elements.unit.disabled = kind !== "goods";
    }
    masterForm.elements.kind.addEventListener("change", updateCatalogFields);
    masterForm.addEventListener("reset", () => queueMicrotask(updateCatalogFields));

    function addProject() {
      onRoutesChanged("project");
      projectForm.hidden = false;
      projectForm.elements.code.focus();
    }

    get("project-cancel").addEventListener("click", () => {
      projectForm.reset();
      projectForm.hidden = true;
      projectRoot.querySelector("[data-list-add]")?.focus();
    });

    function groupByProject(data) {
      const grouped = new Map();
      for (const row of data) {
        if (!grouped.has(row.project_id)) grouped.set(row.project_id, []);
        grouped.get(row.project_id).push(row);
      }
      return grouped;
    }

    function renderProjects(projectList, budgets, financial, items, records, access) {
      const budgetByProject = new Map(budgets.map(row => [row.project_id, row]));
      const financialByProject = new Map(financial.map(row => [row.project_id, row]));
      const itemsByProject = groupByProject(items);
      const recordsByProject = groupByProject(records);
      const { rap, progress, transactions, add, open } = access;
      const hasProgress = rap && progress;
      const assess = hasProgress && transactions;
      const rows = projectList.map(project => {
        const budget = budgetByProject.get(project.id);
        const spent = transactions ? Number(financialByProject.get(project.id)?.spent ?? 0) : null;
        const total = rap ? ["material", "labor", "equipment", "operational", "subcontract", "other"]
          .reduce((sum, category) => sum + Number(budget?.[category] ?? 0), 0) : null;
        const actual = hasProgress ? control.actualSeries(itemsByProject.get(project.id) || [],
          recordsByProject.get(project.id) || [], project.starts_on).at(-1)?.value ?? 0 : null;
        const row = {
          project_id: project.id, project_name: project.name, project_code: project.code, status: project.status,
          start_date: project.starts_on, end_date: project.ends_on, contract_value: Number(project.contract_value),
          total_rap: total, total_realization: spent, project_progress: actual,
          cost_ratio: spent == null ? null : project.contract_value > 0 ? spent / project.contract_value * 100 : 0,
          rap_consumption: spent == null || total == null ? null : total > 0 ? spent / total * 100 : 0,
        };
        if (assess) row.health_status = window.SiKoyekHealthEngine.evaluate(row).status;
        return row;
      });

      control.projectList(projectRoot, rows, filters, { open, add });
      function renderDashboard() {
        const visible = rows.filter(row =>
          (!period.from || (row.end_date || row.start_date || period.from) >= period.from) &&
          (!period.to || (row.start_date || row.end_date || period.to) <= period.to));
        control.dashboard(dashboardRoot, {
          rows: visible, period, chartProject, finance: transactions, contract: true,
          hasProgress, assess, rapUnavailable: !rap, canAdd: Boolean(add), add, open,
          logout: () => get("logout").click(),
          list: () => {
            filters.activeOnly = false;
            control.projectList(projectRoot, rows, filters, { open, add });
            onRoutesChanged("project");
          },
          applyPeriod: (from, to) => { period = { from, to }; renderDashboard(); },
          selectChart: id => { chartProject = id; },
          curve: row => hasProgress ? control.curveFromWorkItems(row, itemsByProject.get(row.project_id) || [],
            recordsByProject.get(row.project_id) || []) : "Kurva-S memerlukan akses RAP dan Progress.",
        });
      }
      renderDashboard();
    }

    function clear() {
      generation++;
      account = null;
      planning.clear();
      period = { from: "", to: "" };
      chartProject = "";
      filters.activeOnly = false;
      filters.search = "";
      projectForm.hidden = true;
      dashboardRoot.replaceChildren();
      projectRoot.replaceChildren();
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

    async function load(nextAccount, preservePlanning = false) {
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
      const rap = canRead("rap"), progress = canRead("progress");
      const read = (table, fields, order) => readPages(() => client.from(table).select(fields), order);
      const [catalog, projectList, ledger, financial, budgets, items, records] = await Promise.all([
        master ? client.from("company_master_data").select("id,kind,name,is_active").order("name") : empty,
        projects ? read("company_projects", "id,code,name,contract_value,starts_on,ends_on,status") : [],
        transactions ? read("company_transactions", "id,project_id,transaction_date,transaction_type,amount") : [],
        projects && transactions ? read("company_financial_report", "project_id,code,name,contract_value,received,spent", "project_id") : [],
        projects && rap ? read("company_project_rap", "project_id,material,labor,equipment,operational,subcontract,other", "project_id") : [],
        projects && rap && progress ? read("company_work_items", "id,project_id,weight,duration_days,planned_start_date,sort_order") : [],
        projects && rap && progress ? read("company_progress_records", "id,project_id,work_item_id,progress_date,progress_percentage") : [],
      ]);
      if (generation !== current) return;
      if (catalog.error) throw catalog.error;
      projectList.sort((a, b) => a.code.localeCompare(b.code));
      financial.sort((a, b) => a.code.localeCompare(b.code));
      ledger.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || a.id.localeCompare(b.id));

      const projectNames = new Map(projectList.map(project => [project.id, project.name]));
      const masterNames = new Map([...get("master-entry").elements.kind.options].map(option => [option.value, option.text]));
      rows("master-rows", catalog.data.map(item => [masterNames.get(item.kind), item.name, item.is_active ? "Aktif" : "Nonaktif"]));
      rows("transaction-rows", ledger.map(entry => [format.formatDate(entry.transaction_date), projectNames.get(entry.project_id) || "—", entry.transaction_type, format.money(entry.amount)]));
      rows("report-rows", financial.map(entry => [entry.name, format.money(entry.contract_value), format.money(entry.received), format.money(entry.spent)]));

      const transactionForm = get("transaction-entry");
      transactionForm.elements.project_id.replaceChildren(...projectList.map(project => new Option(project.name, project.id)));
      transactionForm.elements.category_id.replaceChildren(new Option("Tanpa kategori", ""),
        ...catalog.data.filter(item => item.kind === "transaction_category" && item.is_active)
          .map(item => new Option(item.name, item.id)));
      get("master-entry").hidden = !canWrite("master_data");
      projectForm.hidden = true;
      transactionForm.hidden = !canWrite("transactions") || !projectList.length;
      if (projects) renderProjects(projectList, budgets, financial, items, records, {
        rap, progress, transactions, add: canWrite("projects") ? addProject : null,
        open: rap || progress ? id => { onRoutesChanged("planning"); planning.open(id); } : null,
      });
      [master, projects, transactions, projects && transactions, projects].forEach((visible, index) => {
        get(panels[index]).hidden = !visible;
      });
      await planning.load(canRead, canWrite, preservePlanning);
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
