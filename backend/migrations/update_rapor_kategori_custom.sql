-- ============================================================
-- Migrasi Database Rapor: Kategori Mapel, Wali Kelas, Fase & Kustom
-- ============================================================

ALTER TABLE rapor_periode ADD COLUMN IF NOT EXISTS nama_wali_kelas VARCHAR(150) NULL;
ALTER TABLE rapor_periode ADD COLUMN IF NOT EXISTS fase VARCHAR(20) NULL;
ALTER TABLE rapor_periode ADD COLUMN IF NOT EXISTS data_kustom LONGTEXT NULL;

ALTER TABLE rapor_nilai ADD COLUMN IF NOT EXISTS kategori VARCHAR(50) NOT NULL DEFAULT 'umum';
ALTER TABLE rapor_nilai ADD COLUMN IF NOT EXISTS nama_mapel_kustom VARCHAR(150) NULL;
ALTER TABLE rapor_nilai MODIFY COLUMN mapel_id INT UNSIGNED NULL;

