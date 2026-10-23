// ============================================================
// config/multer.js
// Konfigurasi Multer untuk menangani upload file
// Digunakan untuk: berkas SPMB, pengumpulan tugas siswa,
// upload materi oleh Tutor, bukti bayar, foto profil, dan RPS.
// ============================================================

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');
const uploadsRootDir = path.resolve(backendRootDir, 'uploads');

// Pastikan folder uploads utama selalu ada
if (!fs.existsSync(uploadsRootDir)) {
  fs.mkdirSync(uploadsRootDir, { recursive: true });
}

// Tentukan lokasi penyimpanan dan nama file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan subfolder berdasarkan tujuan upload
    // req.uploadFolder diset oleh route sebelum middleware multer
    const folder = req.uploadFolder || 'umum';
    const uploadPath = path.resolve(uploadsRootDir, folder);

    // Buat subfolder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Format nama file: timestamp-namaasli.ext
    // Sanitasi karakter agar aman di Linux / Windows filesystem
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

// Filter tipe file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Terima file
  } else {
    cb(new Error('Tipe file tidak diizinkan. Hanya JPG, PNG, WEBP, PDF, DOC, DOCX, MP4.'), false);
  }
};

// Instance multer internal
const internalMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // Maksimum 15MB per file
  },
});

// Helper untuk normalisasi file.path menjadi relatif: 'uploads/folder/filename.ext'
const normalizeFilePath = (filePath) => {
  if (!filePath) return filePath;
  return path.relative(backendRootDir, filePath).replace(/\\/g, '/');
};

// Middleware wrapper agar file.path selalu format konsisten (Linux & Windows)
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) return next(err);

    if (req.file) {
      req.file.path = normalizeFilePath(req.file.path);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach((f) => {
          f.path = normalizeFilePath(f.path);
        });
      } else {
        Object.values(req.files).forEach((arr) => {
          if (Array.isArray(arr)) {
            arr.forEach((f) => {
              f.path = normalizeFilePath(f.path);
            });
          }
        });
      }
    }

    next();
  });
};

const upload = {
  single: (field) => wrapMulter(internalMulter.single(field)),
  array: (field, maxCount) => wrapMulter(internalMulter.array(field, maxCount)),
  fields: (fields) => wrapMulter(internalMulter.fields(fields)),
  any: () => wrapMulter(internalMulter.any()),
  none: () => internalMulter.none(),
};

export default upload;
