// ============================================================
// controllers/ModulBukuController.js
// Controller untuk Modul Ajar PKBM & Integrasi Buku Kemendikdasmen
// Mengatur upload berkas modul (PDF/DOCX) oleh Admin,
// serta pembacaan modul & eksplorasi buku oleh Siswa.
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ModulBukuModel from '../models/ModulBukuModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');

// Helper hapus file di disk jika modul dihapus / diperbarui
const safeUnlink = (relativePath) => {
  if (!relativePath) return;
  try {
    const fullPath = path.resolve(backendRootDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn(`[safeUnlink] Gagal menghapus file: ${relativePath}`, err.message);
  }
};

const ModulBukuController = {
  // ── 1. UNTUK SISWA & PUBLIK (Read-Only) ───────────────────────
  // GET /api/modul-buku — Daftar modul terbit
  getPublished: async (req, res) => {
    try {
      const { search, kategori, mapel, tipe, limit = 50, offset = 0 } = req.query;
      const rows = await ModulBukuModel.findPublished({
        search,
        kategori,
        mapel,
        tipe,
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
      });

      const total = await ModulBukuModel.countPublished({ search, kategori, tipe });

      return res.json({
        success: true,
        message: 'Daftar modul & buku berhasil dimuat.',
        data: rows,
        total,
      });
    } catch (err) {
      console.error('Error ModulBukuController.getPublished:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat modul dan buku.',
        error: err.message,
      });
    }
  },

  // GET /api/modul-buku/:id — Detail modul (bisa increment total baca)
  getDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const { increment } = req.query;

      const item = await ModulBukuModel.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Modul atau buku tidak ditemukan.',
        });
      }

      if (increment === '1' || increment === 'true') {
        await ModulBukuModel.incrementDibaca(id);
        item.total_dibaca = (item.total_dibaca || 0) + 1;
      }

      return res.json({
        success: true,
        message: 'Detail modul berhasil dimuat.',
        data: item,
      });
    } catch (err) {
      console.error('Error ModulBukuController.getDetail:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat detail modul.',
        error: err.message,
      });
    }
  },

  // ── 2. UNTUK ADMIN (Kelola & Upload) ─────────────────────────
  // GET /api/modul-buku/admin — Semua modul untuk admin CMS
  getAllAdmin: async (req, res) => {
    try {
      const { search, kategori, tipe, limit = 100, offset = 0 } = req.query;
      const rows = await ModulBukuModel.findAllAdmin({
        search,
        kategori,
        tipe,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
      });

      return res.json({
        success: true,
        message: 'Daftar seluruh modul & buku berhasil dimuat.',
        data: rows,
      });
    } catch (err) {
      console.error('Error ModulBukuController.getAllAdmin:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat data modul admin.',
        error: err.message,
      });
    }
  },

  // GET /api/modul-buku/stats — Statistik modul
  getStats: async (req, res) => {
    try {
      const stats = await ModulBukuModel.getStats();
      return res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      console.error('Error ModulBukuController.getStats:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat statistik modul.',
        error: err.message,
      });
    }
  },

  // POST /api/modul-buku — Upload & buat modul baru oleh Admin
  create: async (req, res) => {
    try {
      const {
        judul,
        deskripsi,
        kategori,
        mapel,
        tipe = 'modul_upload',
        url_eksternal,
        penulis,
        semester,
        tahun_ajaran,
        is_published,
      } = req.body;

      if (!judul || !judul.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Judul modul atau buku wajib diisi.',
        });
      }

      // Ambil berkas file yang diunggah
      let filePath = null;
      let fileNamaAsli = null;
      let fileSize = 0;
      let fileType = 'pdf';

      if (req.file) {
        filePath = `uploads/modul/${req.file.filename}`;
        fileNamaAsli = req.file.originalname;
        fileSize = req.file.size;
        fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'pdf';
      }

      // Default URL jika tipe buku Kemendikdasmen
      let finalUrlEksternal = url_eksternal?.trim() || null;
      if (tipe === 'buku_kemendikdasmen' && !finalUrlEksternal) {
        finalUrlEksternal = 'https://buku.kemendikdasmen.go.id/';
      }

      const insertId = await ModulBukuModel.create({
        judul: judul.trim(),
        deskripsi: deskripsi?.trim() || null,
        kategori: kategori || 'Semua Jenjang',
        mapel: mapel?.trim() || null,
        tipe,
        file_path: filePath,
        file_nama_asli: fileNamaAsli,
        file_size: fileSize,
        file_type: fileType,
        cover_image: null,
        url_eksternal: finalUrlEksternal,
        penulis: penulis?.trim() || 'PKBM Bina Mandiri',
        semester: semester || 'Semua Semester',
        tahun_ajaran: tahun_ajaran || '2025/2026',
        is_published: is_published !== undefined ? Number(is_published) : 1,
        created_by: req.user?.id || null,
      });

      const newModul = await ModulBukuModel.findById(insertId);

      return res.status(201).json({
        success: true,
        message: 'Modul / Buku berhasil ditambahkan!',
        data: newModul,
      });
    } catch (err) {
      console.error('Error ModulBukuController.create:', err);
      // Bersihkan file jika proses gagal
      if (req.file) {
        safeUnlink(`uploads/modul/${req.file.filename}`);
      }
      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan modul.',
        error: err.message,
      });
    }
  },

  // PUT /api/modul-buku/:id — Update modul oleh Admin
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await ModulBukuModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Modul tidak ditemukan.',
        });
      }

      const {
        judul,
        deskripsi,
        kategori,
        mapel,
        tipe,
        url_eksternal,
        penulis,
        semester,
        tahun_ajaran,
        is_published,
      } = req.body;

      const updateData = {};
      if (judul !== undefined) updateData.judul = judul.trim();
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi?.trim() || null;
      if (kategori !== undefined) updateData.kategori = kategori;
      if (mapel !== undefined) updateData.mapel = mapel?.trim() || null;
      if (tipe !== undefined) updateData.tipe = tipe;
      if (url_eksternal !== undefined) updateData.url_eksternal = url_eksternal?.trim() || null;
      if (penulis !== undefined) updateData.penulis = penulis?.trim() || null;
      if (semester !== undefined) updateData.semester = semester;
      if (tahun_ajaran !== undefined) updateData.tahun_ajaran = tahun_ajaran;
      if (is_published !== undefined) updateData.is_published = Number(is_published);

      // Jika ada file baru yang diunggah
      if (req.file) {
        // Hapus file lama jika ada
        if (existing.file_path) {
          safeUnlink(existing.file_path);
        }
        updateData.file_path = `uploads/modul/${req.file.filename}`;
        updateData.file_nama_asli = req.file.originalname;
        updateData.file_size = req.file.size;
        updateData.file_type = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'pdf';
      }

      await ModulBukuModel.update(id, updateData);
      const updated = await ModulBukuModel.findById(id);

      return res.json({
        success: true,
        message: 'Modul berhasil diperbarui!',
        data: updated,
      });
    } catch (err) {
      console.error('Error ModulBukuController.update:', err);
      if (req.file) {
        safeUnlink(`uploads/modul/${req.file.filename}`);
      }
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui modul.',
        error: err.message,
      });
    }
  },

  // DELETE /api/modul-buku/:id — Hapus modul oleh Admin
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await ModulBukuModel.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Modul tidak ditemukan.',
        });
      }

      // Hapus file fisik jika ada
      if (existing.file_path) {
        safeUnlink(existing.file_path);
      }

      await ModulBukuModel.delete(id);

      return res.json({
        success: true,
        message: 'Modul berhasil dihapus.',
      });
    } catch (err) {
      console.error('Error ModulBukuController.delete:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus modul.',
        error: err.message,
      });
    }
  },
};

export default ModulBukuController;

