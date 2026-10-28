// ============================================================
// src/pages/siswa/KlubSiswa.jsx — Katalog & Pendaftaran Klub
// ============================================================
// WB melihat semua klub lintas jenjang dan bisa daftar/keluar.
//
// API:
//   GET    /api/klub         → katalog semua klub
//   GET    /api/klub/saya    → klub yang diikuti WB
//   POST   /api/klub/:id/daftar  → daftar masuk klub
//   DELETE /api/klub/:id/keluar  → keluar dari klub
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { KlubAPI } from '../../services/api.js';

function KlubSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [semuaKlub, setSemuaKlub] = useState([]);
  const [klubSaya,  setKlubSaya]  = useState(new Set()); // Set of id klub yang diikuti
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  // ID klub yang sedang diproses (daftar/keluar) — untuk disable tombol
  const [processing, setProcessing] = useState(null);
  // Tab aktif: 'semua' | 'saya'
  const [tab, setTab] = useState('semua');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAll, resSaya] = await Promise.all([
          KlubAPI.getAll(),
          KlubAPI.getKlubSaya(),
        ]);
        setSemuaKlub(resAll.data.data || []);
        // Buat Set berisi ID klub yang sudah diikuti WB untuk lookup O(1)
        const idKlubSaya = new Set((resSaya.data.data || []).map(k => k.id));
        setKlubSaya(idKlubSaya);
      } catch {
        setError('Gagal memuat data klub.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDaftar = async (klubId) => {
    setProcessing(klubId);
    try {
      await KlubAPI.daftar(klubId);
      setKlubSaya(prev => new Set([...prev, klubId]));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftar klub.');
    } finally {
      setProcessing(null);
    }
  };

  const handleKeluar = async (klubId) => {
    if (!window.confirm('Yakin ingin keluar dari klub ini?')) return;
    setProcessing(klubId);
    try {
      await KlubAPI.keluar(klubId);
      setKlubSaya(prev => { const s = new Set(prev); s.delete(klubId); return s; });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal keluar dari klub.');
    } finally {
      setProcessing(null);
    }
  };

  // Klub yang ditampilkan berdasarkan tab
  const tampilKlub = tab === 'saya'
    ? semuaKlub.filter(k => klubSaya.has(k.id))
    : semuaKlub;

  // Warna ikon per jenis klub
  const warnaKlub = (jenis) => {
    const m = {
      seni:       { bg: '#FCE7F3', color: '#BE185D' },
      olahraga:   { bg: '#DBEAFE', color: '#1D4ED8' },
      teknologi:  { bg: '#EDE9FE', color: '#6D28D9' },
      bahasa:     { bg: '#D1FAE5', color: '#065F46' },
      sains:      { bg: '#FEF3C7', color: '#92400E' },
    };
    return m[jenis] || { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' };
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '2rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '10px' }}>
              <span className="boutique-pill boutique-badge-blue">
                <i className="bi bi-trophy-fill" style={{ fontSize: '0.85rem' }}></i>
                KOMUNITAS MINAT & BAKAT
              </span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Klub Minat Bakat & Ekstrakurikuler
            </h1>
            <p style={{ color: '#64748B', marginTop: 8, fontSize: '0.94rem', maxWidth: '680px' }}>
              Ikuti komunitas klub ekstrakurikuler yang sesuai dengan minat dan bakat Anda — terbuka lintas jenjang untuk mengasah soft-skills!
            </p>
          </div>

          {/* Tab: Semua Klub / Klub Saya */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '2rem', background: '#F1F5F9', padding: '6px', borderRadius: '9999px', width: 'fit-content', border: '1px solid #E2E8F0' }}>
            {['semua', 'saya'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 20px', borderRadius: '9999px', border: 'none',
                  background: tab === t ? '#1D4ED8' : 'transparent',
                  color: tab === t ? '#FFFFFF' : '#64748B',
                  fontWeight: tab === t ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: tab === t ? '0 4px 14px rgba(29, 78, 216, 0.3)' : 'none'
                }}
              >
                {t === 'semua' ? `Semua Klub (${semuaKlub.length})` : `Klub Saya (${klubSaya.size})`}
              </button>
            ))}
          </div>

          {loading && <div className="loading-container"><div className="spinner"></div><p>Memuat klub...</p></div>}
          {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          {!loading && !error && (
            tampilKlub.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '3rem 2rem', textAlign: 'center' }}>
                <div className="empty-state">
                  <i className="bi bi-people" style={{ fontSize: '3rem', color: '#CBD5E1' }}></i>
                  <h3 style={{ marginTop: '1rem', fontWeight: 800 }}>{tab === 'saya' ? 'Belum Ikuti Klub' : 'Belum Ada Klub'}</h3>
                  <p style={{ color: '#64748B' }}>{tab === 'saya' ? 'Anda belum mengikuti klub apapun. Jelajahi tab "Semua Klub".' : 'Admin belum membuat klub.'}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {tampilKlub.map(klub => {
                  const warna   = warnaKlub(klub.jenis);
                  const diikuti = klubSaya.has(klub.id);
                  const isProc  = processing === klub.id;

                  return (
                    <div
                      key={klub.id}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        border: '1px solid #E2E8F0',
                        padding: '1.5rem',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(92, 184, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(92, 184, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.02)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          {/* Ikon klub */}
                          <div style={{
                            width: 52, height: 52, borderRadius: '16px', flexShrink: 0,
                            background: warna.bg, color: warna.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                          }}>
                            <i className="bi bi-people-fill"></i>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', fontFamily: 'var(--font-heading, "Outfit", sans-serif)' }}>{klub.nama_klub}</span>
                              {diikuti && (
                                <span style={{
                                  background: '#D1FAE5',
                                  color: '#065F46',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  <i className="bi bi-check-circle-fill"></i> Diikuti
                                </span>
                              )}
                            </div>
                            {klub.deskripsi && (
                              <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: 10, lineHeight: 1.6 }}>
                                {klub.deskripsi}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                              {klub.jumlah_anggota != null && (
                                <span><i className="bi bi-people"></i> {klub.jumlah_anggota} anggota</span>
                              )}
                              {klub.jadwal && (
                                <span><i className="bi bi-calendar-week"></i> {klub.jadwal}</span>
                              )}
                              {klub.tutor_nama && (
                                <span><i className="bi bi-person-badge"></i> {klub.tutor_nama}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tombol aksi */}
                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                        {diikuti ? (
                          <button
                            style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              padding: '8px 20px',
                              borderRadius: '9999px',
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleKeluar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? <><span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid rgba(153,27,27,0.2)', borderTopColor: '#991B1B', borderRadius: '50%', display: 'inline-block' }}></span> Memproses...</> : <><i className="bi bi-box-arrow-right"></i> Keluar Klub</>}
                          </button>
                        ) : (
                          <button
                            style={{
                              background: '#5CB8FF',
                              color: '#0F172A',
                              border: 'none',
                              padding: '9px 24px',
                              borderRadius: '9999px',
                              fontSize: '0.86rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
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
                            onClick={() => handleDaftar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? <><span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid rgba(15,23,42,0.2)', borderTopColor: '#0F172A', borderRadius: '50%', display: 'inline-block' }}></span> Mendaftar...</> : <><i className="bi bi-plus-circle"></i> Gabung Klub</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default KlubSiswa;
