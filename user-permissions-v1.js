(function(){
  if(window.__SIKOYEK_USER_PERMISSIONS_V1__) return;
  window.__SIKOYEK_USER_PERMISSIONS_V1__=true;
  const q=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let permissions=[],rolePermissions=[],roles=[],selectedRole='';

  const css=`
  .ump-card .um-toolbar{align-items:center}
  .ump-actions{display:flex;gap:7px;align-items:center}
  .ump-save{height:30px;padding:0 13px;font-size:12px;font-weight:500}
  .ump-save[disabled]{opacity:.55;cursor:not-allowed}
  .ump-dirty{font-size:11px;color:#b26a00}
  .ump-check{width:17px;height:17px;accent-color:#245cff;cursor:pointer}
  .ump-module{font-weight:600;text-transform:capitalize}
  .ump-perm td{height:38px}
  `;
  function inject(){if(q('ump-styles'))return;const s=document.createElement('style');s.id='ump-styles';s.textContent=css;document.head.appendChild(s)}
  async function loadData(){
    const client=window.sb;
    if(!client?.from)return;
    const [{data:r,error:re},{data:p,error:pe},{data:rp,error:rpe}]=await Promise.all([
      client.from('roles').select('id,name,description,is_active').eq('is_active',true).order('name'),
      client.from('permissions').select('id,module,action,name,description').order('module').order('action'),
      client.from('role_permissions').select('role_id,permission_id')
    ]);
    const err=[re,pe,rpe].find(Boolean);
    if(err){toast(err.message);return}
    roles=r||[];permissions=p||[];rolePermissions=rp||[];
    if(!selectedRole || !roles.some(r=>r.id===selectedRole))selectedRole=roles[0]?.id||'';
    renderPermissionCard();
  }
  function grouped(){
    const out=[];
    const seen=new Set();
    permissions.forEach(p=>{if(seen.has(p.module))return;seen.add(p.module);out.push(p.module)});
    return out;
  }
  function checked(permissionId){return rolePermissions.some(x=>x.role_id===selectedRole&&x.permission_id===permissionId)}
  function renderPermissionCard(){
    inject();
    const cards=[...document.querySelectorAll('.um-grid .um-card')];
    const card=cards[1];
    if(!card)return;
    card.classList.add('ump-card');
    const role=roles.find(r=>r.id===selectedRole);
    const modules=grouped();
    const rows=modules.map(module=>{
      const cells=['VIEW','ADD','EDIT','DELETE'].map(action=>{
        const p=permissions.find(x=>x.module===module&&x.action===action);
        if(!p)return '<td>—</td>';
        return `<td><input class="ump-check" type="checkbox" data-permission-id="${p.id}" ${checked(p.id)?'checked':''}></td>`;
      }).join('');
      return `<tr><td class="ump-module">${esc(module.replace(/_/g,' '))}</td>${cells}</tr>`;
    }).join('')||'<tr><td colspan="5" class="um-empty">Belum ada permission.</td></tr>';
    card.innerHTML=`<div class="um-toolbar"><h2>Hak Akses <span style="font-weight:500;color:var(--muted)">${esc(role?.name||'')}</span></h2><div class="ump-actions"><span id="ump-dirty" class="ump-dirty" hidden>Belum disimpan</span><button id="ump-save" class="btn primary ump-save">Simpan Hak Akses</button></div></div><div class="um-perm-wrap"><table class="um-perm ump-perm"><thead><tr><th>Modul</th><th>View</th><th>Add</th><th>Edit</th><th>Delete</th></tr></thead><tbody>${rows}</tbody></table></div><div class="um-note">Centang hak akses yang diberikan kepada role terpilih, lalu simpan.</div>`;
    card.querySelectorAll('.ump-check').forEach(el=>el.addEventListener('change',markDirty));
    q('ump-save')?.addEventListener('click',savePermissions);
  }
  function markDirty(){const d=q('ump-dirty'),b=q('ump-save');if(d)d.hidden=false;if(b)b.disabled=false}
  async function savePermissions(){
    const b=q('ump-save');if(!b||!selectedRole)return;
    const permission_ids=[...document.querySelectorAll('.ump-check:checked')].map(x=>x.dataset.permissionId);
    b.disabled=true;b.textContent='Menyimpan...';
    try{
      const {data,error}=await window.sb.functions.invoke('user-management',{body:{action:'update_permissions',role_id:selectedRole,permission_ids}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      toast('Hak akses berhasil disimpan');
      await loadData();
    }catch(e){toast(e.message||'Gagal menyimpan hak akses');b.disabled=false;b.textContent='Simpan Hak Akses'}
  }
  function hookRoleSelector(){
    if(typeof window.umSelectRole!=='function' || window.__SIKOYEK_PERM_ROLE_HOOK__)return;
    const original=window.umSelectRole;
    window.umSelectRole=function(id){selectedRole=id;original(id);setTimeout(loadData,0)};
    window.__SIKOYEK_PERM_ROLE_HOOK__=true;
  }
  function boot(){
    hookRoleSelector();
    loadData();
    setTimeout(()=>{hookRoleSelector();loadData()},250);
    setTimeout(()=>{hookRoleSelector();loadData()},900);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
