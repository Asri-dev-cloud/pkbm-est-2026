-- ============================================================
-- Migrasi Database Rapor: Kategori Mapel, Wali Kelas, Fase & Kustom
-- Kompatibel dengan semua versi MySQL / MariaDB (tanpa IF NOT EXISTS)
-- ============================================================

ALTER TABLE rapor_periode ADD COLUMN nama_wali_kelas VARCHAR(150) NULL;
ALTER TABLE rapor_periode ADD COLUMN fase VARCHAR(20) NULL;
ALTER TABLE rapor_periode ADD COLUMN data_kustom LONGTEXT NULL;

ALTER TABLE rapor_nilai ADD COLUMN kategori VARCHAR(50) NOT NULL DEFAULT 'umum';
ALTER TABLE rapor_nilai ADD COLUMN nama_mapel_kustom VARCHAR(150) NULL;
ALTER TABLE rapor_nilai MODIFY COLUMN mapel_id INT UNSIGNED NULL;
