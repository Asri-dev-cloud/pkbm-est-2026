// ============================================================
// models/MateriModel.js
// Model untuk Modul KBM/LMS: Materi Pembelajaran, Tugas,
// Pengumpulan Tugas, dan Jadwal KBM.
// ============================================================

import pool from '../config/db.js';

// ========================
// SUB-MODEL: Materi
// ========================
export const MateriModel = {

  findNextUrutanByRombel: async (rombel_id, mapel_id = null) => {
    let sql = `
      SELECT COALESCE(MAX(NULLIF(urutan, 0)), 0) + 1 AS next_urutan
      FROM materi_pembelajaran
      WHERE rombel_id = ?
    `;
    const params = [rombel_id];

    if (mapel_id) {
      sql += ' AND mapel_id = ?';
      params.push(mapel_id);
    }

    const [rows] = await pool.execute(sql, params);
    return rows[0]?.next_urutan || 1;
  },

  findByRombel: async (rombel_id, mapel_id = null) => {
    let sql = `
      SELECT m.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
      FROM materi_pembelajaran m
      JOIN mata_pelajaran mp ON mp.id = m.mapel_id
      JOIN users u ON u.id = m.tutor_id
      WHERE m.rombel_id = ?
    `;
    const params = [rombel_id];
    if (mapel_id) { sql += ` AND m.mapel_id = ?`; params.push(mapel_id); }
    sql += ` ORDER BY m.urutan ASC, m.created_at ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
       FROM materi_pembelajaran m
       JOIN mata_pelajaran mp ON mp.id = m.mapel_id
       JOIN users u ON u.id = m.tutor_id
       WHERE m.id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, deskripsi, tipe, path_file, url, urutan, is_published = 1, pertemuan_id }) => {
    const finalUrutan = Number(urutan) > 0
      ? Number(urutan)
      : await MateriModel.findNextUrutanByRombel(rombel_id, mapel_id);

    const sql = `
      INSERT INTO materi_pembelajaran
        (rombel_id, mapel_id, tutor_id, judul, deskripsi, tipe, path_file, url, urutan, is_published, pertemuan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul,
      deskripsi || null, tipe, path_file || null, url || null, finalUrutan,
      is_published ? 1 : 0,
      pertemuan_id || null
    ]);
    return result.insertId;
  },

  // Toggle publish/unpublish materi
  togglePublish: async (id, is_published) => {
    const [result] = await pool.execute(
      `UPDATE materi_pembelajaran SET is_published = ?, updated_at = NOW() WHERE id = ?`,
      [is_published ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  // Catat bahwa WB sudah membuka materi ini (tracking progres)
  catatProgres: async (warga_belajar_id, materi_id, status = 'dibuka') => {
    const sql = `
      INSERT INTO progres_materi (warga_belajar_id, materi_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = IF(VALUES(status) = 'selesai', 'selesai', status),
        selesai_pada = IF(VALUES(status) = 'selesai', NOW(), selesai_pada)
    `;
    await pool.execute(sql, [warga_belajar_id, materi_id, status]);
  },
};

// ========================
// SUB-MODEL: Tugas
// ========================
export const TugasModel = {

  findByRombel: async (rombel_id, mapel_id = null, { warga_belajar_id = null } = {}) => {
    let sql = `
      SELECT t.*,
        COALESCE(mp.nama, 'Mata Pelajaran') AS nama_mapel,
        COALESCE(u.nama_lengkap, 'Tutor / Admin') AS nama_tutor,
        pb.pertemuan_ke, pb.judul AS judul_pertemuan,
        (SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) AS jumlah_terkumpul
      FROM tugas t
      LEFT JOIN mata_pelajaran mp ON mp.id = t.mapel_id
      LEFT JOIN users u ON u.id = t.tutor_id
      LEFT JOIN pertemuan_belajar pb ON pb.id = t.pertemuan_id
      WHERE (
        t.rombel_id = ?
        OR t.rombel_id IN (
          SELECT r2.id FROM rombel r2 WHERE r2.jenjang = (
            SELECT COALESCE(r1.jenjang, '') FROM rombel r1 WHERE r1.id = ? LIMIT 1
          )
        )
      )
    `;
    const params = [rombel_id, rombel_id];
    if (mapel_id) { sql += ` AND t.mapel_id = ?`; params.push(mapel_id); }
    sql += ` ORDER BY t.id DESC, t.deadline ASC`;
    const [rows] = await pool.execute(sql, params);

    if (!warga_belajar_id || rows.length === 0) {
      return rows;
    }

    const tugasIds = rows.map((row) => row.id);
    const placeholders = tugasIds.map(() => '?').join(',');
    const [pengumpulanRows] = await pool.execute(
      `
        SELECT *
        FROM pengumpulan_tugas
        WHERE warga_belajar_id = ? AND tugas_id IN (${placeholders})
      `,
      [warga_belajar_id, ...tugasIds]
    );

    const pengumpulanMap = {};
    pengumpulanRows.forEach((row) => {
      pengumpulanMap[row.tugas_id] = row;
    });

    return rows.map((row) => ({
      ...row,
      pengumpulan_saya: pengumpulanMap[row.id] || null,
    }));
  },

  findPengumpulanByTugasDanWb: async (tugas_id, warga_belajar_id) => {
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM pengumpulan_tugas
        WHERE tugas_id = ? AND warga_belajar_id = ?
        LIMIT 1
      `,
      [tugas_id, warga_belajar_id]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const [tugas] = await pool.execute(
      `SELECT t.*,
         COALESCE(mp.nama, 'Mata Pelajaran') AS nama_mapel,
         COALESCE(u.nama_lengkap, 'Tutor / Admin') AS nama_tutor
       FROM tugas t
       LEFT JOIN mata_pelajaran mp ON mp.id = t.mapel_id
       LEFT JOIN users u ON u.id = t.tutor_id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    if (!tugas[0]) return null;

    // Ambil semua pengumpulan untuk tugas ini
    const [pengumpulan] = await pool.execute(
      `SELECT pt.*, u2.nama_lengkap, wb.nis
       FROM pengumpulan_tugas pt
       JOIN warga_belajar wb ON wb.id = pt.warga_belajar_id
       JOIN users u2 ON u2.id = wb.user_id
       WHERE pt.tugas_id = ?
       ORDER BY pt.submitted_at ASC`,
      [id]
    );
    return { ...tugas[0], pengumpulan };
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks, pertemuan_id }) => {
    const sql = `
      INSERT INTO tugas (rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks, pertemuan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul, deskripsi, deadline, nilai_maks || 100, pertemuan_id || null
    ]);
    return result.insertId;
  },

  // WB mengumpulkan jawaban tugas
  kumpulkanTugas: async ({ tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa }) => {
    const sql = `
      INSERT INTO pengumpulan_tugas
        (tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa, status)
      VALUES (?, ?, ?, ?, ?, 'terkumpul')
      ON DUPLICATE KEY UPDATE
        path_file = VALUES(path_file),
        nama_file = VALUES(nama_file),
        catatan_siswa = VALUES(catatan_siswa),
        submitted_at = NOW()
    `;
    const [result] = await pool.execute(sql, [
      tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa || null,
    ]);
    return result.insertId || result.affectedRows;
  },

  // Tutor menilai pengumpulan tugas
  nilaiTugas: async (pengumpulan_id, { nilai, feedback_tutor }) => {
    const sql = `
      UPDATE pengumpulan_tugas
      SET nilai = ?, feedback_tutor = ?, dinilai_at = NOW(), status = 'dinilai'
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [nilai, feedback_tutor || null, pengumpulan_id]);
    return result.affectedRows;
  },
};

// ========================
// SUB-MODEL: Jadwal KBM
// ========================
export const JadwalModel = {

  findByRombel: async (rombel_id) => {
    const [rows] = await pool.execute(
      `SELECT j.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor
       FROM jadwal_kbm j
       JOIN mata_pelajaran mp ON mp.id = j.mapel_id
       JOIN users u ON u.id = j.tutor_id
       WHERE j.rombel_id = ?
       ORDER BY j.waktu_mulai ASC`,
      [rombel_id]
    );
    return rows;
  },

  create: async ({ rombel_id, mapel_id, tutor_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan }) => {
    const sql = `
      INSERT INTO jadwal_kbm
        (rombel_id, mapel_id, tutor_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, judul,
      waktu_mulai, waktu_selesai, jenis || 'online',
      link_meeting || null, lokasi || null, catatan || null,
    ]);
    return result.insertId;
  },
};
