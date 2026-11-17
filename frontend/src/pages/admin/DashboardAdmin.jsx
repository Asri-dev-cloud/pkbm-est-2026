// ============================================================
// src/pages/admin/DashboardAdmin.jsx — Beranda Admin Modern PKBM
// ============================================================
// Layout terinspirasi desain modern sesuai gambar mockup:
// - Header 'Beranda'
// - Welcome Banner dengan maskot pose1.png dan tombol aksi
// - 4 Metrik Kartu (Warga Belajar, SPMB, Mapel, Ujian)
// - Distribusi Siswa dengan Donut Chart & Progress Bars
// - Panel Kanan 'Aktivitas Terkini' (Agenda, Rapat, Aktivitas Pengguna)
// - Warna dominan: Biru Karakter, Putih, Pink, Kuning, Hitam
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import { SpmbAPI, SiswaAPI } from '../../services/api.js';
import {
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  Wallet,
  Sparkles,
  GraduationCap,
  Clock,
  X,
  Edit3,
  BookMarked,
  Network,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  CalendarDays,
  ChevronDown,
  Star,
  MapPin
} from 'lucide-react';
import './DashboardAdmin.css';

function DashboardAdmin() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [statSpmb, setStatSpmb] = useState(null);
  const [statSiswa, setStatSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSpmb, resSiswa] = await Promise.allSettled([
          SpmbAPI.getStatistik(),
          SiswaAPI.getStatistikPerJenjang(),
        ]);

        if (resSpmb.status === 'fulfilled') setStatSpmb(resSpmb.value.data.data);
        if (resSiswa.status === 'fulfilled') setStatSiswa(resSiswa.value.data.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format tanggal hari ini dalam Bahasa Indonesia
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Ekstrak data siswa per jenjang (pastikan selalu di-parse ke Number agar tidak terjadi penggabungan string)
  const countPaketA = Number(statSiswa?.find(s => s.jenjang === 'paket_a')?.jumlah || 0);
  const countPaketB = Number(statSiswa?.find(s => s.jenjang === 'paket_b')?.jumlah || 0);
  const countPaketC = Number(statSiswa?.find(s => s.jenjang === 'paket_c')?.jumlah || 0);
  const countAlumni = Number(statSiswa?.find(s => s.jenjang === 'alumni')?.jumlah || 0);
  const totalSiswa = countPaketA + countPaketB + countPaketC + countAlumni;

  // Persentase untuk Donut Chart & Progress Bars (aman dari pembagian 0)
  const pctC = totalSiswa > 0 ? Math.round((countPaketC / totalSiswa) * 100) : 0;
  const pctA = totalSiswa > 0 ? Math.round((countPaketA / totalSiswa) * 100) : 0;
  const pctB = totalSiswa > 0 ? Math.round((countPaketB / totalSiswa) * 100) : 0;
  const pctAlumni = totalSiswa > 0 ? Math.round((countAlumni / totalSiswa) * 100) : 0;

  // Perhitungan arc SVG Donut Chart (Radius r = 62, Circumference = 389.56)
  const circumference = 389.56;
  const strokeC = (pctC / 100) * circumference;
  const strokeA = (pctA / 100) * circumference;
  const strokeB = (pctB / 100) * circumference;
  const strokeAlumni = (pctAlumni / 100) * circumference;

  const offsetC = 0;
  const offsetA = -(strokeC);
  const offsetB = -(strokeC + strokeA);
  const offsetAlumni = -(strokeC + strokeA + strokeB);

  const adminName = user?.nama_lengkap || user?.nama || 'Administrator';

  return (
    <div className="app-layout matcha-theme-layout">
      {/* Sidebar Modern Terkategori */}
      <Sidebar user={user} />

      {/* Main Container dengan Nuansa Morie Matcha Cream */}
      <main className="app-main">
        <div className="app-content dashboard-clean-canvas matcha-dashboard-canvas">

          {/* ── 1. Morie Matcha Hero Banner (Header Beranda langsung di Latar Belakang Hijau) ── */}
          <section className="matcha-hero-banner">
            {/* Top Bar Terpadu langsung di Latar Belakang Banner (Tanpa Kotak Putih) */}
            <div className="matcha-hero-header-row">
              <div className="matcha-hero-header-left">
                <h1 className="matcha-hero-page-title">Beranda</h1>
                <p className="matcha-hero-page-subtitle">
                  Pusat manajemen dan monitoring operasional PKBM Bina Mandiri
                </p>
              </div>
            </div>

            {/* Main Hero Body */}
            <div className="matcha-hero-body">
              {/* Kolom Kiri: Tipografi Editorial Besar & Tombol Aksi */}
              <div className="matcha-hero-left">
                {/* Judul Besar Morie Matcha Serif Display */}
                <div className="matcha-hero-giant-title matcha-serif" aria-hidden="true">
                  E-PKBM
                </div>

                <h2 className="matcha-hero-headline">
                  Selamat Bertugas, {adminName}!
                </h2>

                <p className="matcha-hero-subtext">
                  Dedikasimu menjaga alur operasional PKBM berjalan lancar tanpa hambatan. Wujudkan ekosistem belajar kesetaraan yang inklusif, berkualitas, dan berdampak nyata bagi seluruh warga belajar.
                </p>

                <div className="matcha-hero-cta-group">
                  <Link to="/dashboard/admin/spmb" className="matcha-pill-btn-lime">
                    <UserPlus size={16} />
                    <span>Verifikasi SPMB</span>
                  </Link>
                  <Link to="/dashboard/admin/siswa" className="matcha-pill-btn-glass">
                    <Users size={16} />
                    <span>Data Siswa</span>
                  </Link>
                  <Link to="/dashboard/admin/tagihan" className="matcha-pill-btn-glass">
                    <Wallet size={16} />
                    <span>Keuangan SPP</span>
                  </Link>
                </div>
              </div>

              {/* Kolom Kanan: Karakter Siswa PKBM (Hero 1 - Ukuran Besar Di Atas Ribbon) */}
              <div className="matcha-hero-right">
                {/* Ambient Spotlight Glow di Belakang Karakter Siswa */}
                <div className="matcha-hero-spotlight" aria-hidden="true"></div>

                <div className="matcha-mascot-container" title="Warga Belajar PKBM Bina Mandiri">
                  <img
                    src="/images/hero1.png"
                    alt="Siswa Warga Belajar PKBM Bina Mandiri"
                    className="matcha-mascot-img"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* ── Ribbon Marquee Bergerak Elegan di Bawah Banner ── */}
            <div className="hero-ribbon-marquee" aria-hidden="true">
              <div className="ribbon-marquee-track">
                <span className="ribbon-text-item">★ PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI</span>
                <span className="ribbon-text-item">✦ PENDIDIKAN KESETARAAN PAKET A, B & C</span>
                <span className="ribbon-text-item">★ FLEKSIBEL & RESMI KEMENDIKBUD</span>
                <span className="ribbon-text-item">✦ MEMBINA KEMANDIRIAN MERAIH MASA DEPAN</span>
                <span className="ribbon-text-item">★ EKOSISTEM BELAJAR DIGITAL INKLUSIF</span>
                <span className="ribbon-text-item">✦ EST. 2026</span>
                <span className="ribbon-text-item">★ PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI</span>
                <span className="ribbon-text-item">✦ PENDIDIKAN KESETARAAN PAKET A, B & C</span>
                <span className="ribbon-text-item">★ FLEKSIBEL & RESMI KEMENDIKBUD</span>
                <span className="ribbon-text-item">✦ MEMBINA KEMANDIRIAN MERAIH MASA DEPAN</span>
                <span className="ribbon-text-item">★ EKOSISTEM BELAJAR DIGITAL INKLUSIF</span>
                <span className="ribbon-text-item">✦ EST. 2026</span>
              </div>
            </div>
          </section>

          {/* ── 3. Morie Matcha Floating Dark Green Capsule (Metrics Pill) ── */}
          <section className="matcha-capsule-card">
            {/* Item 1: Total Siswa */}
            <Link to="/dashboard/admin/siswa" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <Users size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Total Warga Belajar</span>
                <span className="matcha-capsule-sub">{totalSiswa} Siswa Aktif Terdaftar</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 2: Verifikasi SPMB */}
            <Link to="/dashboard/admin/spmb" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <UserPlus size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">SPMB Menunggu</span>
                <span className="matcha-capsule-sub">{Number(statSpmb?.pending || 0)} Pendaftar Baru</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 3: Master Mapel */}
            <Link to="/dashboard/admin/master-mapel" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <BookOpen size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Mata Pelajaran</span>
                <span className="matcha-capsule-sub">30 Kurikulum Terpadu</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 4: Jadwal Ujian */}
            <Link to="/dashboard/admin/periode-ujian" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <Calendar size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Jadwal Ujian</span>
                <span className="matcha-capsule-sub">15 Periode Evaluasi</span>
              </div>
            </Link>
          </section>

          {/* ── 3. Morie Matcha Section Editorial Heading: 'Ringkasan Operasional' ── */}

          {/* ── 4. Morie Matcha Section Editorial Heading: 'Ringkasan Operasional' ── */}
          <div className="matcha-editorial-header">
            <div>
              <h2 className="matcha-editorial-title">
                Ringkasan <span className="matcha-serif italic">Operasional</span>
              </h2>
              <p className="matcha-editorial-desc">
                Pantau sebaran peserta didik di setiap jenjang kesetaraan serta koordinasikan agenda operasional harian secara realtime.
              </p>
            </div>

            <Link to="/dashboard/admin/siswa" className="matcha-pill-btn-dark">
              <span>Kelola Data Siswa</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* ── 4. Grid Analitik Siswa & Pintasan Modul Cepat (Modern & Seamless) ── */}
          <div className="retro-analytics-bottom-grid">

              {/* Kolom 1: Distribusi Warga Belajar */}
              <div className="team-exec-card matcha-card">
                <div className="card-title-row">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B4922C] block mb-0.5">
                      Data Kesetaraan PKBM
                    </span>
                    <h3 className="card-heading-title">Distribusi Warga Belajar</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rincian peserta aktif berdasarkan jenjang kesetaraan
                    </p>
                  </div>

                  {/* Kotak Siswa Aktif Keren & Modern (Pill Live Badge dengan Glowing Dot) */}
                  <div className="retro-siswa-aktif-badge" title="Total Siswa Aktif Terdaftar">
                    <span className="retro-badge-pulse-dot" aria-hidden="true">
                      <span className="retro-pulse-ping"></span>
                      <span className="retro-pulse-core"></span>
                    </span>
                    <span className="retro-badge-num">{totalSiswa}</span>
                    <span className="retro-badge-txt">Siswa Aktif</span>
                  </div>
                </div>

                <div className="donut-stats-wrapper">

                  {/* Visual Donut Chart SVG */}
                  <div className="donut-chart-box">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        className="stroke-slate-100"
                        strokeWidth="18"
                        fill="transparent"
                      />

                      {/* Arc 1: Paket C (Sky Blue) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#5CB8FF"
                        strokeWidth="18"
                        strokeDasharray={`${strokeC} ${circumference}`}
                        strokeDashoffset={offsetC}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 2: Paket A (Warm Orange) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#FFaf5c"
                        strokeWidth="18"
                        strokeDasharray={`${strokeA} ${circumference}`}
                        strokeDashoffset={offsetA}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 3: Paket B (Fresh Green) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#6BCB77"
                        strokeWidth="18"
                        strokeDasharray={`${strokeB} ${circumference}`}
                        strokeDashoffset={offsetB}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 4: Alumni & Khusus (Yellow) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#F9C846"
                        strokeWidth="18"
                        strokeDasharray={`${strokeAlumni} ${circumference}`}
                        strokeDashoffset={offsetAlumni}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Info Angka Tengah Donut */}
                    <div className="donut-chart-center-info">
                      <div className="donut-center-num">{totalSiswa}</div>
                      <div className="donut-center-sub">Siswa</div>
                    </div>
                  </div>

                  {/* Progress Legends List */}
                  <div className="progress-legends-list">

                    {/* Bar 1: Paket C SMA */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#5CB8FF' }}></span>
                          <span className="font-semibold text-slate-800">Paket C (Setara SMA)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketC}</span>
                          <span className="legend-pct-pill">{pctC}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctC}%`, backgroundColor: '#5CB8FF' }}
                        />
                      </div>
                    </div>

                    {/* Bar 2: Paket A SD */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#FFaf5c' }}></span>
                          <span className="font-semibold text-slate-800">Paket A (Setara SD)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketA}</span>
                          <span className="legend-pct-pill">{pctA}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctA}%`, backgroundColor: '#FFaf5c' }}
                        />
                      </div>
                    </div>

                    {/* Bar 3: Paket B SMP */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#6BCB77' }}></span>
                          <span className="font-semibold text-slate-800">Paket B (Setara SMP)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketB}</span>
                          <span className="legend-pct-pill">{pctB}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctB}%`, backgroundColor: '#6BCB77' }}
                        />
                      </div>
                    </div>

                    {/* Bar 4: Alumni & Khusus */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#F9C846' }}></span>
                          <span className="font-semibold text-slate-800">Alumni & Program Khusus</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countAlumni}</span>
                          <span className="legend-pct-pill">{pctAlumni}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctAlumni}%`, backgroundColor: '#F9C846' }}
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Kolom 2: Pusat Navigasi Pintas */}
              <div className="team-exec-card">
                <div className="card-title-row">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block mb-0.5">
                      Navigasi Kilat
                    </span>
                    <h3 className="card-heading-title">Pusat Navigasi Pintas</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Akses terpopuler admin ke modul operasional
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF3F9] text-[#0F3C65] border border-[#D0E2F0]">
                    4 Modul
                  </span>
                </div>

                <div className="quick-action-grid">
                  <Link to="/dashboard/siswa/ruang-belajar" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <GraduationCap size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Ruang Belajar</span>
                      <span className="quick-tile-sub">Modul & Pembelajaran</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/master-mapel" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BookMarked size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Master Mapel</span>
                      <span className="quick-tile-sub">Struktur Kurikulum</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/mapel-rombel" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <Network size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Mapel Rombel</span>
                      <span className="quick-tile-sub">Plotting & Kelas</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/tagihan" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Wallet size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Keuangan SPP</span>
                      <span className="quick-tile-sub">Status Tagihan Siswa</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/kalender-akademik" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-[#FFE500]/20 text-[#FFE500] group-hover:bg-[#FFE500] group-hover:text-black transition-all">
                      <Calendar size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Kalender Akademik</span>
                      <span className="quick-tile-sub">Agenda 1 Tahun & Jadwal</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-[#FFE500] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
          </div>

            {/* ── 5. Banner Pintasan Kalender Akademik 1 Tahun ── */}
            <div className="mt-8 p-6 bg-gradient-to-r from-[#181716] to-[#24211E] rounded-3xl border border-[#362923] shadow-xl flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE500]/10 border border-[#FFE500]/30 text-[#FFE500] flex items-center justify-center shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest text-[#FFE500] uppercase font-mono px-2 py-0.5 rounded bg-[#FFE500]/10 border border-[#FFE500]/30">
                      AGENDA PKBM
                    </span>
                    <h3 className="text-base font-bold text-white">Kalender Akademik 1 Tahun</h3>
                  </div>
                  <p className="text-xs text-[#A89284] mt-1">
                    Kelola dan pantau seluruh agenda KBM, jadwal asesmen modul, rapat tutor, dan kegiatan 1 tahun ajaran penuh.
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard/admin/kalender-akademik"
                className="px-5 py-2.5 rounded-xl bg-[#FFE500] text-black font-bold text-xs hover:bg-[#FFF04D] transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(255,229,0,0.3)]"
              >
                <span>Buka Kalender Akademik</span>
                <ChevronRight size={15} />
              </Link>
            </div>

          </div>
        </main>

      {/* Modal Popup Profile Editor */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Pengaturan Profil Pengguna</h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <ProfileEditorCard
              user={user}
              onUserUpdate={(updated) => {
                setUser(updated);
                localStorage.setItem('pkbm_user', JSON.stringify(updated));
              }}
              compact
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardAdmin;
