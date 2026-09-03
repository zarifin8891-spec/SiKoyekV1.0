const SK_URL='https://mmkusplegmittrlxqxby.supabase.co';
const SK_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
const sb=window.sb=window.sb||window.supabase.createClient(SK_URL,SK_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage}});
const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>Number(n||0).toFixed(2)+'%';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const SK_RBAC_ALIASES={dashboard:['dashboard'],workspace:['workspace'],progress:['progress'],rap:['rap','rap_proyek'],keuangan:['keuangan','finance'],items:['item_pekerjaan','items','work_items'],users:['users','user_management','management_user']};
const SK_RBAC_NORM=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
function SK_RBAC_MATCH(key,module){const n=SK_RBAC_NORM(module);return(SK_RBAC_ALIASES[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n))}
function SK_RBAC_PAGE(){const p=(location.pathname.split('/').pop()||'index.html').toLowerCase();if(p==='index.html'||p==='')return'dashboard';if(p==='workspace.html')return'workspace';if(p==='progress.html')return'progress';if(p==='rap.html')return'rap';if(p==='keuangan.html')return'keuangan';if(p==='item-pekerjaan.html')return'items';return''}
async function SK_RBAC_CHECK(){
  const page=SK_RBAC_PAGE();
  if(!page)return true;
  try{
    const {data:{user},error:ue}=await sb.auth.getUser();
    if(ue||!user)return false;
    const {data:profile,error:pe}=await sb.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
    if(pe||!profile?.is_active)return false;
    const role=SK_RBAC_NORM(profile?.roles?.name);
    if(role==='admin')return true;
    const {data:rps,error:re}=await sb.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
    if(re)return false;
    const ids=(rps||[]).map(x=>x.permission_id);
    if(!ids.length)return false;
    const {data:perms,error:qe}=await sb.from('permissions').select('id,module,action').in('id',ids);
    if(qe)return false;
    return (perms||[]).some(p=>String(p.action).toUpperCase()==='VIEW'&&SK_RBAC_MATCH(page,p.module));
  }catch(e){console.warn('RBAC PAGE:',e);return false}
}
async function requireSession(){
  const {data,error}=await sb.auth.getSession();
  if(error)throw error;
  if(!data.session){window.location.href='index.html';return null}
  const allowed=await SK_RBAC_CHECK();
  if(!allowed){
    if(SK_RBAC_PAGE()!=='dashboard')window.location.replace('index.html');
    return null;
  }
  return data.session;
}
async function logout(){await sb.auth.signOut();window.location.href='index.html'}
function loadRBACNav(){if(document.getElementById('rbac-nav-v1-script')){window.applyRBACNav?.();return}const s=document.createElement('script');s.id='rbac-nav-v1-script';s.src='./rbac-nav-v1.js?v=3';s.defer=true;s.onload=()=>window.applyRBACNav?.();document.head.appendChild(s)}
function mountModule(title,subtitle,active){document.body.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand">SiKoyek <b>V1.0</b></div><nav class="nav"><a href="index.html" class="${active==='dashboard'?'active':''}">Dashboard</a><a href="workspace.html" class="${active==='workspace'?'active':''}">Workspace</a><a href="progress.html" class="${active==='progress'?'active':''}">Progress</a><a href="rap.html" class="${active==='rap'?'active':''}">RAP</a><a href="keuangan.html" class="${active==='keuangan'?'active':''}">Keuangan</a><a href="item-pekerjaan.html" class="${active==='items'?'active':''}">Item Pekerjaan</a></nav><div class="foot">Project Control • V1.0</div></aside><main class="content"><div class="top"><div><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div><button class="btn ghost" id="logoutBtn">Keluar</button></div><div id="module"></div></main></div>`;document.getElementById('logoutBtn').addEventListener('click',logout);loadRBACNav();return document.getElementById('module')}
window.SK={sb,money,pct,esc,requireSession,logout,mountModule};
