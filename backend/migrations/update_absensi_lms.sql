-- Migration: Tambah catatan ke rekaman_kehadiran dan pertemuan_ke ke sesi_absensi
ALTER TABLE `rekaman_kehadiran`
  ADD COLUMN IF NOT EXISTS `catatan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keterangan izin/sakit/presensi' AFTER `metode`;

ALTER TABLE `sesi_absensi`
  ADD COLUMN IF NOT EXISTS `pertemuan_ke` int UNSIGNED DEFAULT 1 COMMENT 'Nomor pertemuan belajar (1-16)' AFTER `mapel_id`;

