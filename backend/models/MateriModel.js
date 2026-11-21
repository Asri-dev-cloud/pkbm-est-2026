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

  findByRombel: async (rombel_id, mapel_id = null, { warga_belajar_id = null } = {}) => {
    let sql = `
      SELECT m.*, mp.nama AS nama_mapel, u.nama_lengkap AS nama_tutor,
        pb.pertemuan_ke, pb.judul AS judul_pertemuan,
        IF(pm.status = 'selesai', 1, 0) AS sudah_selesai
      FROM materi_pembelajaran m
      JOIN mata_pelajaran mp ON mp.id = m.mapel_id
      JOIN users u ON u.id = m.tutor_id
      LEFT JOIN pertemuan_belajar pb ON pb.id = m.pertemuan_id
      LEFT JOIN progres_materi pm ON pm.materi_id = m.id ${warga_belajar_id ? 'AND pm.warga_belajar_id = ?' : 'AND 1=0'}
      WHERE m.rombel_id = ?
    `;
    const params = warga_belajar_id ? [warga_belajar_id, rombel_id] : [rombel_id];
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

  findByRombel: async (rombel_id = null, mapel_id = null, { warga_belajar_id = null, user_id = null } = {}) => {
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
      WHERE (t.is_aktif = 1 OR t.is_aktif IS NULL)
    `;
    const params = [];
    if (mapel_id && rombel_id) {
      sql += ` AND (t.mapel_id = ? OR t.mapel_id IS NULL OR t.mapel_id = 0)`;
      params.push(mapel_id);
      sql += ` AND (t.rombel_id = ? OR t.rombel_id IS NULL OR t.rombel_id = 0)`;
      params.push(rombel_id);
    } else if (mapel_id) {
      sql += ` AND (t.mapel_id = ? OR t.mapel_id IS NULL OR t.mapel_id = 0)`;
      params.push(mapel_id);
    } else if (rombel_id) {
      sql += ` AND (t.rombel_id = ? OR t.rombel_id IS NULL OR t.rombel_id = 0)`;
      params.push(rombel_id);
    }
    sql += ` ORDER BY t.id DESC, t.deadline ASC`;

    let rows = [];
    try {
      const [res] = await pool.query(sql, params);
      rows = res || [];
    } catch (qErr) {
      console.warn('[findByRombel] Query error:', qErr.message);
    }

    // Fallback 1: Jika filter rombel menghasilkan 0 tugas tapi mapel_id ada
    if ((!rows || rows.length === 0) && mapel_id && !rombel_id) {
      try {
        const [fallbackRows] = await pool.query(
          `SELECT t.*,
            COALESCE(mp.nama, 'Mata Pelajaran') AS nama_mapel,
            COALESCE(u.nama_lengkap, 'Tutor / Admin') AS nama_tutor,
            pb.pertemuan_ke, pb.judul AS judul_pertemuan,
            (SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) AS jumlah_terkumpul
          FROM tugas t
          LEFT JOIN mata_pelajaran mp ON mp.id = t.mapel_id
          LEFT JOIN users u ON u.id = t.tutor_id
          LEFT JOIN pertemuan_belajar pb ON pb.id = t.pertemuan_id
          WHERE t.is_aktif = 1 AND t.mapel_id = ?
          ORDER BY t.id DESC, t.deadline ASC`,
          [mapel_id]
        );
        if (fallbackRows && fallbackRows.length > 0) {
          rows = fallbackRows;
        }
      } catch (fbErr) {
        console.warn('[findByRombel] Fallback 1 error:', fbErr.message);
      }
    }

    if ((!warga_belajar_id && !user_id) || !rows || rows.length === 0) {
      return rows || [];
    }

    try {
      const tugasIds = rows.map((row) => row.id);
      const placeholders = tugasIds.map(() => '?').join(',');
      const studentId1 = warga_belajar_id || user_id;
      const studentId2 = user_id || warga_belajar_id;

      const [pengumpulanRows] = await pool.query(
        `
          SELECT *
          FROM pengumpulan_tugas
          WHERE (warga_belajar_id = ? OR warga_belajar_id = ?) AND tugas_id IN (${placeholders})
        `,
        [studentId1, studentId2, ...tugasIds]
      );

      const pengumpulanMap = {};
      (pengumpulanRows || []).forEach((row) => {
        pengumpulanMap[row.tugas_id] = row;
      });

      return rows.map((row) => ({
        ...row,
        pengumpulan_saya: pengumpulanMap[row.id] || null,
      }));
    } catch (pengumpulanErr) {
      console.warn('[findByRombel] Warning lookup pengumpulan:', pengumpulanErr.message);
      return rows.map((row) => ({ ...row, pengumpulan_saya: null }));
    }
  },

  delete: async (id) => {
    try {
      await pool.execute('DELETE FROM pengumpulan_tugas WHERE tugas_id = ?', [id]);
    } catch (err) {
      console.warn('[TugasModel.delete] Warning delete pengumpulan:', err.message);
    }
    try {
      await pool.execute('UPDATE tugas SET is_aktif = 0 WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[TugasModel.delete] Warning soft-delete:', err.message);
    }
    const [result] = await pool.execute('DELETE FROM tugas WHERE id = ?', [id]);
    return result.affectedRows;
  },

  findPengumpulanByTugasDanWb: async (tugas_id, warga_belajar_id) => {
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM pengumpulan_tugas
        WHERE tugas_id = ? AND (warga_belajar_id = ? OR warga_belajar_id IN (SELECT id FROM warga_belajar WHERE user_id = ?))
        LIMIT 1
      `,
      [tugas_id, warga_belajar_id, warga_belajar_id]
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

    // Ambil SEMUA rekaman pengumpulan untuk tugas ini secara lengkap dan akurat
    const [pengumpulan] = await pool.execute(
      `SELECT pt.*,
         COALESCE(u_wb.nama_lengkap, u_direct.nama_lengkap, 'Warga Belajar') AS nama_lengkap,
         COALESCE(wb_direct.nis, wb_user.nis, u_direct.username, CONCAT('WB-', pt.warga_belajar_id)) AS nis
       FROM pengumpulan_tugas pt
       LEFT JOIN warga_belajar wb_direct ON wb_direct.id = pt.warga_belajar_id
       LEFT JOIN users u_wb ON u_wb.id = wb_direct.user_id
       LEFT JOIN users u_direct ON u_direct.id = pt.warga_belajar_id
       LEFT JOIN warga_belajar wb_user ON wb_user.user_id = pt.warga_belajar_id
       WHERE pt.tugas_id = ?
       ORDER BY pt.submitted_at ASC, pt.id ASC`,
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
  kumpulkanTugas: async ({ tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa, nilai = null, status = 'terkumpul' }) => {
    const finalStatus = status || 'terkumpul';
    const sql = `
      INSERT INTO pengumpulan_tugas
        (tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa, nilai, status, dinilai_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ${nilai !== null ? 'NOW()' : 'NULL'})
      ON DUPLICATE KEY UPDATE
        path_file = VALUES(path_file),
        nama_file = VALUES(nama_file),
        catatan_siswa = VALUES(catatan_siswa),
        nilai = COALESCE(VALUES(nilai), nilai),
        status = VALUES(status),
        dinilai_at = COALESCE(VALUES(dinilai_at), dinilai_at),
        submitted_at = NOW()
    `;
    const [result] = await pool.query(sql, [
      tugas_id, warga_belajar_id, path_file, nama_file, catatan_siswa || null, nilai, finalStatus
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
