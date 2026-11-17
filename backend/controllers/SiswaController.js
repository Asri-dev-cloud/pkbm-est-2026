// ============================================================
// controllers/SiswaController.js
// Menangani semua request yang berhubungan dengan Warga Belajar.
// Controller HANYA bertugas: terima request → panggil model → kirim response.
// Logika bisnis ada di model, validasi ada di middleware.
// ============================================================

import SiswaModel from '../models/SiswaModel.js';
import pool from '../config/db.js';
import { buildKartuPelajarPdf } from '../utils/kartuPelajarPdf.js';

const SiswaController = {

  // -----------------------------------------------------------
  // GET /api/siswa
  // Ambil semua Warga Belajar
  // Query params opsional: ?jenjang=paket_a&is_aktif=1
  // Akses: Admin, Tutor, Super Admin
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      // Ambil filter dari query string (opsional)
      const { jenjang, is_aktif } = req.query;

      const filter = {
        jenjang: jenjang || null,
        // Konversi string '1'/'0' ke boolean/number
        is_aktif: is_aktif !== undefined ? parseInt(is_aktif) : null,
      };

      const siswaList = await SiswaModel.findAll(filter);

      return res.status(200).json({
        success: true,
        message: `${siswaList.length} data warga belajar ditemukan.`,
        data: siswaList,
      });

    } catch (error) {
      console.error('[SiswaController.getAll] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/:id
  // Ambil detail satu Warga Belajar berdasarkan ID
  // Akses: Admin, Tutor, Super Admin, dan WB itu sendiri
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Validasi ID harus angka
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID tidak valid.',
        });
      }

      const siswa = await SiswaModel.findById(parseInt(id));

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: `Warga belajar dengan ID ${id} tidak ditemukan.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: siswa,
      });

    } catch (error) {
      console.error('[SiswaController.getById] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/profil/saya
  // WB melihat profilnya sendiri (berdasarkan token JWT)
  // Akses: Warga Belajar
  // -----------------------------------------------------------
  getProfilSaya: async (req, res) => {
    try {
      // req.user.id diisi oleh middleware verifyToken
      const siswa = await SiswaModel.findByUserId(req.user.id);

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Profil warga belajar tidak ditemukan.',
        });
      }

      return res.status(200).json({
        success: true,
        data: siswa,
      });

    } catch (error) {
      console.error('[SiswaController.getProfilSaya] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil profil.',
      });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/siswa/:id
  // Update data Warga Belajar (alamat, wali, no telp, rombel, npsn, nisn)
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        alamat,
        jarak_rumah_km,
        tinggi_badan,
        berat_badan,
        jumlah_saudara_kandung,
        nama_ayah,
        nama_ibu,
        nama_wali,
        no_telp,
        rombel_id,
        npsn,
        nisn,
        nik,
      } = req.body;

      // Pastikan data siswa ada di database
      const existing = await SiswaModel.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Warga belajar dengan ID ${id} tidak ditemukan.`,
        });
      }

      await SiswaModel.update(parseInt(id), {
        alamat,
        jarak_rumah_km: jarak_rumah_km !== undefined && jarak_rumah_km !== '' && jarak_rumah_km !== null ? parseFloat(jarak_rumah_km) : null,
        tinggi_badan: tinggi_badan !== undefined && tinggi_badan !== '' && tinggi_badan !== null ? parseInt(tinggi_badan, 10) : null,
        berat_badan: berat_badan !== undefined && berat_badan !== '' && berat_badan !== null ? parseFloat(berat_badan) : null,
        jumlah_saudara_kandung: jumlah_saudara_kandung !== undefined && jumlah_saudara_kandung !== '' && jumlah_saudara_kandung !== null ? parseInt(jumlah_saudara_kandung, 10) : null,
        nama_ayah: nama_ayah !== undefined ? (nama_ayah ? String(nama_ayah).trim() : null) : undefined,
        nama_ibu: nama_ibu !== undefined ? (nama_ibu ? String(nama_ibu).trim() : null) : undefined,
        nama_wali,
        no_telp,
        rombel_id,
        npsn: npsn !== undefined ? (npsn ? String(npsn).trim() : null) : undefined,
        nisn: nisn !== undefined ? (nisn ? String(nisn).trim() : null) : undefined,
        nik: nik !== undefined ? (nik ? String(nik).trim() : null) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'Data warga belajar berhasil diperbarui.',
      });

    } catch (error) {
      console.error('[SiswaController.update] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data warga belajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/statistik/per-jenjang
  // Rekap jumlah WB per jenjang (untuk Dashboard Pimpinan)
  // Akses: Pimpinan, Admin, Super Admin
  // -----------------------------------------------------------
  getStatistikPerJenjang: async (req, res) => {
    try {
      const statistik = await SiswaModel.countByJenjang();

      return res.status(200).json({
        success: true,
        data: statistik,
      });

    } catch (error) {
      console.error('[SiswaController.getStatistikPerJenjang] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/rombel/options
  // Ambil daftar rombel aktif untuk dropdown penempatan SPMB
  // Akses: Admin, Super Admin
  // -----------------------------------------------------------
  getRombelOptions: async (req, res) => {
    try {
      const { jenjang } = req.query;
      const rombel = await SiswaModel.getRombelOptions({ jenjang: jenjang || null });

      return res.status(200).json({
        success: true,
        data: rombel,
      });
    } catch (error) {
      console.error('[SiswaController.getRombelOptions] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar rombel.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/mapel/options
  // Ambil daftar mata pelajaran untuk dropdown form tutor/admin
  // Akses: Admin, Super Admin, Tutor
  // -----------------------------------------------------------
  getMapelOptions: async (req, res) => {
    try {
      const { jenjang, rombel_id } = req.query;
      const mapel = await SiswaModel.getMapelOptions({
        jenjang: jenjang || null,
        rombel_id: rombel_id ? parseInt(rombel_id) : null,
      });

      return res.status(200).json({
        success: true,
        data: mapel,
      });
    } catch (error) {
      console.error('[SiswaController.getMapelOptions] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar mata pelajaran.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/kartu/verifikasi/:nis [PUBLIK — Tanpa Login]
  // Memvalidasi keaslian Kartu Pelajar Digital saat QR Code di-scan
  // -----------------------------------------------------------
  verifikasiKartuPublik: async (req, res) => {
    try {
      const nisParam = req.params.nis || req.query.nis;
      if (!nisParam || !String(nisParam).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nomor Induk Siswa (NIS) wajib disertakan.',
        });
      }

      const siswa = await SiswaModel.findByNis(String(nisParam).trim());
      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: `Warga Belajar dengan NIS "${nisParam}" tidak ditemukan di database resmi PKBM Bina Mandiri.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Kartu Pelajar Warga Belajar terverifikasi resmi oleh PKBM Bina Mandiri.',
        data: {
          id: siswa.id,
          nis: siswa.nis,
          nik: siswa.nik ? siswa.nik.replace(/(.{4})(.*)(.{4})/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c) : null,
          nama_lengkap: siswa.nama_lengkap,
          jenjang: siswa.jenjang,
          nama_rombel: siswa.nama_rombel || 'Dalam Penetapan Rombel',
          nama_tahun_ajaran: siswa.nama_tahun_ajaran || '2026/2027',
          jenis_kelamin: siswa.jenis_kelamin,
          tanggal_lahir: siswa.tanggal_lahir,
          alamat: siswa.alamat,
          is_aktif: siswa.is_aktif === 1,
          foto_profil: siswa.foto_profil || null,
          terdaftar_sejak: siswa.created_at,
          lembaga: 'PKBM Bina Mandiri',
          npsn: siswa.npsn || 'P9962854',
          nisn: siswa.nisn || null,
          status_kartu: siswa.is_aktif === 1 ? 'AKTIF & RESMI' : 'NONAKTIF / ALUMNI',
        },
      });
    } catch (error) {
      console.error('[SiswaController.verifikasiKartuPublik] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memverifikasi kartu pelajar.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/siswa/kartu-pelajar-pdf
  // GET /api/siswa/:id/kartu-pelajar-pdf
  // Download file PDF resmi Kartu Pelajar Digital siap cetak A4
  // Akses: Warga Belajar (profil sendiri), Admin, Tutor, Super Admin
  // -----------------------------------------------------------
  downloadKartuPelajarPdf: async (req, res) => {
    try {
      let siswa = null;
      const targetId = req.params.id;

      if (targetId && !isNaN(targetId)) {
        const parsedId = parseInt(targetId, 10);
        if (req.user.role === 'warga_belajar') {
          const myProfile = await SiswaModel.findByUserId(req.user.id);
          if (!myProfile || myProfile.id !== parsedId) {
            return res.status(403).json({
              success: false,
              message: 'Anda tidak memiliki hak akses untuk mengunduh kartu siswa lain.',
            });
          }
          siswa = myProfile;
        } else {
          siswa = await SiswaModel.findById(parsedId);
        }
      } else {
        if (req.user.role === 'warga_belajar') {
          siswa = await SiswaModel.findByUserId(req.user.id);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Parameter ID siswa wajib disertakan untuk admin.',
          });
        }
      }

      if (!siswa) {
        return res.status(404).json({
          success: false,
          message: 'Data Warga Belajar tidak ditemukan.',
        });
      }

      const pdfBuffer = await buildKartuPelajarPdf({ siswa });
      const safeNis = (siswa.nis || `ID-${siswa.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Kartu_Pelajar_${safeNis}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.end(pdfBuffer);
    } catch (error) {
      console.error('[SiswaController.downloadKartuPelajarPdf] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghasilkan dokumen Kartu Pelajar PDF.',
      });
    }
  },

  // -----------------------------------------------------------
  // POST /api/siswa/:id/foto
  // Upload/Perbarui Pas Foto Siswa (Admin & Super Admin)
  // Otomatis sinkron ke tabel users & berkas_spmb
  // -----------------------------------------------------------
  uploadFoto: async (req, res) => {
    try {
      const targetId = req.params.id;
      if (!targetId || isNaN(targetId)) {
        return res.status(400).json({ success: false, message: 'ID siswa tidak valid.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File pas foto wajib diunggah.' });
      }

      const cleanPath = req.file.path.replace(/\\/g, '/');

      // Ambil user_id dari warga_belajar
      const [wbRows] = await pool.execute(
        `SELECT wb.id, wb.user_id, wb.nik, u.email, u.nama_lengkap 
         FROM warga_belajar wb 
         JOIN users u ON wb.user_id = u.id 
         WHERE wb.id = ? LIMIT 1`,
        [targetId]
      );

      if (wbRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
      }

      const wb = wbRows[0];

      // Update foto_profil di tabel users
      await pool.execute(
        `UPDATE users SET foto_profil = ?, updated_at = NOW() WHERE id = ?`,
        [cleanPath, wb.user_id]
      );

      // Cek apakah ada record di pendaftar_spmb
      const [psRows] = await pool.execute(
        `SELECT id FROM pendaftar_spmb 
         WHERE warga_belajar_id = ? OR email = ? OR (nik IS NOT NULL AND nik = ?) 
         LIMIT 1`,
        [wb.id, wb.email, wb.nik]
      );

      if (psRows.length > 0) {
        const pendaftarId = psRows[0].id;
        const [existingBerkas] = await pool.execute(
          `SELECT id FROM berkas_spmb WHERE pendaftar_id = ? AND jenis_berkas IN ('foto', 'pas_foto') LIMIT 1`,
          [pendaftarId]
        );
        if (existingBerkas.length > 0) {
          await pool.execute(
            `UPDATE berkas_spmb SET path_file = ?, nama_file = ?, status_verifikasi = 'valid', updated_at = NOW() WHERE id = ?`,
            [cleanPath, req.file.originalname, existingBerkas[0].id]
          );
        } else {
          await pool.execute(
            `INSERT INTO berkas_spmb (pendaftar_id, jenis_berkas, nama_file, path_file, status_verifikasi, created_at)
             VALUES (?, 'foto', ?, ?, 'valid', NOW())`,
            [pendaftarId, req.file.originalname, cleanPath]
          );
        }
      }

      const updatedSiswa = await SiswaModel.findById(targetId);

      return res.status(200).json({
        success: true,
        message: 'Pas foto siswa berhasil disimpan ke database.',
        data: updatedSiswa,
      });
    } catch (error) {
      console.error('[SiswaController.uploadFoto] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengupload pas foto siswa.' });
    }
  },
};

export default SiswaController;
