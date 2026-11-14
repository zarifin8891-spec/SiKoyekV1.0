# SiKoyek

Aplikasi kontrol proyek berbasis Supabase. Pengembangan SiKoyek Multi berlangsung di branch `main` repository ini.

## Menjalankan SiKoyek Multi secara lokal

1. Salin `multi-perusahaan/environment.example.js` ke `multi-perusahaan/environment.js`. Isi URL dan publishable key dari project Supabase pengembangan.
2. Jalankan server statis dari akar repository, misalnya `python -m http.server 8000`.
3. Buka `http://localhost:8000/multi-perusahaan/`.

## Verifikasi

Jalankan `node --test tests/foundation/*.test.cjs` dan tes JavaScript dalam `tests/`. Workflow `test-company-database.yml` menguji skenario perusahaan pada PostgreSQL terisolasi.

## Distribusi

Repository distribusi adalah [KavioSistem/SiKoyek](https://github.com/KavioSistem/SiKoyek). File paket MASTER/KONSTRUVA di `deployment/` dan `deployment-package-v1.0/` masih dirujuk oleh tes atau prosedur pemulihan. Workflow publikasi GitHub Pages lama sudah dipensiunkan.
