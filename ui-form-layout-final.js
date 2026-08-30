/* Final project-form cleanup: keep approved Add layout, force Edit to same shell, remove Status field. */
(function(){
  const SCRIPT_ID='ui-form-layout-final-script';
  const STYLE_ID='ui-form-layout-final-style';

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Exact same desktop shell as approved Tambah Proyek. */
      #modal .modalbox.project-edit-final-shell{
        width:820px!important;
        min-width:820px!important;
        max-width:820px!important;
        max-height:calc(100vh - 24px)!important;
        overflow:hidden!important;
        padding:0!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.project-edit-final-shell > .p6-body{
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.project-edit-final-shell .p5-edit-layout-grid{
        width:calc(100% - 36px)!important;
        margin-left:18px!important;
        margin-right:18px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.project-edit-final-shell .p5-edit-layout-grid input,
      #modal .modalbox.project-edit-final-shell .p5-edit-layout-grid select{
        width:100%!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.project-edit-final-shell > .p6-body > .formactions{
        width:calc(100% - 36px)!important;
        margin-left:18px!important;
        margin-right:18px!important;
        box-sizing:border-box!important;
      }
      @media(max-width:900px){
        #modal .modalbox.project-edit-final-shell{
          width:calc(100vw - 18px)!important;
          min-width:0!important;
          max-width:none!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function removeStatusFromProjectForms(){
    document.querySelectorAll('#modal .modalbox').forEach(box=>{
      /* Remove only the actual Status field/inputs; do not alter stored project status. */
      box.querySelectorAll('#f_status,#p5_status').forEach(el=>el.closest('.field')?.remove() || el.remove());
      if((box.textContent||'').toLowerCase().includes('edit data proyek')){
        box.classList.add('project-edit-final-shell');
        box.style.setProperty('width','820px','important');
        box.style.setProperty('min-width','820px','important');
        box.style.setProperty('max-width','820px','important');
        box.style.setProperty('overflow','hidden','important');
        const body=box.querySelector(':scope > .p6-body');
        if(body){
          body.style.setProperty('width','100%','important');
          body.style.setProperty('padding','0','important');
          body.style.setProperty('margin','0','important');
          body.style.setProperty('overflow','hidden','important');
        }
      }
    });
  }

  function boot(){
    addStyle();
    removeStatusFromProjectForms();
    const obs=new MutationObserver(()=>{
      clearTimeout(window.__projectFormFinalTimer);
      window.__projectFormFinalTimer=setTimeout(removeStatusFromProjectForms,30);
    });
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
