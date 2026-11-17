-- ============================================================
-- Migrasi: Penambahan Kolom Nama Ayah dan Nama Ibu
-- Tabel: pendaftar_spmb & warga_belajar
-- ============================================================

ALTER TABLE `pendaftar_spmb`
  ADD COLUMN `nama_ayah` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama Ayah / Bapak Kandung' AFTER `jumlah_saudara_kandung`,
  ADD COLUMN `nama_ibu` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama Ibu Kandung' AFTER `nama_ayah`;

ALTER TABLE `warga_belajar`
  ADD COLUMN `nama_ayah` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama Ayah / Bapak Kandung' AFTER `jumlah_saudara_kandung`,
  ADD COLUMN `nama_ibu` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Nama Ibu Kandung' AFTER `nama_ayah`;

