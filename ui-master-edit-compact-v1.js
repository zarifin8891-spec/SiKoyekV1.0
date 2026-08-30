/* SiKoyek V1.0 — compact Master Data Edit/Hapus modals.
   Applies only to Master Data CRUD dialogs: Kategori Proyek,
   Project Manager, Kategori Keuangan, and Metode Pembayaran. */
(function(){
  const STYLE_ID='sikoyek-master-edit-compact-v1-style';
  const BOX_CLASS='md-master-compact-modal';

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Keep these dialogs genuinely compact even when other modal passes set a huge width. */
      #modal .modalbox.${BOX_CLASS}{
        width:460px!important;
        min-width:460px!important;
        max-width:460px!important;
        height:auto!important;
        min-height:0!important;
        max-height:calc(100vh - 36px)!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
        border-radius:16px!important;
        background:#fff!important;
      }
      #modal .modalbox.${BOX_CLASS} .p6-body,
      #modal .modalbox.${BOX_CLASS} .p5-body{
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.${BOX_CLASS} .modalhead{
        width:100%!important;
        height:62px!important;
        min-height:62px!important;
        margin:0!important;
        padding:10px 16px!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        border-radius:16px 16px 0 0!important;
      }
      #modal .modalbox.${BOX_CLASS} .modalhead h3{
        margin:0!important;
        font-size:17px!important;
        line-height:1.15!important;
        font-weight:750!important;
      }
      #modal .modalbox.${BOX_CLASS} .modalhead button{
        height:32px!important;
        min-height:32px!important;
        min-width:72px!important;
        padding:0 12px!important;
        border-radius:8px!important;
        font-size:11px!important;
      }
      #modal .modalbox.${BOX_CLASS} > .field,
      #modal .modalbox.${BOX_CLASS} .p6-body > .field,
      #modal .modalbox.${BOX_CLASS} > .formgrid,
      #modal .modalbox.${BOX_CLASS} .p6-body > .formgrid{
        width:calc(100% - 32px)!important;
        max-width:none!important;
        margin-left:16px!important;
        margin-right:16px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.${BOX_CLASS} .field{
        min-width:0!important;
        margin-top:0!important;
        margin-bottom:7px!important;
      }
      #modal .modalbox.${BOX_CLASS} .field label{
        display:block!important;
        margin:0 0 3px!important;
        color:#304059!important;
        font-size:10px!important;
        line-height:1.15!important;
        font-weight:650!important;
      }
      #modal .modalbox.${BOX_CLASS} .field input,
      #modal .modalbox.${BOX_CLASS} .field select,
      #modal .modalbox.${BOX_CLASS} .field textarea{
        width:100%!important;
        height:34px!important;
        min-height:34px!important;
        padding:5px 9px!important;
        border:1px solid #cbd8e6!important;
        border-radius:7px!important;
        background:#fff!important;
        color:#172033!important;
        font-size:12px!important;
        line-height:1.2!important;
        box-sizing:border-box!important;
        box-shadow:none!important;
      }
      #modal .modalbox.${BOX_CLASS} .field textarea{
        height:52px!important;
        min-height:52px!important;
        resize:none!important;
      }
      #modal .modalbox.${BOX_CLASS} .formgrid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:7px 9px!important;
        margin-top:10px!important;
      }
      #modal .modalbox.${BOX_CLASS} .formgrid .field{margin-bottom:0!important}
      #modal .modalbox.${BOX_CLASS} .formgrid + .formactions{margin-top:9px!important}
      #modal .modalbox.${BOX_CLASS} .formactions{
        width:calc(100% - 32px)!important;
        min-height:46px!important;
        height:46px!important;
        margin:5px 16px 0!important;
        padding:7px 0 7px!important;
        border-top:1px solid #e8edf3!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.${BOX_CLASS} .formactions .btn{
        height:32px!important;
        min-height:32px!important;
        min-width:82px!important;
        padding:0 11px!important;
        border-radius:7px!important;
        font-size:11px!important;
        line-height:1!important;
        font-weight:500!important;
      }
      #modal .modalbox.${BOX_CLASS} p{
        margin:12px 16px 4px!important;
        font-size:12px!important;
        line-height:1.4!important;
      }
      #modal .modalbox.${BOX_CLASS} p.note{
        margin:0 16px 7px!important;
        font-size:10px!important;
      }
      /* Finance Edit status block */
      #modal .modalbox.${BOX_CLASS} .md-fin-status{
        font-size:9px!important;
        padding:3px 6px!important;
      }
      #modal .modalbox.${BOX_CLASS} .field > div[style*="justify-content:space-between"]{
        padding:7px 8px!important;
        border-radius:7px!important;
        gap:8px!important;
      }
      #modal .modalbox.${BOX_CLASS} .field > div[style*="justify-content:space-between"] .btn{
        height:28px!important;
        min-height:28px!important;
        min-width:84px!important;
        padding:0 9px!important;
        font-size:10px!important;
      }
      @media(max-width:520px){
        #modal .modalbox.${BOX_CLASS}{
          width:calc(100vw - 24px)!important;
          min-width:0!important;
          max-width:none!important;
          border-radius:14px!important;
        }
        #modal .modalbox.${BOX_CLASS} .modalhead{border-radius:14px 14px 0 0!important}
        #modal .modalbox.${BOX_CLASS} .formgrid{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }

  function isMasterCrud(box){
    if(!box)return false;
    const title=(box.querySelector('.modalhead h3')?.textContent||'').trim().toLowerCase();
    if(!/^(edit|hapus)\b/.test(title))return false;
    return /kategori proyek|project manager|kategori keuangan|metode pembayaran/.test(title);
  }

  function decorate(){
    const box=document.querySelector('#modal .modalbox');
    if(!isMasterCrud(box))return;
    addStyle();
    box.classList.add(BOX_CLASS);
    box.style.setProperty('width','460px','important');
    box.style.setProperty('min-width','460px','important');
    box.style.setProperty('max-width','460px','important');
    box.style.setProperty('height','auto','important');
    box.style.setProperty('min-height','0','important');
    box.style.setProperty('padding','0','important');
    box.style.setProperty('overflow','hidden','important');
  }

  function boot(){
    addStyle();
    decorate();
    const obs=new MutationObserver(()=>{clearTimeout(window.__sikoyekMasterCompactTimer);window.__sikoyekMasterCompactTimer=setTimeout(decorate,20)});
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
