(function(){
  const fallback=['Renovasi','Bangun Baru','Interior','Instalasi','Pemeliharaan','Lainnya'];
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function getCategories(){
    try{
      const {data,error}=await sb.from('project_categories').select('name,is_active,sort_order').order('sort_order',{ascending:true}).order('name',{ascending:true});
      if(!error&&Array.isArray(data)&&data.length)return data;
    }catch(_){ }
    return fallback.map((name,i)=>({name,is_active:true,sort_order:i+1}));
  }

  async function syncCategory(){
    const input=document.getElementById('f_cat');
    if(!input)return;
    const field=input.closest('.field');
    if(!field)return;

    let select=input;
    if(input.tagName!=='SELECT'){
      select=document.createElement('select');
      select.id='f_cat';
      select.name='f_cat';
      select.className=input.className;
      select.value=input.value;
      input.replaceWith(select);
    }

    const current=select.value;
    const data=await getCategories();
    const active=data.filter(x=>x.is_active!==false);
    select.innerHTML=active.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
    if(active.some(x=>x.name===current))select.value=current;
    else if(active[0])select.value=active[0].name;

    // Remove helper rows inserted by older UI passes. Keep exactly one.
    field.querySelectorAll('.category-tools,[data-p6-cat-master]')
      .forEach(el=>{const row=el.closest('.category-tools')||el.closest('.field')===field?el:null;if(row&&row!==field)row.remove()});
    field.querySelectorAll('.step1-category-tools').forEach((el,i)=>{if(i>0)el.remove()});

    let tools=field.querySelector('.step1-category-tools');
    if(!tools){
      tools=document.createElement('div');
      tools.className='step1-category-tools';
      tools.innerHTML='<span>Master kategori proyek</span><button type="button" class="btn ghost">⚙ Kelola Kategori</button>';
      tools.querySelector('button').addEventListener('click',()=>{
        if(typeof window.p6OpenCategoryMaster==='function')window.p6OpenCategoryMaster();
        else if(typeof window.openCategoryMaster==='function')window.openCategoryMaster();
      });
      field.appendChild(tools);
    }
  }

  function polishHeader(){
    const box=document.querySelector('#modal .modalbox.p6-form');
    if(!box)return;
    const head=box.querySelector('.p6-body>.modalhead');
    if(!head)return;
    head.classList.add('step1-modalhead');
  }

  let scheduled=false;
  function sync(){
    if(scheduled)return;
    scheduled=true;
    setTimeout(async()=>{scheduled=false;polishHeader();await syncCategory()},80);
  }

  const observer=new MutationObserver(()=>sync());
  function boot(){
    observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
