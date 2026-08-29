/* Match Edit Data Proyek to the approved Tambah Proyek layout. */
(function(){
  const STYLE_ID='ui-form-edit-match-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
/* ===== Edit Proyek: same desktop geometry as approved Tambah Proyek ===== */
#modal .modalbox.edit-project-match{
  width:min(820px,calc(100vw - 28px))!important;
  max-width:820px!important;
  max-height:calc(100vh - 24px)!important;
  overflow:hidden!important;
  padding:0!important;
  border-radius:20px!important;
}
#modal .modalbox.edit-project-match>.p6-body{
  padding:0!important;margin:0!important;overflow:hidden!important;
}
#modal .modalbox.edit-project-match>.p6-body>.modalhead{
  height:78px!important;min-height:78px!important;
  padding:12px 22px!important;margin:0!important;
  border:0!important;border-radius:20px 20px 0 0!important;
  background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%)!important;
  color:#fff!important;display:flex!important;align-items:center!important;justify-content:space-between!important;
  position:relative!important;overflow:hidden!important;
}
#modal .modalbox.edit-project-match>.p6-body>.modalhead h3{
  color:#fff!important;font-size:23px!important;line-height:1.05!important;font-weight:650!important;margin:0!important;
}
#modal .modalbox.edit-project-match>.p6-body>.modalhead h3:after{
  content:'Isi data inti proyek sebelum masuk ke tahap konfirmasi.';
  display:block;color:#e8f4f8;font-size:10px;font-weight:400;line-height:1.2;margin-top:4px;
}
#modal .modalbox.edit-project-match>.p6-body>.modalhead button{
  height:36px!important;min-height:36px!important;min-width:84px!important;
  padding:0 14px!important;border:0!important;border-radius:9px!important;
  background:#fff!important;color:#172033!important;font-size:13px!important;font-weight:500!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"]{
  margin:0 18px!important;padding:0!important;overflow:visible!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .formgrid,
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .twocol{
  display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;
  gap:6px 8px!important;margin:0!important;padding:10px!important;
  border:1px solid #dfe7f0!important;border-radius:13px!important;background:#fbfcfe!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field{
  min-width:0!important;margin:0!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field label{
  display:block!important;margin:0 0 3px!important;color:#3d4d66!important;
  font-size:9px!important;line-height:1.15!important;font-weight:600!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] input,
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] select,
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] textarea{
  width:100%!important;min-width:0!important;height:33px!important;min-height:33px!important;
  padding:5px 8px!important;border:1px solid #cbd9e8!important;border-radius:7px!important;
  background:#fff!important;color:#172033!important;font-size:11px!important;outline:none!important;
}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(1),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(2),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(3),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(5),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(6),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(7),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(8),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(9),
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(10){grid-column:span 2!important}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(4){grid-column:1/-1!important}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(4){grid-row:auto!important}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(10){grid-column:span 2!important}
#modal .modalbox.edit-project-match>.p6-body>.formactions{
  height:48px!important;min-height:48px!important;margin-top:7px!important;padding:6px 18px!important;
  border-top:1px solid #e6ebf1!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:7px!important;
}
#modal .modalbox.edit-project-match>.p6-body>.formactions .btn{
  height:34px!important;min-height:34px!important;min-width:88px!important;padding:0 14px!important;margin:0!important;
  border-radius:8px!important;font-size:13px!important;font-weight:500!important;line-height:1!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:nowrap!important;
}
#modal .modalbox.edit-project-match>.p6-body>.formactions .btn.primary{min-width:112px!important;background:#0b2e52!important;border-color:#0b2e52!important;color:#fff!important}
#modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field input[type="number"]{
  font-size:12px!important;font-weight:500!important;text-align:right!important;line-height:1!important;
}
@media(max-width:900px){
  #modal .modalbox.edit-project-match{width:calc(100vw - 18px)!important;max-width:none!important}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .formgrid,
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .twocol{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field{grid-column:span 1!important}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(4){grid-column:1/-1!important}
}
@media(max-width:560px){
  #modal .modalbox.edit-project-match{width:calc(100vw - 16px)!important;max-height:calc(100vh - 10px)!important;border-radius:16px!important}
  #modal .modalbox.edit-project-match>.p6-body>.modalhead{height:70px!important;min-height:70px!important;padding:10px 14px!important;border-radius:16px 16px 0 0!important}
  #modal .modalbox.edit-project-match>.p6-body>.modalhead h3{font-size:20px!important}
  #modal .modalbox.edit-project-match>.p6-body>.modalhead h3:after{font-size:9px;margin-top:3px}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"]{margin:0 12px!important}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .formgrid,
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .twocol{grid-template-columns:1fr!important}
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field,
  #modal .modalbox.edit-project-match>.p6-body>.ui-pane[data-pane="1"] .field:nth-child(4){grid-column:1/-1!important}
  #modal .modalbox.edit-project-match>.p6-body>.formactions{padding:6px 12px!important}
  #modal .modalbox.edit-project-match>.p6-body>.formactions .btn{min-width:0!important;flex:1}
}
`;
    document.head.appendChild(s);
  }
  function mark(){
    addStyle();
    document.querySelectorAll('#modal .modalbox.p6-form').forEach(box=>{
      const h=box.querySelector('.p6-body>.modalhead h3');
      if(h && h.textContent.trim().toLowerCase()==='edit data proyek') box.classList.add('edit-project-match');
    });
  }
  function boot(){mark();new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
