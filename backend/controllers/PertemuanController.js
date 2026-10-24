// ============================================================
// controllers/PertemuanController.js
// Mengelola Pertemuan Belajar (pertemuan_belajar) secara terpadu.
// Menyatukan detail pertemuan, materi, tugas, absensi, dan komentar.
// ============================================================

import PertemuanModel from '../models/PertemuanModel.js';
import SiswaModel from '../models/SiswaModel.js';
import pool from '../config/db.js';

const PertemuanController = {

  // -----------------------------------------------------------
  // GET /api/pertemuan
  // Ambil semua pertemuan untuk rombel & mapel tertentu
  // Query: ?rombel_id=...&mapel_id=...
  // Akses: Semua (Siswa hanya melihat yang dipublish)
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      let { rombel_id, mapel_id } = req.query;

      if (!mapel_id) {
        return res.status(400).json({ success: false, message: 'mapel_id wajib diisi.' });
      }

      // Jika role adalah warga_belajar, dapatkan rombel_id dari profilnya jika belum dikirim
      let isStudent = req.user.role === 'warga_belajar';
      let onlyPublished = isStudent;

      if (isStudent && !rombel_id) {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb) {
          return res.status(404).json({ success: false, message: 'Profil Warga Belajar tidak ditemukan.' });
        }
        rombel_id = wb.rombel_id;
      }

      if (!rombel_id) {
        return res.status(400).json({ success: false, message: 'rombel_id wajib diisi.' });
      }

      const pertemuan = await PertemuanModel.findByRombelAndMapel(
        parseInt(rombel_id),
        parseInt(mapel_id),
        { onlyPublished }
      );

      return res.status(200).json({
        success: true,
        data: pertemuan
      });
    } catch (error) {
      console.error('[PertemuanController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/pertemuan/:id
  // Ambil detail terpadu suatu pertemuan (materi, tugas, absensi, komentar)
  // Akses: Semua
  // -----------------------------------------------------------
  getDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const pertemuan = await PertemuanModel.findById(parseInt(id));

      if (!pertemuan) {
        return res.status(404).json({ success: false, message: 'Pertemuan tidak ditemukan.' });
      }

      // Pastikan Warga Belajar tidak bisa mengakses pertemuan yang belum dipublish
      if (req.user.role === 'warga_belajar' && !pertemuan.is_published) {
        return res.status(403).json({ success: false, message: 'Pertemuan belum dipublikasikan.' });
      }

      // Ambil materi terhubung
      const materi = await PertemuanModel.findMateri(pertemuan.id);

      // Ambil tugas terhubung
      const tugas = await PertemuanModel.findTugas(pertemuan.id);

      // Ambil absensi sesi terhubung
      const absensiSesi = await PertemuanModel.findAbsensiSesi(pertemuan.id);

      // Jika user adalah warga_belajar, cari status tugas & absensi pribadinya
      let absensiSaya = null;
      let tugasSiswaMap = {};

      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (wb) {
          // Cari check-in absensi saya
          if (absensiSesi) {
            absensiSaya = await PertemuanModel.findKehadiranWB(absensiSesi.id, wb.id);
          }

          // Cari status pengumpulan tugas saya
          if (tugas.length > 0) {
            const tugasIds = tugas.map(t => t.id);
            const placeholders = tugasIds.map(() => '?').join(',');
            const sqlTugas = `
              SELECT * FROM pengumpulan_tugas
              WHERE warga_belajar_id = ? AND tugas_id IN (${placeholders})
            `;
            const [rows] = await pool.execute(sqlTugas, [wb.id, ...tugasIds]);
            rows.forEach(row => {
              tugasSiswaMap[row.tugas_id] = row;
            });
          }
        }
      }

      // Tempelkan status submit tugas siswa
      const tugasTerintegrasi = tugas.map(t => ({
        ...t,
        pengumpulan_saya: tugasSiswaMap[t.id] || null
      }));

      // Ambil komentar forum diskusi
      const komentar = await PertemuanModel.findComments(pertemuan.id);

      return res.status(200).json({
        success: true,
        data: {
          pertemuan,
          materi,
          tugas: tugasTerintegrasi,
          absensi: absensiSesi ? { ...absensiSesi, rekaman_saya: absensiSaya } : null,
          komentar
        }
      });
    } catch (error) {
      console.error('[PertemuanController.getDetail] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/pertemuan
  // Buat pertemuan belajar baru
  // Akses: Tutor, Admin, Super Admin
  // -----------------------------------------------------------
  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, pertemuan_ke, judul, rencana_materi, metode_belajar, tanggal_pelaksanaan, pengumuman, is_published } = req.body;

      if (!rombel_id || !mapel_id || !pertemuan_ke || !judul || !tanggal_pelaksanaan) {
        return res.status(400).json({
          success: false,
          message: 'Field wajib: rombel_id, mapel_id, pertemuan_ke, judul, tanggal_pelaksanaan.'
        });
      }

      // Biarkan tutor_id diambil dari user login saat Tutor yang membuat
      const tutor_id = req.user.role === 'tutor' ? req.user.id : (req.body.tutor_id || req.user.id);

      const newId = await PertemuanModel.create({
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
        tutor_id: parseInt(tutor_id),
        pertemuan_ke: parseInt(pertemuan_ke),
        judul,
        rencana_materi,
        metode_belajar,
        tanggal_pelaksanaan,
        pengumuman,
        is_published: is_published !== undefined ? (Number(is_published) === 1 || is_published === true || is_published === 'true') : 1
      });

      return res.status(201).json({
        success: true,
        message: 'Pertemuan berhasil dibuat.',
        data: { id: newId }
      });
    } catch (error) {
      console.error('[PertemuanController.create] Error:', error);
      // Tangani duplicate pertemuan_ke
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Pertemuan ke- tersebut sudah ada di rombel & mapel ini.' });
      }
      return res.status(500).json({ success: false, message: 'Gagal membuat pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/pertemuan/:id
  // Update data pertemuan belajar
  // Akses: Tutor, Admin, Super Admin
  // -----------------------------------------------------------
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { judul, rencana_materi, metode_belajar, tanggal_pelaksanaan, pertemuan_ke, pengumuman } = req.body;

      if (!judul || !tanggal_pelaksanaan || !pertemuan_ke) {
        return res.status(400).json({
          success: false,
          message: 'Field wajib: judul, pertemuan_ke, tanggal_pelaksanaan.'
        });
      }

      const affected = await PertemuanModel.update(parseInt(id), {
        judul,
        rencana_materi,
        metode_belajar,
        tanggal_pelaksanaan,
        pertemuan_ke: parseInt(pertemuan_ke),
        pengumuman
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Pertemuan tidak ditemukan atau data sama.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Pertemuan berhasil diupdate.'
      });
    } catch (error) {
      console.error('[PertemuanController.update] Error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Nomor pertemuan tersebut sudah ada untuk kelas ini.' });
      }
      return res.status(500).json({ success: false, message: 'Gagal mengupdate pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/pertemuan/:id/publish
  // Toggle publish pertemuan belajar
  // Akses: Tutor, Admin, Super Admin
  // -----------------------------------------------------------
  togglePublish: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_published } = req.body;

      if (is_published === undefined) {
        return res.status(400).json({ success: false, message: 'Field is_published wajib diisi.' });
      }

      const affected = await PertemuanModel.togglePublish(parseInt(id), is_published);

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Pertemuan tidak ditemukan.' });
      }

      const statusText = is_published ? 'dipublikasikan' : 'disembunyikan';
      return res.status(200).json({
        success: true,
        message: `Pertemuan berhasil ${statusText}.`
      });
    } catch (error) {
      console.error('[PertemuanController.togglePublish] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengubah visibilitas pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // DELETE /api/pertemuan/:id
  // Hapus pertemuan belajar
  // Akses: Tutor, Admin, Super Admin
  // -----------------------------------------------------------
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const affected = await PertemuanModel.delete(parseInt(id));

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Pertemuan tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Pertemuan berhasil dihapus.'
      });
    } catch (error) {
      console.error('[PertemuanController.delete] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus pertemuan.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/pertemuan/:id/komentar
  // Tambahkan komentar diskusi baru
  // Akses: Semua
  // -----------------------------------------------------------
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { isi } = req.body;

      if (!isi || !isi.trim()) {
        return res.status(400).json({ success: false, message: 'Isi komentar tidak boleh kosong.' });
      }

      await PertemuanModel.addComment({
        pertemuan_id: parseInt(id),
        user_id: req.user.id,
        isi: isi.trim()
      });

      // Kembalikan daftar komentar terupdate untuk langsung di-render
      const komentar = await PertemuanModel.findComments(parseInt(id));

      return res.status(201).json({
        success: true,
        message: 'Komentar berhasil ditambahkan.',
        data: komentar
      });
    } catch (error) {
      console.error('[PertemuanController.addComment] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan komentar.' });
    }
  },

  // -----------------------------------------------------------
  // DELETE /api/pertemuan/komentar/:commentId
  // Hapus komentar diskusi pribadi
  // Akses: Pemilik komentar, Tutor, Admin, Super Admin
  // -----------------------------------------------------------
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;

      // Cari pemilik komentar jika bukan super_admin/admin/tutor
      let affected = 0;
      if (['super_admin', 'admin', 'tutor'].includes(req.user.role)) {
        // Admin/Tutor bisa menghapus komentar siapapun
        const sql = `DELETE FROM komentar_pertemuan WHERE id = ?`;
        const [result] = await pool.execute(sql, [parseInt(commentId)]);
        affected = result.affectedRows;
      } else {
        // Siswa hanya bisa menghapus komentarnya sendiri
        affected = await PertemuanModel.deleteComment(parseInt(commentId), req.user.id);
      }

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan atau Anda tidak berwenang.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Komentar berhasil dihapus.'
      });
    } catch (error) {
      console.error('[PertemuanController.deleteComment] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus komentar.' });
    }
  }
};

export default PertemuanController;
