// ============================================================
// models/SiswaModel.js
// Model untuk data Warga Belajar (tabel 'warga_belajar').
// Relasi: satu user bisa punya satu profil warga_belajar.
// ============================================================

import pool from '../config/db.js';

const SiswaModel = {

  // -----------------------------------------------------------
  // Ambil semua Warga Belajar beserta info jenjang & rombel
  // Mendukung filter opsional: jenjang dan status aktif
  // -----------------------------------------------------------
  findAll: async ({ jenjang = null, is_aktif = null } = {}) => {
    // Bangun query secara dinamis berdasarkan filter yang diberikan
    let sql = `
      SELECT
        wb.id,
        wb.nis,
        wb.nik,
        wb.user_id,
        u.nama_lengkap,
        u.email,
        wb.jenjang,
        wb.tanggal_lahir,
        wb.jenis_kelamin,
        wb.alamat,
        wb.nama_wali,
        wb.no_telp,
        wb.is_aktif,
        r.nama_rombel,
        wb.created_at
      FROM warga_belajar wb
      JOIN users u ON wb.user_id = u.id
      LEFT JOIN rombel r ON wb.rombel_id = r.id
      WHERE 1=1
    `;

    const params = [];

    // Tambahkan filter jenjang jika ada
    if (jenjang) {
      sql += ` AND wb.jenjang = ?`;
      params.push(jenjang);
    }

    // Tambahkan filter status aktif jika ada
    if (is_aktif !== null) {
      sql += ` AND wb.is_aktif = ?`;
      params.push(is_aktif);
    }

    sql += ` ORDER BY u.nama_lengkap ASC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil detail satu Warga Belajar berdasarkan ID
  // -----------------------------------------------------------
  findById: async (id) => {
    const sql = `
      SELECT
        wb.*,
        u.nama_lengkap,
        u.email,
        u.foto_profil,
        r.nama_rombel,
        ta.nama_tahun_ajaran
      FROM warga_belajar wb
      JOIN users u ON wb.user_id = u.id
      LEFT JOIN rombel r ON wb.rombel_id = r.id
      LEFT JOIN tahun_ajaran ta ON wb.tahun_ajaran_id = ta.id
      WHERE wb.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0];
  },

  // -----------------------------------------------------------
  // Cari WB berdasarkan user_id (dipakai setelah login)
  // -----------------------------------------------------------
  findByUserId: async (user_id) => {
    const sql = `
      SELECT wb.*, u.nama_lengkap, u.email, r.nama_rombel
      FROM warga_belajar wb
      JOIN users u ON wb.user_id = u.id
      LEFT JOIN rombel r ON wb.rombel_id = r.id
      WHERE wb.user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [user_id]);
    return rows[0];
  },

  // -----------------------------------------------------------
  // Buat profil Warga Belajar baru
  // Dipanggil otomatis oleh pipeline SPMB saat status = 'diterima'
  // -----------------------------------------------------------
  create: async ({ user_id, nis, nik, jenjang, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp, rombel_id, tahun_ajaran_id }) => {
    const sql = `
      INSERT INTO warga_belajar
        (user_id, nis, nik, jenjang, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp, rombel_id, tahun_ajaran_id, is_aktif, created_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;
    const params = [user_id, nis, nik || null, jenjang, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp, rombel_id, tahun_ajaran_id];
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Update data profil Warga Belajar
  // -----------------------------------------------------------
  update: async (id, { alamat, nama_wali, no_telp, rombel_id }) => {
    const sql = `
      UPDATE warga_belajar
      SET alamat = ?, nama_wali = ?, no_telp = ?, rombel_id = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [alamat, nama_wali, no_telp, rombel_id, id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Hitung total WB per jenjang (untuk dashboard Pimpinan)
  // -----------------------------------------------------------
  countByJenjang: async () => {
    const sql = `
      SELECT
        jenjang,
        COUNT(*) AS jumlah
      FROM warga_belajar
      WHERE is_aktif = 1
      GROUP BY jenjang
      ORDER BY jenjang
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil opsi rombel untuk penempatan WB saat SPMB diterima
  // Bisa difilter per jenjang dan diprioritaskan tahun ajaran aktif
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // Ambil opsi rombel: dibuat 1 per jenjang (Paket A, Paket B, Paket C)
  // Aman dari sql_mode only_full_group_by dan selalu memiliki fallback
  // -----------------------------------------------------------
  getRombelOptions: async ({ jenjang = null } = {}) => {
    try {
      let sql = `
        SELECT
          r.id,
          r.nama_rombel,
          r.jenjang,
          r.kapasitas
        FROM rombel r
      `;
      const params = [];
      if (jenjang) {
        sql += ` WHERE r.jenjang = ?`;
        params.push(jenjang);
      }
      sql += ` ORDER BY r.jenjang ASC, r.id ASC`;
      const [rows] = await pool.execute(sql, params);

      // Deduplikasi di JavaScript: tepat 1 per jenjang (Paket A, Paket B, Paket C)
      const map = new Map();
      rows.forEach((r) => {
        const jKey = (r.jenjang || 'paket_a').toLowerCase();
        if (!map.has(jKey)) {
          const cleanName =
            jKey === 'paket_a' ? 'Paket A' :
            jKey === 'paket_b' ? 'Paket B' :
            jKey === 'paket_c' ? 'Paket C' :
            (r.nama_rombel || jKey.toUpperCase());

          map.set(jKey, {
            id: r.id,
            nama: cleanName,
            nama_rombel: cleanName,
            jenjang: jKey,
            kapasitas: r.kapasitas || 40,
          });
        }
      });

      // Jika di DB belum ada data rombel, sediakan 3 paket standar
      if (map.size === 0) {
        return [
          { id: 1, nama: 'Paket A', nama_rombel: 'Paket A', jenjang: 'paket_a', kapasitas: 40 },
          { id: 2, nama: 'Paket B', nama_rombel: 'Paket B', jenjang: 'paket_b', kapasitas: 40 },
          { id: 3, nama: 'Paket C', nama_rombel: 'Paket C', jenjang: 'paket_c', kapasitas: 40 },
        ];
      }

      const sortOrder = { paket_a: 1, paket_b: 2, paket_c: 3 };
      return Array.from(map.values()).sort(
        (a, b) => (sortOrder[a.jenjang] || 99) - (sortOrder[b.jenjang] || 99)
      );
    } catch (err) {
      console.error('[SiswaModel.getRombelOptions] Error:', err);
      return [
        { id: 1, nama: 'Paket A', nama_rombel: 'Paket A', jenjang: 'paket_a', kapasitas: 40 },
        { id: 2, nama: 'Paket B', nama_rombel: 'Paket B', jenjang: 'paket_b', kapasitas: 40 },
        { id: 3, nama: 'Paket C', nama_rombel: 'Paket C', jenjang: 'paket_c', kapasitas: 40 },
      ];
    }
  },

  // -----------------------------------------------------------
  // Ambil opsi mata pelajaran untuk dropdown tutor/admin
  // Otomatis fallback jika rombel_mapel belum diisi agar tidak pernah kosong
  // -----------------------------------------------------------
  getMapelOptions: async ({ jenjang = null, rombel_id = null } = {}) => {
    // 1. Jika rombel_id diberikan, coba cari mapel dari rombel_mapel
    if (rombel_id) {
      const sqlRombel = `
        SELECT DISTINCT
          mp.id,
          mp.nama,
          mp.kode,
          mp.jenjang,
          u.nama_lengkap AS nama_tutor
        FROM rombel_mapel rm
        JOIN mata_pelajaran mp ON mp.id = rm.mapel_id
        LEFT JOIN users u ON u.id = rm.tutor_id
        WHERE rm.rombel_id = ? AND rm.is_visible = 1 AND mp.is_active = 1
        ORDER BY mp.nama ASC
      `;
      const [rowsRombel] = await pool.execute(sqlRombel, [rombel_id]);
      if (rowsRombel.length > 0) {
        return rowsRombel;
      }

      // 2. Jika di rombel_mapel kosong, ambil jenjang dari rombel tersebut
      const [rRows] = await pool.execute(`SELECT jenjang FROM rombel WHERE id = ? LIMIT 1`, [rombel_id]);
      if (rRows.length > 0 && rRows[0].jenjang) {
        jenjang = rRows[0].jenjang;
      }
    }

    // 3. Ambil mapel berdasarkan jenjang (atau 'semua')
    let sql = `
      SELECT DISTINCT
        mp.id,
        mp.nama,
        mp.kode,
        mp.jenjang,
        NULL AS nama_tutor
      FROM mata_pelajaran mp
      WHERE mp.is_active = 1
    `;
    const params = [];

    if (jenjang) {
      sql += ` AND (mp.jenjang = ? OR mp.jenjang = 'semua' OR mp.jenjang IS NULL)`;
      params.push(jenjang);
    }

    sql += ` ORDER BY mp.nama ASC`;
    const [rows] = await pool.execute(sql, params);

    // 4. Jika masih kosong, ambil seluruh mata pelajaran aktif
    if (rows.length === 0) {
      const [allRows] = await pool.execute(`SELECT id, nama, kode, jenjang FROM mata_pelajaran WHERE is_active = 1 ORDER BY nama ASC`);
      return allRows;
    }

    return rows;
  },
};

export default SiswaModel;
