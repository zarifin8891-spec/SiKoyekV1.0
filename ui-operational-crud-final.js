/* Final operational CRUD for Item Pekerjaan, Progress, and Keuangan. */
(function(){
  const STYLE_ID='sikoyek-operational-crud-final-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .op-actions{display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap}
      .op-actions .op-btn{height:24px;min-width:54px;padding:0 7px;border:1px solid #d6dee8;border-radius:6px;background:#fff;color:#26364d;font-size:10px;font-weight:500;line-height:1;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box}
      .op-actions .op-btn.delete{color:#b42318;border-color:#efc5c2}
      .op-actions .op-btn:hover{filter:brightness(.98)}
      .op-actions-th,.op-action-cell{text-align:center!important}
      table.table[data-op-crud-final="1"] tbody td{padding-top:2px!important;padding-bottom:2px!important;line-height:1.1!important;vertical-align:middle!important}
      table.table[data-op-crud-final="1"] tbody tr{height:28px!important}
      table.table[data-op-crud-final="1"] .op-action-cell{padding-left:4px!important;padding-right:4px!important}
      #modal .modalbox.op-crud-box{width:min(620px,calc(100vw - 28px))!important;max-width:620px!important;max-height:calc(100vh - 24px)!important;overflow:hidden!important;padding:0!important;border-radius:18px!important;box-sizing:border-box!important}
      .op-crud-box .modalhead{height:68px!important;margin:0!important;padding:12px 20px!important;background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box}
      .op-crud-box .modalhead h3{margin:0!important;color:#fff!important;font-size:20px!important;font-weight:650!important}
      .op-crud-box .modalhead button{height:34px!important;min-width:78px!important;padding:0 14px!important;background:#fff!important;border:0!important;border-radius:8px!important;color:#172033!important;font-size:12px!important;font-weight:500!important}
      .op-crud-box .op-body{padding:14px 20px 6px!important}
      .op-crud-box .op-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
      .op-crud-box .field{margin:0!important;min-width:0!important}
      .op-crud-box .field.full{grid-column:1/-1!important}
      .op-crud-box .field label{display:block!important;margin:0 0 4px!important;font-size:11px!important;font-weight:600!important;color:#304059!important}
      .op-crud-box .field input,.op-crud-box .field select,.op-crud-box .field textarea{width:100%!important;height:36px!important;min-height:36px!important;padding:6px 9px!important;border:1px solid #cbd8e6!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-size:12px!important;box-sizing:border-box!important}
      .op-crud-box .field textarea{height:58px!important;resize:none!important}
      .op-crud-box .op-actions-bar{display:flex!important;justify-content:flex-end!important;gap:7px!important;padding:8px 20px 12px!important;border-top:1px solid #e8edf3!important}
      .op-crud-box .op-actions-bar button{height:34px!important;min-width:96px!important;padding:0 12px!important;border-radius:8px!important;border:1px solid #d3dce7!important;background:#fff!important;color:#26364d!important;font-size:12px!important;font-weight:500!important}
      .op-crud-box .op-actions-bar .primary{background:#0b2e52!important;border-color:#0b2e52!important;color:#fff!important}
      @media(max-width:560px){.op-crud-box .op-grid{grid-template-columns:1fr!important}.op-crud-box .field.full{grid-column:auto!important}}
    `;document.head.appendChild(s)
  }
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function currentState(){try{return typeof state!=='undefined'?state:null}catch(_){return null}}
  function decorateTable(table,kind,rows){
    if(!table||table.dataset.opCrudFinal==='1'||!Array.isArray(rows)||!rows.length)return;
    const head=table.querySelector('thead tr');if(!head)return;
    if([...head.children].some(th=>/\baksi\b/i.test(th.textContent||'')))return;
    const th=document.createElement('th');th.textContent='Aksi';th.className='op-actions-th';head.appendChild(th);
    const trs=[...table.querySelectorAll('tbody tr')].filter(tr=>tr.children.length>1);
    rows.forEach((row,i)=>{
      const tr=trs[i];if(!tr)return;
      const td=document.createElement('td');td.className='op-action-cell';
      td.innerHTML='<div class="op-actions"><button type="button" class="op-btn">Edit</button><button type="button" class="op-btn delete">Hapus</button></div>';
      tr.appendChild(td);
      td.querySelector('.op-btn:not(.delete)').addEventListener('click',()=>kind==='item'?window.sikoyekEditItemFinal(row.id):kind==='progress'?window.sikoyekEditProgressFinal(row.id):window.sikoyekEditTransactionFinal(row.id));
      td.querySelector('.delete').addEventListener('click',()=>kind==='item'?window.sikoyekDeleteItemFinal(row.id):kind==='progress'?window.sikoyekDeleteProgressFinal(row.id):window.sikoyekDeleteTransactionFinal(row.id));
    });
    table.dataset.opCrudFinal='1';
  }
  function decorate(){
    const st=currentState();if(!st||!st.detail)return;
    const tables=[...document.querySelectorAll('table.table')];
    for(const t of tables){
      const heads=[...t.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim().toLowerCase());
      if(heads.includes('no')&&heads.includes('item pekerjaan')&&heads.includes('bobot')&&heads.includes('urutan'))decorateTable(t,'item',st.detail.items||[]);
      else if(heads.includes('tanggal')&&heads.includes('item')&&heads.includes('progress')&&heads.includes('catatan'))decorateTable(t,'progress',st.detail.progress||[]);
      else if(heads.includes('tanggal')&&heads.includes('jenis')&&heads.includes('kategori')&&heads.includes('deskripsi')&&heads.includes('jumlah')&&heads.includes('metode'))decorateTable(t,'transaction',st.detail.fin||[]);
    }
  }
  function markCrudModal(){const box=document.querySelector('#modal .modalbox');if(box){box.classList.add('op-crud-box');box.dataset.opCrudModal='1'}}
  async function refresh(tab){const st=currentState();if(!st||!st.selected||typeof getDetail!=='function')return;st.detail=await getDetail(st.selected);st.detailTab=tab;renderApp()}

  window.sikoyekEditItemFinal=async function(id){
    const st=currentState(),x=(st?.detail?.items||[]).find(r=>String(r.id)===String(id));if(!x)return;
    const {count}=await sb.from('progress_records').select('id',{count:'exact',head:true}).eq('work_item_id',id);const hasProgress=Number(count||0)>0;
    modal('Edit Item Pekerjaan',`<div class="op-body"><div class="op-grid"><div class="field full"><label>Nama Item Pekerjaan *</label><input id="op_wi_name" value="${esc(x.work_name)}"></div><div class="field"><label>Bobot (%) *</label><input id="op_wi_weight" type="number" min="0" max="100" step="0.01" value="${Number(x.weight||0)*100}" ${hasProgress?'disabled':''}></div><div class="field"><label>Urutan</label><input id="op_wi_sort" type="number" min="0" value="${Number(x.sort_order||0)}"></div><div class="field full"><label>Catatan</label><textarea id="op_wi_notes">${esc(x.notes||'')}</textarea></div></div></div><div class="op-actions-bar"><button type="button" onclick="closeModal()">Batal</button><button class="primary" type="button" onclick="sikoyekSaveItemEditFinal('${String(id)}')">Simpan Perubahan</button></div>`);markCrudModal();if(hasProgress)toast('Bobot dikunci karena item sudah memiliki progress.');
  };
  window.sikoyekSaveItemEditFinal=async function(id){
    const st=currentState(),x=(st?.detail?.items||[]).find(r=>String(r.id)===String(id));if(!x)return;
    const name=document.getElementById('op_wi_name')?.value.trim()||'',weight=Number(document.getElementById('op_wi_weight')?.value||0)/100,sort=Number(document.getElementById('op_wi_sort')?.value||0),notes=document.getElementById('op_wi_notes')?.value.trim()||null;if(!name){toast('Nama item wajib diisi');return}
    const {count}=await sb.from('progress_records').select('id',{count:'exact',head:true}).eq('work_item_id',id);if(Number(count||0)>0&&Math.abs(weight-Number(x.weight||0))>0.000001){toast('Bobot tidak dapat diubah karena item sudah memiliki progress.');return}
    const total=(st.detail.items||[]).filter(r=>String(r.id)!==String(id)).reduce((s,r)=>s+Number(r.weight||0),0)+weight;if(total>1.000001){toast('Total bobot proyek tidak boleh lebih dari 100%.');return}
    const {error}=await sb.from('project_work_items').update({work_name:name,weight,sort_order:sort,notes}).eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('pekerjaan');toast('Item pekerjaan diperbarui');
  };
  window.sikoyekDeleteItemFinal=async function(id){
    const st=currentState(),x=(st?.detail?.items||[]).find(r=>String(r.id)===String(id));if(!x)return;
    const {count}=await sb.from('progress_records').select('id',{count:'exact',head:true}).eq('work_item_id',id);if(Number(count||0)>0){toast('Item tidak dapat dihapus karena sudah memiliki progress.');return}
    if(!confirm(`Hapus item "${x.work_name}"?`))return;const {error}=await sb.from('project_work_items').delete().eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('pekerjaan');toast('Item pekerjaan dihapus');
  };
  window.sikoyekEditProgressFinal=async function(id){
    const st=currentState(),x=(st?.detail?.progress||[]).find(r=>String(r.id)===String(id));if(!x)return;const items=st.detail.items||[];
    const opts=items.map(i=>`<option value="${esc(i.id)}" ${String(i.id)===String(x.work_item_id)?'selected':''}>${esc(i.work_name)}</option>`).join('');
    modal('Edit Progress',`<div class="op-body"><div class="op-grid"><div class="field"><label>Tanggal Progress *</label><input id="op_pr_date" type="date" value="${esc(x.progress_date||'')}"></div><div class="field"><label>Item Pekerjaan *</label><select id="op_pr_item">${opts}</select></div><div class="field"><label>Progress Item (%) *</label><input id="op_pr_pct" type="number" min="0" max="100" step="0.01" value="${Number(x.progress_percentage||0)*100}"></div><div class="field full"><label>Catatan</label><textarea id="op_pr_notes">${esc(x.notes||'')}</textarea></div></div></div><div class="op-actions-bar"><button type="button" onclick="closeModal()">Batal</button><button class="primary" type="button" onclick="sikoyekSaveProgressEditFinal('${String(id)}')">Simpan Perubahan</button></div>`);markCrudModal();
  };
  window.sikoyekSaveProgressEditFinal=async function(id){
    const date=document.getElementById('op_pr_date')?.value||null,item=document.getElementById('op_pr_item')?.value||null,pct=Number(document.getElementById('op_pr_pct')?.value||0),notes=document.getElementById('op_pr_notes')?.value.trim()||null;if(!date||!item||pct<0||pct>100){toast('Tanggal, item, dan progress 0–100% wajib valid.');return}
    const {error}=await sb.from('progress_records').update({progress_date:date,work_item_id:item,progress_percentage:pct/100,notes}).eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('progress');toast('Progress diperbarui');
  };
  window.sikoyekDeleteProgressFinal=async function(id){if(!confirm('Hapus data progress ini?'))return;const {error}=await sb.from('progress_records').delete().eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('progress');toast('Progress dihapus')};
  async function txOptions(){const [cats,methods]=await Promise.all([sb.from('transaction_categories').select('name,is_active,sort_order').eq('is_active',true).order('sort_order').order('name'),sb.from('payment_methods').select('name,is_active,sort_order').eq('is_active',true).order('sort_order').order('name')]);return {cats:cats.data||[],methods:methods.data||[]}}
  window.sikoyekEditTransactionFinal=async function(id){
    const st=currentState(),x=(st?.detail?.fin||[]).find(r=>String(r.id)===String(id));if(!x)return;const {cats,methods}=await txOptions();
    const co=cats.map(c=>`<option value="${esc(c.name)}" ${c.name===x.category?'selected':''}>${esc(c.name)}</option>`).join('');const mo=methods.map(m=>`<option value="${esc(m.name)}" ${m.name===x.payment_method?'selected':''}>${esc(m.name)}</option>`).join('');
    modal('Edit Transaksi Keuangan',`<div class="op-body"><div class="op-grid"><div class="field"><label>Tanggal *</label><input id="op_tx_date" type="date" value="${esc(x.transaction_date||'')}"></div><div class="field"><label>Jenis *</label><select id="op_tx_type"><option ${x.transaction_type==='MASUK'?'selected':''}>MASUK</option><option ${x.transaction_type==='KELUAR'?'selected':''}>KELUAR</option></select></div><div class="field"><label>Kategori</label><select id="op_tx_cat"><option value="">Pilih kategori...</option>${co}</select></div><div class="field"><label>Jumlah *</label><input id="op_tx_amount" type="number" min="1" value="${Number(x.amount||0)}"></div><div class="field"><label>Metode</label><select id="op_tx_method"><option value="">Pilih metode...</option>${mo}</select></div><div class="field"><label>Deskripsi *</label><input id="op_tx_desc" value="${esc(x.description||'')}"></div></div></div><div class="op-actions-bar"><button type="button" onclick="closeModal()">Batal</button><button class="primary" type="button" onclick="sikoyekSaveTransactionEditFinal('${String(id)}')">Simpan Perubahan</button></div>`);markCrudModal();
  };
  window.sikoyekSaveTransactionEditFinal=async function(id){
    const date=document.getElementById('op_tx_date')?.value||null,type=document.getElementById('op_tx_type')?.value||'',category=document.getElementById('op_tx_cat')?.value||null,amount=Number(document.getElementById('op_tx_amount')?.value||0),method=document.getElementById('op_tx_method')?.value||null,description=document.getElementById('op_tx_desc')?.value.trim()||'';if(!date||!type||!description||amount<=0){toast('Tanggal, jenis, deskripsi, dan jumlah wajib diisi.');return}
    const {error}=await sb.from('financial_transactions').update({transaction_date:date,transaction_type:type,category:category||null,description,amount,payment_method:method||null}).eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('keuangan');toast('Transaksi diperbarui');
  };
  window.sikoyekDeleteTransactionFinal=async function(id){if(!confirm('Hapus transaksi ini?'))return;const {error}=await sb.from('financial_transactions').delete().eq('id',id);if(error){toast(error.message);return}closeModal();await refresh('keuangan');toast('Transaksi dihapus')};
  function boot(){addStyle();decorate();const obs=new MutationObserver(()=>{clearTimeout(window.__opCrudFinalTimer);window.__opCrudFinalTimer=setTimeout(decorate,80)});obs.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();