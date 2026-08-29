/* Pass 9: collapse Tambah Proyek Baru from 3 stages to 2.
   Stage 1 combines Identitas Proyek + Nilai & Periode.
   Stage 2 keeps the existing Konfirmasi pane and save logic. */
(function(){
  const VERSION='9.1';

  function injectCss(){
    if(document.getElementById('ui-form-pass9-css'))return;
    const link=document.createElement('link');
    link.id='ui-form-pass9-css';
    link.rel='stylesheet';
    link.href='./ui-form-pass9.css?v='+VERSION;
    document.head.appendChild(link);
  }

  function getBox(){
    const modal=document.getElementById('modal');
    const box=modal?.querySelector('.modalbox.p6-form:not(:has(#p6CatRows))');
    return box||null;
  }

  function setStepLabel(box,target,text){
    const el=box?.querySelector('.ui-step[data-target="'+target+'"]');
    if(!el)return;
    el.textContent=text;
  }

  function mergeProjectPanes(box){
    const pane1=box.querySelector('.ui-pane[data-pane="1"]');
    const pane2=box.querySelector('.ui-pane[data-pane="2"]');
    if(!pane1||!pane2||pane1.dataset.pass9Merged==='1')return;

    const label=document.createElement('div');
    label.className='si9-section-label';
    label.textContent='Nilai & Periode';

    const children=[...pane2.childNodes];
    if(children.length) pane1.appendChild(label);
    children.forEach(node=>pane1.appendChild(node));

    pane1.dataset.pass9Merged='1';
    pane2.dataset.pass9Hidden='1';
    pane2.style.display='none';
  }

  function normalizeStageState(box){
    if(!box)return;
    setStepLabel(box,1,'Data Proyek');
    setStepLabel(box,2,'');
    setStepLabel(box,3,'Konfirmasi');

    const old=Number(window.__siKoyekProjectStep||1);
    if(old===2)window.__siKoyekProjectStep=1;
  }

  function goStep(box,target){
    const step=Math.max(1,Math.min(3,target));
    window.__siKoyekProjectStep=step;
    if(typeof window.nextProjectStep==='function'&&step===3){
      window.__siKoyekProjectStep=2;
      window.nextProjectStep();
      return;
    }
    if(typeof window.prevProjectStep==='function'&&step===1){
      window.__siKoyekProjectStep=2;
      window.prevProjectStep();
      return;
    }
    document.querySelectorAll('#modal .ui-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.target)===step));
    document.querySelectorAll('#modal .ui-pane').forEach(el=>{
      const p=Number(el.dataset.pane);
      el.style.display=p===2?'none':(p===step?'block':'none');
    });
    const next=document.getElementById('uiNext'),back=document.getElementById('uiBack'),save=document.getElementById('uiSaveProject');
    if(next)next.style.display=step<3?'inline-flex':'none';
    if(back)back.style.display=step>1?'inline-flex':'none';
    if(save)save.style.display=step===3?'inline-flex':'none';
  }

  function validateStageOne(){
    const validation=document.getElementById('uiValidation');
    const code=document.getElementById('f_code')?.value.trim();
    const name=document.getElementById('f_name')?.value.trim();
    const contract=Number(document.getElementById('f_contract')?.value||0);
    const start=document.getElementById('f_start')?.value||'';
    const end=document.getElementById('f_end')?.value||'';

    let message='';
    if(!code||!name)message='Kode proyek dan nama proyek wajib diisi.';
    else if(contract<0)message='Nilai kontrak tidak boleh negatif.';
    else if(start&&end&&end<start)message='Target selesai tidak boleh lebih awal dari tanggal mulai.';

    if(validation){
      validation.textContent=message;
      validation.classList.toggle('show',!!message);
    }
    return !message;
  }

  function bindTwoStageButtons(box){
    const next=box.querySelector('#uiNext');
    const back=box.querySelector('#uiBack');
    if(next&&!next.dataset.pass9Bound){
      next.dataset.pass9Bound='1';
      next.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(Number(window.__siKoyekProjectStep||1)===1){
          if(!validateStageOne())return;
          goStep(box,3);
        }
      },true);
    }
    if(back&&!back.dataset.pass9Bound){
      back.dataset.pass9Bound='1';
      back.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        const step=Number(window.__siKoyekProjectStep||1);
        if(step===3)goStep(box,1);
      },true);
    }
  }

  function apply(){
    injectCss();
    const box=getBox();
    if(!box)return;
    mergeProjectPanes(box);
    normalizeStageState(box);
    bindTwoStageButtons(box);
  }

  let timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(apply,60);
  }

  function boot(){
    apply();
    const obs=new MutationObserver(schedule);
    obs.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
