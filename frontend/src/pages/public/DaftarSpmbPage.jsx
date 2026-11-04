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
  AlertCircle,
  MapPin,
  Ruler,
  Scale,
  Users
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
    jarak_rumah_km: '',
    tinggi_badan: '',
    berat_badan: '',
    jumlah_saudara_kandung: '',
    nama_wali: ''
  });

  const [pendaftarId, setPendaftarId] = useState(null);
  const [files, setFiles] = useState({ kk: null, ijazah: null, foto: null });
  const [uploadStatus, setUploadStatus] = useState({ kk: 'idle', ijazah: 'idle', foto: 'idle' });
  const [uploadMsg, setUploadMsg] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleJenjangSelect = (jenjangKey) => {
    setForm(prev => ({ ...prev, jenjang_daftar: jenjangKey }));
  };

  // ── Step 2: Auto-upload Berkas Saat File Dipilih ──
  const handleFileChange = async (key, file) => {
    if (!file) return;

    if (!pendaftarId) {
      alert('ID Pendaftaran belum terdeteksi. Silakan simpan formulir data diri terlebih dahulu.');
      return;
    }

    // Validasi ukuran maks 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFiles(prev => ({ ...prev, [key]: file }));
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
      setUploadMsg(prev => ({ ...prev, [key]: 'Ukuran file melebihi 10MB. Harap gunakan file berukuran lebih kecil.' }));
      return;
    }

    setFiles(prev => ({ ...prev, [key]: file }));
    setUploadStatus(prev => ({ ...prev, [key]: 'uploading' }));
    setUploadMsg(prev => ({ ...prev, [key]: `Mengunggah ${file.name} ke server...` }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('jenis_berkas', key);

      const res = await SpmbAPI.uploadBerkas(pendaftarId, fd);
      if (res.data?.success) {
        setUploadStatus(prev => ({ ...prev, [key]: 'done' }));
        setUploadMsg(prev => ({ ...prev, [key]: `✓ ${file.name} berhasil tersimpan ke sistem!` }));
      } else {
        setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
        setUploadMsg(prev => ({ ...prev, [key]: res.data?.message || 'Gagal mengupload berkas.' }));
      }
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
      setUploadMsg(prev => ({
        ...prev,
        [key]: err.response?.data?.message || 'Gagal mengunggah file. Silakan periksa jaringan dan coba lagi.'
      }));
    }
  };

  const handleSelesaikanPendaftaran = () => {
    const isAnyUploading = Object.values(uploadStatus).some(s => s === 'uploading');
    if (isAnyUploading) {
      alert('Mohon tunggu sebentar, dokumen Anda sedang dalam proses pengunggahan...');
      return;
    }

    const countDone = Object.values(uploadStatus).filter(s => s === 'done').length;
    if (countDone === 0) {
      const lanjut = window.confirm(
        'Perhatian:\n\nAnda belum mengunggah dokumen berkas persyaratan (KK, Ijazah, Pas Foto).\n\n' +
        'Apakah Anda ingin tetap menyelesaikan pendaftaran sekarang?\n' +
        '(Catatan: Dokumen fisik dapat diserahkan langsung ke kantor Tata Usaha PKBM Bina Mandiri atau dikirimkan via WhatsApp agar dibantu unggah oleh Admin).'
      );
      if (!lanjut) return;
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 1: Submit Data Diri ke Backend & Database ──
  const handleSubmitDataDiri = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi data wajib
    const wajib = [
      'nama_lengkap', 'email', 'no_telp', 'password',
      'konfirmasi_password', 'tanggal_lahir', 'jenjang_daftar',
      'alamat', 'jarak_rumah_km', 'tinggi_badan', 'berat_badan',
      'jumlah_saudara_kandung', 'nama_wali'
    ];

    for (const field of wajib) {
      const val = form[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        setError('Harap isi semua kolom bertanda bintang (*) termasuk data Dapodik sebelum melanjutkan.');
        window.scrollTo({ top: 180, behavior: 'smooth' });
        return;
      }
    }

    if (Number(form.tinggi_badan) <= 0 || Number(form.berat_badan) <= 0) {
      setError('Tinggi badan dan berat badan harus berupa angka lebih dari 0.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    if (Number(form.jarak_rumah_km) < 0 || Number(form.jumlah_saudara_kandung) < 0) {
      setError('Jarak rumah dan jumlah saudara kandung tidak boleh bernilai negatif.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
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
        jarak_rumah_km: form.jarak_rumah_km !== '' ? parseFloat(form.jarak_rumah_km) : null,
        tinggi_badan: form.tinggi_badan !== '' ? parseInt(form.tinggi_badan, 10) : null,
        berat_badan: form.berat_badan !== '' ? parseFloat(form.berat_badan) : null,
        jumlah_saudara_kandung: form.jumlah_saudara_kandung !== '' ? parseInt(form.jumlah_saudara_kandung, 10) : 0,
        nama_wali: form.nama_wali.trim()
      };

      const res = await SpmbAPI.daftar(payload);

      if (res.data?.success) {
        const id = res.data.data?.pendaftar_id;
        setPendaftarId(id);
        // Simpan pendaftaran terakhir ke localStorage agar Login Page bisa langsung mendeteksi status
        localStorage.setItem(
          'pkbm_last_spmb',
          JSON.stringify({
            id,
            nama_lengkap: form.nama_lengkap.trim(),
            email: form.email.trim(),
            jenjang_daftar: form.jenjang_daftar,
            status: 'pending',
            registeredAt: new Date().toISOString()
          })
        );
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
            <span className="spmb-back-text-full">Kembali ke Beranda</span>
            <span className="spmb-back-text-mobile">Beranda</span>
          </Link>
          <div className="spmb-topbar-right">
            <span className="spmb-topbar-prompt">Sudah punya akun?</span>
            <Link to="/login" className="spmb-topbar-action-btn">
              Masuk di Sini
            </Link>
          </div>
        </div>
      </header>

      {/* ═ HERO BANNER ═ */}
      <section className="spmb-hero">
        <div className="spmb-hero-content">
          <div className="spmb-hero-icon logo-brand-container">
            <img src="/images/logo new.png" alt="Logo PKBM Bina Mandiri" className="spmb-brand-logo" />
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
                Isi formulir pendaftaran dengan data valid. Kolom bertanda (<span className="spmb-label-req">*</span>) wajib diisi. Data akun akan disimpan untuk verifikasi berkas oleh Tim Admin TU PKBM sebelum aktivasi Ruang Belajar.
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

              {/* Banner Penjelasan Data Dapodik */}
              <div style={{
                marginTop: 24,
                marginBottom: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #E6F8EA 100%)',
                borderRadius: '14px',
                border: '1.5px solid #BBF7D0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#14532D' }}>
                      Data Periodik Calon Siswa (Isian Dapodik Kemendikbudristek)
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', marginTop: 2 }}>
                      Wajib diisi sesuai keadaan sebenarnya untuk pelaporan Data Pokok Pendidikan (DAPODIK).
                    </p>
                  </div>
                </div>
              </div>

              {/* Row Dapodik 1: Jarak Rumah ke Sekolah & Jumlah Saudara Kandung */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Jarak dari Rumah ke Sekolah (km) <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <MapPin size={18} className="spmb-input-icon" />
                    <input
                      type="number"
                      name="jarak_rumah_km"
                      value={form.jarak_rumah_km}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      max="999"
                      required
                      placeholder="Contoh: 2.5 atau 3"
                      className="spmb-input"
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                    Estimasi jarak tempat tinggal ke lokasi PKBM (dalam satuan km).
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Jumlah Saudara Kandung <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Users size={18} className="spmb-input-icon" />
                    <input
                      type="number"
                      name="jumlah_saudara_kandung"
                      value={form.jumlah_saudara_kandung}
                      onChange={handleChange}
                      min="0"
                      max="30"
                      required
                      placeholder="Contoh: 2 (isi 0 jika anak tunggal)"
                      className="spmb-input"
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                    Jumlah saudara kandung (tidak termasuk calon siswa, isi 0 jika anak tunggal).
                  </div>
                </div>
              </div>

              {/* Row Dapodik 2: Tinggi Badan & Berat Badan */}
              <div className="spmb-form-grid">
                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Tinggi Badan (cm) <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Ruler size={18} className="spmb-input-icon" />
                    <input
                      type="number"
                      name="tinggi_badan"
                      value={form.tinggi_badan}
                      onChange={handleChange}
                      min="30"
                      max="250"
                      required
                      placeholder="Contoh: 165"
                      className="spmb-input"
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                    Tinggi badan terkini dalam satuan centimeter (cm).
                  </div>
                </div>

                <div className="spmb-form-group">
                  <label className="spmb-label">
                    Berat Badan (kg) <span className="spmb-label-req">*</span>
                  </label>
                  <div className="spmb-input-wrapper">
                    <Scale size={18} className="spmb-input-icon" />
                    <input
                      type="number"
                      name="berat_badan"
                      value={form.berat_badan}
                      onChange={handleChange}
                      step="0.5"
                      min="10"
                      max="250"
                      required
                      placeholder="Contoh: 55"
                      className="spmb-input"
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                    Berat badan terkini dalam satuan kilogram (kg).
                  </div>
                </div>
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
                Langkah 2: Upload Berkas Dokumen Persyaratan
              </h2>
              <p className="spmb-card-subtitle">
                Nomor pendaftaran sementara: <strong>#{String(pendaftarId).padStart(6, '0')}</strong> atas nama <strong>{form.nama_lengkap}</strong>.
              </p>
            </div>

            {/* Indikator Kelengkapan Berkas */}
            {(() => {
              const countDone = Object.values(uploadStatus).filter(s => s === 'done').length;
              const pct = Math.round((countDone / DAFTAR_BERKAS.length) * 100);
              return (
                <div style={{
                  marginBottom: 20,
                  padding: '14px 18px',
                  background: countDone === DAFTAR_BERKAS.length ? '#F0FDF4' : '#F8FAFC',
                  borderRadius: 12,
                  border: countDone === DAFTAR_BERKAS.length ? '1.5px solid #86EFAC' : '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {countDone === DAFTAR_BERKAS.length ? (
                        <CheckCircle2 size={16} color="#16A34A" />
                      ) : (
                        <Info size={16} color="var(--spmb-blue-royal)" />
                      )}
                      <span>Kelengkapan Dokumen: <strong>{countDone} dari {DAFTAR_BERKAS.length} Berkas</strong> Tersimpan di Database</span>
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: countDone === DAFTAR_BERKAS.length ? '#16A34A' : '#1D4ED8' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: countDone === DAFTAR_BERKAS.length ? '#16A34A' : '#1D4ED8',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })()}

            <div className="spmb-alert info" style={{ marginBottom: 24 }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
                <strong>Unggah Otomatis:</strong> Saat Anda memilih file dari galeri atau berkas komputer, sistem akan otomatis mengunggah dan menyimpannya langsung ke database. Jika saat ini berkas fisik belum siap, Anda tetap dapat menekan tombol <strong>"Selesaikan & Simpan Pendaftaran"</strong> untuk menyerahkan berkas langsung ke kantor TU PKBM Bina Mandiri.
              </div>
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
                    style={{ marginBottom: 16 }}
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
                            <CheckCircle2 size={14} /> Tersimpan di Database
                          </span>
                        )}
                        {status === 'uploading' && (
                          <span className="spmb-upload-badge" style={{ background: '#DBEAFE', color: '#1E40AF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <div className="spmb-spinner small" style={{ width: 12, height: 12, borderWidth: 2 }} />
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

                    {/* Area Upload & Dropzone */}
                    {status !== 'done' ? (
                      <label
                        className="spmb-upload-drop"
                        style={{
                          cursor: status === 'uploading' ? 'wait' : 'pointer',
                          opacity: status === 'uploading' ? 0.7 : 1,
                        }}
                      >
                        <UploadCloud size={20} color="var(--spmb-blue-royal)" />
                        <span>
                          {status === 'uploading'
                            ? 'Sedang menyimpan file ke database...'
                            : `Pilih File ${item.label} (Otomatis Upload)`}
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          disabled={status === 'uploading'}
                          onChange={(e) => {
                            const selected = e.target.files?.[0] || null;
                            if (selected) handleFileChange(item.key, selected);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#FFFFFF',
                        borderRadius: 10,
                        border: '1px solid #BBF7D0',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#14532D', wordBreak: 'break-all' }}>
                            {file?.name || `Berkas ${item.label} berhasil tersimpan`}
                          </span>
                        </div>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <span>Ganti File</span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                              const selected = e.target.files?.[0] || null;
                              if (selected) handleFileChange(item.key, selected);
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    )}

                    {/* Feedback Pesan Upload */}
                    {msg && (
                      <div style={{
                        marginTop: 8,
                        fontSize: '0.8rem',
                        color: status === 'error' ? '#DC2626' : status === 'done' ? '#16A34A' : '#1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 6
                      }}>
                        <span>{msg}</span>
                        {status === 'error' && (
                          <button
                            type="button"
                            onClick={() => handleUploadBerkas(item.key)}
                            className="spmb-btn spmb-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Coba Upload Lagi
                          </button>
                        )}
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
                onClick={handleSelesaikanPendaftaran}
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

              {/* Status Pill */}
              <div className="spmb-status-pill pending">
                <span className="spmb-pulse-dot" />
                <span>Status Akun: Menunggu Verifikasi Berkas oleh Tim Admin TU</span>
              </div>

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

              {/* Rincian Status Dokumen di Database */}
              <div style={{
                margin: '24px 0',
                padding: '16px 20px',
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1.5px solid #E2E8F0',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} color="var(--spmb-blue-royal)" />
                  <span>Status Dokumen Persyaratan Anda di Database:</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DAFTAR_BERKAS.map((item) => {
                    const isDone = uploadStatus[item.key] === 'done';
                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: isDone ? '#F0FDF4' : '#FFFBEB',
                          border: `1px solid ${isDone ? '#BBF7D0' : '#FDE68A'}`,
                          fontSize: '0.85rem',
                          flexWrap: 'wrap',
                          gap: 6
                        }}
                      >
                        <span style={{ fontWeight: 700, color: isDone ? '#14532D' : '#92400E' }}>
                          {item.icon} {item.label}
                        </span>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          color: isDone ? '#16A34A' : '#D97706',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {isDone ? (
                            <>
                              <CheckCircle2 size={14} /> Tersimpan di Database
                            </>
                          ) : (
                            <>
                              <Info size={14} /> Belum Ada (Diserahkan ke TU)
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {Object.values(uploadStatus).some(s => s !== 'done') && (
                  <div style={{ marginTop: 14, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--spmb-blue-royal)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Unggah Dokumen yang Belum Lengkap →
                    </button>
                  </div>
                )}
              </div>

              {/* Next Steps Guide */}
              <div className="spmb-guide-steps">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--spmb-black)', marginBottom: 14 }}>
                  Tahapan & Informasi Aktivasi Akun:
                </h4>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">1</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Verifikasi Berkas:</strong> Tim Tata Usaha PKBM Bina Mandiri akan memeriksa kelengkapan identitas dan berkas Anda. Jika dokumen belum lengkap, Admin TU dapat membantu mengunggahnya saat Anda menyerahkan fotokopi fisik atau via WhatsApp.
                  </div>
                </div>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">2</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Aktivasi Akun & Penerbitan NIS:</strong> Setelah pendaftaran disetujui, akun Ruang Belajar Anda akan otomatis aktif dan Anda mendapatkan Nomor Induk Siswa (NIS).
                  </div>
                </div>
                <div className="spmb-guide-item">
                  <div className="spmb-guide-bullet">3</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--spmb-text-main)' }}>
                    <strong>Pantau Status di Halaman Login:</strong> Anda dapat memeriksa status berkas kapan saja di halaman Login melalui fitur "Cek Status SPMB" menggunakan email atau nomor pendaftaran Anda.
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
                  to={`/login?cek_spmb=${pendaftarId || ''}`}
                  className="spmb-btn spmb-btn-primary"
                  style={{ flex: 1.5, minWidth: 200 }}
                >
                  <span>Lihat Status di Halaman Login</span>
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