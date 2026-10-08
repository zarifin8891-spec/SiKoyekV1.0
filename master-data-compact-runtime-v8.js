(function(){
  const STYLE_ID='sikoyek-master-compact-runtime-v8';
  const BOX='md-master-compact-runtime-v8';
  const names=/kategori proyek|project manager|kategori keuangan|metode pembayaran/i;
  const titles=/^(tambah|edit|hapus)\b/i;
  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      #modal .modalbox.${BOX}{width:576px!important;min-width:576px!important;max-width:576px!important;height:auto!important;min-height:0!important;padding:0!important;margin:0!important;overflow:hidden!important;box-sizing:border-box!important;border:0!important;outline:0!important;box-shadow:none!important;border-radius:18px!important;background:#fff!important}
      #modal .modalbox.${BOX}>*{box-sizing:border-box!important;max-width:none!important}
      #modal .modalbox.${BOX} .modalhead{width:calc(100% + 40px)!important;max-width:none!important;height:82px!important;min-height:82px!important;margin:0 0 24px -20px!important;padding:16px 20px 16px 28px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border:0!important;outline:0!important;box-shadow:none!important;border-radius:18px 18px 0 0!important;background-clip:padding-box!important}
      #modal .modalbox.${BOX} .modalhead:before,#modal .modalbox.${BOX} .modalhead:after{display:none!important;content:none!important}
      #modal .modalbox.${BOX} .modalhead h3{margin:0!important;padding:0!important;font-size:22px!important;line-height:1.15!important;font-weight:750!important}
      #modal .modalbox.${BOX} .modalhead button{height:42px!important;min-height:42px!important;min-width:100px!important;padding:0 14px!important;border-radius:9px!important;font-size:12px!important}
      #modal .modalbox.${BOX} .field{width:calc(100% - 40px)!important;max-width:none!important;min-width:0!important;margin:0 20px 9px!important;padding:0!important;box-sizing:border-box!important}
      #modal .modalbox.${BOX} .formgrid{width:calc(100% - 40px)!important;max-width:none!important;margin:0 20px!important;padding:0!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px 11px!important;box-sizing:border-box!important}
      #modal .modalbox.${BOX} .formgrid .field{width:auto!important;max-width:none!important;margin:0!important}
      #modal .modalbox.${BOX} .field label{display:block!important;margin:0 0 4px!important;padding:0!important;font-size:12px!important;line-height:1.15!important;font-weight:650!important;color:#304059!important}
      #modal .modalbox.${BOX} .field input,#modal .modalbox.${BOX} .field select,#modal .modalbox.${BOX} .field textarea{width:100%!important;max-width:100%!important;height:40px!important;min-height:40px!important;padding:7px 10px!important;box-sizing:border-box!important;border:1px solid #cbd8e6!important;border-radius:8px!important;font-size:13px!important;line-height:1.2!important;box-shadow:none!important}
      #modal .modalbox.${BOX} .formactions{width:calc(100% - 40px)!important;max-width:none!important;height:58px!important;min-height:58px!important;margin:10px 20px 0!important;padding:8px 0!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;border:0!important;outline:0!important;box-shadow:none!important;background:#fff!important}
      #modal .modalbox.${BOX} .formactions .btn{height:38px!important;min-height:38px!important;min-width:100px!important;padding:0 13px!important;border-radius:8px!important;font-size:12px!important}
      #modal .modalbox.${BOX} p{margin:0 20px 12px!important;padding:0!important;font-size:13px!important;line-height:1.4!important}
      #modal .modalbox.${BOX} p.note{margin:0 20px 8px!important;font-size:11px!important}
      #modal .modalbox.${BOX} .field>div[style*="justify-content:space-between"]{padding:8px 10px!important;border-radius:8px!important}
      @media(max-width:620px){#modal .modalbox.${BOX}{width:calc(100vw - 28px)!important;min-width:0!important;max-width:none!important;border-radius:16px!important}#modal .modalbox.${BOX} .modalhead{width:calc(100% + 32px)!important;margin-left:-16px!important;padding-left:24px!important;border-radius:16px 16px 0 0!important}#modal .modalbox.${BOX} .field,#modal .modalbox.${BOX} .formgrid,#modal .modalbox.${BOX} .formactions{width:calc(100% - 32px)!important;margin-left:16px!important;margin-right:16px!important}}
      @media(max-width:520px){#modal .modalbox.${BOX} .formgrid{grid-template-columns:1fr!important}#modal .modalbox.${BOX} .modalhead h3{font-size:20px!important}}
    `;document.head.appendChild(s);
  }
  function moveUrutan(box){
    const candidates=Array.from(box.querySelectorAll('.field'));
    const urutan=candidates.find(f=>/^urutan\s*$/i.test((f.querySelector('label')?.textContent||'').trim()));
    if(!urutan)return;
    const parent=urutan.parentElement;
    if(!parent || parent===box || parent.classList.contains('modalhead') || parent.classList.contains('formactions'))return;
    const siblings=Array.from(parent.children).filter(el=>el.classList?.contains('field'));
    if(siblings.length<2)return;
    if(siblings[0]!==urutan)parent.insertBefore(urutan,siblings[0]);
  }
  function apply(){
    style();
    document.querySelectorAll('#modal .modalbox').forEach(box=>{
      const title=(box.querySelector('.modalhead h3')?.textContent||'').trim();
      if(!(titles.test(title)&&names.test(title)))return;
      box.classList.add(BOX);
      box.style.cssText += ';width:576px!important;min-width:576px!important;max-width:576px!important;height:auto!important;min-height:0!important;padding:0!important;margin:0!important;overflow:hidden!important;border:0!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;';
      const head=box.querySelector('.modalhead');
      if(head){head.style.cssText += ';width:calc(100% + 40px)!important;max-width:none!important;height:82px!important;min-height:82px!important;margin:0 0 24px -20px!important;padding:16px 20px 16px 28px!important;border:0!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;';}
      moveUrutan(box);
      box.querySelectorAll('input,select,textarea').forEach(el=>{el.style.setProperty('box-sizing','border-box','important');el.style.setProperty('height','40px','important');el.style.setProperty('min-height','40px','important');});
    });
  }
  function boot(){apply();new window.SiKoyekFoundation.Observer(()=>{clearTimeout(window.__mdCompactFinalTimer);window.__mdCompactFinalTimer=setTimeout(apply,10)}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();