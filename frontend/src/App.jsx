// ============================================================
// src/App.jsx — Pengatur Rute (Router) Utama Aplikasi
// ============================================================

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// ── Smart Dynamic Import Helper dengan Auto-Retry & Hard-Refresh Fallback ──
// Mencegah masalah umum SPA di mana halaman macet / tidak muncul saat navigasi
// akibat chunk hash berganti setelah deployment atau cache browser tertinggal.
function lazyRetry(componentImport) {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      componentImport()
        .then(resolve)
        .catch((error) => {
          console.warn('[Router] Gagal memuat chunk modul dinamis, mencoba 1x lagi...', error);
          componentImport()
            .then(resolve)
            .catch((retryError) => {
              console.error('[Router] Retry dynamic import gagal, memuat ulang halaman otomatis...', retryError);
              const key = 'pkbm_chunk_last_reload';
              const last = Number(sessionStorage.getItem(key) || 0);
              const now = Date.now();
              // Batasi reload otomatis maksimal 1 kali per 10 detik agar tidak loop
              if (now - last > 10000) {
                sessionStorage.setItem(key, String(now));
                window.location.reload();
              } else {
                reject(retryError);
              }
            });
        });
    });
  });
}

// ── Halaman Publik (tidak butuh login) ──────────────────────
const HomePage       = lazyRetry(() => import('./pages/public/HomePage.jsx'));
const LoginPage      = lazyRetry(() => import('./pages/public/LoginPage.jsx'));
const DaftarSpmbPage = lazyRetry(() => import('./pages/public/DaftarSpmbPage.jsx'));
const NotFoundPage   = lazyRetry(() => import('./pages/public/NotFoundPage.jsx'));

// ── Komponen Pendukung ───────────────────────────────────────
import ProtectedRoute  from './components/ProtectedRoute.jsx';
const DashboardRouter = lazyRetry(() => import('./pages/DashboardRouter.jsx'));

// ── Halaman Warga Belajar ────────────────────────────────────
const DashboardSiswa     = lazyRetry(() => import('./pages/siswa/DashboardSiswa.jsx'));
const RuangBelajarSiswa  = lazyRetry(() => import('./pages/siswa/RuangBelajarSiswa.jsx'));
const KelasTerpaduSiswa  = lazyRetry(() => import('./pages/siswa/KelasTerpaduSiswa.jsx'));
const MateriSiswa        = lazyRetry(() => import('./pages/siswa/MateriSiswa.jsx'));
const TugasSiswa         = lazyRetry(() => import('./pages/siswa/TugasSiswa.jsx'));
const AbsensiSiswa       = lazyRetry(() => import('./pages/siswa/AbsensiSiswa.jsx'));
const UjianSiswa         = lazyRetry(() => import('./pages/siswa/UjianSiswa.jsx'));
const KlubSiswa          = lazyRetry(() => import('./pages/siswa/KlubSiswa.jsx'));
const TagihanSiswa       = lazyRetry(() => import('./pages/siswa/TagihanSiswa.jsx'));
const BeritaSiswa        = lazyRetry(() => import('./pages/siswa/BeritaSiswa.jsx'));
const ModulBukuSiswa     = lazyRetry(() => import('./pages/siswa/ModulBukuSiswa.jsx'));

// ── Halaman Admin TU & Keuangan ──────────────────────────────
const DashboardAdmin       = lazyRetry(() => import('./pages/admin/DashboardAdmin.jsx'));
const SpmbAdmin            = lazyRetry(() => import('./pages/admin/SpmbAdmin.jsx'));
const SiswaAdmin           = lazyRetry(() => import('./pages/admin/SiswaAdmin.jsx'));
const TagihanAdmin         = lazyRetry(() => import('./pages/admin/TagihanAdmin.jsx'));
const UserAdmin            = lazyRetry(() => import('./pages/admin/UserAdmin.jsx'));
const KlubAdmin            = lazyRetry(() => import('./pages/admin/KlubAdmin.jsx'));
const MasterMapelAdmin     = lazyRetry(() => import('./pages/admin/MasterMapelAdmin.jsx'));
const MapelPerRombelAdmin  = lazyRetry(() => import('./pages/admin/MapelPerRombelAdmin.jsx'));
const PeriodeUjianAdmin    = lazyRetry(() => import('./pages/admin/PeriodeUjianAdmin.jsx'));
const PesertaUjianAdmin    = lazyRetry(() => import('./pages/admin/PesertaUjianAdmin.jsx'));
const BeritaAdmin          = lazyRetry(() => import('./pages/admin/BeritaAdmin.jsx'));
const ModulBukuAdmin       = lazyRetry(() => import('./pages/admin/ModulBukuAdmin.jsx'));

// ── Error Boundary untuk Mengisolasi Error Rendering ─────────
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Komponen gagal me-render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg, #F8FAFC)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 440, background: '#FFFFFF', padding: '32px 24px', borderRadius: 24, boxShadow: '0 12px 36px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="bi bi-arrow-clockwise" style={{ fontSize: '1.8rem' }}></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Menampilkan Halaman Terbaru
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
              Sistem sedang memperbarui sesi tampilan. Klik tombol di bawah untuk menampilkan konten seketika.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 24px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
              }}
            >
              Segarkan & Buka Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowHint(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg, #F8FAFC)', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-text-muted, #64748B)', margin: 0, fontWeight: 600 }}>Memuat halaman...</p>
        {showSlowHint && (
          <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
              Memuat terasa agak lama?
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Segarkan Halaman
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {}
    try {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const appMain = document.querySelector('.app-main');
      if (appMain) appMain.scrollTop = 0;
      const appContent = document.querySelector('.app-content');
      if (appContent) appContent.scrollTop = 0;
    } catch {}
  }, [pathname]);
  return null;
}

function SeoMetaManager() {
  const location = useLocation();
  useEffect(() => {
    const descriptionTag    = document.querySelector('meta[name="description"]');
    const robotsTag         = document.querySelector('meta[name="robots"]');
    const ogTitleTag        = document.querySelector('meta[property="og:title"]');
    const ogDescriptionTag  = document.querySelector('meta[property="og:description"]');
    const ogUrlTag          = document.querySelector('meta[property="og:url"]');
    const ogImageTag        = document.querySelector('meta[property="og:image"]');
    const twitterTitleTag   = document.querySelector('meta[name="twitter:title"]');
    const twitterDescTag    = document.querySelector('meta[name="twitter:description"]');
    const twitterImageTag   = document.querySelector('meta[name="twitter:image"]');
    let canonicalTag        = document.querySelector('link[rel="canonical"]');
    let structuredDataTag   = document.querySelector('script[data-seo-ld="pkbm"]');

    const path     = location.pathname;
    const pageUrl  = `${window.location.origin}${path}`;
    const imageUrl = `${window.location.origin}/favicon.svg`;

    let title       = 'PKBM Bina Mandiri';
    let description = 'Platform digital PKBM Bina Mandiri untuk pendaftaran, pembelajaran, ujian, dan administrasi pendidikan nonformal.';
    let robots      = 'index, follow';

    const userRaw = localStorage.getItem('pkbm_user');
    let user = null;
    try { user = JSON.parse(userRaw); } catch (e) {}

    if (path === '/') {
      title       = 'Beranda | PKBM Bina Mandiri';
      description = 'Penyelenggara Resmi Program Pendidikan Kesetaraan Paket A, B, dan C. Pendidikan Setara, Masa Depan Gemilang.';
    } else if (path === '/login') {
      title       = 'Login | PKBM Bina Mandiri';
      description = 'Masuk ke platform digital PKBM Bina Mandiri.';
    } else if (path === '/daftar') {
      title       = 'Pendaftaran Warga Belajar Baru | PKBM Bina Mandiri';
      description = 'Daftar sebagai warga belajar baru PKBM Bina Mandiri secara online untuk Paket A, Paket B, dan Paket C.';
    } else if (path.startsWith('/dashboard')) {
      robots      = 'index, follow';
      description = 'Area dashboard internal PKBM Bina Mandiri.';
      if (path === '/dashboard/siswa')         title = 'Dashboard Siswa | PKBM Bina Mandiri';
      else if (path === '/dashboard/siswa/tugas' || path === '/dashboard/siswa/tugas-mingguan') title = 'Tugas Mingguan Siswa | LMS PKBM Bina Mandiri';
      else if (path === '/dashboard/siswa/modul-buku') title = 'Kumpulan Modul & Buku Digital | PKBM Bina Mandiri';
      else if (path === '/dashboard/admin/modul-buku') title = 'Kelola Modul & Buku Digital | PKBM Bina Mandiri';
      else if (path === '/dashboard/admin')    title = 'Dashboard Super Admin | PKBM Bina Mandiri';
      else title = 'Dashboard | PKBM Bina Mandiri';
    }

    document.title = title;
    if (descriptionTag)   descriptionTag.setAttribute('content', description);
    if (robotsTag)        robotsTag.setAttribute('content', robots);
    if (ogTitleTag)       ogTitleTag.setAttribute('content', title);
    if (ogDescriptionTag) ogDescriptionTag.setAttribute('content', description);
    if (ogUrlTag)         ogUrlTag.setAttribute('content', pageUrl);
    if (ogImageTag)       ogImageTag.setAttribute('content', imageUrl);
    if (twitterTitleTag)  twitterTitleTag.setAttribute('content', title);
    if (twitterDescTag)   twitterDescTag.setAttribute('content', description);
    if (twitterImageTag)  twitterImageTag.setAttribute('content', imageUrl);

    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', pageUrl);

    const structuredData = path === '/daftar'
      ? { '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'PKBM Bina Mandiri', url: window.location.origin, description, image: imageUrl }
      : { '@context': 'https://schema.org', '@type': 'WebSite', name: 'PKBM Bina Mandiri', url: window.location.origin, description };

    if (!structuredDataTag) {
      structuredDataTag = document.createElement('script');
      structuredDataTag.type = 'application/ld+json';
      structuredDataTag.setAttribute('data-seo-ld', 'pkbm');
      document.head.appendChild(structuredDataTag);
    }
    structuredDataTag.textContent = JSON.stringify(structuredData);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <ScrollToTop />
        <SeoMetaManager />
        <Routes>

          {/* ══ RUTE PUBLIK ══════════════════════════════════════ */}
          {/* Homepage baru — halaman utama */}
          <Route path="/"       element={<HomePage />} />
          {/* Login dipindah ke /login */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/daftar" element={<DaftarSpmbPage />} />

          {/* /dashboard → redirect otomatis sesuai role */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

          {/* ══ RUTE WARGA BELAJAR (LMS SISWA) ═══════════════════ */}
          <Route path="/dashboard/siswa"
            element={<ProtectedRoute allowedRoles={['warga_belajar']}><DashboardSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/ruang-belajar"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><RuangBelajarSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/kelas/:mapelId"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><KelasTerpaduSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/materi"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><MateriSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/tugas"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><TugasSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/tugas-mingguan"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><TugasSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/absensi"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><AbsensiSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/ujian"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><UjianSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/klub"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><KlubSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/tagihan"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><TagihanSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/berita"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><BeritaSiswa /></ProtectedRoute>} />
          <Route path="/dashboard/siswa/modul-buku"
            element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin','admin']}><ModulBukuSiswa /></ProtectedRoute>} />

          {/* ══ RUTE SUPER ADMIN & ADMIN ═════════════════════════ */}
          <Route path="/dashboard/admin"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/modul-buku"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><ModulBukuAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/berita"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><BeritaAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/spmb"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><SpmbAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/siswa"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><SiswaAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/master-mapel"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><MasterMapelAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/mapel-rombel"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><MapelPerRombelAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/periode-ujian"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><PeriodeUjianAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/peserta-ujian"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><PesertaUjianAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/tagihan"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><TagihanAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/users"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><UserAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/klub"
            element={<ProtectedRoute allowedRoles={['super_admin','admin']}><KlubAdmin /></ProtectedRoute>} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default App;
