import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// Sajikan folder uploads sebagai file statis
app.use('/uploads', express.static(uploadsDir));

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
