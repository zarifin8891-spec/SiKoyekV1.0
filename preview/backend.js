/* Isolated browser simulation, shipped only by --preview. Never contacts Supabase. */
(function(global){
  'use strict';
  const clone=value=>structuredClone(value);
  const error=message=>({data:null,error:{message},count:null});
  let state,config,storeKey,sessionKey;const listeners=new Set();
  function init(){
    if(state)return;
    config=global.SiKoyekConfig;
    if(config?.backend!=='preview'||!config.url.endsWith('.invalid'))throw new Error('Adapter preview hanya boleh memakai lingkungan uji');
    storeKey='sikoyek-preview-data-v1-'+config.id;sessionKey=config.storageKey;
    try{state=JSON.parse(localStorage.getItem(storeKey)||'null')}catch(_){ }
    if(!state?.tables){state={tables:global.SiKoyekPreviewSeed(),passwords:{}};save()}
    if(!sessionStorage.getItem(sessionKey)&&sessionStorage.getItem('sikoyek-preview-role-'+config.id)&&!sessionStorage.getItem(sessionKey+'-out')){
      const role=sessionStorage.getItem('sikoyek-preview-role-'+config.id),profile=state.tables.profiles.find(p=>p.role_id===role&&p.is_active);
      if(profile)setSession(profile);
    }
  }
  function save(){localStorage.setItem(storeKey,JSON.stringify(state))}
  function session(){init();try{return JSON.parse(sessionStorage.getItem(sessionKey)||'null')}catch(_){return null}}
  function setSession(profile){
    const next={user:{id:profile.id,email:profile.email,user_metadata:{full_name:profile.full_name}},access_token:'preview-token-'+profile.id};
    sessionStorage.removeItem(sessionKey+'-out');sessionStorage.setItem(sessionKey,JSON.stringify(next));
    for(const cb of listeners)cb('SIGNED_IN',clone(next));return next;
  }
  function profile(){const current=session();return state.tables.profiles.find(p=>p.id===current?.user.id&&p.is_active)}
  function can(table,action){
    const who=profile();if(!who)return false;if(who.role_id==='admin')return true;
    const module=({projects:'PROJECTS',project_work_items:'PROJECTS',progress_records:'PROGRESS',project_rap:'RAP',financial_transactions:'KEUANGAN',project_categories:'MASTER_DATA',project_managers:'MASTER_DATA',transaction_categories:'MASTER_DATA',payment_methods:'MASTER_DATA'})[table];
    if(!module)return action==='VIEW';
    const p=state.tables.permissions.find(p=>p.module===module&&p.action===action);
    return state.tables.role_permissions.some(r=>r.role_id===who.role_id&&r.permission_id===p?.id);
  }
  function summaries(){
    return state.tables.projects.map(project=>{
      const original=state.tables.project_summary.find(p=>p.project_id===project.id)||{};
      const fin=state.tables.financial_transactions.filter(t=>t.project_id===project.id),rap=state.tables.project_rap.find(r=>r.project_id===project.id)||{};
      const sum=kind=>fin.filter(t=>t.transaction_type===kind).reduce((n,t)=>n+Number(t.amount||0),0);
      const total_rap=['material','labor','equipment','operational','subcontract','other'].reduce((n,key)=>n+Number(rap[key]||0),0),cash_in=sum('MASUK'),cash_out=sum('KELUAR');
      const metrics={project_progress:Number(project.project_progress||0),cost_ratio:project.contract_value?cash_out/Number(project.contract_value)*100:0,rap_consumption:total_rap?cash_out/total_rap*100:0};
      const health=global.SiKoyekHealthEngine?.evaluate(metrics).status||original.health_status||'SEHAT';
      return {...project,...metrics,project_id:project.id,progress_total:metrics.project_progress,total_rap,total_realization:cash_out,cash_in,cash_out,net_cashflow:cash_in-cash_out,estimated_profit:Number(project.contract_value||0)-total_rap,estimated_margin:project.contract_value?(Number(project.contract_value)-total_rap)/Number(project.contract_value)*100:0,health_status:health==='PERLU PENGAWASAN'?'WASPADA':health};
    });
  }
  function syncProgress(id){
    const project=state.tables.projects.find(p=>p.id===id);if(!project)return;
    project.project_progress=state.tables.project_work_items.filter(i=>i.project_id===id).reduce((n,item)=>{
      const total=state.tables.progress_records.filter(r=>r.work_item_id===item.id).reduce((sum,row)=>sum+Number(row.progress_percentage||0),0);
      return n+Number(item.weight||0)*Math.min(1,total)*100;
    },0);
  }
  function makeBuilder(table){
    const spec={op:'select',filters:[],orders:[],head:false,one:false,maybe:false,limit:null,range:null};let pending;
    const matches=row=>spec.filters.every(([op,k,v])=>op==='eq'?row[k]===v:op==='neq'?row[k]!==v:op==='in'?v.includes(row[k]):op==='gte'?row[k]>=v:op==='lte'?row[k]<=v:op==='is'?row[k]===v:false);
    const builder={
      select(cols='*',options={}){spec.head=Boolean(options.head);return builder},
      eq(k,v){spec.filters.push(['eq',k,v]);return builder},neq(k,v){spec.filters.push(['neq',k,v]);return builder},in(k,v){spec.filters.push(['in',k,v]);return builder},gte(k,v){spec.filters.push(['gte',k,v]);return builder},lte(k,v){spec.filters.push(['lte',k,v]);return builder},is(k,v){spec.filters.push(['is',k,v]);return builder},
      order(k,options={}){spec.orders.push([k,options.ascending!==false]);return builder},limit(n){spec.limit=n;return builder},range(start,end){spec.range=[start,end];return builder},
      single(){spec.one=true;return builder},maybeSingle(){spec.one=true;spec.maybe=true;return builder},
      insert(value){spec.op='insert';spec.value=clone(value);return builder},update(value){spec.op='update';spec.value=clone(value);return builder},upsert(value,options={}){spec.op='upsert';spec.value=clone(value);spec.conflict=options.onConflict||'id';return builder},delete(){spec.op='delete';return builder},
      then(resolve,reject){if(!pending)pending=Promise.resolve().then(execute);return pending.then(resolve,reject)}
    };
    function execute(){
      init();if(!session())return error('Silakan login dengan akun preview');
      const action=({select:'VIEW',insert:'ADD',upsert:'EDIT',update:'EDIT',delete:'DELETE'})[spec.op];
      if(!can(table,action))return error('Aksi tidak diizinkan untuk role preview ini');
      if(!state.tables[table])return error('Tabel tidak tersedia pada preview: '+table);
      let source=table==='project_summary'?summaries():state.tables[table],rows=source.filter(matches);
      if(spec.op!=='select'){
        if(table==='project_summary')return error('Ringkasan hanya boleh dibaca');
        if(['insert','upsert'].includes(spec.op)){
          const input=Array.isArray(spec.value)?spec.value:[spec.value];
          if(table==='projects'&&input.some(value=>source.some(p=>p.project_code===value.project_code&&p.id!==value.id)))return {data:null,error:{code:'23505',message:'Kode proyek sudah digunakan'},count:null};
          rows=input.map(value=>{
            const existing=spec.op==='upsert'?source.find(r=>spec.conflict.split(',').every(k=>r[k]===value[k])):null;
            if(existing){Object.assign(existing,value);return existing}
            const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),is_active:true,...value};if(table==='projects')row.project_progress=0;source.push(row);return row;
          });
        }else if(spec.op==='update'){
          if(table==='projects'&&spec.value.project_code&&source.some(p=>!matches(p)&&p.project_code===spec.value.project_code))return {data:null,error:{code:'23505',message:'Kode proyek sudah digunakan'},count:null};
          rows.forEach(row=>Object.assign(row,spec.value));
        }else{
          state.tables[table]=source.filter(row=>!matches(row));
          if(table==='projects')for(const name of ['project_summary','project_work_items','project_rap','progress_records','financial_transactions'])state.tables[name]=state.tables[name].filter(r=>!rows.some(p=>p.id===(r.project_id||r.id)));
        }
        if(table==='progress_records'||table==='project_work_items')for(const id of new Set(rows.map(r=>r.project_id)))syncProgress(id);
        save();
      }
      if(table==='profiles')rows=rows.map(p=>({...p,roles:state.tables.roles.find(r=>r.id===p.role_id)||null}));
      for(const [key,asc] of [...spec.orders].reverse())rows.sort((a,b)=>(a[key]>b[key]?1:a[key]<b[key]?-1:0)*(asc?1:-1));
      const count=rows.length;if(spec.range)rows=rows.slice(spec.range[0],spec.range[1]+1);if(spec.limit!==null)rows=rows.slice(0,spec.limit);
      if(spec.one&&rows.length!==1&&!(spec.maybe&&rows.length===0))return error('Data tidak ditemukan atau tidak tunggal');
      return {data:spec.head?null:clone(spec.one?(rows[0]||null):rows),error:null,count};
    }
    return builder;
  }
  async function invoke(name,{body}={}){
    init();if(name!=='user-management'||profile()?.role_id!=='admin')return error('Aksi user preview tidak diizinkan');
    const tables=state.tables;
    if(body.action==='update_permissions'){
      tables.role_permissions=tables.role_permissions.filter(r=>r.role_id!==body.role_id).concat(body.permission_ids.map(permission_id=>({role_id:body.role_id,permission_id})));
    }else if(body.action==='create'){
      if(tables.profiles.some(p=>p.email===body.email))return error('Email sudah digunakan');
      const id=crypto.randomUUID();tables.profiles.push({id,email:body.email,full_name:body.full_name,role_id:body.role_id,is_active:true,created_at:new Date().toISOString()});state.passwords[id]=body.password;
    }else if(body.action==='update'){
      const p=tables.profiles.find(p=>p.id===body.id);if(!p)return error('User tidak ditemukan');Object.assign(p,{full_name:body.full_name,role_id:body.role_id,is_active:body.is_active});
    }else if(body.action==='delete'){
      if(body.id===session()?.user.id)return error('Akun preview yang sedang dipakai tidak boleh dihapus');tables.profiles=tables.profiles.filter(p=>p.id!==body.id);delete state.passwords[body.id];
    }else return error('Aksi belum tersedia di preview');
    save();return {data:{success:true},error:null};
  }
  global.supabase={createClient(url,key){
    init();if(url!==config.url||key!=='preview-only')throw new Error('Preview menolak konfigurasi produksi');
    return {from:makeBuilder,functions:{invoke},auth:{
      async getSession(){return {data:{session:session()},error:null}},async getUser(){return {data:{user:session()?.user||null},error:null}},
      onAuthStateChange(callback){listeners.add(callback);return {data:{subscription:{unsubscribe(){listeners.delete(callback)}}}}},
      async signInWithPassword({email,password}){init();const p=state.tables.profiles.find(p=>p.email===email&&p.is_active);if(!p||password!==(state.passwords[p.id]||'Preview123!'))return error('Email atau password preview tidak sesuai');return {data:{user:setSession(p).user,session:session()},error:null}},
      async signOut(){sessionStorage.removeItem(sessionKey);sessionStorage.setItem(sessionKey+'-out','1');for(const cb of listeners)cb('SIGNED_OUT',null);return {error:null}},
      async resetPasswordForEmail(){return error('Preview tidak mengirim email. Akun contoh memakai Preview123!')}
    }};
  }};
})(window);
