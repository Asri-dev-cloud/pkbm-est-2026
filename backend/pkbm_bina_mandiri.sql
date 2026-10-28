-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 20, 2026 at 09:05 PM
-- Server version: 8.0.30
-- PHP Version: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pkbm_bina_mandiri`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi_klub`
--

CREATE TABLE `absensi_klub` (
  `id` int UNSIGNED NOT NULL,
  `jadwal_klub_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `status` enum('hadir','izin','alpa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'alpa',
  `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `anggota_klub`
--

CREATE TABLE `anggota_klub` (
  `id` int UNSIGNED NOT NULL,
  `klub_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `status` enum('aktif','tidak_aktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `tanggal_daftar` date NOT NULL,
  `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED DEFAULT NULL COMMENT 'NULL jika aksi dilakukan sistem otomatis',
  `aksi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: LOGIN, HAPUS_SISWA, UBAH_ROLE',
  `target` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entitas yang dikenai aksi (contoh: warga_belajar)',
  `target_id` int UNSIGNED DEFAULT NULL COMMENT 'ID baris yang diubah/dihapus',
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Detail tambahan (JSON string)',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_soal`
--

CREATE TABLE `bank_soal` (
  `id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED DEFAULT NULL COMMENT 'NULL untuk soal asesmen bakat (lintas mapel)',
  `tutor_id` int UNSIGNED NOT NULL COMMENT 'Tutor yang membuat soal',
  `jenjang` enum('paket_a','paket_b','paket_c','semua') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semua',
  `tipe` enum('pilihan_ganda','essay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pilihan_ganda',
  `kategori` enum('akademik','bakat_minat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'akademik',
  `pertanyaan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pilihan` json DEFAULT NULL COMMENT 'Array pilihan jawaban, hanya untuk pilihan_ganda',
  `kunci_jawaban` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kunci jawaban (A/B/C/D), hanya untuk pilihan_ganda',
  `skor_benar` decimal(5,2) NOT NULL DEFAULT '1.00' COMMENT 'Poin jika jawaban benar',
  `tag_dimensi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Contoh: logika, seni, sosial, sains',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `berkas_spmb`
--

CREATE TABLE `berkas_spmb` (
  `id` int UNSIGNED NOT NULL,
  `pendaftar_id` int UNSIGNED NOT NULL,
  `jenis_berkas` enum('kk','ijazah','foto','dokumen_lain') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `path_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_verifikasi` enum('menunggu','valid','tidak_valid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menunggu',
  `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan Admin jika berkas tidak valid',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `catatan_anggota_klub`
--

CREATE TABLE `catatan_anggota_klub` (
  `id` int UNSIGNED NOT NULL,
  `klub_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL COMMENT 'Pembina yang menulis catatan',
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Contoh: Mei 2026, Semester 1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catatan perkembangan anggota klub oleh pembina';

-- --------------------------------------------------------

--
-- Table structure for table `forum_balasan`
--

CREATE TABLE `forum_balasan` (
  `id` int UNSIGNED NOT NULL,
  `forum_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `isi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_diskusi`
--

CREATE TABLE `forum_diskusi` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL COMMENT 'Bisa Tutor atau WB yang membuka thread',
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Thread yang di-pin Tutor',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hasil_asesmen_bakat`
--

CREATE TABLE `hasil_asesmen_bakat` (
  `id` int UNSIGNED NOT NULL,
  `sesi_ujian_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `skor_logika` decimal(5,2) NOT NULL DEFAULT '0.00',
  `skor_seni` decimal(5,2) NOT NULL DEFAULT '0.00',
  `skor_sosial` decimal(5,2) NOT NULL DEFAULT '0.00',
  `skor_sains` decimal(5,2) NOT NULL DEFAULT '0.00',
  `skor_bahasa` decimal(5,2) NOT NULL DEFAULT '0.00',
  `skor_olahraga` decimal(5,2) NOT NULL DEFAULT '0.00',
  `dimensi_tertinggi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Dimensi dengan skor tertinggi',
  `rekomendasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Teks rekomendasi klub yang dibuat sistem',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kbm`
--

CREATE TABLE `jadwal_kbm` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Topik pertemuan',
  `waktu_mulai` datetime NOT NULL,
  `waktu_selesai` datetime NOT NULL,
  `jenis` enum('online','tatap_muka') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `link_meeting` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Link Zoom/Google Meet (jika online)',
  `lokasi` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ruangan (jika tatap muka)',
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_klub`
--

CREATE TABLE `jadwal_klub` (
  `id` int UNSIGNED NOT NULL,
  `klub_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nama kegiatan / agenda',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `waktu_mulai` datetime NOT NULL,
  `waktu_selesai` datetime NOT NULL,
  `lokasi` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jawaban_ujian`
--

CREATE TABLE `jawaban_ujian` (
  `id` int UNSIGNED NOT NULL,
  `sesi_ujian_id` int UNSIGNED NOT NULL,
  `soal_id` int UNSIGNED NOT NULL,
  `jawaban` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `skor` decimal(5,2) DEFAULT NULL COMMENT 'NULL = belum dinilai (essay)',
  `catatan_penilai` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Catatan Tutor saat menilai essay',
  `dinilai_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `klub_minat_bakat`
--

CREATE TABLE `klub_minat_bakat` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kategori` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Contoh: seni, olahraga, teknologi, bahasa',
  `pembimbing_id` int UNSIGNED DEFAULT NULL COMMENT 'user_id Tutor yang membimbing',
  `kapasitas` int NOT NULL DEFAULT '20',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `klub_minat_bakat`
--

INSERT INTO `klub_minat_bakat` (`id`, `nama`, `deskripsi`, `kategori`, `pembimbing_id`, `kapasitas`, `is_aktif`, `created_at`) VALUES
(1, 'Klub Robotika', 'Belajar dasar-dasar elektronik dan pemrograman robot sederhana.', 'teknologi', NULL, 15, 1, '2026-05-11 21:22:42'),
(2, 'Klub Seni Rupa', 'Menggambar, melukis, dan membuat kerajinan tangan.', 'seni', NULL, 20, 1, '2026-05-11 21:22:42'),
(3, 'Klub Futsal', 'Latihan futsal rutin setiap minggu.', 'olahraga', NULL, 20, 1, '2026-05-11 21:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `komentar_pertemuan`
--

CREATE TABLE `komentar_pertemuan` (
  `id` int UNSIGNED NOT NULL,
  `pertemuan_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `isi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `kontribusi_proyek`
--

CREATE TABLE `kontribusi_proyek` (
  `id` int UNSIGNED NOT NULL,
  `proyek_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `path_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File hasil karya (opsional)',
  `nilai` decimal(5,2) DEFAULT NULL COMMENT 'Nilai dari pengajar',
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mata_pelajaran`
--

CREATE TABLE `mata_pelajaran` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenjang` enum('paket_a','paket_b','paket_c','semua') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semua',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mata_pelajaran`
--

INSERT INTO `mata_pelajaran` (`id`, `nama`, `kode`, `jenjang`, `deskripsi`, `is_active`, `created_at`) VALUES
(1, 'Pendidikan Agama & Budi Pekerti', 'PAG-ALL', 'semua', NULL, 1, '2026-05-11 21:22:42'),
(2, 'Bahasa Indonesia', 'BIND-ALL', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(3, 'Matematika', 'MTK-ALL', 'semua', NULL, 1, '2026-05-11 21:22:42'),
(4, 'Ilmu Pengetahuan Alam', 'IPA-ALL', 'semua', NULL, 1, '2026-05-11 21:22:42'),
(5, 'Ilmu Pengetahuan Sosial', 'IPS-ALL', 'semua', NULL, 1, '2026-05-11 21:22:42'),
(6, 'Pendidikan Kewarganegaraan', 'PKN-ALL', 'semua', NULL, 1, '2026-05-11 21:22:42'),
(7, 'Bahasa Inggris', 'BING-B', 'paket_b', NULL, 1, '2026-05-11 21:22:42'),
(8, 'Bahasa Inggris', 'BING-C', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(9, 'Ekonomi', 'EKO-C', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(10, 'Fisika', 'FIS-C', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(11, 'Kimia', 'KIM-C', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(12, 'Biologi', 'BIO-C', 'paket_c', NULL, 1, '2026-05-11 21:22:42'),
(13, 'Bahasa Indonesia', 'BIND-C', 'paket_c', NULL, 1, '2026-05-21 01:13:24');

-- --------------------------------------------------------

--
-- Table structure for table `materi_bahasa`
--

CREATE TABLE `materi_bahasa` (
  `id` int UNSIGNED NOT NULL,
  `pelatihan_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipe` enum('dokumen','video_link','link_eksternal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dokumen',
  `path_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `materi_pembelajaran`
--

CREATE TABLE `materi_pembelajaran` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL COMMENT 'Tutor yang mengupload',
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipe` enum('dokumen','video_link','link_eksternal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dokumen',
  `path_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Diisi jika tipe = dokumen',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Diisi jika tipe = video_link atau link_eksternal',
  `urutan` int NOT NULL DEFAULT '0' COMMENT 'Urutan tampilan materi dalam rombel',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `pertemuan_id` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `nilai_akhir`
--

CREATE TABLE `nilai_akhir` (
  `id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL COMMENT 'Tutor yang menginput nilai',
  `nilai_uh` decimal(5,2) DEFAULT NULL COMMENT 'Rata-rata nilai ulangan harian',
  `nilai_uts` decimal(5,2) DEFAULT NULL COMMENT 'Nilai ujian tengah semester',
  `nilai_uas` decimal(5,2) DEFAULT NULL COMMENT 'Nilai ujian akhir semester',
  `nilai_tugas` decimal(5,2) DEFAULT NULL COMMENT 'Rata-rata nilai tugas harian',
  `nilai_akhir` decimal(5,2) DEFAULT NULL COMMENT 'Nilai akhir (dihitung atau diinput manual)',
  `predikat` enum('A','B','C','D') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'AÔëÑ85, BÔëÑ70, CÔëÑ55, D<55',
  `catatan_tutor` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Catatan/deskripsi dari tutor untuk rapor',
  `is_final` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = nilai sudah dikunci/final',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nilai akhir per mata pelajaran per WB per tahun ajaran';

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL COMMENT 'Penerima notifikasi',
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pesan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('spmb','keuangan','kbm','absensi','ujian','sistem') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sistem',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paket_ujian`
--

CREATE TABLE `paket_ujian` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED DEFAULT NULL COMMENT 'NULL jika ujian untuk semua / asesmen bakat',
  `mapel_id` int UNSIGNED DEFAULT NULL,
  `tutor_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: UTS Matematika Semester 1',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jenis` enum('uh','uts','uas','bakat_minat','latihan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uh',
  `durasi_menit` int NOT NULL DEFAULT '60' COMMENT 'Durasi pengerjaan dalam menit',
  `acak_soal` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = urutan soal diacak per siswa',
  `acak_pilihan` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = urutan pilihan jawaban diacak',
  `nilai_lulus` decimal(5,2) NOT NULL DEFAULT '60.00',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = ujian sudah dibuka untuk WB',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `paket_ujian_soal`
--

CREATE TABLE `paket_ujian_soal` (
  `id` int UNSIGNED NOT NULL,
  `paket_ujian_id` int UNSIGNED NOT NULL,
  `soal_id` int UNSIGNED NOT NULL,
  `nomor_urut` int NOT NULL DEFAULT '0' COMMENT 'Urutan soal dalam paket (bisa diacak saat tampil)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pelatihan_bahasa`
--

CREATE TABLE `pelatihan_bahasa` (
  `id` int UNSIGNED NOT NULL,
  `bahasa` enum('inggris','jepang','mandarin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` enum('pemula','menengah','lanjutan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pemula',
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: English for Beginners',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pengajar_id` int UNSIGNED DEFAULT NULL COMMENT 'user_id Tutor yang mengajar',
  `kapasitas` int NOT NULL DEFAULT '15',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pelatihan_bahasa`
--

INSERT INTO `pelatihan_bahasa` (`id`, `bahasa`, `level`, `nama`, `deskripsi`, `pengajar_id`, `kapasitas`, `is_aktif`, `created_at`) VALUES
(1, 'inggris', 'pemula', 'English for Beginners', NULL, NULL, 15, 1, '2026-05-11 21:22:42'),
(2, 'inggris', 'menengah', 'English Intermediate', NULL, NULL, 15, 1, '2026-05-11 21:22:42'),
(3, 'jepang', 'pemula', 'Nihongo Shokyuu (Level Dasar)', NULL, NULL, 10, 1, '2026-05-11 21:22:42'),
(4, 'mandarin', 'pemula', 'Hanyu PÃöt┼ìnghu├á - Dasar', NULL, NULL, 10, 1, '2026-05-11 21:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id` int UNSIGNED NOT NULL,
  `tagihan_id` int UNSIGNED NOT NULL,
  `jumlah_bayar` decimal(12,2) NOT NULL,
  `tanggal_bayar` date NOT NULL,
  `metode` enum('tunai','transfer','lain_lain') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tunai',
  `bukti_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path file foto bukti transfer',
  `status_konfirmasi` enum('menunggu','terkonfirmasi','ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'terkonfirmasi',
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dicatat_oleh` int UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `pendaftar_spmb`
--

CREATE TABLE `pendaftar_spmb` (
  `id` int UNSIGNED NOT NULL,
  `nama_lengkap` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nik` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Induk Kependudukan calon WB',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenjang_daftar` enum('paket_a','paket_b','paket_c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `jenis_kelamin` enum('L','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_wali` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','diterima','ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `catatan_verifikasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Alasan penolakan atau catatan Admin',
  `diverifikasi_oleh` int UNSIGNED DEFAULT NULL COMMENT 'user_id Admin yang memverifikasi',
  `tanggal_verifikasi` datetime DEFAULT NULL,
  `tahun_ajaran_id` int UNSIGNED DEFAULT NULL,
  `warga_belajar_id` int UNSIGNED DEFAULT NULL COMMENT 'Diisi otomatis saat pipeline SPMB berjalan',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `pengumpulan_tugas`
--

CREATE TABLE `pengumpulan_tugas` (
  `id` int UNSIGNED NOT NULL,
  `tugas_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `path_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Path file yang dikumpulkan',
  `nama_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan_siswa` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Catatan atau komentar dari WB',
  `nilai` decimal(5,2) DEFAULT NULL COMMENT 'Nilai yang diberikan Tutor (NULL = belum dinilai)',
  `feedback_tutor` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Komentar/feedback dari Tutor',
  `dinilai_at` datetime DEFAULT NULL,
  `status` enum('terkumpul','dinilai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'terkumpul',
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `pengumuman`
--

CREATE TABLE `pengumuman` (
  `id` int UNSIGNED NOT NULL,
  `pembuat_id` int UNSIGNED NOT NULL COMMENT 'User yang membuat pengumuman',
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_target` enum('semua','jenjang','rombel') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semua' COMMENT 'Kepada siapa pengumuman ini ditujukan',
  `target_jenjang` enum('paket_a','paket_b','paket_c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_rombel_id` int UNSIGNED DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL COMMENT 'Waktu resmi diterbitkan',
  `expired_at` datetime DEFAULT NULL COMMENT 'Pengumuman tidak ditampilkan setelah waktu ini',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pengumuman resmi dari Admin atau Tutor';

--
-- Dumping data for table `pengumuman`
--

INSERT INTO `pengumuman` (`id`, `pembuat_id`, `judul`, `isi`, `tipe_target`, `target_jenjang`, `target_rombel_id`, `is_published`, `published_at`, `expired_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'Selamat Datang di Ekosistem Digital PKBM Bina Mandiri', 'Assalamu\'alaikum Warga Belajar, Tutor, dan seluruh keluarga besar PKBM Bina Mandiri.\n\nKami dengan bangga memperkenalkan platform digital resmi kami. Melalui platform ini, Anda dapat mengakses materi pembelajaran, mengumpulkan tugas, melakukan absensi mandiri, mengerjakan ujian online, dan masih banyak lagi.\n\nSilakan login menggunakan kredensial yang telah diberikan. Jika mengalami kendala, hubungi staf TU kami.\n\nSalam sukses,\nManajemen PKBM Bina Mandiri', 'semua', NULL, NULL, 1, '2026-05-11 21:40:10', NULL, '2026-05-11 21:40:10', NULL),
(2, 3, 'Panduan Pengisian SPMB Online Tahun Ajaran 2025/2026', 'Kepada calon Warga Belajar PKBM Bina Mandiri,\n\nPenerimaan Siswa/Warga Belajar Baru (SPMB) kini dapat dilakukan secara online. Siapkan dokumen berikut sebelum mendaftar:\n1. Foto/scan KTP atau Kartu Keluarga (KK)\n2. Ijazah terakhir atau Surat Keterangan\n3. Pas foto ukuran 3x4 (format JPG/PNG)\n4. Akta Kelahiran (jika ada)\n\nBatas pendaftaran: 30 Juni 2026.\n\nHubungi staf TU untuk informasi lebih lanjut.', 'semua', NULL, NULL, 1, '2026-05-11 21:40:10', NULL, '2026-05-11 21:40:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pengumuman_dibaca`
--

CREATE TABLE `pengumuman_dibaca` (
  `id` int UNSIGNED NOT NULL,
  `pengumuman_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `dibaca_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rekaman user yang sudah membaca pengumuman';

-- --------------------------------------------------------

--
-- Table structure for table `periode_ujian`
--

CREATE TABLE `periode_ujian` (
  `id` int UNSIGNED NOT NULL,
  `nama_periode` varchar(120) NOT NULL,
  `jenis_ujian` enum('uts','uas') NOT NULL,
  `semester` enum('ganjil','genap') NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `periode_ujian`
--

INSERT INTO `periode_ujian` (`id`, `nama_periode`, `jenis_ujian`, `semester`, `tahun_ajaran_id`, `tanggal_mulai`, `tanggal_selesai`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UTS Genap 2025/2026', 'uts', 'genap', 1, '2026-05-25', '2026-05-31', 1, '2026-05-21 02:35:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pertemuan_belajar`
--

CREATE TABLE `pertemuan_belajar` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL,
  `pertemuan_ke` int NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rencana_materi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `metode_belajar` enum('online','offline','hybrid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'hybrid',
  `tanggal_pelaksanaan` date NOT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pengumuman` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `peserta_pelatihan`
--

CREATE TABLE `peserta_pelatihan` (
  `id` int UNSIGNED NOT NULL,
  `pelatihan_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `status` enum('aktif','lulus','tidak_aktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `tanggal_daftar` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peserta_ujian`
--

CREATE TABLE `peserta_ujian` (
  `id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `periode_ujian_id` int UNSIGNED NOT NULL,
  `status_pembayaran` enum('belum_bayar','menunggu_verifikasi','ditolak','lunas') NOT NULL DEFAULT 'belum_bayar',
  `status_kelayakan` enum('belum_layak','layak') NOT NULL DEFAULT 'belum_layak',
  `verified_by` int UNSIGNED DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `catatan_verifikasi` text,
  `kartu_ujian_file` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `peserta_ujian_mapel`
--

CREATE TABLE `peserta_ujian_mapel` (
  `id` int UNSIGNED NOT NULL,
  `peserta_ujian_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `paket_ujian_id` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `progres_materi`
--

CREATE TABLE `progres_materi` (
  `id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `materi_id` int UNSIGNED NOT NULL,
  `status` enum('dibuka','selesai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dibuka',
  `dibuka_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `selesai_pada` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracking progres belajar WB per materi pembelajaran';

-- --------------------------------------------------------

--
-- Table structure for table `proyek_bahasa`
--

CREATE TABLE `proyek_bahasa` (
  `id` int UNSIGNED NOT NULL,
  `pelatihan_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Deskripsi tema dan tujuan proyek',
  `deadline` datetime NOT NULL,
  `status` enum('aktif','selesai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rapor_periode`
--

CREATE TABLE `rapor_periode` (
  `id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `semester` enum('1','2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Semester 1 atau 2',
  `total_hadir` int NOT NULL DEFAULT '0',
  `total_izin` int NOT NULL DEFAULT '0',
  `total_sakit` int NOT NULL DEFAULT '0',
  `total_alpa` int NOT NULL DEFAULT '0',
  `catatan_wali` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Catatan wali kelas untuk rapor',
  `status_rapor` enum('draft','final') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `tanggal_cetak` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Header rapor per WB per semester';

-- --------------------------------------------------------

--
-- Table structure for table `refresh_token`
--

CREATE TABLE `refresh_token` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 hash dari token asli',
  `device_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Info browser/device (User-Agent)',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL COMMENT 'Waktu kedaluwarsa token',
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = token sudah dicabut (logout)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refresh token JWT untuk sesi multi-device';

-- --------------------------------------------------------

--
-- Table structure for table `rekaman_kehadiran`
--

CREATE TABLE `rekaman_kehadiran` (
  `id` int UNSIGNED NOT NULL,
  `sesi_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `status` enum('hadir','izin','sakit','alpa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'alpa',
  `waktu_check_in` datetime DEFAULT NULL COMMENT 'Diisi saat WB check-in mandiri atau saat Tutor submit',
  `metode` enum('manual_tutor','mandiri_wb') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual_tutor',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `reset_password_token`
--

CREATE TABLE `reset_password_token` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 hash dari token yang dikirim ke email',
  `expires_at` datetime NOT NULL COMMENT 'Kedaluwarsa 1 jam setelah dibuat',
  `is_used` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = sudah digunakan, tidak bisa dipakai lagi',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token sementara untuk reset password via email';

-- --------------------------------------------------------

--
-- Table structure for table `rombel`
--

CREATE TABLE `rombel` (
  `id` int UNSIGNED NOT NULL,
  `nama_rombel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: Paket C - Kelas 1A',
  `jenjang` enum('paket_a','paket_b','paket_c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun_ajaran_id` int UNSIGNED NOT NULL,
  `tutor_wali_id` int UNSIGNED DEFAULT NULL COMMENT 'Tutor wali kelas',
  `kapasitas` int NOT NULL DEFAULT '30',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rombel`
--

INSERT INTO `rombel` (`id`, `nama_rombel`, `jenjang`, `tahun_ajaran_id`, `tutor_wali_id`, `kapasitas`, `created_at`) VALUES
(1, 'Paket A - Kelas I', 'paket_a', 1, NULL, 25, '2026-05-11 21:22:42'),
(2, 'Paket B - Kelas VII-A', 'paket_b', 1, NULL, 30, '2026-05-11 21:22:42'),
(3, 'Paket B - Kelas VII-B', 'paket_b', 1, NULL, 30, '2026-05-11 21:22:42'),
(4, 'Paket C - Kelas X-A', 'paket_c', 1, NULL, 30, '2026-05-11 21:22:42'),
(5, 'Paket C - Kelas X-B', 'paket_c', 1, NULL, 30, '2026-05-11 21:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `rombel_mapel`
--

CREATE TABLE `rombel_mapel` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED DEFAULT NULL COMMENT 'Tutor yang mengajar mapel ini di rombel ini',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `urutan` int NOT NULL DEFAULT '0',
  `rps_file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rombel_mapel`
--

INSERT INTO `rombel_mapel` (`id`, `rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`) VALUES
(1, 1, 2, 2, 1, 1, '2026-05-21 01:08:08'),
(2, 1, 4, 2, 1, 2, '2026-05-21 01:08:08'),
(3, 1, 5, 2, 1, 3, '2026-05-21 01:08:08'),
(4, 1, 3, 2, 1, 4, '2026-05-21 01:08:08'),
(5, 1, 1, 2, 1, 5, '2026-05-21 01:08:08'),
(6, 1, 6, 2, 1, 6, '2026-05-21 01:08:08'),
(7, 2, 2, 2, 1, 1, '2026-05-21 01:08:08'),
(8, 2, 4, 2, 1, 2, '2026-05-21 01:08:08'),
(9, 2, 5, 2, 1, 3, '2026-05-21 01:08:08'),
(10, 2, 3, 2, 1, 4, '2026-05-21 01:08:08'),
(11, 2, 1, 2, 1, 5, '2026-05-21 01:08:08'),
(12, 2, 6, 2, 1, 6, '2026-05-21 01:08:08'),
(13, 2, 7, 2, 1, 7, '2026-05-21 01:08:08'),
(14, 3, 2, 2, 1, 1, '2026-05-21 01:08:08'),
(15, 3, 4, 2, 1, 2, '2026-05-21 01:08:08'),
(16, 3, 5, 2, 1, 3, '2026-05-21 01:08:08'),
(17, 3, 3, 2, 1, 4, '2026-05-21 01:08:08'),
(18, 3, 1, 2, 1, 5, '2026-05-21 01:08:08'),
(19, 3, 6, 2, 1, 6, '2026-05-21 01:08:08'),
(20, 3, 7, 2, 1, 7, '2026-05-21 01:08:08'),
(21, 4, 2, 2, 1, 1, '2026-05-21 01:08:08'),
(22, 4, 4, 2, 1, 2, '2026-05-21 01:08:08'),
(23, 4, 5, 2, 1, 3, '2026-05-21 01:08:08'),
(24, 4, 3, 2, 1, 4, '2026-05-21 01:08:08'),
(25, 4, 1, 2, 1, 5, '2026-05-21 01:08:08'),
(26, 4, 6, 2, 1, 6, '2026-05-21 01:08:08'),
(27, 4, 8, 2, 1, 7, '2026-05-21 01:08:08'),
(28, 4, 12, 2, 1, 8, '2026-05-21 01:08:08'),
(29, 4, 9, 2, 1, 9, '2026-05-21 01:08:08'),
(30, 4, 10, 2, 1, 10, '2026-05-21 01:08:08'),
(31, 4, 11, 2, 1, 11, '2026-05-21 01:08:08'),
(32, 5, 2, 2, 1, 1, '2026-05-21 01:08:08'),
(33, 5, 4, 2, 1, 2, '2026-05-21 01:08:08'),
(34, 5, 5, 2, 1, 3, '2026-05-21 01:08:08'),
(35, 5, 3, 2, 1, 4, '2026-05-21 01:08:08'),
(36, 5, 1, 2, 1, 5, '2026-05-21 01:08:08'),
(37, 5, 6, 2, 1, 6, '2026-05-21 01:08:08'),
(38, 5, 8, 2, 1, 7, '2026-05-21 01:08:08'),
(39, 5, 12, 2, 1, 8, '2026-05-21 01:08:08'),
(40, 5, 9, 2, 1, 9, '2026-05-21 01:08:08'),
(41, 5, 10, 2, 1, 10, '2026-05-21 01:08:08'),
(42, 5, 11, 2, 1, 11, '2026-05-21 01:08:08'),
(43, 4, 13, NULL, 0, 1, '2026-05-21 01:20:56');

-- --------------------------------------------------------

--
-- Table structure for table `sesi_absensi`
--

CREATE TABLE `sesi_absensi` (
  `id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED DEFAULT NULL COMMENT 'Mapel yang sedang diajarkan',
  `tanggal` date NOT NULL,
  `mode` enum('manual','mandiri') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `waktu_mulai` datetime DEFAULT NULL,
  `waktu_selesai` datetime DEFAULT NULL,
  `durasi_timer` int DEFAULT NULL COMMENT 'Durasi timer mandiri dalam detik (contoh: 300 = 5 menit)',
  `status_sesi` enum('aktif','selesai') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pertemuan_id` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `sesi_ujian`
--

CREATE TABLE `sesi_ujian` (
  `id` int UNSIGNED NOT NULL,
  `paket_ujian_id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `waktu_mulai` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_selesai` datetime DEFAULT NULL COMMENT 'Diisi saat WB submit atau waktu habis',
  `status` enum('sedang_berjalan','selesai','timeout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sedang_berjalan',
  `nilai_total` decimal(5,2) DEFAULT NULL COMMENT 'Diisi setelah semua jawaban dinilai',
  `is_lulus` tinyint(1) DEFAULT NULL COMMENT 'NULL = belum ada nilai, 1 = lulus, 0 = tidak lulus',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tagihan_siswa`
--

CREATE TABLE `tagihan_siswa` (
  `id` int UNSIGNED NOT NULL,
  `warga_belajar_id` int UNSIGNED NOT NULL,
  `jenis_tagihan` enum('spp','modul','lain_lain') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'spp',
  `keterangan` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: SPP Bulan Juli 2025',
  `jumlah` decimal(12,2) NOT NULL,
  `tanggal_jatuh_tempo` date NOT NULL,
  `status` enum('belum_bayar','lunas','cicilan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'belum_bayar',
  `tahun_ajaran_id` int UNSIGNED DEFAULT NULL,
  `dibuat_oleh` int UNSIGNED DEFAULT NULL COMMENT 'user_id Admin yang membuat tagihan',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `tahun_ajaran`
--

CREATE TABLE `tahun_ajaran` (
  `id` int UNSIGNED NOT NULL,
  `nama_tahun_ajaran` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contoh: 2025/2026',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tahun_ajaran`
--

INSERT INTO `tahun_ajaran` (`id`, `nama_tahun_ajaran`, `is_aktif`, `tanggal_mulai`, `tanggal_selesai`, `created_at`) VALUES
(1, '2025/2026', 1, '2025-07-14', '2026-06-30', '2026-05-11 21:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `tugas`
--

CREATE TABLE `tugas` (
  `id` int UNSIGNED NOT NULL,
  `rombel_id` int UNSIGNED NOT NULL,
  `mapel_id` int UNSIGNED NOT NULL,
  `tutor_id` int UNSIGNED NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Instruksi detail tugas',
  `deadline` datetime NOT NULL COMMENT 'Batas waktu pengumpulan',
  `nilai_maks` decimal(5,2) NOT NULL DEFAULT '100.00',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `pertemuan_id` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `tutor`
--

CREATE TABLE `tutor` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `nip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Induk Pegawai (opsional)',
  `spesialisasi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mapel yang diajarkan',
  `no_telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tutor`
--

INSERT INTO `tutor` (`id`, `user_id`, `nip`, `spesialisasi`, `no_telp`, `created_at`) VALUES
(1, 2, NULL, 'Matematika, IPA', '081234567890', '2026-05-11 21:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `nama_lengkap` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','tutor','warga_belajar','pimpinan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `foto_profil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama_lengkap`, `email`, `password_hash`, `role`, `is_active`, `foto_profil`, `created_at`, `updated_at`) VALUES
(1, 'Super Administrator', 'admin@pkbm-binamandiri.sch.id', '$2a$10$8iAA8wr.6aRcOT56L6uYZednMk1Lr0DsoejnOvyMbffNnqp1VYg..', 'super_admin', 1, NULL, '2026-05-11 21:22:42', '2026-05-12 13:55:43'),
(2, 'Budi Santoso, S.Pd', 'budi.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-05-11 21:22:42', '2026-05-12 13:55:43'),
(3, 'Siti Rahayu', 'siti.admin@pkbm-binamandiri.sch.id', '$2a$10$zIJEoNEj5Z.bDc6KUWLbUeePa18iKhMWGdcDhzNUuig6veI1ymVIa', 'admin', 1, NULL, '2026-05-11 21:22:42', '2026-05-12 13:55:43'),
(5, 'Rudi', 'pimpinan@pkbm-binamandiri.sch.id', '$2a$10$w99QgTLfkWZNbg8Ld7W9wep6iajR20a1uaqrmviPySCKmi6J/u2ea', 'pimpinan', 1, NULL, '2026-05-12 14:34:25', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_progres_belajar_wb`
-- (See below for the actual view)
--
CREATE TABLE `v_progres_belajar_wb` (
`jenjang` enum('paket_a','paket_b','paket_c')
,`materi_selesai` bigint
,`nama_lengkap` varchar(100)
,`persen_progres` decimal(26,2)
,`rombel_id` int unsigned
,`total_materi` bigint
,`warga_belajar_id` int unsigned
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_ringkasan_keuangan_bulanan`
-- (See below for the actual view)
--
CREATE TABLE `v_ringkasan_keuangan_bulanan` (
`bulan` varchar(7)
,`total_tagihan` decimal(34,2)
,`total_terbayar` decimal(34,2)
,`total_tunggakan` decimal(35,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_ringkasan_wb_per_jenjang`
-- (See below for the actual view)
--
CREATE TABLE `v_ringkasan_wb_per_jenjang` (
`jenjang` enum('paket_a','paket_b','paket_c')
,`total_wb_aktif` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_spmb_statistik`
-- (See below for the actual view)
--
CREATE TABLE `v_spmb_statistik` (
`diterima` decimal(23,0)
,`ditolak` decimal(23,0)
,`pending` decimal(23,0)
,`total_pendaftar` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_tingkat_kehadiran_per_rombel`
-- (See below for the actual view)
--
CREATE TABLE `v_tingkat_kehadiran_per_rombel` (
`jenjang` enum('paket_a','paket_b','paket_c')
,`nama_rombel` varchar(50)
,`persen_kehadiran` decimal(29,2)
,`rombel_id` int unsigned
,`total_hadir` decimal(23,0)
,`total_rekaman` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_tunggakan_per_wb`
-- (See below for the actual view)
--
CREATE TABLE `v_tunggakan_per_wb` (
`hari_terlambat` int
,`jenis_tagihan` enum('spp','modul','lain_lain')
,`jenjang` enum('paket_a','paket_b','paket_c')
,`jumlah` decimal(12,2)
,`nama_lengkap` varchar(100)
,`nis` varchar(20)
,`status_tagihan` enum('belum_bayar','lunas','cicilan')
,`tagihan_id` int unsigned
,`tanggal_jatuh_tempo` date
,`warga_belajar_id` int unsigned
);

-- --------------------------------------------------------

--
-- Table structure for table `warga_belajar`
--

CREATE TABLE `warga_belajar` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `nis` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor Induk Siswa, format: PKBM-TAHUN-XXXX',
  `nik` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Induk Kependudukan',
  `jenjang` enum('paket_a','paket_b','paket_c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `jenis_kelamin` enum('L','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nama_wali` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rombel_id` int UNSIGNED DEFAULT NULL,
  `tahun_ajaran_id` int UNSIGNED DEFAULT NULL,
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi_klub`
--
ALTER TABLE `absensi_klub`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_jadwal_wb` (`jadwal_klub_id`,`warga_belajar_id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`);

--
-- Indexes for table `anggota_klub`
--
ALTER TABLE `anggota_klub`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_klub_wb_ta` (`klub_id`,`warga_belajar_id`,`tahun_ajaran_id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`),
  ADD KEY `idx_klub` (`klub_id`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_aksi` (`aksi`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `bank_soal`
--
ALTER TABLE `bank_soal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_mapel` (`mapel_id`),
  ADD KEY `idx_jenjang` (`jenjang`),
  ADD KEY `idx_kategori` (`kategori`);

--
-- Indexes for table `berkas_spmb`
--
ALTER TABLE `berkas_spmb`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pendaftar` (`pendaftar_id`);

--
-- Indexes for table `catatan_anggota_klub`
--
ALTER TABLE `catatan_anggota_klub`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_klub` (`klub_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`);

--
-- Indexes for table `forum_balasan`
--
ALTER TABLE `forum_balasan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_forum` (`forum_id`);

--
-- Indexes for table `forum_diskusi`
--
ALTER TABLE `forum_diskusi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_rombel` (`rombel_id`);

--
-- Indexes for table `hasil_asesmen_bakat`
--
ALTER TABLE `hasil_asesmen_bakat`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sesi_ujian_id` (`sesi_ujian_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`);

--
-- Indexes for table `jadwal_kbm`
--
ALTER TABLE `jadwal_kbm`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_waktu` (`waktu_mulai`);

--
-- Indexes for table `jadwal_klub`
--
ALTER TABLE `jadwal_klub`
  ADD PRIMARY KEY (`id`),
  ADD KEY `klub_id` (`klub_id`),
  ADD KEY `idx_waktu` (`waktu_mulai`);

--
-- Indexes for table `jawaban_ujian`
--
ALTER TABLE `jawaban_ujian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sesi_soal` (`sesi_ujian_id`,`soal_id`),
  ADD KEY `soal_id` (`soal_id`),
  ADD KEY `idx_sesi` (`sesi_ujian_id`);

--
-- Indexes for table `klub_minat_bakat`
--
ALTER TABLE `klub_minat_bakat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembimbing_id` (`pembimbing_id`),
  ADD KEY `idx_aktif` (`is_aktif`);

--
-- Indexes for table `komentar_pertemuan`
--
ALTER TABLE `komentar_pertemuan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pertemuan_id` (`pertemuan_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `kontribusi_proyek`
--
ALTER TABLE `kontribusi_proyek`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`),
  ADD KEY `idx_proyek` (`proyek_id`);

--
-- Indexes for table `mata_pelajaran`
--
ALTER TABLE `mata_pelajaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`);

--
-- Indexes for table `materi_bahasa`
--
ALTER TABLE `materi_bahasa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pelatihan` (`pelatihan_id`);

--
-- Indexes for table `materi_pembelajaran`
--
ALTER TABLE `materi_pembelajaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_mapel` (`mapel_id`),
  ADD KEY `idx_published` (`is_published`),
  ADD KEY `pertemuan_id` (`pertemuan_id`);

--
-- Indexes for table `nilai_akhir`
--
ALTER TABLE `nilai_akhir`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_nilai` (`warga_belajar_id`,`mapel_id`,`tahun_ajaran_id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_ta` (`tahun_ajaran_id`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `paket_ujian`
--
ALTER TABLE `paket_ujian`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_jenis` (`jenis`);

--
-- Indexes for table `paket_ujian_soal`
--
ALTER TABLE `paket_ujian_soal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_paket_soal` (`paket_ujian_id`,`soal_id`),
  ADD KEY `soal_id` (`soal_id`);

--
-- Indexes for table `pelatihan_bahasa`
--
ALTER TABLE `pelatihan_bahasa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pengajar_id` (`pengajar_id`),
  ADD KEY `idx_bahasa` (`bahasa`),
  ADD KEY `idx_level` (`level`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dicatat_oleh` (`dicatat_oleh`),
  ADD KEY `idx_tagihan` (`tagihan_id`),
  ADD KEY `idx_tgl_bayar` (`tanggal_bayar`);

--
-- Indexes for table `pendaftar_spmb`
--
ALTER TABLE `pendaftar_spmb`
  ADD PRIMARY KEY (`id`),
  ADD KEY `diverifikasi_oleh` (`diverifikasi_oleh`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tugas_wb` (`tugas_id`,`warga_belajar_id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`),
  ADD KEY `idx_tugas` (`tugas_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `pengumuman`
--
ALTER TABLE `pengumuman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembuat_id` (`pembuat_id`),
  ADD KEY `target_rombel_id` (`target_rombel_id`),
  ADD KEY `idx_published` (`is_published`),
  ADD KEY `idx_expired` (`expired_at`),
  ADD KEY `idx_jenjang` (`target_jenjang`);

--
-- Indexes for table `pengumuman_dibaca`
--
ALTER TABLE `pengumuman_dibaca`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_baca` (`pengumuman_id`,`user_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `periode_ujian`
--
ALTER TABLE `periode_ujian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_periode_ujian` (`jenis_ujian`,`semester`,`tahun_ajaran_id`),
  ADD KEY `fk_periode_ujian_tahun_ajaran` (`tahun_ajaran_id`),
  ADD KEY `idx_periode_ujian_active` (`is_active`,`tahun_ajaran_id`);

--
-- Indexes for table `pertemuan_belajar`
--
ALTER TABLE `pertemuan_belajar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pertemuan` (`rombel_id`,`mapel_id`,`pertemuan_ke`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indexes for table `peserta_pelatihan`
--
ALTER TABLE `peserta_pelatihan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pelatihan_wb` (`pelatihan_id`,`warga_belajar_id`,`tahun_ajaran_id`),
  ADD KEY `warga_belajar_id` (`warga_belajar_id`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`);

--
-- Indexes for table `peserta_ujian`
--
ALTER TABLE `peserta_ujian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_peserta_ujian` (`warga_belajar_id`,`periode_ujian_id`),
  ADD KEY `fk_peserta_ujian_rombel` (`rombel_id`),
  ADD KEY `fk_peserta_ujian_verified_by` (`verified_by`),
  ADD KEY `idx_peserta_ujian_status` (`periode_ujian_id`,`status_pembayaran`,`status_kelayakan`),
  ADD KEY `idx_peserta_ujian_wb` (`warga_belajar_id`);

--
-- Indexes for table `peserta_ujian_mapel`
--
ALTER TABLE `peserta_ujian_mapel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_peserta_ujian_mapel` (`peserta_ujian_id`,`mapel_id`),
  ADD KEY `fk_peserta_ujian_mapel_mapel` (`mapel_id`),
  ADD KEY `fk_peserta_ujian_mapel_paket` (`paket_ujian_id`);

--
-- Indexes for table `progres_materi`
--
ALTER TABLE `progres_materi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wb_materi` (`warga_belajar_id`,`materi_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`),
  ADD KEY `idx_materi` (`materi_id`);

--
-- Indexes for table `proyek_bahasa`
--
ALTER TABLE `proyek_bahasa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pelatihan` (`pelatihan_id`);

--
-- Indexes for table `rapor_periode`
--
ALTER TABLE `rapor_periode`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rapor` (`warga_belajar_id`,`tahun_ajaran_id`,`semester`),
  ADD KEY `rombel_id` (`rombel_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`),
  ADD KEY `idx_ta` (`tahun_ajaran_id`);

--
-- Indexes for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_token_hash` (`token_hash`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `rekaman_kehadiran`
--
ALTER TABLE `rekaman_kehadiran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sesi_wb` (`sesi_id`,`warga_belajar_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`);

--
-- Indexes for table `reset_password_token`
--
ALTER TABLE `reset_password_token`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_token` (`token_hash`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `rombel`
--
ALTER TABLE `rombel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_wali_id` (`tutor_wali_id`),
  ADD KEY `idx_jenjang` (`jenjang`),
  ADD KEY `idx_ta` (`tahun_ajaran_id`);

--
-- Indexes for table `rombel_mapel`
--
ALTER TABLE `rombel_mapel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rombel_mapel` (`rombel_id`,`mapel_id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indexes for table `sesi_absensi`
--
ALTER TABLE `sesi_absensi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_tanggal` (`tanggal`),
  ADD KEY `idx_status` (`status_sesi`),
  ADD KEY `pertemuan_id` (`pertemuan_id`);

--
-- Indexes for table `sesi_ujian`
--
ALTER TABLE `sesi_ujian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_paket_wb` (`paket_ujian_id`,`warga_belajar_id`),
  ADD KEY `idx_wb` (`warga_belajar_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `tagihan_siswa`
--
ALTER TABLE `tagihan_siswa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`),
  ADD KEY `dibuat_oleh` (`dibuat_oleh`),
  ADD KEY `idx_wb` (`warga_belajar_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_jatuh` (`tanggal_jatuh_tempo`);

--
-- Indexes for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tugas`
--
ALTER TABLE `tugas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mapel_id` (`mapel_id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_rombel` (`rombel_id`),
  ADD KEY `idx_deadline` (`deadline`),
  ADD KEY `pertemuan_id` (`pertemuan_id`);

--
-- Indexes for table `tutor`
--
ALTER TABLE `tutor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `warga_belajar`
--
ALTER TABLE `warga_belajar`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nis` (`nis`),
  ADD KEY `rombel_id` (`rombel_id`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_jenjang` (`jenjang`),
  ADD KEY `idx_aktif` (`is_aktif`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absensi_klub`
--
ALTER TABLE `absensi_klub`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `anggota_klub`
--
ALTER TABLE `anggota_klub`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_soal`
--
ALTER TABLE `bank_soal`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `berkas_spmb`
--
ALTER TABLE `berkas_spmb`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `catatan_anggota_klub`
--
ALTER TABLE `catatan_anggota_klub`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forum_balasan`
--
ALTER TABLE `forum_balasan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forum_diskusi`
--
ALTER TABLE `forum_diskusi`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hasil_asesmen_bakat`
--
ALTER TABLE `hasil_asesmen_bakat`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jadwal_kbm`
--
ALTER TABLE `jadwal_kbm`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jadwal_klub`
--
ALTER TABLE `jadwal_klub`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jawaban_ujian`
--
ALTER TABLE `jawaban_ujian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `klub_minat_bakat`
--
ALTER TABLE `klub_minat_bakat`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `komentar_pertemuan`
--
ALTER TABLE `komentar_pertemuan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `kontribusi_proyek`
--
ALTER TABLE `kontribusi_proyek`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mata_pelajaran`
--
ALTER TABLE `mata_pelajaran`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `materi_bahasa`
--
ALTER TABLE `materi_bahasa`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `materi_pembelajaran`
--
ALTER TABLE `materi_pembelajaran`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `nilai_akhir`
--
ALTER TABLE `nilai_akhir`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `paket_ujian`
--
ALTER TABLE `paket_ujian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `paket_ujian_soal`
--
ALTER TABLE `paket_ujian_soal`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pelatihan_bahasa`
--
ALTER TABLE `pelatihan_bahasa`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pendaftar_spmb`
--
ALTER TABLE `pendaftar_spmb`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pengumuman`
--
ALTER TABLE `pengumuman`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pengumuman_dibaca`
--
ALTER TABLE `pengumuman_dibaca`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `periode_ujian`
--
ALTER TABLE `periode_ujian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pertemuan_belajar`
--
ALTER TABLE `pertemuan_belajar`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `peserta_pelatihan`
--
ALTER TABLE `peserta_pelatihan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `peserta_ujian`
--
ALTER TABLE `peserta_ujian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `peserta_ujian_mapel`
--
ALTER TABLE `peserta_ujian_mapel`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `progres_materi`
--
ALTER TABLE `progres_materi`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proyek_bahasa`
--
ALTER TABLE `proyek_bahasa`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rapor_periode`
--
ALTER TABLE `rapor_periode`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refresh_token`
--
ALTER TABLE `refresh_token`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rekaman_kehadiran`
--
ALTER TABLE `rekaman_kehadiran`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `reset_password_token`
--
ALTER TABLE `reset_password_token`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rombel`
--
ALTER TABLE `rombel`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rombel_mapel`
--
ALTER TABLE `rombel_mapel`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `sesi_absensi`
--
ALTER TABLE `sesi_absensi`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sesi_ujian`
--
ALTER TABLE `sesi_ujian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tagihan_siswa`
--
ALTER TABLE `tagihan_siswa`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tugas`
--
ALTER TABLE `tugas`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tutor`
--
ALTER TABLE `tutor`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `warga_belajar`
--
ALTER TABLE `warga_belajar`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

--
-- Structure for view `v_progres_belajar_wb`
--
DROP TABLE IF EXISTS `v_progres_belajar_wb`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_progres_belajar_wb`  AS SELECT `wb`.`id` AS `warga_belajar_id`, `u`.`nama_lengkap` AS `nama_lengkap`, `wb`.`jenjang` AS `jenjang`, `wb`.`rombel_id` AS `rombel_id`, count(distinct `mp`.`id`) AS `total_materi`, count(distinct (case when (`pm`.`status` = 'selesai') then `pm`.`materi_id` end)) AS `materi_selesai`, round(((count(distinct (case when (`pm`.`status` = 'selesai') then `pm`.`materi_id` end)) / nullif(count(distinct `mp`.`id`),0)) * 100),2) AS `persen_progres` FROM (((`warga_belajar` `wb` join `users` `u` on((`u`.`id` = `wb`.`user_id`))) left join `materi_pembelajaran` `mp` on(((`mp`.`rombel_id` = `wb`.`rombel_id`) and (`mp`.`is_published` = 1)))) left join `progres_materi` `pm` on(((`pm`.`materi_id` = `mp`.`id`) and (`pm`.`warga_belajar_id` = `wb`.`id`)))) WHERE (`wb`.`is_aktif` = 1) GROUP BY `wb`.`id`, `u`.`nama_lengkap`, `wb`.`jenjang`, `wb`.`rombel_id` ;

-- --------------------------------------------------------

--
-- Structure for view `v_ringkasan_keuangan_bulanan`
--
DROP TABLE IF EXISTS `v_ringkasan_keuangan_bulanan`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_ringkasan_keuangan_bulanan`  AS SELECT date_format(`ts`.`tanggal_jatuh_tempo`,'%Y-%m') AS `bulan`, sum(`ts`.`jumlah`) AS `total_tagihan`, coalesce(sum(`p`.`jumlah_bayar`),0) AS `total_terbayar`, (sum(`ts`.`jumlah`) - coalesce(sum(`p`.`jumlah_bayar`),0)) AS `total_tunggakan` FROM (`tagihan_siswa` `ts` left join `pembayaran` `p` on(((`p`.`tagihan_id` = `ts`.`id`) and (`p`.`status_konfirmasi` = 'terkonfirmasi')))) GROUP BY date_format(`ts`.`tanggal_jatuh_tempo`,'%Y-%m') ORDER BY `bulan` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `v_ringkasan_wb_per_jenjang`
--
DROP TABLE IF EXISTS `v_ringkasan_wb_per_jenjang`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_ringkasan_wb_per_jenjang`  AS SELECT `wb`.`jenjang` AS `jenjang`, count(0) AS `total_wb_aktif` FROM `warga_belajar` AS `wb` WHERE (`wb`.`is_aktif` = 1) GROUP BY `wb`.`jenjang` ;

-- --------------------------------------------------------

--
-- Structure for view `v_spmb_statistik`
--
DROP TABLE IF EXISTS `v_spmb_statistik`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_spmb_statistik`  AS SELECT count(0) AS `total_pendaftar`, sum((case when (`pendaftar_spmb`.`status` = 'pending') then 1 else 0 end)) AS `pending`, sum((case when (`pendaftar_spmb`.`status` = 'diterima') then 1 else 0 end)) AS `diterima`, sum((case when (`pendaftar_spmb`.`status` = 'ditolak') then 1 else 0 end)) AS `ditolak` FROM `pendaftar_spmb` ;

-- --------------------------------------------------------

--
-- Structure for view `v_tingkat_kehadiran_per_rombel`
--
DROP TABLE IF EXISTS `v_tingkat_kehadiran_per_rombel`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_tingkat_kehadiran_per_rombel`  AS SELECT `r`.`id` AS `rombel_id`, `r`.`nama_rombel` AS `nama_rombel`, `r`.`jenjang` AS `jenjang`, count(`rk`.`id`) AS `total_rekaman`, sum((case when (`rk`.`status` = 'hadir') then 1 else 0 end)) AS `total_hadir`, round(((sum((case when (`rk`.`status` = 'hadir') then 1 else 0 end)) / nullif(count(`rk`.`id`),0)) * 100),2) AS `persen_kehadiran` FROM ((`rombel` `r` left join `sesi_absensi` `sa` on((`sa`.`rombel_id` = `r`.`id`))) left join `rekaman_kehadiran` `rk` on((`rk`.`sesi_id` = `sa`.`id`))) GROUP BY `r`.`id`, `r`.`nama_rombel`, `r`.`jenjang` ;

-- --------------------------------------------------------

--
-- Structure for view `v_tunggakan_per_wb`
--
DROP TABLE IF EXISTS `v_tunggakan_per_wb`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_tunggakan_per_wb`  AS SELECT `wb`.`id` AS `warga_belajar_id`, `u`.`nama_lengkap` AS `nama_lengkap`, `wb`.`nis` AS `nis`, `wb`.`jenjang` AS `jenjang`, `ts`.`id` AS `tagihan_id`, `ts`.`jenis_tagihan` AS `jenis_tagihan`, `ts`.`jumlah` AS `jumlah`, `ts`.`tanggal_jatuh_tempo` AS `tanggal_jatuh_tempo`, `ts`.`status` AS `status_tagihan`, (to_days(curdate()) - to_days(`ts`.`tanggal_jatuh_tempo`)) AS `hari_terlambat` FROM ((`tagihan_siswa` `ts` join `warga_belajar` `wb` on((`wb`.`id` = `ts`.`warga_belajar_id`))) join `users` `u` on((`u`.`id` = `wb`.`user_id`))) WHERE (`ts`.`status` in ('belum_bayar','sebagian')) ORDER BY (to_days(curdate()) - to_days(`ts`.`tanggal_jatuh_tempo`)) DESC ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi_klub`
--
ALTER TABLE `absensi_klub`
  ADD CONSTRAINT `absensi_klub_ibfk_1` FOREIGN KEY (`jadwal_klub_id`) REFERENCES `jadwal_klub` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_klub_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `anggota_klub`
--
ALTER TABLE `anggota_klub`
  ADD CONSTRAINT `anggota_klub_ibfk_1` FOREIGN KEY (`klub_id`) REFERENCES `klub_minat_bakat` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `anggota_klub_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `anggota_klub_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`);

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bank_soal`
--
ALTER TABLE `bank_soal`
  ADD CONSTRAINT `bank_soal_ibfk_1` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bank_soal_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `berkas_spmb`
--
ALTER TABLE `berkas_spmb`
  ADD CONSTRAINT `berkas_spmb_ibfk_1` FOREIGN KEY (`pendaftar_id`) REFERENCES `pendaftar_spmb` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `catatan_anggota_klub`
--
ALTER TABLE `catatan_anggota_klub`
  ADD CONSTRAINT `catatan_anggota_klub_ibfk_1` FOREIGN KEY (`klub_id`) REFERENCES `klub_minat_bakat` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `catatan_anggota_klub_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `catatan_anggota_klub_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `forum_balasan`
--
ALTER TABLE `forum_balasan`
  ADD CONSTRAINT `forum_balasan_ibfk_1` FOREIGN KEY (`forum_id`) REFERENCES `forum_diskusi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_balasan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `forum_diskusi`
--
ALTER TABLE `forum_diskusi`
  ADD CONSTRAINT `forum_diskusi_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_diskusi_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `forum_diskusi_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `hasil_asesmen_bakat`
--
ALTER TABLE `hasil_asesmen_bakat`
  ADD CONSTRAINT `hasil_asesmen_bakat_ibfk_1` FOREIGN KEY (`sesi_ujian_id`) REFERENCES `sesi_ujian` (`id`),
  ADD CONSTRAINT `hasil_asesmen_bakat_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `jadwal_kbm`
--
ALTER TABLE `jadwal_kbm`
  ADD CONSTRAINT `jadwal_kbm_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jadwal_kbm_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `jadwal_kbm_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `jadwal_klub`
--
ALTER TABLE `jadwal_klub`
  ADD CONSTRAINT `jadwal_klub_ibfk_1` FOREIGN KEY (`klub_id`) REFERENCES `klub_minat_bakat` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jawaban_ujian`
--
ALTER TABLE `jawaban_ujian`
  ADD CONSTRAINT `jawaban_ujian_ibfk_1` FOREIGN KEY (`sesi_ujian_id`) REFERENCES `sesi_ujian` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jawaban_ujian_ibfk_2` FOREIGN KEY (`soal_id`) REFERENCES `bank_soal` (`id`);

--
-- Constraints for table `klub_minat_bakat`
--
ALTER TABLE `klub_minat_bakat`
  ADD CONSTRAINT `klub_minat_bakat_ibfk_1` FOREIGN KEY (`pembimbing_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `komentar_pertemuan`
--
ALTER TABLE `komentar_pertemuan`
  ADD CONSTRAINT `komentar_pertemuan_ibfk_1` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_belajar` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `komentar_pertemuan_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kontribusi_proyek`
--
ALTER TABLE `kontribusi_proyek`
  ADD CONSTRAINT `kontribusi_proyek_ibfk_1` FOREIGN KEY (`proyek_id`) REFERENCES `proyek_bahasa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kontribusi_proyek_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `materi_bahasa`
--
ALTER TABLE `materi_bahasa`
  ADD CONSTRAINT `materi_bahasa_ibfk_1` FOREIGN KEY (`pelatihan_id`) REFERENCES `pelatihan_bahasa` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `materi_pembelajaran`
--
ALTER TABLE `materi_pembelajaran`
  ADD CONSTRAINT `materi_pembelajaran_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materi_pembelajaran_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `materi_pembelajaran_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `materi_pembelajaran_ibfk_4` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_belajar` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `nilai_akhir`
--
ALTER TABLE `nilai_akhir`
  ADD CONSTRAINT `nilai_akhir_ibfk_1` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `nilai_akhir_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `nilai_akhir_ibfk_3` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`),
  ADD CONSTRAINT `nilai_akhir_ibfk_4` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`),
  ADD CONSTRAINT `nilai_akhir_ibfk_5` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `notifikasi_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `paket_ujian`
--
ALTER TABLE `paket_ujian`
  ADD CONSTRAINT `paket_ujian_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paket_ujian_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `paket_ujian_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `paket_ujian_soal`
--
ALTER TABLE `paket_ujian_soal`
  ADD CONSTRAINT `paket_ujian_soal_ibfk_1` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paket_ujian_soal_ibfk_2` FOREIGN KEY (`soal_id`) REFERENCES `bank_soal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pelatihan_bahasa`
--
ALTER TABLE `pelatihan_bahasa`
  ADD CONSTRAINT `pelatihan_bahasa_ibfk_1` FOREIGN KEY (`pengajar_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan_siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pembayaran_ibfk_2` FOREIGN KEY (`dicatat_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pendaftar_spmb`
--
ALTER TABLE `pendaftar_spmb`
  ADD CONSTRAINT `pendaftar_spmb_ibfk_1` FOREIGN KEY (`diverifikasi_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pendaftar_spmb_ibfk_2` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pendaftar_spmb_ibfk_3` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD CONSTRAINT `pengumpulan_tugas_ibfk_1` FOREIGN KEY (`tugas_id`) REFERENCES `tugas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pengumpulan_tugas_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `pengumuman`
--
ALTER TABLE `pengumuman`
  ADD CONSTRAINT `pengumuman_ibfk_1` FOREIGN KEY (`pembuat_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `pengumuman_ibfk_2` FOREIGN KEY (`target_rombel_id`) REFERENCES `rombel` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pengumuman_dibaca`
--
ALTER TABLE `pengumuman_dibaca`
  ADD CONSTRAINT `pengumuman_dibaca_ibfk_1` FOREIGN KEY (`pengumuman_id`) REFERENCES `pengumuman` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pengumuman_dibaca_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `periode_ujian`
--
ALTER TABLE `periode_ujian`
  ADD CONSTRAINT `fk_periode_ujian_tahun_ajaran` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`);

--
-- Constraints for table `pertemuan_belajar`
--
ALTER TABLE `pertemuan_belajar`
  ADD CONSTRAINT `pertemuan_belajar_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pertemuan_belajar_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pertemuan_belajar_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `peserta_pelatihan`
--
ALTER TABLE `peserta_pelatihan`
  ADD CONSTRAINT `peserta_pelatihan_ibfk_1` FOREIGN KEY (`pelatihan_id`) REFERENCES `pelatihan_bahasa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peserta_pelatihan_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `peserta_pelatihan_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`);

--
-- Constraints for table `peserta_ujian`
--
ALTER TABLE `peserta_ujian`
  ADD CONSTRAINT `fk_peserta_ujian_periode` FOREIGN KEY (`periode_ujian_id`) REFERENCES `periode_ujian` (`id`),
  ADD CONSTRAINT `fk_peserta_ujian_rombel` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`),
  ADD CONSTRAINT `fk_peserta_ujian_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_peserta_ujian_wb` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `peserta_ujian_mapel`
--
ALTER TABLE `peserta_ujian_mapel`
  ADD CONSTRAINT `fk_peserta_ujian_mapel_mapel` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `fk_peserta_ujian_mapel_paket` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian` (`id`),
  ADD CONSTRAINT `fk_peserta_ujian_mapel_peserta` FOREIGN KEY (`peserta_ujian_id`) REFERENCES `peserta_ujian` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `progres_materi`
--
ALTER TABLE `progres_materi`
  ADD CONSTRAINT `progres_materi_ibfk_1` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `progres_materi_ibfk_2` FOREIGN KEY (`materi_id`) REFERENCES `materi_pembelajaran` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proyek_bahasa`
--
ALTER TABLE `proyek_bahasa`
  ADD CONSTRAINT `proyek_bahasa_ibfk_1` FOREIGN KEY (`pelatihan_id`) REFERENCES `pelatihan_bahasa` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rapor_periode`
--
ALTER TABLE `rapor_periode`
  ADD CONSTRAINT `rapor_periode_ibfk_1` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `rapor_periode_ibfk_2` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`),
  ADD CONSTRAINT `rapor_periode_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`);

--
-- Constraints for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rekaman_kehadiran`
--
ALTER TABLE `rekaman_kehadiran`
  ADD CONSTRAINT `rekaman_kehadiran_ibfk_1` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_absensi` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rekaman_kehadiran_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `reset_password_token`
--
ALTER TABLE `reset_password_token`
  ADD CONSTRAINT `reset_password_token_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rombel`
--
ALTER TABLE `rombel`
  ADD CONSTRAINT `rombel_ibfk_1` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`),
  ADD CONSTRAINT `rombel_ibfk_2` FOREIGN KEY (`tutor_wali_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rombel_mapel`
--
ALTER TABLE `rombel_mapel`
  ADD CONSTRAINT `rombel_mapel_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rombel_mapel_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `rombel_mapel_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sesi_absensi`
--
ALTER TABLE `sesi_absensi`
  ADD CONSTRAINT `sesi_absensi_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `sesi_absensi_ibfk_2` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`),
  ADD CONSTRAINT `sesi_absensi_ibfk_3` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sesi_absensi_ibfk_4` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_belajar` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sesi_ujian`
--
ALTER TABLE `sesi_ujian`
  ADD CONSTRAINT `sesi_ujian_ibfk_1` FOREIGN KEY (`paket_ujian_id`) REFERENCES `paket_ujian` (`id`),
  ADD CONSTRAINT `sesi_ujian_ibfk_2` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`);

--
-- Constraints for table `tagihan_siswa`
--
ALTER TABLE `tagihan_siswa`
  ADD CONSTRAINT `tagihan_siswa_ibfk_1` FOREIGN KEY (`warga_belajar_id`) REFERENCES `warga_belajar` (`id`),
  ADD CONSTRAINT `tagihan_siswa_ibfk_2` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tagihan_siswa_ibfk_3` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tugas`
--
ALTER TABLE `tugas`
  ADD CONSTRAINT `tugas_ibfk_1` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tugas_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`),
  ADD CONSTRAINT `tugas_ibfk_3` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tugas_ibfk_4` FOREIGN KEY (`pertemuan_id`) REFERENCES `pertemuan_belajar` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tutor`
--
ALTER TABLE `tutor`
  ADD CONSTRAINT `tutor_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `warga_belajar`
--
ALTER TABLE `warga_belajar`
  ADD CONSTRAINT `warga_belajar_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `warga_belajar_ibfk_2` FOREIGN KEY (`rombel_id`) REFERENCES `rombel` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `warga_belajar_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE SET NULL;
--
-- Table structure for table `berita_kegiatan`
--
CREATE TABLE IF NOT EXISTS `berita_kegiatan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `judul` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `ringkasan` TEXT NULL,
  `konten` LONGTEXT NOT NULL,
  `kategori` VARCHAR(100) NOT NULL DEFAULT 'Kegiatan PKBM',
  `tanggal_kegiatan` DATE NULL,
  `lokasi` VARCHAR(255) NULL DEFAULT '',
  `gambar_sampul` VARCHAR(255) NULL,
  `galeri_foto` JSON NULL,
  `video_url` VARCHAR(500) NULL,
  `video_file` VARCHAR(255) NULL,
  `status` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `penulis` VARCHAR(100) NOT NULL DEFAULT 'Admin PKBM',
  `created_by` INT NULL,
  `views_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_kategori` (`kategori`),
  INDEX `idx_tanggal` (`tanggal_kegiatan`),
  INDEX `idx_pinned` (`is_pinned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `modul_buku`
--
CREATE TABLE IF NOT EXISTS `modul_buku` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `judul` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT NULL,
  `kategori` VARCHAR(50) NOT NULL DEFAULT 'Semua Jenjang',
  `mapel` VARCHAR(100) NULL,
  `tipe` ENUM('modul_upload', 'buku_kemendikdasmen') NOT NULL DEFAULT 'modul_upload',
  `file_path` VARCHAR(255) NULL,
  `file_nama_asli` VARCHAR(255) NULL,
  `file_size` INT NULL DEFAULT 0,
  `file_type` VARCHAR(50) NULL DEFAULT 'pdf',
  `cover_image` VARCHAR(255) NULL,
  `url_eksternal` VARCHAR(500) NULL DEFAULT 'https://buku.kemendikdasmen.go.id/',
  `penulis` VARCHAR(150) NULL DEFAULT 'PKBM Bina Mandiri',
  `semester` VARCHAR(30) NULL DEFAULT 'Semua Semester',
  `tahun_ajaran` VARCHAR(30) NULL DEFAULT '2025/2026',
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `total_dibaca` INT NOT NULL DEFAULT 0,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_kategori` (`kategori`),
  INDEX `idx_tipe` (`tipe`),
  INDEX `idx_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
