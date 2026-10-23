-- Migration: Menambahkan kolom rps_file_path pada tabel rombel_mapel
ALTER TABLE `rombel_mapel` ADD COLUMN `rps_file_path` VARCHAR(255) NULL DEFAULT NULL AFTER `urutan`;
