// ============================================================
// src/pages/admin/AbsensiAdmin.jsx — Kelola Presensi KBM Admin
// PKBM Bina Mandiri — Desain Elegan, Modern, & Sederhana
// Jadwal KBM Khusus: 20 Pertemuan Sabtu & 20 Pertemuan Minggu
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, AbsensiAPI } from '../../services/api.js';
import { 
  CalendarCheck, BookOpen, RefreshCw, Filter, 
  CheckCircle2, Clock, Coffee, 
  Users, Check, X, AlertCircle, ArrowRight,
  Info, Edit2, Trash2
} from 'lucide-react';
import '../siswa/AbsensiSiswa.css';
import './AbsensiAdmin.css';

const TOTAL_SESI_PER_HARI = 20; // 20 Pertemuan Sabtu & 20 Pertemuan Minggu

export default function AbsensiAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // Deteksi Hari Ini & Akhir Pekan
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Minggu, 6 = Sabtu, 1..5 = Senin..Jumat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = dayNames[dayOfWeek];

  // Helper mendapatkan tanggal Sabtu dan Minggu terdekat
  const getUpcomingSaturday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 && d.getHours() >= 17 ? 7 : diff));
    return d.toISOString().split('T')[0];
  };

  const getUpcomingSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 && d.getHours() >= 17 ? 7 : diff));
    return d.toISOString().split('T')[0];
  };

  const satDate = getUpcomingSaturday();
  const sunDate = getUpcomingSunday();

  // Tab Navigasi Menu Kelas: 'sabtu' | 'minggu' | 'rekap'
  const [activeTab, setActiveTab] = useState(dayOfWeek === 0 ? 'minggu' : 'sabtu');

  // ── State: Rombongan Belajar & Filter ─────────────────────
  const [rombelList, setRombelList] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState('semua');
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── State: Data Matriks Presensi & Loading ────────────────
  const [loading, setLoading] = useState(true);
  const [rekapData, setRekapData] = useState(null);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null); // 'Sabtu-1', dll.
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // ── State: Modal Input Presensi Siswa di Matriks ───────────
  const [editModal, setEditModal] = useState({
    isOpen: false,
    sesiId: null,
    pertemuanKe: 1,
    tanggal: '',
    wargaBelajarId: null,
    namaSiswa: '',
    nis: '',
    currentStatus: 'hadir',
    catatan: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── 1. Ambil Opsi Rombel ──────────────────────────────────
  useEffect(() => {
    const fetchRombel = async () => {
      try {
        const res = await SiswaAPI.getRombelOptions();
        const rombels = res.data?.data || [];
        setRombelList(rombels);
        if (rombels.length > 0) {
          setSelectedRombelId(String(rombels[0].id));
        }
      } catch (err) {
        console.error('[AbsensiAdmin.fetchRombel] Error:', err);
        setError('Gagal memuat opsi rombongan belajar.');
      }
    };
    fetchRombel();
  }, []);

  // Filter rombel berdasarkan Jenjang Tab (Semua, Paket A, Paket B, Paket C)
  const filteredRombelList = useMemo(() => {
    return rombelList.filter(r => {
      if (selectedJenjang === 'semua') return true;
      const name = (r.nama_rombel || r.nama || '').toLowerCase();
      return name.includes(selectedJenjang.toLowerCase());
    });
  }, [rombelList, selectedJenjang]);

  const handleSelectJenjang = (jenjang) => {
    setSelectedJenjang(jenjang);
    const matched = rombelList.filter(r => {
      if (jenjang === 'semua') return true;
      const name = (r.nama_rombel || r.nama || '').toLowerCase();
      return name.includes(jenjang.toLowerCase());
    });
    if (matched.length > 0) {
      setSelectedRombelId(String(matched[0].id));
    }
  };

  // ── 2. Ambil Opsi Mapel untuk Rombel Terpilih ──────────────
  useEffect(() => {
    if (!selectedRombelId) {
      setMapelList([]);
      setSelectedMapelId('');
      return;
    }

    const fetchMapel = async () => {
      try {
        const res = await SiswaAPI.getMapelOptions({ rombel_id: selectedRombelId });
        setMapelList(res.data?.data || []);
        setSelectedMapelId('');
      } catch (err) {
        console.error('[AbsensiAdmin.fetchMapel] Error:', err);
      }
    };
    fetchMapel();
  }, [selectedRombelId]);

  // ── 3. Ambil Rekapitulasi Presensi & Sesi Rombel ───────────
  const fetchRekapMatriks = useCallback(async () => {
    if (!selectedRombelId) return;

    setLoading(true);
    setError('');
    try {
      const res = await AbsensiAPI.getRekapMatriks({
        rombel_id: selectedRombelId,
        mapel_id: selectedMapelId || undefined,
      });
      setRekapData(res.data?.data || null);
    } catch (err) {
      console.warn('[AbsensiAdmin.fetchRekapMatriks] Menggunakan fallback sesi rombel:', err);
      try {
        const [sesiRes, siswaRes] = await Promise.all([
          AbsensiAPI.getSesiByRombel(selectedRombelId).catch(() => ({ data: { data: [] } })),
          SiswaAPI.getAll({ rombel_id: selectedRombelId, limit: 100 }).catch(() => ({ data: { data: [] } }))
        ]);

        const rawSesiList = (sesiRes.data?.data || []).map((s, idx) => ({
          ...s,
          pertemuan_ke: s.pertemuan_ke || (idx + 1)
        }));

        const sesiList = selectedMapelId
          ? rawSesiList.filter(s => String(s.mapel_id) === String(selectedMapelId))
          : rawSesiList;

        const siswaList = Array.isArray(siswaRes.data?.data)
          ? siswaRes.data.data
          : (siswaRes.data?.data?.warga_belajar || siswaRes.data?.data?.siswa || []);

        const matrix = siswaList.map((sw, idx) => ({
          no: idx + 1,
          warga_belajar_id: sw.id || sw.warga_belajar_id,
          nis: sw.nis || '-',
          nama_lengkap: sw.nama_lengkap || sw.nama || 'Siswa',
          kehadiran: {},
          total_h: 0,
          total_i: 0,
          total_s: 0,
          total_a: 0,
          persentase: 100,
          is_memenuhi_syarat: true
        }));

        const rombelObj = rombelList.find(r => String(r.id) === String(selectedRombelId)) || { id: selectedRombelId, nama_rombel: 'Rombel ' + selectedRombelId };
        const mapelObj = selectedMapelId ? mapelList.find(m => String(m.id) === String(selectedMapelId)) : null;

        setRekapData({
          rombel: rombelObj,
          mapel: mapelObj,
          sesi_list: sesiList,
          total_sesi: sesiList.length,
          matrix,
          statistik: {
            total_siswa: matrix.length,
            rata_rata_hadir: matrix.length > 0 ? 100 : 0,
            total_hadir: 0,
            total_izin: 0,
            total_sakit: 0,
            total_alpa: 0,
            siswa_kritis: 0
          }
        });
        setError('');
      } catch (fallbackErr) {
        console.error('[AbsensiAdmin.fetchRekapMatriks] Fallback error:', fallbackErr);
        setError('Gagal memuat data rombongan belajar.');
        setRekapData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRombelId, selectedMapelId, rombelList, mapelList]);

  useEffect(() => {
    fetchRekapMatriks();
  }, [fetchRekapMatriks]);

  // Helper mencari sesi untuk pertemuan & hari tertentu
  const getSesiItem = useCallback((pertKe, hari) => {
    if (!rekapData?.sesi_list) return null;
    return rekapData.sesi_list.find(s => {
      const matchP = Number(s.pertemuan_ke) === pertKe;
      if (!matchP) return false;

      // Cek apakah ada catatan spesifik hari
      const catatanLower = (s.catatan || '').toLowerCase();
      if (catatanLower.includes('sabtu')) return hari === 'Sabtu';
      if (catatanLower.includes('minggu')) return hari === 'Minggu';

      // Cek dari tanggal sesi
      if (s.tanggal) {
        const parts = s.tanggal.split('T')[0].split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = d.getDay();
        if (hari === 'Sabtu' && day === 6) return true;
        if (hari === 'Minggu' && day === 0) return true;
      }

      return true; // Fallback jika hanya ada 1 sesi per pertemuan
    });
  }, [rekapData?.sesi_list]);

  // ── 4. Handler 1-Click Buka Presensi Per Pertemuan ─────────
  const handleBukaPresensi = async (pertKe, hari) => {
    if (!selectedRombelId) {
      alert('Pilih rombongan belajar (kelas) terlebih dahulu.');
      return;
    }

    const actionKey = `${hari}-${pertKe}`;
    setActionLoadingId(actionKey);
    setFeedback({ type: '', msg: '' });

    try {
      const targetTanggal = hari === 'Minggu' ? sunDate : satDate;
      const payload = {
        rombel_id: Number(selectedRombelId),
        mapel_id: selectedMapelId ? Number(selectedMapelId) : null,
        pertemuan_ke: pertKe,
        tanggal: targetTanggal,
        mode: 'mandiri',
        durasi_timer: 86400, // Aktif pada hari KBM s/d 17.00 WIB
        catatan: `Pertemuan ${pertKe} Sesi ${hari}`,
      };

      const res = await AbsensiAPI.bukaSesi(payload);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          msg: `Presensi Pertemuan ${pertKe} Sesi ${hari} BERHASIL DIBUKA. Siswa sekarang dapat melakukan presensi mandiri.`
        });
        await fetchRekapMatriks();
      } else {
        setFeedback({
          type: 'error',
          msg: res.data?.message || 'Gagal membuka sesi presensi.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Terjadi kesalahan saat membuka presensi.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 5. Handler 1-Click Tutup Presensi ──────────────────────
  const handleTutupPresensi = async (sesiId, pertKe, hari) => {
    const konfirmasi = window.confirm(`Tutup presensi Pertemuan ${pertKe} (${hari})? Siswa tidak dapat mengisi presensi mandiri lagi.`);
    if (!konfirmasi) return;

    const actionKey = `${hari}-${pertKe}`;
    setActionLoadingId(actionKey);
    setFeedback({ type: '', msg: '' });

    try {
      await AbsensiAPI.tutupSesi(sesiId);
      setFeedback({
        type: 'success',
        msg: `Presensi Pertemuan ${pertKe} (${hari}) telah DITUTUP.`
      });
      await fetchRekapMatriks();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal menutup sesi presensi.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 5b. Handler Hapus / Reset Sesi Pertemuan ───────────────
  const handleHapusSesi = async (sesiId, pertKe, hari) => {
    const konfirmasi = window.confirm(`Hapus sesi Pertemuan ${pertKe} (${hari})? Status akan kembali menjadi 'Menunggu Dibuka' dan data kehadiran sesi ini akan direset.`);
    if (!konfirmasi) return;

    const actionKey = `${hari}-${pertKe}`;
    setActionLoadingId(actionKey);
    setFeedback({ type: '', msg: '' });

    try {
      await AbsensiAPI.hapusSesi(sesiId);
      setFeedback({
        type: 'success',
        msg: `Sesi Pertemuan ${pertKe} (${hari}) berhasil dihapus. Status kembali 'Menunggu Dibuka'.`
      });
      await fetchRekapMatriks();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal menghapus sesi presensi.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── 6. Handler Quick Edit 1 Siswa di Matriks Presensi ──────
  const handleOpenEditModal = (sesi, siswa, record) => {
    setEditModal({
      isOpen: true,
      sesiId: sesi.id,
      pertemuanKe: sesi.pertemuan_ke,
      tanggal: sesi.tanggal,
      wargaBelajarId: siswa.warga_belajar_id,
      namaSiswa: siswa.nama_lengkap,
      nis: siswa.nis || '—',
      currentStatus: record?.status === 'belum' ? 'alpa' : (record?.status || 'hadir'),
      catatan: record?.catatan || '',
    });
  };

  const handleSaveEditStatus = async () => {
    setSavingEdit(true);
    try {
      try {
        await AbsensiAPI.updateStatusSiswa(editModal.sesiId, editModal.wargaBelajarId, {
          status: editModal.currentStatus,
          catatan: editModal.catatan.trim() || null,
        });
      } catch (putErr) {
        if (putErr.response?.status === 404) {
          await AbsensiAPI.submitManual(editModal.sesiId, [
            { warga_belajar_id: editModal.wargaBelajarId, status: editModal.currentStatus, catatan: editModal.catatan.trim() || null }
          ]);
        } else {
          throw putErr;
        }
      }
      setEditModal(prev => ({ ...prev, isOpen: false }));
      setFeedback({
        type: 'success',
        msg: `Presensi siswa ${editModal.namaSiswa} untuk Pertemuan ${editModal.pertemuanKe} berhasil diperbarui menjadi [${editModal.currentStatus.toUpperCase()}].`
      });
      await fetchRekapMatriks();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status presensi.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter siswa berdasarkan input pencarian di tabel matriks
  const filteredMatrix = useMemo(() => {
    return (rekapData?.matrix || []).filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(item?.nama_lengkap || '').toLowerCase().includes(q) ||
        String(item?.nis || '').toLowerCase().includes(q)
      );
    });
  }, [rekapData?.matrix, searchQuery]);

  // Helper badge status sel matriks
  const getStatusBadge = (status) => {
    switch (status) {
      case 'hadir':
        return { label: 'H', className: 'hadir', title: 'Hadir Penuh' };
      case 'izin':
        return { label: 'I', className: 'izin', title: 'Izin' };
      case 'sakit':
        return { label: 'S', className: 'sakit', title: 'Sakit' };
      case 'alpa':
        return { label: 'A', className: 'alpa', title: 'Alpa / Tanpa Keterangan' };
      default:
        return { label: '—', className: 'empty', title: 'Belum Ada Presensi' };
    }
  };

  // Generate 20 Pertemuan untuk Tab Aktif (Sabtu / Minggu)
  const currentHariName = activeTab === 'minggu' ? 'Minggu' : 'Sabtu';
  const currentPertemuanList = useMemo(() => {
    return Array.from({ length: TOTAL_SESI_PER_HARI }, (_, i) => {
      const pertKe = i + 1;
      const sesi = getSesiItem(pertKe, currentHariName);
      const isAktif = sesi && sesi.status_sesi === 'aktif';
      const isSelesai = sesi && sesi.status_sesi === 'selesai';

      return {
        id: `${currentHariName.toLowerCase()}-${pertKe}`,
        pertemuan_ke: pertKe,
        hari: currentHariName,
        judul: `Pertemuan ${pertKe} Sesi ${currentHariName}`,
        subjudul: 'Sesi Pembelajaran Tatap Muka & Mandiri',
        sesi: sesi,
        isAktif: Boolean(isAktif),
        isSelesai: Boolean(isSelesai),
        isMenunggu: !sesi
      };
    });
  }, [currentHariName, getSesiItem]);

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content absensi-siswa-page absensi-admin-redesign">

          {/* ── 1. Top Header Banner ── */}
          <div className="absensi-header-card">
            <div>
              <div className="absensi-header-badge">
                <CalendarCheck size={13} />
                <span>ADMIN PRESENSI • PKBM BINA MANDIRI</span>
              </div>
              <h1 className="absensi-header-title">
                Kelola Presensi KBM (Sabtu & Minggu)
              </h1>
              <p className="absensi-header-subtitle">
                Buka dan tutup presensi per pertemuan secara langsung (20 Pertemuan Sabtu & 20 Pertemuan Minggu).
              </p>
            </div>

            <button 
              type="button"
              onClick={() => fetchRekapMatriks()}
              className="absensi-refresh-btn"
            >
              <RefreshCw size={14} />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* ── 2. Weekend Notice Banner ── */}
          <div className="weekend-schedule-banner">
            <div className="weekend-schedule-left">
              <div className="weekend-schedule-icon">
                {isWeekend ? <CalendarCheck size={20} /> : <Coffee size={20} />}
              </div>
              <div>
                <h3 className="weekend-schedule-title">
                  {isWeekend 
                    ? `Hari Ini Sesi KBM Akhir Pekan (${currentDayName})` 
                    : `Hari Ini ${currentDayName} • Waktu Belajar Mandiri`}
                </h3>
                <p className="weekend-schedule-desc">
                  {isWeekend 
                    ? `Admin dapat membuka presensi per pertemuan. Siswa dapat mengisi presensi mandiri sebelum pukul 17.00 WIB.`
                    : `Jadwal resmi pembelajaran tatap muka berlangsung setiap Sabtu & Minggu. Anda tetap dapat meninjau atau mengoreksi presensi.`}
                </p>
              </div>
            </div>

            <div className="weekend-schedule-right">
              <div className="weekend-schedule-pill">
                <span>Sabtu: {satDate}</span>
              </div>
              <div className="weekend-schedule-pill">
                <span>Minggu: {sunDate}</span>
              </div>
            </div>
          </div>

          {/* ── 3. Rombel Selector & Filter Strip ── */}
          <div className="admin-rombel-toolbar">
            <div className="admin-rombel-toolbar-left">
              <div className="admin-jenjang-chips">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'Paket A', label: 'Paket A (SD)' },
                  { id: 'Paket B', label: 'Paket B (SMP)' },
                  { id: 'Paket C', label: 'Paket C (SMA)' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleSelectJenjang(chip.id)}
                    className={`admin-jenjang-chip ${selectedJenjang === chip.id ? 'active' : ''}`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="admin-rombel-dropdown-wrap">
                <label className="admin-rombel-label">Kelas / Rombel:</label>
                <select
                  value={selectedRombelId}
                  onChange={(e) => setSelectedRombelId(e.target.value)}
                  className="admin-rombel-select"
                >
                  {filteredRombelList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nama_rombel || r.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-rombel-toolbar-right">
              {rekapData?.rombel && (
                <span className="admin-selected-rombel-pill">
                  Rombel Aktif: <strong>{rekapData.rombel.nama_rombel}</strong> ({rekapData.matrix?.length || 0} Siswa)
                </span>
              )}
            </div>
          </div>

          {/* ── 4. Feedback Alert Bar ── */}
          {feedback.msg && (
            <div className={`feedback-alert-box ${feedback.type === 'success' ? 'success' : 'error'}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{feedback.msg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback({ type: '', msg: '' })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── 5. Layout Menu Kelas (Sama Persis Tampilan Siswa) ── */}
          <div className="menu-kelas-layout">

            {/* ══ SISI KIRI: MENU KELAS (TAB SABTU, MINGGU, REKAP) ══ */}
            <aside className="menu-kelas-sidebar">
              <div className="menu-kelas-title">MENU KELAS</div>

              {/* Menu 1: Pertemuan Sabtu */}
              <button
                type="button"
                onClick={() => setActiveTab('sabtu')}
                className={`menu-kelas-btn ${activeTab === 'sabtu' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <BookOpen size={18} />
                  <span>Pertemuan Sabtu</span>
                </div>
                <span className="menu-kelas-badge">{TOTAL_SESI_PER_HARI}</span>
              </button>

              {/* Menu 2: Pertemuan Minggu */}
              <button
                type="button"
                onClick={() => setActiveTab('minggu')}
                className={`menu-kelas-btn ${activeTab === 'minggu' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <BookOpen size={18} />
                  <span>Pertemuan Minggu</span>
                </div>
                <span className="menu-kelas-badge">{TOTAL_SESI_PER_HARI}</span>
              </button>

              {/* Menu 3: Rekap Presensi / Buku Matriks */}
              <button
                type="button"
                onClick={() => setActiveTab('rekap')}
                className={`menu-kelas-btn ${activeTab === 'rekap' ? 'active' : ''}`}
              >
                <div className="menu-kelas-btn-left">
                  <CalendarCheck size={18} />
                  <span>Buku Matriks Presensi</span>
                </div>
                <span className="menu-kelas-badge">
                  {rekapData?.matrix?.length || 0} Siswa
                </span>
              </button>
            </aside>

            {/* ══ SISI KANAN: KONTEN UTAMA ══ */}
            <section className="menu-kelas-content">

              {/* ──────────────── TAB PERTEMUAN (SABTU ATAU MINGGU) ──────────────── */}
              {activeTab === 'sabtu' || activeTab === 'minggu' ? (
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">
                        Pertemuan Kelas — Sesi {currentHariName}
                      </h2>
                      <p className="pertemuan-sub-main">
                        Daftar 20 sesi {currentHariName}. Buka presensi agar siswa dapat check-in mandiri, atau tutup presensi setelah KBM berakhir.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pertemuan-count-pill">
                        20 pertemuan {currentHariName}
                      </span>
                    </div>
                  </div>

                  {/* Switch Bar Hari Sabtu / Minggu */}
                  <div className="hari-switch-bar">
                    <button
                      type="button"
                      onClick={() => setActiveTab('sabtu')}
                      className={`hari-switch-btn ${activeTab === 'sabtu' ? 'active' : ''}`}
                    >
                      <BookOpen size={16} />
                      <span>Sesi Hari Sabtu</span>
                      <span className="hari-switch-pill">20 Sesi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('minggu')}
                      className={`hari-switch-btn ${activeTab === 'minggu' ? 'active' : ''}`}
                    >
                      <BookOpen size={16} />
                      <span>Sesi Hari Minggu</span>
                      <span className="hari-switch-pill">20 Sesi</span>
                    </button>
                  </div>

                  {/* Loading State */}
                  {loading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 8px' }} />
                      <p>Memuat status presensi pertemuan...</p>
                    </div>
                  )}

                  {/* 20 Meeting Cards List (Rapi, Bersih, Sederhana) */}
                  {!loading && (
                    <div className="pertemuan-list-grid">
                      {currentPertemuanList.map((item) => {
                        const numStr = String(item.pertemuan_ke).padStart(2, '0');
                        const actionKey = `${item.hari}-${item.pertemuan_ke}`;
                        const isActionRunning = actionLoadingId === actionKey;

                        return (
                          <div
                            key={item.id}
                            className={`pertemuan-item-card admin-meeting-card ${item.isAktif ? 'is-active-card' : ''}`}
                          >
                            <div className="pertemuan-item-left">
                              <div className="pertemuan-number-box">
                                {numStr}
                              </div>
                              <div className="pertemuan-item-body">
                                <div className="pertemuan-item-title-row">
                                  <span className="pertemuan-item-title">
                                    {item.judul}
                                  </span>
                                  {item.isAktif ? (
                                    <span className="pertemuan-badge-open">
                                      🟢 Sedang Buka
                                    </span>
                                  ) : item.isSelesai ? (
                                    <span className="pertemuan-badge-closed status-ditutup">
                                      Ditutup
                                    </span>
                                  ) : (
                                    <span className="pertemuan-badge-closed status-menunggu">
                                      Menunggu Dibuka
                                    </span>
                                  )}
                                </div>
                                <p className="pertemuan-item-desc">
                                  <span>{item.subjudul}</span>
                                </p>
                              </div>
                            </div>

                            {/* ══ TOMBOL BUKA / TUTUP ELEGAN & MINIMALIS ══ */}
                            <div className="pertemuan-item-action" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {item.isAktif ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isActionRunning}
                                    onClick={() => handleTutupPresensi(item.sesi.id, item.pertemuan_ke, item.hari)}
                                    className="btn-admin-action tutup"
                                    title="Tutup sesi presensi ini agar siswa tidak dapat check-in lagi"
                                  >
                                    <Clock size={15} />
                                    <span>{isActionRunning ? 'Menutup...' : 'Tutup Presensi'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActionRunning}
                                    onClick={() => handleHapusSesi(item.sesi.id, item.pertemuan_ke, item.hari)}
                                    className="btn-admin-action hapus"
                                    title="Hapus sesi ini dan kembalikan ke status Menunggu Dibuka"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : item.isSelesai ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isActionRunning}
                                    onClick={() => handleBukaPresensi(item.pertemuan_ke, item.hari)}
                                    className="btn-admin-action reopen"
                                    title="Buka kembali sesi presensi pertemuan ini"
                                  >
                                    <RefreshCw size={14} />
                                    <span>{isActionRunning ? 'Membuka...' : 'Buka Kembali'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActionRunning}
                                    onClick={() => handleHapusSesi(item.sesi.id, item.pertemuan_ke, item.hari)}
                                    className="btn-admin-action hapus"
                                    title="Hapus sesi ini dan kembalikan ke status Menunggu Dibuka"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isActionRunning}
                                  onClick={() => handleBukaPresensi(item.pertemuan_ke, item.hari)}
                                  className="btn-admin-action buka"
                                  title="Buka sesi presensi untuk pertemuan ini agar siswa dapat check-in"
                                >
                                  <CheckCircle2 size={15} />
                                  <span>{isActionRunning ? 'Membuka...' : 'Buka Presensi'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (

                /* ──────────────── TAB REKAP & BUKU MATRIKS PRESENSI ──────────────── */
                <div>
                  <div className="pertemuan-header-strip">
                    <div>
                      <h2 className="pertemuan-title-main">
                        Buku Matriks Presensi: {rekapData?.rombel?.nama_rombel || 'Kelas'}
                      </h2>
                      <p className="pertemuan-sub-main">
                        Rekapitulasi lengkap kehadiran seluruh siswa. Klik kotak status (H/I/S/A) pada siswa untuk mengoreksi kehadiran.
                      </p>
                    </div>
                  </div>

                  {/* Helper Petunjuk Input Manual */}
                  <div className="admin-matrix-hint-card">
                    <Info size={16} className="hint-icon" />
                    <span>
                      <strong>Petunjuk Absen Manual:</strong> Klik langsung pada kotak status <strong>[ H ] [ I ] [ S ] [ A ]</strong> di tabel siswa mana pun untuk mengubah kehadirannya jika siswa masuk kelas tetapi lupa absen mandiri.
                    </span>
                  </div>

                  {/* Summary Metric Strip */}
                  {rekapData?.statistik && (
                    <div className="admin-stats-strip">
                      <div className="admin-stat-box">
                        <span className="lbl">Total Siswa</span>
                        <strong className="val">{rekapData.total_siswa || 0}</strong>
                      </div>
                      <div className="admin-stat-box">
                        <span className="lbl">Total Masuk Siswa</span>
                        <strong className="val" style={{ color: '#16A34A' }}>
                          {rekapData.statistik?.total_hadir || 0} Hari
                        </strong>
                      </div>
                      <div className="admin-stat-box">
                        <span className="lbl">Total Sesi Diadakan</span>
                        <strong className="val">{rekapData.total_sesi || 0}</strong>
                      </div>
                      <div className="admin-stat-box">
                        <span className="lbl">Perlu Pembinaan</span>
                        <strong className="val" style={{ color: rekapData.statistik.siswa_kritis > 0 ? '#DC2626' : '#16A34A' }}>
                          {rekapData.statistik.siswa_kritis} Siswa
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Search & Filter Mapel */}
                  <div className="admin-matrix-filter-row">
                    <div className="admin-search-wrap">
                      <input
                        type="text"
                        placeholder="Cari nama warga belajar atau NIS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-search-input"
                      />
                    </div>

                    <div className="admin-mapel-wrap">
                      <select
                        value={selectedMapelId}
                        onChange={(e) => setSelectedMapelId(e.target.value)}
                        className="admin-mapel-select"
                      >
                        <option value="">-- Rekap Gabungan Seluruh Mapel --</option>
                        {mapelList.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.kode ? `[${m.kode}] ` : ''}{m.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Legend */}
                    <div className="admin-matrix-legend">
                      <span className="legend-badge hadir">H: Hadir</span>
                      <span className="legend-badge izin">I: Izin</span>
                      <span className="legend-badge sakit">S: Sakit</span>
                      <span className="legend-badge alpa">A: Alpa</span>
                    </div>
                  </div>

                  {/* Matriks Table */}
                  {filteredMatrix.length === 0 ? (
                    <div className="admin-empty-state-box">
                      <Users size={48} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                      <h3 className="admin-empty-title">Tidak Ada Data Warga Belajar</h3>
                      <p className="admin-empty-desc">
                        {searchQuery
                          ? `Tidak ditemukan warga belajar dengan kata kunci "${searchQuery}".`
                          : 'Belum ada warga belajar yang terdaftar aktif pada rombongan belajar ini.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Petunjuk Geser Layar Mobile */}
                      <div className="admin-mobile-table-hint">
                        <ArrowRight size={14} />
                        <span>Geser tabel ke samping untuk melihat sesi pertemuan & total masuk</span>
                      </div>

                      <div className="admin-matrix-scroll-wrapper">
                        <table className="admin-matrix-table">
                        <thead>
                          <tr>
                            <th className="sticky-col-no">No</th>
                            <th className="sticky-col-nis">NIS</th>
                            <th className="sticky-col-name">Nama Warga Belajar</th>
                            {rekapData.sesi_list?.map((sesi) => {
                              const d = sesi.tanggal ? new Date(sesi.tanggal) : null;
                              const isSabtu = d ? d.getDay() === 6 : true;
                              const dateLabel = d ? `${d.getDate()}/${d.getMonth() + 1}` : '';

                              return (
                                <th
                                  key={sesi.id}
                                  style={{
                                    minWidth: 64,
                                    background: sesi.status_sesi === 'aktif' ? '#EFF6FF' : '#F8FAFC'
                                  }}
                                  title={`Pertemuan ${sesi.pertemuan_ke} • ${sesi.tanggal} • Klik sel siswa untuk ubah`}
                                >
                                  <div className="header-sesi-card">
                                    <span className="header-sesi-p-tag">P{sesi.pertemuan_ke}</span>
                                    <span className={`header-sesi-day-tag ${isSabtu ? 'sabtu' : 'minggu'}`}>
                                      {isSabtu ? 'Sab' : 'Min'}
                                    </span>
                                    <span className="header-sesi-date-tag">{dateLabel}</span>
                                  </div>
                                </th>
                              );
                            })}
                            <th style={{ width: 40, color: '#15803D' }}>H</th>
                            <th style={{ width: 40, color: '#92400E' }}>I</th>
                            <th style={{ width: 40, color: '#1E40AF' }}>S</th>
                            <th style={{ width: 40, color: '#991B1B' }}>A</th>
                            <th style={{ width: 110, color: '#0F172A' }}>Total Masuk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMatrix.map((siswa) => (
                            <tr key={siswa.warga_belajar_id}>
                              <td className="sticky-col-no">{siswa.no}</td>
                              <td className="sticky-col-nis">{siswa.nis || '—'}</td>
                              <td className="sticky-col-name">
                                <div className="admin-student-name-box">
                                  <div className="admin-student-avatar">
                                    {siswa.nama_lengkap?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <span className="admin-student-fullname">{siswa.nama_lengkap}</span>
                                </div>
                              </td>

                              {/* Status per Sesi (Klik untuk input / ubah status manual) */}
                              {rekapData.sesi_list?.map((sesi) => {
                                const rec = siswa.kehadiran?.[sesi.id];
                                const badge = getStatusBadge(rec?.status);

                                return (
                                  <td key={sesi.id}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(sesi, siswa, rec)}
                                      className={`cell-badge-btn ${badge.className}`}
                                      title={`${siswa.nama_lengkap} • P${sesi.pertemuan_ke}: Status ${badge.title} — Klik untuk input/ubah`}
                                    >
                                      {badge.label}
                                    </button>
                                  </td>
                                );
                              })}

                              {/* Ringkasan Kehadiran */}
                              <td style={{ fontWeight: 700, color: '#15803D' }}>{siswa.total_h}</td>
                              <td style={{ fontWeight: 700, color: '#92400E' }}>{siswa.total_i}</td>
                              <td style={{ fontWeight: 700, color: '#1E40AF' }}>{siswa.total_s}</td>
                              <td style={{ fontWeight: 700, color: '#991B1B' }}>{siswa.total_a}</td>
                              <td>
                                <span className={`admin-masuk-badge ${siswa.total_h > 0 ? 'hadir' : 'nol'}`}>
                                  {siswa.total_h} Hari
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </div>
              )}

            </section>
          </div>

          {/* ════ MODAL UBAH STATUS SISWA (ABSEN MANUAL DARI MATRIKS) ════ */}
          {editModal.isOpen && (
            <div className="admin-modal-overlay" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>
              <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
                <div className="admin-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit2 size={18} style={{ color: '#0284C7' }} />
                    <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>
                      Ubah Status Presensi Siswa
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                    className="admin-modal-close-btn"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="admin-modal-body">
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>
                      {editModal.namaSiswa}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.82rem', marginTop: 3 }}>
                      NIS: <strong>{editModal.nis}</strong> • Pertemuan <strong>P{editModal.pertemuanKe}</strong> {editModal.tanggal ? (() => { try { const d = new Date(editModal.tanggal); return !isNaN(d.getTime()) ? `(${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })})` : ''; } catch { return ''; } })() : ''}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                      Pilih Status Kehadiran
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {[
                        { val: 'hadir', label: 'Hadir (H)', className: 'hadir' },
                        { val: 'izin', label: 'Izin (I)', className: 'izin' },
                        { val: 'sakit', label: 'Sakit (S)', className: 'sakit' },
                        { val: 'alpa', label: 'Alpa (A)', className: 'alpa' },
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setEditModal({ ...editModal, currentStatus: item.val })}
                          className={`cell-badge-btn ${item.className}`}
                          style={{
                            width: '100%',
                            height: 42,
                            borderRadius: 8,
                            border: editModal.currentStatus === item.val ? '2px solid #0284C7' : '1px solid #CBD5E1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            boxShadow: editModal.currentStatus === item.val ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
                          }}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                      Catatan / Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Masuk kelas tapi lupa absen mandiri"
                      value={editModal.catatan}
                      onChange={(e) => setEditModal({ ...editModal, catatan: e.target.value })}
                      className="admin-filter-input"
                      style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid #CBD5E1', padding: '6px 12px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditStatus}
                    disabled={savingEdit}
                    style={{
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <Check size={16} />
                    <span>{savingEdit ? 'Menyimpan...' : 'Simpan Presensi'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
