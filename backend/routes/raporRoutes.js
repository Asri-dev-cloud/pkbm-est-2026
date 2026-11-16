// ============================================================
// backend/routes/raporRoutes.js
// Rute API untuk Manajemen Rapor Siswa Digital
// ============================================================

import express from 'express';
import RaporController from '../controllers/RaporController.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rute Meta / Referensi Form (Semua user yang login)
router.get('/meta', verifyToken, RaporController.getMeta);

// Rute Rapor Pribadi Siswa (Warga Belajar & Admin)
router.get('/siswa/me', verifyToken, RaporController.getMyRapor);

// Rute Admin: Melihat Semua Rapor (CRUD)
router.get('/', verifyToken, checkRole('super_admin', 'admin'), RaporController.getAll);
router.post('/', verifyToken, checkRole('super_admin', 'admin'), RaporController.create);
router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), RaporController.update);
router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), RaporController.delete);

// Rute Detail Rapor per ID (Admin atau Siswa yang bersangkutan)
router.get('/:id', verifyToken, RaporController.getById);

export default router;

