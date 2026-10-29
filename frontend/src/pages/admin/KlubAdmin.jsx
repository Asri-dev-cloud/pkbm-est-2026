// ============================================================
// src/pages/admin/KlubAdmin.jsx — Manajemen Klub Minat Bakat
// ============================================================
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { KlubAPI, AkademikAPI } from '../../services/api.js';
import './KlubAdmin.css';

const KATEGORI_LIST = ['seni', 'olahraga', 'teknologi', 'bahasa', 'sains', 'lainnya'];

const KATEGORI_STYLE = {
  seni:       { bg: '#FCE7F3', color: '#BE185D', icon: 'bi-palette-fill' },
  olahraga:   { bg: '#DBEAFE', color: '#1D4ED8', icon: 'bi-trophy-fill' },
  teknologi:  { bg: '#EDE9FE', color: '#6D28D9', icon: 'bi-cpu-fill' },
  bahasa:     { bg: '#D1FAE5', color: '#065F46', icon: 'bi-chat-quote-fill' },
  sains:      { bg: '#FEF3C7', color: '#92400E', icon: 'bi-flask-fill' },
  lainnya:    { bg: '#F1F5F9', color: '#475569', icon: 'bi-stars' },
};

const FORM_INIT = { nama_klub: '', deskripsi: '', kategori: 'teknologi', pembimbing_id: '', kapasitas: 20 };

function KlubAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [klubList,    setKlubList]    = useState([]);
  const [tutorList,   setTutorList]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterAktif, setFilterAktif] = useState('semua'); // 'semua' | 'aktif' | 'nonaktif'

  // Modal state
  const [modal,       setModal]       = useState(null);  // null | 'tambah' | 'edit' | 'detail'
  const [formData,    setFormData]    = useState(FORM_INIT);
  const [editTarget,  setEditTarget]  = useState(null);
  const [detailData,  setDetailData]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [feedback,    setFeedback]    = useState({ type: '', msg: '' });
  const [togglingId,  setTogglingId]  = useState(null);

  const fetchKlub = async () => {
    setLoading(true); setError('');
    try {
      const res = await KlubAPI.getAllAdmin();
      setKlubList(res.data.data || []);
    } catch {
      setError('Gagal memuat data klub.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchKlub();
    AkademikAPI.getTutorOptions()
      .then(res => setTutorList(res.data.data || []))
      .catch(() => {});
  }, []);

  const filtered = klubList.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = !q || k.nama_klub?.toLowerCase().includes(q) || k.jenis?.toLowerCase().includes(q);
    const matchAktif = filterAktif === 'semua' || (filterAktif === 'aktif' ? k.is_aktif : !k.is_aktif);
    return matchSearch && matchAktif;
  });

  const openTambah = () => {
    setFormData(FORM_INIT); setFeedback({ type: '', msg: '' }); setModal('tambah');
  };

  const openEdit = (klub) => {
    setEditTarget(klub);
    setFormData({
      nama_klub:    klub.nama_klub || '',
      deskripsi:    klub.deskripsi || '',
      kategori:     klub.jenis || 'teknologi',
      pembimbing_id: klub.pembimbing_id || '',
      kapasitas:    klub.kapasitas || 20,
    });
    setFeedback({ type: '', msg: '' });
    setModal('edit');
  };

  const openDetail = async (id) => {
    setDetailData(null); setModal('detail');
    try {
      const res = await KlubAPI.getById(id);
      setDetailData(res.data.data);
    } catch { setDetailData({ error: 'Gagal memuat detail klub.' }); }
  };

  const handleSave = async () => {
    const { nama_klub, kapasitas } = formData;
    if (!nama_klub.trim()) { setFeedback({ type: 'error', msg: 'Nama klub wajib diisi.' }); return; }
    if (!kapasitas || kapasitas < 1) { setFeedback({ type: 'error', msg: 'Kapasitas minimal 1.' }); return; }

    setSaving(true); setFeedback({ type: '', msg: '' });
    const payload = {
      ...formData,
      pembimbing_id: formData.pembimbing_id || null,
      kapasitas: parseInt(formData.kapasitas),
    };
    try {
      if (modal === 'tambah') {
        await KlubAPI.create(payload);
        setFeedback({ type: 'success', msg: 'Klub berhasil dibuat!' });
      } else {
        await KlubAPI.update(editTarget.id, payload);
        setFeedback({ type: 'success', msg: 'Klub berhasil diperbarui!' });
      }
      await fetchKlub();
      setTimeout(() => { setModal(null); setFeedback({ type: '', msg: '' }); }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan klub.' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (klub) => {
    const label = klub.is_aktif ? 'nonaktifkan' : 'aktifkan';
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} klub "${klub.nama_klub}"?`)) return;
    setTogglingId(klub.id);
    try {
      await KlubAPI.toggleAktif(klub.id, !klub.is_aktif);
      setKlubList(prev => prev.map(k => k.id === klub.id ? { ...k, is_aktif: k.is_aktif ? 0 : 1 } : k));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status klub.');
    } finally { setTogglingId(null); }
  };

  const handleHapus = async (klub) => {
    if (!window.confirm(`Hapus klub "${klub.nama_klub}" secara permanen?`)) return;
    try {
      await KlubAPI.hapus(klub.id);
      setKlubList(prev => prev.filter(k => k.id !== klub.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus klub.');
    }
  };

  const setForm = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const statAktif   = klubList.filter(k => k.is_aktif).length;
  const statNonaktif = klubList.filter(k => !k.is_aktif).length;
  const statAnggota  = klubList.reduce((s, k) => s + (parseInt(k.jumlah_anggota) || 0), 0);

  return (
    <div className="app-layout klub-admin-page">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* Header */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Manajemen Klub Minat Bakat
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Kelola komunitas bakat minat warga belajar, penugasan guru pembimbing, kuota kelas, serta daftar anggota aktif.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openTambah} style={{ height: 42, padding: '0 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-plus-lg" /> Tambah Klub Baru
            </button>
          </div>

          {/* Statistik Patterned Cards */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-collection-play-fill" />
                </div>
                <span className="admin-stat-tag">TOTAL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{klubList.length}</div>
                <div className="admin-stat-label">Total Klub Ekstrakurikuler</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check-circle-fill" />
                </div>
                <span className="admin-stat-tag">AKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statAktif}</div>
                <div className="admin-stat-label">Klub Sedang Aktif</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-people-fill" />
                </div>
                <span className="admin-stat-tag">ANGGOTA</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statAnggota}</div>
                <div className="admin-stat-label">Total Warga Belajar Terdaftar</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-pause-circle-fill" />
                </div>
                <span className="admin-stat-tag">STATUS</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{statNonaktif}</div>
                <div className="admin-stat-label">Klub Nonaktif / Ditutup</div>
              </div>
            </div>
          </div>

          {/* Tabel Panel */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-trophy-fill" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Klub Minat Bakat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: '4px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  {['semua', 'aktif', 'nonaktif'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilterAktif(f)}
                      style={{
                        padding: '4px 14px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: filterAktif === f ? '#1D4ED8' : 'transparent',
                        color: filterAktif === f ? 'white' : '#64748B',
                        transition: 'all 0.15s ease-in-out',
                      }}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', width: 220 }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.85rem' }} />
                  <input
                    type="text"
                    placeholder="Cari klub..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', height: 36, borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" /><p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat klub...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill" /><span>{error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-trophy" /><h3>Belum Ada Klub Ditemukan</h3>
                <p>{search ? 'Tidak ada klub yang sesuai kriteria pencarian.' : 'Klik "Tambah Klub Baru" untuk membuat klub minat bakat pertama.'}</p>
              </div>
            ) : (
              <div className="table-wrapper klub-admin-table-wrapper" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <table className="table klub-admin-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Nama Klub</th>
                      <th style={{ width: '130px' }}>Kategori</th>
                      <th>Guru Pembimbing</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Kapasitas</th>
                      <th style={{ width: '160px' }}>Keterisian Kuota</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '180px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(klub => {
                      const style = KATEGORI_STYLE[klub.jenis] || KATEGORI_STYLE.lainnya;
                      const isToggling = togglingId === klub.id;
                      const pct = klub.kapasitas ? Math.min(100, Math.round((klub.jumlah_anggota / klub.kapasitas) * 100)) : 0;
                      return (
                        <tr key={klub.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 38, height: 38, borderRadius: 10, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <i className={`bi ${style.icon}`} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}>{klub.nama_klub}</div>
                                {klub.deskripsi && <div className="klub-admin-desc" style={{ color: '#64748B' }}>{klub.deskripsi}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: style.bg, color: style.color, border: '1px solid currentColor', fontWeight: 700, textTransform: 'capitalize' }}>
                              {klub.jenis || '—'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                            {klub.tutor_nama ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-person-check-fill" style={{ color: '#16A34A' }}></i>
                                <span>{klub.tutor_nama}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Belum ditentukan</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.875rem', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>{klub.kapasitas} WB</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 32, color: '#1E293B' }}>{klub.jumlah_anggota}/{klub.kapasitas}</span>
                              <div style={{ flex: 1, height: 7, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#16A34A', borderRadius: 99, transition: 'width 0.3s' }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${klub.is_aktif ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                              {klub.is_aktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div className="klub-admin-action-group" style={{ justifyContent: 'flex-end', gap: 6 }}>
                              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => openDetail(klub.id)} title="Lihat Anggota">
                                <i className="bi bi-people-fill" /> Anggota
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '5px 8px', fontSize: '0.8rem' }} onClick={() => openEdit(klub)} title="Edit Klub">
                                <i className="bi bi-pencil-square" />
                              </button>
                              <button
                                className={`btn ${klub.is_aktif ? 'btn-danger' : 'btn-primary'}`}
                                style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                                onClick={() => handleToggle(klub)}
                                disabled={isToggling}
                                title={klub.is_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {isToggling ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <i className={`bi ${klub.is_aktif ? 'bi-pause-circle' : 'bi-play-circle'}`} />}
                              </button>
                              <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '0.8rem' }} onClick={() => handleHapus(klub)} title="Hapus" disabled={klub.jumlah_anggota > 0}>
                                <i className="bi bi-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                Menampilkan <strong>{filtered.length}</strong> dari <strong>{klubList.length}</strong> klub ekstrakurikuler
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal Tambah / Edit */}
      {(modal === 'tambah' || modal === 'edit') && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className={modal === 'tambah' ? 'bi-plus-circle-fill' : 'bi-pencil-square'} />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">{modal === 'tambah' ? 'Tambah Klub Minat Bakat' : 'Edit Data Klub'}</h3>
                <p className="admin-modal-subtitle">Tentukan nama klub, kategori kegiatan, kapasitas dan guru pembimbing</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setModal(null)} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="admin-modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nama Klub <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Robotika & IoT, Seni Musik Band, Bahasa Jepang"
                    value={formData.nama_klub}
                    onChange={e => setForm('nama_klub', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Deskripsi Singkat Klub</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Deskripsi kegiatan, tujuan, atau silabus singkat…"
                    value={formData.deskripsi}
                    onChange={e => setForm('deskripsi', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Kategori Kegiatan</label>
                    <select className="form-input" value={formData.kategori} onChange={e => setForm('kategori', e.target.value)}>
                      {KATEGORI_LIST.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Kapasitas Maksimal (WB)</label>
                    <input type="number" className="form-input" min={1} max={200} value={formData.kapasitas} onChange={e => setForm('kapasitas', e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Guru Pembimbing / Tutor Penanggung Jawab</label>
                  <select
                    className="form-input"
                    value={formData.pembimbing_id || ''}
                    onChange={e => setForm('pembimbing_id', e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Pilih Guru Pembimbing (Opsional) --</option>
                    {tutorList.map(t => (
                      <option key={t.id} value={t.id}>{t.nama_lengkap} ({t.email})</option>
                    ))}
                  </select>
                </div>

                {feedback.msg && (
                  <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '0.5rem' }}>
                    <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{feedback.msg}</span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan…</> : <><i className="bi bi-check2" /> {modal === 'tambah' ? 'Buat Klub' : 'Simpan Perubahan'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Anggota */}
      {modal === 'detail' && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 680 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className="bi bi-people-fill" />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">Daftar Anggota Klub</h3>
                <p className="admin-modal-subtitle">{detailData?.nama_klub || 'Memuat...'} • Informasi warga belajar terdaftar</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setModal(null)} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="admin-modal-body">
              {!detailData ? (
                <div className="loading-container" style={{ padding: '2rem' }}><div className="spinner" /><p style={{ marginTop: 12 }}>Memuat anggota…</p></div>
              ) : detailData.error ? (
                <div className="alert alert-danger"><i className="bi bi-exclamation-triangle" /><span>{detailData.error}</span></div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', padding: '0.875rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{detailData.nama_klub}</strong>
                      <span className="badge" style={{ marginLeft: 10, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>
                        {detailData.jenis || 'Umum'}
                      </span>
                    </div>
                    <span style={{ color: '#16A34A', fontSize: '0.875rem', fontWeight: 700 }}>
                      <i className="bi bi-check-circle-fill"></i> {detailData.anggota?.length || 0} Anggota Aktif
                    </span>
                  </div>

                  {!detailData.anggota?.length ? (
                    <div className="empty-state" style={{ padding: '2.5rem' }}>
                      <i className="bi bi-person-x" style={{ fontSize: '2.5rem', color: '#94A3B8' }} />
                      <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Belum ada anggota aktif terdaftar di klub ini.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper" style={{ margin: 0 }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: '#F1F5F9' }}>
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Nama Siswa</th>
                            <th>NIS</th>
                            <th>Jenjang</th>
                            <th>Tgl Terdaftar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.anggota.map((a, i) => (
                            <tr key={a.id}>
                              <td style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 700 }}>{i + 1}</td>
                              <td style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{a.nama_lengkap}</td>
                              <td style={{ fontSize: '0.85rem' }}><code style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{a.nis || '—'}</code></td>
                              <td><span className="badge" style={{ background: '#F1F5F9', color: '#334155', fontWeight: 700 }}>{a.jenjang || '—'}</span></td>
                              <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                {a.tanggal_daftar ? new Date(a.tanggal_daftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KlubAdmin;
