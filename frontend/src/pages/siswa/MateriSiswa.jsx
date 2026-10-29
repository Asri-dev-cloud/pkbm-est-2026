// ============================================================
// src/pages/siswa/MateriSiswa.jsx — Daftar Materi Belajar WB
// ============================================================
// Warga Belajar melihat dan mengakses materi yang dipublikasikan
// Tutor di rombelnya. WB bisa menandai materi sebagai "selesai".
//
// API:
//   GET /api/materi/rombel/:rombelId  → daftar materi
//   PUT /api/materi/:id/selesai       → tandai selesai
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { LmsAPI, SiswaAPI, toAssetUrl } from '../../services/api.js';

function MateriSiswa() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  const [materi,   setMateri]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  // ID materi yang sedang dibuka detailnya (expand/collapse)
  const [dibuka,   setDibuka]  = useState(null);
  // Menyimpan ID materi yang sedang diproses "tandai selesai"
  const [marking,  setMarking] = useState(null);

  useEffect(() => {
    const fetchProfilDanMateri = async () => {
      try {
        setLoading(true);
        setError('');

        const profilRes = await SiswaAPI.getProfilSaya();
        const profil = profilRes.data.data;
        const rombelId = profil?.rombel_id;

        if (!rombelId) {
          setError('Data rombel Anda belum tersedia. Hubungi Admin TU.');
          setMateri([]);
          return;
        }

        const nextUser = {
          ...user,
          rombel_id: rombelId,
          nama_rombel: profil.nama_rombel || null,
          nis: profil.nis || user.nis || null,
        };
        setUser(nextUser);
        localStorage.setItem('pkbm_user', JSON.stringify(nextUser));

        const res = await LmsAPI.getMateriByRombel(rombelId);
        setMateri(res.data.data || []);
      } catch (err) {
        setMateri([]);
        setError(err.response?.data?.message || 'Gagal memuat materi. Coba muat ulang halaman.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfilDanMateri();
  }, []);

  // ── Handler: tandai satu materi sebagai selesai dibaca ──
  const handleTandaiSelesai = async (id) => {
    setMarking(id);
    try {
      await LmsAPI.tandaiMateriSelesai(id);
      // Update state lokal agar langsung berubah tanpa refetch
      setMateri(prev =>
        prev.map(m => m.id === id ? { ...m, sudah_selesai: true } : m)
      );
    } catch {
      // Gagal diam-diam — user bisa coba lagi
    } finally {
      setMarking(null);
    }
  };

  // ── Helper: ikon berdasarkan tipe materi ────────────────
  const ikonTipe = (tipe) => {
    const map = {
      video:    'bi-play-circle-fill',
      video_link: 'bi-play-circle-fill',
      dokumen:  'bi-file-earmark-pdf-fill',
      link:     'bi-link-45deg',
      link_eksternal: 'bi-link-45deg',
      teks:     'bi-file-text-fill',
    };
    return map[tipe] || 'bi-file-earmark';
  };

  const getKontenUrl = (item) => {
    if (item.url_konten) return item.url_konten;
    if (item.url) return item.url;
    if (item.path_file) return toAssetUrl(item.path_file);
    return '';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '2rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Materi Belajar Warga Belajar
            </h1>
            <p style={{ color: '#64748B', marginTop: 8, fontSize: '0.94rem', maxWidth: '680px' }}>
              Akses modul pembelajaran mandiri resmi dan materi bacaan yang diterbitkan untuk rombongan belajar Anda.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div className="spinner" style={{ width: 40, height: 40, border: '4px solid rgba(92, 184, 255, 0.2)', borderTopColor: '#5CB8FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: '#64748B', fontWeight: 600 }}>Memuat materi...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '14px', border: '1px solid #FCA5A5' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.25rem' }}></i>
              <span>{error}</span>
            </div>
          )}

          {/* Daftar Materi */}
          {!loading && !error && (
            <>
              {/* Ringkasan progres */}
              {materi.length > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem 1.6rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <ProgresBar
                      selesai={materi.filter(m => m.sudah_selesai).length}
                      total={materi.length}
                    />
                  </div>
                </div>
              )}

              {/* Kondisi kosong */}
              {materi.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '3rem 2rem', textAlign: 'center' }}>
                  <div className="empty-state">
                    <i className="bi bi-book" style={{ fontSize: '3rem', color: '#CBD5E1' }}></i>
                    <h3 style={{ marginTop: '1rem', fontWeight: 800 }}>Belum Ada Materi</h3>
                    <p style={{ color: '#64748B' }}>Tutor belum mempublikasikan materi untuk rombel Anda.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {materi.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'white',
                        borderRadius: '18px',
                        border: '1px solid #E2E8F0',
                        padding: '1.2rem 1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 22px rgba(92, 184, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(92, 184, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.02)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                      onClick={() => setDibuka(dibuka === item.id ? null : item.id)}
                    >
                      {/* Baris utama */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                        {/* Nomor urut */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: item.sudah_selesai ? '#D1FAE5' : '#EBF6FF',
                          color: item.sudah_selesai ? '#059669' : '#0284C7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '0.9rem',
                        }}>
                          {item.sudah_selesai ? <i className="bi bi-check-lg" style={{ strokeWidth: 2 }}></i> : idx + 1}
                        </div>

                        {/* Ikon tipe & judul */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                            <i className={`bi ${ikonTipe(item.tipe)}`} style={{ color: '#0284C7', fontSize: '1rem' }}></i>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
                              {item.judul}
                            </span>
                            {item.sudah_selesai && (
                              <span style={{
                                background: '#D1FAE5',
                                color: '#065F46',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                              }}>
                                Selesai
                              </span>
                            )}
                          </div>
                          {item.nama_mapel && (
                            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                              {item.nama_mapel}
                            </span>
                          )}
                        </div>

                        {/* Chevron expand/collapse */}
                        <i className={`bi bi-chevron-${dibuka === item.id ? 'up' : 'down'}`}
                           style={{ color: '#94A3B8', fontSize: '0.95rem', flexShrink: 0 }}></i>
                      </div>

                      {/* Konten ekspanded */}
                      {dibuka === item.id && (
                        <div
                          style={{ marginTop: '1.15rem', paddingTop: '1.15rem', borderTop: '1px solid #F1F5F9' }}
                          onClick={e => e.stopPropagation()} // Cegah collapse saat klik konten
                        >
                          {item.deskripsi && (
                            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                              {item.deskripsi}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Link/file materi */}
                            {getKontenUrl(item) && (
                              <a
                                href={getKontenUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#5CB8FF',
                                  color: '#0F172A',
                                  fontWeight: 800,
                                  fontSize: '0.86rem',
                                  padding: '9px 20px',
                                  borderRadius: '9999px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 14px rgba(92, 184, 255, 0.28)',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#3A9BF0';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#5CB8FF';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <i className={`bi ${ikonTipe(item.tipe)}`}></i>
                                <span>
                                  {item.tipe === 'video' || item.tipe === 'video_link'
                                    ? 'Tonton Video'
                                    : item.tipe === 'link' || item.tipe === 'link_eksternal'
                                      ? 'Buka Link'
                                      : 'Unduh Materi'}
                                </span>
                              </a>
                            )}

                            {/* Tombol tandai selesai */}
                            {!item.sudah_selesai && (
                              <button
                                onClick={() => handleTandaiSelesai(item.id)}
                                disabled={marking === item.id}
                                style={{
                                  background: '#F1F5F9',
                                  color: '#1E293B',
                                  fontWeight: 700,
                                  fontSize: '0.86rem',
                                  padding: '9px 18px',
                                  borderRadius: '9999px',
                                  border: '1px solid #CBD5E1',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#E2E8F0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#F1F5F9';
                                }}
                              >
                                {marking === item.id ? (
                                  <><span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid #94A3B8', borderTopColor: '#0F172A', borderRadius: '50%', display: 'inline-block' }}></span> Menyimpan...</>
                                ) : (
                                  <><i className="bi bi-check-circle"></i> Tandai Selesai Dibaca</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Komponen: Bar Progres Materi ─────────────────────────────
function ProgresBar({ selesai, total }) {
  const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
        <span style={{ fontWeight: 800, color: '#0F172A' }}>Progres Pembelajaran</span>
        <span style={{ color: '#64748B', fontWeight: 600 }}>{selesai} dari {total} materi selesai</span>
      </div>
      <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <div style={{
          height: '100%', width: `${persen}%`,
          background: '#5CB8FF',
          borderRadius: 999,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: '0.78rem', color: '#0284C7', marginTop: 5, fontWeight: 700 }}>
        {persen}% Selesai
      </p>
    </div>
  );
}

export default MateriSiswa;
