// ============================================================
// frontend/src/pages/admin/RaporAdmin.jsx
// Halaman Manajemen Rapor Siswa Digital (Admin View: CRUD & Print)
// ============================================================

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { RaporAPI } from '../../services/api.js';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Printer,
  CheckCircle,
  Clock,
  Award,
  Users,
  RotateCcw,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import './RaporAdmin.css';

export default function RaporAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State Data & Filter ────────────────────────────────────
  const [meta, setMeta] = useState({
    tahun_ajaran: [],
    rombel: [],
    mata_pelajaran: [],
    siswa: []
  });

  const [raporList, setRaporList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTa, setFilterTa] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterRombel, setFilterRombel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal Create / Edit State ──────────────────────────────
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    warga_belajar_id: '',
    rombel_id: '',
    tahun_ajaran_id: '',
    semester: '1',
    status_rapor: 'draft',
    total_hadir: 0,
    total_izin: 0,
    total_sakit: 0,
    total_alpa: 0,
    catatan_wali: '',
    nilai: []
  });

  // ── Modal Print / Preview State ────────────────────────────
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loadingPrint, setLoadingPrint] = useState(false);

  // ── Modal Delete State ─────────────────────────────────────
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load Meta & Data ───────────────────────────────────────
  const fetchMetaAndList = async () => {
    try {
      setLoading(true);
      const metaRes = await RaporAPI.getMeta();
      if (metaRes.data?.success) {
        setMeta(metaRes.data.data);
      }
      await fetchRaporList();
    } catch (err) {
      console.error('Error fetching initial meta:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaporList = async () => {
    try {
      const res = await RaporAPI.getAll({
        tahun_ajaran_id: filterTa || undefined,
        semester: filterSemester || undefined,
        rombel_id: filterRombel || undefined,
        search: searchQuery || undefined
      });
      if (res.data?.success) {
        setRaporList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching rapor list:', err);
    }
  };

  useEffect(() => {
    fetchMetaAndList();
  }, []);

  useEffect(() => {
    fetchRaporList();
  }, [filterTa, filterSemester, filterRombel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRaporList();
  };

  const handleResetFilter = () => {
    setFilterTa('');
    setFilterSemester('');
    setFilterRombel('');
    setSearchQuery('');
  };

  // ── Handlers Form Create / Edit ────────────────────────────
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormError('');

    const defaultTa = meta.tahun_ajaran.find(ta => ta.is_aktif) || meta.tahun_ajaran[0];

    setFormData({
      warga_belajar_id: '',
      rombel_id: '',
      tahun_ajaran_id: defaultTa ? defaultTa.id : '',
      semester: '1',
      status_rapor: 'draft',
      total_hadir: 0,
      total_izin: 0,
      total_sakit: 0,
      total_alpa: 0,
      catatan_wali: '',
      nilai: []
    });

    setShowFormModal(true);
  };

  const handleSelectSiswa = (wbId) => {
    const s = meta.siswa.find(sw => String(sw.id) === String(wbId));
    if (!s) return;

    // Filter mapel yang cocok dengan jenjang siswa
    const mapelCocok = meta.mata_pelajaran.filter(
      m => m.jenjang === 'semua' || m.jenjang === s.jenjang
    );

    const initialNilai = mapelCocok.map(m => ({
      mapel_id: m.id,
      nama_mapel: m.nama_mapel,
      kode_mapel: m.kode_mapel,
      kkm: m.kkm || 75,
      nilai_tugas: 80,
      nilai_uts: 80,
      nilai_uas: 80,
      nilai_akhir: 80,
      predikat: 'B',
      catatan: 'Menunjukkan penguasaan materi pembelajaran yang baik.'
    }));

    setFormData(prev => ({
      ...prev,
      warga_belajar_id: s.id,
      rombel_id: s.rombel_id || (meta.rombel[0] ? meta.rombel[0].id : ''),
      tahun_ajaran_id: prev.tahun_ajaran_id || s.tahun_ajaran_id || (meta.tahun_ajaran[0] ? meta.tahun_ajaran[0].id : ''),
      nilai: initialNilai
    }));
  };

  const handleScoreChange = (index, field, value) => {
    const updated = [...formData.nilai];
    const item = { ...updated[index] };
    item[field] = value === '' ? '' : Number(value);

    // Hitung otomatis Nilai Akhir: (Tugas*0.3) + (UTS*0.3) + (UAS*0.4)
    const nTugas = Number(item.nilai_tugas || 0);
    const nUts = Number(item.nilai_uts || 0);
    const nUas = Number(item.nilai_uas || 0);
    const calculatedAkhir = Math.round(((nTugas * 0.3) + (nUts * 0.3) + (nUas * 0.4)) * 10) / 10;
    item.nilai_akhir = calculatedAkhir;

    // Predikat otomatis
    if (calculatedAkhir >= 85) item.predikat = 'A';
    else if (calculatedAkhir >= 75) item.predikat = 'B';
    else if (calculatedAkhir >= 60) item.predikat = 'C';
    else item.predikat = 'D';

    updated[index] = item;
    setFormData(prev => ({ ...prev, nilai: updated }));
  };

  const handleCatatanMapelChange = (index, value) => {
    const updated = [...formData.nilai];
    updated[index].catatan = value;
    setFormData(prev => ({ ...prev, nilai: updated }));
  };

  const handleOpenEdit = async (rapor) => {
    try {
      setLoading(true);
      const res = await RaporAPI.getById(rapor.id);
      if (res.data?.success) {
        const d = res.data.data;
        setIsEditing(true);
        setEditingId(rapor.id);
        setFormError('');

        setFormData({
          warga_belajar_id: d.warga_belajar_id,
          rombel_id: d.rombel_id,
          tahun_ajaran_id: d.tahun_ajaran_id,
          semester: String(d.semester),
          status_rapor: d.status_rapor,
          total_hadir: d.total_hadir || 0,
          total_izin: d.total_izin || 0,
          total_sakit: d.total_sakit || 0,
          total_alpa: d.total_alpa || 0,
          catatan_wali: d.catatan_wali || '',
          nilai: d.nilai.map(n => ({
            mapel_id: n.mapel_id,
            nama_mapel: n.nama_mapel,
            kode_mapel: n.kode_mapel,
            kkm: n.kkm || 75,
            nilai_tugas: n.nilai_tugas,
            nilai_uts: n.nilai_uts,
            nilai_uas: n.nilai_uas,
            nilai_akhir: n.nilai_akhir,
            predikat: n.predikat,
            catatan: n.catatan || ''
          }))
        });

        setShowFormModal(true);
      }
    } catch (err) {
      console.error('Error fetching detail for edit:', err);
      alert('Gagal memuat detail rapor untuk diedit.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.warga_belajar_id) {
      setFormError('Silakan pilih Warga Belajar terlebih dahulu.');
      return;
    }
    if (!formData.tahun_ajaran_id) {
      setFormError('Silakan pilih Tahun Ajaran.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (isEditing) {
        await RaporAPI.update(editingId, formData);
      } else {
        await RaporAPI.create(formData);
      }

      setShowFormModal(false);
      await fetchRaporList();
    } catch (err) {
      console.error('Error saving rapor:', err);
      setFormError(err.response?.data?.message || 'Gagal menyimpan rapor.');
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers Print / Preview ───────────────────────────────
  const handleOpenPrint = async (raporId) => {
    try {
      setLoadingPrint(true);
      setShowPrintModal(true);
      const res = await RaporAPI.getById(raporId);
      if (res.data?.success) {
        setPrintData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading print data:', err);
      alert('Gagal memuat dokumen rapor cetak.');
      setShowPrintModal(false);
    } finally {
      setLoadingPrint(false);
    }
  };

  // ── Handlers Delete ────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await RaporAPI.delete(deleteId);
      setDeleteId(null);
      await fetchRaporList();
    } catch (err) {
      console.error('Error deleting rapor:', err);
      alert('Gagal menghapus rapor.');
    } finally {
      setDeleting(false);
    }
  };

  // Hitung stats
  const totalRapor = raporList.length;
  const totalFinal = raporList.filter(r => r.status_rapor === 'final').length;
  const totalDraft = raporList.filter(r => r.status_rapor === 'draft').length;
  const rataRataAll = totalRapor > 0
    ? (raporList.reduce((acc, c) => acc + Number(c.rata_rata_nilai || 0), 0) / totalRapor).toFixed(1)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar user={user} />

      <main className="app-main">
        <div className="app-content rapor-admin-main">
        {/* Top Header */}
        <section className="rapor-header-section">
          <div className="rapor-header-title-box">
            <h1>
              <FileText size={28} color="#2563EB" />
              Rapor Siswa Digital
              <span className="rapor-header-badge">Admin Panel</span>
            </h1>
            <p>
              Kelola, pantau, dan terbitkan buku laporan capaian hasil belajar warga belajar PKBM Bina Mandiri secara digital dan transparan.
            </p>
          </div>
          <button className="rapor-btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            Input Rapor Siswa
          </button>
        </section>

        {/* Stats Grid */}
        <section className="rapor-stats-grid">
          <div className="rapor-stat-card">
            <div className="rapor-stat-icon-wrapper blue">
              <FileText size={22} />
            </div>
            <div className="rapor-stat-info">
              <span className="rapor-stat-label">Total Rapor</span>
              <span className="rapor-stat-value">{totalRapor}</span>
            </div>
          </div>
          <div className="rapor-stat-card">
            <div className="rapor-stat-icon-wrapper green">
              <CheckCircle size={22} />
            </div>
            <div className="rapor-stat-info">
              <span className="rapor-stat-label">Diterbitkan (Final)</span>
              <span className="rapor-stat-value">{totalFinal}</span>
            </div>
          </div>
          <div className="rapor-stat-card">
            <div className="rapor-stat-icon-wrapper amber">
              <Clock size={22} />
            </div>
            <div className="rapor-stat-info">
              <span className="rapor-stat-label">Draf Belum Terbit</span>
              <span className="rapor-stat-value">{totalDraft}</span>
            </div>
          </div>
          <div className="rapor-stat-card">
            <div className="rapor-stat-icon-wrapper purple">
              <Award size={22} />
            </div>
            <div className="rapor-stat-info">
              <span className="rapor-stat-label">Rata-rata Nilai</span>
              <span className="rapor-stat-value">{rataRataAll}</span>
            </div>
          </div>
        </section>

        {/* Filter Toolbar */}
        <section className="rapor-filter-card">
          <form className="rapor-filter-grid" onSubmit={handleSearchSubmit}>
            <div className="rapor-search-box">
              <Search size={16} className="rapor-search-icon" />
              <input
                type="text"
                placeholder="Cari nama warga belajar atau NIS..."
                className="rapor-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="rapor-select"
              value={filterTa}
              onChange={(e) => setFilterTa(e.target.value)}
            >
              <option value="">Semua Tahun Ajaran</option>
              {meta.tahun_ajaran.map(ta => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama_tahun_ajaran} {ta.is_aktif ? '(Aktif)' : ''}
                </option>
              ))}
            </select>

            <select
              className="rapor-select"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="">Semua Semester</option>
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>

            <select
              className="rapor-select"
              value={filterRombel}
              onChange={(e) => setFilterRombel(e.target.value)}
            >
              <option value="">Semua Rombel</option>
              {meta.rombel.map(r => (
                <option key={r.id} value={r.id}>{r.nama_rombel}</option>
              ))}
            </select>

            <button type="button" className="rapor-btn-reset" onClick={handleResetFilter}>
              <RotateCcw size={14} style={{ marginRight: 6 }} />
              Reset
            </button>
          </form>
        </section>

        {/* Table Content */}
        <section className="rapor-table-card">
          <div className="rapor-table-responsive">
            <table className="rapor-table">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>No</th>
                  <th>Warga Belajar</th>
                  <th>Kelas / Rombel</th>
                  <th>Periode & Semester</th>
                  <th style={{ textAlign: 'center' }}>Rata-rata Nilai</th>
                  <th style={{ textAlign: 'center' }}>Kehadiran</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 130 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                      Memuat data rapor siswa...
                    </td>
                  </tr>
                ) : raporList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '50px 0', color: '#64748B' }}>
                      <FileText size={42} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <strong style={{ fontSize: '1rem', color: '#334155', display: 'block', marginBottom: 4 }}>
                        Belum Ada Data Rapor
                      </strong>
                      <span>Gunakan tombol "+ Input Rapor Siswa" di atas untuk menambahkan laporan baru.</span>
                    </td>
                  </tr>
                ) : (
                  raporList.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className="student-info-cell">
                          <div className="student-avatar">
                            {r.nama_lengkap ? r.nama_lengkap.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="student-name-box">
                            <span className="student-name">{r.nama_lengkap}</span>
                            <span className="student-nis">{r.nis || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-rombel">
                          {r.nama_rombel || (r.jenjang ? r.jenjang.toUpperCase() : '-')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="badge-semester">
                            Semester {r.semester} ({r.semester === '1' ? 'Ganjil' : 'Genap'})
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            TA {r.nama_tahun_ajaran || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="score-badge" style={{ justifyContent: 'center' }}>
                          <span>{r.rata_rata_nilai || '0'}</span>
                          <span className={`predikat-pill ${r.rata_rata_nilai >= 85 ? 'A' : r.rata_rata_nilai >= 75 ? 'B' : r.rata_rata_nilai >= 60 ? 'C' : 'D'}`}>
                            {r.rata_rata_nilai >= 85 ? 'A' : r.rata_rata_nilai >= 75 ? 'B' : r.rata_rata_nilai >= 60 ? 'C' : 'D'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginTop: 2 }}>
                          {r.total_mapel} Mapel
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>H: {r.total_hadir}</span> |
                        <span style={{ color: '#2563EB', margin: '0 4px' }}>I: {r.total_izin}</span> |
                        <span style={{ color: '#D97706', margin: '0 4px' }}>S: {r.total_sakit}</span> |
                        <span style={{ color: '#DC2626' }}>A: {r.total_alpa}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge-rapor ${r.status_rapor}`}>
                          {r.status_rapor === 'final' ? '● Diterbitkan' : '○ Draf'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="rapor-action-btns" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon-action view"
                            title="Pratinjau & Cetak Rapor"
                            onClick={() => handleOpenPrint(r.id)}
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action edit"
                            title="Edit Rapor"
                            onClick={() => handleOpenEdit(r)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action delete"
                            title="Hapus Rapor"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Modal Input / Edit Rapor ─────────────────────────── */}
        {showFormModal && (
          <div className="rapor-modal-backdrop" onClick={() => setShowFormModal(false)}>
            <div className="rapor-modal-card" onClick={e => e.stopPropagation()}>
              <div className="rapor-modal-header">
                <h3>{isEditing ? 'Edit Data Rapor Siswa' : 'Input Rapor Siswa Baru'}</h3>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setShowFormModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div className="rapor-modal-body">
                  {formError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 10, fontSize: '0.88rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={18} />
                      {formError}
                    </div>
                  )}

                  {/* Section 1: Siswa & Periode */}
                  <div className="form-section-title">
                    <Users size={16} color="#2563EB" />
                    Identitas Siswa & Periode Belajar
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Pilih Warga Belajar *</label>
                      <select
                        className="form-select"
                        value={formData.warga_belajar_id}
                        onChange={(e) => handleSelectSiswa(e.target.value)}
                        disabled={isEditing}
                        required
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {meta.siswa.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nama_lengkap} ({s.nis || 'No NIS'}) - {s.jenjang?.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Rombel / Kelas</label>
                      <select
                        className="form-select"
                        value={formData.rombel_id}
                        onChange={(e) => setFormData(p => ({ ...p, rombel_id: e.target.value }))}
                        required
                      >
                        <option value="">-- Pilih Rombel --</option>
                        {meta.rombel.map(r => (
                          <option key={r.id} value={r.id}>{r.nama_rombel}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Tahun Ajaran *</label>
                      <select
                        className="form-select"
                        value={formData.tahun_ajaran_id}
                        onChange={(e) => setFormData(p => ({ ...p, tahun_ajaran_id: e.target.value }))}
                        disabled={isEditing}
                        required
                      >
                        <option value="">-- Pilih Tahun Ajaran --</option>
                        {meta.tahun_ajaran.map(ta => (
                          <option key={ta.id} value={ta.id}>{ta.nama_tahun_ajaran}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Semester *</label>
                      <select
                        className="form-select"
                        value={formData.semester}
                        onChange={(e) => setFormData(p => ({ ...p, semester: e.target.value }))}
                        disabled={isEditing}
                        required
                      >
                        <option value="1">Semester 1 (Ganjil)</option>
                        <option value="2">Semester 2 (Genap)</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 2: Rekap Absensi */}
                  <div className="form-section-title" style={{ marginTop: 10 }}>
                    <Clock size={16} color="#059669" />
                    Rekapitulasi Kehadiran Siswa
                  </div>
                  <div className="form-grid-4">
                    <div className="form-group">
                      <label>Total Hadir (Hari)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.total_hadir}
                        onChange={(e) => setFormData(p => ({ ...p, total_hadir: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Izin (Hari)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.total_izin}
                        onChange={(e) => setFormData(p => ({ ...p, total_izin: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sakit (Hari)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.total_sakit}
                        onChange={(e) => setFormData(p => ({ ...p, total_sakit: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Alpa / Tanpa Ket.</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.total_alpa}
                        onChange={(e) => setFormData(p => ({ ...p, total_alpa: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Section 3: Daftar Nilai Mata Pelajaran */}
                  <div className="form-section-title" style={{ marginTop: 10 }}>
                    <Award size={16} color="#D97706" />
                    Capaian Nilai Mata Pelajaran
                  </div>

                  {formData.nilai.length === 0 ? (
                    <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '24px', textAlign: 'center', borderRadius: 12, color: '#64748B', fontSize: '0.88rem', marginBottom: 20 }}>
                      Pilih Warga Belajar di atas untuk memuat daftar mata pelajaran otomatis.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="mapel-input-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>No</th>
                            <th style={{ textAlign: 'left' }}>Mata Pelajaran</th>
                            <th>KKM</th>
                            <th>Tugas (30%)</th>
                            <th>UTS (30%)</th>
                            <th>UAS (40%)</th>
                            <th>Nilai Akhir</th>
                            <th>Predikat</th>
                            <th style={{ width: 220 }}>Catatan Capaian Belajar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.nilai.map((n, idx) => (
                            <tr key={n.mapel_id}>
                              <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                                {idx + 1}
                              </td>
                              <td style={{ fontWeight: 700, color: '#0F172A' }}>
                                {n.nama_mapel}
                                <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B', fontWeight: 400 }}>
                                  Kode: {n.kode_mapel || '-'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{n.kkm || 75}</td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="input-score-sm"
                                  value={n.nilai_tugas}
                                  onChange={(e) => handleScoreChange(idx, 'nilai_tugas', e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="input-score-sm"
                                  value={n.nilai_uts}
                                  onChange={(e) => handleScoreChange(idx, 'nilai_uts', e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="input-score-sm"
                                  value={n.nilai_uas}
                                  onChange={(e) => handleScoreChange(idx, 'nilai_uas', e.target.value)}
                                />
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#1D4ED8', fontSize: '0.95rem' }}>
                                {n.nilai_akhir}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`predikat-pill ${n.predikat}`}>
                                  {n.predikat}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="input-catatan-sm"
                                  placeholder="Catatan perkembangan..."
                                  value={n.catatan || ''}
                                  onChange={(e) => handleCatatanMapelChange(idx, e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Section 4: Catatan Wali & Status */}
                  <div className="form-grid-2" style={{ marginTop: 10 }}>
                    <div className="form-group">
                      <label>Catatan Wali Kelas / Pembimbing</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Tuliskan catatan kemajuan, motivasi, atau pesan untuk warga belajar..."
                        value={formData.catatan_wali}
                        onChange={(e) => setFormData(p => ({ ...p, catatan_wali: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Status Publikasi Rapor *</label>
                      <select
                        className="form-select"
                        value={formData.status_rapor}
                        onChange={(e) => setFormData(p => ({ ...p, status_rapor: e.target.value }))}
                      >
                        <option value="draft">Draf (Belum Dapat Dilihat Siswa)</option>
                        <option value="final">Final (Resmi Diterbitkan ke Siswa)</option>
                      </select>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                        *Status 'Final' membuat rapor langsung muncul di dashboard siswa dan siap diunduh/dicetak.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rapor-modal-footer">
                  <button
                    type="button"
                    className="rapor-btn-reset"
                    onClick={() => setShowFormModal(false)}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rapor-btn-primary"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Terbitkan Rapor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Cetak / Pratinjau Dokumen Rapor ───────────── */}
        {showPrintModal && (
          <div className="rapor-modal-backdrop" onClick={() => setShowPrintModal(false)}>
            <div className="rapor-print-modal-card" onClick={e => e.stopPropagation()}>
              <div className="rapor-modal-header">
                <h3>Pratinjau Dokumen Cetak Rapor Digital</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="rapor-btn-primary"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    Cetak / Simpan PDF
                  </button>
                  <button
                    type="button"
                    className="btn-modal-close"
                    onClick={() => setShowPrintModal(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="rapor-modal-body" style={{ background: '#525659', padding: '24px 20px' }}>
                {loadingPrint || !printData ? (
                  <div style={{ background: '#FFFFFF', padding: '60px', textAlign: 'center', borderRadius: 8 }}>
                    Memuat dokumen rapor...
                  </div>
                ) : (
                  <div className="rapor-print-paper">
                    {/* Kop Surat Resmi PKBM Bina Mandiri */}
                    <div className="print-kop-surat">
                      <img src="/images/logo new.png" alt="Logo PKBM" className="print-logo" />
                      <div className="print-kop-text">
                        <h2>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h2>
                        <h1>PKBM BINA MANDIRI SUMEDANG</h1>
                        <p><strong>NPSN: P9962854 • Terakreditasi Resmi</strong></p>
                        <p>Sekretariat: Sumedang, Jawa Barat | Website: pkbmbinamandiri.sch.id</p>
                      </div>
                    </div>

                    <div className="print-title">
                      LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR DIGITAL)
                    </div>

                    {/* Identitas Peserta Didik */}
                    <div className="print-identitas-grid">
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 140, padding: '3px 0' }}>Nama Warga Belajar</td>
                              <td>: <strong>{printData.nama_lengkap}</strong></td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Nomor Induk Siswa (NIS)</td>
                              <td>: {printData.nis || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>NIK Siswa</td>
                              <td>: {printData.nik || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Program Pendidikan</td>
                              <td>: {printData.jenjang ? printData.jenjang.toUpperCase() : '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 120, padding: '3px 0' }}>Kelas / Rombel</td>
                              <td>: {printData.nama_rombel || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Semester</td>
                              <td>: {printData.semester} ({printData.semester === '1' ? 'Ganjil' : 'Genap'})</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Tahun Pelajaran</td>
                              <td>: {printData.nama_tahun_ajaran || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Status Dokumen</td>
                              <td>: {printData.status_rapor === 'final' ? 'Resmi / Sah' : 'Draf Salinan'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabel Nilai Hasil Belajar */}
                    <table className="print-table-nilai">
                      <thead>
                        <tr>
                          <th style={{ width: 35 }}>No</th>
                          <th style={{ textAlign: 'left' }}>Mata Pelajaran</th>
                          <th style={{ width: 50 }}>KKM</th>
                          <th style={{ width: 60 }}>Tugas</th>
                          <th style={{ width: 60 }}>UTS</th>
                          <th style={{ width: 60 }}>UAS</th>
                          <th style={{ width: 75 }}>Nilai Akhir</th>
                          <th style={{ width: 65 }}>Predikat</th>
                          <th>Capaian Kompetensi / Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printData.nilai && printData.nilai.length > 0 ? (
                          printData.nilai.map((n, idx) => (
                            <tr key={n.id || idx}>
                              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                              <td><strong>{n.nama_mapel}</strong></td>
                              <td style={{ textAlign: 'center' }}>{n.kkm || 75}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_tugas}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_uts}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_uas}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n.nilai_akhir}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n.predikat}</td>
                              <td style={{ fontSize: '0.8rem' }}>{n.catatan || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '16px' }}>
                              Belum ada nilai yang dimasukkan.
                            </td>
                          </tr>
                        )}
                        <tr style={{ background: '#F8FAFC', fontWeight: 'bold' }}>
                          <td colSpan="6" style={{ textAlign: 'right', paddingRight: '12px' }}>
                            RATA-RATA NILAI KESELURUHAN:
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.95rem' }}>
                            {printData.rata_rata || '0'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {printData.rata_rata >= 85 ? 'A' : printData.rata_rata >= 75 ? 'B' : printData.rata_rata >= 60 ? 'C' : 'D'}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Rekap Kehadiran */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14 }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>
                          Rekapitulasi Ketidakhadiran:
                        </strong>
                        <table className="print-absen-box">
                          <tbody>
                            <tr>
                              <td style={{ width: 140 }}>1. Sakit</td>
                              <td>: {printData.total_sakit || 0} hari</td>
                            </tr>
                            <tr>
                              <td>2. Izin</td>
                              <td>: {printData.total_izin || 0} hari</td>
                            </tr>
                            <tr>
                              <td>3. Tanpa Keterangan</td>
                              <td>: {printData.total_alpa || 0} hari</td>
                            </tr>
                            <tr>
                              <td><strong>Total Kehadiran</strong></td>
                              <td>: <strong>{printData.total_hadir || 0} hari</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Catatan Wali Kelas */}
                    <div className="print-catatan-box">
                      <strong>Catatan Wali Kelas / Pembimbing:</strong>
                      <p style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>
                        "{printData.catatan_wali || 'Pertahankan semangat belajar dan terus kembangkan bakat serta potensi diri.'}"
                      </p>
                    </div>

                    {/* Kolom Tanda Tangan */}
                    <div className="print-ttd-grid">
                      <div className="ttd-box">
                        <span>Mengetahui,<br />Orang Tua / Wali Siswa</span>
                        <span className="ttd-line">................................................</span>
                      </div>

                      <div className="ttd-box">
                        <span><br />Tutor Pembimbing / Wali Kelas</span>
                        <span className="ttd-line">................................................</span>
                      </div>

                      <div className="ttd-box">
                        <span>
                          Sumedang, {new Date().getFullYear()}<br />
                          <strong>Kepala PKBM Bina Mandiri</strong>
                        </span>
                        <div style={{ margin: '4px 0' }}>
                          <img
                            src="/ttd.png"
                            alt="Tanda Tangan"
                            style={{ height: 48, filter: 'invert(1) grayscale(1)', opacity: 0.85 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <span className="ttd-line">Indrayani, S.S.,M.Pd.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Konfirmasi Hapus ───────────────────────────── */}
        {deleteId && (
          <div className="rapor-modal-backdrop" onClick={() => setDeleteId(null)}>
            <div className="rapor-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              <div className="rapor-modal-header">
                <h3 style={{ color: '#DC2626' }}>Hapus Data Rapor?</h3>
                <button type="button" className="btn-modal-close" onClick={() => setDeleteId(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="rapor-modal-body">
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>
                  Apakah Anda yakin ingin menghapus data rapor ini? Semua nilai mata pelajaran di dalamnya akan dihapus secara permanen.
                </p>
              </div>
              <div className="rapor-modal-footer">
                <button type="button" className="rapor-btn-reset" onClick={() => setDeleteId(null)}>
                  Batal
                </button>
                <button
                  type="button"
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

