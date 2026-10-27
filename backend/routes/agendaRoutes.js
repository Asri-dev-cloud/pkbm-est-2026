// ============================================================
// routes/agendaRoutes.js
// Rute untuk Agenda & Kalender Kegiatan PKBM
// ============================================================

import { Router } from 'express';
import AgendaController from '../controllers/AgendaController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();

// Semua rute agenda memerlukan otentikasi login
router.use(verifyToken);

// GET: Bisa dilihat oleh semua role yang login (Admin, Super Admin, Tutor, Pimpinan, Siswa)
router.get('/', AgendaController.getAll);
router.get('/:id', AgendaController.getById);

// POST, PUT, DELETE: Khusus Admin dan Super Admin
router.post(
  '/',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  AgendaController.create
);

router.put(
  '/:id',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  AgendaController.update
);

router.delete(
  '/:id',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  AgendaController.delete
);

export default router;
