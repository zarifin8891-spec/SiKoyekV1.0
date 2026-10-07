# Kandidat rollout bersama — 07 Oktober 2026

Dokumen ini merekam kandidat sebelum rollout: Cloud aktif dan database MASTER/KONSTRUVA tidak diubah selama persiapan. Kandidat berasal dari audit Closed dan menggabungkan sejarah Main `543df154885d017b0632832d5f2c19cda1a5ff6a`. LAN tetap dijeda.

## Rekonsiliasi produksi

Delapan modul yang berubah sejak Closed diambil sebagai file statis dari path aktif `Master/` dan `konstruva/`, tanpa menjalankan aplikasi atau API backend. Seluruh 16 respons modul identik dengan Main. HTML aktif dibangun ulang offline dari langkah Python workflow Main dan unified; hash kedua HTML cocok dengan respons aktif. Bukti: `active-static-observation.json` dan `rollback-verification.json`.

| Perubahan sesudah Closed | Keputusan kandidat |
|---|---|
| Health engine V2 | Identik dengan Main: gap progress dikurangi RAP consumption; gap < -5 berisiko, gap < 0 awasi |
| Health integration | Urutan prioritas produksi dipertahankan; client tetap Foundation sesuai tenant |
| Kontrol Biaya V7 | Perhitungan, label, markup dan CSS produksi dipertahankan; render mengikuti perubahan halaman, interval berulang dihapus |
| Cashflow dan Dashboard fallback | Client tunggal Foundation sudah memenuhi koreksi Main; fallback menerima AWASI dan label legacy |
| Filter keuangan V2 dan compatibility V1 | Sumber Main dipertahankan; shell memuat V2; pemasangan listener mengikuti observer bersama |
| Simpan Kategori Keuangan / Metode Pembayaran | Override produksi dipindahkan dari injeksi workflow ke `foundation/master-data-save-fix.js`; tombol asli dan validasi tetap |
| Workflow unified Pages | Diarsipkan, bukan diaktifkan; paket semua tenant kini dibangun sekali |
| SQL, Edge Function, dokumentasi backend Main | Disimpan identik sebagai sumber sejarah; tidak dijalankan dan tidak disertakan pada paket frontend baru |

Pemantau wizard sekarang mencakup modal yang berada di luar `#app`. Pengisian kategori bersifat idempotent agar tidak menimbulkan loop dan menunda pilihan Project Manager. Format tanggal desktop dan picker native pada form proyek mobile cocok dengan snapshot produksi. Empat file engine identik dengan Main (`rollout-engine-sources.json`), 24 handler CRUD/auth identik dengan artifact produksi. Handler tambahan Simpan diuji melalui klik tombol sebenarnya.

## Paket yang disiapkan

Revisi aplikasi bersama: `8b8df8a189496e5575f15ada40193c24b0a6370d6865a4720b9dc5b781c631f8`.

MASTER tetap pada `Master/`; KONSTRUVA pada `konstruva/`. Setiap paket berisi 153 file aplikasi yang sama. Hanya `environment.js` berbeda. Aset gambar ikut dipaketkan. URL script/CSS memakai fingerprint revisi untuk menghindari cache versi sebelumnya, termasuk pemuatan modul dinamis. `rollout-release-manifest.json` mencatat hash sumber dan byte paket; `verify-release.cjs` memverifikasi hash, routing konfigurasi, 338 referensi aset dan absennya alamat database di modul bersama.

Workflow `Prepare SiKoyek common release` hanya menjalankan tes dan menghasilkan artifact `sikoyek-common-cloud-<commit>`. Tidak punya izin Pages, token deployment atau langkah Supabase. Template `deployment/production-pages.yml.template` berada di luar `.github/workflows` dan belum aktif.

## Validasi

- 55/55 snapshot teks, kontrol, computed style dan geometri terpilih cocok dengan artifact Cloud aktif (`active-ui-equivalence.json`). Ini bukan perbandingan pixel seluruh layar.
- 23 unit test backend/config/repository/release/preview lulus, termasuk penolakan paket yang byte-nya berubah.
- 15 suite legacy lulus; tes batas Health sekarang mengacu rumus V2 yang sudah aktif, bukan rumus Closed lama.
- Routing MASTER/KONSTRUVA dan entry sekunder diuji dengan SDK fixture tanpa permintaan produksi.
- 31 pemeriksaan preview browser mencakup CRUD, tombol Simpan dua Data Master, filter laporan aktif, batas Kontrol Biaya V7, role, auth, reset, reload, isolasi dan mobile.
- Syntax 111 file lulus; YAML aktif/template valid; SQL dan paket backend identik dengan Main.

Preview adalah simulasi lokal. RLS, trigger, Edge Function, posting produksi, multiuser dan latensi Supabase belum diuji terhadap database nyata. Pengujian tidak mengirim email atau menulis data produksi.

## Langkah deployment setelah izin produksi

1. Gunakan commit Foundation yang sama dengan artifact CI yang lulus dan fingerprint di atas. Simpan artifact rilis dan cadangan sebelum publikasi.
2. Pastikan Main tidak bergerak sejak commit yang direkonsiliasi; bila berubah, tinjau delta sebelum merge. Kedua workflow lama `pages.yml` dan `unified-pages.yml` harus tetap nonaktif agar tidak menimpa paket satu sama lain.
3. Aktifkan template manual sebagai satu publisher. Ia memerlukan full SHA sumber dan fingerprint yang direview, menjalankan tes dan verifikasi ulang, serta menyimpan artifact cadangan. Tidak melakukan SQL, migration, seed atau deployment Edge Function.
4. Jalankan mode `release` sekali untuk menerbitkan pemilih lingkungan, MASTER dan KONSTRUVA bersama. Database masing-masing tetap menggunakan konfigurasi semula. Klien baru harus ditambahkan ke daftar konfigurasi build yang sama agar ikut rilis berikutnya.
5. Verifikasi artifact/deployment GitHub Pages selesai dan file statis kedua path memilih konfigurasi yang benar. Pengujian akun/data nyata mengikuti izin terpisah pengguna; jangan membuat transaksi uji produksi secara otomatis.

Jika frontend perlu dikembalikan, jalankan workflow manual yang sama dengan mode `restore-cloud-2026-10-07`. Builder cadangan memakai Main SHA yang dipatok dan memeriksa hash HTML terhadap sumber Cloud yang diamati. Pemulihan ini hanya mengembalikan frontend, tidak mengembalikan atau mengubah data backend. Untuk rilis setelah Foundation, simpan dan gunakan artifact rilis sebelumnya yang tepat.

## Persetujuan rollout

Pada 07 Oktober 2026 pengguna menjawab “Kalau sudah oke, boleh” atas permintaan izin deployment frontend MASTER dan KONSTRUVA tanpa perubahan database. Publisher `pages-common.yml` dipersiapkan untuk Main dengan fingerprint pada `release-lock.json`; daftar `configFiles` menentukan seluruh pelanggan dalam satu build. Perubahan dokumentasi audit tidak memicu publikasi ulang. Hasil deployment dicatat terpisah setelah status GitHub Pages dan file statis aktif diverifikasi.
