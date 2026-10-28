// ============================================================
// models/BeritaModel.js
// Model untuk Berita & Dokumentasi Kegiatan PKBM Bina Mandiri
// Menyimpan teks kegiatan, foto sampul, galeri foto, & video (file/URL)
// ============================================================

import pool from '../config/db.js';

let tableChecked = false;
export const ensureTable = async () => {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS berita_kegiatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        ringkasan TEXT NULL,
        konten LONGTEXT NOT NULL,
        kategori VARCHAR(100) NOT NULL DEFAULT 'Kegiatan PKBM',
        tanggal_kegiatan DATE NULL,
        lokasi VARCHAR(255) NULL DEFAULT '',
        gambar_sampul VARCHAR(255) NULL,
        galeri_foto JSON NULL,
        video_url VARCHAR(500) NULL,
        video_file VARCHAR(255) NULL,
        status ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        penulis VARCHAR(100) NOT NULL DEFAULT 'Admin PKBM',
        created_by INT NULL,
        views_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_kategori (kategori),
        INDEX idx_tanggal (tanggal_kegiatan),
        INDEX idx_pinned (is_pinned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tambahkan sample berita kegiatan awal jika tabel masih kosong
    const [existing] = await pool.query(`SELECT COUNT(*) as cnt FROM berita_kegiatan`);
    if (existing[0]?.cnt === 0) {
      const sampleSlug1 = 'upacara-peringatan-hari-guru-nasional-dan-kegiatan-vokasi-wb';
      const sampleSlug2 = 'kegiatan-praktik-komputer-dan-kewirausahaan-paket-c';
      await pool.query(`
        INSERT INTO berita_kegiatan 
        (judul, slug, ringkasan, konten, kategori, tanggal_kegiatan, lokasi, status, is_pinned, penulis)
        VALUES 
        (
          'Peringatan Hari Belajar Mandiri & Pameran Karya Vokasi Warga Belajar PKBM',
          ?,
          'Dokumentasi meriah pameran karya kewirausahaan, vokasi tata boga, serta keterampilan digital warga belajar Paket A, B, dan C.',
          'PKBM Bina Mandiri sukses menyelenggarakan pameran karya vokasi dan gelar karya belajar mandiri tahun ajaran 2026/2027. Acara ini dihadiri oleh seluruh tutor, pamong belajar, serta ratusan warga belajar dari seluruh rombel reguler dan mandiri.\n\nKegiatan ini bertujuan untuk menampilkan hasil pembelajaran keterampilan terapan warga belajar, mulai dari desain grafis, kerajinan tangan, produk olahan pangan lokal, hingga demonstrasi aplikasi teknologi informasi.',
          'Vokasi & Ekstrakurikuler',
          CURDATE(),
          'Aula Kampus PKBM Bina Mandiri',
          'published',
          1,
          'Humas PKBM'
        ),
        (
          'Pelatihan Literasi Digital & Pemrograman Dasar untuk Warga Belajar Paket C',
          ?,
          'Sesi workshop intensif pemanfaatan teknologi informasi untuk kesiapan kerja dan perkuliahan alumni pendidikan kesetaraan.',
          'Sebagai bagian dari komitmen mencetak lulusan berdaya saing tinggi, PKBM Bina Mandiri mengadakan pelatihan literasi digital terpadu. Materi mencakup dasar pengolahan data spreadsheet, desain visual presentasi, dan pengenalan kecerdasan buatan untuk produktivitas kerja.',
          'Akademik',
          CURDATE(),
          'Laboratorium Komputer PKBM Bina Mandiri',
          'published',
          0,
          'Tim Akademik'
        )
      `, [sampleSlug1, sampleSlug2]);
    }

    tableChecked = true;
  } catch (err) {
    console.error('Error ensuring berita_kegiatan table:', err.message);
  }
};

// Helper membuat slug URL yang ramah SEO & unik
export const generateSlug = (text) => {
  const base = String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Date.now().toString().slice(-4)}`;
};

const BeritaModel = {
  // Ambil semua berita (Untuk Admin CMS)
  findAllAdmin: async ({ search = '', kategori = '', status = '', limit = 50, offset = 0 } = {}) => {
    await ensureTable();
    let query = `SELECT * FROM berita_kegiatan WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (judul LIKE ? OR ringkasan LIKE ? OR konten LIKE ? OR lokasi LIKE ?)`;
      const kw = `%${search}%`;
      params.push(kw, kw, kw, kw);
    }

    if (kategori && kategori !== 'semua') {
      query += ` AND kategori = ?`;
      params.push(kategori);
    }

    if (status && status !== 'semua') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY is_pinned DESC, tanggal_kegiatan DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Ambil berita terbit saja (Untuk Siswa / Publik - Read Only)
  findPublished: async ({ search = '', kategori = '', limit = 30, offset = 0 } = {}) => {
    await ensureTable();
    let query = `SELECT * FROM berita_kegiatan WHERE status = 'published'`;
    const params = [];

    if (search) {
      query += ` AND (judul LIKE ? OR ringkasan LIKE ? OR konten LIKE ? OR lokasi LIKE ?)`;
      const kw = `%${search}%`;
      params.push(kw, kw, kw, kw);
    }

    if (kategori && kategori !== 'semua') {
      query += ` AND kategori = ?`;
      params.push(kategori);
    }

    query += ` ORDER BY is_pinned DESC, tanggal_kegiatan DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Ambil satu berita berdasarkan ID atau Slug
  findByIdOrSlug: async (identifier) => {
    await ensureTable();
    const isNumeric = !isNaN(identifier);
    const sql = isNumeric
      ? `SELECT * FROM berita_kegiatan WHERE id = ?`
      : `SELECT * FROM berita_kegiatan WHERE slug = ?`;
    const [rows] = await pool.query(sql, [identifier]);
    return rows[0] || null;
  },

  // Tambah berita baru
  create: async (data) => {
    await ensureTable();
    const {
      judul,
      ringkasan = '',
      konten,
      kategori = 'Kegiatan PKBM',
      tanggal_kegiatan = null,
      lokasi = '',
      gambar_sampul = null,
      galeri_foto = [],
      video_url = null,
      video_file = null,
      status = 'published',
      is_pinned = 0,
      penulis = 'Admin PKBM',
      created_by = null,
    } = data;

    const slug = generateSlug(judul);
    const galeriJson = Array.isArray(galeri_foto) ? JSON.stringify(galeri_foto) : (galeri_foto || null);

    const [result] = await pool.query(
      `INSERT INTO berita_kegiatan 
       (judul, slug, ringkasan, konten, kategori, tanggal_kegiatan, lokasi, gambar_sampul, galeri_foto, video_url, video_file, status, is_pinned, penulis, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        judul,
        slug,
        ringkasan || (konten ? konten.substring(0, 160) + '...' : ''),
        konten,
        kategori,
        tanggal_kegiatan || new Date(),
        lokasi,
        gambar_sampul,
        galeriJson,
        video_url,
        video_file,
        status,
        is_pinned ? 1 : 0,
        penulis,
        created_by,
      ]
    );

    return result.insertId;
  },

  // Perbarui berita
  update: async (id, data) => {
    await ensureTable();
    const existing = await BeritaModel.findByIdOrSlug(id);
    if (!existing) return null;

    const {
      judul = existing.judul,
      ringkasan = existing.ringkasan,
      konten = existing.konten,
      kategori = existing.kategori,
      tanggal_kegiatan = existing.tanggal_kegiatan,
      lokasi = existing.lokasi,
      gambar_sampul = existing.gambar_sampul,
      galeri_foto = existing.galeri_foto,
      video_url = existing.video_url,
      video_file = existing.video_file,
      status = existing.status,
      is_pinned = existing.is_pinned,
      penulis = existing.penulis,
    } = data;

    const galeriJson = Array.isArray(galeri_foto) ? JSON.stringify(galeri_foto) : galeri_foto;

    await pool.query(
      `UPDATE berita_kegiatan SET
        judul = ?,
        ringkasan = ?,
        konten = ?,
        kategori = ?,
        tanggal_kegiatan = ?,
        lokasi = ?,
        gambar_sampul = ?,
        galeri_foto = ?,
        video_url = ?,
        video_file = ?,
        status = ?,
        is_pinned = ?,
        penulis = ?
       WHERE id = ?`,
      [
        judul,
        ringkasan,
        konten,
        kategori,
        tanggal_kegiatan,
        lokasi,
        gambar_sampul,
        galeriJson,
        video_url,
        video_file,
        status,
        is_pinned ? 1 : 0,
        penulis,
        id,
      ]
    );

    return await BeritaModel.findByIdOrSlug(id);
  },

  // Hapus berita
  delete: async (id) => {
    await ensureTable();
    const [result] = await pool.query(`DELETE FROM berita_kegiatan WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  // Naikkan jumlah pembaca
  incrementViews: async (id) => {
    try {
      await pool.query(`UPDATE berita_kegiatan SET views_count = views_count + 1 WHERE id = ?`, [id]);
    } catch {
      // Abaikan jika error penghitungan view
    }
  },

  // Ringkasan metrik statistik untuk admin
  getStats: async () => {
    await ensureTable();
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as total_published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as total_draft,
        SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as total_pinned,
        SUM(CASE WHEN video_file IS NOT NULL OR (video_url IS NOT NULL AND video_url != '') THEN 1 ELSE 0 END) as total_video,
        SUM(views_count) as total_views
      FROM berita_kegiatan
    `);
    return rows[0] || { total: 0, total_published: 0, total_draft: 0, total_pinned: 0, total_video: 0, total_views: 0 };
  },
};

export default BeritaModel;

