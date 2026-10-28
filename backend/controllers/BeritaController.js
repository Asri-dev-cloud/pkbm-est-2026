// ============================================================
// controllers/BeritaController.js
// Controller Berita & Dokumentasi Kegiatan PKBM Bina Mandiri
// Menyediakan endpoint CRUD Admin & Endpoint Read-Only Siswa
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BeritaModel from '../models/BeritaModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');

// Helper hapus file di disk jika berita dihapus
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

// Helper normalisasi galeri foto (bisa string JSON atau array)
const parseGaleri = (galeri) => {
  if (!galeri) return [];
  if (Array.isArray(galeri)) return galeri;
  try {
    return JSON.parse(galeri);
  } catch {
    return [];
  }
};

const BeritaController = {
  // ── 1. AMBIL BERITA PUBLIK / SISWA (Read-Only) ───────────────
  getPublished: async (req, res) => {
    try {
      const { search, kategori, limit = 40, offset = 0 } = req.query;
      const rows = await BeritaModel.findPublished({
        search,
        kategori,
        limit: Number(limit) || 40,
        offset: Number(offset) || 0,
      });

      const formatted = rows.map((item) => ({
        ...item,
        galeri_foto: parseGaleri(item.galeri_foto),
      }));

      return res.json({
        success: true,
        message: 'Daftar berita kegiatan berhasil dimuat.',
        data: formatted,
      });
    } catch (err) {
      console.error('[BeritaController.getPublished] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data berita kegiatan.',
        error: err.message,
      });
    }
  },

  // ── 2. AMBIL BERITA ADMIN (Semua Status + Filter Lengkap) ────
  getAllAdmin: async (req, res) => {
    try {
      const { search, kategori, status, limit = 100, offset = 0 } = req.query;
      const rows = await BeritaModel.findAllAdmin({
        search,
        kategori,
        status,
        limit: Number(limit) || 100,
        offset: Number(offset) || 0,
      });

      const stats = await BeritaModel.getStats();

      const formatted = rows.map((item) => ({
        ...item,
        galeri_foto: parseGaleri(item.galeri_foto),
      }));

      return res.json({
        success: true,
        message: 'Daftar berita kegiatan admin berhasil dimuat.',
        data: formatted,
        stats,
      });
    } catch (err) {
      console.error('[BeritaController.getAllAdmin] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data berita kegiatan admin.',
        error: err.message,
      });
    }
  },

  // ── 3. DETAIL BERITA (ID atau SLUG) ──────────────────────────
  getDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await BeritaModel.findByIdOrSlug(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Berita kegiatan tidak ditemukan.',
        });
      }

      // Tambah jumlah view pembaca
      await BeritaModel.incrementViews(item.id);

      return res.json({
        success: true,
        message: 'Detail berita kegiatan berhasil dimuat.',
        data: {
          ...item,
          galeri_foto: parseGaleri(item.galeri_foto),
        },
      });
    } catch (err) {
      console.error('[BeritaController.getDetail] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat detail berita kegiatan.',
        error: err.message,
      });
    }
  },

  // ── 4. BUAT BERITA BARU (ADMIN) ─────────────────────────────
  create: async (req, res) => {
    try {
      const {
        judul,
        ringkasan,
        konten,
        kategori = 'Kegiatan PKBM',
        tanggal_kegiatan,
        lokasi = '',
        video_url = '',
        status = 'published',
        is_pinned = 0,
        penulis = 'Admin PKBM',
      } = req.body;

      if (!judul || !konten) {
        return res.status(400).json({
          success: false,
          message: 'Judul dan isi konten berita wajib diisi.',
        });
      }

      // Handle file uploads dari multer
      const files = req.files || {};
      const gambar_sampul = files['gambar_sampul']?.[0]?.path || null;
      const video_file = files['video_file']?.[0]?.path || null;
      const galeri_foto = (files['galeri_foto'] || []).map((f) => f.path);

      const created_by = req.user?.id || null;

      const newId = await BeritaModel.create({
        judul,
        ringkasan,
        konten,
        kategori,
        tanggal_kegiatan: tanggal_kegiatan || new Date(),
        lokasi,
        gambar_sampul,
        galeri_foto,
        video_url,
        video_file,
        status: status || 'published',
        is_pinned: is_pinned === '1' || is_pinned === true || is_pinned === 1 ? 1 : 0,
        penulis: penulis || req.user?.nama_lengkap || req.user?.nama || 'Admin PKBM',
        created_by,
      });

      const created = await BeritaModel.findByIdOrSlug(newId);

      return res.status(201).json({
        success: true,
        message: 'Berita kegiatan berhasil diterbitkan dan tersimpan.',
        data: {
          ...created,
          galeri_foto: parseGaleri(created.galeri_foto),
        },
      });
    } catch (err) {
      console.error('[BeritaController.create] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat berita kegiatan.',
        error: err.message,
      });
    }
  },

  // ── 5. PERBARUI BERITA (ADMIN) ──────────────────────────────
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await BeritaModel.findByIdOrSlug(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Berita kegiatan tidak ditemukan.',
        });
      }

      const {
        judul,
        ringkasan,
        konten,
        kategori,
        tanggal_kegiatan,
        lokasi,
        video_url,
        status,
        is_pinned,
        penulis,
        hapus_sampul,
        hapus_video,
        existing_galeri, // JSON string array foto lama yang dipertahankan
      } = req.body;

      const files = req.files || {};

      // Sampul: Jika ada upload baru, pakai yang baru & hapus yang lama
      let gambar_sampul = existing.gambar_sampul;
      if (files['gambar_sampul']?.[0]?.path) {
        if (existing.gambar_sampul) safeUnlink(existing.gambar_sampul);
        gambar_sampul = files['gambar_sampul'][0].path;
      } else if (hapus_sampul === '1' || hapus_sampul === 'true') {
        if (existing.gambar_sampul) safeUnlink(existing.gambar_sampul);
        gambar_sampul = null;
      }

      // Video File: Jika ada upload baru, ganti
      let video_file = existing.video_file;
      if (files['video_file']?.[0]?.path) {
        if (existing.video_file) safeUnlink(existing.video_file);
        video_file = files['video_file'][0].path;
      } else if (hapus_video === '1' || hapus_video === 'true') {
        if (existing.video_file) safeUnlink(existing.video_file);
        video_file = null;
      }

      // Galeri: Gabungkan foto lama yang masih disimpan dengan upload baru
      let keptGaleri = [];
      if (existing_galeri) {
        try {
          keptGaleri = typeof existing_galeri === 'string' ? JSON.parse(existing_galeri) : existing_galeri;
        } catch {
          keptGaleri = parseGaleri(existing.galeri_foto);
        }
      } else {
        keptGaleri = parseGaleri(existing.galeri_foto);
      }

      const newGaleriFiles = (files['galeri_foto'] || []).map((f) => f.path);
      const combinedGaleri = [...keptGaleri, ...newGaleriFiles];

      const updated = await BeritaModel.update(id, {
        judul: judul ?? existing.judul,
        ringkasan: ringkasan ?? existing.ringkasan,
        konten: konten ?? existing.konten,
        kategori: kategori ?? existing.kategori,
        tanggal_kegiatan: tanggal_kegiatan ?? existing.tanggal_kegiatan,
        lokasi: lokasi ?? existing.lokasi,
        gambar_sampul,
        galeri_foto: combinedGaleri,
        video_url: video_url !== undefined ? video_url : existing.video_url,
        video_file,
        status: status ?? existing.status,
        is_pinned: is_pinned !== undefined ? (is_pinned === '1' || is_pinned === true || is_pinned === 1 ? 1 : 0) : existing.is_pinned,
        penulis: penulis ?? existing.penulis,
      });

      return res.json({
        success: true,
        message: 'Berita kegiatan berhasil diperbarui.',
        data: {
          ...updated,
          galeri_foto: parseGaleri(updated.galeri_foto),
        },
      });
    } catch (err) {
      console.error('[BeritaController.update] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui berita kegiatan.',
        error: err.message,
      });
    }
  },

  // ── 6. HAPUS BERITA (ADMIN) ─────────────────────────────────
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await BeritaModel.findByIdOrSlug(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Berita kegiatan tidak ditemukan.',
        });
      }

      // Hapus file fisik dari server
      if (existing.gambar_sampul) safeUnlink(existing.gambar_sampul);
      if (existing.video_file) safeUnlink(existing.video_file);
      const galeri = parseGaleri(existing.galeri_foto);
      galeri.forEach((f) => safeUnlink(f));

      await BeritaModel.delete(id);

      return res.json({
        success: true,
        message: 'Berita kegiatan beserta seluruh dokumentasinya berhasil dihapus.',
      });
    } catch (err) {
      console.error('[BeritaController.delete] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus berita kegiatan.',
        error: err.message,
      });
    }
  },

  // ── 7. STATISTIK METRIK BERITA ──────────────────────────────
  getStats: async (req, res) => {
    try {
      const stats = await BeritaModel.getStats();
      return res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      console.error('[BeritaController.getStats] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat statistik berita kegiatan.',
        error: err.message,
      });
    }
  },
};

export default BeritaController;

