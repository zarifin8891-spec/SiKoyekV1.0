/* SiKoyek Auth Login Fix V1 — clear any existing local session before a new login. */
(function(){
  'use strict';
  if(window.__SIKOYEK_AUTH_LOGIN_FIX_V1__) return;
  window.__SIKOYEK_AUTH_LOGIN_FIX_V1__=true;

  function bind(){
    const btn=document.getElementById('loginBtn');
    const emailEl=document.getElementById('email');
    const passwordEl=document.getElementById('password');
    const errEl=document.getElementById('loginErr');
    if(!btn||!emailEl||!passwordEl||!errEl||btn.dataset.authFixBound==='1') return;

    const fresh=btn.cloneNode(true);
    btn.replaceWith(fresh);
    fresh.dataset.authFixBound='1';

    fresh.addEventListener('click',async()=>{
      const email=emailEl.value.trim();
      const password=passwordEl.value;
      if(!email||!password){errEl.textContent='Email dan password wajib diisi.';return}
      fresh.disabled=true;
      fresh.textContent='Memproses...';
      errEl.textContent='';
      errEl.style.color='';
      try{
        await window.sb.auth.signOut({scope:'local'});
        const {data,error}=await window.sb.auth.signInWithPassword({email,password});
        if(error) throw error;
        if(!data?.user) throw new Error('Login gagal: user tidak ditemukan.');
        await window.loadSummary?.();
        window.renderApp?.();
      }catch(error){
        errEl.textContent=error?.message||'Login gagal.';
        fresh.disabled=false;
        fresh.textContent='Masuk';
      }
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,120));
  else setTimeout(bind,120);
})();
