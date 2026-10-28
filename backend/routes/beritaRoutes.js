// ============================================================
// routes/beritaRoutes.js
// Endpoint untuk Berita & Dokumentasi Kegiatan PKBM Bina Mandiri
// Mendukung upload Gambar Sampul, Galeri Foto (Multiple), dan Video File.
// Publik / Siswa: Read-Only (hanya status published)
// Admin / Super Admin: Full CRUD + Upload Media
// ============================================================

import { Router } from 'express';
import BeritaController from '../controllers/BeritaController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// Middleware konfigurasi subfolder upload ke 'uploads/berita/'
const setBeritaFolder = (req, res, next) => {
  req.uploadFolder = 'berita';
  next();
};

// Konfigurasi field upload: Sampul (1), Galeri (12), Video File (1)
const uploadBeritaMedia = upload.fields([
  { name: 'gambar_sampul', maxCount: 1 },
  { name: 'galeri_foto', maxCount: 12 },
  { name: 'video_file', maxCount: 1 },
]);

// ── ENDPOINT PUBLIK / SISWA (Read-Only) ────────────────────────
// GET /api/berita — Daftar berita berstatus published
router.get('/', BeritaController.getPublished);

// ── ENDPOINT ADMIN KHUSUS (Ditaruh sebelum /:id agar tidak tertabrak) ─
// GET /api/berita/admin — Daftar semua berita termasuk draft & archived
router.get(
  '/admin',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  BeritaController.getAllAdmin
);

// GET /api/berita/stats — Statistik ringkasan berita & media
router.get(
  '/stats',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  BeritaController.getStats
);

// ── ENDPOINT DETAIL BERITA (Publik / Siswa / Admin) ───────────
// GET /api/berita/:id — Detail berita berdasarkan ID atau Slug
router.get('/:id', BeritaController.getDetail);

// ── ENDPOINT MUTASI ADMIN (CRUD + Upload) ─────────────────────
// POST /api/berita — Tambah berita kegiatan baru beserta foto/video
router.post(
  '/',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  setBeritaFolder,
  uploadBeritaMedia,
  BeritaController.create
);

// PUT /api/berita/:id — Update berita kegiatan (teks & file)
router.put(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  setBeritaFolder,
  uploadBeritaMedia,
  BeritaController.update
);

// DELETE /api/berita/:id — Hapus berita kegiatan beserta file di server
router.delete(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  BeritaController.delete
);

export default router;

