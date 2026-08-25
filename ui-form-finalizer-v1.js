(function(){
  const fallback=['Renovasi','Bangun Baru','Interior','Instalasi','Pemeliharaan','Lainnya'];
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state={busy:false,timer:null};

  async function categories(){
    try{
      const {data,error}=await sb.from('project_categories').select('name,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(!error&&Array.isArray(data)&&data.length)return data;
    }catch(_){ }
    return fallback.map((name,i)=>({name,is_active:true,sort_order:i+1}));
  }

  function modalBox(){
    const modal=document.getElementById('modal');
    const box=modal?.querySelector('.modalbox');
    if(!box)return null;
    const title=box.querySelector('.modalhead h3')?.textContent?.trim()?.toLowerCase()||'';
    if(!title.includes('tambah proyek baru'))return null;
    return box;
  }

  function wrapVisual(box){
    if(box.dataset.p7==='1')return;
    if(box.classList.contains('p6-form')||box.querySelector('.p6-body')){box.dataset.p7='1';return}
    const children=[...box.children];
    const body=document.createElement('div');body.className='p7-body';
    children.forEach(x=>body.appendChild(x));
    const side=document.createElement('aside');side.className='p7-side';side.innerHTML='<div class="p7-mark">PROJECT CONTROL</div><div class="p7-title">Tambah<br>proyek baru</div><div class="p7-desc">Isi data inti proyek secara rapi sebelum masuk ke tahap nilai, periode, dan konfirmasi.</div><div class="p7-hint">Pastikan kode proyek unik dan data dasar benar.</div>';
    box.innerHTML='';box.append(side,body);box.classList.add('p7-form');box.dataset.p7='1';
  }

  async function normalizeCategory(box){
    const body=box.querySelector('.p7-body')||box.querySelector('.p6-body')||box;
    const input=document.getElementById('f_cat');if(!input)return;
    const field=input.closest('.field');if(!field)return;
    field.querySelectorAll('.category-tools,.step1-category-tools').forEach(x=>x.remove());
    if(input.tagName!=='SELECT'){
      const s=document.createElement('select');s.id='f_cat';s.name='f_cat';s.className=input.className;s.value=input.value;input.replaceWith(s);
    }
    const select=document.getElementById('f_cat');
    const current=select.value;
    const data=await categories();
    const active=data.filter(x=>x.is_active!==false);
    select.innerHTML=active.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
    if(active.some(x=>x.name===current))select.value=current;else if(active[0])select.value=active[0].name;
    if(!field.querySelector('.p7-category-tools')){
      const tools=document.createElement('div');tools.className='p7-category-tools';
      tools.innerHTML='<span>Master kategori proyek</span><button type="button" class="btn ghost">⚙ Kelola Kategori</button>';
      tools.querySelector('button').addEventListener('click',()=>{
        if(typeof window.p6OpenCategoryMaster==='function')window.p6OpenCategoryMaster();
        else if(typeof window.openCategoryMaster==='function')window.openCategoryMaster();
      });
      field.appendChild(tools);
    }
    body.querySelectorAll('.formactions .btn').forEach(b=>{b.style.textAlign='center';b.style.justifyContent='center';b.style.alignItems='center'});
  }

  function normalizeHeader(box){
    const body=box.querySelector('.p7-body');if(!body)return;
    const head=body.querySelector('.modalhead');if(!head)return;
    head.classList.add('p7-modalhead');
    const h3=head.querySelector('h3');if(h3)h3.style.display='none';
    const close=head.querySelector('button');if(close){close.style.marginLeft='auto';close.style.display='inline-flex';close.style.alignItems='center';close.style.justifyContent='center';close.style.textAlign='center'}
  }

  function normalizeActions(box){
    const step=Number(window.__siKoyekProjectStep||1);
    const next=document.getElementById('uiNext'),back=document.getElementById('uiBack'),save=document.getElementById('uiSaveProject');
    if(next)next.style.display=step<3?'inline-flex':'none';
    if(back)back.style.display=step>1?'inline-flex':'none';
    if(save)save.style.display=step===3?'inline-flex':'none';
  }

  async function apply(){
    const box=modalBox();if(!box||state.busy)return;
    state.busy=true;
    try{wrapVisual(box);normalizeHeader(box);normalizeActions(box);await normalizeCategory(box)}finally{state.busy=false}
  }

  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(apply,60)}
  const boot=()=>{const root=document.getElementById('app')||document.body;new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
