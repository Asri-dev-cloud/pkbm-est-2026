// ============================================================
// backend/models/RaporModel.js
// Model untuk Mengelola Data Rapor Digital Siswa
// Termasuk Header Rapor (rapor_periode) & Detail Nilai (rapor_nilai)
// ============================================================

import pool from '../config/db.js';

const RaporModel = {

  // -----------------------------------------------------------
  // ensureTables
  // Memastikan tabel rapor_periode dan rapor_nilai siap digunakan
  // -----------------------------------------------------------
  ensureTables: async () => {
    try {
      // 1. Pastikan tabel Header Rapor (rapor_periode)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`rapor_periode\` (
          \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`warga_belajar_id\` INT UNSIGNED NOT NULL,
          \`rombel_id\` INT UNSIGNED NOT NULL,
          \`tahun_ajaran_id\` INT UNSIGNED NOT NULL,
          \`semester\` ENUM('1', '2') NOT NULL DEFAULT '1' COMMENT 'Semester 1 (Ganjil) atau 2 (Genap)',
          \`total_hadir\` INT NOT NULL DEFAULT 0,
          \`total_izin\` INT NOT NULL DEFAULT 0,
          \`total_sakit\` INT NOT NULL DEFAULT 0,
          \`total_alpa\` INT NOT NULL DEFAULT 0,
          \`catatan_wali\` TEXT NULL COMMENT 'Catatan wali kelas / perkembangan belajar siswa',
          \`status_rapor\` ENUM('draft', 'final') NOT NULL DEFAULT 'draft',
          \`tanggal_cetak\` DATETIME NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_rapor\` (\`warga_belajar_id\`, \`tahun_ajaran_id\`, \`semester\`),
          KEY \`idx_wb\` (\`warga_belajar_id\`),
          KEY \`idx_rombel\` (\`rombel_id\`),
          KEY \`idx_ta\` (\`tahun_ajaran_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Header rapor per WB per semester';
      `);

      // 2. Pastikan tabel Detail Nilai Rapor (rapor_nilai)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`rapor_nilai\` (
          \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`rapor_id\` INT UNSIGNED NOT NULL,
          \`mapel_id\` INT UNSIGNED NULL,
          \`kategori\` VARCHAR(50) NOT NULL DEFAULT 'umum',
          \`nama_mapel_kustom\` VARCHAR(150) NULL,
          \`nilai_tugas\` DECIMAL(5,2) DEFAULT 0.00,
          \`nilai_uts\` DECIMAL(5,2) DEFAULT 0.00,
          \`nilai_uas\` DECIMAL(5,2) DEFAULT 0.00,
          \`nilai_akhir\` DECIMAL(5,2) DEFAULT 0.00,
          \`predikat\` ENUM('A', 'B', 'C', 'D') DEFAULT 'B',
          \`catatan\` TEXT NULL COMMENT 'Deskripsi capaian kompetensi / catatan tutor',
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_rapor\` (\`rapor_id\`),
          KEY \`idx_mapel\` (\`mapel_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detail nilai mapel per rapor';
      `);

      // Migrasi aman untuk kolom tambahan
      const runSafeAlter = async (sql) => {
        try {
          await pool.query(sql);
        } catch {
          // Abaikan jika kolom atau index sudah termodifikasi
        }
      };

      await runSafeAlter(`ALTER TABLE \`rapor_periode\` ADD COLUMN \`nama_wali_kelas\` VARCHAR(150) NULL`);
      await runSafeAlter(`ALTER TABLE \`rapor_periode\` ADD COLUMN \`fase\` VARCHAR(20) NULL`);
      await runSafeAlter(`ALTER TABLE \`rapor_periode\` ADD COLUMN \`data_kustom\` LONGTEXT NULL`);
      await runSafeAlter(`ALTER TABLE \`rapor_nilai\` ADD COLUMN \`kategori\` VARCHAR(50) NOT NULL DEFAULT 'umum'`);
      await runSafeAlter(`ALTER TABLE \`rapor_nilai\` ADD COLUMN \`nama_mapel_kustom\` VARCHAR(150) NULL`);
      await runSafeAlter(`ALTER TABLE \`rapor_nilai\` MODIFY COLUMN \`mapel_id\` INT UNSIGNED NULL`);
      await runSafeAlter(`ALTER TABLE \`rapor_nilai\` DROP INDEX \`uq_rapor_mapel\``);

      return true;
    } catch (err) {
      console.error('[RaporModel.ensureTables Error]:', err.message);
      return false;
    }
  },

  // -----------------------------------------------------------
  // getMeta
  // Mengambil data referensi untuk filter dan form:
  // tahun_ajaran, rombel, mata_pelajaran, dan daftar siswa aktif
  // -----------------------------------------------------------
  getMeta: async () => {
    await RaporModel.ensureTables();

    // 1. Tahun Ajaran
    let tahunAjaran = [];
    try {
      const [rows] = await pool.query(
        `SELECT id, nama_tahun_ajaran, is_aktif FROM tahun_ajaran ORDER BY is_aktif DESC, nama_tahun_ajaran DESC`
      );
      tahunAjaran = rows;
    } catch {
      try {
        const [rows] = await pool.query(`SELECT id, nama_tahun_ajaran FROM tahun_ajaran ORDER BY id DESC`);
        tahunAjaran = rows.map(r => ({ ...r, is_aktif: 1 }));
      } catch {
        tahunAjaran = [{ id: 1, nama_tahun_ajaran: '2026/2027', is_aktif: 1 }];
      }
    }

    // 2. Rombel
    let rombel = [];
    try {
      const [rows] = await pool.query(
        `SELECT id, nama_rombel, jenjang FROM rombel ORDER BY jenjang ASC, nama_rombel ASC`
      );
      rombel = rows;
    } catch {
      try {
        const [rows] = await pool.query(`SELECT id, nama_rombel FROM rombel ORDER BY id ASC`);
        rombel = rows;
      } catch {
        rombel = [];
      }
    }

    // 3. Mata Pelajaran (menggunakan kolom tabel DB: id, nama, kode, jenjang)
    let mapel = [];
    try {
      const [rows] = await pool.query(
        `SELECT id, nama AS nama_mapel, kode AS kode_mapel, jenjang, 75 AS kkm 
         FROM mata_pelajaran 
         WHERE is_active = 1 
         ORDER BY id ASC, nama ASC`
      );
      mapel = rows;
    } catch {
      try {
        const [rows] = await pool.query(
          `SELECT id, nama AS nama_mapel, kode AS kode_mapel, jenjang, 75 AS kkm 
           FROM mata_pelajaran 
           ORDER BY id ASC, nama ASC`
        );
        mapel = rows;
      } catch {
        mapel = [];
      }
    }

    // 4. Daftar Seluruh Warga Belajar
    let siswaList = [];
    try {
      const [rows] = await pool.query(
        `SELECT wb.id, wb.nis, wb.nik, wb.jenjang, wb.rombel_id, wb.tahun_ajaran_id, u.nama_lengkap, u.email
         FROM warga_belajar wb
         JOIN users u ON wb.user_id = u.id
         ORDER BY u.nama_lengkap ASC`
      );
      siswaList = rows;
    } catch (e) {
      console.warn('[RaporModel.getMeta Siswa Fallback]:', e.message);
      try {
        const [rows] = await pool.query(
          `SELECT wb.id, wb.nis, wb.jenjang, wb.rombel_id, wb.tahun_ajaran_id, u.nama_lengkap
           FROM warga_belajar wb
           JOIN users u ON wb.user_id = u.id`
        );
        siswaList = rows;
      } catch {
        siswaList = [];
      }
    }

    return {
      tahun_ajaran: tahunAjaran,
      rombel: rombel,
      mata_pelajaran: mapel,
      siswa: siswaList,
    };
  },

  // -----------------------------------------------------------
  // findAll
  // Mengambil daftar rapor dengan filter: tahun_ajaran, semester, rombel, search
  // -----------------------------------------------------------
  findAll: async ({ tahun_ajaran_id, semester, rombel_id, search } = {}) => {
    await RaporModel.ensureTables();

    let sql = `
      SELECT 
        r.id,
        r.warga_belajar_id,
        r.rombel_id,
        r.tahun_ajaran_id,
        r.semester,
        r.nama_wali_kelas,
        r.fase,
        r.data_kustom,
        r.total_hadir,
        r.total_izin,
        r.total_sakit,
        r.total_alpa,
        r.catatan_wali,
        r.status_rapor,
        r.tanggal_cetak,
        r.created_at,
        r.updated_at,
        wb.nis,
        wb.nik,
        wb.jenjang,
        u.nama_lengkap,
        u.email,
        u.foto_profil AS foto,
        u.foto_profil,
        COALESCE(rb.nama_rombel, UPPER(wb.jenjang)) AS nama_rombel,
        COALESCE(ta.nama_tahun_ajaran, '2026/2027') AS nama_tahun_ajaran,
        COALESCE(stat.total_mapel, 0) AS total_mapel,
        COALESCE(stat.rata_rata_nilai, 0) AS rata_rata_nilai
      FROM rapor_periode r
      JOIN warga_belajar wb ON r.warga_belajar_id = wb.id
      JOIN users u ON wb.user_id = u.id
      LEFT JOIN rombel rb ON r.rombel_id = rb.id
      LEFT JOIN tahun_ajaran ta ON r.tahun_ajaran_id = ta.id
      LEFT JOIN (
        SELECT 
          rapor_id,
          COUNT(id) AS total_mapel,
          ROUND(AVG(nilai_akhir), 1) AS rata_rata_nilai
        FROM rapor_nilai
        GROUP BY rapor_id
      ) stat ON stat.rapor_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (tahun_ajaran_id) {
      sql += ` AND r.tahun_ajaran_id = ?`;
      params.push(tahun_ajaran_id);
    }

    if (semester) {
      sql += ` AND r.semester = ?`;
      params.push(String(semester));
    }

    if (rombel_id) {
      sql += ` AND r.rombel_id = ?`;
      params.push(rombel_id);
    }

    if (search && search.trim()) {
      sql += ` AND (u.nama_lengkap LIKE ? OR wb.nis LIKE ? OR wb.nik LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += `
      ORDER BY r.created_at DESC, u.nama_lengkap ASC
    `;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // findById
  // Mengambil 1 data rapor lengkap beserta seluruh detail nilai mapel
  // -----------------------------------------------------------
  findById: async (id) => {
    await RaporModel.ensureTables();

    const [headerRows] = await pool.query(
      `SELECT 
        r.id,
        r.warga_belajar_id,
        r.rombel_id,
        r.tahun_ajaran_id,
        r.semester,
        r.nama_wali_kelas,
        r.fase,
        r.data_kustom,
        r.total_hadir,
        r.total_izin,
        r.total_sakit,
        r.total_alpa,
        r.catatan_wali,
        r.status_rapor,
        r.tanggal_cetak,
        r.created_at,
        r.updated_at,
        wb.nis,
        wb.nik,
        COALESCE(wb.npsn, 'P2970848') AS npsn,
        wb.nisn,
        wb.jenjang,
        wb.tanggal_lahir,
        wb.alamat,
        u.nama_lengkap,
        u.email,
        u.foto_profil AS foto,
        u.foto_profil,
        COALESCE(rb.nama_rombel, UPPER(wb.jenjang)) AS nama_rombel,
        COALESCE(ta.nama_tahun_ajaran, '2026/2027') AS nama_tahun_ajaran
      FROM rapor_periode r
      JOIN warga_belajar wb ON r.warga_belajar_id = wb.id
      JOIN users u ON wb.user_id = u.id
      LEFT JOIN rombel rb ON r.rombel_id = rb.id
      LEFT JOIN tahun_ajaran ta ON r.tahun_ajaran_id = ta.id
      WHERE r.id = ?`,
      [id]
    );

    if (!headerRows || headerRows.length === 0) {
      return null;
    }

    const header = headerRows[0];
    if (header.data_kustom && typeof header.data_kustom === 'string') {
      try {
        header.data_kustom = JSON.parse(header.data_kustom);
      } catch {
        // Biarkan seperti semula jika bukan format JSON
      }
    }

    // Ambil detail nilai mapel
    const [nilaiRows] = await pool.query(
      `SELECT 
        rn.id,
        rn.rapor_id,
        rn.mapel_id,
        COALESCE(rn.kategori, 'umum') AS kategori,
        rn.nama_mapel_kustom,
        rn.nilai_tugas,
        rn.nilai_uts,
        rn.nilai_uas,
        rn.nilai_akhir,
        rn.predikat,
        rn.catatan,
        COALESCE(rn.nama_mapel_kustom, mp.nama, 'Mata Pelajaran') AS nama_mapel,
        COALESCE(mp.kode, 'KUST') AS kode_mapel,
        75 AS kkm,
        COALESCE(mp.id, 999) AS urutan
      FROM rapor_nilai rn
      LEFT JOIN mata_pelajaran mp ON rn.mapel_id = mp.id
      WHERE rn.rapor_id = ?
      ORDER BY 
        CASE WHEN rn.kategori = 'umum' THEN 1 WHEN rn.kategori = 'pemberdayaan' THEN 2 ELSE 3 END ASC,
        rn.id ASC`,
      [id]
    );

    header.nilai = nilaiRows;

    // Hitung rata-rata dan total nilai
    if (nilaiRows.length > 0) {
      const totalNilai = nilaiRows.reduce((acc, curr) => acc + Number(curr.nilai_akhir || 0), 0);
      header.total_nilai = Math.round(totalNilai * 100) / 100;
      header.rata_rata = Math.round((totalNilai / nilaiRows.length) * 10) / 10;
    } else {
      header.total_nilai = 0;
      header.rata_rata = 0;
    }

    return header;
  },

  // -----------------------------------------------------------
  // findByWargaBelajar
  // Mengambil seluruh rapor milik seorang warga belajar (tampilan siswa)
  // -----------------------------------------------------------
  findByWargaBelajar: async (wargaBelajarId, { semester, tahun_ajaran_id } = {}) => {
    await RaporModel.ensureTables();

    let sql = `
      SELECT 
        r.id,
        r.warga_belajar_id,
        r.rombel_id,
        r.tahun_ajaran_id,
        r.semester,
        r.nama_wali_kelas,
        r.fase,
        r.data_kustom,
        r.total_hadir,
        r.total_izin,
        r.total_sakit,
        r.total_alpa,
        r.catatan_wali,
        r.status_rapor,
        r.tanggal_cetak,
        r.created_at,
        r.updated_at,
        COALESCE(rb.nama_rombel, 'Kelas Terpadu') AS nama_rombel,
        COALESCE(ta.nama_tahun_ajaran, '2026/2027') AS nama_tahun_ajaran,
        COALESCE(stat.total_mapel, 0) AS total_mapel,
        COALESCE(stat.rata_rata_nilai, 0) AS rata_rata_nilai
      FROM rapor_periode r
      LEFT JOIN rombel rb ON r.rombel_id = rb.id
      LEFT JOIN tahun_ajaran ta ON r.tahun_ajaran_id = ta.id
      LEFT JOIN (
        SELECT 
          rapor_id,
          COUNT(id) AS total_mapel,
          ROUND(AVG(nilai_akhir), 1) AS rata_rata_nilai
        FROM rapor_nilai
        GROUP BY rapor_id
      ) stat ON stat.rapor_id = r.id
      WHERE r.warga_belajar_id = ?
    `;

    const params = [wargaBelajarId];

    if (semester) {
      sql += ` AND r.semester = ?`;
      params.push(String(semester));
    }

    if (tahun_ajaran_id) {
      sql += ` AND r.tahun_ajaran_id = ?`;
      params.push(tahun_ajaran_id);
    }

    sql += `
      ORDER BY r.created_at DESC
    `;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // create
  // Membuat data header rapor baru dan memasukkan detail nilai
  // -----------------------------------------------------------
  create: async (data) => {
    await RaporModel.ensureTables();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const {
        warga_belajar_id,
        rombel_id,
        tahun_ajaran_id,
        semester = '1',
        nama_wali_kelas = '',
        fase = '',
        data_kustom = null,
        total_hadir = 0,
        total_izin = 0,
        total_sakit = 0,
        total_alpa = 0,
        catatan_wali = '',
        status_rapor = 'draft',
        nilai = [],
      } = data;

      const serializedDataKustom = typeof data_kustom === 'object' && data_kustom !== null
        ? JSON.stringify(data_kustom)
        : (data_kustom || null);

      // Cek apakah sudah ada rapor untuk WB di tahun ajaran & semester ini
      const [existing] = await conn.execute(
        `SELECT id FROM rapor_periode WHERE warga_belajar_id = ? AND tahun_ajaran_id = ? AND semester = ?`,
        [warga_belajar_id, tahun_ajaran_id, String(semester)]
      );

      let raporId;

      if (existing.length > 0) {
        raporId = existing[0].id;
        await conn.execute(
          `UPDATE rapor_periode SET
            rombel_id = ?,
            nama_wali_kelas = ?,
            fase = ?,
            data_kustom = ?,
            total_hadir = ?,
            total_izin = ?,
            total_sakit = ?,
            total_alpa = ?,
            catatan_wali = ?,
            status_rapor = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [
            rombel_id,
            nama_wali_kelas || null,
            fase || null,
            serializedDataKustom,
            total_hadir,
            total_izin,
            total_sakit,
            total_alpa,
            catatan_wali || null,
            status_rapor,
            raporId
          ]
        );
      } else {
        const [insertRes] = await conn.execute(
          `INSERT INTO rapor_periode 
            (warga_belajar_id, rombel_id, tahun_ajaran_id, semester, nama_wali_kelas, fase, data_kustom, total_hadir, total_izin, total_sakit, total_alpa, catatan_wali, status_rapor, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            warga_belajar_id,
            rombel_id,
            tahun_ajaran_id,
            String(semester),
            nama_wali_kelas || null,
            fase || null,
            serializedDataKustom,
            total_hadir,
            total_izin,
            total_sakit,
            total_alpa,
            catatan_wali || null,
            status_rapor
          ]
        );
        raporId = insertRes.insertId;
      }

      // Simpan nilai mata pelajaran
      if (Array.isArray(nilai) && nilai.length > 0) {
        await conn.execute(`DELETE FROM rapor_nilai WHERE rapor_id = ?`, [raporId]);

        for (const item of nilai) {
          const namaMapel = item.nama_mapel || item.nama_mapel_kustom || '';
          const mapelId = (item.mapel_id && !isNaN(Number(item.mapel_id)) && Number(item.mapel_id) > 0)
            ? Number(item.mapel_id)
            : null;

          if (!mapelId && !namaMapel) continue;

          const kategori = item.kategori || 'umum';
          const namaKustom = mapelId ? (item.nama_mapel_kustom || null) : namaMapel;

          const nTugas = Number(item.nilai_tugas || 0);
          const nUts   = Number(item.nilai_uts || 0);
          const nUas   = Number(item.nilai_uas || 0);
          
          const nAkhir = item.nilai_akhir !== undefined && item.nilai_akhir !== null && item.nilai_akhir !== ''
            ? Number(item.nilai_akhir)
            : Math.round(((nTugas * 0.3) + (nUts * 0.3) + (nUas * 0.4)) * 10) / 10;

          let predikat = item.predikat;
          if (!predikat) {
            if (nAkhir >= 85) predikat = 'A';
            else if (nAkhir >= 75) predikat = 'B';
            else if (nAkhir >= 60) predikat = 'C';
            else predikat = 'D';
          }

          await conn.execute(
            `INSERT INTO rapor_nilai 
              (rapor_id, mapel_id, kategori, nama_mapel_kustom, nilai_tugas, nilai_uts, nilai_uas, nilai_akhir, predikat, catatan, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              raporId,
              mapelId,
              kategori,
              namaKustom,
              nTugas,
              nUts,
              nUas,
              nAkhir,
              predikat,
              item.catatan || null
            ]
          );
        }
      }

      await conn.commit();
      conn.release();
      return raporId;

    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // -----------------------------------------------------------
  // update
  // Memperbarui rapor yang sudah ada
  // -----------------------------------------------------------
  update: async (id, data) => {
    await RaporModel.ensureTables();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const {
        rombel_id,
        nama_wali_kelas,
        fase,
        data_kustom,
        total_hadir = 0,
        total_izin = 0,
        total_sakit = 0,
        total_alpa = 0,
        catatan_wali = '',
        status_rapor = 'draft',
        nilai = [],
      } = data;

      const serializedDataKustom = data_kustom !== undefined
        ? (typeof data_kustom === 'object' && data_kustom !== null ? JSON.stringify(data_kustom) : (data_kustom || null))
        : undefined;

      await conn.execute(
        `UPDATE rapor_periode SET
          rombel_id = COALESCE(?, rombel_id),
          nama_wali_kelas = COALESCE(?, nama_wali_kelas),
          fase = COALESCE(?, fase),
          data_kustom = COALESCE(?, data_kustom),
          total_hadir = ?,
          total_izin = ?,
          total_sakit = ?,
          total_alpa = ?,
          catatan_wali = ?,
          status_rapor = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          rombel_id || null,
          nama_wali_kelas !== undefined ? nama_wali_kelas : null,
          fase !== undefined ? fase : null,
          serializedDataKustom !== undefined ? serializedDataKustom : null,
          total_hadir,
          total_izin,
          total_sakit,
          total_alpa,
          catatan_wali || null,
          status_rapor,
          id
        ]
      );

      if (Array.isArray(nilai) && nilai.length > 0) {
        await conn.execute(`DELETE FROM rapor_nilai WHERE rapor_id = ?`, [id]);

        for (const item of nilai) {
          const namaMapel = item.nama_mapel || item.nama_mapel_kustom || '';
          const mapelId = (item.mapel_id && !isNaN(Number(item.mapel_id)) && Number(item.mapel_id) > 0)
            ? Number(item.mapel_id)
            : null;

          if (!mapelId && !namaMapel) continue;

          const kategori = item.kategori || 'umum';
          const namaKustom = mapelId ? (item.nama_mapel_kustom || null) : namaMapel;

          const nTugas = Number(item.nilai_tugas || 0);
          const nUts   = Number(item.nilai_uts || 0);
          const nUas   = Number(item.nilai_uas || 0);
          
          const nAkhir = item.nilai_akhir !== undefined && item.nilai_akhir !== null && item.nilai_akhir !== ''
            ? Number(item.nilai_akhir)
            : Math.round(((nTugas * 0.3) + (nUts * 0.3) + (nUas * 0.4)) * 10) / 10;

          let predikat = item.predikat;
          if (!predikat) {
            if (nAkhir >= 85) predikat = 'A';
            else if (nAkhir >= 75) predikat = 'B';
            else if (nAkhir >= 60) predikat = 'C';
            else predikat = 'D';
          }

          await conn.execute(
            `INSERT INTO rapor_nilai 
              (rapor_id, mapel_id, kategori, nama_mapel_kustom, nilai_tugas, nilai_uts, nilai_uas, nilai_akhir, predikat, catatan, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              id,
              mapelId,
              kategori,
              namaKustom,
              nTugas,
              nUts,
              nUas,
              nAkhir,
              predikat,
              item.catatan || null
            ]
          );
        }
      }

      await conn.commit();
      conn.release();
      return true;

    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // -----------------------------------------------------------
  // delete
  // Menghapus data rapor beserta nilainya
  // -----------------------------------------------------------
  delete: async (id) => {
    await RaporModel.ensureTables();
    await pool.execute(`DELETE FROM rapor_nilai WHERE rapor_id = ?`, [id]);
    const [result] = await pool.execute(`DELETE FROM rapor_periode WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
};

export default RaporModel;
