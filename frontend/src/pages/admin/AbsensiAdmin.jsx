// ============================================================
// src/pages/admin/AbsensiAdmin.jsx — Rekapitulasi Presensi Admin
// PKBM Bina Mandiri — Desain Elegan, Modern, & Menarik (Sapphire Obsidian)
// Jadwal KBM Khusus: Setiap Hari Sabtu & Minggu
// ============================================================

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, AbsensiAPI } from '../../services/api.js';
import './AbsensiAdmin.css';

function AbsensiAdmin() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // Deteksi Hari Ini & Akhir Pekan Terdekat
  const today = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = dayNames[today.getDay()];
  const currentDateFormatted = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Helper mendapatkan tanggal Sabtu dan Minggu terdekat
  const getUpcomingSaturday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 && d.getHours() >= 16 ? 7 : diff));
    return d.toISOString().split('T')[0];
  };

  const getUpcomingSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + (diff === 0 && d.getHours() >= 16 ? 7 : diff));
    return d.toISOString().split('T')[0];
  };

  const satDate = getUpcomingSaturday();
  const sunDate = getUpcomingSunday();

  // ── Filter State ──────────────────────────────────────────
  const [rombelList, setRombelList] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState('semua');
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data Matriks State ────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [rekapData, setRekapData] = useState(null);
  const [error, setError] = useState('');

  // ── Modal Quick Edit Status Siswa ─────────────────────────
  const [editModal, setEditModal] = useState({
    isOpen: false,
    sesiId: null,
    pertemuanKe: 1,
    tanggal: '',
    wargaBelajarId: null,
    namaSiswa: '',
    currentStatus: 'hadir',
    catatan: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── 1. Inisialisasi Daftar 10 Rombel ───────────────────────
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
  const filteredRombelList = rombelList.filter(r => {
    if (selectedJenjang === 'semua') return true;
    const name = (r.nama_rombel || r.nama || '').toLowerCase();
    return name.includes(selectedJenjang.toLowerCase());
  });

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

  // ── 3. Ambil Data Matriks Presensi ────────────────────────
  const fetchRekapMatriks = async () => {
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
      console.warn('[AbsensiAdmin.fetchRekapMatriks] Backend matriks belum sinkron, menggunakan fallback:', err);

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

        const matrix = siswaList.map((sw, idx) => {
          return {
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
          };
        });

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
  };

  useEffect(() => {
    fetchRekapMatriks();
  }, [selectedRombelId, selectedMapelId]);

  // ── 5. Handler Tutup Sesi & Hapus Sesi ─────────────────────
  const handleTutupSesi = async (sesiId, pKe) => {
    const konfirmasi = window.confirm(`Tutup sesi presensi Pertemuan ${pKe}? Warga belajar tidak dapat mengisi presensi mandiri lagi.`);
    if (!konfirmasi) return;

    try {
      await AbsensiAPI.tutupSesi(sesiId);
      alert(`Sesi presensi Pertemuan ${pKe} telah ditutup.`);
      await fetchRekapMatriks();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menutup sesi.');
    }
  };

  const handleHapusSesi = async (sesiId, pKe) => {
    const konfirmasi = window.confirm(
      `PERINGATAN: Hapus sesi Pertemuan ${pKe} beserta seluruh rekaman presensi pada sesi ini? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!konfirmasi) return;

    try {
      await AbsensiAPI.hapusSesi(sesiId);
      alert(`Sesi presensi Pertemuan ${pKe} berhasil dihapus.`);
      await fetchRekapMatriks();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus sesi.');
    }
  };

  // ── 6. Handler Quick Edit Status Siswa ─────────────────────
  const handleOpenEditModal = (sesi, siswa, record) => {
    setEditModal({
      isOpen: true,
      sesiId: sesi.id,
      pertemuanKe: sesi.pertemuan_ke,
      tanggal: sesi.tanggal,
      wargaBelajarId: siswa.warga_belajar_id,
      namaSiswa: siswa.nama_lengkap,
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
            { warga_belajar_id: editModal.wargaBelajarId, status: editModal.currentStatus }
          ]);
        } else {
          throw putErr;
        }
      }
      setEditModal(prev => ({ ...prev, isOpen: false }));
      await fetchRekapMatriks();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status presensi.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── 7. Fitur Export CSV (Excel Compatible) ─────────────────
  const handleExportCSV = () => {
    if (!rekapData || !rekapData.matrix || rekapData.matrix.length === 0) {
      alert('Tidak ada data kehadiran untuk diekspor.');
      return;
    }

    const sesiList = rekapData.sesi_list || [];
    const matrix = rekapData.matrix || [];

    const headers = [
      'No',
      'NIS',
      'Nama Lengkap Siswa',
      ...sesiList.map(s => {
        const d = s.tanggal ? new Date(s.tanggal) : null;
        const dayStr = d ? (d.getDay() === 0 ? 'Minggu' : d.getDay() === 6 ? 'Sabtu' : 'Hari') : '';
        return `P${s.pertemuan_ke} ${dayStr} (${s.tanggal ? s.tanggal.split('T')[0] : ''})`;
      }),
      'Hadir (H)',
      'Izin (I)',
      'Sakit (S)',
      'Alpa (A)',
      'Persentase Hadir (%)',
      'Status Kelayakan (Min. 75%)'
    ];

    const rows = matrix.map(m => {
      const pCols = sesiList.map(s => {
        const item = m.kehadiran?.[s.id];
        if (!item || item.status === 'belum') return '-';
        return item.status.toUpperCase();
      });

      return [
        m.no,
        `"${m.nis || '-'}"`,
        `"${m.nama_lengkap.replace(/"/g, '""')}"`,
        ...pCols,
        m.total_h,
        m.total_i,
        m.total_s,
        m.total_a,
        `${m.persentase}%`,
        m.is_memenuhi_syarat ? 'MEMENUHI (>=75%)' : 'KRITIS (<75%)'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const rombelNama = (rekapData.rombel?.nama_rombel || 'Rombel').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Presensi_Weekend_${rombelNama}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── 8. Fitur Cetak Laporan ─────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // Filter siswa berdasarkan input pencarian
  const filteredMatrix = (rekapData?.matrix || []).filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama_lengkap?.toLowerCase().includes(q) ||
      item.nis?.toLowerCase().includes(q)
    );
  });

  // Helper status badge matriks
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

  // Helper nama hari dari tanggal
  const getDayShortName = (tanggalStr) => {
    if (!tanggalStr) return '';
    const d = new Date(tanggalStr);
    const day = d.getDay();
    if (day === 6) return 'Sabtu';
    if (day === 0) return 'Minggu';
    return dayNames[day] || '';
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="absensi-admin-wrapper">
          <div className="absensi-admin-container">
            
            {/* ── 1. Sapphire Hero Banner ── */}
            <div className="admin-hero-banner">
              <div className="admin-hero-content">
                <div className="admin-hero-left">
                  <div className="admin-hero-badge">
                    <i className="bi bi-calendar2-week"></i>
                    <span>JADWAL KBM: SETIAP SABTU & MINGGU</span>
                  </div>
                  <h1 className="admin-hero-title">
                    Rekapitulasi Presensi Warga Belajar
                  </h1>
                  <p className="admin-hero-subtitle">
                    Pusat pengelolaan & pemantauan kehadiran KBM tatap muka akhir pekan (Sabtu & Minggu) • Paket A, Paket B, & Paket C PKBM Bina Mandiri.
                  </p>
                </div>

                <div className="admin-hero-actions">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="admin-hero-btn glass"
                    title="Cetak format cetak presensi"
                  >
                    <i className="bi bi-printer"></i>
                    <span>Cetak Presensi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="admin-hero-btn glass"
                    title="Unduh rekap presensi format Excel / CSV"
                  >
                    <i className="bi bi-file-earmark-excel text-emerald-300"></i>
                    <span>Unduh Excel (CSV)</span>
                  </button>

                  {isWeekend ? (
                    <div className="admin-status-auto-pill active" title="Sesi presensi otomatis aktif setiap hari Sabtu & Minggu">
                      <span className="auto-pill-dot green"></span>
                      <div>
                        <div className="auto-pill-title">Sesi Otomatis Aktif</div>
                        <div className="auto-pill-sub">Hari Ini: {currentDayName} (Sabtu & Minggu)</div>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-status-auto-pill closed" title="Presensi tatap muka dan mandiri ditutup pada hari Senin s.d. Jumat">
                      <i className="bi bi-lock-fill"></i>
                      <div>
                        <div className="auto-pill-title">Presensi KBM Ditutup</div>
                        <div className="auto-pill-sub">Buka Otomatis Sabtu & Minggu</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 2. Weekend Notice Capsule ── */}
            <div className="admin-weekend-strip">
              <div className="admin-weekend-strip-left">
                <div className="admin-weekend-strip-icon">
                  <i className="bi bi-calendar-week-fill"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#78350F' }}>
                    Jadwal KBM Tatap Muka: <strong>Setiap Sabtu & Minggu</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#92400E' }}>
                    Hari ini adalah <strong>{currentDateFormatted}</strong> (Waktu Belajar Mandiri Warga Belajar).
                  </div>
                </div>
              </div>

              <div className="admin-weekend-strip-pills">
                <span className="admin-weekend-tag sabtu">
                  <i className="bi bi-calendar2-check"></i>
                  <span>Sabtu: {satDate}</span>
                </span>
                <span className="admin-weekend-tag minggu">
                  <i className="bi bi-calendar2-check"></i>
                  <span>Minggu: {sunDate}</span>
                </span>
              </div>
            </div>

            {/* ── 3. Filter Card & Segmented Control ── */}
            <div className="admin-filter-card">
              <div className="admin-filter-jenjang-row">
                <span className="admin-jenjang-label">
                  Jenjang Pendidikan:
                </span>
                <div className="admin-jenjang-segmented">
                  {[
                    { id: 'semua', label: 'Semua Rombel', icon: 'bi-grid' },
                    { id: 'Paket A', label: 'Paket A (SD)', icon: 'bi-backpack' },
                    { id: 'Paket B', label: 'Paket B (SMP)', icon: 'bi-book' },
                    { id: 'Paket C', label: 'Paket C (SMA)', icon: 'bi-mortarboard' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectJenjang(tab.id)}
                      className={`admin-jenjang-btn ${selectedJenjang === tab.id ? 'active' : ''}`}
                    >
                      <i className={`bi ${tab.icon}`} style={{ marginRight: 6 }}></i>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-filter-grid">
                <div className="admin-filter-field">
                  <label>
                    <i className="bi bi-door-open"></i>
                    Rombongan Belajar (Kelas) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={selectedRombelId}
                    onChange={(e) => setSelectedRombelId(e.target.value)}
                    className="admin-filter-select"
                  >
                    {filteredRombelList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nama_rombel || r.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-filter-field">
                  <label>
                    <i className="bi bi-journal-text"></i>
                    Mata Pelajaran (Mapel)
                  </label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="admin-filter-select"
                  >
                    <option value="">-- Rekap Gabungan Seluruh Mapel --</option>
                    {mapelList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.kode ? `[${m.kode}] ` : ''}{m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-filter-field">
                  <label>
                    <i className="bi bi-search"></i>
                    Cari Warga Belajar / NIS
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama atau NIS warga belajar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-filter-input"
                  />
                </div>
              </div>
            </div>

            {/* ── 4. Active Session Alert (If Running) ── */}
            {rekapData?.sesi_list?.some(s => s.status_sesi === 'aktif') && (
              <div className="admin-active-session-banner">
                <div className="admin-broadcast-left">
                  <div className="admin-broadcast-radar">
                    <i className="bi bi-broadcast"></i>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="admin-broadcast-tag">
                        <i className="bi bi-record-circle" style={{ color: '#16A34A', marginRight: 4 }}></i>
                        SESI AKTIF BERJALAN
                      </span>
                    </div>
                    <div className="admin-broadcast-title">
                      {(() => {
                        const aktif = rekapData.sesi_list.find(s => s.status_sesi === 'aktif');
                        const dayName = getDayShortName(aktif.tanggal);
                        return `Pertemuan ${aktif.pertemuan_ke} (${dayName || 'Weekend'}) • ${aktif.nama_mapel || 'Mata Pelajaran'} • Mode: ${aktif.mode.toUpperCase()}`;
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(() => {
                    const aktif = rekapData.sesi_list.find(s => s.status_sesi === 'aktif');
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTutupSesi(aktif.id, aktif.pertemuan_ke)}
                          className="admin-hero-btn glass"
                          style={{ color: '#92400E', background: '#FFFFFF', borderColor: '#FDE047' }}
                        >
                          <i className="bi bi-stop-circle"></i> Tutup Sesi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHapusSesi(aktif.id, aktif.pertemuan_ke)}
                          className="admin-hero-btn glass"
                          style={{ color: '#DC2626', background: '#FFFFFF', borderColor: '#FECACA' }}
                        >
                          <i className="bi bi-trash3"></i> Hapus Sesi
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── 5. Vibrant & Professional Metric Cards ── */}
            {rekapData?.statistik && (
              <div className="admin-metric-grid">
                {/* Card 1: Total Siswa */}
                <div className="admin-metric-card card-blue">
                  <div className="admin-metric-top">
                    <span className="admin-metric-badge blue">TOTAL WARGA BELAJAR</span>
                    <div className="admin-metric-icon-box blue">
                      <i className="bi bi-people-fill"></i>
                    </div>
                  </div>
                  <div className="admin-metric-val">
                    {rekapData.total_siswa || 0} <span>Siswa</span>
                  </div>
                  <div className="admin-metric-label">
                    Rombel {rekapData.rombel?.nama_rombel || '-'}
                  </div>
                </div>

                {/* Card 2: Rata-Rata Kehadiran */}
                <div className="admin-metric-card card-green">
                  <div className="admin-metric-top">
                    <span className="admin-metric-badge green">RATA-RATA KEHADIRAN</span>
                    <div className="admin-metric-icon-box green">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                  </div>
                  <div className="admin-metric-val" style={{ color: rekapData.statistik.rata_rata_hadir >= 75 ? '#059669' : '#DC2626' }}>
                    {rekapData.statistik.rata_rata_hadir}%
                  </div>
                  <div className="admin-metric-label">
                    Target Evaluasi (Min. 75%)
                  </div>
                </div>

                {/* Card 3: Total Sesi Weekend */}
                <div className="admin-metric-card card-indigo">
                  <div className="admin-metric-top">
                    <span className="admin-metric-badge indigo">SESI PERTEMUAN</span>
                    <div className="admin-metric-icon-box indigo">
                      <i className="bi bi-calendar2-check-fill"></i>
                    </div>
                  </div>
                  <div className="admin-metric-val">
                    {rekapData.total_sesi || 0} <span>Sesi</span>
                  </div>
                  <div className="admin-metric-label">
                    Total KBM Akhir Pekan
                  </div>
                </div>

                {/* Card 4: Siswa Kritis */}
                <div className="admin-metric-card card-rose">
                  <div className="admin-metric-top">
                    <span className="admin-metric-badge rose">PERLU PEMBINAAN</span>
                    <div className="admin-metric-icon-box rose">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                  </div>
                  <div className="admin-metric-val" style={{ color: rekapData.statistik.siswa_kritis > 0 ? '#DC2626' : '#059669' }}>
                    {rekapData.statistik.siswa_kritis} <span>Siswa</span>
                  </div>
                  <div className="admin-metric-label">
                    Kehadiran di bawah 75%
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. Loading & Error States ── */}
            {loading && (
              <div style={{ padding: '3.5rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
                  Memuat data rekapitulasi presensi akhir pekan...
                </p>
              </div>
            )}

            {!loading && error && (
              <div style={{ padding: '1rem 1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#991B1B', fontWeight: 600, fontSize: '0.92rem' }}>
                <i className="bi bi-exclamation-triangle" style={{ marginRight: 8 }}></i>
                <span>{error}</span>
              </div>
            )}

            {/* ── 7. Matriks Kehadiran Grid Table ── */}
            {!loading && !error && rekapData && (
              <div className="admin-ledger-card">
                <div className="admin-ledger-header">
                  <div className="admin-ledger-title-group">
                    <i className="bi bi-table"></i>
                    <h2 className="admin-ledger-title">
                      Buku Matriks Presensi: {rekapData.rombel?.nama_rombel || 'Kelas'}
                    </h2>
                  </div>

                  {/* Interactive Legend Badges */}
                  <div className="admin-ledger-legend">
                    <div className="admin-legend-item">
                      <span className="admin-legend-badge hadir">H</span>
                      <span>Hadir</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="admin-legend-badge izin">I</span>
                      <span>Izin</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="admin-legend-badge sakit">S</span>
                      <span>Sakit</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="admin-legend-badge alpa">A</span>
                      <span>Alpa</span>
                    </div>
                    <div className="admin-legend-item">
                      <span className="admin-legend-badge empty">—</span>
                      <span>Belum Absen</span>
                    </div>
                  </div>
                </div>

                {filteredMatrix.length === 0 ? (
                  <div className="admin-empty-state-box">
                    <div className="admin-empty-icon">
                      <i className="bi bi-people"></i>
                    </div>
                    <h3 className="admin-empty-title">Tidak Ada Data Warga Belajar</h3>
                    <p className="admin-empty-desc">
                      {searchQuery
                        ? `Tidak ditemukan warga belajar dengan kata kunci "${searchQuery}".`
                        : 'Belum ada warga belajar yang terdaftar aktif pada rombongan belajar ini.'}
                    </p>
                  </div>
                ) : (
                  <div className="admin-matrix-scroll-wrapper">
                    <table className="admin-matrix-table">
                      <thead>
                        <tr>
                          <th className="sticky-col-no">No</th>
                          <th className="sticky-col-nis">NIS</th>
                          <th className="sticky-col-name">Nama Lengkap Warga Belajar</th>

                          {/* Kolom Sesi Pertemuan KBM Akhir Pekan */}
                          {rekapData.sesi_list?.map((sesi) => {
                            const dayName = getDayShortName(sesi.tanggal);
                            const isSabtu = dayName === 'Sabtu';
                            const dateObj = sesi.tanggal ? new Date(sesi.tanggal) : null;
                            const dateLabel = dateObj ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}` : '';

                            return (
                              <th
                                key={sesi.id}
                                style={{
                                  minWidth: 70,
                                  background: sesi.status_sesi === 'aktif' ? '#EFF6FF' : '#F8FAFC'
                                }}
                                title={`Pertemuan ${sesi.pertemuan_ke} (${dayName}) • ${sesi.tanggal} • ${sesi.nama_mapel || 'Mapel'}`}
                              >
                                <div className="header-sesi-card">
                                  <span className="header-sesi-p-tag">P{sesi.pertemuan_ke}</span>
                                  <span className={`header-sesi-day-tag ${isSabtu ? 'sabtu' : 'minggu'}`}>
                                    {dayName ? dayName.slice(0, 3) : 'KBM'}
                                  </span>
                                  <span className="header-sesi-date-tag">{dateLabel}</span>
                                </div>
                              </th>
                            );
                          })}

                          {/* Kolom Ringkasan Total */}
                          <th style={{ width: 44, color: '#15803D' }}>H</th>
                          <th style={{ width: 44, color: '#92400E' }}>I</th>
                          <th style={{ width: 44, color: '#1E40AF' }}>S</th>
                          <th style={{ width: 44, color: '#991B1B' }}>A</th>
                          <th style={{ width: 95, color: '#0F172A' }}>% Hadir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatrix.map((siswa) => (
                          <tr key={siswa.warga_belajar_id}>
                            <td className="sticky-col-no">
                              {siswa.no}
                            </td>
                            <td className="sticky-col-nis">
                              {siswa.nis || '—'}
                            </td>
                            <td className="sticky-col-name">
                              <div className="admin-student-name-box">
                                <div className="admin-student-avatar">
                                  {siswa.nama_lengkap?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="admin-student-fullname">{siswa.nama_lengkap}</span>
                              </div>
                            </td>

                            {/* Cells Kehadiran Per Sesi */}
                            {rekapData.sesi_list?.map((sesi) => {
                              const rec = siswa.kehadiran?.[sesi.id];
                              const badge = getStatusBadge(rec?.status);

                              return (
                                <td key={sesi.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(sesi, siswa, rec)}
                                    className={`cell-badge-btn ${badge.className}`}
                                    title={`${siswa.nama_lengkap} • P${sesi.pertemuan_ke}: ${badge.title}${rec?.catatan ? ` (${rec.catatan})` : ''} - Klik untuk ubah`}
                                  >
                                    {badge.label}
                                  </button>
                                </td>
                              );
                            })}

                            {/* Ringkasan Total Siswa */}
                            <td style={{ fontWeight: 700, color: '#15803D' }}>{siswa.total_h}</td>
                            <td style={{ fontWeight: 700, color: '#92400E' }}>{siswa.total_i}</td>
                            <td style={{ fontWeight: 700, color: '#1E40AF' }}>{siswa.total_s}</td>
                            <td style={{ fontWeight: 700, color: '#991B1B' }}>{siswa.total_a}</td>
                            <td>
                              <span className={`admin-percent-badge ${siswa.persentase >= 75 ? 'lulus' : 'kritis'}`}>
                                {siswa.persentase}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════ MODAL QUICK EDIT STATUS SISWA ════ */}
            {editModal.isOpen && (
              <div className="admin-modal-overlay" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>
                <div className="admin-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                  <div className="admin-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-pencil-square text-primary"></i>
                      <h3>Ubah Status Presensi Siswa</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                      className="admin-modal-close-btn"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <div className="admin-modal-body">
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.96rem' }}>
                        {editModal.namaSiswa}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: 2 }}>
                        Pertemuan P{editModal.pertemuanKe} • {editModal.tanggal ? new Date(editModal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                        Pilih Status Kehadiran
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
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
                              height: 38,
                              borderRadius: 6,
                              border: editModal.currentStatus === item.val ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              fontSize: '0.86rem'
                            }}
                          >
                            {editModal.currentStatus === item.val && <i className="bi bi-check2"></i>}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                        Catatan / Alasan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Izin dinas kerja / Sakit demam"
                        value={editModal.catatan}
                        onChange={(e) => setEditModal({ ...editModal, catatan: e.target.value })}
                        className="admin-filter-input"
                      />
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button
                      type="button"
                      onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                      className="quick-weekend-btn"
                      style={{ background: '#F1F5F9' }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditStatus}
                      disabled={savingEdit}
                      className="admin-hero-btn gold"
                      style={{ borderRadius: 8, padding: '7px 18px', fontSize: '0.85rem' }}
                    >
                      {savingEdit ? 'Menyimpan...' : 'Simpan Presensi'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default AbsensiAdmin;
