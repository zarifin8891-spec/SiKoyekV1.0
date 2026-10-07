# Satu sumber SiKoyek, banyak lingkungan

MASTER, KONSTRUVA dan klien berikutnya dibangun dari checkout serta revisi aplikasi yang sama. Tidak ada edit alamat database per file atau pemeliharaan cabang aplikasi per pelanggan. `environment.js` adalah satu-satunya file aplikasi yang berbeda antarpaket Cloud.

`foundation/config.js` memvalidasi konfigurasi dan menolak konfigurasi hilang, template yang belum diisi, secret/service-role key dan URL tidak sesuai. Modul utama, Health, Decision, finance fallback, login dan seluruh halaman sekunder mendapatkan client lewat `SiKoyekBackend.getClient()` tanpa alamat/key tersendiri. Session tetap dalam `sessionStorage`, dengan key project masing-masing.

## Paket Cloud, tanpa deployment

```sh
node deployment/build-release.cjs /absolute/empty-output
```

Menghasilkan pemilih lingkungan, `Master/` dan `konstruva/`. Path MASTER memakai huruf besar sesuai URL aktif. Kedua paket memiliki seluruh file UI yang identik dan fingerprint `applicationRevision` yang sama. Hanya konfigurasi yang berbeda. `release-manifest.json` mencatat hash setiap sumber aplikasi. Builder tidak login, tidak menghubungi database, tidak menerapkan SQL dan tidak melakukan deployment.

Klien baru: salin `environments/client-template.json`, isi ID/nama, URL Supabase dan publishable key project klien, lalu sertakan file itu bersama konfigurasi lain:

```sh
node deployment/build-release.cjs /absolute/empty-output deployment/environments/master.json deployment/environments/konstruva.json /absolute/client-config.json
```

ID/direktori harus unik dan tidak boleh berisi traversal path. Pakai schema/RLS/Edge Functions yang kompatibel dengan SiKoyek; builder tidak membuat atau mengubah backend klien. Template belum diisi harus gagal, bukan tersambung diam-diam ke MASTER.

Untuk rollout berikutnya, uji satu revisi, buat seluruh paket dari revisi tersebut, pertahankan konfigurasi tiap klien, lalu deploy paket-paket yang dipilih bersama. Sumber bersama tidak berarti Cloud aktif diperbarui otomatis saat cabang Foundation berubah. Deployment produksi belum diaktifkan pada cabang ini.

## Preview terisolasi

```sh
node deployment/build-release.cjs --preview /absolute/empty-preview
```

Preview berisi MASTER, KONSTRUVA dan Klien Baru dengan endpoint `.invalid`, tanpa Supabase SDK atau kredensial produksi. CSP `connect-src 'none'` memblokir koneksi. Adapter browser meniru kontrak yang dipakai UI, termasuk pembacaan, write, hitungan, paging, auth dan user-management. Data sintetis tersimpan di `localStorage` dengan namespace per lingkungan; session/role berada di `sessionStorage`. Reset hanya membersihkan data lingkungan preview yang dipilih.

Portal preview dapat masuk langsung sebagai lima role contoh. Setelah Keluar, gunakan `admin@preview.invalid` / `Preview123!`, atau email `nama-role@preview.invalid`. Akun yang dibuat di preview memakai password uji yang dimasukkan. Tidak ada email atau database nyata.

Preview menguji pengalaman UI dan kontrak adapter, bukan RLS, trigger, multiuser atau latensi Supabase nyata. Hitungan ringkasan adalah simulasi lokal; engine Health/Decision/Cashflow tetap memakai file Closed yang sama. LAN tetap dijeda.
