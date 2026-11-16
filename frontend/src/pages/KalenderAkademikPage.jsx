// ============================================================
// frontend/src/pages/KalenderAkademikPage.jsx
// Halaman Kalender Akademik 1 Tahun PKBM Bina Mandiri
// Bentuk & Tampilan Persis Sesuai Referensi Gambar (Retro Editorial Agenda)
// - Admin: CRUD Penuh (+ Tambah Jadwal, Edit, Hapus)
// - Siswa: Read-Only (Melihat Jadwal & Detail Agenda)
// - Tanpa Data Dummy (Murni Data Riil Pengguna & Database)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { AgendaAPI } from '../services/api.js';
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  MapPin,
  Sparkles,
  Eye
} from 'lucide-react';
import './KalenderAkademik.css';

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

export default function KalenderAkademikPage() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pkbm_user') || '{}');
    } catch {
      return {};
    }
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

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

  const formattedMobileClock = useMemo(() => {
    const hours = String(liveDateTime.getHours()).padStart(2, '0');
    const minutes = String(liveDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(liveDateTime.getSeconds()).padStart(2, '0');
    const day = String(liveDateTime.getDate()).padStart(2, '0');
    const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
    const month = shortMonths[liveDateTime.getMonth()];
    return `${hours}:${minutes}:${seconds} WIB • ${day} ${month}`;
  }, [liveDateTime]);

  // State Navigasi Bulan & Tahun Kalender
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0 - 11

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // State Kalender Events (Murni data riil, bebas dari dummy)
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      localStorage.removeItem('pkbm_admin_retro_agenda_events');
      const saved = localStorage.getItem('pkbm_kalender_akademik_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => !String(item.id).startsWith('evt-init'));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const fetchAgenda = async () => {
    try {
      localStorage.removeItem('pkbm_admin_retro_agenda_events');
      const res = await AgendaAPI.getAll();
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const mapped = res.data.data
          .filter((item) => !String(item.id).startsWith('evt-init'))
          .map((item) => ({
            id: item.id,
            dateStr: item.date_str || item.dateStr,
            title: item.title,
            subtitle: item.subtitle,
            time: item.time || '09:00 WIB',
            timeRange: item.time_range || item.timeRange,
            category: item.category || 'akademik',
            cardStyle: item.card_style || item.cardStyle || 'sticky-yellow',
            badge: item.badge || item.category?.toUpperCase() || 'AGENDA',
            notes: item.notes || '',
            location: item.location || '',
          }));

        setCalendarEvents(mapped);
        localStorage.setItem('pkbm_kalender_akademik_events', JSON.stringify(mapped));
      } else {
        setCalendarEvents([]);
        localStorage.setItem('pkbm_kalender_akademik_events', JSON.stringify([]));
      }
    } catch (err) {
      console.warn('Backend AgendaAPI sync fallback to local cache:', err);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  // Perhitungan Grid 1 Bulan Penuh (7 Kolom: Sunday - Saturday)
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

  // Tanggal Hari Ini
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Modals & Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);

  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formTime, setFormTime] = useState('09:00 WIB');
  const [formCategory, setFormCategory] = useState('akademik');
  const [formCardStyle, setFormCardStyle] = useState('sticky-yellow');
  const [formNotes, setFormNotes] = useState('');
  const [formLocation, setFormLocation] = useState('');

  // Buka Modal Tambah Jadwal (Admin)
  const handleOpenAddModal = (dateStr) => {
    if (!isAdmin) {
      const evts = calendarEvents.filter((e) => (e.dateStr || e.date_str) === dateStr);
      if (evts.length > 0) {
        setActiveDetailEvent(evts[0]);
        setShowDetailModal(true);
      }
      return;
    }
    setEditingEventId(null);
    setSelectedDateStr(dateStr || todayDateStr);
    setFormTitle('');
    setFormSubtitle('');
    setFormTime('09:00 WIB');
    setFormCategory('akademik');
    setFormCardStyle('sticky-yellow');
    setFormNotes('');
    setFormLocation('');
    setShowScheduleModal(true);
  };

  // Klik pada Catatan / Jadwal
  const handleEventClick = (event, e) => {
    e?.stopPropagation();
    if (!isAdmin) {
      // Siswa: Tampilkan Modal Detail (Read-Only)
      setActiveDetailEvent(event);
      setShowDetailModal(true);
      return;
    }

    // Admin: Buka Modal Edit Jadwal
    setEditingEventId(event.id);
    setSelectedDateStr(event.dateStr || event.date_str);
    setFormTitle(event.title || '');
    setFormSubtitle(event.subtitle || '');
    setFormTime(event.time || '09:00 WIB');
    setFormCategory(event.category || 'akademik');
    setFormCardStyle(event.cardStyle || event.card_style || 'sticky-yellow');
    setFormNotes(event.notes || '');
    setFormLocation(event.location || '');
    setShowScheduleModal(true);
  };

  // Simpan Jadwal (Admin CRUD)
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
      location: formLocation.trim(),
      badge: formCategory.toUpperCase(),
    };

    if (editingEventId) {
      try {
        await AgendaAPI.update(editingEventId, payload);
      } catch (err) {
        console.warn('API update fallback to local state:', err);
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
            location: payload.location,
            badge: payload.badge,
          };
        }
        return item;
      });
      setCalendarEvents(updatedList);
      localStorage.setItem('pkbm_kalender_akademik_events', JSON.stringify(updatedList));
    } else {
      let newId = 'evt-' + Date.now();
      try {
        const res = await AgendaAPI.create(payload);
        if (res?.data?.data?.id) newId = res.data.data.id;
      } catch (err) {
        console.warn('API create fallback to local state:', err);
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
        location: payload.location,
        badge: payload.badge,
      };

      const updatedList = [...calendarEvents, newEntry];
      setCalendarEvents(updatedList);
      localStorage.setItem('pkbm_kalender_akademik_events', JSON.stringify(updatedList));
    }

    setShowScheduleModal(false);
  };

  // Hapus Jadwal (Admin Only)
  const handleDeleteSchedule = async (eventId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Hapus agenda ini dari Kalender Akademik?')) return;

    try {
      await AgendaAPI.delete(eventId);
    } catch (err) {
      console.warn('API delete fallback to local state:', err);
    }

    const filtered = calendarEvents.filter((item) => item.id !== eventId);
    setCalendarEvents(filtered);
    localStorage.setItem('pkbm_kalender_akademik_events', JSON.stringify(filtered));
  };

  // Agenda Pada Tanggal Terpilih (Modal CRUD Admin)
  const selectedDateEvents = useMemo(() => {
    return calendarEvents.filter(
      (e) => (e.dateStr || e.date_str) === selectedDateStr
    );
  }, [calendarEvents, selectedDateStr]);

  // Render Catatan Kalender Aesthetic Journal
  const renderJournalNote = (evt) => {
    const style = evt.cardStyle || evt.card_style || 'handwriting';

    const delButton = isAdmin ? (
      <button
        type="button"
        onClick={(e) => handleDeleteSchedule(evt.id, e)}
        className="journal-note-del"
        title="Hapus catatan"
      >
        <X size={10} />
      </button>
    ) : null;

    if (style === 'sticky-pink' || style === 'envelope-pink') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-sticky is-pink group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <div className="journal-sticky-pin"></div>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          {evt.subtitle && <div className="journal-note-sub font-handwriting">{evt.subtitle}</div>}
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    if (style === 'sticky' || style === 'sticky-yellow') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-sticky group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <div className="journal-sticky-pin"></div>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          {evt.subtitle && <div className="journal-note-sub font-handwriting">{evt.subtitle}</div>}
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    if (style === 'checklist') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-checklist group"
          title={`${evt.title} • ${evt.time || ''}`}
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
          {delButton}
        </div>
      );
    }

    if (style === 'highlight-mint') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-highlight is-mint group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <span className="journal-highlight-marker font-handwriting">{evt.title}</span>
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    if (style === 'highlight' || style === 'bar-orange') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-highlight group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <span className="journal-highlight-marker font-handwriting">{evt.title}</span>
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    if (style === 'important' || style === 'poster-red') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-important group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <span className="journal-important-tag">IMPORTANT!</span>
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    if (style === 'washi' || style === 'ticket-blue' || style === 'ticket-white') {
      return (
        <div
          key={evt.id}
          onClick={(e) => handleEventClick(evt, e)}
          className="journal-note-washi group"
          title={`${evt.title} • ${evt.time || ''}`}
        >
          <div className="journal-note-title font-handwriting">{evt.title}</div>
          <div className="journal-note-time">{evt.time}</div>
          {delButton}
        </div>
      );
    }

    return (
      <div
        key={evt.id}
        onClick={(e) => handleEventClick(evt, e)}
        className="journal-note-handwritten group"
        title={`${evt.title} • ${evt.time || ''}`}
      >
        <span className="journal-note-bullet">•</span>
        <span className="journal-note-title font-handwriting">{evt.title}</span>
        <span className="journal-note-time-inline">{evt.time}</span>
        {delButton}
      </div>
    );
  };

  return (
    <div className="app-layout kalender-layout-root">
      {/* Sidebar Navigasi */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <main className="app-main kalender-app-main">
        <div className="app-content kalender-app-content">
          <div className="kalender-page-container">

            {/* RETRO EDITORIAL AGENDA — PERSIS GAMBAR REFERENSI USER */}
            <section className="retro-agenda-section" id="agenda-section">
              {/* Bar Atas: NOTE ★ Kuning & Realtime Clock */}
              <div className="retro-agenda-top-bar">
                <div className="retro-note-badge" title="PKBM Bina Mandiri Agenda Notes">
                  NOTE ★
                </div>

                <div className="retro-top-clock">
                  <Clock size={13} className="retro-clock-icon flex-shrink-0" />
                  <span className="retro-clock-desktop">{formattedLiveClock}</span>
                  <span className="retro-clock-mobile">{formattedMobileClock}</span>
                </div>
              </div>

              {/* Bar Judul Besar AGENDA & Kontrol */}
              <div className="retro-title-row">
                <div className="retro-title-wrap">
                  <h2 className="retro-main-title">AGENDA</h2>
                  {/* Swash Underline Cantik di Bawah Judul AGENDA */}
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
                  {/* Kelompok Navigasi Bulan & Tahun */}
                  <div className="retro-controls-nav-group">
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
                  </div>

                  {/* Kelompok Aksi: Bulan Ini & Tambah Jadwal */}
                  <div className="retro-controls-actions-group">
                    {/* Tombol Pintas Bulan Ini */}
                    <button
                      type="button"
                      onClick={goToCurrentMonth}
                      className="retro-today-btn"
                      title="Kembali ke Bulan Sekarang"
                    >
                      Bulan Ini
                    </button>

                    {/* Tombol Tambah Jadwal Baru (Khusus Admin) */}
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(todayDateStr)}
                        className="retro-add-btn"
                        title="Tambah Catatan / Jadwal Baru"
                      >
                        <Plus size={15} />
                        <span>Tambah Jadwal</span>
                      </button>
                    ) : (
                      <span className="retro-read-only-badge" title="Anda masuk sebagai Warga Belajar (Mode Lihat)">
                        <Eye size={14} />
                        <span>Mode Baca Siswa</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Petunjuk Geser Kalender di Mobile */}
              <div className="retro-mobile-swipe-hint">
                <span>⇄ Geser untuk melihat hari lainnya (Minggu — Sabtu)</span>
              </div>

              {/* Grid Kalender Retro 1 Bulan Penuh */}
              <div className="retro-calendar-wrapper">
                {/* Header Hari: Sunday - Saturday */}
                <div className="retro-days-header-row">
                  {DAYS_HEADER_LIST.map((dayName) => (
                    <div key={dayName} className="retro-day-name-cell">
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Grid Tanggal 1 Bulan */}
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
                        title={
                          isAdmin
                            ? `Klik untuk tambah atau kelola catatan tanggal ${day.dateStr}`
                            : `Tanggal ${day.dateStr} (${cellEvents.length} agenda)`
                        }
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
        </div>
      </main>

      {/* MODAL DETAIL AGENDA (READ-ONLY SISWA & ADMIN VIEW) */}
      {showDetailModal && activeDetailEvent && (
        <div className="kalender-modal-backdrop">
          <div className="kalender-modal-card">
            <div className="kalender-modal-header">
              <div className="flex items-center gap-3">
                <span className="detail-date-badge">
                  {activeDetailEvent.dateStr || activeDetailEvent.date_str}
                </span>
                <span className={`agenda-tag-pill cat-${activeDetailEvent.category || 'akademik'}`}>
                  {activeDetailEvent.badge || activeDetailEvent.category?.toUpperCase() || 'AGENDA'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setActiveDetailEvent(null);
                }}
                className="kalender-modal-close-btn"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="detail-event-header">
              <div>
                <h3 className="detail-event-title">{activeDetailEvent.title}</h3>
                {activeDetailEvent.subtitle && (
                  <p className="detail-event-subtitle">
                    ★ {activeDetailEvent.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="detail-info-list">
              <div className="detail-info-row">
                <Clock size={16} className="text-[#FFE500] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="detail-info-label">Waktu KBM / Acara:</span>
                  <span className="detail-info-value">{activeDetailEvent.time || '09:00 WIB'}</span>
                </div>
              </div>

              {activeDetailEvent.location && (
                <div className="detail-info-row">
                  <MapPin size={16} className="text-[#FFE500] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="detail-info-label">Lokasi / Ruangan:</span>
                    <span className="detail-info-value">{activeDetailEvent.location}</span>
                  </div>
                </div>
              )}

              {activeDetailEvent.notes && (
                <div className="detail-info-row">
                  <FileText size={16} className="text-[#FFE500] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="detail-info-label">Keterangan / Instruksi:</span>
                    <span className="detail-info-value">{activeDetailEvent.notes}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-official-notice">
              <Sparkles size={16} className="shrink-0" />
              <span>
                Agenda Resmi PKBM Bina Mandiri. Warga belajar diimbau mengikuti jadwal dengan tertib.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#382A24]">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const evt = activeDetailEvent;
                    setShowDetailModal(false);
                    handleEventClick(evt);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FFE500] text-black hover:bg-[#FFF04D] flex items-center gap-1.5"
                >
                  <Edit3 size={14} />
                  <span>Edit Data Agenda</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setActiveDetailEvent(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#24211E] text-white hover:bg-[#2F2B28] border border-[#382A24]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA & TAMBAH JADWAL (ADMIN ONLY CRUD) */}
      {isAdmin && showScheduleModal && (
        <div className="kalender-modal-backdrop">
          <div className="kalender-modal-card">
            {/* Modal Header */}
            <div className="kalender-modal-header">
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
                className="kalender-modal-close-btn"
                title="Tutup Modal"
              >
                <X size={18} />
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
                        setFormCategory('akademik');
                        setFormNotes('');
                        setFormLocation('');
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
                          onClick={(e) => handleEventClick(item, e)}
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
                    placeholder="Contoh: 09:00 WIB"
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
                    <option value="akademik">Akademik & KBM</option>
                    <option value="ujian">Ujian & Evaluasi Modul</option>
                    <option value="rapat">Rapat Tutor & Pengurus</option>
                    <option value="spmb">SPMB & Pendaftaran</option>
                    <option value="workshop">Workshop & Pelatihan</option>
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
                    Lokasi (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Rapat Utama & Daring"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D7C4B7] mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan detail mengenai agenda..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#382A24] bg-[#121110] text-white text-sm focus:outline-none focus:border-[#FFE500]"
                ></textarea>
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
