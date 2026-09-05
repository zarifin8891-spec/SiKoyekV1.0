/* SiKoyek V1.0 — Laporan Progress Proyek by project */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PROGRESS_PROJECT_V1__)return;
  window.__SIKOYEK_LAPORAN_PROGRESS_PROJECT_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function styles(){
    if(document.getElementById('laporan-progress-project-v1-style'))return;
    const s=document.createElement('style');
    s.id='laporan-progress-project-v1-style';
    s.textContent=`
      .laporan-v3 .progress-project-toolbar{display:grid;grid-template-columns:300px repeat(5,minmax(82px,1fr));gap:6px;align-items:stretch;width:100%}
      .laporan-v3 .progress-project-filter{background:#fff;border:1px solid var(--line);border-radius:10px;padding:7px 10px;display:flex;align-items:center;min-width:0}
      .laporan-v3 .progress-project-filter .field{width:100%}
      .laporan-v3 .progress-project-filter .field label{font-size:8px;line-height:1.1;margin-bottom:4px}
      .laporan-v3 .progress-project-filter .field select{height:34px;border-radius:8px;padding:6px 8px;font-size:11px}
      .laporan-v3 .progress-project-toolbar .kpi{min-width:0;width:auto!important;max-width:none!important;min-height:55px;padding:7px 8px;border-radius:10px;box-sizing:border-box}
      .laporan-v3 .progress-project-toolbar .kpi .label{font-size:7px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .progress-project-toolbar .kpi .value{font-size:13px;line-height:1.05;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:1100px){.laporan-v3 .progress-project-toolbar{grid-template-columns:1fr 1fr 1fr}.laporan-v3 .progress-project-filter{grid-column:1/-1}}
      @media(max-width:650px){.laporan-v3 .progress-project-toolbar{grid-template-columns:1fr 1fr}.laporan-v3 .progress-project-filter{grid-column:1/-1}}
    `;
    document.head.appendChild(s);
  }

  async function loadData(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:projects,error:e1},{data:workItems,error:e2},{data:progressRecords,error:e3}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_work_items').select('*').order('sort_order'),
      client.from('progress_records').select('*').order('progress_date')
    ]);
    const err=e1||e2||e3;
    if(err)throw err;
    return {projects:projects||[],workItems:workItems||[],progressRecords:progressRecords||[]};
  }

  function render(data){
    styles();
    const content=document.getElementById('reportContent');
    if(!content)return;
    const options=data.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('');
    content.innerHTML=`
      <div class="progress-project-toolbar">
        <div class="progress-project-filter">
          <div class="field"><label>Proyek</label><select id="progProject"><option value="">Pilih Proyek...</option>${options}</select></div>
        </div>
        <div class="kpi"><div class="label">TOTAL ITEM</div><div class="value" id="progKpiItems">0</div></div>
        <div class="kpi"><div class="label">ITEM SUDAH BERJALAN</div><div class="value" id="progKpiStarted">0</div></div>
        <div class="kpi"><div class="label">ITEM SELESAI</div><div class="value" id="progKpiDone">0</div></div>
        <div class="kpi"><div class="label">AVG PROGRESS ITEM</div><div class="value" id="progKpiAvg">0.00%</div></div>
        <div class="kpi"><div class="label">PROJECT PROGRESS</div><div class="value" id="progKpiProject">0.00%</div></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th>Item Pekerjaan</th><th class="num">Bobot</th><th class="num">Progress Item</th><th class="num">Progress Berbobot</th><th>Visual</th><th>Status</th></tr></thead><tbody id="progBody"><tr><td colspan="8" class="empty">Silakan pilih proyek terlebih dahulu.</td></tr></tbody></table></div></div>
      <div class="card note-card">Progress item dihitung dari akumulasi progress yang tersimpan untuk proyek yang dipilih. Progress berbobot = bobot item × progress item.</div>`;

    const select=document.getElementById('progProject');
    select?.addEventListener('change',()=>renderSelected(data));
    renderSelected(data);
  }

  function renderSelected(data){
    const id=document.getElementById('progProject')?.value||'';
    const body=document.getElementById('progBody');
    const resetKpi=()=>{
      document.getElementById('progKpiItems').textContent='0';
      document.getElementById('progKpiStarted').textContent='0';
      document.getElementById('progKpiDone').textContent='0';
      document.getElementById('progKpiAvg').textContent='0.00%';
      document.getElementById('progKpiProject').textContent='0.00%';
    };
    if(!id){
      resetKpi();
      if(body)body.innerHTML='<tr><td colspan="8" class="empty">Silakan pilih proyek terlebih dahulu.</td></tr>';
      return;
    }

    const project=data.projects.find(p=>String(p.id)===String(id));
    const selectedIds=new Set([String(id)]);
    const recByItem={};
    data.progressRecords.forEach(r=>{
      if(!selectedIds.has(String(r.project_id)))return;
      recByItem[r.work_item_id]=(recByItem[r.work_item_id]||0)+Number(r.progress_percentage||0);
    });
    const rows=data.workItems.filter(i=>String(i.project_id)===String(id)).map(i=>{
      const progress=Math.min(100,recByItem[i.id]||0);
      const weight=Number(i.weight||0);
      const weighted=weight*(progress/100)*100;
      return {...i,progress,weighted};
    });

    const avg=rows.length?rows.reduce((s,x)=>s+x.progress,0)/rows.length:0;
    const started=rows.filter(x=>x.progress>0).length;
    const done=rows.filter(x=>x.progress>=100).length;
    const projectProgress=rows.reduce((s,x)=>s+x.weighted,0);
    document.getElementById('progKpiItems').textContent=rows.length;
    document.getElementById('progKpiStarted').textContent=started;
    document.getElementById('progKpiDone').textContent=done;
    document.getElementById('progKpiAvg').textContent=pct(avg);
    document.getElementById('progKpiProject').textContent=pct(projectProgress);

    if(!rows.length){
      if(body)body.innerHTML='<tr><td colspan="8" class="empty">Belum ada item pekerjaan pada proyek ini.</td></tr>';
      return;
    }
    body.innerHTML=rows.map(x=>{
      const cls=x.progress>=100?'green':x.progress>0?'amber':'red';
      const status=x.progress>=100?'SELESAI':x.progress>0?'BERJALAN':'BELUM MULAI';
      return `<tr><td><strong>${esc(project?.project_code||'-')}</strong></td><td>${esc(project?.project_name||'-')}</td><td>${esc(x.work_name||'-')}</td><td class="num">${pct(Number(x.weight||0)*100)}</td><td class="num">${pct(x.progress)}</td><td class="num">${pct(x.weighted)}</td><td><div class="progressbar"><i style="width:${Math.max(0,Math.min(100,x.progress))}%"></i></div></td><td><span class="pill ${cls}">${status}</span></td></tr>`;
    }).join('');
  }

  function start(){
    styles();
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    const button=root.querySelector('[data-report="progress"]');
    if(!button||button.dataset.projectProgressV1==='1')return;
    button.dataset.projectProgressV1='1';
    button.addEventListener('click',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===button));
      const content=document.getElementById('reportContent');
      if(content)content.innerHTML='<div class="card"><div class="empty">Memuat data progress...</div></div>';
      try{const data=await loadData();render(data)}
      catch(err){if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat data progress: '+esc(err?.message||err)+'</div></div>'}
    },true);
  }

  function boot(){
    start();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(start).observe(target,{childList:true,subtree:true});
    let tries=0;
    const retry=()=>{start();if(++tries<40)setTimeout(retry,100)};
    retry();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
