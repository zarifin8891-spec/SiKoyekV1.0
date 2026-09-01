(function(){
  function install(){
    const fn=window.umAdd;
    if(typeof fn!=='function') return setTimeout(install,50);
    const src=String(fn);
    if(!src.includes('um-add-user-modal')) return setTimeout(install,50);
    let current=fn;
    try{
      Object.defineProperty(window,'umAdd',{
        configurable:true,
        enumerable:true,
        get(){return current},
        set(next){
          if(typeof next==='function' && String(next).includes('um-add-user-modal')) current=next;
        }
      });
      window.__SIKOYEK_USER_ADD_LOCKED__=true;
    }catch(_){
      window.umAdd=current;
    }

    if(!document.getElementById('um-add-modal-header-fix')){
      const s=document.createElement('style');
      s.id='um-add-modal-header-fix';
      s.textContent=`
        .um-add-user-modal .modalbox{
          width:min(420px,calc(100vw - 36px)) !important;
          padding:0 !important;
          border-radius:18px !important;
          overflow:hidden !important;
        }
        .um-add-user-modal .modalhead{
          position:relative !important;
          min-height:100px !important;
          margin:0 !important;
          padding:22px 22px 30px !important;
          background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%) !important;
          border:0 !important;
          align-items:flex-start !important;
        }
        .um-add-user-modal .modalhead h3{
          margin:8px 0 0 !important;
          color:#fff !important;
          font-size:22px !important;
          line-height:1.1 !important;
          font-weight:700 !important;
        }
        .um-add-user-modal .modalhead::after{
          content:'Isi data inti user sebelum masuk ke tahap konfirmasi.';
          position:absolute;
          left:22px;
          bottom:10px;
          color:#eef7fb;
          font-size:11px;
          line-height:1.2;
          font-weight:400;
          pointer-events:none;
        }
        .um-add-user-modal .modalhead .btn{
          height:42px !important;
          min-width:96px !important;
          padding:0 16px !important;
          margin:0 !important;
          border-radius:10px !important;
          background:#fff !important;
          border:1px solid #fff !important;
          color:#172033 !important;
          font-size:14px !important;
          font-weight:400 !important;
        }
        .um-add-user-modal .um-add-form{
          padding:16px 22px 18px !important;
          gap:9px !important;
        }
        .um-add-user-modal .field label{
          font-weight:600 !important;
        }
        .um-add-user-modal .formactions{
          margin:8px -22px -18px !important;
          padding:14px 22px !important;
          border-top:1px solid #eef1f5 !important;
          background:#fff !important;
        }
        .um-add-user-modal .formactions .btn{
          height:40px !important;
          padding:0 18px !important;
          border-radius:10px !important;
          font-size:14px !important;
          font-weight:400 !important;
        }
        .um-add-user-modal .formactions .btn.primary{
          background:#092e53 !important;
          border-color:#092e53 !important;
          color:#fff !important;
        }
      `;
      document.head.appendChild(s);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
