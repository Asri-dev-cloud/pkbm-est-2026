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

  const totalPeriode = periodeList.length;
  const totalAktif = periodeList.filter((p) => Number(p.is_active) === 1).length;
  const totalUts = periodeList.filter((p) => (p.jenis_ujian || '').toLowerCase() === 'uts').length;
  const totalUas = periodeList.filter((p) => (p.jenis_ujian || '').toLowerCase() === 'uas').length;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Periode Ujian
              </h1>
              <p style={{ color: '#64748B', marginTop: 4, fontSize: '0.92rem' }}>
                Kelola jadwal periode resmi ujian semester (UTS / UAS) dan aktivasi akses pengerjaan warga belajar.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openCreate} disabled={!canManage} style={{ boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)', padding: '10px 18px', fontWeight: 700 }}>
              <i className="bi bi-calendar-plus" style={{ marginRight: '6px' }}></i> Tambah Periode
            </button>
          </div>

          {/* ── Metric Cards Berpola & Berwarna ── */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-calendar-check" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">TOTAL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalPeriode}</div>
                <div className="admin-stat-label">Total Periode Ujian</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check-circle" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">AKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalAktif}</div>
                <div className="admin-stat-label">Periode Sedang Aktif</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-file-earmark-text" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">UTS</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalUts}</div>
                <div className="admin-stat-label">Ujian Tengah Semester</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-award" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">UAS</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalUas}</div>
                <div className="admin-stat-label">Ujian Akhir Semester</div>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-table" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Periode Ujian Akademik</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                {periodeList.length} Periode Terdaftar
              </span>
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
        <SimpleModal
          title={editingItem ? 'Edit Periode Ujian' : 'Tambah Periode Ujian'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !canManage}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} /> Menyimpan...</> : <><i className="bi bi-check2" style={{ marginRight: 6 }}></i> Simpan Periode</>}
              </button>
            </>
          }
        >
          <div className="grid-cols-2" style={{ marginBottom: '1rem', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Nama Periode <span style={{ color: '#EF4444' }}>*</span></label>
              <input className="form-input" placeholder="Contoh: UTS Semester Ganjil 2026/2027" value={form.nama_periode} onChange={(e) => setForm((prev) => ({ ...prev, nama_periode: e.target.value }))} style={{ borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Jenis Asesmen</label>
              <select className="form-input" value={form.jenis_ujian} onChange={(e) => setForm((prev) => ({ ...prev, jenis_ujian: e.target.value }))} style={{ borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '10px 14px' }}>
                <option value="uts">UTS (Ujian Tengah Semester)</option>
                <option value="uas">UAS (Ujian Akhir Semester)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Semester</label>
              <select className="form-input" value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} style={{ borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '10px 14px' }}>
                <option value="ganjil">Semester Ganjil</option>
                <option value="genap">Semester Genap</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Tanggal Mulai <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="date" className="form-input" value={form.tanggal_mulai} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_mulai: e.target.value }))} style={{ borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '10px 14px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Tanggal Selesai <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="date" className="form-input" value={form.tanggal_selesai} onChange={(e) => setForm((prev) => ({ ...prev, tanggal_selesai: e.target.value }))} style={{ borderRadius: 10, border: '1.5px solid #CBD5E1', padding: '10px 14px' }} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} style={{ width: 18, height: 18 }} />
                <span>Langsung Aktifkan Periode Ujian Ini</span>
              </label>
            </div>
          </div>

          {feedback.msg && (
            <div className={`alert ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginTop: '0.75rem', borderRadius: 12 }}>
              <i className={`bi ${feedback.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}`}></i>
              <span>{feedback.msg}</span>
            </div>
          )}
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

function SimpleModal({ title, onClose, children, footer, maxWidth = 640 }) {
  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal-dialog" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="admin-modal-close" onClick={onClose} title="Tutup">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
        {footer && (
          <div className="admin-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default PeriodeUjianAdmin;
