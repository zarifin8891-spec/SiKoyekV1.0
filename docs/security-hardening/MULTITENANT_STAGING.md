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

## Tahap integrasi berikutnya

1. Uji RPC finansial, Dashboard, Health, Decision Engine, dan seluruh laporan dengan skema yang lebih lengkap. Periksa setiap fungsi berhak istimewa yang mengakses data perusahaan.
2. Jalankan pengujian aplikasi dengan Supabase Auth dan API staging.
3. Cocokkan data dari kedua sumber, termasuk benturan email, kode dan ID. Siapkan pemetaan impor, backup, latihan pemulihan, dan verifikasi sebelum mengajukan persetujuan perubahan produksi.
