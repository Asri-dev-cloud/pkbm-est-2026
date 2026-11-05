// ============================================================
// src/pages/admin/SiswaAdmin.jsx — Manajemen Data Warga Belajar
// ============================================================
// Admin TU melihat, mencari, memfilter, dan mengedit data
// seluruh Warga Belajar yang sudah aktif di sistem.
//
// API:
//   GET /api/siswa                        → daftar semua WB (+ filter)
//   GET /api/siswa/:id                    → detail satu WB
//   PUT /api/siswa/:id                    → update data WB
//   GET /api/siswa/statistik/per-jenjang  → jumlah per jenjang
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import ModalPratinjauExcel from '../../components/ModalPratinjauExcel.jsx';
import { SiswaAPI } from '../../services/api.js';
import { generateLaporanSiswaExcel, getTahunAjaranRealTime } from '../../utils/excelExport.js';

// ── Konstanta ────────────────────────────────────────────────
const JENJANG_LABEL = {
  paket_a: 'Paket A',
  paket_b: 'Paket B',
  paket_c: 'Paket C',
};

const JENJANG_COLOR = {
  paket_a: { bg: '#DBEAFE', color: '#1E40AF' },
  paket_b: { bg: '#D1FAE5', color: '#065F46' },
  paket_c: { bg: '#F3E8FF', color: '#6B21A8' },
};

function SiswaAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Daftar Siswa ──────────────────────────────────
  const [siswaList,  setSiswaList]  = useState([]);
  const [statJenjang, setStatJenjang] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── State: Filter & Pencarian ────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterAktif,  setFilterAktif]  = useState('1'); // '1' = aktif, '0' = nonaktif, '' = semua

  // ── State: Modal Detail / Edit ───────────────────────────
  const [modalMode,   setModalMode]   = useState(null); // null | 'detail' | 'edit'
  const [selectedWB,  setSelectedWB]  = useState(null);
  const [loadDetail,  setLoadDetail]  = useState(false);

  // ── State: Form Edit ─────────────────────────────────────
  const [formEdit,    setFormEdit]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── State: Modal Pratinjau & Download Excel ──────────────────
  const [modalExcelOpen, setModalExcelOpen] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // ── Fetch: Daftar Siswa & Statistik ─────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filterJenjang) params.jenjang = filterJenjang;
        if (filterAktif !== '') params.is_aktif = filterAktif;

        const [resList, resStat] = await Promise.allSettled([
          SiswaAPI.getAll(params),
          SiswaAPI.getStatistikPerJenjang(),
        ]);

        if (resList.status === 'fulfilled')  setSiswaList(resList.value.data.data || []);
        else setError('Gagal memuat data siswa.');
        if (resStat.status === 'fulfilled') setStatJenjang(resStat.value.data.data || []);
      } catch {
        setError('Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterJenjang, filterAktif]);

  // ── Filter Pencarian Lokal (di client) ───────────────────
  // Filter berdasarkan nama atau NIS — tidak hit API ulang
  const siswaFiltered = siswaList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.nama_lengkap?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  // ── Buka Modal Detail Siswa ──────────────────────────────
  const bukaDetail = async (id, mode = 'detail') => {
    setLoadDetail(true);
    setModalMode(mode);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await SiswaAPI.getById(id);
      const data = res.data.data;
      setSelectedWB(data);
      // Isi form edit dengan data saat ini
      setFormEdit({
        alamat:   data.alamat   || '',
        jarak_rumah_km: data.jarak_rumah_km ?? '',
        tinggi_badan: data.tinggi_badan ?? '',
        berat_badan: data.berat_badan ?? '',
        jumlah_saudara_kandung: data.jumlah_saudara_kandung ?? '',
        nama_wali: data.nama_wali || '',
        no_telp:  data.no_telp  || '',
      });
    } catch {
      alert('Gagal memuat detail siswa.');
      setModalMode(null);
    } finally {
      setLoadDetail(false);
    }
  };

  // ── Tutup Modal ──────────────────────────────────────────
  const tutupModal = () => {
    setModalMode(null);
    setSelectedWB(null);
    setSaveError('');
    setSaveSuccess('');
  };

  // ── Simpan Perubahan Data Siswa ──────────────────────────
  const handleSimpan = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await SiswaAPI.update(selectedWB.id, formEdit);
      setSaveSuccess('Data Warga Belajar berhasil diperbarui.');
      // Update data di list tanpa refetch ulang
      setSiswaList(prev =>
        prev.map(s => s.id === selectedWB.id
          ? { ...s, ...formEdit }
          : s
        )
      );
      setSelectedWB(prev => ({ ...prev, ...formEdit }));
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Handler Unduh File Excel Langsung ────────────────────────
  const handleDownloadExcelLangsung = async () => {
    setDownloadingExcel(true);
    try {
      const infoJenjang = filterJenjang ? (JENJANG_LABEL[filterJenjang] || filterJenjang) : 'Semua Jenjang';
      const infoAktif = filterAktif === '1' ? 'Warga Belajar Aktif' : filterAktif === '0' ? 'Nonaktif' : 'Semua Status';
      await generateLaporanSiswaExcel({
        data: siswaFiltered,
        tahunAjaran: getTahunAjaranRealTime(),
        filterInfo: `${infoJenjang} (${infoAktif})`,
        tipeLaporan: 'Data Warga Belajar',
      });
    } catch (err) {
      console.error('Gagal download Excel:', err);
      alert('Terjadi kesalahan saat mengunduh file Excel.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  // ── Format Tanggal ───────────────────────────────────────
  const formatTanggal = (tgl) => {
    if (!tgl) return '—';
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  // ── Total WB Aktif (ringkasan cepat) ────────────────────
  const totalWB    = statJenjang.reduce((sum, s) => sum + Number(s.jumlah || 0), 0);
  const totalAktif = siswaList.filter(s => s.is_aktif).length;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          {/* ── Header ──────────────────────────────────────── */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Data Warga Belajar
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Kelola basis data induk seluruh warga belajar aktif, rombel penempatan, serta kelengkapan kontak dan wali.
              </p>
            </div>

            {/* Tombol Aksi Excel: Download & Buka/Lihat Rekapan Resmi */}
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setModalExcelOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#1D4ED8',
                  backgroundColor: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
                title="Buka dan lihat rekapan lembar kerja Excel secara langsung"
              >
                <i className="bi bi-eye-fill" style={{ fontSize: '1rem', color: '#2563EB' }} />
                <span>Buka / Lihat Excel</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcelLangsung}
                disabled={downloadingExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  backgroundColor: '#059669',
                  border: 'none',
                  cursor: downloadingExcel ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)',
                  transition: 'all 0.15s ease',
                  opacity: downloadingExcel ? 0.75 : 1,
                }}
                title="Download rekapan Laporan Hasil Penerimaan Siswa Baru (.xlsx)"
              >
                {downloadingExcel ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-excel-fill" style={{ fontSize: '1rem' }} />
                    <span>Download Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Statistik Patterned Cards ────────────────── */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-people-fill" />
                </div>
                <span className="admin-stat-tag">TOTAL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalWB}</div>
                <div className="admin-stat-label">Total WB Terdaftar</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-mortarboard-fill" />
                </div>
                <span className="admin-stat-tag">PAKET A</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statJenjang.find(s => s.jenjang === 'paket_a')?.jumlah || 0}</div>
                <div className="admin-stat-label">WB Paket A (SD)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-sky">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-backpack-fill" />
                </div>
                <span className="admin-stat-tag">PAKET B</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statJenjang.find(s => s.jenjang === 'paket_b')?.jumlah || 0}</div>
                <div className="admin-stat-label">WB Paket B (SMP)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-layers-fill" />
                </div>
                <span className="admin-stat-tag">PAKET C</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statJenjang.find(s => s.jenjang === 'paket_c')?.jumlah || 0}</div>
                <div className="admin-stat-label">WB Paket C (SMA)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check-circle-fill" />
                </div>
                <span className="admin-stat-tag">AKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalAktif}</div>
                <div className="admin-stat-label">Warga Belajar Aktif</div>
              </div>
            </div>
          </div>

          {/* ── Panel Tabel ─────────────────────────────── */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-table" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Induk Warga Belajar</span>
              </div>

              {/* ── Filter & Pencarian ─────────────────── */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Pencarian */}
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: '#94A3B8', fontSize: '0.85rem',
                  }} />
                  <input
                    type="text"
                    placeholder="Cari nama / NIS / email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', width: 230, height: 38, borderRadius: 8, border: '1.5px solid #CBD5E1', fontWeight: 600 }}
                  />
                </div>

                {/* Filter Jenjang */}
                <select
                  value={filterJenjang}
                  onChange={e => setFilterJenjang(e.target.value)}
                  className="form-input"
                  style={{ height: 38, width: 150, borderRadius: 8, border: '1.5px solid #CBD5E1', fontWeight: 600 }}
                >
                  <option value="">Semua Jenjang</option>
                  <option value="paket_a">Paket A (SD)</option>
                  <option value="paket_b">Paket B (SMP)</option>
                  <option value="paket_c">Paket C (SMA)</option>
                </select>

                {/* Filter Status Aktif */}
                <select
                  value={filterAktif}
                  onChange={e => setFilterAktif(e.target.value)}
                  className="form-input"
                  style={{ height: 38, width: 140, borderRadius: 8, border: '1.5px solid #CBD5E1', fontWeight: 600 }}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                  <option value="">Semua Status</option>
                </select>

                {/* Tombol Aksi Excel di Tabel */}
                <button
                  type="button"
                  onClick={() => setModalExcelOpen(true)}
                  style={{
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                  title="Lihat Pratinjau Rekapan Lembar Kerja Excel"
                >
                  <i className="bi bi-eye" style={{ color: '#2563EB' }} />
                  <span>Lihat Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelLangsung}
                  disabled={downloadingExcel}
                  style={{
                    height: 38,
                    padding: '0 13px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: downloadingExcel ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  title="Unduh Rekapan Excel (.xlsx)"
                >
                  <i className="bi bi-file-earmark-excel-fill" />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            {/* ── Konten Tabel ──────────────────────────── */}
            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat data siswa...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
              </div>
            ) : siswaFiltered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-people" />
                <h3>Tidak Ada Data Ditemukan</h3>
                <p>Tidak ada Warga Belajar yang sesuai dengan filter pencarian yang dipilih.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>NIS</th>
                      <th>Nama Lengkap & Kontak</th>
                      <th style={{ width: '140px' }}>Jenjang</th>
                      <th style={{ width: '160px' }}>Rombel</th>
                      <th style={{ width: '130px' }}>Jenis Kelamin</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '160px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaFiltered.map(s => (
                      <tr key={s.id}>
                        <td>
                          <code style={{
                            fontSize: '0.85rem', background: '#EFF6FF', color: '#1D4ED8',
                            padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                          }}>
                            {s.nis}
                          </code>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
                            }}>
                              {s.nama_lengkap?.charAt(0)?.toUpperCase() || 'W'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}>{s.nama_lengkap}</div>
                              <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: JENJANG_COLOR[s.jenjang]?.bg || '#F1F5F9',
                            color:      JENJANG_COLOR[s.jenjang]?.color || '#475569',
                            fontWeight: 700, border: '1px solid currentColor',
                          }}>
                            {JENJANG_LABEL[s.jenjang] || s.jenjang}
                          </span>
                        </td>
                        <td style={{ color: s.nama_rombel ? '#0F172A' : '#94A3B8', fontSize: '0.88rem', fontWeight: 600 }}>
                          {s.nama_rombel ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-mortarboard" style={{ color: '#1D4ED8' }}></i>
                              {s.nama_rombel}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                          {s.jenis_kelamin === 'L' ? (
                            <span style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <i className="bi bi-gender-male" /> Laki-laki
                            </span>
                          ) : (
                            <span style={{ color: '#DB2777', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <i className="bi bi-gender-female" /> Perempuan
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${s.is_aktif ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                            {s.is_aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                              onClick={() => bukaDetail(s.id, 'detail')}
                            >
                              <i className="bi bi-eye" /> Detail
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                              onClick={() => bukaDetail(s.id, 'edit')}
                            >
                              <i className="bi bi-pencil" /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer jumlah data */}
            {!loading && !error && (
              <div style={{
                padding: '0.875rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                Menampilkan <strong>{siswaFiltered.length}</strong> dari <strong>{siswaList.length}</strong> Warga Belajar
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Modal Detail / Edit ─────────────────────────── */}
      {modalMode && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) tutupModal(); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 680 }}>
            {/* Header Modal */}
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className={`bi ${modalMode === 'edit' ? 'bi-pencil-square' : 'bi-person-vcard-fill'}`} />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">
                  {modalMode === 'edit' ? 'Edit Data Warga Belajar' : 'Detail Data Warga Belajar'}
                </h3>
                <p className="admin-modal-subtitle">
                  {selectedWB?.nama_lengkap || 'Memuat...'} • NIS: {selectedWB?.nis || '—'}
                </p>
              </div>
              <button type="button" className="admin-modal-close" onClick={tutupModal} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Form & Body Modal */}
            <form className="admin-modal-form" onSubmit={e => { e.preventDefault(); if (modalMode === 'edit') handleSimpan(); }}>
              <div className="admin-modal-body">
                {loadDetail ? (
                  <div className="loading-container" style={{ padding: '2.5rem' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: 10, color: '#64748B' }}>Memuat profil...</p>
                  </div>
                ) : selectedWB ? (
                  <>
                    {/* Info Profil Utama */}
                    <div style={{
                      background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0',
                      padding: '1rem 1.25rem', marginBottom: '1.25rem',
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem',
                    }}>
                      {[
                        { label: 'Nomor Induk Siswa (NIS)', value: selectedWB.nis, icon: 'bi-card-text' },
                        { label: 'Nama Lengkap', value: selectedWB.nama_lengkap, icon: 'bi-person' },
                        { label: 'Alamat Email', value: selectedWB.email, icon: 'bi-envelope' },
                        { label: 'Jenjang Pendidikan', value: JENJANG_LABEL[selectedWB.jenjang] || selectedWB.jenjang, icon: 'bi-mortarboard' },
                        { label: 'Rombongan Belajar', value: selectedWB.nama_rombel || '—', icon: 'bi-people' },
                        { label: 'Jenis Kelamin', value: selectedWB.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', icon: 'bi-gender-ambiguous' },
                        { label: 'Tanggal Lahir', value: formatTanggal(selectedWB.tanggal_lahir), icon: 'bi-calendar3' },
                        { label: 'Tanggal Terdaftar', value: formatTanggal(selectedWB.created_at), icon: 'bi-calendar-check' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{ padding: '0.5rem 0' }}>
                          <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                            <i className={`bi ${icon}`} style={{ marginRight: 4 }}></i>
                            {label}
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{value || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Field Edit / Tinjau */}
                    {modalMode === 'edit' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.875rem' }}>
                          <i className="bi bi-pencil-fill" style={{ color: '#1D4ED8' }}></i>
                          <span>Ubah Informasi Alamat & Kontak Wali</span>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontWeight: 700 }}>Alamat Lengkap Tinggal</label>
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Contoh: Jl. Merdeka No. 12, RT 02 / RW 05..."
                            value={formEdit.alamat}
                            onChange={e => setFormEdit(p => ({ ...p, alamat: e.target.value }))}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Nama Orang Tua / Wali</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Nama orang tua / wali..."
                              value={formEdit.nama_wali}
                              onChange={e => setFormEdit(p => ({ ...p, nama_wali: e.target.value }))}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>Nomor Telepon / WhatsApp</label>
                            <input
                              type="tel"
                              className="form-input"
                              placeholder="08xxxxxxxxxx"
                              value={formEdit.no_telp}
                              onChange={e => setFormEdit(p => ({ ...p, no_telp: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Data Periodik Dapodik */}
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.875rem 1rem',
                          background: '#F0FDF4',
                          borderRadius: '8px',
                          border: '1px solid #BBF7D0',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: '0.75rem' }}>
                            <i className="bi bi-bookmark-check-fill"></i>
                            <span>Data Isian Dapodik (Data Pokok Pendidikan)</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Jarak ke Sekolah (km)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                className="form-input"
                                placeholder="Contoh: 2.5"
                                value={formEdit.jarak_rumah_km}
                                onChange={e => setFormEdit(p => ({ ...p, jarak_rumah_km: e.target.value }))}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Tinggi Badan (cm)</label>
                              <input
                                type="number"
                                min="30"
                                max="250"
                                className="form-input"
                                placeholder="Contoh: 165"
                                value={formEdit.tinggi_badan}
                                onChange={e => setFormEdit(p => ({ ...p, tinggi_badan: e.target.value }))}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Berat Badan (kg)</label>
                              <input
                                type="number"
                                min="10"
                                max="250"
                                className="form-input"
                                placeholder="Contoh: 55"
                                value={formEdit.berat_badan}
                                onChange={e => setFormEdit(p => ({ ...p, berat_badan: e.target.value }))}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Jumlah Saudara Kandung</label>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                className="form-input"
                                placeholder="Contoh: 2 (isi 0 jika tunggal)"
                                value={formEdit.jumlah_saudara_kandung}
                                onChange={e => setFormEdit(p => ({ ...p, jumlah_saudara_kandung: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {saveError && (
                          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                            <i className="bi bi-exclamation-circle" />
                            <span>{saveError}</span>
                          </div>
                        )}
                        {saveSuccess && (
                          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                            <i className="bi bi-check-circle" />
                            <span>{saveSuccess}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Mode Detail */
                      <div>
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem 1.25rem', background: '#FFFFFF', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.875rem' }}>
                            <i className="bi bi-info-circle-fill" style={{ color: '#1D4ED8' }}></i>
                            <span>Informasi Kontak & Domisili</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                            {[
                              { label: 'Alamat Tinggal', value: selectedWB.alamat || 'Belum diisi' },
                              { label: 'Nama Orang Tua / Wali', value: selectedWB.nama_wali || 'Belum diisi' },
                              { label: 'Nomor Telepon / WA', value: selectedWB.no_telp || 'Belum diisi' },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{label}</span>
                                <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0F172A' }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Data Dapodik di Detail */}
                        <div style={{
                          border: '1px solid #BBF7D0',
                          borderRadius: '10px',
                          padding: '1rem 1.25rem',
                          background: '#F0FDF4',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', color: '#166534', marginBottom: '0.875rem' }}>
                            <i className="bi bi-bookmark-check-fill" style={{ color: '#16A34A' }}></i>
                            <span>Data Isian Dapodik (Data Pokok Pendidikan)</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
                            <div style={{ background: '#FFFFFF', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Jarak ke Sekolah</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                {selectedWB.jarak_rumah_km != null ? `${selectedWB.jarak_rumah_km} km` : '—'}
                              </div>
                            </div>
                            <div style={{ background: '#FFFFFF', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Tinggi Badan</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                {selectedWB.tinggi_badan != null ? `${selectedWB.tinggi_badan} cm` : '—'}
                              </div>
                            </div>
                            <div style={{ background: '#FFFFFF', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Berat Badan</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                {selectedWB.berat_badan != null ? `${selectedWB.berat_badan} kg` : '—'}
                              </div>
                            </div>
                            <div style={{ background: '#FFFFFF', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Saudara Kandung</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                {selectedWB.jumlah_saudara_kandung != null ? `${selectedWB.jumlah_saudara_kandung} orang` : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={tutupModal}>
                  {modalMode === 'edit' ? 'Batal' : 'Tutup'}
                </button>
                {modalMode === 'edit' ? (
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2" /> Simpan Perubahan</>}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => setModalMode('edit')}>
                    <i className="bi bi-pencil" /> Edit Data Siswa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Pratinjau & Download Excel Resmi ── */}
      <ModalPratinjauExcel
        isOpen={modalExcelOpen}
        onClose={() => setModalExcelOpen(false)}
        data={siswaFiltered}
        defaultTahunAjaran={getTahunAjaranRealTime()}
        filterInfo={`${filterJenjang ? (JENJANG_LABEL[filterJenjang] || filterJenjang) : 'Semua Jenjang'} (${filterAktif === '1' ? 'Aktif' : filterAktif === '0' ? 'Nonaktif' : 'Semua Status'})`}
        tipeLaporan="Data Warga Belajar"
      />
    </div>
  );
}

export default SiswaAdmin;
