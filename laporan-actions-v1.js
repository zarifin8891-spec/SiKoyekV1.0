/* SiKoyek V1.0 — Laporan actions v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_ACTIONS_V1__)return;
  window.__SIKOYEK_LAPORAN_ACTIONS_V1__=true;

  const escHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const csvCell=s=>'"'+String(s??'').replace(/"/g,'""')+'"';

  function styles(){
    if(document.getElementById('laporan-actions-v1-style'))return;
    const s=document.createElement('style');s.id='laporan-actions-v1-style';s.textContent=`
      .laporan-v3 .report-actions-v1{display:flex;justify-content:flex-end;gap:6px;margin:0 0 8px}
      .laporan-v3 .report-actions-v1 button{height:32px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text);padding:0 11px;cursor:pointer;font-size:11px;font-weight:700}
      .laporan-v3 .report-actions-v1 button:hover{background:#f8fafc}
      @media print{.laporan-v3 .report-actions-v1{display:none!important}}
    `;document.head.appendChild(s);
  }

  function activeName(root){return root.querySelector('.report-tabs button.active')?.textContent?.trim()||'Laporan';}

  function applyAreaChart(){
    const svg=document.getElementById('kinerjaTrendSvg');
    if(!svg)return;
    const paths=[...svg.querySelectorAll('path')].slice(0,3);
    if(paths.length<3)return;
    const marker=svg.dataset.kinerjaAreaState;
    if(marker==='done')return;
    const viewBox=(svg.getAttribute('viewBox')||'0 0 960 330').split(/\s+/).map(Number);
    const H=Number.isFinite(viewBox[3])?viewBox[3]:330;
    const baseline=Math.max(0,H-45);
    paths.forEach(path=>{
      const d=path.getAttribute('d')||'';
      const points=[...d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)];
      if(!points.length)return;
      const first=points[0],last=points[points.length-1];
      const color=path.style.color||path.getAttribute('stroke')||'currentColor';
      path.setAttribute('d',`${d} L ${last[2]} ${baseline} L ${first[2]} ${baseline} Z`);
      path.setAttribute('fill',color);
      path.setAttribute('fill-opacity','0.15');
      path.setAttribute('stroke',color);
      path.setAttribute('stroke-width','2.5');
      path.setAttribute('stroke-linejoin','round');
      path.style.color='';
    });
    [...svg.querySelectorAll('circle')].forEach(c=>c.setAttribute('r','3'));
    svg.dataset.kinerjaAreaState='done';
  }

  function inject(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    styles();
    let bar=root.querySelector('.report-actions-v1');
    if(!bar){
      bar=document.createElement('div');bar.className='report-actions-v1';
      bar.innerHTML='<button type="button" id="laporanPrintV1">Cetak</button><button type="button" id="laporanCsvV1">Export CSV</button>';
      const tabs=root.querySelector('.report-tabs');
      if(tabs)tabs.insertAdjacentElement('afterend',bar);else root.prepend(bar);
      bar.querySelector('#laporanPrintV1').addEventListener('click',printReport);
      bar.querySelector('#laporanCsvV1').addEventListener('click',exportCsv);
    }
    applyAreaChart();
    return true;
  }

  function printReport(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;
    const title=activeName(root);
    const w=window.open('','_blank','noopener,noreferrer');
    if(!w){window.print();return}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:18px;font-size:12px}h1{font-size:18px;margin:0 0 14px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9dee7;padding:6px 7px;text-align:left;font-size:10px;vertical-align:top}th{background:#f3f4f6;font-weight:700}td.num,th.num{text-align:right}.card{border:1px solid #d9dee7;border-radius:8px;margin-bottom:10px;overflow:hidden}.kinerja-section{margin-bottom:10px}.kinerja-chart{max-width:100%;height:auto}.kinerja-legend{margin:6px 0 10px;font-size:10px}.extra-empty,.empty{padding:15px;text-align:center}@page{size:auto;margin:12mm}</style></head><body><h1>${escHtml(title)}</h1>${content.innerHTML}</body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),250);
  }

  function tableToRows(table){return [...table.rows].map(row=>[...row.cells].map(cell=>cell.innerText.trim().replace(/\s+/g,' ')))}

  function exportCsv(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;
    const tables=[...content.querySelectorAll('table')];
    if(!tables.length){alert('Tidak ada tabel yang dapat diekspor pada laporan ini.');return}
    const title=activeName(root).replace(/[^a-z0-9\-_]+/gi,'_').replace(/^_+|_+$/g,'').toLowerCase()||'laporan';
    const blocks=[];
    tables.forEach((table,i)=>{
      if(i)blocks.push(['']);
      blocks.push(...tableToRows(table));
    });
    const csv='\ufeff'+blocks.map(row=>row.map(csvCell).join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${title}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  function boot(){
    let n=0;
    const tick=()=>{if(inject()||++n>=80)return;setTimeout(tick,100)};
    tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>inject()).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();