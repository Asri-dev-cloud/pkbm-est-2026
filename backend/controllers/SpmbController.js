// ============================================================
// controllers/SpmbController.js
// Menangani semua alur SPMB (Seleksi Penerimaan Murid/Warga Baru):
// - Pendaftaran publik (tanpa login)
// - Upload berkas calon WB
// - Verifikasi & keputusan Admin TU
// - Pipeline otomatis saat status = 'diterima'
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SpmbModel from '../models/SpmbModel.js';
import UserModel from '../models/UserModel.js';
import SiswaModel from '../models/SiswaModel.js';
import { hashPassword, generateNIS } from '../utils/helpers.js';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');

// Helper pembersih file sementara jika validasi / transaksi gagal
const cleanUploadedFiles = (files = []) => {
  files.forEach(f => {
    if (f && f.path) {
      try {
        const fullPath = path.resolve(f.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.warn('[cleanUploadedFiles] Gagal menghapus file sisa:', err.message);
      }
    }
  });
};

// Helper universal untuk memastikan path berkas di DB selalu berformat 'uploads/spmb/filename.ext'
const toCleanUploadPath = (filePath) => {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const uploadIdx = normalized.indexOf('uploads/');
  if (uploadIdx !== -1) {
    return normalized.substring(uploadIdx);
  }
  return `uploads/spmb/${path.basename(normalized)}`;
};

const SpmbController = {

  // -----------------------------------------------------------
  // POST /api/spmb/daftar  [PUBLIK — tanpa login]
  // Calon WB mengisi data diri dan WAJIB mengunggah 5 berkas:
  // (1) Kartu Keluarga (KK), (2) Akta Kelahiran, (3) KTP,
  // (4) Ijazah/SKL/Raport, (5) Pas Foto 3x4
  // Seluruh data disimpan secara atomik dalam 1 transaksi DB.
  // -----------------------------------------------------------
  daftar: async (req, res) => {
    let conn;
    const uploadedFiles = [];
    try {
      const {
        nama_lengkap, email, nik, no_telp, jenjang_daftar,
        tanggal_lahir, jenis_kelamin, alamat,
        jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung,
        nama_wali, password,
      } = req.body;

      // Ambil berkas dari Multer upload.fields
      const files = req.files || {};
      const fileKK = files.kk ? files.kk[0] : null;
      const fileAkta = files.akta ? files.akta[0] : null;
      const fileKTP = files.ktp ? files.ktp[0] : null;
      const fileIjazah = files.ijazah ? files.ijazah[0] : null;
      const fileFoto = files.foto ? files.foto[0] : null;

      if (fileKK) uploadedFiles.push(fileKK);
      if (fileAkta) uploadedFiles.push(fileAkta);
      if (fileKTP) uploadedFiles.push(fileKTP);
      if (fileIjazah) uploadedFiles.push(fileIjazah);
      if (fileFoto) uploadedFiles.push(fileFoto);

      // 1. Validasi field wajib data diri
      if (!nama_lengkap || !email || !no_telp || !jenjang_daftar ||
          !tanggal_lahir || !jenis_kelamin || !alamat || !nama_wali || !password) {
        cleanUploadedFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Semua kolom formulir bertanda (*) wajib diisi lengkap.',
        });
      }

      if (String(password).length < 8) {
        cleanUploadedFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Password akun minimal 8 karakter demi keamanan.',
        });
      }

      // 2. Validasi format jenjang
      const jenjangValid = ['paket_a', 'paket_b', 'paket_c'];
      if (!jenjangValid.includes(jenjang_daftar)) {
        cleanUploadedFiles(uploadedFiles);
        return res.status(400).json({
          success: false,
          message: 'Jenjang tidak valid. Pilih: paket_a, paket_b, atau paket_c.',
        });
      }

      // 3. Validasi ketat 5 berkas wajib untuk pendaftaran mandiri calon siswa (publik)
      const isAdminRegistration = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
      if (!isAdminRegistration) {
        const missingDocs = [];
        if (!fileKK) missingDocs.push('Kartu Keluarga (KK)');
        if (!fileAkta) missingDocs.push('Akta Kelahiran');
        if (!fileKTP) missingDocs.push('KTP / Identitas');
        if (!fileIjazah) missingDocs.push('Ijazah Terakhir / SKL / Raport');
        if (!fileFoto) missingDocs.push('Pas Foto 3x4');

        if (missingDocs.length > 0) {
          cleanUploadedFiles(uploadedFiles);
          return res.status(400).json({
            success: false,
            message: `Pendaftaran online mewajibkan seluruh 5 berkas persyaratan. Dokumen yang belum dipilih: ${missingDocs.join(', ')}.`,
          });
        }
      }

      // 4. Ambil tahun ajaran aktif dari database (dengan fallback cerdas)
      let tahun_ajaran_id = null;
      try {
        const [taRows] = await pool.execute(
          `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 ORDER BY id DESC LIMIT 1`
        );
        if (taRows[0]) {
          tahun_ajaran_id = taRows[0].id;
        } else {
          const [fallbackRows] = await pool.execute(
            `SELECT id FROM tahun_ajaran ORDER BY id DESC LIMIT 1`
          );
          if (fallbackRows[0]) {
            tahun_ajaran_id = fallbackRows[0].id;
          } else {
            const [insTa] = await pool.execute(
              `INSERT INTO tahun_ajaran (nama_tahun_ajaran, is_aktif, tanggal_mulai, tanggal_selesai)
               VALUES ('2026/2027', 1, '2026-07-01', '2027-06-30')`
            );
            tahun_ajaran_id = insTa.insertId;
          }
        }
      } catch (errTa) {
        console.warn('[SpmbController.daftar] Warning saat pengecekan tahun_ajaran:', errTa.message);
      }

      // 5. Cek duplikasi email pada tahun ajaran aktif
      const sudahDaftar = await SpmbModel.cekEmailTerdaftar(email.trim(), tahun_ajaran_id);
      if (sudahDaftar) {
        cleanUploadedFiles(uploadedFiles);
        return res.status(409).json({
          success: false,
          message: 'Email ini sudah pernah mendaftar pada tahun ajaran aktif. ' +
                   'Silakan hubungi staf TU atau login untuk memeriksa status Anda.',
        });
      }

      const password_hash = await hashPassword(password);

      // 6. Transaksi Database Atomik: Pendaftar + 3 Berkas disimpan bersamaan
      conn = await pool.getConnection();
      await conn.beginTransaction();

      const sqlPendaftar = `
        INSERT INTO pendaftar_spmb
          (nama_lengkap, email, nik, password_hash, no_telp, jenjang_daftar, tanggal_lahir,
           jenis_kelamin, alamat, jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung,
           nama_wali, tahun_ajaran_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
      `;
      const paramsPendaftar = [
        nama_lengkap.trim(),
        email.trim(),
        nik ? nik.trim() : null,
        password_hash,
        no_telp.trim(),
        jenjang_daftar,
        tanggal_lahir,
        jenis_kelamin,
        alamat.trim(),
        jarak_rumah_km !== undefined && jarak_rumah_km !== '' && jarak_rumah_km !== null ? parseFloat(jarak_rumah_km) : null,
        tinggi_badan !== undefined && tinggi_badan !== '' && tinggi_badan !== null ? parseInt(tinggi_badan, 10) : null,
        berat_badan !== undefined && berat_badan !== '' && berat_badan !== null ? Math.round(parseFloat(berat_badan)) : null,
        jumlah_saudara_kandung !== undefined && jumlah_saudara_kandung !== '' && jumlah_saudara_kandung !== null ? parseInt(jumlah_saudara_kandung, 10) : 0,
        nama_wali.trim(),
        tahun_ajaran_id
      ];

      const [resPendaftar] = await conn.execute(sqlPendaftar, paramsPendaftar);
      const pendaftarId = resPendaftar.insertId;

      // Simpan berkas yang ada ke berkas_spmb
      const sqlBerkas = `
        INSERT INTO berkas_spmb (pendaftar_id, jenis_berkas, nama_file, path_file, status_verifikasi, created_at)
        VALUES (?, ?, ?, ?, 'menunggu', NOW())
      `;

      if (fileKK) await conn.execute(sqlBerkas, [pendaftarId, 'kk', fileKK.originalname, toCleanUploadPath(fileKK.path)]);
      if (fileAkta) await conn.execute(sqlBerkas, [pendaftarId, 'akta', fileAkta.originalname, toCleanUploadPath(fileAkta.path)]);
      if (fileKTP) await conn.execute(sqlBerkas, [pendaftarId, 'ktp', fileKTP.originalname, toCleanUploadPath(fileKTP.path)]);
      if (fileIjazah) await conn.execute(sqlBerkas, [pendaftarId, 'ijazah', fileIjazah.originalname, toCleanUploadPath(fileIjazah.path)]);
      if (fileFoto) await conn.execute(sqlBerkas, [pendaftarId, 'foto', fileFoto.originalname, toCleanUploadPath(fileFoto.path)]);

      await conn.commit();
      conn.release();
      conn = null;

      const berkasCount = [fileKK, fileAkta, fileKTP, fileIjazah, fileFoto].filter(Boolean).length;
      return res.status(201).json({
        success: true,
        message: `Pendaftaran SPMB berhasil disimpan ke sistem (${berkasCount} dari 5 berkas terunggah).`,
        data: {
          pendaftar_id: pendaftarId,
          pesan: 'Simpan nomor pendaftaran Anda: #' + pendaftarId,
          berkas_terunggah: berkasCount,
        },
      });

    } catch (error) {
      if (conn) {
        try { await conn.rollback(); } catch (rbErr) {}
        try { conn.release(); } catch (relErr) {}
      }
      cleanUploadedFiles(uploadedFiles);
      console.error('[SpmbController.daftar] Error:', error);
      const isDup = error.code === 'ER_DUP_ENTRY';
      const errMsg = isDup
        ? 'Email atau NIK ini sudah terdaftar pada tahun ajaran aktif.'
        : (error.sqlMessage || error.message || 'Gagal menyimpan pendaftaran.');
      return res.status(isDup ? 409 : 500).json({ success: false, message: errMsg });
    }
  },

  // -----------------------------------------------------------
  // POST /api/spmb/:id/berkas  [PUBLIK — tanpa login]
  // Upload berkas pendukung (KK, ijazah, foto) untuk satu pendaftar
  // Menggunakan Multer — file sudah tersimpan ke disk oleh middleware
  // -----------------------------------------------------------
  uploadBerkas: async (req, res) => {
    try {
      const { id } = req.params;
      const { jenis_berkas } = req.body;

      // Pastikan file benar-benar terupload oleh Multer
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diupload.',
        });
      }

      // Validasi jenis berkas
      const jenisValid = ['kk', 'akta', 'ktp', 'ijazah', 'foto', 'dokumen_lain'];
      if (!jenis_berkas || !jenisValid.includes(jenis_berkas)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis berkas tidak valid. Pilih: kk, akta, ktp, ijazah, foto, atau dokumen_lain.',
        });
      }

      // Pastikan pendaftar dengan ID ini memang ada
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      const isAdminUpload = req.user && (req.user.role === 'super_admin' || req.user.role === 'admin');
      const status_verifikasi = isAdminUpload ? 'valid' : 'menunggu';

      // Simpan info berkas ke database
      const berkasId = await SpmbModel.tambahBerkas({
        pendaftar_id: parseInt(id),
        jenis_berkas,
        nama_file: req.file.originalname,
        // Path disimpan relatif dari root backend, akses via uploads/spmb/namafile
        path_file: toCleanUploadPath(req.file.path),
        status_verifikasi,
      });

      return res.status(201).json({
        success: true,
        message: isAdminUpload
          ? `Berkas '${jenis_berkas}' berhasil diunggah dan terverifikasi valid oleh Admin.`
          : `Berkas '${jenis_berkas}' berhasil diupload.`,
        data: { berkas_id: berkasId, path: req.file.path, status_verifikasi },
      });

    } catch (error) {
      console.error('[SpmbController.uploadBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengupload berkas.' });
    }
  },

  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // GET /api/spmb/cek-status  [PUBLIK — tanpa login]
  // Mengecek status pendaftaran calon WB berdasarkan email, ID, atau nama
  // -----------------------------------------------------------
  cekStatusPublik: async (req, res) => {
    try {
      const q = req.query.q || req.query.email || req.query.id || req.query.nama;
      if (!q || !String(q).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Harap masukkan alamat email, nomor pendaftaran, atau nama lengkap Anda.',
        });
      }

      const keyword = String(q).trim();
      const searchNum = (!isNaN(keyword) && !keyword.includes('@')) ? parseInt(keyword) : -1;
      const searchLike = `%${keyword}%`;

      const sql = `
        SELECT p.id, p.nama_lengkap, p.email, p.nik, p.no_telp, p.jenjang_daftar, p.status,
               p.catatan_verifikasi, p.warga_belajar_id, p.created_at,
               ta.nama_tahun_ajaran,
               wb.nis,
               r.nama_rombel
        FROM pendaftar_spmb p
        LEFT JOIN tahun_ajaran ta ON ta.id = p.tahun_ajaran_id
        LEFT JOIN warga_belajar wb ON wb.id = p.warga_belajar_id
        LEFT JOIN rombel r ON r.id = wb.rombel_id
        WHERE p.id = ?
           OR LOWER(p.email) = LOWER(?)
           OR LOWER(p.nama_lengkap) LIKE LOWER(?)
           OR p.nik = ?
           OR p.no_telp LIKE ?
        ORDER BY p.id DESC
        LIMIT 1
      `;
      const params = [searchNum, keyword, searchLike, keyword, searchLike];

      const [rows] = await pool.execute(sql, params);

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: `Data pendaftaran tidak ditemukan untuk "${keyword}". Pastikan nama lengkap, email, atau nomor pendaftaran Anda sudah sesuai.`,
        });
      }

      const p = rows[0];

      // Jika pendaftar sudah diterima namun akun WB belum tersinkron, jalankan auto-sync
      if (p.status === 'diterima' && !p.warga_belajar_id) {
        try {
          const syncResult = await ensureWargaBelajarAccount(p.id, null, null);
          if (syncResult) {
            p.warga_belajar_id = syncResult.wbId;
            p.nis = syncResult.nis;
          }
        } catch (syncErr) {
          console.warn('[SpmbController.cekStatusPublik] Auto-sync WB failed:', syncErr.message);
        }
      }

      // Ambil berkas-berkas pendukung
      const [berkasRows] = await pool.execute(
        `SELECT id, jenis_berkas, nama_file, status_verifikasi, catatan FROM berkas_spmb WHERE pendaftar_id = ?`,
        [p.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Status pendaftaran berhasil ditemukan.',
        data: {
          id: p.id,
          nama_lengkap: p.nama_lengkap,
          email: p.email,
          email_masked: p.email ? p.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length))) : '',
          jenjang_daftar: p.jenjang_daftar,
          tahun_ajaran: p.nama_tahun_ajaran || '2025/2026',
          status: p.status, // 'pending', 'diterima', 'ditolak'
          catatan_verifikasi: p.catatan_verifikasi,
          warga_belajar_id: p.warga_belajar_id,
          nis: p.nis || (p.status === 'diterima' ? 'Terdaftar Resmi' : null),
          nama_rombel: p.nama_rombel || (p.status === 'diterima' ? 'Dalam Penetapan' : null),
          created_at: p.created_at,
          berkas: berkasRows || [],
        },
      });
    } catch (error) {
      console.error('[SpmbController.cekStatusPublik] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memeriksa status pendaftaran.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb  [Admin, Super Admin]
  // Ambil semua pendaftar untuk antrian verifikasi
  // Query params opsional: ?status=pending&tahun_ajaran_id=1
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const { status, tahun_ajaran_id } = req.query;
      let pendaftar = await SpmbModel.findAll({
        status: status || null,
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      });

      // Auto-heal pendaftar 'diterima' yang belum punya warga_belajar_id
      let needsRefresh = false;
      for (const p of pendaftar) {
        if (p.status === 'diterima' && !p.warga_belajar_id) {
          try {
            await ensureWargaBelajarAccount(p.id, null, p.diverifikasi_oleh);
            needsRefresh = true;
          } catch (healErr) {
            console.warn(`[SpmbController.getAll] Auto-heal WB failed for ID ${p.id}:`, healErr.message);
          }
        }
      }

      if (needsRefresh) {
        pendaftar = await SpmbModel.findAll({
          status: status || null,
          tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
        });
      }

      return res.status(200).json({
        success: true,
        message: `${pendaftar.length} data pendaftar ditemukan.`,
        data: pendaftar,
      });
    } catch (error) {
      console.error('[SpmbController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb/statistik  [Admin, Pimpinan, Super Admin]
  // Widget angka ringkasan: total, pending, diterima, ditolak
  // -----------------------------------------------------------
  getStatistik: async (req, res) => {
    try {
      const statistik = await SpmbModel.getStatistik();
      return res.status(200).json({ success: true, data: statistik });
    } catch (error) {
      console.error('[SpmbController.getStatistik] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil statistik SPMB.' });
    }
  },

  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // GET /api/spmb/:id  [Admin, Super Admin]
  // Detail satu pendaftar beserta semua berkas yang diupload
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      let pendaftar = await SpmbModel.findById(parseInt(id));

      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      // Self-healing: jika status diterima tapi warga_belajar_id masih null, sinkronkan otomatis
      if (pendaftar.status === 'diterima' && !pendaftar.warga_belajar_id) {
        try {
          const syncResult = await ensureWargaBelajarAccount(pendaftar.id, null, pendaftar.diverifikasi_oleh);
          if (syncResult) {
            pendaftar = await SpmbModel.findById(parseInt(id));
          }
        } catch (repairErr) {
          console.warn('[SpmbController.getById] Auto-repair WB failed:', repairErr.message);
        }
      }

      return res.status(200).json({ success: true, data: pendaftar });
    } catch (error) {
      console.error('[SpmbController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/berkas/:berkasId/verifikasi  [Admin]
  // Admin memverifikasi satu berkas: valid atau tidak_valid
  // Body: { status_verifikasi: 'valid'|'tidak_valid', catatan }
  // -----------------------------------------------------------
  verifikasiBerkas: async (req, res) => {
    try {
      const { berkasId } = req.params;
      const { status_verifikasi, catatan } = req.body;

      const statusValid = ['valid', 'tidak_valid'];
      if (!status_verifikasi || !statusValid.includes(status_verifikasi)) {
        return res.status(400).json({
          success: false,
          message: 'Status verifikasi harus "valid" atau "tidak_valid".',
        });
      }

      const affected = await SpmbModel.updateStatusBerkas(parseInt(berkasId), {
        status_verifikasi,
        catatan: catatan || null,
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Berkas tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: `Berkas berhasil ditandai sebagai '${status_verifikasi}'.`,
      });
    } catch (error) {
      console.error('[SpmbController.verifikasiBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memverifikasi berkas.' });
    }
  },

  // -----------------------------------------------------------
  // DELETE /api/spmb/berkas/:berkasId  [Admin, Super Admin]
  // Menghapus berkas pendukung (file fisik & record database)
  // -----------------------------------------------------------
  hapusBerkas: async (req, res) => {
    try {
      const { berkasId } = req.params;
      const affected = await SpmbModel.hapusBerkas(parseInt(berkasId));
      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Berkas tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Berkas berhasil dihapus.',
      });
    } catch (error) {
      console.error('[SpmbController.hapusBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus berkas.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb/berkas/:berkasId/file  [Publik / Admin]
  // Menyajikan file berkas secara langsung dengan streaming andal
  // -----------------------------------------------------------
  getBerkasFile: async (req, res) => {
    try {
      const { berkasId } = req.params;
      const [rows] = await pool.execute(
        `SELECT id, jenis_berkas, nama_file, path_file FROM berkas_spmb WHERE id = ? LIMIT 1`,
        [parseInt(berkasId)]
      );

      if (rows.length === 0 || !rows[0].path_file) {
        return res.status(404).json({ success: false, message: 'Berkas tidak ditemukan di database.' });
      }

      const berkas = rows[0];
      const candidatePaths = [
        path.resolve(backendRootDir, berkas.path_file),
        path.resolve(backendRootDir, 'uploads', berkas.path_file.replace(/^uploads[\\/]/, '')),
        path.resolve(backendRootDir, 'uploads', 'spmb', path.basename(berkas.path_file)),
        path.resolve(backendRootDir, 'uploads', path.basename(berkas.path_file)),
      ];

      let foundPath = candidatePaths.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

      if (!foundPath) {
        return res.status(404).json({
          success: false,
          message: `File fisik '${berkas.nama_file}' tidak ditemukan di server.`,
          path: berkas.path_file,
        });
      }

      const ext = path.extname(foundPath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(berkas.nama_file || path.basename(foundPath))}"`);
      return res.sendFile(foundPath);
    } catch (error) {
      console.error('[SpmbController.getBerkasFile] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil file berkas.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/:id/keputusan  [Admin]
  // Keputusan akhir: TERIMA atau TOLAK pendaftar
  // Body: { status: 'diterima'|'ditolak', catatan_verifikasi, rombel_id }
  // -----------------------------------------------------------
  buatKeputusan: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, catatan_verifikasi, rombel_id } = req.body;

      // Validasi input
      const statusValid = ['diterima', 'ditolak'];
      if (!status || !statusValid.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus "diterima" atau "ditolak".',
        });
      }

      // Ambil data pendaftar
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan.' });
      }

      // Jika pendaftar sudah diterima dan sudah punya akun WB, izinkan update rombel / catatan
      if (status === 'diterima') {
        const syncResult = await ensureWargaBelajarAccount(
          parseInt(id),
          rombel_id,
          req.user?.id || pendaftar.diverifikasi_oleh
        );

        if (catatan_verifikasi) {
          await pool.execute(
            `UPDATE pendaftar_spmb SET catatan_verifikasi = ? WHERE id = ?`,
            [catatan_verifikasi, parseInt(id)]
          );
        }

        return res.status(200).json({
          success: true,
          message: `Pendaftar '${pendaftar.nama_lengkap}' berhasil DITERIMA. Akun Warga Belajar telah aktif. NIS: ${syncResult.nis}.`,
          data: {
            warga_belajar_id: syncResult.wbId,
            nis: syncResult.nis,
            user_id: syncResult.userId,
            rombel_id: syncResult.rombelId,
          },
        });
      }

      // Jika ditolak
      await pool.execute(
        `UPDATE pendaftar_spmb
         SET status = 'ditolak',
             catatan_verifikasi = ?,
             diverifikasi_oleh = ?,
             tanggal_verifikasi = NOW()
         WHERE id = ?`,
        [catatan_verifikasi || null, req.user?.id || 1, parseInt(id)]
      );

      return res.status(200).json({
        success: true,
        message: `Pendaftar '${pendaftar.nama_lengkap}' telah DITOLAK.`,
      });

    } catch (error) {
      console.error('[SpmbController.buatKeputusan] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses keputusan SPMB. Error: ' + error.message,
      });
    }
  },
};

// -----------------------------------------------------------
// Helper universal sinkronisasi / pembuatan akun Warga Belajar
// -----------------------------------------------------------
export const ensureWargaBelajarAccount = async (pendaftarId, rombelIdParam = null, adminUserId = null) => {
  const [pRows] = await pool.execute(`SELECT * FROM pendaftar_spmb WHERE id = ? LIMIT 1`, [pendaftarId]);
  if (!pRows.length) return null;
  const pendaftar = pRows[0];

  // 1. Dapatkan atau pilih rombel yang tepat
  let chosenRombelId = rombelIdParam ? parseInt(rombelIdParam) : null;
  if (!chosenRombelId) {
    const [rombelRows] = await pool.execute(
      `SELECT r.id FROM rombel r JOIN tahun_ajaran ta ON ta.id = r.tahun_ajaran_id WHERE ta.is_aktif = 1 AND r.jenjang = ? LIMIT 1`,
      [pendaftar.jenjang_daftar]
    );
    if (rombelRows.length > 0) {
      chosenRombelId = rombelRows[0].id;
    } else {
      const [anyRombel] = await pool.execute(`SELECT id FROM rombel LIMIT 1`);
      if (anyRombel.length > 0) chosenRombelId = anyRombel[0].id;
    }
  }

  // 2. Tahun ajaran aktif
  const [taRows] = await pool.execute(
    `SELECT id, nama_tahun_ajaran FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
  );
  const tahunAjaranAktif = taRows[0];
  const tahun_ajaran_id = tahunAjaranAktif?.id || pendaftar.tahun_ajaran_id || 1;

  // 3. User account (cek duplikasi email)
  let userId;
  const existingUser = await UserModel.findByEmail(pendaftar.email);
  // Cek apakah ada pas foto di berkas_spmb
  const [berkasFoto] = await pool.execute(
    `SELECT path_file FROM berkas_spmb WHERE pendaftar_id = ? AND jenis_berkas = 'foto' ORDER BY id DESC LIMIT 1`,
    [pendaftarId]
  );
  const pasFotoFile = berkasFoto[0]?.path_file || null;

  if (existingUser) {
    userId = existingUser.id;
    if (existingUser.role !== 'warga_belajar') {
      await pool.execute(`UPDATE users SET role = 'warga_belajar' WHERE id = ?`, [userId]);
    }
    if (pasFotoFile) {
      await pool.execute(`UPDATE users SET foto_profil = COALESCE(foto_profil, ?) WHERE id = ?`, [pasFotoFile, userId]);
    }
  } else {
    const password_hash = pendaftar.password_hash || await hashPassword(pendaftar.no_telp || '12345678');
    const [uResult] = await pool.execute(
      `INSERT INTO users (nama_lengkap, email, password_hash, role, foto_profil, is_active, created_at)
       VALUES (?, ?, ?, 'warga_belajar', ?, 1, NOW())`,
      [pendaftar.nama_lengkap, pendaftar.email, password_hash, pasFotoFile]
    );
    userId = uResult.insertId;
  }

  // 4. Profil Warga Belajar
  let wbId;
  let nis;
  const [wbRows] = await pool.execute(
    `SELECT id, nis, rombel_id FROM warga_belajar WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (wbRows.length > 0) {
    wbId = wbRows[0].id;
    nis = wbRows[0].nis;
    await pool.execute(
      `UPDATE warga_belajar SET
         rombel_id = COALESCE(?, rombel_id),
         jarak_rumah_km = COALESCE(?, jarak_rumah_km),
         tinggi_badan = COALESCE(?, tinggi_badan),
         berat_badan = COALESCE(?, berat_badan),
         jumlah_saudara_kandung = COALESCE(?, jumlah_saudara_kandung),
         nik = COALESCE(?, nik),
         alamat = COALESCE(?, alamat),
         nama_wali = COALESCE(?, nama_wali),
         no_telp = COALESCE(?, no_telp)
       WHERE id = ?`,
      [
        chosenRombelId,
        pendaftar.jarak_rumah_km || null,
        pendaftar.tinggi_badan || null,
        pendaftar.berat_badan || null,
        pendaftar.jumlah_saudara_kandung !== undefined && pendaftar.jumlah_saudara_kandung !== null ? pendaftar.jumlah_saudara_kandung : null,
        pendaftar.nik || null,
        pendaftar.alamat || null,
        pendaftar.nama_wali || null,
        pendaftar.no_telp || null,
        wbId
      ]
    );
  } else {
    const [cntRows] = await pool.execute(`SELECT COUNT(*) AS total FROM warga_belajar`);
    const totalWb = cntRows[0]?.total || 0;
    nis = generateNIS(totalWb + 1, tahunAjaranAktif?.nama_tahun_ajaran || '2025/2026');

    const [wbResult] = await pool.execute(
      `INSERT INTO warga_belajar
        (user_id, nis, nik, jenjang, tanggal_lahir, jenis_kelamin, alamat,
         jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung,
         nama_wali, no_telp, rombel_id, tahun_ajaran_id, is_aktif, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        userId,
        nis,
        pendaftar.nik || null,
        pendaftar.jenjang_daftar,
        pendaftar.tanggal_lahir,
        pendaftar.jenis_kelamin,
        pendaftar.alamat,
        pendaftar.jarak_rumah_km || null,
        pendaftar.tinggi_badan || null,
        pendaftar.berat_badan || null,
        pendaftar.jumlah_saudara_kandung !== undefined && pendaftar.jumlah_saudara_kandung !== null ? pendaftar.jumlah_saudara_kandung : null,
        pendaftar.nama_wali,
        pendaftar.no_telp,
        chosenRombelId,
        tahun_ajaran_id,
      ]
    );
    wbId = wbResult.insertId;
  }

  // 5. Update pendaftar_spmb dengan id warga_belajar
  await pool.execute(
    `UPDATE pendaftar_spmb
     SET status = 'diterima',
         warga_belajar_id = ?,
         diverifikasi_oleh = COALESCE(?, diverifikasi_oleh, 1),
         tanggal_verifikasi = COALESCE(tanggal_verifikasi, NOW())
     WHERE id = ?`,
    [wbId, adminUserId, pendaftarId]
  );

  // 6. Validasi berkas pendukung yang telah diunggah
  await pool.execute(
    `UPDATE berkas_spmb SET status_verifikasi = 'valid' WHERE pendaftar_id = ? AND status_verifikasi != 'tidak_valid'`,
    [pendaftarId]
  );

  return { userId, wbId, nis, rombelId: chosenRombelId };
};

export default SpmbController;
