// ============================================================
// src/components/Sidebar.jsx — Navigasi Samping Modern PKBM
// ============================================================
// Sidebar profesional berdesain modern, terstruktur hierarkis:
// - Beranda
// - LMS (Ruang Belajar, Periode Ujian, Peserta Ujian, Master Mapel, Mapel per Rombel, Klub Minat Bakat)
// - Pusat Administrasi (Verifikasi SPMB, Data Siswa, Manajemen User)
// - Keuangan
// Bebas emoji, memakai Lucide React icons, tema biru karakter & obsidian.
// ============================================================

import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  BookMarked,
  Network,
  Trophy,
  Building2,
  UserPlus,
  Users,
  ShieldCheck,
  Wallet,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  FileQuestion,
  Receipt,
  Menu,
  X
} from 'lucide-react';
import { toAssetUrl } from '../services/api.js';
import './Sidebar.css';

function Sidebar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role || 'admin';
  const isAdminRole = role === 'admin' || role === 'super_admin';

  // Submenu LMS untuk Admin
  const adminLmsItems = [
    { path: '/dashboard/siswa/ruang-belajar', icon: BookOpen, label: 'Ruang Belajar' },
    { path: '/dashboard/siswa/tugas', icon: ClipboardCheck, label: 'Tugas Mingguan' },
    { path: '/dashboard/admin/periode-ujian', icon: Calendar, label: 'Periode Ujian' },
    { path: '/dashboard/admin/peserta-ujian', icon: ClipboardCheck, label: 'Peserta Ujian' },
    { path: '/dashboard/admin/master-mapel', icon: BookMarked, label: 'Master Mapel' },
    { path: '/dashboard/admin/mapel-rombel', icon: Network, label: 'Mapel per Rombel' },
    { path: '/dashboard/admin/klub', icon: Trophy, label: 'Klub Minat Bakat' },
  ];

  // Submenu Pusat Administrasi untuk Admin
  const adminAdminItems = [
    { path: '/dashboard/admin/spmb', icon: UserPlus, label: 'Verifikasi SPMB' },
    { path: '/dashboard/admin/siswa', icon: Users, label: 'Data Siswa' },
    ...(role === 'super_admin' || role === 'admin'
      ? [{ path: '/dashboard/admin/users', icon: ShieldCheck, label: 'Manajemen User' }]
      : []),
  ];

  // Cek apakah route aktif berada di LMS atau Pusat Administrasi
  const isLmsActive = adminLmsItems.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
  const isAdminActive = adminAdminItems.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));

  // Accordion state: otomatis buka HANYA jika route aktif ada di grup tersebut
  const [lmsOpen, setLmsOpen] = useState(isLmsActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  useEffect(() => {
    if (isLmsActive) setLmsOpen(true);
    if (isAdminActive) setAdminOpen(true);
  }, [location.pathname, isLmsActive, isAdminActive]);

  // Tutup menu mobile ketika navigasi berpindah
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Kunci scroll saat sidebar mobile terbuka
  useEffect(() => {
    document.body.classList.toggle('sidebar-open-mobile', mobileOpen);
    return () => document.body.classList.remove('sidebar-open-mobile');
  }, [mobileOpen]);

  // Fungsi logout
  const handleLogout = () => {
    setMobileOpen(false);
    localStorage.removeItem('pkbm_token');
    localStorage.removeItem('pkbm_user');
    navigate('/login');
  };

  return (
    <>
      {/* Tombol Toggle Mobile Modern */}
      <button
        type="button"
        className={`modern-mobile-toggle ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label={mobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div
          className="modern-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Container Sidebar Modern */}
      <aside className={`modern-app-sidebar ${mobileOpen ? 'open' : ''}`}>
        
        {/* ── Brand Logo Header: Logo di Tengah Tanpa Latar Belakang ── */}
        <div className="modern-sidebar-header">
          <NavLink
            to={isAdminRole ? '/dashboard/admin' : role === 'warga_belajar' ? '/dashboard/siswa' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/pimpinan'}
            className="modern-brand-center"
          >
            <div className="brand-logo-clean-wrap">
              <img
                src="/images/logo_pkbm.png"
                alt="Logo Resmi PKBM Bina Mandiri"
                className="brand-logo-clean"
              />
            </div>
            <div className="brand-text-center">
              <span className="brand-name-main">PKBM Bina Mandiri</span>
              <span className="brand-sub-badge">PORTAL AKADEMIK</span>
            </div>
          </NavLink>
        </div>

        {/* ── Navigasi Menu ── */}
        <nav className="modern-sidebar-nav custom-scrollbar">
          <div className="nav-section-title">Menu Utama</div>
          
          <ul className="modern-menu-list">
            
            {/* 1. Beranda (sebelumnya TEKS Dashboard) */}
            <li>
              <NavLink
                to={isAdminRole ? '/dashboard/admin' : role === 'warga_belajar' ? '/dashboard/siswa' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/pimpinan'}
                end
                className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}
              >
                <LayoutDashboard size={18} className="menu-icon" />
                <span className="menu-label">Beranda</span>
              </NavLink>
            </li>

            {/* Menu Admin & Super Admin */}
            {isAdminRole && (
              <>
                {/* 2. LMS (Dropdown / Accordion) */}
                <li className="modern-accordion-item">
                  <button
                    type="button"
                    className={`modern-accordion-trigger ${isLmsActive ? 'has-active-child' : ''}`}
                    onClick={() => setLmsOpen((prev) => !prev)}
                  >
                    <div className="trigger-left">
                      <GraduationCap size={18} className="menu-icon" />
                      <span className="menu-label">LMS</span>
                    </div>
                    <div className="trigger-arrow">
                      {lmsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                  </button>

                  {lmsOpen && (
                    <ul className="modern-submenu-list">
                      {adminLmsItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              className={({ isActive }) => `modern-sub-link ${isActive ? 'active' : ''}`}
                            >
                              <Icon size={15} className="sub-menu-icon" />
                              <span className="sub-menu-label">{item.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>

                {/* 3. Pusat Administrasi (Dropdown / Accordion) */}
                <li className="modern-accordion-item">
                  <button
                    type="button"
                    className={`modern-accordion-trigger ${isAdminActive ? 'has-active-child' : ''}`}
                    onClick={() => setAdminOpen((prev) => !prev)}
                  >
                    <div className="trigger-left">
                      <Building2 size={18} className="menu-icon" />
                      <span className="menu-label">Pusat Administrasi</span>
                    </div>
                    <div className="trigger-arrow">
                      {adminOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                  </button>

                  {adminOpen && (
                    <ul className="modern-submenu-list">
                      {adminAdminItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              className={({ isActive }) => `modern-sub-link ${isActive ? 'active' : ''}`}
                            >
                              <Icon size={15} className="sub-menu-icon" />
                              <span className="sub-menu-label">{item.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>

                {/* 4. Keuangan (Menu Utama) */}
                <li>
                  <NavLink
                    to="/dashboard/admin/tagihan"
                    className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}
                  >
                    <Wallet size={18} className="menu-icon" />
                    <span className="menu-label">Keuangan</span>
                  </NavLink>
                </li>
              </>
            )}

            {/* Menu Warga Belajar */}
            {role === 'warga_belajar' && (
              <>
                <li className="modern-accordion-item">
                  <button
                    type="button"
                    className="modern-accordion-trigger"
                    onClick={() => setLmsOpen((p) => !p)}
                  >
                    <div className="trigger-left">
                      <GraduationCap size={18} className="menu-icon" />
                      <span className="menu-label">LMS Belajar</span>
                    </div>
                    {lmsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  {lmsOpen && (
                    <ul className="modern-submenu-list">
                      <li><NavLink to="/dashboard/siswa/ruang-belajar" className="modern-sub-link"><BookOpen size={15} /><span>Ruang Belajar</span></NavLink></li>
                      <li><NavLink to="/dashboard/siswa/materi" className="modern-sub-link"><BookMarked size={15} /><span>Materi Belajar</span></NavLink></li>
                      <li><NavLink to="/dashboard/siswa/tugas" className="modern-sub-link"><ClipboardCheck size={15} /><span>Tugas Mingguan</span></NavLink></li>
                      <li><NavLink to="/dashboard/siswa/absensi" className="modern-sub-link"><Calendar size={15} /><span>Absensi Saya</span></NavLink></li>
                      <li><NavLink to="/dashboard/siswa/ujian" className="modern-sub-link"><FileQuestion size={15} /><span>Ujian</span></NavLink></li>
                      <li><NavLink to="/dashboard/siswa/klub" className="modern-sub-link"><Trophy size={15} /><span>Klub Minat</span></NavLink></li>
                    </ul>
                  )}
                </li>
                <li>
                  <NavLink to="/dashboard/siswa/tagihan" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <Receipt size={18} className="menu-icon" />
                    <span className="menu-label">Tagihan Saya</span>
                  </NavLink>
                </li>
              </>
            )}

            {/* Menu Tutor */}
            {role === 'tutor' && (
              <>
                <li>
                  <NavLink to="/dashboard/siswa/ruang-belajar" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <BookOpen size={18} className="menu-icon" />
                    <span className="menu-label">Ruang Belajar</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard/tutor/kelas" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <GraduationCap size={18} className="menu-icon" />
                    <span className="menu-label">Kelas Saya</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard/tutor/absensi" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <Calendar size={18} className="menu-icon" />
                    <span className="menu-label">Absensi</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard/tutor/ujian" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <ClipboardCheck size={18} className="menu-icon" />
                    <span className="menu-label">Soal & Ujian</span>
                  </NavLink>
                </li>
              </>
            )}

            {/* Menu Pimpinan */}
            {role === 'pimpinan' && (
              <>
                <li>
                  <NavLink to="/dashboard/admin/siswa" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <Users size={18} className="menu-icon" />
                    <span className="menu-label">Data Siswa</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard/admin/tagihan" className={({ isActive }) => `modern-menu-link ${isActive ? 'active-pill' : ''}`}>
                    <Wallet size={18} className="menu-icon" />
                    <span className="menu-label">Laporan Keuangan</span>
                  </NavLink>
                </li>
              </>
            )}

          </ul>
        </nav>

        {/* ── Footer Sidebar: Profile & Logout Ringkas (Tanpa Tombol Dark/Light) ── */}
        <div className="modern-sidebar-footer">
          
          {/* Card Info User */}
          <div className="modern-user-card">
            <div className="user-avatar-wrap">
              {user?.foto_profil ? (
                <img
                  src={toAssetUrl(user.foto_profil)}
                  alt="Foto Profil"
                  className="user-avatar-img"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user?.nama_lengkap || user?.nama || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="online-indicator-dot" title="Status: Aktif"></span>
            </div>

            <div className="user-text-wrap">
              <span className="user-display-name">
                {user?.nama_lengkap || user?.nama || 'Administrator'}
              </span>
              <span className="user-status-text">
                <span className="status-dot"></span> Online
              </span>
            </div>

            <button
              type="button"
              className="quick-logout-icon-btn"
              onClick={handleLogout}
              title="Keluar dari akun"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;
