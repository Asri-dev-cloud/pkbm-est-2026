// ============================================================
// src/pages/siswa/ModulBukuSiswa.jsx — Kumpulan Modul & Buku Siswa
// Halaman Pusat Modul Ajar PKBM & Katalog Buku Kemendikdasmen
// Tampilan Siswa: 100% Read-Only (Hanya Membaca Modul & Buku)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Library,
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  Eye,
  Sparkles,
  Download,
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  BookMarked,
  Layers,
  GraduationCap,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { ModulBukuAPI, toAssetUrl } from '../../services/api.js';
import './ModulBukuSiswa.css';

// Fallback data awal saat server live belum di-deploy
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

const getLocalStoredModul = () => {
  try {
    const raw = localStorage.getItem('pkbm_custom_modul');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_MODUL_DATA;
};

const JENJANG_FILTERS = [
  'Semua',
  'Paket A',
  'Paket B',
  'Paket C',
  'Umum / Keterampilan',
];

// Helper konversi bytes ke ukuran yang mudah dibaca
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

function ModulBukuSiswa() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── States Navigasi & Data (Optimistic Instant 0ms Render) ──
  const [activeTab, setActiveTab] = useState('modul'); // 'modul' | 'buku'
  const [modulList, setModulList] = useState(() => getLocalStoredModul().filter((m) => m.is_published === 1));
  const [loading, setLoading] = useState(false);

  // ── Filter States ──────────────────────────────────────────
  const [selectedJenjang, setSelectedJenjang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // ── In-App Document Reader State ───────────────────────────
  const [activeReader, setActiveReader] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Ambil Data Modul (Background Revalidation) ─────────────
  const fetchModul = async () => {
    try {
      const params = {};
      if (selectedJenjang !== 'Semua') params.kategori = selectedJenjang;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await ModulBukuAPI.getPublished(params);
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setModulList(res.data.data);
      }
    } catch (err) {
      // Fallback lokal jika backend belum ter-deploy di server VPS
      console.warn('Backend API /modul-buku belum aktif/404, memuat data lokal:', err.message);
      let allItems = getLocalStoredModul().filter((m) => m.is_published === 1);

      if (selectedJenjang !== 'Semua') {
        allItems = allItems.filter(
          (m) => m.kategori === selectedJenjang || m.kategori === 'Semua Jenjang'
        );
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModul();
  }, [selectedJenjang]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchModul();
  };

  // ── Buka In-App Reader (Siswa Hanya Membaca) ───────────────
  const handleOpenReader = async (item) => {
    if (item.tipe === 'buku_kemendikdasmen' && item.url_eksternal) {
      window.open(item.url_eksternal, '_blank', 'noopener,noreferrer');
      return;
    }

    setActiveReader(item);

    // Kirim sinyal increment statistik dibaca tanpa blocking UI
    try {
      ModulBukuAPI.getDetail(item.id, true);
    } catch {}

    // Update state lokal read count
    setModulList((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, total_dibaca: (m.total_dibaca || 0) + 1 } : m))
    );

    // Update local storage read count
    try {
      const stored = getLocalStoredModul();
      const updated = stored.map((m) =>
        m.id === item.id ? { ...m, total_dibaca: (m.total_dibaca || 0) + 1 } : m
      );
      localStorage.setItem('pkbm_custom_modul', JSON.stringify(updated));
    } catch {}
  };

  const handleCloseReader = () => {
    setActiveReader(null);
    setIsFullscreen(false);
  };

  // Helper kelas warna badge jenjang
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
          <div className="modul-siswa-container">

            {/* ── 1. Hero Welcome Header ───────────────────────── */}
            <div className="modul-siswa-hero">
              <h1>Kumpulan Modul & Buku Pembelajaran</h1>
              <p>
                Akses modul pembelajaran mandiri resmi PKBM Bina Mandiri dan katalog buku teks
                Kurikulum Merdeka Kementerian Pendidikan Dasar dan Menengah RI. Membaca lebih mudah kapan saja.
              </p>
            </div>

            {/* ── 2. Tab Menu Navigasi ─────────────────────────── */}
            <div className="modul-tabs-wrapper">
              <button
                type="button"
                className={`modul-tab-btn ${activeTab === 'modul' ? 'active' : ''}`}
                onClick={() => setActiveTab('modul')}
              >
                <BookOpen size={18} />
                <span>Modul Belajar PKBM</span>
                <span className="tab-count">{modulList.length}</span>
              </button>

              <button
                type="button"
                className={`modul-tab-btn ${activeTab === 'buku' ? 'active' : ''}`}
                onClick={() => setActiveTab('buku')}
              >
                <Library size={18} />
                <span>Buku Kemendikdasmen</span>
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* ── 3. TAB 1: MODUL BELAJAR PKBM ─────────────────── */}
            {activeTab === 'modul' && (
              <>
                {/* Search & Jenjang Filters */}
                <div className="modul-controls-card">
                  <form className="modul-search-row" onSubmit={handleSearchSubmit}>
                    <div className="modul-search-box">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Cari judul modul, mata pelajaran, atau kata kunci..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="modul-search-input"
                      />
                    </div>
                    <button
                      type="submit"
                      className="modul-tab-btn active"
                      style={{ padding: '0.8rem 1.6rem' }}
                    >
                      Cari
                    </button>
                  </form>

                  <div className="modul-jenjang-filter">
                    <span className="filter-label">Filter Jenjang:</span>
                    {JENJANG_FILTERS.map((kat) => (
                      <button
                        key={kat}
                        type="button"
                        className={`jenjang-chip ${selectedJenjang === kat ? 'active' : ''}`}
                        onClick={() => setSelectedJenjang(kat)}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#64748B', fontWeight: 600 }}>Memuat koleksi modul...</p>
                  </div>
                ) : modulList.length === 0 ? (
                  /* Empty State */
                  <div className="modul-empty-state">
                    <div className="modul-empty-icon">
                      <BookOpen size={30} />
                    </div>
                    <h3>Belum Ada Modul Tersedia</h3>
                    <p>
                      Modul untuk filter yang dipilih belum diunggah oleh admin. Silakan coba filter jenjang lain
                      atau kunjungi tab Buku Kemendikdasmen.
                    </p>
                  </div>
                ) : (
                  /* Modul Grid Cards */
                  <div className="modul-grid">
                    {modulList.map((item) => (
                      <div key={item.id} className="modul-card">
                        <div>
                          <div className="modul-card-top">
                            <div className="modul-badge-group">
                              <span className={`badge-jenjang ${getJenjangClass(item.kategori)}`}>
                                {item.kategori || 'Semua Jenjang'}
                              </span>
                              {item.mapel && (
                                <span className="badge-mapel">{item.mapel}</span>
                              )}
                            </div>
                            <span className="modul-filetype-indicator">
                              <FileText size={12} />
                              {item.file_type || (item.tipe === 'buku_kemendikdasmen' ? 'LINK' : 'PDF')}
                            </span>
                          </div>

                          <h3 className="modul-card-title" title={item.judul}>
                            {item.judul}
                          </h3>

                          <p className="modul-card-desc">
                            {item.deskripsi || 'Modul materi ajar dan pedoman belajar mandiri warga belajar PKBM Bina Mandiri.'}
                          </p>
                        </div>

                        <div>
                          <div className="modul-meta-info">
                            <span className="modul-meta-item">
                              <GraduationCap size={13} />
                              <span>{item.penulis || 'PKBM Bina Mandiri'}</span>
                            </span>
                            <span className="modul-meta-item">
                              <Eye size={13} />
                              <span>{item.total_dibaca || 0}x dibaca</span>
                            </span>
                            {item.file_size > 0 && (
                              <span className="modul-meta-item">
                                <span>{formatFileSize(item.file_size)}</span>
                              </span>
                            )}
                          </div>

                          {/* Tombol Baca — Siswa Hanya Bisa Membaca */}
                          <button
                            type="button"
                            className="modul-btn-read"
                            onClick={() => handleOpenReader(item)}
                          >
                            <BookOpen size={17} />
                            <span>Baca Modul Ini</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── 4. TAB 2: BUKU RESMI KEMENDIKDASMEN ────────────── */}
            {activeTab === 'buku' && (
              <>
                {/* Official SIBI Kemendikdasmen Featured Banner */}
                <div className="kemendikdasmen-hero-card">
                  <div className="kemendikdasmen-badge">
                    <BookMarked size={14} />
                    <span>Portal Resmi Perbukuan Nasional • SIBI</span>
                  </div>
                  <h2>Katalog Buku Digital Kemendikdasmen RI</h2>
                  <p>
                    Kementerian Pendidikan Dasar dan Menengah Republik Indonesia menyediakan akses terbuka
                    ke seluruh Buku Teks Utama Kurikulum Merdeka, Buku Teks Pendamping, Buku Nonteks (Literasi Bacaan),
                    dan Panduan Pendidik secara legal, lengkap, dan gratis.
                  </p>
                  <div className="kemendikdasmen-action-group">
                    <a
                      href="https://buku.kemendikdasmen.go.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-kemendikdasmen"
                    >
                      <span>Kunjungi buku.kemendikdasmen.go.id</span>
                      <ExternalLink size={18} />
                    </a>
                    <span className="portal-url-tag">
                      Tautan Resmi: https://buku.kemendikdasmen.go.id/
                    </span>
                  </div>
                </div>

                {/* Jalur Akses Buku per Jenjang */}
                <div className="kemendikdasmen-grid">
                  
                  {/* Paket A / SD */}
                  <div className="kemendikdasmen-card">
                    <div>
                      <div className="kemendikdasmen-card-icon sd">
                        <GraduationCap size={26} />
                      </div>
                      <h3>Buku Teks Paket A (Setara SD)</h3>
                      <p>
                        Kumpulan buku pelajaran Kurikulum Merdeka untuk jenjang Paket A (Fase A, B, dan C: Kelas 1 s.d. Kelas 6).
                        Mencakup Bahasa Indonesia, Matematika, IPAS, dan Pendidikan Pancasila.
                      </p>
                    </div>
                    <a
                      href="https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-kemendikdasmen-link"
                    >
                      <span>Buka Katalog Buku Paket A</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Paket B / SMP */}
                  <div className="kemendikdasmen-card">
                    <div>
                      <div className="kemendikdasmen-card-icon smp">
                        <BookOpen size={26} />
                      </div>
                      <h3>Buku Teks Paket B (Setara SMP)</h3>
                      <p>
                        Koleksi lengkap buku teks utama Kurikulum Merdeka untuk jenjang Paket B (Fase D: Kelas 7 s.d. Kelas 9).
                        Tersedia IPA terpadu, IPS terpadu, Informatika, Bahasa Inggris, dan mata pelajaran wajib lainnya.
                      </p>
                    </div>
                    <a
                      href="https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-kemendikdasmen-link"
                    >
                      <span>Buka Katalog Buku Paket B</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Paket C / SMA */}
                  <div className="kemendikdasmen-card">
                    <div>
                      <div className="kemendikdasmen-card-icon sma">
                        <Layers size={26} />
                      </div>
                      <h3>Buku Teks Paket C (Setara SMA)</h3>
                      <p>
                        Buku teks resmi Kurikulum Merdeka jenjang Paket C (Fase E dan F: Kelas 10, 11, dan 12).
                        Mendukung peminatan sains, sosial, humaniora, serta program vokasi keahlian.
                      </p>
                    </div>
                    <a
                      href="https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-kemendikdasmen-link"
                    >
                      <span>Buka Katalog Buku Paket C</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Nonteks & Literasi Bergizi */}
                  <div className="kemendikdasmen-card">
                    <div>
                      <div className="kemendikdasmen-card-icon nonteks">
                        <Sparkles size={26} />
                      </div>
                      <h3>Buku Literasi & Nonteks Bergizi</h3>
                      <p>
                        Bahan bacaan pengayaan, fiksi inspiratif, cerpen, buku bergambar, dan wawasan umum
                        untuk meningkatkan kemampuan literasi membaca warga belajar mandiri.
                      </p>
                    </div>
                    <a
                      href="https://buku.kemendikdasmen.go.id/katalog/buku-non-teks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-kemendikdasmen-link"
                    >
                      <span>Jelajahi Buku Nonteks</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Panduan Guru & Fasilitator */}
                  <div className="kemendikdasmen-card">
                    <div>
                      <div className="kemendikdasmen-card-icon panduan">
                        <BookMarked size={26} />
                      </div>
                      <h3>Panduan Guru & Modul Ajar</h3>
                      <p>
                        Buku pedoman guru, alur tujuan pembelajaran (ATP), dan panduan asesmen kurikulum
                        yang dapat dipelajari warga belajar untuk memahami capaian belajar mandiri.
                      </p>
                    </div>
                    <a
                      href="https://buku.kemendikdasmen.go.id/katalog/buku-kurikulum-merdeka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-kemendikdasmen-link"
                    >
                      <span>Lihat Panduan Pendidik</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>

                </div>

                {/* Panduan Membaca Buku Kemendikdasmen */}
                <div className="kemendikdasmen-guide-card">
                  <div className="guide-title">
                    <CheckCircle2 size={20} color="#10B981" />
                    <span>Panduan Membaca Buku di Portal Kemendikdasmen</span>
                  </div>
                  <ul className="guide-list">
                    <li className="guide-step">
                      <span className="step-num">1</span>
                      <span className="step-text">
                        Klik tombol <strong>"Kunjungi Portal Kemendikdasmen"</strong> atau pilih jenjang yang sesuai.
                      </span>
                    </li>
                    <li className="guide-step">
                      <span className="step-num">2</span>
                      <span className="step-text">
                        Gunakan kotak pencarian di portal SIBI untuk memasukkan mata pelajaran atau fase kelas Anda.
                      </span>
                    </li>
                    <li className="guide-step">
                      <span className="step-num">3</span>
                      <span className="step-text">
                        Pilih tombol <strong>"Baca Online"</strong> untuk membaca langsung di browser tanpa perlu mengunduh.
                      </span>
                    </li>
                    <li className="guide-step">
                      <span className="step-num">4</span>
                      <span className="step-text">
                        Gunakan fitur catatan atau simpan link buku untuk bahan belajar mandiri mingguan.
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      {/* ── 5. In-App Document Reader Modal (100% Read-Only) ── */}
      {activeReader && (
        <div className="modul-reader-overlay" onClick={handleCloseReader}>
          <div
            className={`modul-reader-dialog ${isFullscreen ? 'fullscreen' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={isFullscreen ? { width: '100vw', height: '100vh', maxWidth: 'none', borderRadius: 0 } : {}}
          >
            {/* Modal Header */}
            <div className="modul-reader-header">
              <div className="reader-title-group">
                <div className="reader-doc-icon">
                  <BookOpen size={20} />
                </div>
                <div className="reader-title-text">
                  <span className="reader-doc-title">{activeReader.judul}</span>
                  <span className="reader-doc-sub">
                    {activeReader.kategori || 'Semua Jenjang'} • {activeReader.mapel || 'Modul Pembelajaran'} • Mode Baca Siswa
                  </span>
                </div>
              </div>

              <div className="reader-actions">
                <button
                  type="button"
                  className="reader-icon-btn"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                {activeReader.file_path && (
                  <a
                    href={toAssetUrl(activeReader.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reader-icon-btn"
                    title="Buka di Tab Baru"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}

                <button
                  type="button"
                  className="reader-icon-btn close"
                  onClick={handleCloseReader}
                  title="Tutup Pembaca"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Reader Body */}
            <div className="modul-reader-body">
              {activeReader.file_path ? (
                <iframe
                  src={toAssetUrl(activeReader.file_path)}
                  title={activeReader.judul}
                  className="modul-reader-iframe"
                />
              ) : activeReader.url_eksternal ? (
                <div className="reader-fallback">
                  <BookMarked size={48} color="#60A5FA" style={{ margin: '0 auto 1rem' }} />
                  <h4>Modul / Buku Disediakan Melalui Tautan Resmi</h4>
                  <p>
                    Buku ini terintegrasi dengan Portal Resmi Kemendikdasmen. Anda dapat membacanya langsung
                    melalui portal buku nasional.
                  </p>
                  <a
                    href={activeReader.url_eksternal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-reader-open-external"
                  >
                    <span>Buka di Portal Kemendikdasmen</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              ) : (
                <div className="reader-fallback">
                  <FileText size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                  <h4>Berkas Modul Sedang Dipersiapkan</h4>
                  <p>
                    File materi untuk modul ini belum diunggah oleh admin. Silakan periksa kembali nanti atau
                    hubungi tutor pengajar Anda.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseReader}
                    className="btn-reader-open-external"
                    style={{ background: '#475569' }}
                  >
                    Kembali
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModulBukuSiswa;
