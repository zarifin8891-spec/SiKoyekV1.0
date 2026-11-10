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

## Tahap integrasi berikutnya

1. Sambungkan satu Supabase Auth ke profil perusahaan dan gunakan satu halaman masuk. Verifikasi sesi, akun tanpa perusahaan, logout, dan akun nonaktif.
2. Terapkan batas perusahaan ke jalur API yang berjalan dengan hak istimewa. Uji fungsi pengelolaan pengguna dan role, RPC finansial, Dashboard, Health, Decision Engine, dan seluruh laporan memakai skema yang lebih lengkap.
3. Cocokkan data dari kedua sumber, termasuk benturan email, kode dan ID. Siapkan pemetaan impor, backup, latihan pemulihan, dan verifikasi sebelum mengajukan persetujuan perubahan produksi.
