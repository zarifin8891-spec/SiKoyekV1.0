/* SiKoyek V1.0 — compact Isi RAP form. */
(function(){
  const STYLE_ID='ui-rap-compact-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #modal .modalbox:has(#rap_material){
        width:min(560px,calc(100vw - 32px))!important;
        max-width:560px!important;
        max-height:calc(100vh - 32px)!important;
        padding:18px!important;
        border-radius:18px!important;
        overflow:hidden!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead{
        margin:0 0 14px!important;
        min-height:38px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead h3{
        margin:0!important;
        font-size:20px!important;
        line-height:1.1!important;
      }
      #modal .modalbox:has(#rap_material)>.modalhead .btn{
        height:34px!important;
        min-height:34px!important;
        min-width:78px!important;
        padding:0 12px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:13px!important;
        font-weight:500!important;
      }
      #modal .modalbox:has(#rap_material) .formgrid{
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:10px!important;
        width:100%!important;
        margin:0!important;
      }
      #modal .modalbox:has(#rap_material) .field{
        min-width:0!important;
        margin:0!important;
      }
      #modal .modalbox:has(#rap_material) .field label{
        display:block!important;
        margin:0 0 4px!important;
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:600!important;
        color:#40506a!important;
      }
      #modal .modalbox:has(#rap_material) .field input{
        width:100%!important;
        height:38px!important;
        min-height:38px!important;
        padding:6px 9px!important;
        border:1px solid #cbd9e8!important;
        border-radius:8px!important;
        background:#fff!important;
        color:#172033!important;
        font-size:13px!important;
        font-weight:400!important;
        text-align:right!important;
      }
      #modal .modalbox:has(#rap_material) .field input:focus{
        border-color:#8aa9c6!important;
        box-shadow:none!important;
        outline:none!important;
      }
      #modal .modalbox:has(#rap_material) .note{
        margin:9px 0 0!important;
        font-size:10px!important;
        line-height:1.3!important;
        color:#6f7c91!important;
      }
      #modal .modalbox:has(#rap_material)>.formactions{
        height:42px!important;
        min-height:42px!important;
        margin:12px 0 0!important;
        padding:6px 0 0!important;
        border-top:1px solid #e6ebf1!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:7px!important;
      }
      #modal .modalbox:has(#rap_material)>.formactions .btn{
        width:104px!important;
        min-width:104px!important;
        height:34px!important;
        min-height:34px!important;
        padding:0 12px!important;
        border-radius:8px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        font-size:13px!important;
        line-height:1!important;
        font-weight:500!important;
      }
      #modal .modalbox:has(#rap_material)>.formactions .btn.primary{
        background:#0b2e52!important;
        border-color:#0b2e52!important;
        color:#fff!important;
      }
      @media(max-width:620px){
        #modal .modalbox:has(#rap_material){width:calc(100vw - 20px)!important}
        #modal .modalbox:has(#rap_material) .formgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
      @media(max-width:430px){
        #modal .modalbox:has(#rap_material) .formgrid{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }
  addStyle();
})();
