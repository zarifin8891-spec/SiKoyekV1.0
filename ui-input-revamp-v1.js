(function(){
  function addProgressButton(){
    if(window.state?.page!=='detail') return;
    const tabs=[...document.querySelectorAll('.tabs button')];
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
  const boot=()=>addProgressButton();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__uiInputRevampTimer);window.__uiInputRevampTimer=setTimeout(boot,120)});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
