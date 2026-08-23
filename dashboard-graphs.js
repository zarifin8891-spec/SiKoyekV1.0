(function(){
  const STYLE_ID='dashboard-graphs-style';
  const CLASS='dashboard-graphs-section';
  let busy=false;

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .${CLASS}{margin-top:18px}
      .${CLASS} .graphs-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:10px}
      .${CLASS} .graphs-head h2{font-size:17px;margin:0}
      .${CLASS} .graphs-sub{font-size:12px;color:var(--muted)}
      .${CLASS} .graph-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:15px}
      .${CLASS} .graph-card{position:relative;background:linear-gradient(145deg,#fff 0%,#f8faff 100%);border:1px solid #e4eaf4;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(26,42,72,.06)}
      .${CLASS} .graph-card h3{margin:0 0 3px;font-size:14px}
      .${CLASS} .graph-note{font-size:11px;color:var(--muted);margin-bottom:12px}
      .${CLASS} .canvas-wrap{position:relative}
      .${CLASS} canvas{width:100%;height:250px;display:block;border-radius:12px;background:linear-gradient(180deg,#ffffff 0%,#f7f9fd 100%)}
      .${CLASS} .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#4d5b70}
      .${CLASS} .legend span{display:inline-flex;align-items:center;gap:6px}
      .${CLASS} .swatch{width:10px;height:10px;border-radius:3px;display:inline-block}
      .${CLASS} .chart-tooltip{position:absolute;z-index:10;pointer-events:none;display:none;min-width:155px;padding:9px 11px;border-radius:10px;background:rgba(15,23,42,.94);color:#fff;font-size:11px;line-height:1.5;box-shadow:0 12px 24px rgba(15,23,42,.18);transform:translate(10px,-10px)}
      .${CLASS} .chart-tooltip strong{font-size:12px}
      @media(max-width:1000px){.dashboard-graphs-section .graph-grid{grid-template-columns:1fr}}
      @media(max-width:520px){.dashboard-graphs-section canvas{height:220px}}
    `;
    document.head.appendChild(s);
  }

  const short=n=>{n=Math.abs(Number(n||0));if(n>=1e9)return 'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return 'Rp '+(n/1e6).toFixed(0)+' jt';if(n>=1e3)return 'Rp '+(n/1e3).toFixed(0)+' rb';return 'Rp '+n};
  const moneyLabel=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const palette={in:'#11875d',out:'#c73737',progress:'#245cff',cost:'#a56a00'};

  function roundedRect(ctx,x,y,w,h,r){const rr=Math.min(r,h/2,w/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
  function setupCanvas(canvas){const dpr=window.devicePixelRatio||1;const rect=canvas.getBoundingClientRect();canvas.width=Math.max(320,Math.floor(rect.width*dpr));canvas.height=Math.max(220,Math.floor(rect.height*dpr));const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:rect.width,h:rect.height}}
  function drawGrid(ctx,w,h,left,right,top,bottom,max,mode){ctx.strokeStyle='#e7edf6';ctx.lineWidth=1;ctx.font='10px Inter,system-ui,sans-serif';ctx.fillStyle='#7a879a';const plotH=h-top-bottom;for(let i=0;i<=4;i++){const y=top+plotH*(i/4);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();const val=max*(1-i/4);ctx.fillText(mode==='pct'?`${Math.round(val)}%`:short(val),4,y+3)}}

  function attachTooltip(canvas,items,formatter){
    const parent=canvas.parentElement;let tip=parent.querySelector('.chart-tooltip');
    if(!tip){tip=document.createElement('div');tip.className='chart-tooltip';parent.appendChild(tip)}
    canvas.onmousemove=e=>{const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const hit=items.find(it=>x>=it.x&&x<=it.x+it.w&&y>=it.y&&y<=it.y+it.h);if(!hit){tip.style.display='none';return}tip.innerHTML=formatter(hit.data);tip.style.left=Math.min(x+8,r.width-165)+'px';tip.style.top=Math.max(14,y-8)+'px';tip.style.display='block'};
    canvas.onmouseleave=()=>{tip.style.display='none'};
  }

  function drawCashFlow(canvas,rows){const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);const left=56,right=18,top=14,bottom=34;const max=Math.max(1,...rows.map(r=>Math.max(r.cashIn,r.cashOut)));drawGrid(ctx,w,h,left,right,top,bottom,max,'money');const plotW=w-left-right,step=plotW/Math.max(rows.length,1);const scale=(h-top-bottom)/max,items=[];rows.forEach((r,i)=>{const gx=left+i*step+step*.18;const bw=Math.min(26,step*.26);const base=h-bottom;const hin=r.cashIn*scale,hout=r.cashOut*scale;ctx.shadowBlur=9;ctx.shadowColor='rgba(17,24,39,.10)';ctx.fillStyle=palette.in;roundedRect(ctx,gx,base-hin,bw,hin,6);ctx.fill();ctx.fillStyle=palette.out;roundedRect(ctx,gx+bw+5,base-hout,bw,hout,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#637086';ctx.font='10px Inter,system-ui,sans-serif';const label=r.project_code||('P'+(i+1));ctx.save();ctx.translate(gx+8,base+12);ctx.rotate(-.35);ctx.fillText(label,0,0);ctx.restore();items.push({x:gx-3,y:base-hin,w:bw+6,h:Math.max(hin,12),data:{type:'Cash In',...r}});items.push({x:gx+bw+2,y:base-hout,w:bw+6,h:Math.max(hout,12),data:{type:'Cash Out',...r}})});attachTooltip(canvas,items,d=>`<strong>${d.code||d.project_code||''}</strong><br>${d.type}<br>${moneyLabel(d.type==='Cash In'?d.cashIn:d.cashOut)}<br><span style="opacity:.75">Net ${moneyLabel(d.net)}</span>`) }

  function drawProgressCost(canvas,rows){const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);const left=48,right=18,top=14,bottom=34;drawGrid(ctx,w,h,left,right,top,bottom,100,'pct');const plotW=w-left-right,step=plotW/Math.max(rows.length,1);const scale=(h-top-bottom)/100,items=[];rows.forEach((r,i)=>{const gx=left+i*step+step*.2;const bw=Math.min(24,step*.28);const base=h-bottom;const hp=Math.max(0,Math.min(100,Number(r.project_progress||0)));const hc=Math.max(0,Math.min(100,Number(r.cost_ratio||0)));ctx.shadowBlur=9;ctx.shadowColor='rgba(17,24,39,.10)';ctx.fillStyle=palette.progress;roundedRect(ctx,gx,base-hp*scale,bw,hp*scale,6);ctx.fill();ctx.fillStyle=palette.cost;roundedRect(ctx,gx+bw+6,base-hc*scale,bw,hc*scale,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#637086';ctx.font='10px Inter,system-ui,sans-serif';const label=r.project_code||('P'+(i+1));ctx.save();ctx.translate(gx+8,base+12);ctx.rotate(-.35);ctx.fillText(label,0,0);ctx.restore();items.push({x:gx-3,y:base-hp*scale,w:bw+6,h:Math.max(hp*scale,12),data:{type:'Progress',...r}});items.push({x:gx+bw+3,y:base-hc*scale,w:bw+7,h:Math.max(hc*scale,12),data:{type:'Cost Ratio',...r}})});attachTooltip(canvas,items,d=>`<strong>${d.project_code||''}</strong><br>${d.type}: ${d.type==='Progress'?Number(d.project_progress||0).toFixed(2)+'%':Number(d.cost_ratio||0).toFixed(2)+'%'}<br><span style="opacity:.75">${d.project_name||''}</span>`) }

  function makeRows(projects,tx){return projects.map(p=>{const list=tx.filter(t=>t.project_id===p.project_id&&inRange(t.transaction_date));const cashIn=list.filter(t=>t.transaction_type==='MASUK').reduce((s,t)=>s+Number(t.amount||0),0);const cashOut=list.filter(t=>t.transaction_type==='KELUAR').reduce((s,t)=>s+Number(t.amount||0),0);return {...p,cashIn,cashOut,net:cashIn-cashOut}})}
  function inRange(date){if(!date)return false;if(state.period?.from&&date<state.period.from)return false;if(state.period?.to&&date>state.period.to)return false;return true}

  async function render(){if(busy||typeof state==='undefined'||state.page!=='dashboard')return;const page=document.getElementById('page');if(!page)return;if(page.querySelector('.'+CLASS))return;const health=[...page.querySelectorAll('.sectiontitle h2')].find(x=>x.textContent.trim()==='Project Health');if(!health)return;const projects=(state.summary||[]).filter(typeof periodMatch==='function'?periodMatch:()=>true);const ids=projects.map(p=>p.project_id).filter(Boolean);busy=true;try{let tx=[];if(ids.length){const {data,error}=await sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount').in('project_id',ids);if(error)throw error;tx=data||[]}const rows=makeRows(projects,tx);const wrap=document.createElement('div');wrap.className='section '+CLASS;wrap.innerHTML=`<div class="graphs-head"><div><h2>Analisis Visual</h2><div class="graphs-sub">Grafik mengikuti proyek dan periode Dashboard aktif.</div></div></div><div class="graph-grid"><div class="graph-card"><h3>Cash Flow per Proyek</h3><div class="graph-note">Perbandingan Cash In dan Cash Out pada periode aktif. Arahkan mouse ke batang untuk melihat detail.</div><div class="canvas-wrap"><canvas id="chartCashFlow"></canvas></div><div class="legend"><span><i class="swatch" style="background:${palette.in}"></i>Cash In</span><span><i class="swatch" style="background:${palette.out}"></i>Cash Out</span></div></div><div class="graph-card"><h3>Progress vs Cost Ratio</h3><div class="graph-note">Membantu mendeteksi biaya yang bergerak lebih cepat dari progress.</div><div class="canvas-wrap"><canvas id="chartProgressCost"></canvas></div><div class="legend"><span><i class="swatch" style="background:${palette.progress}"></i>Progress</span><span><i class="swatch" style="background:${palette.cost}"></i>Cost Ratio</span></div></div></div>`;health.closest('.section').before(wrap);drawCashFlow(document.getElementById('chartCashFlow'),rows);drawProgressCost(document.getElementById('chartProgressCost'),rows)}catch(e){try{toast(e?.message||'Gagal memuat grafik')}catch(_){}}finally{busy=false}}
  addStyle();const obs=new MutationObserver(()=>{if(!document.querySelector('.'+CLASS))render()});obs.observe(document.body,{childList:true,subtree:true});setInterval(()=>{const el=document.getElementById('page');if(state?.page==='dashboard'&&el&&!el.querySelector('.'+CLASS))render()},1000);
})();
