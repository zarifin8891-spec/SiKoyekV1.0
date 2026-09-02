/* SiKoyek Auth Login Fix V2 — use the actual Supabase client available on the login page. */
(function(){
  'use strict';
  if(window.__SIKOYEK_AUTH_LOGIN_FIX_V2__) return;
  window.__SIKOYEK_AUTH_LOGIN_FIX_V2__=true;

  function getClient(){
    if(window.sb?.auth) return window.sb;
    if(!window.supabase?.createClient) return null;
    if(!window.__siKoyekAuthClient){
      window.__siKoyekAuthClient=window.supabase.createClient(
        'https://mmkusplegmittrlxqxby.supabase.co',
        'sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf',
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
      );
    }
    return window.__siKoyekAuthClient;
  }

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
      const client=getClient();
      if(!client?.auth){errEl.textContent='Koneksi autentikasi belum siap. Silakan muat ulang halaman.';return}
      fresh.disabled=true;
      fresh.textContent='Memproses...';
      errEl.textContent='';
      errEl.style.color='';
      try{
        await client.auth.signOut({scope:'local'});
        const {data,error}=await client.auth.signInWithPassword({email,password});
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
