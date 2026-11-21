// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Presensi & Kehadiran Belajar Siswa
// PKBM Bina Mandiri — Jadwal Belajar Khusus: Sabtu & Minggu
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';
import { 
  CheckCircle2, Clock, AlertTriangle, CalendarCheck, 
  BookOpen, UserCheck, ShieldCheck, RefreshCw, 
  ArrowRight, Coffee
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

  // Tab Navigasi Menu Kelas: 'pertemuan' | 'report' (Sesuai Mockup)
  const [activeTab, setActiveTab] = useState('pertemuan');

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
        let sisa = 0;
        if (sesi.sisa_timer_detik !== undefined && sesi.sisa_timer_detik !== null) {
          sisa = Math.max(0, Number(sesi.sisa_timer_detik));
        } else {
          const mulai = new Date(sesi.waktu_mulai).getTime();
          const durasi = (sesi.durasi_timer || 0) * 1000;
          const selesai = mulai + durasi;
          sisa = Math.max(0, Math.floor((selesai - Date.now()) / 1000));
        }
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
    if (!sesiAktif) return;

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

  // Daftar mapel unik untuk filter riwayat
  const listMapel = Array.from(new Set(riwayatPertemuan.map(item => item.nama_mapel).filter(Boolean)));
  const riwayatFiltered = filterMapel === 'ALL' 
    ? riwayatPertemuan 
    : riwayatPertemuan.filter(item => item.nama_mapel === filterMapel);

  // Standar Semester PKBM: 14 Pertemuan (Sesuai Desain Mockup)
  const TOTAL_SEMESTER_PERTEMUAN = 14;

  // Bentuk array 14 pertemuan semester dengan menggabungkan data aktual
  const daftarPertemuan = Array.from({ length: TOTAL_SEMESTER_PERTEMUAN }, (_, i) => {
    const pertKe = i + 1;
    const isActive = sesiAktif && Number(sesiAktif.pertemuan_ke || 1) === pertKe;
    const riwayatItem = riwayatPertemuan.find(r => Number(r.pertemuan_ke) === pertKe);

    return {
      pertemuan_ke: pertKe,
      judul: `Pertemuan ${pertKe} Sesi 1`,
      subjudul: 'Sesi Pembelajaran Mandiri & Tatap Muka',
      isActive: Boolean(isActive),
      statusPresensi: riwayatItem?.status_kehadiran || (isActive && statusCi ? statusCi : null),
      catatan: riwayatItem?.catatan_siswa || (isActive && catatanCi ? catatanCi : ''),
      namaMapel: riwayatItem?.nama_mapel || (isActive ? sesiAktif.nama_mapel : 'Mata Pelajaran Umum'),
      namaTutor: riwayatItem?.nama_tutor || (isActive ? sesiAktif.nama_tutor : 'Tutor Pembimbing'),
      isClosed: !isActive && !riwayatItem
    };
  });

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content absensi-siswa-page">

          {/* ── 1. Top Header Banner ── */}
          <div className="absensi-header-card">
            <div>
              <div className="absensi-header-badge">
                <CalendarCheck size={13} />
                <span>KBM PKBM BINA MANDIRI</span>
              </div>
              <h1 className="absensi-header-title">
                Presensi & Log Kehadiran Belajar
              </h1>
              <p className="absensi-header-subtitle">
                Akses presensi pertemuan dan laporan rekapitulasi kehadiran warga belajar.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => { cekSesiAktif(); fetchRekap(); fetchRiwayatLms(); }}
              className="absensi-refresh-btn"
            >
              <RefreshCw size={14} />
              <span>Muat Ulang Data</span>
            </button>
          </div>

          {/* ── 2. Weekend Notice Capsule ── */}
          <div className="weekend-schedule-banner">
            <div className="weekend-schedule-left">
              <div className="weekend-schedule-icon">
                {isWeekend ? <CalendarCheck size={20} /> : <Coffee size={20} />}
              </div>
              <div>
                <h3 className="weekend-schedule-title">
                  {isWeekend 
                    ? `Hari Ini Sesi Belajar KBM (${currentDayName})` 
                    : `Hari Ini ${currentDayName} • Waktu Belajar Mandiri`}
                </h3>
                <p className="weekend-schedule-desc">
                  {isWeekend 
                    ? `Selamat belajar di sesi akhir pekan PKBM Bina Mandiri. Pastikan mengisi presensi pada mata pelajaran yang sedang aktif!`
                    : `Jadwal tatap muka dan kelas interaktif berlangsung setiap hari Sabtu & Minggu. Anda dapat mempelajari materi modul di Ruang Belajar.`}
                </p>
              </div>
            </div>

            <div className="weekend-schedule-right">
              <div className="weekend-schedule-pill">
                <span>Sabtu: {weekendDates.sabtuStr}</span>
              </div>
              <div className="weekend-schedule-pill">
                <span>Minggu: {weekendDates.mingguStr}</span>
              </div>
              {!isWeekend && (
                <NavLink 
                  to="/dashboard/siswa/ruang-belajar" 
                  className="weekend-schedule-cta"
                >
                  <span>Buka Ruang Belajar</span>
                  <ArrowRight size={13} />
                </NavLink>
              )}
            </div>
          </div>

          {/* ── 3. Layout Dua Kolom: MENU KELAS (Kiri) & KONTEN (Kanan) Sesuai Mockup ── */}
          <div className="menu-kelas-layout">
            
            {/* ══ SISI KIRI: MENU KELAS (HANYA PERTEMUAN & REPORT PRESENSI) ══ */}
            <aside className="menu-kelas-sidebar">
              <div className="menu-kelas-title">MENU KELAS</div>

              {/* Menu 1: Pertemuan */}
              <button
                type="button"
                onClick={() => setActiveTab('pertemuan')}
                className={`menu-kelas-btn ${activeTab === 'pertemuan' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <BookOpen size={18} />
                  <span>Pertemuan</span>
                </div>
                <span className="menu-kelas-badge">{TOTAL_SEMESTER_PERTEMUAN}</span>
              </button>

              {/* Menu 2: Report Presensi */}
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`menu-kelas-btn ${activeTab === 'report' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <CalendarCheck size={18} />
                  <span>Report Presensi</span>
                </div>
                <span className="menu-kelas-badge">
                  {rekap?.persentase_hadir !== undefined ? `${rekap.persentase_hadir}%` : 'Rekap'}
                </span>
              </button>
            </aside>

            {/* ══ SISI KANAN: KONTEN UTAMA ══ */}
            <section className="menu-kelas-content">
              {activeTab === 'pertemuan' ? (
                /* ── TAB PERTEMUAN KELAS (SESUAI MOCKUP GAMBAR 1) ── */
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">Pertemuan kelas</h2>
                      <p className="pertemuan-sub-main">
                        Pilih pertemuan untuk melihat materi dan melakukan aktivitas presensi kehadiran.
                      </p>
                    </div>
                    <span className="pertemuan-count-pill">
                      {TOTAL_SEMESTER_PERTEMUAN} pertemuan
                    </span>
                  </div>

                  {/* Sesi Presensi Aktif Hari Ini (Bisa Langsung Check-in) */}
                  {sesiAktif && isWeekend && (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '16px',
                      padding: '1.25rem 1.4rem',
                      marginBottom: '1.5rem',
                      boxShadow: '0 4px 14px rgba(22, 101, 52, 0.06)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '3px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 800 }}>
                            🟢 Sesi Presensi Buka
                          </span>
                          <strong style={{ fontSize: '0.98rem', color: '#166534' }}>
                            {sesiAktif.nama_mapel || 'Mata Pelajaran Aktif'} (Pertemuan {sesiAktif.pertemuan_ke || 1})
                          </strong>
                        </div>
                      </div>

                      {feedbackCi.msg && (
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: feedbackCi.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                          color: feedbackCi.type === 'success' ? '#166534' : '#991B1B',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          marginBottom: 12
                        }}>
                          {feedbackCi.msg}
                        </div>
                      )}

                      {statusCi ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#15803D', fontWeight: 800, fontSize: '0.92rem' }}>
                          <CheckCircle2 size={20} />
                          <span>Kehadiran Anda Telah Dikonfirmasi: <strong>{statusCi.toUpperCase()}</strong></span>
                        </div>
                      ) : (
                        <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {['hadir', 'izin', 'sakit'].map((st) => (
                              <label
                                key={st}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '7px 14px',
                                  borderRadius: 10,
                                  border: pilihanStatus === st ? '2px solid #059669' : '1.5px solid #CBD5E1',
                                  background: pilihanStatus === st ? '#ECFDF5' : '#FFFFFF',
                                  color: pilihanStatus === st ? '#065F46' : '#334155',
                                  fontWeight: 800,
                                  fontSize: '0.84rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="pilihanStatus"
                                  value={st}
                                  checked={pilihanStatus === st}
                                  onChange={() => setPilihanStatus(st)}
                                  style={{ accentColor: '#059669' }}
                                />
                                <span>{st.toUpperCase()}</span>
                              </label>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={catatanCi}
                              onChange={(e) => setCatatanCi(e.target.value)}
                              placeholder="Catatan kehadiran (opsional)..."
                              style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #CBD5E1',
                                fontSize: '0.84rem',
                                outline: 'none'
                              }}
                            />
                            <button
                              type="submit"
                              disabled={loadingCi}
                              style={{
                                padding: '8px 20px',
                                borderRadius: 10,
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                cursor: 'pointer'
                              }}
                            >
                              {loadingCi ? 'Menyimpan...' : 'Check-In Sekarang'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {!isWeekend && (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: '1.25rem',
                      color: '#475569'
                    }}>
                      <Coffee size={20} style={{ color: '#64748B', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
                        <strong>Presensi KBM Ditutup (Senin – Jumat).</strong> Sesi presensi interaktif dibuka otomatis pada hari <strong>Sabtu dan Minggu</strong> sesuai jadwal pembelajaran resmi PKBM Bina Mandiri.
                      </div>
                    </div>
                  )}

                  {/* 14 Pertemuan Cards List (Identik Mockup 1) */}
                  <div className="pertemuan-list-grid">
                    {daftarPertemuan.map((pert) => {
                      const numStr = String(pert.pertemuan_ke).padStart(2, '0');
                      const isHadir = pert.statusPresensi === 'hadir';
                      const isIzinSakit = pert.statusPresensi === 'izin' || pert.statusPresensi === 'sakit';

                      return (
                        <div
                          key={pert.pertemuan_ke}
                          className={`pertemuan-item-card ${pert.isActive ? 'is-active-card' : ''}`}
                        >
                          <div className="pertemuan-item-left">
                            <div className="pertemuan-number-box">
                              {numStr}
                            </div>
                            <div>
                              <div className="pertemuan-item-title-row">
                                <span className="pertemuan-item-title">
                                  {pert.judul}
                                </span>
                                {pert.isActive ? (
                                  <span className="pertemuan-badge-open">
                                    🟢 Buka Presensi
                                  </span>
                                ) : isHadir ? (
                                  <span className="pertemuan-badge-hadir">
                                    ✓ Hadir
                                  </span>
                                ) : isIzinSakit ? (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                    {pert.statusPresensi.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="pertemuan-badge-closed">
                                    Closed
                                  </span>
                                )}
                              </div>
                              <p className="pertemuan-item-desc">
                                <span>{pert.subjudul}</span>
                                {pert.namaMapel && (
                                  <span>• {pert.namaMapel}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            {pert.isActive && !pert.statusPresensi ? (
                              <button
                                type="button"
                                onClick={() => {
                                  window.scrollTo({ top: 180, behavior: 'smooth' });
                                }}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: 10,
                                  background: '#0284C7',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Absen Sekarang
                              </button>
                            ) : pert.statusPresensi ? (
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isHadir ? '#16A34A' : '#D97706' }}>
                                {pert.statusPresensi.toUpperCase()}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                                Terjadwal
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── TAB REPORT PRESENSI (REKAP DATA) ── */
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">Report Presensi Warga Belajar</h2>
                      <p className="pertemuan-sub-main">
                        Laporan rekapitulasi kehadiran belajar Anda di setiap pertemuan semester ini.
                      </p>
                    </div>
                    {listMapel.length > 0 && (
                      <select
                        value={filterMapel}
                        onChange={(e) => setFilterMapel(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 10,
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          background: '#F8FAFC',
                          outline: 'none'
                        }}
                      >
                        <option value="ALL">Semua Mata Pelajaran</option>
                        {listMapel.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Ringkasan Minimalist Bar (Tanpa Kotak-Kotak Besar) */}
                  <div className="report-summary-bar">
                    <span className="report-summary-item">Total Sesi: <strong>{TOTAL_SEMESTER_PERTEMUAN}</strong></span>
                    <span>•</span>
                    <span className="report-summary-item" style={{ color: '#16A34A' }}>Hadir: <strong>{rekap?.hadir ?? 0}</strong></span>
                    <span>•</span>
                    <span className="report-summary-item" style={{ color: '#D97706' }}>Izin: <strong>{rekap?.izin ?? 0}</strong></span>
                    <span>•</span>
                    <span className="report-summary-item" style={{ color: '#2563EB' }}>Sakit: <strong>{rekap?.sakit ?? 0}</strong></span>
                    <span>•</span>
                    <span className="report-summary-item" style={{ color: '#DC2626' }}>Alpa: <strong>{rekap?.alpa ?? 0}</strong></span>
                    <span>•</span>
                    <span className="report-summary-item" style={{ color: '#0284C7' }}>Tingkat Kehadiran: <strong>{rekap?.persentase_hadir ?? 100}%</strong></span>
                  </div>

                  {/* Tabel Report Presensi */}
                  <div className="riwayat-desktop-table">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="riwayat-table">
                        <thead>
                          <tr>
                            <th>Pertemuan</th>
                            <th>Mata Pelajaran</th>
                            <th>Tutor Pengampu</th>
                            <th>Status Kehadiran</th>
                            <th>Keterangan / Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daftarPertemuan.map((p, idx) => {
                            const status = (p.statusPresensi || 'alpa').toLowerCase();
                            let badgeClass = 'alpa';
                            let badgeText = 'ALPA';
                            if (status === 'hadir') { badgeClass = 'hadir'; badgeText = 'HADIR'; }
                            else if (status === 'izin') { badgeClass = 'izin'; badgeText = 'IZIN'; }
                            else if (status === 'sakit') { badgeClass = 'sakit'; badgeText = 'SAKIT'; }
                            else if (p.isClosed) { badgeClass = 'closed'; badgeText = 'TERJADWAL'; }

                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 800, color: '#1E293B' }}>
                                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800 }}>
                                    Pertemuan {p.pertemuan_ke}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700, color: '#0F172A' }}>
                                  {p.namaMapel}
                                </td>
                                <td style={{ color: '#475569', fontSize: '0.84rem' }}>
                                  {p.namaTutor}
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
                  </div>

                  {/* Versi Mobile Cards untuk Report */}
                  <div className="riwayat-mobile-list d-md-none">
                    {daftarPertemuan.map((p, idx) => {
                      const status = (p.statusPresensi || 'alpa').toLowerCase();
                      let badgeClass = 'alpa';
                      let badgeText = 'ALPA';
                      if (status === 'hadir') { badgeClass = 'hadir'; badgeText = 'HADIR'; }
                      else if (status === 'izin') { badgeClass = 'izin'; badgeText = 'IZIN'; }
                      else if (status === 'sakit') { badgeClass = 'sakit'; badgeText = 'SAKIT'; }
                      else if (p.isClosed) { badgeClass = 'closed'; badgeText = 'TERJADWAL'; }

                      return (
                        <div key={idx} className="riwayat-mobile-card">
                          <div className="riwayat-mobile-card-header">
                            <span className="riwayat-mobile-pertemuan">Pertemuan {p.pertemuan_ke}</span>
                            <span className={`badge-kehadiran ${badgeClass}`}>{badgeText}</span>
                          </div>
                          <h4 className="riwayat-mobile-mapel">{p.namaMapel}</h4>
                          <div className="riwayat-mobile-meta">
                            <span>Tutor: {p.namaTutor}</span>
                          </div>
                          {p.catatan && (
                            <div className="riwayat-mobile-note">
                              <strong>Catatan:</strong> {p.catatan}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
