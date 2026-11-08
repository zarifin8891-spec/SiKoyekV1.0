# Rencana rilis SiKoyek Cloud Security Hardening V1

Status 8 November 2026 WIB. Draf untuk PR #25. Persetujuan rilis dari pemilik diperlukan sebelum perubahan produksi.

## Bukti dan batas pengujian

- Baseline produksi GitHub `15473331c88f5464b271e72755c0690277ad4d62`. Cabang kandidat `security/hardening-v1-staging-20261108`.
- Pemeriksaan katalog dengan transaksi baca-saja pada MASTER dan KONSTRUVA mencatat 15 tabel, 41 policy lama, 7 fungsi, 11 trigger, dan dua view per tenant. Kedua database menggunakan PostgreSQL 17.11. MASTER memakai izin `KEUANGAN`. KONSTRUVA memakai `FINANCE`. Definisi view berbeda.
- Staging lokal PostgreSQL 17.5 (PGlite) menjalankan lima skrip kandidat pada dua skema yang dibangun kembali dari katalog, dengan pengguna serta proyek sintetis. Verifikasi mencakup lima role, profil nonaktif dan tidak terdaftar, nilai kontrak dan transaksi, redaksi progress pada ringkasan Keuangan, insert progress oleh Pelaksana, serta edit proyek oleh Marketing. Proyek tanpa nilai kontrak dengan RAP terisi tetap muncul dalam ringkasan. Pengujian terpisah memakai fixture CI untuk atomic rollback, RLS 15 tabel, lifecycle, dan revoke fungsi pemeliharaan.
- Browser preview lulus 34 pemeriksaan, termasuk Dashboard lima role, isolasi tenant, alur CRUD Admin, laporan Progress berbobot, dan Kinerja Proyek untuk Admin serta Keuangan.
- Drill backup dan rollback lokal lulus untuk kedua skema sintetis. Snapshot berhasil dipulihkan. Rollback skema mengembalikan policy, grant, view dan akses fungsi yang dimodelkan, serta mempertahankan baris proyek yang ditulis setelah migrasi.
- Uji HTTP PostgREST 14.1 lokal dengan JWT sintetis bertanda tangan lulus pada kedua skema. Mencakup akses lima role, profil nonaktif dan tidak terdaftar, sesi anonim, serta token kedaluwarsa.
- Edge `user-management` lulus 19 tes unit dan pengecekan tipe Deno. Uji HTTP Deno dengan SDK terkunci dan PostgREST lokal lulus di kedua skema. Admin dapat memanggil RPC atomic dan role lain ditolak. Endpoint Auth pada uji ini sintetis.
- Staging berbasis katalog mereplikasi skema publik dan memakai stub `auth.uid()`. Login, refresh sesi, alur CRUD Auth pada Edge, serta pemulihan backup Supabase perlu diuji pada instalasi Supabase lokal terisolasi dengan pengguna sintetis. Tinjau perbedaan owner, ACL kolom, extension, indeks, dan konfigurasi platform yang tidak tercakup dalam rekonstruksi.
- Uji untuk setiap tenant dengan Admin, Direktur, Keuangan, Marketing dan Pelaksana. Cocokkan daftar proyek, penguncian proyek, Dashboard, Health, Decision, laporan, ekspor, serta CRUD yang memang diizinkan. Uji sesi anon, token kedaluwarsa, profil dinonaktifkan, perubahan role, dan permintaan non-Admin ke Edge. Uji operasi pengelolaan pengguna dan pemulihan perubahan role saat operasi gagal.

## Backup dan drill

1. Buat direktori terenkripsi terpisah untuk masing-masing tenant. Catat tanggal WIB, ref proyek, SHA dan manifest frontend aktif, versi Edge Function dan daftar nama variabel konfigurasi, versi PostgreSQL, status migrasi, kebijakan RLS, definisi view/fungsi, dan ACL termasuk grant kolom. Ambil data produksi hanya untuk cadangan pemulihan resmi. Gunakan data sintetis untuk pengujian aplikasi.
2. Siapkan ekspor logis melalui Supabase CLI `db dump` untuk role, skema dan data. Gunakan koneksi yang diverifikasi terpisah untuk MASTER (`mmkusplegmittrlxqxby`) dan KONSTRUVA (`fadxsycdgzuctvmhhjty`), dengan kredensial di secret store. Periksa cakupan skema Auth dan Storage. Ekspor objek Storage terpisah jika ada, karena dump database menyimpan metadata saja. Simpan hash, ukuran dan waktu setiap artefak.
3. Uji pemulihan di lingkungan terisolasi yang berwenang menangani cadangan tersebut. Verifikasi migrasi, row count, foreign key, role, login, pembacaan data, CRUD, dan trigger. Siapkan rollback skema per tenant dari snapshot persis sebelum rilis. Uji rollback pada clone dengan data tambahan yang ditulis setelah migrasi agar data baru tetap ada. Simpan urutan pemulihan dan durasinya.
4. Cadangkan frontend dengan builder dan manifest dari SHA aktif yang terverifikasi. Simpan kode Edge aktif secara terpisah untuk masing-masing tenant. Versi Edge dan ACL produksi dapat berbeda. Verifikasi hasil restore frontend cocok dengan hash sumber aktif.

Panduan Supabase Free dan batas cakupan dump tersedia di [Database Backups](https://supabase.com/docs/guides/platform/backups).

## Gerbang publikasi

- Bekukan satu SHA kandidat. Pastikan CI pada SHA itu lulus, uji Supabase lokal kedua tenant tuntas, dan backup serta rollback teruji. Cek ulang katalog produksi terhadap snapshot staging. Jika ada drift, ulangi uji untuk perubahan yang ditemukan.
- Tinjau deployment GitHub Pages. Publisher aktif terpicu dari `main` dan menghasilkan kedua tenant dari manifest bersama. Tetapkan dan latih mekanisme canary yang mempertahankan frontend lama tenant kedua sampai DB-nya siap. Alternatif dengan publisher bersama memerlukan jendela pemeliharaan pada kedua tenant dan koordinasi agar frontend lama tidak membaca DB yang sudah diperketat.
- Minta persetujuan pemilik atas SHA, urutan tenant, jendela pemeliharaan dan titik rollback. Usulan urutan KONSTRUVA lalu MASTER, karena ACL fungsi pemeliharaan KONSTRUVA sudah lebih ketat pada baseline.
- Pada tenant pertama, mulai dari kondisi pemeliharaan. Terapkan urutan yang diuji pada staging. Kandidat mencakup full RLS, proyeksi finansial, lifecycle, revoke fungsi pemeliharaan, dan RPC atomic. Verifikasi SQL dan API, lalu pasang Edge Function dan frontend yang kompatibel dalam jendela yang sama. Jalankan smoke test terhadap role yang tersedia dan ulangi pengecekan positif serta negatif. Setelah tenant pertama stabil dan pemeriksaan lulus, ulangi untuk tenant kedua.
- Hentikan rollout saat akses keuangan bocor, role sah kehilangan akses, aksi CRUD yang sah gagal, atau Dashboard/Health/Decision menunjukkan selisih yang tidak dijelaskan. Pertahankan mode pemeliharaan. Pulihkan ACL, policy, definisi view dan trigger dari snapshot spesifik tenant serta hapus RPC baru dalam urutan yang teruji. Pulihkan Edge dan frontend pasangannya sebelum membuka akses. Gunakan restore data penuh hanya bila diperlukan untuk pemulihan data dan setelah menilai transaksi yang terjadi sejak backup.
