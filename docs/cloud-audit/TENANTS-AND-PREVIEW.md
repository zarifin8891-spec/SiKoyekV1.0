# Konfigurasi bersama dan preview — 07 Oktober 2026

Tahap ini melanjutkan Foundation setelah audit Closed selesai. Tidak ada merge ke Main, deployment GitHub Pages aktif, atau akses API database MASTER/KONSTRUVA. LAN tetap dijeda.

## Hasil

Semua entry HTML memuat `environment.js` lalu `foundation/config.js`. Seluruh client di modul Dashboard, Health, Decision, Cashflow, fallback keuangan, login, Workspace, Progress dan halaman sekunder memilih backend melalui konfigurasi ini. Alamat/key MASTER yang sebelumnya tersebar dibersihkan. Bridge session laporan memakai key project aktif dan sessionStorage yang sama dengan semua entry.

Konfigurasi tidak valid gagal tanpa fallback ke MASTER. Client eksplisit untuk URL/key lain ditolak dalam lingkungan yang sudah dikonfigurasi. Browser hanya menerima publishable/anon key; secret/service-role key ditolak. Konfigurasi default sumber tetap MASTER sebagai baseline, sedangkan builder menggantinya sesuai paket. Preview memakai `.invalid` dan adapter simulasi lokal.

`deployment/build-release.cjs` membangun semua paket Cloud dari satu kumpulan file dan hash revisi yang sama. MASTER tetap memakai path `Master/` dan KONSTRUVA `konstruva/`. Semua file aplikasi kedua paket identik; satu-satunya perbedaan adalah `environment.js`. Konfigurasi klien baru dapat ditambahkan tanpa mengedit modul aplikasi. Panduan dan template tersedia di `deployment/README.md` dan `deployment/environments/client-template.json`.

Revisi bersama yang diverifikasi: `88decc2397971fed18aeafd49ed892522cfa97367ee2d7cd0bb2e30c8317a466`. Hash sumber per file dan mapping paket: `tenant-release-manifest.json`.

## Preview privat

Preview memakai sumber UI yang sama, dengan bootstrap SDK diganti adapter browser. Data sintetis dipisahkan untuk MASTER, KONSTRUVA dan Klien Baru. Pemilihan role berada di portal preview, bukan ditambahkan ke alur bisnis produksi. Write/auth/user-management berjalan pada simulasi browser, tidak mengirim data ke backend. Data tersimpan lokal per lingkungan dan dapat direset.

Tidak ada Supabase SDK, URL project atau key produksi dalam paket preview. CSP `connect-src 'none'` melarang koneksi, dan pengujian browser juga memblokir serta mencatat seluruh permintaan eksternal. Preview tidak mengirim email. Data/akun dibuat untuk pengujian saja. Penamaan MASTER/KONSTRUVA pada preview menunjukkan lingkungan simulasi, bukan database produksi tersebut.

## Bukti validasi

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| Teks, kontrol, style dan geometri terpilih terhadap artifact Closed | 55/55 cocok | `tenant-ui-equivalence.json` |
| Unit runtime backend, config, repository, release dan preview | 22/22 lulus | `tests/foundation/*.test.cjs` |
| Engine/integrasi/UI legacy | 15/15 suite lulus | `tenant-legacy-tests.json` |
| 24 handler CRUD/auth aktif | Tetap identik dengan Closed | `business-handlers.json` |
| Routing SDK Dashboard/detail/laporan dan lima entry sekunder pada dua paket Cloud | Sesuai project masing-masing | `tenant-routing.json` |
| Project create/edit, Item, RAP, Progress, Transaksi, User create/edit/delete, role, lock, auth, reload, reset, isolasi dan mobile | 25 pemeriksaan lulus | `preview-browser.json` |
| File engine dan SQL/migration | Tidak berubah | Diff terhadap Closed dan tahap Foundation sebelumnya |

Routing Cloud diuji memakai SDK fixture, tanpa permintaan database produksi. Preview melakukan write hanya pada data sintetis browser. Simulasi ini tidak memvalidasi RLS/trigger/SQL, posting nyata, akses multiuser atau performa backend produksi. Rumus engine di sumber produksi tetap Closed; ringkasan data preview dihitung adapter lokal agar respons alur input bisa diamati.

## Tahap setelah pengguna mencoba

Tinjau tampilan dan alur dari preview. Setelah pembaruan Cloud aktif diizinkan, siapkan pipeline deployment yang menghasilkan semua lingkungan dari revisi Foundation yang sama, sambil mempertahankan konfigurasi/backend tiap pelanggan. Sebelum rollout, rekonsiliasi perubahan Main sesudah Closed yang dicatat audit; jangan mengganti produksi dengan checkout Closed mentah atau menghilangkan folder/config KONSTRUVA. Deployment source tidak boleh menjalankan schema, seed, RLS atau migration produksi.
