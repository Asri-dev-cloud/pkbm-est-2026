-- ============================================================
-- Migration: add_dapodik_fields.sql
-- Menambahkan field Dapodik ke pendaftar_spmb & warga_belajar:
-- 1. jarak_rumah_km (jarak dari rumah ke sekolah dalam km)
-- 2. tinggi_badan (dalam cm)
-- 3. berat_badan (dalam kg)
-- 4. jumlah_saudara_kandung (jumlah saudara kandung)
-- ============================================================

ALTER TABLE `pendaftar_spmb`
  ADD COLUMN `jarak_rumah_km` DECIMAL(5,1) NULL DEFAULT NULL COMMENT 'Jarak rumah ke sekolah (km)' AFTER `alamat`,
  ADD COLUMN `tinggi_badan` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Tinggi badan (cm)' AFTER `jarak_rumah_km`,
  ADD COLUMN `berat_badan` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Berat badan (kg)' AFTER `tinggi_badan`,
  ADD COLUMN `jumlah_saudara_kandung` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Jumlah saudara kandung' AFTER `berat_badan`;

ALTER TABLE `warga_belajar`
  ADD COLUMN `jarak_rumah_km` DECIMAL(5,1) NULL DEFAULT NULL COMMENT 'Jarak rumah ke sekolah (km)' AFTER `alamat`,
  ADD COLUMN `tinggi_badan` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Tinggi badan (cm)' AFTER `jarak_rumah_km`,
  ADD COLUMN `berat_badan` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Berat badan (kg)' AFTER `tinggi_badan`,
  ADD COLUMN `jumlah_saudara_kandung` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Jumlah saudara kandung' AFTER `berat_badan`;

