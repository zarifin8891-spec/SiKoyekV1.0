# Login satu pintu SiKoyek untuk staging

Gunakan dua proyek Supabase uji dengan akun dan data sintetis. Gateway dapat berjalan di salah satu proyek uji. Pertahankan baseline kebijakan akses SiKoyek agar akun hanya bisa membaca profil sendiri. Build dan gateway memblokir kedua referensi Supabase produksi yang tercatat.

1. Buat pengguna Auth dan profil aktif dengan role aktif di masing-masing proyek uji. Tentukan satu tujuan untuk setiap alamat email. Jika email sama digunakan di dua tenant, buat identitas staging yang berbeda sebelum menyiapkan pemetaan.
2. Atur secret Edge Function `SIKOYEK_STAGING_LOGIN_CONFIG` dengan struktur berikut. `origin` adalah origin HTTPS dari situs staging. Gunakan publishable key masing-masing proyek uji. Simpan pemetaan di secret gateway dan masukkan kata sandi hanya melalui form login.
3. Deploy `tenant-login` ke proyek gateway yang terisolasi. Karena form dipakai sebelum pengguna login, deploy dengan `--no-verify-jwt`. Batasi penggunaan ke akun sintetis. Gateway menggunakan password grant dan pembatasan Supabase Auth di backend tenant.
4. Build dengan `node deployment/build-release.cjs --staging-login <endpoint-https> <direktori-output-kosong> <master-uji.json> <konstruva-uji.json>`. Gunakan endpoint `https://<ref-uji>.supabase.co/functions/v1/tenant-login`. Jalankan `node deployment/verify-release.cjs <direktori-output>`, lalu sajikan di origin yang terdaftar. Build biasa tetap menggunakan halaman masuk per lingkungan.
5. Uji login dengan akun kedua tenant, email yang belum dipetakan, kata sandi salah, profil nonaktif, role nonaktif, dan logout. Periksa URL dan pastikan data yang terlihat sesuai tenant. Periksa rate limit dan perilaku MFA/recovery sebelum mempertimbangkan rilis produksi. Form staging mendukung login email dan kata sandi.

```json
{
  "origin": "https://staging.example.invalid",
  "tenants": {
    "master": { "url": "https://stagingmaster.supabase.co", "key": "sb_publishable_TEST_MASTER" },
    "konstruva": { "url": "https://stagingkonstruva.supabase.co", "key": "sb_publishable_TEST_KONSTRUVA" }
  },
  "accounts": [
    { "email": "master@preview.invalid", "tenant": "master" },
    { "email": "konstruva@preview.invalid", "tenant": "konstruva" }
  ]
}
```
