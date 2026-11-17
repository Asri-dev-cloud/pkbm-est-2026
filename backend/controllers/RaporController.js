// ============================================================
// backend/controllers/RaporController.js
// Controller untuk Manajemen Rapor Siswa Digital
// Mendukung CRUD untuk Admin dan Read-Only untuk Siswa
// ============================================================

import RaporModel from '../models/RaporModel.js';
import pool from '../config/db.js';

const RaporController = {

  // -----------------------------------------------------------
  // GET /api/rapor/meta
  // Mengambil opsi dropdown: tahun ajaran, rombel, mapel, siswa
  // Akses: Admin, Super Admin, Warga Belajar
  // -----------------------------------------------------------
  getMeta: async (req, res) => {
    try {
      const meta = await RaporModel.getMeta();
      return res.status(200).json({
        success: true,
        message: 'Data referensi rapor berhasil dimuat.',
        data: meta,
      });
    } catch (err) {
      console.error('[RaporController.getMeta Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat data referensi rapor.',
        error: err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/rapor
  // Mengambil daftar seluruh rapor siswa (dengan filter)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const { tahun_ajaran_id, semester, rombel_id, search } = req.query;

      const list = await RaporModel.findAll({
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
        semester: semester || null,
        rombel_id: rombel_id ? parseInt(rombel_id) : null,
        search: search || null,
      });

      return res.status(200).json({
        success: true,
        message: `Berhasil memuat ${list.length} data rapor.`,
        data: list,
      });
    } catch (err) {
      console.error('[RaporController.getAll Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat daftar rapor siswa.',
        error: err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/rapor/siswa/me
  // Mengambil daftar rapor milik siswa yang sedang login (Read-Only)
  // Akses: Warga Belajar, Admin, Super Admin
  // -----------------------------------------------------------
  getMyRapor: async (req, res) => {
    try {
      const userId = req.user.id;
      const { semester, tahun_ajaran_id } = req.query;

      // Cari data warga_belajar berdasarkan user_id
      const [wbRows] = await pool.query(
        `SELECT wb.id, wb.nis, wb.jenjang, wb.rombel_id, u.nama_lengkap, rb.nama_rombel
         FROM warga_belajar wb
         JOIN users u ON wb.user_id = u.id
         LEFT JOIN rombel rb ON wb.rombel_id = rb.id
         WHERE wb.user_id = ?`,
        [userId]
      );

      if (!wbRows || wbRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data profil warga belajar tidak ditemukan.',
        });
      }

      const wb = wbRows[0];
      const raporList = await RaporModel.findByWargaBelajar(wb.id, {
        semester: semester || null,
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      });

      return res.status(200).json({
        success: true,
        message: 'Data rapor berhasil dimuat.',
        profil: wb,
        data: raporList,
      });
    } catch (err) {
      console.error('[RaporController.getMyRapor Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat rapor digital Anda.',
        error: err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/rapor/:id
  // Mengambil detail satu rapor lengkap beserta mata pelajaran & nilai
  // Akses: Admin, Super Admin, atau Siswa pemilik rapor itu sendiri
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const rapor = await RaporModel.findById(id);

      if (!rapor) {
        return res.status(404).json({
          success: false,
          message: 'Data rapor tidak ditemukan.',
        });
      }

      // Jika role adalah warga_belajar, pastikan rapor milik akun sendiri
      if (req.user.role === 'warga_belajar') {
        const [wbCheck] = await pool.query(
          `SELECT id FROM warga_belajar WHERE id = ? AND user_id = ?`,
          [rapor.warga_belajar_id, req.user.id]
        );
        if (!wbCheck || wbCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Anda tidak berhak melihat rapor ini.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Detail rapor berhasil dimuat.',
        data: rapor,
      });
    } catch (err) {
      console.error('[RaporController.getById Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat detail rapor.',
        error: err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // POST /api/rapor
  // Membuat data rapor baru (Create)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  create: async (req, res) => {
    try {
      const {
        warga_belajar_id,
        rombel_id,
        tahun_ajaran_id,
        semester,
        nama_wali_kelas,
        fase,
        data_kustom,
        total_hadir,
        total_izin,
        total_sakit,
        total_alpa,
        catatan_wali,
        status_rapor,
        nilai,
      } = req.body;

      if (!warga_belajar_id || !tahun_ajaran_id || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Siswa, Tahun Ajaran, dan Semester wajib dipilih.',
        });
      }

      const raporId = await RaporModel.create({
        warga_belajar_id: parseInt(warga_belajar_id),
        rombel_id: rombel_id ? parseInt(rombel_id) : 1,
        tahun_ajaran_id: parseInt(tahun_ajaran_id),
        semester: String(semester),
        nama_wali_kelas: nama_wali_kelas || null,
        fase: fase || null,
        data_kustom: data_kustom || null,
        total_hadir: parseInt(total_hadir) || 0,
        total_izin: parseInt(total_izin) || 0,
        total_sakit: parseInt(total_sakit) || 0,
        total_alpa: parseInt(total_alpa) || 0,
        catatan_wali: catatan_wali || '',
        status_rapor: status_rapor || 'draft',
        nilai: Array.isArray(nilai) ? nilai : [],
      });

      const fullRapor = await RaporModel.findById(raporId);

      return res.status(201).json({
        success: true,
        message: 'Rapor siswa berhasil disimpan.',
        data: fullRapor,
      });
    } catch (err) {
      console.error('[RaporController.create Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan rapor siswa: ' + err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/rapor/:id
  // Memperbarui data rapor (Update)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        rombel_id,
        nama_wali_kelas,
        fase,
        data_kustom,
        total_hadir,
        total_izin,
        total_sakit,
        total_alpa,
        catatan_wali,
        status_rapor,
        nilai,
      } = req.body;

      const existing = await RaporModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Data rapor tidak ditemukan.',
        });
      }

      await RaporModel.update(id, {
        rombel_id: rombel_id ? parseInt(rombel_id) : existing.rombel_id,
        nama_wali_kelas: nama_wali_kelas !== undefined ? nama_wali_kelas : existing.nama_wali_kelas,
        fase: fase !== undefined ? fase : existing.fase,
        data_kustom: data_kustom !== undefined ? data_kustom : existing.data_kustom,
        total_hadir: total_hadir !== undefined ? parseInt(total_hadir) : existing.total_hadir,
        total_izin: total_izin !== undefined ? parseInt(total_izin) : existing.total_izin,
        total_sakit: total_sakit !== undefined ? parseInt(total_sakit) : existing.total_sakit,
        total_alpa: total_alpa !== undefined ? parseInt(total_alpa) : existing.total_alpa,
        catatan_wali: catatan_wali !== undefined ? catatan_wali : existing.catatan_wali,
        status_rapor: status_rapor || existing.status_rapor,
        nilai: Array.isArray(nilai) ? nilai : existing.nilai,
      });

      const updated = await RaporModel.findById(id);

      return res.status(200).json({
        success: true,
        message: 'Rapor siswa berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      console.error('[RaporController.update Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui rapor siswa: ' + err.message,
      });
    }
  },

  // -----------------------------------------------------------
  // DELETE /api/rapor/:id
  // Menghapus rapor siswa (Delete)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await RaporModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Data rapor tidak ditemukan.',
        });
      }

      await RaporModel.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Data rapor berhasil dihapus.',
      });
    } catch (err) {
      console.error('[RaporController.delete Error]:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus data rapor.',
      });
    }
  },
};

export default RaporController;

