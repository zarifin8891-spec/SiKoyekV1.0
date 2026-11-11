(function(){
  'use strict';
  const CLASS='dashboard-graphs-section';
  const rendered = new WeakSet();
  let allRows=[];
  const money=n=>window.SiKoyekFoundation.money(n);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function makeRows(projects, transactions) {
    const totals = new Map(projects.map(project => [project.project_id, {cashIn: 0, cashOut: 0, count: 0}]));
    for (const tx of transactions) {
      const row = totals.get(tx.project_id);
      if (!row || !tx.transaction_date) continue;
      if (tx.transaction_type === 'MASUK') row.cashIn += Number(tx.amount || 0);
      if (tx.transaction_type === 'KELUAR') row.cashOut += Number(tx.amount || 0);
      row.count++;
    }
    return projects.map(project => {
      const amounts = totals.get(project.project_id);
      return {...project, ...amounts, net: amounts.cashIn - amounts.cashOut,
        riskGap: Number(project.cost_ratio || 0) - Number(project.project_progress || 0)};
    });
  }

  function periodSummary(rows) {
    const total = rows.reduce((sum, row) => ({
      cashIn: sum.cashIn + row.cashIn, cashOut: sum.cashOut + row.cashOut, net: sum.net + row.net, count: sum.count + row.count
    }), {cashIn: 0, cashOut: 0, net: 0, count: 0});
    const metrics = [['Kas Masuk', money(total.cashIn)], ['Kas Keluar', money(total.cashOut)], ['Arus Kas Bersih', money(total.net)], ['Transaksi', total.count]];
    const body = rows.filter(row => row.count).map(row => `<tr>
      <td><button type="button" class="control-link" data-project="${esc(row.project_id)}">${esc(row.project_name || row.project_code)}</button></td>
      <td class="control-number">${money(row.cashIn)}</td><td class="control-number">${money(row.cashOut)}</td>
      <td class="control-number">${money(row.net)}</td><td class="control-number">${row.count}</td></tr>`).join('');
    return `<h2>Kinerja Keuangan Periode</h2><dl class="control-period-metrics">${metrics.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      <div class="control-table-wrap"><table class="control-table"><thead><tr><th>Proyek</th><th class="control-number">Kas Masuk</th>
      <th class="control-number">Kas Keluar</th><th class="control-number">Arus Kas Bersih</th><th class="control-number">Transaksi</th></tr></thead>
      <tbody>${body || '<tr><td colspan="5">Tidak ada transaksi pada periode ini.</td></tr>'}</tbody></table></div>`;
  }

  async function readTransactions(ids, period) {
    const result = [];
    for (let start = 0; start < ids.length; start += 100) {
      for (let offset = 0; ; offset += 500) {
        let query = sb.from('financial_transactions').select('id,project_id,transaction_date,transaction_type,amount')
          .in('project_id', ids.slice(start, start + 100));
        if (period.from) query = query.gte('transaction_date', period.from);
        if (period.to) query = query.lte('transaction_date', period.to);
        const {data, error} = await query.order('id').range(offset, offset + 499);
        if (error) throw error;
        result.push(...data);
        if (data.length < 500) break;
      }
    }
    return result;
  }

  function sortRows(rows,key){return [...rows].sort((a,b)=>Number(b[key]||0)-Number(a[key]||0))}
  function selectedRows(){const mode=document.getElementById('graphMode')?.value||'top10';const sort=document.getElementById('graphSort')?.value||'cashOut';if(mode==='risk')return sortRows(allRows,'riskGap').slice(0,10);if(mode==='selected'){const ids=[...document.querySelectorAll('#graphProjects input:checked')].map(x=>x.value);return ids.length?allRows.filter(r=>ids.includes(r.project_id)):[]}const key={cashOut:'cashOut',cashIn:'cashIn',cost:'cost_ratio',progress:'project_progress'}[sort]||'cashOut';if(mode==='all')return sortRows(allRows,key);const n=Number(String(mode).replace('top',''))||10;return sortRows(allRows,key).slice(0,n)}
  function drawBars(canvas,rows,leftKey,rightKey,leftColor,rightColor,max,percent){const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(250,rect.width),h=Math.max(220,rect.height);canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const L=48,R=16,T=18,B=38,plotW=w-L-R,plotH=h-T-B,mx=Math.max(percent?100:1,max||1);ctx.strokeStyle='#e7edf6';ctx.fillStyle='#7a879a';ctx.font='12px '+getComputedStyle(canvas).fontFamily;for(let i=0;i<=4;i++){const y=T+plotH*i/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();const v=mx*(1-i/4);ctx.fillText(percent?Math.round(v)+'%':money(v),4,y+3)}const step=plotW/Math.max(rows.length,1),bw=Math.min(24,Math.max(8,step*.24)),base=T+plotH;rows.forEach((r,i)=>{const x=L+i*step+step*.18,a=Math.max(0,Number(r[leftKey]||0)),b=Math.max(0,Number(r[rightKey]||0)),ha=a/mx*plotH,hb=b/mx*plotH;ctx.fillStyle=leftColor;ctx.fillRect(x,base-ha,bw,ha);ctx.fillStyle=rightColor;ctx.fillRect(x+bw+5,base-hb,bw,hb);ctx.fillStyle='#637086';ctx.save();ctx.translate(x+5,base+13);ctx.rotate(-.35);ctx.fillText(r.project_code||'',0,0);ctx.restore()})}
  function refresh(){const mode=document.getElementById('graphMode')?.value||'top10',rows=selectedRows(),note=document.getElementById('graphSelectionNote');if(note)note.textContent=mode==='selected'&&rows.length===0?'Belum ada proyek dipilih.':`Menampilkan ${rows.length} dari ${allRows.length} proyek.`;const sn=document.getElementById('graphSelectedNote');if(sn)sn.textContent=`${document.querySelectorAll('#graphProjects input:checked').length} proyek dipilih`;const empty=mode==='selected'&&rows.length===0;document.querySelectorAll('.graph-empty-state').forEach(x=>x.hidden=!empty);document.querySelectorAll('.graph-canvas').forEach(x=>x.hidden=empty);if(empty)return;const cash=document.getElementById('chartCashFlow'),prog=document.getElementById('chartProgressCost');if(!cash||!prog)return;drawBars(cash,rows,'cashIn','cashOut','#11875d','#c73737',Math.max(1,...rows.map(r=>Math.max(Number(r.cashIn||0),Number(r.cashOut||0)))),false);drawBars(prog,rows,'project_progress','cost_ratio','#153858','#e77819',100,true)}
  function bind(){const mode=document.getElementById('graphMode'),sort=document.getElementById('graphSort'),wrap=document.getElementById('selectedWrap');if(!mode||!sort||!wrap)return;const sync=()=>{const m=mode.value;wrap.classList.toggle('show',m==='selected');const c=sort.closest('.graph-control');if(c)c.style.display=(m==='risk'||m==='selected')?'none':'flex';refresh()};mode.onchange=sync;sort.onchange=refresh;document.querySelectorAll('#graphProjects input').forEach(cb=>cb.onchange=refresh);document.getElementById('selectAllProjects')?.addEventListener('click',()=>{document.querySelectorAll('#graphProjects input').forEach(x=>x.checked=true);refresh()});document.getElementById('clearProjects')?.addEventListener('click',()=>{document.querySelectorAll('#graphProjects input').forEach(x=>x.checked=false);refresh()});sync()}
  async function render(){
    const host = document.querySelector('.control-finance-host');
    if (!host || rendered.has(host)) return;
    rendered.add(host);
    const projects = state.summary.filter(periodMatch);
    const ids = projects.map(project => project.project_id).filter(Boolean);
    host.innerHTML = '<section class="control-card"><h2>Kinerja Keuangan Periode</h2><p class="control-note">Memuat transaksi…</p></section>';
    try {
      const transactions = await readTransactions(ids, state.period);
      if (!host.isConnected) return;
      allRows = makeRows(projects, transactions);
      const summary = host.firstElementChild;
      summary.innerHTML = periodSummary(allRows);
      const options=allRows.map(r=>`<label class="project-option"><input type="checkbox" value="${esc(r.project_id)}"><span>${esc(r.project_code)} — ${esc(r.project_name)}</span></label>`).join('');const wrap=document.createElement('section');wrap.className='control-card '+CLASS;wrap.innerHTML=`<div class="graphs-head"><div><h2>Perbandingan Antarproyek</h2></div><span id="graphSelectionNote" class="graphs-sub"></span></div><div class="graph-controls"><div class="graph-control"><label>Tampilan Proyek</label><select id="graphMode"><option value="top5">Top 5</option><option value="top10" selected>Top 10</option><option value="top15">Top 15</option><option value="risk">Top Risiko</option><option value="all">Semua</option><option value="selected">Proyek Terpilih</option></select></div><div class="graph-control"><label>Urutkan Top N</label><select id="graphSort"><option value="cashOut" selected>Cash Out Terbesar</option><option value="cashIn">Cash In Terbesar</option><option value="cost">Cost Ratio Tertinggi</option><option value="progress">Progress Tertinggi</option></select></div><div id="selectedWrap" class="graph-control selected-wrap"><label>Proyek Terpilih</label><div id="graphProjects" class="project-picker">${options}</div><div class="picker-actions"><button type="button" id="selectAllProjects">Pilih Semua</button><button type="button" id="clearProjects">Bersihkan</button><span id="graphSelectedNote" class="control-note">0 proyek dipilih</span></div></div><div class="control-note">Top Risiko = gap Cost Ratio − Progress terbesar.</div></div><div class="graph-grid"><div class="graph-card"><h3>Cash Flow per Proyek</h3><div class="graph-note">Perbandingan Cash In dan Cash Out pada periode aktif.</div><div class="canvas-wrap"><canvas id="chartCashFlow" class="graph-canvas"></canvas><div class="graph-empty-state" hidden><div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div></div></div><div class="legend"><span><i class="swatch" style="background:#11875d"></i>Cash In</span><span><i class="swatch" style="background:#c73737"></i>Cash Out</span></div></div><div class="graph-card"><h3>Progress vs Cost Ratio</h3><div class="graph-note">Membantu mendeteksi biaya yang bergerak lebih cepat dari progress.</div><div class="canvas-wrap"><canvas id="chartProgressCost" class="graph-canvas"></canvas><div class="graph-empty-state" hidden><div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div></div></div><div class="legend"><span><i class="swatch" style="background:#153858"></i>Progress</span><span><i class="swatch" style="background:#e77819"></i>Cost Ratio</span></div></div></div>`;host.append(wrap);
      bind();
    } catch {
      if (host.isConnected) host.firstElementChild.innerHTML =
        '<h2>Kinerja Keuangan Periode</h2><p class="control-note">Transaksi periode belum dapat dimuat.</p>';
    }
  }
  const observer = new window.SiKoyekFoundation.Observer(render);
  observer.observe(document.body, {childList: true, subtree: true});
  window.addEventListener('resize', () => { if (document.getElementById('graphMode')) refresh(); });
  render();
})();
