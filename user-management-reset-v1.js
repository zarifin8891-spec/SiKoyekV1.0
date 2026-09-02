(function(){
  if(window.__SIKOYEK_USER_RESET_V1__) return;
  window.__SIKOYEK_USER_RESET_V1__=true;
  const q=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function addStyles(){
    if(q('um-reset-styles')) return;
    const s=document.createElement('style');s.id='um-reset-styles';
    s.textContent=`
      .um-edit-user-modal .modalbox,.um-reset-password-modal .modalbox{width:min(430px,calc(100vw - 36px)) !important;padding:0 !important;border-radius:18px !important;overflow:hidden !important}
      .um-edit-user-modal .modalhead,.um-reset-password-modal .modalhead{position:relative !important;min-height:100px !important;margin:0 !important;padding:22px 22px 30px !important;background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%) !important;border:0 !important;align-items:flex-start !important}
      .um-edit-user-modal .modalhead h3,.um-reset-password-modal .modalhead h3{margin:8px 0 0 !important;color:#fff !important;font-size:22px !important;line-height:1.1 !important;font-weight:700 !important}
      .um-edit-user-modal .modalhead::after{content:'Perbarui data inti user dan status akun.';position:absolute;left:22px;bottom:10px;color:#eef7fb;font-size:11px;line-height:1.2;font-weight:400;pointer-events:none}
      .um-reset-password-modal .modalhead::after{content:'Buat password baru untuk user ini.';position:absolute;left:22px;bottom:10px;color:#eef7fb;font-size:11px;line-height:1.2;font-weight:400;pointer-events:none}
      .um-edit-user-modal .modalhead .btn,.um-reset-password-modal .modalhead .btn{height:42px !important;min-width:72px !important;padding:0 16px !important;margin:0 !important;border-radius:10px !important;background:#fff !important;border:1px solid #fff !important;color:#172033 !important;font-size:14px !important;font-weight:400 !important}
      .um-edit-user-modal .um-add-form,.um-reset-password-modal .um-add-form{padding:16px 22px 18px !important;gap:9px !important}
      .um-edit-user-modal .field label,.um-reset-password-modal .field label{font-size:12px !important;margin-bottom:4px !important;font-weight:600 !important}
      .um-edit-user-modal .field input,.um-edit-user-modal .field select,.um-reset-password-modal .field input{height:34px !important;padding:6px 11px !important;font-size:14px !important;border-radius:8px !important}
      .um-edit-user-modal .formactions,.um-reset-password-modal .formactions{margin:8px -22px -18px !important;padding:14px 22px !important;border-top:1px solid #eef1f5 !important;background:#fff !important}
      .um-edit-user-modal .formactions .btn,.um-reset-password-modal .formactions .btn{height:30px !important;padding:0 15px !important;border-radius:9px !important;font-size:13px !important;font-weight:400 !important}
      .um-reset-password-modal .um-pass-note{font-size:11px;color:var(--muted);margin:5px 0 0}
      .um-reset-password-modal .um-password-wrap{position:relative}.um-reset-password-modal .um-password-wrap input{width:100%;padding-right:38px !important}.um-reset-password-modal .um-password-toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;padding:3px;cursor:pointer;color:#64748b;line-height:1}.um-reset-password-modal .um-password-toggle svg{width:17px;height:17px;display:block}
      .um-reset-btn{margin-right:auto !important;background:#fff !important;border:1px solid #d8dee8 !important;color:#244a78 !important}
    `;document.head.appendChild(s);
  }
  function eye(id,btn){const input=q(id);if(!input)return;const visible=input.type==='text';input.type=visible?'password':'text';btn.setAttribute('aria-label',visible?'Tampilkan password':'Sembunyikan password');btn.innerHTML=visible?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"/><path d="M9.9 5.2A11.8 11.8 0 0 1 12 5c6.5 0 10 7 10 7s-3.5 7-10 7"/></svg>'}
  window.umResetTogglePassword=eye;
  function install(){
    if(typeof window.umEdit!=='function') return setTimeout(install,100);
    if(window.__SIKOYEK_USER_RESET_WRAPPED__) return;
    const original=window.umEdit;
    window.umEdit=function(id){
      original(id);addStyles();
      setTimeout(function(){
        const modal=document.querySelector('.um-edit-user-modal');if(!modal||modal.dataset.resetReady)return;
        modal.dataset.resetReady='1';
        const actions=modal.querySelector('.formactions');if(!actions)return;
        const btn=document.createElement('button');btn.type='button';btn.className='btn um-reset-btn';btn.textContent='Reset Password';btn.onclick=function(){window.umResetPassword(id)};
        actions.insertBefore(btn,actions.firstChild);
      },0);
    };
    window.__SIKOYEK_USER_RESET_WRAPPED__=true;
  }
  window.umResetPassword=function(id){
    document.querySelectorAll('.modal').forEach(m=>m.remove());addStyles();
    const wrap=document.createElement('div');wrap.className='modal um-reset-password-modal';
    wrap.innerHTML=`<div class="modalbox"><div class="modalhead"><h3>Reset Password</h3><button class="btn ghost" onclick="umCloseResetPassword()">Tutup</button></div><div class="um-add-form"><div class="field"><label>Password Baru *</label><div class="um-password-wrap"><input id="um_reset_password" type="password" placeholder="Minimal 8 karakter"><button type="button" class="um-password-toggle" aria-label="Tampilkan password" onclick="umResetTogglePassword('um_reset_password',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div><div class="um-pass-note">Minimal 8 karakter.</div></div><div class="field"><label>Konfirmasi Password *</label><div class="um-password-wrap"><input id="um_reset_password_confirm" type="password" placeholder="Ulangi password"><button type="button" class="um-password-toggle" aria-label="Tampilkan password" onclick="umResetTogglePassword('um_reset_password_confirm',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div></div><div class="formactions"><button class="btn ghost" onclick="umCloseResetPassword()">Batal</button><button class="btn primary" onclick="umSaveResetPassword('${esc(id)}')">Simpan</button></div></div></div>`;
    document.body.appendChild(wrap);wrap.addEventListener('click',ev=>{if(ev.target===wrap)wrap.remove()});
  };
  window.umCloseResetPassword=function(){const el=document.querySelector('.um-reset-password-modal');if(el)el.remove()};
  window.umSaveResetPassword=async function(id){const password=q('um_reset_password')?.value,password_confirm=q('um_reset_password_confirm')?.value;if(!password||!password_confirm){toast('Semua field wajib diisi');return}if(password.length<8){toast('Password minimal 8 karakter');return}if(password!==password_confirm){toast('Konfirmasi password tidak sama');return}try{const {data,error}=await sb.functions.invoke('user-management',{body:{action:'reset_password',id,password,password_confirm}});if(error)throw error;if(data?.error)throw new Error(data.error);umCloseResetPassword();toast('Password berhasil direset')}catch(e){toast(e.message||'Gagal mereset password')}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
