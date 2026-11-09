// ============================================================
// src/pages/public/UploadsRedirector.jsx
// Penangan Cerdas Akses Dokumen / Berkas Upload
// Mencegah error 404 jika URL file (/uploads/...) dibuka langsung di tab baru browser.
// Mendeteksi jenis file, menyajikan pratinjau inline dengan auto-fallback ke /api/uploads/,
// dan menyediakan tombol download & kembali ke dashboard.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function UploadsRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  const fullPath = location.pathname; // misal: /uploads/spmb/1794195308351-PAS_FOTO.jpg
  const cleanSubPath = fullPath.replace(/^\/(?:api\/)?uploads\/?/i, '');
  const fileName = decodeURIComponent(cleanSubPath.split('/').pop() || 'file_dokumen');

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  // Kandidat URL untuk mencoba memuat file fisik
  const candidateUrls = [
    `/api/uploads/${cleanSubPath}`,
    `/uploads/${cleanSubPath}`,
    fullPath,
  ];

  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentUrl = candidateUrls[activeUrlIndex];

  const handleLoadError = () => {
    if (activeUrlIndex < candidateUrls.length - 1) {
      console.warn(`[UploadsRedirector] Candidate #${activeUrlIndex} (${currentUrl}) gagal. Mencoba kandidat berikutnya...`);
      setActiveUrlIndex((prev) => prev + 1);
      setLoading(true);
    } else {
      console.error('[UploadsRedirector] Semua URL fisik upload gagal diakses.');
      setLoading(false);
      setHasError(true);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP NAVIGATION BAR ── */}
      <header
        style={{
          padding: '12px 20px',
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#334155',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="bi bi-arrow-left"></i> Kembali
          </button>

          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC', wordBreak: 'break-all' }}>
              {fileName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Pratinjau Dokumen Sistem PKBM Bina Mandiri
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isImage && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                title="Perbesar (Zoom In)"
                style={navBtnStyle}
              >
                <i className="bi bi-zoom-in"></i>
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                title="Perkecil (Zoom Out)"
                style={navBtnStyle}
              >
                <i className="bi bi-zoom-out"></i>
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Putar 90 Derajat"
                style={navBtnStyle}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
              <button
                type="button"
                onClick={() => { setZoom(1); setRotation(0); }}
                title="Reset Tampilan"
                style={navBtnStyle}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
              <div style={{ width: 1, height: 20, backgroundColor: '#475569', margin: '0 4px' }} />
            </>
          )}

          <a
            href={currentUrl}
            download={fileName}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="bi bi-download"></i> Unduh File
          </a>

          <Link
            to="/dashboard/admin/spmb"
            style={{
              backgroundColor: '#334155',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="bi bi-speedometer2"></i> Dashboard SPMB
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT VIEWPORT ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'auto',
          padding: '24px',
        }}
      >
        {/* Loading Spinner */}
        {loading && !hasError && (
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
                width: 42,
                height: 42,
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: '#38BDF8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Memuat Dokumen...</span>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {isImage && !hasError && (
          <div
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
            }}
          >
            <img
              src={currentUrl}
              alt={fileName}
              onLoad={() => setLoading(false)}
              onError={handleLoadError}
              style={{
                maxWidth: zoom === 1 ? '90vw' : 'none',
                maxHeight: zoom === 1 ? '82vh' : 'none',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
                userSelect: 'none',
              }}
            />
          </div>
        )}

        {/* PDF PREVIEW */}
        {isPdf && !hasError && (
          <iframe
            src={currentUrl}
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={handleLoadError}
            style={{
              width: '90vw',
              height: '84vh',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
            }}
          />
        )}

        {/* NON-IMAGE/NON-PDF FILE */}
        {(!isImage && !isPdf && !hasError) && (
          <div
            style={{
              textAlign: 'center',
              maxWidth: 480,
              backgroundColor: '#1E293B',
              padding: '36px 28px',
              borderRadius: '16px',
              border: '1px solid #334155',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
              {fileName}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Format berkas ini dapat diunduh dan dibuka langsung menggunakan aplikasi di perangkat Anda.
            </p>
            <a
              href={currentUrl}
              download={fileName}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
            >
              <i className="bi bi-cloud-arrow-down-fill"></i> Unduh File Sekarang
            </a>
          </div>
        )}

        {/* ERROR STATE */}
        {hasError && (
          <div
            style={{
              textAlign: 'center',
              maxWidth: 480,
              backgroundColor: '#1E293B',
              padding: '36px 28px',
              borderRadius: '16px',
              border: '1px solid #334155',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
              File Tidak Ditemukan
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              Berkas <code>{fileName}</code> tidak ditemukan pada lokasi penyimpanan server. Pastikan calon siswa atau admin telah mengunggah file berkas tersebut dengan benar.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link
                to="/dashboard/admin/spmb"
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                Ke Menu SPMB Admin
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: '#334155',
  border: '1px solid #475569',
  color: '#F8FAFC',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

