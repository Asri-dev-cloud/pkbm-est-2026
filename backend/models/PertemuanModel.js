// ============================================================
// models/PertemuanModel.js
// Model untuk mengelola Pertemuan Belajar (pertemuan_belajar)
// serta Forum Diskusi pertemuan (komentar_pertemuan).
// ============================================================

import pool from '../config/db.js';

const PertemuanModel = {

  // -----------------------------------------------------------
  // Buat pertemuan belajar baru
  // -----------------------------------------------------------
  create: async ({ rombel_id, mapel_id, tutor_id, pertemuan_ke, judul, rencana_materi, metode_belajar, tanggal_pelaksanaan, pengumuman, is_published = 1 }) => {
    const sql = `
      INSERT INTO pertemuan_belajar
        (rombel_id, mapel_id, tutor_id, pertemuan_ke, judul, rencana_materi, metode_belajar, tanggal_pelaksanaan, is_published, pengumuman)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      rombel_id, mapel_id, tutor_id, pertemuan_ke, judul,
      rencana_materi || null, metode_belajar || 'hybrid', tanggal_pelaksanaan, is_published ? 1 : 0, pengumuman || null
    ]);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Ambil semua pertemuan untuk satu rombel & mapel tertentu
  // -----------------------------------------------------------
  findByRombelAndMapel: async (rombel_id, mapel_id, { onlyPublished = false } = {}) => {
    let sql = `
      SELECT p.*, u.nama_lengkap AS nama_tutor
      FROM pertemuan_belajar p
      JOIN users u ON u.id = p.tutor_id
      WHERE p.rombel_id = ? AND p.mapel_id = ?
    `;
    const params = [rombel_id, mapel_id];
    
    if (onlyPublished) {
      sql += ` AND p.is_published = 1`;
    }
    
    sql += ` ORDER BY p.pertemuan_ke ASC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil detail satu pertemuan belajar
  // -----------------------------------------------------------
  findById: async (id) => {
    const sql = `
      SELECT p.*, u.nama_lengkap AS nama_tutor, r.nama_rombel, mp.nama AS nama_mapel, mp.kode AS kode_mapel
      FROM pertemuan_belajar p
      JOIN users u ON u.id = p.tutor_id
      JOIN rombel r ON r.id = p.rombel_id
      JOIN mata_pelajaran mp ON mp.id = p.mapel_id
      WHERE p.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  },

  // -----------------------------------------------------------
  // Update data pertemuan belajar
  // -----------------------------------------------------------
  update: async (id, { judul, rencana_materi, metode_belajar, tanggal_pelaksanaan, pertemuan_ke, pengumuman }) => {
    const sql = `
      UPDATE pertemuan_belajar
      SET judul = ?, rencana_materi = ?, metode_belajar = ?, tanggal_pelaksanaan = ?, pertemuan_ke = ?, pengumuman = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [judul, rencana_materi || null, metode_belajar, tanggal_pelaksanaan, pertemuan_ke, pengumuman || null, id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Toggle publish pertemuan belajar
  // -----------------------------------------------------------
  togglePublish: async (id, is_published) => {
    const sql = `
      UPDATE pertemuan_belajar
      SET is_published = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [is_published ? 1 : 0, id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Hapus pertemuan belajar
  // -----------------------------------------------------------
  delete: async (id) => {
    const sql = `DELETE FROM pertemuan_belajar WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Ambil data materi terhubung ke pertemuan
  // -----------------------------------------------------------
  findMateri: async (pertemuan_id) => {
    const sql = `
      SELECT * FROM materi_pembelajaran
      WHERE pertemuan_id = ? AND is_published = 1
      ORDER BY urutan ASC, created_at ASC
    `;
    const [rows] = await pool.execute(sql, [pertemuan_id]);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil data tugas terhubung ke pertemuan
  // -----------------------------------------------------------
  findTugas: async (pertemuan_id) => {
    const sql = `
      SELECT * FROM tugas
      WHERE pertemuan_id = ? AND is_aktif = 1
      ORDER BY deadline ASC
    `;
    const [rows] = await pool.execute(sql, [pertemuan_id]);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil data sesi absensi terhubung ke pertemuan
  // -----------------------------------------------------------
  findAbsensiSesi: async (pertemuan_id) => {
    const sql = `
      SELECT sa.*, 
        CASE
          WHEN sa.mode = 'mandiri' AND sa.status_sesi = 'aktif' AND sa.durasi_timer IS NOT NULL
          THEN GREATEST(0, sa.durasi_timer - TIMESTAMPDIFF(SECOND, sa.waktu_mulai, NOW()))
          ELSE NULL
        END AS sisa_timer_detik
      FROM sesi_absensi sa
      WHERE sa.pertemuan_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [pertemuan_id]);
    return rows[0] || null;
  },

  // -----------------------------------------------------------
  // Ambil rekaman kehadiran Warga Belajar untuk sesi absensi
  // -----------------------------------------------------------
  findKehadiranWB: async (sesi_id, warga_belajar_id) => {
    const sql = `
      SELECT * FROM rekaman_kehadiran
      WHERE sesi_id = ? AND warga_belajar_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [sesi_id, warga_belajar_id]);
    return rows[0] || null;
  },

  // -----------------------------------------------------------
  // Forum Diskusi: Ambil semua komentar untuk satu pertemuan
  // -----------------------------------------------------------
  findComments: async (pertemuan_id) => {
    const sql = `
      SELECT kp.*, u.nama_lengkap, u.role, u.foto_profil
      FROM komentar_pertemuan kp
      JOIN users u ON u.id = kp.user_id
      WHERE kp.pertemuan_id = ?
      ORDER BY kp.created_at ASC
    `;
    const [rows] = await pool.execute(sql, [pertemuan_id]);
    return rows;
  },

  // -----------------------------------------------------------
  // Forum Diskusi: Tambahkan komentar baru
  // -----------------------------------------------------------
  addComment: async ({ pertemuan_id, user_id, isi }) => {
    const sql = `
      INSERT INTO komentar_pertemuan (pertemuan_id, user_id, isi)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [pertemuan_id, user_id, isi]);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Forum Diskusi: Hapus komentar
  // -----------------------------------------------------------
  deleteComment: async (id, user_id) => {
    const sql = `DELETE FROM komentar_pertemuan WHERE id = ? AND user_id = ?`;
    const [result] = await pool.execute(sql, [id, user_id]);
    return result.affectedRows;
  }
};

export default PertemuanModel;
