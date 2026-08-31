/* SiKoyek V1.0 — compact Master Data CRUD modals. */
(function(){
  const STYLE_ID='sikoyek-master-edit-compact-v1-style';
  const BOX_CLASS='md-master-compact-modal';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #modal .modalbox.${BOX_CLASS}{width:576px!important;min-width:576px!important;max-width:576px!important;height:auto!important;min-height:0!important;max-height:calc(100vh - 24px)!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important;border-radius:18px!important;background:#fff!important}
      #modal .modalbox.${BOX_CLASS} .modalhead{width:100%!important;height:95px!important;min-height:95px!important;margin:0!important;padding:18px 20px 18px 28px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-radius:18px 18px 0 0!important}
      #modal .modalbox.${BOX_CLASS} .modalhead h3{margin:0!important;padding:0!important;font-size:25px!important;line-height:1.1!important;font-weight:750!important}
      #modal .modalbox.${BOX_CLASS} .modalhead button{height:48px!important;min-height:48px!important;min-width:112px!important;padding:0 18px!important;border-radius:11px!important;font-size:14px!important}
      #modal .modalbox.${BOX_CLASS} .p6-body,#modal .modalbox.${BOX_CLASS} .p5-body{width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important}
      #modal .modalbox.${BOX_CLASS} > .field,#modal .modalbox.${BOX_CLASS} .p6-body > .field,#modal .modalbox.${BOX_CLASS} > .formgrid,#modal .modalbox.${BOX_CLASS} .p6-body > .formgrid{width:calc(100% - 40px)!important;max-width:none!important;margin-left:20px!important;margin-right:20px!important;box-sizing:border-box!important}
      #modal .modalbox.${BOX_CLASS} .field{min-width:0!important;margin-bottom:8px!important}
      #modal .modalbox.${BOX_CLASS} .field label{display:block!important;margin:0 0 4px!important;font-size:12px!important;line-height:1.15!important;font-weight:650!important}
      #modal .modalbox.${BOX_CLASS} .field input,#modal .modalbox.${BOX_CLASS} .field select,#modal .modalbox.${BOX_CLASS} .field textarea{width:100%!important;height:42px!important;min-height:42px!important;padding:7px 11px!important;border:1px solid #cbd8e6!important;border-radius:9px!important;font-size:14px!important;box-sizing:border-box!important;box-shadow:none!important}
      #modal .modalbox.${BOX_CLASS} .field textarea{height:60px!important;min-height:60px!important;resize:none!important}
      #modal .modalbox.${BOX_CLASS} .formgrid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px 11px!important}
      #modal .modalbox.${BOX_CLASS} .formgrid .field{margin-bottom:0!important}
      #modal .modalbox.${BOX_CLASS} .formactions{width:calc(100% - 40px)!important;min-height:64px!important;height:64px!important;margin:9px 20px 0!important;padding:10px 0!important;border-top:1px solid #e8edf3!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;box-sizing:border-box!important}
      #modal .modalbox.${BOX_CLASS} .formactions .btn{height:43px!important;min-height:43px!important;min-width:118px!important;padding:0 16px!important;border-radius:9px!important;font-size:13px!important}
      #modal .modalbox.${BOX_CLASS} p{margin:14px 20px 5px!important;font-size:13px!important;line-height:1.4!important}
      #modal .modalbox.${BOX_CLASS} p.note{margin:0 20px 8px!important;font-size:11px!important}
      #modal .modalbox.${BOX_CLASS} .field>div[style*="justify-content:space-between"]{padding:8px 10px!important;border-radius:8px!important;gap:9px!important}
      #modal .modalbox.${BOX_CLASS} .field>div[style*="justify-content:space-between"] .btn{height:32px!important;min-height:32px!important;min-width:96px!important;font-size:11px!important}
      /* Urutan selalu berada di field paling atas. */
      #modal .modalbox.${BOX_CLASS} .field[data-master-field="urutan"]{order:-10!important}
      #modal .modalbox.${BOX_CLASS} .formgrid .field[data-master-field="urutan"]{order:-10!important}
      @media(max-width:620px){#modal .modalbox.${BOX_CLASS}{width:calc(100vw - 28px)!important;min-width:0!important;max-width:none!important;border-radius:16px!important}#modal .modalbox.${BOX_CLASS} .modalhead{border-radius:16px 16px 0 0!important;padding-left:24px!important}}
      @media(max-width:520px){#modal .modalbox.${BOX_CLASS} .modalhead{height:82px!important;min-height:82px!important;padding:15px 16px 15px 20px!important}#modal .modalbox.${BOX_CLASS} .modalhead h3{font-size:21px!important}#modal .modalbox.${BOX_CLASS} .formgrid{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s);
  }
  function markUrutan(box){
    box.querySelectorAll('.field').forEach(f=>{const label=(f.querySelector('label')?.textContent||'').trim().toLowerCase();if(label==='urutan')f.setAttribute('data-master-field','urutan')});
  }
  function isMasterCrud(box){const title=(box?.querySelector('.modalhead h3')?.textContent||'').trim().toLowerCase();return /^(edit|hapus|tambah)\b/.test(title)&&/kategori proyek|project manager|kategori keuangan|metode pembayaran/.test(title)}
  function decorate(){const box=document.querySelector('#modal .modalbox');if(!isMasterCrud(box))return;addStyle();markUrutan(box);box.classList.add(BOX_CLASS);box.style.setProperty('width','576px','important');box.style.setProperty('min-width','576px','important');box.style.setProperty('max-width','576px','important');box.style.setProperty('height','auto','important');box.style.setProperty('padding','0','important');box.style.setProperty('overflow','hidden','important')}
  function boot(){addStyle();decorate();new MutationObserver(()=>{clearTimeout(window.__sikoyekMasterCompactTimer);window.__sikoyekMasterCompactTimer=setTimeout(decorate,20)}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
