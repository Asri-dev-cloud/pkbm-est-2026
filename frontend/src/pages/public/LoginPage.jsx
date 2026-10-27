// ============================================================
// src/pages/public/LoginPage.jsx — Halaman Login Modern
// Tema: Deep Forest Pine (#022c22) & Vibrant Emerald (#059669)
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthAPI } from '../../services/api';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();

  // State input
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // State UI
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await AuthAPI.login(email, password);

      if (!response.data.success) {
        setError(response.data.message || "Email atau password salah.");
        return;
      }

      const { token, user } = response.data.data;

      // Simpan token dan user
      localStorage.setItem("pkbm_token", token);
      localStorage.setItem("pkbm_user", JSON.stringify(user));

      navigate("/dashboard");

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Tidak dapat terhubung ke server backend. Periksa konfigurasi API atau pastikan server aktif."
          : "Login gagal. Periksa kembali email dan password Anda.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      
      {/* ═ LEFT SIDE - BRANDING GRADIENT ═ */}
      <div className="login-branding">
        <div className="login-branding-container">
          <div className="login-branding-icon">
            <GraduationCap size={52} />
          </div>
          <div className="login-branding-info">
            <h2 className="login-branding-tagline">PKBM Bina Mandiri</h2>
            <p className="login-branding-subtext">
              Pendidikan Kesetaraan Inklusif, Modern, dan Terakreditasi Resmi Kemendikbud
            </p>
          </div>
          <div className="login-branding-badges">
            <span className="login-badge-pill">✦ Paket A, B, dan C</span>
            <span className="login-badge-pill">✦ Sistem LMS Digital</span>
            <span className="login-badge-pill">✦ Seluruh Indonesia</span>
          </div>
        </div>
      </div>

      {/* ═ RIGHT SIDE - LOGIN FORM ═ */}
      <div className="login-form-section">
        <div className="login-card">

          {/* ═ HEADER ═ */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 9999, color: '#047857', fontSize: '0.75rem', fontWeight: 700, marginBottom: 12 }}>
              <ShieldCheck size={14} />
              <span>Portal Akses Aman</span>
            </div>
            <h2>Selamat Datang</h2>
            <p>Silakan masuk untuk mengakses portal dan ruang belajar Anda.</p>
          </div>

          {/* ═ ERROR ALERT ═ */}
          {error && (
            <div className="alert alert-danger">
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ═ FORM ═ */}
          <form onSubmit={handleLogin} style={{ marginBottom: 24 }}>

            {/* Email Input */}
            <div className="form-group">
              <label>
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="nama@example.com"
              />
            </div>

            {/* Password Input */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input"
                  style={{ paddingRight: "44px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="input-icon-right"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner-sm" />
                  Memproses...
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* ═ FOOTER LINK ═ */}
          <div className="login-card-footer">
            Belum punya akun?{" "}
            <Link to="/daftar">
              Daftar sebagai siswa baru
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
