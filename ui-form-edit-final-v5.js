/* SiKoyek V1.0 — Edit Proyek uses the same visual shell and field geometry as Tambah Proyek. */
(function(){
  let managerPromise=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  async function getProjectInfo(id){
    const [{data:project,error:e1},{count:progressCount,error:e2},{count:txCount,error:e3}]=await Promise.all([
      sb.from('projects').select('*').eq('id',id).single(),
      sb.from('progress_records').select('id',{count:'exact',head:true}).eq('project_id',id),
      sb.from('financial_transactions').select('id',{count:'exact',head:true}).eq('project_id',id)
    ]);
    if(e1||e2||e3){toast('Tidak bisa memeriksa status proyek');return null}
    const started=String(project?.status||'').toUpperCase()!=='RENCANA'||Number(project?.project_progress||0)>0||Number(progressCount||0)>0||Number(txCount||0)>0;
    return {project,started};
  }
  async function getCategories(current){
    try{
      const {data,error}=await sb.from('project_categories').select('name,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(error)throw error;
      const rows=(data||[]).filter(x=>x.is_active!==false);
      if(rows.length)return rows;
    }catch(_){ }
    return current?[{name:current,is_active:true,sort_order:1}]:[{name:'Renovasi',is_active:true,sort_order:1}];
  }
  async function getManagers(){
    if(managerPromise)return managerPromise;
    if(typeof sb==='undefined'||!sb)return [];
    managerPromise=sb.from('project_managers').select('id,name,code,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true})
      .then(({data,error})=>{if(error)throw error;return(data||[]).filter(x=>x.is_active!==false)}).catch(()=>{managerPromise=null;return[]});
    return managerPromise;
  }
  function removeGenericEditHeader(){
    const project=document.getElementById('uiFinalProject');
    if(!project)return;
    const box=project.closest('.modalbox');
    if(!box)return;
    const heads=[...box.querySelectorAll(':scope>.modalhead,:scope>.p6-body>.modalhead')];
    heads.forEach(h=>h.remove());
  }
  async function openEdit(id){
    const info=await getProjectInfo(id);
    if(!info)return;
    if(info.started){toast('Proyek sudah dimulai. Edit data proyek dasar dikunci.');return}
    const p=info.project||{};
    const [cats,managers]=await Promise.all([getCategories(p.category||''),getManagers()]);
    const categoryOptions=cats.map(x=>`<option value="${esc(x.name)}" ${x.name===p.category?'selected':''}>${esc(x.name)}</option>`).join('');
    const managerOptions='<option value="">Pilih Project Manager...</option>'+managers.map(x=>`<option value="${esc(x.name)}" ${x.name===p.project_manager?'selected':''}>${esc(x.name)} (${esc(x.code)})</option>`).join('');
    modal('',`<div id="uiFinalProject" class="ui-final-project">
      <div class="ui-final-head"><div class="ui-final-head-main"><h3>Edit Data Proyek</h3><p>Isi data inti proyek sebelum masuk ke tahap konfirmasi.</p></div><button class="ui-final-close" type="button" onclick="closeModal()">Tutup</button></div>
      <div class="ui-final-content">
        <div class="ui-final-help">Data proyek masih berada pada status awal, sehingga perubahan dasar diperbolehkan.</div>
        <div class="ui-final-grid">
          <div class="ui-final-field span2"><label>Kode Proyek *</label><input id="p5_code" value="${esc(p.project_code||'')}" autocomplete="off"></div>
          <div class="ui-final-field span2"><label>Tanggal Proyek</label><input id="p5_date" type="date" value="${esc(p.project_date||'')}"></div>
          <div class="ui-final-field span2"><label>Pemilik / Klien</label><input id="p5_owner" value="${esc(p.owner_name||'')}" placeholder="Nama pemilik / perusahaan"></div>
          <div class="ui-final-field span6"><label>Nama Proyek *</label><input id="p5_name" value="${esc(p.project_name||'')}" placeholder="Contoh: Renovasi Rumah Budi"></div>
          <div class="ui-final-row3">
            <div class="ui-final-field"><label>Kategori</label><select id="p5_cat">${categoryOptions}</select></div>
            <div class="ui-final-field"><label>Lokasi</label><input id="p5_loc" value="${esc(p.location||'')}" placeholder="Lokasi proyek"></div>
            <div class="ui-final-field"><label>Project Manager</label><select id="p5_mgr">${managerOptions}</select></div>
          </div>
          <div class="ui-final-row3">
            <div class="ui-final-field"><label>Nilai Proyek</label><input id="p5_contract" type="number" min="0" step="1000" value="${Number(p.contract_value||0)}"></div>
            <div class="ui-final-field"><label>Tanggal Mulai</label><input id="p5_start" type="date" value="${esc(p.start_date||'')}"></div>
            <div class="ui-final-field"><label>Estimasi Selesai</label><input id="p5_end" type="date" value="${esc(p.end_date||'')}"></div>
          </div>
        </div>
      </div>
      <div class="ui-final-actions"><button type="button" onclick="closeModal()">Batal</button><button id="p5EditSave" class="primary" type="button">Simpan Perubahan</button></div>
    </div>`);
    removeGenericEditHeader();
    document.getElementById('p5EditSave')?.addEventListener('click',()=>window.p5SaveProjectEdit(id));
  }
  window.p5EditProject=openEdit;
  window.p5SaveProjectEdit=async function(id){
    const code=document.getElementById('p5_code')?.value.trim()||'';
    const name=document.getElementById('p5_name')?.value.trim()||'';
    const start=document.getElementById('p5_start')?.value||'';
    const end=document.getElementById('p5_end')?.value||'';
    if(!code||!name){toast('Kode dan nama proyek wajib diisi');return}
    if(start&&end&&end<start){toast('Estimasi selesai tidak boleh lebih awal dari tanggal mulai');return}
    const row={project_code:code,project_date:document.getElementById('p5_date')?.value||null,project_name:name,owner_name:document.getElementById('p5_owner')?.value.trim()||null,category:document.getElementById('p5_cat')?.value||null,location:document.getElementById('p5_loc')?.value.trim()||null,contract_value:Number(document.getElementById('p5_contract')?.value||0),project_manager:document.getElementById('p5_mgr')?.value||null,start_date:start||null,end_date:end||null};
    if(row.contract_value<0){toast('Nilai proyek tidak boleh negatif');return}
    const {error}=await sb.from('projects').update(row).eq('id',id);
    if(error){toast(error.code==='23505'?'Kode proyek sudah digunakan.':error.message);return}
    closeModal();
    if(typeof loadSummary==='function')await loadSummary();
    if(typeof renderPage==='function')renderPage();else if(typeof renderApp==='function')renderApp();
    toast('Data proyek berhasil diperbarui');
  };
  window.__sikoyekEditAuthoritative=true;
})();
