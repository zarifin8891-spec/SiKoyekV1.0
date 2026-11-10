/* Backend seam: the common UI receives a client with the existing SDK contract.
 * Only Cloud is implemented; a future LAN adapter must satisfy this same contract.
 */
(function(global){
  'use strict';
  const clients=new Map();
  let factory=(url,key,options)=>global.supabase.createClient(url,key,options);
  function registerBackend(next){if(clients.size)throw new Error('Backend already initialized');factory=next}
  function wrapClient(raw, multiTenant=false){
    const flights=new Map();let generation=0;
    const invalidate=()=>{generation++;flights.clear()};
    raw.auth.onAuthStateChange?.(invalidate);
    let company=null;
    let activeToken=null;
    let activeUser=null;
    const companyChecks=new Map();
    const companyError=()=>new Error('Akun belum terhubung ke perusahaan aktif atau akses gagal diverifikasi.');

    if(multiTenant)raw.auth.onAuthStateChange?.((_event,session)=>{
      const token=session?.access_token||null;
      activeToken=token;
      const user=session?.user?.id||null;
      if(user!==activeUser||!token)company=null;
      activeUser=user;
    });

    async function verifyCompany(session){
      const token=session?.access_token;
      if(!token)return false;
      activeToken=token;
      const user=session.user?.id||null;
      if(user!==activeUser)company=null;
      activeUser=user;
      let check=companyChecks.get(token);
      if(!check){
        check=(async()=>{
          try{
            const {data,error}=await raw.rpc('sikoyek_current_company');
            if(activeToken!==token)return false;
            company=!error&&typeof data?.id==='string'&&data.id&&typeof data.name==='string'&&data.name
              ? Object.freeze({id:data.id,name:data.name})
              : null;
            return company!==null;
          }catch(_){
            if(activeToken===token)company=null;
            return false;
          }
        })();
        companyChecks.set(token,check);
        check.finally(()=>companyChecks.delete(token));
      }
      return check;
    }

    const auth=multiTenant?new Proxy(raw.auth,{get(target,name){
      if(name==='getSession')return async()=>{
        const result=await target.getSession();
        if(!result.data?.session||result.error){company=null;return result;}
        if(await verifyCompany(result.data.session))return result;
        return {data:{session:null},error:null};
      };
      if(name==='signInWithPassword')return async credentials=>{
        const result=await target.signInWithPassword(credentials);
        if(result.error)return result;
        if(await verifyCompany(result.data?.session))return result;
        if(activeToken===result.data?.session?.access_token)await target.signOut({scope:'local'});
        return {data:{user:null,session:null},error:companyError()};
      };
      const value=target[name];
      return typeof value==='function'?value.bind(target):value;
    }}):raw.auth;
    function query(target,table,operations=[],write=false){
      let isolated=false,executed;
      const proxy=new Proxy({}, {get(_,name){
        if(name==='then')return (resolve,reject)=>{
          if(!executed)executed=(async()=>{
            if(write){invalidate();try{return await target}finally{invalidate()}}
            if(isolated)return await target;
            const epoch=generation;
            const session=await raw.auth.getSession();
            if(session.error) return await target;
            const key=JSON.stringify([epoch,session.data?.session?.user?.id,session.data?.session?.access_token,table,operations]);
            let task=flights.get(key);
            if(!task){task=Promise.resolve(target);flights.set(key,task);task.finally(()=>{if(flights.get(key)===task)flights.delete(key)}).catch(()=>{})}
            const result=await task;
            return structuredClone(result);
          })();
          return executed.then(resolve,reject);
        };
        if(name==='catch')return reject=>proxy.then(undefined,reject);
        if(name==='finally')return callback=>Promise.resolve(proxy).finally(callback);
        const value=target[name];
        if(typeof value!=='function')return value;
        return (...args)=>{
          if(['insert','update','upsert','delete'].includes(name))write=true;
          if(['abortSignal','setHeader'].includes(name))isolated=true;
          operations.push([name,args]);
          const next=value.apply(target,args);
          if(next&&typeof next.then==='function'){target=next;return proxy}
          return next;
        };
      }});
      return proxy;
    }
    return new Proxy(raw,{get(target,name){if(name==='auth')return auth;if(name==='company')return company;if(name==='from')return table=>query(raw.from(table),table);
      if(name==='functions')return new Proxy(target.functions,{get(f,key){if(key==='invoke')return async(...args)=>{if(multiTenant)return {data:null,error:new Error('Fungsi administrasi belum tersedia di staging bersama.')};invalidate();try{return await f.invoke(...args)}finally{invalidate()}};return f[key]}});
      if(name==='rpc')return (...args)=>query(target.rpc(...args),'rpc:'+args[0],[['rpc',args]],true);if(name==='invalidateReads')return invalidate;const value=target[name];return typeof value==='function'?value.bind(target):value}});
  }
  function getClient(url,key,options={}){
    if(url===undefined&&key===undefined){
      const config=global.SiKoyekConfig;
      if(!config)throw new Error('Konfigurasi SiKoyek belum dimuat');
      url=config.url;key=config.key;
      options={...options,auth:{...options.auth,storageKey:config.storageKey}};
    }
    if(global.SiKoyekConfig&&(url!==global.SiKoyekConfig.url||key!==global.SiKoyekConfig.key))throw new Error('Client harus memakai backend lingkungan aktif');
    const id=url+'|'+key;
    if(!clients.has(id))clients.set(id,wrapClient(factory(url,key,{...options,auth:{...options.auth,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:global.sessionStorage}}),global.SiKoyekConfig?.multiTenant));
    return clients.get(id);
  }
  global.SiKoyekBackend={getClient,registerBackend,wrapClient};
})(window);
