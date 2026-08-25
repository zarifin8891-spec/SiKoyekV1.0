(function(){
  const ids=['f_code','f_date','f_name','f_owner','f_cat','f_loc','f_contract','f_mgr','f_start','f_end','f_status'];

  function restoreSnapshot(s){
    if(!s)return;
    const box=document.querySelector('#modal .modalbox');
    if(!box)return;
    Object.entries(s.values||{}).forEach(([id,value])=>{
      const el=document.getElementById(id);
      if(el)el.value=value;
    });
    const cat=document.getElementById('f_cat');
    if(cat&&s.values?.f_cat)cat.value=s.values.f_cat;
    const step=s.step||1;
    window.__siKoyekProjectStep=step;
    document.querySelectorAll('#modal .ui-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.target)===Number(step)));
    document.querySelectorAll('#modal .ui-pane').forEach(x=>x.style.display=Number(x.dataset.pane)===Number(step)?'block':'none');
  }

  function closeCategoryAndRestore(){
    const snap=window.__p6ProjectSnap;
    delete window.__p6ProjectSnap;
    if(typeof window.closeModal==='function')window.closeModal();
    setTimeout(()=>{
      // The project modal underneath is still the live modal. Do not call
      // openProjectForm() here, otherwise a second project modal is created.
      const existing=document.querySelector('#modal .modalbox');
      if(existing){
        restoreSnapshot(snap);
        return;
      }
      // Defensive fallback only when no underlying project modal exists.
      if(typeof window.openProjectForm==='function'){
        window.openProjectForm();
        setTimeout(()=>restoreSnapshot(snap),120);
      }
    },20);
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
