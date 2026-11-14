(function(){
  const money=n=>window.SiKoyekFoundation.money(n);
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  const showValidation=(msg)=>{const el=document.getElementById('uiValidation');if(el){el.textContent=msg;el.classList.add('show')}};
  const clearValidation=()=>{const el=document.getElementById('uiValidation');if(el){el.textContent='';el.classList.remove('show')}};

  function wizardStep(step){
    document.querySelectorAll('#modal .ui-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.target)===step));
    document.querySelectorAll('#modal .ui-pane').forEach(el=>el.style.display=Number(el.dataset.pane)===step?'block':'none');
    const back=document.getElementById('uiBack');
    const next=document.getElementById('uiNext');
    const save=document.getElementById('uiSaveProject');
    if(back)back.style.display=step>1?'inline-flex':'none';
    if(next)next.style.display=step<3?'inline-flex':'none';
    if(save)save.style.display=step===3?'inline-flex':'none';
    window.__siKoyekProjectStep=step;
  }

  function nextProjectStep(){
    clearValidation();
    const step=window.__siKoyekProjectStep||1;
    if(step===1){
      const code=document.getElementById('f_code')?.value.trim();
      const name=document.getElementById('f_name')?.value.trim();
      if(!code||!name){showValidation('Kode proyek dan nama proyek wajib diisi.');return;}
    }
    if(step===2){
      const contract=Number(document.getElementById('f_contract')?.value||0);
      if(contract<0){showValidation('Nilai kontrak tidak boleh negatif.');return;}
      const start=document.getElementById('f_start')?.value||'';
      const end=document.getElementById('f_end')?.value||'';
      if(start&&end&&end<start){showValidation('Target selesai tidak boleh lebih awal dari tanggal mulai.');return;}
    }
    wizardStep(Math.min(3,step+1));
  }

  function prevProjectStep(){clearValidation();wizardStep(Math.max(1,(window.__siKoyekProjectStep||1)-1));}

  window.openProjectForm=function(){
    modal('Tambah Proyek Baru',`
      <div class="ui-wizard">
        <div class="ui-steps">
          <div class="ui-step active" data-step="1" data-target="1">Identitas Proyek</div>
          <div class="ui-step" data-step="2" data-target="2">Nilai & Periode</div>
          <div class="ui-step" data-step="3" data-target="3">Konfirmasi</div>
        </div>
        <div id="uiValidation" class="ui-validation"></div>
        <div class="ui-pane" data-pane="1">
          <div class="ui-help">Isi informasi utama proyek. Kode proyek harus unik dan nama proyek wajib jelas.</div>
          <div class="formgrid">
            <div class="field"><label>Kode Proyek *</label><input id="f_code" placeholder="P26007" autocomplete="off"></div>
            <div class="field"><label>Tanggal Proyek</label><input id="f_date" type="date" value="${today()}"></div>
            <div class="field"><label>Nama Proyek *</label><input id="f_name" placeholder="Contoh: Renovasi Rumah Budi"></div>
            <div class="field"><label>Pemilik / Klien</label><input id="f_owner" placeholder="Nama pemilik / perusahaan"></div>
            <div class="field"><label>Kategori</label><input id="f_cat" placeholder="Renovasi / Bangun Baru / Interior"></div>
            <div class="field"><label>Lokasi</label><input id="f_loc" placeholder="Lokasi proyek"></div>
          </div>
        </div>
        <div class="ui-pane" data-pane="2" style="display:none">
          <div class="ui-help">Tentukan nilai komersial dan periode proyek. Data ini akan dipakai Dashboard dan kontrol proyek.</div>
          <div class="formgrid">
            <div class="field"><label>Nilai Kontrak</label><input id="f_contract" type="number" min="0" step="1000" value="0"></div>
            <div class="field"><label>Project Manager</label><input id="f_mgr" placeholder="Nama PIC / PM"></div>
            <div class="field"><label>Tanggal Mulai</label><input id="f_start" type="date"></div>
            <div class="field"><label>Target Selesai</label><input id="f_end" type="date"></div>
            <div class="field"><label>Status</label><select id="f_status"><option>RENCANA</option><option>JALAN</option><option>PENDING</option><option>SELESAI</option></select></div>
          </div>
        </div>
        <div class="ui-pane" data-pane="3" style="display:none">
          <div class="ui-help">Periksa data sebelum menyimpan. Setelah dibuat, proyek dapat langsung diisi Item Pekerjaan, RAP, Progress, dan Transaksi.</div>
          <div class="ui-total"><span>Nama Proyek</span><strong id="uiPreviewName">-</strong></div>
          <div class="ui-total" style="margin-top:8px"><span>Nilai Kontrak</span><strong id="uiPreviewContract">Rp0</strong></div>
          <div class="ui-total" style="margin-top:8px"><span>Periode</span><strong id="uiPreviewDates">-</strong></div>
          <div class="note" style="margin-top:12px">Catatan: RAP dan progress belum dihitung pada tahap ini sampai data operasional diisi.</div>
        </div>
      </div>
      <div class="formactions">
        <button id="uiBack" class="btn ghost" onclick="prevProjectStep()" style="display:none">← Kembali</button>
        <button class="btn ghost" onclick="closeModal()">Batal</button>
        <button id="uiNext" class="btn primary" onclick="nextProjectStep()">Lanjut →</button>
        <button id="uiSaveProject" class="btn primary" onclick="saveProject();" style="display:none">✓ Simpan Proyek</button>
      </div>`);
    window.__siKoyekProjectStep=1;
    wizardStep(1);
    const sync=()=>{
      const name=document.getElementById('f_name')?.value.trim()||'-';
      const contract=Number(document.getElementById('f_contract')?.value||0);
      const start=document.getElementById('f_start')?.value||'';
      const end=document.getElementById('f_end')?.value||'';
      document.getElementById('uiPreviewName')?.replaceChildren(document.createTextNode(name));
      const c=document.getElementById('uiPreviewContract');if(c)c.textContent=money(contract);
      const p=document.getElementById('uiPreviewDates');if(p)p.textContent=start||end?`${start||'-'} s/d ${end||'-'}`:'-';
    };
    ['f_name','f_contract','f_start','f_end'].forEach(id=>document.getElementById(id)?.addEventListener('input',sync));
  };

  window.openItemForm=function(editId){
    const project=state.selected;
    const items=state.detail.items;
    const item=editId?items.find(x=>String(x.id)===String(editId)):null;
    if(editId&&!item)return;
    let nextOrder=items.reduce((max,x)=>Math.max(max,Number(x.sort_order)||0),0)+1;
    const rowMarkup=()=>`<tr>
      <td data-label="Urutan"><input aria-label="Urutan" name="sort_order" type="number" min="0" max="2147483647" required value="${item?.sort_order??nextOrder++}"></td>
      <td data-label="Nama Pekerjaan"><input aria-label="Nama Pekerjaan" name="work_name" required value="${esc(item?.work_name||'')}"></td>
      <td data-label="Bobot (%)"><input aria-label="Bobot (%)" name="weight" type="number" min="0" max="100" step="0.01" required value="${item?Number(item.weight||0)*100:0}"></td>
      <td data-label="Durasi (hari)"><input aria-label="Durasi (hari)" name="duration_days" type="number" min="1" max="36500" value="${esc(item?.duration_days??'')}"></td>
      <td data-label="Rencana Mulai"><input aria-label="Rencana Mulai" name="planned_start_date" type="date" value="${esc(item?.planned_start_date??'')}"></td>
      <td data-label="Keterangan"><input aria-label="Keterangan" name="notes" value="${esc(item?.notes||'')}"></td>
      ${item?'':'<td data-label="Pilih"><input type="checkbox" name="selected_item" aria-label="Pilih baris untuk dihapus"></td>'}
    </tr>`;
    modal(item?'Edit Item Pekerjaan':'Tambah Item Pekerjaan',`
      <form id="item-entry">
        <div class="scroll entry-table-wrap"><table class="table entry-table"><colgroup><col class="entry-order"><col class="entry-name"><col class="entry-weight"><col class="entry-duration"><col class="entry-date"><col class="entry-notes">${item?'':'<col class="entry-select">'}</colgroup><thead><tr>
          <th scope="col">Urutan</th><th scope="col">Nama Pekerjaan</th><th scope="col">Bobot (%)</th>
          <th scope="col">Durasi (hari)</th><th scope="col">Rencana Mulai</th><th scope="col">Keterangan</th>
          ${item?'':'<th scope="col">Pilih</th>'}
        </tr></thead><tbody>${rowMarkup()}</tbody></table></div>
        <div class="ui-total"><span>Total bobot</span><strong id="wiTotalPreview"></strong></div>
        <div class="formactions">
          ${item?'':'<div class="entry-row-actions"><button type="button" class="btn ghost" data-add-item-row>+ Tambah Item</button><button type="button" class="btn ghost" data-remove-item disabled>Hapus Item</button></div>'}
          <button type="button" class="btn ghost" onclick="closeModal()">Batal</button>
          <button type="submit" class="btn primary">Simpan</button>
        </div>
      </form>`);
    const form=document.getElementById('item-entry');
    const body=form.querySelector('tbody');
    const submit=form.querySelector('[type=submit]');
    const remove=form.querySelector('[data-remove-item]');
    const existingWeight=items.reduce((sum,x)=>sum+(x===item?0:Number(x.weight||0)),0);
    const refresh=()=>{
      if(remove)remove.disabled=!body.querySelector('[name=selected_item]:checked');
      const draftWeight=[...body.querySelectorAll('[name=weight]')].reduce((sum,input)=>sum+Number(input.value||0)/100,0);
      form.querySelector('#wiTotalPreview').textContent=pct((existingWeight+draftWeight)*100);
    };
    form.addEventListener('input',refresh);
    form.querySelector('[data-add-item-row]')?.addEventListener('click',()=>{
      if(submit.disabled)return;
      body.insertAdjacentHTML('beforeend',rowMarkup());
      body.lastElementChild.querySelector('[name=work_name]').focus();
      refresh();
    });
    remove?.addEventListener('click',()=>{
      if(submit.disabled)return;
      body.querySelectorAll('[name=selected_item]:checked').forEach(input=>input.closest('tr').remove());
      refresh();
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(submit.disabled||!form.reportValidity())return;
      const rows=[...body.rows].map(row=>{
        const value=name=>row.querySelector(`[name="${name}"]`).value.trim();
        return {
          project_id:project, sort_order:Number(value('sort_order')), work_name:value('work_name'),
          weight:Number(value('weight'))/100, duration_days:Number(value('duration_days'))||null,
          planned_start_date:value('planned_start_date')||null, notes:value('notes')||null,
        };
      });
      if(!rows.length||rows.some(row=>!row.work_name)){toast('Isi nama pekerjaan pada setiap baris');return}
      if(rows.some(row=>row.planned_start_date&&!row.duration_days)){toast('Tanggal rencana mulai memerlukan durasi');return}
      if(existingWeight+rows.reduce((sum,row)=>sum+row.weight,0)>1.000001){toast('Total bobot proyek tidak boleh lebih dari 100%');return}
      submit.disabled=true;
      try {
        const table=sb.from('project_work_items');
        const {error}=await (item?table.update(rows[0]).eq('id',item.id).eq('project_id',project):table.insert(rows));
        if(error){toast(error.message);return}
        if(form.isConnected)closeModal();
        await loadSummary();
        if(state.selected===project)await openProject(project);
        toast(item?'Item pekerjaan diperbarui':'Item pekerjaan ditambahkan');
      } catch(error){toast(error.message||'Gagal menyimpan item pekerjaan')}
      finally{submit.disabled=false}
    });
    refresh();
  };

  window.openRapForm=function(){
    const r=state.detail.rap||{};
    modal('RAP Proyek — Kontrol Anggaran',`
      <div class="formgrid">${[['material','Material'],['labor','Upah'],['equipment','Alat'],['operational','Operasional'],['subcontract','Subkon'],['other','Lain-Lain']].map(([k,l])=>`<div class="field"><label>${l}</label><input id="rap_${k}" type="number" min="0" step="1000" value="${Number(r[k]||0)}"></div>`).join('')}</div>
      <div class="ui-total"><span>Total RAP</span><strong id="rapTotalPreview">Rp0</strong></div>
      <div class="note">Catatan: struktur RAP tetap kompatibel dengan model database saat ini.</div>
      <div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="saveRap()">Simpan RAP</button></div>`);
    const refresh=()=>{const total=['material','labor','equipment','operational','subcontract','other'].reduce((s,k)=>s+Number(document.getElementById('rap_'+k)?.value||0),0);const el=document.getElementById('rapTotalPreview');if(el)el.textContent=money(total)};
    ['material','labor','equipment','operational','subcontract','other'].forEach(k=>document.getElementById('rap_'+k)?.addEventListener('input',refresh));refresh();
  };

  window.openProgressForm=function(){
    const items=state.detail.items||[];
    if(!items.length){toast('Tambahkan Item Pekerjaan terlebih dahulu sebelum menginput progress');return;}
    modal('Input Progress Proyek',`
      <form id="progress-entry">
        <div class="field"><label for="pr_date">Tanggal Progress *</label><input id="pr_date" type="date" value="${today()}" required></div>
        <div class="scroll entry-table-wrap"><table class="table entry-table">
          <thead><tr><th scope="col">Urutan</th><th scope="col">Nama Pekerjaan</th><th scope="col">Bobot (%)</th><th scope="col">Tambahan Progress (%)</th><th scope="col">Keterangan</th></tr></thead>
          <tbody>${items.map((item,index)=>`<tr data-progress-item="${esc(item.id)}">
            <td data-label="Urutan">${esc(item.sort_order??index+1)}</td><th scope="row">${esc(item.work_name)}</th>
            <td data-label="Bobot (%)">${pct(Number(item.weight||0)*100)}</td>
            <td data-label="Tambahan Progress (%)"><input name="progress" aria-label="Progress ${esc(item.work_name)}" type="number" min="0" max="100" step="0.01"></td>
            <td data-label="Keterangan"><input name="notes" aria-label="Keterangan ${esc(item.work_name)}"></td>
          </tr>`).join('')}</tbody>
        </table></div>
        <div class="formactions"><button type="button" class="btn ghost" onclick="closeModal()">Batal</button><button type="submit" class="btn primary">Simpan Progress</button></div>
      </form>`);
    document.getElementById('progress-entry').addEventListener('submit',window.saveProgress);
  };

  window.saveProgress=async function(event){
    event.preventDefault();
    const form=event.currentTarget;
    const button=form.querySelector('[type=submit]');
    if(button.disabled||!form.reportValidity())return;
    const project=state.selected;
    const date=form.querySelector('#pr_date').value;
    const rows=[...form.querySelectorAll('[data-progress-item]')].flatMap(row=>{
      const progress=row.querySelector('[name=progress]').value;
      return progress===''?[]:[{
        project_id:project, work_item_id:row.dataset.progressItem, progress_date:date,
        progress_percentage:Number(progress)/100, notes:row.querySelector('[name=notes]').value.trim()||null,
      }];
    });
    if(!rows.length){toast('Isi progress minimal satu pekerjaan');return}
    button.disabled=true;
    try {
      const {error}=await sb.from('progress_records').insert(rows);
      if(error){toast(error.message);return}
      if(!form.isConnected)return;
      closeModal();
      await loadSummary();
      if(state.selected===project)await openProject(project);
      toast('Progress berhasil disimpan');
    } finally { button.disabled=false; }
  };

  window.progressView=function(d){
    const rows=d.progress||[];
    return `<div class="sectiontitle"><div><h2>Progress Proyek</h2><div class="note">Catatan progress per Item Pekerjaan.</div></div><button class="btn primary" onclick="openProgressForm()">+ Input Progress</button></div><div class="ui-progress-card"><div class="card kpi"><div class="sectiontitle"><h2>Progress Saat Ini</h2></div><div style="font-size:34px;font-weight:850">${pct(Number((state.summary.find(x=>x.project_id===state.selected)||{}).project_progress||0))}</div><div class="bar" style="margin-top:12px"><i style="width:${Math.min(100,Number((state.summary.find(x=>x.project_id===state.selected)||{}).project_progress||0))}%"></i></div><div class="note">Dihitung dari bobot Item Pekerjaan.</div></div><div class="card kpi"><div class="headline" style="font-weight:850;color:#245cff">Cara Kerja Progress</div><p class="note" style="line-height:1.6;margin-top:8px">Input progress dilakukan per item. Setiap nilai otomatis memberi kontribusi sesuai bobot pekerjaan.</p></div></div><div class="section"><div class="card tablecard"><div class="scroll"><table class="table"><thead><tr><th>Tanggal</th><th>Item</th><th>Progress</th><th>Catatan</th></tr></thead><tbody>${rows.map(p=>{const item=d.items.find(i=>String(i.id)===String(p.work_item_id));return `<tr><td>${esc(p.progress_date)}</td><td><strong>${esc(item?.work_name||p.work_item_id)}</strong></td><td><span class="pill green">${pct(Number(p.progress_percentage||0)*100)}</span></td><td>${esc(p.notes||'-')}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">Belum ada progress. Klik <strong>Input Progress</strong> untuk mulai.</td></tr>'}</tbody></table></div></div></div>`;
  };

  function repaint(){
    const modalBox=document.querySelector('.modalbox');if(modalBox)modalBox.classList.add('ui-modern-modal');
    const activeTab=document.querySelector('.tabs button.active');
    if(activeTab&&activeTab.textContent.trim()==='Progress'&&document.querySelector('.detailtitle')){
      // no-op: the overridden progressView renders the action button.
    }
  }
  const mo=new window.SiKoyekFoundation.Observer(()=>window.setTimeout(repaint,0));
  mo.observe(document.body,{childList:true,subtree:true});
  window.setTimeout(repaint,50);
})();
