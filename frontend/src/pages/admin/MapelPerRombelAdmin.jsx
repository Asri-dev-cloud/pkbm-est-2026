import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { AkademikAPI } from '../../services/api.js';

const EMPTY_FORM = {
  rombel_id: '',
  mapel_id: '',
  tutor_id: '',
  is_visible: true,
  urutan: 0,
};

function MapelPerRombelAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const canManage = ['super_admin', 'admin'].includes(user.role);
  const [rombelOptions, setRombelOptions] = useState([]);
  const [tutorOptions, setTutorOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [mappingList, setMappingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const loadInitial = async () => {
    try {
      const [rombelRes, tutorRes, mapelRes] = await Promise.all([
        AkademikAPI.getRombelOptions(),
        AkademikAPI.getTutorOptions(),
        AkademikAPI.getAllMapel({ is_active: 1 }),
      ]);
      const rombel = rombelRes.data.data || [];
      setRombelOptions(rombel);
      setTutorOptions(tutorRes.data.data || []);
      setMapelOptions(mapelRes.data.data || []);
      if (!selectedRombelId && rombel.length > 0) {
        setSelectedRombelId(String(rombel[0].id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data referensi akademik.');
    }
  };

  const fetchMapping = async (rombelId) => {
    if (!rombelId) {
      setMappingList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await AkademikAPI.getRombelMapel({ rombel_id: rombelId });
      setMappingList(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat mapel per rombel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    fetchMapping(selectedRombelId);
  }, [selectedRombelId]);

  const usedMapelIds = useMemo(() => new Set(mappingList.map((item) => item.mapel_id)), [mappingList]);
  const availableMapelOptions = useMemo(() => {
    if (editingItem) {
      return mapelOptions;
    }
    return mapelOptions.filter((item) => !usedMapelIds.has(item.id));
  }, [mapelOptions, usedMapelIds, editingItem]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      rombel_id: selectedRombelId || '',
    });
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      rombel_id: String(item.rombel_id),
      mapel_id: String(item.mapel_id),
      tutor_id: item.tutor_id ? String(item.tutor_id) : '',
      is_visible: Boolean(item.is_visible),
      urutan: item.urutan || 0,
    });
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.rombel_id || !form.mapel_id) {
      setFeedback({ type: 'error', msg: 'Rombel dan mapel wajib dipilih.' });
      return;
    }

    setSaving(true);
    setFeedback({ type: '', msg: '' });
    try {
      const payload = {
        rombel_id: parseInt(form.rombel_id),
        mapel_id: parseInt(form.mapel_id),
        tutor_id: form.tutor_id ? parseInt(form.tutor_id) : null,
        is_visible: Boolean(form.is_visible),
        urutan: parseInt(form.urutan) || 0,
      };
      if (editingItem) {
        await AkademikAPI.updateRombelMapel(editingItem.id, payload);
      } else {
        await AkademikAPI.createRombelMapel(payload);
      }
      setModalOpen(false);
      await fetchMapping(selectedRombelId);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan mapping mapel rombel.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (item) => {
    try {
      await AkademikAPI.updateRombelMapelVisibility(item.id, !item.is_visible);
      await fetchMapping(selectedRombelId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status tampil mapel.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus mapel ${item.nama_mapel} dari rombel ${item.nama_rombel}?`)) return;
    try {
      await AkademikAPI.deleteRombelMapel(item.id);
      await fetchMapping(selectedRombelId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus mapping mapel rombel.');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Mapel per Rombel</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Pasang mapel ke rombel, tentukan tutor pengampu, dan atur visibilitas ruang belajar.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} disabled={!selectedRombelId || !canManage}>
              <i className="bi bi-node-plus"></i> Tambah Mapel ke Rombel
            </button>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title">Filter Rombel</h3>
              <select className="form-input" value={selectedRombelId} onChange={(e) => setSelectedRombelId(e.target.value)} style={{ width: 260, height: 38 }}>
                <option value="">Pilih Rombel</option>
                {rombelOptions.map((rombel) => (
                  <option key={rombel.id} value={rombel.id}>
                    {rombel.nama_rombel} ({formatJenjang(rombel.jenjang)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daftar Mapel pada Rombel</h3>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Memuat mapping mapel rombel...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            ) : !selectedRombelId ? (
              <div className="empty-state">
                <i className="bi bi-collection"></i>
                <h3>Pilih Rombel Terlebih Dahulu</h3>
                <p>Silakan pilih rombel untuk melihat mapel yang terpasang.</p>
              </div>
            ) : mappingList.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-diagram-3"></i>
                <h3>Belum Ada Mapping Mapel</h3>
                <p>Tambahkan mapel ke rombel ini agar muncul di ruang belajar.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Urutan</th>
                      <th>Mapel</th>
                      <th>Tutor Pengampu</th>
                      <th>Status Mapel</th>
                      <th>Tampil di Ruang Belajar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.urutan || 0}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.nama_mapel}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.kode_mapel}</div>
                        </td>
                        <td>{item.nama_tutor || <span style={{ color: 'var(--color-text-muted)' }}>Belum ditetapkan</span>}</td>
                        <td>
                          <span className={`badge ${item.mapel_is_active ? 'badge-success' : 'badge-danger'}`}>
                            {item.mapel_is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.is_visible ? 'badge-success' : 'badge-warning'}`}>
                            {item.is_visible ? 'Tampil' : 'Disembunyikan'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openEdit(item)} disabled={!canManage}>
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button className={`btn ${item.is_visible ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleToggleVisibility(item)} disabled={!canManage}>
                              <i className={`bi ${item.is_visible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              {item.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleDelete(item)} disabled={!canManage}>
                              <i className="bi bi-trash"></i> Hapus
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
        <SimpleModal title={editingItem ? 'Edit Mapel per Rombel' : 'Tambah Mapel ke Rombel'} onClose={() => setModalOpen(false)}>
          <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Rombel</label>
              <select className="form-input" value={form.rombel_id} onChange={(e) => setForm((prev) => ({ ...prev, rombel_id: e.target.value }))}>
                <option value="">Pilih Rombel</option>
                {rombelOptions.map((rombel) => (
                  <option key={rombel.id} value={rombel.id}>{rombel.nama_rombel}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mapel</label>
              <select className="form-input" value={form.mapel_id} onChange={(e) => setForm((prev) => ({ ...prev, mapel_id: e.target.value }))}>
                <option value="">Pilih Mapel</option>
                {availableMapelOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tutor Pengampu</label>
              <select className="form-input" value={form.tutor_id} onChange={(e) => setForm((prev) => ({ ...prev, tutor_id: e.target.value }))}>
                <option value="">Belum ditentukan</option>
                {tutorOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.nama_lengkap}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urutan Tampil</label>
              <input type="number" className="form-input" min={0} value={form.urutan} onChange={(e) => setForm((prev) => ({ ...prev, urutan: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm((prev) => ({ ...prev, is_visible: e.target.checked }))} />
                Tampilkan mapel ini di Ruang Belajar
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
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Mapping</>}
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

export default MapelPerRombelAdmin;
