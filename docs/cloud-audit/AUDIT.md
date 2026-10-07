# Audit performa sumber Cloud SiKoyek V1.0

Selesai: 07-Oct-2026. Audit selesai dan dicommit sebelum perubahan aplikasi.

## Baseline dan batas kerja

- Repository: zarifin8891-spec/SiKoyekV1.0.
- Closed: `backup/SiKoyek-V1.0-closed-2026-09-07`, `dcd50d137c26cb62aeb91292b46c3de56fe05a2a`.
- Cabang kerja: `refactor/cloud-foundation-2026-10-07`.
- Main yang diamati: `543df154885d017b0632832d5f2c19cda1a5ff6a`.
- URL root aktif adalah pemilih MASTER/KONSTRUVA. HTML MASTER dibaca sebagai aset statis; tidak login, tidak menjalankan aplikasi terhadap MASTER.
- Tidak menjalankan SQL, migration, RPC, Edge Function, atau permintaan API database MASTER. LAN dijeda.
- `.github/workflows/pages.yml` menyisipkan runtime modal Master v8, modal Project Manager, dan CSS tabel Dashboard. Pengujian baseline merekonstruksi artifact Closed dengan menjalankan langkah Python tersebut di direktori sementara.
- Main setelah Closed berbeda pada 27 file, termasuk Health Engine, health integration, finance report, paket distribusi dan workflow. Perubahan bisnis Main tidak dibawa diam-diam ke Closed. Rencana berikut mempertahankan hasil Closed.

## Metode dan hasil ukur

`tests/foundation/browser-audit.cjs` menjalankan Chromium 153 pada 1440×1000 dengan enam proyek sintetis. Supabase SDK diganti fixture; semua URL eksternal diblokir kecuali SDK yang dipenuhi fixture. Query fixture berlatensi 20 ms untuk mengungkap urutan/duplikasi. Angka ini bukan latensi Cloud asli atau benchmark SQL/RLS.

Bukti lengkap: `baseline-browser.json`; fixture dan harness dapat dijalankan ulang. Hasil admin: 38 MutationObserver terdaftar, 8 interval (500 ms hingga 15 detik), 474 callback sampai Dashboard stabil, 19 pembacaan. Setelah masuk daftar enam proyek, total menjadi 39 pembacaan; 18 di antaranya adalah tiga pembacaan per proyek untuk status Edit/Hapus. Sampai enam tab detail, modal proyek, dan Data Master: 2.170 callback, 74 pembacaan. Role pelaksana: 25 pembacaan awal, 554 callback. Selama 3 detik idle setelah stabil: 0 callback dan 0 query tambahan. Timer tetap terpasang; jangan mengklaim query terus-menerus pada idle dari data ini.

Inventaris root Closed: 97 JS, 28 CSS, 55 lokasi pembuatan MutationObserver, 12 lokasi setInterval. Hanya 38 observer dan 8 interval terbukti aktif pada skenario Dashboard ini. Tidak ada error JavaScript pada skenario; dua aset lokal 404: `cost-control-fix-v6.js` dan `ui-project-detail-polish.js`.

## Temuan, penyebab, rekomendasi dan risiko

| Prioritas | Lokasi/bukti | Penyebab | Perbaikan global | Risiko dan verifikasi |
|---|---|---|---|---|
| High | `ui-form-pass5.js:116-164`; daftar 6 proyek → 18 read untuk tombol | 1 query proyek dan 2 count per baris; linear 3N request | Repository lifecycle: 3 query batch per daftar; tetap gunakan pemeriksaan fresh per proyek saat Edit/Hapus | Jangan mengubah definisi `started` atau membuka tombol terkunci; bandingkan count/boolean dan error fail-closed |
| High | `rbac-nav-v1.js:171-200`, `ui-form-pass8.js`, `user-permissions-v1.js`; masing-masing tabel roles/permissions/role_permissions dibaca 3 kali | Observer/boot memanggil loader sebelum promise pertama selesai | Single-flight pada loader; gunakan satu client/sesi; dedupe GET serentak dengan kunci endpoint+header auth lengkap | Jangan meng-cache lintas user/token atau menyembunyikan error; invalidate setelah write, jangan dedupe POST |
| High | 38 observer, 474 callback Dashboard; `ui-revamp-v1.js`, form passes, `detail-finance-kpi.js`, print/report bridges | Banyak normalizer mengamati body, beberapa menulis DOM/style kembali; callback sama dijadwalkan berulang | Lifecycle terpusat: satu native observer, batch subscriber; scope/filter target tetap dipertahankan; renderer idempotent dan jadwal satu kali | Urutan penataan dan masking hak akses sensitif; uji DOM, disabled/display, computed style dan geometri sebelum/sesudah |
| Medium | `detail-finance-kpi.js`, `dashboard-graphs*.js`, `dashboard-header-fix-v2.js`, `dashboard-user-v1.js` | Polling pemasangan UI walau sudah ada observer/boot; user header reload dari timer | Hilangkan polling UI yang redundan; retain refresh data Health/Decision 15 detik dan clock 30 detik, dengan scope halaman | Clock/data freshness tidak boleh berubah; uji saat pindah halaman dan membuka modal |
| Medium | `index.html` 12 link CSS + style inline; form/secondary CSS; 28 CSS root | Cascade berlapis, duplicate request (pass5), style.textContent ditulis berulang | Foundation CSS dari cascade Closed sesuai urutan; token warna/font/ukuran yang mempertahankan nilai akhir; dedupe aset dan style idempotent | Menghapus selector secara agresif mengubah specificity/media/print; cek computed style termasuk modal dan mobile |
| Medium | `core-unified-shell-v2.js:8-13`, loader form/master/report | `typeof window[key] === 'function'` menganggap flag boolean belum termuat; guard berdasarkan ID berbeda; sequential loaders | Asset registry berbasis URL, promise status/retry, pertahankan urutan dependensi dan error | Race antar global overrides; jangan parallel script yang menimpa fungsi yang sama |
| Medium | `.github/workflows/pages.yml` | Source checkout berbeda dari artifact; injeksi UI tidak terlihat saat review sumber | Materialisasikan runtime/style Closed ke sumber; arsipkan workflow penambal/deploy pada cabang eksperimen; tidak deploy | Harus terbukti sama dengan artifact Closed, bukan hanya checkout awal |
| Low | `index.html` dan `ui-form-step1.js` mereferensikan 2 aset hilang | Request 404; baseline tetap berjalan tanpa keduanya | Hapus referensi yang terbukti gagal; jangan menciptakan fitur pengganti | Laporkan sebagai defect baseline; bukan alasan menghilangkan tombol/fitur lain |
| Low | Banyak helper `new Intl.NumberFormat` identik di index/shell/modul | Instance formatter dibuat untuk setiap cell | Formatter reusable dari Foundation, tetap pisahkan moneyPlain/money dan masking per role | Format rupiah, pembulatan, persen, escaping tetap identik |

Tidak ada temuan Critical yang dibuktikan dalam audit lokal ini. SQL execution plans, latency API produksi, index, trigger, RLS, volume data dan sesi multiuser Cloud tidak diukur. Akses DB sengaja tidak dilakukan; tidak mengklaim database sebagai root cause. Frontend vanilla JS, bukan React: tidak ada React re-render untuk diaudit.

## Kontrak yang dipertahankan

Dashboard 8 KPI, filter periode dan panel Health/Decision/Kinerja; Daftar Proyek (pencarian, Edit/Hapus terkunci); detail Overview/Item/Progress/RAP/Keuangan/Cost; modal proyek Data→Konfirmasi; semua CRUD dan validation yang tersedia; Data Master, Daftar User/Hak Akses, seluruh tab laporan dan cetak. Navigation labels/URLs dan kondisi role tetap Closed. Engine Health/Decision/Cashflow, rumus weighted progress, pembulatan dan payload write tidak diubah. Aset yang tidak aktif tidak diasumsikan bisa dihapus tanpa inventaris.

## Urutan implementasi setelah audit

1. Bekukan audit ini dalam commit tersendiri.
2. Foundation runtime (formatter, asset loader, lifecycle, single-flight), repository Cloud yang mempertahankan SDK/query dan interface backend.
3. Materialisasi UI build; konsolidasi CSS dalam urutan baseline; rapikan N+1 dan loader berulang, tanpa mengubah validator bisnis.
4. Differential browser fixture semua role/menu/modal/report yang tercakup, suite engine, uji invalidation/write/error/auth boundaries. Catat batas cakupan, jangan klaim production-ready tanpa pengujian data riil.
5. Commit dan push hanya cabang kerja. Tidak merge, tidak publish, tidak mengaktifkan workflow deploy.
