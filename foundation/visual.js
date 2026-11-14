(function () {
  'use strict';

  const tableScope = '.content table, .main table, .wrap table, #modal table';
  const overflowWrappers = '.scroll, .tablewrap, .table-wrap, .control-table-wrap, .um-tablewrap, .md-table-wrap, .sk-table-region';
  const numericHeader = /^(?:no\.?|bobot(?:\s|$)|volume(?:\s|$)|progress(?:\s|$)|progres(?:\s|$)|target(?:\s|$)|realisasi(?:\s|$)|rasio(?:\s|$)|selisih(?:\s|$)|kontrak(?:\s|$)|nilai(?:\s|$)|biaya(?:\s|$)|anggaran(?:\s|$)|jumlah(?:\s|$)|total(?:\s|$)|sisa(?:\s|$)|saldo(?:\s|$)|stok minimum(?:\s|$)|persentase(?:\s|$)|suhu(?:\s|$)|rap(?:\s|$)|cash (?:in|out)|net cash|kas (?:masuk|keluar)|arus kas(?:\s|$)|cost ratio)/i;
  let nextNavId = 0;

  function prepareSidebar(sidebar) {
    if (sidebar.classList.contains('sk-side-ready')) return;
    let nav = sidebar.querySelector('.nav');
    if (!nav && sidebar.matches('.side') && sidebar.querySelector(':scope > button')) {
      nav = document.createElement('div');
      nav.className = 'sk-side-links';
      const buttons = [...sidebar.querySelectorAll(':scope > button')];
      buttons[0].before(nav);
      nav.append(...buttons);
    }
    if (!nav) return;
    if (!nav.id) nav.id = 'sk-module-nav-' + ++nextNavId;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sk-side-toggle';
    toggle.textContent = '☰ Menu';
    toggle.setAttribute('aria-controls', nav.id);
    const setOpen = open => {
      sidebar.classList.toggle('sk-side-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    setOpen(false);
    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('sk-side-open')));
    sidebar.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !sidebar.classList.contains('sk-side-open')) return;
      setOpen(false);
      toggle.focus();
    });
    sidebar.append(toggle);
    sidebar.classList.add('sk-side-ready');
  }

  function prepareTable(table) {
    let wrap = table.parentElement;
    if (!wrap.matches(overflowWrappers)) {
      const region = document.createElement('div');
      region.className = 'sk-table-region';
      table.before(region);
      region.append(table);
      wrap = region;
    }
    wrap.classList.add('sk-table-region');
    const headers = table.tHead?.rows;
    const heading = headers?.[headers.length - 1];
    if (!heading || [...heading.cells].some(cell => cell.colSpan !== 1)) return;
    const labels = [...heading.cells].map(cell => cell.textContent.trim().replace(/\s+/g, ' '));
    const numbers = labels.map(label => numericHeader.test(label));
    const actions = labels.map(label => /^(aksi|tindakan)$/i.test(label));
    for (const row of table.rows) {
      if (row.cells.length !== labels.length || [...row.cells].some(cell => cell.colSpan !== 1)) continue;
      [...row.cells].forEach((cell, index) => {
        cell.classList.toggle('sk-table-number', numbers[index]);
        cell.classList.toggle('sk-table-actions', actions[index]);
      });
    }
  }

  function prepare(records = []) {
    document.querySelectorAll('.shell > :is(.sidebar, .side):not(.control-sidebar)').forEach(prepareSidebar);
    const tables = new Set();
    if (!records.length) document.querySelectorAll(tableScope).forEach(table => tables.add(table));
    for (const record of records) {
      const parentTable = record.target.closest?.(tableScope);
      if (parentTable) tables.add(parentTable);
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches(tableScope)) tables.add(node);
        node.querySelectorAll(tableScope).forEach(table => tables.add(table));
      }
    }
    tables.forEach(table => { if (table.isConnected) prepareTable(table); });
  }

  prepare();
  const observer = new window.SiKoyekFoundation.Observer(prepare);
  observer.observe(document.body, {childList: true, subtree: true});
})();
