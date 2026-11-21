// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Presensi & Kehadiran Belajar Siswa
// PKBM Bina Mandiri — Jadwal Belajar Khusus: 20 Sesi Sabtu & 20 Sesi Minggu
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';
import { 
  CheckCircle2, Clock, CalendarCheck, 
  BookOpen, RefreshCw, ArrowRight, Coffee, Filter
} from 'lucide-react';
import './AbsensiSiswa.css';

const POLLING_INTERVAL = 6000;
const TOTAL_SESI_PER_HARI = 20; // 20 Pertemuan Sabtu & 20 Pertemuan Minggu

export default function AbsensiSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // Deteksi Hari Ini (Sabtu / Minggu vs Hari Kerja)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Minggu, 6 = Sabtu, 1..5 = Senin..Jumat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = dayNames[dayOfWeek];

  // Tab Navigasi Menu Kelas: 'sabtu' | 'minggu' | 'report' (Default sesuai hari saat ini)
  const [activeTab, setActiveTab] = useState(dayOfWeek === 0 ? 'minggu' : 'sabtu');

  // Filter untuk Report Presensi: 'ALL' | 'Sabtu' | 'Minggu'
  const [filterHariReport, setFilterHariReport] = useState('ALL');

  // ── State: Sesi Aktif ─────────────────────────────────────
  const [sesiAktif, setSesiAktif] = useState(null);
  const [statusCi, setStatusCi] = useState(null); // 'hadir' | 'izin' | 'sakit' | 'sudah' | null
  const [catatanCi, setCatatanCi] = useState('');
  const [pilihanStatus, setPilihanStatus] = useState('hadir');
  const [loadingCi, setLoadingCi] = useState(false);
  const [feedbackCi, setFeedbackCi] = useState({ type: '', msg: '' });
  const [sisaWaktu, setSisaWaktu] = useState(0);

  // ── State: Riwayat Pertemuan ──────────────────────────────
  const [riwayatPertemuan, setRiwayatPertemuan] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

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

  // ── Logika Status Presensi Sesuai Aturan PKBM: ─────────────
  // 1. Sebelum admin buka absen: "Menunggu Pertemuan Dibuka" (BUKAN ALPA)
  // 2. Admin buka presensi: siswa dapat check-in (Hadir / Izin / Sakit) sebelum jam 17.00 WIB
  // 3. Lebih dari jam 17.00 WIB atau sesi selesai tanpa presensi -> ALPA
  const resolveStatusPresensi = useCallback((riwayatItem, isTodayActive) => {
    // A. Jika admin belum pernah membuka sesi ini sama sekali
    if (!riwayatItem && !isTodayActive) {
      return {
        key: 'menunggu',
        label: 'Menunggu Dibuka',
        badgeClass: 'menunggu',
        tableText: 'Menunggu Dibuka'
      };
    }

    // B. Cek apakah ada status check-in yang sudah disubmit
    const rawStatus = String(
      (isTodayActive && statusCi) || riwayatItem?.status_kehadiran || ''
    ).toLowerCase();

    if (rawStatus === 'hadir') {
      return { key: 'hadir', label: 'HADIR', badgeClass: 'hadir', tableText: 'HADIR' };
    }
    if (rawStatus === 'izin') {
      return { key: 'izin', label: 'IZIN', badgeClass: 'izin', tableText: 'IZIN' };
    }
    if (rawStatus === 'sakit') {
      return { key: 'sakit', label: 'SAKIT', badgeClass: 'sakit', tableText: 'SAKIT' };
    }

    // C. Jika admin sudah buka sesi ini tetapi siswa belum klik absen:
    // Cek batas jam 17.00 WIB
    const now = new Date();
    const currHour = now.getHours();
    const isSesiHariIni = Boolean(isTodayActive);

    // Jika status_kehadiran dari server adalah 'buka' atau sesi hari ini aktif sebelum jam 17.00 WIB
    if (rawStatus === 'buka' || (isSesiHariIni && currHour < 17 && rawStatus !== 'alpa')) {
      return {
        key: 'buka',
        label: '🟢 Buka Presensi',
        badgeClass: 'buka',
        tableText: '🟢 BUKA PRESENSI'
      };
    }

    // Jika sudah lewat jam 17.00 WIB atau sesi telah ditutup/selesai tanpa absen -> ALPA
    return {
      key: 'alpa',
      label: 'ALPA',
      badgeClass: 'alpa',
      tableText: 'ALPA'
    };
  }, [statusCi]);

  // ── 20 Pertemuan Sabtu ────────────────────────────────────
  const daftarSabtu = useMemo(() => {
    return Array.from({ length: TOTAL_SESI_PER_HARI }, (_, i) => {
      const pertKe = i + 1;
      const isTodayActive = isWeekend && dayOfWeek === 6 && sesiAktif && Number(sesiAktif.pertemuan_ke || 1) === pertKe;
      const riwayatItem = riwayatPertemuan.find(r => {
        const matchP = Number(r.pertemuan_ke) === pertKe;
        if (!matchP) return false;
        const catatan = (r.catatan_sesi || '').toLowerCase();
        if (catatan.includes('sabtu')) return true;
        if (catatan.includes('minggu')) return false;
        if (r.tanggal) {
          const parts = r.tanggal.split('T')[0].split('-').map(Number);
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d.getDay() === 6;
        }
        return true;
      });

      const statusInfo = resolveStatusPresensi(riwayatItem, isTodayActive);

      return {
        id: `sabtu-${pertKe}`,
        hari: 'Sabtu',
        pertemuan_ke: pertKe,
        judul: `Pertemuan ${pertKe} Sesi Sabtu`,
        subjudul: 'Sesi Pembelajaran Tatap Muka & Mandiri',
        isActive: Boolean(isTodayActive),
        statusInfo: statusInfo,
        rawStatus: riwayatItem?.status_kehadiran || (isTodayActive && statusCi ? statusCi : null)
      };
    });
  }, [riwayatPertemuan, sesiAktif, isWeekend, dayOfWeek, statusCi, resolveStatusPresensi]);

  // ── 20 Pertemuan Minggu ───────────────────────────────────
  const daftarMinggu = useMemo(() => {
    return Array.from({ length: TOTAL_SESI_PER_HARI }, (_, i) => {
      const pertKe = i + 1;
      const isTodayActive = isWeekend && dayOfWeek === 0 && sesiAktif && Number(sesiAktif.pertemuan_ke || 1) === pertKe;
      const riwayatItem = riwayatPertemuan.find(r => {
        const matchP = Number(r.pertemuan_ke) === pertKe;
        if (!matchP) return false;
        const catatan = (r.catatan_sesi || '').toLowerCase();
        if (catatan.includes('minggu')) return true;
        if (catatan.includes('sabtu')) return false;
        if (r.tanggal) {
          const parts = r.tanggal.split('T')[0].split('-').map(Number);
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d.getDay() === 0;
        }
        return false;
      });

      const statusInfo = resolveStatusPresensi(riwayatItem, isTodayActive);

      return {
        id: `minggu-${pertKe}`,
        hari: 'Minggu',
        pertemuan_ke: pertKe,
        judul: `Pertemuan ${pertKe} Sesi Minggu`,
        subjudul: 'Sesi Pembelajaran Tatap Muka & Mandiri',
        isActive: Boolean(isTodayActive),
        statusInfo: statusInfo,
        rawStatus: riwayatItem?.status_kehadiran || (isTodayActive && statusCi ? statusCi : null)
      };
    });
  }, [riwayatPertemuan, sesiAktif, isWeekend, dayOfWeek, statusCi, resolveStatusPresensi]);

  // ── Gabungan 40 Pertemuan untuk Report Presensi ────────────
  const semuaPertemuan = useMemo(() => {
    return [...daftarSabtu, ...daftarMinggu];
  }, [daftarSabtu, daftarMinggu]);

  // Filtered untuk Report Presensi
  const riwayatFiltered = useMemo(() => {
    if (filterHariReport === 'Sabtu') return daftarSabtu;
    if (filterHariReport === 'Minggu') return daftarMinggu;
    return semuaPertemuan;
  }, [semuaPertemuan, daftarSabtu, daftarMinggu, filterHariReport]);

  // Hitungan Rekapitulasi Presensi
  const countHadir = semuaPertemuan.filter(p => p.statusInfo.key === 'hadir').length;
  const countIzin = semuaPertemuan.filter(p => p.statusInfo.key === 'izin').length;
  const countSakit = semuaPertemuan.filter(p => p.statusInfo.key === 'sakit').length;
  const countAlpa = semuaPertemuan.filter(p => p.statusInfo.key === 'alpa').length;
  const countMenunggu = semuaPertemuan.filter(p => p.statusInfo.key === 'menunggu').length;
  const totalSesi = TOTAL_SESI_PER_HARI * 2; // 40 sesi
  const totalSelesai = countHadir + countIzin + countSakit + countAlpa;
  const persenHadir = totalSelesai > 0 ? Math.round((countHadir / totalSelesai) * 100) : 100;

  // Sesi yang aktif di tab pertemuan
  const currentList = activeTab === 'minggu' ? daftarMinggu : daftarSabtu;
  const isSelectedDayToday = (activeTab === 'sabtu' && dayOfWeek === 6) || (activeTab === 'minggu' && dayOfWeek === 0);

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
                Jadwal KBM: 20 Pertemuan Hari Sabtu & 20 Pertemuan Hari Minggu (Batas Check-in s/d 17.00 WIB).
              </p>
            </div>

            <button 
              type="button"
              onClick={() => { cekSesiAktif(); fetchRiwayatLms(); }}
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
                    ? `Presensi dibuka otomatis pada hari KBM. Pastikan mengisi presensi mandiri sebelum pukul 17.00 WIB agar tidak terhitung Alpa.`
                    : `Jadwal tatap muka dan kelas interaktif berlangsung setiap hari Sabtu & Minggu (sebelum pukul 17.00 WIB). Anda dapat mempelajari modul di Ruang Belajar.`}
                </p>
              </div>
            </div>

            <div className="weekend-schedule-right">
              <div className="weekend-schedule-pill">
                <span>20 Pertemuan Sabtu</span>
              </div>
              <div className="weekend-schedule-pill">
                <span>20 Pertemuan Minggu</span>
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

          {/* ── 3. Layout: MENU KELAS & KONTEN ── */}
          <div className="menu-kelas-layout">
            
            {/* ══ MENU KELAS: NAVIGASI TAB (SABTU, MINGGU, REPORT PRESENSI) ══ */}
            <aside className="menu-kelas-sidebar">
              <div className="menu-kelas-title">MENU KELAS</div>

              {/* Menu 1: Pertemuan Sabtu */}
              <button
                type="button"
                onClick={() => setActiveTab('sabtu')}
                className={`menu-kelas-btn ${activeTab === 'sabtu' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <BookOpen size={18} />
                  <span>Pertemuan Sabtu</span>
                </div>
                <span className="menu-kelas-badge">{TOTAL_SESI_PER_HARI}</span>
              </button>

              {/* Menu 2: Pertemuan Minggu */}
              <button
                type="button"
                onClick={() => setActiveTab('minggu')}
                className={`menu-kelas-btn ${activeTab === 'minggu' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <BookOpen size={18} />
                  <span>Pertemuan Minggu</span>
                </div>
                <span className="menu-kelas-badge">{TOTAL_SESI_PER_HARI}</span>
              </button>

              {/* Menu 3: Report Presensi */}
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
                  {totalSesi} Sesi
                </span>
              </button>
            </aside>

            {/* ══ SISI KANAN: KONTEN UTAMA ══ */}
            <section className="menu-kelas-content">
              {activeTab === 'sabtu' || activeTab === 'minggu' ? (
                /* ── TAB PERTEMUAN (SABTU ATAU MINGGU) ── */
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">
                        {activeTab === 'sabtu' ? 'Pertemuan Kelas — Sesi Sabtu' : 'Pertemuan Kelas — Sesi Minggu'}
                      </h2>
                      <p className="pertemuan-sub-main">
                        {activeTab === 'sabtu' 
                          ? 'Daftar 20 sesi pembelajaran hari Sabtu. Presensi dibuka pada hari KBM sebelum pukul 17.00 WIB.'
                          : 'Daftar 20 sesi pembelajaran hari Minggu. Presensi dibuka pada hari KBM sebelum pukul 17.00 WIB.'}
                      </p>
                    </div>
                    <span className="pertemuan-count-pill">
                      {TOTAL_SESI_PER_HARI} pertemuan
                    </span>
                  </div>

                  {/* Switch Bar Hari Sabtu / Minggu */}
                  <div className="hari-switch-bar">
                    <button
                      type="button"
                      onClick={() => setActiveTab('sabtu')}
                      className={`hari-switch-btn ${activeTab === 'sabtu' ? 'active' : ''}`}
                    >
                      <BookOpen size={16} />
                      <span>Sesi Hari Sabtu</span>
                      <span className="hari-switch-pill">20 Sesi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('minggu')}
                      className={`hari-switch-btn ${activeTab === 'minggu' ? 'active' : ''}`}
                    >
                      <BookOpen size={16} />
                      <span>Sesi Hari Minggu</span>
                      <span className="hari-switch-pill">20 Sesi</span>
                    </button>
                  </div>

                  {/* Sesi Presensi Aktif Hari Ini (Bisa Langsung Check-in Sebelum Jam 17.00) */}
                  {sesiAktif && isWeekend && isSelectedDayToday && (
                    <div className="sesi-aktif-checkin-box">
                      <div className="sesi-aktif-header">
                        <span className="badge-sesi-live">
                          🟢 Sesi Presensi Buka
                        </span>
                        <strong className="sesi-aktif-mapel-title">
                          {sesiAktif.nama_mapel || 'Mata Pelajaran Aktif'} (Pertemuan {sesiAktif.pertemuan_ke || 1})
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#166534', marginLeft: 'auto', fontWeight: 700 }}>
                          ⏰ Batas Presensi: s/d 17.00 WIB
                        </span>
                      </div>

                      {feedbackCi.msg && (
                        <div className={`feedback-alert-box ${feedbackCi.type === 'success' ? 'success' : 'error'}`}>
                          {feedbackCi.msg}
                        </div>
                      )}

                      {statusCi ? (
                        <div className="checkin-success-confirmed">
                          <CheckCircle2 size={20} />
                          <span>Kehadiran Anda Telah Dikonfirmasi: <strong>{statusCi.toUpperCase()}</strong></span>
                        </div>
                      ) : (
                        <form onSubmit={handleCheckIn} className="checkin-form-container">
                          <div className="checkin-options-grid">
                            {[
                              { key: 'hadir', label: 'HADIR' },
                              { key: 'izin', label: 'IZIN' },
                              { key: 'sakit', label: 'SAKIT' }
                            ].map((opt) => (
                              <label
                                key={opt.key}
                                className={`checkin-radio-card ${pilihanStatus === opt.key ? 'selected' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="pilihanStatus"
                                  value={opt.key}
                                  checked={pilihanStatus === opt.key}
                                  onChange={() => setPilihanStatus(opt.key)}
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>

                          <div className="checkin-action-row">
                            <input
                              type="text"
                              value={catatanCi}
                              onChange={(e) => setCatatanCi(e.target.value)}
                              placeholder="Catatan kehadiran (opsional)..."
                              className="checkin-input-note"
                            />
                            <button
                              type="submit"
                              disabled={loadingCi}
                              className="checkin-submit-btn"
                            >
                              {loadingCi ? 'Menyimpan...' : 'Check-In Sekarang'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {!isWeekend && (
                    <div className="weekday-closed-notice">
                      <Coffee size={20} className="weekday-closed-icon" />
                      <div className="weekday-closed-text">
                        <strong>Presensi KBM Ditutup (Senin – Jumat).</strong> Sesi presensi interaktif dibuka otomatis pada hari <strong>Sabtu (20 Pertemuan)</strong> dan <strong>Minggu (20 Pertemuan)</strong> sebelum pukul 17.00 WIB sesuai jadwal pembelajaran resmi PKBM Bina Mandiri.
                      </div>
                    </div>
                  )}

                  {/* 20 Pertemuan Cards List (Identik Mockup, Tanpa Tanggal) */}
                  <div className="pertemuan-list-grid">
                    {currentList.map((pert) => {
                      const numStr = String(pert.pertemuan_ke).padStart(2, '0');
                      const { key, label, badgeClass } = pert.statusInfo;

                      return (
                        <div
                          key={pert.id}
                          className={`pertemuan-item-card ${key === 'buka' ? 'is-active-card' : ''}`}
                        >
                          <div className="pertemuan-item-left">
                            <div className="pertemuan-number-box">
                              {numStr}
                            </div>
                            <div className="pertemuan-item-body">
                              <div className="pertemuan-item-title-row">
                                <span className="pertemuan-item-title">
                                  {pert.judul}
                                </span>
                                {key === 'buka' ? (
                                  <span className="pertemuan-badge-open">
                                    🟢 Buka Presensi
                                  </span>
                                ) : key === 'hadir' ? (
                                  <span className="pertemuan-badge-hadir">
                                    ✓ Hadir
                                  </span>
                                ) : key === 'izin' || key === 'sakit' ? (
                                  <span className="badge-kehadiran-inline izin">
                                    {label}
                                  </span>
                                ) : key === 'alpa' ? (
                                  <span className="pertemuan-badge-closed">
                                    ALPA
                                  </span>
                                ) : (
                                  <span className="pertemuan-badge-closed" style={{ background: '#F1F5F9', color: '#64748B', borderColor: '#E2E8F0' }}>
                                    Menunggu Dibuka
                                  </span>
                                )}
                              </div>
                              <p className="pertemuan-item-desc">
                                <span>{pert.subjudul}</span>
                              </p>
                            </div>
                          </div>

                          <div className="pertemuan-item-action">
                            {key === 'buka' && !pert.rawStatus ? (
                              <button
                                type="button"
                                onClick={() => {
                                  window.scrollTo({ top: 180, behavior: 'smooth' });
                                }}
                                className="btn-absen-sekarang"
                              >
                                Absen Sekarang
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── TAB REPORT PRESENSI (HANYA: SESI HARI, PERTEMUAN, KETERANGAN PRESENSI) ── */
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">Report Presensi Warga Belajar</h2>
                      <p className="pertemuan-sub-main">
                        Laporan presensi 40 sesi pembelajaran (Batas check-in s/d 17.00 WIB di hari KBM).
                      </p>
                    </div>

                    {/* Filter Hari */}
                    <div className="report-filter-wrapper">
                      <Filter size={14} style={{ color: '#64748B' }} />
                      <select
                        value={filterHariReport}
                        onChange={(e) => setFilterHariReport(e.target.value)}
                        className="report-filter-select"
                      >
                        <option value="ALL">Semua Sesi (40 Pertemuan)</option>
                        <option value="Sabtu">Khusus Hari Sabtu (20 Sesi)</option>
                        <option value="Minggu">Khusus Hari Minggu (20 Sesi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Ringkasan Bar Minimalis & Mobile-Friendly */}
                  <div className="report-summary-bar">
                    <div className="report-summary-card total full-width">
                      <span className="summary-lbl">Total Sesi Semester</span>
                      <strong className="summary-val">{totalSesi} <span className="summary-sub">(20 Sabtu + 20 Minggu)</span></strong>
                    </div>
                    <div className="report-summary-card hadir">
                      <span className="summary-lbl">Hadir (Masuk)</span>
                      <strong className="summary-val">{countHadir} Hari</strong>
                    </div>
                    <div className="report-summary-card izin">
                      <span className="summary-lbl">Izin</span>
                      <strong className="summary-val">{countIzin}</strong>
                    </div>
                    <div className="report-summary-card sakit">
                      <span className="summary-lbl">Sakit</span>
                      <strong className="summary-val">{countSakit}</strong>
                    </div>
                    <div className="report-summary-card alpa">
                      <span className="summary-lbl">Alpa (&gt;17.00)</span>
                      <strong className="summary-val">{countAlpa}</strong>
                    </div>
                    <div className="report-summary-card menunggu">
                      <span className="summary-lbl">Menunggu Dibuka</span>
                      <strong className="summary-val">{countMenunggu}</strong>
                    </div>
                    <div className="report-summary-card persentase">
                      <span className="summary-lbl">Total Masuk</span>
                      <strong className="summary-val">{countHadir} Hari</strong>
                    </div>
                  </div>

                  {/* ══ TABEL DESKTOP REPORT PRESENSI (HANYA 3 KOLOM) ══ */}
                  <div className="report-desktop-table">
                    <table className="riwayat-table">
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>Sesi Hari</th>
                          <th style={{ width: '38%' }}>Pertemuan</th>
                          <th style={{ width: '40%' }}>Keterangan Presensi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayatFiltered.map((p) => {
                          const { badgeClass, tableText } = p.statusInfo;

                          return (
                            <tr key={p.id}>
                              <td>
                                <span className={p.hari === 'Sabtu' ? 'badge-hari-sabtu' : 'badge-hari-minggu'}>
                                  {p.hari}
                                </span>
                              </td>
                              <td>
                                <span className="pertemuan-table-pill">
                                  Pertemuan {p.pertemuan_ke}
                                </span>
                              </td>
                              <td>
                                <span className={`badge-kehadiran ${badgeClass}`}>
                                  {tableText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ══ TAMPILAN MOBILE LIST REPORT PRESENSI (RESPONSIF & RAPIH) ══ */}
                  <div className="report-mobile-list">
                    {riwayatFiltered.map((p) => {
                      const { badgeClass, tableText } = p.statusInfo;

                      return (
                        <div key={p.id} className="report-mobile-row">
                          <div className="report-mobile-row-left">
                            <span className={p.hari === 'Sabtu' ? 'badge-hari-sabtu' : 'badge-hari-minggu'}>
                              {p.hari}
                            </span>
                            <span className="report-mobile-pertemuan">
                              Pertemuan {p.pertemuan_ke}
                            </span>
                          </div>
                          <span className={`badge-kehadiran ${badgeClass}`}>
                            {tableText}
                          </span>
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
