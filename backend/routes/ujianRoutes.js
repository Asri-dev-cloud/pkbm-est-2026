// ============================================================
// routes/ujianRoutes.js
// Endpoint modul Ujian Online: Bank Soal, Paket Ujian, Sesi Ujian
// ============================================================

import { Router } from 'express';
import { BankSoalController, PaketUjianController, SesiUjianController } from '../controllers/UjianController.js';
import { PesertaUjianController } from '../controllers/UjianAdministrasiController.js';
import { verifyToken, checkRole, ROLES } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(verifyToken);

// ── PESERTA UJIAN & KARTU UJIAN  /api/ujian/peserta ───────────
router.get('/peserta/saya',
  checkRole(ROLES.WARGA_BELAJAR),
  PesertaUjianController.getMine
);
router.get('/peserta/saya/mapel',
  checkRole(ROLES.WARGA_BELAJAR),
  PesertaUjianController.getMyMapel
);
router.get('/peserta',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.getAll
);
router.get('/peserta/:id',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.getById
);
router.post('/peserta/generate',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.generatePeserta
);
router.put('/peserta/:id/verifikasi-pembayaran',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.verifyPembayaran
);
router.put('/peserta/:id/kelayakan',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.updateKelayakan
);
router.post('/peserta/:id/generate-kartu',
  checkRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PesertaUjianController.generateKartu
);

// ── BANK SOAL  /api/ujian/soal ───────────────────────────────
// GET    /api/ujian/soal           — Daftar soal (filter: mapel, jenjang, jenis)
router.get('/soal',    checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), BankSoalController.getAll);
// GET    /api/ujian/soal/:id       — Detail satu soal
router.get('/soal/:id', checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), BankSoalController.getById);
// POST   /api/ujian/soal           — Tambah soal baru
router.post('/soal',   checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), BankSoalController.create);
// PUT    /api/ujian/soal/:id       — Edit soal
router.put('/soal/:id', checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), BankSoalController.update);
// DELETE /api/ujian/soal/:id       — Hapus soal
router.delete('/soal/:id', checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN), BankSoalController.delete);

// ── PAKET UJIAN  /api/ujian/paket ────────────────────────────
// GET  /api/ujian/paket/rombel/:rombelId — Daftar paket ujian satu rombel
router.get('/paket/rombel/:rombelId',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PaketUjianController.getByRombel
);
// GET  /api/ujian/paket/:id         — Detail paket + daftar soal
router.get('/paket/:id',
  checkRole(ROLES.TUTOR, ROLES.WARGA_BELAJAR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PaketUjianController.getById
);
// POST /api/ujian/paket             — Tutor / Admin buat paket ujian
router.post('/paket',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PaketUjianController.create
);
// GET  /api/ujian/paket/:id/rekap   — Rekap nilai semua WB (Tutor / Admin)
router.get('/paket/:id/rekap',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PaketUjianController.getRekap
);
router.put('/paket/:id/nilai-manual',
  checkRole(ROLES.TUTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  PaketUjianController.simpanNilaiManual
);

// ── SESI UJIAN (WB Mengerjakan)  /api/ujian/sesi ─────────────
// POST  /api/ujian/sesi/mulai/:paketId  — WB mulai ujian
router.post('/sesi/mulai/:paketId',
  checkRole(ROLES.WARGA_BELAJAR),
  SesiUjianController.mulai
);
// POST  /api/ujian/sesi/:sesiId/jawaban — WB simpan jawaban
router.post('/sesi/:sesiId/jawaban',
  checkRole(ROLES.WARGA_BELAJAR),
  SesiUjianController.simpanJawaban
);
// POST  /api/ujian/sesi/:sesiId/submit  — WB submit ujian
router.post('/sesi/:sesiId/submit',
  checkRole(ROLES.WARGA_BELAJAR),
  SesiUjianController.submit
);
// PUT   /api/ujian/sesi/:sesiId/nilai-essay — Tutor nilai essay
router.put('/sesi/:sesiId/nilai-essay',
  checkRole(ROLES.TUTOR, ROLES.SUPER_ADMIN),
  SesiUjianController.nilaiEssay
);

export default router;
