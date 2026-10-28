// ============================================================
// src/App.jsx — Pengatur Rute (Router) Utama Aplikasi
// ============================================================

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// ── Halaman Publik (tidak butuh login) ──────────────────────
const HomePage       = lazy(() => import('./pages/public/HomePage.jsx'));
const LoginPage      = lazy(() => import('./pages/public/LoginPage.jsx'));
const DaftarSpmbPage = lazy(() => import('./pages/public/DaftarSpmbPage.jsx'));
const NotFoundPage   = lazy(() => import('./pages/public/NotFoundPage.jsx'));

// ── Komponen Pendukung ───────────────────────────────────────
import ProtectedRoute  from './components/ProtectedRoute.jsx';
const DashboardRouter = lazy(() => import('./pages/DashboardRouter.jsx'));

// ── Halaman Warga Belajar ────────────────────────────────────
const DashboardSiswa     = lazy(() => import('./pages/siswa/DashboardSiswa.jsx'));
const RuangBelajarSiswa  = lazy(() => import('./pages/siswa/RuangBelajarSiswa.jsx'));
const KelasTerpaduSiswa  = lazy(() => import('./pages/siswa/KelasTerpaduSiswa.jsx'));
const MateriSiswa        = lazy(() => import('./pages/siswa/MateriSiswa.jsx'));
const TugasSiswa         = lazy(() => import('./pages/siswa/TugasSiswa.jsx'));
const AbsensiSiswa       = lazy(() => import('./pages/siswa/AbsensiSiswa.jsx'));
const UjianSiswa         = lazy(() => import('./pages/siswa/UjianSiswa.jsx'));
const KlubSiswa          = lazy(() => import('./pages/siswa/KlubSiswa.jsx'));
const TagihanSiswa       = lazy(() => import('./pages/siswa/TagihanSiswa.jsx'));
const BeritaSiswa        = lazy(() => import('./pages/siswa/BeritaSiswa.jsx'));
const ModulBukuSiswa     = lazy(() => import('./pages/siswa/ModulBukuSiswa.jsx'));

// ── Halaman Admin TU & Keuangan ──────────────────────────────
const DashboardAdmin       = lazy(() => import('./pages/admin/DashboardAdmin.jsx'));
const SpmbAdmin            = lazy(() => import('./pages/admin/SpmbAdmin.jsx'));
const SiswaAdmin           = lazy(() => import('./pages/admin/SiswaAdmin.jsx'));
const TagihanAdmin         = lazy(() => import('./pages/admin/TagihanAdmin.jsx'));
const UserAdmin            = lazy(() => import('./pages/admin/UserAdmin.jsx'));
const KlubAdmin            = lazy(() => import('./pages/admin/KlubAdmin.jsx'));
const MasterMapelAdmin     = lazy(() => import('./pages/admin/MasterMapelAdmin.jsx'));
const MapelPerRombelAdmin  = lazy(() => import('./pages/admin/MapelPerRombelAdmin.jsx'));
const PeriodeUjianAdmin    = lazy(() => import('./pages/admin/PeriodeUjianAdmin.jsx'));
const PesertaUjianAdmin    = lazy(() => import('./pages/admin/PesertaUjianAdmin.jsx'));
const BeritaAdmin          = lazy(() => import('./pages/admin/BeritaAdmin.jsx'));
const ModulBukuAdmin       = lazy(() => import('./pages/admin/ModulBukuAdmin.jsx'));

// Tutor dan Pimpinan telah dihapus sesuai instruksi; sistem hanya untuk super_admin dan warga_belajar

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Memuat halaman...</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><RuangBelajarSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/kelas/:mapelId"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><KelasTerpaduSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/materi"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><MateriSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/tugas"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><TugasSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/tugas-mingguan"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><TugasSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/absensi"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><AbsensiSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/ujian"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><UjianSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/klub"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><KlubSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/tagihan"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><TagihanSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/berita"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><BeritaSiswa /></ProtectedRoute>} />
        <Route path="/dashboard/siswa/modul-buku"
          element={<ProtectedRoute allowedRoles={['warga_belajar','super_admin']}><ModulBukuSiswa /></ProtectedRoute>} />

        {/* ══ RUTE SUPER ADMIN ═══════════════════════════════════ */}
        <Route path="/dashboard/admin"
          element={<ProtectedRoute allowedRoles={['super_admin']}><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/modul-buku"
          element={<ProtectedRoute allowedRoles={['super_admin']}><ModulBukuAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/berita"
          element={<ProtectedRoute allowedRoles={['super_admin']}><BeritaAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/spmb"
          element={<ProtectedRoute allowedRoles={['super_admin']}><SpmbAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/siswa"
          element={<ProtectedRoute allowedRoles={['super_admin']}><SiswaAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/master-mapel"
          element={<ProtectedRoute allowedRoles={['super_admin']}><MasterMapelAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/mapel-rombel"
          element={<ProtectedRoute allowedRoles={['super_admin']}><MapelPerRombelAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/periode-ujian"
          element={<ProtectedRoute allowedRoles={['super_admin']}><PeriodeUjianAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/peserta-ujian"
          element={<ProtectedRoute allowedRoles={['super_admin']}><PesertaUjianAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/tagihan"
          element={<ProtectedRoute allowedRoles={['super_admin']}><TagihanAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/users"
          element={<ProtectedRoute allowedRoles={['super_admin']}><UserAdmin /></ProtectedRoute>} />
        <Route path="/dashboard/admin/klub"
          element={<ProtectedRoute allowedRoles={['super_admin']}><KlubAdmin /></ProtectedRoute>} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default App;
