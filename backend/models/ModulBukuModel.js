// ============================================================
// models/ModulBukuModel.js
// Model untuk Modul Ajar PKBM & Katalog Buku Kemendikdasmen
// Mendukung upload modul dokumen (PDF/DOCX) oleh admin
// dan integrasi buku resmi https://buku.kemendikdasmen.go.id/
// ============================================================

import pool from '../config/db.js';

let tableChecked = false;

export const ensureModulBukuTable = async () => {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modul_buku (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT NULL,
        kategori VARCHAR(50) NOT NULL DEFAULT 'Semua Jenjang',
        mapel VARCHAR(100) NULL,
        tipe ENUM('modul_upload', 'buku_kemendikdasmen') NOT NULL DEFAULT 'modul_upload',
        file_path VARCHAR(255) NULL,
        file_nama_asli VARCHAR(255) NULL,
        file_size INT NULL DEFAULT 0,
        file_type VARCHAR(50) NULL DEFAULT 'pdf',
        cover_image VARCHAR(255) NULL,
        url_eksternal VARCHAR(500) NULL DEFAULT 'https://buku.kemendikdasmen.go.id/',
        penulis VARCHAR(150) NULL DEFAULT 'PKBM Bina Mandiri',
        semester VARCHAR(30) NULL DEFAULT 'Semua Semester',
        tahun_ajaran VARCHAR(30) NULL DEFAULT '2025/2026',
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        total_dibaca INT NOT NULL DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_kategori (kategori),
        INDEX idx_tipe (tipe),
        INDEX idx_published (is_published)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Inisialisasi data awal jika tabel masih kosong
    const [existing] = await pool.query(`SELECT COUNT(*) as cnt FROM modul_buku`);
    if (existing[0]?.cnt === 0) {
      await pool.query(`
        INSERT INTO modul_buku 
        (judul, deskripsi, kategori, mapel, tipe, url_eksternal, penulis, semester, is_published, total_dibaca)
        VALUES 
        (
          'Buku Teks Kurikulum Merdeka - Kemendikdasmen RI',
          'Akses resmi katalog buku teks utama dan pendamping Kurikulum Merdeka untuk SD, SMP, SMA dari Kementerian Pendidikan Dasar dan Menengah RI.',
          'Semua Jenjang',
          'Kurikulum Nasional',
          'buku_kemendikdasmen',
          'https://buku.kemendikdasmen.go.id/',
          'Kemendikdasmen RI',
          'Semua Semester',
          1,
          154
        ),
        (
          'Modul Kewirausahaan & Literasi Keuangan Warga Belajar Paket C',
          'Modul ajar pemberdayaan ekonomi praktis: manajemen keuangan mikro, pemanfaatan digital payment, dan perintisan usaha mandiri untuk warga belajar Paket C.',
          'Paket C',
          'Kewirausahaan & Vokasi',
          'modul_upload',
          null,
          'Tim Pengajar Vokasi PKBM',
          'Semester Ganjil',
          1,
          89
        ),
        (
          'Modul Bahasa Indonesia: Berpikir Kritis & Menulis Efektif - Paket B',
          'Modul tematik literasi bahasa untuk kelas 7, 8, dan 9 setara SMP. Mencakup telaah bacaan, penyusunan ringkasan artikel, dan tata kalimat aplikatif.',
          'Paket B',
          'Bahasa Indonesia',
          'modul_upload',
          null,
          'Tutor Bahasa PKBM',
          'Semua Semester',
          1,
          62
        ),
        (
          'Modul IPAS Terpadu: Mengenal Lingkungan Sekitar & Sains Dasar - Paket A',
          'Panduan pembelajaran tematik IPAS untuk warga belajar Paket A (setara SD). Belajar sains aplikatif berbasis eksperimen sederhana dan pelestarian alam.',
          'Paket A',
          'IPAS',
          'modul_upload',
          null,
          'Tutor Paket A PKBM',
          'Semester Genap',
          1,
          45
        ),
        (
          'Buku Literasi & Bacaan Bergizi Warga Belajar - SIBI Kemendikdasmen',
          'Koleksi bacaan nonteks berjenjang untuk meningkatkan minat membaca dan wawasan umum warga belajar pendidikan kesetaraan.',
          'Semua Jenjang',
          'Literasi & Karakter',
          'buku_kemendikdasmen',
          'https://buku.kemendikdasmen.go.id/',
          'SIBI Kemendikdasmen',
          'Semua Semester',
          1,
          112
        )
      `);
    }

    tableChecked = true;
  } catch (err) {
    console.error('Error ensuring modul_buku table:', err.message);
  }
};

const ModulBukuModel = {
  // Ambil semua modul untuk siswa (hanya published)
  findPublished: async ({ search = '', kategori = '', mapel = '', tipe = '', limit = 50, offset = 0 } = {}) => {
    await ensureModulBukuTable();
    let query = `SELECT * FROM modul_buku WHERE is_published = 1`;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (judul LIKE ? OR deskripsi LIKE ? OR mapel LIKE ? OR penulis LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    if (kategori && kategori !== 'Semua' && kategori !== 'Semua Jenjang') {
      query += ` AND (kategori = ? OR kategori = 'Semua Jenjang')`;
      params.push(kategori);
    }

    if (mapel && mapel.trim()) {
      query += ` AND mapel LIKE ?`;
      params.push(`%${mapel.trim()}%`);
    }

    if (tipe && tipe.trim()) {
      query += ` AND tipe = ?`;
      params.push(tipe);
    }

    query += ` ORDER BY tipe DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Hitung total untuk pagination / siswa
  countPublished: async ({ search = '', kategori = '', tipe = '' } = {}) => {
    await ensureModulBukuTable();
    let query = `SELECT COUNT(*) as total FROM modul_buku WHERE is_published = 1`;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (judul LIKE ? OR deskripsi LIKE ? OR mapel LIKE ? OR penulis LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    if (kategori && kategori !== 'Semua' && kategori !== 'Semua Jenjang') {
      query += ` AND (kategori = ? OR kategori = 'Semua Jenjang')`;
      params.push(kategori);
    }

    if (tipe && tipe.trim()) {
      query += ` AND tipe = ?`;
      params.push(tipe);
    }

    const [rows] = await pool.query(query, params);
    return rows[0]?.total || 0;
  },

  // Ambil detail modul berdasarkan ID
  findById: async (id) => {
    await ensureModulBukuTable();
    const [rows] = await pool.query(`SELECT * FROM modul_buku WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  // Tambah counter baca
  incrementDibaca: async (id) => {
    await ensureModulBukuTable();
    await pool.query(`UPDATE modul_buku SET total_dibaca = total_dibaca + 1 WHERE id = ?`, [id]);
  },

  // Ambil semua untuk Admin (termasuk draft / un-published)
  findAllAdmin: async ({ search = '', kategori = '', tipe = '', limit = 100, offset = 0 } = {}) => {
    await ensureModulBukuTable();
    let query = `SELECT * FROM modul_buku WHERE 1=1`;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (judul LIKE ? OR deskripsi LIKE ? OR mapel LIKE ? OR penulis LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    if (kategori && kategori !== 'Semua') {
      query += ` AND kategori = ?`;
      params.push(kategori);
    }

    if (tipe && tipe.trim()) {
      query += ` AND tipe = ?`;
      params.push(tipe);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit) || 100, Number(offset) || 0);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Statistik modul untuk dashboard admin
  getStats: async () => {
    await ensureModulBukuTable();
    const [totalRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_semua,
        SUM(CASE WHEN tipe = 'modul_upload' THEN 1 ELSE 0 END) as total_modul_upload,
        SUM(CASE WHEN tipe = 'buku_kemendikdasmen' THEN 1 ELSE 0 END) as total_kemendikdasmen,
        SUM(CASE WHEN kategori = 'Paket A' THEN 1 ELSE 0 END) as total_paket_a,
        SUM(CASE WHEN kategori = 'Paket B' THEN 1 ELSE 0 END) as total_paket_b,
        SUM(CASE WHEN kategori = 'Paket C' THEN 1 ELSE 0 END) as total_paket_c,
        COALESCE(SUM(total_dibaca), 0) as total_dibaca_semua
      FROM modul_buku
    `);

    return totalRows[0] || {
      total_semua: 0,
      total_modul_upload: 0,
      total_kemendikdasmen: 0,
      total_paket_a: 0,
      total_paket_b: 0,
      total_paket_c: 0,
      total_dibaca_semua: 0,
    };
  },

  // Tambah modul baru oleh Admin
  create: async (data) => {
    await ensureModulBukuTable();
    const sql = `
      INSERT INTO modul_buku (
        judul, deskripsi, kategori, mapel, tipe,
        file_path, file_nama_asli, file_size, file_type,
        cover_image, url_eksternal, penulis, semester, tahun_ajaran,
        is_published, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      data.judul,
      data.deskripsi || null,
      data.kategori || 'Semua Jenjang',
      data.mapel || null,
      data.tipe || 'modul_upload',
      data.file_path || null,
      data.file_nama_asli || null,
      data.file_size || 0,
      data.file_type || 'pdf',
      data.cover_image || null,
      data.url_eksternal || (data.tipe === 'buku_kemendikdasmen' ? 'https://buku.kemendikdasmen.go.id/' : null),
      data.penulis || 'PKBM Bina Mandiri',
      data.semester || 'Semua Semester',
      data.tahun_ajaran || '2025/2026',
      data.is_published !== undefined ? data.is_published : 1,
      data.created_by || null,
    ]);

    return result.insertId;
  },

  // Update modul oleh Admin
  update: async (id, data) => {
    await ensureModulBukuTable();
    const fields = [];
    const params = [];

    const allowed = [
      'judul', 'deskripsi', 'kategori', 'mapel', 'tipe',
      'file_path', 'file_nama_asli', 'file_size', 'file_type',
      'cover_image', 'url_eksternal', 'penulis', 'semester', 'tahun_ajaran',
      'is_published'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE modul_buku SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
  },

  // Hapus modul
  delete: async (id) => {
    await ensureModulBukuTable();
    const [result] = await pool.query(`DELETE FROM modul_buku WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
};

export default ModulBukuModel;

