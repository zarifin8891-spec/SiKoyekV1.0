(function(){
  /* Pass 8: use the real project-form shell for Master Kategori and
     prevent duplicate category controls after returning to the project form. */

  function normalizeCategoryMaster(){
    const box=document.querySelector('.modalbox:has(#p6CatRows)');
    if(!box) return;
    if(box.querySelector(':scope > .p6-side')) return;

    const side=document.createElement('aside');
    side.className='p6-side';
    side.innerHTML=
      '<div class="p6-mark">MASTER DATA</div>'+
      '<div class="p6-title">Kategori proyek</div>'+
      '<div class="p6-desc">Kelola kategori proyek sebagai master data terpusat.</div>'+
      '<div class="p6-hint">Edit, nonaktifkan, atau aktifkan kembali tanpa merusak histori.</div>';

    const body=document.createElement('div');
    body.className='p6-body';

    while(box.firstChild) body.appendChild(box.firstChild);

    box.appendChild(side);
    box.appendChild(body);
    box.classList.add('p6-form','p6-master');
    box.dataset.p6='1';
  }

  function normalizeCategoryTools(){
    const select=document.getElementById('f_cat');
    const field=select?.closest('.field');
    if(!field) return;

    const rows=[...field.querySelectorAll('.category-tools')];
    if(!rows.length) return;

    rows[0].classList.add('step1-category-tools');
    rows.slice(1).forEach(row=>row.remove());
  }

  function observe(){
    normalizeCategoryMaster();
    normalizeCategoryTools();
  }

  const boot=()=>setTimeout(observe,80);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();

  const obs=new MutationObserver(()=>{
    clearTimeout(window.__p8t);
    window.__p8t=setTimeout(observe,60);
  });
  obs.observe(document.body,{childList:true,subtree:true});
})();
