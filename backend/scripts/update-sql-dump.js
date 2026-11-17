import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve('backend/pkbm_bina_mandiri.sql');
let content = fs.readFileSync(sqlPath, 'utf8');

// 1. New mata_pelajaran
const newMapel = `INSERT INTO \`mata_pelajaran\` (\`id\`, \`nama\`, \`kode\`, \`jenjang\`, \`deskripsi\`, \`is_active\`, \`created_at\`) VALUES
(1, 'Pendidikan Agama Islam dan Budi Pekerti', 'PAI-BP', 'semua', 'Mata pelajaran pembinaan akhlak mulia dan pemahaman nilai-nilai keagamaan.', 1, '2026-06-30 08:00:00'),
(2, 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 'PJOK', 'semua', 'Pendidikan kebugaran jasmani, kesehatan, dan sportivitas warga belajar.', 1, '2026-06-30 08:00:00'),
(3, 'Guru Kelas (Tematik)', 'GK-A', 'paket_a', 'Pembelajaran tematik terpadu kurikulum kesetaraan Paket A.', 1, '2026-06-30 08:00:00'),
(4, 'Ilmu Pengetahuan Sosial', 'IPS', 'semua', 'Kajian mengenai lingkungan sosial, dinamika masyarakat, dan wawasan kebangsaan.', 1, '2026-06-30 08:00:00'),
(5, 'Bahasa Indonesia', 'BIND', 'semua', 'Pengembangan literasi berbahasa, komunikasi santun, dan kemampuan teks sastra & ilmiah.', 1, '2026-06-30 08:00:00'),
(6, 'Matematika', 'MTK', 'semua', 'Pengembangan nalar logika, perhitungan numerasi, dan pemecahan masalah kuantitatif.', 1, '2026-06-30 08:00:00'),
(7, 'Pemberdayaan dan Keterampilan', 'PKT', 'paket_b', 'Pengembangan soft skills, pemberdayaan ekonomi komunitas, dan keterampilan vokasional.', 1, '2026-06-30 08:00:00'),
(8, 'Pendidikan Pancasila', 'PPKN', 'semua', 'Penguatan ideologi Pancasila, konstitusi, hak kewajiban, dan persatuan Indonesia.', 1, '2026-06-30 08:00:00'),
(9, 'Bahasa Inggris', 'BING', 'paket_b', 'Peningkatan kemampuan komunikasi bahasa internasional, lisan dan tulisan.', 1, '2026-06-30 08:00:00'),
(10, 'Ilmu Pengetahuan Alam', 'IPA', 'semua', 'Eksplorasi fenomena alam, sains kontekstual, biologi, dan fisika aplikatif.', 1, '2026-06-30 08:00:00'),
(11, 'Seni dan Budaya', 'SBD', 'semua', 'Pengembangan apresiasi karya seni visual, musik tradisional & nusantara.', 1, '2026-06-30 08:00:00'),
(12, 'Bahasa Arab', 'BARB', 'paket_c', 'Penguasaan dasar bahasa Arab, kaidah qawaid, dan literasi teks.', 1, '2026-06-30 08:00:00'),
(13, 'Pemberdayaan', 'PBD', 'paket_c', 'Pemberdayaan kemandirian wirausaha dan aksi sosial warga belajar Paket C.', 1, '2026-06-30 08:00:00'),
(14, 'Ekonomi', 'EKO', 'paket_c', 'Prinsip perekonomian, akuntansi dasar, pasar modal, dan pengelolaan finansial.', 1, '2026-06-30 08:00:00'),
(15, 'Keterampilan (Informatika)', 'KTR-IT', 'paket_c', 'Keterampilan teknologi informasi, komputerisasi, dan digitalisasi.', 1, '2026-06-30 08:00:00'),
(16, 'Sejarah', 'SEJ', 'paket_c', 'Sejarah perjuangan bangsa Indonesia dan peradaban dunia.', 1, '2026-06-30 08:00:00'),
(17, 'Keterampilan (Prakarya & Kewirausahaan)', 'KTR-PKW', 'paket_c', 'Kerajinan tangan, produk olahan bernilai jual, dan wirausaha mandiri.', 1, '2026-06-30 08:00:00');`;

content = content.replace(/INSERT INTO `mata_pelajaran`[\s\S]*?;\r?\n\r?\n-- --------------------------------------------------------/, `${newMapel}\n\n-- --------------------------------------------------------`);

// 2. New users (Include Tutors & Operator from Lampiran I)
const newUsers = `INSERT INTO \`users\` (\`id\`, \`nama_lengkap\`, \`email\`, \`password_hash\`, \`role\`, \`is_active\`, \`foto_profil\`, \`created_at\`, \`updated_at\`) VALUES
(1, 'Super Administrator', 'admin@pkbm-binamandiri.sch.id', '$2a$10$8iAA8wr.6aRcOT56L6uYZednMk1Lr0DsoejnOvyMbffNnqp1VYg..', 'super_admin', 1, NULL, '2026-05-11 21:22:42', '2026-05-12 13:55:43'),
(2, 'Indrayani, S.S.,M.Pd. Gr.', 'indrayani.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(3, 'Siti Rahayu', 'siti.admin@pkbm-binamandiri.sch.id', '$2a$10$zIJEoNEj5Z.bDc6KUWLbUeePa18iKhMWGdcDhzNUuig6veI1ymVIa', 'admin', 1, NULL, '2026-05-11 21:22:42', '2026-05-12 13:55:43'),
(5, 'Rudi', 'pimpinan@pkbm-binamandiri.sch.id', '$2a$10$w99QgTLfkWZNbg8Ld7W9wep6iajR20a1uaqrmviPySCKmi6J/u2ea', 'pimpinan', 1, NULL, '2026-05-12 14:34:25', NULL),
(11, 'Ihsani Rizkyanti, S.E.', 'ihsani.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(12, 'M. Ihsan Fadhillah, S.Kom.', 'ihsan.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(13, 'Sri Winarsih, S.Pd.', 'sri.winarsih.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(14, 'Ilham Maulana Yasin, S.Kom.', 'ilham.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(15, 'Kurniawan, S.Sos., Gr.', 'kurniawan.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(16, 'M. Iqbal Fauzil Adhim, S.E.', 'iqbal.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(17, 'Lia Karlia, S.Sos.', 'lia.karlia.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(18, 'Tarisa Aidil Alzahra, S.E.', 'tarisa.tutor@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'tutor', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00'),
(19, 'Heryadi Safari', 'heryadi.tu@pkbm-binamandiri.sch.id', '$2a$10$FJBucKkhAXJPDZ/bKiPxb.0gwPkwjiYSrnAJsOJ2eu6sI7yYrI3GS', 'admin', 1, NULL, '2026-06-30 08:00:00', '2026-06-30 08:00:00');`;

content = content.replace(/INSERT INTO `users`[\s\S]*?;\r?\n\r?\n-- --------------------------------------------------------/, `${newUsers}\n\n-- --------------------------------------------------------`);

// 3. New rombel_mapel
// Build the list of rows:
const rombelMapelRows = [];
let rmId = 1;

// Paket A: Kelas 1 (rombel 1)
rombelMapelRows.push(`(${rmId++}, 1, 3, 13, 1, 1, NULL, '2026-06-30 08:00:00')`); // Guru Kelas - Sri Winarsih
rombelMapelRows.push(`(${rmId++}, 1, 2, 16, 1, 2, NULL, '2026-06-30 08:00:00')`); // PJOK - M. Iqbal Fauzil Adhim
rombelMapelRows.push(`(${rmId++}, 1, 1, 2, 1, 3, NULL, '2026-06-30 08:00:00')`);  // PAI-BP - Indrayani

// Paket A: Kelas 2 (rombel 2)
rombelMapelRows.push(`(${rmId++}, 2, 3, 11, 1, 1, NULL, '2026-06-30 08:00:00')`); // Guru Kelas - Ihsani Rizkyanti
rombelMapelRows.push(`(${rmId++}, 2, 2, 16, 1, 2, NULL, '2026-06-30 08:00:00')`); // PJOK - M. Iqbal Fauzil Adhim
rombelMapelRows.push(`(${rmId++}, 2, 1, 2, 1, 3, NULL, '2026-06-30 08:00:00')`);  // PAI-BP - Indrayani

// Paket B: Classes 3, 4, 5, 6 (Kelas 7-1, 7-2, 8-1, 8-2)
const paketBClasses = [3, 4, 5, 6];
const paketBAssignments = [
  { mapel_id: 4, tutor_id: 11, urutan: 1 },  // IPS - Ihsani Rizkyanti
  { mapel_id: 1, tutor_id: 2, urutan: 2 },   // PAI-BP - Indrayani
  { mapel_id: 5, tutor_id: 2, urutan: 3 },   // Bahasa Indonesia - Indrayani
  { mapel_id: 6, tutor_id: 13, urutan: 4 },  // Matematika - Sri Winarsih
  { mapel_id: 7, tutor_id: 14, urutan: 5 },  // Pemberdayaan & Keterampilan - Ilham Maulana
  { mapel_id: 8, tutor_id: 15, urutan: 6 },  // Pendidikan Pancasila - Kurniawan
  { mapel_id: 9, tutor_id: 16, urutan: 7 },  // Bahasa Inggris - M. Iqbal
  { mapel_id: 2, tutor_id: 16, urutan: 8 },  // PJOK - M. Iqbal
  { mapel_id: 10, tutor_id: 17, urutan: 9 }, // IPA - Lia Karlia
  { mapel_id: 11, tutor_id: 18, urutan: 10 },// Seni dan Budaya - Tarisa Aidil
];

for (const cId of paketBClasses) {
  for (const a of paketBAssignments) {
    rombelMapelRows.push(`(${rmId++}, ${cId}, ${a.mapel_id}, ${a.tutor_id}, 1, ${a.urutan}, NULL, '2026-06-30 08:00:00')`);
  }
}

// Paket C: Classes 7, 8, 9, 10 (Kelas 10-1, 10-2, 11-1, 11-2)
const paketCClasses = [7, 8, 9, 10];
const paketCAssignments = [
  { mapel_id: 1, tutor_id: 2, urutan: 1 },   // PAI-BP - Indrayani
  { mapel_id: 5, tutor_id: 2, urutan: 2 },   // Bahasa Indonesia - Indrayani
  { mapel_id: 12, tutor_id: 2, urutan: 3 },  // Bahasa Arab - Indrayani
  { mapel_id: 4, tutor_id: 11, urutan: 4 },  // IPS - Ihsani Rizkyanti
  { mapel_id: 13, tutor_id: 11, urutan: 5 }, // Pemberdayaan - Ihsani Rizkyanti
  { mapel_id: 14, tutor_id: 11, urutan: 6 }, // Ekonomi - Ihsani Rizkyanti
  { mapel_id: 15, tutor_id: 12, urutan: 7 }, // Keterampilan (Informatika) - M. Ihsan Fadhillah
  { mapel_id: 2, tutor_id: 12, urutan: 8 },  // PJOK - M. Ihsan Fadhillah
  { mapel_id: 6, tutor_id: 13, urutan: 9 },  // Matematika - Sri Winarsih
  { mapel_id: 8, tutor_id: 15, urutan: 10 }, // Pendidikan Pancasila - Kurniawan
  { mapel_id: 16, tutor_id: 15, urutan: 11 },// Sejarah - Kurniawan
  { mapel_id: 10, tutor_id: 17, urutan: 12 },// IPA - Lia Karlia
  { mapel_id: 17, tutor_id: 17, urutan: 13 },// Keterampilan (Prakarya) - Lia Karlia
  { mapel_id: 11, tutor_id: 18, urutan: 14 },// Seni dan Budaya - Tarisa Aidil
];

for (const cId of paketCClasses) {
  for (const a of paketCAssignments) {
    rombelMapelRows.push(`(${rmId++}, ${cId}, ${a.mapel_id}, ${a.tutor_id}, 1, ${a.urutan}, NULL, '2026-06-30 08:00:00')`);
  }
}

const newRombelMapel = `INSERT INTO \`rombel_mapel\` (\`id\`, \`rombel_id\`, \`mapel_id\`, \`tutor_id\`, \`is_visible\`, \`urutan\`, \`rps_file_path\`, \`created_at\`) VALUES\n` + rombelMapelRows.join(',\n') + ';';

content = content.replace(/INSERT INTO `rombel_mapel`[\s\S]*?;\r?\n\r?\n-- --------------------------------------------------------/, `${newRombelMapel}\n\n-- --------------------------------------------------------`);

fs.writeFileSync(sqlPath, content, 'utf8');
console.log('✅ Successfully updated backend/pkbm_bina_mandiri.sql with', rmId - 1, 'rombel_mapel entries and new tutors & mapels!');

