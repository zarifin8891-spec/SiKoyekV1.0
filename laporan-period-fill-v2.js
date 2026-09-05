/* SiKoyek V1.0 — Laporan period autofill v5 + RAP period layout */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_FILL_V5__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_FILL_V5__=true;

  function localDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function getRange(kind){
    const now=new Date();
    const today=localDate(now);
    if(kind==='all')return {from:'',to:''};
    if(kind==='today')return {from:today,to:today};
    if(kind==='week'){
      const first=new Date(now);
      first.setDate(now.getDate()-((now.getDay()+6)%7));
      return {from:localDate(first),to:today};
    }
    if(kind==='month')return {
      from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),
      to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))
    };
    if(kind==='quarter'){
      const first=new Date(now);
      first.setDate(now.getDate()-89);
      return {from:localDate(first),to:today};
    }
    if(kind==='year')return {
      from:localDate(new Date(now.getFullYear(),0,1)),
      to:localDate(new Date(now.getFullYear(),11,31))
    };
    return {from:'',to:''};
  }

  function periodOptions(){
    return '<option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option>';
  }

  function fill(prefix){
    const period=document.getElementById(prefix+'Period');
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(!period||!from||!to)return false;
    const kind=period.value||'all';
    if(kind==='custom')return true;
    const r=getRange(kind);
    from.value=r.from;
    to.value=r.to;
    return true;
  }

  function bind(prefix){
    const period=document.getElementById(prefix+'Period');
    if(!period||period.dataset.periodFillV5==='1')return;
    period.dataset.periodFillV5='1';
    period.addEventListener('change',()=>fill(prefix),true);
    fill(prefix);
  }

  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));}
  function pct(n){return Number(n||0).toFixed(2)+'%';}
  function txKind(r){const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return'in';if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return'out';return'other';}

  function styles(){
    if(document.getElementById('laporan-period-fill-v5-style'))return;
    const s=document.createElement('style');
    s.id='laporan-period-fill-v5-style';
    s.textContent=`
      .laporan-v3 .rap-period-toolbar{display:grid;grid-template-columns:220px 145px 145px repeat(4,minmax(95px,1fr));gap:7px;align-items:stretch;width:100%;}
      .laporan-v3 .rap-period-filter{background:#fff;border:1px solid var(--line);border-radius:10px;padding:7px 9px;display:flex;align-items:center;min-width:0;}
      .laporan-v3 .rap-period-filter .field{width:100%;}
      .laporan-v3 .rap-period-toolbar .field label{font-size:10px;line-height:1.1;margin-bottom:5px;}
      .laporan-v3 .rap-period-toolbar .field select,.laporan-v3 .rap-period-toolbar .field input{height:34px;border-radius:8px;padding:6px 8px;font-size:13px;}
      .laporan-v3 .rap-period-kpi{background:#fff;border:1px solid var(--line);border-radius:10px;padding:7px 8px;min-height:55px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;min-width:0;overflow:hidden;}
      .laporan-v3 .rap-period-kpi small{font-size:9px;line-height:1.1;color:var(--muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .laporan-v3 .rap-period-kpi strong{font-size:14px;line-height:1.05;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      @media(max-width:1200px){.laporan-v3 .rap-period-toolbar{grid-template-columns:200px 125px 125px repeat(4,minmax(85px,1fr));}}
      @media(max-width:1000px){.laporan-v3 .rap-period-toolbar{grid-template-columns:1fr 1fr 1fr}.laporan-v3 .rap-period-filter{grid-column:1/-1;}}
      @media(max-width:650px){.laporan-v3 .rap-period-toolbar{grid-template-columns:1fr 1fr}.laporan-v3 .rap-period-filter{grid-column:1/-1;}}
    `;
    document.head.appendChild(s);
  }

  async function renderRap(){
    const c=document.getElementById('reportContent');
    if(!c)return;
    const client=window.SK?.sb||window.sb;
    if(!client)return;
    const [{data:summary,error:e1},{data:tx,error:e2},{data:pr,error:e3}]=await Promise.all([
      client.from('project_summary').select('*').order('project_code'),
      client.from('financial_transactions').select('*').order('transaction_date'),
      client.from('progress_records').select('*').order('progress_date')
    ]);
    if(e1||e2||e3)throw(e1||e2||e3);
    const period=document.getElementById('rapPeriod')?.value||'all';
    const from=document.getElementById('rapFrom')?.value||'';
    const to=document.getElementById('rapTo')?.value||'';
    const ids=new Set();
    if(period==='all'&&!from&&!to){(summary||[]).forEach(x=>ids.add(String(x.project_id)));}
    else {
      (tx||[]).forEach(x=>{const d=String(x.transaction_date||'').slice(0,10);if(d&&(!from||d>=from)&&(!to||d<=to))ids.add(String(x.project_id));});
      (pr||[]).forEach(x=>{const d=String(x.progress_date||'').slice(0,10);if(d&&(!from||d>=from)&&(!to||d<=to))ids.add(String(x.project_id));});
    }
    const rows=(summary||[]).filter(x=>ids.has(String(x.project_id)));
    const totalRap=rows.reduce((a,x)=>a+Number(x.total_rap||0),0);
    const totalReal=rows.reduce((a,x)=>a+Number(x.total_realization||0),0);
    const residual=totalRap-totalReal;
    const ratio=totalRap?totalReal/totalRap*100:0;
    c.innerHTML=`
      <div class="rap-period-toolbar">
        <div class="rap-period-filter"><div class="field"><label>Periode</label><select id="rapPeriod">${periodOptions()}</select></div></div>
        <div class="field"><label>Dari Tanggal</label><input id="rapFrom" type="date"></div>
        <div class="field"><label>Sampai Tanggal</label><input id="rapTo" type="date"></div>
        <div class="rap-period-kpi"><small>TOTAL PROYEK</small><strong>${rows.length}</strong></div>
        <div class="rap-period-kpi"><small>TOTAL RAP</small><strong>${money(totalRap)}</strong></div>
        <div class="rap-period-kpi"><small>REALISASI</small><strong>${money(totalReal)}</strong></div>
        <div class="rap-period-kpi"><small>RAP TERSISA</small><strong>${money(residual)}</strong></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">RAP</th><th class="num">Realisasi</th><th class="num">Sisa RAP</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.project_code||'-')}</strong></td><td>${esc(x.project_name||'-')}</td><td class="num">${money(x.total_rap)}</td><td class="num">${money(x.total_realization)}</td><td class="num">${money(Number(x.total_rap||0)-Number(x.total_realization||0))}</td><td>${pct(x.project_progress)}</td><td>${pct(x.cost_ratio)}</td><td>${esc(x.health_status||'-')}</td></tr>`).join('')||'<tr><td colspan="8" class="extra-empty">Tidak ada data pada periode ini.</td></tr>'}</tbody></table></div></div>`;
    fill('rap');
    bind('rap');
    const rerender=()=>renderRap().catch(err=>{const el=document.getElementById('reportContent');if(el)el.innerHTML='<div class="card"><div class="empty">Gagal memuat Laporan RAP & Biaya: '+esc(err?.message||err)+'</div></div>';});
    document.getElementById('rapPeriod')?.addEventListener('change',rerender);
    document.getElementById('rapFrom')?.addEventListener('change',rerender);
    document.getElementById('rapTo')?.addEventListener('change',rerender);
  }

  function bindRap(){
    styles();
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    const btn=root.querySelector('[data-report="rap"]');
    if(!btn||btn.dataset.rapPeriodOverride==='1')return;
    btn.dataset.rapPeriodOverride='1';
    btn.addEventListener('click',()=>setTimeout(()=>renderRap().catch(()=>{}),0),false);
  }

  function scan(){bind('sum');bind('prog');bindRap();}
  function start(){
    styles();
    scan();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(scan).observe(target,{childList:true,subtree:true});
    let tries=0;
    const retry=()=>{scan();if(++tries<40)setTimeout(retry,100);};
    retry();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
