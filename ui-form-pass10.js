/* Pass 10: compact single-screen Tambah Proyek Baru.
   Desktop: 4-column compact form, no vertical/horizontal scroll.
   Mobile: responsive stack remains usable. */
(function(){
  const VERSION='10.0';
  const STYLE_ID='ui-form-pass10-style';

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* ===== Modal shell ===== */
      .modalbox.p6-form:not(:has(#p6CatRows)){
        width:min(1120px,calc(100vw - 36px))!important;
        max-width:1120px!important;
        max-height:calc(100vh - 28px)!important;
        height:auto!important;
        overflow:hidden!important;
        padding:0!important;
        border-radius:22px!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body{
        width:100%!important;
        max-height:none!important;
        height:auto!important;
        overflow:hidden!important;
        padding:0!important;
      }

      /* ===== Header ===== */
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead{
        height:76px!important;
        min-height:76px!important;
        padding:13px 24px!important;
        margin:0!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        border:0!important;
        border-radius:22px 22px 0 0!important;
        background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;
        color:#fff!important;
        box-shadow:none!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead h3{
        display:block!important;
        visibility:visible!important;
        margin:0!important;
        color:#fff!important;
        font-size:21px!important;
        line-height:1.1!important;
        font-weight:750!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead::after{
        content:'Isi data inti proyek sebelum masuk ke tahap konfirmasi.'!important;
        position:absolute!important;
        left:24px!important;
        bottom:12px!important;
        color:rgba(255,255,255,.82)!important;
        font-size:10px!important;
        line-height:1.2!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead button{
        height:38px!important;
        min-height:38px!important;
        min-width:90px!important;
        padding:0 16px!important;
        margin:0!important;
        border-radius:9px!important;
        background:#fff!important;
        color:#0d294a!important;
        border:1px solid #fff!important;
        font-size:13px!important;
        font-weight:500!important;
      }

      /* ===== Only 2 visible stages ===== */
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-steps{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        margin:10px 24px 8px!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-steps .ui-step[data-target="2"]{display:none!important}
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-steps .ui-step[data-target="1"],
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-steps .ui-step[data-target="3"]{
        display:flex!important;
        min-height:38px!important;
        height:38px!important;
        align-items:center!important;
        justify-content:center!important;
        padding:0 10px!important;
        border-radius:9px!important;
        font-size:12px!important;
      }

      /* ===== Data Proyek: compact 4-column layout ===== */
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"]{
        margin:0 24px!important;
        padding:0!important;
        overflow:visible!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .formgrid,
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .twocol{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:8px 10px!important;
        margin:0!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .field{
        min-width:0!important;
        margin:0!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .field label{
        display:block!important;
        margin:0 0 3px!important;
        font-size:10px!important;
        line-height:1.15!important;
        font-weight:650!important;
        color:#526078!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] input,
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] select,
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] textarea{
        width:100%!important;
        min-width:0!important;
        min-height:36px!important;
        height:36px!important;
        padding:6px 9px!important;
        border-radius:8px!important;
        font-size:12px!important;
      }

      /* Field widths: long identity fields get more room; compact fields stay small. */
      .modalbox.p6-form:not(:has(#p6CatRows)) #f_name-wrap,
      .modalbox.p6-form:not(:has(#p6CatRows)) #f_loc-wrap{grid-column:span 2!important}
      .modalbox.p6-form:not(:has(#p6CatRows)) .p10-span-2{grid-column:span 2!important}
      .modalbox.p6-form:not(:has(#p6CatRows)) .p10-span-4{grid-column:1/-1!important}

      /* Category helper must not create extra vertical bulk. */
      .modalbox.p6-form:not(:has(#p6CatRows)) .step1-category-tools{
        min-height:24px!important;
        height:24px!important;
        margin-top:3px!important;
        gap:6px!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows)) .step1-category-tools span{font-size:9px!important}
      .modalbox.p6-form:not(:has(#p6CatRows)) .step1-category-tools .btn{
        min-height:24px!important;
        height:24px!important;
        padding:2px 7px!important;
        border-radius:7px!important;
        font-size:9px!important;
      }

      .modalbox.p6-form:not(:has(#p6CatRows)) .si9-section-label{
        margin:7px 0 5px!important;
        font-size:10px!important;
      }

      /* ===== Confirmation: compact rows, no giant blank cards ===== */
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"]{
        margin:0 24px!important;
        padding:0!important;
        overflow:visible!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"] .ui-confirm-row,
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"] .confirm-row{
        min-height:40px!important;
        height:40px!important;
        padding:7px 11px!important;
        margin-bottom:6px!important;
        border-radius:8px!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"] .ui-help{
        margin:0 0 7px!important;
        padding:7px 10px!important;
        font-size:10px!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"] .note{
        font-size:10px!important;
      }

      /* ===== Bottom action bar ===== */
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions{
        min-height:52px!important;
        height:52px!important;
        margin:8px 24px 0!important;
        padding:7px 0 8px!important;
        gap:7px!important;
        border-top:1px solid #e8edf3!important;
        justify-content:flex-end!important;
        align-items:center!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions .btn{
        min-width:94px!important;
        width:auto!important;
        height:34px!important;
        min-height:34px!important;
        padding:0 12px!important;
        border-radius:8px!important;
        font-size:11px!important;
        line-height:34px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions #uiNext,
      .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions #uiSaveProject{min-width:118px!important}

      @media(max-width:900px){
        .modalbox.p6-form:not(:has(#p6CatRows)){width:min(96vw,720px)!important;max-height:calc(100vh - 18px)!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .formgrid,
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .twocol{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
      }
      @media(max-width:560px){
        .modalbox.p6-form:not(:has(#p6CatRows)){
          width:calc(100vw - 16px)!important;
          max-height:calc(100vh - 10px)!important;
          border-radius:16px!important;
        }
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead{height:70px!important;min-height:70px!important;padding:11px 14px!important;border-radius:16px 16px 0 0!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead h3{font-size:18px!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.modalhead.step1-modalhead::after{left:14px!important;bottom:10px!important;font-size:9px!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-steps{margin:8px 14px 7px!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"],
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="3"],
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions{margin-left:14px!important;margin-right:14px!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .formgrid,
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.ui-pane[data-pane="1"] .twocol{grid-template-columns:1fr!important}
        .modalbox.p6-form:not(:has(#p6CatRows)) .p10-span-2{grid-column:1/-1!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions{gap:5px!important}
        .modalbox.p6-form:not(:has(#p6CatRows))>.p6-body>.formactions .btn{flex:1 1 0;min-width:0!important}
      }
    `;
    document.head.appendChild(s);
  }

  function markFields(){
    const box=document.querySelector('#modal .modalbox.p6-form:not(:has(#p6CatRows))');
    if(!box)return;
    const map={
      f_name:'p10-span-2',
      f_loc:'p10-span-2'
    };
    Object.entries(map).forEach(([id,cls])=>{
      const el=box.querySelector('#'+id); const field=el?.closest('.field');
      if(field)field.classList.add(cls);
    });
  }

  function normalizeLabels(){
    const box=document.querySelector('#modal .modalbox.p6-form:not(:has(#p6CatRows))');
    if(!box)return;
    const one=box.querySelector('.ui-step[data-target="1"]');
    const three=box.querySelector('.ui-step[data-target="3"]');
    if(one)one.textContent='Data Proyek';
    if(three)three.textContent='Konfirmasi';
  }

  function apply(){
    addStyle();
    const box=document.querySelector('#modal .modalbox.p6-form:not(:has(#p6CatRows))');
    if(!box)return;
    markFields();
    normalizeLabels();
    box.dataset.pass10='1';
    /* Hard stop: the project modal itself must never become a scroll container. */
    box.style.overflow='hidden';
    const body=box.querySelector('.p6-body');
    if(body)body.style.overflow='hidden';
  }

  let timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(apply,40)}
  function boot(){apply();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
