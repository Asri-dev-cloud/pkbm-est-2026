# SRS Mini: Modul Akademik
## Master Mapel dan Mapel per Rombel

> Dokumen ini menjadi acuan analisis sebelum implementasi fitur pengelolaan mata pelajaran pada ruang belajar. Fokus utama dokumen ini adalah mendefinisikan kebutuhan bisnis, struktur data, hak akses, alur pengguna, validasi, dan rancangan teknis awal agar proses coding lebih terarah dan minim revisi besar.

---

## 1. Latar Belakang

Saat ini fitur `Ruang Belajar` menampilkan beberapa mata pelajaran untuk warga belajar berdasarkan relasi data akademik yang sudah ada. Namun, pengelolaan mata pelajaran tersebut belum memiliki modul administrasi yang jelas dan terpisah.

Akibatnya:
- pengaturan mapel yang tampil di ruang belajar belum terpusat
- perubahan mapel per rombel belum memiliki alur administrasi yang aman
- potensi ketidaksinkronan dengan modul tugas, materi, tutor, dan absensi cukup tinggi

Untuk itu dibutuhkan dua menu terpisah:
- `Master Mapel`
- `Mapel per Rombel`

Pendekatan ini dipilih agar data akademik inti dan data penugasan mapel ke rombel tidak tercampur dalam satu halaman yang membingungkan.

---

## 2. Tujuan Sistem

Modul ini bertujuan untuk:
- mengelola data inti mata pelajaran secara terpusat
- mengatur mapel apa saja yang terpasang pada setiap rombel
- menentukan tutor pengampu untuk mapel tertentu pada rombel tertentu
- menentukan apakah mapel tampil atau tidak di `Ruang Belajar`
- mencegah duplikasi mapel dalam rombel yang sama
- memastikan `Ruang Belajar` membaca dari satu sumber data yang konsisten

---

## 3. Ruang Lingkup

Modul yang dibahas dalam dokumen ini mencakup:
- halaman `Master Mapel`
- halaman `Mapel per Rombel`
- hak akses `super_admin` dan kemungkinan akses terbatas untuk `admin`
- struktur data backend untuk master dan mapping
- integrasi tampilan `Ruang Belajar`

Modul ini tidak mencakup:
- manajemen konten materi
- manajemen tugas
- manajemen absensi
- manajemen ujian
- manajemen nilai rapor

Modul-modul tersebut hanya akan menggunakan hasil konfigurasi dari modul ini.

---

## 4. Struktur Menu

Struktur menu yang disarankan:

```text
Super Admin
└── Akademik
    ├── Master Mapel
    └── Mapel per Rombel
```

---

## 5. Hak Akses

### 5.1 Super Admin
Hak akses penuh:
- tambah mapel
- edit mapel
- aktif/nonaktifkan mapel
- lihat semua mapel
- pasang mapel ke rombel
- ganti tutor pengampu
- aktif/nonaktifkan mapel tampil di ruang belajar
- atur urutan tampil mapel
- hapus mapping mapel dari rombel

### 5.2 Admin
Saran default:
- lihat data `Master Mapel`
- lihat data `Mapel per Rombel`

Status edit untuk `admin` belum diputuskan final. Untuk tahap awal disarankan `view only` agar alur kontrol tetap aman.

### 5.3 Tutor
- tidak memiliki akses CRUD terhadap master mapel
- tidak memiliki akses CRUD terhadap mapping mapel ke rombel
- hanya mengelola konten kelas yang sudah ditetapkan kepadanya

### 5.4 Warga Belajar
- tidak memiliki akses ke modul ini
- hanya melihat hasil akhir di `Ruang Belajar`

---

## 6. Modul 1: Master Mapel

### 6.1 Tujuan
Halaman ini digunakan untuk mengelola data inti mata pelajaran yang berlaku di sistem.

### 6.2 Fungsi Utama
- tambah mapel baru
- edit mapel
- aktif/nonaktifkan mapel
- pencarian mapel
- filter berdasarkan jenjang

### 6.3 Data yang Dikelola
- kode mapel
- nama mapel
- jenjang
- deskripsi
- status aktif

### 6.4 Kolom Tabel
- `Kode Mapel`
- `Nama Mapel`
- `Jenjang`
- `Deskripsi Singkat`
- `Status`
- `Dibuat Pada`
- `Aksi`

### 6.5 Form Tambah/Edit
Field yang dibutuhkan:
- `kode`
- `nama`
- `jenjang`
- `deskripsi`
- `is_active`

### 6.6 Validasi
- `kode` wajib diisi
- `kode` harus unik
- `nama` wajib diisi
- `jenjang` hanya boleh:
  - `paket_a`
  - `paket_b`
  - `paket_c`
  - `semua`
- mapel nonaktif tidak dapat dipasang ke rombel baru

### 6.7 Aturan Bisnis
- mapel yang sudah dipakai di rombel sebaiknya tidak dihapus permanen
- lebih aman menggunakan mekanisme `nonaktif`
- jika mapel sudah nonaktif, sistem dapat menyembunyikannya dari pilihan mapping baru

---

## 7. Modul 2: Mapel per Rombel

### 7.1 Tujuan
Halaman ini digunakan untuk mengatur mapel apa saja yang dimiliki oleh suatu rombel dan siapa tutor pengampunya.

### 7.2 Fungsi Utama
- pilih rombel
- lihat semua mapel yang terpasang di rombel
- tambah mapping mapel ke rombel
- ubah tutor pengampu
- ubah status tampil di `Ruang Belajar`
- atur urutan tampil mapel
- hapus mapping

### 7.3 Data yang Dikelola
- rombel
- mapel
- tutor pengampu
- status tampil
- urutan tampil

### 7.4 Kolom Tabel
- `Rombel`
- `Mapel`
- `Kode`
- `Tutor Pengampu`
- `Status Tampil`
- `Urutan`
- `Aksi`

### 7.5 Form Mapping
Field yang dibutuhkan:
- `rombel_id`
- `mapel_id`
- `tutor_id`
- `is_visible`
- `urutan`

### 7.6 Validasi
- satu rombel tidak boleh memiliki mapel duplikat
- mapel nonaktif dari master tidak dapat dipilih
- `urutan` harus berupa angka valid
- tutor pengampu dapat ditentukan sesuai kebijakan final:
  - wajib
  - atau boleh kosong

### 7.7 Aturan Bisnis
- jika `is_visible = 0`, mapel tidak ditampilkan di `Ruang Belajar`
- jika `is_visible = 1`, mapel boleh tampil di `Ruang Belajar`
- jika tutor belum ditentukan dan status tampil aktif, perlu ditetapkan apakah sistem:
  - tetap mengizinkan tampil
  - atau menolak aktivasi sampai tutor dipilih

---

## 8. Kebutuhan Fungsional

### 8.1 Master Mapel
Sistem harus dapat:
- menampilkan daftar seluruh mapel
- menampilkan filter berdasarkan jenjang
- mencari mapel berdasarkan kode atau nama
- menambahkan mapel baru
- mengedit data mapel
- mengubah status aktif/nonaktif mapel

### 8.2 Mapel per Rombel
Sistem harus dapat:
- menampilkan daftar rombel
- memfilter daftar mapping berdasarkan rombel
- menambahkan mapel ke rombel
- memilih tutor pengampu
- mengubah status tampil di ruang belajar
- mengubah urutan tampil
- mencegah duplikasi mapel pada rombel yang sama

### 8.3 Integrasi Ruang Belajar
Sistem harus memastikan bahwa halaman `Ruang Belajar` hanya menampilkan mapel yang:
- berasal dari `rombel_mapel`
- memiliki `is_visible = 1`
- master mapelnya aktif

---

## 9. Kebutuhan Non-Fungsional

### 9.1 Kejelasan UI
- `Master Mapel` dan `Mapel per Rombel` harus dipisah agar tidak membingungkan user
- form harus sederhana dan fokus pada konteks masing-masing menu

### 9.2 Konsistensi Data
- sumber kebenaran untuk mapel ruang belajar harus berasal dari mapping data akademik
- tidak boleh ada logika tampilan ruang belajar yang berdiri sendiri di luar data mapping

### 9.3 Maintainability
- struktur API dan database harus mudah dikembangkan
- mendukung penambahan fitur berikut di masa depan:
  - semester
  - tahun ajaran
  - kuota mapel
  - jadwal mapel
  - status publikasi per rombel

---

## 10. Rancangan Database

### 10.1 Tabel `mata_pelajaran`
Struktur yang disarankan:

```sql
mata_pelajaran
- id
- nama
- kode
- jenjang
- deskripsi
- is_active
- created_at
- updated_at
```

Catatan:
- bila `is_active` belum ada, perlu ditambahkan

### 10.2 Tabel `rombel_mapel`
Struktur yang disarankan:

```sql
rombel_mapel
- id
- rombel_id
- mapel_id
- tutor_id
- is_visible
- urutan
- created_at
- updated_at
```

Constraint penting:

```sql
UNIQUE (rombel_id, mapel_id)
```

Catatan:
- bila `is_visible` dan `urutan` belum ada, perlu ditambahkan

---

## 11. Relasi Data

Relasi utama:
- satu `mata_pelajaran` bisa dipakai di banyak `rombel`
- satu `rombel` bisa memiliki banyak `mata_pelajaran`
- satu `rombel_mapel` dapat memiliki satu `tutor` pengampu

Representasi sederhana:

```text
mata_pelajaran 1..n -> rombel_mapel <- n..1 rombel
users (tutor) 1..n -> rombel_mapel
```

---

## 12. Rancangan API

### 12.1 API Master Mapel

#### GET `/api/mapel`
Tujuan:
- ambil daftar mapel

Filter opsional:
- `keyword`
- `jenjang`
- `is_active`

#### GET `/api/mapel/:id`
Tujuan:
- ambil detail mapel

#### POST `/api/mapel`
Tujuan:
- tambah mapel baru

Payload:
```json
{
  "kode": "MAT001",
  "nama": "Matematika",
  "jenjang": "paket_c",
  "deskripsi": "Mapel inti matematika",
  "is_active": true
}
```

#### PUT `/api/mapel/:id`
Tujuan:
- edit mapel

#### PATCH `/api/mapel/:id/status`
Tujuan:
- aktif/nonaktifkan mapel

Payload:
```json
{
  "is_active": false
}
```

---

### 12.2 API Mapel per Rombel

#### GET `/api/rombel-mapel`
Tujuan:
- ambil daftar mapping

Query wajib/opsional:
- `rombel_id`
- `is_visible`

#### POST `/api/rombel-mapel`
Tujuan:
- tambah mapping mapel ke rombel

Payload:
```json
{
  "rombel_id": 1,
  "mapel_id": 3,
  "tutor_id": 8,
  "is_visible": true,
  "urutan": 1
}
```

#### PUT `/api/rombel-mapel/:id`
Tujuan:
- edit tutor, urutan, atau mapel

#### PATCH `/api/rombel-mapel/:id/visibility`
Tujuan:
- ubah status tampil

Payload:
```json
{
  "is_visible": false
}
```

#### DELETE `/api/rombel-mapel/:id`
Tujuan:
- hapus mapping mapel dari rombel

Catatan:
- bisa diputuskan nanti apakah delete permanen atau soft delete

---

## 13. Rancangan UI

### 13.1 Halaman Master Mapel

Komponen:
- judul halaman
- search bar
- filter jenjang
- filter status
- tombol `Tambah Mapel`
- tabel daftar mapel
- modal tambah/edit

Alur:
1. user membuka halaman
2. daftar mapel tampil
3. user dapat tambah/edit/nonaktifkan mapel

### 13.2 Halaman Mapel per Rombel

Komponen:
- judul halaman
- dropdown pilih rombel
- tombol `Tambah Mapel ke Rombel`
- tabel daftar mapping
- badge status tampil
- modal tambah/edit mapping

Alur:
1. user memilih rombel
2. sistem menampilkan semua mapel yang terpasang
3. user dapat tambah/edit/hapus mapping
4. perubahan langsung memengaruhi data yang dibaca `Ruang Belajar`

---

## 14. Integrasi dengan Ruang Belajar

Halaman `Ruang Belajar` untuk siswa harus membaca data dari:
- `rombel_mapel`
- `mata_pelajaran`
- `users` sebagai tutor

Filter final yang disarankan:
- `rombel_id` sesuai siswa
- `is_visible = 1`
- `mata_pelajaran.is_active = 1`

Data yang ditampilkan ke siswa:
- nama mapel
- kode mapel
- tutor pengampu
- jenjang
- status kelas jika diperlukan

---

## 15. Validasi dan Error Handling

Contoh validasi penting:
- mapel dengan kode sama tidak boleh dibuat dua kali
- satu rombel tidak boleh memiliki mapel yang sama lebih dari sekali
- mapel nonaktif tidak boleh dipakai dalam mapping baru
- rombel wajib dipilih sebelum mapping dibuat
- jika tutor diwajibkan, mapping tidak boleh disimpan tanpa tutor

Contoh pesan error:
- `Kode mapel sudah digunakan.`
- `Mapel ini sudah terpasang pada rombel yang dipilih.`
- `Mapel nonaktif tidak dapat dipasang ke rombel.`
- `Rombel wajib dipilih.`
- `Tutor pengampu wajib diisi.`

---

## 16. Keputusan yang Masih Perlu Difinalkan

Sebelum coding, hal-hal berikut sebaiknya diputuskan:

1. apakah `admin` boleh edit mapping atau hanya lihat?
2. apakah `tutor_id` wajib diisi?
3. apakah mapel nonaktif otomatis hilang dari ruang belajar?
4. apakah perlu field `urutan` atau cukup urut berdasarkan nama mapel?
5. apakah delete mapping bersifat permanen atau cukup nonaktifkan tampil?

---

## 17. Rekomendasi Implementasi Bertahap

Urutan implementasi yang disarankan:

### Tahap 1
- rapikan struktur tabel
- tambahkan field yang dibutuhkan
- tambahkan validasi backend

### Tahap 2
- buat API `Master Mapel`
- buat API `Mapel per Rombel`

### Tahap 3
- buat UI `Master Mapel`
- buat UI `Mapel per Rombel`

### Tahap 4
- sambungkan `Ruang Belajar` dengan data `rombel_mapel.is_visible`

### Tahap 5
- uji seluruh integrasi dengan modul:
  - ruang belajar
  - materi
  - tugas
  - pertemuan
  - tutor pengampu

---

## 18. Kesimpulan

Pendekatan dua menu terpisah adalah solusi yang paling aman dan paling scalable untuk project ini:
- `Master Mapel` menjaga data inti tetap rapi
- `Mapel per Rombel` mengatur distribusi mapel ke kelas
- `Ruang Belajar` cukup menjadi konsumen data final

Dengan rancangan ini, perubahan struktur akademik akan lebih terkontrol, tidak membingungkan user, dan lebih mudah dilanjutkan ke coding maupun revisi berikutnya.

