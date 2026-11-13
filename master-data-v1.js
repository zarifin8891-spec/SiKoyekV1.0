(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>sb, q=id=>document.getElementById(id);
  const defs={
    project:{table:'project_categories',title:'Kategori Proyek',desc:'Pilihan kategori saat membuat proyek.',id:'md-project-cats'},
    finance:{table:'transaction_categories',title:'Kategori Keuangan',desc:'Kategori transaksi keuangan.',id:'md-finance-cats'},
    payment:{table:'payment_methods',title:'Metode Pembayaran',desc:'Metode pembayaran transaksi.',id:'md-payment-methods'}
  };
  async function list(table){const {data,error}=await db().from(table).select('id,name,sort_order,is_active').order('sort_order').order('name');if(error)throw error;return data||[]}
  async function managers(){const {data,error}=await db().from('project_managers').select('id,name,code,phone,email,sort_order,is_active').order('sort_order').order('name');if(error)throw error;return data||[]}
  function navButton(){const nav=document.querySelector('.sidebar .nav');if(!nav||nav.querySelector('[data-master-data-nav]'))return;const b=document.createElement('button');b.type='button';b.dataset.masterDataNav='1';b.textContent='Master Data';b.onclick=openMasterData;nav.appendChild(b)}
  function cleanProjectCategoryControl(){document.querySelectorAll('.category-tools,.step1-category-tools,[data-p6-cat-master]').forEach(x=>(x.closest?.('.category-tools,.step1-category-tools')||x).remove())}
  const mdCard=(cls,title,desc,fn)=>`<section class="card md-card"><div class="md-card-head"><div><h2>${title}</h2><p>${desc}</p></div><button class="btn primary" type="button" onclick="${fn}">+ Tambah</button></div><div id="${cls}" class="md-table-wrap"><div class="empty">Memuat...</div></div></section>`;
  function masterHTML() {
    const pages = [
      ['project', defs.project.title, mdCard('md-project-cats', defs.project.title, defs.project.desc, 'mdAddProjectCategory()')],
      ['manager', 'Project Manager', mdCard('md-managers', 'Project Manager', 'Daftar Project Manager.', 'mdAddManager()')],
      ['finance', defs.finance.title, mdCard('md-finance-cats', defs.finance.title, defs.finance.desc, 'mdAddFinanceCategory()')],
      ['payment', defs.payment.title, mdCard('md-payment-methods', defs.payment.title, defs.payment.desc, 'mdAddPaymentMethod()')],
      ['employees', 'Karyawan', '<section class="control-card" data-master-catalog="employees"></section>'],
      ['equipment', 'Alat', '<section class="control-card" data-master-catalog="equipment"></section>'],
      ['goods', 'Barang', '<section class="control-card" data-master-catalog="goods"></section>']
    ];
    return `<div class="md-page"><div class="md-top"><div><h1>Master Data</h1><p>Kelola referensi proyek, keuangan, karyawan, dan alat.</p></div>
      <button class="btn ghost" type="button" onclick="go('projects')">← Kembali ke Project</button></div>
      <div class="tabs md-tabs" aria-label="Master Data">${pages.map(([key, title], i) =>
        `<button type="button" data-master-tab="${key}" aria-pressed="${i === 0}" class="${i === 0 ? 'active' : ''}">${title}</button>`).join('')}</div>
      ${pages.map(([key, , html], i) => `<div data-master-panel="${key}" ${i === 0 ? '' : 'hidden'}>${html}</div>`).join('')}</div>`;
  }

  function bindMasterTabs(page) {
    page.querySelector('.md-tabs').addEventListener('click', event => {
      const button = event.target.closest('[data-master-tab]');
      if (!button || button.classList.contains('active')) return;
      const key = button.dataset.masterTab;
      page.querySelectorAll('[data-master-tab]').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      page.querySelectorAll('[data-master-panel]').forEach(panel => {
        panel.hidden = panel.dataset.masterPanel !== key;
      });
      const catalog = page.querySelector(`[data-master-catalog="${key}"]`);
      if (catalog) window.SiKoyekControl.mountCatalog(catalog, key);
    });
  }

  function renderMasterTable(id, rows, columns, edit, remove) {
    const host = q(id);
    if (!host) return;
    if (!rows.length) {
      host.innerHTML = '<div class="empty">Belum ada data.</div>';
      return;
    }
    host.innerHTML = `<table class="md-kavio-table"><thead><tr>${columns.map(([label]) => `<th>${label}</th>`).join('')}
      <th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.map((row, index) => `<tr>
      ${columns.map(([, value]) => `<td>${esc(value(row))}</td>`).join('')}
      <td><span class="md-status ${row.is_active ? 'on' : 'off'}">${row.is_active ? 'AKTIF' : 'NONAKTIF'}</span></td>
      <td><div class="md-actions">
        <button type="button" class="btn ghost" data-md-edit="${index}" data-rbac-module="MASTER_DATA" data-rbac-action="EDIT">Edit</button>
        <button type="button" class="btn danger" data-md-delete="${index}" data-rbac-module="MASTER_DATA" data-rbac-action="DELETE">Hapus</button>
      </div></td></tr>`).join('')}</tbody></table>`;
    host.querySelectorAll('[data-md-edit]').forEach(button =>
      button.addEventListener('click', () => window[edit](rows[Number(button.dataset.mdEdit)].id)));
    host.querySelectorAll('[data-md-delete]').forEach(button => button.addEventListener('click', () => {
      const row = rows[Number(button.dataset.mdDelete)];
      window[remove](row.id, row.name);
    }));
  }

  const orderColumn = ['Urutan', row => Number(row.sort_order || 0)];
  const nameColumn = ['Nama', row => row.name];
  function renderList(id, rows, edit, remove) {
    renderMasterTable(id, rows, [orderColumn, nameColumn], edit, remove);
  }

  function renderManagerList(rows, edit, remove) {
    renderMasterTable('md-managers', rows, [orderColumn, ['Kode', row => row.code || '—'], nameColumn], edit, remove);
  }
  async function refresh(){try{const [pc,pm,fc,pay]=await Promise.all([list('project_categories'),managers(),list('transaction_categories'),list('payment_methods')]);renderList('md-project-cats',pc,'mdEditProjectCategory','mdDeleteProjectCategory');renderManagerList(pm,'mdEditManager','mdDeleteManager');renderList('md-finance-cats',fc,'mdEditFinanceCategory','mdDeleteFinanceCategory');renderList('md-payment-methods',pay,'mdEditPaymentMethod','mdDeletePaymentMethod')}catch(e){toast(e?.message||'Gagal memuat Master Data')}}
  function openMasterData(){state.page='master-data';state.selected=null;state.detail=null;const page=q('page');if(page){page.innerHTML=masterHTML();bindMasterTabs(page);refresh()}document.querySelectorAll('.sidebar .nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-master-data-nav]')?.classList.add('active');cleanProjectCategoryControl()}
  window.openMasterData=openMasterData;
  let masterEditor;
  function closeMasterEditor(){ masterEditor?.close(); }
  function openMasterEditor(title, fields, save){
    closeMasterEditor();
    const dialog=document.createElement('dialog');
    dialog.className='sk-compact-editor sk-catalog-editor';
    dialog.setAttribute('aria-labelledby','md-editor-title');
    dialog.innerHTML=`<div class="modalhead"><h3 id="md-editor-title">${esc(title)}</h3><button type="button" class="btn ghost" data-dismiss>Tutup</button></div>
      <form class="control-form sk-editor-stacked">
        <div class="sk-editor-fields">${fields}</div>
        <div class="control-form-actions"><button type="button" class="btn ghost" data-dismiss>Batal</button><button type="submit" class="btn primary">Simpan</button></div>
      </form>`;
    const submit=dialog.querySelector('[type=submit]');
    dialog.querySelectorAll('[data-dismiss]').forEach(button=>button.addEventListener('click',()=>{if(!submit.disabled)dialog.close();}));
    dialog.addEventListener('cancel',event=>{if(submit.disabled)event.preventDefault();});
    dialog.addEventListener('close',()=>{
      if(masterEditor===dialog)masterEditor=null;
      dialog.remove();
    });
    dialog.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();
      if(submit.disabled)return;
      submit.disabled=true;
      try { await save(); }
      catch(error){ toast(error?.message||'Gagal menyimpan data'); }
      finally { submit.disabled=false; }
    });
    masterEditor=dialog;
    document.body.append(dialog);
    dialog.showModal();
  }
  function masterField(id,label,value='',type='text',placeholder=''){
    return `<label class="sk-editor-field" for="${id}">${label}<input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
  }
  function categoryFields(label,data,placeholder){
    return masterField('md_name',label,data?.name,'text',placeholder)
      +masterField('md_sort','Urutan',data?Number(data.sort_order||0):1,'number');
  }
  function managerFields(data){
    return masterField('md_pm_code','Kode *',data?.code,'text','PM-001')
      +masterField('md_pm_name','Nama *',data?.name)
      +masterField('md_pm_phone','No. Telepon',data?.phone,'tel')
      +masterField('md_pm_email','Email',data?.email,'email')
      +masterField('md_pm_sort','Urutan',data?Number(data.sort_order||0):1,'number');
  }
  window.mdAddProjectCategory=()=>openMasterEditor('Tambah Kategori Proyek',categoryFields('Nama Kategori *'),window.mdSaveProjectCategory);
  window.mdSaveProjectCategory=async function(){const name=q('md_name')?.value.trim(),sort=Number(q('md_sort')?.value||0);if(!name){toast('Nama kategori wajib diisi');return}const {error}=await db().from('project_categories').insert({name,sort_order:sort,is_active:true});if(error){toast(error.message);return}closeMasterEditor();toast('Kategori proyek ditambahkan');refresh()};
  window.mdEditProjectCategory=async function(id){const {data,error}=await db().from('project_categories').select('*').eq('id',id).single();if(error){toast(error.message);return}openMasterEditor('Edit Kategori Proyek',categoryFields('Nama Kategori *',data),()=>window.mdSaveProjectCategoryEdit(id));};
  window.mdSaveProjectCategoryEdit=async function(id){const name=q('md_name')?.value.trim(),sort=Number(q('md_sort')?.value||0);if(!name){toast('Nama kategori wajib diisi');return}const {error}=await db().from('project_categories').update({name,sort_order:sort,updated_at:new Date().toISOString()}).eq('id',id);if(error){toast(error.message);return}closeMasterEditor();refresh()};
  window.mdDeleteProjectCategory=function(id,name){modal('Hapus Kategori Proyek',`<p>Yakin menghapus <strong>${esc(name)}</strong>?</p><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn danger" onclick="mdConfirmDeleteProjectCategory('${id}')">Hapus Data</button></div>`)};
  window.mdConfirmDeleteProjectCategory=async function(id){const {error}=await db().from('project_categories').delete().eq('id',id);if(error){toast(error.message);return}closeModal();refresh()};
  window.mdAddManager=()=>openMasterEditor('Tambah Project Manager',managerFields(),window.mdSaveManager);
  window.mdSaveManager=async function(){const row={name:q('md_pm_name')?.value.trim(),code:q('md_pm_code')?.value.trim(),phone:q('md_pm_phone')?.value.trim()||null,email:q('md_pm_email')?.value.trim()||null,sort_order:Number(q('md_pm_sort')?.value||0),is_active:true};if(!row.name||!row.code){toast('Nama dan kode wajib diisi');return}const {error}=await db().from('project_managers').insert(row);if(error){toast(error.message);return}closeMasterEditor();refresh()};
  window.mdEditManager=async function(id){const {data,error}=await db().from('project_managers').select('*').eq('id',id).single();if(error){toast(error.message);return}openMasterEditor('Edit Project Manager',managerFields(data),()=>window.mdSaveManagerEdit(id));};
  window.mdSaveManagerEdit=async function(id){const row={name:q('md_pm_name')?.value.trim(),code:q('md_pm_code')?.value.trim(),phone:q('md_pm_phone')?.value.trim()||null,email:q('md_pm_email')?.value.trim()||null,sort_order:Number(q('md_pm_sort')?.value||0),updated_at:new Date().toISOString()};if(!row.name||!row.code){toast('Nama dan kode wajib diisi');return}const {error}=await db().from('project_managers').update(row).eq('id',id);if(error){toast(error.message);return}closeMasterEditor();refresh()};
  window.mdDeleteManager=function(id,name){modal('Hapus Project Manager',`<p>Yakin menghapus <strong>${esc(name)}</strong>?</p><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn danger" onclick="mdConfirmDeleteManager('${id}')">Hapus Data</button></div>`)};
  window.mdConfirmDeleteManager=async function(id){const {error}=await db().from('project_managers').delete().eq('id',id);if(error){toast(error.message);return}closeModal();refresh()};
  async function add(table,title){const name=q('md_name')?.value.trim(),sort=Number(q('md_sort')?.value||0);if(!name){toast('Nama wajib diisi');return}const {error}=await db().from(table).insert({name,sort_order:sort,is_active:true});if(error){toast(error.message);return}closeMasterEditor();toast(title+' ditambahkan');refresh()}
  window.mdAddFinanceCategory=()=>openMasterEditor('Tambah Kategori Keuangan',categoryFields('Nama Kategori *',null,'Contoh: Material'),()=>add('transaction_categories','Kategori Keuangan'));
  window.mdAddPaymentMethod=()=>openMasterEditor('Tambah Metode Pembayaran',categoryFields('Nama Metode *',null,'Contoh: Transfer'),()=>add('payment_methods','Metode Pembayaran'));
  async function edit(table,title,id){const {data,error}=await db().from(table).select('*').eq('id',id).single();if(error){toast(error.message);return}openMasterEditor('Edit '+title,categoryFields(table==='payment_methods'?'Nama Metode *':'Nama Kategori *',data),()=>window.saveEdit(table,title,id));}
  window.mdEditFinanceCategory=id=>edit('transaction_categories','Kategori Keuangan',id);
  window.mdEditPaymentMethod=id=>edit('payment_methods','Metode Pembayaran',id);
  window.saveEdit=async function(table,title,id){const name=q('md_name')?.value.trim(),sort=Number(q('md_sort')?.value||0);if(!name){toast('Nama wajib diisi');return}const {error}=await db().from(table).update({name,sort_order:sort,updated_at:new Date().toISOString()}).eq('id',id);if(error){toast(error.message);return}closeMasterEditor();toast(title+' diperbarui');refresh()};
  window.mdDeleteFinanceCategory=(id,name)=>del('transaction_categories','Kategori Keuangan',id,name);
  window.mdDeletePaymentMethod=(id,name)=>del('payment_methods','Metode Pembayaran',id,name);
  function del(table,title,id,name){modal('Hapus '+title,`<p>Yakin menghapus <strong>${esc(name)}</strong>?</p><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn danger" onclick="confirmDel('${table}','${id}')">Hapus Data</button></div>`)}
  window.confirmDel=async function(table,id){const {error}=await db().from(table).delete().eq('id',id);if(error){toast(error.message);return}closeModal();refresh()};
  async function syncSelect(id,table,placeholder){const el=q(id);if(!el||el.dataset.mdSync==='1')return;el.dataset.mdSync='1';try{const current=el.value||'';const listRows=(await list(table)).filter(x=>x.is_active);let sel=el;if(el.tagName!=='SELECT'){sel=document.createElement('select');sel.id=id;sel.name=id;sel.className=el.className;el.replaceWith(sel)}sel.innerHTML=`<option value="">${placeholder}</option>`+listRows.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');if(current)sel.value=current}catch(e){toast(e?.message||'Gagal memuat master')}}
  function observe(){navButton();cleanProjectCategoryControl();if(document.querySelector('#page .md-page')&&!q('md-master-ready')){const marker=document.createElement('span');marker.id='md-master-ready';marker.hidden=true;document.querySelector('#page .md-page').appendChild(marker);refresh()}syncSelect('f_mgr','project_managers','Pilih Project Manager...').catch(()=>{});syncSelect('tx_cat','transaction_categories','Pilih kategori...').catch(()=>{});syncSelect('tx_method','payment_methods','Pilih metode...').catch(()=>{})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
  new window.SiKoyekFoundation.Observer(()=>{clearTimeout(window.__mdTimer);window.__mdTimer=setTimeout(observe,120)}).observe(document.body,{childList:true,subtree:true});
})();
