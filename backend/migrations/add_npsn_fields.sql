-- ============================================================
-- Migration: add_npsn_fields.sql
-- Menambahkan field npsn dan nisn ke warga_belajar & pendaftar_spmb
-- Supaya admin dapat mengedit NPSN siswa dan langsung tersimpan ke database.
-- ============================================================

ALTER TABLE `warga_belajar`
  ADD COLUMN `npsn` VARCHAR(20) NULL DEFAULT 'P2970848' COMMENT 'Nomor Pokok Sekolah Nasional' AFTER `nik`,
  ADD COLUMN `nisn` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Nomor Induk Siswa Nasional' AFTER `npsn`;

ALTER TABLE `pendaftar_spmb`
  ADD COLUMN `npsn` VARCHAR(20) NULL DEFAULT 'P2970848' COMMENT 'Nomor Pokok Sekolah Nasional' AFTER `nik`,
  ADD COLUMN `nisn` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Nomor Induk Siswa Nasional' AFTER `npsn`;

UPDATE `warga_belajar` SET `npsn` = 'P2970848' WHERE `npsn` IS NULL OR `npsn` = '' OR `npsn` = 'P9962854' OR `npsn` = 'P9962879';
UPDATE `pendaftar_spmb` SET `npsn` = 'P2970848' WHERE `npsn` IS NULL OR `npsn` = '' OR `npsn` = 'P9962854' OR `npsn` = 'P9962879';

