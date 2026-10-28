// ============================================================
// src/App.jsx — Pengatur Rute (Router) Utama Aplikasi
// ============================================================

import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// ── Direct Import Semua Halaman (Anti-Blank & Navigasi Instan 0ms) ──
// Menghilangkan React.lazy per-halaman yang menjadi penyebab utama
// layar blank saat berpindah halaman pada koneksi mobile / setelah deployment.
// Dengan direct import, semua komponen rute sudah siap di memori,
// navigasi terjadi seketika tanpa perlu fetch chunk terpisah atau refresh browser.

// ── Halaman Publik ───────────────────────────────────────────
import HomePage from './pages/public/HomePage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import DaftarSpmbPage from './pages/public/DaftarSpmbPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// ── Komponen Pendukung ───────────────────────────────────────
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardRouter from './pages/DashboardRouter.jsx';

// ── Halaman Warga Belajar (LMS Siswa) ────────────────────────
import DashboardSiswa from './pages/siswa/DashboardSiswa.jsx';
import RuangBelajarSiswa from './pages/siswa/RuangBelajarSiswa.jsx';
import KelasTerpaduSiswa from './pages/siswa/KelasTerpaduSiswa.jsx';
import MateriSiswa from './pages/siswa/MateriSiswa.jsx';
import TugasSiswa from './pages/siswa/TugasSiswa.jsx';
import AbsensiSiswa from './pages/siswa/AbsensiSiswa.jsx';
import UjianSiswa from './pages/siswa/UjianSiswa.jsx';
import KlubSiswa from './pages/siswa/KlubSiswa.jsx';
import TagihanSiswa from './pages/siswa/TagihanSiswa.jsx';
import BeritaSiswa from './pages/siswa/BeritaSiswa.jsx';
import ModulBukuSiswa from './pages/siswa/ModulBukuSiswa.jsx';

// ── Halaman Admin TU & Keuangan ──────────────────────────────
import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import SpmbAdmin from './pages/admin/SpmbAdmin.jsx';
import SiswaAdmin from './pages/admin/SiswaAdmin.jsx';
import TagihanAdmin from './pages/admin/TagihanAdmin.jsx';
import UserAdmin from './pages/admin/UserAdmin.jsx';
import KlubAdmin from './pages/admin/KlubAdmin.jsx';
import MasterMapelAdmin from './pages/admin/MasterMapelAdmin.jsx';
import MapelPerRombelAdmin from './pages/admin/MapelPerRombelAdmin.jsx';
import PeriodeUjianAdmin from './pages/admin/PeriodeUjianAdmin.jsx';
import PesertaUjianAdmin from './pages/admin/PesertaUjianAdmin.jsx';
import BeritaAdmin from './pages/admin/BeritaAdmin.jsx';
import ModulBukuAdmin from './pages/admin/ModulBukuAdmin.jsx';

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
    </RouteErrorBoundary>
  );
}

export default App;
