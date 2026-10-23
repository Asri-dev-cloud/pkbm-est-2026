# SRS Mini Modul Pembayaran Ujian dan Kartu Ujian

## 1. Latar Belakang

Saat ini warga belajar dapat mengakses modul ujian tanpa alur administrasi khusus yang memastikan apakah peserta sudah memenuhi kewajiban pembayaran ujian. Dalam praktik operasional PKBM, peserta seharusnya:

- menyelesaikan pembayaran biaya ujian terlebih dahulu
- diverifikasi oleh Admin TU
- baru setelah itu mendapatkan kartu ujian
- dan hanya peserta yang layak yang dapat mengikuti ujian

Karena itu dibutuhkan modul tambahan yang menghubungkan data siswa, pembayaran ujian, paket ujian, dan kartu ujian dalam satu alur yang rapi.

## 2. Tujuan

Tujuan modul ini adalah:

- memastikan hanya peserta yang sudah lunas dan diverifikasi yang dapat mengikuti ujian
- memberi kontrol administratif kepada Admin TU
- menghasilkan kartu ujian resmi berbentuk PDF
- menyusun isi kartu ujian berdasarkan identitas siswa dan daftar mapel ujian yang diikuti

## 3. Ruang Lingkup

Modul ini mencakup:

- validasi pembayaran ujian
- verifikasi administratif oleh Admin TU
- penetapan status kelayakan ujian
- pembangkitan kartu ujian PDF
- pembatasan akses ujian pada role warga belajar

Modul ini tidak langsung mencakup:

- pembayaran gateway otomatis
- tanda tangan digital bersertifikat
- QR verification publik

## 4. Aktor dan Hak Akses

### 4.1 Warga Belajar

- melihat status kelayakan ujian
- melihat daftar mapel ujian yang diikuti
- mengunggah bukti pembayaran jika alur pembayaran manual dipakai
- mengunduh kartu ujian jika sudah layak ujian
- mengikuti ujian hanya jika status sudah layak

### 4.2 Admin TU

- melihat daftar peserta ujian
- memeriksa status pembayaran ujian
- memverifikasi atau menolak pembayaran
- mengubah status kelayakan ujian
- membangkitkan atau mengunduh kartu ujian PDF

### 4.3 Super Admin

- monitoring penuh
- membantu audit data
- override bila diperlukan

### 4.4 Tutor

- hanya melihat informasi peserta ujian bila diperlukan
- tidak memverifikasi pembayaran

## 5. Konsep Inti

Modul ini memakai prinsip:

- hak ikut ujian tidak hanya ditentukan oleh daftar peserta
- hak ikut ujian harus lolos validasi administrasi
- kartu ujian adalah hasil akhir dari status administratif yang valid

## 6. Definisi Periode Ujian

`periode_ujian` adalah wadah resmi pelaksanaan ujian dalam satu momen akademik.

Contoh periode ujian:

- `UTS Ganjil 2026/2027`
- `UAS Ganjil 2026/2027`
- `UTS Genap 2026/2027`
- `UAS Genap 2026/2027`

Jadi `periode_ujian` bukan mapel, melainkan gelombang atau fase ujian.

Hubungannya:

- `periode_ujian`: jenis ujian, semester, tahun ajaran, dan rentang waktu
- `peserta_ujian`: data siswa yang terdaftar pada periode itu
- `peserta_ujian_mapel`: mapel yang diikuti siswa pada periode itu
- `paket_ujian`: paket soal ujian yang dipakai untuk mapel tertentu

Dengan model ini, satu siswa memiliki satu kartu ujian per periode ujian, lalu isi kartunya memuat daftar mapel yang benar-benar diikuti pada periode tersebut.

## 7. Alur Bisnis

### 6.1 Alur Utama

1. siswa terdaftar pada rombel
2. sistem menentukan periode ujian aktif, misalnya `UTS Ganjil 2026/2027`
3. sistem menentukan paket ujian/mapel yang berlaku untuk siswa pada periode tersebut
4. sistem membuat atau membaca kewajiban pembayaran ujian
5. siswa menyelesaikan pembayaran
6. Admin TU memverifikasi pembayaran
7. sistem mengubah status peserta menjadi layak ujian
8. kartu ujian PDF tersedia untuk diunduh
9. siswa dapat masuk ke ujian

### 7.2 Jika Belum Bayar

- status pembayaran: `belum_bayar`
- status kelayakan: `belum_layak`
- kartu ujian tidak tersedia
- tombol mulai ujian dinonaktifkan

### 7.3 Jika Sudah Bayar tapi Belum Diverifikasi

- status pembayaran: `menunggu_verifikasi`
- status kelayakan: `belum_layak`
- kartu ujian belum tersedia
- tombol mulai ujian tetap dinonaktifkan

### 7.4 Jika Pembayaran Ditolak

- status pembayaran: `ditolak`
- status kelayakan: `belum_layak`
- tampil alasan penolakan
- siswa diminta memperbaiki bukti atau menghubungi Admin TU

### 7.5 Jika Disetujui

- status pembayaran: `lunas`
- status kelayakan: `layak`
- kartu ujian aktif
- siswa dapat mengikuti ujian sesuai mapel yang diizinkan

## 8. Status Workflow

Disarankan status dibagi menjadi dua sumbu agar lebih rapi saat implementasi:

### 8.1 Status Pembayaran

- `belum_bayar`
- `menunggu_verifikasi`
- `ditolak`
- `lunas`

### 8.2 Status Kelayakan

- `belum_layak`
- `layak`

Catatan:

- `status_pembayaran` menjelaskan kondisi administrasi pembayaran
- `status_kelayakan` menjelaskan hak ikut ujian
- peserta tidak boleh berstatus `layak` jika `status_pembayaran` belum `lunas`

## 9. Rancangan Data

### 9.1 Opsi Arsitektur Data

Disarankan membuat tabel khusus peserta ujian dan periode ujian, tidak hanya bergantung pada tabel pembayaran.

### 9.2 Tabel Utama yang Disarankan

#### `periode_ujian`

Kolom:

- `id`
- `nama_periode`
- `jenis_ujian`
- `semester`
- `tahun_ajaran_id`
- `tanggal_mulai`
- `tanggal_selesai`
- `is_active`
- `created_at`
- `updated_at`

Contoh nilai:

- `nama_periode`: `UTS Ganjil 2026/2027`
- `jenis_ujian`: `uts`
- `semester`: `ganjil`

#### `peserta_ujian`

Kolom:

- `id`
- `warga_belajar_id`
- `rombel_id`
- `periode_ujian_id`
- `status_pembayaran`
- `status_kelayakan`
- `verified_by`
- `verified_at`
- `catatan_verifikasi`
- `kartu_ujian_file`
- `created_at`
- `updated_at`

Constraint:

- unique `(warga_belajar_id, periode_ujian_id)`

#### `peserta_ujian_mapel`

Kolom:

- `id`
- `peserta_ujian_id`
- `mapel_id`
- `paket_ujian_id`
- `created_at`

Constraint:

- unique `(peserta_ujian_id, mapel_id)`

### 9.3 Integrasi Dengan Tabel yang Sudah Ada

Tabel yang perlu dihubungkan:

- `warga_belajar`
- `rombel`
- `mata_pelajaran`
- `users`
- `paket_ujian`
- sumber pembayaran ujian

### 9.4 Sumber Mapel Ujian

Sumber mapel untuk kartu ujian dan hak ikut ujian disarankan mengambil dari `paket_ujian`, bukan langsung dari `rombel_mapel`.

Alasannya:

- tidak semua mapel kelas pasti diujikan
- paket ujian sudah merepresentasikan ujian yang benar-benar tersedia
- kartu ujian akan lebih akurat jika mengikuti mapel yang memang punya paket ujian aktif

Jadi:

- `rombel_mapel` tetap untuk struktur ruang belajar
- `paket_ujian` menjadi sumber mapel ujian

## 10. Hubungan Dengan Pembayaran

Ada dua pendekatan:

### Opsi A: Pakai Sumber Pembayaran yang Sudah Ada

Jika project ini sudah memiliki modul pembayaran/keuangan aktif, maka modul ujian sebaiknya membaca hasil verifikasi dari sana.

Contoh jenis pembayaran:

- `ujian_uts`
- `ujian_uas`
- `ujian_akhir`

Kelebihan:

- tidak duplikasi sistem pembayaran
- lebih konsisten dengan operasional keuangan

Kekurangan:

- perlu mapping tambahan ke periode ujian

### Opsi B: Pembayaran Ujian Khusus di Modul Ujian

Kelebihan:

- lebih spesifik ke kebutuhan ujian

Kekurangan:

- rawan duplikasi alur pembayaran

Rekomendasi:

- desain modul harus fleksibel untuk membaca sumber pembayaran utama project bila nanti sudah dipastikan
- namun untuk implementasi awal yang aman, status pembayaran ujian disimpan langsung di `peserta_ujian`
- jangan buat upload bukti ganda jika modul keuangan sudah punya bukti bayar sendiri
- jika nanti modul keuangan utama sudah final, `peserta_ujian` bisa disinkronkan dengan sumber pembayaran tersebut

## 11. Aturan Kelayakan Ujian

Peserta dianggap layak ujian jika:

- status siswa aktif
- memiliki rombel aktif
- terdaftar di periode ujian
- memiliki paket ujian/mapel ujian yang valid
- pembayaran ujian lunas
- verifikasi Admin TU disetujui

Peserta tidak layak ujian jika salah satu kondisi di atas tidak terpenuhi.

## 12. Rancangan UI

### 12.1 Halaman Siswa: Status Ujian

Menampilkan:

- status administrasi ujian
- periode ujian aktif
- daftar mapel ujian yang diikuti
- tombol `Unduh Kartu Ujian`
- tombol `Mulai Ujian` hanya jika layak

State tampilan:

- belum bayar
- menunggu verifikasi
- ditolak
- layak ujian

### 12.2 Halaman Admin TU: Verifikasi Peserta Ujian

Menampilkan:

- daftar peserta
- periode ujian
- status pembayaran
- status kelayakan
- bukti pembayaran
- aksi verifikasi

Filter:

- periode ujian
- jenjang
- rombel
- status pembayaran
- status kelayakan

Aksi:

- setujui pembayaran
- tolak pembayaran
- set layak ujian
- lihat kartu ujian
- unduh kartu ujian

Catatan operasional:

- daftar peserta ujian tidak diisi manual satu-satu dari nol
- sistem mengisi peserta otomatis berdasarkan `paket_ujian` aktif yang relevan dengan rombel dan periode ujian
- Admin TU fokus pada verifikasi pembayaran dan kelayakan

### 12.3 Halaman Admin TU: Detail Peserta Ujian

Menampilkan:

- identitas siswa
- NIS
- rombel
- daftar mapel ujian
- status pembayaran
- catatan verifikasi
- riwayat perubahan status

## 13. Rancangan Kartu Ujian

### 13.1 Format Output

Rekomendasi utama:

- PDF

Alasan:

- stabil untuk cetak
- layout terkunci
- mudah dibagikan
- cocok untuk arsip administrasi

Opsional tambahan:

- preview HTML
- export Word bila benar-benar diperlukan

### 13.2 Satu Kartu untuk Satu Periode

Rekomendasi:

- satu siswa memiliki satu kartu ujian untuk satu periode ujian
- daftar mapel dicantumkan di dalam kartu

Bukan:

- satu kartu per mapel

### 13.3 Isi Kartu Ujian

Bagian header:

- logo PKBM
- nama lembaga
- judul `Kartu Ujian`
- nama periode ujian
- jenis ujian: `UTS` atau `UAS`
- semester: `ganjil` atau `genap`
- tahun ajaran

Bagian identitas:

- nama lengkap siswa
- NIS
- jenjang
- rombel
- nomor telepon
- foto profil jika tersedia

Bagian akademik:

- daftar mapel yang diikuti
- NIS
- status kelayakan

Bagian validasi:

- nama Admin TU verifikator
- tanggal verifikasi
- catatan singkat jika perlu

Bagian footer:

- catatan tata tertib singkat
- tempat tanda tangan
- tanpa QR code

## 14. Sumber Data Isi Kartu

Data kartu ujian diambil dari:

- `users.nama_lengkap`
- `warga_belajar.nis`
- `warga_belajar.jenjang`
- `rombel.nama_rombel`
- `warga_belajar.no_telp`
- `users.foto_profil`
- `periode_ujian`
- `peserta_ujian`
- `peserta_ujian_mapel`
- `paket_ujian`
- `mata_pelajaran.nama`

## 15. Aturan Akses Ujian

### 15.1 Sebelum Mulai Ujian

Saat siswa membuka modul ujian, sistem harus memeriksa:

- apakah ada periode ujian aktif
- apakah siswa terdaftar sebagai peserta ujian
- apakah status kelayakan adalah `layak`
- apakah mapel yang diakses memang termasuk mapel ujian peserta pada periode tersebut

Jika tidak lolos:

- tampil pesan penolakan yang jelas
- sembunyikan atau disable tombol mulai ujian

### 15.2 Pesan yang Disarankan

Contoh:

- `Anda belum menyelesaikan administrasi ujian.`
- `Pembayaran ujian Anda masih menunggu verifikasi Admin TU.`
- `Kartu ujian belum tersedia karena status Anda belum layak ujian.`

## 16. Endpoint API yang Disarankan

### 16.1 Untuk Siswa

- `GET /api/ujian/peserta/saya`
- `GET /api/ujian/peserta/saya/kartu`
- `GET /api/ujian/peserta/saya/mapel`

### 16.2 Untuk Admin TU

- `GET /api/ujian/peserta`
- `GET /api/ujian/peserta/:id`
- `PUT /api/ujian/peserta/:id/verifikasi-pembayaran`
- `PUT /api/ujian/peserta/:id/kelayakan`
- `POST /api/ujian/peserta/:id/generate-kartu`
- `GET /api/ujian/peserta/:id/kartu`

### 16.3 Untuk Super Admin

- akses monitoring penuh ke endpoint admin

## 17. Kebutuhan Non-Fungsional

- PDF harus bisa dicetak pada kertas A4
- desain kartu harus rapi di layar dan hasil print
- file kartu ujian disimpan permanen di server
- file kartu ujian harus dapat digenerate ulang bila diperlukan
- proses verifikasi harus meninggalkan jejak `verified_by` dan `verified_at`
- validasi akses ujian tidak boleh hanya dilakukan di frontend, harus dicek di backend

## 18. Validasi Penting

- siswa tidak boleh punya dua record peserta ujian pada periode yang sama
- mapel ujian tidak boleh duplikat pada kartu yang sama
- peserta tidak bisa `layak` jika pembayaran belum `lunas`
- kartu ujian tidak bisa diunduh jika status belum layak
- jika status pembayaran dibatalkan, status kelayakan harus ikut ditinjau ulang

## 19. Skenario Penggunaan

### 19.1 Skenario Normal

1. siswa membayar biaya ujian
2. Admin TU memverifikasi pembayaran
3. status pembayaran menjadi `lunas`
4. status kelayakan menjadi `layak`
5. kartu ujian PDF dibuat
6. siswa mengunduh kartu ujian
7. siswa mengikuti ujian

### 19.2 Skenario Ditolak

1. siswa mengunggah bukti pembayaran
2. Admin TU menolak verifikasi
3. status pembayaran menjadi `ditolak`
4. status kelayakan tetap `belum_layak`
5. siswa tidak bisa unduh kartu
6. siswa tidak bisa mulai ujian

## 20. Urutan Implementasi yang Disarankan

1. finalisasi desain tabel `periode_ujian`, `peserta_ujian`, dan `peserta_ujian_mapel`
2. finalisasi sumber pembayaran ujian yang benar di project ini
3. hubungkan peserta ujian dengan `paket_ujian`
4. buat proses generate peserta ujian otomatis dari `paket_ujian` aktif sesuai rombel dan periode
5. buat endpoint verifikasi peserta ujian
6. buat halaman Admin TU untuk verifikasi
7. buat halaman siswa untuk status ujian
8. buat generator kartu ujian PDF
9. pasang guard backend agar ujian hanya bisa diikuti peserta yang layak

## 21. Keputusan yang Masih Perlu Difinalkan

Tidak ada keputusan bisnis utama yang tersisa. Dokumen ini siap dijadikan dasar implementasi.

## 22. Rekomendasi Final

Rekomendasi terbaik untuk project ini:

- buat tabel `periode_ujian` sebagai wadah resmi `UTS/UAS` per semester dan tahun ajaran
- buat tabel `peserta_ujian` dan `peserta_ujian_mapel`
- sumber mapel ujian memakai `paket_ujian`
- peserta ujian dibentuk otomatis dari `paket_ujian` aktif yang sesuai
- status dibagi menjadi `status_pembayaran` dan `status_kelayakan`
- implementasi awal status pembayaran disimpan di `peserta_ujian`
- Admin TU menjadi verifikator utama
- kartu ujian dibuat dalam format PDF
- satu kartu untuk satu siswa per periode ujian
- NIS dipakai sebagai identitas utama kartu ujian
- tanpa QR code
- kartu ujian disimpan permanen sebagai file PDF
- daftar mapel diambil dari paket ujian yang valid untuk siswa tersebut
