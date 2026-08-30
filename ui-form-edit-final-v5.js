/* Edit Proyek final geometry: rebuild field order from scratch and remove Status field. */
(function(){
  const STYLE_ID='ui-form-edit-final-v5-style';
  const CLASS='edit-project-final-v5';
  let managerPromise=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const text=field=>(field?.querySelector('label')?.textContent||'').trim().toLowerCase().replace(/\s+/g,' ');

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#modal .modalbox.${CLASS}{width:min(820px,calc(100vw - 28px))!important;max-width:820px!important;max-height:calc(100vh - 24px)!important;overflow:hidden!important;padding:0!important;border-radius:20px!important}
#modal .modalbox.${CLASS}>.p6-body{width:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS} .p5-edit-banner{width:calc(100% - 36px)!important;margin:0 18px!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid{width:calc(100% - 36px)!important;max-width:none!important;margin:14px 18px 0!important;padding:10px!important;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;grid-auto-flow:row!important;gap:6px 8px!important;border:1px solid #dfe7f0!important;border-radius:13px!important;background:#fbfcfe!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field{min-width:0!important;margin:0!important;grid-column:span 2!important;grid-row:auto!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field.p5-name-full{grid-column:1/-1!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid .field label{display:block!important;margin:0 0 3px!important;color:#3d4d66!important;font-size:9px!important;line-height:1.15!important;font-weight:600!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid input,#modal .modalbox.${CLASS} .p5-edit-layout-grid select,#modal .modalbox.${CLASS} .p5-edit-layout-grid textarea{width:100%!important;min-width:0!important;height:33px!important;min-height:33px!important;padding:5px 8px!important;border:1px solid #cbd9e8!important;border-radius:7px!important;background:#fff!important;color:#172033!important;font-size:11px!important;line-height:1!important;outline:none!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS} .p5-edit-layout-grid input[type="number"]{font-size:12px!important;font-weight:500!important;text-align:right!important}
#modal .modalbox.${CLASS}>.p6-body>.formactions{width:calc(100% - 36px)!important;height:48px!important;min-height:48px!important;margin:7px 18px 0!important;padding:6px 0!important;border-top:1px solid #e6ebf1!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:7px!important;box-sizing:border-box!important}
#modal .modalbox.${CLASS}>.p6-body>.formactions .btn{height:34px!important;min-height:34px!important;min-width:88px!important;padding:0 14px!important;margin:0!important;border-radius:8px!important;font-size:13px!important;font-weight:500!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:nowrap!important}
#modal .modalbox.${CLASS}>.p6-body>.formactions .btn.primary{min-width:112px!important}
@media(max-width:900px){#modal .modalbox.${CLASS}{width:calc(100vw - 18px)!important;max-width:none!important}#modal .modalbox.${CLASS} .p5-edit-layout-grid{width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field{grid-column:span 1!important}#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field.p5-name-full{grid-column:1/-1!important}#modal .modalbox.${CLASS} .p5-edit-banner{width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important}#modal .modalbox.${CLASS}>.p6-body>.formactions{width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important}}
@media(max-width:560px){#modal .modalbox.${CLASS}{width:calc(100vw - 16px)!important;max-height:calc(100vh - 10px)!important;border-radius:16px!important}#modal .modalbox.${CLASS} .p5-edit-layout-grid{grid-template-columns:1fr!important;width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important}#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field,#modal .modalbox.${CLASS} .p5-edit-layout-grid>.field.p5-name-full{grid-column:1/-1!important}#modal .modalbox.${CLASS} .p5-edit-banner{width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important}#modal .modalbox.${CLASS}>.p6-body>.formactions{width:calc(100% - 24px)!important;margin-left:12px!important;margin-right:12px!important;padding:6px 0!important}#modal .modalbox.${CLASS}>.p6-body>.formactions .btn{min-width:0!important;flex:1}}
`;
    document.head.appendChild(s);
  }
  function getManagers(){
    if(managerPromise)return managerPromise;
    if(typeof sb==='undefined'||!sb)return Promise.resolve([]);
    managerPromise=sb.from('project_managers').select('id,name,code,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true}).then(({data,error})=>{if(error)throw error;return(data||[]).filter(x=>x.is_active!==false)}).catch(()=>{managerPromise=null;return[]});
    return managerPromise;
  }
  function syncManager(box){
    const field=[...box.querySelectorAll('.field')].find(f=>text(f).includes('project manager'));if(!field)return;
    let el=field.querySelector('#p5_mgr');if(!el)return;
    const current=String(el.value||'').trim();
    if(el.tagName!=='SELECT'){const select=document.createElement('select');select.id=el.id||'p5_mgr';select.name=el.name||'';select.className=el.className||'';el.replaceWith(select);el=select}
    if(el.dataset.v5sync==='1')return;el.dataset.v5sync='1';
    getManagers().then(rows=>{const wanted=current||String(el.value||'').trim();el.innerHTML='<option value="">Pilih Project Manager...</option>'+rows.map(x=>`<option value="${esc(x.name)}">${esc(x.name)} (${esc(x.code)})</option>`).join('');if(wanted)el.value=wanted;if(!el.value&&current){const o=document.createElement('option');o.value=current;o.textContent=current;el.appendChild(o);el.value=current}});
  }
  function rebuild(box){
    const source=box.querySelector('.p5-edit-layout-grid')||box.querySelector('.p5-edit-grid,.formgrid,.twocol');
    if(!source)return;
    const fields=[...source.querySelectorAll('.field')];if(!fields.length)return;
    const find=fn=>fields.find(f=>fn(text(f)));
    const ordered=[
      find(t=>t.includes('kode proyek')),
      find(t=>t.includes('tanggal proyek')),
      find(t=>t.includes('pemilik')),
      find(t=>t.includes('nama proyek')),
      find(t=>t==='kategori'),
      find(t=>t==='lokasi'),
      find(t=>t.includes('project manager')),
      find(t=>t.includes('nilai kontrak')||t.includes('nilai proyek')),
      find(t=>t.includes('tanggal mulai')),
      find(t=>t.includes('target selesai')||t.includes('estimasi selesai'))
    ].filter(Boolean);
    if(!ordered.length)return;
    const grid=source.classList.contains('p5-edit-layout-grid')?source:document.createElement('div');
    if(!source.classList.contains('p5-edit-layout-grid'))source.parentNode.replaceChild(grid,source);
    grid.className='p5-edit-layout-grid';grid.dataset.v5='1';
    /* Re-append in exact approved Add order. Status and any other field are excluded entirely. */
    ordered.forEach(field=>{field.classList.remove('p5-name-full','p5-hidden-status');if(text(field).includes('nama proyek'))field.classList.add('p5-name-full');grid.appendChild(field)});
    fields.filter(f=>!ordered.includes(f)).forEach(f=>f.remove());
    syncManager(box);
  }
  function mark(){
    addStyle();
    document.querySelectorAll('#modal .modalbox').forEach(box=>{
      if(!(box.innerText||'').toLowerCase().includes('edit data proyek'))return;
      box.classList.remove('edit-project-match-v2','edit-project-match-v3','edit-project-match-v4');
      box.classList.add(CLASS);
      rebuild(box);
      /* Absolute cleanup: no Status field or label remains in Edit. */
      [...box.querySelectorAll('.field')].forEach(f=>{if(text(f)==='status'||text(f).startsWith('status '))f.remove()});
    });
  }
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(mark,50)};
  const boot=()=>{mark();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
