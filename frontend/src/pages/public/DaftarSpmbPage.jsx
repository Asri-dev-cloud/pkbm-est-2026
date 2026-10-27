// ============================================================
// src/pages/public/DaftarSpmbPage.jsx — Formulir SPMB Publik
// Tema: Biru (Midnight Navy & Royal Blue), Putih, Kuning, Hitam
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  UploadCloud,
  FileText,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { SpmbAPI } from '../../services/api.js';
import './DaftarSpmbPage.css';

const DAFTAR_BERKAS = [
  {
    key: 'kk',
    label: 'Kartu Keluarga (KK)',
    keterangan: 'Format scan / foto JPG, PNG, atau PDF (maks. 10MB)',
    icon: '📄'
  },
  {
    key: 'ijazah',
    label: 'Ijazah Terakhir / Raport / SKL',
    keterangan: 'Ijazah jenjang sebelumnya (SD/SMP) atau dokumen pendukung',
    icon: '📜'
  },
  {
    key: 'foto',
    label: 'Pas Foto 3x4 Terbaru',
    keterangan: 'Foto formal calon siswa dengan latar belakang merah atau biru',
    icon: '🖼️'
  },
];

const JENJANG_PILIHAN = [
  {
    key: 'paket_a',
    title: 'Paket A',
    subtitle: 'Setara SD / MI',
    badge: 'Tingkat Dasar',
    desc: 'Untuk calon warga belajar usia anak atau dewasa yang belum tamat SD.'
  },
  {
    key: 'paket_b',
    title: 'Paket B',
    subtitle: 'Setara SMP / MTs',
    badge: 'Tingkat Pertama',
    desc: 'Untuk lulusan SD yang ingin melanjutkan pendidikan kesetaraan tingkat SMP.'
  },
  {
    key: 'paket_c',
    title: 'Paket C',
    subtitle: 'Setara SMA / SMK',
    badge: 'Tingkat Atas',
    desc: 'Pendidikan kesetaraan SMA resmi untuk kuliah, kerja, atau wirausaha.'
  },
];

function DaftarSpmbPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    nik: '',
    no_telp: '',
    password: '',
    konfirmasi_password: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    jenjang_daftar: 'paket_c',
    alamat: '',
    nama_wali: ''
  });

  const [pendaftarId, setPendaftarId]   = useState(null);
  const [files, setFiles]               = useState({ kk: null, ijazah: null, foto: null });
  const [uploadStatus, setUploadStatus] = useState({ kk: 'idle', ijazah: 'idle', foto: 'idle' });
  const [uploadMsg, setUploadMsg]       = useState({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [copied, setCopied]             = useState(false);
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleJenjangSelect = (jenjangKey) => {
    setForm(prev => ({ ...prev, jenjang_daftar: jenjangKey }));
  };

  const handleFileChange = (key, file) => {
    setFiles(prev => ({ ...prev, [key]: file }));
    setUploadStatus(prev => ({ ...prev, [key]: file ? 'ready' : 'idle' }));
  };

  // ── Step 1: Submit Data Diri ke Backend & Database ──
  const handleSubmitDataDiri = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi data wajib
    const wajib = [
      'nama_lengkap', 'email', 'no_telp', 'password',
      'konfirmasi_password', 'tanggal_lahir', 'jenjang_daftar',
      'alamat', 'nama_wali'
    ];

    for (const field of wajib) {
      if (!String(form[field] || '').trim()) {
        setError('Harap isi semua kolom bertanda bintang (*) sebelum melanjutkan.');
        window.scrollTo({ top: 180, behavior: 'smooth' });
        return;
      }
    }

    if (form.password.length < 8) {
      setError('Password akun minimal 8 karakter demi keamanan.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    if (form.password !== form.konfirmasi_password) {
      setError('Konfirmasi password tidak cocok dengan password yang dibuat.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nama_lengkap: form.nama_lengkap.trim(),
        email: form.email.trim(),
        nik: form.nik ? form.nik.trim() : null,
        no_telp: form.no_telp.trim(),
        password: form.password,
        jenjang_daftar: form.jenjang_daftar,
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        alamat: form.alamat.trim(),
        nama_wali: form.nama_wali.trim()
      };

      const res = await SpmbAPI.daftar(payload);

      if (res.data?.success) {
        const id = res.data.data?.pendaftar_id;
        setPendaftarId(id);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.data?.message || 'Gagal menyimpan data pendaftaran.');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Koneksi ke server gagal. Pastikan jaringan internet aktif.'
          : 'Terjadi kendala saat mengirim data formulir.');
      setError(errMsg);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Upload Berkas ──
  const handleUploadBerkas = async (key) => {
    if (!files[key] || !pendaftarId) return;

    setUploadStatus(prev => ({ ...prev, [key]: 'uploading' }));
    setUploadMsg(prev => ({ ...prev, [key]: '' }));

    try {
      const fd = new FormData();
      fd.append('file', files[key]);
      fd.append('jenis_berkas', key);

      const res = await SpmbAPI.uploadBerkas(pendaftarId, fd);
      if (res.data?.success) {
        setUploadStatus(prev => ({ ...prev, [key]: 'done' }));
        setUploadMsg(prev => ({ ...prev, [key]: 'Berkas berhasil tersimpan.' }));
      } else {
        setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
        setUploadMsg(prev => ({ ...prev, [key]: res.data?.message || 'Gagal mengupload berkas.' }));
      }
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
      setUploadMsg(prev => ({
        ...prev,
        [key]: err.response?.data?.message || 'Gagal mengunggah. Coba lagi.'
      }));
    }
  };

  const handleCopyNumber = () => {
    if (!pendaftarId) return;
    const formatted = `#${String(pendaftarId).padStart(6, '0')}`;
    navigator.clipboard?.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="spmb-page">
      {/* ═ TOP BAR NAVIGATION ═ */}
      <header className="spmb-topbar">
        <div className="spmb-topbar-inner">
          <Link to="/" className="spmb-topbar-back">
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="spmb-topbar-right">
            <span className="spmb-topbar-link">
              Sudah punya akun? <Link to="/login"><strong>Masuk di sini</strong></Link>
            </span>
          </div>
        </div>
      </header>

      {/* ═ HERO BANNER ═ */}
      <section className="spmb-hero">
        <div className="spmb-hero-content">
          <div className="spmb-hero-pill">
            <Sparkles size={14} />
            <span>Penerimaan Warga Belajar Baru T.A. 2026/2027</span>
          </div>
          <div className="spmb-hero-icon">
            <GraduationCap size={38} />
          </div>
          <h1 className="spmb-hero-title">Formulir Pendaftaran Online</h1>
          <p className="spmb-hero-subtitle">
            Pendidikan Kesetaraan Inklusif & Terakreditasi Resmi Kemendikbud: Paket A (SD), Paket B (SMP), dan Paket C (SMA).
          </p>
        </div>
      </section>

      {/* ═ MAIN CONTAINER ═ */}
      <main className="spmb-main-container">
        {/* Step Indicator */}
        <div className="spmb-step-bar">
          <div className={`spmb-step-node ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="spmb-step-badge">
              {step > 1 ? <Check size={18} /> : '1'}
            </div>
            <div>
              <div className="spmb-step-text-title">Data Diri</div>
              <div className="spmb-step-text-sub">Identitas & Akun</div>
            </div>
          </div>

          <div className={`spmb-step-connector ${step > 1 ? 'completed' : ''}`} />

          <div className={`spmb-step-node ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="spmb-step-badge">
              {step > 2 ? <Check size={18} /> : '2'}
            </div>
            <div>
              <div className="spmb-step-text-title">Upload Berkas</div>
              <div className="spmb-step-text-sub">Dokumen Syarat</div>
            </div>
          </div>

          <div className={`spmb-step-connector ${step > 2 ? 'completed' : ''}`} />

          <div className={`spmb-step-node ${step === 3 ? 'active completed' : ''}`}>
            <div className="spmb-step-badge">
              {step === 3 ? '✓' : '3'}
            </div>
            <div>
              <div className="spmb-step-text-title">Selesai</div>
              <div className="spmb-step-text-sub">Nomor Pendaftar</div>
            </div>
          </div>
        </div>

        {/* ══ STEP 1: FORM DATA DIRI ══ */}
        {step === 1 && (
          <div className="spmb-card">
            <div className="spmb-card-header">
              <h2 className="spmb-card-title">
                <User size={22} color="var(--spmb-blue-royal)" />
                Langkah 1: Identitas & Pembuatan Akun
              </h2>
              <p className="spmb-card-subtitle">
                Isi formulir pendaftaran dengan data valid. Kolom bertanda (<span className="spmb-label-req">*</span>) wajib diisi. Akun login Anda akan langsung aktif setelah disimpan.
              </p>
            </div>

            {error && (
              <div className="spmb-alert error">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Terjadi Kesalahan:</strong> {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitDataDiri}>
              {/* Row 1: Nama Lengkap & Email */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Nama Lengkap Siswa <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <User size={18} className="spmb-input-icon" />
                    <input
                      type="text"
                      name="nama_lengkap"
                      value={form.nama_lengkap}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: Muhammad Rizky"
                      className="spmb-input"
                    />
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Alamat Email Aktif <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Mail size={18} className="spmb-input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="nama@email.com"
                      className="spmb-input"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: NIK & No Telepon */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <div className="spmb-input-wrapper">
                    <FileText size={18} className="spmb-input-icon" />
                    <input
                      type="text"
                      name="nik"
                      value={form.nik}
                      onChange={handleChange}
                      maxLength={16}
                      placeholder="16 digit NIK di KTP/KK (Opsional)"
                      className="spmb-input"
                    />
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    No. Handphone / WhatsApp <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Phone size={18} className="spmb-input-icon" />
                    <input
                      type="tel"
                      name="no_telp"
                      value={form.no_telp}
                      onChange={handleChange}
                      required
                      placeholder="08xxxxxxxxxx"
                      className="spmb-input"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Buat Password & Konfirmasi Password */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Buat Password Akun <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Lock size={18} className="spmb-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      placeholder="Minimal 8 karakter"
                      className="spmb-input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      className="spmb-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Konfirmasi Password <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Lock size={18} className="spmb-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="konfirmasi_password"
                      value={form.konfirmasi_password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      placeholder="Ulangi password di atas"
                      className="spmb-input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      className="spmb-input-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Tanggal Lahir & Jenis Kelamin */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Tanggal Lahir <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Calendar size={18} className="spmb-input-icon" />
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={form.tanggal_lahir}
                      onChange={handleChange}
                      required
                      className="spmb-input"
                    />
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Jenis Kelamin <span className="spmb-label-req">*</span>
                  </label>
                  <select
                    name="jenis_kelamin"
                    value={form.jenis_kelamin}
                    onChange={handleChange}
                    required
                    className="spmb-select"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Pilihan Jenjang Pendidikan */}
              <div className="spmb-form-group">
                <label className="spmb-label">
                  Pilih Program Jenjang Kesetaraan <span className="spmb-label-req">*</span>
                </label>
                <div className="spmb-jenjang-grid">
                  {JENJANG_PILIHAN.map(j => (
                    <div
                      key={j.key}
                      className={`spmb-jenjang-card ${form.jenjang_daftar === j.key ? 'selected' : ''}`}
                      onClick={() => handleJenjangSelect(j.key)}
                    >
                      <span className="spmb-jenjang-badge">{j.badge}</span>
                      <div className="spmb-jenjang-title">{j.title}</div>
                      <div className="spmb-jenjang-desc"><strong>{j.subtitle}</strong></div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                        {j.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Alamat Lengkap */}
              <div className="spmb-form-group">
                <label className="spmb-label">
                  Alamat Lengkap Tempat Tinggal <span className="spmb-label-req">*</span>
                </label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  required
                  placeholder="Nama Jalan, No. Rumah, RT/RW, Dusun/Kelurahan, Kecamatan, Kota/Kabupaten"
                  className="spmb-textarea"
                />
              </div>

              {/* Row 7: Nama Orang Tua / Wali */}
              <div className="spmb-form-group">
                <label className="spmb-label">
                  Nama Orang Tua / Wali <span className="spmb-label-req">*</span>
                </label>
                <div className="spmb-input-wrapper">
                  <User size={18} className="spmb-input-icon" />
                  <input
                    type="text"
                    name="nama_wali"
                    value={form.nama_wali}
                    onChange={handleChange}
                    required
                    placeholder="Nama lengkap orang tua / wali siswa"
                    className="spmb-input"
                  />
                </div>
              </div>

              <div className="spmb-alert info" style={{ marginTop: 24 }}>
                <ShieldCheck size={20} color="var(--spmb-blue-royal)" style={{ flexShrink: 0 }} />
                <span>
                  Data pendaftaran Anda akan langsung tersimpan di database sistem PKBM Bina Mandiri.
                  Password yang dibuat akan digunakan untuk masuk ke ruang belajar online.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="spmb-btn spmb-btn-primary spmb-btn-full"
                style={{ marginTop: 8 }}
              >
                {loading ? (
                  <>
                    <div className="spmb-spinner" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Upload Berkas</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ══ STEP 2: UPLOAD BERKAS ══ */}
        {step === 2 && (
          <div className="spmb-card">
            <div className="spmb-card-header">
              <h2 className="spmb-card-title">
                <UploadCloud size={24} color="var(--spmb-blue-royal)" />
                Langkah 2: Upload Berkas Pendukung
              </h2>
              <p className="spmb-card-subtitle">
                Nomor pendaftaran Anda sementara telah tersimpan di sistem: <strong>#{String(pendaftarId).padStart(6, '0')}</strong>.
                Silakan unggah dokumen pendukung untuk kelengkapan berkas verifikasi.
              </p>
            </div>

            <div className="spmb-alert info">
              <Info size={18} style={{ flexShrink: 0 }} />
              <span>
                Jika belum memiliki scan berkas saat ini, Anda tetap dapat <strong>Menyelesaikan Pendaftaran</strong>. Berkas fisik dapat diserahkan langsung ke kantor PKBM atau disusulkan nanti.
              </span>
            </div>

            {/* List Berkas */}
            <div style={{ marginBottom: 28 }}>
              {DAFTAR_BERKAS.map((item) => {
                const status = uploadStatus[item.key];
                const file = files[item.key];
                const msg = uploadMsg[item.key];

                return (
                  <div
                    key={item.key}
                    className={`spmb-upload-item ${status === 'done' ? 'done' : ''}`}
                  >
                    <div className="spmb-upload-top">
                      <div>
                        <div className="spmb-upload-title">
                          <span style={{ marginRight: 8 }}>{item.icon}</span>
                          {item.label}
                        </div>
                        <div className="spmb-upload-desc">{item.keterangan}</div>
                      </div>

                      <div>
                        {status === 'done' && (
                          <span className="spmb-upload-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                            <CheckCircle2 size={14} /> Berhasil
                          </span>
                        )}
                        {status === 'ready' && (
                          <span className="spmb-upload-badge" style={{ background: '#FEF08A', color: '#854D0E' }}>
                            Siap Upload
                          </span>
                        )}
                        {status === 'uploading' && (
                          <span className="spmb-upload-badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                            Mengunggah...
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="spmb-upload-badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                            Upload Gagal
                          </span>
                        )}
                        {status === 'idle' && (
                          <span className="spmb-upload-badge" style={{ background: '#F1F5F9', color: '#64748B' }}>
                            Belum Ada File
                          </span>
                        )}
                      </div>
                    </div>

                    {/* File Input Trigger */}
                    <label className="spmb-upload-drop">
                      <UploadCloud size={20} color="var(--spmb-blue-royal)" />
                      <span>{file ? file.name : `Pilih file ${item.label}`}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(item.key, e.target.files?.[0] || null)}
                        disabled={status === 'uploading' || status === 'done'}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Upload button for this file */}
                    {file && status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleUploadBerkas(item.key)}
                        className="spmb-btn spmb-btn-primary"
                        style={{ width: '100%', marginTop: 12, padding: '10px 16px', fontSize: '0.88rem' }}
                      >
                        <UploadCloud size={16} />
                        Unggah {item.label} Sekarang
                      </button>
                    )}

                    {status === 'error' && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>{msg}</span>
                        <button
                          type="button"
                          onClick={() => handleUploadBerkas(item.key)}
                          className="spmb-btn spmb-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation / Actions */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="spmb-btn spmb-btn-secondary"
                style={{ flex: 1, minWidth: 140 }}
              >
                <ArrowLeft size={16} />
                Kembali ke Data Diri
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="spmb-btn spmb-btn-yellow"
                style={{ flex: 1.5, minWidth: 200 }}
              >
                <span>Selesaikan & Simpan Pendaftaran</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: SUKSES & NOMOR PENDAFTARAN ══ */}
        {step === 3 && (
          <div className="spmb-card">
            <div className="spmb-success-wrap">
              <div className="spmb-success-icon-box">
                <CheckCircle2 size={46} color="var(--spmb-blue-royal)" />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--spmb-black)', marginBottom: 8 }}>
                Pendaftaran Berhasil Tersimpan!
              </h2>

              <p style={{ fontSize: '1rem', color: 'var(--spmb-text-muted)', maxWidth: 520, margin: '0 auto' }}>
                Selamat, formulir Anda telah resmi tercatat di database Sistem Informasi Akademik PKBM Bina Mandiri.
              </p>

              {/* Number Card */}
              <div className="spmb-number-box">
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Nomor Pendaftaran Resmi Anda
                </div>
                <div className="spmb-number-value">
                  #{String(pendaftarId || '').padStart(6, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {copied ? <Check size={14} color="#FACC15" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Nomor Pendaftaran'}</span>
                </button>
              </div>

              {/* Next Steps Guide */}
              <div className="spmb-guide-steps">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--spmb-black)', marginBottom: 14 }}>
                  Tahapan Selanjutnya:
                </h4>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">1</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Verifikasi Berkas:</strong> Tim Tata Usaha akan memverifikasi data dan kelengkapan dokumen Anda dalam 1–3 hari kerja.
                  </div>
                </div>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">2</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Penerbitan NIS & Rombel:</strong> Setelah dinyatakan diterima, Anda akan mendapatkan NIS resmi dan dimasukkan ke rombongan belajar.
                  </div>
                </div>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">3</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Akses Ruang Belajar (LMS):</strong> Anda dapat langsung mencoba masuk ke portal menggunakan email dan password yang baru saja Anda buat.
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
                <Link
                  to="/"
                  className="spmb-btn spmb-btn-secondary"
                  style={{ flex: 1, minWidth: 160 }}
                >
                  <ArrowLeft size={16} />
                  Kembali ke Beranda
                </Link>

                <Link
                  to="/login"
                  className="spmb-btn spmb-btn-primary"
                  style={{ flex: 1.5, minWidth: 200 }}
                >
                  <span>Masuk ke Portal Belajar</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DaftarSpmbPage;