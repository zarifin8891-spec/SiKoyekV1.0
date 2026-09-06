/* SiKoyek V1.0 — RAP & Biaya print header override v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PRINT_RAP_V1__)return;
  window.__SIKOYEK_LAPORAN_PRINT_RAP_V1__=true;

  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';

  function dateText(v){
    const s=String(v||'').slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
    const [y,m,d]=s.split('-');return `${d}-${m}-${y}`;
  }

  function periodText(){
    const f=document.getElementById('rapFrom')||document.getElementById('rapBiayaFrom');
    const t=document.getElementById('rapTo')||document.getElementById('rapBiayaTo');
    const from=dateText(f?.value),to=dateText(t?.value);
    return (from||to)?`${from||'...'}     s/d     ${to||'...'}`:'Semua Periode';
  }

  function projectCount(){
    const body=document.getElementById('rapBiayaBody');
    if(!body)return 0;
    return [...body.querySelectorAll('tr')].filter(tr=>tr.querySelectorAll('td').length>1).length;
  }

  function projectMeta(){
    const sel=document.getElementById('rapBiayaProject');
    const text=sel?.options?.[sel.selectedIndex]?.textContent?.trim()||'';
    return text && !/semua proyek/i.test(text) ? text : '';
  }

  function kpiValue(id){return document.getElementById(id)?.textContent?.trim()||''}

  function header(){
    const count=projectCount();
    return `
      <header class="rap-print-header">
        <div class="rap-print-brand">SiKoyek V1.0</div>
        <div class="rap-print-title">Laporan RAP &amp; Biaya</div>
        <div class="rap-print-meta"><span class="label">Periode</span><span class="colon">:</span><strong>${esc(periodText())}</strong></div>
        <div class="rap-print-meta extra-project"><span class="label">Proyek</span><span class="colon">:</span><strong>${esc(projectMeta())}</strong></div>
        <div class="rap-print-kpis">
          <div class="rap-print-kpi"><div>Total Proyek</div><strong>${esc(count)}</strong></div>
          <div class="rap-print-kpi"><div>Total RAP</div><strong>${esc(kpiValue('rapBiayaKpiRap'))}</strong></div>
          <div class="rap-print-kpi"><div>Realisasi</div><strong>${esc(kpiValue('rapBiayaKpiReal'))}</strong></div>
          <div class="rap-print-kpi"><div>RAP Tersisa</div><strong>${esc(kpiValue('rapBiayaKpiSisa'))}</strong></div>
          <div class="rap-print-kpi"><div>Avg Progress</div><strong>${esc(kpiValue('rapBiayaKpiProgress'))}</strong></div>
        </div>
      </header>`;
  }

  function clean(){
    const content=document.getElementById('reportContent');
    if(!content)return '';
    const clone=content.cloneNode(true);
    clone.querySelectorAll('.rap-biaya-filter').forEach(el=>el.closest('.card')?.remove());
    clone.querySelectorAll('.rap-biaya-kpis').forEach(el=>el.closest('.card')?.remove());
    clone.querySelectorAll('.note-card,.extra-note').forEach(el=>el.remove());
    return clone.innerHTML;
  }

  function printRap(){
    const root=document.querySelector('.laporan-v3');
    const active=root?.querySelector('.report-tabs button.active');
    const content=document.getElementById('reportContent');
    if(!root||!content||active?.dataset?.report!=='rap')return false;

    const iframe=document.createElement('iframe');
    Object.assign(iframe.style,{position:'fixed',right:'0',bottom:'0',width:'0',height:'0',border:'0',visibility:'hidden'});
    iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);
    const doc=iframe.contentDocument;
    if(!doc){iframe.remove();return false}
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laporan RAP &amp; Biaya</title><style>
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:8.5pt;line-height:1.15}
      .rap-print-header{margin:0 0 4mm;padding:0 0 2.5mm;border-bottom:1px solid #222}
      .rap-print-brand{font-size:15pt;font-weight:800;line-height:1;margin:0 0 2mm}
      .rap-print-title{font-size:13.5pt;font-weight:800;line-height:1.05;margin:0 0 1.2mm}
      .rap-print-meta{display:flex;align-items:baseline;font-size:8.5pt;line-height:1.2;margin:0 0 .5mm;white-space:nowrap}
      .rap-print-meta .label{width:17mm}.rap-print-meta .colon{width:4mm;text-align:center}
      .rap-print-meta.extra-project:has(strong:empty){display:none}
      .rap-print-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3.2mm;margin-top:4mm}
      .rap-print-kpi{border:1px solid #222;min-height:10mm;padding:2.3mm 2.5mm 2.2mm;display:flex;flex-direction:column;justify-content:center;text-align:center;overflow:hidden}
      .rap-print-kpi div{font-size:8.3pt;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rap-print-kpi strong{font-size:9pt;line-height:1.05;margin-top:1.3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .card{border:0!important;border-radius:0!important;box-shadow:none!important;margin:0 0 2.5mm!important;padding:0!important;overflow:visible!important;background:#fff!important}
      table{width:100%;border-collapse:collapse;border-spacing:0;page-break-inside:auto}
      thead{display:table-header-group}tfoot{display:table-footer-group}tr{break-inside:avoid;page-break-inside:avoid}
      th,td{border:1px solid #222;padding:1.25mm 1.35mm;text-align:left;font-size:7.7pt;line-height:1.08;vertical-align:top}
      th{background:#f1f1f1!important;font-weight:700}td.num,th.num{text-align:right;white-space:nowrap}
      .pill{padding:2px 5px;border-radius:999px;font-size:7pt;font-weight:700}
      .green{background:#e7f5ec!important}.amber{background:#fff4d6!important}.red{background:#fde8e8!important}
      .empty,.extra-empty{padding:5mm!important;text-align:center}
      @page{size:A4 landscape;margin:8mm}
      @media print{a{color:inherit;text-decoration:none}}
    </style></head><body>${header()}${clean()}</body></html>`);
    doc.close();
    const win=iframe.contentWindow;let printed=false;
    const doPrint=()=>{if(printed)return;printed=true;win.focus();win.print();setTimeout(()=>iframe.remove(),800)};
    iframe.onload=()=>setTimeout(doPrint,120);
    setTimeout(doPrint,600);
    return true;
  }

  function bind(){
    const button=document.getElementById('laporanPrintV1');
    if(!button||button.dataset.rapPrintOverride==='1')return !!button;
    button.dataset.rapPrintOverride='1';
    button.addEventListener('click',e=>{
      const root=document.querySelector('.laporan-v3');
      const active=root?.querySelector('.report-tabs button.active');
      if(active?.dataset?.report!=='rap')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      printRap();
    },true);
    return true;
  }

  function boot(){
    let n=0;
    const tick=()=>{if(bind()||++n>=100)return;setTimeout(tick,100)};
    tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(bind).observe(target,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
