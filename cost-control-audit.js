(function(){
  const STYLE_ID='cost-control-v2-style';
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
      .ccv1-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .ccv1-card{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:13px 15px;min-width:0;box-shadow:0 8px 22px rgba(15,35,65,.04)}
      .ccv1-label{font-size:10px;color:var(--muted);font-weight:650;text-transform:uppercase;letter-spacing:.02em}
      .ccv1-value{font-size:21px;line-height:1.1;font-weight:650;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ccv1-sub{font-size:11px;color:var(--muted);margin-top:6px}
      .ccv1-progress{height:7px;background:#edf1f6;border-radius:999px;overflow:hidden;margin-top:9px}
      .ccv1-progress i{display:block;height:100%;background:var(--blue);border-radius:999px}
      .ccv1-gap-positive{color:var(--green)} .ccv1-gap-negative{color:var(--red)}
      .ccv1-status{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;margin-top:7px}
      .ccv1-ok{background:var(--green2);color:var(--green)}
      .ccv1-warn{background:var(--amber2);color:var(--amber)}
      .ccv1-risk{background:var(--red2);color:var(--red)}
      .ccv1-panel{background:var(--card);border:1px solid var(--line);border-radius:15px;overflow:hidden}
      .ccv1-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:15px 17px 11px}
      .ccv1-panel-head h3{margin:0;font-size:17px}
      .ccv1-panel-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
      .ccv1-compare{display:grid;grid-template-columns:1fr 1fr .82fr;gap:0;border-top:1px solid var(--line);margin:0 17px 14px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
      .ccv1-compare-box{padding:14px 15px;min-width:0;background:#fbfcfe}
      .ccv1-compare-box+.ccv1-compare-box{border-left:1px solid var(--line)}
      .ccv1-compare-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.02em}
      .ccv1-compare-value{font-size:21px;font-weight:650;margin-top:7px}
      .ccv1-compare-note{font-size:11px;color:var(--muted);margin-top:6px}
      .ccv1-compare-bar{height:8px;background:#edf1f6;border-radius:999px;overflow:hidden;margin-top:9px}
      .ccv1-compare-bar i{display:block;height:100%;border-radius:999px}
      .ccv1-green i{background:var(--green)} .ccv1-blue i{background:var(--blue)}
      .ccv1-foot{padding:0 17px 14px;color:var(--muted);font-size:11px}
      @media(max-width:1100px){.ccv1-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:760px){.ccv1-kpis{grid-template-columns:repeat(2,1fr)}.ccv1-compare{grid-template-columns:1fr}.ccv1-compare-box+.ccv1-compare-box{border-left:0;border-top:1px solid var(--line)}}
      @media(max-width:520px){.ccv1-kpis{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function readProgressValue(obj){
    if(!obj || typeof obj!=='object')return null;
    const candidates=[obj.progress,obj.progress_pct,obj.progressPercent,obj.current_progress,obj.actual_progress,obj.real_progress,obj.realisasi_progress,obj.persentase,obj.percentage];
    for(const x of candidates){
      if(x===null || x===undefined || x==='')continue;
      const n=Number(String(x).replace('%',''));
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
      let weighted=0,totalWeight=0;
      for(const item of list){
        const p=readProgressValue(item),w=readWeight(item);
        if(p!==null && w!==null){weighted+=p*w;totalWeight+=w;}
      }
      if(totalWeight>0)return Math.max(0,Math.min(100,weighted/totalWeight));
    }
    return 0;
  }
  function getRap(r,key){
    const aliases={material:['material'],labor:['labor','upah'],equipment:['equipment','alat'],operational:['operational'],subcontract:['subcontract','subkon'],other:['other','lain_lain','lainlain']};
    for(const k of aliases[key]||[]){const n=Number(r?.[k]);if(Number.isFinite(n))return n;}
    return 0;
  }
  function getDate(obj,names){
    for(const k of names){if(obj?.[k]){const d=new Date(obj[k]);if(!Number.isNaN(d.getTime()))return d;}}
    return null;
  }
  function estimatedDurationDays(detail,progress){
    if(progress<=0)return null;
    const start=getDate(detail,['start_date','startDate','mulai','tanggal_mulai','project_start']);
    if(!start)return null;
    const elapsed=Math.max(0,Math.ceil((Date.now()-start.getTime())/86400000));
    if(elapsed<=0)return null;
    return Math.max(elapsed,Math.round(elapsed/(progress/100)));
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
      if(!root){root=document.createElement('div');root.id=HOST_ID;root.className='ccv1-wrap';tabs.parentElement.appendChild(root);}

      const fin=detail.fin||[];
      const cashOut=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR').reduce((t,x)=>t+Number(x.amount||0),0);
      const r=detail.rap||{};
      const cats=[['material','Material'],['labor','Upah'],['equipment','Alat'],['operational','Operasional'],['subcontract','Subkon'],['other','Lain-Lain']];
      const rows=cats.map(([key,label])=>{
        const rap=getRap(r,key);
        const real=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR' && String(x.category||'').trim().toLowerCase()===label.toLowerCase()).reduce((s,x)=>s+Number(x.amount||0),0);
        return {label,rap,real};
      });
      const totalRap=rows.reduce((s,x)=>s+x.rap,0) || Number(r.total||r.total_rap||0);
      const progress=Math.max(0,Math.min(100,getProgress(detail)));
      const costRatio=totalRap>0?(cashOut/totalRap)*100:0;
      const rapConsumption=costRatio;
      const gap=progress-costRatio;
      let status='TERKONTROL',cls='ccv1-ok';
      if(gap < -10){status='BERISIKO';cls='ccv1-risk';}
      else if(gap < 0){status='PERLU PERHATIAN';cls='ccv1-warn';}
      const est=estimatedDurationDays(detail,progress);
      const durationText=est?est+' Hari':'—';

      root.innerHTML=`
        <div class="ccv1-kpis">
          <div class="ccv1-card"><div class="ccv1-label">Realisasi Biaya</div><div class="ccv1-value">${money(cashOut)}</div><div class="ccv1-sub">Biaya aktual / pengeluaran</div></div>
          <div class="ccv1-card"><div class="ccv1-label">Rasio Biaya</div><div class="ccv1-value">${pct(costRatio)}</div><div class="ccv1-sub">Realisasi / RAP</div></div>
          <div class="ccv1-card"><div class="ccv1-label">RAP Terpakai</div><div class="ccv1-value">${pct(rapConsumption)}</div><div class="ccv1-sub">${money(cashOut)} dari ${money(totalRap)}</div></div>
          <div class="ccv1-card"><div class="ccv1-label">Gap Progress vs Biaya</div><div class="ccv1-value ${gap>=0?'ccv1-gap-positive':'ccv1-gap-negative'}">${gap>=0?'+':''}${pct(gap)}</div><span class="ccv1-status ${cls}">${status}</span></div>
          <div class="ccv1-card"><div class="ccv1-label">Estimasi Lama</div><div class="ccv1-value">${durationText}</div><div class="ccv1-sub">Perkiraan durasi berdasarkan progress berjalan</div></div>
        </div>
        <div class="ccv1-panel">
          <div class="ccv1-panel-head"><div><h3>Progress vs Biaya</h3><p>Perbandingan progress pekerjaan dengan realisasi biaya terhadap RAP.</p></div></div>
          <div class="ccv1-compare">
            <div class="ccv1-compare-box"><div class="ccv1-compare-label">Progress Pekerjaan</div><div class="ccv1-compare-value">${pct(progress)}</div><div class="ccv1-compare-bar ccv1-green"><i style="width:${progress}%"></i></div><div class="ccv1-compare-note">Progress berdasarkan bobot item pekerjaan.</div></div>
            <div class="ccv1-compare-box"><div class="ccv1-compare-label">Rasio Biaya / RAP Terpakai</div><div class="ccv1-compare-value">${pct(costRatio)}</div><div class="ccv1-compare-bar ccv1-blue"><i style="width:${Math.max(0,Math.min(100,costRatio))}%"></i></div><div class="ccv1-compare-note">${money(cashOut)} dari RAP ${money(totalRap)}.</div></div>
            <div class="ccv1-compare-box"><div class="ccv1-compare-label">Gap Progress vs Biaya</div><div class="ccv1-compare-value ${gap>=0?'ccv1-gap-positive':'ccv1-gap-negative'}">${gap>=0?'+':''}${pct(gap)}</div><span class="ccv1-status ${cls}">${status}</span><div class="ccv1-compare-note">${gap>=0?'Progress bergerak lebih cepat atau seimbang dengan biaya.':'Biaya bergerak lebih cepat daripada progress.'}</div></div>
          </div>
          <div class="ccv1-foot">Patokan utama: jika biaya tumbuh lebih cepat daripada progress, proyek perlu mendapat perhatian lebih lanjut.</div>
        </div>`;
    }finally{busy=false;}
  }

  addStyle();
  const obs=new MutationObserver(render);
  obs.observe(document.body,{childList:true,subtree:true});
  setInterval(render,800);
  render();
})();
