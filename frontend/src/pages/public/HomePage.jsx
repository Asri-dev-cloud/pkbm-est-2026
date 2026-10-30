// ============================================================
// src/pages/public/HomePage.jsx — Landing Page PKBM Bina Mandiri
// Tema Desain: Modern Boutique Floating Pill (Biru, Putih, Kuning, Hitam)
// Hero: Full Background gedung.jpeg dengan Dark Sapphire Overlay & Wavy Scallop Divider
// Navbar: Floating Capsule Pill Bar ala Referensi (Dual Social Circles, Nav Links, User & Bag Icons)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Award,
  Clock,
  Users,
  BookOpen,
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Plus,
  Minus,
  Menu,
  X,
  Compass,
  GraduationCap,
  CalendarCheck,
  Send,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Check,
  Zap,
  User,
  ShoppingBag,
  FileText,
  Eye,
  Play,
  Video,
  ExternalLink
} from "lucide-react";

// Komponen Ikon Instagram Resmi (Vector Stroke Seragam Lucide)
function InstagramIcon({ size = 16, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// ── DATA PROGRAM KESETARAAN ──────────────────────────────────
const PROGRAMS = [
  {
    kode: "C",
    title: "Kesetaraan Paket C",
    setara: "Setara SMA / MA",
    badge: "Paling Banyak Diminati",
    topTag: "BESTSELLER",
    img: "/images/Foto Pengganti 1.jpeg",
    desc: "Program unggulan berijazah resmi negara dengan hak eligibilitas penuh setara SMA formal — sah untuk daftar kuliah PTN/PTS, CPNS, TNI/Polri, dan kerja.",
    features: [
      "Hak eligibilitas penuh setara SMA formal",
      "Bisa ikut seleksi SNBP, SNBT UTBK & PTS",
      "Diakui perusahaan swasta, BUMN & instansi",
      "Jadwal fleksibel untuk pekerja & atlet"
    ]
  },
  {
    kode: "B",
    title: "Kesetaraan Paket B",
    setara: "Setara SMP / MTs",
    badge: "Jalur Cepat Menengah",
    topTag: "POPULER",
    img: "/images/kelas2.jpg",
    desc: "Pendidikan menengah pertama dengan kurikulum terpadu. Sangat ideal bagi pekerja muda, atlet, wirausahawan, maupun warga yang ingin lanjut ke Paket C.",
    features: [
      "Kurikulum terpadu Kemendikbudristek",
      "Modul digital ringkas & bimbingan tutor",
      "Syarat resmi melanjutkan ke SMA / Paket C",
      "Dapat belajar secara daring & mandiri"
    ]
  },
  {
    kode: "A",
    title: "Kesetaraan Paket A",
    setara: "Setara SD / MI",
    badge: "Pendidikan Dasar",
    topTag: "BEBAS USIA",
    img: "/images/kelas1.jpg",
    desc: "Program penuntasan pendidikan dasar bagi warga belajar usia anak, remaja, maupun dewasa yang belum memiliki ijazah Sekolah Dasar.",
    features: [
      "Terbuka bebas untuk segala rentang usia",
      "Suasana belajar santai & menyenangkan",
      "Ijazah resmi untuk lanjut ke SMP / Paket B",
      "Fokus literasi, numerasi & budi pekerti"
    ]
  },
  {
    kode: "PLUS",
    title: "Klub Bahasa & Kejuruan",
    setara: "Program Kecakapan Hidup",
    badge: "Keterampilan Kerja",
    topTag: "SKILL PLUS",
    img: "/images/rapot.jpg",
    desc: "Kelas tambahan keterampilan praktis: Bahasa Inggris, Jepang, Mandarin, dan literasi digital untuk meningkatkan daya saing karier warga belajar.",
    features: [
      "Kelas percakapan aktif & bersertifikat",
      "Pengenalan komputer & aplikasi perkantoran",
      "Mempersiapkan portofolio kerja & wirausaha",
      "Dibimbing tutor praktisi berpengalaman"
    ]
  }
];

// ── DATA KATEGORI PILIHAN (WAVY CONTAINER) ─────────────────────
const KEBUTUHAN_CATEGORIES = [
  {
    id: "pekerja",
    tag: "Karyawan / Pekerja",
    title: "Pekerja & Buruh",
    desc: "Belajar santai via LMS kapan saja tanpa mengganggu shift kerja.",
    img: "/images/Foto Pengganti 4.jpeg",
    target: "Paket C / Paket B"
  },
  {
    id: "remaja",
    tag: "Homeschooling",
    title: "Remaja Putus Sekolah",
    desc: "Lanjutkan pendidikan dengan metode ramah dan bebas perundungan.",
    img: "/images/Foto Pengganti 5.jpeg",
    target: "Paket A / B / C"
  },
  {
    id: "kuliah",
    tag: "Target Kuliah",
    title: "Persiapan PTN & PTS",
    desc: "Ijazah Paket C resmi berhak ikut SNBP, SNBT UTBK, dan Mandiri.",
    img: "/images/Foto Pengganti 6.jpeg",
    target: "Paket C Resmi"
  },
  {
    id: "dewasa",
    tag: "Bebas Usia",
    title: "Dewasa & Ibu Rumah Tangga",
    desc: "Wujudkan impian memegang ijazah formal dengan penuh kebanggaan.",
    img: "/images/Foto Pengganti 7.jpeg",
    target: "Semua Jenjang"
  },
  {
    id: "karier",
    tag: "Promosi Jabatan",
    title: "Peningkatan Karier",
    desc: "Penuhi syarat kualifikasi ijazah untuk kenaikan pangkat kerja.",
    img: "/images/Foto Pengganti 8.jpeg",
    target: "Paket C + Skill"
  }
];

// ── 8 FITUR UNGGULAN (GRID 2x4 SEPERTI DI MOCKUP) ───────────────
const KEUNGGULAN_GRID = [
  {
    title: "Ijazah Resmi Kemendikbud",
    desc: "Diterbitkan sah berpayung hukum pemerintah, berhak untuk kuliah & kerja.",
    badge: "TOP",
    icon: Award,
    img: "/images/rapot.jpg"
  },
  {
    title: "Akses LMS Digital 24 Jam",
    desc: "Modul, rangkuman, kuis, dan tugas online bisa diakses kapan saja dari HP.",
    badge: "TOP",
    icon: BookOpen,
    img: "/images/LMS.png"
  },
  {
    title: "Bebas Batasan Usia",
    desc: "Terbuka bagi usia sekolah, remaja, pekerja muda, hingga dewasa.",
    badge: "INKLUSIF",
    icon: Users,
    img: "/images/kelas1.jpg"
  },
  {
    title: "Jadwal Sangat Fleksibel",
    desc: "Dirancang adaptif untuk karyawan shift, wiraswasta, dan ibu rumah tangga.",
    badge: "FAVORIT",
    icon: Clock,
    img: "/images/Foto Pengganti A.jpeg"
  },
  {
    title: "Binaan Dinas Pendidikan",
    desc: "Izin operasional resmi di bawah naungan Disdik Kabupaten Sumedang.",
    badge: "RESMI",
    icon: ShieldCheck,
    img: "/images/gedung.jpeg"
  },
  {
    title: "Tutor Sabar & Bersahabat",
    desc: "Tenaga pengajar berpengalaman membimbing warga belajar sampai lulus.",
    badge: "TERPERCAYA",
    icon: GraduationCap,
    img: "/images/Foto Pengganti B.jpeg"
  },
  {
    title: "Kelas Bahasa & Komputer",
    desc: "Ekstrakurikuler bahasa asing & literasi digital penunjang masa depan.",
    badge: "PLUS",
    icon: Globe2,
    img: "/images/kelas2.jpg"
  },
  {
    title: "Biaya Transparan & Ringan",
    desc: "Skema pembiayaan pendidikan nonformal yang adil dan dapat diangsur.",
    badge: "HEMAT",
    icon: CheckCircle2,
    img: "/images/Foto Pengganti 3.jpeg"
  }
];

// ── DOKUMENTASI & GALERI ─────────────────────────────────────
const GALERI = [
  { src: "/images/gedung.jpeg", label: "Gedung Pusat Belajar & Pelayanan PKBM Bina Mandiri", position: "center" },
  { src: "/images/kelas1.jpg", label: "Aktivitas Belajar Tatap Muka & Diskusi Interaktif", position: "center" },
  { src: "/images/kelas2.jpg", label: "Pendampingan Modul & Literasi Warga Belajar", position: "center" },
  { src: "/images/Foto Pengganti C.jpeg", label: "Pertemuan Evaluasi Akademik & Ujian Kesetaraan", position: "center" },
  { src: "/images/Foto Pengganti 2.jpeg", label: "Sinergi Tim Tutor & Pengelola Yayasan", position: "center" },
  { src: "/images/rapot.jpg", label: "Penyerahan Rapot & Pembagian Ijazah Resmi", position: "center" },
];

// ── PERTANYAAN UMUM (FAQ) ────────────────────────────────────
const FAQS = [
  {
    q: "Apakah ijazah Paket A, B, dan C resmi dan diakui negara?",
    a: "Ya, 100% resmi! Ijazah Pendidikan Kesetaraan diterbitkan berpayung regulasi Kemendikbudristek dan UU Sisdiknas. Hak dan kedudukannya setara dengan ijazah sekolah formal — sah untuk mendaftar kuliah PTN/PTS, melamar pekerjaan, CPNS, TNI/Polri, maupun kenaikan jabatan."
  },
  {
    q: "Apakah ada batasan usia untuk mendaftar?",
    a: "Tidak ada batasan usia. PKBM Bina Mandiri menerima warga belajar dari semua rentang umur — mulai dari usia anak/remaja yang putus sekolah, hingga dewasa dan lansia yang ingin menuntaskan ijazah."
  },
  {
    q: "Saya bekerja dengan sistem shift, apakah belajarnya bisa disesuaikan?",
    a: "Sangat bisa! Kurikulum kami menggunakan metode blended learning. Materi, video ringkas, dan tugas harian tersaji di portal LMS yang bisa diakses 24 jam kapan saja saat Anda memiliki waktu luang."
  },
  {
    q: "Bagaimana cara mendaftar dan apa saja persyaratannya?",
    a: "Pendaftaran dapat dilakukan 100% online melalui tombol 'Daftar SPMB'. Anda cukup menyiapkan foto/scan Kartu Keluarga (KK), KTP (jika ada), dan ijazah jenjang sebelumnya (misal ijazah SD untuk Paket B, atau SMP untuk Paket C)."
  },
  {
    q: "Apakah lulusan Paket C bisa mendaftar ke Perguruan Tinggi Negeri (PTN)?",
    a: "Bisa sekali. Lulusan Paket C memiliki NISN resmi yang terdaftar di Dapodik Kemendikbud, sehingga berhak mendaftar seleksi masuk PTN lewat jalur SNBP, SNBT UTBK, maupun Ujian Mandiri di seluruh Indonesia."
  }
];

// ── VIDEO TUTORIAL RESMI (SPMB & LMS) ────────────────────────
const TUTORIAL_VIDEOS = [
  {
    id: "spmb",
    title: "Tutorial Pendaftaran Siswa Baru (SPMB Online)",
    desc: "Panduan praktis langkah demi langkah cara mendaftar secara mandiri melalui HP atau laptop. Meliputi pengisian biodata diri, pemilihan jenjang kesetaraan (Paket A, B, atau C), hingga unggah dokumen persyaratan KK/KTP.",
    tag: "SPMB ONLINE 2026",
    tagColor: { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
    accentColor: "#1D4ED8",
    blobRadiusOuter: "48% 52% 65% 35% / 44% 48% 52% 56%",
    blobRadiusInner: "47% 53% 64% 36% / 43% 47% 53% 57%",
    auraRadius: "52% 48% 40% 60% / 55% 45% 55% 45%",
    coverImg: "/images/Daftar.png",
    duration: "3 Menit",
    highlights: [
      "Registrasi akun mandiri 24 jam",
      "Unggah berkas KK & KTP via HP",
      "Konfirmasi penerimaan instan"
    ],
    videoUrl: "https://drive.google.com/file/d/1Ds-iO8p115U5rkarKApnSDxDRKtyucPJ/preview",
    externalUrl: "https://drive.google.com/file/d/1Ds-iO8p115U5rkarKApnSDxDRKtyucPJ/view?usp=sharing",
    actionTo: "/daftar",
    actionLabel: "Buka Form SPMB"
  },
  {
    id: "lms",
    title: "Tutorial Cara Penggunaan Ruang Belajar LMS",
    desc: "Panduan lengkap penggunaan sistem portal akademik LMS PKBM Bina Mandiri. Cara membaca e-modul materi pelajaran mandiri, mengumpulkan tugas harian, dan melihat jadwal ujian langsung dari HP Anda.",
    tag: "PORTAL LMS 24/7",
    tagColor: { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
    accentColor: "#059669",
    blobRadiusOuter: "62% 38% 42% 58% / 55% 60% 40% 45%",
    blobRadiusInner: "61% 39% 43% 57% / 54% 59% 41% 46%",
    auraRadius: "38% 62% 63% 37% / 41% 44% 56% 59%",
    coverImg: "/images/LMS.png",
    duration: "5 Menit",
    highlights: [
      "Akses e-modul resmi kapan saja",
      "Pengumpulan tugas mingguan",
      "Simulasi latihan & ujian online"
    ],
    videoUrl: "https://drive.google.com/file/d/15y1KrURVGksUtpeHV_W7CqTzgxJ3ineO/preview",
    externalUrl: "https://drive.google.com/file/d/15y1KrURVGksUtpeHV_W7CqTzgxJ3ineO/view?usp=sharing",
    actionTo: "/login",
    actionLabel: "Masuk Portal LMS"
  }
];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGaleri, setActiveGaleri] = useState(0);
  const [likedPrograms, setLikedPrograms] = useState({});
  const [showBrosurModal, setShowBrosurModal] = useState(false);
  const [showGaleriModal, setShowGaleriModal] = useState(false);
  const [videoModal, setVideoModal] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveGaleri((prev) => (prev + 1) % GALERI.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const toggleLike = (kode) => {
    setLikedPrograms((prev) => ({ ...prev, [kode]: !prev[kode] }));
  };

  const [activeProgramIdx, setActiveProgramIdx] = useState(0);
  const programCardRefs = useRef([]);

  const handleSelectProgram = (idx) => {
    setActiveProgramIdx(idx);
    const card = programCardRefs.current[idx];
    if (card && carouselRef.current) {
      carouselRef.current.scrollTo({
        left: card.offsetLeft,
        behavior: "smooth"
      });
    }
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      if (idx >= 0 && idx < PROGRAMS.length && idx !== activeProgramIdx) {
        setActiveProgramIdx(idx);
      }
    }
  };

  const handlePrevProgram = () => {
    const nextIdx = (activeProgramIdx - 1 + PROGRAMS.length) % PROGRAMS.length;
    handleSelectProgram(nextIdx);
  };

  const handleNextProgram = () => {
    const nextIdx = (activeProgramIdx + 1) % PROGRAMS.length;
    handleSelectProgram(nextIdx);
  };

  const [activeKebutuhanIdx, setActiveKebutuhanIdx] = useState(0);
  const kebutuhanRef = useRef(null);
  const kebutuhanCardRefs = useRef([]);

  const handleSelectKebutuhan = (idx) => {
    setActiveKebutuhanIdx(idx);
    const card = kebutuhanCardRefs.current[idx];
    if (card && kebutuhanRef.current) {
      kebutuhanRef.current.scrollTo({
        left: card.offsetLeft,
        behavior: "smooth"
      });
    }
  };

  const handleKebutuhanScroll = () => {
    if (!kebutuhanRef.current) return;
    const scrollLeft = kebutuhanRef.current.scrollLeft;
    const width = kebutuhanRef.current.offsetWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      if (idx >= 0 && idx < KEBUTUHAN_CATEGORIES.length && idx !== activeKebutuhanIdx) {
        setActiveKebutuhanIdx(idx);
      }
    }
  };

  const handlePrevKebutuhan = () => {
    const nextIdx = (activeKebutuhanIdx - 1 + KEBUTUHAN_CATEGORIES.length) % KEBUTUHAN_CATEGORIES.length;
    handleSelectKebutuhan(nextIdx);
  };

  const handleNextKebutuhan = () => {
    const nextIdx = (activeKebutuhanIdx + 1) % KEBUTUHAN_CATEGORIES.length;
    handleSelectKebutuhan(nextIdx);
  };

  const isScrolled = scrollY > 40;

  return (
    <div
      className="pkbm-boutique-page"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        background: "#FFFFFF",
        color: "#0F172A",
        overflowX: "hidden"
      }}
    >
      {/* ── STYLING KHUSUS IN-LINE ────────────────────────────── */}
      <style>{`
        /* Infinite Marquee Ticker Track */
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* Float Subtle */
        @keyframes floatCute {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .anim-float {
          animation: floatCute 5s ease-in-out infinite;
        }

        /* Modern CTA Buttons */
        .cute-pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.92rem;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid transparent;
        }
        .cute-pill-btn:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .cute-pill-btn:active {
          transform: translateY(0) scale(0.99);
        }

        /* Yellow CTA Button - Bersih & Mewah Tanpa Bayang Hitam */
        .btn-yellow {
          background-color: #FACC15;
          color: #0F172A !important;
          border: 1px solid #EAB308;
          box-shadow: 0 4px 14px rgba(234, 179, 8, 0.35);
        }
        .btn-yellow:hover {
          background-color: #FDE047;
          border-color: #CA8A04;
          box-shadow: 0 8px 22px rgba(234, 179, 8, 0.45);
        }

        /* Hero Background dengan Gradien Khusus di Area Kiri (Pagar & Tiang Listrik)
           Area Kanan (Gedung PKBM) 100% Bebas, Terang & Tampak Jelas */
        @media (min-width: 900px) {
          .hero-building-bg {
            background: linear-gradient(
              to right,
              #FFFFFF 0%,
              rgba(255, 255, 255, 0.98) 22%,
              rgba(255, 255, 255, 0.88) 30%,
              rgba(255, 255, 255, 0.35) 36%,
              rgba(255, 255, 255, 0) 41%
            ), url('/images/gedung.jpeg') right center / cover no-repeat !important;
          }
        }
        @media (max-width: 899px) {
          .hero-building-bg {
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.98) 0%,
              rgba(255, 255, 255, 0.94) 55%,
              rgba(255, 255, 255, 0.65) 80%,
              rgba(255, 255, 255, 0.25) 100%
            ), url('/images/gedung.jpeg') center top / cover no-repeat !important;
          }
        }

        /* Translucent Glass Button for Hero */
        .btn-glass-hero {
          background: rgba(255, 255, 255, 0.18);
          color: #FFFFFF !important;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-radius: 8px;
          backdrop-filter: blur(8px);
        }
        .btn-glass-hero:hover {
          background: rgba(255, 255, 255, 0.32);
          border-color: #FFFFFF;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
        }

        /* Nav Link Item */
        .pill-nav-link {
          color: #334155;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.82rem;
          padding: 5px 10px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .pill-nav-link:hover {
          color: #1D4ED8;
          background: #F1F5F9;
        }

        /* Card Interactive Hover */
        .boutique-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .boutique-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(29, 78, 216, 0.12);
        }

        /* Hide Scrollbars */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Prevent sections from being obscured by floating navbar */
        section[id] {
          scroll-margin-top: 100px;
        }

        /* ── OPTIMASI KELANCARAN & KECEPATAN RENDER MOBILE (CONTENT-VISIBILITY) ── */
        #program, #kebutuhan, #keunggulan, #galeri, #faq, #kontak {
          content-visibility: auto;
          contain-intrinsic-size: 1px 650px;
        }

        /* Modal Video Tutorial Responsif Tanpa Layer Hitam */
        .video-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        @media (max-width: 640px) {
          .video-modal-overlay {
            padding: 10px;
            background: rgba(255, 255, 255, 0.96);
          }
          .video-modal-card {
            border-radius: 20px !important;
            max-height: 96vh !important;
          }
          .video-modal-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .video-modal-actions .cute-pill-btn {
            width: 100% !important;
            padding: 10px 8px !important;
            font-size: 0.78rem !important;
          }
        }

        /* Program Cards Slider (Horizontal 100% Utuh Tanpa Terpotong di Mobile, 4 Kolom di Desktop) */
        @media (min-width: 1024px) {
          .program-carousel-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
            overflow-x: visible !important;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .program-carousel-grid {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: calc(50% - 10px);
            gap: 20px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-top: 14px;
            padding-bottom: 20px;
            scroll-behavior: smooth;
          }
          .program-card-item {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        }
        @media (max-width: 639px) {
          .program-carousel-grid {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: 100%;
            gap: 16px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-top: 14px;
            padding-bottom: 20px;
            scroll-behavior: smooth;
          }
          .program-card-item {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        }

        /* Kebutuhan 5 Cards Slider (Horizontal 100% Utuh Tanpa Terpotong di Mobile, 5 Kolom di Desktop) */
        @media (min-width: 1024px) {
          .kebutuhan-grid {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 16px !important;
            overflow-x: visible !important;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .kebutuhan-grid {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: calc(50% - 8px);
            gap: 16px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-top: 14px;
            padding-bottom: 20px;
            scroll-behavior: smooth;
          }
          .kebutuhan-card-item {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        }
        @media (max-width: 639px) {
          .kebutuhan-grid {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: 100%;
            gap: 16px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-top: 14px;
            padding-bottom: 20px;
            scroll-behavior: smooth;
          }
          .kebutuhan-card-item {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        }

        /* ── RESPONSIVE GRIDS (MOBILE RAPI, DESKTOP TETAP MAKSIMAL) ── */

        /* 1. Hero Content Grid */
        .hero-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .hero-content-grid {
            grid-template-columns: minmax(320px, 440px) 1fr;
            gap: 36px;
          }
        }

        /* 2. Tentang Lembaga Grid */
        .tentang-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          align-items: stretch;
        }
        @media (min-width: 1024px) {
          .tentang-content-grid {
            grid-template-columns: 1fr 1.15fr;
          }
        }

        /* 3. 8 Keunggulan Cards Grid (1 Kolom Rapi di Mobile, 2 Kolom di Tablet, 4 Kolom di Desktop) */
        .keunggulan-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .keunggulan-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }
        }
        @media (min-width: 1024px) {
          .keunggulan-cards-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }

        /* 4. Legalitas & Komitmen Grid */
        .legalitas-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .legalitas-content-grid {
            grid-template-columns: 0.9fr 1.1fr;
            gap: 56px;
          }
        }

        /* 5. Galeri Thumbnails Grid */
        .galeri-thumbnails-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 768px) {
          .galeri-thumbnails-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
          }
        }

        /* 6. Kontak & Form Grid */
        .kontak-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .kontak-content-grid {
            grid-template-columns: 1.05fr 0.95fr;
            gap: 52px;
          }
        }

        /* 7. Footer Grid */
        .footer-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          margin-bottom: 44px;
        }
        @media (min-width: 640px) {
          .footer-content-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px;
          }
        }
        @media (min-width: 1024px) {
          .footer-content-grid {
            grid-template-columns: 1.8fr 1fr 1fr 1fr;
            gap: 40px;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          1. FLOATING PILL NAVBAR ALA REFERENSI GAMBAR
             (Floating Capsule Pill, Dual Circular Social Icons,
              Nav Links, Shopping/Book & User Profile Icons, Pill CTA)
          ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          top: 18,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: "0 clamp(12px, 3vw, 32px)",
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none"
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: 1180,
            background: isScrolled ? "rgba(255, 255, 255, 0.97)" : "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 9999, // Capsule Pill Shape
            padding: "6px 8px 6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            border: "1px solid rgba(226, 232, 240, 0.8)",
            boxShadow: isScrolled
              ? "0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.05)"
              : "0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}
        >
          {/* Sisi Kiri: Kontak (Desktop) + Logo PKBM & Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>

            {/* Lingkaran 1: WhatsApp / Pesan (Desktop / Tablet) */}
            <a
              href="https://wa.me/6282318383605"
              target="_blank"
              rel="noreferrer"
              title="Hubungi WhatsApp Kami"
              className="hidden md:flex"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#1D4ED8",
                color: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(29, 78, 216, 0.3)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Send size={15} />
            </a>

            {/* Lingkaran 2: Instagram (Desktop / Tablet) */}
            <a
              href="https://www.instagram.com/bina_mandiri_pkbm/"
              target="_blank"
              rel="noreferrer"
              title="Kunjungi Instagram @bina_mandiri_pkbm"
              className="hidden md:flex"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#FACC15",
                color: "#0F172A",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                border: "1px solid #EAB308",
                boxShadow: "0 2px 8px rgba(250, 204, 21, 0.25)",
                transition: "transform 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <InstagramIcon size={16} />
            </a>

            {/* Logo PKBM & Nama Brand */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                marginLeft: 2
              }}
            >
              <img
                src="/images/logo new.png"
                alt="Logo PKBM"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                  flexShrink: 0
                }}
              />
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontWeight: 800, fontSize: "clamp(0.82rem, 2.5vw, 0.92rem)", color: "#0F172A", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                  PKBM <span style={{ color: "#1D4ED8" }}>Bina Mandiri</span>
                </div>
                <div className="hidden sm:block" style={{ fontSize: "0.66rem", color: "#64748B", fontWeight: 700, letterSpacing: "0.01em" }}>
                  Sumedang · Jawa Barat
                </div>
              </div>
            </Link>
          </div>

          {/* Tengah: Navigation Links (Hanya Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <a href="#tutorial" className="pill-nav-link">
              <span>Tutorial</span>
            </a>
            <a href="#program" className="pill-nav-link">
              <span>Program</span>
            </a>
            <a href="#tentang" className="pill-nav-link">
              <span>Tentang</span>
            </a>
            <a href="#kebutuhan" className="pill-nav-link">
              <span>Program Pilihan</span>
            </a>
            <a href="#keunggulan" className="pill-nav-link">
              <span>Keunggulan</span>
            </a>
            <a href="#galeri" className="pill-nav-link">
              <span>Galeri</span>
            </a>
            <a href="#faq" className="pill-nav-link">
              <span>FAQ</span>
            </a>
            <a href="#kontak" className="pill-nav-link">
              <span>Kontak</span>
            </a>
          </nav>

          {/* Sisi Kanan: Ikon LMS, Ikon User & Tombol Pill SPMB */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Ikon Tas / Belajar LMS (Desktop / Tablet) */}
            <Link
              to="/login"
              title="Akses Ruang Belajar LMS"
              className="hidden md:flex"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#F8FAFC",
                color: "#334155",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                border: "1px solid #E2E8F0",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#EFF6FF";
                e.currentTarget.style.color = "#1D4ED8";
                e.currentTarget.style.borderColor = "#BFDBFE";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.color = "#334155";
                e.currentTarget.style.borderColor = "#E2E8F0";
              }}
            >
              <BookOpen size={16} />
            </Link>

            {/* Ikon User / Profil (Desktop / Tablet) */}
            <Link
              to="/login"
              title="Login Portal Siswa & Tutor"
              className="hidden md:flex"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#F8FAFC",
                color: "#334155",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                border: "1px solid #E2E8F0",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#EFF6FF";
                e.currentTarget.style.color = "#1D4ED8";
                e.currentTarget.style.borderColor = "#BFDBFE";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.color = "#334155";
                e.currentTarget.style.borderColor = "#E2E8F0";
              }}
            >
              <User size={16} />
            </Link>

            {/* Tombol Pill Kuning SPMB */}
            <Link
              to="/daftar"
              className="cute-pill-btn btn-yellow"
              style={{
                height: 34,
                padding: "0 clamp(10px, 2.5vw, 16px)",
                fontSize: "0.78rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap"
              }}
            >
              <span>Daftar SPMB</span>
              <ArrowRight size={13} />
            </Link>

            {/* Hamburger Button untuk Mobile / Layar Kecil */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                background: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
                cursor: "pointer",
                flexShrink: 0
              }}
              title="Menu Navigasi"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu Floating */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: 16,
            right: 16,
            zIndex: 999,
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "20px 20px 24px",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.16)",
            border: "1px solid #E2E8F0",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto"
          }}
        >
          {/* Quick Contact & LMS Bar inside Mobile Menu */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
            <a
              href="https://wa.me/6282318383605"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "10px 4px",
                background: "#EFF6FF",
                borderRadius: 14,
                color: "#1D4ED8",
                textDecoration: "none",
                fontSize: "0.72rem",
                fontWeight: 700
              }}
            >
              <Send size={16} />
              <span>WhatsApp</span>
            </a>
            <a
              href="https://www.instagram.com/bina_mandiri_pkbm/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "10px 4px",
                background: "#FEF9C3",
                borderRadius: 14,
                color: "#854D0E",
                textDecoration: "none",
                fontSize: "0.72rem",
                fontWeight: 700
              }}
            >
              <InstagramIcon size={16} />
              <span>Instagram</span>
            </a>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "10px 4px",
                background: "#F8FAFC",
                borderRadius: 14,
                color: "#334155",
                textDecoration: "none",
                fontSize: "0.72rem",
                fontWeight: 700,
                border: "1px solid #E2E8F0"
              }}
            >
              <BookOpen size={16} />
              <span>Portal LMS</span>
            </Link>
          </div>

          {[
            ["#tutorial", "Video Tutorial (SPMB & LMS)"],
            ["#program", "Program Kesetaraan (Paket A, B, C)"],
            ["#tentang", "Tentang Lembaga (Profil & Brosur)"],
            ["#kebutuhan", "Program Pilihan"],
            ["#keunggulan", "8 Keunggulan Utama Lembaga"],
            ["#galeri", "Galeri Suasana Kegiatan"],
            ["#faq", "Tanya Jawab Lengkap (FAQ)"],
            ["#kontak", "Kontak & Alamat Sekretariat"]
          ].map(([href, label]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "11px 4px",
                borderBottom: "1px solid #F1F5F9",
                color: "#0F172A",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.88rem"
              }}
            >
              {label}
            </a>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "11px",
                borderRadius: 9999,
                border: "1.5px solid #CBD5E1",
                color: "#1E293B",
                fontWeight: 800,
                textDecoration: "none",
                fontSize: "0.86rem"
              }}
            >
              Masuk Portal
            </Link>
            <Link
              to="/daftar"
              onClick={() => setMenuOpen(false)}
              className="cute-pill-btn btn-yellow"
              style={{ flex: 1, padding: "11px", fontSize: "0.86rem" }}
            >
              Daftar SPMB
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          2. HERO SECTION — TEKS DIBATASI HANYA DI AREA KIRI (PAGAR/TIANG)
             GEDUNG PKBM DI SISI KANAN TERLIHAT JELAS 100% TANPA HALANGAN
          ══════════════════════════════════════════════════════════ */}
      <section
        className="hero-building-bg"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(120px, 14vh, 165px) clamp(16px, 4vw, 48px) clamp(60px, 9vh, 110px)",
          overflow: "hidden"
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", position: "relative", zIndex: 10 }}>
          <div className="hero-content-grid">
            {/* Kiri: Teks & Action DIBATASI HANYA DI AREA KIRI agar Gedung di Kanan Bersinar Bebas */}
            <div style={{ maxWidth: 460 }}>

              {/* Main Headline — Rapi & Proporsional di Sisi Kiri */}
              <h1
                style={{
                  fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: "#0F172A",
                  marginBottom: 16
                }}
              >
                Pendidikan yang{" "}
                <span style={{ color: "#1D4ED8" }}>
                  Membuka Peluang,
                </span>
                <br />
                Ijazah Resmi Negara.
              </h1>

              {/* Subheadline Ringkas */}
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "#334155",
                  lineHeight: 1.65,
                  marginBottom: 24
                }}
              >
                Penyelenggara resmi <strong>Paket A (SD)</strong>, <strong>Paket B (SMP)</strong>, dan <strong>Paket C (SMA)</strong> dengan waktu belajar fleksibel. Bebas batasan usia, modul digital 24 jam, dan ijazah sah untuk kuliah, CPNS, serta dunia kerja.
              </p>

              {/* Action Buttons: Yellow Pill + Blue Outline Tanpa Bayang Hitam */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  to="/daftar"
                  className="cute-pill-btn btn-yellow"
                  style={{ padding: "13px 26px", fontSize: "0.92rem" }}
                >
                  <span>Daftar SPMB Sekarang</span>
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#program"
                  className="cute-pill-btn"
                  style={{
                    padding: "13px 22px",
                    fontSize: "0.9rem",
                    background: "#FFFFFF",
                    color: "#1D4ED8",
                    border: "1.5px solid #BFDBFE",
                    boxShadow: "0 2px 10px rgba(29, 78, 216, 0.08)"
                  }}
                >
                  <span>Pelajari Program</span>
                </a>
              </div>

              {/* 4 Feature Badges (2x2 Grid) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  marginTop: 26,
                  paddingTop: 18,
                  borderTop: "1px dashed #CBD5E1"
                }}
              >
                {[
                  ["100% Sah", "Ijazah Resmi Negara", "#1D4ED8"],
                  ["3 Jenjang", "Paket A, B, & C", "#0F172A"],
                  ["Bebas Usia", "Semua Kalangan", "#D97706"],
                  ["LMS 24/7", "Belajar Online Fleksibel", "#1D4ED8"]
                ].map(([val, label, col]) => (
                  <div key={label}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 900, color: col, letterSpacing: "-0.02em" }}>
                      {val}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, marginTop: 1 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* NPSN & Alamat Singkat di Kolom Kiri */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: "0.74rem", color: "#64748B" }}>
                <MapPin size={13} color="#1D4ED8" />
                <span>NPSN : P2970848 · Kec. Paseh, Kab. Sumedang</span>
              </div>

            </div>

            {/* Kanan: DIBIARKAN TERBUKA 100% AGAR GEDUNG PKBM TAMPAK JELAS & MAJESTIK */}
            <div className="hidden lg:block" style={{ minHeight: 380, pointerEvents: "none" }}>
              {/* Kolom kanan sengaja dibiarkan terbuka agar gedung di foto latar belakang terlihat penuh dan jelas */}
            </div>

          </div>
        </div>

        {/* ── WAVY SCALLOP DIVIDER PUTIH DI BAWAH HERO (RAPI, FLAWLESS, TANPA GAP) ── */}
        <div
          style={{
            position: "absolute",
            bottom: "-1px",
            left: 0,
            right: 0,
            width: "100%",
            lineHeight: 0,
            zIndex: 10,
            pointerEvents: "none"
          }}
        >
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "clamp(55px, 7vw, 95px)", display: "block" }}
          >
            <path
              d="M0,45 C280,105 480,15 720,65 C960,115 1180,25 1440,55 L1440,120 L0,120 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2.5 SECTION TUTORIAL VIDEO (DI BAWAH HERO)
          Sampul: Daftar.png (SPMB) & LMS.png (LMS) dalam Bentuk Blob
          ══════════════════════════════════════════════════════════ */}
      <section
        id="tutorial"
        style={{
          padding: "60px clamp(16px, 4vw, 48px) 65px",
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 55%, #FFFFFF 100%)",
          position: "relative",
          zIndex: 2,
          borderBottom: "1px solid #E2E8F0"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          {/* Section Header */}
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 46px" }}>
            <h2
              style={{
                fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                fontWeight: 900,
                color: "#0F172A",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                marginBottom: 14
              }}
            >
              Video Panduan Mendaftar & Belajar di LMS
            </h2>

            <p style={{ color: "#64748B", fontSize: "0.93rem", lineHeight: 1.65, margin: 0 }}>
              Simak video tutorial singkat berikut untuk panduan pendaftaran siswa baru secara online serta kemudahan mengakses ruang belajar dan tugas harian.
            </p>
          </div>

          {/* 2 Video Showcases Grid (TANPA KOTAK — Desain Terbuka, Elegan & Fluid dengan Blob Artistik) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))",
              gap: "clamp(36px, 5vw, 64px)",
              alignItems: "flex-start"
            }}
          >
            {TUTORIAL_VIDEOS.map((v, idx) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: 0
                }}
              >
                {/* ── BINGKAI BLOB ARTISTIK BERLAPIS (ORGANIK, LUAS & MEWAH TANPA TERTEKAN KOTAK) ── */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "clamp(290px, 34vw, 380px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24
                  }}
                >
                  {/* Lapisan 1: Ambient Glowing Aura Blob di Belakang */}
                  <div
                    style={{
                      position: "absolute",
                      inset: -16,
                      borderRadius: v.auraRadius,
                      background: idx === 0
                        ? "radial-gradient(circle at 35% 35%, rgba(250, 204, 21, 0.45) 0%, rgba(29, 78, 216, 0.28) 70%, transparent 100%)"
                        : "radial-gradient(circle at 35% 35%, rgba(52, 211, 153, 0.45) 0%, rgba(29, 78, 216, 0.28) 70%, transparent 100%)",
                      filter: "blur(32px)",
                      transform: idx === 0 ? "scale(1.06) rotate(-3deg)" : "scale(1.06) rotate(3deg)",
                      zIndex: 0,
                      pointerEvents: "none"
                    }}
                  />

                  {/* Lapisan 2: Frame Luar Blob Bergradasi Halus (Rim Ring) */}
                  <div
                    onClick={() => setVideoModal(v)}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      width: "100%",
                      height: "100%",
                      borderRadius: v.blobRadiusOuter,
                      padding: 6,
                      background: idx === 0
                        ? "linear-gradient(135deg, #FACC15 0%, #60A5FA 50%, #1D4ED8 100%)"
                        : "linear-gradient(135deg, #34D399 0%, #10B981 50%, #1D4ED8 100%)",
                      boxShadow: idx === 0
                        ? "0 22px 50px -10px rgba(29, 78, 216, 0.28), 0 10px 22px -5px rgba(250, 204, 21, 0.25)"
                        : "0 22px 50px -10px rgba(5, 150, 105, 0.28), 0 10px 22px -5px rgba(29, 78, 216, 0.2)",
                      cursor: "pointer",
                      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.025) translateY(-4px)";
                      e.currentTarget.style.boxShadow = idx === 0
                        ? "0 30px 60px -10px rgba(29, 78, 216, 0.38), 0 14px 28px -5px rgba(250, 204, 21, 0.35)"
                        : "0 30px 60px -10px rgba(5, 150, 105, 0.38), 0 14px 28px -5px rgba(29, 78, 216, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1) translateY(0)";
                      e.currentTarget.style.boxShadow = idx === 0
                        ? "0 22px 50px -10px rgba(29, 78, 216, 0.28), 0 10px 22px -5px rgba(250, 204, 21, 0.25)"
                        : "0 22px 50px -10px rgba(5, 150, 105, 0.28), 0 10px 22px -5px rgba(29, 78, 216, 0.2)";
                    }}
                    title={`Klik untuk memutar ${v.title}`}
                  >
                    {/* Lapisan 3: Wadah Gambar Foto di Dalam Blob */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: v.blobRadiusInner,
                        overflow: "hidden",
                        position: "relative",
                        background: "#0F172A"
                      }}
                    >
                      <img
                        src={v.coverImg}
                        alt={v.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center top",
                          display: "block",
                          transition: "transform 0.5s ease"
                        }}
                      />

                      {/* Gradasi Lembut untuk Kontras Play Button & Teks */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(15, 23, 42, 0.55) 100%)"
                        }}
                      />

                      {/* Tombol Play Mengambang dengan Efek Ripple Lingkaran */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 74,
                          height: 74,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          color: v.accentColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.38), 0 0 0 7px rgba(255, 255, 255, 0.35)",
                          transition: "transform 0.25s ease"
                        }}
                      >
                        <Play size={30} fill={v.accentColor} style={{ marginLeft: 4 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── KONTEN DESKRIPSI DI BAWAH BLOB (BERSIH & TERBUKA TANPA KOTAK) ── */}
                <div style={{ padding: "0 6px", display: "flex", flexDirection: "column" }}>
                  {/* Headline */}
                  <h3
                    style={{
                      fontSize: "clamp(1.25rem, 2.2vw, 1.48rem)",
                      fontWeight: 900,
                      color: "#0F172A",
                      marginBottom: 10,
                      lineHeight: 1.28,
                      letterSpacing: "-0.01em"
                    }}
                  >
                    {v.title}
                  </h3>

                  {/* Description */}
                  <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>
                    {v.desc}
                  </p>

                  {/* 3 Highlight Chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                    {v.highlights.map((h) => (
                      <div
                        key={h}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#F1F5F9",
                          color: "#334155",
                          padding: "5px 12px",
                          borderRadius: 8,
                          fontSize: "0.76rem",
                          fontWeight: 700
                        }}
                      >
                        <Check size={12} color={v.accentColor} strokeWidth={3} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setVideoModal(v)}
                      className="cute-pill-btn btn-yellow"
                      style={{ padding: "12px 24px", fontSize: "0.9rem", boxShadow: "0 6px 18px rgba(234, 179, 8, 0.35)" }}
                    >
                      <Play size={16} fill="#0F172A" />
                      <span>Tonton Video Panduan</span>
                    </button>

                    <Link
                      to={v.actionTo}
                      className="cute-pill-btn"
                      style={{
                        padding: "12px 20px",
                        fontSize: "0.88rem",
                        background: "#FFFFFF",
                        color: "#1D4ED8",
                        border: "1.5px solid #BFDBFE",
                        boxShadow: "0 2px 8px rgba(29, 78, 216, 0.08)"
                      }}
                    >
                      <span>{v.actionLabel}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. SECTION 2: PROGRAM BESTSELLER / PILIHAN UNGGULAN
             (Mirip "Наши бестселлеры" di Gambar Mockup dengan Card Carousel)
          ══════════════════════════════════════════════════════════ */}
      <section
        id="program"
        style={{
          padding: "50px clamp(16px, 4vw, 48px) 70px",
          background: "#FFFFFF"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          {/* Header Bestseller: Judul Kiri + Deskripsi Kanan */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 20,
              marginBottom: 36
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.6vw, 2.7rem)",
                  fontWeight: 900,
                  color: "#0F172A",
                  lineHeight: 1.18,
                  letterSpacing: "-0.02em"
                }}
              >
                Layanan Unggulan Kami.<br />
                <span style={{ color: "#1D4ED8" }}>Terbukti Mengantarkan Alumni Sukses</span>
              </h2>
            </div>

            <div style={{ maxWidth: 380 }}>
              <p style={{ color: "#64748B", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 12 }}>
                Bingung menentukan jenjang pendidikan kesetaraan yang cocok? Pilih paket di bawah ini atau konsultasikan langsung secara gratis.
              </p>

              {/* Carousel Controls with Active Indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Dots / Kotak Indicator */}
                <div style={{ display: "flex", gap: 6, marginRight: 4 }}>
                  {PROGRAMS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectProgram(i)}
                      style={{
                        width: activeProgramIdx === i ? 24 : 8,
                        height: 8,
                        borderRadius: 9999,
                        background: activeProgramIdx === i ? "#FACC15" : "#E2E8F0",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        padding: 0
                      }}
                      title={`Pilih Kotak ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handlePrevProgram}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1.5px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease"
                  }}
                  title="Kotak Sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextProgram}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1px solid #EAB308",
                    background: "#FACC15",
                    color: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(250, 204, 21, 0.35)",
                    transition: "all 0.2s ease"
                  }}
                  title="Kotak Selanjutnya"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Cards Carousel (Responsif & Menunjuk Per Kotak Tanpa Kepotong) */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="program-carousel-grid no-scrollbar"
          >
            {PROGRAMS.map((p, idx) => {
              const isSelected = activeProgramIdx === idx;
              return (
                <div
                  key={p.kode}
                  ref={(el) => (programCardRefs.current[idx] = el)}
                  onClick={() => handleSelectProgram(idx)}
                  className="boutique-card program-card-item"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 28,
                    border: "2px solid #E2E8F0",
                    overflow: "hidden",
                    boxShadow: isSelected ? "0 10px 24px rgba(0,0,0,0.08)" : "0 4px 16px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Image Container with Round Crop */}
                  <div style={{ height: 180, position: "relative", overflow: "hidden", background: "#EFF6FF" }}>
                    <img
                      src={p.img}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)"
                      }}
                    />

                    {/* Like / Wishlist Heart Button ala Mockup */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(p.kode);
                      }}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                      }}
                    >
                      <Heart
                        size={16}
                        fill={likedPrograms[p.kode] ? "#EF4444" : "none"}
                        color={likedPrograms[p.kode] ? "#EF4444" : "#475569"}
                      />
                    </button>

                    {/* Bottom Jenjang Pill */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 12,
                        background: isSelected ? "#1D4ED8" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#1D4ED8",
                        padding: "3px 10px",
                        borderRadius: 9999,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        transition: "all 0.25s ease"
                      }}
                    >
                      {p.setara}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#0F172A",
                        marginBottom: 8,
                        lineHeight: 1.25
                      }}
                    >
                      {p.title}
                    </h3>
                    <p
                      style={{
                        color: "#64748B",
                        fontSize: "0.82rem",
                        lineHeight: 1.6,
                        marginBottom: 14,
                        flex: 1
                      }}
                    >
                      {p.desc}
                    </p>

                    {/* Features List Mini (Teks utuh, tidak terpotong) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                      {p.features.slice(0, 3).map((feat) => (
                        <div
                          key={feat}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 7,
                            fontSize: "0.75rem",
                            color: "#334155",
                            lineHeight: 1.45
                          }}
                        >
                          <Check size={13} color="#1D4ED8" strokeWidth={3} className="shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Link Pill */}
                    <Link
                      to="/daftar"
                      className="cute-pill-btn"
                      style={{
                        background: isSelected ? "#1D4ED8" : "#EFF6FF",
                        color: isSelected ? "#FFFFFF" : "#1D4ED8",
                        border: isSelected ? "none" : "1.5px solid #BFDBFE",
                        padding: "8px 16px",
                        fontSize: "0.82rem",
                        width: "100%",
                        justifyContent: "space-between",
                        transition: "all 0.25s ease"
                      }}
                    >
                      <span>Daftar {p.kode === "PLUS" ? "Program" : `Paket ${p.kode}`}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Centered Button: Pelajari Semua Program */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link
              to="/daftar"
              className="cute-pill-btn btn-yellow"
              style={{ padding: "13px 36px", fontSize: "0.95rem" }}
            >
              <span>Pelajari Semua Program Kesetaraan</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION TENTANG LEMBAGA — DISPLAY BROSUR RESMI & PROFIL
          Layout Mengikuti Referensi: Abu-abu Elegan, Kotak-kotak (Grid), Tekstur
          ══════════════════════════════════════════════════════════ */}
      <section
        id="tentang"
        style={{
          background: "#181A1F", // Abu-abu gelap elegan (Charcoal / Graphite Slate yang cocok ala referensi)
          color: "#FFFFFF",
          position: "relative",
          zIndex: 2,
          padding: "85px clamp(16px, 4vw, 48px) 95px",
          overflow: "hidden",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          borderBottom: "none",
          marginBottom: "-4px"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 10 }}>

          {/* Frame Kontainer Utama Berbingkai Border & Header Bar (Persis Mockup Referensi) */}
          <div
            style={{
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 20,
              overflow: "hidden",
              background: "#181A1F",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)"
            }}
          >
            {/* Top Metadata Strip — Persis Format Header di Mockup Referensi */}
            <div
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "16px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                fontSize: "0.78rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "#9CA3AF",
                letterSpacing: "0.08em",
                background: "#141519"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#FACC15", fontWeight: 800 }}>TENTANG LEMBAGA & LEGALITAS RESMI</span>
              </div>
              <div style={{ textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>
                PKBM BINA MANDIRI • SUMEDANG / 2026
              </div>
            </div>

            {/* Main 2-Column Split: Kiri = Framed Brosur Poster, Kanan = Deskripsi & Konten Profil */}
            <div className="tentang-content-grid">
              {/* ── SISI KIRI: DISPLAY FRAME POSTER / BROSUR DENGAN KOTAK-KOTAK (GRID SQUARES) + TEKSTUR ── */}
              <div
                style={{
                  background: "#121417",
                  backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.45) 100%)",
                  backgroundSize: "26px 26px, 26px 26px, 100% 100%",
                  padding: "clamp(46px, 6vw, 64px) clamp(36px, 5.5vw, 48px)",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "clamp(340px, 45vh, 520px)",
                  borderRight: "1px solid rgba(255, 255, 255, 0.12)"
                }}
              >
                {/* Technical Corner Brackets ala Referensi Visual (Diberi Jarak Lega dari Foto) */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    width: 14,
                    height: 14,
                    borderTop: "2px solid rgba(255, 255, 255, 0.35)",
                    borderLeft: "2px solid rgba(255, 255, 255, 0.35)"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 14,
                    height: 14,
                    borderTop: "2px solid rgba(255, 255, 255, 0.35)",
                    borderRight: "2px solid rgba(255, 255, 255, 0.35)"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    width: 14,
                    height: 14,
                    borderBottom: "2px solid rgba(255, 255, 255, 0.35)",
                    borderLeft: "2px solid rgba(255, 255, 255, 0.35)"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    width: 14,
                    height: 14,
                    borderBottom: "2px solid rgba(255, 255, 255, 0.35)",
                    borderRight: "2px solid rgba(255, 255, 255, 0.35)"
                  }}
                />

                {/* Poster Presentation Card */}
                <div
                  style={{
                    position: "relative",
                    maxWidth: 360,
                    width: "100%",
                    cursor: "pointer",
                    transition: "transform 0.3s ease"
                  }}
                  onClick={() => setShowBrosurModal(true)}
                  title="Klik untuk memperbesar brosur"
                >
                  {/* White Framed Poster Card */}
                  <div
                    style={{
                      position: "relative",
                      background: "#FFFFFF",
                      padding: "12px 12px 14px",
                      borderRadius: 12,
                      boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12)"
                    }}
                  >
                    <div style={{ position: "relative", overflow: "hidden", borderRadius: 6 }}>
                      <img
                        src="/images/Foto Pengganti 3.jpeg"
                        alt="Brosur Resmi PKBM Bina Mandiri"
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          aspectRatio: "1080/1350",
                          objectFit: "cover"
                        }}
                      />

                      {/* Subtle Click-to-Zoom Hover Hint */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(15, 23, 42, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          color: "#FFFFFF",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          opacity: 0,
                          transition: "opacity 0.2s ease"
                        }}
                        className="hover:opacity-100"
                      >
                        <Eye size={20} />
                        <span>Klik untuk Perbesar</span>
                      </div>
                    </div>

                    {/* Caption di bawah brosur */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        padding: "0 4px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#475569",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase"
                      }}
                    >
                      <span>BROSUR RESMI LEMBAGA</span>
                      <span style={{ color: "#1D4ED8" }}>TA 2026/2027</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SISI KANAN: DUAL LOGOS, HEADLINE, ACCENTS, DAN KONTEN RESMI DARI GAMBAR ACUAN ── */}
              <div
                style={{
                  padding: "50px clamp(20px, 3.5vw, 44px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  background: "#181A1F"
                }}
              >
                {/* Dual Circular Logos (Kemendikbud & Yayasan YA'ABID'S) */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      padding: 4,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                      border: "2px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                  >
                    <img
                      src="/images/logo new.png"
                      alt="Logo PKBM Bina Mandiri"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      padding: 4,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                      border: "2px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                  >
                    <img
                      src="/images/logo_yayasan.jpg"
                      alt="Logo Yayasan Amal Bina Insani Darulhuda"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                </div>

                {/* Sub-label Berwarna Biru Cerah (Persis Gambar 1) */}
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    color: "#38BDF8", // Cyan / sky blue accent
                    textTransform: "uppercase",
                    marginBottom: 10
                  }}
                >
                  TENTANG LEMBAGA
                </div>

                {/* Main Headline (Persis Gambar 1 & Tipografi Kuat Gambar 2) */}
                <h2
                  style={{
                    fontSize: "clamp(2.3rem, 4.2vw, 3.4rem)",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    lineHeight: 1.12,
                    letterSpacing: "-0.03em",
                    marginBottom: 16
                  }}
                >
                  PKBM Bina Mandiri
                </h2>

                {/* Garis Aksen Kuning Horizontal (Persis di Bawah Judul pada Gambar 1) */}
                <div
                  style={{
                    width: 56,
                    height: 4,
                    background: "#F59E0B", // Amber yellow
                    borderRadius: 2,
                    marginBottom: 24
                  }}
                />

                {/* Text Block Deskripsi Lembaga */}
                <div style={{ marginBottom: 12 }}>
                  <p
                    style={{
                      color: "#E2E8F0",
                      fontSize: "clamp(0.96rem, 1.2vw, 1.05rem)",
                      lineHeight: 1.8,
                      marginBottom: 16
                    }}
                  >
                    <strong style={{ color: "#38BDF8", fontWeight: 800 }}>PKBM Bina Mandiri</strong> adalah lembaga pendidikan nonformal resmi di bawah naungan <strong style={{ color: "#FFFFFF", fontWeight: 700 }}>Yayasan Amal Bina Insani Darulhuda</strong> dan Dinas Pendidikan Kabupaten Sumedang, Jawa Barat.
                  </p>
                  <p
                    style={{
                      color: "#94A3B8",
                      fontSize: "clamp(0.92rem, 1.1vw, 1rem)",
                      lineHeight: 1.8,
                      margin: 0
                    }}
                  >
                    Kami menyelenggarakan Program Kesetaraan Paket A, B, dan C dengan sistem pembelajaran digital yang inklusif — dirancang khusus untuk warga belajar dari semua usia dan latar belakang.
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── MODAL VIEWER BROSUR LENGKAP ── */}
      {showBrosurModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 15, 28, 0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowBrosurModal(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 680,
              width: "100%",
              maxHeight: "92vh",
              background: "#1E2025",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                background: "#141519",
                color: "#FFFFFF"
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Brosur Resmi PKBM Bina Mandiri</h4>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#94A3B8" }}>Tahun Ajaran 2026/2027 • Paket A, B, dan C</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrosurModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#FFFFFF",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable Image */}
            <div style={{ overflowY: "auto", padding: 16, textAlign: "center", background: "#121417" }}>
              <img
                src="/images/Foto Pengganti 3.jpeg"
                alt="Brosur PKBM Bina Mandiri Penuh"
                style={{ maxWidth: "100%", height: "auto", borderRadius: 12, display: "inline-block" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL LIGHTBOX FOTO GALERI UKURAN ASLI PENUH ── */}
      {showGaleriModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 15, 28, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowGaleriModal(false)}
        >
          {/* Header Bar Lightbox */}
          <div
            style={{
              width: "100%",
              maxWidth: 1100,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              color: "#FFFFFF"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{GALERI[activeGaleri].label}</div>
              <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>Foto {activeGaleri + 1} dari {GALERI.length} · Ukuran Asli Penuh</div>
            </div>
            <button
              type="button"
              onClick={() => setShowGaleriModal(false)}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#FFFFFF",
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")}
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Container: Full original aspect ratio, 100% uncropped */}
          <div
            style={{
              position: "relative",
              maxWidth: 1100,
              maxHeight: "82vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={GALERI[activeGaleri].src}
              alt={GALERI[activeGaleri].label}
              style={{
                maxWidth: "100%",
                maxHeight: "82vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: 14
              }}
            />
          </div>
        </div>
      )}

      {/* ── MODAL PEMUTAR VIDEO TUTORIAL (BERSIH, TANPA LAYER HITAM & MOBILE COMPACT) ── */}
      {videoModal && (
        <div
          className="video-modal-overlay"
          onClick={() => setVideoModal(null)}
        >
          <div
            className="video-modal-card"
            style={{
              position: "relative",
              maxWidth: 780,
              width: "100%",
              maxHeight: "94vh",
              background: "#FFFFFF",
              borderRadius: 24,
              overflow: "hidden",
              border: "1.5px solid #E2E8F0",
              boxShadow: "0 20px 50px -10px rgba(15, 23, 42, 0.25), 0 4px 16px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header — Bersih, Terang & Rapi di Mobile */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #F1F5F9",
                background: "#FFFFFF"
              }}
            >
              {/* Baris 1: Tag & Tombol Tutup */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      border: "1px solid #BFDBFE",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 9999,
                      letterSpacing: "0.03em"
                    }}
                  >
                    {videoModal.tag || "PANDUAN RESMI"}
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 700 }}>
                    Durasi: {videoModal.duration || "Singkat"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setVideoModal(null)}
                  aria-label="Tutup video"
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    color: "#475569",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#FEE2E2";
                    e.currentTarget.style.color = "#DC2626";
                    e.currentTarget.style.borderColor = "#FECACA";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#475569";
                    e.currentTarget.style.borderColor = "#E2E8F0";
                  }}
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Baris 2: Judul Video Utuh & Seimbang (Tanpa Potongan Kata Aneh) */}
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(0.98rem, 2vw, 1.22rem)",
                  fontWeight: 900,
                  color: "#0F172A",
                  lineHeight: 1.35,
                  letterSpacing: "-0.01em",
                  textWrap: "balance"
                }}
              >
                {videoModal.title}
              </h3>
            </div>

            {/* Video Player Frame — Responsif & Terang Bebas Kotak Hitam Kosong */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "clamp(220px, 54vw, 440px)",
                background: "#F8FAFC",
                borderTop: "1px solid #F1F5F9",
                borderBottom: "1px solid #F1F5F9"
              }}
            >
              <iframe
                src={videoModal.videoUrl}
                title={videoModal.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Body & Tombol Aksi — Ringkas, Terbaca Jelas & Rapi di Mobile */}
            <div
              style={{
                padding: "14px 18px",
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                overflowY: "auto"
              }}
            >
              {/* Highlight Poin Praktis */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {videoModal.highlights?.map((h) => (
                  <span
                    key={h}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#F1F5F9",
                      color: "#334155",
                      padding: "4px 9px",
                      borderRadius: 8,
                      fontSize: "0.74rem",
                      fontWeight: 700
                    }}
                  >
                    <Check size={12} color="#1D4ED8" strokeWidth={3} />
                    <span>{h}</span>
                  </span>
                ))}
              </div>

              {/* Deskripsi Singkat */}
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: "0.84rem",
                  lineHeight: 1.55,
                  fontWeight: 500
                }}
              >
                {videoModal.desc}
              </p>

              {/* Tombol Aksi (Di Mobile Berdampingan 2 Kolom Rapi) */}
              <div
                className="video-modal-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  paddingTop: 8,
                  borderTop: "1px solid #F1F5F9"
                }}
              >
                {videoModal.externalUrl && (
                  <a
                    href={videoModal.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cute-pill-btn btn-yellow"
                    style={{
                      padding: "9px 18px",
                      fontSize: "0.82rem",
                      boxShadow: "0 3px 10px rgba(234, 179, 8, 0.3)",
                      textDecoration: "none"
                    }}
                  >
                    <span>Buka di Google Drive</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                <Link
                  to={videoModal.actionTo || "/daftar"}
                  onClick={() => setVideoModal(null)}
                  className="cute-pill-btn"
                  style={{
                    padding: "9px 16px",
                    fontSize: "0.82rem",
                    background: "#FFFFFF",
                    color: "#1D4ED8",
                    border: "1.5px solid #BFDBFE",
                    textDecoration: "none"
                  }}
                >
                  <span>{videoModal.actionLabel || "Selengkapnya"}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════
          4. SECTION 3: WAVY BANNER CONTAINER ("PILIH SESUAI KEBUTUHAN")
             (Mirip section pink bergelombang di gambar acuan,
              diadaptasi ke Royal Blue + Kuning + Putih)
          ══════════════════════════════════════════════════════════ */}
      <section
        id="kebutuhan"
        style={{
          marginTop: "-1px",
          background: "linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%)",
          color: "#FFFFFF",
          position: "relative",
          padding: "105px clamp(16px, 4vw, 48px) 90px",
          overflow: "hidden"
        }}
      >
        {/* Top Wave Cutout — Fill #181A1F matches the gray background of section tentang, eliminating any seam */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#181A1F", zIndex: 3, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, width: "100%", lineHeight: 0, zIndex: 1, pointerEvents: "none" }}>
          <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "clamp(30px, 3.5vw, 50px)", display: "block", overflow: "visible" }}>
            <path
              d="M-5,-4 L1445,-4 L1445,30 C1200,60 960,10 720,40 C480,70 240,10 0,35 Z"
              fill="#181A1F"
            />
          </svg>
        </div>

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 10 }}>

          {/* Centered Big White Headline - diberi ruang cukup agar tidak tertutup navbar */}
          <div style={{ textAlign: "center", maxWidth: 760, margin: "16px auto 44px" }}>

            <h2
              style={{
                fontSize: "clamp(2rem, 4.2vw, 3.2rem)",
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#FFFFFF"
              }}
            >
              PILIH PROGRAM SESUAI KEBUTUHAN ANDA
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.95rem", marginTop: 10, lineHeight: 1.6 }}>
              Tidak ada kata terlambat. Setiap orang berhak memiliki ijazah resmi negara untuk membuka kesempatan kerja yang lebih luas.
            </p>
          </div>

          {/* Container Slider (Responsif: Horizontal 100% Utuh di Mobile, 5 Kolom di Desktop) */}
          <div style={{ position: "relative" }}>
            <div
              ref={kebutuhanRef}
              onScroll={handleKebutuhanScroll}
              className="kebutuhan-grid no-scrollbar"
            >
              {KEBUTUHAN_CATEGORIES.map((c, idx) => (
                <div
                  key={c.id}
                  ref={(el) => (kebutuhanCardRefs.current[idx] = el)}
                  onClick={() => handleSelectKebutuhan(idx)}
                  className="boutique-card kebutuhan-card-item"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 10,
                    border: "2.5px solid #FFFFFF",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    color: "#0F172A",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* Photo Thumbnail with Category Badge on Top-Right */}
                  <div style={{ height: 160, borderRadius: 16, overflow: "hidden", position: "relative" }}>
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(15, 23, 42, 0.45) 0%, transparent 60%)"
                      }}
                    />
                    {/* Badge Kategori Transparan Glassmorphism (Kanan Atas) */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.4)",
                        padding: "4px 10px",
                        borderRadius: 9999,
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      {c.tag}
                    </div>
                  </div>

                  {/* Card Text */}
                  <div style={{ padding: "12px 6px 6px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
                      {c.title}
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "#64748B", lineHeight: 1.5, flex: 1, marginBottom: 12 }}>
                      {c.desc}
                    </p>
                    <Link
                      to="/daftar"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        padding: "6px 12px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        textDecoration: "none"
                      }}
                    >
                      <span>{c.target}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Swipe Indicators & Controls for Kebutuhan (Elegan di Bawah Card) */}
          <div
            className="lg:hidden"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 20
            }}
          >
            {/* Tombol Sebelumnya - Kuning Transparan Glassmorphism */}
            <button
              type="button"
              onClick={handlePrevKebutuhan}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(250, 204, 21, 0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1.5px solid rgba(250, 204, 21, 0.65)",
                color: "#FACC15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                transition: "all 0.2s ease",
                flexShrink: 0
              }}
              title="Kategori Sebelumnya"
            >
              <ChevronLeft size={20} strokeWidth={2.6} />
            </button>

            {/* Indicator Dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {KEBUTUHAN_CATEGORIES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectKebutuhan(i)}
                  style={{
                    width: activeKebutuhanIdx === i ? 24 : 8,
                    height: 8,
                    borderRadius: 9999,
                    background: activeKebutuhanIdx === i ? "#FACC15" : "rgba(255, 255, 255, 0.4)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    padding: 0
                  }}
                  title={`Kategori ${i + 1}`}
                />
              ))}
            </div>

            {/* Tombol Selanjutnya - Kuning Transparan Glassmorphism */}
            <button
              type="button"
              onClick={handleNextKebutuhan}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(250, 204, 21, 0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1.5px solid rgba(250, 204, 21, 0.65)",
                color: "#FACC15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                transition: "all 0.2s ease",
                flexShrink: 0
              }}
              title="Kategori Selanjutnya"
            >
              <ChevronRight size={20} strokeWidth={2.6} />
            </button>
          </div>

        </div>

        {/* Bottom Wave Cutout */}
        <div style={{ position: "absolute", bottom: "-1px", left: 0, right: 0, width: "100%", lineHeight: 0, zIndex: 1, pointerEvents: "none" }}>
          <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "clamp(30px, 3.5vw, 50px)", display: "block" }}>
            <path
              d="M0,35 C240,65 480,10 720,40 C960,70 1200,15 1440,30 L1440,60 L0,60 Z"
              fill="#FACC15"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. SECTION 4: INFINITE MARQUEE TICKER RIBBON (Kuning & Hitam)
             (Mirip running ticker "КРЕМ ★ КРЕМ ★ КРЕМ" di mockup)
          ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#FACC15",
          color: "#0F172A",
          padding: "16px 0",
          overflow: "hidden",
          borderTop: "1px solid #EAB308",
          borderBottom: "1px solid #EAB308",
          boxShadow: "0 4px 14px rgba(234, 179, 8, 0.2)"
        }}
      >
        <div className="marquee-track">
          {[1, 2].map((loop) => (
            <div key={loop} style={{ display: "flex", alignItems: "center", gap: 32, paddingRight: 32 }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 10 }}>
                ★ PKBM BINA MANDIRI
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ IJAZAH RESMI NEGARA</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ BEBAS BATASAN USIA</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ WAKTU BELAJAR FLEKSIBEL</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ BINAAN DINAS PENDIDIKAN SUMEDANG</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ LMS DIGITAL 24 JAM</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ SPMB 2026/2027</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>★ HAK ELIGIBILITAS PENUH SETARA FORMAL</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. SECTION 5: 8 FITUR UNGGULAN (GRID 2x4 SEPERTI DI MOCKUP)
             (Mirip "Уникальные вкусы" dengan 8 card berjejer)
          ══════════════════════════════════════════════════════════ */}
      <section
        id="keunggulan"
        style={{
          padding: "80px clamp(16px, 4vw, 48px) 70px",
          background: "#FFFFFF"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          {/* Header Section */}
          <div style={{ maxWidth: 680, marginBottom: 44 }}>
            <h2
              style={{
                fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#0F172A",
                lineHeight: 1.2,
                letterSpacing: "-0.02em"
              }}
            >
              Keunggulan Nyata, Dikembangkan Khusus untuk Kemudahan Anda
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.92rem", lineHeight: 1.6, marginTop: 10 }}>
              Kami memadukan legalitas hukum kementerian dengan fleksibilitas teknologi agar setiap warga belajar bisa lulus tanpa beban.
            </p>
          </div>

          {/* 8 Cards Grid (Rapi di Mobile 1 Kolom, Tablet 2 Kolom, Desktop 4 Kolom) */}
          <div className="keunggulan-cards-grid">
            {KEUNGGULAN_GRID.map((k) => (
              <div
                key={k.title}
                className="boutique-card"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 22,
                  border: "2px solid #E2E8F0",
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Photo Thumbnail */}
                <div style={{ height: "clamp(130px, 22vw, 155px)", position: "relative", overflow: "hidden", background: "#EFF6FF" }}>
                  <img src={k.img} alt={k.title} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* Content */}
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <k.icon size={16} />
                    </div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.25 }}>
                      {k.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", lineHeight: 1.55 }}>
                    {k.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Centered CTA Pill */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              to="/daftar"
              className="cute-pill-btn btn-yellow"
              style={{ padding: "13px 34px", fontSize: "0.94rem" }}
            >
              <span>Konsultasi & Tanya Info Pendaftaran</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. SECTION 6: KENAPA MEMILIH KAMI / SPLIT WAVE LAYOUT
             (Mirip section bawah "Почему выбирают Крем" dengan
              foto/wavy shape di kiri dan 4 poin dengan bintang di kanan)
          ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)",
          padding: "80px clamp(16px, 4vw, 48px)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="legalitas-content-grid">
            {/* Kiri: Big Headline pada Frame Lembut Bergelombang */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  borderRadius: 36,
                  overflow: "hidden",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 20px 45px rgba(29, 78, 216, 0.12)",
                  position: "relative",
                  height: "clamp(260px, 40vh, 440px)",
                  background: "#0F172A"
                }}
              >
                <img
                  src="/images/gedung.jpeg"
                  alt="Gedung PKBM Bina Mandiri"
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(29,78,216,0.3) 100%)"
                  }}
                />

                {/* Overlaid Headline ala Mockup "Почему выбирают Крем" */}
                <div style={{ position: "absolute", bottom: 32, left: 28, right: 28 }}>
                  <h3
                    style={{
                      fontSize: "clamp(2rem, 3.8vw, 2.8rem)",
                      fontWeight: 900,
                      color: "#FFFFFF",
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Kenapa Memilih PKBM Bina Mandiri?
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", marginTop: 10, lineHeight: 1.6 }}>
                    Lembaga pendidikan nonformal berizin resmi dengan rekam jejak meluluskan ribuan alumni sukses ke dunia kerja dan perguruan tinggi.
                  </p>
                </div>
              </div>
            </div>

            {/* Kanan: 4 Poin dengan Ikon Bintang (Mirip bullet bintang di mockup) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                {
                  title: "100% Legalitas & Ijazah Sah Negara",
                  desc: "Dikeluarkan resmi berpayung hukum Kemendikbudristek. Memiliki hak setara untuk melamar pekerjaan formal, CPNS, TNI/Polri, serta mendaftar UTBK-SNBT di Perguruan Tinggi Negeri."
                },
                {
                  title: "Pembelajaran Ramah Waktu & Blended LMS",
                  desc: "Materi pelajaran dan video ringkas dapat diakses fleksibel 24/7. Anda tetap bisa bekerja dan mengurus keluarga tanpa takut tertinggal pelajaran sekolah."
                },
                {
                  title: "Pendampingan Administrasi Sampai Lulus",
                  desc: "Pengurusan data NISN, verifikasi berkas Dapodik, hingga pendaftaran Ujian Kesetaraan dibimbing penuh oleh staf sekretariat profesional kami."
                },
                {
                  title: "Biaya Bersahabat & Bebas Batasan Usia",
                  desc: "Program dirancang inklusif untuk siapa saja tanpa membedakan usia, dengan skema biaya pendidikan nonformal yang sangat terjangkau bagi masyarakat."
                }
              ].map((pt, idx) => (
                <div
                  key={pt.title}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    background: "#FFFFFF",
                    padding: "20px 22px",
                    borderRadius: 20,
                    border: "2px solid #E2E8F0",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: idx % 2 === 0 ? "#FACC15" : "#1D4ED8",
                      color: idx % 2 === 0 ? "#0F172A" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.98rem",
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      letterSpacing: "-0.02em",
                      flexShrink: 0,
                      boxShadow: idx % 2 === 0 ? "0 4px 12px rgba(250, 204, 21, 0.35)" : "0 4px 12px rgba(29, 78, 216, 0.25)"
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                      {pt.title}
                    </h4>
                    <p style={{ fontSize: "0.84rem", color: "#64748B", lineHeight: 1.6 }}>
                      {pt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. SECTION 7: GALERI KEGIATAN WARGA BELAJAR
          ══════════════════════════════════════════════════════════ */}
      <section
        id="galeri"
        style={{
          padding: "80px clamp(16px, 4vw, 48px)",
          background: "#FFFFFF"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <h2
              style={{
                fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#0F172A",
                letterSpacing: "-0.02em"
              }}
            >
              Galeri Kegiatan & Suasana Pembelajaran
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.92rem", marginTop: 8 }}>
              Dokumentasi aktivitas tatap muka, diskusi kelas, pembagian rapot, dan fasilitas di PKBM Bina Mandiri.
            </p>
          </div>

          {/* Main Large Viewer - 100% Utuh Tanpa Terpotong (Mengikuti Ukuran Asli) */}
          <div
            style={{
              borderRadius: 28,
              overflow: "hidden",
              marginBottom: 16,
              height: "clamp(440px, 52vw, 600px)",
              position: "relative",
              border: "1px solid #E2E8F0",
              boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
              background: "#0B0F19",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "zoom-in"
            }}
            onClick={() => setShowGaleriModal(true)}
            title="Klik untuk melihat foto ukuran penuh"
          >
            {/* Ambient Blurred Backdrop (Mengisi ruang kosong dengan pantulan warna foto secara artistik) */}
            <div
              key={`ambient-${GALERI[activeGaleri].src}`}
              style={{
                position: "absolute",
                inset: -24,
                backgroundImage: `url("${GALERI[activeGaleri].src}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                filter: "blur(32px) brightness(0.38) saturate(1.2)",
                transform: "scale(1.15)",
                transition: "background-image 0.4s ease",
                pointerEvents: "none"
              }}
            />

            {/* Subtle Vignette Gradient */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(11,15,25,0.65) 100%)",
                pointerEvents: "none",
                zIndex: 1
              }}
            />

            {/* Gambar Utama: 100% Utuh & Tidak Terpotong (objectFit: contain) */}
            <img
              key={GALERI[activeGaleri].src}
              src={GALERI[activeGaleri].src}
              alt={GALERI[activeGaleri].label}
              loading="lazy"
              decoding="async"
              style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
                transition: "opacity 0.3s ease"
              }}
            />

            {/* Tombol Panah Kiri (Prev) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveGaleri((prev) => (prev - 1 + GALERI.length) % GALERI.length);
              }}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 4,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(29, 78, 216, 0.9)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
              title="Foto Sebelumnya"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Tombol Panah Kanan (Next) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveGaleri((prev) => (prev + 1) % GALERI.length);
              }}
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 4,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(29, 78, 216, 0.9)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
              title="Foto Selanjutnya"
            >
              <ChevronRight size={22} />
            </button>

          </div>

          {/* Caption & Counter Strip di Bawah Foto Utama (100% Utuh & Tidak Menutupi Wajah/Objek Foto) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              padding: "0 6px"
            }}
          >
            <div
              style={{
                color: "#1E293B",
                fontWeight: 800,
                fontSize: "clamp(0.92rem, 1.8vw, 1.05rem)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Sparkles size={16} color="#1D4ED8" />
              <span>{GALERI[activeGaleri].label}</span>
            </div>

            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 9999,
                padding: "4px 12px",
                color: "#1D4ED8",
                fontWeight: 800,
                fontSize: "0.78rem",
                whiteSpace: "nowrap"
              }}
            >
              Foto {activeGaleri + 1} dari {GALERI.length}
            </div>
          </div>

          {/* Thumbnails Row */}
          <div className="galeri-thumbnails-grid">
            {GALERI.map((g, i) => (
              <div
                key={g.label}
                onClick={() => setActiveGaleri(i)}
                style={{
                  cursor: "pointer",
                  borderRadius: 14,
                  overflow: "hidden",
                  height: 80,
                  border: `2.5px solid ${i === activeGaleri ? "#1D4ED8" : "#E2E8F0"}`,
                  boxShadow: i === activeGaleri ? "0 4px 12px rgba(29, 78, 216, 0.3)" : "none",
                  transition: "all 0.2s ease",
                  opacity: i === activeGaleri ? 1 : 0.65
                }}
              >
                <img
                  src={g.src}
                  alt={g.label}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: g.position || "center"
                  }}
                />
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. SECTION 8: PERTANYAAN UMUM (FAQ ACCORDION)
          ══════════════════════════════════════════════════════════ */}
      <section
        id="faq"
        style={{
          padding: "80px clamp(16px, 4vw, 48px)",
          background: "#F8FAFC"
        }}
      >
        <div style={{ maxWidth: 840, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2
              style={{
                fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#0F172A",
                letterSpacing: "-0.02em"
              }}
            >
              Pertanyaan yang Sering Diajukan
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.92rem", marginTop: 8 }}>
              Kumpulan informasi penting seputar legalitas ijazah, waktu belajar, dan mekanisme pendaftaran.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f, i) => (
              <div
                key={f.q}
                style={{
                  borderRadius: 18,
                  border: openFaq === i ? "2px solid #1D4ED8" : "1.5px solid #E2E8F0",
                  background: "#FFFFFF",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                  boxShadow: openFaq === i ? "0 8px 20px rgba(29, 78, 216, 0.08)" : "none"
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    padding: "18px 22px",
                    cursor: "pointer",
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    color: openFaq === i ? "#1D4ED8" : "#0F172A",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16
                  }}
                >
                  <span>{f.q}</span>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: openFaq === i ? "#1D4ED8" : "#EFF6FF",
                      color: openFaq === i ? "#FFFFFF" : "#1D4ED8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {openFaq === i ? <Minus size={15} /> : <Plus size={15} />}
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    style={{
                      padding: "0 22px 20px",
                      color: "#475569",
                      lineHeight: 1.75,
                      fontSize: "0.9rem",
                      borderTop: "1px solid #F1F5F9",
                      paddingTop: 14
                    }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10. SECTION 9: KONTAK & FORM PESAN
          ══════════════════════════════════════════════════════════ */}
      <section
        id="kontak"
        style={{
          padding: "80px clamp(16px, 4vw, 48px)",
          background: "#FFFFFF"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          <div className="kontak-content-grid">
            {/* Info Kantor & Layanan */}
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 3.5vw, 2.6rem)",
                  fontWeight: 900,
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                  marginBottom: 14
                }}
              >
                Ada Pertanyaan? Kami Siap Membantu Anda
              </h2>
              <p style={{ color: "#64748B", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: 28 }}>
                Tim pendaftaran dan bimbingan akademik PKBM Bina Mandiri siap melayani konsultasi jenjang pendidikan, pendataan Dapodik, maupun pendaftaran siswa baru.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: MapPin, label: "Alamat Lembaga", val: "Dusun Sukahurip RT 03/RW 03, Legok Kaler, Kec. Paseh, Kab. Sumedang" },
                  { icon: ShieldCheck, label: "Naungan Yayasan", val: "Yayasan Amal Bina Insani Darulhuda" },
                  { icon: InstagramIcon, label: "Instagram Resmi", val: "@bina_mandiri_pkbm", href: "https://www.instagram.com/bina_mandiri_pkbm/" },
                  { icon: Mail, label: "Email Resmi", val: "pkbmbinamandiripaseh@gmail.com" },
                  { icon: Clock, label: "Jam Pelayanan", val: "Senin – Jumat, 08.00 – 16.00 WIB" },
                ].map((item) => {
                  const Wrapper = item.href ? "a" : "div";
                  const wrapperProps = item.href ? { href: item.href, target: "_blank", rel: "noreferrer", style: { textDecoration: "none" } } : {};
                  return (
                    <Wrapper
                      key={item.label}
                      {...wrapperProps}
                      style={{
                        background: "#F8FAFC",
                        borderRadius: 18,
                        padding: "14px 18px",
                        border: "1.5px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => { if (item.href) e.currentTarget.style.borderColor = "#FACC15"; }}
                      onMouseOut={(e) => { if (item.href) e.currentTarget.style.borderColor = "#E2E8F0"; }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: item.href ? "#FEF9C3" : "#EFF6FF",
                          color: item.href ? "#854D0E" : "#1D4ED8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <item.icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: item.href ? "#1D4ED8" : "#0F172A", marginTop: 2 }}>
                          {item.val}
                        </div>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>
            </div>

            {/* Form Pesan Cepat */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 28,
                padding: "36px 32px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 16px 40px rgba(29, 78, 216, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)"
              }}
            >
              <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0F172A", marginBottom: 6 }}>
                Kirim Pesan / Konsultasi
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: 22 }}>
                Isi form berikut, tim kami akan segera menghubungi via WhatsApp atau Email.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); alert("Terima kasih! Pesan konsultasi Anda telah terkirim."); }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 14,
                      border: "2px solid #E2E8F0",
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Nomor WhatsApp Aktif"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 14,
                      border: "2px solid #E2E8F0",
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  />
                  <select
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 14,
                      border: "2px solid #E2E8F0",
                      outline: "none",
                      fontSize: "0.9rem",
                      color: "#334155"
                    }}
                  >
                    <option value="">Pilih Program yang Diminati</option>
                    <option>Kesetaraan Paket A (Setara SD)</option>
                    <option>Kesetaraan Paket B (Setara SMP)</option>
                    <option>Kesetaraan Paket C (Setara SMA)</option>
                    <option>Klub Minat Bakat & Bahasa</option>
                    <option>Pertanyaan Umum / Info Pendaftaran</option>
                  </select>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan pertanyaan Anda..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 14,
                      border: "2px solid #E2E8F0",
                      outline: "none",
                      fontSize: "0.9rem",
                      resize: "vertical"
                    }}
                  />
                  <button
                    type="submit"
                    className="cute-pill-btn btn-yellow"
                    style={{ padding: "13px", width: "100%", fontSize: "0.95rem" }}
                  >
                    <span>Kirim Pesan Sekarang</span>
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── PETA LOKASI GOOGLE MAPS: FULL WIDTH TEPI-KE-TEPI TEPAT DI ATAS FOOTER TANPA GAP/SPASI & TANPA TEKS ── */}
      <div
        style={{
          width: "100%",
          lineHeight: 0,
          margin: 0,
          padding: 0,
          display: "block",
          position: "relative"
        }}
      >
        <iframe
          title="Peta Lokasi PKBM Bina Mandiri Sumedang"
          src="https://maps.google.com/maps?q=PKBM%20Bina%20Mandiri%20Legok%20Kaler%20Paseh%20Sumedang&t=&z=16&ie=UTF8&iwloc=B&output=embed"
          width="100%"
          height="430"
          style={{
            border: 0,
            display: "block",
            width: "100%",
            margin: 0,
            padding: 0
          }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          11. FOOTER (Hitam, Biru, Kuning, Putih)
          ══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "#000000",
          color: "rgba(255, 255, 255, 0.8)",
          padding: "60px clamp(16px, 4vw, 48px) 30px",
          borderTop: "4px solid #FACC15"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          <div className="footer-content-grid">
            {/* Kolom 1: Profil Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <img
                  src="/images/logo new.png"
                  alt="Logo PKBM"
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "contain",
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{ fontWeight: 900, color: "#FFFFFF", fontSize: "1.05rem" }}>
                    PKBM <span style={{ color: "#FACC15" }}>Bina Mandiri</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#93C5FD" }}>Kab. Sumedang · Jawa Barat</div>
                </div>
              </div>
              <p style={{ fontSize: "0.84rem", lineHeight: 1.7, color: "rgba(255, 255, 255, 0.7)" }}>
                Penyelenggara Resmi Pendidikan Kesetaraan Paket A, B, dan C. Terakreditasi dan dibina oleh Dinas Pendidikan Kabupaten Sumedang di bawah naungan Yayasan Amal Bina Insani Darulhuda.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <a
                  href="https://www.instagram.com/bina_mandiri_pkbm/"
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram Resmi PKBM Bina Mandiri"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#FACC15",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#FACC15"; e.currentTarget.style.color = "#000000"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#FACC15"; }}
                >
                  <InstagramIcon size={14} />
                  <span>@bina_mandiri_pkbm</span>
                </a>
                <a
                  href="https://wa.me/6282318383605"
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp Resmi PKBM Bina Mandiri"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#93C5FD",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.color = "#FFFFFF"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#93C5FD"; }}
                >
                  <Send size={14} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Kolom 2: Program */}
            <div>
              <h4 style={{ color: "#FACC15", fontWeight: 800, fontSize: "0.92rem", marginBottom: 14 }}>
                Program Pendidikan
              </h4>
              {["Kesetaraan Paket A (SD)", "Kesetaraan Paket B (SMP)", "Kesetaraan Paket C (SMA)", "Klub Minat Bakat", "Pelatihan Bahasa Asing"].map((it) => (
                <div key={it} style={{ marginBottom: 9, fontSize: "0.84rem" }}>
                  <a href="#program" style={{ color: "rgba(255, 255, 255, 0.75)", textDecoration: "none" }}>{it}</a>
                </div>
              ))}
            </div>

            {/* Kolom 3: Navigasi */}
            <div>
              <h4 style={{ color: "#FACC15", fontWeight: 800, fontSize: "0.92rem", marginBottom: 14 }}>
                Navigasi Cepat
              </h4>
              {[
                ["Tentang Lembaga", "#tentang"],
                ["Program Pilihan", "#kebutuhan"],
                ["8 Keunggulan", "#keunggulan"],
                ["Galeri Kegiatan", "#galeri"],
                ["Tanya Jawab (FAQ)", "#faq"],
                ["Kontak & Alamat", "#kontak"]
              ].map(([it, href]) => (
                <div key={it} style={{ marginBottom: 9, fontSize: "0.84rem" }}>
                  <a href={href} style={{ color: "rgba(255, 255, 255, 0.75)", textDecoration: "none" }}>{it}</a>
                </div>
              ))}
            </div>

            {/* Kolom 4: Akses Layanan */}
            <div>
              <h4 style={{ color: "#FACC15", fontWeight: 800, fontSize: "0.92rem", marginBottom: 14 }}>
                Akses Layanan
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  to="/login"
                  style={{
                    color: "#93C5FD",
                    fontWeight: 700,
                    textDecoration: "none",
                    fontSize: "0.86rem"
                  }}
                >
                  → Masuk Portal Siswa & Tutor
                </Link>
                <Link
                  to="/daftar"
                  style={{
                    color: "#FACC15",
                    fontWeight: 800,
                    textDecoration: "none",
                    fontSize: "0.86rem"
                  }}
                >
                  → Pendaftaran Warga Baru (SPMB)
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              paddingTop: 22,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: "0.78rem",
              color: "rgba(255, 255, 255, 0.55)"
            }}
          >
            <span>© 2026 PKBM Bina Mandiri. Seluruh hak cipta dilindungi.</span>
            <span>Di bawah naungan Dinas Pendidikan Kabupaten Sumedang</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
