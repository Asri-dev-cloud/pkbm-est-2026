// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login & Portal SPMB
// Tema: Biru (Midnight Navy & Royal Blue), Putih, Kuning, Hitam
// Tampilan modern, elegan, responsif dengan logo resmi PKBM
// dan penanganan status verifikasi calon Warga Belajar (SPMB)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  MessageCircle,
  FileText,
  UserCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AuthAPI, SpmbAPI } from '../../services/api';
import './LoginPage.css';

const WA_ADMIN_NUMBER = '6282318383605';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'cek_spmb'
  const [activeTab, setActiveTab] = useState('login');

  // State Input Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // State UI Login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State Khusus Deteksi Calon Siswa (SPMB)
  const [spmbStatusData, setSpmbStatusData] = useState(null);

  // State Pencarian Status Mandiri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingSpmb, setSearchingSpmb] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Periksa apakah ada parameter URL (misal: ?cek_spmb=12 atau ?email=...)
  // atau data pendaftaran terakhir di localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cekId = params.get('cek_spmb') || params.get('id');
    const paramEmail = params.get('email');

    if (cekId || paramEmail) {
      setActiveTab('cek_spmb');
      const query = cekId || paramEmail;
      setSearchQuery(query);
      lakukanCekStatus(query);
    } else {
      // Cek apakah baru saja mendaftar di perangkat ini
      try {
        const lastSpmbStr = localStorage.getItem('pkbm_last_spmb');
        if (lastSpmbStr) {
          const last = JSON.parse(lastSpmbStr);
          if (last?.email && !email) {
            setEmail(last.email);
          }
        }
      } catch (e) {
        // Abaikan
      }
    }
  }, [location.search]);

  // Fungsi helper cek status pendaftaran mandiri
  const lakukanCekStatus = async (q) => {
    const keyword = String(q || searchQuery).trim();
    if (!keyword) {
      setSearchError('Silakan masukkan nama lengkap, alamat email, atau nomor pendaftaran Anda.');
      return;
    }

    setSearchingSpmb(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await SpmbAPI.cekStatusPublik(keyword);
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        setSearchResult(item);

        // Update cache localStorage dengan data live terbaru
        try {
          const lastStr = localStorage.getItem('pkbm_last_spmb');
          if (lastStr) {
            const last = JSON.parse(lastStr);
            if (
              String(last?.id) === String(item.id) ||
              last?.email?.toLowerCase() === item.email?.toLowerCase() ||
              last?.nama_lengkap?.toLowerCase() === item.nama_lengkap?.toLowerCase()
            ) {
              localStorage.setItem(
                'pkbm_last_spmb',
                JSON.stringify({
                  ...last,
                  id: item.id,
                  nama_lengkap: item.nama_lengkap,
                  email: item.email,
                  status: item.status,
                  nis: item.nis,
                  nama_rombel: item.nama_rombel
                })
              );
            }
          }
        } catch {
          // Abaikan error cache
        }
      } else {
        setSearchError(res.data?.message || 'Data pendaftaran tidak ditemukan.');
      }
    } catch (err) {
      // Fallback periksa localStorage jika offline atau kendala jaringan
      try {
        const lastStr = localStorage.getItem('pkbm_last_spmb');
        if (lastStr) {
          const last = JSON.parse(lastStr);
          if (
            last?.email?.toLowerCase() === keyword.toLowerCase() ||
            last?.nama_lengkap?.toLowerCase().includes(keyword.toLowerCase()) ||
            String(last?.id) === keyword
          ) {
            setSearchResult({
              id: last.id,
              nama_lengkap: last.nama_lengkap || 'Calon Warga Belajar',
              email: last.email,
              email_masked: last.email,
              jenjang_daftar: last.jenjang_daftar || 'paket_c',
              status: last.status || 'pending',
              created_at: last.registeredAt || new Date().toISOString(),
              berkas: []
            });
            return;
          }
        }
      } catch {
        // Abaikan
      }

      const msg = err.response?.data?.message || `Data pendaftaran tidak ditemukan untuk "${keyword}".`;
      setSearchError(msg);
    } finally {
      setSearchingSpmb(false);
    }
  };

  // Helper fokus ke input password saat calon siswa diterima
  const focusPasswordInput = () => {
    setTimeout(() => {
      const el = document.getElementById('login-password-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  // Handler Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSpmbStatusData(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password.trim()) {
      setError('Email dan password akun wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthAPI.login(emailTrim, password);

      if (!response.data?.success) {
        setError(response.data?.message || 'Email atau password yang Anda masukkan salah.');
        return;
      }

      const { token, user } = response.data.data;

      // Simpan sesi ke localStorage
      localStorage.setItem('pkbm_token', token);
      localStorage.setItem('pkbm_user', JSON.stringify(user));

      // Redirect ke dashboard
      navigate('/dashboard');

    } catch (err) {
      const resData = err.response?.data;

      // 1. Backend merespon secara eksplisit bahwa user adalah calon siswa SPMB
      if (resData?.is_spmb) {
        setSpmbStatusData({
          status: resData.spmb_status || 'pending',
          id: resData.pendaftar_id,
          nama: resData.nama_lengkap || 'Calon Warga Belajar',
          jenjang: resData.jenjang_daftar,
          message: resData.message,
          catatan: resData.catatan
        });
        setLoading(false);
        return;
      }

      // 2. Cek apakah email ini terdaftar di SPMB via API publik untuk status live terbaru
      try {
        const spmbCheck = await SpmbAPI.cekStatusPublik(emailTrim);
        if (spmbCheck.data?.success && spmbCheck.data?.data) {
          const spmb = spmbCheck.data.data;
          setSpmbStatusData({
            status: spmb.status,
            id: spmb.id,
            nama: spmb.nama_lengkap,
            jenjang: spmb.jenjang_daftar,
            message: spmb.status === 'pending'
              ? `Pendaftaran atas nama "${spmb.nama_lengkap}" (No. #${spmb.id}) saat ini MASIH DALAM PROSES VERIFIKASI BERKAS oleh Tim Admin TU PKBM Bina Mandiri. Akun Ruang Belajar akan otomatis aktif setelah pendaftaran Anda disetujui.`
              : spmb.status === 'ditolak'
                ? `Pendaftaran atas nama "${spmb.nama_lengkap}" (No. #${spmb.id}) belum dapat disetujui. Silakan hubungi Admin TU.`
                : `Pendaftaran atas nama "${spmb.nama_lengkap}" telah DITERIMA oleh Admin TU! Akun Ruang Belajar Anda sedang disinkronkan. Silakan periksa kembali password yang Anda masukkan atau hubungi Admin TU.`,
            catatan: spmb.catatan_verifikasi
          });
          setLoading(false);
          return;
        }
      } catch {
        // Lanjutkan ke pesan error standar jika bukan calon SPMB
      }

      const msg =
        resData?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif dan stabil.'
          : 'Login gagal. Email atau password tidak sesuai. Jika Anda baru saja mendaftar, akun Anda mungkin masih dalam antrean verifikasi Admin TU.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper jenjang label
  const getJenjangLabel = (jenjang) => {
    switch (jenjang) {
      case 'paket_a': return 'Paket A (Setara SD)';
      case 'paket_b': return 'Paket B (Setara SMP)';
      case 'paket_c': return 'Paket C (Setara SMA)';
      default: return jenjang || 'Pendidikan Kesetaraan';
    }
  };

  // Helper URL WhatsApp Konfirmasi
  const getWaUrl = (id, nama) => {
    const text = encodeURIComponent(
      `Halo Tim Admin TU PKBM Bina Mandiri, saya ingin konfirmasi pendaftaran online saya:\n` +
      `- Nama: ${nama || email}\n` +
      `- No. Pendaftaran: #${id || 'SPMB'}\n` +
      `- Email: ${email}\n` +
      `Mohon bantuan verifikasi berkas agar saya dapat mengakses Ruang Belajar. Terima kasih!`
    );
    return `https://wa.me/${WA_ADMIN_NUMBER}?text=${text}`;
  };

  return (
    <div className="login-page-wrap">
      {/* ═ TOP BAR NAVIGATION ═ */}
      <header className="login-topbar">
        <div className="login-topbar-inner">
          <Link to="/" className="login-topbar-back">
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="login-topbar-right">
            <span className="login-topbar-link">
              Belum punya akun? <Link to="/daftar"><strong>Daftar Siswa Baru</strong></Link>
            </span>
          </div>
        </div>
      </header>

      {/* ═ HERO BANNER ═ */}
      <section className="login-hero">
        <div className="login-hero-content">

          {/* Logo Resmi PKBM Menggantikan Icon Lama */}
          <div className="login-hero-logo-box">
            <img
              src="/images/logo_pkbm.png"
              alt="Logo PKBM Bina Mandiri"
              className="login-brand-logo"
            />
          </div>

          <h1 className="login-hero-title">Masuk ke Ruang Belajar</h1>
          <p className="login-hero-subtitle">
            Akses sistem pembelajaran interaktif, materi modul, tugas mandiri, absensi kelas, dan administrasi akademik PKBM Bina Mandiri.
          </p>
        </div>
      </section>

      {/* ═ MAIN CONTAINER ═ */}
      <main className="login-main-container">
        <div className="login-master-card">

          {/* Tab Navigasi Mode */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setError('');
              }}
            >
              <Lock size={16} />
              <span>Masuk Akun</span>
            </button>
            <button
              type="button"
              className={`login-tab-btn ${activeTab === 'cek_spmb' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('cek_spmb');
                setSpmbStatusData(null);
                if (email && !searchQuery) setSearchQuery(email);
              }}
            >
              <Search size={16} />
              <span>Cek Status SPMB</span>
            </button>
          </div>

          {/* ════════════════════════════════════════════════════ */}
          {/* TAB 1: FORM LOGIN AKUN */}
          {/* ════════════════════════════════════════════════════ */}
          {activeTab === 'login' && (
            <div className="login-tab-content">
              <div className="login-card-header">
                <h2 className="login-card-title">Selamat Datang Kembali</h2>
                <p className="login-card-subtitle">
                  Silakan masukkan email dan password akun Anda untuk melanjutkan ke dashboard.
                </p>
              </div>

              {/* ── KOTAK KHUSUS STATUS SPMB (Jika Pendaftar Mencoba Login Sebelum Disetujui) ── */}
              {spmbStatusData && (
                <div className={`login-spmb-status-card status-${spmbStatusData.status}`}>
                  <div className="login-spmb-status-head">
                    <div className="login-spmb-icon-wrap">
                      {spmbStatusData.status === 'pending' && <Clock size={20} className="icon-pulse" />}
                      {spmbStatusData.status === 'diterima' && <CheckCircle2 size={20} />}
                      {spmbStatusData.status === 'ditolak' && <XCircle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="login-spmb-status-badge">
                        {spmbStatusData.status === 'pending' && 'STATUS: MENUNGGU VERIFIKASI ADMIN TU'}
                        {spmbStatusData.status === 'diterima' && 'STATUS: RESMI DITERIMA & AKUN AKTIF'}
                        {spmbStatusData.status === 'ditolak' && 'STATUS: DOKUMEN PERLU PERBAIKAN'}
                      </div>
                      <h4 className="login-spmb-title">
                        {spmbStatusData.status === 'pending'
                          ? 'Pendaftaran Anda Sedang Ditinjau'
                          : spmbStatusData.status === 'diterima'
                            ? 'Selamat, Pendaftaran Anda Telah Disetujui!'
                            : 'Pemberitahuan Status Pendaftaran'}
                      </h4>
                    </div>
                  </div>

                  <p className="login-spmb-message">
                    {spmbStatusData.status === 'diterima'
                      ? `Pendaftaran atas nama "${spmbStatusData.nama}" telah DISETUJUI oleh Admin TU PKBM Bina Mandiri. Akun Ruang Belajar Anda sudah aktif dan siap digunakan.`
                      : spmbStatusData.status === 'pending'
                        ? `Data dan berkas pendaftaran atas nama "${spmbStatusData.nama}" telah berhasil kami terima. Staf Tata Usaha sedang meneliti kelengkapan dokumen persyaratan Anda.`
                        : spmbStatusData.message}
                  </p>

                  {/* Stepper Progress khusus status MENUNGGU (Tanpa Pill) */}
                  {spmbStatusData.status === 'pending' && (
                    <div className="login-spmb-stepper">
                      <div className="login-spmb-step-item done">
                        <strong>1. Formulir</strong>
                        <span>Tersimpan di Sistem</span>
                      </div>
                      <div className="login-spmb-step-item active">
                        <strong>2. Verifikasi TU</strong>
                        <span>Sedang Ditinjau</span>
                      </div>
                      <div className="login-spmb-step-item">
                        <strong>3. Akses Kelas</strong>
                        <span>Setelah Disetujui</span>
                      </div>
                    </div>
                  )}

                  {/* Panduan langsung untuk status DITERIMA (Tanpa Pill) */}
                  {spmbStatusData.status === 'diterima' && (
                    <div className="login-spmb-instruction">
                      <Lock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <strong>Silakan Masukkan Password Anda:</strong>
                        <div>Ketik password akun Anda pada form di bawah ini untuk langsung mengakses Dashboard Ruang Belajar.</div>
                      </div>
                    </div>
                  )}

                  {/* Tabular Details Grid (Tanpa Pill) */}
                  <div className="login-spmb-details-grid">
                    <div className="login-spmb-detail-row">
                      <span className="label">Nomor Registrasi:</span>
                      <strong className="val">#{String(spmbStatusData.id || '').padStart(6, '0')}</strong>
                    </div>
                    <div className="login-spmb-detail-row">
                      <span className="label">Nama Calon Siswa:</span>
                      <strong className="val">{spmbStatusData.nama}</strong>
                    </div>
                    {spmbStatusData.jenjang && (
                      <div className="login-spmb-detail-row">
                        <span className="label">Jenjang Pendidikan:</span>
                        <strong className="val">{getJenjangLabel(spmbStatusData.jenjang)}</strong>
                      </div>
                    )}
                    <div className="login-spmb-detail-row">
                      <span className="label">Status Akun:</span>
                      <strong className="val" style={{ color: spmbStatusData.status === 'diterima' ? '#16A34A' : '#D97706' }}>
                        {spmbStatusData.status === 'diterima' ? 'Aktif (Siap Login)' : 'Menunggu Verifikasi'}
                      </strong>
                    </div>
                  </div>

                  {spmbStatusData.catatan && (
                    <div className="login-spmb-catatan">
                      <strong>Catatan Tim Verifikator:</strong> "{spmbStatusData.catatan}"
                    </div>
                  )}

                  {/* Action Buttons (Tanpa Pill) */}
                  <div className="login-spmb-actions">
                    {spmbStatusData.status === 'diterima' && (
                      <button
                        type="button"
                        onClick={focusPasswordInput}
                        className="login-btn-primary-action"
                      >
                        <Lock size={15} />
                        <span>Isi Password & Masuk</span>
                      </button>
                    )}

                    <a
                      href={getWaUrl(spmbStatusData.id, spmbStatusData.nama)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="login-btn-wa"
                    >
                      <MessageCircle size={15} />
                      <span>Hubungi Admin TU via WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('cek_spmb');
                        const queryVal = (email || '').trim() || String(spmbStatusData.id);
                        setSearchQuery(queryVal);
                        lakukanCekStatus(queryVal);
                      }}
                      className="login-btn-detail-spmb"
                    >
                      <FileText size={15} />
                      <span>Lihat Rincian Berkas</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alert Error Reguler */}
              {error && !spmbStatusData && (
                <div className="login-alert">
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <strong>Gagal Masuk:</strong> {error}
                    <div style={{ marginTop: 8, fontSize: '0.82rem', opacity: 0.9 }}>
                      Baru saja mendaftar siswa baru online?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('cek_spmb');
                          if (email) {
                            setSearchQuery(email);
                            lakukanCekStatus(email);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--login-blue-royal)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Cek status pendaftaran Anda di sini →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Input Login */}
              <form onSubmit={handleLogin}>
                {/* Email Field */}
                <div className="login-form-group">
                  <label className="login-label">
                    Alamat Email Terdaftar <span className="login-req">*</span>
                  </label>
                  <div className="login-input-wrapper">
                    <Mail size={18} className="login-input-icon" />
                    <input
                      type="email"
                      className="login-input"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading}
                      required
                      placeholder="nama@email.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-form-group" style={{ marginBottom: 26 }}>
                  <div className="login-label-row">
                    <label className="login-label" style={{ marginBottom: 0 }}>
                      Password Akun <span className="login-req">*</span>
                    </label>
                    <span className="login-label-hint">
                      Min. 8 karakter
                    </span>
                  </div>
                  <div className="login-input-wrapper">
                    <Lock size={18} className="login-input-icon" />
                    <input
                      id="login-password-input"
                      type={showPass ? 'text' : 'password'}
                      className="login-input"
                      style={{ paddingRight: 44 }}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      disabled={loading}
                      className="login-input-toggle"
                      aria-label="Toggle password visibility"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="login-spinner" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Ruang Belajar</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Bantuan Pendaftar Baru */}
              <div className="login-info-box">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <UserCheck size={18} color="var(--login-blue-royal)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                    <strong>Calon Warga Belajar Baru?</strong> Setelah formulir pendaftaran disimpan, berkas Anda akan diperiksa oleh Admin TU. Akun Ruang Belajar langsung aktif setelah disetujui.
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="login-card-footer">
                Belum terdaftar sebagai warga belajar?{' '}
                <Link to="/daftar">
                  <strong>Daftar Siswa Baru di Sini →</strong>
                </Link>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* TAB 2: CEK STATUS PENDAFTARAN SPMB */}
          {/* ════════════════════════════════════════════════════ */}
          {activeTab === 'cek_spmb' && (
            <div className="login-tab-content">
              <div className="login-card-header">
                <h2 className="login-card-title">Cek Status Pendaftaran</h2>
                <p className="login-card-subtitle">
                  Pantau proses verifikasi berkas dan persetujuan akun calon siswa baru PKBM Bina Mandiri.
                </p>
              </div>

              {/* Form Search Status */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lakukanCekStatus();
                }}
                className="login-search-form"
              >
                <div className="login-form-group">
                  <label className="login-label">
                    Nama Lengkap, Email, atau Nomor Pendaftaran
                  </label>
                  <div className="login-input-wrapper">
                    <Search size={18} className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Contoh: Asri Hartini, nama@email.com, atau #8"
                      disabled={searchingSpmb}
                    />
                  </div>

                  {/* Suggestion Chip dari Pendaftaran Terakhir */}
                  {(() => {
                    try {
                      const lastStr = localStorage.getItem('pkbm_last_spmb');
                      if (lastStr) {
                        const last = JSON.parse(lastStr);
                        if (last?.nama_lengkap) {
                          return (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--spmb-text-sub)' }}>
                                Pendaftaran tersimpan:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery(last.nama_lengkap);
                                  lakukanCekStatus(last.nama_lengkap);
                                }}
                                style={{
                                  background: 'rgba(29, 78, 216, 0.1)',
                                  color: 'var(--spmb-blue-royal)',
                                  border: '1px solid rgba(29, 78, 216, 0.25)',
                                  borderRadius: 4,
                                  padding: '2px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {last.nama_lengkap} (#{last.id})
                              </button>
                            </div>
                          );
                        }
                      }
                    } catch {
                      return null;
                    }
                  })()}
                </div>

                <button
                  type="submit"
                  disabled={searchingSpmb || !searchQuery.trim()}
                  className="login-btn-search"
                >
                  {searchingSpmb ? (
                    <>
                      <div className="login-spinner small" />
                      <span>Memeriksa Status...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Periksa Status Pendaftaran</span>
                    </>
                  )}
                </button>
              </form>

              {/* Search Error */}
              {searchError && (
                <div className="login-alert" style={{ marginTop: 18 }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Pencarian:</strong> {searchError}
                  </div>
                </div>
              )}

              {/* Search Result Box (Tanpa Pill) */}
              {searchResult && (
                <div className={`login-spmb-status-card status-${searchResult.status}`} style={{ marginTop: 20 }}>
                  <div className="login-spmb-status-head">
                    <div className="login-spmb-icon-wrap">
                      {searchResult.status === 'pending' && <Clock size={20} className="icon-pulse" />}
                      {searchResult.status === 'diterima' && <CheckCircle2 size={20} />}
                      {searchResult.status === 'ditolak' && <XCircle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="login-spmb-status-badge">
                        {searchResult.status === 'pending' && 'STATUS: MENUNGGU VERIFIKASI ADMIN TU'}
                        {searchResult.status === 'diterima' && 'STATUS: RESMI DITERIMA & AKUN AKTIF'}
                        {searchResult.status === 'ditolak' && 'STATUS: DITOLAK / PERLU PERBAIKAN'}
                      </div>
                      <h4 className="login-spmb-title">
                        #{String(searchResult.id).padStart(6, '0')} — {searchResult.nama_lengkap}
                      </h4>
                    </div>
                  </div>

                  {/* Stepper khusus status MENUNGGU di Tab Cek Status */}
                  {searchResult.status === 'pending' && (
                    <div className="login-spmb-stepper">
                      <div className="login-spmb-step-item done">
                        <strong>1. Formulir</strong>
                        <span>Tersimpan di Sistem</span>
                      </div>
                      <div className="login-spmb-step-item active">
                        <strong>2. Verifikasi TU</strong>
                        <span>Sedang Ditinjau</span>
                      </div>
                      <div className="login-spmb-step-item">
                        <strong>3. Akses Belajar</strong>
                        <span>Setelah Disetujui</span>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="login-spmb-details-grid">
                    <div className="login-spmb-detail-row">
                      <span className="label">Jenjang Pendidikan:</span>
                      <strong className="val">{getJenjangLabel(searchResult.jenjang_daftar)}</strong>
                    </div>
                    <div className="login-spmb-detail-row">
                      <span className="label">Tahun Ajaran:</span>
                      <strong className="val">{searchResult.tahun_ajaran || '2025/2026'}</strong>
                    </div>
                    <div className="login-spmb-detail-row">
                      <span className="label">Nomor Induk Siswa:</span>
                      <strong className="val" style={{ color: searchResult.status === 'diterima' ? '#16A34A' : undefined }}>
                        {searchResult.nis || (searchResult.status === 'diterima' ? 'Terdaftar Resmi' : 'Menunggu')}
                      </strong>
                    </div>
                    <div className="login-spmb-detail-row">
                      <span className="label">Tanggal Registrasi:</span>
                      <strong className="val">
                        {searchResult.created_at
                          ? new Date(searchResult.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                          : '-'}
                      </strong>
                    </div>
                  </div>

                  {/* Keterangan Berdasarkan Status */}
                  <div className="login-spmb-info-text">
                    {searchResult.status === 'pending' && (
                      <p>
                        Data pendaftaran dan dokumen Anda atas nama <strong>{searchResult.nama_lengkap}</strong> telah tersimpan aman. Staf Tata Usaha sedang meneliti kelengkapan berkas Anda. Jika ada kekurangan dokumen, staf kami akan segera menghubungi Anda.
                      </p>
                    )}
                    {searchResult.status === 'diterima' && (
                      <p>
                        🎉 <strong>Selamat {searchResult.nama_lengkap}!</strong> Pendaftaran Anda telah <strong>DISETUJUI</strong> oleh Tim Admin TU PKBM Bina Mandiri. Akun Ruang Belajar Anda sudah aktif dan terdaftar sebagai Warga Belajar resmi. Silakan masuk menggunakan email dan password yang Anda daftarkan.
                      </p>
                    )}
                    {searchResult.status === 'ditolak' && (
                      <p>
                        Pendaftaran atas nama {searchResult.nama_lengkap} belum dapat kami terima. {searchResult.catatan_verifikasi && `Catatan: "${searchResult.catatan_verifikasi}". `} Silakan hubungi kontak layanan kami untuk info perbaikan berkas.
                      </p>
                    )}
                  </div>

                  {/* Berkas Upload Status */}
                  {Array.isArray(searchResult.berkas) && searchResult.berkas.length > 0 && (
                    <div className="login-spmb-berkas-list">
                      <div className="login-spmb-berkas-head">Status Berkas Dokumen:</div>
                      {searchResult.berkas.map((b, idx) => (
                        <div key={idx} className="login-spmb-berkas-item">
                          <span className="name">
                            📄 {b.jenis_berkas?.toUpperCase() || 'Dokumen'}
                          </span>
                          <span className={`badge ${b.status_verifikasi || 'pending'}`}>
                            {b.status_verifikasi === 'valid'
                              ? '✓ Valid'
                              : b.status_verifikasi === 'tidak_valid'
                                ? '✗ Tidak Valid'
                                : '⏳ Antrean'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Action Buttons (Tanpa Pill) */}
                  <div className="login-spmb-actions">
                    {searchResult.status === 'diterima' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('login');
                          if (searchResult.email) {
                            setEmail(searchResult.email);
                          }
                          focusPasswordInput();
                        }}
                        className="login-btn-primary-action"
                      >
                        <Lock size={15} />
                        <span>Masuk ke Ruang Belajar Sekarang →</span>
                      </button>
                    )}

                    <a
                      href={getWaUrl(searchResult.id, searchResult.nama_lengkap)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="login-btn-wa"
                    >
                      <MessageCircle size={15} />
                      <span>Chat WhatsApp Admin TU</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Back to Login Tab Button */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="login-link-btn"
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Form Login</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default LoginPage;
