/* SiKoyek V1.0 — Laporan Cash Flow v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_CASHFLOW_V1__)return;
  window.__SIKOYEK_LAPORAN_CASHFLOW_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const txKind=row=>{
    const s=String(row?.type||row?.transaction_type||row?.kind||row?.direction||row?.category||'').toUpperCase();
    if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(s))return 'out';
    if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(s))return 'in';
    const amount=Number(row?.amount??row?.nominal??row?.value??0);
    return amount<0?'out':'in';
  };
  const txDate=row=>String(row?.transaction_date||row?.date||row?.tanggal||row?.created_at||'').slice(0,10);
  const txAmount=row=>Math.abs(Number(row?.amount??row?.nominal??row?.value??row?.total??0)||0);

  function styles(){
    if(document.getElementById('cashflow-v1-styles'))return;
    const s=document.createElement('style');s.id='cashflow-v1-styles';s.textContent=`
      .cashflow-period-toolbar{display:grid;grid-template-columns:220px 145px 145px 220px repeat(4,minmax(95px,1fr));gap:7px;align-items:stretch;margin:0 0 10px}
      .cashflow-period-filter,.cashflow-period-kpi{border:1px solid #dfe5ec;border-radius:10px;background:#fff;min-height:62px;box-sizing:border-box}
      .cashflow-period-filter{padding:7px 10px;display:flex;flex-direction:column;justify-content:center}
      .cashflow-period-toolbar .field label{display:block;font-size:10px;font-weight:700;color:#64748b;margin:0 0 4px}
      .cashflow-period-toolbar .field select{width:100%;height:34px;border:1px solid #d8dee8;border-radius:7px;background:#fff;padding:0 9px;font-size:13px;box-sizing:border-box}
      .cashflow-period-toolbar .field input{width:100%;height:36px;border:1px solid #d8dee8;border-radius:7px;padding:0 9px;font-size:12px;box-sizing:border-box}
      .cashflow-period-kpi{padding:8px 9px;display:flex;flex-direction:column;justify-content:center}
      .cashflow-period-kpi small{display:block;font-size:9px;font-weight:800;letter-spacing:.25px;color:#64748b}
      .cashflow-period-kpi strong{display:block;margin-top:3px;font-size:14px;line-height:1.15;color:#0f172a}
      .cashflow-period-actions{display:flex;gap:5px;margin-top:5px}
      .cashflow-period-actions button{height:28px;border:1px solid #d8dee8;border-radius:7px;background:#f8fafc;padding:0 9px;cursor:pointer;font-size:11px}
      .cashflow-table-status{font-weight:800;font-size:11px}
      .cashflow-table-status.risk{color:#b91c1c}.cashflow-table-status.watch{color:#a16207}.cashflow-table-status.ok{color:#047857}
      @media(max-width:1200px){.cashflow-period-toolbar{grid-template-columns:220px 145px 145px 220px repeat(4,minmax(100px,1fr));overflow:auto}.cashflow-period-toolbar>*{min-width:100px}.cashflow-period-toolbar>.cashflow-period-filter:first-child,.cashflow-period-toolbar>.cashflow-period-filter:nth-child(4){min-width:220px}}
    `;document.head.appendChild(s);
  }

  let projects=[],summary=[],transactions=[];
  const state={period:'ALL',from:'',to:'',project:'ALL'};

  async function load(){
    const [p,s,t]=await Promise.all([
      sb.from('projects').select('*').order('project_code',{ascending:true}),
      sb.from('project_summary').select('*').order('project_code',{ascending:true}),
      sb.from('financial_transactions').select('*').order('transaction_date',{ascending:true})
    ]);
    projects=p.data||[];summary=s.data||[];transactions=t.data||[];
  }

  function syncFromInputs(){
    const q=id=>document.getElementById(id);
    state.period=q('cashflowPeriod')?.value||'ALL';
    state.from=q('cashflowFrom')?.value||'';
    state.to=q('cashflowTo')?.value||'';
    state.project=q('cashflowProject')?.value||'ALL';
  }

  function applyPeriod(){
    const now=new Date();const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');
    if(state.period==='THIS_MONTH'){state.from=`${y}-${m}-01`;state.to=new Date(y,now.getMonth()+1,0).toISOString().slice(0,10)}
    else if(state.period==='LAST_MONTH'){const a=new Date(y,now.getMonth()-1,1),b=new Date(y,now.getMonth(),0);state.from=a.toISOString().slice(0,10);state.to=b.toISOString().slice(0,10)}
    else if(state.period==='THIS_YEAR'){state.from=`${y}-01-01`;state.to=`${y}-12-31`}
    else if(state.period==='ALL'){state.from='';state.to=''}
  }

  function rows(){
    const hasDate=!!(state.from||state.to);
    const projectIds=state.project==='ALL'?null:new Set([state.project]);
    if(!hasDate){
      return summary.filter(r=>!projectIds||projectIds.has(String(r.project_id))).map(r=>({
        id:String(r.project_id||''),code:r.project_code||'',name:r.project_name||'',in:Number(r.cash_in||0),out:Number(r.cash_out||0)
      }));
    }
    const map=new Map();
    for(const tx of transactions){
      const d=txDate(tx);if(!d)continue;
      if(state.from&&d<state.from)continue;if(state.to&&d>state.to)continue;
      const pid=String(tx.project_id||'');if(projectIds&&!projectIds.has(pid))continue;
      if(!map.has(pid))map.set(pid,{id:pid,code:'',name:'',in:0,out:0});
      const r=map.get(pid),amt=txAmount(tx);if(txKind(tx)==='out')r.out+=amt;else r.in+=amt;
    }
    const meta=new Map(summary.map(r=>[String(r.project_id),r]));
    return [...map.values()].map(r=>{const m=meta.get(r.id)||{};return {...r,code:m.project_code||'',name:m.project_name||''}}).sort((a,b)=>String(a.code).localeCompare(String(b.code),'id'));
  }

  function status(r){const net=r.in-r.out;if(net<0)return ['BERISIKO','risk'];if(r.in>0&&net/r.in<0.2)return ['PERLU PENGAWASAN','watch'];return ['SEHAT','ok']}

  function render(){
    const el=document.getElementById('reportContent');if(!el)return;
    const keep={...state};applyPeriod();
    const data=rows();
    const cin=data.reduce((a,x)=>a+x.in,0),cout=data.reduce((a,x)=>a+x.out,0),net=cin-cout;
    const projectOptions=summary.map(r=>`<option value="${esc(String(r.project_id||''))}">${esc(r.project_code||r.project_name||'')}</option>`).join('');
    el.innerHTML=`<div class="cashflow-period-toolbar">
      <div class="cashflow-period-filter field"><label>Periode</label><select id="cashflowPeriod"><option value="ALL">Semua Periode</option><option value="THIS_MONTH">Bulan Ini</option><option value="LAST_MONTH">Bulan Lalu</option><option value="THIS_YEAR">Tahun Ini</option><option value="CUSTOM">Custom</option></select></div>
      <div class="cashflow-period-filter field"><label>Dari Tanggal</label><input id="cashflowFrom" type="date" value="${esc(state.from)}"></div>
      <div class="cashflow-period-filter field"><label>Sampai Tanggal</label><input id="cashflowTo" type="date" value="${esc(state.to)}"></div>
      <div class="cashflow-period-filter field"><label>Proyek</label><select id="cashflowProject"><option value="ALL">Semua Proyek</option>${projectOptions}</select></div>
      <div class="cashflow-period-kpi"><small>CASH IN</small><strong>${money(cin)}</strong></div>
      <div class="cashflow-period-kpi"><small>CASH OUT</small><strong>${money(cout)}</strong></div>
      <div class="cashflow-period-kpi"><small>NET CASH FLOW</small><strong>${money(net)}</strong></div>
      <div class="cashflow-period-kpi"><small>PROYEK</small><strong>${data.length}</strong></div>
    </div>
    <div class="cashflow-period-actions"><button type="button" id="cashflowReset">Reset</button></div>
    <div class="card tablecard"><div class="scroll"><table>
      <thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th>Status</th></tr></thead>
      <tbody>${data.length?data.map(r=>{const net=r.in-r.out,s=status(r);return `<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td class="num">${money(r.in)}</td><td class="num">${money(r.out)}</td><td class="num">${money(net)}</td><td><span class="cashflow-table-status ${s[1]}">${s[0]}</span></td></tr>`}).join(''):`<tr><td colspan="6" class="empty">Tidak ada transaksi pada filter yang dipilih.</td></tr>`}</tbody>
    </table></div></div>`;
    document.getElementById('cashflowPeriod').value=keep.period;
    if(keep.period==='THIS_MONTH'||keep.period==='LAST_MONTH'||keep.period==='THIS_YEAR'){applyPeriod();document.getElementById('cashflowFrom').value=state.from;document.getElementById('cashflowTo').value=state.to}
    document.getElementById('cashflowProject').value=keep.project;
    document.getElementById('cashflowPeriod').addEventListener('change',()=>{syncFromInputs();if(state.period!=='CUSTOM')applyPeriod();render()});
    document.getElementById('cashflowFrom').addEventListener('change',()=>{state.period='CUSTOM';syncFromInputs();state.period='CUSTOM';render()});
    document.getElementById('cashflowTo').addEventListener('change',()=>{state.period='CUSTOM';syncFromInputs();state.period='CUSTOM';render()});
    document.getElementById('cashflowProject').addEventListener('change',()=>{syncFromInputs();render()});
    document.getElementById('cashflowReset').addEventListener('click',()=>{state.period='ALL';state.from='';state.to='';state.project='ALL';render()});
  }

  async function open(){styles();await load();render();}
  window.openLaporanCashFlow=open;
  window.renderLaporanCashFlow=render;
  window.mountLaporanCashFlow=async function(){styles();await load();render()};

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-report="cashflow"]');
    if(btn)setTimeout(()=>window.openLaporanCashFlow?.(),0);
  });
})();