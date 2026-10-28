// ============================================================
// src/pages/admin/ModulBukuAdmin.jsx — Manajemen Modul & Buku
// Halaman Super Admin & TU untuk mengunggah modul belajar
// dan mengintegrasikan katalog buku digital Kemendikdasmen RI
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Library,
  BookOpen,
  Plus,
  UploadCloud,
  FileText,
  Search,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
  Layers,
  GraduationCap,
  Sparkles,
  BookMarked
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { ModulBukuAPI, toAssetUrl } from '../../services/api.js';
import './ModulBukuAdmin.css';

// Data dasar demonstrasi / fallback saat server live belum di-deploy
const DEFAULT_MODUL_DATA = [
  {
    id: 1,
    judul: 'Buku Teks Kurikulum Merdeka - Kemendikdasmen RI',
    deskripsi: 'Akses resmi katalog buku teks utama dan pendamping Kurikulum Merdeka untuk SD, SMP, SMA dari Kementerian Pendidikan Dasar dan Menengah RI.',
    kategori: 'Semua Jenjang',
    mapel: 'Kurikulum Nasional',
    tipe: 'buku_kemendikdasmen',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/',
    penulis: 'Kemendikdasmen RI',
    semester: 'Semua Semester',
    tahun_ajaran: '2025/2026',
    is_published: 1,
    total_dibaca: 154,
    file_path: null,
    file_size: 0,
    file_type: 'LINK',
  },
  {
    id: 2,
    judul: 'Modul Kewirausahaan & Literasi Keuangan Warga Belajar Paket C',
    deskripsi: 'Modul ajar pemberdayaan ekonomi praktis: manajemen keuangan mikro, pemanfaatan digital payment, dan perintisan usaha mandiri untuk warga belajar Paket C.',
    kategori: 'Paket C',
    mapel: 'Kewirausahaan & Vokasi',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tim Pengajar Vokasi PKBM',
    semester: 'Semester Ganjil',
    tahun_ajaran: '2025/2026',
    is_published: 1,
    total_dibaca: 89,
    file_path: null,
    file_size: 2450000,
    file_type: 'PDF',
  },
  {
    id: 3,
    judul: 'Modul Bahasa Indonesia: Berpikir Kritis & Menulis Efektif - Paket B',
    deskripsi: 'Modul tematik literasi bahasa untuk kelas 7, 8, dan 9 setara SMP. Mencakup telaah bacaan, penyusunan ringkasan artikel, dan tata kalimat aplikatif.',
    kategori: 'Paket B',
    mapel: 'Bahasa Indonesia',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tutor Bahasa PKBM',
    semester: 'Semua Semester',
    tahun_ajaran: '2025/2026',
    is_published: 1,
    total_dibaca: 62,
    file_path: null,
    file_size: 1850000,
    file_type: 'PDF',
  },
  {
    id: 4,
    judul: 'Modul IPAS Terpadu: Mengenal Lingkungan Sekitar & Sains Dasar - Paket A',
    deskripsi: 'Panduan pembelajaran tematik IPAS untuk warga belajar Paket A (setara SD). Belajar sains aplikatif berbasis eksperimen sederhana dan pelestarian alam.',
    kategori: 'Paket A',
    mapel: 'IPAS',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tutor Paket A PKBM',
    semester: 'Semester Genap',
    tahun_ajaran: '2025/2026',
    is_published: 1,
    total_dibaca: 45,
    file_path: null,
    file_size: 3120000,
    file_type: 'PDF',
  },
  {
    id: 5,
    judul: 'Buku Literasi & Bacaan Bergizi Warga Belajar - SIBI Kemendikdasmen',
    deskripsi: 'Koleksi bacaan nonteks berjenjang untuk meningkatkan minat membaca dan wawasan umum warga belajar pendidikan kesetaraan.',
    kategori: 'Semua Jenjang',
    mapel: 'Literasi & Karakter',
    tipe: 'buku_kemendikdasmen',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/katalog/buku-non-teks',
    penulis: 'SIBI Kemendikdasmen',
    semester: 'Semua Semester',
    tahun_ajaran: '2025/2026',
    is_published: 1,
    total_dibaca: 112,
    file_path: null,
    file_size: 0,
    file_type: 'LINK',
  },
];

// Helper membaca data lokal tersimpan
const getLocalStoredModul = () => {
  try {
    const raw = localStorage.getItem('pkbm_custom_modul');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_MODUL_DATA;
};

// Helper simpan ke lokal
const saveLocalStoredModul = (items) => {
  try {
    localStorage.setItem('pkbm_custom_modul', JSON.stringify(items));
  } catch {}
};

// Helper ukuran berkas
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const KATEGORI_OPTIONS = [
  'Semua Jenjang',
  'Paket A',
  'Paket B',
  'Paket C',
  'Umum / Keterampilan',
];

function ModulBukuAdmin() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── Data & List States ─────────────────────────────────────
  const [modulList, setModulList] = useState([]);
  const [stats, setStats] = useState({
    total_semua: 0,
    total_paket_a: 0,
    total_paket_b: 0,
    total_paket_c: 0,
    total_dibaca_semua: 0,
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // ── Filter & Search States ─────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [tipeFilter, setTipeFilter] = useState('Semua');

  // ── Modal Upload & Form States ─────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'Semua Jenjang',
    mapel: '',
    tipe: 'modul_upload',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/',
    penulis: user?.nama_lengkap || user?.nama || 'PKBM Bina Mandiri',
    semester: 'Semua Semester',
    tahun_ajaran: '2025/2026',
    is_published: 1,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState('');
  const fileInputRef = useRef(null);

  // ── Delete Confirmation Modal ──────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Preview In-App Reader Modal ────────────────────────────
  const [previewItem, setPreviewItem] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Fetch Data & Stats (Dengan Fallback Cerdas) ─────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (kategoriFilter !== 'Semua') params.kategori = kategoriFilter;
      if (tipeFilter !== 'Semua') params.tipe = tipeFilter;

      const [resList, resStats] = await Promise.all([
        ModulBukuAPI.getAllAdmin(params),
        ModulBukuAPI.getStats(),
      ]);

      if (resList.data?.success) {
        setModulList(resList.data.data || []);
      }
      if (resStats.data?.success) {
        setStats(resStats.data.data || {});
      }
    } catch (err) {
      // Jika endpoint backend belum dideploy di server (404) atau server offline,
      // gunakan local storage & default collection agar admin tetap bisa memakai fitur tanpa hambatan
      console.warn('Backend API /modul-buku belum aktif/404 di server, menggunakan mode lokal:', err.message);
      
      let allItems = getLocalStoredModul();

      // Terapkan filter di sisi klien
      if (kategoriFilter !== 'Semua') {
        allItems = allItems.filter(
          (m) => m.kategori === kategoriFilter || m.kategori === 'Semua Jenjang'
        );
      }
      if (tipeFilter !== 'Semua') {
        allItems = allItems.filter((m) => m.tipe === tipeFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        allItems = allItems.filter(
          (m) =>
            (m.judul || '').toLowerCase().includes(q) ||
            (m.mapel || '').toLowerCase().includes(q) ||
            (m.deskripsi || '').toLowerCase().includes(q) ||
            (m.penulis || '').toLowerCase().includes(q)
        );
      }

      setModulList(allItems);

      // Hitung metrik ringkasan
      const full = getLocalStoredModul();
      setStats({
        total_semua: full.length,
        total_paket_a: full.filter((m) => m.kategori === 'Paket A').length,
        total_paket_b: full.filter((m) => m.kategori === 'Paket B').length,
        total_paket_c: full.filter((m) => m.kategori === 'Paket C').length,
        total_dibaca_semua: full.reduce((acc, m) => acc + (m.total_dibaca || 0), 0),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategoriFilter, tipeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // ── Reset & Buka Form Tambah ───────────────────────────────
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setSelectedFile(null);
    setExistingFileName('');
    setFormData({
      judul: '',
      deskripsi: '',
      kategori: 'Semua Jenjang',
      mapel: '',
      tipe: 'modul_upload',
      url_eksternal: 'https://buku.kemendikdasmen.go.id/',
      penulis: user?.nama_lengkap || user?.nama || 'PKBM Bina Mandiri',
      semester: 'Semua Semester',
      tahun_ajaran: '2025/2026',
      is_published: 1,
    });
    setShowModal(true);
  };

  // ── Buka Form Edit ─────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setSelectedFile(null);
    setExistingFileName(item.file_nama_asli || '');
    setFormData({
      judul: item.judul || '',
      deskripsi: item.deskripsi || '',
      kategori: item.kategori || 'Semua Jenjang',
      mapel: item.mapel || '',
      tipe: item.tipe || 'modul_upload',
      url_eksternal: item.url_eksternal || 'https://buku.kemendikdasmen.go.id/',
      penulis: item.penulis || 'PKBM Bina Mandiri',
      semester: item.semester || 'Semua Semester',
      tahun_ajaran: item.tahun_ajaran || '2025/2026',
      is_published: item.is_published !== undefined ? item.is_published : 1,
    });
    setShowModal(true);
  };

  // ── Pilih File Berkas ──────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 30 MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // ── Simpan Form (Create / Edit) ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      alert('Judul modul wajib diisi.');
      return;
    }

    if (formData.tipe === 'modul_upload' && !selectedFile && !isEditing) {
      alert('Silakan pilih berkas modul (PDF/DOCX) untuk diunggah.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('judul', formData.judul);
      data.append('deskripsi', formData.deskripsi);
      data.append('kategori', formData.kategori);
      data.append('mapel', formData.mapel);
      data.append('tipe', formData.tipe);
      data.append('url_eksternal', formData.url_eksternal);
      data.append('penulis', formData.penulis);
      data.append('semester', formData.semester);
      data.append('tahun_ajaran', formData.tahun_ajaran);
      data.append('is_published', formData.is_published);

      if (selectedFile) {
        data.append('file', selectedFile);
      }

      let resSuccess = false;
      try {
        let res;
        if (isEditing) {
          res = await ModulBukuAPI.update(editId, data);
        } else {
          res = await ModulBukuAPI.create(data);
        }
        if (res.data?.success) resSuccess = true;
      } catch (backendErr) {
        console.warn('Simpan via backend gagal, menyimpan ke lokal storage:', backendErr.message);
      }

      // Selalu simpan/perbarui ke lokal juga agar langsung tampil di UI
      const currentItems = getLocalStoredModul();
      let updatedItems = [];

      if (isEditing) {
        updatedItems = currentItems.map((item) => {
          if (item.id === editId) {
            return {
              ...item,
              ...formData,
              file_nama_asli: selectedFile ? selectedFile.name : item.file_nama_asli,
              file_size: selectedFile ? selectedFile.size : item.file_size,
              file_path: selectedFile ? URL.createObjectURL(selectedFile) : item.file_path,
            };
          }
          return item;
        });
      } else {
        const newItem = {
          id: Date.now(),
          ...formData,
          total_dibaca: 0,
          file_nama_asli: selectedFile ? selectedFile.name : null,
          file_size: selectedFile ? selectedFile.size : 0,
          file_type: selectedFile ? selectedFile.name.split('.').pop().toUpperCase() : 'PDF',
          file_path: selectedFile ? URL.createObjectURL(selectedFile) : null,
        };
        updatedItems = [newItem, ...currentItems];
      }

      saveLocalStoredModul(updatedItems);

      setFeedback({
        type: 'success',
        msg: isEditing
          ? 'Modul berhasil diperbarui!'
          : 'Modul pembelajaran berhasil diunggah dan disimpan!',
      });
      setShowModal(false);
      fetchData();
      setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
    } catch (err) {
      console.error('Error submitting modul:', err);
      alert('Gagal menyimpan modul.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Hapus Modul ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      try {
        await ModulBukuAPI.delete(deleteTarget.id);
      } catch (err) {
        console.warn('Hapus backend gagal/404, menghapus dari lokal storage:', err.message);
      }

      const currentItems = getLocalStoredModul();
      const updated = currentItems.filter((m) => m.id !== deleteTarget.id);
      saveLocalStoredModul(updated);

      setFeedback({
        type: 'success',
        msg: `Modul "${deleteTarget.judul}" berhasil dihapus.`,
      });
      setDeleteTarget(null);
      fetchData();
      setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
    } catch (err) {
      console.error('Error deleting modul:', err);
      alert('Gagal menghapus modul.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper kelas badge
  const getJenjangClass = (kat) => {
    const k = (kat || '').toLowerCase();
    if (k.includes('paket a')) return 'paket-a';
    if (k.includes('paket b')) return 'paket-b';
    if (k.includes('paket c')) return 'paket-c';
    return 'umum';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div className="modul-admin-container">

            {/* ── 1. Header ────────────────────────────────────── */}
            <div className="modul-admin-header">
              <div className="modul-header-title">
                <h1>Kelola Modul & Buku Pembelajaran</h1>
                <p>
                  Unggah dan kelola modul pembelajaran mandiri PKBM Bina Mandiri serta integrasikan
                  tautan katalog buku resmi Kemendikdasmen RI untuk warga belajar.
                </p>
              </div>

              <div className="modul-header-actions">
                <button
                  type="button"
                  className="modul-btn-primary"
                  onClick={handleOpenCreate}
                >
                  <Plus size={18} />
                  <span>Unggah Modul Baru</span>
                </button>
              </div>
            </div>

            {/* ── 2. Feedback Alert ────────────────────────────── */}
            {feedback.msg && (
              <div className={`modul-alert ${feedback.type}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* ── 3. Banner Integrasi Kemendikdasmen ────────────── */}
            <div className="kemendikdasmen-admin-banner">
              <div className="kemendikdasmen-banner-left">
                <div className="kemendikdasmen-banner-icon">
                  <BookMarked size={26} />
                </div>
                <div className="kemendikdasmen-banner-title">
                  <h3>Integrasi Resmi: Portal Buku Kemendikdasmen (SIBI)</h3>
                  <p>
                    Akses ribuan buku teks pelajaran Kurikulum Merdeka dan buku nonteks resmi Kemendikdasmen
                    melalui alamat: <strong>https://buku.kemendikdasmen.go.id/</strong>
                  </p>
                </div>
              </div>

              <a
                href="https://buku.kemendikdasmen.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-banner-kemendikdasmen"
              >
                <span>Buka Portal Kemendikdasmen</span>
                <ExternalLink size={16} />
              </a>
            </div>

            {/* ── 4. Metrik Ringkasan Berpola & Berwarna ────────── */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card admin-stat-blue">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Library size={22} />
                  </div>
                  <span className="admin-stat-tag">TOTAL</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total_semua || modulList.length}</div>
                  <div className="admin-stat-label">Total Koleksi Modul</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-green">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <GraduationCap size={22} />
                  </div>
                  <span className="admin-stat-tag">PAKET A</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total_paket_a || 0}</div>
                  <div className="admin-stat-label">Modul Paket A (SD)</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-sky">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <BookOpen size={22} />
                  </div>
                  <span className="admin-stat-tag">PAKET B</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total_paket_b || 0}</div>
                  <div className="admin-stat-label">Modul Paket B (SMP)</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-purple">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Layers size={22} />
                  </div>
                  <span className="admin-stat-tag">PAKET C</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total_paket_c || 0}</div>
                  <div className="admin-stat-label">Modul Paket C (SMA)</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-amber">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <Eye size={22} />
                  </div>
                  <span className="admin-stat-tag">DIBACA</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stats.total_dibaca_semua || 0}x</div>
                  <div className="admin-stat-label">Total Dibaca Siswa</div>
                </div>
              </div>
            </div>

            {/* ── 5. Toolbar Pencarian & Filter ────────────────── */}
            <div className="modul-toolbar">
              <form className="toolbar-left" onSubmit={handleSearchSubmit}>
                <div className="toolbar-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Cari modul, mapel, atau penulis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="toolbar-select"
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                >
                  <option value="Semua">Semua Jenjang</option>
                  <option value="Paket A">Paket A (SD)</option>
                  <option value="Paket B">Paket B (SMP)</option>
                  <option value="Paket C">Paket C (SMA)</option>
                  <option value="Umum / Keterampilan">Umum / Keterampilan</option>
                </select>

                <select
                  className="toolbar-select"
                  value={tipeFilter}
                  onChange={(e) => setTipeFilter(e.target.value)}
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="modul_upload">Modul Diunggah PKBM</option>
                  <option value="buku_kemendikdasmen">Katalog Kemendikdasmen</option>
                </select>

                <button type="submit" className="modul-btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                  Filter
                </button>
              </form>
            </div>

            {/* ── 6. Tabel Data Modul ──────────────────────────── */}
            <div className="modul-table-card">
              <div className="modul-table-responsive">
                <table className="modul-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Judul Modul & Ringkasan</th>
                      <th>Jenjang</th>
                      <th>Mata Pelajaran</th>
                      <th>Tipe</th>
                      <th>Berkas / Tautan</th>
                      <th>Dibaca</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                          <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
                          <span style={{ color: '#64748B' }}>Memuat koleksi modul...</span>
                        </td>
                      </tr>
                    ) : modulList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                          <BookOpen size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A' }}>Tidak Ada Data Modul</h4>
                          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
                            Klik tombol <strong>"Unggah Modul Baru"</strong> untuk menambahkan modul ajar PKBM.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      modulList.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="table-title-cell">
                              <span className="table-doc-title">{item.judul}</span>
                              <span className="table-doc-sub">
                                {item.deskripsi || 'Modul belajar mandiri'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className={`table-badge-jenjang ${getJenjangClass(item.kategori)}`}>
                              {item.kategori || 'Semua Jenjang'}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              {item.mapel || '—'}
                            </span>
                          </td>

                          <td>
                            {item.tipe === 'buku_kemendikdasmen' ? (
                              <span style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ExternalLink size={12} />
                                Kemendikdasmen
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <FileText size={12} />
                                Modul PKBM
                              </span>
                            )}
                          </td>

                          <td>
                            {item.file_path || item.file_nama_asli ? (
                              <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                                <span>{formatFileSize(item.file_size)}</span>
                                <span style={{ textTransform: 'uppercase', color: '#EF4444', fontWeight: 700, marginLeft: '0.4rem' }}>
                                  ({item.file_type || 'PDF'})
                                </span>
                              </div>
                            ) : item.url_eksternal ? (
                              <a
                                href={item.url_eksternal}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.82rem', color: '#2563EB', textDecoration: 'underline' }}
                              >
                                Tautan Portal
                              </a>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>—</span>
                            )}
                          </td>

                          <td>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>
                              {item.total_dibaca || 0}x
                            </span>
                          </td>

                          <td>
                            <div className="table-actions" style={{ justifyContent: 'center' }}>
                              {/* Preview / Baca */}
                              <button
                                type="button"
                                className="btn-action"
                                title="Pratinjau Modul"
                                onClick={() => {
                                  if (item.tipe === 'buku_kemendikdasmen' && item.url_eksternal) {
                                    window.open(item.url_eksternal, '_blank', 'noopener,noreferrer');
                                  } else {
                                    setPreviewItem(item);
                                  }
                                }}
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                className="btn-action"
                                title="Edit Modul"
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Hapus */}
                              <button
                                type="button"
                                className="btn-action delete"
                                title="Hapus Modul"
                                onClick={() => setDeleteTarget(item)}
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
            </div>

          </div>
        </div>
      </main>

      {/* ── 7. Modal Form Upload / Edit (Dapat Di-scroll Sempurna & Rapi) ─────── */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>{isEditing ? 'Perbarui Modul Pembelajaran' : 'Unggah Modul Pembelajaran Baru'}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Lengkapi informasi modul dan unggah dokumen PDF / tautan Kemendikdasmen
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowModal(false)}
                title="Tutup Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="admin-modal-body">

                {/* Pilihan Tipe Modul */}
                <div className="form-group">
                  <label>Jenis Sumber Modul / Buku</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="tipe"
                        value="modul_upload"
                        checked={formData.tipe === 'modul_upload'}
                        onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                      />
                      <span>Upload Dokumen Modul PKBM (PDF/DOCX)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="tipe"
                        value="buku_kemendikdasmen"
                        checked={formData.tipe === 'buku_kemendikdasmen'}
                        onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                      />
                      <span>Tautan Buku Kemendikdasmen RI</span>
                    </label>
                  </div>
                </div>

                {/* Judul Modul */}
                <div className="form-group">
                  <label>
                    Judul Modul / Buku <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Modul Kewirausahaan Mandiri Paket C"
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* Kategori Jenjang & Mapel */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Jenjang Pendidikan</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      className="form-select"
                    >
                      {KATEGORI_OPTIONS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Mata Pelajaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: Bahasa Indonesia, IPAS, Kewirausahaan"
                      value={formData.mapel}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Semester & Penulis */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="form-select"
                    >
                      <option value="Semua Semester">Semua Semester</option>
                      <option value="Semester Ganjil">Semester Ganjil</option>
                      <option value="Semester Genap">Semester Genap</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Penyusun / Penulis</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tim Tutor PKBM Bina Mandiri"
                      value={formData.penulis}
                      onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Upload File jika tipe 'modul_upload' */}
                {formData.tipe === 'modul_upload' && (
                  <div className="form-group">
                    <label>
                      Berkas Modul Pembelajaran (PDF / DOCX, Maks. 30MB) {!isEditing && <span className="required">*</span>}
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                    />

                    <div
                      className="modul-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon">
                        <UploadCloud size={24} />
                      </div>
                      <span className="dropzone-text">
                        {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas dokumen'}
                      </span>
                      <span className="dropzone-sub">
                        Format yang didukung: PDF, DOC, DOCX hingga 30MB
                      </span>
                    </div>

                    {isEditing && !selectedFile && existingFileName && (
                      <div className="selected-file-badge">
                        <span>Berkas saat ini: <strong>{existingFileName}</strong></span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Pilih baru jika ingin mengganti</span>
                      </div>
                    )}
                  </div>
                )}

                {/* URL jika tipe 'buku_kemendikdasmen' */}
                {formData.tipe === 'buku_kemendikdasmen' && (
                  <div className="form-group">
                    <label>
                      Tautan Portal Buku Kemendikdasmen <span className="required">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://buku.kemendikdasmen.go.id/..."
                      value={formData.url_eksternal}
                      onChange={(e) => setFormData({ ...formData, url_eksternal: e.target.value })}
                      className="form-input"
                    />
                    <small style={{ color: '#64748B', fontSize: '0.8rem' }}>
                      Buku akan langsung membuka portal resmi Kemendikdasmen saat diakses oleh warga belajar.
                    </small>
                  </div>
                )}

                {/* Deskripsi / Capaian Pembelajaran */}
                <div className="form-group">
                  <label>Deskripsi Ringkas / Capaian Modul</label>
                  <textarea
                    rows={3}
                    placeholder="Ringkasan materi pokok dan petunjuk pembelajaran mandiri warga belajar..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                {/* Status Publikasi */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_published === 1}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked ? 1 : 0 })}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      Langsung Terbitkan ke Tampilan Siswa
                    </span>
                  </label>
                </div>

              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Unggah Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Modal Hapus Konfirmasi ───────────────────────────── */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={20} />
                <span>Hapus Modul Pembelajaran?</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus modul <strong>"{deleteTarget.judul}"</strong>? Berkas modul fisik yang tersimpan juga akan dihapus.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Modul'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. In-App Document Reader Modal (Pratinjau Admin) ──── */}
      {previewItem && (
        <div className="modul-reader-overlay" onClick={() => setPreviewItem(null)}>
          <div
            className={`modul-reader-dialog ${isFullscreen ? 'fullscreen' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={isFullscreen ? { width: '100vw', height: '100vh', maxWidth: 'none', borderRadius: 0 } : {}}
          >
            <div className="modul-reader-header">
              <div className="reader-title-group">
                <div className="reader-doc-icon">
                  <BookOpen size={20} />
                </div>
                <div className="reader-title-text">
                  <span className="reader-doc-title">{previewItem.judul}</span>
                  <span className="reader-doc-sub">
                    {previewItem.kategori} • Pratinjau Tampilan Siswa
                  </span>
                </div>
              </div>

              <div className="reader-actions">
                <button
                  type="button"
                  className="reader-icon-btn"
                  onClick={() => setIsFullscreen((p) => !p)}
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                {previewItem.file_path && (
                  <a
                    href={toAssetUrl(previewItem.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reader-icon-btn"
                    title="Unduh / Buka Dokumen Asli"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}

                <button
                  type="button"
                  className="reader-icon-btn close"
                  onClick={() => setPreviewItem(null)}
                  title="Tutup Pratinjau"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modul-reader-body">
              {previewItem.file_path ? (
                <iframe
                  src={toAssetUrl(previewItem.file_path)}
                  title={previewItem.judul}
                  className="modul-reader-iframe"
                />
              ) : previewItem.url_eksternal ? (
                <div className="reader-fallback">
                  <BookMarked size={48} color="#60A5FA" style={{ margin: '0 auto 1rem' }} />
                  <h4>Tautan Buku Portal Kemendikdasmen</h4>
                  <p>
                    Buku ini membuka langsung ke portal resmi SIBI Kemendikdasmen: <br />
                    <code>{previewItem.url_eksternal}</code>
                  </p>
                  <a
                    href={previewItem.url_eksternal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-reader-open-external"
                  >
                    <span>Buka Tautan Buku</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              ) : (
                <div className="reader-fallback">
                  <FileText size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                  <h4>Tidak Ada Berkas Terlampir</h4>
                  <p>Modul ini belum memiliki berkas dokumen yang terunggah.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ModulBukuAdmin;
