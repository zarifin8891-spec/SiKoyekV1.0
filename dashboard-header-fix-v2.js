/* SiKoyek Dashboard Header Fix V2
   Scope: Header period controls only.
   - Fixes local-date off-by-one caused by toISOString() in period presets.
   - Keeps the selected preset visible after render.
   - Gives period controls a coordinated non-white treatment and shared vertical geometry.
*/
(function(){
  'use strict';
  const STYLE_ID='dashboard-header-fix-v2';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .dashboard-view .top.dashboard-top > .periodbar{
        align-items:flex-start!important;
      }
      .dashboard-view .periodrow{
        align-items:flex-end!important;
      }
      .dashboard-view .periodrow .field{
        display:flex!important;
        flex-direction:column!important;
        justify-content:flex-end!important;
      }
      .dashboard-view .periodrow .field label{
        height:14px!important;
        line-height:14px!important;
        margin:0 0 4px!important;
      }
      .dashboard-view .periodrow .field input,
      .dashboard-view .periodrow .field select{
        height:42px!important;
        box-sizing:border-box!important;
        background:rgba(13,41,74,.34)!important;
        background-color:rgba(13,41,74,.34)!important;
        border:1px solid rgba(255,255,255,.38)!important;
        color:#fff!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;
      }
      .dashboard-view .periodrow .field input:hover,
      .dashboard-view .periodrow .field select:hover{
        background:rgba(13,41,74,.46)!important;
        border-color:rgba(255,255,255,.52)!important;
      }
      .dashboard-view .periodrow .field input:focus,
      .dashboard-view .periodrow .field select:focus{
        background:rgba(13,41,74,.52)!important;
        border-color:rgba(255,255,255,.72)!important;
        outline:none!important;
        box-shadow:0 0 0 2px rgba(255,255,255,.10)!important;
      }
      .dashboard-view .periodrow .field select option{
        color:#172033!important;
        background:#fff!important;
      }
      .dashboard-view .periodrow .field input::placeholder{
        color:rgba(255,255,255,.86)!important;
      }
      .dashboard-view .periodrow .btn{
        height:42px!important;
        box-sizing:border-box!important;
        align-self:flex-end!important;
      }
      .dashboard-view .periodnote{
        align-self:flex-end!important;
        min-height:42px!important;
        display:flex!important;
        align-items:center!important;
      }
    `;
    document.head.appendChild(s);
  }

  function localDate(y,m,d){
    const mm=String(m+1).padStart(2,'0');
    const dd=String(d).padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }

  function presetRange(v){
    const d=new Date();
    const y=d.getFullYear(), m=d.getMonth();
    if(v==='thisMonth') return {from:localDate(y,m,1),to:localDate(y,m+1,new Date(y,m+1,0).getDate())};
    if(v==='lastMonth') return {from:localDate(y,m-1,1),to:localDate(y,m,new Date(y,m,0).getDate())};
    if(v==='thisYear') return {from:`${y}-01-01`,to:`${y}-12-31`};
    return {from:'',to:''};
  }

  function selectedPreset(){
    const from=state?.period?.from||'',to=state?.period?.to||'';
    const d=new Date(),y=d.getFullYear(),m=d.getMonth();
    const thisFrom=localDate(y,m,1),thisTo=localDate(y,m+1,new Date(y,m+1,0).getDate());
    const lastFrom=localDate(y,m-1,1),lastTo=localDate(y,m,new Date(y,m,0).getDate());
    if(from===thisFrom&&to===thisTo) return 'thisMonth';
    if(from===lastFrom&&to===lastTo) return 'lastMonth';
    if(from===`${y}-01-01`&&to===`${y}-12-31`) return 'thisYear';
    return '';
  }

  function applyPresetFixed(v){
    const range=presetRange(v);
    if(typeof state==='undefined') return;
    state.period=range;
    if(typeof renderPage==='function') renderPage();
    setTimeout(()=>{
      const select=document.getElementById('periodPreset');
      if(select) select.value=v||selectedPreset();
    },0);
  }

  function syncPreset(){
    const select=document.getElementById('periodPreset');
    if(select) select.value=selectedPreset();
  }

  function install(){
    addStyle();
    if(typeof window.applyPreset==='function' && window.applyPreset!==applyPresetFixed){
      window.applyPreset=applyPresetFixed;
    }
    syncPreset();
  }

  const observer=new MutationObserver(()=>setTimeout(install,0));
  observer.observe(document.body,{childList:true,subtree:true});
  addStyle();
  setTimeout(install,0);
  setInterval(()=>{if(document.querySelector('.dashboard-view')) install()},800);
})();
