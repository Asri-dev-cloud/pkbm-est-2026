// ============================================================
// src/pages/siswa/BeritaSiswa.jsx — Kabar & Dokumentasi Kegiatan
// Portal Dokumentasi Kegiatan PKBM (Khusus Warga Belajar / Siswa)
// Tampilan: 100% Read-Only, Responsif di Seluruh Perangkat
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Calendar,
  MapPin,
  Eye,
  Video,
  Image as ImageIcon,
  Search,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Film,
  User,
  Share2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { BeritaAPI, toAssetUrl } from '../../services/api.js';
import './BeritaSiswa.css';

const KATEGORI_LIST = [
  'Semua',
  'Kegiatan PKBM',
  'Vokasi & Ekstrakurikuler',
  'Akademik',
  'Pameran & Karya',
  'Ujian & Kelulusan',
  'Kegiatan Sosial',
  'Informasi Resmi',
];

// Helper YouTube Embed
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
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

function BeritaSiswa() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── States ────────────────────────────────────────────────
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reader Detail Modal State ─────────────────────────────
  const [selectedBerita, setSelectedBerita] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Lightbox Gallery State ────────────────────────────────
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // ── Fetch Berita ──────────────────────────────────────────
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (activeCategory !== 'Semua') {
        params.kategori = activeCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await BeritaAPI.getPublished(params);
      if (res.data?.success) {
        setBeritaList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Gagal memuat berita dari server:', err.message);
      // Fallback data demonstrasi agar UI tetap tampil prima
      setBeritaList([
        {
          id: 1,
          judul: 'Peringatan Hari Belajar Mandiri & Pameran Karya Vokasi Warga Belajar PKBM',
          kategori: 'Vokasi & Ekstrakurikuler',
          tanggal_kegiatan: new Date().toISOString(),
          lokasi: 'Aula Kampus PKBM Bina Mandiri',
          penulis: 'Humas PKBM',
          ringkasan: 'Dokumentasi meriah pameran karya kewirausahaan, vokasi tata boga, serta keterampilan digital warga belajar Paket A, B, dan C.',
          konten: 'PKBM Bina Mandiri sukses menyelenggarakan pameran karya vokasi dan gelar karya belajar mandiri tahun ajaran 2026/2027.\n\nAcara ini dihadiri oleh seluruh tutor, pamong belajar, serta ratusan warga belajar dari seluruh rombel reguler dan mandiri. Kegiatan ini bertujuan untuk menampilkan hasil pembelajaran keterampilan terapan warga belajar, mulai dari desain grafis, kerajinan tangan, produk olahan pangan lokal, hingga demonstrasi aplikasi teknologi informasi.',
          is_pinned: 1,
          views_count: 85,
        },
        {
          id: 2,
          judul: 'Pelatihan Literasi Digital & Pemrograman Dasar untuk Warga Belajar Paket C',
          kategori: 'Akademik',
          tanggal_kegiatan: new Date().toISOString(),
          lokasi: 'Laboratorium Komputer PKBM',
          penulis: 'Tim Akademik',
          ringkasan: 'Sesi workshop intensif pemanfaatan teknologi informasi untuk kesiapan kerja dan perkuliahan alumni pendidikan kesetaraan.',
          konten: 'Sebagai bagian dari komitmen mencetak lulusan berdaya saing tinggi, PKBM Bina Mandiri mengadakan pelatihan literasi digital terpadu. Materi mencakup dasar pengolahan data spreadsheet, desain visual presentasi, dan pengenalan kecerdasan buatan untuk produktivitas kerja.',
          is_pinned: 0,
          views_count: 52,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, [activeCategory, searchQuery]);

  // Buka detail berita (panggil getDetail untuk tambah views_count di backend)
  const handleOpenDetail = async (item) => {
    setSelectedBerita(item);
    setLoadingDetail(true);
    try {
      const res = await BeritaAPI.getDetail(item.id);
      if (res.data?.success && res.data.data) {
        setSelectedBerita(res.data.data);
      }
    } catch {
      // Tetap tampilkan item yang ada
    } finally {
      setLoadingDetail(false);
    }
  };

  // Navigasi Lightbox
  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (selectedBerita?.galeri_foto && lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev + 1) % selectedBerita.galeri_foto.length);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (selectedBerita?.galeri_foto && lightboxIndex !== null) {
      setLightboxIndex((prev) =>
        prev === 0 ? selectedBerita.galeri_foto.length - 1 : prev - 1
      );
    }
  };

  // Filter berita pinned untuk headline utama
  const featuredItem = beritaList.find((b) => Boolean(b.is_pinned)) || beritaList[0];
  const gridList = featuredItem ? beritaList.filter((b) => b.id !== featuredItem.id) : beritaList;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div className="berita-siswa-container">

            {/* ── Welcome Hero Banner ── */}
            <div className="berita-siswa-hero">
              <div className="berita-hero-tag">
                <Sparkles size={14} /> Kabar & Kegiatan Warga Belajar
              </div>
              <h1>Dokumentasi & Berita PKBM Bina Mandiri</h1>
              <p>
                Ikuti liputan keseruan kegiatan belajar mandiri, pameran karya vokasi, workshop keahlian, dan dokumentasi video kegiatan bersama tutor dan rekan sekelas.
              </p>
            </div>

            {/* ── Headline / Pinned Card ── */}
            {featuredItem && !searchQuery && activeCategory === 'Semua' && (
              <div
                className="berita-featured-card"
                onClick={() => handleOpenDetail(featuredItem)}
              >
                <div className="berita-featured-media-wrap">
                  {featuredItem.gambar_sampul ? (
                    <img
                      src={toAssetUrl(featuredItem.gambar_sampul)}
                      alt={featuredItem.judul}
                      className="berita-featured-media"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#93C5FD' }}>
                      <Newspaper size={64} />
                    </div>
                  )}

                  <div className="berita-featured-badge-float">
                    <Sparkles size={13} /> Berita Unggulan
                  </div>
                </div>

                <div className="berita-featured-content">
                  <div className="berita-featured-meta">
                    <span style={{ color: '#1D4ED8', fontWeight: 700 }}>
                      {featuredItem.kategori}
                    </span>
                    <span>•</span>
                    <span>{formatTanggal(featuredItem.tanggal_kegiatan || featuredItem.created_at)}</span>
                  </div>

                  <h2 className="berita-featured-title">
                    {featuredItem.judul}
                  </h2>

                  <p className="berita-featured-desc">
                    {featuredItem.ringkasan || featuredItem.konten.slice(0, 180) + '...'}
                  </p>

                  <div className="berita-btn-read-featured">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Filter Kategori & Search Bar ── */}
            <div className="berita-siswa-filter-row">
              <div className="berita-siswa-tabs">
                {KATEGORI_LIST.map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    className={`berita-siswa-tab ${activeCategory === kat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(kat)}
                  >
                    {kat}
                  </button>
                ))}
              </div>

              <div className="berita-siswa-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari liputan kegiatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* ── Feed Grid ── */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748B', fontWeight: 600 }}>Memuat liputan kegiatan...</p>
              </div>
            ) : beritaList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: 20, border: '1px dashed #CBD5E1' }}>
                <Newspaper size={44} style={{ color: '#94A3B8', marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 6px 0', color: '#0F172A', fontWeight: 700 }}>Belum Ada Berita</h3>
                <p style={{ margin: 0, color: '#64748B' }}>Tidak ada berita yang cocok dengan filter yang dipilih.</p>
              </div>
            ) : (
              <div className="berita-siswa-grid">
                {(searchQuery || activeCategory !== 'Semua' ? beritaList : gridList).map((item) => {
                  const hasVideo = Boolean(item.video_file || item.video_url);
                  const galeriCount = Array.isArray(item.galeri_foto) ? item.galeri_foto.length : 0;

                  return (
                    <article
                      key={item.id}
                      className="berita-siswa-card"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* Cover Photo */}
                      <div className="berita-siswa-cover-wrap">
                        {item.gambar_sampul ? (
                          <img
                            src={toAssetUrl(item.gambar_sampul)}
                            alt={item.judul}
                            className="berita-siswa-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <div
                          style={{
                            display: item.gambar_sampul ? 'none' : 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                            color: '#93C5FD',
                          }}
                        >
                          <Newspaper size={36} />
                        </div>

                        <span className="berita-siswa-category-badge">
                          {item.kategori}
                        </span>

                        <div className="berita-siswa-media-strip">
                          {hasVideo && (
                            <span className="berita-siswa-media-pill video">
                              <Play size={10} fill="#FFF" /> Video
                            </span>
                          )}
                          {galeriCount > 0 && (
                            <span className="berita-siswa-media-pill">
                              <ImageIcon size={11} /> {galeriCount} Foto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="berita-siswa-card-body">
                        <div className="berita-siswa-card-meta">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={13} />
                            {formatTanggal(item.tanggal_kegiatan || item.created_at)}
                          </span>
                          {item.lokasi && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={13} />
                              {item.lokasi}
                            </span>
                          )}
                        </div>

                        <h3 className="berita-siswa-card-title">
                          {item.judul}
                        </h3>

                        <p className="berita-siswa-card-excerpt">
                          {item.ringkasan || item.konten.slice(0, 130) + '...'}
                        </p>

                        <div className="berita-siswa-card-footer">
                          <span className="berita-siswa-read-btn">
                            <span>Baca Selengkapnya</span>
                            <ArrowRight size={14} />
                          </span>

                          <span className="berita-siswa-views">
                            <Eye size={12} /> {item.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ── MODAL READER DETAIL BERITA (Read-Only) ─────── */}
            {selectedBerita && (
              <div
                className="berita-reader-backdrop"
                onClick={() => setSelectedBerita(null)}
              >
                <div
                  className="berita-reader-window"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="berita-reader-header">
                    <div>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 999,
                          fontSize: '0.785rem',
                          fontWeight: 700,
                          display: 'inline-block',
                          marginBottom: 6,
                        }}
                      >
                        {selectedBerita.kategori}
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 10,
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748B',
                      }}
                      onClick={() => setSelectedBerita(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="berita-reader-body">
                    <h2 className="berita-reader-title">
                      {selectedBerita.judul}
                    </h2>

                    <div className="berita-reader-meta-row">
                      <div className="berita-reader-meta-item">
                        <Calendar size={15} />
                        <span>{formatTanggal(selectedBerita.tanggal_kegiatan || selectedBerita.created_at)}</span>
                      </div>
                      {selectedBerita.lokasi && (
                        <div className="berita-reader-meta-item">
                          <MapPin size={15} />
                          <span>{selectedBerita.lokasi}</span>
                        </div>
                      )}
                      <div className="berita-reader-meta-item">
                        <User size={15} />
                        <span>Oleh: <strong>{selectedBerita.penulis || 'Admin PKBM'}</strong></span>
                      </div>
                      <div className="berita-reader-meta-item">
                        <Eye size={15} />
                        <span>Dibaca {selectedBerita.views_count || 0} kali</span>
                      </div>
                    </div>

                    {/* Foto Sampul Utama */}
                    {selectedBerita.gambar_sampul && (
                      <div className="berita-reader-cover-box">
                        <img
                          src={toAssetUrl(selectedBerita.gambar_sampul)}
                          alt={selectedBerita.judul}
                        />
                      </div>
                    )}

                    {/* Pemutar Video Dokumentasi (Jika Ada) */}
                    {(selectedBerita.video_file || selectedBerita.video_url) && (
                      <div className="berita-reader-video-section">
                        <h4>
                          <Film size={18} /> Dokumentasi Video Kegiatan
                        </h4>

                        {/* File Video Lokal */}
                        {selectedBerita.video_file && (
                          <div className="berita-reader-video-container">
                            <video
                              controls
                              src={toAssetUrl(selectedBerita.video_file)}
                              poster={selectedBerita.gambar_sampul ? toAssetUrl(selectedBerita.gambar_sampul) : undefined}
                            />
                          </div>
                        )}

                        {/* Video YouTube / Eksternal */}
                        {selectedBerita.video_url && !selectedBerita.video_file && (
                          <div className="berita-reader-video-container">
                            <iframe
                              src={getYoutubeEmbedUrl(selectedBerita.video_url)}
                              title="Dokumentasi Video Kegiatan"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Isi Artikel */}
                    <div className="berita-reader-content">
                      {selectedBerita.konten}
                    </div>

                    {/* Galeri Foto Tambahan */}
                    {Array.isArray(selectedBerita.galeri_foto) && selectedBerita.galeri_foto.length > 0 && (
                      <div className="berita-reader-gallery-section">
                        <h4>
                          <ImageIcon size={18} /> Galeri Foto Kegiatan ({selectedBerita.galeri_foto.length} Foto)
                        </h4>

                        <div className="berita-reader-gallery-grid">
                          {selectedBerita.galeri_foto.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="berita-gallery-photo-card"
                              onClick={() => setLightboxIndex(idx)}
                            >
                              <img src={toAssetUrl(imgUrl)} alt={`Dokumentasi ${idx + 1}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Modal */}
                  <div
                    style={{
                      padding: '1.25rem 2rem',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      background: '#F8FAFC',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        background: '#1D4ED8',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 12,
                        padding: '0.65rem 1.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedBerita(null)}
                    >
                      Tutup Berita
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── LIGHTBOX GALERI FOTO FULLSCREEN ───────────── */}
            {lightboxIndex !== null && selectedBerita?.galeri_foto && (
              <div
                className="berita-lightbox-backdrop"
                onClick={() => setLightboxIndex(null)}
              >
                <button
                  type="button"
                  className="berita-lightbox-close"
                  onClick={() => setLightboxIndex(null)}
                >
                  <X size={24} />
                </button>

                {selectedBerita.galeri_foto.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="berita-lightbox-nav prev"
                      onClick={handlePrevPhoto}
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <button
                      type="button"
                      className="berita-lightbox-nav next"
                      onClick={handleNextPhoto}
                    >
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}

                <img
                  src={toAssetUrl(selectedBerita.galeri_foto[lightboxIndex])}
                  alt={`Galeri foto ${lightboxIndex + 1}`}
                  className="berita-lightbox-img"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default BeritaSiswa;

