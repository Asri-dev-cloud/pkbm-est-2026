// ============================================================
// routes/pertemuanRoutes.js
// Endpoint untuk mengelola modul Pertemuan Terpadu (LMS-Style).
// ============================================================

import { Router } from 'express';
import PertemuanController from '../controllers/PertemuanController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua endpoint membutuhkan autentikasi
router.use(verifyToken);

// -----------------------------------------------------------
// PERTEMUAN BELAJAR (MEETINGS)
// -----------------------------------------------------------

// GET /api/pertemuan — Daftar semua pertemuan (rombel & mapel)
router.get(
  '/',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.getAll
);

// GET /api/pertemuan/:id — Detail terintegrasi pertemuan (materi, tugas, absensi, komentar)
router.get(
  '/:id',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.getDetail
);

// POST /api/pertemuan — Tutor / Admin buat pertemuan baru
router.post(
  '/',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.create
);

// PUT /api/pertemuan/:id — Edit pertemuan
router.put(
  '/:id',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.update
);

// PUT /api/pertemuan/:id/publish — Toggle visibilitas (publish/draft)
router.put(
  '/:id/publish',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.togglePublish
);

// DELETE /api/pertemuan/:id — Hapus pertemuan
router.delete(
  '/:id',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.delete
);

// -----------------------------------------------------------
// FORUM DISKUSI PERTEMUAN (COMMENTS)
// -----------------------------------------------------------

// POST /api/pertemuan/:id/komentar — Tambahkan komentar diskusi
router.post(
  '/:id/komentar',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.addComment
);

// DELETE /api/pertemuan/komentar/:commentId — Hapus komentar diskusi
router.delete(
  '/komentar/:commentId',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PertemuanController.deleteComment
);

export default router;
