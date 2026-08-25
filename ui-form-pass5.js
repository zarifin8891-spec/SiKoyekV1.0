(function(){
  const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=d=>{if(!d)return '-';const [y,m,day]=String(d).slice(0,10).split('-');return y&&m&&day?`${day.padStart(2,'0')}-${months[Number(m)-1]}-${y}`:'-'};
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  let categoryAll=[];

  function centerAndNormalizeWizard(){
    const modal=document.getElementById('modal'); if(!modal)return;
    const next=document.getElementById('uiNext'),back=document.getElementById('uiBack'),save=document.getElementById('uiSaveProject');
    const step=Number(window.__siKoyekProjectStep||1);
    if(next)next.style.display=step<3?'inline-flex':'none';
    if(back)back.style.display=step>1?'inline-flex':'none';
    if(save)save.style.display=step===3?'inline-flex':'none';
    modal.querySelectorAll('.formactions .btn').forEach(b=>{b.style.textAlign='center';b.style.justifyContent='center';b.style.alignItems='center'});
  }

  async function refreshCategoryAll(){
    const {data,error}=await sb.from('project_categories').select('id,name,sort_order,is_active').order('sort_order',{ascending:true}).order('name',{ascending:true});
    if(error){toast('Gagal membaca Master Kategori: '+error.message);return []}
    categoryAll=data||[];
    const select=document.getElementById('f_cat');
    if(select&&select.tagName==='SELECT'){
      const current=select.value;
      const active=categoryAll.filter(x=>x.is_active!==false);
      select.innerHTML=active.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
      if(active.some(x=>x.name===current))select.value=current;
      else if(active[0])select.value=active[0].name;
    }
    return categoryAll;
  }

  function snapshotProjectForm(){
    const ids=['f_code','f_date','f_name','f_owner','f_cat','f_loc','f_contract','f_mgr','f_start','f_end','f_status'];
    const values={}; ids.forEach(id=>{const el=document.getElementById(id);if(el)values[id]=el.value});
    return {values,step:Number(window.__siKoyekProjectStep||1)};
  }

  function reopenProjectForm(snapshot){
    if(!snapshot)return;
    if(typeof window.openProjectForm==='function')window.openProjectForm();
    const apply=()=>{
      Object.entries(snapshot.values||{}).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val});
      refreshCategoryAll().then(()=>{
        window.__siKoyekProjectStep=snapshot.step||1;
        if(typeof window.nextProjectStep==='function'){
          const steps=document.querySelectorAll('#modal .ui-step');
          steps.forEach(el=>el.classList.toggle('active',Number(el.dataset.target)===window.__siKoyekProjectStep));
          document.querySelectorAll('#modal .ui-pane').forEach(el=>el.style.display=Number(el.dataset.pane)===window.__siKoyekProjectStep?'block':'none');
        }
        centerAndNormalizeWizard();
      });
    };
    [50,180,420].forEach(ms=>setTimeout(apply,ms));
  }

  window.openCategoryMaster=function(){
    const snap=snapshotProjectForm();
    window.__p5ProjectSnapshot=snap;
    modal('Master Kategori Proyek',`<div class="ui-help">Daftar di bawah menampilkan seluruh kategori yang benar-benar tersimpan di database. Kategori aktif tersedia di dropdown proyek.</div><div class="category-master-toolbar"><div class="field"><label>Nama Kategori Baru</label><input id="p5NewCategory" placeholder="Contoh: Pembangunan Gedung"></div><button class="btn primary" type="button" onclick="p5AddCategory()">+ Tambah</button></div><div class="category-master-table"><div class="cm-head"><div>Nama Kategori</div><div>Status</div><div>Aksi</div></div><div id="p5CategoryRows"><div class="cm-empty">Memuat...</div></div></div><div class="formactions"><button class="btn ghost" type="button" onclick="p5CloseCategoryMaster()">Tutup & Kembali</button></div>`);
    p5RenderCategories();
  };

  window.p5RenderCategories=async function(){
    const wrap=document.getElementById('p5CategoryRows'); if(!wrap)return;
    wrap.innerHTML='<div class="cm-empty">Memuat kategori...</div>';
    const data=await refreshCategoryAll();
    if(!data.length){wrap.innerHTML='<div class="cm-empty">Belum ada kategori di database.</div>';return}
    wrap.innerHTML=data.map(x=>`<div class="cm-row"><div><strong>${esc(x.name)}</strong><small>Urutan ${Number(x.sort_order||0)}</small></div><div class="cm-status"><span class="p5-status-pill ${x.is_active?'green':'muted'}">${x.is_active?'AKTIF':'NONAKTIF'}</span></div><div class="cm-actions"><button class="btn ghost" type="button" onclick="p5EditCategory('${x.id}',${JSON.stringify(x.name)})">Edit</button>${x.is_active?`<button class="btn danger" type="button" onclick="p5DeleteCategory('${x.id}',${JSON.stringify(x.name)})">Hapus</button>`:`<button class="btn ghost" type="button" onclick="p5RestoreCategory('${x.id}')">Aktifkan</button>`}</div></div>`).join('');
    const count=document.getElementById('categoryMasterCount');if(count)count.textContent=data.length+' kategori';
  };

  window.p5AddCategory=async function(){
    const input=document.getElementById('p5NewCategory'); const name=input?.value.trim();
    if(!name){toast('Nama kategori wajib diisi');return}
    const duplicate=categoryAll.find(x=>String(x.name).toLowerCase()===name.toLowerCase());if(duplicate){toast('Kategori tersebut sudah ada di database');return}
    const maxOrder=categoryAll.reduce((m,x)=>Math.max(m,Number(x.sort_order||0)),0);
    const {error}=await sb.from('project_categories').insert({name,sort_order:maxOrder+1,is_active:true});
    if(error){toast(error.message);return}
    if(window.__p5ProjectSnapshot)window.__p5ProjectSnapshot.values.f_cat=name;
    input.value='';toast('Kategori berhasil ditambahkan');await p5RenderCategories();
  };

  window.p5EditCategory=async function(id,current){
    modal('Edit Kategori Proyek',`<div class="ui-help">Perubahan nama akan berlaku untuk kategori master. Data proyek lama yang memakai nama sebelumnya tetap dipertahankan.</div><div class="field"><label>Nama Kategori</label><input id="p5EditCategoryName" value="${esc(current)}"></div><div class="formactions"><button class="btn ghost" onclick="closeModal();window.openCategoryMaster()">Batal</button><button class="btn primary" onclick="p5SaveCategory('${id}')">Simpan Perubahan</button></div>`);
  };

  window.p5SaveCategory=async function(id){
    const name=document.getElementById('p5EditCategoryName')?.value.trim();if(!name){toast('Nama kategori wajib diisi');return}
    const {error}=await sb.from('project_categories').update({name}).eq('id',id);if(error){toast(error.message);return}
    if(window.__p5ProjectSnapshot?.values?.f_cat)window.__p5ProjectSnapshot.values.f_cat=name;
    toast('Kategori berhasil diubah');window.openCategoryMaster();
  };

  window.p5DeleteCategory=async function(id,name){
    const usage=await sb.from('projects').select('id',{count:'exact',head:true}).eq('category',name);
    const used=Number(usage.count||0)>0;
    if(used){toast('Kategori masih dipakai oleh '+usage.count+' proyek. Gunakan edit nama atau nonaktifkan tanpa menghapus riwayat.');return}
    if(!confirm('Hapus kategori "'+name+'" dari daftar aktif?'))return;
    const {error}=await sb.from('project_categories').update({is_active:false}).eq('id',id);if(error){toast(error.message);return}
    toast('Kategori dihapus dari daftar aktif');await p5RenderCategories();
  };

  window.p5RestoreCategory=async function(id){const {error}=await sb.from('project_categories').update({is_active:true}).eq('id',id);if(error){toast(error.message);return}toast('Kategori diaktifkan kembali');await p5RenderCategories()};

  window.p5CloseCategoryMaster=function(){
    const snap=window.__p5ProjectSnapshot;delete window.__p5ProjectSnapshot;closeModal();if(snap)reopenProjectForm(snap);
  };

  function isProjectStarted(project,progressCount,txCount){
    const status=String(project?.status||'').toUpperCase();
    const progress=Number(project?.project_progress||0);
    return status!=='RENCANA'||progress>0||progressCount>0||txCount>0;
  }

  async function projectLifecycle(id){
    const [{data:project,error:e1},{count:progressCount,error:e2},{count:txCount,error:e3}]=await Promise.all([
      sb.from('projects').select('*').eq('id',id).single(),
      sb.from('progress_records').select('id',{count:'exact',head:true}).eq('project_id',id),
      sb.from('financial_transactions').select('id',{count:'exact',head:true}).eq('project_id',id)
    ]);
    if(e1||e2||e3){toast('Tidak bisa memeriksa status proyek');return null}
    return {project,progressCount:progressCount||0,txCount:txCount||0,started:isProjectStarted(project,progressCount||0,txCount||0)};
  }

  async function editProjectForm(id){
    const info=await projectLifecycle(id);if(!info)return;if(info.started){toast('Proyek sudah dimulai. Edit data proyek dasar dikunci.');return}
    const p=info.project;
    const cats=await refreshCategoryAll();
    modal('Edit Data Proyek',`<div class="p5-edit-banner">Data proyek masih berada pada status awal, sehingga perubahan dasar diperbolehkan.</div><div class="p5-edit-grid" style="margin-top:14px"><div class="field"><label>Kode Proyek *</label><input id="p5_code" value="${esc(p.project_code)}"></div><div class="field"><label>Tanggal Proyek</label><input id="p5_date" type="date" value="${esc(p.project_date||'')}"></div><div class="field"><label>Nama Proyek *</label><input id="p5_name" value="${esc(p.project_name)}"></div><div class="field"><label>Pemilik / Klien</label><input id="p5_owner" value="${esc(p.owner_name||'')}"></div><div class="field"><label>Kategori</label><select id="p5_cat">${cats.filter(x=>x.is_active!==false).map(x=>`<option value="${esc(x.name)}" ${x.name===p.category?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Lokasi</label><input id="p5_loc" value="${esc(p.location||'')}"></div><div class="field"><label>Nilai Kontrak</label><input id="p5_contract" type="number" min="0" value="${Number(p.contract_value||0)}"></div><div class="field"><label>Project Manager</label><input id="p5_mgr" value="${esc(p.project_manager||'')}"></div><div class="field"><label>Tanggal Mulai</label><input id="p5_start" type="date" value="${esc(p.start_date||'')}"></div><div class="field"><label>Target Selesai</label><input id="p5_end" type="date" value="${esc(p.end_date||'')}"></div><div class="field"><label>Status</label><select id="p5_status"><option ${p.status==='RENCANA'?'selected':''}>RENCANA</option><option ${p.status==='JALAN'?'selected':''}>JALAN</option><option ${p.status==='PENDING'?'selected':''}>PENDING</option><option ${p.status==='SELESAI'?'selected':''}>SELESAI</option></select></div></div><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="p5SaveProjectEdit('${id}')">Simpan Perubahan</button></div>`);
  }
  window.p5EditProject=editProjectForm;

  window.p5SaveProjectEdit=async function(id){
    const start=document.getElementById('p5_start')?.value||'',end=document.getElementById('p5_end')?.value||'';
    const row={project_code:document.getElementById('p5_code').value.trim(),project_date:document.getElementById('p5_date').value||null,project_name:document.getElementById('p5_name').value.trim(),owner_name:document.getElementById('p5_owner').value.trim()||null,category:document.getElementById('p5_cat').value||null,location:document.getElementById('p5_loc').value.trim()||null,contract_value:Number(document.getElementById('p5_contract').value||0),project_manager:document.getElementById('p5_mgr').value.trim()||null,start_date:start||null,end_date:end||null,status:document.getElementById('p5_status').value};
    if(!row.project_code||!row.project_name){toast('Kode dan nama proyek wajib diisi');return}
    if(start&&end&&end<start){toast('Target selesai tidak boleh lebih awal dari tanggal mulai');return}
    const {error}=await sb.from('projects').update(row).eq('id',id);if(error){toast(error.code==='23505'?'Kode proyek sudah digunakan.':error.message);return}
    closeModal();await loadSummary();toast('Data proyek berhasil diperbarui');if(typeof renderPage==='function')renderPage();
  };

  window.p5DeleteProject=async function(id){
    const info=await projectLifecycle(id);if(!info)return;if(info.started){toast('Proyek sudah dimulai. Penghapusan dikunci.');return}
    if(!confirm('Hapus proyek "'+info.project.project_name+'"? Data RAP dan Item Pekerjaan proyek ini juga akan dihapus.'))return;
    for(const table of ['project_rap','project_work_items']){const {error}=await sb.from(table).delete().eq('project_id',id);if(error){toast('Gagal menghapus '+table+': '+error.message);return}}
    const {error}=await sb.from('projects').delete().eq('id',id);if(error){toast('Gagal menghapus proyek: '+error.message);return}
    if(typeof loadSummary==='function')await loadSummary();toast('Proyek berhasil dihapus');go('projects');
  };

  async function decorateProjectTable(){
    if(state.page!=='projects')return;
    const table=document.querySelector('.tablecard table.table');if(!table)return;
    if(table.dataset.p5Decorated==='1')return;
    const head=table.querySelector('thead tr');if(!head)return;
    const th=document.createElement('th');th.textContent='Aksi';head.appendChild(th);
    const rows=[...table.querySelectorAll('tbody tr')];
    for(const tr of rows){
      const openBtn=tr.querySelector('button.linkbtn');
      if(!openBtn)return;
      const m=openBtn.getAttribute('onclick')?.match(/openProject\('([^']+)'\)/);const id=m?.[1];if(!id)continue;
      const td=document.createElement('td');td.className='p5-actions-cell';td.innerHTML='<div class="p5-toolbar"><button class="p5-action primary" type="button" data-p5-edit>Edit</button><button class="p5-action danger" type="button" data-p5-delete>Hapus</button></div><span class="p5-lock-note">Memeriksa status proyek...</span>';tr.appendChild(td);
      td.querySelector('[data-p5-edit]').addEventListener('click',()=>p5EditProject(id));td.querySelector('[data-p5-delete]').addEventListener('click',()=>p5DeleteProject(id));
      projectLifecycle(id).then(info=>{const edit=td.querySelector('[data-p5-edit]'),del=td.querySelector('[data-p5-delete]'),note=td.querySelector('.p5-lock-note');if(!info)return;if(info.started){edit.disabled=true;del.disabled=true;note.textContent='Terkunci: proyek sudah dimulai';}else{note.textContent='Edit/Hapus tersedia sebelum proyek dimulai';}});
    }
    table.dataset.p5Decorated='1';
  }

  function decorateDetailActions(){
    if(state.page!=='detail'||!state.selected)return;
    const actions=document.querySelector('.detailtitle')?.parentElement?.querySelector('.actions');if(!actions||actions.querySelector('[data-p5-detail-edit]'))return;
    const edit=document.createElement('button');edit.className='btn primary';edit.textContent='Edit Proyek';edit.dataset.p5DetailEdit='1';
    const del=document.createElement('button');del.className='btn danger';del.textContent='Hapus Proyek';
    actions.insertBefore(edit,actions.firstChild);actions.insertBefore(del,edit.nextSibling);
    projectLifecycle(state.selected).then(info=>{if(info?.started){edit.disabled=true;del.disabled=true;edit.title='Proyek sudah dimulai';del.title='Proyek sudah dimulai'}});
    edit.addEventListener('click',()=>p5EditProject(state.selected));del.addEventListener('click',()=>p5DeleteProject(state.selected));
  }

  const observe=()=>{centerAndNormalizeWizard();decorateProjectTable();decorateDetailActions()};
  const boot=()=>setTimeout(observe,80);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__p5Timer);window.__p5Timer=setTimeout(observe,100)});obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();