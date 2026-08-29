(function(){
  if(window.__SIKOYEK_COST_CONTROL_V3__)return;
  window.__SIKOYEK_COST_CONTROL_V3__=true;
  const STYLE_ID='cost-control-v3-style',HOST_ID='cost-control-v3';
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  function num(v){const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function progressOf(o){
    if(!o||typeof o!=='object')return null;
    for(const k of ['progress','progress_pct','progressPercent','current_progress','actual_progress','real_progress','realisasi_progress','persentase','percentage']){
      if(o[k]!==null&&o[k]!==undefined&&o[k]!==''){const n=num(o[k]);if(Number.isFinite(n))return n<=1?n*100:n;}
    }
    return null;
  }
  function weightOf(o){
    if(!o||typeof o!=='object')return null;
    for(const k of ['bobot','weight','weight_pct','weightPercent','persentase_bobot','percentage_weight']){
      if(o[k]!==null&&o[k]!==undefined&&o[k]!==''){const n=num(o[k]);if(Number.isFinite(n))return n<=1?n*100:n;}
    }
    return null;
  }
  function getProgress(d){
    const direct=progressOf(d);if(direct!==null)return Math.max(0,Math.min(100,direct));
    for(const k of ['items','work_items','workItems','pekerjaan','items_pekerjaan','itemPekerjaan']){
      const a=d?.[k];if(!Array.isArray(a)||!a.length)continue;
      let sum=0,wSum=0;for(const x of a){const p=progressOf(x),w=weightOf(x);if(p!==null&&w!==null){sum+=p*w;wSum+=w;}}
      if(wSum)return Math.max(0,Math.min(100,sum/wSum));
    }return 0;
  }
  function rapVal(r,keys){for(const k of keys){const n=num(r?.[k]);if(Number.isFinite(n)&&n!==0)return n;}return 0;}
  function contractOf(d){return num(d?.contract??d?.contract_value??d?.contract_amount??d?.nilai_kontrak??d?.nilaiKontrak);}
  function addStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #${HOST_ID}{display:grid;gap:14px;margin-top:4px}
    #${HOST_ID} .ccv3-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
    #${HOST_ID} .ccv3-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;min-width:0}
    #${HOST_ID} .ccv3-label{font-size:10px;color:var(--muted);font-weight:650;text-transform:uppercase;letter-spacing:.02em}
    #${HOST_ID} .ccv3-value{font-size:20px;line-height:1.12;font-weight:600;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #${HOST_ID} .ccv3-sub{font-size:10px;color:var(--muted);margin-top:5px}
    #${HOST_ID} .ccv3-gap-pos{color:var(--green)} #${HOST_ID} .ccv3-gap-neg{color:var(--red)}
    #${HOST_ID} .ccv3-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:650;margin-top:6px}
    #${HOST_ID} .ok{background:var(--green2);color:var(--green)} #${HOST_ID} .warn{background:var(--amber2);color:var(--amber)} #${HOST_ID} .risk{background:var(--red2);color:var(--red)}
    #${HOST_ID} .ccv3-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
    #${HOST_ID} .ccv3-head{padding:14px 16px 9px}
    #${HOST_ID} .ccv3-head h3{margin:0;font-size:16px} #${HOST_ID} .ccv3-head p{margin:4px 0 0;color:var(--muted);font-size:11px}
    #${HOST_ID} table{width:100%;border-collapse:collapse;table-layout:fixed}
    #${HOST_ID} th,#${HOST_ID} td{padding:9px 12px;border-top:1px solid var(--line);font-size:12px;white-space:nowrap;text-align:left}
    #${HOST_ID} th{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;background:#fafbfd}
    #${HOST_ID} th:nth-child(1),#${HOST_ID} td:nth-child(1){width:20%}
    #${HOST_ID} th:nth-child(2),#${HOST_ID} td:nth-child(2),#${HOST_ID} th:nth-child(3),#${HOST_ID} td:nth-child(3),#${HOST_ID} th:nth-child(4),#${HOST_ID} td:nth-child(4){width:20%}
    #${HOST_ID} th:nth-child(5),#${HOST_ID} td:nth-child(5){width:20%}
    #${HOST_ID} td:nth-child(n+2){text-align:right}
    #${HOST_ID} .bar{height:5px;background:#edf1f6;border-radius:99px;overflow:hidden;margin-top:4px}
    #${HOST_ID} .bar i{display:block;height:100%;background:var(--blue);border-radius:99px}
    @media(max-width:1050px){#${HOST_ID} .ccv3-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:700px){#${HOST_ID} .ccv3-kpis{grid-template-columns:repeat(2,1fr)}#${HOST_ID} .ccv3-panel{overflow:auto}#${HOST_ID} table{min-width:760px}}
    @media(max-width:480px){#${HOST_ID} .ccv3-kpis{grid-template-columns:1fr}}
  `;document.head.appendChild(s);}
  function render(){
    if(typeof state==='undefined'||state.page!=='detail'||state.detailTab!=='cost'||!state.selected)return;
    const host=document.getElementById('page'),d=state.detail;if(!host||!d||!d.fin)return;
    const tabs=host.querySelector('.tabs');if(!tabs)return;
    const buttons=[...tabs.querySelectorAll('button')];buttons.forEach(b=>{if(['Cost Control','Kontrol Biaya'].includes(b.textContent.trim()))b.textContent='Kontrol Biaya';});
    let root=host.querySelector('#'+HOST_ID);if(!root){root=document.createElement('div');root.id=HOST_ID;tabs.parentElement.appendChild(root);}
    const fin=d.fin||[],cashOut=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR').reduce((s,x)=>s+num(x.amount),0),r=d.rap||{};
    const cats=[['material','Material'],['labor','Upah'],['equipment','Alat'],['operational','Operasional'],['subcontract','Subkon'],['other','Lain-Lain']];
    const rows=cats.map(([key,label])=>{const rap=rapVal(r,key==='labor'?['labor','upah']:key==='equipment'?['equipment','alat']:key==='subcontract'?['subcontract','subkon']:key==='other'?['other','lain_lain','lainlain']:[key]);const real=fin.filter(x=>String(x.transaction_type||'').toUpperCase()==='KELUAR'&&String(x.category||'').trim().toLowerCase()===label.toLowerCase()).reduce((s,x)=>s+num(x.amount),0);return{label,rap,real};});
    const totalRap=rows.reduce((s,x)=>s+x.rap,0)||num(r.total??r.total_rap),progress=getProgress(d),ratio=totalRap?cashOut/totalRap*100:0,gap=progress-ratio,contract=contractOf(d),profit=contract-totalRap;
    let status='TERKONTROL',cls='ok';if(gap<-10){status='BERISIKO';cls='risk';}else if(gap<0){status='PERLU PERHATIAN';cls='warn';}
    root.innerHTML=`<div class="ccv3-kpis">
      <div class="ccv3-card"><div class="ccv3-label">Realisasi Biaya</div><div class="ccv3-value">${money(cashOut)}</div><div class="ccv3-sub">Biaya aktual</div></div>
      <div class="ccv3-card"><div class="ccv3-label">Rasio Biaya</div><div class="ccv3-value">${pct(ratio)}</div><div class="ccv3-sub">Realisasi terhadap RAP</div></div>
      <div class="ccv3-card"><div class="ccv3-label">RAP Terpakai</div><div class="ccv3-value">${pct(ratio)}</div><div class="ccv3-sub">Persentase RAP yang sudah terpakai</div></div>
      <div class="ccv3-card"><div class="ccv3-label">Gap Progress vs Biaya</div><div class="ccv3-value ${gap>=0?'ccv3-gap-pos':'ccv3-gap-neg'}">${gap>=0?'+':''}${pct(gap)}</div><span class="ccv3-status ${cls}">${status}</span></div>
      <div class="ccv3-card"><div class="ccv3-label">Estimasi Laba</div><div class="ccv3-value">${money(profit)}</div><div class="ccv3-sub">Nilai kontrak dikurangi RAP</div></div>
    </div>
    <div class="ccv3-panel"><div class="ccv3-head"><h3>Perbandingan RAP & Realisasi</h3><p>Kontrol biaya berdasarkan anggaran dan biaya aktual per kategori.</p></div>
      <table><thead><tr><th>Kategori</th><th>RAP</th><th>Realisasi</th><th>Sisa RAP</th><th>% RAP Terpakai</th></tr></thead><tbody>
      ${rows.map(x=>{const used=x.rap>0?x.real/x.rap*100:0;return `<tr><td>${esc(x.label)}</td><td>${money(x.rap)}</td><td>${money(x.real)}</td><td>${money(x.rap-x.real)}</td><td>${pct(used)}<div class="bar"><i style="width:${Math.max(0,Math.min(100,used))}%"></i></div></td></tr>`}).join('')}</tbody></table>
    </div>`;
  }
  addStyle();
  let lastHost=null;
  setInterval(()=>{const h=document.getElementById('page');if(h!==lastHost){lastHost=h;render();}else if(typeof state!=='undefined'&&state.page==='detail'&&state.detailTab==='cost'&&!h?.querySelector('#'+HOST_ID))render();},1200);
  render();
})();
