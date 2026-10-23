# Panduan Lengkap Deploy PKBM Bina Mandiri ke VPS (Ubuntu / Debian)

Dokumen ini adalah panduan langkah demi langkah untuk melakukan deploy aplikasi **PKBM Bina Mandiri** (Frontend React Vite + Backend Express Node.js + Database MySQL) ke server VPS.

---

## 1. Struktur Folder Proyek yang Rapi

Struktur proyek telah dirapikan agar siap di-upload ke VPS tanpa file sampah:

```text
pkbm/
├── backend/                       # REST API Backend (Express.js)
│   ├── config/                    # Konfigurasi Database (db.js) & Multer (multer.js)
│   ├── controllers/               # Controller logika bisnis per modul
│   ├── middlewares/               # authMiddleware (JWT & Role checking)
│   ├── migrations/                # Script migrasi skema
│   ├── models/                    # Query database MySQL (mysql2/promise)
│   ├── routes/                    # Definisi endpoint Express per modul
│   ├── scripts/                   # Script utility (cek hash, uji db, test env)
│   ├── seeds/                     # Data awal (seeder NIS & mapel)
│   ├── uploads/                   # Folder penyimpanan file upload (berkas, tugas, dll)
│   │   ├── bukti_bayar/
│   │   ├── kartu_ujian/
│   │   ├── materi/
│   │   ├── profil/
│   │   ├── rps/
│   │   ├── spmb/
│   │   └── tugas/
│   ├── .env.example               # Contoh konfigurasi environment backend
│   ├── ecosystem.config.cjs       # Konfigurasi PM2 Process Manager
│   ├── package.json
│   ├── pkbm_bina_mandiri.sql      # Dump Database MySQL siap import
│   └── server.js                  # Entry point server Express
│
├── frontend/                      # Web App Single Page Application (React Vite)
│   ├── public/                    # Asset publik statis (favicon, logo)
│   ├── src/                       # Komponen, halaman, konteks, dan utils
│   │   ├── components/            # Sidebar, ProtectedRoute, ProfileEditorCard, dll
│   │   ├── pages/
│   │   │   ├── admin/             # Dashboard, SPMB, Siswa, Tagihan, Ujian, dll
│   │   │   ├── public/            # HomePage, LoginPage, DaftarSpmbPage, 404
│   │   │   ├── siswa/             # Ruang Belajar, Materi, Tugas, Ujian, dll
│   │   │   ├── tutor/             # Kelas, Absensi, Ujian Tutor
│   │   │   └── pimpinan/          # Dashboard Eksekutif
│   │   ├── services/
│   │   │   └── api.js             # Client Axios terpusat & helper toAssetUrl
│   │   ├── App.jsx                # Router & SEO Meta Manager
│   │   ├── main.jsx
│   │   └── index.css              # Design system & utility styles
│   ├── .env.example               # Contoh konfigurasi env frontend
│   ├── .env.production            # Konfigurasi produksi (default: /api)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js             # Konfigurasi Vite & proxy
│
├── deploy/                        # Template deployment server
│   ├── nginx/
│   │   └── pkbmbinamandiri.conf   # Template Nginx Reverse Proxy & SSL
│   └── systemd/
│       └── pkbm-backend.service   # Alternatif systemd jika tanpa PM2
│
├── docs/                          # Dokumentasi, Roadmap, SRS, dan Spesifikasi
│   ├── specs/                     # Dokumen SRS lengkap
│   ├── plans/                     # Technical plans
│   ├── Catatan Penting.pdf
│   └── Roadmap_PKBM_Bina_Mandiri.pdf
│
└── .gitignore                     # Git ignore komprehensif
```

---

## 2. Persiapan Server VPS

Login ke server VPS melalui SSH:
```bash
ssh root@IP_VPS_ANDA
```

Perbarui paket sistem dan pasang dependensi dasar:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-server
```

### Pasang Node.js 20 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v   # Pastikan v20.x terpasang
npm -v
```

---

## 3. Setup Database MySQL & Import Data

1. Masuk ke prompt MySQL:
```bash
sudo mysql
```

2. Buat database dan user khusus aplikasi:
```sql
CREATE DATABASE pkbm_bina_mandiri CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pkbm_user'@'localhost' IDENTIFIED BY 'PasswordKuatAnda123!';
GRANT ALL PRIVILEGES ON pkbm_bina_mandiri.* TO 'pkbm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. Import skema dan data awal dari file `pkbm_bina_mandiri.sql`:
```bash
mysql -u pkbm_user -p pkbm_bina_mandiri < /var/www/pkbm/backend/pkbm_bina_mandiri.sql
```

---

## 4. Setup Backend

1. Letakkan kode di folder `/var/www/pkbm`:
```bash
sudo mkdir -p /var/www/pkbm
sudo chown -R $USER:$USER /var/www/pkbm
# (Upload atau git clone repository ke /var/www/pkbm)
```

2. Masuk ke folder backend dan pasang dependensi:
```bash
cd /var/www/pkbm/backend
npm install --production
```

3. Buat file `.env` dari `.env.example`:
```bash
cp .env.example .env
nano .env
```
Sesuaikan nilainya:
```env
PORT=8000
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pkbm_user
DB_PASSWORD=PasswordKuatAnda123!
DB_NAME=pkbm_bina_mandiri

JWT_SECRET=buat_kunci_acak_yang_panjang_dan_rahasia_disini_2026
JWT_EXPIRES_IN=7d

FRONTEND_URLS=https://pkbmbinamandiri.sch.id,https://www.pkbmbinamandiri.sch.id
```

4. Uji koneksi database:
```bash
npm run test:db
```
Jika sukses, akan muncul pesan:
`✅ Koneksi database berhasil via pool MySQL!`

5. Jalankan backend menggunakan PM2:
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Untuk melihat log backend:
```bash
pm2 logs pkbm-backend
```

---

## 5. Build & Setup Frontend

1. Masuk ke folder frontend:
```bash
cd /var/www/pkbm/frontend
npm install
```

2. Buat file `.env` di folder frontend:
```bash
cp .env.example .env
```
Isi file `frontend/.env`:
```env
# Gunakan path relatif /api (Sangat direkomendasikan jika satu domain di Nginx)
VITE_API_URL=/api
```
*Keuntungan `VITE_API_URL=/api`: Tidak ada masalah CORS, HTTPS otomatis cocok, dan tidak perlu ganti IP saat domain berubah.*

3. Lakukan build produksi:
```bash
npm run build
```
Hasil build akan berada di `/var/www/pkbm/frontend/dist`.

---

## 6. Konfigurasi Nginx & SSL (Certbot)

1. Salin template Nginx yang telah disediakan:
```bash
sudo cp /var/www/pkbm/deploy/nginx/pkbmbinamandiri.conf /etc/nginx/sites-available/pkbm.conf
```

2. Buka dan sesuaikan domain Anda jika berbeda:
```bash
sudo nano /etc/nginx/sites-available/pkbm.conf
```

3. Aktifkan konfigurasi Nginx dan restart:
```bash
sudo ln -s /etc/nginx/sites-available/pkbm.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Pasang SSL gratis Let's Encrypt dengan Certbot:
```bash
sudo certbot --nginx -d pkbmbinamandiri.sch.id -d www.pkbmbinamandiri.sch.id
```

---

## 7. Checklist Perbaikan API & VPS (Sudah Diterapkan)

Semua perbaikan penting agar aplikasi tidak mengalami error API saat diakses di VPS:

1. **Auto-Normalize API URL**: `frontend/src/services/api.js` otomatis menambahkan `/api` jika baseURL belum memilikinya, sehingga terhindar dari error `404 Endpoint Not Found`.
2. **Eliminasi Hardcoded `localhost:3000`**: Semua link unduh file tugas (`KelasTutor.jsx`) dan berkas SPMB (`SpmbAdmin.jsx`) kini menggunakan helper universal `toAssetUrl()`.
3. **CORS Lengkap**: Backend `server.js` telah mendukung method `GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD` serta credential cookies & dynamic origin.
4. **Trust Proxy**: Backend telah mengaktifkan `app.set('trust proxy', 1)` agar mendeteksi protokol HTTPS Nginx dengan benar dan tidak memicu *Mixed Content Error*.
5. **Normalisasi Upload Multer**: File upload di backend otomatis tersimpan pada path absolut `backend/uploads/<kategori>` dan nama path di database selalu berformat forward-slash konsisten (`uploads/...`).
6. **Redirect 401 & ProtectedRoute**: Session timeout atau akses tanpa login secara konsisten mengarahkan pengguna ke `/login`.
7. **Pembersihan Root Directory**: File sementara (`var/`), loose test scripts (`check-env.js`, `check-pass.js`, `make-hash.js`, `test-db.js`) dipindah ke `backend/scripts/`, dan dokumen SRS masuk ke `docs/`.
