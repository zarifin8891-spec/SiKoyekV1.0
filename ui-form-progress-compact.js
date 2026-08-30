/* FINAL compact shell for Input Progress Proyek. Keep the same standalone method as Item Pekerjaan/RAP. */
(function(){
  const STYLE_ID='ui-form-progress-compact-style';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Standalone progress modal: remove inherited p6 shell geometry. */
      #modal .modalbox.progress-form-standalone{
        width:760px!important;
        min-width:760px!important;
        max-width:760px!important;
        max-height:calc(100vh - 24px)!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        display:block!important;
        box-sizing:border-box!important;
        border-radius:22px!important;
        background:#fff!important;
      }
      #modal .modalbox.progress-form-standalone>.modalhead{
        width:100%!important;
        height:76px!important;
        min-height:76px!important;
        margin:0!important;
        padding:13px 24px!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        border:0!important;
        border-radius:22px 22px 0 0!important;
        background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;
        color:#fff!important;
      }
      #modal .modalbox.progress-form-standalone>.modalhead h3{
        display:block!important;
        visibility:visible!important;
        margin:0!important;
        color:#fff!important;
        font-size:20px!important;
        line-height:1.1!important;
        font-weight:650!important;
      }
      #modal .modalbox.progress-form-standalone>.modalhead::after{
        content:'Isi data progress berdasarkan Item Pekerjaan.'!important;
        position:absolute!important;
        left:24px!important;
        bottom:12px!important;
        color:rgba(255,255,255,.82)!important;
        font-size:10px!important;
        line-height:1.2!important;
      }
      #modal .modalbox.progress-form-standalone>.modalhead button{
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
      #modal .modalbox.progress-form-standalone>.ui-help{
        width:calc(100% - 44px)!important;
        margin:16px 22px 10px!important;
        padding:10px 12px!important;
        box-sizing:border-box!important;
        border:1px solid #dfe8f0!important;
        border-radius:12px!important;
        background:#f5f9fc!important;
        color:#627189!important;
        font-size:12px!important;
        line-height:1.4!important;
      }
      #modal .modalbox.progress-form-standalone>.formgrid{
        width:calc(100% - 44px)!important;
        margin:0 22px!important;
        padding:0!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:10px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.progress-form-standalone>.field{
        width:calc(100% - 44px)!important;
        margin-left:22px!important;
        margin-right:22px!important;
        margin-bottom:10px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.progress-form-standalone .field{
        min-width:0!important;
        margin-top:0!important;
      }
      #modal .modalbox.progress-form-standalone .field label{
        display:block!important;
        margin:0 0 4px!important;
        color:#304059!important;
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:650!important;
      }
      #modal .modalbox.progress-form-standalone .field input,
      #modal .modalbox.progress-form-standalone .field select,
      #modal .modalbox.progress-form-standalone .field textarea{
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
      #modal .modalbox.progress-form-standalone #pr_date,
      #modal .modalbox.progress-form-standalone #pr_item{
        height:40px!important;
        min-height:40px!important;
        padding:6px 10px!important;
      }
      #modal .modalbox.progress-form-standalone #pr_pct{
        height:40px!important;
        min-height:40px!important;
        padding:6px 10px!important;
        text-align:right!important;
        font-weight:500!important;
      }
      #modal .modalbox.progress-form-standalone #pr_notes{
        height:62px!important;
        min-height:62px!important;
        padding:8px 10px!important;
        resize:none!important;
      }
      #modal .modalbox.progress-form-standalone>.ui-progress-card{
        width:calc(100% - 44px)!important;
        margin:0 22px 10px!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:10px!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.progress-form-standalone>.ui-progress-card .ui-progress-callout{
        min-width:0!important;
        min-height:112px!important;
        padding:14px!important;
        border:1px solid #dfe7f0!important;
        border-radius:12px!important;
        background:#f5f9fc!important;
        box-sizing:border-box!important;
      }
      #modal .modalbox.progress-form-standalone>.ui-progress-card .headline{
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:650!important;
        color:#304059!important;
      }
      #modal .modalbox.progress-form-standalone>.ui-progress-card .big{
        margin-top:9px!important;
        font-size:24px!important;
        line-height:1!important;
        font-weight:750!important;
      }
      #modal .modalbox.progress-form-standalone>.ui-progress-card p{
        margin:8px 0 0!important;
        font-size:10px!important;
        line-height:1.35!important;
        color:#68768a!important;
      }
      #modal .modalbox.progress-form-standalone>.formactions{
        width:calc(100% - 44px)!important;
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
      #modal .modalbox.progress-form-standalone>.formactions .btn{
        width:112px!important;
        min-width:112px!important;
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
      #modal .modalbox.progress-form-standalone>.formactions .btn.primary{
        background:#0b2e52!important;
        border-color:#0b2e52!important;
        color:#fff!important;
      }
      @media(max-width:790px){
        #modal .modalbox.progress-form-standalone{width:calc(100vw - 20px)!important;min-width:0!important;max-width:none!important}
      }
      @media(max-width:560px){
        #modal .modalbox.progress-form-standalone>.modalhead{height:70px!important;min-height:70px!important;padding:11px 14px!important;border-radius:16px 16px 0 0!important}
        #modal .modalbox.progress-form-standalone>.modalhead h3{font-size:18px!important}
        #modal .modalbox.progress-form-standalone>.modalhead::after{left:14px!important;bottom:10px!important;font-size:9px!important}
        #modal .modalbox.progress-form-standalone>.ui-help,
        #modal .modalbox.progress-form-standalone>.field,
        #modal .modalbox.progress-form-standalone>.formgrid,
        #modal .modalbox.progress-form-standalone>.ui-progress-card,
        #modal .modalbox.progress-form-standalone>.formactions{margin-left:14px!important;margin-right:14px!important;width:calc(100% - 28px)!important}
        #modal .modalbox.progress-form-standalone>.formgrid,
        #modal .modalbox.progress-form-standalone>.ui-progress-card{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }

  function normalize(){
    const box=document.querySelector('#modal .modalbox:has(#pr_date)');
    if(!box)return;
    if(!box.classList.contains('progress-form-standalone')){
      const body=box.querySelector(':scope > .p6-body');
      if(body){
        [...body.children].forEach(el=>box.appendChild(el));
        box.querySelector(':scope > .p6-side')?.remove();
        body.remove();
      }else box.querySelector(':scope > .p6-side')?.remove();
      box.classList.remove('p6-form','p6-master');
      box.classList.add('progress-form-standalone');
      box.dataset.progressStandalone='1';
    }
  }

  function boot(){addStyle();normalize();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__progressCompactTimer);window.__progressCompactTimer=setTimeout(boot,40)});
  obs.observe(document.body,{childList:true,subtree:true});
})();
