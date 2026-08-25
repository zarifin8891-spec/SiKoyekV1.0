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

  function closeCategoryAndRestore(){
    const snap=window.__p6ProjectSnap;
    delete window.__p6ProjectSnap;

    // Two modal instances are stacked here: the original project modal and
    // the category-master modal above it. Do not call closeModal(), because
    // it uses the duplicate #modal id and can remove the wrong (underlying)
    // project modal. Remove the category-master instance directly.
    const categoryModal=[...document.querySelectorAll('.modal')]
      .reverse()
      .find(m=>m.querySelector('#p6CatRows'));
    if(categoryModal)categoryModal.remove();

    const projectModal=getProjectModal();
    if(projectModal){
      restoreSnapshot(snap);
      return;
    }

    // Defensive fallback only if the original project modal truly vanished.
    if(typeof window.openProjectForm==='function'){
      window.openProjectForm();
      setTimeout(()=>restoreSnapshot(snap),120);
    }
  }

  function install(){
    if(typeof window.p6CloseCategoryMaster==='function'){
      window.p6CloseCategoryMaster=closeCategoryAndRestore;
      window.__p6Pass7Installed=true;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,100);
})();
