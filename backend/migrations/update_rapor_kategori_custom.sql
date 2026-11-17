-- ============================================================
-- Migrasi Database Rapor: Kategori Mapel, Wali Kelas, Fase & Kustom
-- Aman, bebas error duplikat, dan kompatibel untuk semua versi MySQL
-- ============================================================

DROP PROCEDURE IF EXISTS migrasi_rapor_2026;

DELIMITER $$
CREATE PROCEDURE migrasi_rapor_2026()
BEGIN
    -- 1. Tambah nama_wali_kelas jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rapor_periode' AND COLUMN_NAME = 'nama_wali_kelas'
    ) THEN
        ALTER TABLE rapor_periode ADD COLUMN nama_wali_kelas VARCHAR(150) NULL;
    END IF;

    -- 2. Tambah fase jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rapor_periode' AND COLUMN_NAME = 'fase'
    ) THEN
        ALTER TABLE rapor_periode ADD COLUMN fase VARCHAR(20) NULL;
    END IF;

    -- 3. Tambah data_kustom jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rapor_periode' AND COLUMN_NAME = 'data_kustom'
    ) THEN
        ALTER TABLE rapor_periode ADD COLUMN data_kustom LONGTEXT NULL;
    END IF;

    -- 4. Tambah kategori jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rapor_nilai' AND COLUMN_NAME = 'kategori'
    ) THEN
        ALTER TABLE rapor_nilai ADD COLUMN kategori VARCHAR(50) NOT NULL DEFAULT 'umum';
    END IF;

    -- 5. Tambah nama_mapel_kustom jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rapor_nilai' AND COLUMN_NAME = 'nama_mapel_kustom'
    ) THEN
        ALTER TABLE rapor_nilai ADD COLUMN nama_mapel_kustom VARCHAR(150) NULL;
    END IF;

    -- 6. Modifikasi mapel_id agar boleh NULL untuk mapel kustom
    ALTER TABLE rapor_nilai MODIFY COLUMN mapel_id INT UNSIGNED NULL;
END$$

DELIMITER ;

CALL migrasi_rapor_2026();

DROP PROCEDURE IF EXISTS migrasi_rapor_2026;
