/* SiKoyek V1.0 — Edit Proyek uses the same visual shell and field geometry as Tambah Proyek. */
(function(){
  let managerPromise=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function css(){
    if(document.getElementById('ui-form-edit-final-css'))return;
    const s=document.createElement('style');s.id='ui-form-edit-final-css';s.textContent=`
#modal .modalbox:has(.ui-final-project){width:min(820px,calc(100vw - 28px))!important;max-width:820px!important;max-height:calc(100vh - 24px)!important;overflow:hidden!important;padding:0!important;border-radius:20px!important;box-sizing:border-box!important}
#modal .modalbox:has(.ui-final-project)>.modalhead,#modal .modalbox:has(.ui-final-project)>.p6-body>.modalhead{display:none!important}
#modal .modalbox:has(.ui-final-project)>.p6-body{padding:0!important;margin:0!important;overflow:hidden!important;width:100%!important;box-sizing:border-box!important}
#modal .ui-final-project{width:100%!important;max-width:none!important;height:auto;max-height:calc(100vh - 24px);overflow:hidden!important;box-sizing:border-box!important}
#modal .ui-final-head{height:78px;padding:12px 22px;background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;position:relative;overflow:hidden;box-sizing:border-box!important}
#modal .ui-final-head:after{content:"";position:absolute;right:-70px;bottom:-90px;width:320px;height:170px;background:rgba(72,180,190,.18);border-radius:55% 0 0 0;transform:rotate(-8deg)}
#modal .ui-final-head-main{position:relative;z-index:1}.ui-final-head h3{margin:0!important;color:#fff!important;font-size:23px!important;line-height:1.05!important;font-weight:650!important}.ui-final-head p{margin:4px 0 0;color:#e8f4f8;font-size:10px}
#modal .ui-final-close{position:relative;z-index:2;height:36px;min-width:84px;border:0;border-radius:9px;background:#fff;color:#172033;font-size:13px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:1}
#modal .ui-final-content{padding:0 18px;overflow:hidden;box-sizing:border-box!important;width:100%!important}#modal .ui-final-help{padding:7px 9px;margin-bottom:8px;border:1px solid #dfe7f0;border-radius:8px;background:#f7f9fc;color:#5f6f85;font-size:9px;box-sizing:border-box!important}
#modal .ui-final-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px 8px;padding:10px;border:1px solid #dfe7f0;border-radius:13px;background:#fbfcfe;box-sizing:border-box!important;width:100%!important}.ui-final-field{min-width:0}.ui-final-field label{display:block;margin:0 0 3px;color:#3d4d66;font-size:9px;font-weight:600}.ui-final-field input,.ui-final-field select{width:100%;height:33px;min-height:33px;padding:5px 8px;border:1px solid #cbd9e8;border-radius:7px;background:#fff;color:#172033;font-size:11px;outline:none;box-sizing:border-box!important}.span2{grid-column:span 2}.span6{grid-column:1/-1}
.ui-final-row3{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 8px}.ui-final-row3 .ui-final-field{grid-column:auto!important}.ui-final-actions{height:48px;margin-top:7px;padding:6px 18px;border-top:1px solid #e6ebf1;display:flex;justify-content:flex-end;align-items:center;gap:7px;box-sizing:border-box!important;width:100%!important}.ui-final-actions button{height:34px;min-height:34px;min-width:88px;padding:0 14px;margin:0;border-radius:8px;font-size:13px!important;font-weight:500!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:nowrap;border:1px solid #d3dce7;background:#fff;color:#26364d}.ui-final-actions .primary{background:#0b2e52;border-color:#0b2e52;color:#fff;min-width:112px}
#modal .ui-final-project input[type="number"]{font-size:12px!important;font-weight:500!important;text-align:right!important;line-height:1!important}
@media(max-width:900px){#modal .modalbox:has(.ui-final-project){width:calc(100vw - 18px)!important;max-width:none!important}.ui-final-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.span2{grid-column:span 1}.span6{grid-column:1/-1}.ui-final-row3{grid-column:1/-1}}
@media(max-width:560px){#modal .ui-final-head{height:70px;padding:10px 14px}.ui-final-head h3{font-size:20px!important}.ui-final-grid{grid-template-columns:1fr!important}.span2,.span6{grid-column:1/-1}.ui-final-row3{grid-template-columns:1fr}.ui-final-actions{padding:7px 12px}.ui-final-actions button{min-width:0!important;flex:1}}
`;document.head.appendChild(s)
  }
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
    try{const {data,error}=await sb.from('project_categories').select('name,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true});if(error)throw error;const rows=(data||[]).filter(x=>x.is_active!==false);if(rows.length)return rows}catch(_){ }
    return current?[{name:current,is_active:true,sort_order:1}]:[{name:'Renovasi',is_active:true,sort_order:1}];
  }
  async function getManagers(){
    if(managerPromise)return managerPromise;
    if(typeof sb==='undefined'||!sb)return [];
    managerPromise=sb.from('project_managers').select('id,name,code,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true}).then(({data,error})=>{if(error)throw error;return(data||[]).filter(x=>x.is_active!==false)}).catch(()=>{managerPromise=null;return[]});
    return managerPromise;
  }
  function removeGenericEditHeader(){const project=document.getElementById('uiFinalProject');if(!project)return;const box=project.closest('.modalbox');if(!box)return;[...box.querySelectorAll(':scope>.modalhead,:scope>.p6-body>.modalhead')].forEach(h=>h.remove())}
  async function openEdit(id){
    css();
    const info=await getProjectInfo(id);if(!info)return;if(info.started){toast('Proyek sudah dimulai. Edit data proyek dasar dikunci.');return}
    const p=info.project||{};const [cats,managers]=await Promise.all([getCategories(p.category||''),getManagers()]);
    const categoryOptions=cats.map(x=>`<option value="${esc(x.name)}" ${x.name===p.category?'selected':''}>${esc(x.name)}</option>`).join('');
    const managerOptions='<option value="">Pilih Project Manager...</option>'+managers.map(x=>`<option value="${esc(x.name)}" ${x.name===p.project_manager?'selected':''}>${esc(x.name)} (${esc(x.code)})</option>`).join('');
    modal('',`<div id="uiFinalProject" class="ui-final-project"><div class="ui-final-head"><div class="ui-final-head-main"><h3>Edit Data Proyek</h3><p>Isi data inti proyek sebelum masuk ke tahap konfirmasi.</p></div><button class="ui-final-close" type="button" onclick="closeModal()">Tutup</button></div><div class="ui-final-content"><div class="ui-final-help">Data proyek masih berada pada status awal, sehingga perubahan dasar diperbolehkan.</div><div class="ui-final-grid"><div class="ui-final-field span2"><label>Kode Proyek *</label><input id="p5_code" value="${esc(p.project_code||'')}" autocomplete="off"></div><div class="ui-final-field span2"><label>Tanggal Proyek</label><input id="p5_date" type="date" value="${esc(p.project_date||'')}"></div><div class="ui-final-field span2"><label>Pemilik / Klien</label><input id="p5_owner" value="${esc(p.owner_name||'')}" placeholder="Nama pemilik / perusahaan"></div><div class="ui-final-field span6"><label>Nama Proyek *</label><input id="p5_name" value="${esc(p.project_name||'')}" placeholder="Contoh: Renovasi Rumah Budi"></div><div class="ui-final-row3"><div class="ui-final-field"><label>Kategori</label><select id="p5_cat">${categoryOptions}</select></div><div class="ui-final-field"><label>Lokasi</label><input id="p5_loc" value="${esc(p.location||'')}" placeholder="Lokasi proyek"></div><div class="ui-final-field"><label>Project Manager</label><select id="p5_mgr">${managerOptions}</select></div></div><div class="ui-final-row3"><div class="ui-final-field"><label>Nilai Proyek</label><input id="p5_contract" type="number" min="0" step="1000" value="${Number(p.contract_value||0)}"></div><div class="ui-final-field"><label>Tanggal Mulai</label><input id="p5_start" type="date" value="${esc(p.start_date||'')}"></div><div class="ui-final-field"><label>Estimasi Selesai</label><input id="p5_end" type="date" value="${esc(p.end_date||'')}"></div></div></div></div><div class="ui-final-actions"><button type="button" onclick="closeModal()">Batal</button><button id="p5EditSave" class="primary" type="button">Simpan Perubahan</button></div></div>`);
    removeGenericEditHeader();document.getElementById('p5EditSave')?.addEventListener('click',()=>window.p5SaveProjectEdit(id));
  }
  window.p5EditProject=openEdit;
  window.p5SaveProjectEdit=async function(id){const code=document.getElementById('p5_code')?.value.trim()||'',name=document.getElementById('p5_name')?.value.trim()||'',start=document.getElementById('p5_start')?.value||'',end=document.getElementById('p5_end')?.value||'';if(!code||!name){toast('Kode dan nama proyek wajib diisi');return}if(start&&end&&end<start){toast('Estimasi selesai tidak boleh lebih awal dari tanggal mulai');return}const row={project_code:code,project_date:document.getElementById('p5_date')?.value||null,project_name:name,owner_name:document.getElementById('p5_owner')?.value.trim()||null,category:document.getElementById('p5_cat')?.value||null,location:document.getElementById('p5_loc')?.value.trim()||null,contract_value:Number(document.getElementById('p5_contract')?.value||0),project_manager:document.getElementById('p5_mgr')?.value||null,start_date:start||null,end_date:end||null};if(row.contract_value<0){toast('Nilai proyek tidak boleh negatif');return}const {error}=await sb.from('projects').update(row).eq('id',id);if(error){toast(error.code==='23505'?'Kode proyek sudah digunakan.':error.message);return}closeModal();if(typeof loadSummary==='function')await loadSummary();if(typeof renderPage==='function')renderPage();else if(typeof renderApp==='function')renderApp();toast('Data proyek berhasil diperbarui')};
  window.__sikoyekEditAuthoritative=true;
})();