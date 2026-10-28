// ============================================================
// src/pages/siswa/DashboardSiswa.jsx — Dashboard Warga Belajar
// Estetika: Boutique Sapphire & Sunflower Gold (Selaras HomePage)
// 100% Bebas AI look / doodle / neon lime — Elegan & Modern
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
  PencilLine,
  QrCode,
  Receipt,
  ShieldCheck,
  IdCard,
  ChevronRight,
  AlertCircle,
  Check,
  Building2,
  Sparkles
} from 'lucide-react';
import { SiswaAPI, AbsensiAPI, TagihanAPI, toAssetUrl } from '../../services/api.js';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import './DashboardSiswa.css';

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
              <Sparkles size={40} color="#FACC15" />
              <div className="edutech-loader-title">MEMUAT PORTAL WARGA BELAJAR</div>
              <div className="edutech-loader-sub">Menghubungkan basis data akademik PKBM...</div>
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
              <h3 style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Gagal Menghubungkan Data</h3>
              <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>{errorProfil}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <span>Muat Ulang Halaman</span>
                <ArrowRight size={15} />
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

          {/* ── Single Instance ProfileEditorCard Controller ── */}
          {profil && (
            <ProfileEditorCard
              user={user}
              onUserUpdate={setUser}
              onProfileUpdate={(nextProfile) => setProfil(nextProfile)}
              hideCard
              triggerRenderer={(openModal) => {
                if (!openProfileModalFn) {
                  setTimeout(() => setOpenProfileModalFn(() => openModal), 0);
                }
                return null;
              }}
            />
          )}

          {/* ── Top Bar Header ── */}
          <div className="edutech-top-bar">
            <div className="edutech-bar-left">
              <span className="edutech-portal-pill">
                <Sparkles size={12} /> PORTAL WARGA BELAJAR
              </span>
            </div>

            <div className="edutech-bar-right">
              <div className="edutech-date-chip">
                <Calendar size={14} color="#1D4ED8" />
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
                className="edutech-pill-btn-sm"
                onClick={() => openProfileModalFn && openProfileModalFn()}
                title="Lihat & Edit Data Diri"
              >
                <PencilLine size={13} />
                <span>Edit Profil</span>
              </button>
            </div>
          </div>

          {/* ── 1. HERO BANNER: BOUTIQUE SAPPHIRE & OBSIDIAN (Selaras HomePage) ── */}
          <section className="edutech-hero-section">
            <div className="edutech-hero-content">
              <div className="edutech-hero-left">
                <div className="edutech-hero-badge">
                  <Sparkles size={12} /> PENDIDIKAN KESETARAAN RESMI
                </div>

                <h1 className="edutech-hero-headline">
                  Portal Belajar Mandiri <span className="highlight-gold">PKBM Bina Mandiri</span>
                </h1>

                <p className="edutech-hero-sub">
                  Selamat datang kembali, <strong>{namaLengkap}</strong>. Akses modul belajar interaktif, pantau tugas mingguan, dan kelola presensi pertemuan Anda secara mandiri di sini.
                </p>

                <div className="edutech-hero-actions">
                  <Link to="/dashboard/siswa/ruang-belajar" className="hero-btn-yellow">
                    <span>Buka Ruang Belajar</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/dashboard/siswa/absensi" className="hero-btn-glass">
                    <QrCode size={16} />
                    <span>Presensi Hari Ini</span>
                  </Link>
                </div>
              </div>

              {/* Template Kartu Siswa Digital Resmi */}
              <div className="edutech-student-card-template">
                <div className="card-template-header">
                  <div className="card-template-brand">
                    <Building2 size={16} className="brand-icon" />
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
                      <IdCard size={13} color="#1D4ED8" />
                      <span>NIS: <strong>{profil?.nis || 'Belum Ditetapkan'}</strong></span>
                    </div>
                    <div className="template-meta-row">
                      <GraduationCap size={13} color="#F59E0B" />
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

                <button
                  type="button"
                  className="card-template-edit-link"
                  onClick={() => openProfileModalFn && openProfileModalFn()}
                >
                  <PencilLine size={13} />
                  <span>Detail & Perbarui Profil</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── 2. SECTION KONTROL AKADEMIK: BOUTIQUE BENTO ── */}
          <section className="edutech-academic-section">
            <div className="academic-section-header">
              <h2 className="academic-main-title">
                Ringkasan Akademik & Administrasi
              </h2>
              <p className="academic-main-desc">
                Pantau capaian presensi kehadiran, tagihan SPP, dan status data pokok pendidikan Anda.
              </p>
            </div>

            {/* 3 Metrik Bento Berwarna & Berdesain */}
            <div className="academic-metrics-grid">
              {/* Metrik 1: Kehadiran (Biru) */}
              <div className="metric-box box-blue">
                <div className="metric-top">
                  <span className="metric-tag">KEHADIRAN BELAJAR</span>
                  <div className="metric-icon-circle icon-blue-bg">
                    <CalendarCheck size={19} />
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
                    Lihat Absensi <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Metrik 2: Tagihan SPP (Hijau jika lunas, Merah jika ada tunggakan) */}
              <div className={`metric-box ${tagihanTertunggak === 0 ? 'box-green' : 'box-red'}`}>
                <div className="metric-top">
                  <span className="metric-tag">KEUANGAN & SPP</span>
                  <div className={`metric-icon-circle ${tagihanTertunggak === 0 ? 'icon-emerald-bg' : 'icon-red-bg'}`}>
                    <Receipt size={19} />
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
                    <span className="status-badge-warn-red">
                      <Clock size={13} /> Menunggu Pembayaran
                    </span>
                  )}
                </div>
                <div className="metric-foot">
                  <span>Iuran Pendidikan</span>
                  <Link to="/dashboard/siswa/tagihan" className="metric-arrow-link">
                    Bayar SPP <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Metrik 3: Status Warga Belajar (Hijau / Emas) */}
              <div className="metric-box box-green">
                <div className="metric-top">
                  <span className="metric-tag">STATUS DAPODIK</span>
                  <div className="metric-icon-circle icon-emerald-bg">
                    <ShieldCheck size={19} />
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
                  <span className="semester-pill">Semester Genap</span>
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
