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

  const stats = useMemo(() => {
    const totalAssigned = mappingList.length;
    const tutorsSet = new Set(mappingList.map((m) => m.tutor_id).filter(Boolean));
    const visibleCount = mappingList.filter((m) => m.is_visible).length;
    const hiddenCount = mappingList.filter((m) => !m.is_visible).length;
    return {
      totalAssigned,
      totalTutors: tutorsSet.size,
      visibleCount,
      hiddenCount,
    };
  }, [mappingList]);

  const activeRombelObj = useMemo(() => {
    return rombelOptions.find((r) => String(r.id) === String(selectedRombelId));
  }, [rombelOptions, selectedRombelId]);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Mapel per Rombel
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Pasangkan mata pelajaran ke rombongan belajar, tentukan tutor pengampu resmi, dan atur visibilitas materi siswa.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={openCreate}
              disabled={!selectedRombelId || !canManage}
              style={{ height: 42, padding: '0 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="bi bi-plus-lg"></i> Tambah Mapel ke Rombel
            </button>
          </div>

          {/* Metric Cards with Patterns */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-book-half"></i>
                </div>
                <span className="admin-stat-tag">MAPEL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.totalAssigned}</div>
                <div className="admin-stat-label">Mapel Ditugaskan di Rombel</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-person-video3"></i>
                </div>
                <span className="admin-stat-tag">TUTOR</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.totalTutors}</div>
                <div className="admin-stat-label">Tutor Pengampu Aktif</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-sky">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-eye-fill"></i>
                </div>
                <span className="admin-stat-tag">TAMPIL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.visibleCount}</div>
                <div className="admin-stat-label">Tampil di Ruang Belajar</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-eye-slash-fill"></i>
                </div>
                <span className="admin-stat-tag">DRAFT</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{stats.hiddenCount}</div>
                <div className="admin-stat-label">Disembunyikan / Draft</div>
              </div>
            </div>
          </div>

          {/* Rombel Selection Panel */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.1rem 1.35rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  <i className="bi bi-people-fill"></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rombongan Belajar Terpilih</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    {activeRombelObj ? `${activeRombelObj.nama_rombel} (${formatJenjang(activeRombelObj.jenjang)})` : 'Silakan Pilih Rombel'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>Ganti Rombel:</label>
                <select
                  className="form-input"
                  value={selectedRombelId}
                  onChange={(e) => setSelectedRombelId(e.target.value)}
                  style={{ width: 280, height: 42, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 700, color: '#0F172A' }}
                >
                  <option value="">-- Pilih Rombongan Belajar --</option>
                  {rombelOptions.map((rombel) => (
                    <option key={rombel.id} value={rombel.id}>
                      {rombel.nama_rombel} ({formatJenjang(rombel.jenjang)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Panel */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-table" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Mata Pelajaran pada Rombel</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                {mappingList.length} Mapel Terpasang
              </span>
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
                <p>Silakan pilih rombongan belajar di atas untuk melihat mapel yang terpasang.</p>
              </div>
            ) : mappingList.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-diagram-3"></i>
                <h3>Belum Ada Mapping Mapel</h3>
                <p>Tambahkan mapel ke rombel ini agar materi dan tugas dapat diakses warga belajar.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Urutan</th>
                      <th>Mata Pelajaran</th>
                      <th>Tutor Pengampu</th>
                      <th style={{ width: '130px' }}>Status Mapel</th>
                      <th style={{ width: '180px' }}>Ruang Belajar</th>
                      <th style={{ width: '220px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingList.map((item) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', width: 28, height: 28, lineHeight: '28px', background: '#F1F5F9', borderRadius: '50%', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                            {item.urutan || 0}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.925rem' }}>{item.nama_mapel}</div>
                          <div style={{ color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 700, marginTop: 2 }}>{item.kode_mapel}</div>
                        </td>
                        <td>
                          {item.nama_tutor ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#334155' }}>
                              <i className="bi bi-person-check-fill" style={{ color: '#16A34A' }}></i>
                              <span>{item.nama_tutor}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>Belum ditetapkan</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${item.mapel_is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                            {item.mapel_is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.is_visible ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <i className={`bi ${item.is_visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                            {item.is_visible ? 'Tampil untuk Siswa' : 'Disembunyikan'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ padding: '5px 11px', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => openEdit(item)} disabled={!canManage}>
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button
                              className={`btn ${item.is_visible ? 'btn-danger' : 'btn-primary'}`}
                              style={{ padding: '5px 11px', fontSize: '0.8rem', fontWeight: 600 }}
                              onClick={() => handleToggleVisibility(item)}
                              disabled={!canManage}
                            >
                              <i className={`bi ${item.is_visible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              {item.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '5px 11px', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => handleDelete(item)} disabled={!canManage}>
                              <i className="bi bi-trash"></i>
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
                <i className={editingItem ? 'bi-pencil-square' : 'bi-node-plus-fill'}></i>
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">{editingItem ? 'Edit Mapel Rombel' : 'Tambah Mapel ke Rombel'}</h3>
                <p className="admin-modal-subtitle">Tentukan rombel, mata pelajaran kurikulum, dan tutor penanggung jawab</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setModalOpen(false)} aria-label="Tutup">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="admin-modal-body">
                <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Rombongan Belajar <span style={{ color: '#DC2626' }}>*</span></label>
                    <select className="form-input" value={form.rombel_id} onChange={(e) => setForm((prev) => ({ ...prev, rombel_id: e.target.value }))} required>
                      <option value="">Pilih Rombel</option>
                      {rombelOptions.map((rombel) => (
                        <option key={rombel.id} value={rombel.id}>{rombel.nama_rombel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Mata Pelajaran <span style={{ color: '#DC2626' }}>*</span></label>
                    <select className="form-input" value={form.mapel_id} onChange={(e) => setForm((prev) => ({ ...prev, mapel_id: e.target.value }))} required>
                      <option value="">Pilih Mapel</option>
                      {availableMapelOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Tutor Pengampu</label>
                    <select className="form-input" value={form.tutor_id} onChange={(e) => setForm((prev) => ({ ...prev, tutor_id: e.target.value }))}>
                      <option value="">Belum ditentukan</option>
                      {tutorOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.nama_lengkap}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Urutan Tampilan</label>
                    <input type="number" className="form-input" min={0} value={form.urutan} onChange={(e) => setForm((prev) => ({ ...prev, urutan: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'inline-flex', gap: 10, alignItems: 'center', fontWeight: 700, cursor: 'pointer', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <input
                        type="checkbox"
                        checked={form.is_visible}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_visible: e.target.checked }))}
                        style={{ width: 18, height: 18 }}
                      />
                      <span>Tampilkan mapel ini di Ruang Belajar siswa secara langsung</span>
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
                    <><i className="bi bi-check2"></i> Simpan Penugasan Mapel</>
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
    paket_a: 'Paket A',
    paket_b: 'Paket B',
    paket_c: 'Paket C',
    semua: 'Semua Paket',
  };
  return map[value] || value;
}

export default MapelPerRombelAdmin;
