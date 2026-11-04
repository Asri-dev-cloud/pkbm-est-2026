-- ============================================================
-- Migration: update_classes_rombel.sql
-- Memperbarui seluruh daftar rombel (kelas) menjadi 10 rombel baru:
-- 1. Kelas 1 Paket A
-- 2. Kelas 2 Paket A
-- 3. Kelas 7-1 Paket B
-- 4. Kelas 7-2 Paket B
-- 5. Kelas 8-1 Paket B
-- 6. Kelas 8-2 Paket B
-- 7. Kelas 10-1 Paket C
-- 8. Kelas 10-2 Paket C
-- 9. Kelas 11-1 Paket C
-- 10. Kelas 11-2 Paket C
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Hapus data rombel_mapel lama
DELETE FROM `rombel_mapel`;

-- 2. Hapus data rombel lama
DELETE FROM `rombel`;

-- 3. Masukkan 10 rombel baru
INSERT INTO `rombel` (`id`, `nama_rombel`, `jenjang`, `tahun_ajaran_id`, `tutor_wali_id`, `kapasitas`, `created_at`) VALUES
(1, 'Kelas 1 Paket A', 'paket_a', 1, NULL, 30, NOW()),
(2, 'Kelas 2 Paket A', 'paket_a', 1, NULL, 30, NOW()),
(3, 'Kelas 7-1 Paket B', 'paket_b', 1, NULL, 30, NOW()),
(4, 'Kelas 7-2 Paket B', 'paket_b', 1, NULL, 30, NOW()),
(5, 'Kelas 8-1 Paket B', 'paket_b', 1, NULL, 30, NOW()),
(6, 'Kelas 8-2 Paket B', 'paket_b', 1, NULL, 30, NOW()),
(7, 'Kelas 10-1 Paket C', 'paket_c', 1, NULL, 30, NOW()),
(8, 'Kelas 10-2 Paket C', 'paket_c', 1, NULL, 30, NOW()),
(9, 'Kelas 11-1 Paket C', 'paket_c', 1, NULL, 30, NOW()),
(10, 'Kelas 11-2 Paket C', 'paket_c', 1, NULL, 30, NOW());

-- 4. Sinkronisasikan rombel_id pada warga_belajar sesuai jenjang
UPDATE `warga_belajar` SET `rombel_id` = 1 WHERE `jenjang` = 'paket_a';
UPDATE `warga_belajar` SET `rombel_id` = 3 WHERE `jenjang` = 'paket_b';
UPDATE `warga_belajar` SET `rombel_id` = 7 WHERE `jenjang` = 'paket_c';

-- 5. Hubungkan mata pelajaran ke tiap rombel baru (rombel_mapel)
-- Paket A: Rombel 1 & 2
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 1, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE `jenjang` = 'semua' AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 2, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE `jenjang` = 'semua' AND `is_active` = 1;

-- Paket B: Rombel 3, 4, 5, 6
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 3, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_b') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 4, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_b') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 5, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_b') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 6, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_b') AND `is_active` = 1;

-- Paket C: Rombel 7, 8, 9, 10
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 7, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_c') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 8, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_c') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 9, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_c') AND `is_active` = 1;
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT 10, id, 2, 1, id, NOW() FROM `mata_pelajaran` WHERE (`jenjang` = 'semua' OR `jenjang` = 'paket_c') AND `is_active` = 1;

SET FOREIGN_KEY_CHECKS = 1;

