// ============================================================
// routes/spmbRoutes.js
// Endpoint SPMB: ada yang publik (tanpa login) dan ada yang
// butuh autentikasi Admin / Super Admin.
// ============================================================

import { Router } from 'express';
import SpmbController from '../controllers/SpmbController.js';
import { verifyToken, checkRole, optionalAuth, ROLES } from '../middlewares/authMiddleware.js';
import upload from '../config/multer.js';

const router = Router();

// ============================================================
// ENDPOINT PUBLIK — tidak membutuhkan token JWT
// Diakses oleh calon Warga Belajar dari halaman landing page
// ============================================================

// POST /api/spmb/daftar — Submit form pendaftaran beserta berkas (tanpa login)
const handleSpmbUpload = (req, res, next) => {
  req.uploadFolder = 'spmb';
  const uploadMiddleware = upload.fields([
    { name: 'kk', maxCount: 1 },
    { name: 'akta', maxCount: 1 },
    { name: 'ktp', maxCount: 1 },
    { name: 'ijazah', maxCount: 1 },
    { name: 'foto', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('[Multer /api/spmb/daftar error]:', err.message);
      return res.status(400).json({
        success: false,
        message: `Gagal memproses berkas unggahan: ${err.message}`,
      });
    }
    next();
  });
};

router.post(
  '/daftar',
  optionalAuth,
  handleSpmbUpload,
  SpmbController.daftar
);

// GET /api/spmb/cek-status — Cek status pendaftaran calon siswa (tanpa login)
router.get('/cek-status', SpmbController.cekStatusPublik);

// POST /api/spmb/:id/berkas — Upload berkas pendukung (bisa publik atau via Admin TU)
// Middleware: optionalAuth (deteksi login admin), set folder upload ke 'spmb', lalu jalankan Multer
router.post(
  '/:id/berkas',
  optionalAuth,
  (req, res, next) => { req.uploadFolder = 'spmb'; next(); },
  upload.single('file'),
  SpmbController.uploadBerkas
);

// ============================================================
// ENDPOINT TERPROTEKSI — membutuhkan token JWT + role tertentu
// ============================================================

// GET /api/spmb/statistik — Widget ringkasan SPMB (Admin, Pimpinan, Super Admin)
// PENTING: definisikan SEBELUM /:id agar tidak dianggap sebagai ID
router.get(
  '/statistik',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.PIMPINAN, ROLES.SUPER_ADMIN),
  SpmbController.getStatistik
);

// GET /api/spmb — Daftar semua pendaftar untuk antrian verifikasi (Admin, Super Admin)
router.get(
  '/',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.getAll
);

// GET /api/spmb/:id — Detail satu pendaftar beserta berkasnya (Admin, Super Admin)
router.get(
  '/:id',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.getById
);

// GET /api/spmb/berkas/:berkasId/file — Dapatkan file fisik berkas (stream/inline)
router.get(
  '/berkas/:berkasId/file',
  optionalAuth,
  SpmbController.getBerkasFile
);

// PUT /api/spmb/berkas/:berkasId/verifikasi — Verifikasi satu berkas (Admin)
router.put(
  '/berkas/:berkasId/verifikasi',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.verifikasiBerkas
);

// DELETE /api/spmb/berkas/:berkasId — Hapus satu berkas (Admin, Super Admin)
router.delete(
  '/berkas/:berkasId',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.hapusBerkas
);

// PUT /api/spmb/:id/keputusan — Buat keputusan terima/tolak + pipeline otomatis (Admin)
router.put(
  '/:id/keputusan',
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  SpmbController.buatKeputusan
);

export default router;
