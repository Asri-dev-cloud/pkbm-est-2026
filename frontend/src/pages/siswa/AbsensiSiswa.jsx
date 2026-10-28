// ============================================================
// src/pages/siswa/AbsensiSiswa.jsx — Check-In Absensi Mandiri
// ============================================================
// FITUR KRITIS: WB melakukan check-in mandiri jika Tutor
// mengaktifkan sesi absensi mandiri (ada token + timer aktif).
//
// Alur:
//  1. Halaman polling GET /api/absensi/sesi-aktif tiap 5 detik
//     (untuk WB: endpoint ini digunakan untuk cek sesi di rombel WB)
//  2. Jika ada sesi mandiri aktif → tampilkan tombol Check-In + timer
//  3. WB klik Check-In → POST /api/absensi/sesi/:sesiId/checkin
//  4. Tampilkan rekap kehadiran pribadi dari GET /api/absensi/rekap/saya
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AbsensiAPI } from '../../services/api.js';

// Interval polling untuk cek sesi aktif (millisecond)
const POLLING_INTERVAL = 5000;

function AbsensiSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Sesi Absensi Aktif ────────────────────────────
  const [sesiAktif,  setSesiAktif]  = useState(null);
  // Status check-in WB ini: null | 'checkin' | 'sudah'
  const [statusCi,   setStatusCi]   = useState(null);
  const [loadingCi,  setLoadingCi]  = useState(false);
  const [feedbackCi, setFeedbackCi] = useState({ type: '', msg: '' });

  // ── State: Timer countdown (detik) ──────────────────────
  const [sisaWaktu,  setSisaWaktu]  = useState(0);

  // ── State: Rekap Kehadiran Pribadi ───────────────────────
  const [rekap,      setRekap]      = useState(null);
  const [loadingRekap, setLoadingRekap] = useState(true);

  // ── Fetch rekap kehadiran saat mount ────────────────────
  useEffect(() => {
    const fetchRekap = async () => {
      try {
        const res = await AbsensiAPI.getRekapSaya();
        setRekap(res.data.data);
      } catch { setRekap(null); }
      finally  { setLoadingRekap(false); }
    };
    fetchRekap();
  }, []);

  // ── Polling: cek sesi aktif setiap POLLING_INTERVAL ms ──
  const cekSesiAktif = useCallback(async () => {
    try {
      const res = await AbsensiAPI.getSesiAktif();
      const sesi = res.data.data;
      setSesiAktif(sesi);

      if (sesi) {
        // Hitung sisa waktu berdasarkan waktu_mulai + durasi_timer dari backend
        const mulai   = new Date(sesi.waktu_mulai).getTime();
        const durasi  = (sesi.durasi_timer || 0) * 1000; // detik → ms
        const selesai = mulai + durasi;
        const sisa    = Math.max(0, Math.floor((selesai - Date.now()) / 1000));
        setSisaWaktu(sisa);

        // Cek apakah WB ini sudah check-in
        const sudahCheckin = Number(sesi.sudah_checkin) === 1;
        setStatusCi(sudahCheckin ? 'sudah' : null);
        if (!sudahCheckin) {
          setFeedbackCi({ type: '', msg: '' });
        }
      } else {
        // Tidak ada sesi aktif — reset
        setSisaWaktu(0);
        setStatusCi(null);
        setFeedbackCi({ type: '', msg: '' });
      }
    } catch {
      // Tidak ada sesi aktif (404 atau error) — normal
      setSesiAktif(null);
      setSisaWaktu(0);
      setStatusCi(null);
      setFeedbackCi({ type: '', msg: '' });
    }
  }, []);

  useEffect(() => {
    cekSesiAktif(); // Langsung cek sekali saat mount
    const interval = setInterval(cekSesiAktif, POLLING_INTERVAL);
    return () => clearInterval(interval); // Bersihkan saat unmount
  }, [cekSesiAktif]);

  // ── Timer countdown lokal (detik mundur setiap 1 detik) ─
  useEffect(() => {
    if (!sesiAktif || sisaWaktu <= 0) return;
    const tick = setInterval(() => {
      setSisaWaktu(prev => {
        if (prev <= 1) { clearInterval(tick); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [sesiAktif, sisaWaktu > 0]); // Hanya jalan jika sesi aktif dan ada sisa waktu

  // ── Handler: WB Check-In ─────────────────────────────────
  const handleCheckIn = async () => {
    if (!sesiAktif || sisaWaktu <= 0 || statusCi === 'sudah') return;
    setLoadingCi(true);
    setFeedbackCi({ type: '', msg: '' });
    try {
      await AbsensiAPI.checkIn(sesiAktif.id);
      setStatusCi('sudah');
      setFeedbackCi({ type: 'success', msg: 'Kehadiran berhasil disubmit.' });
      // Refresh rekap kehadiran setelah check-in
      const res = await AbsensiAPI.getRekapSaya();
      setRekap(res.data.data);
      await cekSesiAktif();
    } catch (err) {
      setFeedbackCi({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal submit kehadiran. Coba lagi.',
      });
    } finally {
      setLoadingCi(false);
    }
  };

  // ── Helper: format detik → MM:SS ─────────────────────────
  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Helper: warna timer berdasarkan sisa waktu ───────────
  const warnaTimer = sisaWaktu > 60 ? '#5CB8FF'
                   : sisaWaktu > 20 ? '#F59E0B'
                   : '#EF4444';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '2rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '10px' }}>
              <span className="boutique-pill boutique-badge-blue">
                <i className="bi bi-calendar-check-fill" style={{ fontSize: '0.85rem' }}></i>
                PRESENSI DIGITAL PERTEMUAN
              </span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Presensi & Kehadiran Belajar
            </h1>
            <p style={{ color: '#64748B', marginTop: 8, fontSize: '0.94rem', maxWidth: '680px' }}>
              Check-in kehadiran secara realtime saat pengajar membuka sesi presensi kelas, dan tinjau rekapitulasi kehadiran Anda.
            </p>
          </div>

          {/* ── Widget Sesi Absensi (bagian utama) ── */}
          <div style={{
            background: 'white',
            borderRadius: '22px',
            border: '1px solid #E2E8F0',
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}>

            {/* Kondisi: Tidak ada sesi aktif */}
            {!sesiAktif && (
              <>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', fontSize: '2.2rem', color: '#94A3B8',
                }}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '1.3rem', color: '#1E293B', marginBottom: 8 }}>
                  Belum Ada Sesi Absensi Aktif
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                  Tunggu Tutor mengaktifkan sesi presensi mandiri di kelas. Halaman ini memantau pembaruan secara otomatis setiap {POLLING_INTERVAL / 1000} detik.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: '1.25rem', color: '#0284C7', background: '#EBF6FF', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#0284C7' }}></div>
                  <span>Memantau sesi kelas aktif...</span>
                </div>
              </>
            )}

            {/* Kondisi: Ada sesi aktif */}
            {sesiAktif && (
              <>
                {/* Nama rombel */}
                <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: 6 }}>
                  SESI PRESENSI KELAS TERBUKA
                </p>
                <h2 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 900, fontSize: '1.75rem', color: '#0F172A', marginBottom: '1.5rem' }}>
                  {sesiAktif.nama_rombel || 'Kelas Anda'}
                </h2>

                {/* Timer countdown — tampilan besar */}
                <div style={{
                  width: 144, height: 144, borderRadius: '50%',
                  border: `6px solid ${sisaWaktu > 0 ? warnaTimer : '#E2E8F0'}`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.75rem',
                  boxShadow: sisaWaktu > 0 ? `0 0 28px ${warnaTimer}35` : 'none',
                  transition: 'all 0.5s',
                  background: '#FFFFFF'
                }}>
                  <span style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.4rem', fontWeight: 900, color: warnaTimer, lineHeight: 1 }}>
                    {formatTimer(sisaWaktu)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>sisa waktu</span>
                </div>

                {/* Feedback Toast */}
                {feedbackCi.msg && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: feedbackCi.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                      color: feedbackCi.type === 'success' ? '#065F46' : '#991B1B',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      margin: '0 auto 1.25rem'
                    }}
                  >
                    <i className={`bi ${feedbackCi.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                    <span>{feedbackCi.msg}</span>
                  </div>
                )}

                {statusCi === 'sudah' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 68, height: 68, borderRadius: '50%', background: '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', color: '#059669',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
                    }}>
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <span style={{ fontWeight: 800, color: '#065F46', fontSize: '1.1rem' }}>
                      Anda sudah tercatat hadir!
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#64748B' }}>
                      Presensi berhasil disubmit ke server.
                    </span>
                  </div>
                ) : sisaWaktu > 0 ? (
                  <button
                    style={{
                      fontSize: '1rem',
                      padding: '0.9rem 2.5rem',
                      borderRadius: '9999px',
                      background: '#5CB8FF',
                      color: '#0F172A',
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 24px rgba(92, 184, 255, 0.35)',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.02em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3A9BF0';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#5CB8FF';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={handleCheckIn}
                    disabled={loadingCi}
                  >
                    {loadingCi ? (
                      <><span className="spinner-sm" style={{ width: 16, height: 16, border: '2px solid rgba(15,23,42,0.2)', borderTopColor: '#0F172A', borderRadius: '50%', display: 'inline-block' }}></span> Mengirim kehadiran...</>
                    ) : (
                      <><i className="bi bi-send-check" style={{ fontSize: '1.15rem' }}></i> SUBMIT KEHADIRAN</>
                    )}
                  </button>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 700 }}>
                    <i className="bi bi-clock-history"></i>
                    <span>Waktu check-in presensi sudah berakhir.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Rekap Kehadiran Pribadi ── */}
          <div style={{
            background: 'white',
            borderRadius: '22px',
            border: '1px solid #E2E8F0',
            padding: '1.75rem 2rem',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '10px', background: '#EBF6FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-bar-chart-fill" style={{ fontSize: '1.1rem' }}></i>
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', margin: 0 }}>
                Rekap Kehadiran Saya
              </h3>
            </div>

            {loadingRekap ? (
              <div className="loading-container" style={{ padding: '2rem' }}>
                <div className="spinner"></div>
              </div>
            ) : !rekap ? (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: '#CBD5E1' }}></i>
                <p style={{ color: '#64748B', marginTop: 8 }}>Belum ada data kehadiran.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '14px'
              }}>
                <RekapItem
                  label="Total Pertemuan"
                  value={rekap.total_pertemuan ?? '—'}
                  color="#1D4ED8"
                  bg="linear-gradient(145deg, #FFFFFF 0%, #EFF6FF 100%)"
                  border="#BFDBFE"
                />
                <RekapItem
                  label="Hadir"
                  value={rekap.hadir ?? '—'}
                  color="#15803D"
                  bg="linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)"
                  border="#BBF7D0"
                />
                <RekapItem
                  label="Izin / Sakit"
                  value={(rekap.izin ?? 0) + (rekap.sakit ?? 0)}
                  color="#B45309"
                  bg="linear-gradient(145deg, #FFFFFF 0%, #FEFCE8 100%)"
                  border="#FDE047"
                />
                <RekapItem
                  label="Alpa"
                  value={rekap.alpa ?? '—'}
                  color="#DC2626"
                  bg="linear-gradient(145deg, #FFFFFF 0%, #FEF2F2 100%)"
                  border="#FECACA"
                />
              </div>
            )}

            {/* Bar persentase kehadiran */}
            {rekap?.persentase_hadir != null && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>Tingkat Kehadiran Keseluruhan</span>
                  <span style={{ fontWeight: 900, color: rekap.persentase_hadir >= 75 ? '#1D4ED8' : '#DC2626' }}>
                    {rekap.persentase_hadir}%
                  </span>
                </div>
                <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${rekap.persentase_hadir}%`,
                    background: rekap.persentase_hadir >= 75 ? '#1D4ED8' : '#EF4444',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {rekap.persentase_hadir < 75 && (
                  <p style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Kehadiran di bawah 75%. Harap tingkatkan kehadiran Anda untuk memenuhi syarat evaluasi.</span>
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function RekapItem({ label, value, color, bg = '#F8FAFC', border = '#E2E8F0' }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '1.25rem 0.85rem',
      background: bg,
      borderRadius: '16px',
      border: `1.5px solid ${border}`,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      transition: 'transform 0.2s ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '1.85rem', fontWeight: 900, color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 6, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

export default AbsensiSiswa;
