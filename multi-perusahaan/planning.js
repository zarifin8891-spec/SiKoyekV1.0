(function () {
  "use strict";

  window.createCompanyPlanning = function (client) {
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
    const format = window.SiKoyekFoundation;
    const percent = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, style: "percent" });
    let generation = 0;
    let projects = [];
    let access = {};
    let editId = null;
    let recordId = null;
    let saving = false;

    function resetItem() {
      editId = null;
      itemForm.reset();
      itemForm.querySelector("button[type=submit]").textContent = "Tambah Item";
      cancelItem.hidden = true;
    }

    function resetRecord() {
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
      get("planning-curve").replaceChildren();
      resetItem();
      budgetForm.reset();
      resetRecord();
      recordForm.elements.work_item_id.replaceChildren();
    }

    const { readPages } = window.SiKoyekControl;

    async function load(canRead, canWrite) {
      clear();
      if (!canRead("rap") && !canRead("progress")) return;
      access = {
        rap: canRead("rap"), writeRap: canWrite("rap"),
        progress: canRead("progress"), writeProgress: canWrite("progress"),
      };
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
      resetItem();
      resetRecord();
      if (!project) {
        notice.textContent = "";
        return;
      }
      notice.textContent = "Memuat perincian proyek…";
      const scoped = (table, fields) => client.from(table).select(fields).eq("project_id", project.id);
      try {
        const [budget, workItems, records] = await Promise.all([
          access.rap ? scoped("company_project_rap", budgetFields.map(field => field.name).join(",")).maybeSingle() : {},
          readPages(() => access.rap ? scoped("company_work_items", "id,work_name,weight,duration_days,planned_start_date,sort_order")
            : client.rpc("project_progress_item_choices", { selected_project: project.id })),
          access.progress ? readPages(() => scoped("company_progress_records", "id,work_item_id,progress_date,progress_percentage,notes")) : [],
        ]);
        if (current !== generation) return;
        if (budget.error) throw budget.error;
        workItems.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
        records.sort((a, b) => b.progress_date.localeCompare(a.progress_date) || a.id.localeCompare(b.id));
        const itemNames = new Map(workItems.map(item => [item.id, item.work_name]));
        for (const field of budgetFields) {
          field.value = budget.data?.[field.name] ?? 0;
          field.readOnly = !access.writeRap;
        }
        budgetForm.querySelector("button").hidden = !access.writeRap;
        itemForm.hidden = !access.writeRap;
        recordForm.hidden = !access.writeProgress || !workItems.length;
        recordForm.elements.work_item_id.replaceChildren(...workItems.map(item => new Option(item.work_name, item.id)));
        recordForm.elements.progress_date.min = project.starts_on || "";
        itemForm.elements.planned_start_date.min = project.starts_on || "";
        get("planning-rap").hidden = !access.rap;
        get("planning-progress").hidden = !access.progress;
        get("planning-overview").hidden = !(access.rap && access.progress);
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
        if (access.rap && access.progress) {
          get("planning-curve").innerHTML = window.SiKoyekControl.curveFromWorkItems(
            { start_date: project.starts_on, end_date: project.ends_on }, workItems, records);
        }
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
    cancelItem.addEventListener("click", resetItem);
    cancelRecord.addEventListener("click", resetRecord);
    projectSelect.addEventListener("change", () => loadDetails());
    function open(projectId) {
      projectSelect.value = projectId;
      return loadDetails();
    }

    return { clear, load, open };
  };
})();
