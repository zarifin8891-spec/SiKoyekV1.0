const SK_URL='https://mmkusplegmittrlxqxby.supabase.co';
const SK_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
const sb=window.sb=window.sb||window.supabase.createClient(SK_URL,SK_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage}});
const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>Number(n||0).toFixed(2)+'%';
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function requireSession(){return sb.auth.getSession().then(({data,error})=>{if(error)throw error;if(!data.session){window.location.href='index.html';return null}return data.session})}
async function logout(){await sb.auth.signOut();window.location.href='index.html'}
function loadRBACNav(){if(document.getElementById('rbac-nav-v1-script'))return;const s=document.createElement('script');s.id='rbac-nav-v1-script';s.src='./rbac-nav-v1.js?v=2';s.defer=true;document.head.appendChild(s)}
function mountModule(title,subtitle,active){document.body.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand">SiKoyek <b>V1.0</b></div><nav class="nav"><a href="index.html" class="${active==='dashboard'?'active':''}">Dashboard</a><a href="workspace.html" class="${active==='workspace'?'active':''}">Workspace</a><a href="progress.html" class="${active==='progress'?'active':''}">Progress</a><a href="rap.html" class="${active==='rap'?'active':''}">RAP</a><a href="keuangan.html" class="${active==='keuangan'?'active':''}">Keuangan</a><a href="item-pekerjaan.html" class="${active==='items'?'active':''}">Item Pekerjaan</a></nav><div class="foot">Project Control • V1.0</div></aside><main class="content"><div class="top"><div><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div><button class="btn ghost" id="logoutBtn">Keluar</button></div><div id="module"></div></main></div>`;document.getElementById('logoutBtn').addEventListener('click',logout);loadRBACNav();return document.getElementById('module')}
window.SK={sb,money,pct,esc,requireSession,logout,mountModule};
