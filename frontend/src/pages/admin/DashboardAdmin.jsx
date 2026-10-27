// ============================================================
// src/pages/admin/DashboardAdmin.jsx — Beranda Admin Modern PKBM
// ============================================================
// Layout terinspirasi desain modern sesuai gambar mockup:
// - Header 'Beranda'
// - Welcome Banner dengan maskot pose1.png dan tombol aksi
// - 4 Metrik Kartu (Warga Belajar, SPMB, Mapel, Ujian)
// - Distribusi Siswa dengan Donut Chart & Progress Bars
// - Panel Kanan 'Aktivitas Terkini' (Agenda, Rapat, Aktivitas Pengguna)
// - Warna dominan: Biru Karakter, Putih, Pink, Kuning, Hitam
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import ProfileEditorCard from '../../components/ProfileEditorCard.jsx';
import { SpmbAPI, SiswaAPI, AgendaAPI } from '../../services/api.js';
import {
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  Wallet,
  Sparkles,
  GraduationCap,
  Clock,
  X,
  Edit3,
  BookMarked,
  Network,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  CalendarDays,
  ChevronDown,
  Star,
  MapPin
} from 'lucide-react';
import './DashboardAdmin.css';

function DashboardAdmin() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [statSpmb, setStatSpmb] = useState(null);
  const [statSiswa, setStatSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ── RETRO EDITORIAL AGENDA (1-BULAN KOMPAK, REALTIME CLOCK & CRUD SYNC) ──
  // Realtime Live Clock (update setiap 1 detik)
  const [liveDateTime, setLiveDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveClock = useMemo(() => {
    const hours = String(liveDateTime.getHours()).padStart(2, '0');
    const minutes = String(liveDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(liveDateTime.getSeconds()).padStart(2, '0');
    const day = String(liveDateTime.getDate()).padStart(2, '0');
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    const month = months[liveDateTime.getMonth()];
    const year = liveDateTime.getFullYear();
    return `${hours}.${minutes}.${seconds} WIB • TODAY • ${month} ${day}, ${year}`;
  }, [liveDateTime]);

  // State Navigasi Bulan & Tahun Kalender
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0 - 11

  const MONTHS_OPTIONS = [
    { value: 0, label: 'JANUARI / JAN' },
    { value: 1, label: 'FEBRUARI / FEB' },
    { value: 2, label: 'MARET / MAR' },
    { value: 3, label: 'APRIL / APR' },
    { value: 4, label: 'MEI / MAY' },
    { value: 5, label: 'JUNI / JUN' },
    { value: 6, label: 'JULI / JUL' },
    { value: 7, label: 'AGUSTUS / AUG' },
    { value: 8, label: 'SEPTEMBER / SEP' },
    { value: 9, label: 'OKTOBER / OCT' },
    { value: 10, label: 'NOVEMBER / NOV' },
    { value: 11, label: 'DESEMBER / DEC' },
  ];

  const YEARS_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const DAYS_HEADER_LIST = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Data awal referensi aesthetic journal notes (bebas kotak kaku)
  const initialRetroEvents = [
    {
      id: 'evt-init-1',
      dateStr: '2026-10-25',
      title: 'Rapat Kurikulum',
      subtitle: 'Paket A, B & C',
      category: 'rapat',
      cardStyle: 'sticky-pink',
      notes: 'Penyusunan Modul Ajar Kurikulum',
      time: '09:00 WIB',
    },
    {
      id: 'evt-init-2',
      dateStr: '2026-10-26',
      title: 'Monitoring Belajar Warga',
      subtitle: 'KBM Aktif',
      category: 'akademik',
      cardStyle: 'checklist',
      notes: 'Presensi daring & tugas mandiri',
      time: '10:00 WIB',
    },
    {
      id: 'evt-init-3',
      dateStr: '2026-10-27',
      title: 'Koordinasi Tutor & Silabus',
      subtitle: 'Tutor PKBM',
      category: 'rapat',
      cardStyle: 'washi',
      notes: 'Rapat rutin evaluasi modul',
      time: '13:30 WIB',
    },
    {
      id: 'evt-init-4',
      dateStr: '2026-10-28',
      title: 'Workshop Kurikulum Merdeka',
      subtitle: 'Daring & Luring',
      category: 'workshop',
      cardStyle: 'important',
      notes: 'Pendalaman asesmen diagnostik',
      time: '11:00 WIB',
    },
    {
      id: 'evt-init-5',
      dateStr: '2026-10-29',
      title: 'Evaluasi Pembelajaran Mandiri',
      subtitle: 'Tutor & Admin',
      category: 'evaluasi',
      cardStyle: 'highlight',
      notes: 'Cek kemajuan belajar siswa',
      time: '14:00 WIB',
    },
    {
      id: 'evt-init-6',
      dateStr: '2026-10-30',
      title: 'Verifikasi Berkas SPMB',
      subtitle: 'Gelombang 1',
      category: 'spmb',
      cardStyle: 'checklist',
      notes: 'Validasi dokumen pendaftar',
      time: '15:00 WIB',
    },
    {
      id: 'evt-init-7',
      dateStr: '2026-10-31',
      title: 'Simulasi CBT & Evaluasi',
      subtitle: 'Paket C',
      category: 'ujian',
      cardStyle: 'sticky-yellow',
      notes: 'Uji coba server ujian online',
      time: '08:30 WIB',
    },
    {
      id: 'evt-init-8',
      dateStr: '2026-11-01',
      title: 'Rapat Pleno Pengurus',
      subtitle: 'Awal Bulan',
      category: 'rapat',
      cardStyle: 'sticky-pink',
      notes: 'Evaluasi alur kerja bulanan',
      time: '09:00 WIB',
    },
    {
      id: 'evt-init-9',
      dateStr: '2026-11-03',
      title: 'Pameran Karya Warga Belajar',
      subtitle: 'PKBM Fest',
      category: 'kegiatan',
      cardStyle: 'handwriting',
      notes: 'Display hasil karya & kriya siswa',
      time: '10:00 WIB',
    },
    {
      id: 'evt-init-10',
      dateStr: '2026-11-06',
      title: 'Ujian Modul 2 Paket B',
      subtitle: 'Evaluasi Daring',
      category: 'ujian',
      cardStyle: 'highlight-mint',
      notes: 'Penilaian akhir modul tematik',
      time: '13:00 WIB',
    },
  ];

  // State kalender events (sinkron multi-device via AgendaAPI database)
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('pkbm_admin_retro_agenda_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialRetroEvents;
  });

  const fetchAgenda = async () => {
    try {
      const res = await AgendaAPI.getAll();
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((item) => ({
          id: item.id,
          dateStr: item.date_str || item.dateStr,
          title: item.title,
          subtitle: item.subtitle,
          time: item.time,
          timeRange: item.time_range || item.timeRange,
          category: item.category,
          cardStyle: item.card_style || item.cardStyle || 'sticky-yellow',
          badge: item.badge || item.category?.toUpperCase(),
          notes: item.notes,
          location: item.location,
        }));
        setCalendarEvents(mapped);
        localStorage.setItem('pkbm_admin_retro_agenda_events', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Backend AgendaAPI sync fallback to local:', err);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  // Perhitungan grid 1 bulan penuh (7 kolom: Sunday - Saturday)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const startDayIndex = firstDay.getDay(); // 0 = Sunday

    const days = [];
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

    // Hari dari bulan sebelumnya
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const pDate = prevMonthLastDate - i;
      const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(pDate).padStart(2, '0')}`;
      days.push({
        dateNumber: pDate,
        dateNumStr: String(pDate).padStart(2, '0'),
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Hari dari bulan terpilih
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateNumber: d,
        dateNumStr: String(d).padStart(2, '0'),
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Hari dari bulan berikutnya untuk melengkapi baris 7 kolom
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dateNumber: n,
        dateNumStr: String(n).padStart(2, '0'),
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Tanggal hari ini
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Form input & modal state untuk CRUD jadwal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTime, setFormTime] = useState('09:00 WIB');
  const [formCategory, setFormCategory] = useState('rapat');
  const [formCardStyle, setFormCardStyle] = useState('sticky-yellow');
  const [formNotes, setFormNotes] = useState('');

  const handleOpenAddModal = (dateStr) => {
    setEditingEventId(null);
    setSelectedDateStr(dateStr || todayDateStr);
    setFormTitle('');
    setFormSubtitle('');
    setFormTime('09:00 WIB');
    setFormCategory('rapat');
    setFormCardStyle('sticky-yellow');
    setFormNotes('');
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (event, e) => {
    e?.stopPropagation();
    setEditingEventId(event.id);
    setSelectedDateStr(event.dateStr || event.date_str);
    setFormTitle(event.title || '');
    setFormSubtitle(event.subtitle || '');
    setFormTime(event.time || '09:00 WIB');
    setFormCategory(event.category || 'rapat');
    setFormCardStyle(event.cardStyle || event.card_style || 'sticky-yellow');
    setFormNotes(event.notes || '');
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e?.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      date_str: selectedDateStr,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || 'AGENDA RESMI',
      time: formTime.trim() || '09:00 WIB',
      category: formCategory,
      card_style: formCardStyle,
      notes: formNotes.trim(),
      badge: formCategory.toUpperCase(),
    };

    if (editingEventId) {
      try {
        await AgendaAPI.update(editingEventId, payload);
      } catch (err) {
        console.warn('API update fallback to local:', err);
      }
      const updatedList = calendarEvents.map((item) => {
        if (item.id === editingEventId) {
          return {
            ...item,
            dateStr: selectedDateStr,
            title: payload.title,
            subtitle: payload.subtitle,
            time: payload.time,
            category: payload.category,
            cardStyle: payload.card_style,
            notes: payload.notes,
            badge: payload.badge,
          };
        }
        return item;
      });
      setCalendarEvents(updatedList);
      localStorage.setItem('pkbm_admin_retro_agenda_events', JSON.stringify(updatedList));
    } else {
      let newId = 'evt-' + Date.now();
      try {
        const res = await AgendaAPI.create(payload);
        if (res?.data?.data?.id) newId = res.data.data.id;
      } catch (err) {
        console.warn('API create fallback to local:', err);
      }

      const newEntry = {
        id: newId,
        dateStr: selectedDateStr,
        title: payload.title,
        subtitle: payload.subtitle,
        time: payload.time,
        category: payload.category,
        cardStyle: payload.card_style,
        notes: payload.notes,
        badge: payload.badge,
      };

      const updatedList = [...calendarEvents, newEntry];
      setCalendarEvents(updatedList);
      localStorage.setItem('pkbm_admin_retro_agenda_events', JSON.stringify(updatedList));
    }

    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = async (eventId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Hapus agenda ini dari kalender?')) return;

    try {
      await AgendaAPI.delete(eventId);
    } catch (err) {
      console.warn('API delete fallback to local:', err);
    }

    const filtered = calendarEvents.filter((item) => item.id !== eventId);
    setCalendarEvents(filtered);
    localStorage.setItem('pkbm_admin_retro_agenda_events', JSON.stringify(filtered));
  };

  const selectedDateEvents = useMemo(() => {
    return calendarEvents.filter(
      (e) => (e.dateStr || e.date_str) === selectedDateStr
    );
  }, [calendarEvents, selectedDateStr]);

  // Render catatan kalender ala buku harian / journal planner (bebas kotak kaku)
  const renderJournalNote = (evt) => {
    const style = evt.cardStyle || evt.card_style || 'handwriting';

    if (style === 'sticky-pink' || style === 'envelope-pink') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-sticky is-pink group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <div className="journal-sticky-pin"></div>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          {evt.subtitle && <div className="journal-note-sub font-handwriting">{evt.subtitle}</div>}
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'sticky' || style === 'sticky-yellow') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-sticky group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <div className="journal-sticky-pin"></div>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          {evt.subtitle && <div className="journal-note-sub font-handwriting">{evt.subtitle}</div>}
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'checklist') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-checklist group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <div className="journal-checklist-item">
            <span className="journal-check-icon">✓</span>
            <span className="journal-note-title font-handwriting">{evt.title}</span>
          </div>
          {evt.notes && (
            <div className="journal-checklist-item pl-2 opacity-80">
              <span className="journal-check-icon text-xs">✓</span>
              <span className="journal-note-sub font-handwriting">{evt.notes}</span>
            </div>
          )}
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'highlight-mint') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-highlight is-mint group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <span className="journal-highlight-marker font-handwriting">{evt.title}</span>
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'highlight' || style === 'bar-orange') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-highlight group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <span className="journal-highlight-marker font-handwriting">{evt.title}</span>
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'important' || style === 'poster-red') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-important group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <span className="journal-important-tag">IMPORTANT!</span>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    if (style === 'washi' || style === 'ticket-white' || style === 'ticket-blue' || style === 'ticket-pink') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleOpenEditModal(evt, e)}
          className="journal-note-washi group"
          title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
        >
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          <div className="journal-note-time">{evt.time}</div>
          <button
            type="button"
            onClick={(e) => handleDeleteSchedule(evt.id, e)}
            className="journal-note-del"
            title="Hapus catatan"
          >
            <X size={10} />
          </button>
        </div>
      );
    }

    // Default: handwriting
    return (
      <div
        key={evt.id}
        onClick={(e) => handleOpenEditModal(evt, e)}
        className="journal-note-handwritten group"
        title={`${evt.title} • ${evt.time || ''} (Klik untuk edit/hapus)`}
      >
        <span className="journal-note-bullet">•</span>
        <span className="journal-note-title font-handwriting">{evt.title}</span>
        <span className="journal-note-time-inline">{evt.time}</span>
        <button
          type="button"
          onClick={(e) => handleDeleteSchedule(evt.id, e)}
          className="journal-note-del"
          title="Hapus catatan"
        >
          <X size={10} />
        </button>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSpmb, resSiswa] = await Promise.allSettled([
          SpmbAPI.getStatistik(),
          SiswaAPI.getStatistikPerJenjang(),
        ]);

        if (resSpmb.status === 'fulfilled') setStatSpmb(resSpmb.value.data.data);
        if (resSiswa.status === 'fulfilled') setStatSiswa(resSiswa.value.data.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format tanggal hari ini dalam Bahasa Indonesia
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Ekstrak data siswa per jenjang (pastikan selalu di-parse ke Number agar tidak terjadi penggabungan string)
  const countPaketA = Number(statSiswa?.find(s => s.jenjang === 'paket_a')?.jumlah || 0);
  const countPaketB = Number(statSiswa?.find(s => s.jenjang === 'paket_b')?.jumlah || 0);
  const countPaketC = Number(statSiswa?.find(s => s.jenjang === 'paket_c')?.jumlah || 0);
  const countAlumni = Number(statSiswa?.find(s => s.jenjang === 'alumni')?.jumlah || 0);
  const totalSiswa = countPaketA + countPaketB + countPaketC + countAlumni;

  // Persentase untuk Donut Chart & Progress Bars (aman dari pembagian 0)
  const pctC = totalSiswa > 0 ? Math.round((countPaketC / totalSiswa) * 100) : 0;
  const pctA = totalSiswa > 0 ? Math.round((countPaketA / totalSiswa) * 100) : 0;
  const pctB = totalSiswa > 0 ? Math.round((countPaketB / totalSiswa) * 100) : 0;
  const pctAlumni = totalSiswa > 0 ? Math.round((countAlumni / totalSiswa) * 100) : 0;

  // Perhitungan arc SVG Donut Chart (Radius r = 62, Circumference = 389.56)
  const circumference = 389.56;
  const strokeC = (pctC / 100) * circumference;
  const strokeA = (pctA / 100) * circumference;
  const strokeB = (pctB / 100) * circumference;
  const strokeAlumni = (pctAlumni / 100) * circumference;

  const offsetC = 0;
  const offsetA = -(strokeC);
  const offsetB = -(strokeC + strokeA);
  const offsetAlumni = -(strokeC + strokeA + strokeB);

  const adminName = user?.nama_lengkap || user?.nama || 'Administrator';

  return (
    <div className="app-layout matcha-theme-layout">
      {/* Sidebar Modern Terkategori */}
      <Sidebar user={user} />

      {/* Main Container dengan Nuansa Morie Matcha Cream */}
      <main className="app-main">
        <div className="app-content dashboard-clean-canvas matcha-dashboard-canvas">

          {/* ── 1. Morie Matcha Hero Banner (Header Beranda langsung di Latar Belakang Hijau) ── */}
          <section className="matcha-hero-banner">
            {/* Top Bar Terpadu langsung di Latar Belakang Banner (Tanpa Kotak Putih) */}
            <div className="matcha-hero-header-row">
              <div className="matcha-hero-header-left">
                <h1 className="matcha-hero-page-title">Beranda</h1>
                <p className="matcha-hero-page-subtitle">
                  Pusat manajemen dan monitoring operasional PKBM Bina Mandiri
                </p>
              </div>
            </div>

            {/* Main Hero Body */}
            <div className="matcha-hero-body">
              {/* Kolom Kiri: Tipografi Editorial Besar & Tombol Aksi */}
              <div className="matcha-hero-left">
                {/* Judul Besar Morie Matcha Serif Display */}
                <div className="matcha-hero-giant-title matcha-serif" aria-hidden="true">
                  E-PKBM
                </div>

                <h2 className="matcha-hero-headline">
                  Selamat Bertugas, {adminName}!
                </h2>

                <p className="matcha-hero-subtext">
                  Dedikasimu menjaga alur operasional PKBM berjalan lancar tanpa hambatan. Wujudkan ekosistem belajar kesetaraan yang inklusif, berkualitas, dan berdampak nyata bagi seluruh warga belajar.
                </p>

                <div className="matcha-hero-cta-group">
                  <Link to="/dashboard/admin/spmb" className="matcha-pill-btn-lime">
                    <UserPlus size={16} />
                    <span>Verifikasi SPMB</span>
                  </Link>
                  <Link to="/dashboard/admin/siswa" className="matcha-pill-btn-glass">
                    <Users size={16} />
                    <span>Data Siswa</span>
                  </Link>
                  <Link to="/dashboard/admin/tagihan" className="matcha-pill-btn-glass">
                    <Wallet size={16} />
                    <span>Keuangan SPP</span>
                  </Link>
                </div>
              </div>

              {/* Kolom Kanan: Karakter Siswa PKBM (Hero 1 - Ukuran Besar Di Atas Ribbon) */}
              <div className="matcha-hero-right">
                {/* Ambient Spotlight Glow di Belakang Karakter Siswa */}
                <div className="matcha-hero-spotlight" aria-hidden="true"></div>

                <div className="matcha-mascot-container" title="Warga Belajar PKBM Bina Mandiri">
                  <img
                    src="/images/hero1.png"
                    alt="Siswa Warga Belajar PKBM Bina Mandiri"
                    className="matcha-mascot-img"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* ── Ribbon Marquee Bergerak Elegan di Bawah Banner ── */}
            <div className="hero-ribbon-marquee" aria-hidden="true">
              <div className="ribbon-marquee-track">
                <span className="ribbon-text-item">★ PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI</span>
                <span className="ribbon-text-item">✦ PENDIDIKAN KESETARAAN PAKET A, B & C</span>
                <span className="ribbon-text-item">★ FLEKSIBEL, RESMI & TERAKREDITASI BAN PNF</span>
                <span className="ribbon-text-item">✦ MEMBINA KEMANDIRIAN MERAIH MASA DEPAN</span>
                <span className="ribbon-text-item">★ EKOSISTEM BELAJAR DIGITAL INKLUSIF</span>
                <span className="ribbon-text-item">✦ EST. 2026</span>
                <span className="ribbon-text-item">★ PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI</span>
                <span className="ribbon-text-item">✦ PENDIDIKAN KESETARAAN PAKET A, B & C</span>
                <span className="ribbon-text-item">★ FLEKSIBEL, RESMI & TERAKREDITASI BAN PNF</span>
                <span className="ribbon-text-item">✦ MEMBINA KEMANDIRIAN MERAIH MASA DEPAN</span>
                <span className="ribbon-text-item">★ EKOSISTEM BELAJAR DIGITAL INKLUSIF</span>
                <span className="ribbon-text-item">✦ EST. 2026</span>
              </div>
            </div>
          </section>

          {/* ── 3. Morie Matcha Floating Dark Green Capsule (Metrics Pill) ── */}
          <section className="matcha-capsule-card">
            {/* Item 1: Total Siswa */}
            <Link to="/dashboard/admin/siswa" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <Users size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Total Warga Belajar</span>
                <span className="matcha-capsule-sub">{totalSiswa} Siswa Aktif Terdaftar</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 2: Verifikasi SPMB */}
            <Link to="/dashboard/admin/spmb" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <UserPlus size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">SPMB Menunggu</span>
                <span className="matcha-capsule-sub">{Number(statSpmb?.pending || 0)} Pendaftar Baru</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 3: Master Mapel */}
            <Link to="/dashboard/admin/master-mapel" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <BookOpen size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Mata Pelajaran</span>
                <span className="matcha-capsule-sub">30 Kurikulum Terpadu</span>
              </div>
            </Link>

            <div className="matcha-capsule-divider" aria-hidden="true"></div>

            {/* Item 4: Jadwal Ujian */}
            <Link to="/dashboard/admin/periode-ujian" className="matcha-capsule-item">
              <div className="matcha-capsule-icon-wrap">
                <Calendar size={22} className="matcha-capsule-icon" />
              </div>
              <div className="matcha-capsule-text">
                <span className="matcha-capsule-title">Jadwal Ujian</span>
                <span className="matcha-capsule-sub">15 Periode Evaluasi</span>
              </div>
            </Link>
          </section>

          {/* ── 3. Morie Matcha Section Editorial Heading: 'Ringkasan Operasional' ── */}

          {/* ── 4. Morie Matcha Section Editorial Heading: 'Ringkasan Operasional' ── */}
          <div className="matcha-editorial-header">
            <div>
              <h2 className="matcha-editorial-title">
                Ringkasan <span className="matcha-serif italic">Operasional</span>
              </h2>
              <p className="matcha-editorial-desc">
                Pantau sebaran peserta didik di setiap jenjang kesetaraan serta koordinasikan agenda operasional harian secara realtime.
              </p>
            </div>

            <Link to="/dashboard/admin/siswa" className="matcha-pill-btn-dark">
              <span>Kelola Data Siswa</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* ── 4. Grid Analitik Siswa & Pintasan Modul Cepat (Modern & Seamless) ── */}
          <div className="retro-analytics-bottom-grid">

              {/* Kolom 1: Distribusi Warga Belajar */}
              <div className="team-exec-card matcha-card">
                <div className="card-title-row">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B4922C] block mb-0.5">
                      Data Kesetaraan PKBM
                    </span>
                    <h3 className="card-heading-title">Distribusi Warga Belajar</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rincian peserta aktif berdasarkan jenjang kesetaraan
                    </p>
                  </div>

                  {/* Kotak Siswa Aktif Keren & Modern (Pill Live Badge dengan Glowing Dot) */}
                  <div className="retro-siswa-aktif-badge" title="Total Siswa Aktif Terdaftar">
                    <span className="retro-badge-pulse-dot" aria-hidden="true">
                      <span className="retro-pulse-ping"></span>
                      <span className="retro-pulse-core"></span>
                    </span>
                    <span className="retro-badge-num">{totalSiswa}</span>
                    <span className="retro-badge-txt">Siswa Aktif</span>
                  </div>
                </div>

                <div className="donut-stats-wrapper">

                  {/* Visual Donut Chart SVG */}
                  <div className="donut-chart-box">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        className="stroke-slate-100"
                        strokeWidth="18"
                        fill="transparent"
                      />

                      {/* Arc 1: Paket C (Sky Blue) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#5CB8FF"
                        strokeWidth="18"
                        strokeDasharray={`${strokeC} ${circumference}`}
                        strokeDashoffset={offsetC}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 2: Paket A (Warm Orange) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#FFaf5c"
                        strokeWidth="18"
                        strokeDasharray={`${strokeA} ${circumference}`}
                        strokeDashoffset={offsetA}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 3: Paket B (Fresh Green) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#6BCB77"
                        strokeWidth="18"
                        strokeDasharray={`${strokeB} ${circumference}`}
                        strokeDashoffset={offsetB}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Arc 4: Alumni & Khusus (Yellow) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="62"
                        stroke="#F9C846"
                        strokeWidth="18"
                        strokeDasharray={`${strokeAlumni} ${circumference}`}
                        strokeDashoffset={offsetAlumni}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Info Angka Tengah Donut */}
                    <div className="donut-chart-center-info">
                      <div className="donut-center-num">{totalSiswa}</div>
                      <div className="donut-center-sub">Siswa</div>
                    </div>
                  </div>

                  {/* Progress Legends List */}
                  <div className="progress-legends-list">

                    {/* Bar 1: Paket C SMA */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#5CB8FF' }}></span>
                          <span className="font-semibold text-slate-800">Paket C (Setara SMA)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketC}</span>
                          <span className="legend-pct-pill">{pctC}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctC}%`, backgroundColor: '#5CB8FF' }}
                        />
                      </div>
                    </div>

                    {/* Bar 2: Paket A SD */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#FFaf5c' }}></span>
                          <span className="font-semibold text-slate-800">Paket A (Setara SD)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketA}</span>
                          <span className="legend-pct-pill">{pctA}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctA}%`, backgroundColor: '#FFaf5c' }}
                        />
                      </div>
                    </div>

                    {/* Bar 3: Paket B SMP */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#6BCB77' }}></span>
                          <span className="font-semibold text-slate-800">Paket B (Setara SMP)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countPaketB}</span>
                          <span className="legend-pct-pill">{pctB}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctB}%`, backgroundColor: '#6BCB77' }}
                        />
                      </div>
                    </div>

                    {/* Bar 4: Alumni & Khusus */}
                    <div className="legend-bar-item">
                      <div className="legend-item-header">
                        <div className="legend-label-wrap">
                          <span className="legend-color-dot" style={{ backgroundColor: '#F9C846' }}></span>
                          <span className="font-semibold text-slate-800">Alumni & Program Khusus</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="legend-val-num">{countAlumni}</span>
                          <span className="legend-pct-pill">{pctAlumni}%</span>
                        </div>
                      </div>
                      <div className="legend-progress-track">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${pctAlumni}%`, backgroundColor: '#F9C846' }}
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Kolom 2: Pusat Navigasi Pintas */}
              <div className="team-exec-card">
                <div className="card-title-row">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block mb-0.5">
                      Navigasi Kilat
                    </span>
                    <h3 className="card-heading-title">Pusat Navigasi Pintas</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Akses terpopuler admin ke modul operasional
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF3F9] text-[#0F3C65] border border-[#D0E2F0]">
                    4 Modul
                  </span>
                </div>

                <div className="quick-action-grid">
                  <Link to="/dashboard/siswa/ruang-belajar" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <GraduationCap size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Ruang Belajar</span>
                      <span className="quick-tile-sub">Modul & Pembelajaran</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/master-mapel" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BookMarked size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Master Mapel</span>
                      <span className="quick-tile-sub">Struktur Kurikulum</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/mapel-rombel" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <Network size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Mapel Rombel</span>
                      <span className="quick-tile-sub">Plotting & Kelas</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link to="/dashboard/admin/tagihan" className="quick-action-tile group">
                    <div className="quick-tile-icon-wrap bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Wallet size={20} />
                    </div>
                    <div className="quick-tile-text">
                      <span className="quick-tile-title">Keuangan SPP</span>
                      <span className="quick-tile-sub">Status Tagihan Siswa</span>
                    </div>
                    <ChevronRight size={14} className="quick-tile-arrow text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
          </div>

            {/* ── 4. RETRO EDITORIAL AGENDA — 1 BULAN PENUH (AESTHETIC PAPER JOURNAL & REALTIME CRUD) ── */}
            <section className="retro-agenda-section mt-8" id="agenda-section">
              {/* Bar Atas: Label NOTE ★ Kuning & Realtime Clock */}
              <div className="retro-agenda-top-bar">
                <div className="retro-note-badge" title="PKBM Bina Mandiri Agenda Notes">
                  NOTE ★
                </div>

                <div className="retro-top-clock">
                  <Clock size={15} className="retro-clock-icon" />
                  <span>{formattedLiveClock}</span>
                </div>
              </div>

              {/* Bar Judul Besar AGENDA & Dropdown Kontrol (Pilih Tanggal, Bulan, Tahun) */}
              <div className="retro-title-row">
                <div className="retro-title-wrap">
                  <h2 className="retro-main-title">AGENDA</h2>
                  {/* Swash Underline Cantik di Bawah Judul AGENDA (bukan menabrak huruf) */}
                  <svg className="retro-title-swash-underline" viewBox="0 0 280 28" fill="none" aria-hidden="true">
                    <path
                      d="M4,14 C 40,24 95,22 150,15 C 200,9 245,12 272,7"
                      stroke="#FFE500"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M250,9 C 265,5 276,2 278,14 C 280,24 266,22 258,16"
                      stroke="#FFE500"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg className="retro-title-sparkle" viewBox="0 0 24 24" fill="#FFE500" aria-hidden="true">
                    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
                  </svg>
                </div>

                <div className="retro-controls-wrap">
                  {/* Tombol Bulan Sebelumnya */}
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="retro-nav-arrow-btn"
                    title="Bulan Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Dropdown Pilihan Bulan */}
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="retro-select-input"
                    title="Pilih Bulan"
                  >
                    {MONTHS_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#1A1816] text-[#FFE500]">
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {/* Dropdown Pilihan Tahun */}
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="retro-select-input"
                    title="Pilih Tahun"
                  >
                    {YEARS_OPTIONS.map((y) => (
                      <option key={y} value={y} className="bg-[#1A1816] text-[#FFE500]">
                        {y}
                      </option>
                    ))}
                  </select>

                  {/* Tombol Bulan Berikutnya */}
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="retro-nav-arrow-btn"
                    title="Bulan Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Tombol Pintas Bulan Ini */}
                  <button
                    type="button"
                    onClick={goToCurrentMonth}
                    className="retro-today-btn"
                    title="Kembali ke Bulan Sekarang"
                  >
                    Bulan Ini
                  </button>

                  {/* Tombol Tambah Jadwal Baru */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(todayDateStr)}
                    className="retro-add-btn"
                    title="Tambah Catatan / Jadwal Baru"
                  >
                    <Plus size={15} />
                    <span>Tambah Jadwal</span>
                  </button>
                </div>
              </div>

              {/* Grid Kalender Retro 1 Bulan Penuh (Aesthetic Paper Journal) */}
              <div className="retro-calendar-wrapper">
                {/* Header Hari: Sunday - Saturday */}
                <div className="retro-days-header-row">
                  {DAYS_HEADER_LIST.map((dayName) => (
                    <div key={dayName} className="retro-day-name-cell">
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Grid Tanggal 1 Bulan (Aesthetic Journal Cells) */}
                <div className="retro-month-grid">
                  {calendarDays.map((day, idx) => {
                    const isToday = day.dateStr === todayDateStr;
                    const cellEvents = calendarEvents.filter(
                      (e) => (e.dateStr || e.date_str) === day.dateStr
                    );

                    return (
                      <div
                        key={`${day.dateStr}-${idx}`}
                        onClick={() => handleOpenAddModal(day.dateStr)}
                        className={`retro-calendar-cell ${isToday ? 'is-today' : ''} ${
                          !day.isCurrentMonth ? 'is-other-month' : ''
                        }`}
                        title={`Klik untuk tambah atau kelola catatan tanggal ${day.dateStr}`}
                      >
                        {/* Baris Nomor Tanggal & Indikator TODAY */}
                        <div className="retro-cell-number-row">
                          <span className="retro-cell-number">{day.dateNumber}</span>
                          {isToday && (
                            <span className="retro-cell-today-badge">TODAY</span>
                          )}
                        </div>

                        {/* Daftar Catatan / Jadwal Buku Harian */}
                        <div className="retro-cell-events-list">
                          {cellEvents.map((evt) => renderJournalNote(evt))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

          </div>
        </main>

      {/* Modal Popup Profile Editor */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Pengaturan Profil Pengguna</h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <ProfileEditorCard
              user={user}
              onUserUpdate={(updated) => {
                setUser(updated);
                localStorage.setItem('pkbm_user', JSON.stringify(updated));
              }}
              compact
            />
          </div>
        </div>
      )}

      {/* Modal Tambah / Kelola Jadwal Sendiri (Full CRUD & Yellow Accent) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#1B1A18] text-[#E5D8CC] rounded-3xl p-6 shadow-2xl border border-[#382A24] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#382A24]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE500] text-black font-black flex items-center justify-center font-mono text-base shadow-[0_0_12px_rgba(255,229,0,0.3)]">
                  {selectedDateStr ? selectedDateStr.split('-')[2] : '01'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {editingEventId ? 'Edit Jadwal Agenda' : 'Kelola & Tambah Jadwal'}
                  </h3>
                  <p className="text-xs text-[#FFE500] font-medium font-mono">
                    {selectedDateStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingEventId(null);
                }}
                className="p-1.5 rounded-full text-[#A89284] hover:text-white hover:bg-[#2A2320] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Daftar Agenda Pada Tanggal Terpilih */}
            {selectedDateEvents.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFE500] mb-2.5 flex items-center justify-between">
                  <span>Agenda Terdaftar Pada Tanggal Ini ({selectedDateEvents.length})</span>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(null);
                        setFormTitle('');
                        setFormSubtitle('');
                        setFormTime('09:00 WIB');
                        setFormCategory('rapat');
                        setFormNotes('');
                      }}
                      className="text-[11px] font-bold text-amber-400 underline lowercase"
                    >
                      + mode tambah baru
                    </button>
                  )}
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedDateEvents.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border ${
                        item.id === editingEventId
                          ? 'border-[#FFE500] bg-[#FFE500]/10'
                          : 'border-[#382A24] bg-[#24211F]'
                      } flex items-center justify-between gap-3`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFE500] flex-shrink-0 shadow-[0_0_8px_rgba(255,229,0,0.6)]"></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFE500]/20 text-[#FFE500] border border-[#FFE500]/40">
                              {item.badge || item.category?.toUpperCase() || 'AGENDA'}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A89284] mt-0.5">
                            {item.time} {item.subtitle ? `• ${item.subtitle}` : ''} {item.notes ? `• ${item.notes}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(item, e)}
                          className="p-1.5 rounded-lg text-[#FFE500] hover:bg-[#FFE500]/20 transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSchedule(item.id, e)}
                          className="p-1.5 rounded-lg text-[#A89284] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Hapus Agenda"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Tambah / Edit Jadwal */}
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFE500]">
                {editingEventId ? 'Edit Data Jadwal Terpilih' : '+ Tambah Jadwal Baru'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Tanggal <span className="text-[#FFE500]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Waktu <span className="text-[#FFE500]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09:00 WIB atau 22.30 PM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                  Judul Agenda / Acara <span className="text-[#FFE500]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Koordinasi Kurikulum Merdeka"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Gaya Catatan (Journal Planner)
                  </label>
                  <select
                    value={formCardStyle}
                    onChange={(e) => setFormCardStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  >
                    <option value="handwriting">📝 Catatan Tulisan Tangan</option>
                    <option value="sticky-yellow">📌 Sticky Note Kuning (Post-it)</option>
                    <option value="sticky-pink">🌸 Sticky Note Pink Pastel</option>
                    <option value="checklist">✅ Checklist Rapi (Centang)</option>
                    <option value="highlight">🖍️ Stabilo Kuning</option>
                    <option value="highlight-mint">🌿 Stabilo Mint</option>
                    <option value="washi">🏷️ Pita Washi Tape</option>
                    <option value="important">⚡ Label Penting (IMPORTANT!)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  >
                    <option value="rapat">Rapat Tutor & Pengurus</option>
                    <option value="ujian">Ujian & Evaluasi Modul</option>
                    <option value="spmb">SPMB & Pendaftaran</option>
                    <option value="workshop">Workshop & Pelatihan</option>
                    <option value="akademik">Akademik & Pembelajaran</option>
                    <option value="kegiatan">Kegiatan & Acara Khusus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Sub-judul / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RAPAT / AKADEMIK"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                    Lokasi / Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Rapat Utama & Daring"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#382A24]">
                <div>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSchedule(editingEventId, e)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Hapus Jadwal</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setEditingEventId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#A89284] hover:bg-[#2A2320] transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#FFE500] text-black hover:bg-[#FFF04D] shadow-[0_0_15px_rgba(255,229,0,0.35)] transition-all flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>{editingEventId ? 'Simpan Perubahan' : 'Simpan Jadwal'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardAdmin;