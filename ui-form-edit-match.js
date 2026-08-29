/* Edit Proyek layout: mirror the approved Tambah Proyek field geometry. */
(function(){
  const STYLE_ID='ui-form-edit-match-style-v2';
  const CLASS='edit-project-match-v2';
  let managersPromise=null;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
#modal .modalbox.${CLASS}{
  width:min(820px,calc(100vw - 28px))!important;
  max-width:820px!important;
  max-height:calc(100vh - 24px)!important;
  overflow:hidden!important;
  padding:0!important;
  border-radius:20px!important;
}
#modal .modalbox.${CLASS} .formgrid,
#modal .modalbox.${CLASS} .twocol{
  display:grid!important;
  grid-template-columns:repeat(6,minmax(0,1fr))!important;
  gap:6px 8px!important;
  margin:0 18px!important;
  padding:10px!important;
  border:1px solid #dfe7f0!important;
  border-radius:13px!important;
  background:#fbfcfe!important;
}
#modal .modalbox.${CLASS} .formgrid>.field,
#modal .modalbox.${CLASS} .twocol>.field{
  min-width:0!important;
  margin:0!important;
  grid-column:span 2!important;
}
#modal .modalbox.${CLASS} .formgrid>.field[data-edit-span="6"],
#modal .modalbox.${CLASS} .twocol>.field[data-edit-span="6"]{grid-column:1/-1!important}
#modal .modalbox.${CLASS} .field label{
  display:block!important;
  margin:0 0 3px!important;
  color:#3d4d66!important;
  font-size:9px!important;
  line-height:1.15!important;
  font-weight:600!important;
}
#modal .modalbox.${CLASS} input,
#modal .modalbox.${CLASS} select,
#modal .modalbox.${CLASS} textarea{
  width:100%!important;
  min-width:0!important;
  height:33px!important;
  min-height:33px!important;
  padding:5px 8px!important;
  border:1px solid #cbd9e8!important;
  border-radius:7px!important;
  background:#fff!important;
  color:#172033!important;
  font-size:11px!important;
  line-height:1!important;
  outline:none!important;
}
#modal .modalbox.${CLASS} .field input[type="number"]{
  font-size:12px!important;
  font-weight:500!important;
  text-align:right!important;
}
#modal .modalbox.${CLASS} .formactions{
  height:48px!important;
  min-height:48px!important;
  margin:7px 18px 0!important;
  padding:6px 0!important;
  border-top:1px solid #e6ebf1!important;
  display:flex!important;
  justify-content:flex-end!important;
  align-items:center!important;
  gap:7px!important;
}
#modal .modalbox.${CLASS} .formactions .btn{
  height:34px!important;
  min-height:34px!important;
  min-width:88px!important;
  padding:0 14px!important;
  margin:0!important;
  border-radius:8px!important;
  font-size:13px!important;
  font-weight:500!important;
  line-height:1!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  text-align:center!important;
  white-space:nowrap!important;
}
#modal .modalbox.${CLASS} .formactions .btn.primary{
  min-width:112px!important;
}
@media(max-width:900px){
  #modal .modalbox.${CLASS}{width:calc(100vw - 18px)!important;max-width:none!important}
  #modal .modalbox.${CLASS} .formgrid,
  #modal .modalbox.${CLASS} .twocol{grid-template-columns:repeat(2,minmax(0,1fr))!important;margin:0 12px!important}
  #modal .modalbox.${CLASS} .formgrid>.field,
  #modal .modalbox.${CLASS} .twocol>.field{grid-column:span 1!important}
  #modal .modalbox.${CLASS} .formgrid>.field[data-edit-span="6"],
  #modal .modalbox.${CLASS} .twocol>.field[data-edit-span="6"]{grid-column:1/-1!important}
}
@media(max-width:560px){
  #modal .modalbox.${CLASS}{width:calc(100vw - 16px)!important;max-height:calc(100vh - 10px)!important;border-radius:16px!important}
  #modal .modalbox.${CLASS} .formgrid,
  #modal .modalbox.${CLASS} .twocol{grid-template-columns:1fr!important;margin:0 12px!important}
  #modal .modalbox.${CLASS} .formgrid>.field,
  #modal .modalbox.${CLASS} .twocol>.field,
  #modal .modalbox.${CLASS} .formgrid>.field[data-edit-span="6"],
  #modal .modalbox.${CLASS} .twocol>.field[data-edit-span="6"]{grid-column:1/-1!important}
  #modal .modalbox.${CLASS} .formactions{padding:6px 12px!important;margin-left:0!important;margin-right:0!important}
  #modal .modalbox.${CLASS} .formactions .btn{min-width:0!important;flex:1}
}
`;
    document.head.appendChild(s);
  }

  function labelText(field){
    return (field.querySelector('label')?.textContent||'').trim().toLowerCase().replace(/\s+/g,' ');
  }

  function getManagers(){
    if(managersPromise) return managersPromise;
    if(typeof sb==='undefined'||!sb) return Promise.resolve([]);
    managersPromise=sb.from('project_managers')
      .select('id,name,code,is_active,sort_order')
      .order('sort_order',{ascending:true})
      .order('name',{ascending:true})
      .then(({data,error})=>{
        if(error) throw error;
        return (data||[]).filter(x=>x.is_active!==false);
      })
      .catch(error=>{
        managersPromise=null;
        console.warn('Gagal memuat Project Manager:',error);
        return [];
      });
    return managersPromise;
  }

  function enhanceManagerDropdown(box){
    const field=[...box.querySelectorAll('.field')].find(f=>labelText(f)==='project manager'||labelText(f).includes('project manager'));
    if(!field) return;
    let el=field.querySelector('#p5_mgr, select');
    if(!el) return;

    const current=String(el.value||'').trim();
    if(el.tagName!=='SELECT'){
      const select=document.createElement('select');
      select.id=el.id||'p5_mgr';
      if(el.name)select.name=el.name;
      select.className=el.className;
      select.setAttribute('aria-label','Project Manager');
      el.replaceWith(select);
      el=select;
    }

    if(el.dataset.managerSyncing==='1'||el.dataset.managerSynced==='1') return;
    el.dataset.managerSyncing='1';
    getManagers().then(rows=>{
      const wanted=current||String(el.value||'').trim();
      el.innerHTML='<option value="">Pilih Project Manager...</option>'+
        rows.map(x=>`<option value="${String(x.name??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')}">${String(x.name??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')} (${String(x.code??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')})</option>`).join('');
      if(wanted) el.value=wanted;
      if(!el.value&&current) {
        const fallback=document.createElement('option');
        fallback.value=current;fallback.textContent=current;el.appendChild(fallback);el.value=current;
      }
      el.dataset.managerSynced='1';
    }).finally(()=>{delete el.dataset.managerSyncing});
  }

  function markFields(box){
    const grids=[...box.querySelectorAll('.formgrid,.twocol')];
    grids.forEach(grid=>{
      const fields=[...grid.children].filter(el=>el.matches('.field'));
      if(!fields.length) return;
      fields.forEach(field=>{
        const t=labelText(field);
        field.removeAttribute('data-edit-span');
        if(t.includes('nama proyek')) field.dataset.editSpan='6';
        else field.dataset.editSpan='2';
      });
      /* Approved Add layout is 3 columns: 2/2/2, then full, then 2/2/2, then 2/2/2. */
      const nameField=fields.find(f=>labelText(f).includes('nama proyek'));
      if(nameField){
        const owner=fields.find(f=>labelText(f).includes('pemilik'));
        const code=fields.find(f=>labelText(f).includes('kode proyek'));
        const date=fields.find(f=>labelText(f).includes('tanggal proyek'));
        const category=fields.find(f=>labelText(f)==='kategori');
        const location=fields.find(f=>labelText(f)==='lokasi');
        const pm=fields.find(f=>labelText(f).includes('project manager'));
        const value=fields.find(f=>labelText(f).includes('nilai kontrak')||labelText(f).includes('nilai proyek'));
        const start=fields.find(f=>labelText(f).includes('tanggal mulai'));
        const end=fields.find(f=>labelText(f).includes('target selesai')||labelText(f).includes('estimasi selesai'));
        [code,date,owner,category,location,pm,value,start,end].forEach(f=>{if(f)f.style.gridColumn='span 2';});
        nameField.style.gridColumn='1/-1';
        [code,date,owner,nameField,category,location,pm,value,start,end].filter(Boolean).forEach(f=>f.style.gridRow='auto');
      }
    });
  }

  function isEditBox(box){
    const text=(box.innerText||'').toLowerCase();
    return text.includes('edit data proyek');
  }

  function mark(){
    addStyle();
    document.querySelectorAll('#modal .modalbox').forEach(box=>{
      if(!isEditBox(box)) return;
      box.classList.add(CLASS);
      markFields(box);
      enhanceManagerDropdown(box);
    });
  }

  let timer;
  function schedule(){clearTimeout(timer);timer=setTimeout(mark,40)}
  function boot(){
    mark();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
