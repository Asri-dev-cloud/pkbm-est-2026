// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login Modern
// Tema: Biru (Midnight Navy & Royal Blue), Putih, Kuning, Hitam
// Tampilan diselaraskan presisi dengan Halaman Pendaftaran SPMB
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AuthAPI } from '../../services/api';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();

  // State input
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // State UI
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email dan password akun wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthAPI.login(email.trim(), password);

      if (!response.data?.success) {
        setError(response.data?.message || 'Email atau password yang Anda masukkan salah.');
        return;
      }

      const { token, user } = response.data.data;

      // Simpan token dan data user ke localStorage
      localStorage.setItem('pkbm_token', token);
      localStorage.setItem('pkbm_user', JSON.stringify(user));

      // Arahkan ke dashboard router
      navigate('/dashboard');

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Tidak dapat terhubung ke server backend. Pastikan koneksi internet stabil.'
          : 'Login gagal. Periksa kembali email dan password Anda.');
      setError(msg);
    } finally {
      setLoading(false);
    }
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
          <div className="login-hero-pill">
            <Sparkles size={14} />
            <span>Portal Akses Digital Terintegrasi</span>
          </div>
          <div className="login-hero-icon">
            <GraduationCap size={38} />
          </div>
          <h1 className="login-hero-title">Masuk ke Ruang Belajar</h1>
          <p className="login-hero-subtitle">
            Akses sistem pembelajaran online, kelas interaktif, bank materi, tugas mandiri, dan administrasi akademik PKBM Bina Mandiri.
          </p>
        </div>
      </section>

      {/* ═ MAIN CONTAINER ═ */}
      <main className="login-main-container">
        <div className="login-master-card">
          <div className="login-card-header">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--login-blue-light)', border: '1px solid var(--login-blue-subtle)', borderRadius: 9999, color: 'var(--login-blue-royal)', fontSize: '0.78rem', fontWeight: 800, marginBottom: 12 }}>
              <ShieldCheck size={14} />
              <span>Autentikasi Aman & Terenkripsi</span>
            </div>
            <h2 className="login-card-title">Selamat Datang Kembali</h2>
            <p className="login-card-subtitle">
              Silakan masukkan alamat email dan password akun Anda untuk melanjutkan.
            </p>

            <div className="login-roles-bar">
              <span className="login-role-pill">✦ Warga Belajar</span>
              <span className="login-role-pill">✦ Tutor Pengajar</span>
              <span className="login-role-pill">✦ Admin TU</span>
              <span className="login-role-pill">✦ Pimpinan</span>
            </div>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="login-alert">
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Gagal Masuk:</strong> {error}
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="login-form-group">
              <label className="login-label">
                Alamat Email Terdaftar
              </label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group" style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="login-label" style={{ marginBottom: 0 }}>
                  Password Akun
                </label>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Min. 8 karakter
                </span>
              </div>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Card Footer Link */}
          <div className="login-card-footer">
            Belum terdaftar sebagai warga belajar?{' '}
            <Link to="/daftar">
              <strong>Daftar Siswa Baru di Sini →</strong>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
