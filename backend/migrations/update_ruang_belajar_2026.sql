-- ============================================================
-- Migration: update_ruang_belajar_2026.sql
-- Keputusan Kepala PKBM Bina Mandiri Kecamatan Paseh
-- Nomor   : 01.010/PKBM-BM/VI/2026
-- Tanggal : 30 Juni 2026
-- TAHUN AJARAN 2026/2027
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bersihkan seluruh data mapping rombel_mapel lama
DELETE FROM `rombel_mapel`;

-- 2. Update / Insert Data Tutor & Operator (Lampiran I SK)
-- Default bcrypt hash for password 'PKBM1234!' (or 'password')
INSERT INTO `users` (`id`, `nama_lengkap`, `email`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'Indrayani, S.S.,M.Pd. Gr.', 'indrayani.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(11, 'Ihsani Rizkyanti, S.E.', 'ihsani.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(12, 'M. Ihsan Fadhillah, S.Kom.', 'ihsan.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(13, 'Sri Winarsih, S.Pd.', 'sri.winarsih.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(14, 'Ilham Maulana Yasin, S.Kom.', 'ilham.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(15, 'Kurniawan, S.Sos., Gr.', 'kurniawan.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(16, 'M. Iqbal Fauzil Adhim, S.E.', 'iqbal.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(17, 'Lia Karlia, S.Sos.', 'lia.karlia.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(18, 'Tarisa Aidil Alzahra, S.E.', 'tarisa.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NOW(), NOW()),
(19, 'Heryadi Safari', 'heryadi.tu@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'admin', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nama_lengkap = VALUES(nama_lengkap),
  email = VALUES(email),
  role = VALUES(role),
  is_active = 1;

-- 3. Update Daftar Rombongan Belajar (Rombel)
INSERT INTO `rombel` (`id`, `nama_rombel`, `jenjang`, `tahun_ajaran_id`, `tutor_wali_id`, `kapasitas`, `created_at`) VALUES
(1, 'Kelas 1 Paket A', 'paket_a', 1, 13, 30, NOW()),
(2, 'Kelas 2 Paket A', 'paket_a', 1, 11, 30, NOW()),
(3, 'Kelas 7-1 Paket B', 'paket_b', 1, 15, 30, NOW()),
(4, 'Kelas 7-2 Paket B', 'paket_b', 1, 14, 30, NOW()),
(5, 'Kelas 8-1 Paket B', 'paket_b', 1, 16, 30, NOW()),
(6, 'Kelas 8-2 Paket B', 'paket_b', 1, 17, 30, NOW()),
(7, 'Kelas 10-1 Paket C', 'paket_c', 1, 2, 30, NOW()),
(8, 'Kelas 10-2 Paket C', 'paket_c', 1, 12, 30, NOW()),
(9, 'Kelas 11-1 Paket C', 'paket_c', 1, 18, 30, NOW()),
(10, 'Kelas 11-2 Paket C', 'paket_c', 1, 11, 30, NOW())
ON DUPLICATE KEY UPDATE 
  nama_rombel = VALUES(nama_rombel),
  jenjang = VALUES(jenjang),
  tutor_wali_id = VALUES(tutor_wali_id);

-- 4. Perbarui Daftar Mata Pelajaran (mata_pelajaran) sesuai SK Resmi
DELETE FROM `mata_pelajaran`;

INSERT INTO `mata_pelajaran` (`id`, `kode`, `nama`, `jenjang`, `deskripsi`, `is_active`, `created_at`) VALUES
(1, 'PAI-BP', 'Pendidikan Agama Islam dan Budi Pekerti', 'semua', 'Mata pelajaran pembinaan akhlak mulia dan pemahaman nilai-nilai keagamaan.', 1, NOW()),
(2, 'PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'semua', 'Pendidikan kebugaran jasmani, kesehatan, dan sportivitas warga belajar.', 1, NOW()),
(3, 'GK-A', 'Guru Kelas (Tematik)', 'paket_a', 'Pembelajaran tematik terpadu kurikulum kesetaraan Paket A.', 1, NOW()),
(4, 'IPS', 'Ilmu Pengetahuan Sosial', 'semua', 'Kajian mengenai lingkungan sosial, dinamika masyarakat, dan wawasan kebangsaan.', 1, NOW()),
(5, 'BIND', 'Bahasa Indonesia', 'semua', 'Pengembangan literasi berbahasa, komunikasi santun, dan kemampuan teks sastra & ilmiah.', 1, NOW()),
(6, 'MTK', 'Matematika', 'semua', 'Pengembangan nalar logika, perhitungan numerasi, dan pemecahan masalah kuantitatif.', 1, NOW()),
(7, 'PKT', 'Pemberdayaan dan Keterampilan', 'paket_b', 'Pengembangan soft skills, pemberdayaan ekonomi komunitas, dan keterampilan vokasional.', 1, NOW()),
(8, 'PPKN', 'Pendidikan Pancasila', 'semua', 'Penguatan ideologi Pancasila, konstitusi, hak kewajiban, dan persatuan Indonesia.', 1, NOW()),
(9, 'BING', 'Bahasa Inggris', 'paket_b', 'Peningkatan kemampuan komunikasi bahasa internasional, lisan dan tulisan.', 1, NOW()),
(10, 'IPA', 'Ilmu Pengetahuan Alam', 'semua', 'Eksplorasi fenomena alam, sains kontekstual, biologi, dan fisika aplikatif.', 1, NOW()),
(11, 'SBD', 'Seni dan Budaya', 'semua', 'Pengembangan apresiasi karya seni visual, musik tradisional & nusantara.', 1, NOW()),
(12, 'BARB', 'Bahasa Arab', 'paket_c', 'Penguasaan dasar bahasa Arab, kaidah qawaid, dan literasi teks.', 1, NOW()),
(13, 'PBD', 'Pemberdayaan', 'paket_c', 'Pemberdayaan kemandirian wirausaha dan aksi sosial warga belajar Paket C.', 1, NOW()),
(14, 'EKO', 'Ekonomi', 'paket_c', 'Prinsip perekonomian, akuntansi dasar, pasar modal, dan pengelolaan finansial.', 1, NOW()),
(15, 'KTR-IT', 'Keterampilan (Informatika)', 'paket_c', 'Keterampilan teknologi informasi, komputerisasi, dan digitalisasi.', 1, NOW()),
(16, 'SEJ', 'Sejarah', 'paket_c', 'Sejarah perjuangan bangsa Indonesia dan peradaban dunia.', 1, NOW()),
(17, 'KTR-PKW', 'Keterampilan (Prakarya & Kewirausahaan)', 'paket_c', 'Kerajinan tangan, produk olahan bernilai jual, dan wirausaha mandiri.', 1, NOW());

-- 5. Masukkan Data Pembagian Tugas Mengajar ke rombel_mapel
-- ============================================================
-- A. PAKET A (Lampiran II SK)
-- Kelas 1 (Rombel ID 1)
-- - Sri Winarsih, S.Pd. (ID 13) -> Guru Kelas (ID 3)
-- - M. Iqbal Fauzil Adhim, S.E. (ID 16) -> PJOK (ID 2)
-- - Indrayani, S.S.,M.Pd. Gr. (ID 2) -> PAI-BP (ID 1)
-- ============================================================
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`) VALUES
(1, 3, 13, 1, 1, NOW()),
(1, 2, 16, 1, 2, NOW()),
(1, 1, 2, 1, 3, NOW());

-- Kelas 2 (Rombel ID 2)
-- - Ihsani Rizkyanti, S.E. (ID 11) -> Guru Kelas (ID 3)
-- - M. Iqbal Fauzil Adhim, S.E. (ID 16) -> PJOK (ID 2)
-- - Indrayani, S.S.,M.Pd. Gr. (ID 2) -> PAI-BP (ID 1)
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`) VALUES
(2, 3, 11, 1, 1, NOW()),
(2, 2, 16, 1, 2, NOW()),
(2, 1, 2, 1, 3, NOW());

-- ============================================================
-- B. PAKET B (Pembagian Tugas Mengajar Paket B SK)
-- Rombels:
-- - Kelas 7-1 (Rombel ID 3)
-- - Kelas 7-2 (Rombel ID 4)
-- - Kelas 8-1 (Rombel ID 5)
-- - Kelas 8-2 (Rombel ID 6)
--
-- Mapel & Tutor:
-- 1. IPS (ID 4) -> Ihsani Rizkyanti, S.E. (ID 11)
-- 2. PAI-BP (ID 1) -> Indrayani, S.S.,M.Pd. Gr. (ID 2)
-- 3. Bahasa Indonesia (ID 5) -> Indrayani, S.S.,M.Pd. Gr. (ID 2)
-- 4. Matematika (ID 6) -> Sri Winarsih, S.Pd. (ID 13)
-- 5. Pemberdayaan dan Keterampilan (ID 7) -> Ilham Maulana Yasin, S.Kom. (ID 14)
-- 6. Pendidikan Pancasila (ID 8) -> Kurniawan, S.Sos., Gr. (ID 15)
-- 7. Bahasa Inggris (ID 9) -> M. Iqbal Fauzil Adhim, S.E. (ID 16)
-- 8. PJOK (ID 2) -> M. Iqbal Fauzil Adhim, S.E. (ID 16)
-- 9. IPA (ID 10) -> Lia Karlia, S.Sos. (ID 17)
-- 10. Seni dan Budaya (ID 11) -> Tarisa Aidil Alzahra, S.E. (ID 18)
-- ============================================================
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 4, 11, 1, 1, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 1, 2, 1, 2, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 5, 2, 1, 3, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 6, 13, 1, 4, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 7, 14, 1, 5, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 8, 15, 1, 6, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 9, 16, 1, 7, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 2, 16, 1, 8, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 10, 17, 1, 9, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 11, 18, 1, 10, NOW() FROM (SELECT 3 AS r_id UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) t;

-- ============================================================
-- C. PAKET C (Pembagian Tugas Mengajar Paket C SK)
-- Rombels:
-- - Kelas 10-1 (Rombel ID 7)
-- - Kelas 10-2 (Rombel ID 8)
-- - Kelas 11-1 (Rombel ID 9)
-- - Kelas 11-2 (Rombel ID 10)
--
-- Mapel & Tutor:
-- 1. PAI-BP (ID 1) -> Indrayani, S.S.,M.Pd. Gr. (ID 2)
-- 2. Bahasa Indonesia (ID 5) -> Indrayani, S.S.,M.Pd. Gr. (ID 2)
-- 3. Bahasa Arab (ID 12) -> Indrayani, S.S.,M.Pd. Gr. (ID 2)
-- 4. IPS (ID 4) -> Ihsani Rizkyanti, S.E. (ID 11)
-- 5. Pemberdayaan (ID 13) -> Ihsani Rizkyanti, S.E. (ID 11)
-- 6. Ekonomi (ID 14) -> Ihsani Rizkyanti, S.E. (ID 11)
-- 7. Keterampilan - Informatika (ID 15) -> M. Ihsan Fadhillah, S.Kom. (ID 12)
-- 8. PJOK (ID 2) -> M. Ihsan Fadhillah, S.Kom. (ID 12)
-- 9. Matematika (ID 6) -> Sri Winarsih, S.Pd. (ID 13)
-- 10. Pendidikan Pancasila (ID 8) -> Kurniawan, S.Sos., Gr. (ID 15)
-- 11. Sejarah (ID 16) -> Kurniawan, S.Sos., Gr. (ID 15)
-- 12. IPA (ID 10) -> Lia Karlia, S.Sos. (ID 17)
-- 13. Keterampilan - Prakarya (ID 17) -> Lia Karlia, S.Sos. (ID 17)
-- 14. Seni dan Budaya (ID 11) -> Tarisa Aidil Alzahra, S.E. (ID 18)
-- ============================================================
INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 1, 2, 1, 1, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 5, 2, 1, 2, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 12, 2, 1, 3, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 4, 11, 1, 4, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 13, 11, 1, 5, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 14, 11, 1, 6, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 15, 12, 1, 7, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 2, 12, 1, 8, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 6, 13, 1, 9, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 8, 15, 1, 10, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 16, 15, 1, 11, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 10, 17, 1, 12, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 17, 17, 1, 13, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

INSERT INTO `rombel_mapel` (`rombel_id`, `mapel_id`, `tutor_id`, `is_visible`, `urutan`, `created_at`)
SELECT r_id, 11, 18, 1, 14, NOW() FROM (SELECT 7 AS r_id UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) t;

SET FOREIGN_KEY_CHECKS = 1;

