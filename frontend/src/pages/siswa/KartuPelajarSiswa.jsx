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
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  FileText
} from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, toAssetUrl } from '../../services/api.js';
import { QrCodeView, BarcodeView, getKartuVerificationUrl } from '../../utils/qrCode.jsx';
import { triggerDownloadKartuPelajarPdf } from '../../utils/kartuPelajarPdfClient.js';
import { downloadCardImage } from '../../utils/kartuCanvasDrawer.js';
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
  const [downloadingImg, setDownloadingImg] = useState(false);

  // State khusus Admin
  const [siswaList, setSiswaList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

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

  // Unduh Dokumen PDF Resmi Presisi 300 DPI
  const handleDownloadPdf = async () => {
    if (!cleanProfil) return;
    setDownloadingPdf(true);
    try {
      await triggerDownloadKartuPelajarPdf(cleanProfil);
    } catch (err) {
      console.error('[KartuPelajar] Gagal mengunduh PDF:', err);
      alert('Gagal mengunduh file PDF Kartu Pelajar. Silakan coba kembali.');
    } finally {
      setTimeout(() => setDownloadingPdf(false), 600);
    }
  };

  // Unduh Gambar Kartu Pelajar (PNG HD 300 DPI)
  const handleDownloadImage = async () => {
    if (!cleanProfil) return;
    setDownloadingImg(true);
    try {
      await downloadCardImage(cleanProfil, 'both');
    } catch (err) {
      console.error('[KartuPelajar] Gagal mengunduh gambar:', err);
      alert('Gagal mengunduh gambar kartu pelajar.');
    } finally {
      setTimeout(() => setDownloadingImg(false), 600);
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
                Identitas resmi Warga Belajar PKBM Bina Mandiri. Sentuh atau klik kartu untuk membalik sisi, dan langsung unduh kartunya dalam format PDF maupun Gambar HD siap pakai.
              </p>
            </div>

            <div className="kartu-pelajar-actions-bar">
              <button
                type="button"
                className="btn-kartu-action btn-kartu-image"
                onClick={handleDownloadImage}
                disabled={loading || !profil || downloadingImg}
                title="Langsung unduh kartu dalam format Gambar PNG HD"
              >
                {downloadingImg ? (
                  <>
                    <div className="spinner-mini" />
                    <span>Menyiapkan...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} />
                    <span>Unduh Gambar (PNG)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-kartu-action btn-kartu-download"
                onClick={handleDownloadPdf}
                disabled={loading || !profil || downloadingPdf}
                title="Langsung unduh kartu pelajar dalam format PDF rapih siap cetak"
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

                  {/* ══ SISI DEPAN (FRONT FACE) ════════════════════ */}
                  <div className="id-card-face id-card-front-sleek">
                    <div className="card-ambient-glow" />
                    <div className="card-watermark-crest" />

                    {/* Kop Kartu Sleek */}
                    <div className="card-top-kop">
                      <div className="kop-brand-group">
                        <div className="kop-logo-wrapper">
                          <img
                            src="/images/logo new.png"
                            alt="Logo PKBM"
                            onError={(e) => { e.target.src = '/favicon.svg'; }}
                          />
                        </div>
                        <div className="kop-titles">
                          <span className="kop-subhead">KEMENTERIAN PENDIDIKAN & KEBUDAYAAN</span>
                          <h2 className="kop-school-name">PKBM BINA MANDIRI</h2>
                          <span className="kop-accreditation">NPSN: P9962854 • TERAKREDITASI RESMI</span>
                        </div>
                      </div>
                      <div className="kop-jenjang-tag">
                        {badgeJenjangText[profil.jenjang] || 'WARGA BELAJAR'}
                      </div>
                    </div>

                    {/* Badan Depan (Foto & Typographic Flow Bersih Tanpa Kotak-Kotak) */}
                    <div className="card-main-content">
                      <div className="card-photo-portrait">
                        {profil.foto_profil || profil.pas_foto ? (
                          <img
                            src={toAssetUrl(profil.foto_profil || profil.pas_foto)}
                            alt={profil.nama_lengkap}
                            className="student-portrait-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="student-portrait-fallback"
                          style={{ display: (profil.foto_profil || profil.pas_foto) ? 'none' : 'flex' }}
                        >
                          <span>{profil.nama_lengkap?.charAt(0)?.toUpperCase() || 'W'}</span>
                        </div>
                      </div>

                      <div className="card-details-flow">
                        <div className="student-name-prominent" title={profil.nama_lengkap}>
                          {profil.nama_lengkap}
                        </div>

                        <div className="student-nis-subline">
                          <span className="nis-tag">NIS</span>
                          <span className="nis-number">{cleanProfil.nis || 'DALAM PENETAPAN'}</span>
                        </div>

                        <div className="student-meta-list">
                          <div className="meta-item">
                            <span className="meta-lbl">NIK</span>
                            <span className="meta-val">{profil.nik || '—'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-lbl">TTL</span>
                            <span className="meta-val">{formatTanggalLahir(profil.tanggal_lahir)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-lbl">Program</span>
                            <span className="meta-val">{labelJenjang[profil.jenjang] || profil.jenjang}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-lbl">Rombel</span>
                            <span className="meta-val">{profil.nama_rombel || 'Dalam Penetapan'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu Sleek (Tanpa QR Code & Kotak TA Dihapus) */}
                    <div className="card-bottom-bar">
                      <div className="card-auth-code">
                        <BarcodeView
                          value={cleanProfil.nis || 'PKBM-BINA-MANDIRI'}
                          width={140}
                          height={18}
                          color="#FFFFFF"
                          showText={false}
                        />
                        <span className="auth-code-text">AUTHENTIC STUDENT IDENTIFICATION</span>
                      </div>
                    </div>
                  </div>

                  {/* ══ SISI BELAKANG (BACK FACE - TANPA QR CODE) ══════════════════ */}
                  <div className="id-card-face id-card-back-sleek">
                    <div className="card-ambient-glow" />

                    <div>
                      <div className="back-title-banner">
                        <span>KETENTUAN PENGGUNAAN KARTU PELAJAR</span>
                      </div>

                      <ul className="back-clauses-list">
                        <li>Kartu ini adalah identitas resmi Warga Belajar PKBM Bina Mandiri.</li>
                        <li>Wajib dibawa saat tutorial tatap muka, asesmen, dan ujian evaluasi pembelajaran.</li>
                        <li>Kartu ini tidak dapat dipinjamkan atau dipindahtangankan kepada orang lain.</li>
                        <li>Bila kartu ini hilang, harap segera melapor ke Sekretariat TU PKBM Bina Mandiri.</li>
                      </ul>
                    </div>

                    {/* Pengesahan Kepala PKBM Bina Mandiri */}
                    <div className="back-signature-cluster">
                      <div className="back-institution-info">
                        <div className="inst-sub">LEMBAGA PENDIDIKAN KESETARAAN</div>
                        <div className="inst-name">PKBM BINA MANDIRI</div>
                        <div className="inst-npsn">NPSN: P9962854 • SUMEDANG</div>
                      </div>

                      <div className="back-official-endorsement">
                        <div className="sig-place-date">Sumedang, {new Date().getFullYear()}</div>
                        <div className="sig-office-title">Kepala PKBM Bina Mandiri</div>
                        <div className="sig-image-wrapper">
                          <img
                            src="/images/ttd.png"
                            alt="Tanda Tangan Kepala PKBM"
                            className="sig-image"
                            onError={(e) => {
                              if (!e.target.dataset.triedRoot) {
                                e.target.dataset.triedRoot = '1';
                                e.target.src = '/ttd.png';
                              }
                            }}
                          />
                        </div>
                        {/* Nama pimpinan resmi: Indrayani, S.S.,M.Pd. */}
                        <div className="sig-principal-name">Indrayani, S.S.,M.Pd.</div>
                      </div>
                    </div>

                    <div className="back-legal-footer">
                      Sekretariat PKBM Bina Mandiri, Sumedang • Web: pkbmbinamandiri.sch.id
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
