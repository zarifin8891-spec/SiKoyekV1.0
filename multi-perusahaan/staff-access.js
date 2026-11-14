(function () {
  "use strict";

  window.createCompanyStaffAccess = function (client) {
    const dialog = document.getElementById("staff-access-dialog");
    const form = document.getElementById("staff-access-form");
    const name = document.getElementById("staff-access-name");
    const notice = document.getElementById("staff-access-notice");
    const submit = form.querySelector("button");
    const modules = [...form.querySelectorAll("select")];
    let generation = 0;
    let staffId = null;

    for (const field of modules) {
      field.append(new Option("Tanpa akses", "none"), new Option("Baca", "read"),
        new Option("Baca dan kelola", "write"));
    }

    function reset() {
      generation++;
      staffId = null;
      form.hidden = true;
      submit.disabled = false;
      form.reset();
      name.textContent = "";
      notice.textContent = "";
    }

    function clear() {
      reset();
      if (dialog.open) dialog.close();
    }

    async function open(user) {
      reset();
      const current = generation;
      staffId = user.user_id;
      name.textContent = user.full_name;
      notice.textContent = "Memuat hak akses…";
      if (!dialog.open) dialog.showModal();
      try {
        const { data, error } = await client.from("company_staff_permissions")
          .select("module,can_write").eq("user_id", staffId);
        if (current !== generation || !dialog.open) return;
        if (error) throw error;
        const grants = new Map(data.map(grant => [grant.module, grant.can_write]));
        for (const field of modules) {
          field.value = grants.has(field.name) ? (grants.get(field.name) ? "write" : "read") : "none";
        }
        form.hidden = false;
        notice.textContent = "";
      } catch {
        if (current === generation) notice.textContent = "Hak akses belum dapat dimuat.";
      }
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!staffId || form.hidden || submit.disabled) return;
      const current = generation;
      submit.disabled = true;
      notice.textContent = "";
      try {
        const { error } = await client.rpc("set_company_staff_access", {
          staff_id: staffId,
          access_settings: Object.fromEntries(new FormData(form)),
        });
        if (error) throw error;
        if (current === generation) notice.textContent = "Hak akses tersimpan.";
      } catch {
        if (current === generation) notice.textContent = "Hak akses belum tersimpan. Periksa koneksi dan izin akun.";
      } finally {
        if (current === generation) submit.disabled = false;
      }
    });
    dialog.addEventListener("close", () => { if (!dialog.open) reset(); });
    return { open, clear };
  };
})();
