# Hasil Global Foundation — 07 Oktober 2026

Audit selesai pada commit `1f46e13` sebelum implementasi. Implementasi memakai Closed `dcd50d137c26cb62aeb91292b46c3de56fe05a2a` pada cabang `refactor/cloud-foundation-2026-10-07`. Perubahan bisnis Main sesudah Closed tidak diimpor.

## Hasil ukur lokal

Fixture enam proyek, Chromium 153, viewport desktop 1440×1000 dan mobile 390×844. Supabase diganti fixture; jaringan eksternal diblokir. Angka permintaan adalah pembacaan fixture, bukan pengukuran latensi Cloud atau beban SQL MASTER.

| Ukuran pada skenario yang sama | Closed | Foundation |
|---|---:|---:|
| Pemantau DOM native pada Dashboard | 38 | 1 |
| Interval aktif pada Dashboard | 8 | 2 |
| Pembacaan awal Dashboard admin | 19 | 8 |
| Pembacaan awal Dashboard direktur | 25 | 13 |
| Pembacaan awal Dashboard keuangan/marketing/pelaksana | 25 | 10 |
| Pemeriksaan lifecycle enam proyek dalam daftar | 18 | 3 |
| Pembacaan tambahan tiap perpindahan tab detail setelah detail lengkap dimuat | 3 | 0 |
| Link CSS statis Dashboard | 12 | 2 |
| Pembacaan tambahan selama idle stabil 3 detik | 0 | 0 |

Total masuk daftar masih mencakup dua pembacaan ringkasan pada kedua versi: 20 menjadi 5. Pemeriksaan Edit/Hapus saat aksi tetap membaca status serta jumlah riwayat secara fresh. Pembacaan riwayat daftar dibatasi 100 ID per batch dan dipaginasi, termasuk jika riwayat melampaui 1.000 baris. Data detail dengan error tidak digunakan untuk menentukan tombol.

## Implementasi

- Runtime bersama menyediakan format mata uang, registry aset dengan promise, pemanggilan single-flight, pembaruan style idempoten, dan satu observer native yang melayani subscriber sesuai target serta opsi lama.
- Backend bersama mempertahankan kontrak Supabase SDK. Hanya pembacaan identik yang sedang berlangsung digabung; tidak ada cache hasil menetap. Session, user, token, seluruh filter, dan generasi invalidasi masuk identitas permintaan. Write, perubahan auth, RPC dan Edge Function membatalkan entri in-flight; write tidak digabung. Abort terpisah tetap terpisah.
- Repository memusatkan aturan status/progress/riwayat dan batching. Tab detail memakai riwayat yang telah dimuat; pemeriksaan aksi tetap fresh.
- Token dan bundle CSS menyatukan cascade Closed dengan urutan semula. CSS dinamis yang masih diperlukan dipertahankan. Manifest mencatat seluruh sumber bundle.
- Timer normalisasi berulang diganti lifecycle observer; timer Health/Decision dipertahankan. Loop perpindahan field Urutan pada modal Master dibuat idempoten. Modal Project Manager diberi kepemilikan layout sehingga transformasi legacy tidak menimpa hasil final Closed.
- Runtime/CSS yang sebelumnya disisipkan saat build Closed dimasukkan ke sumber. Dua referensi aset yang sudah hilang di Closed dibersihkan.
- Resep deployment dan auto-patch diarsipkan di `closed-workflows/`, di luar direktori aktif GitHub Actions pada cabang ini. Tidak ada deployment atau merge ke Main.
- Titik pemilihan backend tersedia sebelum client pertama dibuat. Hanya adapter Cloud yang diimplementasikan; migrasi LAN tetap dijeda.

## Validasi dan bukti

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| Perbandingan teks, kontrol/tombol/disabled/href/handler, computed style dan geometri terpilih | 55/55 cocok | `ui-equivalence.json` |
| Lima role; enam tab detail; modal proyek dan konfirmasi; Master; user/permissions; laporan; halaman sekunder; mobile | Lulus | Harness `browser-audit.cjs`, fixture lokal |
| Validasi wajib dan tidak ada write sebelum konfirmasi proyek | Lulus | Assertion harness |
| Implementasi lengkap 24 handler CRUD/auth yang aktif | Identik dengan Closed | `business-handlers.json` |
| Unit backend/repository: coalescing, isolasi auth/filter, invalidasi write/Edge, abort, lock rule, paging, batch, reuse detail | 10/10 lulus | `backend.test.cjs`, `repository.test.cjs` |
| Suite engine/integration dan UI legacy | 15/15 lulus | `engine-and-legacy-tests.json` |
| Error JavaScript, aset hilang, permintaan eksternal pada hasil akhir | Tidak ditemukan | `foundation-browser.json` |

File rumus engine tidak berubah dari Closed (`engine-sources.json`). CI read-only untuk cabang Foundation menjalankan syntax, unit test dan suite Closed; aturan CI lama juga sudah mengikuti struktur Foundation. Pemeriksaan shell ketiga workflow tersebut lulus secara lokal. Assertion UI legacy disesuaikan dengan pemindahan CSS/workflow dan penggunaan repository bersama; dua assertion string yang sudah tidak sesuai sumber Closed dibetulkan. Perbandingan browser tetap menggunakan hasil artifact Closed tanpa perubahan sebagai referensi.

Tidak ada login atau API database MASTER, SQL, migration, perubahan schema, RLS, data, maupun pemanggilan Edge Function nyata. CRUD nyata, posting transaksi, latensi produksi, multiuser bersamaan, SQL/index/RLS, dan integrasi data produksi belum diuji. Perbandingan style/geometri menggunakan elemen terpilih, bukan pembandingan seluruh pixel. Hasil ini memvalidasi refactor terhadap fixture Closed; tidak menyatakan readiness deployment produksi atau bahwa seluruh modul legacy sudah dihapus.

## Menjalankan ulang tanpa MASTER

Prasyarat: Python dengan PyYAML, Node, Playwright 1.62.1 dan Chromium. Harness memakai instalasi `playwright` lokal, atau `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; `SIKOYEK_CHROMIUM` opsional menunjuk binary Chromium. Direktori baseline harus kosong dan di luar checkout. Contoh dari root repository:

```sh
python tests/foundation/prepare-baseline.py /tmp/sikoyek-closed-baseline
node --test tests/foundation/backend.test.cjs tests/foundation/repository.test.cjs
for test_file in tests/*.test.js; do node "$test_file" || exit 1; done
SIKOYEK_EXTENDED=1 node tests/foundation/browser-audit.cjs /tmp/sikoyek-closed-baseline /tmp/sikoyek-before.json
SIKOYEK_EXTENDED=1 node tests/foundation/browser-audit.cjs . /tmp/sikoyek-after.json
node tests/foundation/compare.cjs /tmp/sikoyek-before.json /tmp/sikoyek-after.json /tmp/sikoyek-equivalence.json
node tests/foundation/contracts.cjs /tmp/sikoyek-closed-baseline .
```

Harness melarang permintaan eksternal dan memakai fixture SDK sebelum halaman dimuat. Tidak memerlukan kredensial atau akses MASTER. Tanggal aplikasi dibekukan; timer nyata tetap berjalan. Jumlah callback dapat berubah sedikit menurut penjadwalan browser; hasil query/observer dan kontrak UI adalah pemeriksaan utama.
