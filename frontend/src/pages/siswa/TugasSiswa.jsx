// ============================================================
// src/pages/siswa/TugasSiswa.jsx — Portal Pengumpulan Tugas Mingguan
// ============================================================
// Halaman modern LMS bagi Warga Belajar untuk melihat instruksi tugas,
// memantau deadline mingguan, mengunggah berkas pengumpulan (drag & drop),
// serta meninjau nilai dan evaluasi balik dari tutor.
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { LmsAPI, SiswaAPI, toAssetUrl } from '../../services/api.js';
import {
  ClipboardCheck,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Award,
  Calendar,
  BookOpen,
  Search,
  X,
  RefreshCw,
  Download,
  Sparkles,
  FileArchive,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Check,
  Send,
  Info
} from 'lucide-react';
import './TugasSiswa.css';

function TugasSiswa() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pkbm_user') || '{}');
    } catch {
      return {};
    }
  });

  const isStudent = user?.role === 'warga_belajar';

  // State data utama
  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // State khusus mode preview Tutor / Admin
  const [rombelOptions, setRombelOptions] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState(user?.rombel_id || '');

  // State filter & pencarian
  const [activeTab, setActiveTab] = useState('semua'); // 'semua' | 'belum' | 'mendesak' | 'dikumpul' | 'dinilai'
  const [mapelFilter, setMapelFilter] = useState('semua');
  const [pertemuanFilter, setPertemuanFilter] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDesc, setExpandedDesc] = useState({});

  // State modal upload
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [fileUpload, setFileUpload] = useState(null);
  const [catatanSiswa, setCatatanSiswa] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // State toast pemberitahuan
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // ── 1. Inisialisasi Data Pengguna & Rombel ──────────────────
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        setError('');

        if (isStudent) {
          let currentRombelId = user?.rombel_id;

          if (!currentRombelId) {
            const profilRes = await SiswaAPI.getProfilSaya();
            const profil = profilRes.data.data;
            currentRombelId = profil?.rombel_id;

            if (currentRombelId) {
              const updatedUser = {
                ...user,
                rombel_id: currentRombelId,
                nama_rombel: profil?.nama_rombel || null,
                nis: profil?.nis || user?.nis || null,
                jenjang: profil?.jenjang || user?.jenjang || null,
              };
              setUser(updatedUser);
              localStorage.setItem('pkbm_user', JSON.stringify(updatedUser));
            }
          }

          if (!currentRombelId) {
            setError('Data rombel Anda belum terdaftar. Silakan hubungi bagian Tata Usaha PKBM.');
            setTugasList([]);
            return;
          }

          setSelectedRombelId(currentRombelId);
          await loadTugas(currentRombelId);
        } else {
          // Tutor / Admin preview mode
          const rombelRes = await SiswaAPI.getRombelOptions();
          const list = rombelRes.data.data || [];
          setRombelOptions(list);

          const defaultRombel = selectedRombelId || (list.length > 0 ? list[0].id : null);
          if (defaultRombel) {
            setSelectedRombelId(defaultRombel);
            await loadTugas(defaultRombel);
          } else {
            setError('Belum ada data rombongan belajar aktif.');
          }
        }
      } catch (err) {
        console.error('[TugasSiswa.initData] Error:', err);
        setError(err.response?.data?.message || 'Gagal memuat informasi tugas.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isStudent]);

  // ── 2. Fungsi Pengambilan Data Tugas ─────────────────────────
  const loadTugas = async (rombelId) => {
    if (!rombelId) return;
    try {
      const res = await LmsAPI.getTugasByRombel(rombelId);
      setTugasList(res.data.data || []);
    } catch (err) {
      console.error('[TugasSiswa.loadTugas] Error:', err);
      setTugasList([]);
      setError(err.response?.data?.message || 'Gagal mengambil data tugas rombel.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTugas(selectedRombelId);
    setRefreshing(false);
    showToast('Data tugas mingguan berhasil diperbarui');
  };

  const handleRombelChange = async (e) => {
    const newId = e.target.value;
    setSelectedRombelId(newId);
    setLoading(true);
    await loadTugas(newId);
    setLoading(false);
  };

  // ── 3. Helper Status & Deadline ─────────────────────────────
  const getDeadlineInfo = (deadlineStr) => {
    if (!deadlineStr) {
      return {
        label: 'Tanpa Batas Waktu',
        countdown: 'Fleksibel',
        type: 'safe',
        formatted: 'Tidak ditentukan',
        isOverdue: false,
        isUrgent: false,
      };
    }

    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formatted = deadlineDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    if (diffMs < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: 'Tenggat Terlewat',
        countdown: daysAgo === 0 ? 'Lewat beberapa jam lalu' : `Lewat ${daysAgo} hari yang lalu`,
        type: 'overdue',
        formatted,
        isOverdue: true,
        isUrgent: true,
      };
    }

    if (diffHours <= 24) {
      return {
        label: 'Deadline Hari Ini!',
        countdown: diffHours <= 1 ? 'Sisa kurang dari 1 jam!' : `Sisa ${diffHours} jam lagi`,
        type: 'urgent',
        formatted,
        isOverdue: false,
        isUrgent: true,
      };
    }

    if (diffDays <= 3) {
      return {
        label: `Sisa ${diffDays} Hari`,
        countdown: `Tenggat dalam ${diffDays} hari`,
        type: 'urgent',
        formatted,
        isOverdue: false,
        isUrgent: true,
      };
    }

    return {
      label: `Sisa ${diffDays} Hari`,
      countdown: `Tenggat dalam ${diffDays} hari`,
      type: 'safe',
      formatted,
      isOverdue: false,
      isUrgent: false,
    };
  };

  // ── 4. Komputasi Statistik & Metrik ─────────────────────────
  const stats = useMemo(() => {
    const total = tugasList.length;
    let belumDikumpul = 0;
    let mendesak = 0;
    let sudahDikumpul = 0;
    let sudahDinilai = 0;
    let totalNilai = 0;

    tugasList.forEach((t) => {
      const isSubmitted = !!t.pengumpulan_saya;
      const dl = getDeadlineInfo(t.deadline);

      if (isSubmitted) {
        sudahDikumpul++;
        if (t.pengumpulan_saya?.nilai != null) {
          sudahDinilai++;
          totalNilai += parseFloat(t.pengumpulan_saya.nilai) || 0;
        }
      } else {
        belumDikumpul++;
        if (dl.isUrgent) {
          mendesak++;
        }
      }
    });

    const rataNilai = sudahDinilai > 0 ? (totalNilai / sudahDinilai).toFixed(1) : '-';
    const percentSelesai = total > 0 ? Math.round((sudahDikumpul / total) * 100) : 0;

    return {
      total,
      belumDikumpul,
      mendesak,
      sudahDikumpul,
      sudahDinilai,
      rataNilai,
      percentSelesai,
    };
  }, [tugasList]);

  // Daftar opsi mata pelajaran unik
  const mapelOptions = useMemo(() => {
    const map = new Map();
    tugasList.forEach((t) => {
      if (t.mapel_id && t.nama_mapel) {
        map.set(t.mapel_id, t.nama_mapel);
      }
    });
    return Array.from(map.entries()).map(([id, nama]) => ({ id, nama }));
  }, [tugasList]);

  // Daftar opsi pertemuan unik
  const pertemuanOptions = useMemo(() => {
    const setP = new Set();
    tugasList.forEach((t) => {
      if (t.pertemuan_ke) setP.add(t.pertemuan_ke);
    });
    return Array.from(setP).sort((a, b) => a - b);
  }, [tugasList]);

  // ── 5. Penyaringan Daftar Tugas ─────────────────────────────
  const filteredTugas = useMemo(() => {
    return tugasList.filter((item) => {
      const isSubmitted = !!item.pengumpulan_saya;
      const isGraded = item.pengumpulan_saya?.nilai != null;
      const dl = getDeadlineInfo(item.deadline);

      // Filter Tab
      if (activeTab === 'belum' && isSubmitted) return false;
      if (activeTab === 'mendesak' && (isSubmitted || !dl.isUrgent)) return false;
      if (activeTab === 'dikumpul' && (!isSubmitted || isGraded)) return false;
      if (activeTab === 'dinilai' && !isGraded) return false;

      // Filter Mapel
      if (mapelFilter !== 'semua' && String(item.mapel_id) !== String(mapelFilter)) {
        return false;
      }

      // Filter Pertemuan
      if (pertemuanFilter !== 'semua' && String(item.pertemuan_ke) !== String(pertemuanFilter)) {
        return false;
      }

      // Filter Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const judul = item.judul?.toLowerCase() || '';
        const mapel = item.nama_mapel?.toLowerCase() || '';
        const tutor = item.nama_tutor?.toLowerCase() || '';
        const desc = item.deskripsi?.toLowerCase() || '';
        if (!judul.includes(q) && !mapel.includes(q) && !tutor.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [tugasList, activeTab, mapelFilter, pertemuanFilter, searchQuery]);

  // ── 6. Handler Modal Upload & Pengumpulan ───────────────────
  const handleOpenUploadModal = (tugas) => {
    setSelectedTugas(tugas);
    setFileUpload(null);
    setCatatanSiswa(tugas.pengumpulan_saya?.catatan_siswa || '');
    setUploadError('');
    setModalUploadOpen(true);
  };

  const handleCloseUploadModal = () => {
    if (submitting) return;
    setModalUploadOpen(false);
    setSelectedTugas(null);
    setFileUpload(null);
    setCatatanSiswa('');
    setUploadError('');
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Maksimal 15 MB
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('Ukuran file melebihi batas maksimal (15 MB).');
      return;
    }

    setUploadError('');
    setFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmitPengumpulan = async () => {
    if (!selectedTugas) return;

    if (!fileUpload && !selectedTugas.pengumpulan_saya?.path_file) {
      setUploadError('Pilih berkas tugas terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setUploadError('');

    try {
      const fd = new FormData();
      if (fileUpload) {
        fd.append('file', fileUpload);
      }
      fd.append('catatan_siswa', catatanSiswa);

      const res = await LmsAPI.kumpulkanTugas(selectedTugas.id, fd);
      const updatedPengumpulan = res.data.data;

      // Update state lokal
      setTugasList((prev) =>
        prev.map((t) =>
          t.id === selectedTugas.id
            ? { ...t, pengumpulan_saya: updatedPengumpulan || { path_file: 'uploaded', nama_file: fileUpload?.name || 'File Tugas', catatan_siswa: catatanSiswa, submitted_at: new Date().toISOString() } }
            : t
        )
      );

      handleCloseUploadModal();
      showToast('🎉 Berhasil! Tugas Anda telah tersimpan dan siap dinilai oleh tutor.');
    } catch (err) {
      console.error('[TugasSiswa.handleSubmitPengumpulan] Error:', err);
      setUploadError(err.response?.data?.message || 'Gagal mengumpulkan tugas. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper render ikon file berdasarkan ekstensi
  const renderFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={20} color="#DC2626" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={20} color="#2563EB" />;
    if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet size={20} color="#059669" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive size={20} color="#D97706" />;
    return <FileText size={20} color="#4B5563" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleDesc = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content">
          <div className="tugas-page-container">

            {/* ══ 1. HERO BANNER MODERN ════════════════════════════ */}
            <div className="tugas-hero">
              <div className="tugas-hero-content">
                <div className="tugas-hero-text">
                  <h1 className="tugas-hero-title">
                    {isStudent
                      ? `Halo, ${user?.nama_lengkap || 'Warga Belajar'}!`
                      : 'Pratinjau Tugas Mingguan'}
                  </h1>
                  <p className="tugas-hero-desc">
                    {isStudent
                      ? `Kelola dan kumpulkan seluruh tugas mingguan Anda tepat waktu. Dapatkan umpan balik langsung dari tutor untuk memaksimalkan capaian belajar Anda.`
                      : `Tinjau daftar tugas mingguan yang diberikan kepada rombel dan periksa bagaimana siswa melihat instruksi serta mengunggah berkas tugas.`}
                  </p>
                </div>

                <div className="tugas-hero-stats-box">
                  <div className="tugas-progress-label">
                    <span>Kemajuan Belajar</span>
                    <span style={{ color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                      {stats.percentSelesai}%
                    </span>
                  </div>
                  <div className="tugas-progress-bar-bg">
                    <div
                      className="tugas-progress-bar-fill"
                      style={{ width: `${stats.percentSelesai}%` }}
                    />
                  </div>
                  <div className="tugas-progress-sub">
                    <strong>{stats.sudahDikumpul}</strong> dari <strong>{stats.total}</strong> tugas telah Anda serahkan
                  </div>
                </div>
              </div>
            </div>

            {/* ══ MODE PRATINJAU TUTOR / ADMIN ═════════════════════ */}
            {!isStudent && (
              <div className="tugas-preview-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Info size={18} />
                  <span>
                    <strong>Mode Pratinjau Administrator/Tutor:</strong> Anda sedang melihat antarmuka pengumpulan tugas dari sudut pandang siswa.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="select-rombel" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                    Pilih Rombel:
                  </label>
                  <select
                    id="select-rombel"
                    className="tugas-preview-select"
                    value={selectedRombelId}
                    onChange={handleRombelChange}
                  >
                    {rombelOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama} ({r.jenjang?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ══ 2. RINGKASAN METRIK KARTU ════════════════════════ */}
            <div className="tugas-stats-grid">
              {/* Total Tugas */}
              <div className="tugas-stat-card">
                <div className="tugas-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <BookOpen size={22} />
                </div>
                <div className="tugas-stat-info">
                  <span className="tugas-stat-val">{stats.total}</span>
                  <span className="tugas-stat-label">Total Tugas Aktif</span>
                </div>
              </div>

              {/* Perlu Dikerjakan */}
              <div className="tugas-stat-card">
                <div className="tugas-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Clock size={22} />
                </div>
                <div className="tugas-stat-info">
                  <span className="tugas-stat-val">{stats.belumDikumpul}</span>
                  <span className="tugas-stat-label">Perlu Dikerjakan</span>
                </div>
              </div>

              {/* Deadline Mendesak */}
              <div className="tugas-stat-card">
                <div className="tugas-stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <AlertTriangle size={22} />
                </div>
                <div className="tugas-stat-info">
                  <span className="tugas-stat-val" style={{ color: stats.mendesak > 0 ? '#DC2626' : 'inherit' }}>
                    {stats.mendesak}
                  </span>
                  <span className="tugas-stat-label">Tenggat Mendesak</span>
                </div>
              </div>

              {/* Rata-Rata Nilai */}
              <div className="tugas-stat-card">
                <div className="tugas-stat-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                  <Award size={22} />
                </div>
                <div className="tugas-stat-info">
                  <span className="tugas-stat-val">{stats.rataNilai}</span>
                  <span className="tugas-stat-label">Rata-Rata Nilai ({stats.sudahDinilai} dinilai)</span>
                </div>
              </div>
            </div>

            {/* ══ 3. KONTROL FILTER & PENCARIAN ════════════════════ */}
            <div className="tugas-filter-card">
              {/* Tab Navigasi Status */}
              <div className="tugas-tab-pills">
                <button
                  type="button"
                  className={`tugas-tab-pill ${activeTab === 'semua' ? 'active' : ''}`}
                  onClick={() => setActiveTab('semua')}
                >
                  <ClipboardCheck size={14} />
                  <span>Semua Tugas</span>
                  <span className="tugas-tab-count">{stats.total}</span>
                </button>

                <button
                  type="button"
                  className={`tugas-tab-pill ${activeTab === 'belum' ? 'active' : ''}`}
                  onClick={() => setActiveTab('belum')}
                >
                  <Clock size={14} />
                  <span>Belum Dikumpulkan</span>
                  <span className="tugas-tab-count">{stats.belumDikumpul}</span>
                </button>

                <button
                  type="button"
                  className={`tugas-tab-pill ${activeTab === 'mendesak' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mendesak')}
                >
                  <AlertTriangle size={14} />
                  <span>Mendesak</span>
                  {stats.mendesak > 0 && <span className="tugas-tab-count">{stats.mendesak}</span>}
                </button>

                <button
                  type="button"
                  className={`tugas-tab-pill ${activeTab === 'dikumpul' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dikumpul')}
                >
                  <CheckCircle2 size={14} />
                  <span>Sudah Dikumpul</span>
                  <span className="tugas-tab-count">{stats.sudahDikumpul - stats.sudahDinilai}</span>
                </button>

                <button
                  type="button"
                  className={`tugas-tab-pill ${activeTab === 'dinilai' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dinilai')}
                >
                  <Award size={14} />
                  <span>Selesai Dinilai</span>
                  <span className="tugas-tab-count">{stats.sudahDinilai}</span>
                </button>
              </div>

              {/* Baris Pencarian & Dropdown Mapel / Pertemuan */}
              <div className="tugas-filter-row">
                <div className="tugas-search-box">
                  <Search size={16} className="tugas-search-icon" />
                  <input
                    type="text"
                    className="tugas-search-input"
                    placeholder="Cari judul tugas, mata pelajaran, atau tutor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="tugas-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Bersihkan pencarian"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="tugas-dropdown-group">
                  {/* Filter Mapel */}
                  <select
                    className="tugas-select-filter"
                    value={mapelFilter}
                    onChange={(e) => setMapelFilter(e.target.value)}
                  >
                    <option value="semua">Semua Mata Pelajaran</option>
                    {mapelOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>

                  {/* Filter Pertemuan / Minggu */}
                  <select
                    className="tugas-select-filter"
                    value={pertemuanFilter}
                    onChange={(e) => setPertemuanFilter(e.target.value)}
                  >
                    <option value="semua">Semua Pertemuan / Minggu</option>
                    {pertemuanOptions.map((p) => (
                      <option key={p} value={p}>
                        Pertemuan ke-{p} (Minggu {p})
                      </option>
                    ))}
                  </select>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.55rem 0.85rem', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    title="Segarkan data tugas"
                  >
                    <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
                    <span>Segarkan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ══ 4. DAFTAR KARTU TUGAS MINGGUAN ═══════════════════ */}
            {loading ? (
              <div className="loading-container" style={{ padding: '4rem 1rem' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Memuat tugas mingguan...
                </p>
              </div>
            ) : error ? (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#991B1B', marginBottom: '0.5rem' }}>
                  Tidak Dapat Memuat Data
                </h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto 1.5rem' }}>
                  {error}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRefresh}
                >
                  <RefreshCw size={15} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            ) : filteredTugas.length === 0 ? (
              <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    fontSize: '2rem',
                  }}
                >
                  <ClipboardCheck size={36} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {tugasList.length === 0 ? 'Belum Ada Tugas' : 'Tugas Tidak Ditemukan'}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: 420, margin: '0 auto 1.5rem', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                  {tugasList.length === 0
                    ? 'Tutor belum mengunggah penugasan mingguan untuk rombongan belajar ini.'
                    : 'Tidak ada tugas yang sesuai dengan kriteria filter atau pencarian Anda.'}
                </p>
                {(activeTab !== 'semua' || mapelFilter !== 'semua' || pertemuanFilter !== 'semua' || searchQuery) && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setActiveTab('semua');
                      setMapelFilter('semua');
                      setPertemuanFilter('semua');
                      setSearchQuery('');
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="tugas-cards-container">
                {filteredTugas.map((t) => {
                  const dl = getDeadlineInfo(t.deadline);
                  const isSubmitted = !!t.pengumpulan_saya;
                  const isGraded = t.pengumpulan_saya?.nilai != null;
                  const isDescOpen = !!expandedDesc[t.id];

                  // Tentukan kelas status untuk border strip
                  let cardStatusClass = 'status-pending';
                  if (isGraded) cardStatusClass = 'status-graded';
                  else if (isSubmitted) cardStatusClass = 'status-submitted';
                  else if (dl.isUrgent) cardStatusClass = 'status-urgent';

                  return (
                    <div key={t.id} className={`tugas-item-card ${cardStatusClass}`}>
                      {/* Header Kartu */}
                      <div className="tugas-card-header">
                        <div className="tugas-card-meta-left">
                          {/* Chip Mata Pelajaran */}
                          <span className="tugas-subject-chip">
                            <BookOpen size={13} />
                            <span>{t.nama_mapel}</span>
                          </span>

                          {/* Chip Pertemuan / Minggu */}
                          {t.pertemuan_ke ? (
                            <span className="tugas-week-chip">
                              <Calendar size={13} />
                              <span>Pertemuan ke-{t.pertemuan_ke}</span>
                            </span>
                          ) : (
                            <span className="tugas-week-chip">
                              <Calendar size={13} />
                              <span>Tugas Rutin</span>
                            </span>
                          )}

                          {/* Bobot Nilai Maksimal */}
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            Maks: {Math.round(t.nilai_maks || 100)} Poin
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isGraded ? (
                            <span className="tugas-status-badge graded">
                              <Award size={13} />
                              <span>Dinilai: {t.pengumpulan_saya.nilai}</span>
                            </span>
                          ) : isSubmitted ? (
                            <span className="tugas-status-badge submitted">
                              <CheckCircle2 size={13} />
                              <span>Terkumpul</span>
                            </span>
                          ) : dl.isUrgent ? (
                            <span className="tugas-status-badge urgent">
                              <AlertTriangle size={13} />
                              <span>{dl.label}</span>
                            </span>
                          ) : (
                            <span className="tugas-status-badge pending">
                              <Clock size={13} />
                              <span>{dl.label}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Judul Tugas */}
                      <h2 className="tugas-card-title">{t.judul}</h2>

                      {/* Sub-meta: Tutor & Tenggat Waktu */}
                      <div className="tugas-card-submeta">
                        <div className="tugas-submeta-item">
                          <span>Tutor:</span>
                          <strong>{t.nama_tutor || 'Tutor Pengampu'}</strong>
                        </div>
                        <div className="tugas-submeta-item">
                          <span>Batas Waktu:</span>
                          <span
                            className={`tugas-deadline-text ${isSubmitted ? 'safe' : dl.isOverdue ? 'overdue' : dl.isUrgent ? 'urgent' : 'safe'
                              }`}
                          >
                            {dl.formatted}
                          </span>
                          {!isSubmitted && (
                            <span style={{ fontSize: '0.72rem', color: dl.isUrgent ? '#DC2626' : 'var(--color-text-muted)' }}>
                              ({dl.countdown})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deskripsi & Instruksi Pengerjaan */}
                      {t.deskripsi && (
                        <div className="tugas-desc-box">
                          {isDescOpen || t.deskripsi.length <= 220
                            ? t.deskripsi
                            : `${t.deskripsi.substring(0, 220)}...`}

                          {t.deskripsi.length > 220 && (
                            <button
                              type="button"
                              onClick={() => toggleDesc(t.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                                fontSize: 'var(--text-xs)',
                                cursor: 'pointer',
                                marginLeft: '0.5rem',
                              }}
                            >
                              {isDescOpen ? (
                                <>Sembunyikan <ChevronUp size={13} /></>
                              ) : (
                                <>Baca Selengkapnya <ChevronDown size={13} /></>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Info Pengumpulan Tugas (Jika Siswa Telah Mengumpulkan) */}
                      {isSubmitted && (
                        <div className={`tugas-submission-panel ${isGraded ? 'has-grade' : ''}`}>
                          <div className="tugas-submission-header">
                            <div className="tugas-submission-title">
                              <CheckCircle2 size={16} color={isGraded ? '#059669' : '#2563EB'} />
                              <span>
                                {isGraded ? 'Tugas Telah Selesai Dinilai' : 'Tugas Berhasil Diserahkan'}
                              </span>
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              Diserahkan:{' '}
                              {t.pengumpulan_saya.submitted_at
                                ? new Date(t.pengumpulan_saya.submitted_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : '-'}
                            </span>
                          </div>

                          {/* Lampiran Berkas Siswa */}
                          {t.pengumpulan_saya.path_file && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <a
                                href={toAssetUrl(t.pengumpulan_saya.path_file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tugas-file-badge"
                                title="Klik untuk membuka/mengunduh berkas"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  {renderFileIcon(t.pengumpulan_saya.nama_file)}
                                  <span>{t.pengumpulan_saya.nama_file || 'Berkas Tugas Siswa'}</span>
                                </div>
                                <Download size={14} />
                              </a>
                            </div>
                          )}

                          {/* Catatan Siswa saat Pengumpulan */}
                          {t.pengumpulan_saya.catatan_siswa && (
                            <p className="tugas-student-note">
                              "{t.pengumpulan_saya.catatan_siswa}"
                            </p>
                          )}

                          {/* Blok Penilaian & Feedback Tutor */}
                          {isGraded ? (
                            <div className="tugas-grade-evaluation">
                              <div className="tugas-grade-score-capsule">
                                <div className="tugas-grade-score-val">{t.pengumpulan_saya.nilai}</div>
                                <div className="tugas-grade-score-max">/ {Math.round(t.nilai_maks || 100)} Poin</div>
                              </div>
                              <div className="tugas-grade-feedback">
                                <div className="tugas-grade-tutor-name">
                                  Ulasan & Catatan Evaluasi Tutor:
                                </div>
                                <div className="tugas-grade-feedback-text">
                                  {t.pengumpulan_saya.feedback_tutor ||
                                    'Pekerjaan Anda telah diperiksa dan dinilai dengan baik. Terus tingkatkan kualitas belajarmu!'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: '#4B5563' }}>
                              <span className="status-ping-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                              <span>Menunggu koreksi & penilaian dari Tutor pengampu.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tombol Aksi di Bawah Kartu */}
                      <div className="tugas-card-footer">
                        {!isSubmitted ? (
                          <button
                            type="button"
                            className="btn-upload-tugas"
                            onClick={() => handleOpenUploadModal(t)}
                          >
                            <UploadCloud size={16} />
                            <span>Kumpulkan Tugas</span>
                          </button>
                        ) : !isGraded ? (
                          <button
                            type="button"
                            className="btn-reupload-tugas"
                            onClick={() => handleOpenUploadModal(t)}
                          >
                            <UploadCloud size={15} />
                            <span>Kirim Ulang / Perbarui File</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Check size={16} />
                            <span>Tugas Tuntas</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ 5. MODAL UNGGAH TUGAS (DRAG & DROP) ══════════════ */}
            {modalUploadOpen && selectedTugas && (
              <div
                className="tugas-modal-overlay"
                onClick={handleCloseUploadModal}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="tugas-modal-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="tugas-modal-header">
                    <div>
                      <h3 className="tugas-modal-title">
                        {selectedTugas.pengumpulan_saya ? 'Perbarui Pengumpulan Tugas' : 'Unggah Jawaban Tugas'}
                      </h3>
                      <p className="tugas-modal-sub">
                        {selectedTugas.nama_mapel} • {selectedTugas.judul}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tugas-modal-close"
                      onClick={handleCloseUploadModal}
                      aria-label="Tutup jendela"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="tugas-modal-body">
                    {uploadError && (
                      <div className="alert alert-danger" style={{ padding: '0.65rem 0.85rem', fontSize: 'var(--text-xs)' }}>
                        <AlertTriangle size={16} />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Area Drag & Drop */}
                    <div
                      className={`tugas-dropzone ${isDragOver ? 'dragover' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="tugas-dropzone-icon">
                        <UploadCloud size={28} />
                      </div>
                      <div className="tugas-dropzone-title">
                        Tarik & lepaskan file Anda di sini, atau <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Pilih File</span>
                      </div>
                      <div className="tugas-dropzone-hint">
                        Format didukung: PDF, Word (.docx), Excel (.xlsx), Foto (.jpg, .png), atau Arsip (.zip). Maksimal 15 MB.
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {/* Pratinjau File yang Dipilih */}
                    {fileUpload && (
                      <div className="tugas-file-preview-card">
                        <div className="tugas-file-preview-left">
                          <div className="tugas-file-preview-icon">
                            {renderFileIcon(fileUpload.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="tugas-file-preview-name" title={fileUpload.name}>
                              {fileUpload.name}
                            </div>
                            <div className="tugas-file-preview-size">
                              {formatFileSize(fileUpload.size)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="tugas-file-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileUpload(null);
                          }}
                          title="Hapus file terpilih"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}

                    {/* Catatan untuk Tutor */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        Catatan untuk Tutor (Opsional)
                      </label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Contoh: Selamat siang Tutor, berikut tugas analisis yang telah saya kerjakan sesuai instruksi pada modul pertemuan ke-3..."
                        value={catatanSiswa}
                        onChange={(e) => setCatatanSiswa(e.target.value)}
                        disabled={submitting}
                        style={{ fontSize: 'var(--text-xs)', resize: 'vertical' }}
                      />
                    </div>

                    {/* Panduan Singkat */}
                    <div className="tugas-guidelines-box">
                      <div className="tugas-guidelines-title">
                        <Check size={14} />
                        <span>Panduan Pengumpulan Tugas:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                        <li>Pastikan tugas merupakan hasil pengerjaan mandiri yang orisinal.</li>
                        <li>Gunakan format file resmi agar berkas dapat dibuka dengan jelas oleh Tutor.</li>
                        <li>Anda dapat memperbarui tugas sebelum Tutor memberikan penilaian final.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="tugas-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCloseUploadModal}
                      disabled={submitting}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmitPengumpulan}
                      disabled={submitting || (!fileUpload && !selectedTugas.pengumpulan_saya?.path_file)}
                    >
                      {submitting ? (
                        <>
                          <div className="spinner-sm" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Kirim Tugas Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ 6. TOAST NOTIFIKASI SUKSES ══════════════════════ */}
            {toastMessage && (
              <div className="tugas-toast-success" role="alert">
                <CheckCircle2 size={20} color="#34D399" />
                <span>{toastMessage}</span>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default TugasSiswa;
