/* SiKoyek V1.0 — Laporan Cash Flow v4 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_CASHFLOW_V4__)return;
  window.__SIKOYEK_LAPORAN_CASHFLOW_V4__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const txType=r=>String(r?.transaction_type||'').trim().toUpperCase();
  const txDate=r=>String(r?.transaction_date||'').slice(0,10);
  const amount=r=>Math.abs(Number(r?.amount||0)||0);

  let projects=[],transactions=[];
  const state={period:'all',from:'',to:'',project:'all'};

  function styles(){
    if(document.getElementById('cashflow-v4-styles'))return;
    const s=document.createElement('style');s.id='cashflow-v4-styles';s.textContent=`
      .cashflow-v4{display:grid;gap:10px}
      .cashflow-v4-filters{display:grid;grid-template-columns:220px 145px 145px minmax(220px,1fr) auto;gap:7px;align-items:end}
      .cashflow-v4-filter,.cashflow-v4-kpi{border:1px solid #dfe5ec;border-radius:10px;background:#fff;box-sizing:border-box}
      .cashflow-v4-filter{padding:7px 10px;display:flex;flex-direction:column;justify-content:center;min-height:62px}
      .cashflow-v4-filter label{display:block;font-size:10px;font-weight:700;color:#64748b;margin:0 0 4px}
      .cashflow-v4-filter select,.cashflow-v4-filter input{width:100%;height:34px;border:1px solid #d8dee8;border-radius:7px;background:#fff;padding:0 9px;font-size:13px;box-sizing:border-box}
      .cashflow-v4-actions{display:flex;justify-content:flex-end;align-items:center;height:62px}
      .cashflow-v4-actions button{height:34px;border:1px solid #d8dee8;border-radius:7px;background:#f8fafc;padding:0 12px;cursor:pointer;font-size:11px;font-weight:700}
      .cashflow-v4-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
      .cashflow-v4-kpi{padding:9px 10px;min-height:68px;display:flex;flex-direction:column;justify-content:center;min-width:0;overflow:hidden}
      .cashflow-v4-kpi small{display:block;font-size:9px;font-weight:800;letter-spacing:.25px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cashflow-v4-kpi strong{display:block;margin-top:4px;font-size:15px;line-height:1.15;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cashflow-v4-section{border:1px solid var(--line,#dfe5ec);background:#fff;border-radius:10px;overflow:hidden}
      .cashflow-v4-title{padding:10px 12px;font-size:12px;font-weight:800;border-bottom:1px solid var(--line,#dfe5ec)}
      .cashflow-v4-scroll{overflow:auto}
      .cashflow-v4-table{width:100%;border-collapse:collapse}
      .cashflow-v4-table th,.cashflow-v4-table td{padding:9px 10px;border-bottom:1px solid var(--line,#dfe5ec);font-size:12px;text-align:left;white-space:nowrap}
      .cashflow-v4-table th{font-size:9px;color:#64748b;text-transform:uppercase;background:#fafbfd}
      .cashflow-v4-table .num{text-align:right}
      .cashflow-v4-table tr:last-child td{border-bottom:0}
      .cashflow-v4-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:800}
      .cashflow-v4-pill.ok{background:var(--green2,#eaf7f0);color:var(--green,#047857)}
      .cashflow-v4-pill.watch{background:var(--amber2,#fff6df);color:var(--amber,#a16207)}
      .cashflow-v4-pill.risk{background:var(--red2,#fdecec);color:var(--red,#b91c1c)}
      .cashflow-v4-empty{padding:18px;text-align:center;color:var(--muted,#64748b)}
      .cashflow-v4-total td{font-weight:800;background:#fafbfd}
      @media(max-width:900px){.cashflow-v4-filters{grid-template-columns:1fr 1fr}.cashflow-v4-actions{height:62px;justify-content:flex-start}.cashflow-v4-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.cashflow-v4-filters{grid-template-columns:1fr}.cashflow-v4-kpis{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s);
  }

  async function load(){
    const client=window.SK?.sb||window.sb;if(!client)throw new Error('Supabase client belum siap.');
    const [{data:p,error:e1},{data:t,error:e2}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name').order('project_code',{ascending:true}),
      client.from('financial_transactions').select('id,project_id,transaction_date,transaction_type,category,description,amount').order('transaction_date',{ascending:true}).order('created_at',{ascending:true})
    ]);
    if(e1)throw e1;if(e2)throw e2;
    projects=p||[];transactions=t||[];
  }

  function lastMonthRange(){
    const now=new Date();
    return {from:localDate(new Date(now.getFullYear(),now.getMonth()-1,1)),to:localDate(new Date(now.getFullYear(),now.getMonth(),0))};
  }

  function range(){
    const now=new Date(),today=localDate(now);
    if(state.period==='this_month')return {from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(state.period==='last_month')return lastMonthRange();
    if(state.period==='this_year')return {from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    if(state.period==='custom')return {from:state.from||'',to:state.to||''};
    return {from:'',to:''};
  }

  function calculate(){
    const r=range(),pf=state.project==='all'?'':String(state.project);
    const filtered=transactions.filter(tx=>{
      const d=txDate(tx),type=txType(tx),a=amount(tx);
      return d&&a>0&&(type==='MASUK'||type==='KELUAR')&&(!r.from||d>=r.from)&&(!r.to||d<=r.to)&&(!pf||String(tx.project_id)===pf);
    });
    const meta=new Map(projects.map(p=>[String(p.id),p]));
    const map=new Map();
    for(const tx of filtered){
      const pid=String(tx.project_id||'');
      if(!map.has(pid))map.set(pid,{id:pid,in:0,out:0,count:0});
      const row=map.get(pid);if(txType(tx)==='MASUK')row.in+=amount(tx);else row.out+=amount(tx);row.count++;
    }
    const rows=[...map.values()].map(x=>{const p=meta.get(x.id)||{};return {...x,code:p.project_code||'-',name:p.project_name||'-',net:x.in-x.out};}).sort((a,b)=>String(a.code).localeCompare(String(b.code),'id'));
    const cin=filtered.reduce((a,x)=>a+(txType(x)==='MASUK'?amount(x):0),0);
    const cout=filtered.reduce((a,x)=>a+(txType(x)==='KELUAR'?amount(x):0),0);
    return {range:r,filtered,rows,cin,cout,net:cin-cout};
  }

  function status(row){
    if(row.count===0)return ['TIDAK ADA AKTIVITAS','watch'];
    if(row.net<0)return ['BERISIKO','risk'];
    if(row.in>0&&row.net/row.in<0.2)return ['PERLU PENGAWASAN','watch'];
    return ['SEHAT','ok'];
  }

  function periodOptions(){return '<option value="this_month">Bulan Ini</option><option value="last_month">Bulan Lalu</option><option value="this_year">Tahun Ini</option><option value="custom">Custom</option><option value="all">Semua Periode</option>';}

  function render(){
    const el=document.getElementById('reportContent');if(!el)return;
    const calc=calculate();
    const opts=projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('');
    const txRows=calc.filtered.slice().sort((a,b)=>`${txDate(b)}-${String(b.id)}`.localeCompare(`${txDate(a)}-${String(a.id)}`));
    const pRows=calc.rows;
    el.innerHTML=`<div class="cashflow-v4">
      <div class="cashflow-v4-filters">
        <div class="cashflow-v4-filter"><label>Periode</label><select id="cashflowV4Period" data-period-standard-skip="1">${periodOptions()}</select></div>
        <div class="cashflow-v4-filter"><label>Dari Tanggal</label><input id="cashflowV4From" type="date"></div>
        <div class="cashflow-v4-filter"><label>Sampai Tanggal</label><input id="cashflowV4To" type="date"></div>
        <div class="cashflow-v4-filter"><label>Proyek</label><select id="cashflowV4Project"><option value="all">Semua Proyek</option>${opts}</select></div>
        <div class="cashflow-v4-actions"><button type="button" id="cashflowV4Reset">Reset</button></div>
      </div>
      <div class="cashflow-v4-kpis">
        <div class="cashflow-v4-kpi"><small>CASH IN</small><strong>${money(calc.cin)}</strong></div>
        <div class="cashflow-v4-kpi"><small>CASH OUT</small><strong>${money(calc.cout)}</strong></div>
        <div class="cashflow-v4-kpi"><small>NET CASH FLOW</small><strong>${money(calc.net)}</strong></div>
        <div class="cashflow-v4-kpi"><small>JUMLAH TRANSAKSI</small><strong>${calc.filtered.length}</strong></div>
      </div>
      <div class="cashflow-v4-section"><div class="cashflow-v4-title">Ringkasan Cash Flow per Proyek</div><div class="cashflow-v4-scroll"><table class="cashflow-v4-table"><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th class="num">Transaksi</th><th>Status</th></tr></thead><tbody>${pRows.length?pRows.map(r=>{const st=status(r);return `<tr><td><strong>${esc(r.code)}</strong></td><td>${esc(r.name)}</td><td class="num">${money(r.in)}</td><td class="num">${money(r.out)}</td><td class="num">${money(r.net)}</td><td class="num">${r.count}</td><td><span class="cashflow-v4-pill ${st[1]}">${st[0]}</span></td></tr>`}).join(''):'<tr><td colspan="7" class="cashflow-v4-empty">Tidak ada transaksi pada filter yang dipilih.</td></tr>'}<tr class="cashflow-v4-total"><td colspan="2">TOTAL</td><td class="num">${money(calc.cin)}</td><td class="num">${money(calc.cout)}</td><td class="num">${money(calc.net)}</td><td class="num">${calc.filtered.length}</td><td></td></tr></tbody></table></div></div>
      <div class="cashflow-v4-section"><div class="cashflow-v4-title">Detail Transaksi</div><div class="cashflow-v4-scroll"><table class="cashflow-v4-table"><thead><tr><th>Tanggal</th><th>Kode</th><th>Nama Proyek</th><th>Jenis</th><th>Kategori</th><th>Deskripsi</th><th class="num">Cash In</th><th class="num">Cash Out</th></tr></thead><tbody>${txRows.length?txRows.map(tx=>{const isIn=txType(tx)==='MASUK',p=projects.find(x=>String(x.id)===String(tx.project_id));return `<tr><td>${esc(txDate(tx))}</td><td>${esc(p?.project_code||'-')}</td><td>${esc(p?.project_name||'-')}</td><td>${esc(txType(tx))}</td><td>${esc(tx.category||'-')}</td><td>${esc(tx.description||'-')}</td><td class="num">${money(isIn?amount(tx):0)}</td><td class="num">${money(!isIn?amount(tx):0)}</td></tr>`}).join(''):'<tr><td colspan="8" class="cashflow-v4-empty">Tidak ada transaksi pada filter yang dipilih.</td></tr>'}</tbody></table></div></div>
    </div>`;

    const p=document.getElementById('cashflowV4Period'),f=document.getElementById('cashflowV4From'),t=document.getElementById('cashflowV4To'),pr=document.getElementById('cashflowV4Project');
    p.value=state.period;pr.value=state.project;
    const r=calculate().range;f.value=r.from;t.value=r.to;

    p.addEventListener('change',()=>{
      state.period=p.value;
      if(state.period==='custom'){state.from=f.value||'';state.to=t.value||'';}
      else {const next=range();state.from=next.from;state.to=next.to;}
      render();
    });
    f.addEventListener('change',()=>{state.period='custom';state.from=f.value||'';state.to=t.value||'';render();});
    t.addEventListener('change',()=>{state.period='custom';state.from=f.value||'';state.to=t.value||'';render();});
    pr.addEventListener('change',()=>{state.project=pr.value||'all';render();});
    document.getElementById('cashflowV4Reset').addEventListener('click',()=>{state.period='all';state.from='';state.to='';state.project='all';render();});
  }

  async function open(){styles();await load();render();}
  window.openLaporanCashFlow=open;
  window.renderLaporanCashFlow=render;
})();