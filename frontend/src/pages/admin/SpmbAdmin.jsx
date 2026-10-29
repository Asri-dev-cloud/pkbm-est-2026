// ============================================================
// src/pages/admin/SpmbAdmin.jsx - Verifikasi Pendaftar SPMB
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, SpmbAPI, toAssetUrl } from '../../services/api.js';

function SpmbAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [list, setList] = useState([]);
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const [detail, setDetail] = useState(null);
  const [loadDetail, setLoadDetail] = useState(false);
  const [rombelOptions, setRombelOptions] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [loadingRombel, setLoadingRombel] = useState(false);

  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resList, resStat] = await Promise.all([
          SpmbAPI.getAll({ status: filterStatus || undefined }),
          SpmbAPI.getStatistik(),
        ]);
        setList(resList.data.data || []);
        setStat(resStat.data.data);
      } catch {
        setError('Gagal memuat data SPMB.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [filterStatus]);

  const fetchRombelOptions = async (jenjang) => {
    if (!jenjang) {
      setRombelOptions([]);
      setSelectedRombelId('');
      return;
    }

    setLoadingRombel(true);
    try {
      const res = await SiswaAPI.getRombelOptions({ jenjang });
      setRombelOptions(res.data.data || []);
      setSelectedRombelId('');
    } catch {
      setRombelOptions([]);
      alert('Gagal memuat daftar rombel.');
    } finally {
      setLoadingRombel(false);
    }
  };

  const bukaDetail = async (id) => {
    setLoadDetail(true);
    setDetail(null);
    setCatatan('');
    setRombelOptions([]);
    setSelectedRombelId('');

    try {
      const res = await SpmbAPI.getById(id);
      const detailData = res.data.data;
      setDetail(detailData);

      if (detailData?.jenjang_daftar) {
        await fetchRombelOptions(detailData.jenjang_daftar);
      }
    } catch {
      alert('Gagal memuat detail pendaftar.');
    } finally {
      setLoadDetail(false);
    }
  };

  const handleVerifikasiBerkas = async (berkasId, statusVerifikasi) => {
    try {
      await SpmbAPI.verifikasiBerkas(berkasId, { status_verifikasi: statusVerifikasi });
      if (detail) await bukaDetail(detail.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal verifikasi berkas.');
    }
  };

  const handleKeputusan = async (status) => {
    if (!detail) return;

    if (status === 'diterima' && !selectedRombelId) {
      alert('Pilih rombel terlebih dahulu sebelum menerima pendaftar.');
      return;
    }

    const konfirmasi = window.confirm(
      `${status === 'diterima' ? 'TERIMA' : 'TOLAK'} pendaftaran ${detail.nama_lengkap}?\n\n` +
      (status === 'diterima'
        ? 'Akun dan rombel WB akan dibuat otomatis.'
        : 'Tindakan ini tidak dapat dibatalkan.')
    );
    if (!konfirmasi) return;

    setProcessing(true);
    try {
      const payload = {
        status,
        catatan_verifikasi: catatan.trim() || null,
      };

      if (status === 'diterima') {
        payload.rombel_id = Number(selectedRombelId);
      }

      await SpmbAPI.buatKeputusan(detail.id, payload);

      const [resList, resStat, resDetail] = await Promise.all([
        SpmbAPI.getAll({ status: filterStatus || undefined }),
        SpmbAPI.getStatistik(),
        SpmbAPI.getById(detail.id),
      ]);

      setList(resList.data.data || []);
      setStat(resStat.data.data);
      setDetail(resDetail.data.data);
      setCatatan('');

      alert(
        status === 'diterima'
          ? 'Pendaftar berhasil diterima. Akun WB sudah dibuat.'
          : 'Pendaftar berhasil ditolak.'
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat keputusan.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTanggal = (tanggal) =>
    tanggal
      ? new Date(tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—';

  const labelJenjang = {
    paket_a: 'Paket A',
    paket_b: 'Paket B',
    paket_c: 'Paket C',
  };

  const getBadgeClass = (status) => {
    if (status === 'pending') return 'badge-warning';
    if (status === 'diterima' || status === 'valid') return 'badge-success';
    if (status === 'ditolak' || status === 'tidak_valid') return 'badge-danger';
    return 'badge-neutral';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Verifikasi SPMB
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Tinjau kelengkapan berkas calon siswa, tetapkan rombongan belajar, dan terbitkan akun resmi Warga Belajar.
              </p>
            </div>
          </div>

          {stat && (
            <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
              <div className="admin-stat-card admin-stat-blue">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <span className="admin-stat-tag">TOTAL</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stat.total_pendaftar ?? 0}</div>
                  <div className="admin-stat-label">Total Pendaftar SPMB</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-amber">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <i className="bi bi-hourglass-split"></i>
                  </div>
                  <span className="admin-stat-tag">PENDING</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stat.pending ?? 0}</div>
                  <div className="admin-stat-label">Menunggu Verifikasi</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-green">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <i className="bi bi-patch-check-fill"></i>
                  </div>
                  <span className="admin-stat-tag">LOLOS</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stat.diterima ?? 0}</div>
                  <div className="admin-stat-label">Pendaftar Diterima</div>
                </div>
              </div>

              <div className="admin-stat-card admin-stat-rose">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon-wrap">
                    <i className="bi bi-x-circle-fill"></i>
                  </div>
                  <span className="admin-stat-tag">DITOLAK</span>
                </div>
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{stat.ditolak ?? 0}</div>
                  <div className="admin-stat-label">Pendaftaran Ditolak</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1.3fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap', background: '#FFFFFF', padding: '6px', borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
                {[
                  { val: 'pending', label: 'Menunggu Verifikasi', icon: 'bi-hourglass' },
                  { val: 'diterima', label: 'Diterima', icon: 'bi-check2' },
                  { val: 'ditolak', label: 'Ditolak', icon: 'bi-x' },
                  { val: '', label: 'Semua Data', icon: 'bi-list-ul' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setFilterStatus(item.val);
                      setDetail(null);
                      setLoading(true);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: filterStatus === item.val ? '#1D4ED8' : 'transparent',
                      color: filterStatus === item.val ? '#FFFFFF' : '#64748B',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="loading-container" style={{ padding: '3rem', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: 10, color: '#64748B' }}>Memuat data pendaftar...</p>
                </div>
              )}

              {!loading && error && (
                <div className="alert alert-danger" style={{ margin: 0 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && (
                list.length === 0 ? (
                  <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                    <div className="empty-state">
                      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: '#94A3B8' }}></i>
                      <h3 style={{ color: '#1E293B', marginTop: 10 }}>Tidak Ada Pendaftar</h3>
                      <p style={{ color: '#64748B' }}>Belum ada berkas pendaftar baru dengan status seleksi ini.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {list.map((pendaftar) => {
                      const isSelected = detail?.id === pendaftar.id;
                      return (
                        <div
                          key={pendaftar.id}
                          style={{
                            padding: '1.1rem 1.25rem',
                            cursor: 'pointer',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #1D4ED8' : '1px solid #E2E8F0',
                            boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease-in-out',
                          }}
                          onClick={() => bukaDetail(pendaftar.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                flexShrink: 0,
                                background: isSelected ? '#1D4ED8' : '#F1F5F9',
                                color: isSelected ? '#FFFFFF' : '#1D4ED8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
                              {pendaftar.nama_lengkap?.charAt(0)?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginBottom: 2 }}>
                                {pendaftar.nama_lengkap}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="badge" style={{ background: '#F1F5F9', color: '#334155', fontWeight: 700, padding: '2px 8px' }}>
                                  {labelJenjang[pendaftar.jenjang_daftar] || pendaftar.jenjang_daftar}
                                </span>
                                <span>•</span>
                                <span>{formatTanggal(pendaftar.created_at)}</span>
                              </div>
                            </div>
                            <span className={`badge ${getBadgeClass(pendaftar.status)}`} style={{ textTransform: 'capitalize', fontWeight: 700, padding: '4px 10px' }}>
                              {pendaftar.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {(detail || loadDetail) && (
              <div className="card" style={{ position: 'sticky', top: '1rem', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {loadDetail ? (
                  <div className="loading-container" style={{ padding: '3.5rem' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: 10, color: '#64748B' }}>Memuat detail berkas pendaftar...</p>
                  </div>
                ) : detail && (
                  <>
                    <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                          <i className="bi bi-person-vcard"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{detail.nama_lengkap}</h3>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>ID Registrasi SPMB: #{detail.id}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDetail(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '1.1rem' }}
                        aria-label="Tutup"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {[
                          { label: 'Alamat Email', value: detail.email, icon: 'bi-envelope' },
                          { label: 'Pilihan Jenjang', value: labelJenjang[detail.jenjang_daftar] || detail.jenjang_daftar, icon: 'bi-mortarboard' },
                          { label: 'Tanggal Lahir', value: formatTanggal(detail.tanggal_lahir), icon: 'bi-calendar3' },
                          { label: 'Jenis Kelamin', value: detail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', icon: 'bi-gender-ambiguous' },
                          { label: 'Nama Orang Tua / Wali', value: detail.nama_wali || '—', icon: 'bi-people' },
                          { label: 'Nomor WhatsApp / HP', value: detail.no_telp || '—', icon: 'bi-whatsapp' },
                        ].map((item) => (
                          <div
                            key={item.label}
                            style={{
                              padding: '0.75rem 0.875rem',
                              background: '#F8FAFC',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                              <i className={`bi ${item.icon}`} style={{ marginRight: 4 }}></i>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{item.value || '—'}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.75rem' }}>
                          <i className="bi bi-paperclip" style={{ color: '#1D4ED8' }}></i>
                          <span>Berkas Persyaratan Dokumen</span>
                        </div>
                        {!detail.berkas || detail.berkas.length === 0 ? (
                          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                            Belum ada berkas pendukung yang diunggah.
                          </div>
                        ) : (
                          detail.berkas.map((berkas) => {
                            const statusBerkas = berkas.status_verifikasi;
                            return (
                              <div
                                key={berkas.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '0.625rem 0.875rem',
                                  marginBottom: 8,
                                  background:
                                    statusBerkas === 'valid'
                                      ? '#F0FDF4'
                                      : statusBerkas === 'tidak_valid'
                                        ? '#FEF2F2'
                                        : '#F8FAFC',
                                  border: `1px solid ${
                                    statusBerkas === 'valid'
                                      ? '#BBF7D0'
                                      : statusBerkas === 'tidak_valid'
                                        ? '#FECACA'
                                        : '#E2E8F0'
                                  }`,
                                  borderRadius: '8px',
                                }}
                              >
                                <i className="bi bi-file-earmark-text" style={{ color: '#1D4ED8', fontSize: '1.2rem' }}></i>
                                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>
                                  {berkas.jenis_berkas?.replace('_', ' ') || 'Berkas'}
                                </span>

                                {berkas.path_file && (
                                  <a
                                    href={toAssetUrl(berkas.path_file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}
                                  >
                                    <i className="bi bi-eye"></i> Tinjau
                                  </a>
                                )}

                                {detail.status === 'pending' && statusBerkas !== 'valid' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, color: '#16A34A', borderColor: '#BBF7D0', background: '#F0FDF4' }}
                                    onClick={() => handleVerifikasiBerkas(berkas.id, 'valid')}
                                  >
                                    <i className="bi bi-check2"></i> Sah
                                  </button>
                                )}

                                {detail.status === 'pending' && statusBerkas !== 'tidak_valid' && (
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                                    onClick={() => handleVerifikasiBerkas(berkas.id, 'tidak_valid')}
                                  >
                                    <i className="bi bi-x"></i> Tolak
                                  </button>
                                )}

                                {statusBerkas && (
                                  <span className={`badge ${getBadgeClass(statusBerkas)}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                                    {statusBerkas}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {detail.status === 'pending' && (
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.75rem' }}>
                            <i className="bi bi-check2-circle" style={{ color: '#1D4ED8' }}></i>
                            <span>Tetapkan Rombel & Buat Keputusan</span>
                          </div>

                          <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>
                              Penempatan Rombongan Belajar (Wajib untuk status Terima) <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <select
                              className="form-input"
                              value={selectedRombelId}
                              onChange={(e) => setSelectedRombelId(e.target.value)}
                              disabled={loadingRombel || processing}
                              style={{ cursor: 'pointer', height: 40, border: '1.5px solid #CBD5E1', borderRadius: 8, fontWeight: 600 }}
                            >
                              <option value="">
                                {loadingRombel ? 'Memuat rombel...' : '-- Pilih Rombel untuk Pendaftar Ini --'}
                              </option>
                              {rombelOptions.map((rombel) => (
                                <option key={rombel.id} value={rombel.id}>
                                  {rombel.nama_rombel}
                                </option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            className="form-input"
                            placeholder="Tuliskan catatan verifikasi (opsional, dapat dibaca siswa)…"
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={2}
                            style={{ marginBottom: '1rem', resize: 'vertical', fontSize: '0.85rem' }}
                          />

                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flex: 1, height: 42, background: '#16A34A', border: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              onClick={() => handleKeputusan('diterima')}
                              disabled={processing || loadingRombel}
                            >
                              {processing ? <span className="spinner-sm"></span> : <i className="bi bi-check-circle-fill"></i>}
                              <span>Terima Pendaftar</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ flex: 1, height: 42, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              onClick={() => handleKeputusan('ditolak')}
                              disabled={processing}
                            >
                              {processing ? <span className="spinner-sm"></span> : <i className="bi bi-x-circle-fill"></i>}
                              <span>Tolak Pendaftar</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {detail.status !== 'pending' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div className={`alert alert-${detail.status === 'diterima' ? 'success' : 'danger'}`}>
                            <i className={`bi ${detail.status === 'diterima' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                            <div>
                              <strong>Pendaftaran Resmi {detail.status === 'diterima' ? 'Diterima' : 'Ditolak'}</strong>
                              {detail.catatan_verifikasi && (
                                <p style={{ margin: '4px 0 0', fontSize: '0.825rem' }}>
                                  Catatan Panitia: {detail.catatan_verifikasi}
                                </p>
                              )}
                            </div>
                          </div>

                          {detail.status === 'diterima' && (
                            <div style={{ marginTop: '0.875rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                                Status Akun Warga Belajar
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                                  {detail.warga_belajar_id ? '✅ Terhubung ke Data Warga Belajar' : '⚠️ Belum Tersinkronkan ke DB Siswa'}
                                </span>
                                {detail.nis && (
                                  <span className="badge badge-primary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                    NIS: {detail.nis}
                                  </span>
                                )}
                              </div>

                              {!detail.warga_belajar_id ? (
                                <div>
                                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: 8 }}>
                                    Pendaftar ini diterima tetapi profil Warga Belajar belum terbit. Tetapkan rombel dan sinkronkan sekarang:
                                  </p>
                                  <select
                                    className="form-input"
                                    value={selectedRombelId}
                                    onChange={(e) => setSelectedRombelId(e.target.value)}
                                    style={{ marginBottom: 8, fontSize: '0.85rem' }}
                                  >
                                    <option value="">Pilih rombel untuk pendaftar ini...</option>
                                    {rombelOptions.map((rombel) => (
                                      <option key={rombel.id} value={rombel.id}>
                                        {rombel.nama_rombel}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ width: '100%', background: '#16A34A', fontSize: '0.85rem', fontWeight: 700 }}
                                    onClick={() => handleKeputusan('diterima')}
                                    disabled={processing}
                                  >
                                    {processing ? <span className="spinner-sm"></span> : <i className="bi bi-arrow-repeat"></i>}
                                    <span>Sinkronkan Akun Warga Belajar Sekarang</span>
                                  </button>
                                </div>
                              ) : (
                                <Link
                                  to="/admin/siswa"
                                  className="btn btn-secondary"
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700 }}
                                >
                                  <i className="bi bi-people-fill"></i>
                                  <span>Buka di Halaman Data Siswa</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SpmbAdmin;
