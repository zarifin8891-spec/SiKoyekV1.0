(function () {
  "use strict";

  window.createCompanyPlanning = function (client, onSaved, openProjectList) {
    const get = id => document.getElementById(id);
    const panel = get("planning-panel");
    const projectSelect = get("planning-project");
    const details = get("planning-details");
    const notice = get("planning-notice");
    const budgetForm = get("planning-budget");
    const itemForm = get("planning-item");
    const recordForm = get("planning-record");
    const budgetFields = [...budgetForm.querySelectorAll("input")];
    const cancelItem = get("planning-item-cancel");
    const cancelRecord = get("planning-record-cancel");
    const view = window.SiKoyekProjectDetail;
    const addItem = details.querySelector("[data-add-item]");
    const addRecord = details.querySelector("[data-add-record]");
    const sections = {
      overview: "planning-overview", rap: "planning-rap", work: "planning-work", progress: "planning-progress",
      materials: "planning-materials", resources: "planning-resources",
    };
    const control = window.SiKoyekControl;
    const resourceTables = {
      project_material_stocks: "company_material_stocks",
      project_worker_assignments: "company_worker_assignments",
      project_equipment_assignments: "company_equipment_assignments",
    };
    const resourceKinds = { goods_id: "goods", employee_id: "employee", equipment_id: "equipment" };
    let labels = {};
    let tab = "overview";
    const format = window.SiKoyekFoundation;
    const percent = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, style: "percent" });
    let generation = 0;
    let projects = [];
    let access = {};
    let editId = null;
    let recordId = null;
    let saving = false;

    function resetItem() {
      itemForm.hidden = true;
      editId = null;
      itemForm.reset();
      itemForm.querySelector("button[type=submit]").textContent = "Tambah Item";
      cancelItem.hidden = true;
    }

    function resetRecord() {
      recordForm.hidden = true;
      recordId = null;
      recordForm.reset();
      recordForm.querySelector("button[type=submit]").textContent = "Tambah Progress";
      cancelRecord.hidden = true;
    }

    function clear() {
      generation++;
      projects = [];
      access = {};
      panel.hidden = details.hidden = true;
      projectSelect.replaceChildren();
      notice.textContent = "";
      get("planning-items").replaceChildren();
      get("planning-history").replaceChildren();
      for (const id of ["planning-heading", "planning-kpis", "planning-tabs", "planning-overview", "planning-budget-summary"]) {
        get(id).replaceChildren();
      }
      labels = {};
      tab = "overview";
      get(sections.materials).replaceChildren();
      get(sections.resources).replaceChildren();
      budgetForm.hidden = true;
      resetItem();
      budgetForm.reset();
      resetRecord();
      recordForm.elements.work_item_id.replaceChildren();
    }

    const { readPages } = window.SiKoyekControl;

    async function load(canRead, canWrite, preserve = false) {
      const next = {
        rap: canRead("rap"), writeRap: canWrite("rap"),
        progress: canRead("progress"), writeProgress: canWrite("progress"),
        projects: canRead("projects"), finance: canRead("transactions"),
        costChart: canRead("transactions") && canRead("master_data"),
      };
      if (preserve && Object.keys(next).every(key => next[key] === access[key])) return;
      clear();
      if (!next.rap && !next.progress) return;
      access = next;
      const current = generation;
      panel.hidden = false;
      notice.textContent = "Memuat proyek…";
      try {
        const available = await readPages(() => client.rpc("project_planning_choices"));
        if (current !== generation) return;
        projects = available.sort((a, b) => a.code.localeCompare(b.code));
        projectSelect.replaceChildren(new Option("Pilih proyek", ""),
          ...projects.map(project => new Option(project.code + " · " + project.name, project.id)));
        notice.textContent = projects.length ? "" : "Belum ada proyek.";
      } catch {
        if (current === generation) notice.textContent = "Daftar proyek belum dapat dimuat.";
      }
    }

    function renderRows(id, data, cells, action) {
      const table = get(id);
      table.replaceChildren();
      for (const entry of data) {
        const row = table.insertRow();
        for (const value of cells(entry)) row.insertCell().textContent = value;
        if (action) action(row.insertCell(), entry);
      }
      if (!data.length) {
        const cell = table.insertRow().insertCell();
        cell.colSpan = table.closest("table").tHead.rows[0].cells.length;
        cell.textContent = "Belum ada data.";
      }
    }

    function renderEdit(cell, item) {
      if (!access.writeRap) return;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Ubah";
      button.addEventListener("click", () => {
        itemForm.hidden = false;
        editId = item.id;
        for (const field of itemForm.querySelectorAll("input")) field.value = item[field.name] ?? "";
        itemForm.elements.weight.value = Math.round(Number(item.weight) * 1000000) / 10000;
        itemForm.querySelector("button[type=submit]").textContent = "Simpan Item";
        cancelItem.hidden = false;
        itemForm.elements.work_name.focus();
      });
      cell.append(button);
    }

    function renderRecordEdit(cell, record) {
      if (!access.writeProgress) return;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Ubah";
      button.addEventListener("click", () => {
        recordForm.hidden = false;
        recordId = record.id;
        for (const field of recordForm.querySelectorAll("input, select")) field.value = record[field.name] ?? "";
        recordForm.elements.progress_percentage.value = Math.round(Number(record.progress_percentage) * 1000000) / 10000;
        recordForm.querySelector("button[type=submit]").textContent = "Simpan Progress";
        cancelRecord.hidden = false;
        recordForm.elements.work_item_id.focus();
      });
      cell.append(button);
    }

    async function loadDetails(status = "") {
      const current = ++generation;
      const project = projects.find(row => row.id === projectSelect.value);
      details.hidden = true;
      get(sections.materials).replaceChildren();
      get(sections.resources).replaceChildren();
      budgetForm.hidden = true;
      resetItem();
      resetRecord();
      if (!project) {
        notice.textContent = "";
        return;
      }
      notice.textContent = "Memuat perincian proyek…";
      const scoped = (table, fields) => client.from(table).select(fields).eq("project_id", project.id);
      try {
        const [budget, workItems, records, projectData, transactions, categories] = await Promise.all([
          access.rap ? scoped("company_project_rap", budgetFields.map(field => field.name).join(",")).maybeSingle() : {},
          readPages(() => access.rap ? scoped("company_work_items", "id,work_name,weight,duration_days,planned_start_date,sort_order")
            : client.rpc("project_progress_item_choices", { selected_project: project.id })),
          access.progress ? readPages(() => scoped("company_progress_records", "id,work_item_id,progress_date,progress_percentage,notes")) : [],
          access.projects ? client.from("company_projects").select("status,contract_value").eq("id", project.id).maybeSingle() : {},
          access.finance ? readPages(() => scoped("company_transactions", "id,category_id,category,transaction_type,amount")).catch(() => null) : [],
          access.costChart ? readPages(() => client.from("company_master_data").select("id,name").eq("kind", "transaction_category")).catch(() => null) : [],
        ]);
        if (current !== generation) return;
        if (budget.error || projectData.error) throw budget.error || projectData.error;
        workItems.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
        records.sort((a, b) => b.progress_date.localeCompare(a.progress_date) || a.id.localeCompare(b.id));
        const itemNames = new Map(workItems.map(item => [item.id, item.work_name]));
        for (const field of budgetFields) {
          field.value = budget.data?.[field.name] ?? 0;
        }
        addItem.hidden = !access.writeRap;
        addRecord.hidden = !access.writeProgress || !workItems.length;
        recordForm.elements.work_item_id.replaceChildren(...workItems.map(item => new Option(item.work_name, item.id)));
        recordForm.elements.progress_date.min = project.starts_on || "";
        itemForm.elements.planned_start_date.min = project.starts_on || "";
        if (access.rap) {
          renderRows("planning-items", workItems, item => [
            item.work_name, percent.format(item.weight), item.duration_days ?? "—",
            format.formatDate(item.planned_start_date), item.sort_order,
          ], renderEdit);
        }
        if (access.progress) renderRows("planning-history", records, record => [
          format.formatDate(record.progress_date), itemNames.get(record.work_item_id) || "—",
          percent.format(record.progress_percentage), record.notes || "—",
        ], renderRecordEdit);
        const categoryNames = new Map((categories || []).map(row => [row.id, row.name]));
        const model = {
          project: { project_name: project.name, project_code: project.code, start_date: project.starts_on,
            end_date: project.ends_on, ...projectData.data },
          rap: budget.data, items: workItems, progress: records,
          financeReadError: !transactions || !categories,
          fin: (transactions || []).map(row => ({ ...row, category: row.category ?? categoryNames.get(row.category_id) })),
        };
        const curve = access.rap && access.progress;
        const total = access.rap ? budgetFields.reduce((sum, field) => sum + Number(budget.data?.[field.name] || 0), 0) : null;
        const spent = access.finance && transactions ? transactions.reduce((sum, row) => sum +
          (row.transaction_type === "KELUAR" ? Number(row.amount) : 0), 0) : null;
        const contract = model.project.contract_value;
        const summary = {
          total_rap: total, total_realization: spent,
          project_progress: curve ? window.SiKoyekControl.actualSeries(workItems, records, project.starts_on).at(-1)?.value ?? 0 : null,
          cost_ratio: spent != null && contract > 0 ? spent / contract * 100 : null,
          rap_consumption: spent != null && total > 0 ? spent / total * 100 : null,
        };
        if (curve && spent != null && total > 0) summary.health_status = window.SiKoyekHealthEngine.evaluate(summary).status;
        const display = { ...access, finance: access.finance && transactions !== null, curve };
        const back = access.projects ? '<button type="button" class="btn ghost" data-back-projects>← Kembali</button>' : "";
        const add = access.writeRap ? '<button type="button" class="btn primary" data-add-item>+ Item Pekerjaan</button>' : "";
        get("planning-heading").innerHTML = view.headerMarkup(model.project, back + add);
        get("planning-kpis").innerHTML = view.kpiMarkup(model, summary, display);
        get("planning-overview").innerHTML = view.summaryMarkup(model, summary, display);
        get("planning-budget-summary").innerHTML = access.rap ? view.rapMarkup(budget.data, total,
          access.writeRap ? '<button type="button" class="btn primary" data-edit-rap>Edit RAP</button>' : "") : "";
        labels = { overview: "Overview", ...(access.rap ? { work: "Item Pekerjaan", rap: "RAP" } : {}),
          ...(access.progress ? { progress: "Progress", ...control.projectTabs } : {}) };
        selectTab(Object.hasOwn(labels, tab) ? tab : "overview");
        details.hidden = false;
        notice.textContent = status;
      } catch {
        if (current === generation) notice.textContent = status
          ? status + " Daftar belum berhasil diperbarui." : "Perincian proyek belum dapat dimuat.";
      }
    }

    function bind(form, permission, save) {
      const button = form.querySelector("button[type=submit]");
      form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!access[permission] || details.hidden || form.hidden || saving || !projectSelect.value) return;
        const current = generation;
        const values = Object.fromEntries(new FormData(form));
        values.project_id = projectSelect.value;
        saving = button.disabled = true;
        notice.textContent = "Menyimpan…";
        try {
          const { error } = await save(values);
          if (current !== generation) return;
          if (error) throw error;
          await loadDetails("Data tersimpan.");
          onSaved?.();
        } catch {
          if (current === generation) notice.textContent = "Data belum dapat disimpan. Periksa isian dan hak akses.";
        } finally {
          saving = button.disabled = false;
        }
      });
    }

    bind(budgetForm, "writeRap", values => client.from("company_project_rap").upsert(values, { onConflict: "project_id" }));
    bind(itemForm, "writeRap", values => {
      const { project_id, ...fields } = values;
      fields.work_name = fields.work_name.trim();
      fields.weight = Number(fields.weight) / 100;
      fields.planned_start_date ||= null;
      const table = client.from("company_work_items");
      return editId ? table.update(fields).eq("project_id", project_id).eq("id", editId).select("id").single()
        : table.insert({ project_id, ...fields });
    });
    bind(recordForm, "writeProgress", values => {
      values.progress_percentage = Number(values.progress_percentage) / 100;
      values.notes = values.notes.trim() || null;
      const { project_id, ...fields } = values;
      const table = client.from("company_progress_records");
      return recordId ? table.update(fields).eq("project_id", project_id).eq("id", recordId).select("id").single()
        : table.insert(values);
    });
    function selectTab(next) {
      tab = next;
      get("planning-tabs").innerHTML = view.tabsMarkup(labels, tab);
      for (const [key, id] of Object.entries(sections)) get(id).hidden = key !== tab;
      if (next === "materials" || next === "resources") {
        const root = get(sections[next]);
        if (root.childElementCount) return;
        control.mountProjectTab(root, next, { id: projectSelect.value }, null, {
          client, canRead: access.progress, canWrite: access.writeProgress, tables: resourceTables,
          catalogChoices: reference => readPages(() => client.rpc("project_resource_choices", {
            resource_kind: resourceKinds[reference],
          }), "name"),
        });
      }
    }

    details.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (Object.hasOwn(labels, button.dataset.detailTab)) {
        selectTab(button.dataset.detailTab);
        get("planning-tabs").querySelector('[aria-current="page"]').focus();
      } else if (button.hasAttribute("data-back-projects") && access.projects) {
        openProjectList?.();
      } else if (button.hasAttribute("data-edit-rap") && access.writeRap) {
        selectTab("rap");
        budgetForm.hidden = false;
        budgetFields[0].focus();
      } else if (button.hasAttribute("data-add-item") && access.writeRap) {
        selectTab("work");
        resetItem();
        itemForm.hidden = false;
        itemForm.elements.work_name.focus();
      } else if (button.hasAttribute("data-add-record") && access.writeProgress) {
        resetRecord();
        recordForm.hidden = false;
        recordForm.elements.work_item_id.focus();
      }
    });
    get("planning-budget-cancel").addEventListener("click", () => { budgetForm.reset(); loadDetails(); });
    cancelItem.addEventListener("click", resetItem);
    cancelRecord.addEventListener("click", resetRecord);
    projectSelect.addEventListener("change", () => { tab = "overview"; loadDetails(); });
    function open(projectId) {
      tab = "overview";
      projectSelect.value = projectId;
      return loadDetails();
    }

    return { clear, load, open };
  };
})();
