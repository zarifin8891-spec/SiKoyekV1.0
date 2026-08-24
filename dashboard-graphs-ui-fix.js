(function(){
  const STYLE_ID='dashboard-graphs-ui-fix-style';
  function install(){
    const section=document.querySelector('.dashboard-graphs-section');
    if(!section) return false;
    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement('style');
      s.id=STYLE_ID;
      s.textContent=`
        .dashboard-graphs-section .graph-empty-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#6b778b;background:linear-gradient(180deg,#fff 0%,#f7f9fd 100%);border-radius:12px;z-index:2}
        .dashboard-graphs-section .graph-empty-state strong{display:block;color:#233047;font-size:14px;margin-bottom:4px}
        .dashboard-graphs-section .graph-empty-state[hidden]{display:none}
        .dashboard-graphs-section .graph-canvas{visibility:visible}
        .dashboard-graphs-section .graph-canvas.is-empty{visibility:hidden}
      `;
      document.head.appendChild(s);
    }
    const mode=section.querySelector('#graphMode');
    if(!mode) return false;
    const wraps=[section.querySelector('#chartCashFlow')?.parentElement,section.querySelector('#chartProgressCost')?.parentElement].filter(Boolean);
    wraps.forEach(w=>{
      const canvas=w.querySelector('canvas');
      if(canvas) canvas.classList.add('graph-canvas');
      if(!w.querySelector('.graph-empty-state')){
        const e=document.createElement('div');
        e.className='graph-empty-state';
        e.hidden=true;
        e.innerHTML='<div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div>';
        w.appendChild(e);
      }
    });
    const sync=()=>{
      const selected=section.querySelectorAll('#graphProjects input[type="checkbox"]:checked').length;
      const empty=mode.value==='selected' && selected===0;
      wraps.forEach(w=>{
        const canvas=w.querySelector('canvas');
        const overlay=w.querySelector('.graph-empty-state');
        if(canvas) canvas.classList.toggle('is-empty',empty);
        if(overlay) overlay.hidden=!empty;
      });
    };
    section.querySelectorAll('#graphProjects input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',sync));
    ['selectAllProjects','clearProjects'].forEach(id=>section.querySelector('#'+id)?.addEventListener('click',()=>setTimeout(sync,0)));
    mode.addEventListener('change',()=>setTimeout(sync,0));
    sync();
    return true;
  }
  const obs=new MutationObserver(()=>install());
  obs.observe(document.body,{childList:true,subtree:true});
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>30)clearInterval(timer)},500);
})();
