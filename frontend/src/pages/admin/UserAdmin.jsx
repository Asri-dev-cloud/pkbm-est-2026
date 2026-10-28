// ============================================================
// src/pages/admin/UserAdmin.jsx — Manajemen Akun (Super Admin)
// ============================================================
// Super Admin membuat akun Tutor/Admin TU, mengaktifkan/
// menonaktifkan akun, dan mereset password.
//
// API:
//   GET /api/users                  → semua akun user
//   POST /api/users                 → buat akun baru
//   PUT /api/users/:id/status       → aktifkan / nonaktifkan
//   PUT /api/users/:id/password     → reset password
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { UserAPI } from '../../services/api.js';

// ── Konstanta ────────────────────────────────────────────────
const ROLE_LABEL = {
  super_admin:   'Super Admin',
  warga_belajar: 'Warga Belajar',
};

const ROLE_COLOR = {
  super_admin:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  warga_belajar: { bg: '#FEF08A', color: '#854D0E', border: '#FDE047' },
};

// Role yang bisa dikelola / dibuat oleh Super Admin
const ROLE_BUAT = ['super_admin'];

function UserAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State: Data ──────────────────────────────────────────
  const [userList, setUserList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  // ── State: Modal Buat Akun ───────────────────────────────
  const [showBuat,  setShowBuat]  = useState(false);
  const [formBuat, setFormBuat] = useState({
    nama_lengkap: '', email: '', password: '', role: 'super_admin',
  });
  const [buatLoading,  setBuatLoading]  = useState(false);
  const [buatFeedback, setBuatFeedback] = useState({ type: '', msg: '' });

  // ── State: Modal Reset Password ──────────────────────────
  const [resetTarget, setResetTarget] = useState(null); // { id, nama }
  const [passwordBaru, setPasswordBaru] = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState({ type: '', msg: '' });

  // ── State: Memproses toggle status ──────────────────────
  const [togglingId, setTogglingId] = useState(null);

  // ── Fetch Daftar User ────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await UserAPI.getAll();
      setUserList(res.data.data || []);
    } catch {
      setError('Gagal memuat daftar akun. Pastikan Anda login sebagai Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Filter Pencarian Lokal ───────────────────────────────
  const filtered = userList.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.nama_lengkap?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // ── Toggle Status Aktif / Nonaktif ───────────────────────
  const handleToggleStatus = async (u) => {
    if (!window.confirm(
      `${u.is_active ? 'Nonaktifkan' : 'Aktifkan'} akun ${u.nama_lengkap}?`
    )) return;

    setTogglingId(u.id);
    try {
      await UserAPI.updateStatus(u.id, !u.is_active);
      // Update state lokal tanpa refetch
      setUserList(prev => prev.map(item =>
        item.id === u.id ? { ...item, is_active: u.is_active ? 0 : 1 } : item
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Buat Akun Baru ───────────────────────────────────────
  const handleBuatAkun = async () => {
    const { nama_lengkap, email, password, role } = formBuat;
    if (!nama_lengkap || !email || !password || !role) {
      setBuatFeedback({ type: 'error', msg: 'Semua field wajib diisi.' });
      return;
    }
    if (password.length < 8) {
      setBuatFeedback({ type: 'error', msg: 'Password minimal 8 karakter.' });
      return;
    }

    setBuatLoading(true);
    setBuatFeedback({ type: '', msg: '' });
    try {
      await UserAPI.create({ nama_lengkap, email, password, role });
      setBuatFeedback({ type: 'success', msg: `Akun untuk ${nama_lengkap} berhasil dibuat!` });
      setFormBuat({ nama_lengkap: '', email: '', password: '', role: 'tutor' });
      // Refresh daftar
      await fetchUsers();
      setTimeout(() => {
        setShowBuat(false);
        setBuatFeedback({ type: '', msg: '' });
      }, 1800);
    } catch (err) {
      setBuatFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat akun.' });
    } finally {
      setBuatLoading(false);
    }
  };

  // ── Reset Password ───────────────────────────────────────
  const handleResetPassword = async () => {
    if (!passwordBaru || passwordBaru.length < 8) {
      setResetFeedback({ type: 'error', msg: 'Password baru minimal 8 karakter.' });
      return;
    }
    setResetLoading(true);
    setResetFeedback({ type: '', msg: '' });
    try {
      await UserAPI.resetPassword(resetTarget.id, passwordBaru);
      setResetFeedback({ type: 'success', msg: 'Password berhasil direset!' });
      setTimeout(() => {
        setResetTarget(null);
        setPasswordBaru('');
        setResetFeedback({ type: '', msg: '' });
      }, 1500);
    } catch (err) {
      setResetFeedback({ type: 'error', msg: err.response?.data?.message || 'Gagal reset password.' });
    } finally {
      setResetLoading(false);
    }
  };

  // ── Statistik Cepat ──────────────────────────────────────
  const statRole = ROLE_BUAT.reduce((acc, r) => {
    acc[r] = userList.filter(u => u.role === r).length;
    return acc;
  }, {});

  const formatTanggal = (tgl) => tgl
    ? new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">

          {/* ── Header ─────────────────────────────────── */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span className="badge badge-primary" style={{ fontWeight: 700, padding: '4px 10px' }}>
                  <i className="bi bi-shield-lock-fill"></i> Kontrol Akses & Keamanan
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Otentikasi & Manajemen Pengguna</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Manajemen Akun Pengguna
              </h1>
              <p style={{ color: '#475569', marginTop: 4, fontSize: '0.925rem' }}>
                Kelola hak akses administrator sistem, atur status keaktifan akun pengguna, dan lakukan pemulihan kata sandi.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setShowBuat(true); setBuatFeedback({ type: '', msg: '' }); }}
              style={{ height: 42, padding: '0 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="bi bi-person-plus-fill" /> Buat Super Admin Baru
            </button>
          </div>

          {/* ── Statistik Patterned Cards ────────────────── */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="admin-stat-card admin-stat-blue">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-shield-check" />
                </div>
                <span className="admin-stat-tag">ADMIN</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{userList.filter(u => u.role === 'super_admin').length}</div>
                <div className="admin-stat-label">Super Administrator</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-purple">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-mortarboard-fill" />
                </div>
                <span className="admin-stat-tag">SISWA</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{userList.filter(u => u.role === 'warga_belajar').length}</div>
                <div className="admin-stat-label">Akun Warga Belajar</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-green">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-person-check-fill" />
                </div>
                <span className="admin-stat-tag">AKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{userList.filter(u => u.is_active).length}</div>
                <div className="admin-stat-label">Akun Aktif (Dapat Login)</div>
              </div>
            </div>

            <div className="admin-stat-card admin-stat-rose">
              <div className="admin-stat-top">
                <div className="admin-stat-icon-wrap">
                  <i className="bi bi-person-x-fill" />
                </div>
                <span className="admin-stat-tag">NONAKTIF</span>
              </div>
              <div className="admin-stat-info">
                <div className="admin-stat-value">{userList.filter(u => !u.is_active).length}</div>
                <div className="admin-stat-label">Akun Dinonaktifkan</div>
              </div>
            </div>
          </div>

          {/* ── Tabel Akun Panel ───────────────────────────── */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <i className="bi bi-people-fill" style={{ color: '#1D4ED8' }}></i>
                <span>Daftar Akun Pengguna Terdaftar</span>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8', fontSize: '0.85rem',
                }} />
                <input
                  type="text"
                  placeholder="Cari nama atau email pengguna…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', width: 260, height: 38, borderRadius: 8, border: '1.5px solid #CBD5E1', fontWeight: 600 }}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat daftar akun...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1.5rem' }}>
                <i className="bi bi-shield-lock" /><span>{error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-person-x" />
                <h3>Tidak Ada Akun Ditemukan</h3>
                <p>Tidak ada pengguna yang cocok dengan kriteria pencarian Anda.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Nama Lengkap & Email</th>
                      <th style={{ width: '180px' }}>Role Akun</th>
                      <th style={{ width: '130px' }}>Status Akun</th>
                      <th style={{ width: '160px' }}>Tanggal Dibuat</th>
                      <th style={{ width: '160px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => {
                      const rc = ROLE_COLOR[u.role] || { bg: '#F1F5F9', color: '#475569' };
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 38, height: 38, borderRadius: 10,
                                background: rc.bg, color: rc.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}>
                                {u.nama_lengkap?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}>{u.nama_lengkap}</div>
                                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: rc.bg, color: rc.color, border: '1px solid currentColor', fontWeight: 700 }}>
                              {ROLE_LABEL[u.role] || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                              {u.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                            {formatTanggal(u.created_at)}
                          </td>
                          <td>
                            {/* Proteksi: Super Admin tidak bisa mengedit dirinya sendiri */}
                            {u.id !== user.id && u.role !== 'super_admin' && (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {/* Toggle Aktif/Nonaktif */}
                                <button
                                  className={`btn ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                                  style={{ padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                                  disabled={togglingId === u.id}
                                  onClick={() => handleToggleStatus(u)}
                                  title={u.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                >
                                  {togglingId === u.id
                                    ? <div className="spinner" style={{ width: 14, height: 14 }} />
                                    : <><i className={`bi ${u.is_active ? 'bi-person-dash' : 'bi-person-check'}`} /> {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</>
                                  }
                                </button>
                                {/* Reset Password */}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                                  onClick={() => {
                                    setResetTarget({ id: u.id, nama: u.nama_lengkap });
                                    setPasswordBaru('');
                                    setResetFeedback({ type: '', msg: '' });
                                  }}
                                  title="Reset password"
                                >
                                  <i className="bi bi-key" /> Reset
                                </button>
                              </div>
                            )}
                            {u.id === user.id && (
                              <div style={{ textAlign: 'right' }}>
                                <span className="badge" style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <i className="bi bi-person-badge"></i> Sesi Anda
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                Menampilkan <strong>{filtered.length}</strong> dari <strong>{userList.length}</strong> akun terdaftar
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Modal Buat Akun ─────────────────────────────── */}
      {showBuat && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBuat(false); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                <i className="bi bi-person-plus-fill" />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">Buat Super Admin Baru</h3>
                <p className="admin-modal-subtitle">Daftarkan akun administrator dengan hak akses penuh ke sistem</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setShowBuat(false)} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={e => { e.preventDefault(); handleBuatAkun(); }}>
              <div className="admin-modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nama Lengkap <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Budi Santoso, S.Pd"
                    value={formBuat.nama_lengkap}
                    onChange={e => setFormBuat(p => ({ ...p, nama_lengkap: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Alamat Email Resmi <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nama@pkbm-binamandiri.sch.id"
                    value={formBuat.email}
                    onChange={e => setFormBuat(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Kata Sandi Awal <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 8 karakter..."
                    value={formBuat.password}
                    onChange={e => setFormBuat(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                    Pengguna disarankan mengganti kata sandi secara berkala setelah login pertama.
                  </p>
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Tingkat Hak Akses (Role)</label>
                  <select className="form-input" value={formBuat.role} onChange={e => setFormBuat(p => ({ ...p, role: e.target.value }))}>
                    {ROLE_BUAT.map(r => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                </div>

                {buatFeedback.msg && (
                  <div className={`alert ${buatFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '0.5rem' }}>
                    <i className={`bi ${buatFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{buatFeedback.msg}</span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBuat(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={buatLoading}>
                  {buatLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Membuat Akun...</> : <><i className="bi bi-check2" /> Simpan & Buat Akun</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Reset Password ─────────────────────────── */}
      {resetTarget && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setResetTarget(null); }}>
          <div className="admin-modal-dialog" style={{ maxWidth: 460 }}>
            <div className="admin-modal-header">
              <div className="admin-modal-header-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <i className="bi bi-key-fill" />
              </div>
              <div className="admin-modal-title-wrap">
                <h3 className="admin-modal-title">Reset Kata Sandi Akun</h3>
                <p className="admin-modal-subtitle">Atur kata sandi baru untuk {resetTarget.nama}</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setResetTarget(null)} aria-label="Tutup">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={e => { e.preventDefault(); handleResetPassword(); }}>
              <div className="admin-modal-body">
                <div className="alert alert-warning" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>
                    Anda akan mengatur ulang kata sandi untuk akun <strong>{resetTarget.nama}</strong>. Sesi pengguna akan diperbarui.
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Kata Sandi Baru <span style={{ color: '#DC2626' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Minimal 8 karakter..."
                      value={passwordBaru}
                      onChange={e => setPasswordBaru(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
                    }}>
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>

                {resetFeedback.msg && (
                  <div className={`alert ${resetFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '0.5rem' }}>
                    <i className={`bi ${resetFeedback.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} />
                    <span>{resetFeedback.msg}</span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                  {resetLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Memproses...</> : <><i className="bi bi-key" /> Reset Password Sekarang</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAdmin;
