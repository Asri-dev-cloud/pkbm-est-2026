# Tech Plan Modul Pembayaran Ujian dan Kartu Ujian

## 1. Tujuan Teknis

Dokumen ini menerjemahkan SRS modul pembayaran ujian dan kartu ujian ke rancangan implementasi teknis.

Target implementasi:

- siswa hanya bisa ikut ujian bila status kelayakan `layak`
- Admin TU memverifikasi pembayaran ujian
- peserta ujian dibentuk otomatis dari `paket_ujian` aktif
- kartu ujian PDF disimpan permanen di server

## 2. Tabel Baru yang Disarankan

### 2.1 `periode_ujian`

Tujuan:

- menyimpan periode resmi seperti `UTS Ganjil 2026/2027`
- menjadi induk untuk peserta ujian dan kartu ujian

Kolom:

- `id` int unsigned PK AI
- `nama_periode` varchar(120) not null
- `jenis_ujian` enum('uts','uas') not null
- `semester` enum('ganjil','genap') not null
- `tahun_ajaran_id` int unsigned not null
- `tanggal_mulai` date not null
- `tanggal_selesai` date not null
- `is_active` tinyint(1) not null default 1
- `created_at` datetime not null default current_timestamp
- `updated_at` datetime null

Constraint:

- foreign key `tahun_ajaran_id` -> `tahun_ajaran.id`
- unique opsional: `(jenis_ujian, semester, tahun_ajaran_id)`

### 2.2 `peserta_ujian`

Tujuan:

- menyimpan status administrasi dan kelayakan satu siswa pada satu periode ujian

Kolom:

- `id` int unsigned PK AI
- `warga_belajar_id` int unsigned not null
- `rombel_id` int unsigned not null
- `periode_ujian_id` int unsigned not null
- `status_pembayaran` enum('belum_bayar','menunggu_verifikasi','ditolak','lunas') not null default 'belum_bayar'
- `status_kelayakan` enum('belum_layak','layak') not null default 'belum_layak'
- `verified_by` int unsigned null
- `verified_at` datetime null
- `catatan_verifikasi` text null
- `kartu_ujian_file` varchar(255) null
- `created_at` datetime not null default current_timestamp
- `updated_at` datetime null

Constraint:

- foreign key `warga_belajar_id` -> `warga_belajar.id`
- foreign key `rombel_id` -> `rombel.id`
- foreign key `periode_ujian_id` -> `periode_ujian.id`
- foreign key `verified_by` -> `users.id`
- unique `(warga_belajar_id, periode_ujian_id)`

### 2.3 `peserta_ujian_mapel`

Tujuan:

- menyimpan daftar mapel ujian yang benar-benar diikuti peserta pada periode itu

Kolom:

- `id` int unsigned PK AI
- `peserta_ujian_id` int unsigned not null
- `mapel_id` int unsigned not null
- `paket_ujian_id` int unsigned not null
- `created_at` datetime not null default current_timestamp

Constraint:

- foreign key `peserta_ujian_id` -> `peserta_ujian.id`
- foreign key `mapel_id` -> `mata_pelajaran.id`
- foreign key `paket_ujian_id` -> `paket_ujian.id`
- unique `(peserta_ujian_id, mapel_id)`

## 3. Folder File PDF

Disarankan folder:

- `backend/uploads/kartu-ujian/`

Format nama file:

- `kartu-ujian-{periodeUjianId}-{pesertaUjianId}.pdf`

Contoh:

- `kartu-ujian-3-21.pdf`

## 4. Alur Data Utama

### 4.1 Saat Periode Ujian Dibuka

1. super admin atau admin membuat `periode_ujian`
2. sistem membaca `paket_ujian` aktif
3. sistem membentuk daftar `peserta_ujian` berdasarkan rombel yang punya paket ujian aktif
4. sistem mengisi `peserta_ujian_mapel` untuk setiap siswa

### 4.2 Saat Admin TU Verifikasi

1. admin membuka daftar peserta ujian
2. admin memilih peserta
3. admin mengubah `status_pembayaran`
4. jika pembayaran valid, admin dapat set `status_kelayakan = layak`
5. sistem bisa generate kartu ujian PDF

### 4.3 Saat Siswa Membuka Modul Ujian

1. backend cek peserta pada periode ujian aktif
2. backend cek `status_kelayakan`
3. backend cek apakah mapel yang diakses masuk di `peserta_ujian_mapel`
4. jika lolos, siswa boleh lanjut ujian
5. jika tidak lolos, siswa ditolak

## 5. Strategi Pembentukan Peserta Ujian

Rekomendasi implementasi:

- peserta tidak dibuat manual satu-satu
- sistem generate otomatis dari `paket_ujian` aktif

Logika:

1. ambil semua `paket_ujian` aktif
2. filter berdasarkan periode yang relevan jika nanti ada relasi tambahan
3. kelompokkan per `rombel_id`
4. ambil semua `warga_belajar` aktif pada rombel tersebut
5. buat `peserta_ujian`
6. buat `peserta_ujian_mapel` untuk mapel dari paket ujian yang tersedia

Catatan:

- bila satu rombel punya 3 paket ujian mapel aktif, maka semua siswa rombel itu mewarisi 3 mapel ujian

## 6. Endpoint Backend yang Disarankan

### 6.1 Admin / Super Admin

#### Periode Ujian

- `GET /api/periode-ujian`
- `POST /api/periode-ujian`
- `PUT /api/periode-ujian/:id`
- `PATCH /api/periode-ujian/:id/status`

#### Peserta Ujian

- `GET /api/ujian/peserta?periode_ujian_id=...`
- `GET /api/ujian/peserta/:id`
- `POST /api/ujian/peserta/generate`
- `PUT /api/ujian/peserta/:id/verifikasi-pembayaran`
- `PUT /api/ujian/peserta/:id/kelayakan`
- `POST /api/ujian/peserta/:id/generate-kartu`
- `GET /api/ujian/peserta/:id/kartu`

### 6.2 Siswa

- `GET /api/ujian/peserta/saya`
- `GET /api/ujian/peserta/saya/kartu`
- `GET /api/ujian/peserta/saya/mapel`

## 7. Struktur Response yang Disarankan

### 7.1 `GET /api/ujian/peserta/saya`

Response:

```json
{
  "success": true,
  "data": {
    "peserta_ujian_id": 10,
    "periode_ujian": {
      "id": 3,
      "nama_periode": "UTS Ganjil 2026/2027",
      "jenis_ujian": "uts",
      "semester": "ganjil"
    },
    "status_pembayaran": "lunas",
    "status_kelayakan": "layak",
    "kartu_ujian_file": "uploads/kartu-ujian/kartu-ujian-3-10.pdf",
    "mapel": [
      { "id": 2, "nama": "Bahasa Indonesia", "paket_ujian_id": 8 },
      { "id": 3, "nama": "Matematika", "paket_ujian_id": 9 }
    ]
  }
}
```

## 8. Guard Backend Ujian

Perlu middleware atau helper validasi:

- cek user adalah `warga_belajar`
- cari `periode_ujian` aktif
- cari record `peserta_ujian`
- pastikan `status_kelayakan = layak`
- pastikan mapel/`paket_ujian` yang diakses memang milik peserta

Nama helper yang disarankan:

- `validatePesertaUjianAccess`

## 9. Generator PDF

Rekomendasi teknis:

- generate dari template HTML lalu render ke PDF

Isi template:

- logo
- identitas siswa
- periode ujian
- daftar mapel
- NIS
- rombel
- foto profil jika ada

Setelah generate:

1. simpan file PDF ke `uploads/kartu-ujian`
2. simpan path file ke `peserta_ujian.kartu_ujian_file`

## 10. Halaman Frontend yang Dibutuhkan

### 10.1 Admin

- halaman `Periode Ujian`
- halaman `Verifikasi Peserta Ujian`
- halaman detail peserta ujian

### 10.2 Siswa

- panel status ujian
- tombol unduh kartu ujian
- status kelayakan

## 11. Validasi Penting Saat Coding

- jangan generate peserta ujian ganda untuk periode yang sama
- jangan isi `peserta_ujian_mapel` ganda
- kartu ujian hanya boleh digenerate untuk peserta yang sudah `layak`
- jika status pembayaran berubah ke `ditolak`, kartu ujian lama harus dianggap tidak berlaku

## 12. Saran Tahap Coding

Tahap 1:

- migration tabel baru
- model backend
- endpoint periode ujian

Tahap 2:

- generate peserta ujian otomatis
- endpoint admin verifikasi

Tahap 3:

- halaman admin verifikasi peserta ujian
- halaman siswa status ujian

Tahap 4:

- generator PDF kartu ujian
- download kartu ujian
- guard akses ujian
