// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Presensi & Kehadiran Belajar Siswa
// PKBM Bina Mandiri — Jadwal Belajar Khusus: Sabtu & Minggu
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';
import { 
  CheckCircle2, Clock, AlertTriangle, CalendarCheck, FileText, 
  BookOpen, UserCheck, ShieldCheck, RefreshCw, Calendar, Sparkles,
  ArrowRight, Info, Coffee
} from 'lucide-react';
import './AbsensiSiswa.css';

const POLLING_INTERVAL = 6000;

export default function AbsensiSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // Deteksi Hari Ini (Sabtu / Minggu vs Hari Kerja)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Minggu, 6 = Sabtu, 1..5 = Senin..Jumat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = dayNames[dayOfWeek];
  const currentDateFormatted = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Hitung tanggal sesi Sabtu & Minggu terdekat
  const getUpcomingWeekendDates = () => {
    const now = new Date();
    const sabtu = new Date(now);
    const diffSabtu = (6 - now.getDay() + 7) % 7;
    sabtu.setDate(now.getDate() + (diffSabtu === 0 && now.getHours() >= 16 ? 7 : diffSabtu));

    const minggu = new Date(sabtu);
    minggu.setDate(sabtu.getDate() + 1);

    const fmt = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      sabtuStr: fmt(sabtu),
      mingguStr: fmt(minggu),
    };
  };
  const weekendDates = getUpcomingWeekendDates();

  // Tab: 'aktif' (Sesi Hari Ini) atau 'riwayat' (Daftar Pertemuan)
  const [activeTab, setActiveTab] = useState('aktif');

  // ── State: Sesi Aktif ─────────────────────────────────────
  const [sesiAktif, setSesiAktif] = useState(null);
  const [statusCi, setStatusCi] = useState(null); // 'hadir' | 'izin' | 'sakit' | 'sudah' | null
  const [catatanCi, setCatatanCi] = useState('');
  const [pilihanStatus, setPilihanStatus] = useState('hadir');
  const [loadingCi, setLoadingCi] = useState(false);
  const [feedbackCi, setFeedbackCi] = useState({ type: '', msg: '' });
  const [sisaWaktu, setSisaWaktu] = useState(0);

  // ── State: Rekap & Riwayat Pertemuan ─────────────────────
  const [rekap, setRekap] = useState(null);
  const [loadingRekap, setLoadingRekap] = useState(true);
  const [riwayatPertemuan, setRiwayatPertemuan] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [filterMapel, setFilterMapel] = useState('ALL');

  // ── Fetch Rekap Saya ──────────────────────────────────────
  const fetchRekap = async () => {
    try {
      setLoadingRekap(true);
      const res = await AbsensiAPI.getRekapSaya();
      setRekap(res.data?.data || null);
    } catch {
      setRekap(null);
    } finally {
      setLoadingRekap(false);
    }
  };

  // ── Fetch Riwayat Pertemuan LMS ───────────────────────────
  const fetchRiwayatLms = async () => {
    try {
      setLoadingRiwayat(true);
      const res = await AbsensiAPI.getRiwayatSiswaLms();
      setRiwayatPertemuan(res.data?.data || []);
    } catch (err) {
      console.error('Gagal mengambil riwayat pertemuan:', err);
    } finally {
      setLoadingRiwayat(false);
    }
  };

  useEffect(() => {
    fetchRekap();
    fetchRiwayatLms();
  }, []);

  // ── Polling Sesi Aktif ────────────────────────────────────
  const cekSesiAktif = useCallback(async () => {
    try {
      const res = await AbsensiAPI.getSesiAktif();
      const sesi = res.data?.data;
      setSesiAktif(sesi);

      if (sesi) {
        const mulai = new Date(sesi.waktu_mulai).getTime();
        const durasi = (sesi.durasi_timer || 0) * 1000;
        const selesai = mulai + durasi;
        const sisa = Math.max(0, Math.floor((selesai - Date.now()) / 1000));
        setSisaWaktu(sisa);

        const sudahCheckin = Number(sesi.sudah_checkin) === 1;
        if (sudahCheckin) {
          setStatusCi(sesi.status_kehadiran_saya || 'sudah');
          setCatatanCi(sesi.catatan_kehadiran_saya || '');
        } else {
          setStatusCi(null);
        }
      } else {
        setSisaWaktu(0);
        setStatusCi(null);
      }
    } catch {
      setSesiAktif(null);
      setSisaWaktu(0);
      setStatusCi(null);
    }
  }, []);

  useEffect(() => {
    cekSesiAktif();
    const interval = setInterval(cekSesiAktif, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [cekSesiAktif]);

  // ── Countdown Timer ───────────────────────────────────────
  useEffect(() => {
    if (!sesiAktif || sisaWaktu <= 0) return;
    const tick = setInterval(() => {
      setSisaWaktu((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [sesiAktif, sisaWaktu > 0]);

  // ── Submit Kehadiran Mandiri ──────────────────────────────
  const handleCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!sesiAktif || sisaWaktu <= 0) return;

    setLoadingCi(true);
    setFeedbackCi({ type: '', msg: '' });
    try {
      await AbsensiAPI.checkIn(sesiAktif.id, {
        status: pilihanStatus,
        catatan: catatanCi.trim()
      });

      setStatusCi(pilihanStatus);
      setFeedbackCi({
        type: 'success',
        msg: `Presensi [${pilihanStatus.toUpperCase()}] berhasil dikonfirmasi ke sistem.`
      });

      await fetchRekap();
      await fetchRiwayatLms();
      await cekSesiAktif();
    } catch (err) {
      setFeedbackCi({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal menyimpan presensi. Silakan coba lagi.'
      });
    } finally {
      setLoadingCi(false);
    }
  };

  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const warnaTimer = sisaWaktu > 60 ? '#059669' : sisaWaktu > 20 ? '#D97706' : '#DC2626';

  // Daftar mapel unik untuk filter riwayat
  const listMapel = Array.from(new Set(riwayatPertemuan.map(item => item.nama_mapel).filter(Boolean)));
  const riwayatFiltered = filterMapel === 'ALL' 
    ? riwayatPertemuan 
    : riwayatPertemuan.filter(item => item.nama_mapel === filterMapel);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="absensi-siswa-page">

          {/* ── 1. Top Header Banner ── */}
          <div className="absensi-header-card">
            <div>
              <div className="absensi-header-badge">
                <CalendarCheck size={14} />
                <span>KBM PKBM BINA MANDIRI: SABTU & MINGGU</span>
              </div>
              <h1 className="absensi-header-title">
                Presensi & Log Kehadiran Belajar
              </h1>
              <p className="absensi-header-subtitle">
                Konfirmasi kehadiran sesi akhir pekan (Sabtu & Minggu) secara mandiri dan pantau capaian presensi Anda.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => { cekSesiAktif(); fetchRekap(); fetchRiwayatLms(); }}
              className="absensi-refresh-btn"
            >
              <RefreshCw size={15} />
              <span>Muat Ulang Data</span>
            </button>
          </div>

          {/* ── 2. Weekend Schedule Notice / Reminder Banner ── */}
          <div className="weekend-schedule-banner">
            <div className="weekend-schedule-left">
              <div className="weekend-schedule-icon">
                {isWeekend ? <Sparkles size={24} /> : <Coffee size={24} />}
              </div>
              <div>
                <h3 className="weekend-schedule-title">
                  {isWeekend 
                    ? `Hari Ini Sesi Belajar KBM (${currentDayName}, ${today.getDate()} ${today.toLocaleDateString('id-ID', { month: 'short' })})` 
                    : `Hari Ini ${currentDayName} • Waktu Belajar Mandiri`}
                </h3>
                <p className="weekend-schedule-desc">
                  {isWeekend 
                    ? `Selamat belajar di sesi akhir pekan PKBM Bina Mandiri. Pastikan mengisi presensi pada mata pelajaran yang sedang aktif!`
                    : `Jadwal tatap muka dan kelas interaktif berlangsung setiap hari Sabtu & Minggu. Anda dapat mempelajari materi modul di Ruang Belajar.`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="weekend-schedule-pill">
                <span>Sabtu: {weekendDates.sabtuStr}</span>
              </div>
              <div className="weekend-schedule-pill">
                <span>Minggu: {weekendDates.mingguStr}</span>
              </div>
              {!isWeekend && (
                <NavLink 
                  to="/dashboard/siswa/ruang-belajar" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#1D4ED8',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <span>Buka Ruang Belajar</span>
                  <ArrowRight size={14} />
                </NavLink>
              )}
            </div>
          </div>

          {/* ── 3. Academic Summary Stats Cards ── */}
          <div className="absensi-stats-grid">
            <div className="absensi-stat-card">
              <div className="absensi-stat-val" style={{ color: '#1D4ED8' }}>
                {rekap?.total_pertemuan ?? '0'}
              </div>
              <div className="absensi-stat-label">Total Sesi</div>
            </div>

            <div className="absensi-stat-card">
              <div className="absensi-stat-val" style={{ color: '#059669' }}>
                {rekap?.hadir ?? '0'}
              </div>
              <div className="absensi-stat-label">Hadir</div>
            </div>

            <div className="absensi-stat-card">
              <div className="absensi-stat-val" style={{ color: '#D97706' }}>
                {rekap?.izin ?? '0'}
              </div>
              <div className="absensi-stat-label">Izin</div>
            </div>

            <div className="absensi-stat-card">
              <div className="absensi-stat-val" style={{ color: '#2563EB' }}>
                {rekap?.sakit ?? '0'}
              </div>
              <div className="absensi-stat-label">Sakit</div>
            </div>

            <div className="absensi-stat-card">
              <div className="absensi-stat-val" style={{ color: '#DC2626' }}>
                {rekap?.alpa ?? '0'}
              </div>
              <div className="absensi-stat-label">Alpa</div>
            </div>

            <div className="absensi-stat-card absensi-stat-percentage">
              <div className="title">Tingkat Kehadiran</div>
              <div className="val" style={{ color: (rekap?.persentase_hadir ?? 0) >= 75 ? '#34D399' : '#F87171' }}>
                {rekap?.persentase_hadir ?? 0}%
              </div>
              <div className="status-text" style={{ color: (rekap?.persentase_hadir ?? 0) >= 75 ? '#A7F3D0' : '#FECACA' }}>
                {(rekap?.persentase_hadir ?? 0) >= 75 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} />
                    <span>Memenuhi Syarat Evaluasi (≥75%)</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={13} />
                    <span>Di bawah batas minimal 75%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. Navigation Tabs ── */}
          <div className="absensi-tabs-nav">
            <button
              type="button"
              onClick={() => setActiveTab('aktif')}
              className={`absensi-tab-btn ${activeTab === 'aktif' ? 'active' : ''}`}
            >
              <Clock size={17} />
              <span>Sesi Belajar Hari Ini {isWeekend ? `(${currentDayName})` : ''}</span>
              {sesiAktif && <span className="absensi-tab-badge"></span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className={`absensi-tab-btn ${activeTab === 'riwayat' ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>Buku Riwayat Pertemuan ({riwayatPertemuan.length})</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════
              TAB 1: SESI BELAJAR HARI INI (CHECK-IN MANDIRI)
          ══════════════════════════════════════════════════════ */}
          {activeTab === 'aktif' && (
            <div className="absensi-active-card">
              {!sesiAktif ? (
                /* Empty state ketika tidak ada sesi aktif */
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <div style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: '#F8FAFC',
                    border: '2px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    color: '#94A3B8'
                  }}>
                    <CalendarCheck size={36} />
                  </div>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.35rem', color: '#1E293B', marginBottom: 8 }}>
                    {isWeekend 
                      ? `Belum Ada Sesi Presensi yang Terbuka untuk Hari ${currentDayName}` 
                      : `Sesi Belajar Terbuka di Akhir Pekan (Sabtu & Minggu)`}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                    {isWeekend
                      ? `Tutor pengampu akan membuka sesi presensi mandiri saat jam pembelajaran dimulai. Halaman ini akan mendeteksi sinyal presensi secara otomatis.`
                      : `Saat ini adalah hari ${currentDayName}. Sesi tatap muka dan presensi langsung dibuka setiap hari Sabtu dan Minggu sesuai jadwal rombel Anda.`}
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0284C7', background: '#E0F2FE', padding: '8px 18px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800 }}>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#0284C7' }}></div>
                    <span>Memantau pembukaan sesi belajar otomatis...</span>
                  </div>
                </div>
              ) : (
                /* Ada Sesi Aktif */
                <div>
                  {/* Sesi Header Info */}
                  <div className="sesi-meta-bar">
                    <div>
                      <div className="sesi-pills-row">
                        <span className="pill-pertemuan">
                          PERTEMUAN KE-{sesiAktif.pertemuan_ke || 1}
                        </span>
                        <span className="pill-weekend">
                          JADWAL {currentDayName.toUpperCase()}
                        </span>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 800 }}>
                          {sesiAktif.mode === 'mandiri' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <UserCheck size={13} />
                              <span>Presensi Mandiri Siswa</span>
                            </span>
                          ) : (
                            'Manual Tutor'
                          )}
                        </span>
                      </div>
                      <h2 className="sesi-title">
                        {sesiAktif.nama_mapel || sesiAktif.nama_rombel || 'Mata Pelajaran Aktif'}
                      </h2>
                      <div className="sesi-subinfo">
                        Kelas: <strong>{sesiAktif.nama_rombel || '-'}</strong> • Tutor: <strong>{sesiAktif.nama_tutor || 'Tutor PKBM'}</strong>
                      </div>
                    </div>

                    {/* Timer Widget */}
                    <div className="sesi-timer-box" style={{ borderColor: sisaWaktu > 0 ? warnaTimer : '#E2E8F0' }}>
                      <div className="sesi-timer-circle" style={{ border: `3px solid ${warnaTimer}`, color: warnaTimer }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.3px' }}>
                          Sisa Waktu Presensi
                        </div>
                        <div className="sesi-timer-number" style={{ color: warnaTimer }}>
                          {sisaWaktu > 0 ? formatTimer(sisaWaktu) : '00:00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Toast */}
                  {feedbackCi.msg && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 18px',
                      borderRadius: 12,
                      background: feedbackCi.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                      color: feedbackCi.type === 'success' ? '#166534' : '#991B1B',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      marginBottom: '1.5rem'
                    }}>
                      {feedbackCi.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <span>{feedbackCi.msg}</span>
                    </div>
                  )}

                  {/* Form Submission / Verified State */}
                  {statusCi ? (
                    /* Sudah Melakukan Presensi */
                    <div className="absensi-verified-box">
                      <div className="absensi-verified-avatar">
                        <ShieldCheck size={38} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Presensi Belajar Telah Dikonfirmasi
                        </div>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.45rem', fontWeight: 900, color: '#14532D', margin: '4px 0' }}>
                          Status: {statusCi.toUpperCase()}
                        </h3>
                        {catatanCi && (
                          <div style={{ fontSize: '0.88rem', color: '#166534', marginTop: 6, fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '6px 16px', borderRadius: 10, display: 'inline-block' }}>
                            "{catatanCi}"
                          </div>
                        )}
                        <p style={{ fontSize: '0.84rem', color: '#15803D', marginTop: 10 }}>
                          Kehadiran Anda telah tersimpan secara resmi di buku catatan akademik PKBM Bina Mandiri.
                        </p>
                      </div>

                      {/* Tombol ganti keterangan jika timer masih jalan */}
                      {sisaWaktu > 0 && (
                        <button
                          type="button"
                          onClick={() => setStatusCi(null)}
                          style={{
                            background: '#FFFFFF',
                            border: '1.5px solid #86EFAC',
                            padding: '7px 16px',
                            borderRadius: 10,
                            color: '#15803D',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            marginTop: 6
                          }}
                        >
                          Ubah Status / Catatan Kehadiran
                        </button>
                      )}
                    </div>
                  ) : sisaWaktu <= 0 ? (
                    /* Waktu Habis */
                    <div style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #FECACA',
                      borderRadius: '16px',
                      padding: '1.75rem',
                      textAlign: 'center',
                      color: '#991B1B'
                    }}>
                      <AlertTriangle size={36} style={{ margin: '0 auto 8px', color: '#DC2626' }} />
                      <h4 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.15rem', margin: '4px 0' }}>
                        Waktu Check-In Sesi Telah Berakhir
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#7F1D1D', maxWidth: 460, margin: '0 auto' }}>
                        Batas waktu presensi mandiri untuk sesi ini telah ditutup. Bila Anda berhalangan hadir atau ada kendala teknis, silakan hubungi tutor pengampu kelas.
                      </p>
                    </div>
                  ) : (
                    /* Form Input Presensi Siswa */
                    <form onSubmit={handleCheckIn}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#334155', marginBottom: 12 }}>
                          Pilih Status Kehadiran Anda Hari Ini:
                        </label>
                        <div className="status-options-grid">
                          {/* Hadir */}
                          <label className={`status-option-label ${pilihanStatus === 'hadir' ? 'selected hadir' : ''}`}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="hadir"
                              checked={pilihanStatus === 'hadir'}
                              onChange={() => setPilihanStatus('hadir')}
                              style={{ width: 18, height: 18, accentColor: '#059669' }}
                            />
                            <div>
                              <div className="status-option-title" style={{ color: '#065F46' }}>Hadir di Sesi Belajar</div>
                              <div className="status-option-desc">Mengikuti pembelajaran penuh</div>
                            </div>
                          </label>

                          {/* Izin */}
                          <label className={`status-option-label ${pilihanStatus === 'izin' ? 'selected izin' : ''}`}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="izin"
                              checked={pilihanStatus === 'izin'}
                              onChange={() => setPilihanStatus('izin')}
                              style={{ width: 18, height: 18, accentColor: '#D97706' }}
                            />
                            <div>
                              <div className="status-option-title" style={{ color: '#92400E' }}>Izin Belajar</div>
                              <div className="status-option-desc">Ada keperluan / dispensasi</div>
                            </div>
                          </label>

                          {/* Sakit */}
                          <label className={`status-option-label ${pilihanStatus === 'sakit' ? 'selected sakit' : ''}`}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="sakit"
                              checked={pilihanStatus === 'sakit'}
                              onChange={() => setPilihanStatus('sakit')}
                              style={{ width: 18, height: 18, accentColor: '#2563EB' }}
                            />
                            <div>
                              <div className="status-option-title" style={{ color: '#1E40AF' }}>Sakit</div>
                              <div className="status-option-desc">Kondisi kesehatan kurang baik</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Input Catatan jika Izin/Sakit atau opsional hadir */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                          Catatan / Alasan {pilihanStatus !== 'hadir' && <span style={{ color: '#DC2626' }}>*</span>}:
                        </label>
                        <input
                          type="text"
                          value={catatanCi}
                          onChange={(e) => setCatatanCi(e.target.value)}
                          placeholder={
                            pilihanStatus === 'hadir'
                              ? 'Opsional: misal "Hadir tepat waktu di kelas"'
                              : pilihanStatus === 'izin'
                              ? 'Alasan izin (misal: lembur kerja, keperluan keluarga mendesak)'
                              : 'Keterangan sakit (misal: demam, flu, kontrol dokter)'
                          }
                          required={pilihanStatus !== 'hadir'}
                          style={{
                            width: '100%',
                            padding: '0.8rem 1.1rem',
                            borderRadius: 12,
                            border: '1.5px solid #CBD5E1',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Tombol Submit */}
                      <button
                        type="submit"
                        disabled={loadingCi}
                        className="absensi-submit-btn"
                      >
                        {loadingCi ? (
                          <>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }}></div>
                            <span>Memproses Presensi...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={20} />
                            <span>KIRIM PRESENSI PERTEMUAN KE-{sesiAktif.pertemuan_ke || 1}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB 2: BUKU RIWAYAT PERTEMUAN LMS (SABTU & MINGGU)
          ══════════════════════════════════════════════════════ */}
          {activeTab === 'riwayat' && (
            <div className="absensi-riwayat-card">
              <div className="riwayat-header-row">
                <div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    Log & Buku Pertemuan Sesi Belajar
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: 4 }}>
                    Catatan kehadiran Anda pada seluruh sesi akhir pekan (Sabtu & Minggu) semester ini.
                  </p>
                </div>

                {/* Filter Mapel */}
                {listMapel.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>Filter Mapel:</span>
                    <select
                      value={filterMapel}
                      onChange={(e) => setFilterMapel(e.target.value)}
                      style={{
                        padding: '0.5rem 0.95rem',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        outline: 'none',
                        background: '#F8FAFC'
                      }}
                    >
                      <option value="ALL">Semua Mata Pelajaran ({riwayatPertemuan.length})</option>
                      {listMapel.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Table List */}
              {loadingRiwayat ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                  <div style={{ color: '#64748B', fontSize: '0.88rem' }}>Memuat riwayat pertemuan...</div>
                </div>
              ) : riwayatFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                  <FileText size={42} style={{ margin: '0 auto 10px', color: '#CBD5E1' }} />
                  <div style={{ fontWeight: 800, color: '#475569', fontSize: '1.05rem' }}>Belum Ada Catatan Pertemuan</div>
                  <div style={{ fontSize: '0.86rem', marginTop: 4 }}>
                    Pertemuan akan dicatat secara otomatis setelah pengajar membuka sesi absensi di hari Sabtu & Minggu.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="riwayat-table">
                    <thead>
                      <tr>
                        <th>Pertemuan</th>
                        <th>Mata Pelajaran</th>
                        <th>Hari & Tanggal</th>
                        <th>Tutor Pembimbing</th>
                        <th>Status Kehadiran</th>
                        <th>Keterangan / Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayatFiltered.map((p, idx) => {
                        const status = (p.status || 'alpa').toLowerCase();
                        let badgeClass = 'alpa';
                        let badgeText = 'ALPA';

                        if (status === 'hadir') {
                          badgeClass = 'hadir';
                          badgeText = 'HADIR';
                        } else if (status === 'izin') {
                          badgeClass = 'izin';
                          badgeText = 'IZIN';
                        } else if (status === 'sakit') {
                          badgeClass = 'sakit';
                          badgeText = 'SAKIT';
                        }

                        const dateObj = p.waktu_mulai ? new Date(p.waktu_mulai) : null;
                        const dateStr = dateObj
                          ? dateObj.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-';

                        return (
                          <tr key={p.id || idx}>
                            <td style={{ fontWeight: 900, color: '#1E293B' }}>
                              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>
                                P-{p.pertemuan_ke || (idx + 1)}
                              </span>
                            </td>
                            <td style={{ fontWeight: 800, color: '#0F172A' }}>
                              {p.nama_mapel || 'Pelajaran Umum'}
                            </td>
                            <td style={{ color: '#475569', fontSize: '0.84rem' }}>
                              {dateStr}
                            </td>
                            <td style={{ color: '#475569', fontSize: '0.84rem', fontWeight: 600 }}>
                              {p.nama_tutor || '-'}
                            </td>
                            <td>
                              <span className={`badge-kehadiran ${badgeClass}`}>
                                {badgeText}
                              </span>
                            </td>
                            <td style={{ color: '#64748B', fontSize: '0.84rem' }}>
                              {p.catatan || (status === 'hadir' ? 'Hadir di sesi kelas' : '-')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
