// ============================================================
// src/pages/siswa/RuangBelajarSiswa.jsx — Ruang Belajar (Pilih Mapel)
// ============================================================
// Halaman utama Level 1: Warga Belajar atau Tutor/Admin memilih
// mata pelajaran untuk masuk ke ruang kelas terpadu (LMS-Style).
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI } from '../../services/api.js';

function RuangBelajarSiswa() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [mapels, setMapels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── States khusus Tutor / Admin ─────────────────────────────
  const [rombelList, setRombelList] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState('');

  const isStudent = user?.role === 'warga_belajar';

  // ── 1. Mengambil Rombel / Profil Awal ──────────────────────
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        setError('');

        if (isStudent) {
          // Alur Siswa: Ambil profil dan rombel aktif
          const profilRes = await SiswaAPI.getProfilSaya();
          const profil = profilRes.data.data;
          const rombelId = profil?.rombel_id;

          if (!rombelId) {
            setError('Data rombel Anda belum tersedia. Hubungi Admin TU untuk penempatan rombel.');
            setMapels([]);
            return;
          }

          // Update localStorage user state jika ada update rombel
          const nextUser = {
            ...user,
            rombel_id: rombelId,
            nama_rombel: profil.nama_rombel || null,
            nis: profil.nis || user.nis || null,
            jenjang: profil.jenjang
          };
          setUser(nextUser);
          localStorage.setItem('pkbm_user', JSON.stringify(nextUser));

          // Ambil mata pelajaran aktif untuk Rombel tersebut
          const mapelRes = await SiswaAPI.getMapelOptions({ rombel_id: rombelId });
          setMapels(mapelRes.data.data || []);
        } else {
          // Alur Tutor / Admin: Ambil daftar rombel
          const rombelRes = await SiswaAPI.getRombelOptions();
          const rombels = rombelRes.data.data || [];
          setRombelList(rombels);

          if (rombels.length > 0) {
            setSelectedRombelId(String(rombels[0].id));
          } else {
            setError('Belum ada rombongan belajar (rombel) aktif di sistem.');
          }
        }
      } catch (err) {
        console.error('[RuangBelajarSiswa.initData] Error:', err);
        setError(err.response?.data?.message || 'Gagal menginisialisasi halaman Ruang Belajar.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isStudent]);

  // ── 2. Mengambil Mata Pelajaran untuk Tutor / Admin ──────────
  useEffect(() => {
    if (isStudent) return;
    if (!selectedRombelId) {
      setMapels([]);
      return;
    }

    const fetchMapelForTutor = async () => {
      try {
        setLoading(true);
        setError('');
        const mapelRes = await SiswaAPI.getMapelOptions({ rombel_id: selectedRombelId });
        setMapels(mapelRes.data.data || []);
      } catch (err) {
        console.error('[RuangBelajarSiswa.fetchMapelForTutor] Error:', err);
        setError(err.response?.data?.message || 'Gagal memuat mata pelajaran untuk rombel terpilih.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapelForTutor();
  }, [selectedRombelId, isStudent]);

  const handleMasukKelas = (mapelId) => {
    const rombelId = isStudent ? user.rombel_id : selectedRombelId;
    const targetUrl = `/dashboard/siswa/kelas/${mapelId}?rombel_id=${rombelId}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // ── Warna Gradien Estetik per Card ──────────────────────────
  const gradients = [
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', // Blue
    'linear-gradient(135deg, #10B981 0%, #047857 100%)', // Emerald
    'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)', // Purple
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', // Pink
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber
    'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', // Cyan
  ];

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '2rem' }}>
          
          {/* Header Section */}
          <div style={{
            marginBottom: '2.5rem',
            paddingTop: '3.75rem'
          }}>
            <h1 style={{ 
              fontFamily: 'var(--font-heading, "Outfit", sans-serif)', 
              fontSize: '2.25rem', 
              fontWeight: 800,
              color: '#1E293B'
            }}>
              Ruang Belajar Terpadu
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: '1rem' }}>
              Silakan pilih mata pelajaran di bawah untuk memasuki ruang kelas, mengakses materi, absensi, dan mengumpulkan tugas.
            </p>
          </div>

          {/* Selector Rombel (Khusus Tutor / Admin / Super Admin) */}
          {!isStudent && rombelList.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem 1.5rem',
              border: '1px solid #E2E8F0',
              marginBottom: '2rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              maxWidth: '500px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                <i className="bi bi-collection-fill"></i>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pilih Rombongan Belajar
                </label>
                <select
                  value={selectedRombelId}
                  onChange={(e) => setSelectedRombelId(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    outline: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {rombelList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nama_rombel || r.nama || r.jenjang?.replace('_', ' ')?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(59, 130, 246, 0.1)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Memuat mata pelajaran kelas...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="alert alert-danger" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '1rem', 
              background: '#FEE2E2', 
              color: '#991B1B', 
              borderRadius: '12px',
              border: '1px solid #FCA5A5'
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.25rem' }}></i>
              <span>{error}</span>
            </div>
          )}

          {/* Mapel Cards Grid */}
          {!loading && !error && (
            <>
              {mapels.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: '16px' }}>
                  <div className="empty-state">
                    <i className="bi bi-folder-x" style={{ fontSize: '4rem', color: '#CBD5E1' }}></i>
                    <h3 style={{ marginTop: '1.5rem', fontWeight: 700, fontSize: '1.25rem' }}>Belum Ada Kelas Aktif</h3>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
                      {isStudent 
                        ? 'Tutor Anda belum mendaftarkan mata pelajaran aktif untuk rombel Anda saat ini.'
                        : 'Belum ada mata pelajaran aktif yang didaftarkan untuk rombel terpilih.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem',
                  marginTop: '1rem'
                }}>
                  {mapels.map((item, index) => {
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleMasukKelas(item.id)}
                        style={{
                          background: 'white',
                          borderRadius: '18px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '380px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.03)';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)';
                          e.currentTarget.style.borderColor = '#E2E8F0';
                        }}
                      >
                        {/* Top Header Row */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem 1.5rem 0.5rem 1.5rem',
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {item.kode || 'MAPEL'}
                          </span>
                          <i className="bi bi-book" style={{ fontSize: '1.1rem', color: '#94A3B8' }}></i>
                        </div>

                        {/* Card Subject Name */}
                        <div style={{
                          padding: '0 1.5rem',
                          flexShrink: 0
                        }}>
                          <h3 style={{
                            fontWeight: 800,
                            fontSize: '1.3rem',
                            color: '#1E293B',
                            lineHeight: 1.3,
                            margin: '0 0 14px 0',
                            fontFamily: 'var(--font-heading, "Outfit", sans-serif)'
                          }}>
                            {item.nama}
                          </h3>
                        </div>

                        {/* Card Info List */}
                        <div style={{
                          padding: '0 1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          color: '#475569',
                          fontSize: '0.85rem',
                          flex: 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="bi bi-person" style={{ color: '#94A3B8', fontSize: '1.05rem', width: '18px' }}></i>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
                              {item.nama_tutor || 'Tutor Kelas'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="bi bi-calendar-event" style={{ color: '#94A3B8', fontSize: '1rem', width: '18px' }}></i>
                            <span>Jadwal: Sesuai Sesi Pertemuan</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="bi bi-geo-alt" style={{ color: '#94A3B8', fontSize: '1rem', width: '18px' }}></i>
                            <span>Metode: Hybrid / Blended Class</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="bi bi-layers" style={{ color: '#94A3B8', fontSize: '1rem', width: '18px' }}></i>
                            <span>Tingkat: {item.jenjang === 'semua' ? 'Semua Jenjang Paket' : item.jenjang?.replace('_', ' ')?.toUpperCase()}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="bi bi-award" style={{ color: '#94A3B8', fontSize: '1rem', width: '18px' }}></i>
                            <span>Kurikulum Terintegrasi PKBM</span>
                          </div>
                        </div>

                        {/* Footer Button: Colored Uniformly */}
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          marginTop: 'auto',
                          flexShrink: 0
                        }}>
                          <button
                            style={{
                              width: '100%',
                              background: '#0284c7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '12px 16px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.15)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#0369a1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#0284c7';
                            }}
                          >
                            <i className="bi bi-door-open-fill" style={{ fontSize: '1rem' }}></i>
                            <span>Masuk Kelas</span>
                            <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Basic spin keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RuangBelajarSiswa;
