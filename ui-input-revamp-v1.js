(function(){
  function addProgressButton(){
    if(window.state?.page!=='detail') return;
    const exists=[...document.querySelectorAll('[data-ui-input-progress]')].length;
    if(exists) return;
    const wrap=document.querySelector('.detailtitle')?.parentElement;
    if(!wrap) return;
    const actions=wrap.querySelector('.actions');
    if(!actions || document.querySelector('[data-ui-input-progress]')) return;
    const btn=document.createElement('button');
    btn.className='btn ghost';
    btn.dataset.uiInputProgress='1';
    btn.textContent='+ Input Progress';
    btn.onclick=()=>window.openProgressForm?.();
    actions.insertBefore(btn,actions.firstChild);
  }

  function normalizeDecimalInput(input){
    if(!input) return;
    const raw=String(input.value??'').trim();
    if(!raw) return;
    const normalized=raw.replace(/\s/g,'').replace(',','.');
    if(normalized!==raw && /^-?\d*(\.\d*)?$/.test(normalized)) input.value=normalized;
  }

  function polishNumericFields(){
    const ids=['f_contract','wi_weight','pr_pct','rap_material','rap_labor','rap_equipment','rap_operational','rap_subcontract','rap_other'];
    ids.forEach(id=>{
      const input=document.getElementById(id);
      if(!input || input.dataset.uiNumericPolished) return;
      input.dataset.uiNumericPolished='1';
      input.setAttribute('inputmode','decimal');
      input.addEventListener('input',()=>normalizeDecimalInput(input));
      input.addEventListener('blur',()=>normalizeDecimalInput(input));
    });
  }

  const boot=()=>{addProgressButton();polishNumericFields()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__uiInputRevampTimer);window.__uiInputRevampTimer=setTimeout(boot,120)});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
