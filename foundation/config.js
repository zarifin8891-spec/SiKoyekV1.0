/* Fail closed: no missing/invalid client configuration may fall back to MASTER. */
(function(global){
  'use strict';
  const input=global.SIKOYEK_CONFIG;
  if(!input||! /^[a-z][a-z0-9-]{0,63}$/.test(input.id||''))throw new Error('Konfigurasi lingkungan SiKoyek tidak valid');
  if(!['cloud','preview'].includes(input.backend))throw new Error('Backend SiKoyek tidak didukung');
  const url=new URL(input.url);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('URL backend SiKoyek tidak valid');
  if(input.backend==='cloud'&&!/^[a-z0-9]+\.supabase\.co$/.test(url.hostname))throw new Error('URL Cloud harus menunjuk project Supabase');
  if(input.backend==='preview'&&!url.hostname.endsWith('.invalid'))throw new Error('Preview tidak boleh menunjuk backend produksi');
  let allowedKey=typeof input.key==='string'&&input.key.startsWith('sb_publishable_');
  if(!allowedKey&&typeof input.key==='string'&&input.key.startsWith('eyJ')){
    try{const payload=JSON.parse(atob(input.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));allowedKey=payload.role==='anon'}catch(_){ }
  }
  if(input.backend==='preview')allowedKey=input.key==='preview-only';
  if(!allowedKey)throw new Error('Browser hanya boleh memakai publishable/anon key');
  const config=Object.freeze({id:input.id,name:String(input.name||input.id),backend:input.backend,url:url.origin,key:input.key,storageKey:input.backend==='preview'?'sikoyek-preview-session-'+input.id:'sb-'+url.hostname.split('.')[0]+'-auth-token'});
  Object.defineProperty(global,'SiKoyekConfig',{value:config,writable:false,configurable:false});
})(window);
