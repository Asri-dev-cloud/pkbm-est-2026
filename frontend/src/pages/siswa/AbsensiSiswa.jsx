// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Presensi & Kehadiran LMS Siswa
// ============================================================
// Sistem presensi ala LMS Perkuliahan (Moodle / SIAKAD):
// 1. Tab Sesi Aktif: Realtime countdown, pilihan Hadir / Izin / Sakit + Catatan
// 2. Tab Riwayat Pertemuan: Rekap log pertemuan 1..16 per mata pelajaran
// 3. Status Kehadiran Akademik & Indikator Batas 75% Syarat Evaluasi
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';
import { 
  CheckCircle2, Clock, AlertTriangle, CalendarCheck, FileText, 
  HelpCircle, BookOpen, UserCheck, ShieldCheck, RefreshCw, XCircle, ChevronRight
} from 'lucide-react';

const POLLING_INTERVAL = 6000;

export default function AbsensiSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // Tab: 'aktif' (Sesi Check-In Realtime) atau 'riwayat' (Daftar Pertemuan LMS)
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

  const warnaTimer = sisaWaktu > 60 ? '#10B981' : sisaWaktu > 20 ? '#F59E0B' : '#EF4444';

  // Daftar mapel unik untuk filter riwayat
  const listMapel = Array.from(new Set(riwayatPertemuan.map(item => item.nama_mapel).filter(Boolean)));
  const riwayatFiltered = filterMapel === 'ALL' 
    ? riwayatPertemuan 
    : riwayatPertemuan.filter(item => item.nama_mapel === filterMapel);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '1.75rem 2rem', maxWidth: '1240px', margin: '0 auto' }}>

          {/* ── Page Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
                <CalendarCheck size={14} /> PORTAL AKADEMIK LMS
              </div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '1.95rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Presensi & Log Kehadiran Belajar
              </h1>
              <p style={{ color: '#64748B', marginTop: 6, fontSize: '0.92rem' }}>
                Konfirmasi kehadiran perkuliahan secara mandiri dan pantau histori pertemuan semester ini.
              </p>
            </div>

            {/* Quick Action Refresh */}
            <button 
              onClick={() => { cekSesiAktif(); fetchRekap(); fetchRiwayatLms(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '0.6rem 1.1rem', borderRadius: 10, background: '#F8FAFC',
                border: '1px solid #E2E8F0', color: '#334155', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
            >
              <RefreshCw size={15} /> Muat Ulang Data
            </button>
          </div>

          {/* ── Academic Summary Stats Cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '1.75rem'
          }}>
            <StatCard label="Total Sesi" value={rekap?.total_pertemuan ?? '0'} color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" />
            <StatCard label="Hadir" value={rekap?.hadir ?? '0'} color="#059669" bg="#ECFDF5" border="#A7F3D0" />
            <StatCard label="Izin" value={rekap?.izin ?? '0'} color="#D97706" bg="#FFFBEB" border="#FDE68A" />
            <StatCard label="Sakit" value={rekap?.sakit ?? '0'} color="#2563EB" bg="#F0F9FF" border="#BAE6FD" />
            <StatCard label="Alpa / Kosong" value={rekap?.alpa ?? '0'} color="#DC2626" bg="#FEF2F2" border="#FECACA" />
            <div style={{
              padding: '1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(15,23,42,0.1)'
            }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8', fontWeight: 700 }}>
                Persentase Kehadiran
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: (rekap?.persentase_hadir ?? 0) >= 75 ? '#34D399' : '#F87171', marginTop: 2 }}>
                {rekap?.persentase_hadir ?? 0}%
              </div>
              <div style={{ fontSize: '0.72rem', color: (rekap?.persentase_hadir ?? 0) >= 75 ? '#A7F3D0' : '#FECACA', marginTop: 2 }}>
                {(rekap?.persentase_hadir ?? 0) >= 75 ? '✓ Memenuhi Syarat Evaluasi' : '⚠ Di bawah batas 75%'}
              </div>
            </div>
          </div>

          {/* ── Navigation Tabs ── */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #E2E8F0', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('aktif')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.75rem 1.25rem',
                border: 'none', background: 'transparent',
                borderBottom: activeTab === 'aktif' ? '3px solid #1D4ED8' : '3px solid transparent',
                marginBottom: -2,
                color: activeTab === 'aktif' ? '#1D4ED8' : '#64748B',
                fontWeight: activeTab === 'aktif' ? 800 : 600,
                fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <Clock size={17} />
              <span>Sesi Presensi Aktif</span>
              {sesiAktif && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('riwayat')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.75rem 1.25rem',
                border: 'none', background: 'transparent',
                borderBottom: activeTab === 'riwayat' ? '3px solid #1D4ED8' : '3px solid transparent',
                marginBottom: -2,
                color: activeTab === 'riwayat' ? '#1D4ED8' : '#64748B',
                fontWeight: activeTab === 'riwayat' ? 800 : 600,
                fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <BookOpen size={17} />
              <span>Daftar & Rekap Pertemuan ({riwayatPertemuan.length})</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════
              TAB 1: SESI PRESENSI AKTIF (CHECK-IN MANDIRI)
          ══════════════════════════════════════════════════════ */}
          {activeTab === 'aktif' && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '2.25rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              marginBottom: '2rem'
            }}>
              {!sesiAktif ? (
                /* Empty state ketika tidak ada sesi aktif */
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{
                    width: 74, height: 74, borderRadius: '50%',
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem', color: '#94A3B8'
                  }}>
                    <CalendarCheck size={36} />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1E293B', marginBottom: 8 }}>
                    Belum Ada Sesi Presensi Aktif
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                    Sesi presensi akan terbuka secara otomatis saat pengajar/tutor mengaktifkan absensi di jam perkuliahan. Halaman ini terus memantau realtime.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0284C7', background: '#EBF6FF', padding: '7px 16px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#0284C7' }}></div>
                    <span>Memantau sinyal kehadiran kelas aktif...</span>
                  </div>
                </div>
              ) : (
                /* Ada Sesi Aktif */
                <div>
                  {/* Sesi Header Info */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid #F1F5F9',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ background: '#1D4ED8', color: 'white', padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 800 }}>
                          PERTEMUAN KE-{sesiAktif.pertemuan_ke || 1}
                        </span>
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>
                          {sesiAktif.mode === 'mandiri' ? '⚡ Presensi Mandiri Siswa' : 'Manual Pengajar'}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                        {sesiAktif.nama_mapel || sesiAktif.nama_rombel || 'Mata Pelajaran Aktif'}
                      </h2>
                      <div style={{ fontSize: '0.86rem', color: '#64748B', marginTop: 4 }}>
                        Kelas: <strong>{sesiAktif.nama_rombel || '-'}</strong> • Tutor: <strong>{sesiAktif.nama_tutor || 'Pengajar Akademik'}</strong>
                      </div>
                    </div>

                    {/* Timer Widget */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '0.75rem 1.25rem',
                      borderRadius: 16,
                      background: '#F8FAFC',
                      border: `2px solid ${sisaWaktu > 0 ? warnaTimer : '#E2E8F0'}`
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: `3px solid ${warnaTimer}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: warnaTimer, fontWeight: 900, fontSize: '0.9rem'
                      }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                          Sisa Waktu Check-In
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: warnaTimer, lineHeight: 1.1 }}>
                          {sisaWaktu > 0 ? formatTimer(sisaWaktu) : '00:00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Toast */}
                  {feedbackCi.msg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 18px', borderRadius: 12,
                      background: feedbackCi.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                      color: feedbackCi.type === 'success' ? '#166534' : '#991B1B',
                      fontSize: '0.88rem', fontWeight: 700, marginBottom: '1.5rem'
                    }}>
                      {feedbackCi.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      <span>{feedbackCi.msg}</span>
                    </div>
                  )}

                  {/* Form Submission / Verified State */}
                  {statusCi ? (
                    /* Sudah Melakukan Presensi */
                    <div style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '16px',
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 12
                    }}>
                      <div style={{
                        width: 62, height: 62, borderRadius: '50%',
                        background: '#DCFCE7', color: '#16A34A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <ShieldCheck size={36} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Konfirmasi Kehadiran Terverifikasi
                        </div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#14532D', margin: '4px 0' }}>
                          Status: {statusCi.toUpperCase()}
                        </h3>
                        {catatanCi && (
                          <div style={{ fontSize: '0.88rem', color: '#166534', marginTop: 4, fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 8 }}>
                            "{catatanCi}"
                          </div>
                        )}
                        <p style={{ fontSize: '0.82rem', color: '#4ADE80', marginTop: 8 }}>
                          Tercatat di server perkuliahan. Anda dapat melanjutkan pembelajaran LMS.
                        </p>
                      </div>

                      {/* Tombol ganti keterangan jika timer masih jalan */}
                      {sisaWaktu > 0 && (
                        <button
                          onClick={() => setStatusCi(null)}
                          style={{
                            background: 'white',
                            border: '1px solid #BBF7D0',
                            padding: '6px 14px',
                            borderRadius: 8,
                            color: '#15803D',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: 4
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
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: '#991B1B'
                    }}>
                      <AlertTriangle size={36} style={{ margin: '0 auto 8px', color: '#DC2626' }} />
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '4px 0' }}>
                        Waktu Check-In Telah Berakhir
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#7F1D1D', maxWidth: 460, margin: '0 auto' }}>
                        Batas waktu presensi mandiri untuk pertemuan ini telah ditutup oleh sistem. Hubungi tutor atau admin akademik bila ada kendala kehadiran.
                      </p>
                    </div>
                  ) : (
                    /* Form Input Presensi Siswa */
                    <form onSubmit={handleCheckIn}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: 10 }}>
                          Pilih Status Kehadiran Anda Hari Ini:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                          {/* Hadir */}
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '1rem', borderRadius: 14,
                            border: pilihanStatus === 'hadir' ? '2px solid #059669' : '1.5px solid #E2E8F0',
                            background: pilihanStatus === 'hadir' ? '#ECFDF5' : '#F8FAFC',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="hadir"
                              checked={pilihanStatus === 'hadir'}
                              onChange={() => setPilihanStatus('hadir')}
                              style={{ width: 18, height: 18, accentColor: '#059669' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>Hadir di Kelas</div>
                              <div style={{ fontSize: '0.76rem', color: '#047857' }}>Mengikuti sesi penuh</div>
                            </div>
                          </label>

                          {/* Izin */}
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '1rem', borderRadius: 14,
                            border: pilihanStatus === 'izin' ? '2px solid #D97706' : '1.5px solid #E2E8F0',
                            background: pilihanStatus === 'izin' ? '#FFFBEB' : '#F8FAFC',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="izin"
                              checked={pilihanStatus === 'izin'}
                              onChange={() => setPilihanStatus('izin')}
                              style={{ width: 18, height: 18, accentColor: '#D97706' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.95rem' }}>Izin</div>
                              <div style={{ fontSize: '0.76rem', color: '#B45309' }}>Keperluan / dispensasi</div>
                            </div>
                          </label>

                          {/* Sakit */}
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '1rem', borderRadius: 14,
                            border: pilihanStatus === 'sakit' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                            background: pilihanStatus === 'sakit' ? '#EFF6FF' : '#F8FAFC',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}>
                            <input
                              type="radio"
                              name="statusPresensi"
                              value="sakit"
                              checked={pilihanStatus === 'sakit'}
                              onChange={() => setPilihanStatus('sakit')}
                              style={{ width: 18, height: 18, accentColor: '#2563EB' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.95rem' }}>Sakit</div>
                              <div style={{ fontSize: '0.76rem', color: '#1D4ED8' }}>Kondisi kurang sehat</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Input Catatan jika Izin/Sakit atau opsional hadir */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                          Catatan / Keterangan Tambahan {pilihanStatus !== 'hadir' && <span style={{ color: '#DC2626' }}>*</span>}:
                        </label>
                        <input
                          type="text"
                          value={catatanCi}
                          onChange={(e) => setCatatanCi(e.target.value)}
                          placeholder={
                            pilihanStatus === 'hadir'
                              ? 'Opsional: misal "Hadir tepat waktu"'
                              : pilihanStatus === 'izin'
                              ? 'Alasan izin (misal: urusan keluarga, dinas kerja)'
                              : 'Keterangan sakit (misal: demam, flu, opname)'
                          }
                          required={pilihanStatus !== 'hadir'}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: 10,
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
                        style={{
                          width: '100%',
                          padding: '0.95rem',
                          borderRadius: 12,
                          background: '#1D4ED8',
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '1rem',
                          border: 'none',
                          cursor: loadingCi ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          boxShadow: '0 4px 14px rgba(29,78,216,0.3)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => !loadingCi && (e.currentTarget.style.background = '#1E40AF')}
                        onMouseLeave={(e) => !loadingCi && (e.currentTarget.style.background = '#1D4ED8')}
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
              TAB 2: DAFTAR & LOG PERTEMUAN LMS (P1 s/d P16)
          ══════════════════════════════════════════════════════ */}
          {activeTab === 'riwayat' && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              {/* Filter Sub-header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Log & Matriks Pertemuan Semester
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 3 }}>
                    Riwayat setiap sesi pertemuan mata pelajaran yang diselenggarakan tutor kelas Anda.
                  </p>
                </div>

                {/* Filter Mapel */}
                {listMapel.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Filter Mapel:</span>
                    <select
                      value={filterMapel}
                      onChange={(e) => setFilterMapel(e.target.value)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: 8,
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        outline: 'none'
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
                  <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Memuat riwayat pertemuan...</div>
                </div>
              ) : riwayatFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                  <FileText size={42} style={{ margin: '0 auto 10px', color: '#CBD5E1' }} />
                  <div style={{ fontWeight: 700, color: '#475569', fontSize: '1rem' }}>Belum Ada Catatan Pertemuan</div>
                  <div style={{ fontSize: '0.84rem', marginTop: 4 }}>
                    Pertemuan akan dicatat secara otomatis setelah pengajar membuka sesi absensi.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '12px 14px' }}>Pertemuan</th>
                        <th style={{ padding: '12px 14px' }}>Mata Pelajaran</th>
                        <th style={{ padding: '12px 14px' }}>Tanggal & Jam</th>
                        <th style={{ padding: '12px 14px' }}>Pengajar</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                        <th style={{ padding: '12px 14px' }}>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayatFiltered.map((p, idx) => {
                        const status = (p.status || 'alpa').toLowerCase();
                        let badgeStyle = { bg: '#FEF2F2', color: '#DC2626', label: 'ALPA / TIDAK HADIR' };
                        if (status === 'hadir') badgeStyle = { bg: '#DCFCE7', color: '#15803D', label: 'HADIR' };
                        if (status === 'izin') badgeStyle = { bg: '#FEF3C7', color: '#B45309', label: 'IZIN' };
                        if (status === 'sakit') badgeStyle = { bg: '#E0F2FE', color: '#0369A1', label: 'SAKIT' };

                        const dateStr = p.waktu_mulai 
                          ? new Date(p.waktu_mulai).toLocaleDateString('id-ID', {
                              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : '-';

                        return (
                          <tr key={p.id || idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1E293B' }}>
                              <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem' }}>
                                P-{p.pertemuan_ke || (idx + 1)}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                              {p.nama_mapel || 'Pelajaran Umum'}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.82rem' }}>
                              {dateStr}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.84rem' }}>
                              {p.nama_tutor || '-'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: badgeStyle.bg,
                                color: badgeStyle.color
                              }}>
                                {badgeStyle.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.82rem' }}>
                              {p.catatan || (status === 'hadir' ? 'Check-in tervalidasi' : '-')}
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

function StatCard({ label, value, color, bg, border }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '1rem',
      background: bg,
      borderRadius: '16px',
      border: `1.5px solid ${border}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4, fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}
