const SK_URL='https://mmkusplegmittrlxqxby.supabase.co';
const SK_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
/* SiKoyek V1.0 — all pages use the same tab-scoped Supabase auth session. */
const sb=window.sb=window.sb||window.supabase.createClient(SK_URL,SK_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage}});
const moneyFormat=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const money=n=>['pelaksana','marketing'].includes(String(window.__SIKOYEK_FINANCIAL_VISIBILITY_ROLE__||'').toLowerCase())?'Rp ••••••••':moneyFormat(n);
const pct=n=>Number(n||0).toFixed(2)+'%';
const esc=s=>String(s??'').replace(/[&<>\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[c]));
function isFinancialMaskedRole(){return ['pelaksana','marketing'].includes(String(window.__SIKOYEK_FINANCIAL_VISIBILITY_ROLE__||'').toLowerCase())}
function maskFinancialDom(){
  if(!isFinancialMaskedRole())return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const p=node.parentElement;
    if(!p||p.closest('script,style,input,textarea,select,option'))return NodeFilter.FILTER_REJECT;
    return /(?:Rp\\.?\\s*[-+]?\\d|Rp\\.?\\s*[•*]+)/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{node.nodeValue=(node.nodeValue||'').replace(/Rp\\.?\\s*[-+]?\\d[\\d.,]*/gi,'Rp ••••••••')});
}
function installFinancialDomMask(){
  if(window.__SIKOYEK_FINANCIAL_DOM_MASK__)return;
  window.__SIKOYEK_FINANCIAL_DOM_MASK__=true;
  const run=()=>{if(window.__SIKOYEK_FINANCIAL_VISIBILITY_ROLE__)maskFinancialDom()};
  const obs=new MutationObserver(()=>{clearTimeout(window.__sikoyekFinancialMaskTimer);window.__sikoyekFinancialMaskTimer=setTimeout(run,60)});
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  run();
}
async function requireSession(){const {data,error}=await sb.auth.getSession();if(error)throw error;if(!data.session){window.location.href='index.html';return null}window.__SIKOYEK_FINANCIAL_VISIBILITY_ROLE__='';try{const {data:profile}=await sb.from('profiles').select('is_active,roles(name)').eq('id',data.session.user.id).maybeSingle();if(profile?.is_active===false){await sb.auth.signOut({scope:'local'});window.location.href='index.html';return null}window.__SIKOYEK_FINANCIAL_VISIBILITY_ROLE__=String(profile?.roles?.name||'').trim().toLowerCase()}catch(e){console.warn('SiKoyek profile visibility:',e)}installFinancialDomMask();maskFinancialDom();return data.session}
async function logout(){await sb.auth.signOut();window.location.href='index.html'}
function loadRBACNav(){if(document.getElementById('rbac-nav-v1-script')){window.applyRBACNav?.();return}const s=document.createElement('script');s.id='rbac-nav-v1-script';s.src='./rbac-nav-v1.js?v=4';s.defer=true;s.onload=()=>window.applyRBACNav?.();document.head.appendChild(s)}
function loadRBACUiLock(){if(document.getElementById('rbac-ui-loader-v1-script')){window.applyRBACUiLock?.();return}const s=document.createElement('script');s.id='rbac-ui-loader-v1-script';s.src='./rbac-ui-loader-v1.js?v=3';s.defer=true;s.onload=()=>window.applyRBACUiLock?.();document.head.appendChild(s)}
function mountModule(title,subtitle,active){document.body.innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand">SiKoyek <b>V1.0</b></div><nav class="nav"><a href="index.html" class="${active==='dashboard'?'active':''}">Dashboard</a><a href="workspace.html" class="${active==='workspace'?'active':''}">Workspace</a><a href="progress.html" class="${active==='progress'?'active':''}">Progress</a><a href="rap.html" class="${active==='rap'?'active':''}">RAP</a><a href="keuangan.html" class="${active==='keuangan'?'active':''}">Keuangan</a><a href="item-pekerjaan.html" class="${active==='items'?'active':''}">Item Pekerjaan</a></nav><div class="foot">Project Control • V1.0</div></aside><main class="content"><div class="top"><div><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div><button class="btn ghost" id="logoutBtn">Keluar</button></div><div id="module"></div></main></div>`;document.getElementById('logoutBtn').addEventListener('click',logout);loadRBACNav();loadRBACUiLock();maskFinancialDom();return document.getElementById('module')}
window.SK={sb,money,moneyFormat,pct,esc,requireSession,logout,mountModule};
setTimeout(loadRBACUiLock,0);
