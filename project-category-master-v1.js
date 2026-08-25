(function(){
  const fallback=['Renovasi','Bangun Baru','Interior','Instalasi','Pemeliharaan','Lainnya'];
  const table='project_categories';
  const safeText=s=>String(s??'').trim();
  const activeCategories=async()=>{
    try{
      const {data,error}=await sb.from(table).select('id,name,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(error)throw error;
      return data&&data.length?data:fallback.map((name,i)=>({id:`fallback-${i}`,name,sort_order:i+1,is_active:true}));
    }catch(e){
      return fallback.map((name,i)=>({id:`fallback-${i}`,name,sort_order:i+1,is_active:true}));
    }
  };
  const setOptions=(select,rows)=>{
    if(!select)return;
    const current=select.value;
    select.innerHTML='';
    rows.forEach(row=>{
      const option=document.createElement('option');
      option.value=row.name;
      option.textContent=row.name;
      select.appendChild(option);
    });
    if(rows.some(row=>row.name===current))select.value=current;
    else if(rows.length)select.value=rows[0].name;
  };
  async function refreshDropdown(){
    const select=document.getElementById('f_cat');
    if(!select||select.tagName!=='SELECT')return;
    setOptions(select,await activeCategories());
  }
  function ensureManageButton(){
    const select=document.getElementById('f_cat');
    if(!select||select.tagName!=='SELECT'||document.getElementById('manageCategoryBtn'))return;
    const field=select.closest('.field');
    if(!field)return;
    let wrap=field.querySelector('.category-master-row');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='category-master-row';
      select.parentNode.insertBefore(wrap,select);
      wrap.appendChild(select);
    }
    const button=document.createElement('button');
    button.id='manageCategoryBtn';
    button.type='button';
    button.className='btn ghost category-master-btn';
    button.textContent='⚙ Kelola';
    button.addEventListener('click',openManager);
    wrap.appendChild(button);
  }
  async function openManager(){
    const {data,error}=await sb.from(table).select('id,name,sort_order,is_active').order('sort_order',{ascending:true}).order('name',{ascending:true});
    if(error){toast(error.message);return;}
    const rows=data||[];
    modal('Master Kategori Proyek',`
      <div class="ui-help">Kategori proyek adalah master data. Kategori aktif akan muncul pada dropdown Tambah Proyek.</div>
      <div class="category-master-add">
        <div class="field"><label>Nama Kategori Baru</label><input id="newProjectCategory" placeholder="Contoh: Perumahan"></div>
        <button class="btn primary" id="addProjectCategory">+ Tambah</button>
      </div>
      <div class="category-master-list">
        ${rows.map(row=>`<div class="category-master-item ${row.is_active?'':'is-inactive'}"><div><strong>${esc(row.name)}</strong><span>${row.is_active?'Aktif':'Tidak aktif'}</span></div><button class="btn ghost" type="button" data-toggle-category="${row.id}" data-active="${row.is_active}">${row.is_active?'Nonaktifkan':'Aktifkan'}</button></div>`).join('')}
      </div>
      <div class="formactions"><button class="btn ghost" onclick="closeModal()">Tutup</button></div>
    `);
    document.getElementById('addProjectCategory')?.addEventListener('click',addCategory);
    document.querySelectorAll('[data-toggle-category]').forEach(btn=>btn.addEventListener('click',async()=>toggleCategory(btn)));
  }
  async function addCategory(){
    const input=document.getElementById('newProjectCategory');
    const name=safeText(input?.value);
    if(!name){toast('Nama kategori wajib diisi');return;}
    const {data:dup}=await sb.from(table).select('id,name').ilike('name',name).limit(1);
    if(dup&&dup.length){toast('Kategori tersebut sudah ada');return;}
    const {data:maxRows}=await sb.from(table).select('sort_order').order('sort_order',{ascending:false}).limit(1);
    const sort=(Number(maxRows?.[0]?.sort_order)||0)+1;
    const {error}=await sb.from(table).insert({name,sort_order:sort,is_active:true});
    if(error){toast(error.message);return;}
    toast('Kategori berhasil ditambahkan');
    await refreshDropdown();
    closeModal();
    setTimeout(ensureManageButton,60);
  }
  async function toggleCategory(btn){
    const id=btn.dataset.toggleCategory;
    const current=btn.dataset.active==='true';
    const {error}=await sb.from(table).update({is_active:!current}).eq('id',id);
    if(error){toast(error.message);return;}
    toast(current?'Kategori dinonaktifkan':'Kategori diaktifkan');
    await refreshDropdown();
    openManager();
  }
  async function enhance(){
    const select=document.getElementById('f_cat');
    if(!select||select.tagName!=='SELECT')return;
    await refreshDropdown();
    ensureManageButton();
  }
  const boot=()=>setTimeout(enhance,70);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const observer=new MutationObserver(()=>{clearTimeout(window.__categoryMasterTimer);window.__categoryMasterTimer=setTimeout(enhance,120)});
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
