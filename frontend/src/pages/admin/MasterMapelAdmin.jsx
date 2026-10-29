import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AkademikAPI } from '../../services/api.js';

const JENJANG_OPTIONS = [
  { value: '', label: 'Semua Jenjang' },
  { value: 'paket_a', label: 'Paket A' },
  { value: 'paket_b', label: 'Paket B' },
  { value: 'paket_c', label: 'Paket C' },
  { value: 'semua', label: 'Semua Paket' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

const EMPTY_FORM = {
  kode: '',
  nama: '',
  jenjang: 'paket_c',
  deskripsi: '',
  is_active: true,
};

function MasterMapelAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const canManage = ['super_admin', 'admin'].includes(user.role);
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const fetchMapel = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await AkademikAPI.getAllMapel({
        keyword: keyword || undefined,
        jenjang: filterJenjang || undefined,
        is_active: filterStatus || undefined,
      });
      setMapelList(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data master mapel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapel();
  }, [filterJenjang, filterStatus]);

  const mapelFiltered = useMemo(() => {
    if (!keyword.trim()) return mapelList;
    const q = keyword.toLowerCase();
    return mapelList.filter((item) =>
      item.nama?.toLowerCase().includes(q) ||
      item.kode?.toLowerCase().includes(q)
    );
  }, [mapelList, keyword]);

  const openCreate = () => {
    setEditingMapel(null);
    setForm(EMPTY_FORM);
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const openEdit = (mapel) => {
    setEditingMapel(mapel);
    setForm({
      kode: mapel.kode || '',
      nama: mapel.nama || '',
      jenjang: mapel.jenjang || 'paket_c',
      deskripsi: mapel.deskripsi || '',
      is_active: Boolean(mapel.is_active),
    });
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.kode.trim() || !form.nama.trim() || !form.jenjang) {
      setFeedback({ type: 'error', msg: 'Kode, nama, dan jenjang wajib diisi.' });
      return;
    }

    setSaving(true);
    setFeedback({ type: '', msg: '' });
    try {
      const payload = {
        kode: form.kode.trim(),
        nama: form.nama.trim(),
        jenjang: form.jenjang,
        deskripsi: form.deskripsi.trim(),
        is_active: form.is_active,
      };
      if (editingMapel) {
        await AkademikAPI.updateMapel(editingMapel.id, payload);
      } else {
        await AkademikAPI.createMapel(payload);
      }
      setModalOpen(false);
      await fetchMapel();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan mapel.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await AkademikAPI.updateMapelStatus(item.id, !item.is_active);
      await fetchMapel();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status mapel.');
    }
  };

  const stats = useMemo(() => {
    return {
      total: mapelList.length,
      paketA: mapelList.filter((m) => m.jenjang === 'paket_a').length,
      paketB: mapelList.filter((m) => m.jenjang === 'paket_b').length,
      paketC: mapelList.filter((m) => m.jenjang === 'paket_c').length,
      aktif: mapelList.filter((m) => m.is_active).length,
    };
  }, [mapelList]);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Master Mata Pelajaran
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Kelola data inti mata pelajaran Kurikulum Merdeka PKBM Bina Mandiri untuk seluruh jenjang kesetaraan.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} disabled={!canManage} style={{ height: 42, padding: '0 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-plus-lg"></i> Tambah Mapel Baru
            </button>
          </div>

          {/* Metric Cards with Patterns */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-journal-text"></i>
                </div>
                <span className="admin-stat-tag">TOTAL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.total}</div>
                <div className="admin-stat-label">Total Mata Pelajaran</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <span className="admin-stat-tag">PAKET A</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.paketA}</div>
                <div className="admin-stat-label">Mapel Paket A (SD)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-sky">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-backpack-fill"></i>
                </div>
                <span className="admin-stat-tag">PAKET B</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.paketB}</div>
                <div className="admin-stat-label">Mapel Paket B (SMP)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-layers-fill"></i>
                </div>
                <span className="admin-stat-tag">PAKET C</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.paketC}</div>
                <div className="admin-stat-label">Mapel Paket C (SMA)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <span className="admin-stat-tag">AKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.aktif}</div>
                <div className="admin-stat-label">Mata Pelajaran Aktif</div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
                <input
                  className="form-input"
                  placeholder="Cari nama mapel atau kode..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: '100%', height: 40, paddingLeft: 36, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}
                />
              </div>
              <select className="form-input" value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)} style={{ width: 180, height: 40, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}>
                {JENJANG_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 160, height: 40, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}>
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {/* Table Panel */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-table" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Master Mata Pelajaran</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                Menampilkan {mapelFiltered.length} Mapel
              </span>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Memuat master mapel...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            ) : mapelFiltered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-journal-x"></i>
                <h3>Belum Ada Mapel Ditemukan</h3>
                <p>Mata pelajaran yang Anda cari tidak tersedia atau belum dibuat dalam database.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Kode Mapel</th>
                      <th>Nama Mata Pelajaran</th>
                      <th style={{ width: '150px' }}>Jenjang</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>Dipakai di Rombel</th>
                      <th style={{ width: '180px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapelFiltered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <code style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.kode}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.925rem' }}>{item.nama}</div>
                          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: 2 }}>{item.deskripsi || 'Tanpa deskripsi'}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: item.jenjang === 'paket_a' ? '#ECFDF5' : item.jenjang === 'paket_b' ? '#F0F9FF' : '#F5F3FF', color: item.jenjang === 'paket_a' ? '#047857' : item.jenjang === 'paket_b' ? '#0369A1' : '#6D28D9', border: '1px solid currentColor', fontWeight: 700 }}>
                            {formatJenjang(item.jenjang)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#F1F5F9', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                            <i className="bi bi-people-fill text-muted"></i> {item.jumlah_rombel || 0} Rombel
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ padding: '5px 11px', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => openEdit(item)} disabled={!canManage}>
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button
                              className={`btn ${item.is_active ? 'btn-danger' : 'btn-primary'}`}
                              style={{ padding: '5px 11px', fontSize: '0.8rem', fontWeight: 600 }}
                              onClick={() => handleToggleStatus(item)}
                              disabled={!canManage}
                            >
                              <i className={`bi ${item.is_active ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                              {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className={editingMapel ? 'bi-pencil-square' : 'bi-plus-circle'}></i>
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">{editingMapel ? 'Edit Master Mapel' : 'Tambah Mapel Baru'}</h3>
                <p className="admin-modal-subtitle">Silakan isi kode unik, nama resmi mapel, dan jenjang pendidikan</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setModalOpen(false)} aria-label="Tutup">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="admin-modal-body">
                <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Kode Mapel <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      className="form-input"
                      placeholder="Contoh: BIND-C, MTK-B"
                      value={form.kode}
                      onChange={(e) => setForm((prev) => ({ ...prev, kode: e.target.value.toUpperCase() }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Jenjang Kesetaraan <span style={{ color: '#DC2626' }}>*</span></label>
                    <select className="form-input" value={form.jenjang} onChange={(e) => setForm((prev) => ({ ...prev, jenjang: e.target.value }))}>
                      {JENJANG_OPTIONS.filter((item) => item.value).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Nama Mata Pelajaran <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      className="form-input"
                      placeholder="Contoh: Bahasa Indonesia, Matematika Terapan"
                      value={form.nama}
                      onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Deskripsi Singkat / Catatan Kurikulum</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Tuliskan silabus singkat atau capaian pembelajaran utama..."
                      value={form.deskripsi}
                      onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'inline-flex', gap: 10, alignItems: 'center', fontWeight: 700, cursor: 'pointer', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Mata Pelajaran Aktif (Dapat dipilih saat penjadwalan rombel)</span>
                    </label>
                  </div>
                </div>

                {feedback.msg && (
                  <div className={`alert ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '0.5rem' }}>
                    <i className={`bi ${feedback.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}`}></i>
                    <span>{feedback.msg}</span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || !canManage}>
                  {saving ? (
                    <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</>
                  ) : (
                    <><i className="bi bi-check2"></i> Simpan Mapel</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatJenjang(value) {
  const map = {
    paket_a: 'Paket A (SD)',
    paket_b: 'Paket B (SMP)',
    paket_c: 'Paket C (SMA)',
    semua: 'Semua Paket',
  };
  return map[value] || value;
}

export default MasterMapelAdmin;
