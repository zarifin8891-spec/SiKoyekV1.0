/* Standalone compact financial transaction form. */
(function(){
  const STYLE_ID='ui-form-transaction-compact-style-v3';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #modal:has(.transaction-form-standalone){padding:0!important;overflow:hidden!important}
      #modal .modalbox.transaction-form-standalone{width:700px!important;min-width:700px!important;max-width:700px!important;height:auto!important;max-height:calc(100vh - 20px)!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important;border-radius:20px!important;background:#fff!important;display:block!important}
      #modal .modalbox.transaction-form-standalone>.modalhead{width:100%!important;height:76px!important;min-height:76px!important;margin:0!important;padding:13px 24px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;position:relative!important;box-sizing:border-box!important;border:0!important;border-radius:20px 20px 0 0!important;background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;color:#fff!important}
      #modal .modalbox.transaction-form-standalone>.modalhead h3{margin:0!important;color:#fff!important;font-size:20px!important;line-height:1.1!important;font-weight:750!important}
      #modal .modalbox.transaction-form-standalone>.modalhead::after{content:'Catat uang masuk dan keluar proyek.';position:absolute;left:24px;bottom:12px;color:rgba(255,255,255,.82);font-size:10px;line-height:1.2}
      #modal .modalbox.transaction-form-standalone>.modalhead button{height:38px!important;min-height:38px!important;min-width:84px!important;padding:0 16px!important;margin:0!important;border-radius:9px!important;background:#fff!important;color:#0d294a!important;border:1px solid #fff!important;font-size:13px!important;font-weight:500!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
      #modal .modalbox.transaction-form-standalone>.formgrid{width:calc(100% - 44px)!important;margin:16px 22px 10px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;box-sizing:border-box!important}
      #modal .modalbox.transaction-form-standalone .field{min-width:0!important;margin:0!important}
      #modal .modalbox.transaction-form-standalone .field label{display:block!important;margin:0 0 4px!important;color:#304059!important;font-size:11px!important;line-height:1.2!important;font-weight:600!important}
      #modal .modalbox.transaction-form-standalone .field input,#modal .modalbox.transaction-form-standalone .field select{width:100%!important;height:38px!important;min-height:38px!important;padding:6px 10px!important;border:1px solid #cbd8e6!important;border-radius:9px!important;background:#fff!important;color:#172033!important;font-size:13px!important;font-weight:400!important;box-sizing:border-box!important;box-shadow:none!important}
      #modal .modalbox.transaction-form-standalone .field select{appearance:auto!important;cursor:pointer!important}
      #modal .modalbox.transaction-form-standalone #tx_amount{text-align:right!important}
      #modal .modalbox.transaction-form-standalone>.formactions{width:calc(100% - 44px)!important;height:52px!important;min-height:52px!important;margin:8px 22px 0!important;padding:7px 0 8px!important;border-top:1px solid #e8edf3!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;box-sizing:border-box!important}
      #modal .modalbox.transaction-form-standalone>.formactions .btn{width:104px!important;min-width:104px!important;height:34px!important;min-height:34px!important;padding:0 12px!important;border-radius:8px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;font-size:12px!important;line-height:1!important;font-weight:500!important;white-space:nowrap!important}
      #modal .modalbox.transaction-form-standalone>.formactions .btn.primary{background:#0b2e52!important;border-color:#0b2e52!important;color:#fff!important}
      @media(max-width:730px){#modal .modalbox.transaction-form-standalone{width:calc(100vw - 20px)!important;min-width:0!important;max-width:none!important}#modal .modalbox.transaction-form-standalone>.formgrid{grid-template-columns:1fr 1fr!important}}
      @media(max-width:520px){#modal .modalbox.transaction-form-standalone>.modalhead{height:70px!important;min-height:70px!important;padding:11px 14px!important;border-radius:16px 16px 0 0!important}#modal .modalbox.transaction-form-standalone>.modalhead h3{font-size:18px!important}#modal .modalbox.transaction-form-standalone>.modalhead::after{left:14px!important;bottom:10px!important;font-size:9px!important}#modal .modalbox.transaction-form-standalone>.formgrid,#modal .modalbox.transaction-form-standalone>.formactions{width:calc(100% - 28px)!important;margin-left:14px!important;margin-right:14px!important}#modal .modalbox.transaction-form-standalone>.formgrid{grid-template-columns:1fr!important}}
    `;document.head.appendChild(s)
  }
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function toSelect(input){if(!input||input.tagName==='SELECT')return input;const select=document.createElement('select');select.id=input.id;select.name=input.name||input.id;select.className=input.className;select.disabled=input.disabled;input.replaceWith(select);return select}
  async function loadOptions(){
    const box=document.querySelector('#modal .modalbox.transaction-form-standalone');if(!box)return;
    let cat=box.querySelector('#tx_cat');let method=box.querySelector('#tx_method');
    cat=toSelect(cat);method=toSelect(method);
    try{
      if(cat){const current=cat.value;const {data,error}=await sb.from('transaction_categories').select('name,is_active,sort_order').eq('is_active',true).order('sort_order').order('name');if(!error&&Array.isArray(data)){cat.innerHTML='<option value="">Pilih kategori...</option>'+data.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');if(data.some(x=>x.name===current))cat.value=current}}
      if(method){const current=method.value;const {data,error}=await sb.from('payment_methods').select('name,is_active,sort_order').eq('is_active',true).order('sort_order').order('name');if(!error&&Array.isArray(data)){method.innerHTML='<option value="">Pilih metode...</option>'+data.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');if(data.some(x=>x.name===current))method.value=current}}
    }catch(_){ }
  }
  function normalize(){
    const box=document.querySelector('#modal .modalbox:has(#tx_date)');if(!box)return;
    if(!box.classList.contains('transaction-form-standalone')){
      const body=box.querySelector(':scope > .p6-body');
      if(body){[...body.children].forEach(el=>box.appendChild(el));box.querySelector(':scope > .p6-side')?.remove();body.remove()}
      else box.querySelector(':scope > .p6-side')?.remove();
      box.classList.remove('p6-form','p6-master');box.dataset.transactionStandalone='1';box.dataset.p6='1';box.classList.add('transaction-form-standalone');
    }
    box.style.setProperty('width','700px','important');box.style.setProperty('min-width','700px','important');box.style.setProperty('max-width','700px','important');box.style.setProperty('padding','0','important');box.style.setProperty('margin','0','important');box.style.setProperty('overflow','hidden','important');
    const parent=document.getElementById('modal');if(parent){parent.style.setProperty('padding','0','important');parent.style.setProperty('overflow','hidden','important')}
    const cat=box.querySelector('#tx_cat');const method=box.querySelector('#tx_method');if(cat&&!method.dataset.masterLoaded){loadOptions();if(method)method.dataset.masterLoaded='1'}
  }
  function boot(){addStyle();normalize();const obs=new MutationObserver(()=>{clearTimeout(window.__txCompactTimerV3);window.__txCompactTimerV3=setTimeout(normalize,30)});obs.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
