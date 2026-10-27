// ============================================================
// src/pages/siswa/DashboardSiswa.jsx — Dashboard Warga Belajar
// ============================================================
// Halaman utama Warga Belajar (WB) berestetika modern:
// - Tanpa kotak biru besar di section metrik
// - Pill badge berbentuk coretan spidol / highlighter organik
// - Template kartu pelajar bersih tanpa bayangan kotak hitam
// - Modal Edit Profil lengkap & stabil tanpa ajep-ajep
// - 100% bebas emoji, menggunakan vektor Lucide React
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  PencilLine,
  QrCode,
  Receipt,
  ShieldCheck,
  IdCard,
  ChevronRight,
  AlertCircle,
  Check,
  Building2
} from 'lucide-react';
import { SiswaAPI, AbsensiAPI, TagihanAPI, toAssetUrl } from '../../services/api.js';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import './DashboardSiswa.css';

// SVG Starburst Geometris (Aksen Halus)
function StarburstGraphic({ size = 32, className = '', color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      className={`starburst-svg ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M50 0 L58 25 L80 12 L73 37 L98 42 L82 60 L96 80 L72 81 L70 100 L50 88 L30 100 L28 81 L4 80 L18 60 L2 42 L27 37 L20 12 L42 25 Z" />
    </svg>
  );
}

function DashboardSiswa() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [profil, setProfil] = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [errorProfil, setErrorProfil] = useState('');

  const [rekapAbsensi, setRekapAbsensi] = useState(null);
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);

  const [tagihan, setTagihan] = useState(null);
  const [loadingTagihan, setLoadingTagihan] = useState(true);

  // Single trigger function untuk membuka modal Edit Profil tanpa duplikasi
  const [openProfileModalFn, setOpenProfileModalFn] = useState(null);

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        setLoadingProfil(true);
        const response = await SiswaAPI.getProfilSaya();
        setProfil(response.data.data);
      } catch (err) {
        const pesan = err.response?.data?.message || 'Gagal memuat profil. Silakan muat ulang halaman.';
        setErrorProfil(pesan);
      } finally {
        setLoadingProfil(false);
      }
    };

    const fetchAbsensi = async () => {
      try {
        const response = await AbsensiAPI.getRekapSaya();
        setRekapAbsensi(response.data.data);
      } catch {
        setRekapAbsensi(null);
      } finally {
        setLoadingAbsensi(false);
      }
    };

    const fetchTagihan = async () => {
      try {
        const response = await TagihanAPI.getAll();
        const semuaTagihan = response.data.data || [];
        const belumLunas = semuaTagihan.filter((t) => t.status !== 'lunas');
        setTagihan({ semua: semuaTagihan, belumLunas });
      } catch {
        setTagihan(null);
      } finally {
        setLoadingTagihan(false);
      }
    };

    fetchProfil();
    fetchAbsensi();
    fetchTagihan();
  }, []);

  if (loadingProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="edutech-loading-screen">
            <div className="edutech-loader-box">
              <StarburstGraphic size={44} color="#D4FF00" />
              <div className="edutech-loader-title">MEMUAT PORTAL WARGA BELAJAR</div>
              <div className="edutech-loader-sub">Menghubungkan basis data akademik...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (errorProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content">
            <div className="edutech-error-card">
              <AlertCircle size={44} className="edutech-error-icon" />
              <h3>Gagal Menghubungkan Data</h3>
              <p>{errorProfil}</p>
              <button
                type="button"
                className="edutech-pill-btn btn-dark"
                onClick={() => window.location.reload()}
              >
                <span>Muat Ulang Halaman</span>
                <div className="btn-circle-icon">
                  <ArrowRight size={15} />
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const namaLengkap = profil?.nama_lengkap || user.nama_lengkap || user.nama || 'Warga Belajar';
  const jenjangFormat = formatJenjang(profil?.jenjang);
  const persentaseHadir = rekapAbsensi?.persentase_hadir ?? 100;
  const tagihanTertunggak = tagihan?.belumLunas?.length ?? 0;

  return (
    <div className="app-layout edutech-theme-scope">
      <Sidebar user={user} />

      <main className="app-main">
        <div className="app-content edutech-content-flow">

          {/* ── Single Instance ProfileEditorCard Controller (Mencegah Ajep-Ajep) ── */}
          {profil && (
            <ProfileEditorCard
              user={user}
              onUserUpdate={setUser}
              onProfileUpdate={(nextProfile) => setProfil(nextProfile)}
              hideCard
              triggerRenderer={(openModal) => {
                // Simpan openModal function untuk dipakai tombol manapun
                if (!openProfileModalFn) {
                  setTimeout(() => setOpenProfileModalFn(() => openModal), 0);
                }
                return null;
              }}
            />
          )}

          {/* ── Top Bar Header ── */}
          <div className="edutech-top-bar">

            <div className="edutech-bar-right">
              <div className="edutech-date-chip">
                <Calendar size={14} />
                <span>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <button
                type="button"
                className="edutech-pill-btn btn-dark-sm"
                onClick={() => openProfileModalFn && openProfileModalFn()}
                title="Lihat & Edit Data Diri"
              >
                <PencilLine size={14} />
                <span>Edit Profil</span>
              </button>
            </div>
          </div>

          {/* ── 1. HERO BANNER: ELECTRIC LIME ── */}
          <section className="edutech-hero-section">
            <div className="edutech-hero-watermark">
              <StarburstGraphic size={120} color="#0D0F12" className="watermark-star-1" />
              <StarburstGraphic size={60} color="#2F3DF6" className="watermark-star-2" />
            </div>

            <div className="edutech-hero-content">
              <div className="edutech-hero-left">
                <h1 className="edutech-hero-headline">
                  SUKSES BELAJAR KESETARAAN <span className="scribble-pill scribble-blue headline-scribble">DI SINI!</span>
                </h1>

                <p className="edutech-hero-sub">
                  Selamat datang, <strong>{namaLengkap}</strong>. Akses seluruh modul belajar resmi, kirim tugas mingguan, dan pantau kehadiran belajar Anda secara mandiri di satu portal.
                </p>

                <div className="edutech-hero-actions">
                  <Link to="/dashboard/siswa/ruang-belajar" className="edutech-pill-btn btn-dark">
                    <span>Buka Ruang Belajar</span>
                    <div className="btn-circle-icon">
                      <ArrowRight size={15} />
                    </div>
                  </Link>

                  <Link to="/dashboard/siswa/absensi" className="edutech-pill-btn btn-blue">
                    <span>Presensi Hari Ini</span>
                    <div className="btn-circle-icon">
                      <QrCode size={15} />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Template Kartu Siswa Digital (Tanpa Bayangan Kotak Hitam) */}
              <div className="edutech-student-card-template">
                <div className="card-template-header">
                  <div className="card-template-brand">
                    <Building2 size={15} className="brand-icon" />
                    <span>PKBM BINA MANDIRI</span>
                  </div>
                  <span className="card-template-live">
                    <span className="live-dot"></span> TERVERIFIKASI
                  </span>
                </div>

                <div className="card-template-body">
                  <div className="card-template-avatar">
                    {profil?.foto_profil ? (
                      <img
                        src={toAssetUrl(profil.foto_profil)}
                        alt={`Foto ${namaLengkap}`}
                        className="template-avatar-img"
                      />
                    ) : (
                      <span className="template-avatar-initial">
                        {namaLengkap.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="card-template-info">
                    <h3 className="template-name">{namaLengkap}</h3>
                    <div className="template-meta-row">
                      <IdCard size={13} />
                      <span>NIS: <strong>{profil?.nis || 'Belum Ditetapkan'}</strong></span>
                    </div>
                    <div className="template-meta-row">
                      <GraduationCap size={13} />
                      <span>{jenjangFormat}</span>
                    </div>
                  </div>
                </div>

                <div className="card-template-footer">
                  <div className="template-footer-chip">
                    <span className="chip-caption">ROMBEL</span>
                    <span className="chip-data">{profil?.nama_rombel || 'Kelas Reguler'}</span>
                  </div>
                  <div className="template-footer-chip">
                    <span className="chip-caption">STATUS</span>
                    <span className="chip-data chip-status-active">WB AKTIF</span>
                  </div>
                </div>

                {/* Tombol Perbarui Data Diri yang Langsung Membuka Modal */}
                <button
                  type="button"
                  className="card-template-edit-link"
                  onClick={() => openProfileModalFn && openProfileModalFn()}
                >
                  <PencilLine size={13} />
                  <span>Detail & Perbarui Data Diri</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── 2. SECTION KONTROL AKADEMIK: BERSIH TANPA KOTAK BIRU ── */}
          <section className="edutech-academic-section">
            <div className="academic-section-header">
              <h2 className="academic-main-title">
                SELAMAT DATANG DI PLATFORM <span className="scribble-pill scribble-lime title-scribble">DIGITAL PKBM</span>
              </h2>
              <p className="academic-main-desc">
                Pantau rekapitulasi kehadiran, tagihan administrasi, dan data induk akademik Anda secara langsung.
              </p>
            </div>

            {/* 3 Metrik Bento Tanpa Kotak Biru & Tanpa Bayangan Hitam Tebal */}
            <div className="academic-metrics-grid">
              {/* Metrik 1: Kehadiran (Warna Biru) */}
              <div className="metric-box metric-blue-clean">
                <div className="metric-top">
                  <span className="metric-tag">KEHADIRAN</span>
                  <div className="metric-icon-circle icon-white-bg">
                    <CalendarCheck size={18} />
                  </div>
                </div>
                <div className="metric-value">
                  {loadingAbsensi ? '...' : `${persentaseHadir}%`}
                </div>
                <div className="metric-progress-line">
                  <div
                    className="metric-progress-active"
                    style={{ width: `${Math.min(100, Math.max(0, persentaseHadir))}%` }}
                  ></div>
                </div>
                <div className="metric-foot">
                  <span>Presensi Sesi Belajar</span>
                  <Link to="/dashboard/siswa/absensi" className="metric-arrow-link">
                    Detail <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Metrik 2: Tagihan SPP */}
              <div className="metric-box metric-dark-clean">
                <div className="metric-top">
                  <span className="metric-tag">ADMINISTRASI</span>
                  <div className="metric-icon-circle icon-lime-bg">
                    <Receipt size={18} />
                  </div>
                </div>
                <div className="metric-value">
                  {loadingTagihan ? '...' : tagihanTertunggak}
                  <span className="metric-unit">Tagihan</span>
                </div>
                <div className="metric-status-row">
                  {tagihanTertunggak === 0 ? (
                    <span className="status-badge-lime">
                      <CheckCircle2 size={13} /> Lunas Seluruhnya
                    </span>
                  ) : (
                    <span className="status-badge-warn">
                      <Clock size={13} /> Menunggu Pembayaran
                    </span>
                  )}
                </div>
                <div className="metric-foot">
                  <span>Iuran SPP Pendidikan</span>
                  <Link to="/dashboard/siswa/tagihan" className="metric-arrow-link">
                    Bayar <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Metrik 3: Status Warga Belajar */}
              <div className="metric-box metric-white-clean">
                <div className="metric-top">
                  <span className="metric-tag">STATUS WB</span>
                  <div className="metric-icon-circle icon-blue-bg">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div className="metric-value-title">
                  {profil?.is_aktif ? 'AKTIF' : 'TERDAFTAR'}
                </div>
                <div className="metric-sub-meta">
                  <span>Dapodik Kemendikbud</span>
                  <span className="badge-sync">
                    <Check size={12} /> Sinkron
                  </span>
                </div>
                <div className="metric-foot">
                  <span>Tahun Ajaran 2026/2027</span>
                  <span className="semester-pill">Semester 2</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// ── Helper: Format nama jenjang ──────────────────────────────
function formatJenjang(jenjang) {
  const map = {
    paket_a: 'Paket A (Setara SD)',
    paket_b: 'Paket B (Setara SMP)',
    paket_c: 'Paket C (Setara SMA)',
  };
  return map[jenjang] || jenjang || 'Paket Belajar';
}

export default DashboardSiswa;
