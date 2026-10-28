// ============================================================
// src/pages/admin/BeritaAdmin.jsx — Manajemen Berita & Kegiatan PKBM
// Menu Pengelolaan Dokumentasi Kegiatan PKBM (Teks, Foto & Video)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  Calendar,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  Video,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Upload,
  ExternalLink,
  Sparkles,
  Film,
  Layers,
  ArrowUpRight,
  Share2,
  Check
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { BeritaAPI, toAssetUrl } from '../../services/api.js';
import './BeritaAdmin.css';

// Kategori standar kegiatan PKBM
const KATEGORI_OPTIONS = [
  'Kegiatan PKBM',
  'Vokasi & Ekstrakurikuler',
  'Akademik',
  'Pameran & Karya',
  'Ujian & Kelulusan',
  'Kegiatan Sosial',
  'Informasi Resmi',
];

// Helper ubah URL YouTube biasa ke embed URL
const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

// Formatter tanggal
const formatTanggal = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

function BeritaAdmin() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── State Data & List ─────────────────────────────────────
  const [beritaList, setBeritaList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    with_video: 0,
    with_photos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // ── State Filter & Search ────────────────────────────────
  const [activeTab, setActiveTab] = useState('all'); // all, published, draft, archived
  const [selectedKategori, setSelectedKategori] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── State Form Modal (Create / Edit) ─────────────────────
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Kegiatan PKBM',
    tanggal_kegiatan: new Date().toISOString().split('T')[0],
    lokasi: '',
    status: 'published',
    is_pinned: false,
    penulis: user?.nama_lengkap || user?.nama || 'Admin PKBM',
    ringkasan: '',
    konten: '',
    video_url: '',
  });

  // Media States
  const [sampulFile, setSampulFile] = useState(null);
  const [sampulPreview, setSampulPreview] = useState('');
  const [existingSampul, setExistingSampul] = useState('');
  const [hapusSampul, setHapusSampul] = useState(false);

  const [galeriFiles, setGaleriFiles] = useState([]);
  const [galeriPreviews, setGaleriPreviews] = useState([]);
  const [existingGaleri, setExistingGaleri] = useState([]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [existingVideo, setExistingVideo] = useState('');
  const [hapusVideo, setHapusVideo] = useState(false);

  // Refs untuk file input
  const sampulInputRef = useRef(null);
  const galeriInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // ── State Preview Reader Modal ────────────────────────────
  const [previewItem, setPreviewItem] = useState(null);

  // ── State Delete Modal ────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch Berita Admin ────────────────────────────────────
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (selectedKategori) params.kategori = selectedKategori;
      if (searchQuery) params.search = searchQuery;

      const res = await BeritaAPI.getAllAdmin(params);
      if (res.data?.success) {
        setBeritaList(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching berita:', err);
      setError('Gagal memuat daftar berita kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, [activeTab, selectedKategori, searchQuery]);

  // Reset & Buka Form Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      judul: '',
      kategori: 'Kegiatan PKBM',
      tanggal_kegiatan: new Date().toISOString().split('T')[0],
      lokasi: 'Aula Kampus PKBM Bina Mandiri',
      status: 'published',
      is_pinned: false,
      penulis: user?.nama_lengkap || user?.nama || 'Admin PKBM',
      ringkasan: '',
      konten: '',
      video_url: '',
    });
    setSampulFile(null);
    setSampulPreview('');
    setExistingSampul('');
    setHapusSampul(false);

    setGaleriFiles([]);
    setGaleriPreviews([]);
    setExistingGaleri([]);

    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo('');
    setHapusVideo(false);

    setShowModal(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      judul: item.judul || '',
      kategori: item.kategori || 'Kegiatan PKBM',
      tanggal_kegiatan: item.tanggal_kegiatan ? item.tanggal_kegiatan.split('T')[0] : '',
      lokasi: item.lokasi || '',
      status: item.status || 'published',
      is_pinned: Boolean(item.is_pinned),
      penulis: item.penulis || user?.nama_lengkap || 'Admin PKBM',
      ringkasan: item.ringkasan || '',
      konten: item.konten || '',
      video_url: item.video_url || '',
    });

    setSampulFile(null);
    setSampulPreview('');
    setExistingSampul(item.gambar_sampul || '');
    setHapusSampul(false);

    setGaleriFiles([]);
    setGaleriPreviews([]);
    setExistingGaleri(Array.isArray(item.galeri_foto) ? item.galeri_foto : []);

    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo(item.video_file || '');
    setHapusVideo(false);

    setShowModal(true);
  };

  // ── Handle Upload Gambar Sampul ───────────────────────────
  const handleSampulChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampulFile(file);
      setSampulPreview(URL.createObjectURL(file));
      setHapusSampul(false);
    }
  };

  const handleRemoveSampul = () => {
    setSampulFile(null);
    setSampulPreview('');
    setExistingSampul('');
    setHapusSampul(true);
    if (sampulInputRef.current) sampulInputRef.current.value = '';
  };

  // ── Handle Upload Galeri Foto (Multiple) ──────────────────
  const handleGaleriChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGaleriFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setGaleriPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewGaleriPhoto = (index) => {
    setGaleriFiles((prev) => prev.filter((_, i) => i !== index));
    setGaleriPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingGaleriPhoto = (index) => {
    setExistingGaleri((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Handle Upload Video File ──────────────────────────────
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Maks 100MB
      if (file.size > 100 * 1024 * 1024) {
        alert('Ukuran video melebihi batas 100MB.');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setHapusVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setExistingVideo('');
    setHapusVideo(true);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // ── Submit Form (Create / Edit) ───────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.judul.trim()) {
      alert('Judul berita kegiatan wajib diisi.');
      return;
    }
    if (!formData.konten.trim()) {
      alert('Isi konten berita wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      data.append('judul', formData.judul.trim());
      data.append('kategori', formData.kategori);
      data.append('tanggal_kegiatan', formData.tanggal_kegiatan);
      data.append('lokasi', formData.lokasi.trim());
      data.append('status', formData.status);
      data.append('is_pinned', formData.is_pinned ? '1' : '0');
      data.append('penulis', formData.penulis.trim());
      data.append('ringkasan', formData.ringkasan.trim());
      data.append('konten', formData.konten.trim());
      data.append('video_url', formData.video_url.trim());

      // File sampul
      if (sampulFile) {
        data.append('gambar_sampul', sampulFile);
      }
      if (isEditing && hapusSampul) {
        data.append('hapus_sampul', '1');
      }

      // Galeri foto baru
      galeriFiles.forEach((f) => {
        data.append('galeri_foto', f);
      });

      // Foto lama yang dipertahankan
      if (isEditing) {
        data.append('existing_galeri', JSON.stringify(existingGaleri));
      }

      // Video File
      if (videoFile) {
        data.append('video_file', videoFile);
      }
      if (isEditing && hapusVideo) {
        data.append('hapus_video', '1');
      }

      let res;
      if (isEditing) {
        res = await BeritaAPI.update(editId, data);
      } else {
        res = await BeritaAPI.create(data);
      }

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          msg: isEditing ? 'Berita kegiatan berhasil diperbarui!' : 'Berita kegiatan berhasil diterbitkan dan tersimpan!',
        });
        setShowModal(false);
        fetchBerita();
        setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.message || 'Gagal menyimpan berita kegiatan.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Delete Berita ──────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await BeritaAPI.delete(deleteTarget.id);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          msg: `Berita "${deleteTarget.judul}" berhasil dihapus.`,
        });
        setDeleteTarget(null);
        fetchBerita();
        setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Gagal menghapus berita.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div className="berita-admin-container">

            {/* ── Header ────────────────────────────────────── */}
            <div className="berita-admin-header">
              <div className="berita-header-title">
                <h1>Berita & Dokumentasi Kegiatan PKBM</h1>
                <p>
                  Publikasikan kabar kegiatan, dokumentasi foto, dan video kegiatan warga belajar secara real-time ke seluruh perangkat.
                </p>
              </div>

              <button
                type="button"
                className="berita-btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={18} />
                <span>Unggah Berita Kegiatan</span>
              </button>
            </div>

            {/* ── Feedback Banner ───────────────────────────── */}
            {feedback.msg && (
              <div className={`berita-alert ${feedback.type}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* ── KPI Metrik Bar Berpola ────────────────────── */}
            <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
              <div className="admin-stat-card admin-stat-blue">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Newspaper size={22} />
                  </div>
                  <span className="admin-stat-tag">TOTAL</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total || beritaList.length}</div>
                  <div className="admin-stat-label">Total Berita Kegiatan</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-green">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="admin-stat-tag">PUBLISHED</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.published || beritaList.filter(b => b.status === 'published').length}</div>
                  <div className="admin-stat-label">Diterbitkan (Tampil di Siswa)</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-amber">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Clock size={22} />
                  </div>
                  <span className="admin-stat-tag">DRAFT</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.draft || beritaList.filter(b => b.status === 'draft').length}</div>
                  <div className="admin-stat-label">Konsep (Draft)</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-purple">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Film size={22} />
                  </div>
                  <span className="admin-stat-tag">MEDIA</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">
                    {beritaList.filter(b => b.video_file || b.video_url || (b.galeri_foto && b.galeri_foto.length > 0)).length}
                  </div>
                  <div className="admin-stat-label">Berita dengan Foto & Video</div>
                </div>
              </div>
            </div>

            {/* ── Toolbar & Filter ──────────────────────────── */}
            <div className="berita-toolbar">
              <div className="berita-filter-pills">
                <button
                  type="button"
                  className={`berita-pill ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`berita-pill ${activeTab === 'published' ? 'active' : ''}`}
                  onClick={() => setActiveTab('published')}
                >
                  Diterbitkan
                </button>
                <button
                  type="button"
                  className={`berita-pill ${activeTab === 'draft' ? 'active' : ''}`}
                  onClick={() => setActiveTab('draft')}
                >
                  Draft
                </button>
              </div>

              <div className="berita-filter-inputs">
                <select
                  className="berita-category-select"
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>

                <div className="berita-search-wrap">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Cari judul berita kegiatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Daftar Card Berita ────────────────────────── */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', background: '#FFFFFF', borderRadius: 20 }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748B', fontWeight: 600 }}>Memuat berita kegiatan...</p>
              </div>
            ) : beritaList.length === 0 ? (
              <div className="berita-empty-state">
                <Newspaper size={48} />
                <h3>Belum Ada Berita Kegiatan</h3>
                <p>Mulai dokumentasikan kegiatan belajar dan vokasi warga belajar sekarang.</p>
                <button
                  type="button"
                  className="berita-btn-primary"
                  onClick={handleOpenCreate}
                >
                  <Plus size={16} /> Tambah Berita Pertama
                </button>
              </div>
            ) : (
              <div className="berita-cards-grid">
                {beritaList.map((item) => {
                  const hasVideo = Boolean(item.video_file || item.video_url);
                  const galeriCount = Array.isArray(item.galeri_foto) ? item.galeri_foto.length : 0;

                  return (
                    <div key={item.id} className="berita-card">
                      {/* Cover Image & Badges */}
                      <div className="berita-card-cover-wrap">
                        {item.gambar_sampul ? (
                          <img
                            src={toAssetUrl(item.gambar_sampul)}
                            alt={item.judul}
                            className="berita-card-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <div
                          className="berita-card-placeholder-cover"
                          style={{ display: item.gambar_sampul ? 'none' : 'flex' }}
                        >
                          <Newspaper size={36} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PKBM BINA MANDIRI</span>
                        </div>

                        <div className="berita-cover-badges">
                          <span className="berita-category-badge">{item.kategori}</span>
                          {Boolean(item.is_pinned) && (
                            <span className="berita-pinned-badge">
                              <Sparkles size={12} /> Utama
                            </span>
                          )}
                        </div>

                        {/* Media Indicator Tags */}
                        <div className="berita-media-tags-strip">
                          {hasVideo && (
                            <span className="berita-media-tag">
                              <Video size={12} /> Video
                            </span>
                          )}
                          {galeriCount > 0 && (
                            <span className="berita-media-tag">
                              <ImageIcon size={12} /> {galeriCount} Foto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="berita-card-body">
                        <div className="berita-card-meta">
                          <span className="berita-card-meta-item">
                            <Calendar size={13} />
                            {formatTanggal(item.tanggal_kegiatan || item.created_at)}
                          </span>
                          {item.lokasi && (
                            <span className="berita-card-meta-item">
                              <MapPin size={13} />
                              {item.lokasi}
                            </span>
                          )}
                        </div>

                        <h3 className="berita-card-title" title={item.judul}>
                          {item.judul}
                        </h3>

                        <p className="berita-card-summary">
                          {item.ringkasan || item.konten.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...'}
                        </p>

                        <div className="berita-card-footer">
                          <span className={`berita-status-pill ${item.status}`}>
                            {item.status === 'published' ? 'Diterbitkan' : item.status === 'draft' ? 'Draft' : 'Arsip'}
                          </span>

                          <div className="berita-card-actions">
                            <button
                              type="button"
                              className="berita-action-btn"
                              title="Lihat Pratinjau Tampilan Siswa"
                              onClick={() => setPreviewItem(item)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              className="berita-action-btn"
                              title="Edit Berita"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="berita-action-btn delete"
                              title="Hapus Berita"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── MODAL CREATE / EDIT ────────────────────────── */}
            {showModal && (
              <div className="berita-modal-backdrop" onClick={() => setShowModal(false)}>
                <div className="berita-modal-window" onClick={(e) => e.stopPropagation()}>
                  
                  <div className="berita-modal-header">
                    <h2>{isEditing ? 'Perbarui Berita Kegiatan' : 'Unggah Berita Kegiatan Baru'}</h2>
                    <button
                      type="button"
                      className="berita-modal-close-btn"
                      onClick={() => setShowModal(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="berita-modal-body">
                      
                      {/* Judul */}
                      <div className="berita-form-group">
                        <label>Judul Kegiatan / Berita *</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Gelar Karya Vokasi Tata Boga & Praktik Komputer Paket C"
                          value={formData.judul}
                          onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                        />
                      </div>

                      {/* Row 1: Kategori & Tanggal */}
                      <div className="berita-form-row">
                        <div className="berita-form-group">
                          <label>Kategori Kegiatan</label>
                          <select
                            value={formData.kategori}
                            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                          >
                            {KATEGORI_OPTIONS.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>

                        <div className="berita-form-group">
                          <label>Tanggal Pelaksanaan</label>
                          <input
                            type="date"
                            value={formData.tanggal_kegiatan}
                            onChange={(e) => setFormData({ ...formData, tanggal_kegiatan: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Row 2: Lokasi & Status */}
                      <div className="berita-form-row">
                        <div className="berita-form-group">
                          <label>Lokasi Kegiatan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Aula Kampus PKBM Bina Mandiri"
                            value={formData.lokasi}
                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                          />
                        </div>

                        <div className="berita-form-group">
                          <label>Status Publikasi</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          >
                            <option value="published">Diterbitkan (Bisa langsung dilihat siswa)</option>
                            <option value="draft">Draft (Hanya disimpan di admin)</option>
                            <option value="archived">Arsip</option>
                          </select>
                        </div>
                      </div>

                      {/* Checkbox Pinned */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <input
                          type="checkbox"
                          id="is_pinned"
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                          checked={formData.is_pinned}
                          onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                        />
                        <label htmlFor="is_pinned" style={{ margin: 0, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                          Sematkan sebagai Berita Utama (Headline di Dashboard Siswa)
                        </label>
                      </div>

                      {/* Ringkasan */}
                      <div className="berita-form-group">
                        <label>Ringkasan Singkat (Lead Paragraph)</label>
                        <textarea
                          rows={2}
                          placeholder="Deskripsi ringkas 1-2 kalimat untuk pratinjau kartu berita..."
                          value={formData.ringkasan}
                          onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                        />
                      </div>

                      {/* Isi Konten Lengkap */}
                      <div className="berita-form-group">
                        <label>Isi Lengkap Berita & Dokumentasi *</label>
                        <textarea
                          rows={6}
                          required
                          placeholder="Tuliskan jalannya kegiatan, sambutan tutor, partisipasi warga belajar, dan capaian acara..."
                          value={formData.konten}
                          onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                        />
                      </div>

                      {/* ── UPLOAD GAMBAR SAMPUL ── */}
                      <div className="berita-form-group">
                        <label>
                          <ImageIcon size={15} /> Gambar Sampul Utama (Cover Card)
                        </label>

                        {sampulPreview || existingSampul ? (
                          <div className="berita-preview-cover-box">
                            <img
                              src={sampulPreview || toAssetUrl(existingSampul)}
                              alt="Sampul Berita"
                            />
                            <button
                              type="button"
                              className="berita-btn-remove-media"
                              onClick={handleRemoveSampul}
                            >
                              <X size={13} /> Hapus Sampul
                            </button>
                          </div>
                        ) : (
                          <div
                            className="berita-upload-zone"
                            onClick={() => sampulInputRef.current?.click()}
                          >
                            <Upload size={28} />
                            <p>Klik untuk memilih foto sampul utama</p>
                            <span>Format JPG, PNG, WEBP (Maks 10MB)</span>
                            <input
                              ref={sampulInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleSampulChange}
                            />
                          </div>
                        )}
                      </div>

                      {/* ── UPLOAD GALERI FOTO BANYAK ── */}
                      <div className="berita-form-group">
                        <label>
                          <Layers size={15} /> Dokumentasi Galeri Foto Tambahan
                        </label>

                        <div
                          className="berita-upload-zone"
                          onClick={() => galeriInputRef.current?.click()}
                        >
                          <Upload size={24} />
                          <p>Klik untuk menambah foto dokumentasi (Bisa pilih banyak foto sekaligus)</p>
                          <span>Maksimal 12 foto per berita</span>
                          <input
                            ref={galeriInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleGaleriChange}
                          />
                        </div>

                        {/* Preview Galeri Foto */}
                        {(existingGaleri.length > 0 || galeriPreviews.length > 0) && (
                          <div className="berita-gallery-preview-grid">
                            {/* Existing Galeri */}
                            {existingGaleri.map((imgUrl, idx) => (
                              <div key={`ex-${idx}`} className="berita-gallery-thumb">
                                <img src={toAssetUrl(imgUrl)} alt={`Dokumentasi ${idx + 1}`} />
                                <button
                                  type="button"
                                  title="Hapus foto ini"
                                  onClick={() => handleRemoveExistingGaleriPhoto(idx)}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}

                            {/* New Galeri Uploads */}
                            {galeriPreviews.map((p, idx) => (
                              <div key={`new-${idx}`} className="berita-gallery-thumb">
                                <img src={p} alt={`Foto baru ${idx + 1}`} />
                                <button
                                  type="button"
                                  title="Hapus foto ini"
                                  onClick={() => handleRemoveNewGaleriPhoto(idx)}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── UPLOAD VIDEO KEGIATAN ── */}
                      <div className="berita-form-group">
                        <label>
                          <Video size={15} /> Video Dokumentasi Kegiatan
                        </label>

                        {/* Opsi 1: File Video Langsung */}
                        {videoPreview || existingVideo ? (
                          <div className="berita-video-preview-box">
                            <video
                              controls
                              src={videoPreview || toAssetUrl(existingVideo)}
                            />
                            <button
                              type="button"
                              className="berita-btn-remove-media"
                              onClick={handleRemoveVideo}
                            >
                              <X size={13} /> Hapus File Video
                            </button>
                          </div>
                        ) : (
                          <div
                            className="berita-upload-zone"
                            onClick={() => videoInputRef.current?.click()}
                          >
                            <Film size={26} />
                            <p>Upload File Video Kegiatan (.MP4, .WEBM, .MOV)</p>
                            <span>Dukungan file video hingga 100MB</span>
                            <input
                              ref={videoInputRef}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/ogg"
                              style={{ display: 'none' }}
                              onChange={handleVideoChange}
                            />
                          </div>
                        )}

                        {/* Opsi 2: Link Video Eksternal (YouTube / Embed) */}
                        <div style={{ marginTop: '0.85rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Atau Tautkan Tautan Video YouTube:
                          </label>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          />
                        </div>

                        {formData.video_url && (
                          <div className="berita-video-preview-box" style={{ marginTop: '0.5rem' }}>
                            <iframe
                              src={getYoutubeEmbedUrl(formData.video_url)}
                              title="Pratinjau Video YouTube"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="berita-modal-footer">
                      <button
                        type="button"
                        className="berita-btn-secondary"
                        onClick={() => setShowModal(false)}
                        disabled={submitting}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="berita-btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="spinner-border spinner-border-sm" /> Menyimpan & Mengunggah...
                          </>
                        ) : (
                          <>
                            <Check size={16} /> {isEditing ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}

            {/* ── MODAL PREVIEW (Tampilan Seperti yang Dilihat Siswa) ── */}
            {previewItem && (
              <div className="berita-modal-backdrop" onClick={() => setPreviewItem(null)}>
                <div
                  className="berita-modal-window"
                  style={{ maxWidth: 880 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="berita-modal-header">
                    <div>
                      <span className="berita-category-badge" style={{ display: 'inline-block', marginBottom: 6 }}>
                        {previewItem.kategori}
                      </span>
                      <h2 style={{ fontSize: '1.25rem' }}>{previewItem.judul}</h2>
                    </div>
                    <button
                      type="button"
                      className="berita-modal-close-btn"
                      onClick={() => setPreviewItem(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="berita-modal-body" style={{ maxHeight: '78vh' }}>
                    
                    {/* Meta info bar */}
                    <div style={{ display: 'flex', gap: '1.25rem', color: '#64748B', fontSize: '0.85rem', flexWrap: 'wrap', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                      <span><Calendar size={14} style={{ verticalAlign: -2 }} /> {formatTanggal(previewItem.tanggal_kegiatan || previewItem.created_at)}</span>
                      {previewItem.lokasi && (
                        <span><MapPin size={14} style={{ verticalAlign: -2 }} /> {previewItem.lokasi}</span>
                      )}
                      <span>Penulis: <strong>{previewItem.penulis || 'Admin PKBM'}</strong></span>
                      <span>Dilihat: <strong>{previewItem.views_count || 0} kali</strong></span>
                    </div>

                    {/* Sampul Foto Besar */}
                    {previewItem.gambar_sampul && (
                      <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 380, background: '#0F172A' }}>
                        <img
                          src={toAssetUrl(previewItem.gambar_sampul)}
                          alt={previewItem.judul}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Video Player jika ada */}
                    {previewItem.video_file && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Film size={16} /> Dokumentasi Video Kegiatan
                        </h4>
                        <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', marginTop: 8 }}>
                          <video
                            controls
                            src={toAssetUrl(previewItem.video_file)}
                            style={{ width: '100%', maxHeight: 380, display: 'block' }}
                          />
                        </div>
                      </div>
                    )}

                    {previewItem.video_url && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Film size={16} /> Video Eksternal (YouTube)
                        </h4>
                        <div style={{ borderRadius: 14, overflow: 'hidden', height: 360, marginTop: 8 }}>
                          <iframe
                            src={getYoutubeEmbedUrl(previewItem.video_url)}
                            title={previewItem.judul}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Konten Artikel */}
                    <div style={{ fontSize: '0.975rem', lineHeight: 1.8, color: '#1E293B', whiteSpace: 'pre-line', marginTop: '0.75rem' }}>
                      {previewItem.konten}
                    </div>

                    {/* Galeri Foto Dokumentasi */}
                    {Array.isArray(previewItem.galeri_foto) && previewItem.galeri_foto.length > 0 && (
                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ImageIcon size={18} /> Galeri Foto Kegiatan ({previewItem.galeri_foto.length} Foto)
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                          {previewItem.galeri_foto.map((f, i) => (
                            <div key={i} style={{ height: 130, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                              <img
                                src={toAssetUrl(f)}
                                alt={`Foto ${i + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="berita-modal-footer">
                    <button
                      type="button"
                      className="berita-btn-secondary"
                      onClick={() => setPreviewItem(null)}
                    >
                      Tutup Pratinjau
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL KONFIRMASI HAPUS ────────────────────── */}
            {deleteTarget && (
              <div className="berita-modal-backdrop" onClick={() => setDeleteTarget(null)}>
                <div
                  className="berita-modal-window"
                  style={{ maxWidth: 460 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="berita-modal-header" style={{ background: '#FEF2F2' }}>
                    <h2 style={{ color: '#B91C1C', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={20} /> Hapus Berita Kegiatan?
                    </h2>
                    <button
                      type="button"
                      className="berita-modal-close-btn"
                      onClick={() => setDeleteTarget(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="berita-modal-body">
                    <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>
                      Apakah Anda yakin ingin menghapus berita:
                      <br />
                      <strong style={{ color: '#0F172A' }}>"{deleteTarget.judul}"</strong>?
                    </p>
                    <p style={{ fontSize: '0.825rem', color: '#B91C1C', margin: '0.5rem 0 0 0' }}>
                      Seluruh foto dokumentasi dan video kegiatan terkait di server akan ikut terhapus permanen.
                    </p>
                  </div>

                  <div className="berita-modal-footer">
                    <button
                      type="button"
                      className="berita-btn-secondary"
                      onClick={() => setDeleteTarget(null)}
                      disabled={deleting}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="berita-btn-primary"
                      style={{ background: '#DC2626' }}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default BeritaAdmin;

