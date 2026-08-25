(function(){
  function getCategoryModal(){
    const modals=[...document.querySelectorAll('.modal')];
    return [...modals].reverse().find(m=>m.querySelector('#p6CatRows'))||null;
  }

  function getProjectModal(){
    const modals=[...document.querySelectorAll('.modal')];
    return modals.find(m=>m.querySelector('#f_code,#f_name'))||null;
  }

  function restoreSnapshot(s){
    if(!s)return;
    const modal=getProjectModal();
    if(!modal)return;
    Object.entries(s.values||{}).forEach(([id,value])=>{
      const el=modal.querySelector('#'+id);
      if(el)el.value=value;
    });
    const cat=modal.querySelector('#f_cat');
    if(cat&&s.values?.f_cat)cat.value=s.values.f_cat;
    const step=s.step||1;
    window.__siKoyekProjectStep=step;
    modal.querySelectorAll('.ui-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.target)===Number(step)));
    modal.querySelectorAll('.ui-pane').forEach(x=>x.style.display=Number(x.dataset.pane)===Number(step)?'block':'none');
  }

  function formifyCategoryMaster(){
    const box=getCategoryModal()?.querySelector('.modalbox');
    if(!box||box.dataset.p6MasterShell==='1')return;
    const side=document.createElement('aside');
    side.className='p6-side p6-category-side';
    side.innerHTML='<div class="p6-mark">MASTER DATA</div><div class="p6-title">Kategori proyek</div><div class="p6-desc">Kelola kategori proyek sebagai master data terpusat.</div><div class="p6-hint">Edit, nonaktifkan, atau aktifkan kembali tanpa merusak histori.</div>';
    const body=document.createElement('div');
    body.className='p6-body';
    while(box.firstChild)body.appendChild(box.firstChild);
    box.appendChild(side);
    box.appendChild(body);
    box.dataset.p6MasterShell='1';
    box.classList.add('p6-form','p6-master');
  }

  function hideCategoryTopClose(){
    const box=getCategoryModal()?.querySelector('.modalbox');
    if(!box)return;
    box.querySelector('.modalhead button')?.remove();
  }

  function openCategoryMaster(){
    window.__p6ProjectSnap=typeof window.p6ProjectSnapshot==='function'?window.p6ProjectSnapshot():window.__p6ProjectSnap;
    if(!window.__p6ProjectSnap){
      const ids=['f_code','f_date','f_name','f_owner','f_cat','f_loc','f_contract','f_mgr','f_start','f_end','f_status'];
      const values={};
      ids.forEach(id=>{const el=getProjectModal()?.querySelector('#'+id);if(el)values[id]=el.value});
      window.__p6ProjectSnap={values,step:Number(window.__siKoyekProjectStep||1)};
    }
    modal('Master Kategori Proyek',`<div class="ui-help">Daftar ini membaca seluruh kategori langsung dari database. Nonaktifkan kategori untuk menghapusnya dari dropdown tanpa menghapus histori proyek.</div><div class="category-master-toolbar"><div class="field"><label>Nama Kategori Baru</label><input id="p6NewCat" placeholder="Contoh: Pembangunan Gedung"></div><button class="btn primary" type="button" onclick="p6AddCat()">+ Tambah</button></div><div class="p6-category-table"><div class="p6-category-head"><div>Nama Kategori</div><div>Status</div><div>Aksi</div></div><div id="p6CatRows"></div></div><div class="formactions"><button class="btn ghost" type="button" onclick="p6CloseCategoryMaster()">Tutup & Kembali</button></div>`);
    hideCategoryTopClose();
    if(typeof window.renderMaster==='function')window.renderMaster();
    else if(typeof renderMaster==='function')renderMaster();
  }

  function closeCategoryAndRestore(){
    const snap=window.__p6ProjectSnap;
    delete window.__p6ProjectSnap;
    const categoryModal=getCategoryModal();
    if(categoryModal)categoryModal.remove();
    const projectModal=getProjectModal();
    if(projectModal){
      restoreSnapshot(snap);
      return;
    }
    if(typeof window.openProjectForm==='function'){
      window.openProjectForm();
      setTimeout(()=>restoreSnapshot(snap),120);
    }
  }

  function install(){
    formifyCategoryMaster();
    hideCategoryTopClose();
    if(typeof window.p6OpenCategoryMaster==='function')window.p6OpenCategoryMaster=openCategoryMaster;
    if(typeof window.p6CloseCategoryMaster==='function'){
      window.p6CloseCategoryMaster=closeCategoryAndRestore;
      window.__p6Pass7Installed=true;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,100);
  const obs=new MutationObserver(()=>{clearTimeout(window.__p7t);window.__p7t=setTimeout(install,40)});
  obs.observe(document.body,{childList:true,subtree:true});
})();
