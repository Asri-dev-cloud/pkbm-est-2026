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

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Master Mapel</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Kelola data inti mata pelajaran yang tersedia di sistem akademik.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} disabled={!canManage}>
              <i className="bi bi-journal-plus"></i> Tambah Mapel
            </button>
          </div>

          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title">Daftar Master Mapel</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  placeholder="Cari nama atau kode mapel..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: 240, height: 38 }}
                />
                <select className="form-input" value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)} style={{ width: 160, height: 38 }}>
                  {JENJANG_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 140, height: 38 }}>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
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
                <h3>Belum Ada Mapel</h3>
                <p>Tambahkan mata pelajaran baru untuk mulai mengatur ruang belajar.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama Mapel</th>
                      <th>Jenjang</th>
                      <th>Status</th>
                      <th>Dipakai di Rombel</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapelFiltered.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.kode}</code></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.nama}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.deskripsi || 'Tanpa deskripsi'}</div>
                        </td>
                        <td>{formatJenjang(item.jenjang)}</td>
                        <td>
                          <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>{item.jumlah_rombel || 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openEdit(item)} disabled={!canManage}>
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button
                              className={`btn ${item.is_active ? 'btn-danger' : 'btn-primary'}`}
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
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
        <SimpleModal title={editingMapel ? 'Edit Mapel' : 'Tambah Mapel'} onClose={() => setModalOpen(false)}>
          <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kode Mapel</label>
              <input className="form-input" value={form.kode} onChange={(e) => setForm((prev) => ({ ...prev, kode: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Jenjang</label>
              <select className="form-input" value={form.jenjang} onChange={(e) => setForm((prev) => ({ ...prev, jenjang: e.target.value }))}>
                {JENJANG_OPTIONS.filter((item) => item.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nama Mapel</label>
              <input className="form-input" value={form.nama} onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Deskripsi</label>
              <textarea className="form-input" rows={3} value={form.deskripsi} onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
                Mapel aktif
              </label>
            </div>
          </div>

          {feedback.msg && (
            <div className={`alert ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
              <i className={`bi ${feedback.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}`}></i>
              <span>{feedback.msg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !canManage}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Mapel</>}
            </button>
          </div>
        </SimpleModal>
      )}
    </div>
  );
}

function SimpleModal({ title, onClose, children, maxWidth = 640 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', color: 'var(--color-text-muted)' }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

function formatJenjang(value) {
  const map = {
    paket_a: 'Paket A',
    paket_b: 'Paket B',
    paket_c: 'Paket C',
    semua: 'Semua Paket',
  };
  return map[value] || value;
}

export default MasterMapelAdmin;
