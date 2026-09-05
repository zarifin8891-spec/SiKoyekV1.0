/* SiKoyek V1.0 — Laporan Cash Flow v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_CASHFLOW_V2__)return;
  window.__SIKOYEK_LAPORAN_CASHFLOW_V2__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const txKind=row=>String(row?.transaction_type||'').trim().toUpperCase();
  const txDate=row=>String(row?.transaction_date||'').slice(0,10);
  const txAmount=row=>Number(row?.amount||0)||0;

  function styles(){
    if(document.getElementById('cashflow-v2-styles'))return;
    const s=document.createElement('style');s.id='cashflow-v2-styles';s.textContent=`
      .cashflow-v2{display:grid;gap:10px}
      .cashflow-v2-toolbar{display:grid;grid-template-columns:220px 145px 145px 230px repeat(4,minmax(100px,1fr));gap:7px;align-items:stretch}
      .cashflow-v2-filter,.cashflow-v2-kpi{border:1px solid #dfe5ec;border-radius:10px;background:#fff;box-sizing:border-box;min-height:62px}
      .cashflow-v2-filter{padding:7px 10px;display:flex;flex-direction:column;justify-content:center}
      .cashflow-v2-filter label{display:block;font-size:10px;font-weight:700;color:#64748b;margin:0 0 4px}
      .cashflow-v2-filter select,.cashflow-v2-filter input{width:100%;height:34px;border:1px solid #d8dee8;border-radius:7px;background:#fff;padding:0 9px;font-size:13px;box-sizing:border-box}
      .cashflow-v2-kpi{padding:8px 9px;display:flex;flex-direction:column;justify-content:center}
      .cashflow-v2-kpi small{display:block;font-size:9px;font-weight:800;letter-spacing:.25px;color:#64748b}
      .cashflow-v2-kpi strong{display:block;margin-top:3px;font-size:14px;line-height:1.15;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cashflow-v2-actions{display:flex;justify-content:flex-start}
      .cashflow-v2-actions button{height:28px;border:1px solid #d8dee8;border-radius:7px;background:#f8fafc;padding:0 9px;cursor:pointer;font-size:11px}
      .cashflow-v2-section{border:1px solid var(--line,#dfe5ec);background:#fff;border-radius:10px;overflow:hidden}
      .cashflow-v2-section-title{padding:10px 12px;font-size:12px;font-weight:800;border-bottom:1px solid var(--line,#dfe5ec)}
      .cashflow-v2-table{width:100%;border-collapse:collapse}
      .cashflow-v2-table th,.cashflow-v2-table td{padding:9px 10px;border-bottom:1px solid var(--line,#dfe5ec);font-size:12px;text-align:left;white-space:nowrap}
      .cashflow-v2-table th{font-size:9px;color:#64748b;text-transform:uppercase;background:#fafbfd}
      .cashflow-v2-table .num{text-align:right}
      .cashflow-v2-table tr:last-child td{border-bottom:0}
      .cashflow-v2-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:800}
      .cashflow-v2-pill.ok{background:var(--green2,#eaf7f0);color:var(--green,#047857)}
      .cashflow-v2-pill.watch{background:var(--amber2,#fff6df);color:var(--amber,#a16207)}
      .cashflow-v2-pill.risk{background:var(--red2,#fdecec);color:var(--red,#b91c1c)}
      .cashflow-v2-scroll{overflow:auto}
      .cashflow-v2-empty{padding:18px;text-align:center;color:var(--muted,#64748b)}
      @media(max-width:1200px){.cashflow-v2-toolbar{grid-template-columns:220px 145px 145px 230px repeat(4,minmax(100px,1fr));overflow:auto}.cashflow-v2-toolbar>*{min-width:100px}.cashflow-v2-toolbar>.cashflow-v2-filter:first-child,.cashflow-v2-toolbar>.cashflow-v2-filter:nth-child(4){min-width:220px}}
    `;document.head.appendChild(s);
  }

  let projects=[],transactions=[];
  const state={period:'all',from:'',to:'',project:'all'};

  async function load(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:p,error:e1},{data:t,error:e2}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name').order('project_code',{ascending:true}),
      client.from('financial_transactions').select('id,project_id,transaction_date,transaction_type,category,description,amount').order('transaction_date',{ascending:true})
    ]);
    if(e1)throw e1;if(e2)throw e2;
    projects=p||[];transactions=t||[];
  }

  function periodRange(){
    if(state.period==='custom')return {from:state.from,to:state.to};
    const now=new Date();const today=localDate(now);
    if(state.period==='today')return {from:today,to:today};
    if(state.period==='week'){const d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7));return {from:localDate(d),to:today};}
    if(state.period==='month')return {from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(state.period==='quarter'){const d=new Date(now);d.setMonth(d.getMonth()-2);d.setDate(1);return {from:localDate(d),to:today};}
    if(state.period==='year')return {from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    return {from:'',to:''};
  }

  function calculate(){
    const r=periodRange();
    const projectFilter=state.project==='all'?null:String(state.project);
    const filtered=transactions.filter(tx=>{
      const d=txDate(tx);const type=txKind(tx);const amount=txAmount(tx);
      return !!d && amount>=0 && (!r.from||d>=r.from) && (!r.to||d<=r.to) && (!projectFilter||String(tx.project_id)===projectFilter) && (type==='MASUK'||type==='KELUAR');
    });
    const meta=new Map(projects.map(p=>[String(p.id),p]));
    const byProject=new Map();
    for(const tx of filtered){
      const pid=String(tx.project_id||'');
      if(!byProject.has(pid))byProject.set(pid,{id:pid,in:0,out:0,transactions:0});
      const row=byProject.get(pid);
      if(txKind(tx)==='MASUK')row.in+=txAmount(tx);else row.out+=txAmount(tx);
      row.transactions++;
    }
    const projectRows=[...byProject.values()].map(r=>{const p=meta.get(r.id)||{};return {...r,code:p.project_code||'-',name:p.project_name||'-',net:r.in-r.out};}).sort((a,b)=>String(a.code).localeCompare(String(b.code),'id'));
    const cin=filtered.filter(x=>txKind(x)==='MASUK').reduce((a,x)=>a+txAmount(x),0);
    const cout=filtered.filter(x=>txKind(x)==='KELUAR').reduce((a,x)=>a+txAmount(x),0);
    return {range:r,filtered,projectRows,cin,cout,net:cin-cout};
  }

  function status(row){
    const net=row.in-row.out;
    if(row.transactions===0)return ['TIDAK ADA AKTIVITAS','watch'];
    if(net<0)return ['BERISIKO','risk'];
    if(row.in>0&&net/row.in<0.2)return ['PERLU PENGAWASAN','watch'];
    return ['SEHAT','ok'];
  }

  function metaProject(id){const p=projects.find(x=>String(x.id)===String(id));return p?{code:p.project_code||'-',name:p.project_name||'-'}:{code:'-',name:'-'};}

  function render(){
    const el=document.getElementById('reportContent');if(!el)return;
    const calc=calculate();
    const opts=projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('');
    const txRows=calc.filtered.slice().sort((a,b)=>txDate(b).localeCompare(txDate(a)));
    const pRows=calc.projectRows;
    el.innerHTML=`<div class="cashflow-v2">
      <div class="cashflow-v2-toolbar">
        <div class="cashflow-v2-filter"><label>Periode</label><select id="cashflowV2Period"><option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option></select></div>
        <div class="cashflow-v2-filter"><label>Dari Tanggal</label><input id="cashflowV2From" type="date"></div>
        <div class="cashflow-v2-filter"><label>Sampai Tanggal</label><input id="cashflowV2To" type="date"></div>
        <div class="cashflow-v2-filter"><label>Proyek</label><select id="cashflowV2Project"><option value="all">Semua Proyek</option>${opts}</select></div>
        <div class="cashflow-v2-kpi"><small>CASH IN</small><strong>${money(calc.cin)}</strong></div>
        <div class="cashflow-v2-kpi"><small>CASH OUT</small><strong>${money(calc.cout)}</strong></div>
        <div class="cashflow-v2-kpi"><small>NET CASH FLOW</small><strong>${money(calc.net)}</strong></div>
        <div class="cashflow-v2-kpi"><small>JUMLAH TRANSAKSI</small><strong>${calc.filtered.length}</strong></div>
      </div>
      <div class="cashflow-v2-actions"><button type="button" id="cashflowV2Reset">Reset</button></div>
      <div class="cashflow-v2-section"><div class="cashflow-v2-section-title">Ringkasan Cash Flow per Proyek</div><div class="cashflow-v2-scroll"><table class="cashflow-v2-table"><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th class="num">Transaksi</th><th>Status</th></tr></thead><tbody>${pRows.length?pRows.map(r=>{const st=status(r);return `<tr><td><strong>${esc(r.code)}</strong></td><td>${esc(r.name)}</td><td class="num">${money(r.in)}</td><td class="num">${money(r.out)}</td><td class="num">${money(r.net)}</td><td class="num">${r.transactions}</td><td><span class="cashflow-v2-pill ${st[1]}">${st[0]}</span></td></tr>`}).join(''):`<tr><td colspan="7" class="cashflow-v2-empty">Tidak ada transaksi pada filter yang dipilih.</td></tr>`}</tbody></table></div></div>
      <div class="cashflow-v2-section"><div class="cashflow-v2-section-title">Detail Transaksi</div><div class="cashflow-v2-scroll"><table class="cashflow-v2-table"><thead><tr><th>Tanggal</th><th>Kode</th><th>Nama Proyek</th><th>Jenis</th><th>Kategori</th><th>Deskripsi</th><th class="num">Cash In</th><th class="num">Cash Out</th></tr></thead><tbody>${txRows.length?txRows.map(tx=>{const p=metaProject(tx.project_id),isIn=txKind(tx)==='MASUK';return `<tr><td>${esc(txDate(tx))}</td><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(txKind(tx))}</td><td>${esc(tx.category||'-')}</td><td>${esc(tx.description||'-')}</td><td class="num">${money(isIn?txAmount(tx):0)}</td><td class="num">${money(!isIn?txAmount(tx):0)}</td></tr>`}).join(''):`<tr><td colspan="8" class="cashflow-v2-empty">Tidak ada transaksi pada filter yang dipilih.</td></tr>`}</tbody></table></div></div>
    </div>`;
    document.getElementById('cashflowV2Period').value=state.period;
    document.getElementById('cashflowV2From').value=state.from;
    document.getElementById('cashflowV2To').value=state.to;
    document.getElementById('cashflowV2Project').value=state.project;
    const refresh=()=>{state.period=document.getElementById('cashflowV2Period').value;state.project=document.getElementById('cashflowV2Project').value;if(state.period!=='custom'){const r=periodRange();state.from=r.from;state.to=r.to;}render();};
    document.getElementById('cashflowV2Period').addEventListener('change',refresh);
    document.getElementById('cashflowV2From').addEventListener('change',()=>{state.from=document.getElementById('cashflowV2From').value;state.period='custom';render();});
    document.getElementById('cashflowV2To').addEventListener('change',()=>{state.to=document.getElementById('cashflowV2To').value;state.period='custom';render();});
    document.getElementById('cashflowV2Project').addEventListener('change',()=>{state.project=document.getElementById('cashflowV2Project').value;render();});
    document.getElementById('cashflowV2Reset').addEventListener('click',()=>{state.period='all';state.from='';state.to='';state.project='all';render();});
  }

  async function open(){styles();await load();render();}
  window.openLaporanCashFlow=open;
  window.renderLaporanCashFlow=render;
})();