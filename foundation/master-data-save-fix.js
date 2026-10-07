(function(){
  function q(id){return document.getElementById(id)}
  function save(table,title){
    const name=q('md_name')?.value.trim();
    const sort=Number(q('md_sort')?.value||0);
    if(!name){toast('Nama wajib diisi');return}
    window.sb.from(table).insert({name,sort_order:sort,is_active:true}).then(function(r){
      if(r.error){toast(r.error.message);return}
      if(typeof closeModal==='function') closeModal();
      toast(title+' ditambahkan');
      if(typeof window.openMasterData==='function') window.openMasterData();
    });
  }
  window.mdAddFinanceCategory=function(){
    modal('Tambah Kategori Keuangan',`<div class="field"><label>Nama Kategori *</label><input id="md_name" placeholder="Contoh: Material"></div><div class="field"><label>Urutan</label><input id="md_sort" type="number" value="1"></div><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="window.__siKoyekSaveFinance()">Simpan</button></div>`)
  };
  window.mdAddPaymentMethod=function(){
    modal('Tambah Metode Pembayaran',`<div class="field"><label>Nama Metode *</label><input id="md_name" placeholder="Contoh: Transfer"></div><div class="field"><label>Urutan</label><input id="md_sort" type="number" value="1"></div><div class="formactions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn primary" onclick="window.__siKoyekSavePayment()">Simpan</button></div>`)
  };
  window.__siKoyekSaveFinance=function(){save('transaction_categories','Kategori Keuangan')};
  window.__siKoyekSavePayment=function(){save('payment_methods','Metode Pembayaran')};
})();
