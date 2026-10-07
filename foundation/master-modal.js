
(function(){
  const STYLE='sikoyek-project-manager-modal-v1-style';
  function normalize(v){return (v||'').replace(/\*/g,'').replace(/\s+/g,' ').trim().toLowerCase();}
  function arrangeProjectManager(box){
    const fields=Array.from(box.querySelectorAll('.formgrid .field'));
    const byLabel={};
    fields.forEach(f=>{byLabel[normalize(f.querySelector('label')?.textContent)]=f;});
    const positions={
      'urutan':[1,1],
      'kode':[2,1],
      'nama':[1,2],
      'no. telepon':[2,2],
      'no telepon':[2,2],
      'telepon':[2,2],
      'email':[1,3]
    };
    Object.keys(positions).forEach(key=>{
      const f=byLabel[key];
      if(!f)return;
      const [col,row]=positions[key];
      f.style.setProperty('grid-column',String(col),'important');
      f.style.setProperty('grid-row',String(row),'important');
    });
  }
  function apply(){
    let s=document.getElementById(STYLE);
    if(!s){s=document.createElement('style');s.id=STYLE;document.head.appendChild(s);}
    window.SiKoyekFoundation.setStyle(s,`
      #modal .sikoyek-pm-final{width:576px!important;min-width:576px!important;max-width:576px!important;height:auto!important;padding:0!important;overflow:hidden!important;border-radius:18px!important;box-sizing:border-box!important;background:#fff!important}
      #modal .sikoyek-pm-final .modalhead{width:100%!important;height:82px!important;min-height:82px!important;margin:0!important;padding:16px 20px 16px 28px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;border-radius:18px 18px 0 0!important;background:linear-gradient(135deg,#102a4a 0%,#173b67 55%,#1f6274 100%)!important;color:#fff!important}
      #modal .sikoyek-pm-final .modalhead h3{color:#fff!important;font-size:22px!important;font-weight:750!important;margin:0!important;padding:0!important}
      #modal .sikoyek-pm-final .modalhead button{height:42px!important;min-height:42px!important;min-width:100px!important;padding:0 14px!important;margin-right:12px!important;border-radius:9px!important;font-size:12px!important;font-weight:400!important}
      #modal .sikoyek-pm-final .p6-body,#modal .sikoyek-pm-final .p5-body{width:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important}
      #modal .sikoyek-pm-final .formgrid{width:calc(100% - 40px)!important;margin:0 20px!important;padding:18px 0 0!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px 11px!important;box-sizing:border-box!important}
      #modal .sikoyek-pm-final .formgrid .field{margin:0!important;width:auto!important;min-width:0!important}
      #modal .sikoyek-pm-final .field label{display:block!important;margin:0 0 4px!important;font-size:12px!important;line-height:1.15!important;font-weight:650!important;color:#304059!important}
      #modal .sikoyek-pm-final .field input,#modal .sikoyek-pm-final .field select,#modal .sikoyek-pm-final .field textarea{width:100%!important;height:40px!important;min-height:40px!important;padding:7px 10px!important;border:1px solid #cbd8e6!important;border-radius:8px!important;font-size:13px!important;box-sizing:border-box!important}
      #modal .sikoyek-pm-final .formactions{width:calc(100% - 40px)!important;margin:10px 20px 0!important;height:58px!important;min-height:58px!important;padding:8px 0!important;border-top:1px solid #e8edf3!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;box-sizing:border-box!important}
      #modal .sikoyek-pm-final .formactions .btn{height:36px!important;min-height:36px!important;min-width:92px!important;padding:0 12px!important;border-radius:8px!important;font-size:12px!important;font-weight:400!important}
      @media(max-width:620px){#modal .sikoyek-pm-final{width:calc(100vw - 28px)!important;min-width:0!important;max-width:none!important}.sikoyek-pm-final .formgrid{grid-template-columns:1fr!important}}
    `);
    document.querySelectorAll('#modal .modalbox').forEach(box=>{
      const title=normalize(box.querySelector('.modalhead h3')?.textContent);
      if(!/^(tambah|edit|hapus)\b/.test(title)||!title.includes('project manager'))return;
      box.dataset.foundationLayout='master-compact';
      box.classList.add('sikoyek-pm-final');
      arrangeProjectManager(box);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  new window.SiKoyekFoundation.Observer(apply).observe(document.body,{childList:true,subtree:true});
})();
