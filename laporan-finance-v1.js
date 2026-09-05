/* SiKoyek V1.0 — Laporan Keuangan v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_FINANCE_V1__)return;
  window.__SIKOYEK_LAPORAN_FINANCE_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let mounted=false;
  let transactions=[];
  let projects=[];

  function styles(){
    if(document.getElementById('laporan-finance-v1-style'))return;
    const s=document.createElement('style');
    s.id='laporan-finance-v1-style';
    s.textContent=`
      .laporan-v3 .finance-toolbar{display:grid;grid-template-columns:220px 145px 145px minmax(220px,1fr);gap:7px;align-items:end;width:100%;}
      .laporan-v3 .finance-toolbar .field label{font-size:10px;line-height:1.1;margin-bottom:5px;display:block;font-weight:700;color:var(--muted)}
      .laporan-v3 .finance-toolbar .field select,.laporan-v3 .finance-toolbar .field input{width:100%;height:34px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:#fff;color:var(--text);font-size:12px;box-sizing:border-box}
      .laporan-v3 .finance-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;width:100%}
      .laporan-v3 .finance-kpi{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 9px;min-height:55px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;min-width:0;overflow:hidden}
      .laporan-v3 .finance-kpi small{font-size:9px;line-height:1.1;color:var(--muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .finance-kpi strong{font-size:14px;line-height:1.05;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .finance-type-in{font-weight:700}.laporan-v3 .finance-type-out{font-weight:700}
      @media(max-width:1000px){.laporan-v3 .finance-toolbar{grid-template-columns:1fr 1fr 1fr}.laporan-v3 .finance-toolbar .project-field{grid-column:1/-1}.laporan-v3 .finance-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:650px){.laporan-v3 .finance-toolbar{grid-template-columns:1fr 1fr}.laporan-v3 .finance-toolbar .period-field{grid-column:1/-1}.laporan-v3 .finance-toolbar .project-field{grid-column:1/-1}.laporan-v3 .finance-summary{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function ranges(kind){
    const now=new Date(),today=localDate(now);
    if(kind==='today')return{from:today,to:today};
    if(kind==='week'){const d=new Date(now);d.setDate(now.getDate()-((now.getDay()+6)%7));return{from:localDate(d),to:today}}
    if(kind==='month')return{from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(kind==='quarter'){const d=new Date(now);d.setDate(now.getDate()-89);return{from:localDate(d),to:today}}
    if(kind==='year')return{from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    return{from:'',to:''};
  }

  function kindOf(r){
    const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();
    if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return'in';
    if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return'out';
    return'other';
  }

  async function load(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:tx,error:e1},{data:ps,error:e2}]=await Promise.all([
      client.from('financial_transactions').select('*').order('transaction_date',{ascending:false}),
      client.from('projects').select('id,project_code,project_name').order('project_code')
    ]);
    if(e1||e2)throw(e1||e2);
    transactions=tx||[];projects=ps||[];
  }

  function projectName(id){const p=projects.find(x=>String(x.id)===String(id));return p?`${p.project_code||'-'} — ${p.project_name||'-'}`:'-'}
  function periodOptions(){return '<option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option>'}

  function render(saved){
    const c=document.getElementById('reportContent');
    if(!c)return;
    const prev=saved||{period:'',from:'',to:'',project:''};
    c.innerHTML=`
      <div class="finance-toolbar">
        <div class="field period-field"><label>Periode</label><select id="financePeriod">${periodOptions()}</select></div>
        <div class="field"><label>Dari Tanggal</label><input id="financeFrom" type="date"></div>
        <div class="field"><label>Sampai Tanggal</label><input id="financeTo" type="date"></div>
        <div class="field project-field"><label>Proyek</label><select id="financeProject"><option value="">Semua Proyek</option>${projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('')}</select></div>
      </div>
      <div class="finance-summary">
        <div class="finance-kpi"><small>TRANSAKSI</small><strong id="financeKpiCount">0</strong></div>
        <div class="finance-kpi"><small>PEMASUKAN</small><strong id="financeKpiIn">Rp 0</strong></div>
        <div class="finance-kpi"><small>PENGELUARAN</small><strong id="financeKpiOut">Rp 0</strong></div>
        <div class="finance-kpi"><small>NET</small><strong id="financeKpiNet">Rp 0</strong></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Jenis</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead><tbody id="financeBody"></tbody></table></div></div>
      <div class="card note-card">Laporan Keuangan menampilkan seluruh transaksi berdasarkan periode dan proyek yang dipilih.</div>`;

    const p=document.getElementById('financePeriod'),f=document.getElementById('financeFrom'),t=document.getElementById('financeTo'),pr=document.getElementById('financeProject');
    p.value=prev.period||'all';
    if(p.value==='custom'){f.value=prev.from||'';t.value=prev.to||''}else{const r=ranges(p.value);f.value=prev.from||r.from;t.value=prev.to||r.to}
    pr.value=prev.project||'';

    const refresh=()=>{
      const state={period:p?.value||'all',from:f?.value||'',to:t?.value||'',project:pr?.value||''};
      renderBody(state);
    };
    p.addEventListener('change',()=>{if(p.value!=='custom'){const r=ranges(p.value);f.value=r.from;t.value=r.to}refresh()});
    f.addEventListener('change',refresh);t.addEventListener('change',refresh);pr.addEventListener('change',refresh);
    renderBody({period:p.value,from:f.value,to:t.value,project:pr.value});
  }

  function renderBody(state){
    const from=state.from||'',to=state.to||'',project=state.project||'';
    const rows=transactions.filter(x=>{
      const d=String(x.transaction_date||'').slice(0,10);
      return(!from||d>=from)&&(!to||d<=to)&&(!project||String(x.project_id)===String(project));
    });
    let income=0,expense=0;
    rows.forEach(x=>{const a=Number(x.amount||0);if(kindOf(x)==='in')income+=a;else if(kindOf(x)==='out')expense+=a});
    document.getElementById('financeKpiCount').textContent=rows.length;
    document.getElementById('financeKpiIn').textContent=money(income);
    document.getElementById('financeKpiOut').textContent=money(expense);
    document.getElementById('financeKpiNet').textContent=money(income-expense);
    const body=document.getElementById('financeBody');
    if(!rows.length){body.innerHTML='<tr><td colspan="5" class="extra-empty">Tidak ada transaksi pada periode/filter ini.</td></tr>';return}
    body.innerHTML=rows.map(x=>{
      const k=kindOf(x),label=String(x.transaction_type||x.type||'-');
      return `<tr><td>${esc(String(x.transaction_date||'').slice(0,10))}</td><td>${esc(projectName(x.project_id))}</td><td class="finance-type-${k}">${esc(label)}</td><td>${esc(x.description||x.notes||x.remark||'-')}</td><td class="num">${money(x.amount)}</td></tr>`;
    }).join('');
  }

  function activate(){
    styles();
    const root=document.querySelector('.laporan-v3');if(!root)return false;
    const btn=root.querySelector('[data-report="finance"]');if(!btn)return false;
    if(btn.dataset.financeV1==='1')return true;
    btn.dataset.financeV1='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===btn));
      const c=document.getElementById('reportContent');if(c)c.innerHTML='<div class="card"><div class="empty">Memuat laporan keuangan...</div></div>';
      load().then(()=>render()).catch(err=>{if(c)c.innerHTML='<div class="card"><div class="empty">Gagal memuat Laporan Keuangan: '+esc(err?.message||err)+'</div></div>'});
    },true);
    return true;
  }

  function boot(){styles();let n=0;const tick=()=>{if(activate()||++n>=80)return;setTimeout(tick,100)};tick();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();