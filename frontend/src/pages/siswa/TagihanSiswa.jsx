// ============================================================
// src/pages/siswa/TagihanSiswa.jsx — Tagihan & Status Bayar WB
// ============================================================
// WB melihat tagihan SPP/modul miliknya dan riwayat pembayaran.
//
// API:
//   GET /api/tagihan  → daftar tagihan (backend filter by token WB)
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { TagihanAPI } from '../../services/api.js';

function TagihanSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  // Filter tab: 'semua' | 'belum_lunas' | 'lunas'
  const [filter, setFilter] = useState('semua');

  useEffect(() => {
    const fetchTagihan = async () => {
      try {
        const res = await TagihanAPI.getAll();
        setTagihan(res.data.data || []);
      } catch {
        setError('Gagal memuat data tagihan.');
      } finally {
        setLoading(false);
      }
    };
    fetchTagihan();
  }, []);

  // Hitung ringkasan keuangan
  const totalBelumLunas = tagihan
    .filter(t => t.status !== 'lunas')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  // Filter tagihan berdasarkan tab
  const tagihanTampil = tagihan.filter(t => {
    if (filter === 'belum_lunas') return t.status !== 'lunas';
    if (filter === 'lunas')       return t.status === 'lunas';
    return true;
  });

  const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const warnaBadge = (status) => {
    if (status === 'lunas')   return 'badge-success';
    if (status === 'proses')  return 'badge-info';
    return 'badge-danger';
  };

  const labelStatus = (status) => {
    if (status === 'lunas')   return 'Lunas';
    if (status === 'proses')  return 'Sedang Diverifikasi';
    return 'Belum Dibayar';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content" style={{ padding: '2rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '10px' }}>
              <span className="boutique-pill boutique-badge-blue">
                <i className="bi bi-wallet2" style={{ fontSize: '0.85rem' }}></i>
                KEUANGAN & ADMINISTRASI SISWA
              </span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '2.1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Tagihan & Iuran Belajar
            </h1>
            <p style={{ color: '#64748B', marginTop: 8, fontSize: '0.94rem', maxWidth: '680px' }}>
              Riwayat tagihan SPP pendidikan, modul pembelajaran, dan administrasi resmi PKBM Bina Mandiri.
            </p>
          </div>

          {loading && <div className="loading-container"><div className="spinner"></div></div>}
          {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          {!loading && !error && (
            <>
              {/* Banner tunggakan jika ada */}
              {totalBelumLunas > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1.5rem', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '16px', padding: '1rem 1.25rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.25rem', color: '#D97706' }}></i>
                  <div>
                    <strong>Terdapat tagihan yang belum dibayar</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
                      Total tunggakan saat ini: <strong style={{ color: '#B45309' }}>{formatRupiah(totalBelumLunas)}</strong>.
                      Segera lakukan pembayaran untuk kelancaran administrasi pembelajaran.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab filter Berwarna */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilter('semua')}
                  style={{
                    padding: '8px 18px', borderRadius: '9999px',
                    border: '1.5px solid ' + (filter === 'semua' ? '#0F172A' : '#E2E8F0'),
                    background: filter === 'semua' ? '#0F172A' : '#F8FAFC',
                    color: filter === 'semua' ? '#FFFFFF' : '#334155',
                    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: filter === 'semua' ? '0 4px 14px rgba(15, 23, 42, 0.3)' : 'none'
                  }}
                >
                  Semua ({tagihan.length})
                </button>

                {/* Belum Lunas: MERAH */}
                <button
                  type="button"
                  onClick={() => setFilter('belum_lunas')}
                  style={{
                    padding: '8px 18px', borderRadius: '9999px',
                    border: '1.5px solid ' + (filter === 'belum_lunas' ? '#DC2626' : '#FECACA'),
                    background: filter === 'belum_lunas' ? '#EF4444' : '#FEF2F2',
                    color: filter === 'belum_lunas' ? '#FFFFFF' : '#DC2626',
                    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: filter === 'belum_lunas' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                >
                  Belum Lunas ({tagihan.filter(t => t.status !== 'lunas').length})
                </button>

                {/* Lunas: HIJAU */}
                <button
                  type="button"
                  onClick={() => setFilter('lunas')}
                  style={{
                    padding: '8px 18px', borderRadius: '9999px',
                    border: '1.5px solid ' + (filter === 'lunas' ? '#059669' : '#BBF7D0'),
                    background: filter === 'lunas' ? '#10B981' : '#F0FDF4',
                    color: filter === 'lunas' ? '#FFFFFF' : '#15803D',
                    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: filter === 'lunas' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  Lunas ({tagihan.filter(t => t.status === 'lunas').length})
                </button>
              </div>

              {/* Daftar tagihan */}
              {tagihanTampil.length === 0 ? (
                <div className="card"><div className="empty-state">
                  <i className="bi bi-receipt"></i>
                  <h3>Tidak Ada Tagihan</h3>
                  <p>Tidak ada tagihan untuk filter yang dipilih.</p>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {tagihanTampil.map(t => {
                    const isLunas = t.status === 'lunas';
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '1.35rem 1.6rem',
                          borderRadius: '20px',
                          background: isLunas ? 'linear-gradient(145deg, #FFFFFF 0%, #F0FDF4 100%)' : 'linear-gradient(145deg, #FFFFFF 0%, #FEF2F2 100%)',
                          border: `1.5px solid ${isLunas ? '#BBF7D0' : '#FECACA'}`,
                          boxShadow: `0 4px 18px ${isLunas ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'}`,
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Status bar stripe kiri */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 6,
                          background: isLunas ? '#10B981' : '#EF4444'
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          {/* Ikon status */}
                          <div style={{
                            width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
                            background: isLunas ? '#DCFCE7' : '#FEE2E2',
                            color: isLunas ? '#15803D' : '#DC2626',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                          }}>
                            <i className={`bi ${isLunas ? 'bi-check-circle-fill' : 'bi-receipt'}`}></i>
                          </div>

                          {/* Info tagihan */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0F172A' }}>
                                {t.jenis === 'spp' ? 'SPP' : t.jenis === 'modul' ? 'Biaya Modul' : t.jenis}
                                {t.bulan && ` — ${namaBulan(t.bulan)} ${t.tahun}`}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                  background: isLunas ? '#DCFCE7' : '#FEE2E2',
                                  color: isLunas ? '#15803D' : '#B91C1C',
                                  border: `1px solid ${isLunas ? '#BBF7D0' : '#FECACA'}`
                                }}
                              >
                                {labelStatus(t.status)}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                              Diterbitkan: {t.tanggal_terbit ? new Date(t.tanggal_terbit).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '—'}
                              {t.tanggal_jatuh_tempo && ` • Jatuh tempo: ${new Date(t.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`}
                            </p>
                          </div>

                          {/* Jumlah */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 900, fontSize: '1.25rem',
                              color: isLunas ? '#15803D' : '#DC2626',
                            }}>
                              {formatRupiah(t.jumlah)}
                            </div>
                          </div>
                        </div>

                        {/* Catatan pembayaran */}
                        {!isLunas && (
                          <div style={{
                            marginTop: '0.85rem', paddingTop: '0.85rem',
                            borderTop: '1px solid #FECACA',
                            fontSize: '0.78rem', color: '#991B1B', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}>
                            <i className="bi bi-info-circle-fill"></i>
                            Lakukan pembayaran ke Admin TU PKBM Bina Mandiri dan simpan bukti transfer Anda.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper: nomor bulan → nama bulan
function namaBulan(nomor) {
  const list = ['', 'Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  return list[nomor] || nomor;
}

export default TagihanSiswa;
