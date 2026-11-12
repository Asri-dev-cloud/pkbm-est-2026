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
  Users,
  Baby,
  CreditCard,
  Camera,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { SpmbAPI } from '../../services/api.js';
import './DaftarSpmbPage.css';

const DAFTAR_BERKAS = [
  {
    key: 'kk',
    label: 'Kartu Keluarga (KK)',
    keterangan: 'Format scan / foto JPG, PNG, atau PDF (maks. 10MB)',
    iconComponent: FileText,
  },
  {
    key: 'akta',
    label: 'Akta Kelahiran',
    keterangan: 'Akta kelahiran resmi calon warga belajar (JPG, PNG, atau PDF)',
    iconComponent: Baby,
  },
  {
    key: 'ktp',
    label: 'KTP Siswa / KTP Orang Tua',
    keterangan: 'Bagi calon siswa yang belum memiliki KTP (usia di bawah 17 tahun), silakan upload KTP Orang Tua atau Wali.',
    noteKhusus: 'Belum punya KTP? Silakan upload foto/scan KTP Orang Tua.',
    iconComponent: CreditCard,
  },
  {
    key: 'ijazah',
    label: 'Ijazah Terakhir / Raport / SKL',
    keterangan: 'Ijazah jenjang sebelumnya (SD/SMP) atau dokumen pendukung',
    iconComponent: GraduationCap,
  },
  {
    key: 'foto',
    label: 'Pas Foto 3x4 Terbaru',
    keterangan: 'Foto formal calon siswa dengan latar belakang merah atau biru',
    iconComponent: Camera,
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

// Helper kompresi gambar client-side untuk berkas/foto SPMB
// Mengompres foto ponsel (>3MB) menjadi ~200-350KB sebelum diunggah
// Memastikan unggahan instan (<1-2 detik), anti-timeout, dan tidak kena limit Nginx 413
const compressImageIfNeeded = async (file) => {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.size <= 500 * 1024) return file; // Di bawah 500KB tidak perlu kompres

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const maxDim = 1600;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob && blob.size < file.size) {
                  const safeName = file.name.replace(/\.[^.]+$/, '.jpg');
                  const compressedFile = new File([blob], safeName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              0.82
            );
          } catch (errCanvas) {
            console.warn('[compressImageIfNeeded] Canvas error, fallback ke file asli:', errCanvas);
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (errAll) {
      resolve(file);
    }
  });
};

// Wrapper aman dengan timeout 3.5 detik agar pengiriman formulir tidak pernah menggantung
const compressImageSafe = async (file) => {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.size <= 500 * 1024) return file;

  return Promise.race([
    compressImageIfNeeded(file),
    new Promise((resolve) => setTimeout(() => resolve(file), 3500)),
  ]);
};

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
  const [files, setFiles] = useState({ kk: null, akta: null, ktp: null, ijazah: null, foto: null });
  const [uploadStatus, setUploadStatus] = useState({ kk: 'idle', akta: 'idle', ktp: 'idle', ijazah: 'idle', foto: 'idle' });
  const [uploadMsg, setUploadMsg] = useState({});
  const [filePreviews, setFilePreviews] = useState({ kk: null, akta: null, ktp: null, ijazah: null, foto: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorStep2, setErrorStep2] = useState('');
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

  // ── Step 2: Pemilihan & Validasi Berkas Fisik ──
  const handleFileChange = (key, file) => {
    if (!file) return;

    // Validasi ukuran maks 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFiles(prev => ({ ...prev, [key]: null }));
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
      setUploadMsg(prev => ({ ...prev, [key]: 'Ukuran file melebihi 10MB. Harap gunakan file berukuran lebih kecil.' }));
      setErrorStep2(`Ukuran file "${file.name}" melebihi 10MB.`);
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setFiles(prev => ({ ...prev, [key]: file }));
    setUploadStatus(prev => ({ ...prev, [key]: 'done' }));
    setUploadMsg(prev => ({ ...prev, [key]: `${file.name} (${sizeStr})` }));
    setErrorStep2(''); // Bersihkan pesan error jika berkas sukses dipilih

    // Buat URL pratinjau instan jika tipe berkas adalah gambar
    if (file.type && file.type.startsWith('image/')) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews(prev => ({ ...prev, [key]: previewUrl }));
      } catch (err) {
        console.warn('Gagal membuat preview URL:', err);
      }
    } else {
      setFilePreviews(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleRemoveFile = (key) => {
    setFiles(prev => ({ ...prev, [key]: null }));
    setUploadStatus(prev => ({ ...prev, [key]: 'idle' }));
    setUploadMsg(prev => ({ ...prev, [key]: '' }));
    if (filePreviews[key]) {
      try { URL.revokeObjectURL(filePreviews[key]); } catch (e) {}
    }
    setFilePreviews(prev => ({ ...prev, [key]: null }));
  };

  // ── Step 1: Validasi Data Diri & Lanjut ke Step 2 (Belum disimpan ke DB agar berkas tidak kosong) ──
  const handleSubmitDataDiri = (e) => {
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

    // Formulir data diri valid, lanjut ke Step 2 (Unggah Berkas Wajib)
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 2: Kirim Pendaftaran Lengkap (Formulir + 5 Berkas Wajib ke Backend Atomik) ──
  const handleSelesaikanPendaftaran = async () => {
    setErrorStep2('');

    // Validasi kelengkapan berkas: ingatkan calon siswa jika ada berkas yang belum dipilih
    const requiredDocs = [
      { key: 'kk', label: 'Kartu Keluarga (KK)' },
      { key: 'akta', label: 'Akta Kelahiran' },
      { key: 'ktp', label: 'KTP / Identitas' },
      { key: 'ijazah', label: 'Ijazah Terakhir / SKL / Raport' },
      { key: 'foto', label: 'Pas Foto 3x4 Terbaru' }
    ];

    const missing = requiredDocs.filter(d => !files[d.key]);

    if (missing.length > 0) {
      setErrorStep2(
        `Harap lampirkan seluruh 5 berkas persyaratan wajib:\n` +
        missing.map((m) => `• ${m.label}`).join('\n') +
        `\n\nJika berkas fisik hendak diserahkan langsung ke kantor PKBM Bina Mandiri, hubungi admin TU.`
      );
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      // Tambahkan seluruh data diri
      Object.keys(form).forEach(key => {
        const val = form[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          fd.append(key, String(val).trim());
        }
      });

      // Kompres berkas gambar secara otomatis sebelum dikirim ke server (memastikan < 1 detik & anti gagal)
      const [compressedKK, compressedAkta, compressedKTP, compressedIjazah, compressedFoto] = await Promise.all([
        files.kk ? compressImageSafe(files.kk) : Promise.resolve(null),
        files.akta ? compressImageSafe(files.akta) : Promise.resolve(null),
        files.ktp ? compressImageSafe(files.ktp) : Promise.resolve(null),
        files.ijazah ? compressImageSafe(files.ijazah) : Promise.resolve(null),
        files.foto ? compressImageSafe(files.foto) : Promise.resolve(null),
      ]);

      if (compressedKK) fd.append('kk', compressedKK);
      if (compressedAkta) fd.append('akta', compressedAkta);
      if (compressedKTP) fd.append('ktp', compressedKTP);
      if (compressedIjazah) fd.append('ijazah', compressedIjazah);
      if (compressedFoto) fd.append('foto', compressedFoto);

      const res = await SpmbAPI.daftar(fd);

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
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorStep2(res.data?.message || 'Gagal menyimpan data pendaftaran.');
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('[SPMB Submit Error]:', err);
      let errMsg = 'Terjadi kendala saat mengirim data formulir dan berkas.';

      if (err.response) {
        const { status, data } = err.response;
        if (data && typeof data === 'object' && data.message) {
          errMsg = data.message;
        } else if (status === 413) {
          errMsg = 'Ukuran berkas terlalu besar untuk server. Sistem sedang mengompresi gambar, silakan klik tombol Kirim Pendaftaran kembali.';
        } else if (status === 502 || status === 504) {
          errMsg = 'Server sedang sibuk atau dalam proses pemeliharaan. Silakan tunggu beberapa saat dan klik Kirim kembali.';
        } else if (status === 404) {
          errMsg = 'Layanan pendaftaran sedang tidak dapat diakses (404). Silakan hubungi admin sekolah.';
        } else if (typeof data === 'string' && data.includes('<title>')) {
          const titleMatch = data.match(/<title>(.*?)<\/title>/i);
          errMsg = `Gagal mengirim (Server HTTP ${status}: ${titleMatch ? titleMatch[1] : 'Error'}).`;
        } else {
          errMsg = `Gagal memproses pendaftaran (Kode HTTP: ${status}).`;
        }
      } else if (err.code === 'ECONNABORTED') {
        errMsg = 'Waktu pengiriman habis (Timeout). Mohon pastikan koneksi internet stabil dan coba kembali.';
      } else if (err.code === 'ERR_NETWORK') {
        errMsg = 'Koneksi ke server gagal. Pastikan jaringan internet aktif.';
      } else if (err.message) {
        errMsg = err.message;
      }

      setErrorStep2(errMsg);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } finally {
      setLoading(false);
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
              {step === 3 ? <Check size={18} /> : '3'}
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

              {/* Submit Button Step 1 */}
              <button
                type="submit"
                className="spmb-btn spmb-btn-primary spmb-btn-full"
                style={{ marginTop: 8 }}
              >
                <span>Lanjut ke Unggah 5 Berkas Wajib</span>
                <ArrowRight size={18} />
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
                Langkah 2: Unggah 5 Dokumen Persyaratan Wajib
              </h2>
              <p className="spmb-card-subtitle">
                Calon Warga Belajar: <strong>{form.nama_lengkap}</strong> — Jenjang: <strong>{form.jenjang_daftar?.replace('_', ' ')?.toUpperCase()}</strong>.
              </p>
            </div>

            {/* Error Banner jika ada berkas yang belum dipilih */}
            {errorStep2 && (
              <div className="spmb-alert error" style={{ marginBottom: 20, background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.5 }}>
                  {errorStep2}
                </div>
              </div>
            )}

            {/* Indikator Kelengkapan Berkas Modern */}
            {(() => {
              const countDone = Object.values(uploadStatus).filter(s => s === 'done').length;
              const totalDocs = DAFTAR_BERKAS.length;
              const pct = Math.round((countDone / totalDocs) * 100);
              const isAllDone = countDone === totalDocs;

              return (
                <div className={`spmb-progress-card ${isAllDone ? 'all-completed' : ''}`}>
                  <div className="spmb-progress-card-top">
                    <div className="spmb-progress-status-info">
                      <div className={`spmb-progress-icon-badge ${isAllDone ? 'done' : ''}`}>
                        {isAllDone ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <UploadCloud size={18} />
                        )}
                      </div>
                      <div>
                        <div className="spmb-progress-title">
                          {isAllDone
                            ? 'Seluruh 5 Berkas Telah Lengkap & Siap Dikirim!'
                            : `Kelengkapan Berkas: ${countDone} dari ${totalDocs} Dokumen Terpilih`}
                        </div>
                        <div className="spmb-progress-desc">
                          {isAllDone
                            ? 'Silakan periksa kembali berkas Anda sebelum mengklik tombol kirim pendaftaran di bawah.'
                            : `Harap unggah seluruh ${totalDocs} berkas persyaratan wajib di bawah ini untuk melanjutkan.`}
                        </div>
                      </div>
                    </div>
                    <div className="spmb-progress-pct-badge">
                      <span>{pct}%</span>
                    </div>
                  </div>

                  <div className="spmb-progress-bar-track">
                    <div
                      className={`spmb-progress-bar-fill ${isAllDone ? 'fill-completed' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            <div className="spmb-alert info" style={{ marginBottom: 24 }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                <strong>Petunjuk Berkas Persyaratan:</strong> Sesuai regulasi SPMB PKBM Bina Mandiri, berkas <strong>Kartu Keluarga (KK)</strong>, <strong>Akta Kelahiran</strong>, <strong>KTP</strong>, <strong>Ijazah Terakhir / Raport</strong>, dan <strong>Pas Foto 3x4</strong> wajib dilampirkan.
                <div style={{ marginTop: 4, fontWeight: 700, color: '#1D4ED8' }}>
                  Khusus pendaftar yang belum memiliki e-KTP (usia di bawah 17 tahun), silakan unggah foto/scan KTP Orang Tua atau Wali.
                </div>
              </div>
            </div>

            {/* List Berkas Modern Cards */}
            <div className="spmb-upload-cards-grid">
              {DAFTAR_BERKAS.map((item) => {
                const status = uploadStatus[item.key];
                const file = files[item.key];
                const msg = uploadMsg[item.key];
                const previewUrl = filePreviews[item.key];
                const isImage = file?.type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file?.name || '');
                const isPdf = file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '');
                const isDone = status === 'done' && file;

                // Format ukuran berkas
                let fileSizeStr = '';
                if (file?.size) {
                  fileSizeStr = file.size > 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                    : `${Math.round(file.size / 1024)} KB`;
                }

                return (
                  <div
                    key={item.key}
                    className={`spmb-upload-card ${isDone ? 'is-done' : ''}`}
                  >
                    <div className="spmb-upload-card-header">
                      <div className="spmb-upload-card-left">
                        <div className={`spmb-upload-card-icon ${isDone ? 'icon-done' : ''}`}>
                          <item.iconComponent size={20} />
                        </div>
                        <div className="spmb-upload-card-titles">
                          <div className="spmb-upload-title-row">
                            <span className="spmb-upload-title-text">{item.label}</span>
                            <span className="spmb-badge-required">Wajib</span>
                          </div>
                          <p className="spmb-upload-subtitle-text">{item.keterangan}</p>
                          {item.noteKhusus && !isDone && (
                            <div className="spmb-ktp-note-badge">
                              <Info size={13} style={{ flexShrink: 0 }} />
                              <span>{item.noteKhusus}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="spmb-upload-card-status">
                        {isDone ? (
                          <span className="spmb-status-pill-ready">
                            <CheckCircle2 size={14} />
                            <span>Siap Dikirim</span>
                          </span>
                        ) : (
                          <span className="spmb-status-pill-waiting">
                            <AlertCircle size={14} />
                            <span>Wajib Dipilih</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Area Dropzone atau File Box */}
                    {!isDone ? (
                      <label className="spmb-dropzone-modern">
                        <div className="spmb-dropzone-icon-circle">
                          <UploadCloud size={24} />
                        </div>
                        <div className="spmb-dropzone-content">
                          <span className="spmb-dropzone-title">
                            <strong>Pilih atau seret berkas {item.label}</strong>
                          </span>
                          <span className="spmb-dropzone-hint">
                            Format JPG, PNG, atau PDF (Ukuran maksimal 10 MB)
                          </span>
                          {item.key === 'ktp' && (
                            <span className="spmb-dropzone-ktp-tip">
                              * Belum punya KTP? Cukup unggah KTP Orang Tua / Wali
                            </span>
                          )}
                        </div>
                        <span className="spmb-dropzone-browse-button">
                          Browse File
                        </span>
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
                    ) : (
                      <div className="spmb-file-preview-card">
                        <div className="spmb-file-preview-left">
                          {isImage && previewUrl ? (
                            <div className="spmb-preview-thumb-box">
                              <img
                                src={previewUrl}
                                alt={`Pratinjau ${item.label}`}
                                className="spmb-preview-img"
                              />
                            </div>
                          ) : (
                            <div className="spmb-preview-pdf-box">
                              <FileText size={26} color="#DC2626" />
                              <span className="spmb-pdf-tag">PDF</span>
                            </div>
                          )}

                          <div className="spmb-file-details">
                            <div className="spmb-file-name" title={file?.name}>
                              {file?.name}
                            </div>
                            <div className="spmb-file-meta-row">
                              {fileSizeStr && (
                                <span className="spmb-file-size-tag">
                                  {fileSizeStr}
                                </span>
                              )}
                              <span className="spmb-file-check-tag">
                                <CheckCircle2 size={13} color="#16A34A" />
                                <span>Dokumen Terpilih</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="spmb-file-actions-row">
                          <label className="spmb-file-btn-change" title="Ganti File Ini">
                            <RefreshCw size={13} />
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
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item.key)}
                            className="spmb-file-btn-remove"
                            title="Hapus Berkas Ini"
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedback Pesan Status */}
                    {msg && (
                      <div
                        className="spmb-file-feedback"
                        style={{
                          color: status === 'error' ? '#DC2626' : '#16A34A',
                        }}
                      >
                        {status === 'error' ? (
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        ) : (
                          <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                        )}
                        <span>{msg}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation / Actions */}
            {(() => {
              const countDone = Object.values(uploadStatus).filter(s => s === 'done').length;
              const isReady = countDone === DAFTAR_BERKAS.length;

              return (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="spmb-btn spmb-btn-secondary"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Data Diri
                  </button>

                  <button
                    type="button"
                    onClick={handleSelesaikanPendaftaran}
                    disabled={loading || !isReady}
                    className="spmb-btn spmb-btn-yellow"
                    style={{
                      flex: 1.8,
                      minWidth: 220,
                      opacity: isReady ? 1 : 0.65,
                      cursor: isReady ? 'pointer' : 'not-allowed',
                      boxShadow: isReady ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none'
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="spmb-spinner small" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        <span>Menyimpan ke Database...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {isReady
                            ? 'Kirim Pendaftaran Lengkap (5/5 Berkas Siap)'
                            : `Wajib Lengkapi 5 Berkas (${countDone}/5 Siap)`}
                        </span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
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