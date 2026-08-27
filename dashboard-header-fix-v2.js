/* SiKoyek Dashboard Header Fix V2 */
(function(){
  'use strict';
  const STYLE_ID='dashboard-header-fix-v2';
  function addStyle(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}
    s.textContent=`
      /* Current + legacy Dashboard DOM: deliberately broad selectors so the visual fix cannot miss the header fields. */
      .dashboard-view .top.dashboard-top .periodrow .field input,.dashboard-view .top.dashboard-top .periodrow .field select,
      .top.dashboard-top .periodrow .field input,.top.dashboard-top .periodrow .field select,
      .dashboard-view .dashboard-head .dashboard-period input,.dashboard-view .dashboard-head .dashboard-period select,
      .dashboard-head .dashboard-period input,.dashboard-head .dashboard-period select{
        width:100%!important;height:42px!important;min-height:42px!important;box-sizing:border-box!important;
        padding:8px 12px!important;background:#1b4b6d!important;background-color:#1b4b6d!important;
        border:1px solid rgba(255,255,255,.32)!important;border-radius:10px!important;color:#fff!important;
        font-size:14px!important;font-weight:400!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important;
        -webkit-appearance:none!important;appearance:none!important;
      }
      .top.dashboard-top .periodrow .field,.dashboard-head .dashboard-period .field{display:flex!important;flex-direction:column!important;justify-content:flex-end!important;min-width:0!important;margin:0!important}
      .top.dashboard-top .periodrow .field label,.dashboard-head .dashboard-period .field label{height:14px!important;line-height:14px!important;margin:0 0 4px!important;color:rgba(255,255,255,.88)!important;font-size:11px!important;font-weight:500!important}
      .top.dashboard-top .periodrow .btn,.dashboard-head .dashboard-period .btn{height:42px!important;min-height:42px!important;box-sizing:border-box!important;align-self:flex-end!important}
      .top.dashboard-top .periodnote,.dashboard-head .dashboard-period-note{height:42px!important;min-height:42px!important;display:flex!important;align-items:center!important;align-self:flex-end!important;margin:0!important}
      .top.dashboard-top .periodrow .field input:hover,.top.dashboard-top .periodrow .field select:hover,.dashboard-head .dashboard-period input:hover,.dashboard-head .dashboard-period select:hover{background:#235777!important;background-color:#235777!important}
      .top.dashboard-top .periodrow .field input:focus,.top.dashboard-top .periodrow .field select:focus,.dashboard-head .dashboard-period input:focus,.dashboard-head .dashboard-period select:focus{background:#235777!important;background-color:#235777!important;outline:none!important;border-color:rgba(255,255,255,.75)!important;box-shadow:0 0 0 2px rgba(255,255,255,.10)!important}
      .top.dashboard-top .periodrow select option,.dashboard-head .dashboard-period select option{color:#172033!important;background:#fff!important}
      .top.dashboard-top .periodrow input::placeholder,.dashboard-head .dashboard-period input::placeholder{color:rgba(255,255,255,.78)!important}
      .top.dashboard-top .periodrow input[type=date]::-webkit-calendar-picker-indicator,.dashboard-head .dashboard-period input[type=date]::-webkit-calendar-picker-indicator{filter:brightness(0) invert(1)!important;opacity:.9!important}
    `;
  }
  function localDate(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
  function presetRange(v){const d=new Date(),y=d.getFullYear(),m=d.getMonth();if(v==='thisMonth')return{from:localDate(y,m,1),to:localDate(y,m,new Date(y,m+1,0).getDate())};if(v==='lastMonth')return{from:localDate(y,m-1,1),to:localDate(y,m-1,new Date(y,m,0).getDate())};if(v==='thisYear')return{from:`${y}-01-01`,to:`${y}-12-31`};return{from:'',to:''};}
  function selectedPreset(){if(typeof state==='undefined')return '';const from=state.period?.from||'',to=state.period?.to||'',d=new Date(),y=d.getFullYear(),m=d.getMonth();if(from===localDate(y,m,1)&&to===localDate(y,m,new Date(y,m+1,0).getDate()))return'thisMonth';if(from===localDate(y,m-1,1)&&to===localDate(y,m-1,new Date(y,m,0).getDate()))return'lastMonth';if(from===`${y}-01-01`&&to===`${y}-12-31`)return'thisYear';return '';}
  function applyPresetFixed(v){if(typeof state==='undefined')return;state.period=presetRange(v);if(typeof renderPage==='function')renderPage();setTimeout(()=>{const select=document.getElementById('periodPreset');if(select)select.value=v||selectedPreset();syncDateInputs();},0);}
  function syncDateInputs(){const select=document.getElementById('periodPreset');if(!select||typeof state==='undefined')return;const row=select.closest('.periodrow')||select.parentElement?.parentElement;if(!row)return;const fields=[...row.querySelectorAll('input[type="date"]')];if(fields[0])fields[0].value=state.period?.from||'';if(fields[1])fields[1].value=state.period?.to||'';}
  function syncPreset(){const select=document.getElementById('periodPreset');if(select)select.value=selectedPreset();syncDateInputs();}
  function install(){addStyle();if(typeof window.applyPreset==='function'&&window.applyPreset!==applyPresetFixed)window.applyPreset=applyPresetFixed;syncPreset();}
  const observer=new MutationObserver(()=>setTimeout(install,0));observer.observe(document.body,{childList:true,subtree:true});addStyle();setTimeout(install,0);setInterval(()=>{if(document.querySelector('.dashboard-view,.dashboard-head,.dashboard-top'))install()},500);
})();