(function(){
  const STYLE_ID='dashboard-graphs-style';
  const CLASS='dashboard-graphs-section';
  let busy=false, allRows=[];
  const palette={in:'#11875d',out:'#c73737',progress:'#245cff',cost:'#a56a00'};

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      .${CLASS}{margin-top:18px}
      .${CLASS} .graphs-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:10px}
      .${CLASS} .graphs-head h2{font-size:17px;margin:0}
      .${CLASS} .graphs-sub{font-size:12px;color:var(--muted)}
      .${CLASS} .graph-controls{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin:0 0 12px;padding:12px;background:linear-gradient(145deg,#fff 0%,#f8faff 100%);border:1px solid #e4eaf4;border-radius:14px}
      .${CLASS} .graph-control{display:flex;flex-direction:column;gap:5px;min-width:150px}
      .${CLASS} .graph-control label{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
      .${CLASS} .graph-control select{height:38px;border:1px solid #d7dfeb;border-radius:9px;background:#fff;color:#172033;padding:7px 10px;font-size:13px}
      .${CLASS} .selected-wrap{display:none;min-width:320px;flex:1}
      .${CLASS} .selected-wrap.show{display:flex}
      .${CLASS} .project-picker{display:grid;grid-template-columns:repeat(2,minmax(230px,1fr));gap:6px;padding:8px;max-height:150px;overflow:auto;border:1px solid #d7dfeb;border-radius:10px;background:#fff}
      .${CLASS} .project-option{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;font-size:12px;color:#273244;cursor:pointer}
      .${CLASS} .project-option:hover{background:#f3f6fb}
      .${CLASS} .project-option input{width:15px;height:15px;accent-color:#245cff}
      .${CLASS} .picker-actions{display:flex;gap:6px;align-items:center;margin-top:6px}
      .${CLASS} .picker-actions button{border:1px solid #d7dfeb;background:#fff;border-radius:8px;padding:6px 9px;font-size:11px;color:#263247;cursor:pointer}
      .${CLASS} .picker-actions button:hover{background:#f3f6fb}
      .${CLASS} .control-note{font-size:11px;color:var(--muted);align-self:center}
      .${CLASS} .graph-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:15px}
      .${CLASS} .graph-card{position:relative;background:linear-gradient(145deg,#fff 0%,#f8faff 100%);border:1px solid #e4eaf4;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(26,42,72,.06)}
      .${CLASS} .graph-card h3{margin:0 0 3px;font-size:14px}
      .${CLASS} .graph-note{font-size:11px;color:var(--muted);margin-bottom:12px}
      .${CLASS} .canvas-wrap{position:relative}
      .${CLASS} canvas{width:100%;height:250px;display:block;border-radius:12px;background:linear-gradient(180deg,#fff 0%,#f7f9fd 100%);cursor:crosshair}
      .${CLASS} .empty-chart{height:250px;border-radius:12px;background:linear-gradient(180deg,#fff 0%,#f7f9fd 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#6b778b}
      .${CLASS} .empty-chart strong{display:block;color:#233047;font-size:14px;margin-bottom:4px}
      .${CLASS} .empty-chart[hidden]{display:none}
      .${CLASS} .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#4d5b70}
      .${CLASS} .legend span{display:inline-flex;align-items:center;gap:6px}
      .${CLASS} .swatch{width:10px;height:10px;border-radius:3px;display:inline-block}
      .${CLASS} .chart-tooltip{position:absolute;z-index:10;pointer-events:none;display:none;min-width:155px;padding:9px 11px;border-radius:10px;background:rgba(15,23,42,.95);color:#fff;font-size:11px;line-height:1.5;box-shadow:0 12px 24px rgba(15,23,42,.18)}
      @media(max-width:1000px){.dashboard-graphs-section .graph-grid{grid-template-columns:1fr}}
      @media(max-width:700px){.dashboard-graphs-section .project-picker{grid-template-columns:1fr}}
      @media(max-width:520px){.dashboard-graphs-section .graph-control{min-width:135px}.dashboard-graphs-section .selected-wrap{min-width:100%}.dashboard-graphs-section canvas,.dashboard-graphs-section .empty-chart{height:220px}}
    `;
    document.head.appendChild(s);
  }

  const short=n=>{n=Math.abs(Number(n||0));if(n>=1e9)return 'Rp '+(n/1e9).toFixed(1)+' M';if(n>=1e6)return 'Rp '+(n/1e6).toFixed(0)+' jt';if(n>=1e3)return 'Rp '+(n/1e3).toFixed(0)+' rb';return 'Rp '+n};
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const inRange=date=>{if(!date)return false;if(state.period?.from&&date<state.period.from)return false;if(state.period?.to&&date>state.period.to)return false;return true};

  function roundedRect(ctx,x,y,w,h,r){const rr=Math.min(r,h/2,w/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
  function setupCanvas(canvas){const dpr=window.devicePixelRatio||1;const rect=canvas.getBoundingClientRect();canvas.width=Math.max(320,Math.floor(rect.width*dpr));canvas.height=Math.max(220,Math.floor(rect.height*dpr));const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:rect.width,h:rect.height}}
  function drawGrid(ctx,w,h,left,right,top,bottom,max,mode){ctx.strokeStyle='#e7edf6';ctx.lineWidth=1;ctx.font='10px Inter,system-ui,sans-serif';ctx.fillStyle='#7a879a';const plotH=h-top-bottom;for(let i=0;i<=4;i++){const y=top+plotH*i/4;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();const v=max*(1-i/4);ctx.fillText(mode==='pct'?Math.round(v)+'%':short(v),4,y+3)}}
  function attachTooltip(canvas,items,formatter){const parent=canvas.parentElement;let tip=parent.querySelector('.chart-tooltip');if(!tip){tip=document.createElement('div');tip.className='chart-tooltip';parent.appendChild(tip)}canvas.onmousemove=e=>{const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const hit=items.find(it=>x>=it.x&&x<=it.x+it.w&&y>=it.y&&y<=it.y+it.h);if(!hit){tip.style.display='none';return}tip.innerHTML=formatter(hit);tip.style.left=Math.min(x+8,r.width-165)+'px';tip.style.top=Math.max(14,y-8)+'px';tip.style.display='block'};canvas.onmouseleave=()=>{tip.style.display='none'}}

  function drawCashFlow(canvas,rows){const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);const left=56,right=18,top=14,bottom=34,max=Math.max(1,...rows.map(r=>Math.max(r.cashIn,r.cashOut))),scale=(h-top-bottom)/max;drawGrid(ctx,w,h,left,right,top,bottom,max,'money');const step=(w-left-right)/Math.max(rows.length,1),base=h-bottom,items=[];rows.forEach((r,i)=>{const gx=left+i*step+step*.18,bw=Math.min(26,step*.26),hin=r.cashIn*scale,hout=r.cashOut*scale;ctx.shadowBlur=9;ctx.shadowColor='rgba(17,24,39,.10)';ctx.fillStyle=palette.in;roundedRect(ctx,gx,base-hin,bw,hin,6);ctx.fill();ctx.fillStyle=palette.out;roundedRect(ctx,gx+bw+5,base-hout,bw,hout,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#637086';ctx.font='10px Inter,system-ui,sans-serif';ctx.save();ctx.translate(gx+8,base+12);ctx.rotate(-.35);ctx.fillText(r.project_code,0,0);ctx.restore();items.push({x:gx-3,y:base-hin,w:bw+6,h:Math.max(hin,12),data:r,type:'in'});items.push({x:gx+bw+2,y:base-hout,w:bw+6,h:Math.max(hout,12),data:r,type:'out'})});attachTooltip(canvas,items,it=>`<strong>${it.data.project_code}</strong><br>${it.type==='in'?'Cash In':'Cash Out'}: ${money(it.type==='in'?it.data.cashIn:it.data.cashOut)}<br><span style="opacity:.75">Net ${money(it.data.net)}</span>`)}
  function drawProgressCost(canvas,rows){const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);const left=48,right=18,top=14,bottom=34,scale=(h-top-bottom)/100;drawGrid(ctx,w,h,left,right,top,bottom,100,'pct');const step=(w-left-right)/Math.max(rows.length,1),base=h-bottom,items=[];rows.forEach((r,i)=>{const gx=left+i*step+step*.2,bw=Math.min(24,step*.28),hp=Math.max(0,Math.min(100,Number(r.project_progress||0))),hc=Math.max(0,Math.min(100,Number(r.cost_ratio||0)));ctx.shadowBlur=9;ctx.shadowColor='rgba(17,24,39,.10)';ctx.fillStyle=palette.progress;roundedRect(ctx,gx,base-hp*scale,bw,hp*scale,6);ctx.fill();ctx.fillStyle=palette.cost;roundedRect(ctx,gx+bw+6,base-hc*scale,bw,hc*scale,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#637086';ctx.font='10px Inter,system-ui,sans-serif';ctx.save();ctx.translate(gx+8,base+12);ctx.rotate(-.35);ctx.fillText(r.project_code,0,0);ctx.restore();items.push({x:gx-3,y:base-hp*scale,w:bw+6,h:Math.max(hp*scale,12),data:r,type:'progress'});items.push({x:gx+bw+3,y:base-hc*scale,w:bw+7,h:Math.max(hc*scale,12),data:r,type:'cost'})});attachTooltip(canvas,items,it=>`<strong>${it.data.project_code}</strong><br>${it.type==='progress'?'Progress':'Cost Ratio'}: ${pct(it.type==='progress'?it.data.project_progress:it.data.cost_ratio)}<br>Risk Gap: ${pct(it.data.riskGap)}`)}

  function makeRows(projects,tx){return projects.map(p=>{const list=tx.filter(t=>t.project_id===p.project_id&&inRange(t.transaction_date));const cashIn=list.filter(t=>t.transaction_type==='MASUK').reduce((s,t)=>s+Number(t.amount||0),0);const cashOut=list.filter(t=>t.transaction_type==='KELUAR').reduce((s,t)=>s+Number(t.amount||0),0);const progress=Number(p.project_progress||0),cost=Number(p.cost_ratio||0);return {...p,cashIn,cashOut,net:cashIn-cashOut,riskGap:cost-progress}})}
  function sortRows(rows,key){return [...rows].sort((a,b)=>Number(b[key]||0)-Number(a[key]||0))}
  function selectedIds(){return [...document.querySelectorAll('#graphProjects input[type="checkbox"]:checked')].map(x=>x.value)}
  function selectedRows(){const mode=document.getElementById('graphMode')?.value||'top10';const sort=document.getElementById('graphSort')?.value||'cashOut';if(mode==='risk')return sortRows(allRows,'riskGap').slice(0,10);if(mode==='selected'){const ids=selectedIds();return ids.length?allRows.filter(r=>ids.includes(r.project_id)):[]}if(mode==='all'){const key={cashOut:'cashOut',cashIn:'cashIn',cost:'cost_ratio',progress:'project_progress'}[sort]||'cashOut';return sortRows(allRows,key)}const key={cashOut:'cashOut',cashIn:'cashIn',cost:'cost_ratio',progress:'project_progress'}[sort]||'cashOut';const n=Number(String(mode).replace('top',''))||10;return sortRows(allRows,key).slice(0,n)}

  function showEmpty(show){
    document.querySelectorAll('.graph-empty-state').forEach(el=>el.hidden=!show);
    document.querySelectorAll('.graph-canvas').forEach(el=>el.hidden=show);
  }

  function refresh(){
    const mode=document.getElementById('graphMode')?.value||'top10';
    const rows=selectedRows();
    const note=document.getElementById('graphSelectionNote');
    if(note) note.textContent=mode==='selected'&&rows.length===0?'Belum ada proyek dipilih.':`Menampilkan ${rows.length} dari ${allRows.length} proyek.`;
    const selectedNote=document.getElementById('graphSelectedNote');
    if(selectedNote) selectedNote.textContent=`${selectedIds().length} proyek dipilih`;
    const empty=(mode==='selected'&&rows.length===0);
    showEmpty(empty);
    if(empty) return;
    const cash=document.getElementById('chartCashFlow'),prog=document.getElementById('chartProgressCost');
    if(cash&&prog){drawCashFlow(cash,rows);drawProgressCost(prog,rows)}
  }

  function bind(){
    const mode=document.getElementById('graphMode'),sort=document.getElementById('graphSort'),wrap=document.getElementById('selectedWrap');
    if(!mode) return;
    const sync=()=>{const m=mode.value;wrap.classList.toggle('show',m==='selected');sort.closest('.graph-control').style.display=(m==='risk'||m==='selected')?'none':'flex';refresh()};
    mode.onchange=sync; sort.onchange=refresh;
    document.querySelectorAll('#graphProjects input[type="checkbox"]').forEach(cb=>cb.onchange=refresh);
    const selectAll=document.getElementById('selectAllProjects'),clear=document.getElementById('clearProjects');
    if(selectAll) selectAll.onclick=()=>{document.querySelectorAll('#graphProjects input[type="checkbox"]').forEach(cb=>cb.checked=true);refresh()};
    if(clear) clear.onclick=()=>{document.querySelectorAll('#graphProjects input[type="checkbox"]').forEach(cb=>cb.checked=false);refresh()};
    sync();
  }

  async function render(){
    if(busy||typeof state==='undefined'||state.page!=='dashboard') return;
    const page=document.getElementById('page'); if(!page||page.querySelector('.'+CLASS)) return;
    const health=[...page.querySelectorAll('.sectiontitle h2')].find(x=>x.textContent.trim()==='Project Health'); if(!health) return;
    const projects=(state.summary||[]).filter(typeof periodMatch==='function'?periodMatch:()=>true),ids=projects.map(p=>p.project_id).filter(Boolean);busy=true;
    try{
      let tx=[];
      if(ids.length){const {data,error}=await sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount').in('project_id',ids);if(error)throw error;tx=data||[]}
      allRows=makeRows(projects,tx);
      const options=allRows.map(r=>`<label class="project-option"><input type="checkbox" value="${esc(r.project_id)}"><span>${esc(r.project_code)} — ${esc(r.project_name)}</span></label>`).join('');
      const wrap=document.createElement('div');wrap.className='section '+CLASS;
      wrap.innerHTML=`<div class="graphs-head"><div><h2>Analisis Visual</h2><div class="graphs-sub">Grafik mengikuti periode Dashboard aktif.</div></div><span id="graphSelectionNote" class="graphs-sub"></span></div>
      <div class="graph-controls"><div class="graph-control"><label>Tampilan Proyek</label><select id="graphMode"><option value="top5">Top 5</option><option value="top10" selected>Top 10</option><option value="top15">Top 15</option><option value="risk">Top Risiko</option><option value="all">Semua</option><option value="selected">Proyek Terpilih</option></select></div>
      <div class="graph-control"><label>Urutkan Top N</label><select id="graphSort"><option value="cashOut" selected>Cash Out Terbesar</option><option value="cashIn">Cash In Terbesar</option><option value="cost">Cost Ratio Tertinggi</option><option value="progress">Progress Tertinggi</option></select></div>
      <div id="selectedWrap" class="graph-control selected-wrap"><label>Proyek Terpilih</label><div id="graphProjects" class="project-picker">${options}</div><div class="picker-actions"><button type="button" id="selectAllProjects">Pilih Semua</button><button type="button" id="clearProjects">Bersihkan</button><span id="graphSelectedNote" class="control-note">0 proyek dipilih</span></div></div>
      <div class="control-note">Top Risiko = gap Cost Ratio − Progress terbesar.</div></div>
      <div class="graph-grid">
        <div class="graph-card"><h3>Cash Flow per Proyek</h3><div class="graph-note">Perbandingan Cash In dan Cash Out pada periode aktif. Arahkan mouse ke batang untuk detail.</div><div class="canvas-wrap"><canvas id="chartCashFlow" class="graph-canvas"></canvas><div class="graph-empty-state empty-chart" hidden><div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div></div></div><div class="legend"><span><i class="swatch" style="background:${palette.in}"></i>Cash In</span><span><i class="swatch" style="background:${palette.out}"></i>Cash Out</span></div></div>
        <div class="graph-card"><h3>Progress vs Cost Ratio</h3><div class="graph-note">Membantu mendeteksi biaya yang bergerak lebih cepat dari progress.</div><div class="canvas-wrap"><canvas id="chartProgressCost" class="graph-canvas"></canvas><div class="graph-empty-state empty-chart" hidden><div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div></div></div><div class="legend"><span><i class="swatch" style="background:${palette.progress}"></i>Progress</span><span><i class="swatch" style="background:${palette.cost}"></i>Cost Ratio</span></div></div>
      </div>`;
      health.closest('.section').before(wrap);bind();refresh();
    }catch(e){try{toast(e?.message||'Gagal memuat grafik')}catch(_){} }finally{busy=false}
  }

  addStyle();
  const obs=new MutationObserver(()=>{if(!document.querySelector('.'+CLASS))render()});obs.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{const page=document.getElementById('page');if(state?.page==='dashboard'&&page&&!page.querySelector('.'+CLASS))render()},1000);
})();