// ============================================================
// src/pages/admin/TagihanAdmin.jsx — Manajemen Keuangan Admin TU
// ============================================================
// Admin membuat tagihan SPP/modul per siswa atau massal per
// jenjang, mencatat pembayaran, dan melihat laporan tunggakan.
//
// API:
//   GET  /api/tagihan                  → daftar tagihan (+ filter)
//   GET  /api/tagihan/tunggakan        → WB yang punya tunggakan
//   GET  /api/tagihan/ringkasan-bulanan→ data grafik keuangan
//   POST /api/tagihan                  → buat tagihan satu WB
//   POST /api/tagihan/massal           → tagihan satu jenjang sekaligus
//   POST /api/tagihan/:id/bayar        → catat pembayaran (+ bukti)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { TagihanAPI, SiswaAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const STATUS_BADGE = {
  belum_bayar: { cls: 'badge-danger',  label: 'Belum Bayar' },
  lunas:       { cls: 'badge-success', label: 'Lunas' },
  cicilan:     { cls: 'badge-warning', label: 'Cicilan' },
};

const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

function TagihanAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Tab Aktif ─────────────────────────────────────
  // 'daftar' | 'tunggakan' | 'buat'
  const [tab, setTab] = useState('daftar');

  // ── State: Daftar Tagihan ────────────────────────────────
  const [tagihanList, setTagihanList] = useState([]);
  const [ringkasan,   setRingkasan]   = useState(null);
  const [tunggakan,   setTunggakan]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── State: Filter ────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState('');
  const [searchNama,   setSearchNama]   = useState('');

  // ── State: Modal Bayar ───────────────────────────────────
  const [tagihanBayar, setTagihanBayar] = useState(null); // tagihan yang dipilih untuk bayar
  const [formBayar, setFormBayar] = useState({
    jumlah_bayar: '', tanggal_bayar: '', metode: 'tunai', keterangan: '',
  });
  const [buktiBayar,  setBuktiBayar]  = useState(null); // file bukti
  const [prosessBayar, setProssesBayar] = useState(false);
  const [feedbackBayar, setFeedbackBayar] = useState({ type: '', msg: '' });
  const fileRef = useRef(null);

  // ── State: Form Buat Tagihan ─────────────────────────────
  const [formBuat, setFormBuat] = useState({
    mode: 'satu',    // 'satu' | 'massal'
    warga_belajar_id: '',
    jenjang: '',     // untuk massal
    jenis_tagihan: 'spp',
    keterangan: '',
    jumlah: '',
    tanggal_jatuh_tempo: '',
  });
  const [siswaOptions, setSiswaOptions] = useState([]); // untuk dropdown WB
  const [buatLoading,  setBuatLoading]  = useState(false);
  const [buatFeedback, setBuatFeedback] = useState({ type: '', msg: '' });

  // ── Fetch Data ───────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filterStatus) params.status = filterStatus;

        const [resTagihan, resRingkasan, resTunggakan] = await Promise.allSettled([
          TagihanAPI.getAll(params),
          TagihanAPI.getRingkasanBulanan(),
          TagihanAPI.getTunggakan(),
        ]);

        if (resTagihan.status === 'fulfilled')    setTagihanList(resTagihan.value.data.data || []);
        else setError('Gagal memuat daftar tagihan.');
        if (resRingkasan.status === 'fulfilled')  setRingkasan(resRingkasan.value.data.data);
        if (resTunggakan.status === 'fulfilled')  setTunggakan(resTunggakan.value.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [filterStatus]);

  // Fetch daftar siswa untuk dropdown (saat mode 'buat' dipilih)
  useEffect(() => {
    if (tab === 'buat') {
      SiswaAPI.getAll({ is_aktif: 1 })
        .then(r => setSiswaOptions(r.data.data || []))
        .catch(() => {});
    }
  }, [tab]);

  // ── Filter Lokal ─────────────────────────────────────────
  const tagihanFiltered = tagihanList.filter(t => {
    if (!searchNama.trim()) return true;
    return t.nama_wb?.toLowerCase().includes(searchNama.toLowerCase()) ||
           t.nis?.toLowerCase().includes(searchNama.toLowerCase());
  });

  // ── Hitung Ringkasan Cepat dari Daftar ──────────────────
  const totalBelumBayar = tagihanList.filter(t => t.status === 'belum_bayar').length;
  const totalLunas      = tagihanList.filter(t => t.status === 'lunas').length;

  // ── Catat Pembayaran ─────────────────────────────────────
  const handleBayar = async () => {
    if (!formBayar.jumlah_bayar || !formBayar.tanggal_bayar) {
      setFeedbackBayar({ type: 'error', msg: 'Jumlah dan tanggal bayar wajib diisi.' });
      return;
    }
    setProssesBayar(true);
    setFeedbackBayar({ type: '', msg: '' });
    try {
      // Gunakan FormData agar bisa mengirim file bukti sekaligus
      const fd = new FormData();
      fd.append('jumlah_bayar',  formBayar.jumlah_bayar);
      fd.append('tanggal_bayar', formBayar.tanggal_bayar);
      fd.append('metode',        formBayar.metode);
      fd.append('keterangan',    formBayar.keterangan);
      if (buktiBayar) fd.append('bukti', buktiBayar);

      await TagihanAPI.catatPembayaran(tagihanBayar.id, fd);
      setFeedbackBayar({ type: 'success', msg: 'Pembayaran berhasil dicatat!' });

      // Refresh daftar tagihan
      const res = await TagihanAPI.getAll(filterStatus ? { status: filterStatus } : {});
      setTagihanList(res.data.data || []);

      // Reset form setelah 1.5 detik lalu tutup modal
      setTimeout(() => {
        setTagihanBayar(null);
        setFormBayar({ jumlah_bayar: '', tanggal_bayar: '', metode: 'tunai', keterangan: '' });
        setBuktiBayar(null);
        setFeedbackBayar({ type: '', msg: '' });
      }, 1500);
    } catch (err) {
      setFeedbackBayar({ type: 'error', msg: err.response?.data?.message || 'Gagal mencatat pembayaran.' });
    } finally {
      setProssesBayar(false);
    }
  };

  // ── Buat Tagihan Baru ────────────────────────────────────
  const handleBuatTagihan = async () => {
    const { mode, warga_belajar_id, jenjang, jenis_tagihan, keterangan, jumlah, tanggal_jatuh_tempo } = formBuat;

    // Validasi
    if (!jenis_tagihan || !keterangan || !jumlah || !tanggal_jatuh_tempo) {
      setBuatFeedback({ type: 'error', msg: 'Semua field wajib diisi.' });
      return;
    }
    if (mode === 'satu' && !warga_belajar_id) {
      setBuatFeedback({ type: 'error', msg: 'Pilih Warga Belajar terlebih dahulu.' });
      return;
    }
    if (mode === 'massal' && !jenjang) {
      setBuatFeedback({ type: 'error', msg: 'Pilih jenjang untuk tagihan massal.' });
      return;
    }

    setBuatLoading(true);
    setBuatFeedback({ type: '', msg: '' });

    try {
      const payload = { jenis_tagihan, keterangan, jumlah: Number(jumlah), tanggal_jatuh_tempo };

      if (mode === 'satu') {
        payload.warga_belajar_id = Number(warga_belajar_id);
        await TagihanAPI.create(payload);
      } else {
        payload.jenjang = jenjang;
        await TagihanAPI.createMassal(payload);
      }

      setBuatFeedback({ type: 'success', msg: `Tagihan berhasil dibuat${mode === 'massal' ? ' untuk semua WB jenjang yang dipilih' : ''}!` });

      // Reset form
      setFormBuat({
        mode: 'satu', warga_belajar_id: '', jenjang: '',
        jenis_tagihan: 'spp', keterangan: '', jumlah: '', tanggal_jatuh_tempo: '',
      });

      // Refresh daftar tagihan
      const res = await TagihanAPI.getAll({});
      setTagihanList(res.data.data || []);
    } catch (err) {
      setBuatFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat tagihan.' });
    } finally {
      setBuatLoading(false);
    }
  };

  const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const formatTanggal = (tgl) => tgl
    ? new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span className="badge badge-primary" style={{ fontWeight: 700, padding: '4px 10px' }}>
                  <i className="bi bi-wallet2"></i> Pembukuan & Iuran
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Administrasi Keuangan Lembaga</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Keuangan & Tagihan
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Kelola tagihan SPP bulanan, modul pembelajaran, pencatatan bukti bayar, dan pemantauan tunggakan siswa.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setTab('buat')}
              style={{ height: 42, padding: '0 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="bi bi-plus-lg" /> Terbitkan Tagihan Baru
            </button>
          </div>

          {/* ── Kartu Ringkasan Bulanan Berpola ──────────── */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-receipt" />
                </div>
                <span className="admin-stat-tag">TAGIHAN</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{ringkasan ? formatRupiah(ringkasan.total_tagihan) : 'Rp 0'}</div>
                <div className="admin-stat-label">Total Tagihan Diterbitkan</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check-circle-fill" />
                </div>
                <span className="admin-stat-tag">KAS MASUK</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{ringkasan ? formatRupiah(ringkasan.total_terbayar) : 'Rp 0'}</div>
                <div className="admin-stat-label">Total Penerimaan Kas</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-rose">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-exclamation-triangle-fill" />
                </div>
                <span className="admin-stat-tag">PIUTANG</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{ringkasan ? formatRupiah(ringkasan.total_tunggakan) : 'Rp 0'}</div>
                <div className="admin-stat-label">Total Piutang / Tunggakan</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-hourglass-split" />
                </div>
                <span className="admin-stat-tag">BELUM LUNAS</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalBelumBayar} Tagihan</div>
                <div className="admin-stat-label">Belum Lunas Terbayar</div>
              </div>
            </div>
          </div>

          {/* ── Navigasi Tab Modern ──────────────────────── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', background: '#FFFFFF', padding: '6px', borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
            {[
              { key: 'daftar',    icon: 'bi-list-ul',           label: 'Semua Tagihan' },
              { key: 'tunggakan', icon: 'bi-exclamation-circle', label: `Laporan Tunggakan (${tunggakan.length})` },
              { key: 'buat',      icon: 'bi-plus-circle',        label: 'Terbitkan Tagihan' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: tab === t.key ? '#1D4ED8' : 'transparent',
                  color: tab === t.key ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <i className={`bi ${t.icon}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 1: Daftar Semua Tagihan                   */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'daftar' && (
            <div className="card">
              <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="card-title">Daftar Tagihan</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Pencarian */}
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-search" style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)', fontSize: '0.85rem',
                    }} />
                    <input
                      type="text"
                      placeholder="Cari nama / NIS…"
                      value={searchNama}
                      onChange={e => setSearchNama(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', width: 200, height: 38 }}
                    />
                  </div>
                  {/* Filter Status */}
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="form-input"
                    style={{ height: 38, width: 160 }}
                  >
                    <option value="">Semua Status</option>
                    <option value="belum_bayar">Belum Bayar</option>
                    <option value="lunas">Lunas</option>
                    <option value="cicilan">Cicilan</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="loading-container" style={{ padding: '3rem' }}>
                  <div className="spinner" />
                  <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                  <i className="bi bi-exclamation-triangle" /><span>{error}</span>
                </div>
              ) : tagihanFiltered.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-receipt" />
                  <h3>Tidak Ada Tagihan</h3>
                  <p>Belum ada tagihan yang sesuai filter.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Warga Belajar</th>
                        <th>Keterangan</th>
                        <th>Jumlah</th>
                        <th>Jatuh Tempo</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagihanFiltered.map(t => {
                        const badge = STATUS_BADGE[t.status] || { cls: 'badge-neutral', label: t.status };
                        const lewat = t.status !== 'lunas' && new Date(t.tanggal_jatuh_tempo) < new Date();
                        return (
                          <tr key={t.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.nama_wb}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{t.nis} · {t.jenjang}</div>
                            </td>
                            <td style={{ fontSize: '0.88rem' }}>
                              <div>{t.keterangan}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{t.jenis_tagihan?.toUpperCase()}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                              {formatRupiah(t.jumlah)}
                              {Number(t.total_terbayar) > 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 400 }}>
                                  Terbayar: {formatRupiah(t.total_terbayar)}
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.88rem', color: lewat ? 'var(--color-danger)' : 'inherit' }}>
                              {lewat && <i className="bi bi-exclamation-circle-fill" style={{ marginRight: 4 }} />}
                              {formatTanggal(t.tanggal_jatuh_tempo)}
                            </td>
                            <td>
                              <span className={`badge ${badge.cls}`}>{badge.label}</span>
                            </td>
                            <td>
                              {t.status !== 'lunas' && (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                  onClick={() => {
                                    setTagihanBayar(t);
                                    setFormBayar({ jumlah_bayar: '', tanggal_bayar: new Date().toISOString().split('T')[0], metode: 'tunai', keterangan: '' });
                                    setFeedbackBayar({ type: '', msg: '' });
                                  }}
                                >
                                  <i className="bi bi-cash" /> Catat Bayar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              {!loading && !error && (
                <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.83rem' }}>
                  <strong>{totalBelumBayar}</strong> belum bayar · <strong>{totalLunas}</strong> lunas · Total: <strong>{tagihanFiltered.length}</strong>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 2: Tunggakan                              */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'tunggakan' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--color-danger)', marginRight: 8 }} />
                  Laporan Tunggakan
                </h3>
              </div>
              {loading ? (
                <div className="loading-container" style={{ padding: '3rem' }}><div className="spinner" /></div>
              ) : tunggakan.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-emoji-smile" />
                  <h3>Tidak Ada Tunggakan</h3>
                  <p>Semua Warga Belajar sudah melunasi tagihan mereka. 🎉</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Warga Belajar</th>
                        <th>Jml Tagihan Belum Lunas</th>
                        <th>Total Tunggakan</th>
                        <th>Jatuh Tempo Terdekat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tunggakan.map((t, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{t.nama_wb}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{t.nis} · {t.jenjang}</div>
                          </td>
                          <td>
                            <span className="badge badge-danger">{t.jumlah_tagihan} tagihan</span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                            {formatRupiah(t.total_tunggakan)}
                          </td>
                          <td style={{ fontSize: '0.88rem' }}>
                            {formatTanggal(t.jatuh_tempo_terdekat)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 3: Buat Tagihan                           */}
          {/* ══════════════════════════════════════════════ */}
          {tab === 'buat' && (
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="card-header">
                <h3 className="card-title">Buat Tagihan Baru</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>

                {/* Mode: satu siswa vs massal per jenjang */}
                <div className="form-group">
                  <label className="form-label">Mode Penerbitan</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[
                      { val: 'satu',   label: 'Satu Warga Belajar', icon: 'bi-person' },
                      { val: 'massal', label: 'Massal per Jenjang',  icon: 'bi-people' },
                    ].map(opt => (
                      <label
                        key={opt.val}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                          padding: '0.75rem 1rem',
                          border: `2px solid ${formBuat.mode === opt.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          background: formBuat.mode === opt.val ? 'var(--color-primary-light)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio" value={opt.val}
                          checked={formBuat.mode === opt.val}
                          onChange={e => setFormBuat(p => ({ ...p, mode: e.target.value }))}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <i className={`bi ${opt.icon}`} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pilihan WB atau Jenjang */}
                {formBuat.mode === 'satu' ? (
                  <div className="form-group">
                    <label className="form-label">Warga Belajar <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <select
                      className="form-input"
                      value={formBuat.warga_belajar_id}
                      onChange={e => setFormBuat(p => ({ ...p, warga_belajar_id: e.target.value }))}
                    >
                      <option value="">— Pilih Warga Belajar —</option>
                      {siswaOptions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nama_lengkap} ({s.nis}) — {s.jenjang}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Jenjang <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <select
                      className="form-input"
                      value={formBuat.jenjang}
                      onChange={e => setFormBuat(p => ({ ...p, jenjang: e.target.value }))}
                    >
                      <option value="">— Pilih Jenjang —</option>
                      <option value="paket_a">Paket A</option>
                      <option value="paket_b">Paket B</option>
                      <option value="paket_c">Paket C</option>
                    </select>
                    <p style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Tagihan akan dibuat untuk <strong>semua WB aktif</strong> di jenjang yang dipilih.
                    </p>
                  </div>
                )}

                {/* Jenis Tagihan */}
                <div className="form-group">
                  <label className="form-label">Jenis Tagihan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <select
                    className="form-input"
                    value={formBuat.jenis_tagihan}
                    onChange={e => setFormBuat(p => ({ ...p, jenis_tagihan: e.target.value }))}
                  >
                    <option value="spp">SPP Bulanan</option>
                    <option value="modul">Modul / Buku</option>
                    <option value="lain_lain">Lain-lain</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="form-group">
                  <label className="form-label">Keterangan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: SPP Bulan Juli 2026"
                    value={formBuat.keterangan}
                    onChange={e => setFormBuat(p => ({ ...p, keterangan: e.target.value }))}
                  />
                </div>

                {/* Jumlah & Jatuh Tempo */}
                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Jumlah (Rp) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="200000"
                      value={formBuat.jumlah}
                      onChange={e => setFormBuat(p => ({ ...p, jumlah: e.target.value }))}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jatuh Tempo <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBuat.tanggal_jatuh_tempo}
                      onChange={e => setFormBuat(p => ({ ...p, tanggal_jatuh_tempo: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Feedback */}
                {buatFeedback.msg && (
                  <div className={`alert ${buatFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
                    <i className={`bi ${buatFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{buatFeedback.msg}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary btn-block"
                  onClick={handleBuatTagihan}
                  disabled={buatLoading}
                >
                  {buatLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Membuat...</> : <><i className="bi bi-plus-circle" /> Buat Tagihan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Modal Catat Pembayaran ──────────────────────── */}
      {tagihanBayar && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setTagihanBayar(null); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 540 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className="bi bi-cash-coin" />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">Catat Pembayaran Tagihan</h3>
                <p className="admin-modal-subtitle">{tagihanBayar.nama_wb} • {tagihanBayar.keterangan}</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setTagihanBayar(null)} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={e => { e.preventDefault(); handleBayar(); }}>
              <div className="admin-modal-body">
                {/* Info Tagihan Ringkas */}
                <div style={{ padding: '0.875rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: '#64748B' }}>Total Tagihan:</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatRupiah(tagihanBayar.jumlah)}</span>
                  </div>
                  {Number(tagihanBayar.total_terbayar) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: 4 }}>
                      <span style={{ color: '#64748B' }}>Sudah Terbayar:</span>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>{formatRupiah(tagihanBayar.total_terbayar)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem', marginTop: 6, paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontWeight: 800, color: '#334155' }}>Sisa Piutang:</span>
                    <span style={{ fontWeight: 800, color: '#DC2626' }}>
                      {formatRupiah(Number(tagihanBayar.jumlah) - Number(tagihanBayar.total_terbayar || 0))}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nominal Dibayarkan (Rp) <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formBayar.jumlah_bayar}
                    onChange={e => setFormBayar(p => ({ ...p, jumlah_bayar: e.target.value }))}
                    min={0}
                    required
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Tanggal Pembayaran <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={formBayar.tanggal_bayar}
                      onChange={e => setFormBayar(p => ({ ...p, tanggal_bayar: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Metode Transaksi</label>
                    <select className="form-input" value={formBayar.metode} onChange={e => setFormBayar(p => ({ ...p, metode: e.target.value }))}>
                      <option value="tunai">Tunai / Kasir TU</option>
                      <option value="transfer">Transfer Bank / VA</option>
                      <option value="lain_lain">Lain-lain / QRIS</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Catatan Pembayaran (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Titip lewat wali murid, struk transfer ATM..."
                    value={formBayar.keterangan}
                    onChange={e => setFormBayar(p => ({ ...p, keterangan: e.target.value }))}
                  />
                </div>

                {/* Upload Bukti */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Bukti Pembayaran Struk / Slip (Opsional)</label>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setBuktiBayar(e.target.files[0])} />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileRef.current?.click()}
                    style={{ fontSize: '0.85rem', width: '100%', padding: '0.65rem', border: '1.5px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <i className="bi bi-cloud-upload-fill" style={{ color: '#1D4ED8' }} />
                    <span>{buktiBayar ? buktiBayar.name : 'Pilih Berkas Foto Struk / PDF'}</span>
                  </button>
                </div>

                {feedbackBayar.msg && (
                  <div className={`alert ${feedbackBayar.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '0.5rem' }}>
                    <i className={`bi ${feedbackBayar.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{feedbackBayar.msg}</span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setTagihanBayar(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={prosessBayar}>
                  {prosessBayar ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2" /> Simpan Pembayaran</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TagihanAdmin;
