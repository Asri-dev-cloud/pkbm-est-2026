import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { UjianAPI } from '../../services/api.js';

const EMPTY_FORM = {
  nama_periode: '',
  jenis_ujian: 'uts',
  semester: 'ganjil',
  tahun_ajaran_id: 1,
  tanggal_mulai: '',
  tanggal_selesai: '',
  is_active: true,
};

function PeriodeUjianAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const canManage = ['super_admin', 'admin'].includes(user.role);
  const [periodeList, setPeriodeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const fetchPeriode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await UjianAPI.getAllPeriode();
      setPeriodeList(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat periode ujian.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriode();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      nama_periode: item.nama_periode || '',
      jenis_ujian: item.jenis_ujian || 'uts',
      semester: item.semester || 'ganjil',
      tahun_ajaran_id: item.tahun_ajaran_id || 1,
      tanggal_mulai: toDateInput(item.tanggal_mulai),
      tanggal_selesai: toDateInput(item.tanggal_selesai),
      is_active: Boolean(item.is_active),
    });
    setFeedback({ type: '', msg: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama_periode || !form.tanggal_mulai || !form.tanggal_selesai) {
      setFeedback({ type: 'error', msg: 'Nama periode dan tanggal wajib diisi.' });
      return;
    }
    setSaving(true);
    setFeedback({ type: '', msg: '' });
    try {
      const payload = {
        ...form,
        tahun_ajaran_id: parseInt(form.tahun_ajaran_id) || 1,
        is_active: Boolean(form.is_active),
      };
      if (editingItem) {
        await UjianAPI.updatePeriode(editingItem.id, payload);
      } else {
        await UjianAPI.createPeriode(payload);
      }
      setModalOpen(false);
      await fetchPeriode();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan periode ujian.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await UjianAPI.updatePeriodeStatus(item.id, !item.is_active);
      await fetchPeriode();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status periode ujian.');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Periode Ujian</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Kelola periode resmi ujian seperti UTS/UAS per semester dan tahun ajaran.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} disabled={!canManage}>
              <i className="bi bi-calendar-plus"></i> Tambah Periode
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daftar Periode Ujian</h3>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Memuat periode ujian...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            ) : periodeList.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar-x"></i>
                <h3>Belum Ada Periode Ujian</h3>
                <p>Buat periode UTS atau UAS terlebih dahulu sebelum generate peserta ujian.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th>Jenis</th>
                      <th>Semester</th>
                      <th>Tahun Ajaran</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodeList.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700 }}>{item.nama_periode}</td>
                        <td><span className="badge badge-info">{String(item.jenis_ujian).toUpperCase()}</span></td>
                        <td>{capitalize(item.semester)}</td>
                        <td>{item.nama_tahun_ajaran}</td>
                        <td>{formatDateRange(item.tanggal_mulai, item.tanggal_selesai)}</td>
                        <td>
                          <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openEdit(item)} disabled={!canManage}>
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button className={`btn ${item.is_active ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleToggleStatus(item)} disabled={!canManage}>
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
        <SimpleModal title={editingItem ? 'Edit Periode Ujian' : 'Tambah Periode Ujian'} onClose={() => setModalOpen(false)}>
          <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nama Periode</label>
              <input className="form-input" value={form.nama_periode} onChange={(e) => setForm((prev) => ({ ...prev, nama_periode: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis Ujian</label>
              <select className="form-input" value={form.jenis_ujian} onChange={(e) => setForm((prev) => ({ ...prev, jenis_ujian: e.target.value }))}>
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-input" value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}>
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Mulai</label>
              <input type="date" className="form-input" value={form.tanggal_mulai} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_mulai: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Selesai</label>
              <input type="date" className="form-input" value={form.tanggal_selesai} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_selesai: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
                Periode aktif
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
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Periode</>}
            </button>
          </div>
        </SimpleModal>
      )}
    </div>
  );
}

function formatDateRange(start, end) {
  return `${toDateInput(start)} s.d. ${toDateInput(end)}`;
}

function capitalize(value) {
  if (!value) return '-';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
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

export default PeriodeUjianAdmin;
