(function(){
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
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
    const item=editId?state.detail.items.find(x=>String(x.id)===String(editId)):null;
    modal(item?'Edit Item Pekerjaan':'Tambah Item Pekerjaan',`
      <div class="ui-help">Gunakan bobot untuk membentuk progress proyek. Total bobot seluruh item tidak boleh melebihi 100%.</div>
      <div class="field"><label>Nama Item Pekerjaan *</label><input id="wi_name" value="${esc(item?.work_name||'')}" placeholder="Contoh: Pekerjaan Pondasi"></div>
      <div class="formgrid">
        <div class="field"><label>Bobot (%) *</label><input id="wi_weight" type="number" min="0" max="100" step="0.01" value="${item?Number(item.weight||0)*100:0}"></div>
        <div class="field"><label>Urutan</label><input id="wi_sort" type="number" min="0" value="${item?.sort_order??state.detail.items.length+1}"></div>
      </div>
      <div class="field"><label>Catatan</label><textarea id="wi_notes" placeholder="Catatan pekerjaan (opsional)">${esc(item?.notes||'')}</textarea></div>
      <div class="ui-total"><span>Total bobot saat ini</span><strong id="wiTotalPreview">${pct(state.detail.items.reduce((s,x)=>s+Number(x.weight||0),0)*100)}</strong></div>
      <div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="${item?'saveItemEdit(\''+item.id+'\')':'saveItem()'}">Simpan Item</button></div>`);
    const refresh=()=>{const current=state.detail.items.reduce((s,x)=>s+(String(x.id)===String(editId)?0:Number(x.weight||0)),0)+Number(document.getElementById('wi_weight')?.value||0)/100;const el=document.getElementById('wiTotalPreview');if(el)el.textContent=pct(current*100)};
    document.getElementById('wi_weight')?.addEventListener('input',refresh);
  };

  window.saveItemEdit=async function(id){
    const row={work_name:document.getElementById('wi_name').value.trim(),weight:Number(document.getElementById('wi_weight').value||0)/100,sort_order:Number(document.getElementById('wi_sort').value||0),notes:document.getElementById('wi_notes').value.trim()||null};
    if(!row.work_name){toast('Nama item wajib diisi');return}
    const other=state.detail.items.filter(x=>String(x.id)!==String(id)).reduce((s,x)=>s+Number(x.weight||0),0);
    if(other+row.weight>1.000001){toast('Total bobot proyek tidak boleh lebih dari 100%');return}
    const {error}=await sb.from('project_work_items').update(row).eq('id',id);
    if(error){toast(error.message);return}
    closeModal();await loadSummary();await openProject(state.selected);toast('Item pekerjaan diperbarui');
  };

  window.openRapForm=function(){
    const r=state.detail.rap||{};
    modal('RAP Proyek — Kontrol Anggaran',`
      <div class="ui-help">RAP V1.1 memakai enam kelompok biaya. Total akan dihitung otomatis dan menjadi dasar kontrol Cost Ratio serta RAP Consumption.</div>
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
      <div class="ui-help">Progress dicatat per Item Pekerjaan. Dashboard akan menghitung progress proyek berdasarkan bobot pekerjaan, sehingga angka total tidak perlu dimasukkan manual.</div>
      <div class="formgrid">
        <div class="field"><label>Tanggal Progress *</label><input id="pr_date" type="date" value="${today()}"></div>
        <div class="field"><label>Item Pekerjaan *</label><select id="pr_item">${items.map(x=>`<option value="${esc(x.id)}">${esc(x.work_name)} — bobot ${pct(Number(x.weight||0)*100)}</option>`).join('')}</select></div>
        <div class="field"><label>Progress Item (%) *</label><input id="pr_pct" type="number" min="0" max="100" step="0.01" value="0"></div>
      </div>
      <div class="field"><label>Catatan</label><textarea id="pr_notes" placeholder="Contoh: pekerjaan pondasi lantai 1 selesai..."></textarea></div>
      <div class="ui-progress-card"><div class="ui-progress-callout"><div class="headline">Bobot Item</div><div id="pr_weight" class="big">${pct(Number(items[0]?.weight||0)*100)}</div><p>Progress proyek dihitung dari Bobot × Progress Item.</p></div><div class="ui-progress-callout"><div class="headline">Kontribusi Progress</div><div id="pr_contrib" class="big">0.00%</div><p>Perkiraan kontribusi item ini terhadap progress proyek.</p></div></div>
      <div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="saveProgress()">Simpan Progress</button></div>`);
    const refresh=()=>{const item=items.find(x=>String(x.id)===String(document.getElementById('pr_item')?.value));const p=Number(document.getElementById('pr_pct')?.value||0);const w=Number(item?.weight||0);const we=document.getElementById('pr_weight'),co=document.getElementById('pr_contrib');if(we)we.textContent=pct(w*100);if(co)co.textContent=pct(w*p)};
    document.getElementById('pr_item')?.addEventListener('change',refresh);document.getElementById('pr_pct')?.addEventListener('input',refresh);refresh();
  };

  window.saveProgress=async function(){
    const row={project_id:state.selected,work_item_id:document.getElementById('pr_item').value,progress_date:document.getElementById('pr_date').value,progress_percentage:Number(document.getElementById('pr_pct').value||0)/100,notes:document.getElementById('pr_notes').value.trim()||null};
    if(!row.work_item_id||!row.progress_date||row.progress_percentage<0||row.progress_percentage>1){toast('Item, tanggal, dan progress 0–100% wajib valid');return}
    const {error}=await sb.from('progress_records').insert(row);
    if(error){toast(error.message);return}
    closeModal();await loadSummary();await openProject(state.selected);toast('Progress berhasil disimpan');
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
  const mo=new MutationObserver(()=>window.setTimeout(repaint,0));
  mo.observe(document.body,{childList:true,subtree:true});
  window.setTimeout(repaint,50);
})();
