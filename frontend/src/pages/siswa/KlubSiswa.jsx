// ============================================================
// src/pages/siswa/KlubSiswa.jsx — Katalog & Pendaftaran Klub
// ============================================================
// WB melihat semua klub lintas jenjang dan bisa daftar/keluar.
// Tampilan mobile-first, rapi, bersih, dan selaras tema biru PKBM.
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { KlubAPI } from '../../services/api.js';
import './KlubSiswa.css';

function KlubSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [semuaKlub, setSemuaKlub] = useState([]);
  const [klubSaya, setKlubSaya] = useState(new Set()); // Set of id klub yang diikuti
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState('semua');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAll, resSaya] = await Promise.all([
          KlubAPI.getAll(),
          KlubAPI.getKlubSaya(),
        ]);
        setSemuaKlub(resAll.data.data || []);
        const idKlubSaya = new Set((resSaya.data.data || []).map(k => k.id));
        setKlubSaya(idKlubSaya);
      } catch {
        setError('Gagal memuat data klub minat bakat.');
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
    if (!window.confirm('Apakah Anda yakin ingin keluar dari klub ini?')) return;
    setProcessing(klubId);
    try {
      await KlubAPI.keluar(klubId);
      setKlubSaya(prev => {
        const s = new Set(prev);
        s.delete(klubId);
        return s;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal keluar dari klub.');
    } finally {
      setProcessing(null);
    }
  };

  const tampilKlub = tab === 'saya'
    ? semuaKlub.filter(k => klubSaya.has(k.id))
    : semuaKlub;

  // Warna dan ikon spesifik per kategori klub
  const getKlubVisual = (jenis) => {
    const j = String(jenis || '').toLowerCase();
    const config = {
      seni: {
        bg: '#FDF2F8',
        color: '#BE185D',
        icon: 'bi-palette-fill',
        label: 'Seni & Budaya'
      },
      olahraga: {
        bg: '#EFF6FF',
        color: '#1D4ED8',
        icon: 'bi-trophy-fill',
        label: 'Olahraga'
      },
      teknologi: {
        bg: '#EDE9FE',
        color: '#6D28D9',
        icon: 'bi-cpu-fill',
        label: 'Teknologi'
      },
      bahasa: {
        bg: '#ECFDF5',
        color: '#047857',
        icon: 'bi-translate',
        label: 'Bahasa Asing'
      },
      sains: {
        bg: '#FEF3C7',
        color: '#B45309',
        icon: 'bi-lightbulb-fill',
        label: 'Sains & Riset'
      },
    };
    return config[j] || {
      bg: '#EFF6FF',
      color: '#2563EB',
      icon: 'bi-stars',
      label: jenis || 'Minat Bakat'
    };
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="klub-page-container">

          {/* ── 1. Hero / Header ── */}
          <div className="klub-hero-header">
            <div className="klub-hero-pill">
              <i className="bi bi-stars"></i>
              <span>Ekstrakurikuler PKBM</span>
            </div>
            <h1 className="klub-hero-title">
              Klub Minat Bakat & Ekstrakurikuler
            </h1>
            <p className="klub-hero-desc">
              Ikuti komunitas klub ekstrakurikuler yang sesuai dengan minat dan bakat Anda — terbuka lintas jenjang untuk mengasah soft-skills!
            </p>
          </div>

          {/* ── 2. Tab Filter (Semua Klub / Klub Saya) ── */}
          <div className="klub-tabs-container">
            <button
              type="button"
              className={`klub-tab-btn ${tab === 'semua' ? 'active' : ''}`}
              onClick={() => setTab('semua')}
            >
              <span>Semua Klub</span>
              <span className="klub-tab-count">{semuaKlub.length}</span>
            </button>
            <button
              type="button"
              className={`klub-tab-btn ${tab === 'saya' ? 'active' : ''}`}
              onClick={() => setTab('saya')}
            >
              <span>Klub Saya</span>
              <span className="klub-tab-count">{klubSaya.size}</span>
            </button>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Memuat daftar klub...</p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger" style={{ borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            tampilKlub.length === 0 ? (
              <div className="klub-empty-state">
                <div className="klub-empty-icon">
                  <i className="bi bi-people"></i>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {tab === 'saya' ? 'Belum Ada Klub Diikuti' : 'Belum Ada Klub Tersedia'}
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0, maxWidth: 420, marginInline: 'auto' }}>
                  {tab === 'saya'
                    ? 'Anda belum mendaftar di klub manapun. Silakan jelajahi tab "Semua Klub" untuk memilih kegiatan yang Anda minati.'
                    : 'Klub minat bakat sedang disiapkan oleh pembina dan admin.'}
                </p>
              </div>
            ) : (
              <div className="klub-grid">
                {tampilKlub.map(klub => {
                  const visual = getKlubVisual(klub.jenis);
                  const diikuti = klubSaya.has(klub.id);
                  const isProc = processing === klub.id;

                  return (
                    <div key={klub.id} className="klub-card">
                      <div>
                        <div className="klub-card-header">
                          {/* Ikon klub spesifik kategori */}
                          <div
                            className="klub-icon-box"
                            style={{ background: visual.bg, color: visual.color }}
                          >
                            <i className={`bi ${visual.icon}`}></i>
                          </div>

                          <div className="klub-info-box">
                            <div className="klub-header-topline">
                              <h3 className="klub-nama">{klub.nama_klub}</h3>
                              {diikuti && (
                                <span className="klub-badge-diikuti">
                                  <i className="bi bi-check-circle-fill"></i> Terdaftar
                                </span>
                              )}
                            </div>

                            <span
                              className="klub-badge-kategori"
                              style={{ background: visual.bg, color: visual.color }}
                            >
                              <i className={`bi ${visual.icon}`}></i>
                              <span>{visual.label}</span>
                            </span>

                            {klub.deskripsi && (
                              <p className="klub-deskripsi">
                                {klub.deskripsi}
                              </p>
                            )}

                            <div className="klub-meta-chips">
                              {klub.jumlah_anggota != null && (
                                <span className="klub-chip">
                                  <i className="bi bi-people-fill"></i>
                                  <span>{klub.jumlah_anggota} Anggota</span>
                                </span>
                              )}
                              {klub.kapasitas && (
                                <span className="klub-chip">
                                  <i className="bi bi-person-check-fill"></i>
                                  <span>Maks {klub.kapasitas}</span>
                                </span>
                              )}
                              {klub.tutor_nama && (
                                <span className="klub-chip">
                                  <i className="bi bi-person-badge-fill"></i>
                                  <span>{klub.tutor_nama}</span>
                                </span>
                              )}
                              {klub.jadwal && (
                                <span className="klub-chip">
                                  <i className="bi bi-calendar3"></i>
                                  <span>{klub.jadwal}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tombol aksi mobile-friendly */}
                      <div className="klub-card-footer">
                        <div className="klub-status-note">
                          {diikuti ? (
                            <span style={{ color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <i className="bi bi-shield-check"></i> Anggota Aktif
                            </span>
                          ) : (
                            <span>Terbuka semua jenjang</span>
                          )}
                        </div>

                        {diikuti ? (
                          <button
                            type="button"
                            className="klub-btn-action leave"
                            onClick={() => handleKeluar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? (
                              <>
                                <span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid rgba(220,38,38,0.2)', borderTopColor: '#DC2626', borderRadius: '50%', display: 'inline-block' }}></span>
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-box-arrow-right"></i>
                                <span>Keluar Klub</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="klub-btn-action join"
                            onClick={() => handleDaftar(klub.id)}
                            disabled={isProc}
                          >
                            {isProc ? (
                              <>
                                <span className="spinner-sm" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block' }}></span>
                                <span>Mendaftar...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-plus-circle-fill"></i>
                                <span>Gabung Klub</span>
                              </>
                            )}
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
