// ============================================================
// src/components/ModalPratinjauExcel.jsx
// Modal Pratinjau & Download Laporan Hasil Penerimaan Siswa Baru
// PKBM Bina Mandiri dalam Format Excel (.xlsx) Resmi
// ============================================================

import React, { useState, useRef } from 'react';
import {
  generateLaporanSiswaExcel,
  getTahunAjaranRealTime,
  formatWaktuCetak,
  formatTanggalDokumen,
} from '../utils/excelExport.js';

const JENJANG_LABEL = {
  paket_a: 'Paket A (SD)',
  paket_b: 'Paket B (SMP)',
  paket_c: 'Paket C (SMA)',
};

export default function ModalPratinjauExcel({
  isOpen,
  onClose,
  data = [],
  defaultTahunAjaran = null,
  filterInfo = 'Semua Data',
  tipeLaporan = 'Data Warga Belajar',
}) {
  const [tahunAjaran, setTahunAjaran] = useState(
    defaultTahunAjaran || getTahunAjaranRealTime()
  );
  const [downloading, setDownloading] = useState(false);
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  // Tahun Ajaran options (+/- 2 tahun dari real-time)
  const currentRealTimeTA = getTahunAjaranRealTime();
  const currentBaseYear = parseInt(currentRealTimeTA.split('/')[0], 10) || new Date().getFullYear();
  const tahunAjaranOptions = [
    `${currentBaseYear - 2}/${currentBaseYear - 1}`,
    `${currentBaseYear - 1}/${currentBaseYear}`,
    `${currentBaseYear}/${currentBaseYear + 1}`,
    `${currentBaseYear + 1}/${currentBaseYear + 2}`,
  ];

  // Statistik ringkas
  const totalSiswa = data.length;
  const countPaketA = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_a').length;
  const countPaketB = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_b').length;
  const countPaketC = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_c').length;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateLaporanSiswaExcel({
        data,
        tahunAjaran,
        filterInfo,
        tipeLaporan,
      });
    } catch (err) {
      console.error('Gagal generate Excel:', err);
      alert('Terjadi kesalahan saat membuat file Excel. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="admin-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="admin-modal-dialog"
        style={{
          width: '95vw',
          maxWidth: '1280px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ======================================================== */}
        {/* 1. Header Toolbar Modal */}
        {/* ======================================================== */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#0F2C59',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.4rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                flexShrink: 0,
              }}
            >
              <i className="bi bi-file-earmark-excel-fill" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.01em',
                  color: '#FFFFFF',
                }}
              >
                Pratinjau Lembar Kerja Excel Rekapan Penerimaan Siswa Baru
              </h2>
              <p
                style={{
                  fontSize: '0.825rem',
                  margin: '2px 0 0 0',
                  color: '#93C5FD',
                }}
              >
                Pusat Kegiatan Belajar Masyarakat (PKBM) Bina Mandiri • Template Format Resmi (.xlsx)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            {/* Pemilih Tahun Ajaran Real-time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#E2E8F0',
                  whiteSpace: 'nowrap',
                }}
              >
                Tahun Ajaran:
              </label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {tahunAjaranOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} {opt === currentRealTimeTA ? '(Tahun Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Cetak */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#334155',
                color: '#FFFFFF',
                border: '1px solid #475569',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Cetak langsung dokumen"
            >
              <i className="bi bi-printer-fill" />
              <span>Cetak</span>
            </button>

            {/* Tombol Unduh File Excel */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: downloading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.4)',
                opacity: downloading ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {downloading ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                  <span>Membuat File...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-download" />
                  <span>Unduh File Excel (.xlsx)</span>
                </>
              )}
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
              aria-label="Tutup"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Ringkasan Info Cepat */}
        {/* ======================================================== */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#475569' }}>
              <strong>Total Terdata:</strong>{' '}
              <span style={{ color: '#1D4ED8', fontWeight: 800 }}>{totalSiswa} Siswa</span>
            </span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ color: '#1E40AF', fontWeight: 600 }}>
              Paket A: <strong>{countPaketA}</strong>
            </span>
            <span style={{ color: '#065F46', fontWeight: 600 }}>
              Paket B: <strong>{countPaketB}</strong>
            </span>
            <span style={{ color: '#6B21A8', fontWeight: 600 }}>
              Paket C: <strong>{countPaketC}</strong>
            </span>
          </div>

          <div style={{ color: '#64748B', fontSize: '0.8rem' }}>
            <i className="bi bi-info-circle" style={{ marginRight: 4 }} />
            File Excel menyertakan <strong>Logo Resmi PKBM</strong>, <strong>Kop Surat Gabungan Kolom</strong>, dan format siap cetak.
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. Tampilan Lembar Kerja Excel (Pratinjau Dokumen) */}
        {/* ======================================================== */}
        <div
          ref={printAreaRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: '#F1F5F9',
          }}
        >
          {/* Paper Sheet Preview */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '2rem 2.25rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E2E8F0',
              minWidth: '980px',
              margin: '0 auto',
            }}
          >
            {/* ---------------------------------------------------- */}
            {/* KOP SURAT RESMI PKBM BINA MANDIRI */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                paddingBottom: '0.875rem',
                borderBottom: '3px double #0F172A',
                marginBottom: '1.25rem',
                position: 'relative',
              }}
            >
              {/* Logo PKBM */}
              <div style={{ flexShrink: 0 }}>
                <img
                  src="/images/logo new.png"
                  alt="Logo PKBM Bina Mandiri"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Teks Kop Surat - Terpusat & Menyatukan Kolom */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h1
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#0F2C59',
                    letterSpacing: '0.03em',
                    margin: '0 0 2px 0',
                    textTransform: 'uppercase',
                  }}
                >
                  PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI
                </h1>
                <h2
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#1E293B',
                    letterSpacing: '0.02em',
                    margin: '0 0 2px 0',
                    textTransform: 'uppercase',
                  }}
                >
                  LAPORAN HASIL PENERIMAAN SISWA BARU (WARGA BELAJAR)
                </h2>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#1D4ED8',
                    letterSpacing: '0.04em',
                    margin: '2px 0 4px 0',
                  }}
                >
                  TAHUN AJARAN {tahunAjaran}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#475569',
                    fontStyle: 'italic',
                    lineHeight: 1.35,
                  }}
                >
                  Izin Operasional No: 421.1/04-Disdik/2020 | NPSN: P9962879 | Terakreditasi BAN-PAUD dan PNF
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748B',
                    lineHeight: 1.35,
                    marginTop: 2,
                  }}
                >
                  Sekretariat: Jl. KH. Hasyim Ashari No. 85, Cipondoh, Kota Tangerang, Banten | Web: pkbmbinamandiri.sch.id
                </div>
              </div>

              {/* Placeholder kanan untuk simetri */}
              <div style={{ width: '80px', flexShrink: 0 }} />
            </div>

            {/* ---------------------------------------------------- */}
            {/* Metadata Dokumen */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: '#334155',
                marginBottom: '1rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <strong>Tanggal Rekapan / Unduh:</strong> {formatWaktuCetak()}
              </div>
              <div>
                <strong>Kategori Filter:</strong>{' '}
                <span style={{ color: '#1D4ED8', fontWeight: 700 }}>{filterInfo}</span>
              </div>
              <div>
                <strong>Total Siswa Diterima:</strong>{' '}
                <span style={{ color: '#047857', fontWeight: 700 }}>
                  {totalSiswa} Orang (Paket A: {countPaketA}, Paket B: {countPaketB}, Paket C: {countPaketC})
                </span>
              </div>
              <div>
                <strong>Status Dokumen:</strong> Lembar Kerja Resmi Terverifikasi
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Tabel Spreadsheet Excel Preview */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                marginBottom: '1.5rem',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.78rem',
                  fontFamily: 'Segoe UI, Arial, sans-serif',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF' }}>
                    <th style={{ padding: '8px 6px', border: '1px solid #3B82F6', textAlign: 'center', width: '38px' }}>
                      NO
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'center', width: '130px' }}>
                      NIS
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'center', width: '135px' }}>
                      NIK
                    </th>
                    <th style={{ padding: '8px 10px', border: '1px solid #3B82F6', textAlign: 'left', minWidth: '170px' }}>
                      NAMA LENGKAP SISWA
                    </th>
                    <th style={{ padding: '8px 4px', border: '1px solid #3B82F6', textAlign: 'center', width: '45px' }}>
                      L/P
                    </th>
                    <th style={{ padding: '8px 6px', border: '1px solid #3B82F6', textAlign: 'center', width: '90px' }}>
                      TGL LAHIR
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'center', width: '110px' }}>
                      JENJANG
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'left', width: '110px' }}>
                      ROMBEL
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'left', width: '140px' }}>
                      ORANG TUA / WALI
                    </th>
                    <th style={{ padding: '8px 8px', border: '1px solid #3B82F6', textAlign: 'center', width: '115px' }}>
                      NO. TELP / WA
                    </th>
                    <th style={{ padding: '8px 10px', border: '1px solid #3B82F6', textAlign: 'left', minWidth: '180px' }}>
                      ALAMAT LENGKAP
                    </th>
                    <th style={{ padding: '8px 4px', border: '1px solid #3B82F6', textAlign: 'center', width: '60px' }}>
                      JARAK
                    </th>
                    <th style={{ padding: '8px 6px', border: '1px solid #3B82F6', textAlign: 'center', width: '75px' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '8px 6px', border: '1px solid #3B82F6', textAlign: 'center', width: '90px' }}>
                      TERDAFTAR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: '#64748B',
                          fontStyle: 'italic',
                        }}
                      >
                        Tidak ada data warga belajar / siswa baru untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    data.map((siswa, idx) => {
                      const isEven = idx % 2 === 1;
                      const jenjangKey = siswa.jenjang || siswa.jenjang_daftar;
                      const jenjangName = JENJANG_LABEL[jenjangKey] || jenjangKey || '-';

                      let tglLahirText = '-';
                      if (siswa.tanggal_lahir) {
                        try {
                          tglLahirText = new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });
                        } catch {
                          tglLahirText = String(siswa.tanggal_lahir);
                        }
                      }

                      let tglDaftarText = '-';
                      if (siswa.created_at) {
                        try {
                          tglDaftarText = new Date(siswa.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        } catch {
                          tglDaftarText = String(siswa.created_at);
                        }
                      }

                      const statusActive = siswa.is_aktif !== undefined ? siswa.is_aktif : siswa.status === 'diterima';

                      return (
                        <tr
                          key={siswa.id || idx}
                          style={{
                            backgroundColor: isEven ? '#F8FAFC' : '#FFFFFF',
                            color: '#0F172A',
                          }}
                        >
                          <td style={{ padding: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {idx + 1}
                          </td>
                          <td
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #E2E8F0',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: '#1D4ED8',
                            }}
                          >
                            {siswa.nis || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {siswa.nik || '-'}
                          </td>
                          <td
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #E2E8F0',
                              fontWeight: 600,
                            }}
                          >
                            {siswa.nama_lengkap || siswa.nama || '-'}
                          </td>
                          <td style={{ padding: '6px 4px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {siswa.jenis_kelamin || '-'}
                          </td>
                          <td style={{ padding: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {tglLahirText}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor:
                                  jenjangKey === 'paket_a'
                                    ? '#DBEAFE'
                                    : jenjangKey === 'paket_b'
                                    ? '#D1FAE5'
                                    : '#F3E8FF',
                                color:
                                  jenjangKey === 'paket_a'
                                    ? '#1E40AF'
                                    : jenjangKey === 'paket_b'
                                    ? '#065F46'
                                    : '#6B21A8',
                              }}
                            >
                              {jenjangName}
                            </span>
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                            {siswa.nama_rombel || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                            {siswa.nama_wali || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {siswa.no_telp || '-'}
                          </td>
                          <td
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #E2E8F0',
                              fontSize: '0.74rem',
                              color: '#334155',
                            }}
                          >
                            {siswa.alamat || '-'}
                          </td>
                          <td style={{ padding: '6px 4px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {siswa.jarak_rumah_km !== null && siswa.jarak_rumah_km !== undefined ? `${siswa.jarak_rumah_km} km` : '-'}
                          </td>
                          <td style={{ padding: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: statusActive ? '#DCFCE7' : '#FEE2E2',
                                color: statusActive ? '#15803D' : '#B91C1C',
                              }}
                            >
                              {statusActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td style={{ padding: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            {tglDaftarText}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F1F5F9', fontWeight: 800 }}>
                    <td
                      colSpan={14}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #CBD5E1',
                        color: '#0F172A',
                        fontSize: '0.82rem',
                      }}
                    >
                      TOTAL WARGA BELAJAR DITERIMA: {totalSiswa} Siswa (Paket A: {countPaketA} | Paket B: {countPaketB} | Paket C: {countPaketC})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Bagian Pengesahan / Tanda Tangan */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ textAlign: 'center', minWidth: '240px' }}>
                <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>
                  Tangerang, {formatTanggalDokumen()}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginTop: 2,
                  }}
                >
                  Mengetahui,
                  <br />
                  Kepala PKBM Bina Mandiri
                </div>
                {/* Spasi tanda tangan dan cap */}
                <div style={{ height: '65px' }} />
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    color: '#0F172A',
                  }}
                >
                  Dra. Hj. Siti Rohmah, M.Pd
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                  NIP / NUPTK: 197408152008012004
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. Footer Modal */}
        {/* ======================================================== */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Menampilkan data sesuai filter yang aktif ({data.length} warga belajar)
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tutup Pratinjau
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: downloading ? 'not-allowed' : 'pointer',
              }}
            >
              <i className="bi bi-download" />
              <span>Unduh File Excel Langsung</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

