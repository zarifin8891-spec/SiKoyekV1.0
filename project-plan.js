/* Jadwal dan milestone pada detail proyek. Progress mengikuti izin sumbernya. */
(function (global) {
  'use strict';

  const tableName = 'project_milestones';
  const fields = 'id,title,target_date,completed_date,notes';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
  const date = value => {
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) ? dateFormatter.format(parsed) : '—';
  };
  const percent = new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 2 });

  const assignmentsTable = 'project_staff_assignments';

  async function loadRows(client, projectId, source, columns, dateColumn, label) {
    try {
      const { data, error } = await client.from(source).select(columns)
        .eq('project_id', projectId).order(dateColumn).order('id');
      if (!error) return { rows: data || [], error: '' };
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { rows: [], error: label + ' belum tersedia di database ini.' };
      }
    } catch (_) {
      // Jadwal proyek tetap bisa dibuka jika pemuatan milestone gagal.
    }
    return { rows: [], error: label + ' gagal dimuat. Buka ulang detail proyek untuk mencoba lagi.' };
  }

  const load = (client, projectId) =>
    loadRows(client, projectId, tableName, fields, 'target_date', 'Milestone');

  const loadAssignments = (client, projectId) =>
    loadRows(client, projectId, assignmentsTable, 'id,employee_id,assignment_role,start_date,end_date,employees(name,code,is_active)', 'start_date', 'Penempatan');

  function timeline(detail, showProgress) {
    const { project, items = [], progress = [], milestones } = detail;
    const events = [];
    const add = (date, type, title, note = '') => {
      if (date) events.push({ date, type, title, note });
    };
    add(project.start_date, 'Jadwal', 'Mulai proyek');
    add(project.end_date, 'Jadwal', 'Target selesai proyek');
    for (const point of milestones?.rows || []) {
      add(point.target_date, 'Target', point.title, point.notes);
      add(point.completed_date, 'Realisasi', point.title);
    }
    if (showProgress) {
      const names = new Map(items.map(item => [item.id, item.work_name]));
      for (const row of progress) {
        const value = Number(row.progress_percentage);
        add(row.progress_date, 'Progress', names.get(row.work_item_id) || 'Item pekerjaan',
          [Number.isFinite(value) ? percent.format(value) : '', row.notes].filter(Boolean).join(' · '));
      }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  function milestoneStatus(point, today) {
    if (point.completed_date) {
      return point.completed_date > point.target_date
        ? { text: 'Selesai terlambat', tone: 'amber' }
        : { text: 'Selesai tepat waktu', tone: 'green' };
    }
    return point.target_date < today
      ? { text: 'Terlambat', tone: 'red' }
      : { text: 'Terjadwal', tone: '' };
  }

  function table(headers, rows, empty) {
    return `<div class="card tablecard"><div class="scroll"><table class="table">
      <thead><tr>${headers.map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('') || `<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody>
    </table></div></div>`;
  }

  function renderTimeline(detail, showProgress) {
    const rows = timeline(detail, showProgress).map(event =>
      `<tr><td>${date(event.date)}</td><td>${event.type}</td><td>${esc(event.title)}</td><td>${esc(event.note)}</td></tr>`);
    return `<div class="sectiontitle"><h2>Timeline Proyek</h2></div>
      <p class="note">Jadwal, target milestone, realisasi, dan riwayat progress yang dapat diakses akun ini.</p>
      ${detail.milestones?.error ? `<p class="note">${esc(detail.milestones.error)}</p>` : ''}
      ${table(['Tanggal', 'Jenis', 'Kegiatan', 'Catatan'], rows, 'Belum ada jadwal atau aktivitas proyek.')}`;
  }

  function renderMilestones(detail, canEdit, today) {
    const milestones = detail.milestones || { rows: [], error: 'Milestone belum dimuat.' };
    const add = canEdit && !milestones.error
      ? '<button type="button" class="btn primary" data-milestone-action="add">+ Milestone</button>'
      : '';
    const heading = `<div class="sectiontitle"><h2>Milestone Proyek</h2>${add}</div>`;
    if (milestones.error) return heading + `<p class="empty">${esc(milestones.error)}</p>`;
    const rows = milestones.rows.map(point => {
      const status = milestoneStatus(point, today);
      return `<tr><td>${esc(point.title)}</td><td>${date(point.target_date)}</td><td>${date(point.completed_date)}</td>
        <td><span class="pill ${status.tone}">${status.text}</span></td><td>${esc(point.notes)}</td>
        ${canEdit ? `<td><button type="button" class="btn ghost" data-milestone-action="edit" data-id="${esc(point.id)}">Edit</button></td>` : ''}
      </tr>`;
    });
    const headers = ['Milestone', 'Target', 'Realisasi', 'Status', 'Catatan'];
    if (canEdit) headers.push('Aksi');
    return heading + table(headers, rows, 'Belum ada milestone.');
  }

  function renderAssignments(detail, canEdit) {
    const assignments = detail.staff || { rows: [], error: 'Penempatan belum dimuat.' };
    const add = canEdit && !assignments.error
      ? '<button type="button" class="btn primary" data-assignment-action="add">+ Penempatan</button>'
      : '';
    const heading = `<div class="sectiontitle"><h2>Penempatan Karyawan</h2>${add}</div>`;
    if (assignments.error) return heading + `<p class="empty">${esc(assignments.error)}</p>`;
    const rows = assignments.rows.map(assignment =>
      `<tr><td>${esc(assignment.employees?.name || '—')}</td><td>${esc(assignment.assignment_role)}</td>
        <td>${date(assignment.start_date)}</td><td>${date(assignment.end_date)}</td>
        ${canEdit ? `<td><button type="button" class="btn ghost" data-assignment-action="edit" data-id="${esc(assignment.id)}">Edit</button></td>` : ''}
      </tr>`);
    const headers = ['Karyawan', 'Peran di proyek', 'Mulai', 'Selesai'];
    if (canEdit) headers.push('Aksi');
    return heading + table(headers, rows, 'Belum ada karyawan yang ditempatkan.');
  }

  function editorActions(point) {
    return `<p class="note" role="status" data-project-record-status></p>
      <div class="formactions">
        ${point ? '<button type="button" class="btn ghost" data-project-record-delete>Hapus</button>' : ''}
        <button type="button" class="btn ghost" data-project-record-cancel>Batal</button>
        <button type="submit" class="btn primary">Simpan</button>
      </div>`;
  }

  async function openAssignmentEditor({ client, projectId, point, modal, closeModal, onSaved, isCurrent }) {
    let employees = [];
    if (!point) {
      const { data, error } = await client.from('employees').select('id,name,code')
        .eq('is_active', true).order('name').order('code');
      if (!isCurrent() || document.getElementById('modal')) return;
      if (error || !data?.length) {
        modal('Tempatkan Karyawan', `<p class="empty">${error
          ? 'Daftar karyawan gagal dimuat.'
          : 'Belum ada karyawan aktif. Tambahkan atau aktifkan karyawan di Data Master.'}</p>`);
        return;
      }
      employees = data;
    }
    const employeeField = point
      ? `<p class="note">Karyawan: ${esc(point.employees?.name || '—')}</p>`
      : `<div class="field"><label for="staff-employee">Karyawan *</label>
          <select id="staff-employee" name="employee_id" required>
            <option value="">Pilih karyawan</option>
            ${employees.map(employee => `<option value="${esc(employee.id)}">${esc(employee.name)} (${esc(employee.code)})</option>`).join('')}
          </select></div>`;
    modal(point ? 'Edit Penempatan' : 'Tempatkan Karyawan', `
      <form id="assignment-form">
        ${employeeField}
        <div class="field"><label for="staff-role">Peran di proyek *</label>
          <input id="staff-role" name="assignment_role" maxlength="100" required value="${esc(point?.assignment_role)}"></div>
        <div class="formgrid">
          <div class="field"><label for="staff-start">Mulai *</label>
            <input id="staff-start" name="start_date" type="date" required value="${esc(point?.start_date)}"></div>
          <div class="field"><label for="staff-end">Selesai</label>
            <input id="staff-end" name="end_date" type="date" value="${esc(point?.end_date)}"></div>
        </div>
        ${editorActions(point)}
      </form>`);
    bindEditor('assignment-form', client, assignmentsTable, projectId, point, closeModal, onSaved, 'Hapus penempatan ini?', input => {
      const row = {
        ...(!point ? { employee_id: input.employee_id } : {}),
        assignment_role: input.assignment_role.trim(),
        start_date: input.start_date,
        end_date: input.end_date || null
      };
      if (!row.assignment_role) return 'Peran karyawan wajib diisi.';
      if (row.end_date && row.end_date < row.start_date) return 'Tanggal selesai harus pada atau setelah tanggal mulai.';
      return row;
    });
  }

  function openEditor({ client, projectId, point, modal, closeModal, onSaved }) {
    modal(point ? 'Edit Milestone' : 'Tambah Milestone', `
      <form id="milestone-form">
        <div class="field"><label for="ms-title">Nama milestone *</label>
          <input id="ms-title" name="title" maxlength="120" required value="${esc(point?.title)}"></div>
        <div class="formgrid">
          <div class="field"><label for="ms-target">Tanggal target *</label>
            <input id="ms-target" name="target_date" type="date" required value="${esc(point?.target_date)}"></div>
          <div class="field"><label for="ms-completed">Tanggal realisasi</label>
            <input id="ms-completed" name="completed_date" type="date" value="${esc(point?.completed_date)}"></div>
        </div>
        <div class="field"><label for="ms-notes">Catatan</label>
          <textarea id="ms-notes" name="notes" maxlength="1000">${esc(point?.notes)}</textarea></div>
        ${editorActions(point)}
      </form>`);
    bindEditor('milestone-form', client, tableName, projectId, point, closeModal, onSaved, 'Hapus milestone ini?', input => {
      const title = input.title.trim();
      if (!title) return 'Nama milestone wajib diisi.';
      return { title, target_date: input.target_date, completed_date: input.completed_date || null, notes: input.notes.trim() || null };
    });
  }

  function bindEditor(formId, client, source, projectId, point, closeModal, onSaved, confirmDelete, validate) {
    const form = document.getElementById(formId);
    const message = form.querySelector('[data-project-record-status]');
    const controls = [...form.querySelectorAll('button'), form.closest('.modalbox').querySelector('.modalhead button')];
    let busy = false;

    async function save(action) {
      if (busy) return;
      busy = true;
      controls.forEach(button => { button.disabled = true; });
      message.textContent = 'Memproses…';
      try {
        const { data, error } = await action.select('id').maybeSingle();
        if (error || !data) {
          message.textContent = 'Perubahan gagal disimpan. Periksa izin atau muat ulang detail proyek.';
          return;
        }
        if (form.isConnected) closeModal();
        await onSaved();
      } catch (_) {
        message.textContent = 'Terjadi gangguan saat menyimpan. Periksa detail proyek sebelum mencoba lagi.';
      } finally {
        controls.forEach(button => { button.disabled = false; });
        busy = false;
      }
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (busy) return;
      const input = Object.fromEntries(new FormData(form));
      const row = validate(input);
      if (typeof row === 'string') {
        message.textContent = row;
        return;
      }
      const query = client.from(source);
      save(point
        ? query.update(row).eq('project_id', projectId).eq('id', point.id)
        : query.insert({ ...row, project_id: projectId }));
    });
    form.querySelector('[data-project-record-cancel]').addEventListener('click', closeModal);
    form.querySelector('[data-project-record-delete]')?.addEventListener('click', () => {
      if (!busy && global.confirm(confirmDelete)) {
        save(client.from(source).delete().eq('project_id', projectId).eq('id', point.id));
      }
    });
  }

  global.SiKoyekProjectPlan = { load, loadAssignments, renderTimeline, renderMilestones, renderAssignments, openEditor, openAssignmentEditor };
})(window);
