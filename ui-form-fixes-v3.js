(function(){
  const fallbackCategories=['Renovasi','Bangun Baru','Interior','Instalasi','Pemeliharaan','Lainnya'];
  const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  let categoryCache=[];

  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const categoryNames=()=>categoryCache.length?categoryCache:fallbackCategories.map((name,i)=>({id:null,name,sort_order:i+1,is_active:true}));
  const formatDateId=d=>{if(!d)return '';const [y,m,day]=String(d).slice(0,10).split('-');const mm=Number(m);return y&&mm&&day?`${day.padStart(2,'0')}-${months[mm-1]}-${y}`:''};

  function syncRestoreCategory(){
    const select=document.getElementById('f_cat');
    const desired=window.__projectFormSnapshot?.category;
    if(select&&desired&&categoryNames().some(x=>x.name===desired))select.value=desired;
  }

  async function loadCategories(){
    try{
      const {data,error}=await sb.from('project_categories').select('id,name,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(!error&&data?.length) categoryCache=data;
    }catch(_){/* fallback list remains available */}
    populateCategorySelect();
  }

  function populateCategorySelect(){
    const select=document.getElementById('f_cat');
    if(!select||select.tagName!=='SELECT') return;
    const current=select.value;
    const desired=window.__projectFormSnapshot?.category;
    select.innerHTML='';
    categoryNames().forEach(item=>{
      const o=document.createElement('option');o.value=item.name;o.textContent=item.name;select.appendChild(o);
    });
    const wanted=desired||current;
    select.value=categoryNames().some(x=>x.name===wanted)?wanted:(categoryNames()[0]?.name||'');
    if(select.value) select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function replaceCategoryField(){
    const input=document.getElementById('f_cat');
    if(input&&input.tagName!=='SELECT'){
      const select=document.createElement('select');select.id='f_cat';select.name='f_cat';input.replaceWith(select);
    }
    populateCategorySelect();
    addCategoryMasterButton();
  }

  function addCategoryMasterButton(){
    const select=document.getElementById('f_cat');const field=select?.closest('.field');
    if(!field||field.querySelector('[data-category-master]'))return;
    const tools=document.createElement('div');tools.className='category-tools';
    tools.innerHTML='<span>Master kategori proyek</span><button type="button" class="btn ghost category-master-btn" data-category-master>⚙ Kelola Kategori</button>';
    tools.querySelector('button').addEventListener('click',()=>window.openCategoryMaster());field.appendChild(tools);
  }

  function enhanceDateInput(id){
    const raw=document.getElementById(id);if(!raw||raw.type!=='date'||raw.dataset.uxDateEnhanced)return;
    raw.dataset.uxDateEnhanced='1';raw.classList.add('ux-date-native');
    const wrap=document.createElement('div');wrap.className='ux-date-wrap';raw.parentElement.insertBefore(wrap,raw);wrap.appendChild(raw);
    const display=document.createElement('input');display.type='text';display.readOnly=true;display.className='ux-date-display';display.id=id+'_display';display.placeholder='dd-Mmm-yyyy';
    display.value=formatDateId(raw.value);wrap.insertBefore(display,raw);
    raw.addEventListener('change',()=>{display.value=formatDateId(raw.value);refreshConfirm()});
  }

  function enhanceModalDates(){['f_date','f_start','f_end','pr_date','tx_date'].forEach(enhanceDateInput)}

  function refreshConfirm(){
    const name=document.getElementById('f_name')?.value.trim()||'-';
    const c=document.getElementById('f_contract');
    const start=document.getElementById('f_start')?.value||'';const end=document.getElementById('f_end')?.value||'';
    const cat=document.getElementById('f_cat')?.value||'-';
    const n=document.getElementById('uiPreviewName'),v=document.getElementById('uiPreviewContract'),p=document.getElementById('uiPreviewDates'),k=document.getElementById('uiPreviewCategory');
    if(n)n.textContent=name;
    if(v)v.textContent=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(c?.value||0));
    if(p)p.textContent=start||end?`${formatDateId(start)||'-'} s/d ${formatDateId(end)||'-'}`:'-';
    if(k)k.textContent=cat;
  }

  function setWizardStep(step){
    const safe=Math.max(1,Math.min(3,Number(step)||1));
    document.querySelectorAll('#modal .ui-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.target)===safe));
    document.querySelectorAll('#modal .ui-pane').forEach(el=>el.style.display=Number(el.dataset.pane)===safe?'block':'none');
    const next=document.getElementById('uiNext'),back=document.getElementById('uiBack'),save=document.getElementById('uiSaveProject');
    if(next)next.style.display=safe<3?'inline-flex':'none';
    if(back)back.style.display=safe>1?'inline-flex':'none';
    if(save)save.style.display=safe===3?'inline-flex':'none';
    window.__siKoyekProjectStep=safe;refreshConfirm();enhanceModalDates();
  }

  function activateWizardButtons(){
    const next=document.getElementById('uiNext'),back=document.getElementById('uiBack');
    if(next&&!next.dataset.formFixBound){
      next.dataset.formFixBound='1';next.removeAttribute('onclick');next.addEventListener('click',()=>{
        const step=Number(window.__siKoyekProjectStep||1),validation=document.getElementById('uiValidation');
        const code=document.getElementById('f_code')?.value.trim(),name=document.getElementById('f_name')?.value.trim();
        if(step===1&&(!code||!name)){if(validation){validation.textContent='Kode proyek dan nama proyek wajib diisi.';validation.classList.add('show')}return}
        if(step===2){const contract=Number(document.getElementById('f_contract')?.value||0),start=document.getElementById('f_start')?.value||'',end=document.getElementById('f_end')?.value||'';if(contract<0||(start&&end&&end<start)){if(validation){validation.textContent=contract<0?'Nilai kontrak tidak boleh negatif.':'Target selesai tidak boleh lebih awal dari tanggal mulai.';validation.classList.add('show')}return}}
        if(validation){validation.textContent='';validation.classList.remove('show')}setWizardStep(step+1);
      });
    }
    if(back&&!back.dataset.formFixBound){back.dataset.formFixBound='1';back.removeAttribute('onclick');back.addEventListener('click',()=>setWizardStep(Number(window.__siKoyekProjectStep||1)-1))}
  }

  function improveProjectWizard(){
    if(!document.getElementById('f_code'))return;
    replaceCategoryField();addCategoryMasterButton();activateWizardButtons();refreshConfirm();enhanceModalDates();
    ['f_name','f_contract','f_start','f_end','f_cat'].forEach(id=>{const el=document.getElementById(id);if(el&&!el.dataset.formFixInput){el.dataset.formFixInput='1';el.addEventListener('input',refreshConfirm);el.addEventListener('change',refreshConfirm)}});
    loadCategories();
  }

  window.nextProjectStep=()=>setWizardStep(Number(window.__siKoyekProjectStep||1)+1);
  window.prevProjectStep=()=>setWizardStep(Number(window.__siKoyekProjectStep||1)-1);

  window.saveProject=async function(){
    const row={project_code:document.getElementById('f_code')?.value.trim(),project_date:document.getElementById('f_date')?.value||null,project_name:document.getElementById('f_name')?.value.trim(),owner_name:document.getElementById('f_owner')?.value.trim()||null,category:document.getElementById('f_cat')?.value||null,location:document.getElementById('f_loc')?.value.trim()||null,contract_value:Number(document.getElementById('f_contract')?.value||0),start_date:document.getElementById('f_start')?.value||null,end_date:document.getElementById('f_end')?.value||null,project_manager:document.getElementById('f_mgr')?.value.trim()||null,status:document.getElementById('f_status')?.value||'RENCANA'};
    if(!row.project_code||!row.project_name){toast('Kode proyek dan nama proyek wajib diisi');return}
    const {error}=await sb.from('projects').insert(row);if(error){toast(error.code==='23505'?'Kode proyek sudah digunakan.':error.message);return}
    window.__projectFormSnapshot=null;closeModal();if(typeof loadSummary==='function')await loadSummary();if(typeof renderApp==='function')renderApp();toast('Proyek berhasil ditambahkan');
  };

  function captureProjectForm(){
    const ids=['f_code','f_date','f_name','f_owner','f_cat','f_loc','f_contract','f_mgr','f_start','f_end','f_status'];
    const values={};ids.forEach(id=>{const el=document.getElementById(id);if(el)values[id]=el.value});
    return {values,step:Number(window.__siKoyekProjectStep||1),category:document.getElementById('f_cat')?.value||''};
  }

  function restoreProjectForm(snapshot){
    if(!snapshot)return;window.openProjectForm();
    const apply=()=>{Object.entries(snapshot.values||{}).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val});populateCategorySelect();enhanceModalDates();setWizardStep(snapshot.step||1);refreshConfirm()};
    [30,120,300,600].forEach(ms=>setTimeout(apply,ms));
    setTimeout(()=>{window.__projectFormSnapshot=null},750);
  }

  async function renderCategoryMaster(){
    const list=document.getElementById('categoryMasterList');if(!list)return;
    list.innerHTML='<div class="empty">Memuat kategori...</div>';
    const {data,error}=await sb.from('project_categories').select('id,name,sort_order,is_active').order('sort_order',{ascending:true}).order('name',{ascending:true});
    if(error){list.innerHTML='<div class="empty">Gagal memuat master kategori.</div>';return}
    categoryCache=(data||[]).filter(x=>x.is_active!==false);
    list.innerHTML=categoryCache.map((x,i)=>`<div class="category-master-row"><div><strong>${esc(x.name)}</strong><span>Urutan ${i+1}</span></div><span class="pill green">AKTIF</span></div>`).join('')||'<div class="empty">Belum ada kategori.</div>';
    populateCategorySelect();
    const c=document.getElementById('categoryMasterCount');if(c)c.textContent=categoryCache.length+' kategori aktif';
  }

  window.closeCategoryMaster=function(){const snap=window.__projectFormSnapshot;closeModal();if(snap)restoreProjectForm(snap)};

  window.openCategoryMaster=function(){
    window.__projectFormSnapshot=captureProjectForm();
    modal('Master Kategori Proyek',`<div class="ui-help">Kelola daftar kategori yang digunakan pada seluruh proyek. Kategori yang ditambahkan di sini langsung tersedia pada dropdown proyek.</div><div class="category-master-add"><div class="field"><label>Nama Kategori Baru</label><input id="newCategoryName" placeholder="Contoh: Pembangunan Gedung"></div><button class="btn primary" type="button" onclick="addProjectCategory()">+ Tambah</button></div><div class="ui-total"><span>Daftar Kategori</span><strong id="categoryMasterCount">-</strong></div><div id="categoryMasterList" class="category-master-list"></div><div class="formactions"><button class="btn ghost" onclick="closeCategoryMaster()">Tutup & Kembali</button></div>`);
    renderCategoryMaster();
  };

  window.addProjectCategory=async function(){
    const input=document.getElementById('newCategoryName'),name=input?.value.trim();if(!name){toast('Nama kategori wajib diisi');return}
    const nextOrder=(categoryCache.length||0)+1;const {error}=await sb.from('project_categories').insert({name,sort_order:nextOrder,is_active:true});
    if(error){toast(error.code==='23505'?'Kategori sudah ada.':error.message);return}
    if(window.__projectFormSnapshot)window.__projectFormSnapshot.category=name;
    input.value='';toast('Kategori berhasil ditambahkan');await renderCategoryMaster();
  };

  const boot=()=>setTimeout(improveProjectWizard,20);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__formFixTimer);window.__formFixTimer=setTimeout(improveProjectWizard,100)});obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
