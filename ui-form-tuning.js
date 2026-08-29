/* Final micro-tuning for Tambah Proyek Baru. */
(function(){
  const STYLE_ID='ui-form-tuning-css-v2';
  function apply(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Nominal/value: normal readable size, not oversized/bold. */
      #modal #uiFinalProject #f_contract,
      #modal #uiFinalProject input[type="number"]{
        font-size:12px!important;
        font-weight:500!important;
        text-align:right!important;
        line-height:1!important;
      }
      /* Command buttons: larger text, compact height, true vertical/horizontal centering. */
      #modal #uiFinalProject .ui-final-actions{
        align-items:center!important;
      }
      #modal #uiFinalProject .ui-final-actions button{
        height:34px!important;
        min-height:34px!important;
        padding:0 14px!important;
        margin:0!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        font-size:13px!important;
        line-height:1!important;
        font-weight:500!important;
        white-space:nowrap!important;
      }
      #modal #uiFinalProject .ui-final-actions .primary{
        font-size:13px!important;
        font-weight:500!important;
      }
      #modal #uiFinalProject .ui-final-close{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        font-size:13px!important;
        line-height:1!important;
        font-weight:500!important;
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
