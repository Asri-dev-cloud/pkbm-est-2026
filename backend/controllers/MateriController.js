// ============================================================
// controllers/MateriController.js
// Menangani modul KBM/LMS: Materi, Tugas, dan Jadwal KBM.
// Satu controller untuk tiga sub-modul yang saling berkaitan.
// ============================================================

import { MateriModel, TugasModel, JadwalModel } from '../models/MateriModel.js';
import SiswaModel from '../models/SiswaModel.js';
import upload from '../config/multer.js';

// ============================================================
// MATERI PEMBELAJARAN
// ============================================================
export const MateriController = {

  // GET /api/materi/rombel/:rombelId
  getByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { mapel_id } = req.query;
      const materi = await MateriModel.findByRombel(parseInt(rombelId), mapel_id ? parseInt(mapel_id) : null);
      return res.status(200).json({ success: true, data: materi });
    } catch (error) {
      console.error('[MateriController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil materi.' });
    }
  },

  // GET /api/materi/:id
  getById: async (req, res) => {
    try {
      const materi = await MateriModel.findById(parseInt(req.params.id));
      if (!materi) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });

      // Jika yang mengakses adalah WB, catat progres otomatis
      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (wb) await MateriModel.catatProgres(wb.id, materi.id, 'dibuka');
      }

      return res.status(200).json({ success: true, data: materi });
    } catch (error) {
      console.error('[MateriController.getById]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil materi.' });
    }
  },

  // POST /api/materi
  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, deskripsi, tipe, url, urutan, pertemuan_id } = req.body;

      if (!rombel_id || !mapel_id || !judul || !tipe) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, tipe.' });
      }

      const id = await MateriModel.create({
        rombel_id: parseInt(rombel_id),
        mapel_id:  parseInt(mapel_id),
        tutor_id:  req.user.id,
        judul, deskripsi, tipe,
        path_file: req.file ? req.file.path : null,
        url:       url || null,
        urutan:    urutan ? parseInt(urutan) : null,
        is_published: req.body.is_published !== undefined ? (Number(req.body.is_published) === 1 || req.body.is_published === 'true') : 1,
        pertemuan_id: pertemuan_id ? parseInt(pertemuan_id) : null
      });

      return res.status(201).json({ success: true, message: 'Materi berhasil ditambahkan.', data: { id } });
    } catch (error) {
      console.error('[MateriController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan materi.' });
    }
  },

  // PUT /api/materi/:id/publish
  togglePublish: async (req, res) => {
    try {
      const { is_published } = req.body;
      const affected = await MateriModel.togglePublish(parseInt(req.params.id), is_published);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan.' });
      const status = is_published ? 'dipublikasikan' : 'disembunyikan';
      return res.status(200).json({ success: true, message: `Materi berhasil ${status}.` });
    } catch (error) {
      console.error('[MateriController.togglePublish]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengubah status materi.' });
    }
  },

  // PUT /api/materi/:id/selesai — WB tandai materi sebagai selesai
  tandaiSelesai: async (req, res) => {
    try {
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
      await MateriModel.catatProgres(wb.id, parseInt(req.params.id), 'selesai');
      return res.status(200).json({ success: true, message: 'Materi ditandai selesai.' });
    } catch (error) {
      console.error('[MateriController.tandaiSelesai]', error);
      return res.status(500).json({ success: false, message: 'Gagal menandai materi.' });
    }
  },
};

// ============================================================
// TUGAS & PENGUMPULAN
// ============================================================
export const TugasController = {

  // GET /api/tugas/rombel/:rombelId
  getByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { mapel_id } = req.query;
      let wargaBelajarId = null;

      if (req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (!wb) {
          return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });
        }
        wargaBelajarId = wb.id;
      }

      const tugas = await TugasModel.findByRombel(
        parseInt(rombelId),
        mapel_id ? parseInt(mapel_id) : null,
        { warga_belajar_id: wargaBelajarId }
      );
      return res.status(200).json({ success: true, data: tugas });
    } catch (error) {
      console.error('[TugasController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar tugas.' });
    }
  },

  // GET /api/tugas/:id — Detail tugas + semua pengumpulan (untuk Tutor)
  getById: async (req, res) => {
    try {
      const tugas = await TugasModel.findById(parseInt(req.params.id));
      if (!tugas) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
      return res.status(200).json({ success: true, data: tugas });
    } catch (error) {
      console.error('[TugasController.getById]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail tugas.' });
    }
  },

  // POST /api/tugas — Tutor / Admin membuat tugas baru
  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, deskripsi, deadline, nilai_maks, pertemuan_id, tipe_tugas, soal_pg, soal_essay } = req.body;
      if (!rombel_id || !mapel_id || !judul || !deskripsi || !deadline) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, deskripsi, deadline.' });
      }

      // Format deskripsi dengan metadata tipe_tugas, soal PG / Essay jika ada
      let finalDeskripsi = deskripsi;
      if (tipe_tugas || soal_pg || soal_essay) {
        const metadata = {
          tipe: tipe_tugas || 'upload',
          soal_pg: soal_pg || [],
          soal_essay: soal_essay || []
        };
        finalDeskripsi = `${deskripsi}\n\n<!-- PKBM_TASK_META:${JSON.stringify(metadata)} -->`;
      }

      const id = await TugasModel.create({
        rombel_id: parseInt(rombel_id), mapel_id: parseInt(mapel_id),
        tutor_id: req.user.id, judul, deskripsi: finalDeskripsi, deadline, nilai_maks: nilai_maks || 100,
        pertemuan_id: pertemuan_id ? parseInt(pertemuan_id) : null
      });
      return res.status(201).json({ success: true, message: 'Tugas berhasil dibuat.', data: { id } });
    } catch (error) {
      console.error('[TugasController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat tugas.' });
    }
  },

  // POST /api/tugas/:id/kumpulkan — WB mengumpulkan tugas (upload file foto/pdf/doc atau jawaban teks)
  kumpulkan: async (req, res) => {
    try {
      const { catatan_siswa, jawaban_pg, jawaban_essay } = req.body;
      if (!req.file && !catatan_siswa && !jawaban_pg && !jawaban_essay) {
        return res.status(400).json({ success: false, message: 'Harap lampirkan berkas jawaban (foto/PDF) atau ketik jawaban Anda.' });
      }
      const wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) return res.status(404).json({ success: false, message: 'Profil WB tidak ditemukan.' });

      let finalCatatan = catatan_siswa || '';
      if (jawaban_essay) {
        finalCatatan = (finalCatatan ? finalCatatan + '\n\n' : '') + `[Jawaban Essay]:\n${jawaban_essay}`;
      }
      if (jawaban_pg) {
        finalCatatan = (finalCatatan ? finalCatatan + '\n\n' : '') + `[Jawaban Pilihan Ganda]:\n${typeof jawaban_pg === 'object' ? JSON.stringify(jawaban_pg) : jawaban_pg}`;
      }

      const filePath = req.file ? req.file.path : 'text_submission';
      const fileName = req.file ? req.file.originalname : 'Jawaban Online';

      await TugasModel.kumpulkanTugas({
        tugas_id: parseInt(req.params.id),
        warga_belajar_id: wb.id,
        path_file: filePath,
        nama_file: fileName,
        catatan_siswa: finalCatatan || null,
      });

      const pengumpulan = await TugasModel.findPengumpulanByTugasDanWb(parseInt(req.params.id), wb.id);

      return res.status(200).json({
        success: true,
        message: 'Tugas berhasil dikumpulkan.',
        data: pengumpulan || null,
      });
    } catch (error) {
      console.error('[TugasController.kumpulkan]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengumpulkan tugas.' });
    }
  },

  // PUT /api/tugas/pengumpulan/:pengumpulanId/nilai — Tutor menilai
  nilaiTugas: async (req, res) => {
    try {
      const { nilai, feedback_tutor } = req.body;
      if (nilai === undefined) return res.status(400).json({ success: false, message: 'Field nilai wajib diisi.' });
      const affected = await TugasModel.nilaiTugas(parseInt(req.params.pengumpulanId), { nilai: parseFloat(nilai), feedback_tutor });
      if (affected === 0) return res.status(404).json({ success: false, message: 'Pengumpulan tidak ditemukan.' });
      return res.status(200).json({ success: true, message: 'Nilai berhasil disimpan.' });
    } catch (error) {
      console.error('[TugasController.nilaiTugas]', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan nilai.' });
    }
  },
};

// ============================================================
// JADWAL KBM
// ============================================================
export const JadwalController = {

  getByRombel: async (req, res) => {
    try {
      const jadwal = await JadwalModel.findByRombel(parseInt(req.params.rombelId));
      return res.status(200).json({ success: true, data: jadwal });
    } catch (error) {
      console.error('[JadwalController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil jadwal.' });
    }
  },

  create: async (req, res) => {
    try {
      const { rombel_id, mapel_id, judul, waktu_mulai, waktu_selesai, jenis, link_meeting, lokasi, catatan } = req.body;
      if (!rombel_id || !mapel_id || !judul || !waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ success: false, message: 'Field wajib: rombel_id, mapel_id, judul, waktu_mulai, waktu_selesai.' });
      }
      const id = await JadwalModel.create({
        rombel_id: parseInt(rombel_id), mapel_id: parseInt(mapel_id),
        tutor_id: req.user.id, judul, waktu_mulai, waktu_selesai,
        jenis, link_meeting, lokasi, catatan,
      });
      return res.status(201).json({ success: true, message: 'Jadwal KBM berhasil dibuat.', data: { id } });
    } catch (error) {
      console.error('[JadwalController.create]', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat jadwal.' });
    }
  },
};
