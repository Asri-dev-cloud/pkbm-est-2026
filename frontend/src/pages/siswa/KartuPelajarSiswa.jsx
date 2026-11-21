// ============================================================
// src/pages/siswa/KartuPelajarSiswa.jsx
// Halaman Kartu Pelajar Digital Resmi Warga Belajar PKBM Bina Mandiri
// Fitur: 3D Flip Card Sentuh/Klik, Lihat & Unduh Dokumen PDF Rapih
// ============================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  IdCard,
  Download,
  AlertTriangle,
  Users,
  RotateCw,
  FileText
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, toAssetUrl } from '../../services/api.js';
import { QrCodeView, BarcodeView, getKartuVerificationUrl } from '../../utils/qrCode.jsx';
import { triggerDownloadKartuPelajarPdf } from '../../utils/kartuPelajarPdfClient.js';
import './KartuPelajarSiswa.css';

function KartuPelajarSiswa() {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetId = searchParams.get('id');

  const [user] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // State khusus Admin & Foto Siswa
  const [siswaList, setSiswaList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Ambil data profil siswa
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (isAdmin) {
          if (siswaList.length === 0) {
            setLoadingList(true);
            const resList = await SiswaAPI.getAll();
            if (isMounted) {
              const list = resList.data?.data || [];
              setSiswaList(list);
              setLoadingList(false);
            }
          }

          if (targetId) {
            const resDetail = await SiswaAPI.getById(targetId);
            if (isMounted) setProfil(resDetail.data?.data);
          } else {
            const resList = await SiswaAPI.getAll();
            const list = resList.data?.data || [];
            if (isMounted) {
              setSiswaList(list);
              if (list.length > 0) {
                const resFirst = await SiswaAPI.getById(list[0].id);
                if (isMounted) setProfil(resFirst.data?.data);
              }
            }
          }
        } else {
          // Warga Belajar melihat profil miliknya sendiri
          const res = await SiswaAPI.getProfilSaya();
          if (isMounted) setProfil(res.data?.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[KartuPelajarSiswa] Error memuat profil:', err);
          setError(err.response?.data?.message || 'Gagal memuat data Kartu Pelajar.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [targetId, isAdmin]);

  // Handler pergantian siswa oleh Admin
  const handleSelectSiswa = async (id) => {
    setSearchParams({ id });
    setIsFlipped(false);
  };

  // Data profil siswa yang dinormalisasi ke tahun ajaran berjalan (2026)
  const cleanProfil = profil ? {
    ...profil,
    nis: (profil.nis || '').replace('PKBM-2025-', 'PKBM-2026-') || profil.nis,
  } : null;

  // Susun kandidat URL foto dari database dengan multi-candidate failover
  const photoCandidates = React.useMemo(() => {
    if (!profil) return [];
    const raw = profil.foto_pendaftaran || profil.pas_foto || profil.foto_profil || profil.foto;
    const candidates = [];
    if (raw) {
      if (/^https?:\/\//i.test(raw)) {
        candidates.push(raw);
      } else {
        const clean = String(raw).replace(/\\/g, '/').replace(/^\/+/, '');
        const sub = clean.replace(/^uploads\//, '');
        // 1. Lewat proxy /api/uploads/
        candidates.push(`/api/uploads/${sub}`);
        // 2. Akses direct /uploads/
        candidates.push(`/uploads/${sub}`);
        // 3. Absolute domain resmi
        candidates.push(`https://pkbmbinamandiri.sch.id/uploads/${sub}`);
        candidates.push(`https://pkbmbinamandiri.sch.id/api/uploads/${sub}`);
        // 4. Raw path
        candidates.push(`/${clean}`);
      }
    }
    if (profil.berkas_foto_id) {
      candidates.push(`/api/spmb/berkas/${profil.berkas_foto_id}/file`);
      candidates.push(`https://pkbmbinamandiri.sch.id/api/spmb/berkas/${profil.berkas_foto_id}/file`);
    }
    return [...new Set(candidates.filter(Boolean))];
  }, [profil]);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [profil?.id, profil?.foto_pendaftaran, profil?.pas_foto, profil?.foto_profil]);

  const handlePhotoError = () => {
    if (activePhotoIdx + 1 < photoCandidates.length) {
      setActivePhotoIdx((prev) => prev + 1);
    } else {
      setActivePhotoIdx(999);
    }
  };

  // Helper: Ekstraksi data foto yang sudah sukses tampil di layar
  const getPreparedSiswaData = () => {
    if (!cleanProfil) return null;
    let photoDataUrl = null;
    try {
      const domImg = document.querySelector('.student-official-photo');
      if (domImg && domImg.complete && domImg.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = domImg.naturalWidth;
        c.height = domImg.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(domImg, 0, 0);
        photoDataUrl = c.toDataURL('image/jpeg', 0.95);
      }
    } catch (e) {
      console.warn('[KartuPelajar] Gagal mengambil data URL dari DOM foto:', e);
    }

    const workingPhotoUrl = photoCandidates[activePhotoIdx] || null;

    return {
      ...cleanProfil,
      photoDataUrl,
      fotoUrl: workingPhotoUrl,
      photoCandidates,
    };
  };

  // Unduh Dokumen PDF Resmi Presisi 300 DPI (Standar Cetak CR-80 2 Halaman)
  const handleDownloadPdf = async () => {
    const data = getPreparedSiswaData();
    if (!data) return;
    setDownloadingPdf(true);
    try {
      await triggerDownloadKartuPelajarPdf(data);
    } catch (err) {
      console.error('[KartuPelajar] Gagal mengunduh PDF:', err);
      alert('Gagal mengunduh file PDF Kartu Pelajar. Silakan coba kembali.');
    } finally {
      setTimeout(() => setDownloadingPdf(false), 600);
    }
  };

  // Format tanggal lahir Indonesia
  const formatTanggalLahir = (tgl) => {
    if (!tgl) return '—';
    try {
      return new Date(tgl).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return tgl;
    }
  };

  const labelJenjang = {
    paket_a: 'Paket A (Setara SD)',
    paket_b: 'Paket B (Setara SMP)',
    paket_c: 'Paket C (Setara SMA)',
  };

  const badgeJenjangText = {
    paket_a: 'PAKET A',
    paket_b: 'PAKET B',
    paket_c: 'PAKET C',
  };

  const verifyUrl = profil?.nis ? getKartuVerificationUrl(profil.nis) : '';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content kartu-pelajar-page-container">

          {/* ── Header Halaman ── */}
          <div className="kartu-pelajar-header-wrap">
            <div className="kartu-pelajar-title-wrap">
              <h1>
                <IdCard className="hero-icon-sky" size={28} />
                <span>Kartu Pelajar Digital</span>
              </h1>
              <p>
                Identitas resmi Warga Belajar PKBM Bina Mandiri. Sentuh atau klik kartu untuk membalik sisi, dan langsung unduh dokumen kartu dalam format PDF standar cetak (2 halaman depan &amp; belakang).
              </p>
            </div>

            <div className="kartu-pelajar-actions-bar">
              <button
                type="button"
                className="btn-kartu-action btn-kartu-download"
                onClick={handleDownloadPdf}
                disabled={loading || !profil || downloadingPdf}
                title="Langsung unduh kartu pelajar dalam format PDF rapih siap cetak (Depan & Belakang)"
              >
                {downloadingPdf ? (
                  <>
                    <div className="spinner-mini" />
                    <span>Menyiapkan...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Unduh Kartu (PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Panel Pemilih Siswa (Khusus Admin TU) ── */}
          {isAdmin && (
            <div className="admin-siswa-selector-box">
              <div className="admin-info-badge">
                <i className="bi bi-person-badge-fill" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                    Panel Cetak Kartu Pelajar (Admin TU)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Pilih nama warga belajar untuk melihat atau mengunduh kartu pelajar resminya.
                  </div>
                </div>
              </div>

              <div className="admin-siswa-controls">
                <select
                  className="form-input admin-siswa-select"
                  value={profil?.id || ''}
                  onChange={(e) => handleSelectSiswa(e.target.value)}
                  disabled={loadingList}
                >
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nis ? `[${(s.nis || '').replace('PKBM-2025-', 'PKBM-2026-')}] ` : ''}{s.nama_lengkap} ({labelJenjang[s.jenjang] || s.jenjang})
                    </option>
                  ))}
                </select>

                <Link
                  to="/dashboard/admin/siswa"
                  className="btn btn-secondary admin-siswa-btn"
                >
                  <Users size={14} style={{ marginRight: 4 }} />
                  Data Siswa
                </Link>
              </div>
            </div>
          )}

          {/* ── Status Loading & Error ── */}
          {loading && (
            <div className="loading-container" style={{ padding: '4rem 1rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: 12, color: '#64748B', fontWeight: 600 }}>
                Menyiapkan identitas digital Warga Belajar...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Gagal Memuat Kartu:</strong> {error}
              </div>
            </div>
          )}

          {/* ── 3D Interactive Flip Card Showcase ── */}
          {!loading && profil && (
            <div className="kartu-interactive-center-wrapper">

              {/* Tag Status Sisi yang Sedang Dilihat */}
              <div className="kartu-current-side-tag">
                <span className="side-indicator-pill">
                  {isFlipped ? 'SISI BELAKANG' : 'SISI DEPAN'}
                  <span className="side-detail-text">
                    {isFlipped ? ' (KETENTUAN & TTD)' : ' (IDENTITAS SISWA)'}
                  </span>
                </span>
                <span className="side-indicator-meta">
                  Standar CR-80<span className="side-meta-dims"> (85.6mm × 53.98mm)</span>
                </span>
              </div>

              {/* 3D Flip Container (Sentuh/Klik Kartu Untuk Membalik) */}
              <div className="kartu-flip-container">
                <div
                  className={`kartu-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                  onClick={() => setIsFlipped((prev) => !prev)}
                  title="Klik atau sentuh kartu ini untuk membalik sisi"
                >

                  {/* ══ SISI DEPAN (FRONT FACE - KARTU RESMI PVC) ════════════════════ */}
                  <div className="id-card-face id-card-front-official">
                    {/* Watermark Logo PKBM di Kanan Bawah (Asli, Jelas, & Transparan Elegan) */}
                    <div className="card-watermark-official">
                      <img
                        src="/images/logo new.png"
                        alt=""
                        className="watermark-official-img"
                        onError={(e) => { e.target.src = '/favicon.svg'; }}
                      />
                    </div>

                    {/* Kop Kartu Resmi Pemerintah & Lembaga */}
                    <div className="card-official-kop">
                      <div className="kop-brand-area">
                        <div className="kop-logo-box">
                          <img
                            src="/images/logo new.png"
                            alt="Logo PKBM"
                            onError={(e) => { e.target.src = '/favicon.svg'; }}
                          />
                        </div>
                        <div className="kop-text-area">
                          <span className="kop-ministry-text">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET & TEKNOLOGI</span>
                          <h2 className="kop-school-title">PKBM BINA MANDIRI SUMEDANG</h2>
                          <span className="kop-npsn-akred">NPSN: {cleanProfil?.npsn || 'P2970848'}</span>
                        </div>
                      </div>
                      <div className="kop-badge-jenjang">
                        {badgeJenjangText[profil.jenjang] || 'WARGA BELAJAR'}
                      </div>
                    </div>

                    {/* Baris Judul Kartu Tanda Pelajar */}
                    <div className="card-official-title-bar">
                      <span>KARTU TANDA PELAJAR</span>
                    </div>

                    {/* Badan Depan (Foto Resmi & Tabel Identitas Siswa) */}
                    <div className="card-official-body">
                      <div className="card-photo-box">
                        {photoCandidates.length > 0 && activePhotoIdx < photoCandidates.length ? (
                          <img
                            key={photoCandidates[activePhotoIdx]}
                            src={photoCandidates[activePhotoIdx]}
                            alt={profil.nama_lengkap}
                            className="student-official-photo"
                            crossOrigin="anonymous"
                            onError={handlePhotoError}
                          />
                        ) : (
                          <div className="student-photo-placeholder">
                            <span>{profil.nama_lengkap?.charAt(0)?.toUpperCase() || 'W'}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-identity-table">
                        <div className="student-fullname" title={profil.nama_lengkap}>
                          {profil.nama_lengkap}
                        </div>

                        <div className="identity-rows">
                          <div className="id-row">
                            <span className="id-label">NIS</span>
                            <span className="id-colon">:</span>
                            <span className="id-value id-nis">{cleanProfil.nis || 'DALAM PENETAPAN'}</span>
                          </div>
                          <div className="id-row">
                            <span className="id-label">NIK</span>
                            <span className="id-colon">:</span>
                            <span className="id-value">{profil.nik || '—'}</span>
                          </div>
                          <div className="id-row">
                            <span className="id-label">TTL</span>
                            <span className="id-colon">:</span>
                            <span className="id-value">{formatTanggalLahir(profil.tanggal_lahir)}</span>
                          </div>
                          <div className="id-row">
                            <span className="id-label">Program</span>
                            <span className="id-colon">:</span>
                            <span className="id-value">{labelJenjang[profil.jenjang] || profil.jenjang}</span>
                          </div>
                          <div className="id-row">
                            <span className="id-label">Rombel</span>
                            <span className="id-colon">:</span>
                            <span className="id-value">{profil.nama_rombel || 'Dalam Penetapan'}</span>
                          </div>
                          <div className="id-row">
                            <span className="id-label"><span className="label-masa">Masa </span>Berlaku</span>
                            <span className="id-colon">:</span>
                            <span className="id-value">Selama Menjadi Warga Belajar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu Resmi (Barcode & Identitas Lembaga) */}
                    <div className="card-official-footer">
                      <div className="footer-barcode-wrap">
                        <BarcodeView
                          value={cleanProfil.nis || 'PKBM-BINA-MANDIRI'}
                          width={112}
                          height={17}
                          color="#FFFFFF"
                          showText={false}
                        />
                        <span className="barcode-nis-text">{cleanProfil.nis || 'PKBM-2026-0401'}</span>
                      </div>
                      <div className="footer-meta-wrap">
                        <span className="footer-school-text">PKBM BINA MANDIRI • KABUPATEN SUMEDANG</span>
                      </div>
                    </div>
                  </div>

                  {/* ══ SISI BELAKANG (BACK FACE - KETENTUAN RESMI) ══════════════════ */}
                  <div className="id-card-face id-card-back-official">
                    <div className="card-official-kop back-kop">
                      <div className="back-kop-title">KETENTUAN PENGGUNAAN KARTU PELAJAR</div>
                    </div>

                    <div className="back-clauses-wrapper">
                      <ol className="official-rules-list">
                        <li><span className="rule-num">1.</span><span>Kartu ini adalah tanda bukti identitas sah Warga Belajar PKBM Bina Mandiri yang diakui.</span></li>
                        <li><span className="rule-num">2.</span><span>Wajib dibawa saat mengikuti tutorial tatap muka, asesmen sumatif, dan ujian evaluasi pembelajaran.</span></li>
                        <li><span className="rule-num">3.</span><span>Kartu ini tidak dapat dipinjamkan, digandakan, atau dipindahtangankan kepada orang lain.</span></li>
                        <li><span className="rule-num">4.</span><span>Bila kartu ini hilang atau rusak, segera melapor ke Sekretariat TU PKBM Bina Mandiri.</span></li>
                      </ol>
                    </div>

                    {/* Pengesahan Kepala PKBM & Info Sekretariat */}
                    <div className="back-official-cluster">
                      <div className="back-inst-details">
                        <div className="back-inst-title">PUSAT KEGIATAN BELAJAR MASYARAKAT</div>
                        <div className="back-inst-name">PKBM BINA MANDIRI</div>
                        <div className="back-inst-meta">NPSN: {cleanProfil?.npsn || 'P2970848'}</div>
                        <div className="back-inst-addr">Dusun Sukahurip RT 03 RW 03 Desa Legok Kaler Kec. Paseh Kab. Sumedang Prov. Jawa Barat Kode Pos 5381</div>
                        <div className="back-inst-web">Laman Resmi: pkbmbinamandiri.sch.id</div>
                      </div>

                      <div className="back-signature-box">
                        <div className="sig-date-text">Sumedang, {new Date().getFullYear()}</div>
                        <div className="sig-role-text">Kepala PKBM Bina Mandiri,</div>
                        <div className="sig-photo-wrap">
                          <img
                            src="/images/ttd.png"
                            alt="Tanda Tangan Kepala PKBM"
                            className="sig-photo-img"
                            onError={(e) => {
                              if (!e.target.dataset.triedRoot) {
                                e.target.dataset.triedRoot = '1';
                                e.target.src = '/ttd.png';
                              }
                            }}
                          />
                        </div>
                        <div className="sig-name-underline">Indrayani, S.S.,M.Pd.</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Petunjuk Interaktif Membalik Kartu */}
              <div
                className="btn-flip-hint-bar"
                onClick={() => setIsFlipped((prev) => !prev)}
                title="Klik untuk membalik kartu"
              >
                <RotateCw size={14} />
                <span>
                  Sentuh kartu untuk melihat <strong>{isFlipped ? 'Sisi Depan' : 'Sisi Belakang'}</strong>
                </span>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default KartuPelajarSiswa;
