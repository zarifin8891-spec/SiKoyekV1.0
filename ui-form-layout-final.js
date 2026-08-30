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

      /* Item Pekerjaan: compact standalone geometry. */
      #modal .modalbox.p6-form:has(#wi_name){
        width:700px!important;
        min-width:700px!important;
        max-width:700px!important;
        max-height:calc(100vh - 24px)!important;
        height:auto!important;
        padding:0!important;
        overflow:hidden!important;
        display:block!important;
        grid-template-columns:none!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-side{display:none!important}
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body{
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        max-height:none!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
        background:#fff!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead{
        width:100%!important;
        height:76px!important;
        min-height:76px!important;
        margin:0!important;
        padding:13px 24px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        border:0!important;
        border-radius:22px 22px 0 0!important;
        background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;
        color:#fff!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead h3{
        display:block!important;
        visibility:visible!important;
        margin:0!important;
        color:#fff!important;
        font-size:20px!important;
        line-height:1.1!important;
        font-weight:750!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead::after{
        content:'Isi data item pekerjaan dan bobotnya.'!important;
        position:absolute!important;
        left:24px!important;
        bottom:12px!important;
        color:rgba(255,255,255,.82)!important;
        font-size:10px!important;
        line-height:1.2!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead button{
        height:38px!important;
        min-height:38px!important;
        min-width:84px!important;
        padding:0 16px!important;
        margin:0!important;
        border-radius:9px!important;
        background:#fff!important;
        color:#0d294a!important;
        border:1px solid #fff!important;
        font-size:13px!important;
        font-weight:500!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-help{
        margin:16px 22px 10px!important;
        padding:10px 12px!important;
        border:1px solid #dfe8f0!important;
        border-radius:12px!important;
        background:#f5f9fc!important;
        color:#627189!important;
        font-size:12px!important;
        line-height:1.4!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.field,
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formgrid,
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-total{
        width:auto!important;
        margin-left:22px!important;
        margin-right:22px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formgrid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:10px!important;
        margin-top:0!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body .field{
        min-width:0!important;
        margin-top:0!important;
        margin-bottom:10px!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body .field label{
        display:block!important;
        margin:0 0 4px!important;
        color:#304059!important;
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:650!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body .field input,
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body .field textarea{
        width:100%!important;
        box-sizing:border-box!important;
        border:1px solid #cbd8e6!important;
        border-radius:9px!important;
        background:#fff!important;
        color:#172033!important;
        font-size:13px!important;
        font-weight:400!important;
        box-shadow:none!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body #wi_name{
        height:38px!important;
        min-height:38px!important;
        padding:6px 10px!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body #wi_weight,
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body #wi_sort{
        height:38px!important;
        min-height:38px!important;
        padding:6px 10px!important;
        text-align:right!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body #wi_notes{
        min-height:62px!important;
        height:62px!important;
        padding:8px 10px!important;
        resize:none!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-total{
        min-height:48px!important;
        height:48px!important;
        margin-top:0!important;
        margin-bottom:10px!important;
        padding:0 12px!important;
        border:1px solid #d8e2ec!important;
        border-radius:10px!important;
        background:#fff!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-total span{
        font-size:13px!important;
        color:#29374d!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-total strong{
        font-size:17px!important;
        line-height:1!important;
        color:#13243d!important;
        font-weight:750!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formactions{
        width:auto!important;
        height:52px!important;
        min-height:52px!important;
        margin:8px 22px 0!important;
        padding:7px 0 8px!important;
        border-top:1px solid #e8edf3!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:7px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formactions .btn{
        width:104px!important;
        min-width:104px!important;
        height:34px!important;
        min-height:34px!important;
        padding:0 12px!important;
        border-radius:8px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        font-size:12px!important;
        line-height:1!important;
        font-weight:500!important;
      }
      #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formactions .btn.primary{
        background:#0b2e52!important;
        border-color:#0b2e52!important;
        color:#fff!important;
      }
      @media(max-width:730px){
        #modal .modalbox.p6-form:has(#wi_name){
          width:calc(100vw - 20px)!important;
          min-width:0!important;
          max-width:none!important;
        }
      }
      @media(max-width:520px){
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead{padding:11px 14px!important;height:70px!important;min-height:70px!important;border-radius:16px 16px 0 0!important}
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead h3{font-size:18px!important}
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.modalhead::after{left:14px!important;bottom:10px!important;font-size:9px!important}
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-help,
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.field,
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formgrid,
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.ui-total,
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formactions{margin-left:14px!important;margin-right:14px!important}
        #modal .modalbox.p6-form:has(#wi_name)>.p6-body>.formgrid{grid-template-columns:1fr!important}
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