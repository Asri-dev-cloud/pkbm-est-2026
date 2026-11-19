// ============================================================
// controllers/MateriController.js
// Menangani modul KBM/LMS: Materi, Tugas, dan Jadwal KBM.
// Satu controller untuk tiga sub-modul yang saling berkaitan.
// ============================================================

import { MateriModel, TugasModel, JadwalModel } from '../models/MateriModel.js';
import SiswaModel from '../models/SiswaModel.js';
import upload from '../config/multer.js';
import pool from '../config/db.js';

// Helper pembersih path upload agar konsisten dan portabel di Linux/Windows
const toCleanUploadPath = (filePath) => {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const uploadIdx = normalized.indexOf('uploads/');
  if (uploadIdx !== -1) {
    return normalized.substring(uploadIdx);
  }
  return normalized;
};

// ============================================================
// MATERI PEMBELAJARAN
// ============================================================
export const MateriController = {

  // GET /api/materi/rombel/:rombelId
  getByRombel: async (req, res) => {
    try {
      const { rombelId } = req.params;
      const { mapel_id } = req.query;
      let wargaBelajarId = null;

      if (req.user && req.user.role === 'warga_belajar') {
        const wb = await SiswaModel.findByUserId(req.user.id);
        if (wb) wargaBelajarId = wb.id;
      }

      const materi = await MateriModel.findByRombel(
        parseInt(rombelId),
        mapel_id ? parseInt(mapel_id) : null,
        { warga_belajar_id: wargaBelajarId }
      );
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
        path_file: req.file ? toCleanUploadPath(req.file.path) : null,
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
        try {
          const wb = await SiswaModel.findByUserId(req.user.id);
          if (wb) {
            wargaBelajarId = wb.id;
          }
        } catch (wbErr) {
          console.warn('[getByRombel] WB profil lookup warning:', wbErr.message);
        }
      }

      // Hindari NaN jika rombelId berupa string 'undefined' atau 'null'
      const parsedRombelId = !isNaN(parseInt(rombelId)) ? parseInt(rombelId) : null;
      const parsedMapelId = !isNaN(parseInt(mapel_id)) ? parseInt(mapel_id) : null;

      const tugas = await TugasModel.findByRombel(
        parsedRombelId,
        parsedMapelId,
        { warga_belajar_id: wargaBelajarId }
      );
      return res.status(200).json({ success: true, data: tugas });
    } catch (error) {
      console.error('[TugasController.getByRombel]', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar tugas.' });
    }
  },

  // DELETE /api/tugas/:id — Tutor / Admin menghapus tugas
  delete: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID tugas tidak valid.' });
      }
      const affected = await TugasModel.delete(id);
      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, message: 'Tugas berhasil dihapus permanen.' });
    } catch (error) {
      console.error('[TugasController.delete]', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus tugas.' });
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

      // Format deadline aman untuk MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
      let formattedDeadline = deadline;
      if (typeof deadline === 'string') {
        formattedDeadline = deadline.replace('T', ' ').slice(0, 19);
        if (formattedDeadline.length === 16) {
          formattedDeadline += ':00';
        }
      }

      // Format deskripsi dengan metadata tipe_tugas, soal PG / Essay jika ada
      let finalDeskripsi = deskripsi;
      if (tipe_tugas || (soal_pg && soal_pg.length > 0) || (soal_essay && soal_essay.length > 0)) {
        const metadata = {
          tipe: tipe_tugas || 'upload',
          soal_pg: soal_pg || [],
          soal_essay: soal_essay || []
        };
        finalDeskripsi = `${deskripsi}\n\n<!-- PKBM_TASK_META:${JSON.stringify(metadata)} -->`;
      }

      const id = await TugasModel.create({
        rombel_id: parseInt(rombel_id),
        mapel_id: parseInt(mapel_id),
        tutor_id: req.user.id,
        judul: judul.trim(),
        deskripsi: finalDeskripsi,
        deadline: formattedDeadline,
        nilai_maks: nilai_maks || 100,
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
      const tugasId = parseInt(req.params.id, 10);
      if (!tugasId || isNaN(tugasId)) {
        return res.status(400).json({ success: false, message: 'ID tugas tidak valid.' });
      }

      // Validasi keberadaan tugas di database
      const [tugasRows] = await pool.query('SELECT * FROM tugas WHERE id = ? LIMIT 1', [tugasId]);
      if (!tugasRows || tugasRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan di sistem.' });
      }
      const targetTugas = tugasRows[0];

      const { catatan_siswa, jawaban_pg, jawaban_essay, nilai_auto } = req.body;
      if (!req.file && !catatan_siswa && !jawaban_pg && !jawaban_essay) {
        return res.status(400).json({ success: false, message: 'Harap lampirkan berkas jawaban (foto/PDF) atau isi jawaban Anda.' });
      }

      // Ambil profil Warga Belajar dengan fallback otomatis & tahan konkurensi tinggi
      let wb = await SiswaModel.findByUserId(req.user.id);
      if (!wb) {
        try {
          const [wbRows] = await pool.query('SELECT * FROM warga_belajar WHERE user_id = ? LIMIT 1', [req.user.id]);
          if (wbRows && wbRows.length > 0) {
            wb = wbRows[0];
          } else {
            const nisAuto = `WB${new Date().getFullYear().toString().slice(-2)}${String(req.user.id).padStart(4, '0')}`;
            const [ins] = await pool.query(
              'INSERT INTO warga_belajar (user_id, nis, jenjang, tanggal_lahir, jenis_kelamin, status_akademik, rombel_id, is_aktif) VALUES (?, ?, "paket_c", "2000-01-01", "L", "aktif", ?, 1) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
              [req.user.id, nisAuto, req.user.rombel_id || 1]
            );
            wb = { id: ins.insertId || ins.id, user_id: req.user.id, nis: nisAuto };
          }
        } catch (autoWbErr) {
          console.warn('[kumpulkan] Auto WB concurrency fallback:', autoWbErr.message);
          const [retryRows] = await pool.query('SELECT * FROM warga_belajar WHERE user_id = ? LIMIT 1', [req.user.id]);
          if (retryRows && retryRows.length > 0) wb = retryRows[0];
        }
      }

      if (!wb) {
        return res.status(404).json({ success: false, message: 'Profil Warga Belajar tidak ditemukan.' });
      }

      // Evaluasi nilai otomatis di sisi server secara independen dan akurat (tahan manipulasi & konkurensi)
      let calculatedNilai = null;
      let calculatedStatus = 'terkumpul';
      let autoEvaluationSummary = '';

      let taskMeta = null;
      const metaMatch = targetTugas.deskripsi ? targetTugas.deskripsi.match(/<!-- PKBM_TASK_META:(.*?) -->/) : null;
      if (metaMatch) {
        try {
          taskMeta = JSON.parse(metaMatch[1]);
        } catch (e) {
          console.warn('[kumpulkan] Parse task metadata warning:', e.message);
        }
      }

      if (taskMeta && taskMeta.tipe === 'pilihan_ganda' && taskMeta.soal_pg && taskMeta.soal_pg.length > 0) {
        let parsedAnswers = {};
        try {
          parsedAnswers = typeof jawaban_pg === 'string' ? JSON.parse(jawaban_pg) : (jawaban_pg || {});
        } catch {
          parsedAnswers = {};
        }

        let benar = 0;
        const totalSoal = taskMeta.soal_pg.length;
        const breakdown = [];

        taskMeta.soal_pg.forEach((s, idx) => {
          const qId = s.id !== undefined && s.id !== null ? s.id : (idx + 1);
          const rawUser = parsedAnswers[qId] || parsedAnswers[String(qId)] || parsedAnswers[idx + 1] || '';
          const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
          const keyAns = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
          const isBenar = userAns && userAns === keyAns;
          if (isBenar) benar++;

          const userLabel = userAns ? userAns.toUpperCase() : 'Tidak Dijawab';
          const keyLabel = keyAns.toUpperCase();
          breakdown.push(`Nomor ${idx + 1}: [Pilihan: ${userLabel}] - ${isBenar ? 'BENAR' : `SALAH (Kunci: ${keyLabel})`}`);
        });

        const nilaiMaks = targetTugas.nilai_maks ? parseFloat(targetTugas.nilai_maks) : 100;
        calculatedNilai = Math.round((benar / totalSoal) * nilaiMaks);
        calculatedStatus = 'dinilai';

        autoEvaluationSummary = [
          `[HASIL EVALUASI PILIHAN GANDA OTOMATIS]`,
          `Nilai: ${calculatedNilai} / ${nilaiMaks} (${benar} dari ${totalSoal} Soal Benar)`,
          `Detail Jawaban:\n${breakdown.join('\n')}`
        ].join('\n\n');
      } else if (nilai_auto !== undefined && nilai_auto !== null && nilai_auto !== '') {
        calculatedNilai = parseFloat(nilai_auto);
        calculatedStatus = 'dinilai';
      }

      let finalCatatan = catatan_siswa ? catatan_siswa.trim() : '';
      if (jawaban_essay && !finalCatatan.includes('[Jawaban Essay]')) {
        finalCatatan = (finalCatatan ? finalCatatan + '\n\n' : '') + `[Jawaban Essay]:\n${jawaban_essay}`;
      }
      if (jawaban_pg && !finalCatatan.includes('[Jawaban Pilihan Ganda]')) {
        finalCatatan = (finalCatatan ? finalCatatan + '\n\n' : '') + `[Jawaban Pilihan Ganda]:\n${typeof jawaban_pg === 'object' ? JSON.stringify(jawaban_pg) : jawaban_pg}`;
      }
      if (autoEvaluationSummary && !finalCatatan.includes('[HASIL EVALUASI PILIHAN GANDA OTOMATIS]')) {
        finalCatatan = (finalCatatan ? finalCatatan + '\n\n' : '') + autoEvaluationSummary;
      }

      const filePath = req.file ? toCleanUploadPath(req.file.path) : 'text_submission';
      const fileName = req.file ? req.file.originalname : (jawaban_pg ? 'Jawaban Pilihan Ganda Online' : 'Jawaban Online');

      // Simpan ke database dengan atomic ON DUPLICATE KEY UPDATE
      await TugasModel.kumpulkanTugas({
        tugas_id: tugasId,
        warga_belajar_id: wb.id,
        path_file: filePath,
        nama_file: fileName,
        catatan_siswa: finalCatatan || null,
        nilai: calculatedNilai,
        status: calculatedStatus,
      });

      const pengumpulan = await TugasModel.findPengumpulanByTugasDanWb(tugasId, wb.id);

      return res.status(200).json({
        success: true,
        message: calculatedNilai !== null ? `Tugas berhasil dikumpulkan dan dinilai otomatis: ${calculatedNilai} poin.` : 'Tugas berhasil dikumpulkan.',
        data: pengumpulan || {
          tugas_id: tugasId,
          warga_belajar_id: wb.id,
          nilai: calculatedNilai,
          status: calculatedStatus,
          catatan_siswa: finalCatatan,
          nama_file: fileName,
          submitted_at: new Date().toISOString()
        },
      });
    } catch (error) {
      console.error('[TugasController.kumpulkan]', error);
      return res.status(500).json({
        success: false,
        message: error.message ? `Gagal mengumpulkan tugas: ${error.message}` : 'Gagal mengumpulkan tugas. Server sibuk, silakan coba sesaat lagi.'
      });
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
