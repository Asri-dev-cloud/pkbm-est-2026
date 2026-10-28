import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { UjianAPI } from '../../services/api.js';

function PesertaUjianAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');
  const [periodeList, setPeriodeList] = useState([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
  const [pesertaList, setPesertaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailPeserta, setDetailPeserta] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterPembayaran, setFilterPembayaran] = useState('');
  const [filterKelayakan, setFilterKelayakan] = useState('');

  const loadPeriode = async () => {
    try {
      const res = await UjianAPI.getAllPeriode();
      const data = res.data.data || [];
      setPeriodeList(data);
      if (!selectedPeriodeId && data.length > 0) {
        const active = data.find((item) => Number(item.is_active) === 1);
        setSelectedPeriodeId(String((active || data[0]).id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat periode ujian.');
    }
  };

  const loadPeserta = async (periodeId) => {
    if (!periodeId) {
      setPesertaList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await UjianAPI.getPesertaUjian({
        periode_ujian_id: periodeId,
        status_pembayaran: filterPembayaran || undefined,
        status_kelayakan: filterKelayakan || undefined,
      });
      setPesertaList(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat peserta ujian.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriode();
  }, []);

  useEffect(() => {
    loadPeserta(selectedPeriodeId);
  }, [selectedPeriodeId, filterPembayaran, filterKelayakan]);

  const handleGenerate = async () => {
    if (!selectedPeriodeId) return;
    try {
      const res = await UjianAPI.generatePesertaUjian({ periode_ujian_id: parseInt(selectedPeriodeId) });
      alert(res.data.message || 'Peserta ujian berhasil didaftarkan.');
      await loadPeserta(selectedPeriodeId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftarkan peserta ujian.');
    }
  };

  const handleVerifyPembayaran = async (item, status_pembayaran) => {
    try {
      await UjianAPI.verifyPembayaranUjian(item.id, { status_pembayaran });
      await loadPeserta(selectedPeriodeId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status pembayaran.');
    }
  };

  const handleKelayakan = async (item, status_kelayakan) => {
    try {
      await UjianAPI.updateKelayakanUjian(item.id, { status_kelayakan });
      await loadPeserta(selectedPeriodeId);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status kelayakan.');
    }
  };

  const handleGenerateKartu = async (item) => {
    try {
      const res = await UjianAPI.generateKartuUjian(item.id);
      const fileUrl = res.data?.data?.kartu_ujian_url;
      await loadPeserta(selectedPeriodeId);
      if (detailPeserta && detailPeserta.id === item.id) {
        await openDetail(item.id);
      }
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat kartu ujian.');
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await UjianAPI.getPesertaUjianById(id);
      setDetailPeserta(res.data.data || null);
      setDetailOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memuat detail peserta ujian.');
    }
  };

  const totalPeserta = pesertaList.length;
  const totalLunas = pesertaList.filter((p) => p.status_pembayaran === 'lunas').length;
  const totalLayak = pesertaList.filter((p) => p.status_kelayakan === 'layak').length;
  const totalPending = pesertaList.filter((p) => p.status_pembayaran !== 'lunas').length;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                <i className="bi bi-shield-check"></i>
                VERIFIKASI & ASESMEN
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Verifikasi Peserta Ujian
              </h1>
              <p style={{ color: '#64748B', marginTop: 4, fontSize: '0.92rem' }}>
                Verifikasi administrasi pembayaran ujian, tetapkan status kelayakan, dan pantau peserta per periode.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedPeriodeId} style={{ boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)', padding: '10px 18px', fontWeight: 700 }}>
              <i className="bi bi-magic" style={{ marginRight: '6px' }}></i> Daftarkan Peserta Ujian
            </button>
          </div>

          {/* ── Metric Cards Berpola & Berwarna ── */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-people-fill" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">TOTAL</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalPeserta}</div>
                <div className="admin-stat-label">Total Peserta Terdaftar</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-check2-all" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">LUNAS</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalLunas}</div>
                <div className="admin-stat-label">Lunas Pembayaran Ujian</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-patch-check-fill" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">LAYAK</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalLayak}</div>
                <div className="admin-stat-label">Dinyatakan Layak Ujian</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-amber">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-hourglass-split" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <span className="admin-stat-tag">PENDING</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalPending}</div>
                <div className="admin-stat-label">Menunggu / Belum Lunas</div>
              </div>
            </div>
          </div>

          {/* ── Filter Panel ── */}
          <div className="admin-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="admin-panel-body" style={{ padding: '1.25rem 1.6rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem', marginRight: '0.5rem' }}>
                <i className="bi bi-funnel-fill" style={{ color: '#1D4ED8' }}></i>
                <span>Filter Peserta:</span>
              </div>
              <select className="form-input" value={selectedPeriodeId} onChange={(e) => setSelectedPeriodeId(e.target.value)} style={{ width: 260, height: 40, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}>
                <option value="">Pilih Periode Ujian</option>
                {periodeList.map((item) => (
                  <option key={item.id} value={item.id}>{item.nama_periode}</option>
                ))}
              </select>
              <select className="form-input" value={filterPembayaran} onChange={(e) => setFilterPembayaran(e.target.value)} style={{ width: 210, height: 40, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}>
                <option value="">Semua Status Pembayaran</option>
                <option value="belum_bayar">Belum Bayar</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="ditolak">Ditolak</option>
                <option value="lunas">Lunas</option>
              </select>
              <select className="form-input" value={filterKelayakan} onChange={(e) => setFilterKelayakan(e.target.value)} style={{ width: 190, height: 40, borderRadius: 10, border: '1.5px solid #CBD5E1', fontWeight: 600 }}>
                <option value="">Semua Status Kelayakan</option>
                <option value="belum_layak">Belum Layak</option>
                <option value="layak">Layak Ikut Ujian</option>
              </select>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-list-check" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Peserta Ujian Terdaftar</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                {pesertaList.length} Peserta Terdata
              </span>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Memuat peserta ujian...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            ) : pesertaList.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-people"></i>
                <h3>Belum Ada Peserta Ujian</h3>
                <p>Daftarkan peserta ujian dari periode yang dipilih untuk mulai verifikasi.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama</th>
                      <th>Rombel</th>
                      <th>Pembayaran</th>
                      <th>Kelayakan</th>
                      <th>Verifikator</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesertaList.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.nis}</code></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.nama_lengkap}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.email}</div>
                        </td>
                        <td>{item.nama_rombel}</td>
                        <td><span className={`badge ${badgeByPembayaran(item.status_pembayaran)}`}>{formatStatus(item.status_pembayaran)}</span></td>
                        <td><span className={`badge ${item.status_kelayakan === 'layak' ? 'badge-success' : 'badge-warning'}`}>{formatStatus(item.status_kelayakan)}</span></td>
                        <td>{item.nama_verifikator || <span style={{ color: 'var(--color-text-muted)' }}>Belum ada</span>}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openDetail(item.id)}>
                              <i className="bi bi-eye"></i> Detail
                            </button>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleVerifyPembayaran(item, 'lunas')}>
                              <i className="bi bi-check2-circle"></i> Lunas
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleVerifyPembayaran(item, 'ditolak')}>
                              <i className="bi bi-x-circle"></i> Tolak
                            </button>
                            <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'var(--color-success)', color: 'white' }} onClick={() => handleKelayakan(item, 'layak')}>
                              <i className="bi bi-patch-check"></i> Layak
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => handleGenerateKartu(item)}
                              disabled={item.status_pembayaran !== 'lunas' || item.status_kelayakan !== 'layak'}
                              title={item.status_pembayaran !== 'lunas' || item.status_kelayakan !== 'layak' ? 'Peserta harus lunas dan layak terlebih dahulu' : 'Buat kartu ujian PDF'}
                            >
                              <i className="bi bi-file-earmark-pdf"></i> {item.kartu_ujian_url ? 'Buat Ulang Kartu' : 'Buat Kartu'}
                            </button>
                            {item.kartu_ujian_url && (
                              <a
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                href={item.kartu_ujian_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="bi bi-download"></i> Lihat Kartu
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {detailOpen && detailPeserta && (
        <SimpleModal title="Detail Peserta Ujian" onClose={() => setDetailOpen(false)} maxWidth={780}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <Info label="Nama Siswa" value={detailPeserta.nama_lengkap} icon="bi-person" />
            <Info label="Nomor Induk Siswa (NIS)" value={detailPeserta.nis} icon="bi-card-text" />
            <Info label="Rombongan Belajar" value={detailPeserta.nama_rombel} icon="bi-mortarboard" />
            <Info label="Periode Ujian" value={detailPeserta.nama_periode} icon="bi-calendar-event" />
            <Info label="Status Pembayaran" value={formatStatus(detailPeserta.status_pembayaran)} icon="bi-cash-coin" />
            <Info label="Status Kelayakan" value={formatStatus(detailPeserta.status_kelayakan)} icon="bi-shield-check" />
          </div>

          {detailPeserta.kartu_ujian_url && (
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                <i className="bi bi-file-earmark-check-fill" style={{ fontSize: '1.2rem' }}></i>
                <span>Kartu Ujian Resmi Sudah Diterbitkan</span>
              </div>
              <a className="btn btn-success" style={{ background: '#16A34A', color: 'white' }} href={detailPeserta.kartu_ujian_url} target="_blank" rel="noopener noreferrer">
                <i className="bi bi-file-earmark-pdf"></i> Unduh / Cetak Kartu
              </a>
            </div>
          )}

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-journal-bookmark-fill" style={{ color: '#1D4ED8' }}></i>
              <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 800, color: '#0F172A' }}>Mata Pelajaran Ujian Terdaftar</h4>
            </div>
            {detailPeserta.mapel?.length ? (
              <div className="table-wrapper" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ background: '#F1F5F9' }}>
                    <tr>
                      <th style={{ width: '120px' }}>Kode Mapel</th>
                      <th>Mata Pelajaran</th>
                      <th>Paket Ujian Terpasang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailPeserta.mapel.map((item) => (
                      <tr key={item.id}>
                        <td><code style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>{item.kode_mapel}</code></td>
                        <td style={{ fontWeight: 700, color: '#1E293B' }}>{item.nama_mapel}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#F1F5F9', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                            <i className="bi bi-layers text-primary"></i> {item.judul_paket_ujian}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                <i className="bi bi-journal-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', color: '#94A3B8' }}></i>
                <div style={{ fontWeight: 700, color: '#334155' }}>Belum Ada Mapel Ujian</div>
                <div style={{ fontSize: '0.85rem' }}>Peserta ini belum memiliki daftar mapel ujian terkonfigurasi.</div>
              </div>
            )}
          </div>
        </SimpleModal>
      )}
    </div>
  );
}

function badgeByPembayaran(status) {
  const map = {
    belum_bayar: 'badge-warning',
    menunggu_verifikasi: 'badge-info',
    ditolak: 'badge-danger',
    lunas: 'badge-success',
  };
  return map[status] || 'badge-neutral';
}

function formatStatus(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function Info({ label, value, icon }) {
  return (
    <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      {icon && <i className={`bi ${icon}`} style={{ color: '#64748B', fontSize: '1.1rem', marginTop: 2 }}></i>}
      <div>
        <div style={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.925rem' }}>{value || '-'}</div>
      </div>
    </div>
  );
}

function SimpleModal({ title, onClose, children, maxWidth = 640 }) {
  return (
    <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal-dialog" style={{ maxWidth }}>
        <div className="admin-modal-header">
          <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            <i className="bi bi-person-bounding-box"></i>
          </div>
          <div className="admin-modal-title-wrap">
            <h3 className="admin-modal-title">{title}</h3>
            <p className="admin-modal-subtitle">Informasi lengkap peserta, riwayat verifikasi dan berkas kartu ujian</p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Tutup">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default PesertaUjianAdmin;
