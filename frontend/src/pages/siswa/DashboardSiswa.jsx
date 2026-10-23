// ============================================================
// src/pages/siswa/DashboardSiswa.jsx — Dashboard Warga Belajar
// ============================================================
// Halaman utama yang dilihat oleh Warga Belajar setelah login.
// Menampilkan:
//   - Ringkasan profil siswa
//   - Widget statistik (tagihan, absensi, tugas)
//   - Daftar materi & tugas terbaru
//
// Data diambil dari backend menggunakan:
//   GET /api/siswa/profil/saya → profil WB yang login
// ============================================================

import { useState, useEffect } from 'react';
import { SiswaAPI, AbsensiAPI, TagihanAPI, toAssetUrl } from '../../services/api.js';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import './DashboardSiswa.css';

function DashboardSiswa() {
  // ── Ambil data user dari localStorage (sudah disimpan saat login) ──
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── State: Data Profil Siswa ─────────────────────────────
  const [profil, setProfil] = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [errorProfil, setErrorProfil] = useState('');

  // ── State: Rekap Kehadiran ───────────────────────────────
  const [rekapAbsensi, setRekapAbsensi] = useState(null);
  const [loadingAbsensi, setLoadingAbsensi] = useState(true);

  // ── State: Tagihan Aktif ─────────────────────────────────
  const [tagihan, setTagihan] = useState(null);
  const [loadingTagihan, setLoadingTagihan] = useState(true);
  // ============================================================
  // useEffect — Fetch semua data saat komponen pertama kali dimuat
  // Dependency array [] berarti hanya dijalankan sekali (on mount)
  // ============================================================
  useEffect(() => {
    // Ambil profil siswa yang sedang login
    const fetchProfil = async () => {
      try {
        setLoadingProfil(true);

        // Hit endpoint GET /api/siswa/profil/saya
        // Token JWT otomatis disisipkan oleh interceptor di api.js
        const response = await SiswaAPI.getProfilSaya();

        // response.data mengikuti format backend: { success, data }
        setProfil(response.data.data);

      } catch (err) {
        const pesanError =
          err.response?.data?.message ||
          'Gagal memuat data profil. Coba muat ulang halaman.';
        setErrorProfil(pesanError);
      } finally {
        setLoadingProfil(false); // Selalu matikan loading
      }
    };

    // Ambil rekap kehadiran pribadi WB
    const fetchAbsensi = async () => {
      try {
        const response = await AbsensiAPI.getRekapSaya();
        setRekapAbsensi(response.data.data);
      } catch {
        // Tidak tampilkan error kritis untuk data sekunder
        setRekapAbsensi(null);
      } finally {
        setLoadingAbsensi(false);
      }
    };

    // Ambil tagihan aktif milik WB ini
    const fetchTagihan = async () => {
      try {
        // Endpoint ini mengambil tagihan berdasarkan token (siswa hanya lihat miliknya)
        const response = await TagihanAPI.getAll();
        // Ambil tagihan yang belum lunas (jika ada field status)
        const semuaTagihan = response.data.data || [];
        const belumLunas = semuaTagihan.filter(t => t.status !== 'lunas');
        setTagihan({ semua: semuaTagihan, belumLunas });
      } catch {
        setTagihan(null);
      } finally {
        setLoadingTagihan(false);
      }
    };

    // Jalankan semua fetch secara paralel (lebih cepat dari serial)
    fetchProfil();
    fetchAbsensi();
    fetchTagihan();

  }, []); // [] = hanya dijalankan sekali saat komponen mount

  // ── Render: Loading utama ────────────────────────────────
  if (loadingProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="loading-container" style={{ minHeight: '100vh' }}>
            <div className="spinner"></div>
            <p>Memuat data Anda...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Error utama ──────────────────────────────────
  if (errorProfil) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content">
            <div className="error-container">
              <i className="bi bi-wifi-off"></i>
              <h3>Gagal Memuat Data</h3>
              <p>{errorProfil}</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Coba Lagi
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Konten Utama Dashboard ──────────────────────
  return (
    <div className="app-layout">

      {/* Navigasi samping — menerima data user untuk tampilkan nama & role */}
      <Sidebar user={user} />

      <main className="app-main">
        <div className="app-content">

          {/* ── Header Sambutan ── */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-greeting">
                Halo, {profil?.nama_lengkap?.split(' ')[0] || user.nama_lengkap || user.nama}! 👋
              </h1>
              <p className="dashboard-subtext">
                Selamat datang di ruang belajar digital Anda.
              </p>
            </div>
            <div className="dashboard-date">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>

          {profil && (
            <div className="profil-card">
              <div className="profil-avatar">
                {profil.foto_profil ? (
                  <img
                    src={toAssetUrl(profil.foto_profil)}
                    alt={`Foto profil ${profil.nama_lengkap}`}
                    className="profil-avatar-image"
                  />
                ) : (
                  profil.nama_lengkap?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="profil-info">
                <div className="profil-header-top">
                  <div>
                    <h2 className="profil-nama">{profil.nama_lengkap}</h2>
                    <p className="profil-role">{formatRole(user.role)}</p>
                  </div>
                  <ProfileEditorCard
                    user={user}
                    onUserUpdate={setUser}
                    onProfileUpdate={(nextProfile) => setProfil(nextProfile)}
                    hideCard
                    triggerRenderer={(openModal) => (
                      <button
                        type="button"
                        className="profil-edit-btn"
                        onClick={openModal}
                      >
                        <i className="bi bi-pencil-square"></i>
                        Edit Profil
                      </button>
                    )}
                  />
                </div>
                <div className="profil-meta">
                  <span className="profil-meta-item">
                    <i className="bi bi-card-text"></i>
                    NIS: {profil.nis || 'Belum ditetapkan'}
                  </span>
                  <span className="profil-meta-item">
                    <i className="bi bi-mortarboard"></i>
                    {formatJenjang(profil.jenjang)}
                  </span>
                  {profil.nama_rombel && (
                    <span className="profil-meta-item">
                      <i className="bi bi-people"></i>
                      Rombel: {profil.nama_rombel}
                    </span>
                  )}
                  <span className="profil-meta-item">
                    <i className="bi bi-telephone"></i>
                    {profil.no_telp || 'No. Telepon belum diisi'}
                  </span>
                  <span className={`badge ${profil.is_aktif ? 'badge-success' : 'badge-danger'}`}>
                    {profil.is_aktif ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Grid Statistik ── */}
          <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>

            {/* Widget Kehadiran */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#DBEAFE', color: 'var(--color-siswa)' }}>
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-body">
                {loadingAbsensi ? (
                  <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Memuat...</div>
                ) : (
                  <>
                    <div className="stat-value" style={{ color: 'var(--color-siswa)' }}>
                      {rekapAbsensi
                        ? `${rekapAbsensi.persentase_hadir || 0}%`
                        : '0%'}
                    </div>
                    <div className="stat-label">Tingkat Kehadiran</div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Tagihan */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FEF3C7', color: 'var(--color-accent-dark)' }}>
                <i className="bi bi-receipt"></i>
              </div>
              <div className="stat-body">
                {loadingTagihan ? (
                  <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Memuat...</div>
                ) : (
                  <>
                    <div className="stat-value" style={{ color: tagihan?.belumLunas?.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {tagihan?.belumLunas?.length ?? '—'}
                    </div>
                    <div className="stat-label">Tagihan Belum Lunas</div>
                  </>
                )}
              </div>
            </div>

            {/* Widget Status Akun */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#D1FAE5', color: 'var(--color-success)' }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <div className="stat-body">
                <div className="stat-value" style={{ color: 'var(--color-success)', fontSize: '1.4rem' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-label">Status Akun Aktif</div>
              </div>
            </div>

          </div>

          {/* ── Aksi Cepat ── */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-lightning-charge-fill" style={{ color: 'var(--color-accent)' }}></i>{' '}
                Aksi Cepat
              </h3>
            </div>
            <div className="quick-actions">
              <a href="/dashboard/siswa/absensi" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#DBEAFE', color: 'var(--color-siswa)' }}>
                  <i className="bi bi-qr-code"></i>
                </div>
                <span>Check-In Absensi</span>
              </a>
              <a href="/dashboard/siswa/materi" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#D1FAE5', color: 'var(--color-success)' }}>
                  <i className="bi bi-book-fill"></i>
                </div>
                <span>Buka Materi</span>
              </a>
              <a href="/dashboard/siswa/tugas" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FEF3C7', color: 'var(--color-accent-dark)' }}>
                  <i className="bi bi-pencil-square"></i>
                </div>
                <span>Kumpulkan Tugas</span>
              </a>
              <a href="/dashboard/siswa/ujian" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                  <i className="bi bi-patch-question-fill"></i>
                </div>
                <span>Ikuti Ujian</span>
              </a>
              <a href="/dashboard/siswa/klub" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FCE7F3', color: '#BE185D' }}>
                  <i className="bi bi-people-fill"></i>
                </div>
                <span>Klub Minat</span>
              </a>
              <a href="/dashboard/siswa/tagihan" className="quick-action-item">
                <div className="quick-action-icon" style={{ background: '#FEE2E2', color: 'var(--color-danger)' }}>
                  <i className="bi bi-cash-stack"></i>
                </div>
                <span>Bayar Tagihan</span>
              </a>
            </div>
          </div>

          {/* ── Detail Profil Lengkap ── */}
          {profil && (
            <div className="card">
              <div className="card-header">
                <div className="mobile-toolbar" style={{ justifyContent: 'space-between' }}>
                  <h3 className="card-title">
                    <i className="bi bi-person-lines-fill" style={{ color: 'var(--color-primary)' }}></i>{' '}
                    Data Diri
                  </h3>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setDataDiriError('');
                    setDataDiriSuccess('');
                    setEditDataDiriOpen(true);
                  }}>
                    <i className="bi bi-pencil-square"></i> Edit Data Diri
                  </button>
                </div>
              </div>
              <div className="profil-detail-grid">
                <DetailItem label="Nama Lengkap" value={profil.nama_lengkap} />
                <DetailItem label="NIS" value={profil.nis || 'Belum ditetapkan'} />
                <DetailItem label="NIK" value={profil.nik} />
                <DetailItem label="Jenjang" value={formatJenjang(profil.jenjang)} />
                <DetailItem label="Tanggal Lahir" value={formatTanggal(profil.tanggal_lahir)} />
                <DetailItem label="Jenis Kelamin" value={profil.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                <DetailItem label="No. Telepon" value={profil.no_telp || '-'} />
                <DetailItem label="Nama Wali" value={profil.nama_wali || '-'} />
                <DetailItem label="Alamat" value={profil.alamat || '-'} colSpan={2} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Komponen Kecil: Item Detail Profil ───────────────────────
function DetailItem({ label, value, colSpan = 1 }) {
  return (
    <div className="profil-detail-item" style={{ gridColumn: `span ${colSpan}` }}>
      <span className="profil-detail-label">{label}</span>
      <span className="profil-detail-value">{value || '—'}</span>
    </div>
  );
}

// ── Helper: Format nama jenjang ──────────────────────────────
function formatJenjang(jenjang) {
  const map = {
    paket_a: 'Paket A (Setara SD)',
    paket_b: 'Paket B (Setara SMP)',
    paket_c: 'Paket C (Setara SMA)',
  };
  return map[jenjang] || jenjang || '—';
}

function formatRole(role) {
  const map = {
    warga_belajar: 'Warga Belajar',
    admin: 'Admin TU & Keuangan',
    tutor: 'Tutor',
    pimpinan: 'Pimpinan',
    super_admin: 'Super Admin',
  };
  return map[role] || role || 'Pengguna';
}

// ── Helper: Format tanggal ke Bahasa Indonesia ───────────────
function formatTanggal(tanggal) {
  if (!tanggal) return '—';
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default DashboardSiswa;
