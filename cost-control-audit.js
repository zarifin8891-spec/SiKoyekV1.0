(function(){
  const STYLE_ID='cost-control-v1-style';
  const HOST_ID='cost-control-v1';
  let busy=false;

  function money(n){
    return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  }
  function pct(n){return Number(n||0).toFixed(2)+'%';}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .ccv1-wrap{display:grid;gap:14px;margin-top:4px}
      .ccv1-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .ccv1-card{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:14px 16px;min-width:0}
      .ccv1-label{font-size:11px;color:var(--muted);font-weight:650;text-transform:uppercase;letter-spacing:.02em}
      .ccv1-value{font-size:22px;line-height:1.1;font-weight:650;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ccv1-sub{font-size:11px;color:var(--muted);margin-top:6px}
      .ccv1-progress{height:8px;background:#edf1f6;border-radius:999px;overflow:hidden;margin-top:9px}
      .ccv1-progress i{display:block;height:100%;background:var(--blue);border-radius:999px}
      .ccv1-gap-positive{color:var(--green)} .ccv1-gap-negative{color:var(--red)}
      .ccv1-status{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;margin-top:7px}
      .ccv1-ok{background:var(--green2);color:var(--green)}
      .ccv1-warn{background:var(--amber2);color:var(--amber)}
      .ccv1-risk{background:var(--red2);color:var(--red)}
      .ccv1-panel{background:var(--card);border:1px solid var(--line);border-radius:15px;overflow:hidden}
      .ccv1-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:15px 17px 11px}
      .ccv1-panel-head h3{margin:0;font-size:17px}
      .ccv1-panel-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
      .ccv1-table{width:100%;border-collapse:collapse}
      .ccv1-table th,.ccv1-table td{padding:9px 12px;border-top:1px solid var(--line);font-size:12px;text-align:left;white-space:nowrap}
      .ccv1-table th{font-size:9px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);background:#fafbfd}
      .ccv1-table td:nth-child(n+2){text-align:right}
      .ccv1-table .barcell{min-width:150px}
      .ccv1-mini{height:6px;background:#edf1f6;border-radius:999px;overflow:hidden;margin-top:4px}
      .ccv1-mini i{display:block;height:100%;background:var(--blue);border-radius:999px}
      .ccv1-foot{padding:10px 17px 13px;color:var(--muted);font-size:11px}
      @media(max-width:1000px){.ccv1-kpis{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:560px){.ccv1-kpis{grid-template-columns:1fr}.ccv1-table{min-width:760px}.ccv1-panel{overflow:auto}}
    `;
    document.head.appendChild(s);
  }

  function readProgressValue(obj){
    if(!obj || typeof obj!=='object')return null;
    const candidates=[obj.progress,obj.progress_pct,obj.progressPercent,obj.current_progress,obj.actual_progress,obj.real_progress,obj.realisasi_progress,obj.persentase,obj.percentage];
    for(const x of candidates){
      if(x===null || x===undefined || x==='')continue;
      const n=Number(x);
      if(Number.isFinite(n))return n<=1?n*100:n;
    }
    return null;
  }

  function readWeight(obj){
    if(!obj || typeof obj!=='object')return null;
    const candidates=[obj.bobot,obj.weight,obj.weight_pct,obj.weightPercent,obj.persentase_bobot,obj.percentage_weight];
    for(const x of candidates){
      if(x===null || x===undefined || x==='')continue;
      const n=Number(String(x).replace('%',''));
      if(Number.isFinite(n))return n<=1?n*100:n;
    }
    return null;
  }

  function getProgress(detail){
    const direct=readProgressValue(detail);
    if(direct!==null)return Math.max(0,Math.min(100,direct));

    const collections=[detail.items,detail.work_items,detail.workItems,detail.pekerjaan,detail.items_pekerjaan,detail.itemPekerjaan];
    for(const list of collections){
      if(!Array.isArray(list) || !list.length)continue;
      let weighted=0, totalWeight=0, hasWeighted=false;
      for(const item of list){
        const p=readProgressValue(item);
        const w=readWeight(item);
        if(p!==null && w!==null){
          weighted += p*w;
          totalWeight += w;
          hasWeighted=true;
        }
      }
      if(hasWeighted && totalWeight>0)return Math.max(0,Math.min(100,weighted/totalWeight));
    }
    return 0;
  }

  function getRap(r,key){
    const aliases={material:['material'],labor:['labor','upah'],equipment:['equipment','alat'],operational:['operational'],subcontract:['subcontract','subkon'],other:['other','lain_lain','lainlain']};
    for(const k of aliases[key]||[]){
      const n=Number(r?.[k]);
      if(Number.isFinite(n))return n;
    }
    return 0;
  }

  function render(){
    if(busy || typeof state==='undefined' || state.page!=='detail' || state.detailTab!=='cost' || !state.selected)return;
    const host=document.getElementById('page');
    if(!host)return;
    const detail=state.detail;
    if(!detail || !detail.fin)return;
    const tabs=host.querySelector('.tabs');
    if(!tabs)return;

    busy=true;
    try{
      const tabButtons=[...tabs.querySelectorAll('button')];
      tabButtons.forEach(b=>{if(b.textContent.trim()==='Cost Control')b.textContent='Kontrol Biaya';});

      let root=host.querySelector('#'+HOST_ID);
      if(root){return;}

      const fin=detail.fin||[];
      const cashOut=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR').reduce((t,x)=>t+Number(x.amount||0),0);
      const r=detail.rap||{};
      const cats=[
        ['material','Material'],['labor','Upah'],['equipment','Alat'],
        ['operational','Operasional'],['subcontract','Subkon'],['other','Lain-Lain']
      ];
      const rows=cats.map(([key,label])=>{
        const rap=getRap(r,key);
        const real=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR' && String(x.category||'').trim().toLowerCase()===label.toLowerCase()).reduce((s,x)=>s+Number(x.amount||0),0);
        const used=rap>0?(real/rap)*100:0;
        return {label,rap,real,remaining:rap-real,used};
      });
      const totalRap=rows.reduce((s,x)=>s+x.rap,0) || Number(r.total||r.total_rap||0);
      const progress=Math.max(0,Math.min(100,getProgress(detail)));
      const costRatio=totalRap>0?(cashOut/totalRap)*100:0;
      const gap=progress-costRatio;
      let status='TERKONTROL', cls='ccv1-ok';
      if(gap < -10){status='BERISIKO';cls='ccv1-risk';}
      else if(gap < 0){status='PERLU PERHATIAN';cls='ccv1-warn';}

      root=document.createElement('div');
      root.id=HOST_ID;
      root.className='ccv1-wrap';
      root.innerHTML=`
        <div class="ccv1-kpis">
          <div class="ccv1-card">
            <div class="ccv1-label">RAP</div>
            <div class="ccv1-value">${money(totalRap)}</div>
            <div class="ccv1-sub">Anggaran proyek</div>
          </div>
          <div class="ccv1-card">
            <div class="ccv1-label">Realisasi Biaya</div>
            <div class="ccv1-value">${money(cashOut)}</div>
            <div class="ccv1-sub">Cost Ratio ${pct(costRatio)}</div>
          </div>
          <div class="ccv1-card">
            <div class="ccv1-label">Progress</div>
            <div class="ccv1-value">${pct(progress)}</div>
            <div class="ccv1-progress"><i style="width:${progress}%"></i></div>
          </div>
          <div class="ccv1-card">
            <div class="ccv1-label">Gap Progress vs Biaya</div>
            <div class="ccv1-value ${gap>=0?'ccv1-gap-positive':'ccv1-gap-negative'}">${gap>=0?'+':''}${pct(gap)}</div>
            <span class="ccv1-status ${cls}">${status}</span>
          </div>
        </div>
        <div class="ccv1-panel">
          <div class="ccv1-panel-head">
            <div><h3>Perbandingan RAP & Realisasi</h3><p>Kontrol biaya berdasarkan anggaran, biaya aktual, dan progress pekerjaan.</p></div>
          </div>
          <table class="ccv1-table">
            <thead><tr><th>Kategori</th><th>RAP</th><th>Realisasi</th><th>Sisa RAP</th><th>% Terpakai</th></tr></thead>
            <tbody>
              ${rows.map(x=>`<tr><td>${esc(x.label)}</td><td>${money(x.rap)}</td><td>${money(x.real)}</td><td>${money(x.remaining)}</td><td class="barcell">${pct(x.used)}<div class="ccv1-mini"><i style="width:${Math.max(0,Math.min(100,x.used))}%"></i></div></td></tr>`).join('')}
            </tbody>
          </table>
          <div class="ccv1-foot">Indikator utama: bila Cost Ratio bergerak lebih cepat daripada Progress, proyek perlu mendapat perhatian lebih lanjut.</div>
        </div>`;
      tabs.parentElement.appendChild(root);
    }finally{busy=false;}
  }

  addStyle();
  const obs=new MutationObserver(render);
  obs.observe(document.body,{childList:true,subtree:true});
  setInterval(render,800);
  render();
})();
