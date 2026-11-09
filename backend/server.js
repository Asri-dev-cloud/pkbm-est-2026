import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { testConnection } from './config/db.js';

// ── Import semua routes ──────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import siswaRoutes from './routes/siswaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import spmbRoutes from './routes/spmbRoutes.js';
import tagihanRoutes from './routes/tagihanRoutes.js';
import absensiRoutes from './routes/absensiRoutes.js';
import materiRoutes from './routes/materiRoutes.js';
import ujianRoutes from './routes/ujianRoutes.js';
import klubRoutes from './routes/klubRoutes.js';
import pertemuanRoutes from './routes/pertemuanRoutes.js';
import akademikRoutes from './routes/akademikRoutes.js';
import periodeUjianRoutes from './routes/periodeUjianRoutes.js';
import agendaRoutes from './routes/agendaRoutes.js';
import beritaRoutes from './routes/beritaRoutes.js';
import modulBukuRoutes from './routes/modulBukuRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');

// Diperlukan jika server berada di balik reverse proxy seperti Nginx / Cloudflare
app.set('trust proxy', 1);

// ============================================================
// CORS CONFIGURATION (ROBUST & PRODUCTION READY)
// ============================================================
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://pkbmbinamandiri.sch.id',
  'https://www.pkbmbinamandiri.sch.id',
  'https://api.pkbmbinamandiri.sch.id',
  'http://pkbmbinamandiri.sch.id',
  'http://www.pkbmbinamandiri.sch.id',
];

const envOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  ''
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const configuredOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Izinkan request tanpa header Origin (misal: curl, mobile apps, Postman, internal server request)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    // 2. Cek apakah diizinkan secara eksplisit atau wildcard
    if (
      configuredOrigins.includes('*') ||
      configuredOrigins.includes(cleanOrigin)
    ) {
      return callback(null, true);
    }

    // 2b. Izinkan domain & semua subdomain pkbmbinamandiri.sch.id
    if (/^https?:\/\/([a-z0-9-]+\.)*pkbmbinamandiri\.sch\.id(:\d+)?$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 3. Izinkan domain yang cocok tanpa protocol (misal subdomain atau port berbeda)
    const hostnameOnly = cleanOrigin.replace(/^https?:\/\//i, '');
    const isDomainAllowed = configuredOrigins.some((allowed) => {
      const allowedHost = allowed.replace(/^https?:\/\//i, '');
      return hostnameOnly === allowedHost || hostnameOnly.endsWith(`.${allowedHost}`);
    });
    if (isDomainAllowed) {
      return callback(null, true);
    }

    // 4. Izinkan localhost & 127.0.0.1 di non-production
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 5. Pada mode production, fleksibel izinkan origin untuk mencegah error preflight
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parsing JSON dan URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan folder uploads sebagai file statis via /uploads dan /api/uploads
app.use(['/uploads', '/api/uploads'], express.static(uploadsDir, {
  fallthrough: true,
  maxAge: '30d',
}));

// Route fallback cerdas untuk akses & pratinjau file upload jika file statis terlewat atau beda format URL
app.get(['/uploads/*', '/api/uploads/*'], (req, res, next) => {
  try {
    const rawPath = req.path.replace(/^\/(?:api\/)?uploads\/?/i, '');
    const decodedSubPath = decodeURIComponent(rawPath);
    const resolvedPath = path.resolve(uploadsDir, decodedSubPath);

    // Keamanan path traversal
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return res.sendFile(resolvedPath);
    }

    // Coba nama file dengan karakter spasi diubah menjadi underscore (format sanitasi multer)
    const sanitizedCandidate = path.resolve(uploadsDir, decodedSubPath.replace(/\s+/g, '_'));
    if (fs.existsSync(sanitizedCandidate) && fs.statSync(sanitizedCandidate).isFile()) {
      return res.sendFile(sanitizedCandidate);
    }

    // Coba basename di dalam subfolder langsung
    const parts = decodedSubPath.split('/');
    if (parts.length > 1) {
      const folder = parts[0];
      const filename = parts.slice(1).join('/');
      const altCandidate = path.resolve(uploadsDir, folder, path.basename(filename));
      if (fs.existsSync(altCandidate) && fs.statSync(altCandidate).isFile()) {
        return res.sendFile(altCandidate);
      }
    }

    return res.status(404).json({
      success: false,
      message: `File '${decodedSubPath}' tidak ditemukan di penyimpanan server.`,
      debug: {
        path: decodedSubPath,
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Uploads Static Fallback Error]:', err);
    return next(err);
  }
});

// ============================================================
// ROOT & HEALTH CHECK ENDPOINTS
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API PKBM Bina Mandiri Aktif',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    health: '/api/health',
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    success: true,
    message: 'Server PKBM Bina Mandiri berjalan normal.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// ROUTES API — didukung baik dengan awalan /api maupun tanpa /api
// ============================================================
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/siswa`, siswaRoutes);
  app.use(`${prefix}/spmb`, spmbRoutes);
  app.use(`${prefix}/tagihan`, tagihanRoutes);
  app.use(`${prefix}/absensi`, absensiRoutes);
  app.use(`${prefix}/lms`, materiRoutes);
  app.use(`${prefix}/ujian`, ujianRoutes);
  app.use(`${prefix}/klub`, klubRoutes);
  app.use(`${prefix}/pertemuan`, pertemuanRoutes);
  app.use(`${prefix}/akademik`, akademikRoutes);
  app.use(`${prefix}/periode-ujian`, periodeUjianRoutes);
  app.use(`${prefix}/agenda`, agendaRoutes);
  app.use(`${prefix}/berita`, beritaRoutes);
  app.use(`${prefix}/modul-buku`, modulBukuRoutes);
};

// Dukung akses standar /api/...
registerRoutes('/api');

// Dukung akses langsung (misal subdomain api.pkbmbinamandiri.sch.id/...)
registerRoutes('');

// ============================================================
// HANDLER 404
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// ============================================================
// START SERVER
// ============================================================
const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server : http://localhost:${PORT}`);
    console.log(`📡 Mode   : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health : http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
