(function (global) {
  'use strict';

  const modules = {
    materials: {
      title: 'Material & Logistik', permission: 'PROGRESS', icon: 'layers',
      tables: {
        project_material_stocks: ['Saldo material per proyek', 'name',
          ['name', 'Material', 'text'], ['unit', 'Satuan', 'text'], ['quantity', 'Saldo', 'number', 0], ['minimum_quantity', 'Stok minimum', 'number', 0]]
      }
    },
    resources: {
      title: 'Tenaga Kerja & Alat', permission: 'PROGRESS', icon: 'users',
      tables: {
        project_worker_assignments: ['Penempatan tenaga kerja', 'starts_on',
          ['worker_code', 'Kode pekerja', 'text'], ['worker_name', 'Nama pekerja', 'text'],
          ['starts_on', 'Mulai', 'date'], ['ends_on', 'Selesai', 'date', null, null, true]],
        project_equipment_assignments: ['Penempatan alat', 'starts_on',
          ['equipment_code', 'Kode alat', 'text'], ['name', 'Nama alat', 'text'],
          ['starts_on', 'Mulai', 'date'], ['ends_on', 'Selesai', 'date', null, null, true]]
      }
    },
    reports: {
      title: 'Dokumen Proyek', permission: 'LAPORAN', icon: 'document',
      tables: {
        project_document_links: ['Tautan dokumen proyek', 'title',
          ['title', 'Judul dokumen', 'text'], ['url', 'URL HTTPS', 'url']]
      }
    },
    field: {
      title: 'Log Lapangan', permission: 'PROGRESS', icon: 'activity',
      tables: {
        project_field_logs: ['Aktivitas lapangan', 'logged_at',
          ['logged_at', 'Waktu aktivitas', 'datetime-local'], ['description', 'Aktivitas', 'text']],
        project_weather_observations: ['Observasi cuaca lapangan', 'observed_at',
          ['observed_at', 'Waktu observasi', 'datetime-local'], ['condition', 'Kondisi cuaca', 'text'],
          ['temperature_c', 'Suhu (°C)', 'number', -60, 65, true]]
      }
    }
  };

  const catalogs = {
    employees: {table: 'employee_master', title: 'Karyawan', reference: 'employee_id',
      assignment: 'project_worker_assignments', snapshot: {worker_code: 'code', worker_name: 'name'}},
    equipment: {table: 'equipment_master', title: 'Alat', reference: 'equipment_id',
      assignment: 'project_equipment_assignments', snapshot: {equipment_code: 'code', name: 'name'}},
    goods: {table: 'goods_master', title: 'Barang', reference: 'goods_id',
      assignment: 'project_material_stocks', snapshot: {name: 'name', unit: 'unit'},
      fields: [['unit', 'Satuan', 'text']]}
  };
  const assignmentCatalog = Object.fromEntries(Object.values(catalogs).map(catalog => [catalog.assignment, catalog]));

  function mountCatalog(root, key) {
    const catalog = catalogs[key];
    const definition = [catalog.title, 'code',
      ['code', 'Kode', 'text'], ['name', 'Nama', 'text'], ...(catalog.fields || []), ['is_active', 'Status', 'boolean']];
    mountTable(root, catalog.table, definition, null, 'MASTER_DATA');
  }

  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    project: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3m-13 6h18"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    budget: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M21 10h-7v5h7"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    users: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3m2-16a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5v2"/>',
    document: '<path d="M6 3h8l4 4v14H6zm7 0v5h5M9 12h6m-6 4h6"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    settings: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>'
  };
  const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  const number = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 1});
  const compact = new Intl.NumberFormat('id-ID', {notation: 'compact', maximumFractionDigits: 1});
  const dateLabel = new Intl.DateTimeFormat('id-ID', {dateStyle: 'long'});
  const timeLabel = new Intl.DateTimeFormat('id-ID', {dateStyle: 'short', timeStyle: 'short'});
  const isoLocal = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const percentage = value => number.format(value) + '%';
  const currency = value => 'Rp ' + compact.format(value);
  const active = p => ['JALAN', 'RENCANA'].includes(p.status);
  const projectSpend = p => Number(p.total_realization ?? p.cash_out ?? 0);
  const unassessed = 'BELUM DINILAI';

  function dashboardHealth(row) {
    const awaitingWork = ['RENCANA', 'PENDING'].includes(row.status) &&
      !Number(row.project_progress || 0) && !projectSpend(row) && !Number(row.rap_consumption || 0);
    return awaitingWork
      ? {status: unassessed, level: 'neutral'}
      : global.SiKoyekHealthEngine.evaluate(row);
  }
  const message = text => `<p class="control-note">${esc(text)}</p>`;
  const options = rows => rows.map(p => `<option value="${esc(p.project_id)}">${esc(p.project_name || p.project_code)}</option>`).join('');
  let chartProject = '';
  let identity = '';
  let admin = false;
  let access = new Set();

  const can = (permission, action = 'VIEW') => admin || access.has(permission + '.' + action);

  async function setIdentity(user) {
    identity = user?.user_metadata?.full_name || user?.email || '';
    admin = false;
    access = new Set();
    if (!user?.id) return;
    try {
      const {data: profile} = await sb.from('profiles')
        .select('full_name,is_active,role_id,roles(name,is_active)').eq('id', user.id).maybeSingle();
      if (!profile?.is_active || !profile.roles?.is_active) return;
      identity = profile.full_name || identity;
      admin = profile.roles.name.trim().toLowerCase() === 'admin';
      if (admin) return;
      const {data: grants} = await sb.from('role_permissions').select('permission_id').eq('role_id', profile.role_id);
      if (!grants?.length) return;
      const {data: permissions} = await sb.from('permissions').select('module,action').in('id', grants.map(grant => grant.permission_id));
      access = new Set((permissions || []).map(row => {
        const key = row.module.toUpperCase();
        return (key === 'FINANCE' ? 'KEUANGAN' : key) + '.' + row.action.toUpperCase();
      }));
    } catch {
      // The backend also checks every new table operation.
    }
  }

  function nav(page) {
    const entries = [
      ['dashboard', 'Dashboard', 'dashboard', 'DASHBOARD', "go('dashboard')"],
      ['projects', 'Daftar Proyek', 'project', 'PROJECTS', "go('projects')"],
      ['laporan', 'Laporan', 'document', 'LAPORAN', "go('laporan')"],
      ['field', modules.field.title, 'activity', 'PROGRESS', "go('field')"],
      ['master-data', 'Master Data', 'settings', 'MASTER_DATA', "go('master-data')"],
      ['users', 'Daftar User', 'users', 'USERS', "go('users')"]
    ];
    return `<aside class="sidebar control-sidebar">
      <div class="control-brand"><img src="./sikoyek-sidebar-logo.webp" width="480" height="168" alt="SiKoyek"></div>
      <button class="control-menu" type="button" aria-expanded="false" aria-controls="control-nav" onclick="SiKoyekControl.toggleMenu(this)">${icon('menu')} Menu</button>
      <nav id="control-nav" class="nav" aria-label="Menu utama">
        ${entries.filter(([key, , , permission]) => can(permission)).map(([key, label, glyph, permission, action]) => {
          const selected = key === page || key === 'projects' && page === 'detail' || key === 'laporan' && page === 'reports';
          return `<button type="button" data-rbac-module="${permission}" ${key === 'master-data' ? 'data-master-data-nav' : key === 'users' ? 'data-users-nav' : ''}
            class="${selected ? 'active' : ''}" ${selected ? 'aria-current="page"' : ''} onclick="${action}">${icon(glyph)}<span>${label}</span></button>`;
        }).join('')}
      </nav><div class="sidefoot control-identity" title="${esc(identity || 'Akun SiKoyek')}">${icon('users')}<span>${esc(identity || 'Akun SiKoyek')}</span></div>
    </aside>`;
  }

  function toggleMenu(button) {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.closest('.sidebar').classList.toggle('control-open', !open);
  }

  function card(label, value, detail, glyph, id = '') {
    return `<section class="control-card control-kpi">${icon(glyph)}<h2>${label}</h2>
      <strong ${id ? `id="${id}"` : ''}>${value}</strong><div class="control-note">${detail}</div></section>`;
  }

  const projectLink = p => `<button type="button" class="control-link" data-project="${esc(p.project_id)}">${esc(p.project_name || p.project_code)}</button>`;
  const stateClass = priority => ({TINGGI: 'red', SEDANG: 'amber', RENDAH: 'green'})[priority];
  const emptyRow = (columns, text) => `<tr><td colspan="${columns}">${esc(text)}</td></tr>`;

  function tableRows(rows, finance) {
    return rows.slice(0, 8).map(p => `<tr>
      <td>${projectLink(p)}</td><td>${esc(p.location || '—')}</td>
      ${finance ? `<td class="control-number">${money(projectSpend(p))}</td>
        <td class="control-number">${percentage(p.cost_ratio || 0)}</td><td class="control-number">${percentage(p.rap_consumption || 0)}</td>` : ''}
      <td class="control-number"><progress max="100" value="${Number(p.project_progress || 0)}"></progress> ${percentage(p.project_progress || 0)}</td>
      <td><span class="control-badge ${p.health.level}">${esc(p.health.status)}</span></td>
    </tr>`).join('') || emptyRow(finance ? 7 : 4, 'Tidak ada proyek untuk ditampilkan.');
  }

  function decisions(rows) {
    const rank = {TINGGI: 3, SEDANG: 2, RENDAH: 1};
    const prioritized = rows.filter(row => row.health.status !== unassessed).map(row => {
      // Decision Engine v1 recognizes the original wording for the yellow Health status.
      const health = row.health.status === 'AWASI' ? {...row.health, status: 'PERLU PENGAWASAN'} : row.health;
      return {...row, decision: global.SiKoyekDecisionEngine.evaluate(row, health)};
    }).sort((a, b) => rank[b.decision.priority] - rank[a.decision.priority] || b.decision.costGap - a.decision.costGap);
    return prioritized.slice(0, 5).map(row => `<tr><td>${projectLink(row)}</td>
      <td><span class="control-badge ${stateClass(row.decision.priority)}">${esc(row.decision.priority)}</span></td>
      <td>${esc(row.decision.reason)}</td><td>${esc(row.decision.action)}</td></tr>`).join('') ||
      emptyRow(4, 'Belum ada proyek yang dapat dinilai pada periode ini.');
  }

  function periodRanges() {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const date = (offset, day) => isoLocal(new Date(year, month + offset, day)).slice(0, 10);
    return {
      thisMonth: [date(0, 1), date(1, 0)],
      lastMonth: [date(-1, 1), date(0, 0)],
      thisYear: [`${year}-01-01`, `${year}-12-31`]
    };
  }

  function periodControls() {
    const {from, to} = state.period;
    const quick = Object.entries(periodRanges()).find(([, dates]) => dates[0] === from && dates[1] === to)?.[0] || '';
    return `<form class="control-card control-period" aria-label="Periode Dashboard">
      <label>Periode<select class="control-select" name="preset" id="periodPreset">
        <option value="">Pilih periode</option>
        ${[['thisMonth', 'Bulan Ini'], ['lastMonth', 'Bulan Lalu'], ['thisYear', 'Tahun Ini']].map(([id, label]) =>
          `<option value="${id}" ${quick === id ? 'selected' : ''}>${label}</option>`).join('')}
      </select></label>
      <label>Dari<input class="control-select" name="from" type="date" value="${esc(from)}"></label>
      <label>Sampai<input class="control-select" name="to" type="date" value="${esc(to)}"></label>
      <button class="control-button" type="submit">Terapkan</button>
      <button class="control-button" type="button" data-reset-period>Semua Periode</button>
    </form>`;
  }

  function bindPeriod(form) {
    const from = form.elements.from, to = form.elements.to;
    const apply = (start, end) => {state.period = {from: start, to: end};renderPage()};
    form.elements.preset.addEventListener('change', event => {
      const range = periodRanges()[event.target.value];
      if (range) apply(...range);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      to.setCustomValidity(from.value && to.value && from.value > to.value ? 'Tanggal akhir harus sama atau setelah tanggal awal.' : '');
      if (form.reportValidity()) apply(from.value, to.value);
    });
    for (const field of [from, to]) field.addEventListener('input', () => to.setCustomValidity(''));
    form.querySelector('[data-reset-period]').addEventListener('click', () => apply('', ''));
  }

  function dashboard(root) {
    const rows = state.summary.filter(periodMatch).map(row => ({...row, health: dashboardHealth(row)}));
    const finance = can('KEUANGAN') || can('RAP');
    const open = rows.filter(active);
    const running = open.filter(p => p.status === 'JALAN');
    const progress = running.length
      ? running.reduce((total, p) => total + Number(p.project_progress || 0), 0) / running.length
      : null;
    const pending = rows.filter(p => p.status === 'PENDING').length;
    const completed = rows.filter(p => p.status === 'SELESAI').length;
    const other = rows.length - open.length - pending - completed;
    const statusCounts = `${open.length} Aktif · ${pending} Pending · ${completed} Selesai${other ? ' · ' + other + ' Lainnya' : ''}`;
    const contract = rows.reduce((total, p) => total + Number(p.contract_value || 0), 0);
    const budget = rows.reduce((total, p) => total + Number(p.total_rap || 0), 0);
    const spent = rows.reduce((total, p) => total + projectSpend(p), 0);
    const current = rows.find(p => p.project_id === chartProject) || open[0] || rows[0];
    chartProject = current?.project_id || '';
    root.innerHTML = `<div class="control-dashboard">
      <header class="control-head dashboard-head"><div><h1>Dashboard Kontrol Proyek</h1><p>${dateLabel.format(new Date())}</p></div>
        <div class="control-actions">
          <label class="control-search">${icon('search')}<input type="search" placeholder="Pencarian proyek" aria-label="Pencarian proyek"></label>
          ${can('PROJECTS', 'ADD') ? '<button type="button" class="control-button primary" onclick="openProjectForm()">+ Proyek Baru</button>' : ''}
          <button type="button" class="control-button" onclick="logout()">Keluar</button>
        </div>
      </header>
      ${periodControls()}
      <div class="control-kpis ${finance ? '' : 'control-kpis-compact'}">
        ${card('Total Proyek', `${rows.length} Proyek`, statusCounts, 'project')}
        ${finance ? card('Nilai Kontrak', currency(contract), 'Semua proyek dalam filter', 'document') : ''}
        ${card('Rata-rata Progress Fisik', progress === null ? '—' : percentage(progress), running.length
          ? `<progress max="100" value="${progress}" aria-label="Rata-rata progress fisik proyek berjalan"></progress>${running.length} proyek berjalan`
          : 'Belum ada proyek berjalan', 'activity')}
        ${finance ? card('Biaya Kumulatif', currency(spent), `/ ${currency(budget)} RAP · ${budget ? percentage(spent / budget * 100) : 'RAP belum tersedia'} · proyek dalam filter`, 'budget') : ''}
        ${card('Tenaga Kerja Aktif', '—', 'Penempatan di proyek aktif hari ini', 'users', 'control-worker-count')}
      </div>
      <div class="control-columns">
        <div class="control-stack">
          <section class="control-card"><header class="control-section-head"><h2>Kurva-S &amp; Kemajuan Proyek</h2>
            <select class="control-select" data-curve-project aria-label="Proyek Kurva-S" ${current ? '' : 'disabled'}><option value="" hidden>Pilih proyek</option>${options(rows)}</select>
          </header><div class="control-curve" aria-live="polite">${message(current ? 'Memuat Kurva-S…' : 'Belum ada proyek.')}</div></section>
          <section class="control-card control-project-list"><header class="control-section-head"><h2>Daftar Proyek Utama</h2>
            <button type="button" class="control-link" onclick="state.activeOnly=false;go('projects')">Lihat semua</button></header>
            <div class="control-table-wrap"><table class="control-table"><thead><tr><th>Nama Proyek</th><th>Lokasi</th>
              ${finance ? '<th class="control-number">Biaya Kumulatif</th><th class="control-number">Rasio Biaya</th><th class="control-number">RAP Terpakai</th>' : ''}<th class="control-number">Progress</th><th>Kondisi</th></tr></thead>
              <tbody>${tableRows(rows, finance)}</tbody></table></div>
          </section>
        </div>
        <aside class="control-stack" aria-label="Ringkasan lapangan">
          <section class="control-card"><h2>Cuaca Lapangan Hari Ini</h2><div data-panel="weather">${message('Memuat observasi…')}</div></section>
          <section class="control-card"><h2>Log &amp; Aktivitas Lapangan</h2><div data-panel="logs">${message('Memuat aktivitas…')}</div></section>
          <section class="control-card"><h2>Stok Material Kritis</h2><div data-panel="stocks">${message('Memuat stok…')}</div></section>
        </aside>
      </div>
      ${finance ? `<section class="control-card control-decisions" id="dashboard-decision-panel">
        <h2>Prioritas &amp; Tindakan</h2><div class="control-table-wrap"><table class="control-table">
        <thead><tr><th>Proyek</th><th>Prioritas</th><th>Masalah Utama</th><th>Tindakan</th></tr></thead>
        <tbody>${decisions(rows)}</tbody></table></div></section>` : ''}
      ${can('KEUANGAN') ? '<div class="control-finance-host" aria-label="Kinerja periode"></div>' : ''}
    </div>`;

    const view = root.querySelector('.control-dashboard');
    bindPeriod(view.querySelector('.control-period'));
    const search = view.querySelector('input[type=search]');
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('id-ID');
      const filtered = rows.filter(project => [project.project_name, project.project_code, project.location]
        .some(value => String(value || '').toLocaleLowerCase('id-ID').includes(query)));
      view.querySelector('.control-project-list tbody').innerHTML = tableRows(filtered, finance);
    });
    view.addEventListener('click', event => {
      const button = event.target.closest('[data-project]');
      if (button) openProject(button.dataset.project);
    });
    const select = view.querySelector('[data-curve-project]');
    select.value = chartProject;
    select.addEventListener('change', () => {
      chartProject = select.value;
      loadSite(view, rows.find(p => p.project_id === chartProject));
    });
    loadSite(view, current);
    loadWorkerCount(view.querySelector('#control-worker-count'), open.map(row => row.project_id));
  }

  async function rowsFor(table, configure = query => query) {
    const rows = [];
    const size = 500;
    for (let offset = 0; ; offset += size) {
      const {data, error} = await configure(sb.from(table).select('*')).order('id').range(offset, offset + size - 1);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < size) return rows;
    }
  }

  async function loadWorkerCount(box, projectIds) {
    if (!can('PROGRESS')) {
      box.title = 'Data penempatan memerlukan akses Progress.';
      return;
    }
    if (!projectIds.length) {
      box.textContent = '0 Orang';
      return;
    }
    box.title = 'Jumlah tenaga kerja dengan penempatan aktif hari ini.';
    try {
      const date = isoLocal().slice(0, 10);
      const ids = new Set(projectIds);
      const workers = await rowsFor('project_worker_assignments', query => {
        const started = query.lte('starts_on', date);
        return ids.size === 1 ? started.eq('project_id', projectIds[0]) : started;
      });
      const live = workers.filter(row => ids.has(row.project_id) && (!row.ends_on || row.ends_on >= date));
      box.textContent = `${new Set(live.map(row => row.worker_code.trim().toUpperCase())).size} Orang`;
    } catch {
      box.textContent = '—';
      box.title = 'Data penempatan tenaga kerja belum dapat dimuat.';
    }
  }

  function actualSeries(items, records, startDate) {
    const weights = new Map(items.map(item => [item.id, Number(item.weight)]));
    const totals = new Map(), points = new Map();
    let progress = 0;
    for (const row of [...records].sort((a, b) => a.progress_date.localeCompare(b.progress_date))) {
      const item = row.work_item_id, before = totals.get(item) || 0;
      const after = Math.min(1, before + Number(row.progress_percentage));
      totals.set(item, after);
      progress += (after - before) * (weights.get(item) || 0) * 100;
      points.set(row.progress_date, progress);
    }
    const series = Array.from(points, ([date, value]) => ({date, value}));
    if (series.length && startDate && startDate < series[0].date) series.unshift({date: startDate, value: 0});
    return series;
  }

  const calendarDay = 86400000;
  const dayNumber = date => Date.parse(date + 'T00:00:00Z') / calendarDay;

  function itemScheduleFields(prefix, item) {
    return `<div class="field"><label for="${prefix}_duration">Durasi Pekerjaan (hari)</label>
      <input id="${prefix}_duration" type="number" min="1" max="36500" step="1" value="${esc(item?.duration_days ?? '')}"></div>
      <div class="field"><label for="${prefix}_planned_start">Mulai Rencana (opsional)</label>
      <input id="${prefix}_planned_start" type="date" value="${esc(item?.planned_start_date ?? '')}">
      <small>Kosongkan untuk mengikuti urutan pekerjaan.</small></div>`;
  }

  function readItemSchedule(prefix, report = toast) {
    const duration = document.getElementById(prefix + '_duration')?.value;
    const start = document.getElementById(prefix + '_planned_start')?.value;
    const days = duration ? Number(duration) : null;
    if ((days !== null && (!Number.isInteger(days) || days < 1 || days > 36500)) || (start && !days)) {
      report('Isi durasi dalam hari bulat (1–36.500). Tanggal mulai rencana memerlukan durasi.');
      return null;
    }
    return {duration_days: days, planned_start_date: start || null};
  }

  function weeklyTarget(project, items) {
    const start = dayNumber(project.start_date);
    if (!Number.isFinite(start)) {
      return {points: [], note: 'Lengkapi tanggal mulai proyek untuk menghitung target otomatis.'};
    }
    const weighted = items.map(item => ({...item, weight: Number(item.weight)}));
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    if (weighted.some(item => !Number.isFinite(item.weight) || item.weight < 0 || item.weight > 1) ||
        Math.abs(total - 1) > 0.0001) {
      return {points: [], note: 'Total bobot item pekerjaan harus 100% untuk menghitung target otomatis.'};
    }
    const planned = weighted.filter(item => item.weight > 0).sort((a, b) =>
      Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.id).localeCompare(String(b.id)));
    if (planned.some(item => !Number.isInteger(Number(item.duration_days)) || Number(item.duration_days) < 1)) {
      return {points: [], note: 'Isi durasi semua item berbobot untuk menghitung target otomatis.'};
    }
    let next = start;
    const schedule = [];
    for (const item of planned) {
      const begin = item.planned_start_date ? dayNumber(item.planned_start_date) : next;
      if (!Number.isFinite(begin) || begin < start) {
        return {points: [], note: 'Tanggal mulai rencana item harus pada atau setelah tanggal mulai proyek.'};
      }
      const duration = Number(item.duration_days);
      const finish = begin + duration - 1;
      schedule.push({begin, finish, duration, weight: item.weight});
      next = Math.max(next, finish + 1);
    }
    const finish = next - 1;
    const baseline = start - 1;
    const dates = new Set([baseline, finish]);
    for (let date = baseline + 7; date < finish; date += 7) dates.add(date);
    for (const item of schedule) {
      dates.add(item.begin - 1);
      dates.add(item.finish);
    }
    const points = [...dates].sort((a, b) => a - b).map(date => ({
      date: new Date(date * calendarDay).toISOString().slice(0, 10),
      value: date === finish ? 100 : schedule.reduce((sum, item) =>
        sum + item.weight * Math.min(1, Math.max(0, (date - item.begin + 1) / item.duration)), 0) / total * 100
    }));
    const deadline = dayNumber(project.end_date);
    const note = Number.isFinite(deadline) && finish > deadline
      ? `Jadwal item melampaui estimasi selesai proyek sebanyak ${finish - deadline} hari.` : '';
    return {points, note};
  }

  function drawCurve(target, actual, targetLabel) {
    const all = [...target, ...actual];
    if (!all.length) return message('Belum ada target atau catatan progress untuk proyek ini.');
    const time = date => Date.parse(date + 'T00:00:00Z');
    const start = all.reduce((first, point) => Math.min(first, time(point.date)), Infinity);
    const end = all.reduce((last, point) => Math.max(last, time(point.date)), -Infinity);
    const x = date => 55 + (end === start ? 315 : (time(date) - start) / (end - start) * 635);
    const y = value => 222 - Math.max(0, Math.min(value, 100)) * 1.96;
    const points = series => series.map(p => `${x(p.date)},${y(p.value)}`).join(' ');
    const area = (series, kind) => series.length > 1
      ? `<polygon class="control-area ${kind}" points="${x(series[0].date)},${y(0)} ${points(series)} ${x(series.at(-1).date)},${y(0)}"/>`
      : '';
    const draw = (series, kind) => `${series.length > 1 ? `<polyline class="control-line ${kind}" points="${points(series)}"/>` : ''}${
      series.map(p => `<circle class="control-dot ${kind}" cx="${x(p.date)}" cy="${y(p.value)}" r="3"><title>${esc(p.date)} · ${percentage(p.value)}</title></circle>`).join('')}`;
    const ticks = end === start ? [start] : Array.from({length: 5}, (_, i) => start + (end - start) * i / 4);
    const tickFormat = new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'short', timeZone: 'UTC'});
    return `<div class="control-legend"><span class="target">${targetLabel}${target.length ? ' · ' + percentage(target.at(-1).value) : ' · belum ada data'}</span>
      <span class="actual">Realisasi${actual.length ? ' · ' + percentage(actual.at(-1).value) : ' · belum ada data'}</span></div>
      <svg class="control-chart" viewBox="0 0 730 255" role="img" aria-label="Grafik area progress kumulatif target dan realisasi">
        ${[0, 20, 40, 60, 80, 100].map(value => `<line x1="55" x2="690" y1="${y(value)}" y2="${y(value)}"/><text x="44" y="${y(value) + 4}" text-anchor="end">${value}%</text>`).join('')}
        ${ticks.map(t => `<text x="${x(new Date(t).toISOString().slice(0, 10))}" y="246" text-anchor="middle">${tickFormat.format(t)}</text>`).join('')}
        ${area(target, 'target')}${area(actual, 'actual')}
        ${draw(target, 'target')}${draw(actual, 'actual')}
      </svg>`;
  }

  function readProjectRows(table, id) {
    return rowsFor(table, query => query.eq('project_id', id));
  }

  function curveFromWorkItems(project, items, records) {
    const target = items ? weeklyTarget(project, items) : null;
    const actual = items && records ? actualSeries(items, records, project.start_date) : [];
    const warning = !items || !records ? message('Sebagian data Kurva-S belum dapat dimuat.') : '';
    const note = target?.note ? message(target.note) : '';
    return warning + note + drawCurve(target?.points || [], actual, 'Target Otomatis');
  }

  async function projectCurve(project) {
    const [items, records] = await Promise.allSettled(
      ['project_work_items', 'progress_records'].map(table => readProjectRows(table, project.project_id))
    );
    return curveFromWorkItems(project, items.value, records.value);
  }

  function mountProjectTables(root, config, id, onChange) {
    for (const [table, definition] of Object.entries(config.tables)) {
      const section = document.createElement('section');
      section.className = 'control-card';
      root.append(section);
      mountTable(section, table, definition, id, config.permission, onChange && (() => onChange(table)));
    }
  }

  const projectTabs = {materials: modules.materials.title, resources: modules.resources.title};
  function mountProjectTab(root, tab, project, refreshWorkers) {
    if (!can('PROGRESS')) {
      root.innerHTML = message('Akses ke tab ini belum diberikan.');
      return;
    }
    root.classList.add('control-module-tables');
    root.classList.toggle('control-panel-pair', tab === 'resources');
    mountProjectTables(root, modules[tab], project.id, table => {
      if (table === 'project_worker_assignments') refreshWorkers?.();
    });
  }

  async function loadSite(view, project) {
    const chart = view.querySelector('.control-curve');
    const panel = key => view.querySelector(`[data-panel="${key}"]`);
    const id = project?.project_id;
    if (!id) {
      for (const key of ['weather', 'logs', 'stocks']) panel(key).innerHTML = message('Pilih proyek untuk melihat data lapangan.');
      return;
    }
    const selection = Symbol();
    view.controlSelection = selection;
    chart.innerHTML = message('Memuat Kurva-S…');
    for (const key of ['weather', 'logs', 'stocks']) panel(key).innerHTML = message('Memuat data lapangan…');
    const valid = () => view.isConnected && view.controlSelection === selection;
    const read = table => rowsFor(table, query => query.eq('project_id', id));
    const latest = async (table, date, limit) => {
      const {data, error} = await sb.from(table).select('*').eq('project_id', id).lte(date, new Date().toISOString()).order(date, {ascending: false}).order('id').limit(limit);
      if (error) throw new Error(error.message);
      return data;
    };
    const render = async (element, task, build, errorText) => {
      try {
        const data = await task;
        if (valid()) element.innerHTML = build(data);
      } catch {
        if (valid()) element.innerHTML = message(errorText);
      }
    };
    if (!can('PROGRESS')) {
      for (const key of ['weather', 'logs', 'stocks']) panel(key).innerHTML = message('Data lapangan memerlukan akses Progress.');
      chart.innerHTML = message('Kurva-S memerlukan akses Progress.');
      return;
    }
    await Promise.all([
      render(chart, projectCurve(project), html => html, 'Kurva-S belum dapat dimuat.'),
      render(panel('weather'), latest('project_weather_observations', 'observed_at', 1), observations => {
        const row = observations.find(value => isoLocal(new Date(value.observed_at)).slice(0, 10) === isoLocal().slice(0, 10));
        return row ? `<p>${esc(project.location || project.project_name)} · ${esc(row.condition)}
          ${row.temperature_c == null ? '' : ' · ' + number.format(row.temperature_c) + '°C'}</p>
          ${message('Observasi ' + timeLabel.format(new Date(row.observed_at)))}` : message('Belum ada observasi cuaca hari ini.');
      }, 'Observasi cuaca belum dapat dimuat.'),
      render(panel('logs'), latest('project_field_logs', 'logged_at', 4), logs => logs.length ?
        `<ul class="control-timeline">${logs.map(row => `<li>${esc(row.description)}<small>${timeLabel.format(new Date(row.logged_at))}</small></li>`).join('')}</ul>` :
        message('Belum ada aktivitas lapangan.'), 'Log lapangan belum dapat dimuat.'),
      render(panel('stocks'), read('project_material_stocks'), stocks => {
        const critical = stocks.filter(row => Number(row.quantity) <= Number(row.minimum_quantity))
          .sort((a, b) => a.quantity / (a.minimum_quantity || 1) - b.quantity / (b.minimum_quantity || 1));
        if (!stocks.length) return message('Belum ada data stok material.');
        if (!critical.length) return message('Tidak ada stok pada atau di bawah ambang minimum.');
        return `<ul class="control-stocks">${critical.slice(0, 3).map(row => {
          const ratio = Number(row.minimum_quantity) > 0 ? row.quantity / row.minimum_quantity * 100 : 0;
          return `<li><span class="control-ring" style="--stock:${ratio}%">${percentage(ratio)}</span><strong>${esc(row.name)}</strong>
            <small>${number.format(row.quantity)} / ${number.format(row.minimum_quantity)} ${esc(row.unit)}</small></li>`;
        }).join('')}</ul>`;
      }, 'Stok material belum dapat dimuat.')
    ]);
  }

  function fieldHTML(field, row) {
    const [key, label, type, min, max, optional] = field;
    let value = row?.[key] ?? '';
    if (type === 'boolean') {
      return `<label>${label}<select name="${key}"><option value="true">Aktif</option>
        <option value="false" ${value === false ? 'selected' : ''}>Nonaktif</option></select></label>`;
    }
    if (value && type === 'datetime-local') value = isoLocal(new Date(value));
    return `<label>${label}<input name="${key}" type="${type}" value="${esc(value)}" ${optional ? '' : 'required'}
      ${type === 'number' ? 'step="0.01"' : ''} ${min == null ? '' : `min="${min}"`} ${max == null ? '' : `max="${max}"`}></label>`;
  }

  function cell(field, value) {
    if (value == null || value === '') return '—';
    if (field[2] === 'boolean') return value ? 'Aktif' : 'Nonaktif';
    if (field[2] === 'number') return number.format(value);
    if (field[2] === 'datetime-local') return timeLabel.format(new Date(value));
    if (field[2] === 'url' && /^https:\/\/[^\s]+$/i.test(value)) {
      return `<a href="${esc(value)}" target="_blank" rel="noopener noreferrer">Buka dokumen</a>`;
    }
    return esc(value);
  }

  function catalogSelect(catalog, choices, editing) {
    const current = editing?.[catalog.reference];
    const currentListed = choices.some(row => row.id === current);
    const placeholder = editing && !current ? 'Pertahankan catatan lama' : 'Pilih ' + catalog.title.toLowerCase();
    return `<label>${catalog.title}<select name="${catalog.reference}" ${editing && !current ? '' : 'required'}>
      <option value="">${placeholder}</option>
      ${current && !currentListed ? `<option value="${esc(current)}" selected>${esc(Object.keys(catalog.snapshot).map(key => editing[key]).join(' — '))} (nonaktif)</option>` : ''}
      ${choices.map(row => `<option value="${esc(row.id)}" ${row.id === current ? 'selected' : ''}>${esc(row.code)} — ${esc(row.name)}${row.unit ? ' (' + esc(row.unit) + ')' : ''}</option>`).join('')}
    </select></label>`;
  }

  async function mountTable(section, table, definition, id, permission, onChange) {
    const [title, sort, ...fields] = definition;
    const catalog = assignmentCatalog[table];
    const editFields = catalog ? fields.filter(([name]) => !Object.hasOwn(catalog.snapshot, name)) : fields;
    const scope = query => id === null ? query : query.eq('project_id', id);
    const assignment = table === 'project_worker_assignments' || table === 'project_equipment_assignments';
    const transferHelp = 'Untuk pindah proyek, isi tanggal Selesai pada penempatan lama. Mulai di proyek baru paling cepat sehari setelahnya.';
    const inModal = id === null;
    const render = async (editing = null, openEditor = false) => {
      section.innerHTML = `<h2>${title}</h2>${message('Memuat data…')}`;
      let rows, choices;
      try {
        [rows, choices] = await Promise.all([
          rowsFor(table, query => scope(query).order(sort)),
          catalog ? rowsFor(catalog.table, query => query.eq('is_active', true).order('code')) : []
        ]);
      } catch {
        section.innerHTML = `<h2>${title}</h2>${message('Data belum dapat dimuat. Periksa akses dan migrasi database versi uji.')}`;
        return;
      }
      const write = editing ? 'EDIT' : 'ADD';
      const editor = `<form class="control-form" ${can(permission, write) ? '' : 'hidden'}>${catalog ? catalogSelect(catalog, choices, editing) : ''}${editFields.map(field => fieldHTML(field, editing)).join('')}
        <div class="control-form-actions">${inModal ? '<button type="button" class="btn ghost" data-cancel>Batal</button>' : ''}<button class="${inModal ? 'btn' : 'control-button'} primary" data-rbac-module="${permission}" data-rbac-action="${write}">${inModal ? 'Simpan' : editing ? 'Simpan Perubahan' : 'Tambah'}</button>
        ${editing && !inModal ? '<button type="button" class="control-button" data-cancel>Batal</button>' : ''}</div>
        <p class="control-form-message" role="status"></p></form>`;
      const heading = inModal
        ? `<div class="md-card-head"><h2>${title}</h2><button type="button" class="btn primary" data-catalog-add
          ${can(permission, 'ADD') ? '' : 'hidden'} data-rbac-module="${permission}" data-rbac-action="ADD">+ Tambah</button></div>`
        : `<h2>${title}</h2>`;
      section.innerHTML = heading + (inModal
        ? `<dialog class="sk-compact-editor sk-catalog-editor" aria-labelledby="catalog-editor-title">
            <div class="modalhead"><h3 id="catalog-editor-title">${editing ? 'Edit' : 'Tambah'} ${title}</h3>
            <button type="button" class="btn ghost" data-catalog-close>Tutup</button></div>${editor}</dialog>
            <p class="control-form-message" data-table-status role="status"></p>`
        : editor) + (assignment ? message(transferHelp) : '') + `<div class="control-table-wrap"><table class="control-table"><thead><tr>${fields.map(field => `<th class="${field[2] === 'number' ? 'control-number' : ''}">${field[1]}</th>`).join('')}<th>Aksi</th></tr></thead>
          <tbody>${rows.map((row, i) => `<tr>${fields.map(field => `<td class="${field[2] === 'number' ? 'control-number' : ''}">${cell(field, row[field[0]])}</td>`).join('')}
            <td class="control-row-actions"><button class="control-link" ${can(permission, 'EDIT') ? '' : 'hidden'} data-edit="${i}" data-rbac-module="${permission}" data-rbac-action="EDIT">Edit</button>
              <button class="control-link" ${can(permission, 'DELETE') ? '' : 'hidden'} data-delete="${i}" data-rbac-module="${permission}" data-rbac-action="DELETE">Hapus</button></td></tr>`).join('') ||
              `<tr><td colspan="${fields.length + 1}">Belum ada data.</td></tr>`}</tbody></table></div>`;
      const form = section.querySelector('form');
      const status = form.querySelector('[role=status]');
      const submit = form.querySelector('button.primary');
      if (catalog && !editing && !choices.length) {
        submit.disabled = true;
        status.textContent = 'Tambahkan ' + catalog.title.toLowerCase() + ' aktif di Master Data.';
      }
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (submit.disabled) return;
        const data = new FormData(form);
        const payload = {};
        for (const [key, label, type, , , optional] of editFields) {
          const input = data.get(key).trim();
          if ((!input && !optional) || (type === 'url' && !/^https:\/\/[^\s]+$/i.test(input))) {
            status.textContent = `Periksa kembali ${label}.`;
            return;
          }
          payload[key] = !input ? null : type === 'number' ? Number(input) :
            type === 'datetime-local' ? new Date(input).toISOString() : type === 'boolean' ? input === 'true' : input;
        }
        if (assignment && payload.ends_on && payload.ends_on < payload.starts_on) {
          status.textContent = 'Tanggal Selesai harus sama dengan atau setelah tanggal Mulai.';
          return;
        }
        if (catalog) {
          const reference = data.get(catalog.reference);
          const selected = choices.find(row => row.id === reference);
          if (selected) {
            payload[catalog.reference] = selected.id;
            for (const [field, source] of Object.entries(catalog.snapshot)) {
              payload[field] = selected[source];
            }
          } else if (!editing || reference !== (editing[catalog.reference] || '')) {
            status.textContent = 'Pilih ' + catalog.title.toLowerCase() + ' aktif.';
            return;
          }
        }
        submit.disabled = true;
        try {
          const request = editing ? scope(sb.from(table).update(payload).eq('id', editing.id)) :
            sb.from(table).insert(id === null ? payload : {...payload, project_id: id});
          const {data: saved, error} = await request.select('id').maybeSingle();
          if (assignment && (error?.code === '23P01' || error?.code === '23505')) {
            throw new Error('Tanggal penempatan berbenturan dengan penempatan yang sudah tercatat. ' + transferHelp);
          }
          if (error || !saved) throw new Error(error?.message || 'Perubahan tidak tersimpan. Periksa hak akses.');
          await render();
          onChange?.();
        } catch (error) {
          status.textContent = error.message;
        } finally {
          submit.disabled = false;
        }
      });
      const dialog = section.querySelector('dialog');
      const add = section.querySelector('[data-catalog-add]');
      add?.addEventListener('click', () => editing ? render(null, true) : dialog.showModal());
      dialog?.addEventListener('close', () => {
        form.reset();
        status.textContent = '';
      });
      section.querySelector('[data-catalog-close]')?.addEventListener('click', () => dialog.close());
      section.querySelector('[data-cancel]')?.addEventListener('click', () => dialog ? dialog.close() : render());
      if (dialog && openEditor && section.isConnected && !form.hidden) dialog.showModal();
      section.querySelectorAll('[data-edit]').forEach(button =>
        button.addEventListener('click', () => render(rows[Number(button.dataset.edit)], inModal)));
      section.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
        if (!global.confirm('Hapus catatan ini?')) return;
        button.disabled = true;
        try {
          const row = rows[Number(button.dataset.delete)];
          const {data: removed, error} = await scope(sb.from(table).delete().eq('id', row.id)).select('id').maybeSingle();
          if (error || !removed) throw new Error(error?.message || 'Catatan tidak terhapus. Periksa hak akses.');
          await render();
          onChange?.();
        } catch (error) {
          (section.querySelector('[data-table-status]') || status).textContent = error.message;
        } finally {
          button.disabled = false;
        }
      }));
      global.applyRBACNav?.();
    };
    await render();
  }

  function showModule(root, page) {
    if (page === 'budget') {
      root.innerHTML = `<div class="control-module"><header class="control-head"><div><h1>Anggaran &amp; Biaya</h1>
        <p>Kelola anggaran dan arus kas proyek melalui modul SiKoyek.</p></div></header>
        <div class="control-card control-budget-actions">
          ${can('RAP') ? '<a class="control-button" href="./rap.html">Buka RAP</a>' : ''}
          ${can('KEUANGAN') ? '<a class="control-button" href="./keuangan.html">Buka Keuangan Proyek</a>' : ''}
          ${can('RAP') || can('KEUANGAN') ? '' : message('Akses ke menu ini belum diberikan.')}
        </div></div>`;
      return;
    }
    const config = modules[page], projects = state.summary;
    if (!can(config.permission)) {
      root.innerHTML = message('Akses ke menu ini belum diberikan.');
      return;
    }
    root.innerHTML = `<div class="control-module"><header class="control-head"><div><h1>${config.title}</h1>
      <p>Pilih proyek untuk melihat dan mengelola data.</p></div>
      ${page === 'reports' ? '<button type="button" class="control-button" data-open-report>Buka Laporan SiKoyek</button>' : ''}</header>
      <label class="control-project-select">Proyek <select class="control-select" ${projects.length ? '' : 'disabled'}>
        <option value="" hidden>Pilih proyek</option>${options(projects)}</select></label>
      <div class="control-module-tables"></div></div>`;
    root.querySelector('[data-open-report]')?.addEventListener('click', () => go('laporan'));
    const select = root.querySelector('select'), tables = root.querySelector('.control-module-tables');
    tables.classList.toggle('control-panel-pair', page === 'field');
    select.value = projects.some(row => row.project_id === chartProject) ? chartProject : projects[0]?.project_id || '';
    const load = () => {
      tables.replaceChildren();
      if (!select.value) {
        tables.innerHTML = message('Belum ada proyek.');
        return;
      }
      chartProject = select.value;
      mountProjectTables(tables, config, select.value);
    };
    select.addEventListener('change', load);
    load();
  }

  global.SiKoyekControl = {
    nav, toggleMenu, dashboard, module: showModule, isModule: page => page === 'budget' || Object.hasOwn(modules, page),
    setIdentity, projectTabs, mountProjectTab, mountCatalog, loadWorkerCount, curveFromWorkItems,
    itemScheduleFields, readItemSchedule,
    canFinance: () => can('KEUANGAN'), canProgress: () => can('PROGRESS')
  };
})(window);
