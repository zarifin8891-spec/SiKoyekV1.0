/* SiKoyek V1.0 — compact Isi RAP form. */
(function(){
  const STYLE_ID='ui-rap-compact-style';
  function normalize(){
    const box=document.querySelector('#modal .modalbox:has(#rap_material)');
    if(!box)return;
    box.style.width='560px';
    box.style.maxWidth='calc(100vw - 32px)';
    box.style.padding='0';
    box.style.boxSizing='border-box';
    box.style.overflow='hidden';
    box.querySelectorAll('.note').forEach(el=>el.remove());
    box.querySelectorAll(':scope > *').forEach(el=>{
      el.style.boxSizing='border-box';
      el.style.maxWidth='none';
    });
  }
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #modal .modalbox:has(#rap_material){
        width:min(560px,calc(100vw - 32px))!important;
        max-width:560px!important;
        max-height:calc(100vh - 32px)!important;
        padding:0!important;
        margin:0!important;
        box-sizing:border-box!important;
        border-radius:18px!important;
        overflow:hidden!important;
      }
      #modal .modalbox:has(#rap_material)>*{
        box-sizing:border-box!important;
        max-width:none!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead{
        width:100%!important;
        margin:0!important;
        padding:18px!important;
        min-height:72px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        border-radius:18px 18px 0 0!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead h3{
        margin:0!important;
        font-size:20px!important;
        line-height:1.1!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead .btn{
        height:34px!important;
        min-height:34px!important;
        min-width:78px!important;
        padding:0 12px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:13px!important;
        font-weight:500!important;
      }
      #modal .modalbox:has(#rap_material)>.ui-help{
        width:auto!important;
        margin:18px 18px 0!important;
      }
      #modal .modalbox:has(#rap_material) .formgrid{
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:10px!important;
        width:auto!important;
        margin:0 18px!important;
      }
      #modal .modalbox:has(#rap_material) .field{
        min-width:0!important;
        margin:0!important;
      }
      #modal .modalbox:has(#rap_material) .field label{
        display:block!important;
        margin:0 0 4px!important;
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:600!important;
        color:#40506a!important;
      }
      #modal .modalbox:has(#rap_material) .field input{
        width:100%!important;
        height:38px!important;
        min-height:38px!important;
        padding:6px 9px!important;
        border:1px solid #cbd9e8!important;
        border-radius:8px!important;
        background:#fff!important;
        color:#172033!important;
        font-size:13px!important;
        font-weight:400!important;
        text-align:right!important;
      }
      #modal .modalbox:has(#rap_material) .field input:focus{
        border-color:#8aa9c6!important;
        box-shadow:none!important;
        outline:none!important;
      }
      #modal .modalbox:has(#rap_material)>.note,
      #modal .modalbox:has(#rap_material) .note{display:none!important}
      #modal .modalbox:has(#rap_material)>.formactions{
        width:auto!important;
        height:54px!important;
        min-height:54px!important;
        margin:12px 18px 0!important;
        padding:8px 0 10px!important;
        border-top:1px solid #e6ebf1!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:7px!important;
      }
      #modal .modalbox:has(#rap_material)>.formactions .btn{
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
        font-size:13px!important;
        line-height:1!important;
        font-weight:500!important;
      }
      #modal .modalbox:has(#rap_material)>.formactions .btn.primary{
        background:#0b2e52!important;
        border-color:#0b2e52!important;
        color:#fff!important;
      }
      @media(max-width:620px){
        #modal .modalbox:has(#rap_material){width:calc(100vw - 20px)!important}
        #modal .modalbox:has(#rap_material) .formgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
      @media(max-width:430px){
        #modal .modalbox:has(#rap_material) .formgrid{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){
    addStyle();
    normalize();
    const observer=new MutationObserver(normalize);
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
