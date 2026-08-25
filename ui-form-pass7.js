(function(){
  function getProjectModal(){
    const modals=[...document.querySelectorAll('.modal')];
    return modals.find(m=>m.querySelector('#f_code,#f_name,.p6-form'))||modals[0]||null;
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
    const box=document.querySelector('#modal .modalbox');
    if(!box||!box.querySelector('#p6CatRows')||box.dataset.p6MasterShell==='1')return;
    const head=box.querySelector('.modalhead');
    if(!head)return;
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
    const box=document.querySelector('#modal .modalbox');
    if(!box||!box.querySelector('#p6CatRows'))return;
    box.querySelector('.modalhead button')?.remove();
  }

  function closeCategoryAndRestore(){
    const snap=window.__p6ProjectSnap;
    delete window.__p6ProjectSnap;
    const categoryModal=[...document.querySelectorAll('.modal')].reverse().find(m=>m.querySelector('#p6CatRows'));
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
