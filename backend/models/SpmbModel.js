// ============================================================
// models/SpmbModel.js
// Model untuk modul SPMB (Seleksi Penerimaan Murid/Warga Baru).
// Mencakup: pendaftaran publik, upload berkas, verifikasi Admin,
// dan pipeline otomatis saat status berubah menjadi 'diterima'.
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');

const SpmbModel = {

  // -----------------------------------------------------------
  // Buat pendaftaran baru (tanpa login / akses publik)
  // Dipanggil saat calon WB submit form SPMB online
  // -----------------------------------------------------------
  create: async ({
    nama_lengkap, email, nik, no_telp, jenjang_daftar,
    tanggal_lahir, jenis_kelamin, alamat,
    jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung,
    nama_wali, password_hash, tahun_ajaran_id
  }) => {
    const sql = `
      INSERT INTO pendaftar_spmb
        (nama_lengkap, email, nik, password_hash, no_telp, jenjang_daftar, tanggal_lahir,
         jenis_kelamin, alamat, jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung,
         nama_wali, tahun_ajaran_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;
    const params = [
      nama_lengkap, email, nik || null, password_hash, no_telp, jenjang_daftar,
      tanggal_lahir, jenis_kelamin, alamat,
      jarak_rumah_km !== undefined && jarak_rumah_km !== '' && jarak_rumah_km !== null ? jarak_rumah_km : null,
      tinggi_badan !== undefined && tinggi_badan !== '' && tinggi_badan !== null ? tinggi_badan : null,
      berat_badan !== undefined && berat_badan !== '' && berat_badan !== null ? berat_badan : null,
      jumlah_saudara_kandung !== undefined && jumlah_saudara_kandung !== '' && jumlah_saudara_kandung !== null ? jumlah_saudara_kandung : null,
      nama_wali, tahun_ajaran_id
    ];
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Ambil semua pendaftar, bisa difilter berdasarkan status
  // Digunakan di dashboard antrian verifikasi Admin TU
  // -----------------------------------------------------------
  findAll: async ({ status = null, tahun_ajaran_id = null } = {}) => {
    let sql = `
      SELECT
        ps.id,
        ps.nama_lengkap,
        ps.email,
        ps.nik,
        ps.no_telp,
        ps.jenjang_daftar,
        ps.tanggal_lahir,
        ps.jenis_kelamin,
        ps.alamat,
        ps.jarak_rumah_km,
        ps.tinggi_badan,
        ps.berat_badan,
        ps.jumlah_saudara_kandung,
        ps.nama_wali,
        ps.status,
        ps.catatan_verifikasi,
        ps.diverifikasi_oleh,
        ps.tanggal_verifikasi,
        ps.tahun_ajaran_id,
        ps.warga_belajar_id,
        ps.created_at,
        ta.nama_tahun_ajaran,
        u.nama_lengkap AS nama_verifikator,
        (SELECT COUNT(*) FROM berkas_spmb bs WHERE bs.pendaftar_id = ps.id) AS jumlah_berkas
      FROM pendaftar_spmb ps
      LEFT JOIN tahun_ajaran ta ON ps.tahun_ajaran_id = ta.id
      LEFT JOIN users u ON ps.diverifikasi_oleh = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND ps.status = ?`;
      params.push(status);
    }
    if (tahun_ajaran_id) {
      sql += ` AND ps.tahun_ajaran_id = ?`;
      params.push(tahun_ajaran_id);
    }

    sql += ` ORDER BY ps.created_at DESC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // -----------------------------------------------------------
  // Ambil detail satu pendaftar beserta semua berkasnya
  // -----------------------------------------------------------
  findById: async (id) => {
    const sqlPendaftar = `
      SELECT
        ps.id,
        ps.nama_lengkap,
        ps.email,
        ps.nik,
        ps.password_hash,
        ps.no_telp,
        ps.jenjang_daftar,
        ps.tanggal_lahir,
        ps.jenis_kelamin,
        ps.alamat,
        ps.jarak_rumah_km,
        ps.tinggi_badan,
        ps.berat_badan,
        ps.jumlah_saudara_kandung,
        ps.nama_wali,
        ps.status,
        ps.catatan_verifikasi,
        ps.diverifikasi_oleh,
        ps.tanggal_verifikasi,
        ps.tahun_ajaran_id,
        ps.warga_belajar_id,
        ps.created_at,
        ta.nama_tahun_ajaran,
        u.nama_lengkap AS nama_verifikator
      FROM pendaftar_spmb ps
      LEFT JOIN tahun_ajaran ta ON ps.tahun_ajaran_id = ta.id
      LEFT JOIN users u ON ps.diverifikasi_oleh = u.id
      WHERE ps.id = ?
      LIMIT 1
    `;
    const [pendaftar] = await pool.execute(sqlPendaftar, [id]);
    if (!pendaftar[0]) return null;

    // Ambil berkas yang diupload
    const sqlBerkas = `
      SELECT * FROM berkas_spmb WHERE pendaftar_id = ? ORDER BY jenis_berkas
    `;
    const [berkas] = await pool.execute(sqlBerkas, [id]);

    return { ...pendaftar[0], berkas };
  },

  // -----------------------------------------------------------
  // Simpan info berkas yang diupload calon WB atau Admin TU
  // Dipanggil setelah Multer berhasil menyimpan file
  // Jika jenis berkas selain 'dokumen_lain' sudah ada, lakukan replace
  // dan bersihkan file lama agar tidak menumpuk di storage
  // -----------------------------------------------------------
  tambahBerkas: async ({ pendaftar_id, jenis_berkas, nama_file, path_file, status_verifikasi = 'menunggu' }) => {
    if (jenis_berkas !== 'dokumen_lain') {
      const [existing] = await pool.execute(
        `SELECT id, path_file FROM berkas_spmb WHERE pendaftar_id = ? AND jenis_berkas = ? LIMIT 1`,
        [pendaftar_id, jenis_berkas]
      );
      if (existing.length > 0) {
        const oldPath = existing[0].path_file;
        if (oldPath) {
          try {
            const fullOldPath = path.resolve(backendRootDir, oldPath);
            if (fs.existsSync(fullOldPath)) {
              fs.unlinkSync(fullOldPath);
            }
          } catch (e) {
            console.warn('[SpmbModel.tambahBerkas] Gagal menghapus file lama:', e.message);
          }
        }
        await pool.execute(
          `UPDATE berkas_spmb 
           SET nama_file = ?, path_file = ?, status_verifikasi = ?, catatan = NULL, created_at = NOW() 
           WHERE id = ?`,
          [nama_file, path_file, status_verifikasi, existing[0].id]
        );
        return existing[0].id;
      }
    }

    const sql = `
      INSERT INTO berkas_spmb (pendaftar_id, jenis_berkas, nama_file, path_file, status_verifikasi)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [pendaftar_id, jenis_berkas, nama_file, path_file, status_verifikasi]);
    return result.insertId;
  },

  // -----------------------------------------------------------
  // Hapus berkas pendukung (oleh Admin atau Pendaftar)
  // Menghapus file fisik dari disk dan record dari database
  // -----------------------------------------------------------
  hapusBerkas: async (berkas_id) => {
    const [rows] = await pool.execute(
      `SELECT id, path_file FROM berkas_spmb WHERE id = ? LIMIT 1`,
      [berkas_id]
    );
    if (rows.length > 0 && rows[0].path_file) {
      try {
        const fullPath = path.resolve(backendRootDir, rows[0].path_file);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (e) {
        console.warn('[SpmbModel.hapusBerkas] Gagal menghapus file fisik:', e.message);
      }
    }
    const [result] = await pool.execute(`DELETE FROM berkas_spmb WHERE id = ?`, [berkas_id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Update status verifikasi berkas (valid / tidak_valid)
  // -----------------------------------------------------------
  updateStatusBerkas: async (berkas_id, { status_verifikasi, catatan }) => {
    const sql = `
      UPDATE berkas_spmb
      SET status_verifikasi = ?, catatan = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [status_verifikasi, catatan || null, berkas_id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Update status pendaftar: pending → diterima / ditolak
  // Dilakukan oleh Admin TU setelah verifikasi berkas
  // -----------------------------------------------------------
  updateStatus: async (id, { status, catatan_verifikasi, diverifikasi_oleh }) => {
    const sql = `
      UPDATE pendaftar_spmb
      SET
        status = ?,
        catatan_verifikasi = ?,
        diverifikasi_oleh = ?,
        tanggal_verifikasi = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [status, catatan_verifikasi || null, diverifikasi_oleh, id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Catat ID warga_belajar yang dibuat dari pipeline SPMB
  // Dipanggil setelah pipeline otomatis selesai membuat akun WB
  // -----------------------------------------------------------
  catatWargaBelajarId: async (pendaftar_id, warga_belajar_id) => {
    const sql = `
      UPDATE pendaftar_spmb SET warga_belajar_id = ? WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [warga_belajar_id, pendaftar_id]);
    return result.affectedRows;
  },

  // -----------------------------------------------------------
  // Ambil statistik SPMB dari view yang sudah ada di schema
  // Digunakan di widget dashboard Admin TU & Pimpinan
  // -----------------------------------------------------------
  getStatistik: async () => {
    const sql = `SELECT *, total_pendaftar AS total FROM v_spmb_statistik LIMIT 1`;
    const [rows] = await pool.execute(sql);
    return rows[0];
  },

  // -----------------------------------------------------------
  // Cek apakah email sudah pernah mendaftar di tahun ajaran ini
  // Mencegah duplikasi pendaftaran
  // -----------------------------------------------------------
  cekEmailTerdaftar: async (email, tahun_ajaran_id) => {
    const sql = `
      SELECT id FROM pendaftar_spmb
      WHERE email = ? AND tahun_ajaran_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [email, tahun_ajaran_id]);
    return rows[0] || null;
  },

  // -----------------------------------------------------------
  // Hitung jumlah WB aktif untuk generate NIS otomatis
  // Format NIS: PKBM-TAHUN-XXXX
  // -----------------------------------------------------------
  hitungTotalWbUntukNIS: async () => {
    const sql = `SELECT COUNT(*) AS total FROM warga_belajar`;
    const [rows] = await pool.execute(sql);
    return rows[0].total;
  },
};

export default SpmbModel;
