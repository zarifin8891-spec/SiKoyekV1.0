(function(){
  const STYLE_ID='dashboard-graphs-ui-fix-style';
  const TOOLBAR_CLASS='graphs-toolbar-v2';

  function install(){
    const section=document.querySelector('.dashboard-graphs-section');
    if(!section) return false;

    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement('style');
      s.id=STYLE_ID;
      s.textContent=`
        /* Visual Analysis toolbar: one precise horizontal row, matching the approved UI. */
        .dashboard-graphs-section .${TOOLBAR_CLASS}{
          display:grid;
          grid-template-columns:minmax(300px,1fr) 190px 190px minmax(260px,1.15fr) auto;
          align-items:center;
          gap:12px;
          margin:0 0 12px;
          padding:12px 14px;
          background:#fff;
          border:1px solid #e4eaf4;
          border-radius:14px;
          box-sizing:border-box;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graphs-title-block{min-width:0}
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graphs-title-block h2{
          margin:0;
          font-size:17px;
          line-height:1.15;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graphs-sub{font-size:12px;color:var(--muted)}
        .dashboard-graphs-section .${TOOLBAR_CLASS} #graphSelectionNote{
          justify-self:end;
          white-space:nowrap;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graph-control{
          min-width:0;
          display:flex;
          flex-direction:column;
          gap:5px;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graph-control label{
          font-size:10px;
          font-weight:800;
          color:var(--muted);
          text-transform:uppercase;
          letter-spacing:.04em;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .graph-control select{
          width:100%;
          height:38px;
          border:1px solid #d7dfeb;
          border-radius:9px;
          background:#fff;
          color:#172033;
          padding:7px 10px;
          font-size:13px;
          box-sizing:border-box;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .selected-wrap.show{display:flex}
        .dashboard-graphs-section .${TOOLBAR_CLASS} .control-note{
          min-width:0;
          font-size:11px;
          color:var(--muted);
          line-height:1.25;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} > .control-note{
          align-self:center;
        }
        .dashboard-graphs-section .${TOOLBAR_CLASS} .selected-wrap{grid-column:2 / -1}

        /* Keep the chart cards below the toolbar; no dashboard structure changes. */
        .dashboard-graphs-section .graph-grid{margin-top:0}

        /* Empty-state behavior retained from the previous fix. */
        .dashboard-graphs-section .graph-empty-state{
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          padding:20px;
          color:#6b778b;
          background:linear-gradient(180deg,#fff 0%,#f7f9fd 100%);
          border-radius:12px;
          z-index:2;
        }
        .dashboard-graphs-section .graph-empty-state strong{
          display:block;
          color:#233047;
          font-size:14px;
          margin-bottom:4px;
        }
        .dashboard-graphs-section .graph-empty-state[hidden]{display:none}
        .dashboard-graphs-section .graph-canvas{visibility:visible}
        .dashboard-graphs-section .graph-canvas.is-empty{visibility:hidden}

        /* Period transaction panel: exactly six project rows visible before scrolling. */
        .period-performance-section .pp-table-wrap .scroll{
          height:200px !important;
          max-height:200px !important;
          min-height:200px !important;
        }

        @media(max-width:1200px){
          .dashboard-graphs-section .${TOOLBAR_CLASS}{
            grid-template-columns:minmax(260px,1fr) 180px 180px minmax(220px,1fr);
          }
          .dashboard-graphs-section .${TOOLBAR_CLASS} #graphSelectionNote{grid-column:4;grid-row:1}
        }
        @media(max-width:900px){
          .dashboard-graphs-section .${TOOLBAR_CLASS}{grid-template-columns:1fr 1fr}
          .dashboard-graphs-section .${TOOLBAR_CLASS} .graphs-title-block{grid-column:1 / -1}
          .dashboard-graphs-section .${TOOLBAR_CLASS} #graphSelectionNote{grid-column:2;grid-row:2;justify-self:end}
          .dashboard-graphs-section .${TOOLBAR_CLASS} .selected-wrap{grid-column:1 / -1}
        }
        @media(max-width:520px){
          .dashboard-graphs-section .${TOOLBAR_CLASS}{grid-template-columns:1fr}
          .dashboard-graphs-section .${TOOLBAR_CLASS} .graphs-title-block,
          .dashboard-graphs-section .${TOOLBAR_CLASS} #graphSelectionNote,
          .dashboard-graphs-section .${TOOLBAR_CLASS} .selected-wrap{grid-column:1}
          .dashboard-graphs-section .${TOOLBAR_CLASS} #graphSelectionNote{grid-row:auto;justify-self:start}
        }
      `;
      document.head.appendChild(s);
    }

    const mode=section.querySelector('#graphMode');
    if(!mode) return false;

    /* Remove the optional project-picker mode. The approved flow goes directly from header/filters to charts. */
    mode.querySelector('option[value="selected"]')?.remove();
    section.querySelector('#selectedWrap')?.remove();

    /* Build the toolbar once by moving the existing controls; data/chart logic stays untouched. */
    if(!section.querySelector('.'+TOOLBAR_CLASS)){
      const head=section.querySelector('.graphs-head');
      const controls=section.querySelector('.graph-controls');
      if(!head||!controls) return false;

      const toolbar=document.createElement('div');
      toolbar.className=TOOLBAR_CLASS;

      const titleBlock=head.firstElementChild;
      const selectionNote=head.querySelector('#graphSelectionNote');
      if(titleBlock){
        titleBlock.classList.add('graphs-title-block');
        toolbar.appendChild(titleBlock);
      }

      [...controls.children].forEach(child=>toolbar.appendChild(child));

      if(selectionNote) toolbar.appendChild(selectionNote);
      head.remove();
      controls.remove();

      /* Ensure selection count stays at the far right, after the two primary controls. */
      if(selectionNote) toolbar.appendChild(selectionNote);
      section.insertBefore(toolbar,section.firstElementChild);
    }

    const wraps=[
      section.querySelector('#chartCashFlow')?.parentElement,
      section.querySelector('#chartProgressCost')?.parentElement
    ].filter(Boolean);

    wraps.forEach(w=>{
      const canvas=w.querySelector('canvas');
      if(canvas) canvas.classList.add('graph-canvas');
      if(!w.querySelector('.graph-empty-state')){
        const e=document.createElement('div');
        e.className='graph-empty-state';
        e.hidden=true;
        e.innerHTML='<div><strong>Belum ada proyek dipilih</strong><div>Centang satu atau beberapa proyek di atas untuk menampilkan grafik.</div></div>';
        w.appendChild(e);
      }
    });

    const sync=()=>{
      const selected=section.querySelectorAll('#graphProjects input[type="checkbox"]:checked').length;
      const empty=mode.value==='selected' && selected===0;
      wraps.forEach(w=>{
        const canvas=w.querySelector('canvas');
        const overlay=w.querySelector('.graph-empty-state');
        if(canvas) canvas.classList.toggle('is-empty',empty);
        if(overlay) overlay.hidden=!empty;
      });
    };

    section.querySelectorAll('#graphProjects input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',sync));
    ['selectAllProjects','clearProjects'].forEach(id=>section.querySelector('#'+id)?.addEventListener('click',()=>setTimeout(sync,0)));
    mode.addEventListener('change',()=>setTimeout(sync,0));
    sync();
    return true;
  }

  const obs=new MutationObserver(()=>install());
  obs.observe(document.body,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>30)clearInterval(timer)},500);
})();
