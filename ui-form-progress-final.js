/* Final standalone renderer for Input Progress. Unwraps the legacy p6 shell before sizing. */
(function(){
  const STYLE_ID='ui-form-progress-final-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #modal .modalbox.progress-final-shell{width:760px!important;min-width:760px!important;max-width:760px!important;max-height:calc(100vh - 24px)!important;height:auto!important;margin:0!important;padding:0!important;overflow:hidden!important;display:block!important;box-sizing:border-box!important;border-radius:20px!important;background:#fff!important}
      #modal .modalbox.progress-final-shell>.modalhead{width:100%!important;height:76px!important;min-height:76px!important;margin:0!important;padding:13px 24px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;border:0!important;border-radius:20px 20px 0 0!important;background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;color:#fff!important}
      #modal .modalbox.progress-final-shell>.modalhead h3{margin:0!important;color:#fff!important;font-size:20px!important;line-height:1.1!important;font-weight:650!important}
      #modal .modalbox.progress-final-shell>.modalhead::after{content:'Isi data progress berdasarkan Item Pekerjaan.'!important;position:absolute!important;left:24px!important;bottom:12px!important;color:rgba(255,255,255,.82)!important;font-size:10px!important;line-height:1.2!important}
      #modal .modalbox.progress-final-shell>.modalhead button{height:38px!important;min-height:38px!important;min-width:84px!important;padding:0 16px!important;margin:0!important;border-radius:9px!important;background:#fff!important;color:#0d294a!important;border:1px solid #fff!important;font-size:13px!important;font-weight:500!important;display:inline-flex!important;align-items:center!important;justify-content:center}
      #modal .modalbox.progress-final-shell>.ui-help,#modal .modalbox.progress-final-shell>.field,#modal .modalbox.progress-final-shell>.formgrid,#modal .modalbox.progress-final-shell>.ui-progress-card,#modal .modalbox.progress-final-shell>.formactions{width:calc(100% - 44px)!important;max-width:none!important;box-sizing:border-box!important;margin-left:22px!important;margin-right:22px!important}
      #modal .modalbox.progress-final-shell>.ui-help{margin-top:14px!important;margin-bottom:9px!important;padding:9px 12px!important;border:1px solid #dfe8f0!important;border-radius:11px!important;background:#f5f9fc!important;color:#627189!important;font-size:11px!important;line-height:1.35!important}
      #modal .modalbox.progress-final-shell>.formgrid{display:grid!important;grid-template-columns:1fr 1.4fr!important;gap:9px!important;margin-top:0!important;margin-bottom:9px!important;padding:0!important}
      #modal .modalbox.progress-final-shell>.formgrid .field{min-width:0!important;margin:0!important}
      #modal .modalbox.progress-final-shell .field label{display:block!important;margin:0 0 3px!important;color:#304059!important;font-size:11px!important;line-height:1.2!important;font-weight:650!important}
      #modal .modalbox.progress-final-shell .field input,#modal .modalbox.progress-final-shell .field select,#modal .modalbox.progress-final-shell .field textarea{width:100%!important;box-sizing:border-box!important;border:1px solid #cbd8e6!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-size:13px!important;font-weight:400!important;box-shadow:none!important}
      #modal .modalbox.progress-final-shell #pr_date,#modal .modalbox.progress-final-shell #pr_item,#modal .modalbox.progress-final-shell #pr_pct{height:38px!important;min-height:38px!important;padding:6px 10px!important}
      #modal .modalbox.progress-final-shell #pr_pct{text-align:right!important;font-weight:500!important}
      #modal .modalbox.progress-final-shell>.formgrid .field:nth-child(3){grid-column:1 / span 1!important}
      #modal .modalbox.progress-final-shell>.field{margin-bottom:9px!important}
      #modal .modalbox.progress-final-shell #pr_notes{height:58px!important;min-height:58px!important;padding:8px 10px!important;resize:none!important}
      #modal .modalbox.progress-final-shell>.ui-progress-card{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important;margin-bottom:9px!important}
      #modal .modalbox.progress-final-shell>.ui-progress-card .ui-progress-callout{min-width:0!important;min-height:96px!important;padding:12px!important;border:1px solid #dfe7f0!important;border-radius:11px!important;background:#f5f9fc!important;box-sizing:border-box!important}
      #modal .modalbox.progress-final-shell>.ui-progress-card .headline{font-size:11px!important;line-height:1.2!important;font-weight:650!important;color:#304059!important}
      #modal .modalbox.progress-final-shell>.ui-progress-card .big{margin-top:7px!important;font-size:23px!important;line-height:1!important;font-weight:750!important}
      #modal .modalbox.progress-final-shell>.ui-progress-card p{margin:7px 0 0!important;font-size:10px!important;line-height:1.3!important;color:#68768a!important}
      #modal .modalbox.progress-final-shell>.formactions{height:50px!important;min-height:50px!important;margin-top:0!important;padding:7px 0!important;border-top:1px solid #e8edf3!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important}
      #modal .modalbox.progress-final-shell>.formactions .btn{width:112px!important;min-width:112px!important;height:34px!important;min-height:34px!important;padding:0 12px!important;border-radius:8px!important;font-size:12px!important;line-height:1!important;font-weight:500!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:nowrap!important}
      #modal .modalbox.progress-final-shell>.formactions .btn.primary{background:#0b2e52!important;border-color:#0b2e52!important;color:#fff!important;white-space:nowrap!important}
      @media(max-width:790px){#modal .modalbox.progress-final-shell{width:calc(100vw - 20px)!important;min-width:0!important;max-width:none!important}}
      @media(max-width:560px){#modal .modalbox.progress-final-shell>.modalhead{height:70px!important;min-height:70px!important;padding:11px 14px!important}.modalbox.progress-final-shell>.ui-help,.modalbox.progress-final-shell>.field,.modalbox.progress-final-shell>.formgrid,.modalbox.progress-final-shell>.ui-progress-card,.modalbox.progress-final-shell>.formactions{margin-left:14px!important;margin-right:14px!important;width:calc(100% - 28px)!important}.modalbox.progress-final-shell>.formgrid,.modalbox.progress-final-shell>.ui-progress-card{grid-template-columns:1fr!important}.modalbox.progress-final-shell>.formactions .btn{flex:1!important;min-width:0!important;white-space:nowrap!important}}
    `;document.head.appendChild(s)
  }
  function normalize(){
    const box=document.querySelector('#modal .modalbox:has(#pr_date)');if(!box)return;
    const body=box.querySelector(':scope > .p6-body');
    if(body){[...body.children].forEach(el=>box.appendChild(el));box.querySelector(':scope > .p6-side')?.remove();body.remove()}
    box.classList.remove('p6-form','p6-master','progress-form-standalone');box.classList.add('progress-final-shell');box.dataset.p6='1';box.dataset.progressFinal='1';
    box.style.setProperty('width','760px','important');box.style.setProperty('min-width','760px','important');box.style.setProperty('max-width','760px','important');box.style.setProperty('padding','0','important');box.style.setProperty('overflow','hidden','important');box.style.setProperty('box-sizing','border-box','important');
  }
  function boot(){addStyle();normalize()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__progressFinalTimer);window.__progressFinalTimer=setTimeout(boot,30)});obs.observe(document.body,{childList:true,subtree:true});
})();