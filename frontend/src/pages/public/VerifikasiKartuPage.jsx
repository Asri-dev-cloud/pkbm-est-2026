// ============================================================
// src/pages/public/VerifikasiKartuPage.jsx
// Halaman Publik Validasi Keaslian Kartu Pelajar Digital
// Diakses saat memindai QR Code di Kartu Pelajar Warga Belajar
// ============================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  GraduationCap,
  ArrowLeft,
  Search,
  ExternalLink,
  IdCard,
  UserCheck
} from 'lucide-react';
import { SiswaAPI, toAssetUrl } from '../../services/api.js';

function VerifikasiKartuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nisParam = searchParams.get('nis') || '';

  const [nisInput, setNisInput] = useState(nisParam);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!nisParam);
  const [error, setError] = useState('');
  const [waktuVerifikasi, setWaktuVerifikasi] = useState('');

  const fetchVerifikasi = async (nis) => {
    if (!nis || !nis.trim()) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await SiswaAPI.verifikasiKartuPublik(nis.trim());
      setData(res.data?.data);
      setWaktuVerifikasi(new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    } catch (err) {
      setData(null);
      setError(
        err.response?.data?.message ||
        `Data Warga Belajar dengan NIS "${nis}" tidak ditemukan di database resmi PKBM Bina Mandiri.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nisParam) {
      setNisInput(nisParam);
      fetchVerifikasi(nisParam);
    }
  }, [nisParam]);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (nisInput.trim()) {
      setSearchParams({ nis: nisInput.trim() });
    }
  };

  const labelJenjang = {
    paket_a: 'Paket A (Setara SD)',
    paket_b: 'Paket B (Setara SMP)',
    paket_c: 'Paket C (Setara SMA)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #EFF6FF 0%, #F8FAFC 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 12 }}>
            <img
              src="/images/logo new.png"
              alt="Logo PKBM"
              style={{ width: 48, height: 48, objectFit: 'contain' }}
              onError={(e) => { e.target.src = '/favicon.svg'; }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-heading, sans-serif)', letterSpacing: '0.02em' }}>
                PKBM BINA MANDIRI
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                Sistem Verifikasi Kartu Pelajar Digital
              </div>
            </div>
          </Link>
        </div>

        {/* Input Pencarian NIS Manual */}
        <form onSubmit={handleSubmitSearch} style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', gap: 8, background: '#FFFFFF', padding: 6, borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1.5px solid #E2E8F0' }}>
            <input
              type="text"
              placeholder="Masukkan Nomor Induk Siswa (Contoh: PKBM-2026-0001)..."
              value={nisInput}
              onChange={(e) => setNisInput(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px 14px',
                fontSize: '0.9rem',
                color: '#0F172A',
                fontWeight: 600,
              }}
            />
            <button
              type="submit"
              disabled={loading || !nisInput.trim()}
              style={{
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '0 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Search size={16} />
              <span>Verifikasi</span>
            </button>
          </div>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', borderRadius: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
              Memvalidasi data Warga Belajar...
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Menghubungkan ke Pangkalan Data PKBM Bina Mandiri
            </div>
          </div>
        )}

        {/* Hasil Error / Tidak Ditemukan */}
        {!loading && error && (
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(220, 38, 38, 0.08)', border: '1.5px solid #FECACA' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
              Data Tidak Terverifikasi
            </h2>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              {error}
            </p>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Pastikan NIS yang dimasukkan sudah benar atau hubungi layanan sekretariat PKBM Bina Mandiri.
            </div>
          </div>
        )}

        {/* Hasil Berhasil Terverifikasi */}
        {!loading && data && (
          <div style={{ background: '#FFFFFF', borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)', border: '1.5px solid #E2E8F0' }}>

            {/* Banner Sukses */}
            <div style={{ background: data.is_aktif ? 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)', color: '#FFFFFF', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                {data.is_aktif ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', letterSpacing: '0.02em' }}>
                {data.is_aktif ? 'KARTU PELAJAR RESMI TERVERIFIKASI' : 'KARTU PELAJAR NONAKTIF / ALUMNI'}
              </h2>
              <div style={{ fontSize: '0.825rem', opacity: 0.9 }}>
                Pusat Kegiatan Belajar Masyarakat (PKBM) Bina Mandiri • NPSN: {data.npsn}
              </div>
            </div>

            {/* Body Info Siswa */}
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', marginBottom: '1.25rem' }}>
                <div style={{ width: 72, height: 92, borderRadius: 10, overflow: 'hidden', background: '#F1F5F9', border: '2px solid #E2E8F0', flexShrink: 0 }}>
                  {data.foto_profil ? (
                    <img
                      src={toAssetUrl(data.foto_profil)}
                      alt={data.nama_lengkap}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div style={{ width: '100%', height: '100%', display: data.foto_profil ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', background: '#1D4ED8', color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 800 }}>
                    {data.nama_lengkap?.charAt(0)?.toUpperCase()}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Nama Warga Belajar
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: '2px 0 6px', textTransform: 'uppercase' }}>
                    {data.nama_lengkap}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8' }}>NIS:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#1E40AF' }}>{data.nis}</span>
                  </div>
                </div>
              </div>

              {/* Tabel Rincian Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>Program Kesetaraan</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {labelJenjang[data.jenjang] || data.jenjang}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>Rombongan Belajar</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {data.nama_rombel}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>Tahun Ajaran</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {data.nama_tahun_ajaran}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>Status Keaktifan</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: data.is_aktif ? '#16A34A' : '#DC2626', marginTop: 2 }}>
                    {data.status_kartu}
                  </div>
                </div>
              </div>

              {/* Timestamp & Legalitas */}
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div>Kepala PKBM Bina Mandiri: <strong style={{ color: '#0F172A' }}>Indrayani, S.S.,M.Pd.</strong></div>
                <div style={{ color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} /> Terverifikasi Sah
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px dashed #E2E8F0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div>Waktu Pengecekan: <strong>{waktuVerifikasi}</strong></div>
                <div style={{ color: '#64748B' }}>
                  Sistem Informasi Akademik PKBM Bina Mandiri
                </div>
              </div>
            </div>

            {/* Footer Aksi */}
            <div style={{ background: '#F8FAFC', padding: '1rem 1.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Link to="/" style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={15} /> Beranda PKBM
              </Link>
              <Link to="/login" style={{ color: '#1D4ED8', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Masuk ke Ruang Belajar <ExternalLink size={14} />
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default VerifikasiKartuPage;

