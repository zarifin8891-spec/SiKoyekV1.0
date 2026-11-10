# Uji satu database untuk SiKoyek

Prototipe ini memakai satu database PostgreSQL kosong dengan data sintetis MASTER dan KONSTRUVA. SQL pengujian berada di `tests/security`. Urutan migrasi aplikasi saat ini tidak memuat prototipe.

## Batas akses

- Satu profil aktif menentukan satu perusahaan. Role harus berasal dari perusahaan yang sama.
- Row Level Security memeriksa perusahaan dan izin modul. Perusahaan penulisan baru berasal dari profil akun di database.
- Foreign key memastikan penempatan karyawan dan transaksi tetap terhubung ke proyek atau karyawan milik perusahaan yang sama.
- Kode karyawan dan nama role bisa digunakan ulang di perusahaan berbeda.

## Jalankan uji

Gunakan database PostgreSQL 17 yang baru dibuat khusus untuk pengujian dan mempunyai ekstensi `btree_gist`. Fixture memasang tabel dan role uji. Jalankan dari root repositori dengan URL database yang kosong dan bersifat lokal.

```sh
psql "$SIKOYEK_DISPOSABLE_TEST_URL" -X -f tests/security/postgres-multitenant-run.sql
```

Uji memeriksa kedua Admin, izin Pelaksana, akun nonaktif, baca dan tulis lintas perusahaan, serta agregat jumlah karyawan. Identitas pengguna disimulasikan melalui `auth.uid()` milik fixture.

## Satu halaman login

Build staging menerima satu konfigurasi proyek uji. Halaman masuk memakai Supabase Auth dari proyek tersebut. Setelah autentikasi, aplikasi memanggil `sikoyek_current_company()` tanpa mengirim ID perusahaan. Fungsi membaca perusahaan aktif milik akun dari database dan mengikuti kebijakan akses yang sama. Sesi tanpa perusahaan aktif gagal membuka aplikasi.

```sh
node deployment/build-release.cjs --shared-staging /absolute/output /absolute/shared-test.json
node deployment/verify-release.cjs /absolute/output
```

Konfigurasi memakai format `deployment/environments/*.json` dengan URL proyek uji dan publishable key. Opsi ini menolak referensi produksi MASTER dan KONSTRUVA. Browser staging mengarahkan administrasi ke `user-management-shared`. Pada proyek bersama, pasang hanya endpoint ini dan RPC izin role khusus perusahaan. Endpoint membaca perusahaan dari akun terverifikasi dan menolak target akun atau role milik perusahaan lain. Uji jalur Edge memakai backend sintetis.

Uji browser memakai simulasi SDK dan mencakup kedua akun, pemuatan ulang sesi, keluar, serta akun tanpa keanggotaan. PostgreSQL lokal memeriksa fungsi identitas perusahaan dan pemisahan data. Uji Supabase Auth sungguhan masih diperlukan pada skema staging lengkap.

## Dashboard dan laporan

Fixture memasang view pelaporan referensi dan lima RPC yang membatasi proyek ke perusahaan aktif dari sesi. Batas tambahan pada referensi progres mencegah catatan proyek sendiri memakai item kerja perusahaan lain. Ringkasan menyembunyikan progress dan Health jika role hanya punya izin Keuangan.

Uji PostgreSQL mencakup kontrak, ringkasan, detail, Cost Control, dan pengecekan siklus proyek. Uji browser memuat hasil SQL sintetis untuk memastikan panel Health, Decision Engine, Kinerja Proyek, dan Laporan Keuangan menampilkan perusahaan yang sesuai. Definisi view dan fungsi pada dump skema produksi masih perlu dicocokkan saat latihan migrasi.

## Tahap integrasi berikutnya

1. Cocokkan skema aktual kedua sumber, termasuk view, fungsi berhak istimewa, dan format data lama. Uji perubahan pada salinan terisolasi.
2. Jalankan pengujian aplikasi dengan Supabase Auth dan API staging.
3. Cocokkan data dari kedua sumber, termasuk benturan email, kode dan ID. Siapkan pemetaan impor, backup, latihan pemulihan, dan verifikasi sebelum mengajukan persetujuan perubahan produksi.

## Latihan impor sesuai audit skema

Jalankan latihan terpisah pada database PostgreSQL 17 lokal yang kosong. Gunakan cluster sekali pakai karena skrip membuat role database uji. Latihan memakai skema referensi lengkap, penyesuaian nullability dan presisi dari MASTER, serta data sintetis KONSTRUVA. Skrip menutup tahap impor dengan rollback.

```sh
psql "$SIKOYEK_DISPOSABLE_TEST_URL" -X -f tests/security/postgres-multitenant-rehearsal.sql
```

- Selesaikan pembatasan RLS, akses view finansial, dan panggilan langsung ke fungsi status lama sebelum kedua perusahaan berbagi database.
- Nama role, kode proyek, nama kategori, metode bayar, dan kode serta nama pengawas memiliki keunikan per perusahaan. Email login dan identitas pengguna tetap unik di layanan Auth bersama.
- Cocokkan role berdasarkan nama perusahaan dan role. Cocokkan izin berdasarkan modul dan aksi yang dinormalisasi. Audit menemukan pasangan izin yang sama pada saat pemeriksaan. Ulangi perbandingan pada snapshot yang akan dimigrasikan.
- Periksa profil tanpa Auth, Auth tanpa profil, email bentrok, nilai wajib yang kosong, dan nilai numerik yang dapat dibulatkan atau melampaui presisi target. Tentukan penanganannya sebelum memindahkan akun atau data.
- Jalankan rekonsiliasi setelah impor. Cocokkan jumlah akun dan data referensi, lalu pastikan jumlah proyek, nilai kontrak, RAP, transaksi, dan progress MASTER tetap sama. Verifikasi RLS dari kedua akun setelah impor dan pastikan user tanpa perusahaan tetap tertolak.
- Ambil backup konsisten kedua sumber, verifikasi bahwa backup dapat dipulihkan pada lingkungan terpisah, dan siapkan rollback sebelum meminta persetujuan rilis. Latihan sintetis tidak menguji pemulihan backup aktual, migrasi Supabase Auth, atau deployment.
