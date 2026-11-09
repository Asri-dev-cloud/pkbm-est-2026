// ============================================================
// src/components/ModalPratinjauBerkas.jsx
// Modal In-App Interaktif untuk Pratinjau Dokumen & Berkas SPMB
// Dilengkapi: Zoom In/Out, Rotate, Fullscreen, Auto-Fallback URL,
// Deteksi Otomatis Gambar/PDF/Dokumen, & Aksi Sahkan/Tolak Langsung
// ============================================================

import React, { useState, useEffect } from 'react';
import { toAssetUrl, getAssetUrlCandidates } from '../services/api.js';

export default function ModalPratinjauBerkas({
  isOpen,
  onClose,
  berkas,
  pendaftar,
  onVerifikasi,
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [candidateUrls, setCandidateUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Generate daftar kandidat URL untuk ketahanan maksimal jika salah satu gagal/404
  useEffect(() => {
    if (berkas && berkas.path_file) {
      const candidates = getAssetUrlCandidates(berkas.path_file, berkas.id);
      setCandidateUrls(candidates);
      setActiveUrlIndex(0);
      setIsLoading(true);
      setHasError(false);
      setZoom(1);
      setRotation(0);
    }
  }, [berkas]);

  // Listener tombol ESC & keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r' || e.key === 'R') handleRotate();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoom, rotation]);

  if (!isOpen || !berkas) return null;

  const currentUrl = candidateUrls[activeUrlIndex] || toAssetUrl(berkas.path_file, berkas.id);

  // Deteksi ekstensi file
  const fileName = (berkas.nama_file || berkas.path_file || '').toLowerCase();
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  // Label jenis berkas
  const labelJenis = {
    kk: 'Kartu Keluarga (KK)',
    ijazah: 'Ijazah Terakhir / SKL / Raport',
    foto: 'Pas Foto 3×4 Terbaru',
    dokumen_lain: 'Dokumen Pendukung Lain',
  }[berkas.jenis_berkas] || berkas.jenis_berkas?.replace(/_/g, ' ') || 'Dokumen Calon Siswa';

  const statusBerkas = berkas.status_verifikasi;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Jika URL saat ini gagal (misal 404 dari Nginx/path), otomatis coba kandidat berikutnya
  const handleLoadError = () => {
    if (activeUrlIndex < candidateUrls.length - 1) {
      console.warn(`[ModalPratinjauBerkas] URL '${currentUrl}' gagal dimuat. Mencoba alternatif #${activeUrlIndex + 1}...`);
      setActiveUrlIndex((prev) => prev + 1);
      setIsLoading(true);
    } else {
      console.error('[ModalPratinjauBerkas] Semua kandidat URL berkas gagal dimuat:', candidateUrls);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleVerifikasiAction = async (status) => {
    if (!onVerifikasi || verifying) return;
    try {
      setVerifying(true);
      await onVerifikasi(berkas.id, status);
    } catch (err) {
      console.error('Error saat verifikasi berkas:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="modal-pratinjau-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '1rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        className="modal-pratinjau-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isFullscreen ? '100vw' : '92vw',
          maxWidth: isFullscreen ? 'none' : '1100px',
          height: isFullscreen ? '100vh' : '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: isFullscreen ? 0 : '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
      >
        {/* ── HEADER MODAL ── */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#F8FAFC',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 200, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: statusBerkas === 'valid' ? '#DCFCE7' : '#EFF6FF',
                color: statusBerkas === 'valid' ? '#16A34A' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              <i className={isImage ? 'bi bi-image' : isPdf ? 'bi bi-file-earmark-pdf' : 'bi bi-file-earmark-text'}></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {labelJenis}
                </span>
                {statusBerkas && (
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        statusBerkas === 'valid'
                          ? '#DCFCE7'
                          : statusBerkas === 'tidak_valid'
                          ? '#FEE2E2'
                          : '#FEF3C7',
                      color:
                        statusBerkas === 'valid'
                          ? '#15803D'
                          : statusBerkas === 'tidak_valid'
                          ? '#B91C1C'
                          : '#B45309',
                    }}
                  >
                    {statusBerkas === 'valid' ? '✓ Terverifikasi Sah' : statusBerkas === 'tidak_valid' ? '✗ Ditolak' : '⏳ Menunggu Verifikasi'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                {pendaftar?.nama_lengkap ? (
                  <span>
                    <strong>{pendaftar.nama_lengkap}</strong> (ID #{pendaftar.id}) •{' '}
                  </span>
                ) : null}
                <span title={berkas.nama_file}>{berkas.nama_file || 'Berkas Terlampir'}</span>
              </div>
            </div>
          </div>

          {/* TOOLBAR CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Perbesar (Zoom In)"
                  style={toolbarBtnStyle}
                >
                  <i className="bi bi-zoom-in"></i>
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Perkecil (Zoom Out)"
                  style={toolbarBtnStyle}
                >
                  <i className="bi bi-zoom-out"></i>
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Putar 90 Derajat (Rotasi)"
                  style={toolbarBtnStyle}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  title="Reset Tampilan"
                  style={toolbarBtnStyle}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
                <div style={{ width: 1, height: 20, backgroundColor: '#CBD5E1', margin: '0 4px' }} />
              </>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              style={toolbarBtnStyle}
            >
              <i className={isFullscreen ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen'}></i>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={berkas.nama_file || 'dokumen_berkas'}
              title="Unduh / Buka Dokumen Asli"
              style={{ ...toolbarBtnStyle, textDecoration: 'none' }}
            >
              <i className="bi bi-download"></i>
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Tutup (ESC)"
              style={{
                ...toolbarBtnStyle,
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                borderColor: '#FECACA',
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* ── BODY VIEWPORT ── */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#0F172A',
            position: 'relative',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
          }}
        >
          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: '#94A3B8',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#38BDF8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Memuat Dokumen Berkas...</span>
            </div>
          )}

          {/* VIEW: IMAGE */}
          {isImage && !hasError && (
            <div
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                overflow: 'auto',
              }}
            >
              <img
                src={currentUrl}
                alt={berkas.nama_file || 'Berkas Calon Siswa'}
                onLoad={() => setIsLoading(false)}
                onError={handleLoadError}
                style={{
                  maxWidth: zoom === 1 ? '92%' : 'none',
                  maxHeight: zoom === 1 ? '75vh' : 'none',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                  userSelect: 'none',
                }}
              />
            </div>
          )}

          {/* VIEW: PDF */}
          {isPdf && !hasError && (
            <iframe
              src={currentUrl}
              title={berkas.nama_file || 'Dokumen PDF'}
              onLoad={() => setIsLoading(false)}
              onError={handleLoadError}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
          )}

          {/* VIEW: OTHER DOCUMENT OR FALLBACK */}
          {(!isImage && !isPdf && !hasError) && (
            <div
              style={{
                textAlign: 'center',
                color: '#FFFFFF',
                padding: '32px 24px',
                maxWidth: 480,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 16px',
                }}
              >
                <i className="bi bi-file-earmark-arrow-down"></i>
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                {labelJenis}
              </h4>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
                Dokumen dengan format ini (<strong>{berkas.nama_file}</strong>) dapat diunduh dan dibuka langsung menggunakan aplikasi pembaca berkas di komputer Anda.
              </p>
              <a
                href={currentUrl}
                download={berkas.nama_file}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                <i className="bi bi-cloud-arrow-down-fill"></i> Unduh File Berkas Sekarang
              </a>
            </div>
          )}

          {/* VIEW: ERROR FALLBACK */}
          {hasError && (
            <div
              style={{
                textAlign: 'center',
                color: '#FFFFFF',
                padding: '32px 24px',
                maxWidth: 480,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 16px',
                }}
              >
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>
                Gagal Menampilkan Pratinjau Berkas
              </h4>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>
                File berkas fisik mungkin sedang dipindahkan atau disinkronkan oleh server. Anda dapat mencoba memuat ulang atau membuka tautan langsung melalui jalur backend API.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveUrlIndex(0);
                    setHasError(false);
                    setIsLoading(true);
                  }}
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#F1F5F9',
                    border: '1px solid #334155',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="bi bi-arrow-clockwise"></i> Coba Muat Ulang
                </button>
                <a
                  href={`/api/uploads/${berkas.path_file ? berkas.path_file.replace(/^uploads\//, '') : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                  }}
                >
                  <i className="bi bi-box-arrow-up-right"></i> Buka Jalur API
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS (VERIFIKASI LANGSUNG) ── */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
            Shortcut: Gunakan <strong>+</strong> / <strong>-</strong> untuk zoom, <strong>R</strong> untuk memutar, <strong>ESC</strong> untuk menutup.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusBerkas !== 'valid' && (
              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerifikasiAction('valid')}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                }}
              >
                <i className="bi bi-check2-circle"></i>
                {verifying ? 'Memproses...' : 'Sahkan Berkas Ini (Valid)'}
              </button>
            )}

            {statusBerkas !== 'tidak_valid' && (
              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerifikasiAction('tidak_valid')}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                <i className="bi bi-x-circle"></i>
                {verifying ? 'Memproses...' : 'Tolak Berkas'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const toolbarBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  border: '1px solid #CBD5E1',
  color: '#334155',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

