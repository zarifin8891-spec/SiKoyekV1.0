(function(){
  if(window.__SIKOYEK_COST_CONTROL_V6__)return;
  window.__SIKOYEK_COST_CONTROL_V6__=true;
  const num=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
  const pct=n=>Number(n||0).toFixed(2)+'%';
  function findCard(labelText){
    const els=[...document.querySelectorAll('#page *')].filter(e=>String(e.textContent||'').trim().toUpperCase()===labelText);
    for(const e of els){let n=e;for(let i=0;i<5&&n;i++,n=n.parentElement){if(/\d+(?:\.\d+)?\s*%/.test(n.textContent||''))return n}}
    return null;
  }
  function fix(){
    const page=document.getElementById('page');
    if(!page)return;
    const progressCard=findCard('PROGRESS');
    const ratioCard=findCard('RASIO BIAYA');
    const gapCard=findCard('GAP PROGRESS VS BIAYA');
    if(progressCard&&ratioCard&&gapCard){
      const pm=(progressCard.textContent||'').match(/(\d+(?:\.\d+)?)\s*%/);
      const rm=(ratioCard.textContent||'').match(/(\d+(?:\.\d+)?)\s*%/);
      const progress=pm?Number(pm[1]):null;
      const ratio=rm?Number(rm[1]):null;
      if(Number.isFinite(progress)&&Number.isFinite(ratio)){
        const gap=progress-ratio;
        const value=[...gapCard.querySelectorAll('*')].find(e=>/^-?\d+(?:\.\d+)?%$/.test(String(e.textContent||'').trim()));
        if(value){value.textContent=(gap>=0?'+':'')+pct(gap);value.style.color=gap>=0?'var(--green)':'var(--red)';}
        const status=[...gapCard.querySelectorAll('.ccv5-status')][0];
        if(status){status.textContent=gap<0?'PERLU PERHATIAN':'TERKONTROL';status.className='ccv5-status '+(gap<0?'warn':'ok');}
      }
    }
    const root=document.getElementById('cost-control-v5');
    if(root){root.querySelectorAll('th:nth-child(2),th:nth-child(3),th:nth-child(4),th:nth-child(5)').forEach(th=>{th.style.textAlign='right';th.style.paddingRight='8px'});}
  }
  fix();setInterval(fix,500);
})();
