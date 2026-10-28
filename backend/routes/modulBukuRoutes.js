// ============================================================
// routes/modulBukuRoutes.js
// Endpoint untuk Modul Pembelajaran & Integrasi Buku Kemendikdasmen
// Publik & Warga Belajar: Read-Only
// Admin & Super Admin: Upload, Edit, Hapus Modul
// ============================================================

import { Router } from 'express';
import ModulBukuController from '../controllers/ModulBukuController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// Middleware set folder upload ke 'uploads/modul/'
const setModulFolder = (req, res, next) => {
  req.uploadFolder = 'modul';
  next();
};

// ── ENDPOINT READ-ONLY (Siswa, Admin & Publik) ─────────────────
// GET /api/modul-buku — Daftar modul terbit
router.get('/', ModulBukuController.getPublished);

// ── ENDPOINT KHUSUS ADMIN (Sebelum /:id) ───────────────────────
// GET /api/modul-buku/stats — Ringkasan statistik
router.get(
  '/stats',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  ModulBukuController.getStats
);

// GET /api/modul-buku/admin — Daftar seluruh modul untuk CMS Admin
router.get(
  '/admin',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  ModulBukuController.getAllAdmin
);

// ── ENDPOINT DETAIL (Bisa diakses Siswa & Admin) ───────────────
// GET /api/modul-buku/:id — Detail modul & increment baca
router.get('/:id', ModulBukuController.getDetail);

// ── ENDPOINT MUTASI ADMIN (Upload, Update, Hapus) ──────────────
// POST /api/modul-buku — Upload modul baru oleh Admin
router.post(
  '/',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  setModulFolder,
  upload.single('file'),
  ModulBukuController.create
);

// PUT /api/modul-buku/:id — Perbarui info modul / ganti file oleh Admin
router.put(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  setModulFolder,
  upload.single('file'),
  ModulBukuController.update
);

// DELETE /api/modul-buku/:id — Hapus modul oleh Admin
router.delete(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  ModulBukuController.delete
);

export default router;

