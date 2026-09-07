/* SiKoyek V1.0 — Direct Kinerja print handler */
(function(){
  'use strict';
  if(window.__SIKOYEK_KINERJA_DIRECT_PRINT_V1__)return;
  window.__SIKOYEK_KINERJA_DIRECT_PRINT_V1__=true;
  const text=id=>document.getElementById(id)?.textContent?.trim()||'';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function printDirect(){
    const root=document.querySelector('.laporan-v3');
    const active=root?.querySelector('.report-tabs button.active');
    const content=document.getElementById('reportContent');
    if(!root||!content||active?.dataset?.report!=='kinerja')return false;
    const table=content.querySelector('.kv2-sec table');
    if(!table)return false;
    const kpis=[['Total Proyek','kv2Total'],['Selesai','kv2Done'],['Berjalan','kv2Run'],['Nilai Proyek','kv2Value'],['Laba','kv2Profit']];
    const header=`<header class="ph"><div class="brand">SiKoyek V1.0</div><div class="title">Kinerja Proyek</div><div class="kpis">${kpis.map(([l,id])=>`<div class="kpi"><span>${esc(l)}</span><strong>${esc(text(id))}</strong></div>`).join('')}</div></header>`;
    const html=table.outerHTML;
    const iframe=document.createElement('iframe');
    Object.assign(iframe.style,{position:'fixed',right:'0',bottom:'0',width:'1px',height:'1px',border:'0',opacity:'0',pointerEvents:'none'});
    document.body.appendChild(iframe);
    const doc=iframe.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kinerja Proyek</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:8pt;line-height:1.12}.ph{margin:0 0 3.5mm;padding:0 0 2.5mm;border-bottom:1px solid #222}.brand{font-size:15pt;font-weight:800;margin:0 0 1.5mm}.title{font-size:14pt;font-weight:800;margin:0}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin-top:4mm}.kpi{border:1px solid #222;min-height:10mm;padding:2mm;text-align:center}.kpi span{display:block;font-size:8pt;font-weight:600}.kpi strong{display:block;font-size:9pt;margin-top:1mm}.kv2-sec{margin:0!important}.kv2-title,.kv2-trend,.kv2-meta,.legend{display:none!important}table{width:100%;border-collapse:collapse;table-layout:auto}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{border:1px solid #222;padding:1mm 1.05mm;font-size:6.5pt;line-height:1.05;vertical-align:top;white-space:nowrap}th{background:#f1f1f1!important;font-weight:700;text-transform:uppercase}td.num,th.num{text-align:right}@page{size:A4 landscape;margin:8mm}</style></head><body>${header}${html}</body></html>`);
    doc.close();
    const win=iframe.contentWindow;let done=false;const go=()=>{if(done)return;done=true;win.focus();win.print();setTimeout(()=>iframe.remove(),1000)};iframe.onload=()=>setTimeout(go,150);setTimeout(go,700);return true;
  }
  window.__SIKOYEK_KINERJA_DIRECT_PRINT__=printDirect;
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#laporanPrintV1');if(!btn)return;const active=document.querySelector('.laporan-v3 .report-tabs button.active');if(active?.dataset?.report!=='kinerja')return;e.preventDefault();e.stopImmediatePropagation();printDirect()},true);
})();
