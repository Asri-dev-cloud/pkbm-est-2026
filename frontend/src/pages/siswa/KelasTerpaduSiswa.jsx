// ============================================================
// src/pages/siswa/KelasTerpaduSiswa.jsx — Kelas Terpadu LMS-Style
// ============================================================
// Halaman utama Level 2: Kelas terpadu yang menyatukan Materi,
// Modul & Buku, Tugas Mingguan, dan Aktivitas Sesi Pertemuan.
// Desain: Retro Notebook & Chamfered Folder Tabs Sheet (Reference Image 2)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import apiClient, { PertemuanAPI, LmsAPI, AbsensiAPI, SiswaAPI, UjianAPI, AkademikAPI, ModulBukuAPI, toAssetUrl } from '../../services/api.js';
import { downloadTemplateExcelSoalPG, importSoalPGFromFile } from '../../utils/soalImporter.js';
import './KelasTerpaduSiswa.css';

// Fallback data awal katalog buku & modul ajar
const DEFAULT_MODUL_BUKU = [
  {
    id: 1,
    judul: 'Buku Teks Kurikulum Merdeka - Kemendikdasmen RI',
    deskripsi: 'Akses resmi katalog buku teks utama dan pendamping Kurikulum Merdeka untuk SD, SMP, SMA dari Kementerian Pendidikan Dasar dan Menengah RI.',
    kategori: 'Semua Jenjang',
    mapel: 'Kurikulum Nasional',
    tipe: 'buku_kemendikdasmen',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/',
    penulis: 'Kemendikdasmen RI',
    semester: 'Semua Semester',
    file_type: 'LINK',
  },
  {
    id: 2,
    judul: 'Modul Kewirausahaan & Literasi Keuangan Warga Belajar Paket C',
    deskripsi: 'Modul ajar pemberdayaan ekonomi praktis: manajemen keuangan mikro, pemanfaatan digital payment, dan perintisan usaha mandiri untuk warga belajar Paket C.',
    kategori: 'Paket C',
    mapel: 'Kewirausahaan & Vokasi',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tim Pengajar Vokasi PKBM',
    semester: 'Semester Ganjil',
    file_type: 'PDF',
  },
  {
    id: 3,
    judul: 'Modul Bahasa Indonesia: Berpikir Kritis & Menulis Efektif - Paket B',
    deskripsi: 'Modul tematik literasi bahasa untuk kelas 7, 8, dan 9 setara SMP. Mencakup telaah bacaan, penyusunan ringkasan artikel, dan tata kalimat aplikatif.',
    kategori: 'Paket B',
    mapel: 'Bahasa Indonesia',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tutor Bahasa PKBM',
    semester: 'Semua Semester',
    file_type: 'PDF',
  },
  {
    id: 4,
    judul: 'Modul IPAS Terpadu: Mengenal Lingkungan Sekitar & Sains Dasar - Paket A',
    deskripsi: 'Panduan pembelajaran tematik IPAS untuk warga belajar Paket A (setara SD). Belajar sains aplikatif berbasis eksperimen sederhana dan pelestarian alam.',
    kategori: 'Paket A',
    mapel: 'IPAS',
    tipe: 'modul_upload',
    url_eksternal: null,
    penulis: 'Tutor Paket A PKBM',
    semester: 'Semester Genap',
    file_type: 'PDF',
  },
  {
    id: 5,
    judul: 'Buku Literasi & Bacaan Bergizi Warga Belajar - SIBI Kemendikdasmen',
    deskripsi: 'Koleksi bacaan nonteks berjenjang untuk meningkatkan minat membaca dan wawasan umum warga belajar pendidikan kesetaraan.',
    kategori: 'Semua Jenjang',
    mapel: 'Literasi Umum',
    tipe: 'buku_kemendikdasmen',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/katalog/buku-non-teks',
    penulis: 'Pusat Perbukuan Kemendikdasmen',
    semester: 'Semua Semester',
    file_type: 'LINK',
  }
];

// Helper membaca data modul lokal tersimpan
const getLocalCustomModul = () => {
  try {
    const raw = localStorage.getItem('pkbm_custom_modul');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

// Helper simpan ke lokal
const saveLocalCustomModul = (items) => {
  try {
    localStorage.setItem('pkbm_custom_modul', JSON.stringify(items));
  } catch {}
};

// Helper parser metadata tugas (Multi-tipe: upload, pilihan_ganda, essay)
export const parseTaskDescription = (rawDesc) => {
  if (!rawDesc) return { cleanDesc: '', meta: { tipe: 'upload', soal_pg: [], soal_essay: [] } };
  const match = rawDesc.match(/<!-- PKBM_TASK_META:(.*?) -->/);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const cleanDesc = rawDesc.replace(/<!-- PKBM_TASK_META:.*? -->/, '').trim();
      return { cleanDesc, meta };
    } catch {
      return { cleanDesc: rawDesc, meta: { tipe: 'upload', soal_pg: [], soal_essay: [] } };
    }
  }
  return { cleanDesc: rawDesc, meta: { tipe: 'upload', soal_pg: [], soal_essay: [] } };
};

// Helper ekstraksi jawaban PG siswa dari submission / catatan siswa
export const extractStudentPGAnswers = (tugas, submission, fallbackMap = {}) => {
  // 1. Direct object di submission.jawaban_pg
  if (submission?.jawaban_pg && typeof submission.jawaban_pg === 'object') {
    return submission.jawaban_pg;
  }
  if (typeof submission?.jawaban_pg === 'string') {
    try {
      const parsed = JSON.parse(submission.jawaban_pg);
      if (typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
    } catch {}
  }

  // 2. Dari fallback in-memory state
  if (tugas?.id && fallbackMap[tugas.id] && Object.keys(fallbackMap[tugas.id]).length > 0) {
    return fallbackMap[tugas.id];
  }

  // 3. Parse dari catatan_siswa (misal: "[Jawaban Pilihan Ganda]:\n{"1":"a"}" atau rincian teks)
  const cat = submission?.catatan_siswa || '';
  if (cat) {
    // Cari blok format JSON { ... }
    const jsonMatch = cat.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      } catch {}
    }

    // Cari pola "Nomor 1: [Pilihan: A]" atau "Nomor 1: Jawaban Anda [A]"
    const answers = {};
    const lines = cat.split('\n');
    lines.forEach(line => {
      const m = line.match(/Nomor\s+(\d+)[:\s]+.*?[\[\(](?:Pilihan:|Jawaban Anda:)?\s*([A-Da-d])[\]\)]/i);
      if (m) {
        answers[m[1]] = m[2].toLowerCase();
      }
    });
    if (Object.keys(answers).length > 0) return answers;
  }

  return {};
};

// ══ CUTE CUSTOM SELECT DROPDOWN COMPONENT ═════════════════════
// Menggantikan <select> native browser agar dropdown tampil cute,
// beranimasi halus, dan berpadu selaras dengan tema pastel tiap room.
function CuteSelect({ id, value, onChange, options, icon, labelHint, themeColor = 'pink', style }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  return (
    <div className={`cute-select-wrapper theme-${themeColor}`} ref={dropdownRef} style={style}>
      <button
        id={id}
        type="button"
        className={`cute-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="cute-select-trigger-content">
          {icon && <i className={`cute-select-main-icon ${icon}`}></i>}
          <span className="cute-select-value-text">
            {selectedOption ? selectedOption.label : 'Pilih opsi...'}
          </span>
          {selectedOption?.badge && (
            <span className="cute-select-mini-badge">{selectedOption.badge}</span>
          )}
        </div>
        <div className="cute-select-arrow-pill">
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
      </button>

      {isOpen && (
        <div className="cute-select-dropdown-menu" role="listbox">
          <div className="cute-select-menu-header">
            <span className="cute-select-menu-title">
              {labelHint || 'Pilih Opsi'}
            </span>
            <span className="cute-select-menu-count">{options.length} pilihan</span>
          </div>
          <div className="cute-select-options-list">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`cute-select-option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="option-label-group">
                    {opt.icon && <i className={`option-icon ${opt.icon}`}></i>}
                    <span className="option-text">{opt.label}</span>
                  </div>
                  <div className="option-extra-group">
                    {opt.badge && (
                      <span className="cute-option-badge">{opt.badge}</span>
                    )}
                    {isSelected && (
                      <i className="bi bi-check-circle-fill option-check-icon"></i>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KelasTerpaduSiswa() {
  const { mapelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  // ── Sheet Tabs State (Reference Image 2) ───────────────────
  // 'pertemuan' | 'materi' | 'modul' | 'tugas'
  const [mainTab, setMainTab] = useState('pertemuan');

  // Data Kelas
  const [mapel, setMapel] = useState(null);
  const [rombelDetail, setRombelDetail] = useState(null);
  const [pertemuans, setPertemuans] = useState([]);
  const [activePertemuanId, setActivePertemuanId] = useState(null);

  // Detail Pertemuan Terpadu
  const [pertemuanDetail, setPertemuanDetail] = useState(null);

  // Full Koleksi Materi, Modul, dan Tugas
  const [allMateri, setAllMateri] = useState([]);
  const [allTugas, setAllTugas] = useState([]);
  const [modulBukuList, setModulBukuList] = useState(() => {
    const local = getLocalCustomModul();
    const merged = [...local, ...DEFAULT_MODUL_BUKU];
    return Array.from(new Map(merged.map(item => [item.id, item])).values());
  });
  const [markingMateriId, setMarkingMateriId] = useState(null);

  // Filter & Search states
  const [materiSearch, setMateriSearch] = useState('');
  const [modulSearch, setModulSearch] = useState('');
  const [modulCategory, setModulCategory] = useState('Semua');
  const [tugasFilter, setTugasFilter] = useState('semua'); // 'semua' | 'belum' | 'terkumpul' | 'dinilai'

  // Ringkasan Kehadiran & Tugas
  const [rekapKehadiran, setRekapKehadiran] = useState({
    total_pertemuan: 0,
    hadir: 0,
    alpa: 0,
    izin: 0,
    sakit: 0
  });
  const [tugasStats, setTugasStats] = useState({ submitted: 0, total: 0 });

  // Storing input tugas
  const [selectedFile, setSelectedFile] = useState(null);
  const [catatanTugas, setCatatanTugas] = useState('');
  const [submittingTugasId, setSubmittingTugasId] = useState(null);
  const [jawabanPGMap, setJawabanPGMap] = useState({}); // { [tugasId]: { [soalId]: 'a'|'b'|'c'|'d' } }
  const [jawabanEssayMap, setJawabanEssayMap] = useState({}); // { [tugasId]: { [soalIdx]: 'teks jawaban' } }
  const [selectedFileMap, setSelectedFileMap] = useState({}); // { [tugasId]: File }
  const [catatanTugasMap, setCatatanTugasMap] = useState({}); // { [tugasId]: 'catatan' }

  // Forum Diskusi
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Timer Absensi
  const [sisaWaktuAbsen, setSisaWaktuAbsen] = useState(null);
  const timerRef = useRef(null);

  // Ujian Online
  const [ujianList, setUjianList] = useState([]);
  const [loadingUjian, setLoadingUjian] = useState(false);

  // States for Tutor Operations
  const [showAddPertemuanModal, setShowAddPertemuanModal] = useState(false);
  const [newPertemuanKe, setNewPertemuanKe] = useState('');
  const [newPertemuanJudul, setNewPertemuanJudul] = useState('');
  const [newPertemuanRencanaMateri, setNewPertemuanRencanaMateri] = useState('');
  const [newPertemuanMetode, setNewPertemuanMetode] = useState('hybrid');
  const [newPertemuanTanggal, setNewPertemuanTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [newPertemuanPengumuman, setNewPertemuanPengumuman] = useState('');
  const [submittingPertemuan, setSubmittingPertemuan] = useState(false);

  // State for Editing Meeting Announcement
  const [editingPengumuman, setEditingPengumuman] = useState(false);
  const [tempPengumuman, setTempPengumuman] = useState('');
  const [submittingPengumuman, setSubmittingPengumuman] = useState(false);

  // State for uploading Material
  const [showMateriForm, setShowMateriForm] = useState(false);
  const [materiJudul, setMateriJudul] = useState('');
  const [materiDeskripsi, setMateriDeskripsi] = useState('');
  const [materiTipe, setMateriTipe] = useState('dokumen');
  const [materiUrl, setMateriUrl] = useState('');
  const [materiFile, setMateriFile] = useState(null);
  const [submittingMateri, setSubmittingMateri] = useState(false);

  // State for adding Task
  const [showTugasForm, setShowTugasForm] = useState(false);
  const [tugasJudul, setTugasJudul] = useState('');
  const [tugasDeskripsi, setTugasDeskripsi] = useState('');
  const [tugasDeadline, setTugasDeadline] = useState('');
  const [tugasNilaiMaks, setTugasNilaiMaks] = useState(100);
  const [tipeTugas, setTipeTugas] = useState('upload'); // 'upload' | 'pilihan_ganda' | 'essay'
  const [soalPG, setSoalPG] = useState([
    { id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }
  ]);
  const [soalEssay, setSoalEssay] = useState([
    { id: 1, pertanyaan: '' }
  ]);
  const [submittingTugas, setSubmittingTugas] = useState(false);

  // Draf Anti-Hilang Soal PG & Tugas
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState(null);

  // Sinkronisasi Realtime Tugas (Tanpa Refresh Browser)
  const [refreshingTugas, setRefreshingTugas] = useState(false);
  const [lastTugasSyncTime, setLastTugasSyncTime] = useState(new Date());

  // Import Soal dari File Excel / Word
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModeTab, setImportModeTab] = useState('upload'); // 'upload' | 'excel_guide' | 'word_guide'
  const [importingFile, setImportingFile] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [importErrorMsg, setImportErrorMsg] = useState('');

  // State Tutor / Admin Melihat & Menilai Pengumpulan Tugas
  const [detailTugasModal, setDetailTugasModal] = useState(null);
  const [loadingDetailTugas, setLoadingDetailTugas] = useState(false);
  const [gradingInputMap, setGradingInputMap] = useState({});
  const [savingGradeId, setSavingGradeId] = useState(null);

  // State Siswa: Modal Lembar Pengerjaan Soal (Page Baru / Dedicated View) & Review Jawaban
  const [kerjakanTugasModal, setKerjakanTugasModal] = useState(null);
  const [reviewTugasModal, setReviewTugasModal] = useState(null);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [showQuizAttachment, setShowQuizAttachment] = useState(false);

  // State for opening Absensi timer
  const [showAbsensiForm, setShowAbsensiForm] = useState(false);
  const [absensiTimer, setAbsensiTimer] = useState(15);
  const [submittingAbsensi, setSubmittingAbsensi] = useState(false);

  // RPS States
  const [rpsPath, setRpsPath] = useState(null);
  const [loadingRps, setLoadingRps] = useState(false);
  const [uploadingRps, setUploadingRps] = useState(false);
  const [rpsFile, setRpsFile] = useState(null);
  const [rpsMessage, setRpsMessage] = useState('');

  // ── Modul & Buku States (Admin / Tutor) ────────────────────
  const [showModulModal, setShowModulModal] = useState(false);
  const [editingModulId, setEditingModulId] = useState(null);
  const [modulFormData, setModulFormData] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'Semua Jenjang',
    mapel: '',
    tipe: 'buku_kemendikdasmen',
    url_eksternal: 'https://buku.kemendikdasmen.go.id/',
    penulis: user?.nama_lengkap || user?.nama || 'PKBM Bina Mandiri',
    semester: 'Semua Semester',
    tahun_ajaran: '2025/2026',
    is_published: 1,
  });
  const [selectedModulFile, setSelectedModulFile] = useState(null);
  const [existingModulFileName, setExistingModulFileName] = useState('');
  const [submittingModul, setSubmittingModul] = useState(false);
  const [deleteModulTarget, setDeleteModulTarget] = useState(null);
  const [deletingModul, setDeletingModul] = useState(false);
  const modulFileInputRef = useRef(null);

  const fetchRps = async (rombelId) => {
    if (!rombelId || !mapelId) return;
    try {
      setLoadingRps(true);
      if (typeof AkademikAPI?.getRps === 'function') {
        const res = await AkademikAPI.getRps(rombelId, mapelId);
        if (res.data && res.data.success) {
          setRpsPath(res.data.data.rps_file_path);
        }
      }
    } catch {
      setRpsPath(null);
    } finally {
      setLoadingRps(false);
    }
  };

  const handleUploadRps = async (e) => {
    e.preventDefault();
    if (!rpsFile) return;

    let rombelId = searchParams.get('rombel_id');
    if (!rombelId && user.role === 'warga_belajar') {
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        rombelId = profilRes.data.data?.rombel_id;
      } catch (err) {
        console.error(err);
      }
    }

    if (!rombelId) {
      setRpsMessage('Data Rombel tidak ditemukan.');
      return;
    }

    try {
      setUploadingRps(true);
      setRpsMessage('');
      const formData = new FormData();
      formData.append('rombel_id', rombelId);
      formData.append('mapel_id', mapelId);
      formData.append('rps', rpsFile);

      const res = await AkademikAPI.uploadRps(formData);
      if (res.data && res.data.success) {
        setRpsPath(res.data.data.rps_file_path);
        setRpsMessage('RPS berhasil diunggah!');
        setRpsFile(null);
        setTimeout(() => setRpsMessage(''), 3000);
      }
    } catch (err) {
      setRpsMessage(err.response?.data?.message || 'Gagal mengunggah RPS.');
    } finally {
      setUploadingRps(false);
    }
  };

  const syncRekapKehadiran = async () => {
    try {
      const rekapRes = await AbsensiAPI.getRekapSaya();
      const rekapData = rekapRes.data?.data;

      if (rekapData) {
        setRekapKehadiran({
          total_pertemuan: rekapData.total_pertemuan || 0,
          hadir: rekapData.hadir || 0,
          alpa: rekapData.alpa || 0,
          izin: rekapData.izin || 0,
          sakit: rekapData.sakit || 0
        });
      }
    } catch {
      console.warn('Gagal memuat rekap kehadiran');
    }
  };

  const fetchUjian = async () => {
    let rombelId = searchParams.get('rombel_id');
    if (!rombelId && user.role === 'warga_belajar') {
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        rombelId = profilRes.data.data?.rombel_id;
      } catch (e) {
        console.warn('Gagal memuat profil untuk ujian', e);
      }
    }
    if (!rombelId) return;
    try {
      setLoadingUjian(true);
      const res = await UjianAPI.getPaketByRombel(rombelId);
      if (res.data && res.data.success) {
        const filtered = (res.data.data || []).filter(u => !u.mapel_id || String(u.mapel_id) === String(mapelId));
        setUjianList(filtered);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoadingUjian(false);
    }
  };

  // ── Helper Local Deleted Tugas Registry (Anti 404 transisi) ─────────
  const getDeletedTugasIds = () => {
    try {
      return JSON.parse(localStorage.getItem('pkbm_deleted_tugas_ids') || '[]');
    } catch {
      return [];
    }
  };
  const addDeletedTugasId = (id) => {
    try {
      const current = getDeletedTugasIds();
      if (!current.includes(id)) {
        localStorage.setItem('pkbm_deleted_tugas_ids', JSON.stringify([...current, id]));
      }
    } catch {}
  };

  // ── Helper Local Student Submission Registry (Anti 404 transisi VPS) ─
  const getStudentLocalSubmission = (tugasId) => {
    try {
      const key = `pkbm_sub_${user?.id || 'wb'}_${tugasId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const saveStudentLocalSubmission = (tugasId, data) => {
    try {
      const key = `pkbm_sub_${user?.id || 'wb'}_${tugasId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  // ── Auto-Save Draft Quiz & Tugas (PG, Essay, Catatan) agar tahan refresh / reload / koneksi drop ──
  const getQuizDraftKey = (tugasId, type) => `pkbm_draft_${user?.id || 'wb'}_${tugasId}_${type}`;

  const loadQuizDraft = (tugasId, type) => {
    try {
      const raw = localStorage.getItem(getQuizDraftKey(tugasId, type));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveQuizDraft = (tugasId, type, data) => {
    try {
      localStorage.setItem(getQuizDraftKey(tugasId, type), JSON.stringify(data));
    } catch (e) {
      console.warn('[saveQuizDraft] Gagal simpan draft:', e.message);
    }
  };

  const clearQuizDraft = (tugasId) => {
    try {
      localStorage.removeItem(getQuizDraftKey(tugasId, 'pg'));
      localStorage.removeItem(getQuizDraftKey(tugasId, 'essay'));
      localStorage.removeItem(getQuizDraftKey(tugasId, 'catatan'));
    } catch {}
  };

  // Helper untuk membuka modal pengerjaan soal dengan pemulihan draft otomatis
  const handleOpenKerjakanTugas = (tugas) => {
    if (!tugas) return;
    setActiveQuizIndex(0);
    setShowQuizAttachment(false);

    // Pulihkan draft PG dari penyimpanan lokal jika siswa sebelumnya reload / keluar
    const draftPG = loadQuizDraft(tugas.id, 'pg');
    if (draftPG && typeof draftPG === 'object' && Object.keys(draftPG).length > 0) {
      setJawabanPGMap(prev => ({
        ...prev,
        [tugas.id]: { ...(prev[tugas.id] || {}), ...draftPG }
      }));
    }

    // Pulihkan draft Essay dari penyimpanan lokal jika tersedia
    const draftEssay = loadQuizDraft(tugas.id, 'essay');
    if (draftEssay && typeof draftEssay === 'object' && Object.keys(draftEssay).length > 0) {
      setJawabanEssayMap(prev => ({
        ...prev,
        [tugas.id]: { ...(prev[tugas.id] || {}), ...draftEssay }
      }));
    }

    // Pulihkan draft Catatan jika tersedia
    const draftCatatan = loadQuizDraft(tugas.id, 'catatan');
    if (draftCatatan) {
      setCatatanTugasMap(prev => ({ ...prev, [tugas.id]: draftCatatan }));
      setCatatanTugas(draftCatatan);
    }

    setKerjakanTugasModal(tugas);
  };

  // ── Helper Reusable Fetcher Tugas LMS (Realtime 0-delay) ────
  const fetchTugasList = async (targetRombelId = null, targetMapelId = null, showSpinner = false) => {
    let rId = targetRombelId || searchParams.get('rombel_id') || rombelDetail?.id || user?.rombel_id;
    let mId = targetMapelId || mapelId;

    if (!rId && user.role === 'warga_belajar') {
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        rId = profilRes.data.data?.rombel_id;
      } catch {}
    }

    if (!rId) {
      rId = 1;
    }

    if (showSpinner) setRefreshingTugas(true);
    try {
      const tugRes = await LmsAPI.getTugasByRombel(rId, { mapel_id: mId });
      const rawData = tugRes.data.data || [];
      const deletedIds = getDeletedTugasIds();
      const tugData = rawData
        .filter(t => !deletedIds.includes(t.id))
        .map(t => {
          let sub = t.pengumpulan_saya;
          const localSub = getStudentLocalSubmission(t.id);
          if (!sub) {
            sub = localSub;
          } else if (localSub) {
            if ((sub.nilai === null || sub.nilai === undefined || sub.status !== 'dinilai') && (localSub.nilai !== null && localSub.nilai !== undefined)) {
              sub = { ...sub, nilai: localSub.nilai, status: localSub.status || 'dinilai', catatan_siswa: localSub.catatan_siswa || sub.catatan_siswa };
            }
          }

          // Auto-evaluasi nilai untuk PG jika belum dinilai
          if (sub) {
            const { meta } = parseTaskDescription(t.deskripsi);
            if (meta.tipe === 'pilihan_ganda' && meta.soal_pg && meta.soal_pg.length > 0) {
              const answers = extractStudentPGAnswers(t, sub, jawabanPGMap);
              if (Object.keys(answers).length > 0) {
                let benar = 0;
                meta.soal_pg.forEach((s, idx) => {
                  const qId = s.id !== undefined && s.id !== null ? s.id : (idx + 1);
                  const rawUser = answers[qId] || answers[String(qId)] || answers[idx + 1] || '';
                  const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
                  const keyAns = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
                  if (userAns && userAns === keyAns) benar++;
                });
                const autoScore = Math.round((benar / meta.soal_pg.length) * (t.nilai_maks || 100));
                const finalScore = (sub.nilai !== null && sub.nilai !== undefined && sub.nilai !== '') ? sub.nilai : autoScore;
                sub = {
                  ...sub,
                  nilai: finalScore,
                  status: 'dinilai',
                  jawaban_pg: answers
                };
                saveStudentLocalSubmission(t.id, sub);
              }
            }
          }

          return { ...t, pengumpulan_saya: sub };
        });
      setAllTugas(tugData);
      setLastTugasSyncTime(new Date());

      if (user.role === 'warga_belajar') {
        setTugasStats({
          submitted: tugData.filter(t => !!t.pengumpulan_saya).length,
          total: tugData.length
        });
      }
      return tugData;
    } catch (err) {
      console.warn('[fetchTugasList] Gagal memuat tugas:', err?.message);
      return [];
    } finally {
      if (showSpinner) {
        setTimeout(() => setRefreshingTugas(false), 300);
      }
    }
  };

  // ── Draf Anti-Hilang Soal PG & Tugas (localStorage) ──────────
  const currentRombelId = searchParams.get('rombel_id') || rombelDetail?.id || user?.rombel_id || 'all';
  const draftStorageKey = `pkbm_draft_tugas_r${currentRombelId}_m${mapelId || 'all'}`;

  // 1. Pulihkan draft otomatis saat komponen dimuat
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && (data.tugasJudul || (data.soalPG && data.soalPG.length > 0 && data.soalPG.some(s => s.pertanyaan?.trim())))) {
          if (data.tugasJudul) setTugasJudul(data.tugasJudul);
          if (data.tugasDeskripsi) setTugasDeskripsi(data.tugasDeskripsi);
          if (data.tugasDeadline) setTugasDeadline(data.tugasDeadline);
          if (data.tugasNilaiMaks) setTugasNilaiMaks(data.tugasNilaiMaks);
          if (data.tipeTugas) setTipeTugas(data.tipeTugas);
          if (Array.isArray(data.soalPG) && data.soalPG.length > 0) setSoalPG(data.soalPG);
          if (Array.isArray(data.soalEssay) && data.soalEssay.length > 0) setSoalEssay(data.soalEssay);
          setHasRestoredDraft(true);
          setLastDraftSaved(data.savedAt ? new Date(data.savedAt) : new Date());
        }
      }
    } catch (err) {
      console.warn('[Draft] Failed to restore draft:', err);
    }
  }, [draftStorageKey]);

  // 2. Simpan draft otomatis saat form aktif atau terisi (Anti-Hilang)
  useEffect(() => {
    const hasContent = tugasJudul.trim() || tugasDeskripsi.trim() || soalPG.some(s => s.pertanyaan?.trim() || s.opsi_a?.trim());
    if (!hasContent) return;

    const timeout = setTimeout(() => {
      try {
        const now = new Date();
        const draftPayload = {
          tugasJudul,
          tugasDeskripsi,
          tugasDeadline,
          tugasNilaiMaks,
          tipeTugas,
          soalPG,
          soalEssay,
          savedAt: now.toISOString()
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
        setLastDraftSaved(now);
      } catch (err) {
        console.warn('[Draft] Gagal menyimpan draf:', err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [tugasJudul, tugasDeskripsi, tugasDeadline, tugasNilaiMaks, tipeTugas, soalPG, soalEssay, draftStorageKey]);

  // 3. Reset draft manual
  const handleClearDraft = () => {
    if (window.confirm('Hapus draf otomatis tersimpan dan mulai formulir dari awal?')) {
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {}
      setTugasJudul('');
      setTugasDeskripsi('');
      setTugasDeadline('');
      setTugasNilaiMaks(100);
      setTipeTugas('upload');
      setSoalPG([{ id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }]);
      setSoalEssay([{ id: 1, pertanyaan: '' }]);
      setHasRestoredDraft(false);
      setLastDraftSaved(null);
    }
  };

  // 4. Sinkronisasi realtime tugas saat membuka Room 4 & per 12 detik
  useEffect(() => {
    if (mainTab === 'tugas') {
      fetchTugasList();
      const interval = setInterval(() => {
        fetchTugasList();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [mainTab, mapelId, searchParams, rombelDetail?.id]);

  // 5. Cross-tab & broadcast sync event
  useEffect(() => {
    const handleTugasEvent = () => {
      fetchTugasList();
    };
    window.addEventListener('pkbm_tugas_updated', handleTugasEvent);
    return () => {
      window.removeEventListener('pkbm_tugas_updated', handleTugasEvent);
    };
  }, [mapelId, rombelDetail?.id]);

  // ── 1. Fetch Daftar Pertemuan, Materi, Modul & Tugas ───────
  useEffect(() => {
    const fetchKelasData = async () => {
      try {
        setLoading(true);
        setError('');

        let rombelId = searchParams.get('rombel_id');

        if (!rombelId && user.role === 'warga_belajar') {
          try {
            const profilRes = await SiswaAPI.getProfilSaya();
            const profil = profilRes.data.data;
            rombelId = profil?.rombel_id;
          } catch {}
        }

        if (!rombelId) {
          rombelId = user?.rombel_id || 1;
        }

        // Jalankan semua query data secara simultan/paralel dengan Promise.allSettled (Ultra-Fast Concurrent Loading)
        const [
          rResResult,
          mapelResResult,
          pertResResult,
          matResResult,
          modResResult
        ] = await Promise.allSettled([
          SiswaAPI.getRombelOptions(),
          SiswaAPI.getMapelOptions({ rombel_id: rombelId }),
          PertemuanAPI.getAll(rombelId, mapelId),
          LmsAPI.getMateriByRombel(rombelId, { mapel_id: mapelId }),
          user.role !== 'warga_belajar'
            ? ModulBukuAPI.getAllAdmin({ rombel_id: rombelId, mapel_id: mapelId })
            : ModulBukuAPI.getPublished({ rombel_id: rombelId, mapel_id: mapelId }),
          fetchTugasList(rombelId, mapelId),
          fetchRps(rombelId),
          user.role === 'warga_belajar' ? syncRekapKehadiran() : Promise.resolve()
        ]);

        // 1. Info Rombel
        if (rResResult.status === 'fulfilled') {
          const foundR = (rResResult.value.data?.data || []).find(r => String(r.id) === String(rombelId));
          if (foundR) {
            setRombelDetail(foundR);
          } else {
            const paramRombel = searchParams.get('nama_rombel') || user.nama_rombel;
            if (paramRombel) setRombelDetail({ id: rombelId, nama_rombel: paramRombel, nama: paramRombel });
          }
        } else {
          const paramRombel = searchParams.get('nama_rombel') || user.nama_rombel;
          if (paramRombel) setRombelDetail({ id: rombelId, nama_rombel: paramRombel, nama: paramRombel });
        }

        // 2. Info Mapel
        if (mapelResResult.status === 'fulfilled') {
          const currentMapel = mapelResResult.value.data?.data?.find(m => String(m.id) === String(mapelId));
          setMapel(currentMapel || { nama: 'Kelas Belajar', kode: 'LMS' });
        } else {
          setMapel({ nama: 'Kelas Belajar', kode: 'LMS' });
        }

        // 3. Daftar Pertemuan
        if (pertResResult.status === 'fulfilled') {
          const listPertemuan = pertResResult.value.data?.data || [];
          setPertemuans(listPertemuan);
          if (listPertemuan.length > 0) {
            setActivePertemuanId(listPertemuan[0].id);
          }
        }

        // 4. Semua Materi Belajar
        if (matResResult.status === 'fulfilled') {
          setAllMateri(matResResult.value.data?.data || []);
        } else {
          setAllMateri([]);
        }

        // 5. Modul & Buku
        if (modResResult.status === 'fulfilled' && modResResult.value.data?.success && Array.isArray(modResResult.value.data.data) && modResResult.value.data.data.length > 0) {
          setModulBukuList(modResResult.value.data.data);
        } else {
          const localCustom = getLocalCustomModul();
          const merged = [...localCustom, ...DEFAULT_MODUL_BUKU];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          setModulBukuList(unique);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat kelas belajar.');
      } finally {
        setLoading(false);
      }
    };

    fetchKelasData();
  }, [mapelId, searchParams]);

  // Pastikan sesi pertemuan pertama otomatis aktif jika ada
  useEffect(() => {
    if (pertemuans.length > 0 && !activePertemuanId) {
      setActivePertemuanId(pertemuans[0].id);
    }
  }, [pertemuans, activePertemuanId]);

  // ── 2. Fetch Detail Pertemuan Terintegrasi ─────────────────
  useEffect(() => {
    if (!activePertemuanId) return;

    const fetchPertemuanDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await PertemuanAPI.getDetail(activePertemuanId);
        setPertemuanDetail(res.data.data);
        setTempPengumuman(res.data.data.pertemuan?.pengumuman || '');

        // Atur timer countdown absensi jika aktif
        const absensi = res.data.data.absensi;
        if (absensi && absensi.status_sesi === 'aktif' && absensi.sisa_timer_detik > 0) {
          setSisaWaktuAbsen(Math.round(absensi.sisa_timer_detik));
        } else {
          setSisaWaktuAbsen(null);
        }
      } catch (err) {
        console.error('[fetchPertemuanDetail] Error:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchPertemuanDetail();
    fetchUjian();
  }, [activePertemuanId]);

  // ── 3. Countdown Timer Absensi Mandiri ─────────────────────
  useEffect(() => {
    if (sisaWaktuAbsen === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSisaWaktuAbsen(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sisaWaktuAbsen]);

  // ── Action: Check-in Absensi Mandiri ────────────────────────
  const handleCheckIn = async (sesiId) => {
    try {
      await AbsensiAPI.checkIn(sesiId);
      alert('Selamat! Check-in presensi Anda berhasil tercatat.');
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
      await syncRekapKehadiran();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal melakukan check-in absensi.');
    }
  };

  // ── Action: Tandai Materi Selesai Dibaca ────────────────────
  const handleTandaiSelesai = async (materiId) => {
    setMarkingMateriId(materiId);
    try {
      await LmsAPI.tandaiMateriSelesai(materiId);
      setAllMateri(prev => prev.map(m => m.id === materiId ? { ...m, sudah_selesai: true } : m));
      if (pertemuanDetail?.materi) {
        setPertemuanDetail(prev => ({
          ...prev,
          materi: prev.materi.map(m => m.id === materiId ? { ...m, sudah_selesai: true } : m)
        }));
      }
    } catch {
      // ignore
    } finally {
      setMarkingMateriId(null);
    }
  };

  // ── Tutor Action: Create Sesi Pertemuan ──────────────────────
  const handleCreatePertemuan = async (e) => {
    e.preventDefault();
    if (!newPertemuanKe || !newPertemuanJudul || !newPertemuanTanggal) {
      alert('Field wajib: Pertemuan Ke, Judul Sesi, dan Tanggal Pelaksanaan.');
      return;
    }
    let rombelId = searchParams.get('rombel_id');
    if (!rombelId) {
      alert('Rombel ID tidak ditemukan.');
      return;
    }
    setSubmittingPertemuan(true);
    try {
      await PertemuanAPI.create({
        rombel_id: parseInt(rombelId),
        mapel_id: parseInt(mapelId),
        pertemuan_ke: parseInt(newPertemuanKe),
        judul: newPertemuanJudul,
        rencana_materi: newPertemuanRencanaMateri,
        metode_belajar: newPertemuanMetode,
        tanggal_pelaksanaan: newPertemuanTanggal,
        pengumuman: newPertemuanPengumuman
      });

      alert('Sesi pertemuan berhasil dibuat!');
      setShowAddPertemuanModal(false);
      
      setNewPertemuanKe('');
      setNewPertemuanJudul('');
      setNewPertemuanRencanaMateri('');
      setNewPertemuanMetode('hybrid');
      setNewPertemuanTanggal(new Date().toISOString().split('T')[0]);
      setNewPertemuanPengumuman('');

      const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
      const listPertemuan = pertRes.data.data || [];
      setPertemuans(listPertemuan);
      
      if (listPertemuan.length > 0) {
        const newlyCreated = listPertemuan.find(p => String(p.pertemuan_ke) === String(newPertemuanKe));
        if (newlyCreated) {
          setActivePertemuanId(newlyCreated.id);
        } else {
          setActivePertemuanId(listPertemuan[listPertemuan.length - 1].id);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat sesi pertemuan.');
    } finally {
      setSubmittingPertemuan(false);
    }
  };

  // ── Tutor Action: Toggle Publish Sesi Pertemuan ──────────────
  const handleTogglePublishPertemuan = async () => {
    if (!pertemuanDetail?.pertemuan) return;
    const currentStatus = pertemuanDetail.pertemuan.is_published;
    try {
      await PertemuanAPI.togglePublish(activePertemuanId, !currentStatus);
      alert(`Pertemuan berhasil ${!currentStatus ? 'dipublikasikan' : 'disembunyikan'}.`);
      
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);

      let rombelId = searchParams.get('rombel_id');
      if (rombelId) {
        const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
        setPertemuans(pertRes.data.data || []);
      }
    } catch {
      alert('Gagal mengubah status publikasi pertemuan.');
    }
  };

  // ── Tutor Action: Save Pengumuman Sesi ───────────────────────
  const handleSavePengumuman = async () => {
    if (!pertemuanDetail?.pertemuan) return;
    setSubmittingPengumuman(true);
    try {
      const p = pertemuanDetail.pertemuan;
      await PertemuanAPI.update(activePertemuanId, {
        judul: p.judul,
        rencana_materi: p.rencana_materi,
        metode_belajar: p.metode_belajar,
        tanggal_pelaksanaan: p.tanggal_pelaksanaan ? p.tanggal_pelaksanaan.split('T')[0] : new Date().toISOString().split('T')[0],
        pertemuan_ke: p.pertemuan_ke,
        pengumuman: tempPengumuman
      });

      alert('Pengumuman sesi berhasil diperbarui!');
      setEditingPengumuman(false);

      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
    } catch {
      alert('Gagal memperbarui pengumuman.');
    } finally {
      setSubmittingPengumuman(false);
    }
  };

  // ── Tutor Action: Create Materi Pembelajaran ────────────────
  const handleCreateMateri = async (e) => {
    e.preventDefault();
    if (!materiJudul) {
      alert('Judul materi wajib diisi.');
      return;
    }
    if (materiTipe === 'dokumen' && !materiFile) {
      alert('File dokumen wajib diunggah.');
      return;
    }
    if (materiTipe !== 'dokumen' && !materiUrl) {
      alert('URL materi wajib diisi.');
      return;
    }

    let rombelId = searchParams.get('rombel_id');
    if (!rombelId) {
      alert('Rombel ID tidak ditemukan.');
      return;
    }

    setSubmittingMateri(true);
    try {
      const formData = new FormData();
      formData.append('rombel_id', rombelId);
      formData.append('mapel_id', mapelId);
      if (activePertemuanId) formData.append('pertemuan_id', activePertemuanId);
      formData.append('judul', materiJudul);
      formData.append('deskripsi', materiDeskripsi);
      formData.append('tipe', materiTipe);
      
      if (materiTipe === 'dokumen') {
        formData.append('file', materiFile);
      } else {
        formData.append('url', materiUrl);
      }

      await LmsAPI.createMateri(formData);
      alert('Materi berhasil diunggah!');
      setShowMateriForm(false);

      setMateriJudul('');
      setMateriDeskripsi('');
      setMateriTipe('dokumen');
      setMateriUrl('');
      setMateriFile(null);

      // Refresh list materi
      const matRes = await LmsAPI.getMateriByRombel(rombelId, { mapel_id: mapelId });
      setAllMateri(matRes.data.data || []);

      if (activePertemuanId) {
        const res = await PertemuanAPI.getDetail(activePertemuanId);
        setPertemuanDetail(res.data.data);
      }
    } catch {
      alert('Gagal mengunggah materi.');
    } finally {
      setSubmittingMateri(false);
    }
  };

  // ── Helper Soal Builder: Pilihan Ganda & Essay ──────────────
  const handleAddSoalPG = () => {
    setSoalPG(prev => [
      ...prev,
      { id: prev.length + 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }
    ]);
  };

  const handleDuplicateSoalPG = (idx) => {
    setSoalPG(prev => {
      const target = prev[idx];
      if (!target) return prev;
      const copy = { ...target };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next.map((item, i) => ({ ...item, id: i + 1 }));
    });
  };

  const handleRemoveSoalPG = (idx) => {
    if (soalPG.length <= 1) return;
    setSoalPG(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, id: i + 1 })));
  };

  const handleUpdateSoalPG = (idx, field, val) => {
    setSoalPG(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleAddSoalEssay = () => {
    setSoalEssay(prev => [
      ...prev,
      { id: prev.length + 1, pertanyaan: '' }
    ]);
  };

  const handleRemoveSoalEssay = (idx) => {
    if (soalEssay.length <= 1) return;
    setSoalEssay(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSoalEssay = (idx, val) => {
    setSoalEssay(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], pertanyaan: val };
      return next;
    });
  };

  // ── Helper Import Soal File (Excel / Word / Teks) ────────────
  const handleProcessImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    setImportErrorMsg('');
    try {
      const parsed = await importSoalPGFromFile(file);
      if (!parsed || parsed.length === 0) {
        throw new Error('Tidak ditemukan butir soal valid dalam file. Pastikan format file sesuai panduan template.');
      }
      setImportPreviewData(parsed);
    } catch (err) {
      setImportErrorMsg(err.message || 'Gagal membaca berkas.');
    } finally {
      setImportingFile(false);
    }
  };

  const handleApplyImportedQuestions = (replaceMode = false) => {
    if (!importPreviewData || importPreviewData.length === 0) return;

    if (replaceMode) {
      setSoalPG(importPreviewData);
    } else {
      setSoalPG(prev => {
        const existingNonEmpty = prev.filter(s => s.pertanyaan.trim());
        const startId = existingNonEmpty.length;
        const adjusted = importPreviewData.map((s, idx) => ({
          ...s,
          id: startId + idx + 1
        }));
        return [...existingNonEmpty, ...adjusted];
      });
    }

    setTipeTugas('pilihan_ganda');
    setShowImportModal(false);
    const count = importPreviewData.length;
    setImportPreviewData([]);
    alert(`Berhasil menambahkan ${count} butir soal pilihan ganda! Data otomatis tersimpan di draf.`);
  };

  // ── Tutor Action: Create Tugas Pembelajaran ─────────────────
  const handleCreateTugas = async (e) => {
    e.preventDefault();
    if (!tugasJudul.trim() || !tugasDeadline) {
      alert('Judul dan batas waktu (deadline) tugas wajib diisi.');
      return;
    }

    if (tipeTugas === 'pilihan_ganda') {
      const validPG = soalPG.filter(s => s.pertanyaan.trim() && s.opsi_a.trim() && s.opsi_b.trim());
      if (validPG.length === 0) {
        alert('Harap isi minimal 1 butir soal Pilihan Ganda lengkap dengan pertanyaan dan opsi pilihan (A & B).');
        return;
      }
    }

    if (tipeTugas === 'essay') {
      const validEssay = soalEssay.filter(s => s.pertanyaan.trim());
      if (validEssay.length === 0 && !tugasDeskripsi.trim()) {
        alert('Harap masukkan minimal 1 butir pertanyaan essay atau petunjuk pengerjaan.');
        return;
      }
    }

    let rombelId = searchParams.get('rombel_id') || rombelDetail?.id || user?.rombel_id;
    if (!rombelId) {
      alert('Rombel ID tidak ditemukan.');
      return;
    }

    setSubmittingTugas(true);
    try {
      const defaultDesc = tipeTugas === 'pilihan_ganda'
        ? 'Pilihlah salah satu jawaban yang paling tepat pada butir-butir soal pilihan ganda di bawah ini.'
        : tipeTugas === 'essay'
          ? 'Jawablah pertanyaan essay berikut dengan runtut, jelas, dan lengkap.'
          : 'Selesaikan tugas mandiri ini dan unggah berkas lembar jawaban (Foto JPG/PNG, PDF, atau Dokumen).';

      await LmsAPI.createTugas({
        rombel_id: parseInt(rombelId),
        mapel_id: parseInt(mapelId),
        pertemuan_id: activePertemuanId ? parseInt(activePertemuanId) : null,
        judul: tugasJudul.trim(),
        deskripsi: tugasDeskripsi.trim() || defaultDesc,
        deadline: tugasDeadline,
        nilai_maks: parseInt(tugasNilaiMaks) || 100,
        tipe_tugas: tipeTugas,
        soal_pg: tipeTugas === 'pilihan_ganda' ? soalPG : [],
        soal_essay: tipeTugas === 'essay' ? soalEssay : []
      });

      alert('Tugas pembelajaran berhasil diterbitkan!');
      setShowTugasForm(false);

      // Bersihkan draf otomatis karena tugas sudah berhasil terbit
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {}
      setHasRestoredDraft(false);
      setLastDraftSaved(null);

      setTugasJudul('');
      setTugasDeskripsi('');
      setTugasDeadline('');
      setTugasNilaiMaks(100);
      setTipeTugas('upload');
      setSoalPG([{ id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }]);
      setSoalEssay([{ id: 1, pertanyaan: '' }]);

      // Refresh list tugas seketika (0-delay realtime)
      await fetchTugasList(rombelId, mapelId, true);
      window.dispatchEvent(new CustomEvent('pkbm_tugas_updated', { detail: { rombelId, mapelId } }));

      if (activePertemuanId) {
        const res = await PertemuanAPI.getDetail(activePertemuanId);
        setPertemuanDetail(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat tugas.');
    } finally {
      setSubmittingTugas(false);
    }
  };

  // ── Tutor / Admin Action: Hapus Tugas Pembelajaran ──────────
  const handleDeleteTugas = async (tugasId, judul) => {
    if (!tugasId) return;
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus tugas "${judul || 'ini'}"?\n\nPerhatian: Tugas akan dihapus dari daftar pembelajaran dan tidak akan muncul di sisi siswa maupun tutor.`
    );
    if (!isConfirmed) return;

    // Snapshot state untuk rollback jika backend gagal
    const prevTugas = [...allTugas];

    // Optimistic UI: hapus dari state & simpan di local blacklist
    addDeletedTugasId(tugasId);
    setAllTugas(prev => prev.filter(t => t.id !== tugasId));
    window.dispatchEvent(new CustomEvent('pkbm_tugas_updated'));

    // Kirim permintaan DELETE ke backend
    try {
      await LmsAPI.deleteTugas(tugasId);

      // Bersihkan juga cache pengumpulan lokal & drafts terkait tugas ini
      try {
        localStorage.removeItem(`pkbm_sub_${user?.id || 'wb'}_${tugasId}`);
        clearQuizDraft(tugasId);
      } catch {}

      // Refresh list allTugas dari backend untuk konfirmasi status sinkronisasi
      await fetchTugasList(null, null, false);
      window.dispatchEvent(new CustomEvent('pkbm_tugas_updated'));

      alert(`Tugas "${judul || ''}" berhasil dihapus secara permanen.`);
    } catch (err) {
      console.error('[handleDeleteTugas] Error:', err);
      // Revert optimistic UI jika penghapusan di server gagal
      setAllTugas(prevTugas);
      const currentDeleted = getDeletedTugasIds().filter(id => id !== tugasId);
      localStorage.setItem('pkbm_deleted_tugas_ids', JSON.stringify(currentDeleted));
      alert(err.response?.data?.message || 'Gagal menghapus tugas dari server. Silakan coba kembali.');
    }
  };

  // ── Tutor Action: Create Sesi Absensi Mandiri ──────────────
  const handleCreateAbsensiSesi = async (e) => {
    e.preventDefault();
    let rombelId = searchParams.get('rombel_id');
    if (!rombelId) {
      alert('Rombel ID tidak ditemukan.');
      return;
    }

    setSubmittingAbsensi(true);
    try {
      await apiClient.post('/absensi/sesi', {
        rombel_id: parseInt(rombelId),
        mapel_id: parseInt(mapelId),
        tanggal: new Date().toISOString().split('T')[0],
        mode: 'mandiri',
        durasi_timer: parseInt(absensiTimer) * 60,
        pertemuan_id: parseInt(activePertemuanId)
      });

      alert('Sesi presensi mandiri warga belajar berhasil diaktifkan!');
      setShowAbsensiForm(false);

      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
      
      const absensi = res.data.data.absensi;
      if (absensi && absensi.status_sesi === 'aktif' && absensi.sisa_timer_detik > 0) {
        setSisaWaktuAbsen(Math.round(absensi.sisa_timer_detik));
      }
    } catch {
      alert('Gagal mengaktifkan presensi.');
    } finally {
      setSubmittingAbsensi(false);
    }
  };

  // ── Action: Kumpulkan Tugas (Multi-format: Upload Foto/PDF, PG, Essay) ──
  const handleKumpulTugas = async (tugasId) => {
    const targetTugas = allTugas.find(t => String(t.id) === String(tugasId)) || kerjakanTugasModal;
    const { meta } = parseTaskDescription(targetTugas?.deskripsi);

    const file = selectedFileMap[tugasId] || selectedFile;
    const catatan = catatanTugasMap[tugasId] || catatanTugas || '';
    const pgAnswers = jawabanPGMap[tugasId] || {};
    const essayAnswers = jawabanEssayMap[tugasId] || {};

    if (meta.tipe === 'pilihan_ganda') {
      const countAnswered = Object.keys(pgAnswers).length;
      if (countAnswered === 0 && !file) {
        alert('Harap pilih minimal 1 jawaban soal pilihan ganda sebelum mengumpulkan.');
        return;
      }
    } else if (meta.tipe === 'essay') {
      const countAnswered = Object.values(essayAnswers).some(val => val && val.trim());
      if (!countAnswered && !catatan.trim() && !file) {
        alert('Harap ketik jawaban essay Anda atau unggah berkas lembar jawaban.');
        return;
      }
    } else {
      if (!file) {
        alert('Silakan pilih berkas tugas (Foto JPG/PNG, Dokumen PDF/Word) terlebih dahulu.');
        return;
      }
    }

    if (!window.confirm('Apakah Anda yakin ingin mengumpulkan tugas ini sekarang?')) {
      return;
    }

    // Hitung evaluasi & nilai otomatis jika soal Pilihan Ganda
    let calculatedNilai = null;
    let finalCatatanText = catatan;

    if (meta.tipe === 'pilihan_ganda' && meta.soal_pg && meta.soal_pg.length > 0) {
      let benar = 0;
      const totalSoal = meta.soal_pg.length;
      const breakdown = [];

      meta.soal_pg.forEach((s, idx) => {
        const qId = s.id !== undefined && s.id !== null ? s.id : (idx + 1);
        const rawUser = pgAnswers[qId] || pgAnswers[String(qId)] || pgAnswers[idx + 1] || '';
        const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
        const keyAns = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
        const isBenar = userAns === keyAns;
        if (isBenar) benar++;
        const userLabel = userAns ? userAns.toUpperCase() : 'Tidak Dijawab';
        const keyLabel = keyAns.toUpperCase();
        breakdown.push(`Nomor ${idx + 1}: [Pilihan: ${userLabel}] - ${isBenar ? 'BENAR' : `SALAH (Kunci: ${keyLabel})`}`);
      });

      const nilaiMaks = targetTugas?.nilai_maks || 100;
      calculatedNilai = Math.round((benar / totalSoal) * nilaiMaks);
      finalCatatanText = [
        catatan.trim(),
        `[HASIL EVALUASI PILIHAN GANDA OTOMATIS]`,
        `Nilai: ${calculatedNilai} / ${nilaiMaks} (${benar} dari ${totalSoal} Soal Benar)`,
        `Detail Jawaban:\n${breakdown.join('\n')}`
      ].filter(Boolean).join('\n\n');
    }

    if (submittingTugasId) return;
    setSubmittingTugasId(tugasId);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('catatan_siswa', finalCatatanText);

      if (meta.tipe === 'pilihan_ganda' && Object.keys(pgAnswers).length > 0) {
        formData.append('jawaban_pg', JSON.stringify(pgAnswers));
        if (calculatedNilai !== null) {
          formData.append('nilai_auto', calculatedNilai);
        }
      }
      if (meta.tipe === 'essay' && Object.keys(essayAnswers).length > 0) {
        const textArr = Object.entries(essayAnswers).map(([idx, ans]) => `Soal #${Number(idx) + 1}:\n${ans}`);
        formData.append('jawaban_essay', textArr.join('\n\n'));
      }

      // Concurrency & network resilience: Coba kirim ke server hingga 2 kali retry jika koneksi lambat/timeout
      let resKumpul = null;
      let lastErr = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[handleKumpulTugas] Mencoba kembali mengirim tugas (percobaan ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, 1200 * attempt));
          }
          resKumpul = await LmsAPI.kumpulkanTugas(tugasId, formData);
          if (resKumpul?.data?.success) {
            break;
          }
        } catch (apiErr) {
          lastErr = apiErr;
          console.warn(`[handleKumpulTugas] Percobaan ${attempt + 1} gagal:`, apiErr?.response?.data || apiErr.message);
        }
      }

      // Validasi server response: Jika gagal kirim, JANGAN rekayasa keberhasilan!
      // Pertahankan jawaban siswa di memori dan LocalStorage agar tidak hilang.
      if (!resKumpul || !resKumpul.data || !resKumpul.data.success) {
        const errMsg = lastErr?.response?.data?.message || lastErr?.message || 'Server sedang sibuk atau jaringan internet tidak stabil.';
        alert(`Perhatian: Gagal mengirimkan tugas ke server.\n\nDetail kendala: ${errMsg}\n\nJANGAN KHAWATIR: Seluruh jawaban yang telah Anda kerjakan TETAP TERSIMPAN AMAN di perangkat Anda. Silakan periksa jaringan internet Anda dan klik tombol 'Kumpulkan Tugas' kembali.`);
        setSubmittingTugasId(null);
        return;
      }

      // Pengiriman terverifikasi sukses di server!
      // 1. Bersihkan draft lokal karena sudah tercatat permanen di database server
      clearQuizDraft(tugasId);

      const serverData = resKumpul.data.data;
      const confirmedNilai = serverData?.nilai !== undefined && serverData?.nilai !== null ? serverData.nilai : calculatedNilai;
      const confirmedStatus = serverData?.status || (confirmedNilai !== null ? 'dinilai' : 'terkumpul');

      const newPengumpulan = {
        ...serverData,
        tugas_id: tugasId,
        status: confirmedStatus,
        nilai: confirmedNilai,
        submitted_at: serverData?.submitted_at || new Date().toISOString(),
        catatan_siswa: serverData?.catatan_siswa || finalCatatanText,
        nama_file: serverData?.nama_file || (file ? file.name : (meta.tipe === 'pilihan_ganda' ? 'Jawaban Pilihan Ganda Online' : 'Jawaban Online'))
      };

      // Simpan di local storage siswa agar tidak hilang saat reload / transisi VPS
      saveStudentLocalSubmission(tugasId, newPengumpulan);

      // Update state instan di memori (0-delay)
      setAllTugas(prev => prev.map(t => {
        if (String(t.id) === String(tugasId)) {
          return {
            ...t,
            pengumpulan_saya: newPengumpulan
          };
        }
        return t;
      }));

      setTugasStats(prev => ({
        ...prev,
        submitted: prev.submitted + 1
      }));

      // Tutup modal pengerjaan soal
      setKerjakanTugasModal(null);

      // Buka langsung modal review hasil agar siswa langsung melihat skor & rinciannya
      const updatedTugasWithSubmission = {
        ...targetTugas,
        pengumpulan_saya: newPengumpulan
      };
      setReviewTugasModal(updatedTugasWithSubmission);

      // Pesan sukses interaktif
      if (meta.tipe === 'pilihan_ganda' && confirmedNilai !== null) {
        alert(`Alhamdulillah, tugas Pilihan Ganda Anda berhasil dikumpulkan!\n\nSkor Anda: ${confirmedNilai} / ${targetTugas?.nilai_maks || 100} Poin.`);
      } else {
        alert('Alhamdulillah, tugas pembelajaran Anda berhasil dikumpulkan!');
      }

      // Background sync server
      let rombelId = searchParams.get('rombel_id') || rombelDetail?.id || user?.rombel_id;
      if (rombelId) {
        fetchTugasList(rombelId, mapelId);
      }
      window.dispatchEvent(new CustomEvent('pkbm_tugas_updated', { detail: { rombelId, mapelId } }));

      if (activePertemuanId) {
        try {
          const res = await PertemuanAPI.getDetail(activePertemuanId);
          setPertemuanDetail(res.data.data);
        } catch {}
      }

      // Reset input lokal untuk tugas ini
      setSelectedFileMap(prev => { const n = { ...prev }; delete n[tugasId]; return n; });
      setCatatanTugasMap(prev => { const n = { ...prev }; delete n[tugasId]; return n; });
      setJawabanPGMap(prev => { const n = { ...prev }; delete n[tugasId]; return n; });
      setJawabanEssayMap(prev => { const n = { ...prev }; delete n[tugasId]; return n; });
      setSelectedFile(null);
      setCatatanTugas('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengumpulkan tugas.');
    } finally {
      setSubmittingTugasId(null);
    }
  };

  // ── Tutor Action: Buka & Periksa Lembar Pengumpulan Siswa ──
  const handleOpenDetailTugas = async (tugas) => {
    setLoadingDetailTugas(true);
    setDetailTugasModal(tugas);
    try {
      const res = await LmsAPI.getTugasById(tugas.id);
      const fullTugas = res.data.data;

      // Pastikan pengumpulan berupa array lengkap
      let pengumpulanList = Array.isArray(fullTugas?.pengumpulan) ? [...fullTugas.pengumpulan] : [];

      // Fallback: sertakan submission lokal jika ada dan belum terdaftar di respon server
      const localSub = getStudentLocalSubmission(tugas.id);
      if (localSub && !pengumpulanList.some(p => String(p.id) === String(localSub.id) || String(p.warga_belajar_id) === String(localSub.warga_belajar_id))) {
        pengumpulanList.push({
          id: localSub.id || `sub_local_${tugas.id}`,
          warga_belajar_id: localSub.warga_belajar_id || user?.id,
          nama_lengkap: localSub.nama_lengkap || user?.nama_lengkap || 'Warga Belajar',
          nis: localSub.nis || user?.nis || 'PKBM-WB',
          path_file: localSub.path_file,
          nama_file: localSub.nama_file,
          catatan_siswa: localSub.catatan_siswa,
          nilai: localSub.nilai,
          status: localSub.status || 'terkumpul',
          submitted_at: localSub.submitted_at || new Date().toISOString()
        });
      }

      fullTugas.pengumpulan = pengumpulanList;
      setDetailTugasModal(fullTugas);

      const initGrading = {};
      const { meta: taskMeta } = parseTaskDescription(fullTugas.deskripsi);
      pengumpulanList.forEach(p => {
        let defaultScore = p.nilai ?? '';
        if ((defaultScore === '' || defaultScore === null || defaultScore === undefined) && taskMeta.tipe === 'pilihan_ganda' && taskMeta.soal_pg && taskMeta.soal_pg.length > 0) {
          const ans = extractStudentPGAnswers(fullTugas, p, jawabanPGMap);
          if (Object.keys(ans).length > 0) {
            let benar = 0;
            taskMeta.soal_pg.forEach((s, idx) => {
              const qId = s.id !== undefined && s.id !== null ? s.id : (idx + 1);
              const rawUser = ans[qId] || ans[String(qId)] || ans[idx + 1] || '';
              const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
              const keyAns = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
              if (userAns && userAns === keyAns) benar++;
            });
            defaultScore = Math.round((benar / taskMeta.soal_pg.length) * (fullTugas.nilai_maks || 100));
          }
        }

        initGrading[p.id] = {
          nilai: defaultScore,
          feedback_tutor: p.feedback_tutor ?? (defaultScore === 100 ? 'Luar biasa, nilai sempurna!' : (defaultScore >= 70 ? 'Bagus, tugas diselesaikan dengan baik.' : ''))
        };
      });
      setGradingInputMap(initGrading);
    } catch (err) {
      console.error('[handleOpenDetailTugas] Error:', err);
      alert('Gagal mengambil detail pengumpulan tugas.');
    } finally {
      setLoadingDetailTugas(false);
    }
  };

  const handleSimpanNilai = async (pengumpulanId) => {
    const input = gradingInputMap[pengumpulanId] || {};
    if (input.nilai === undefined || input.nilai === '') {
      alert('Harap isi nilai tugas (0-100).');
      return;
    }
    const num = parseFloat(input.nilai);
    if (isNaN(num) || num < 0 || num > 100) {
      alert('Nilai harus berupa angka di antara 0 sampai 100.');
      return;
    }

    setSavingGradeId(pengumpulanId);
    try {
      await LmsAPI.nilaiTugas(pengumpulanId, {
        nilai: num,
        feedback_tutor: input.feedback_tutor || ''
      });
      alert('Nilai dan evaluasi tugas berhasil disimpan!');

      // Update state modal
      setDetailTugasModal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pengumpulan: (prev.pengumpulan || []).map(p =>
            p.id === pengumpulanId
              ? { ...p, nilai: num, feedback_tutor: input.feedback_tutor, status: 'dinilai' }
              : p
          )
        };
      });

      // Refresh list allTugas & statistik secara komprehensif
      await fetchTugasList(null, null, false);
      window.dispatchEvent(new CustomEvent('pkbm_tugas_updated'));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setSavingGradeId(null);
    }
  };

  // ── Action: Posting Komentar Forum ───────────────────────────
  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await PertemuanAPI.addComment(activePertemuanId, newComment);
      setPertemuanDetail(prev => ({
        ...prev,
        komentar: res.data.data
      }));
      setNewComment('');
    } catch {
      alert('Gagal mengirim komentar.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── Action: Hapus Komentar Forum ──────────────────────────────
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;

    try {
      await PertemuanAPI.deleteComment(commentId);
      setPertemuanDetail(prev => ({
        ...prev,
        komentar: prev.komentar.filter(c => c.id !== commentId)
      }));
    } catch {
      alert('Gagal menghapus komentar.');
    }
  };

  // ── Modul & Buku Handlers (Admin / Tutor) ─────────────────
  const handleOpenCreateModul = () => {
    try {
      setEditingModulId(null);
      setSelectedModulFile(null);
      setExistingModulFileName('');
      setModulFormData({
        judul: '',
        deskripsi: '',
        kategori: 'Semua Jenjang',
        mapel: mapel?.nama_mapel || mapel?.nama || '',
        tipe: 'buku_kemendikdasmen',
        url_eksternal: 'https://buku.kemendikdasmen.go.id/',
        penulis: user?.nama_lengkap || user?.nama || 'PKBM Bina Mandiri',
        semester: 'Semua Semester',
        tahun_ajaran: '2025/2026',
        is_published: 1,
      });
      setShowModulModal(true);
    } catch (err) {
      console.error('Error opening create modul modal:', err);
    }
  };

  const handleOpenEditModul = (item) => {
    try {
      setEditingModulId(item.id);
      setSelectedModulFile(null);
      setExistingModulFileName(item.file_nama_asli || '');
      setModulFormData({
        judul: item.judul || '',
        deskripsi: item.deskripsi || '',
        kategori: item.kategori || 'Semua Jenjang',
        mapel: item.mapel || mapel?.nama_mapel || mapel?.nama || '',
        tipe: item.tipe || (item.file_path ? 'modul_upload' : 'buku_kemendikdasmen'),
        url_eksternal: item.url_eksternal || 'https://buku.kemendikdasmen.go.id/',
        penulis: item.penulis || 'PKBM Bina Mandiri',
        semester: item.semester || 'Semua Semester',
        tahun_ajaran: item.tahun_ajaran || '2025/2026',
        is_published: item.is_published !== undefined ? item.is_published : 1,
      });
      setShowModulModal(true);
    } catch (err) {
      console.error('Error opening edit modul modal:', err);
    }
  };

  const handleSubmitModul = async (e) => {
    e.preventDefault();
    if (!modulFormData.judul.trim()) {
      alert('Judul modul/buku wajib diisi.');
      return;
    }
    if (modulFormData.tipe === 'modul_upload' && !selectedModulFile && !editingModulId) {
      alert('Silakan pilih berkas modul (PDF/DOCX) untuk diunggah.');
      return;
    }

    try {
      setSubmittingModul(true);
      const data = new FormData();
      data.append('judul', modulFormData.judul);
      data.append('deskripsi', modulFormData.deskripsi || '');
      data.append('kategori', modulFormData.kategori);
      data.append('mapel', modulFormData.mapel || mapel?.nama_mapel || mapel?.nama || '');
      data.append('tipe', modulFormData.tipe);
      data.append('url_eksternal', modulFormData.url_eksternal || '');
      data.append('penulis', modulFormData.penulis || 'PKBM Bina Mandiri');
      data.append('semester', modulFormData.semester);
      data.append('tahun_ajaran', modulFormData.tahun_ajaran);
      data.append('is_published', modulFormData.is_published);

      let rombelId = searchParams.get('rombel_id');
      if (rombelId) data.append('rombel_id', rombelId);
      if (mapelId) data.append('mapel_id', mapelId);

      if (selectedModulFile) {
        data.append('file', selectedModulFile);
      }

      try {
        if (editingModulId) {
          await ModulBukuAPI.update(editingModulId, data);
        } else {
          await ModulBukuAPI.create(data);
        }
      } catch (backendErr) {
        console.warn('Simpan ModulBuku backend gagal, menyimpan ke local storage:', backendErr.message);
      }

      const localCustom = getLocalCustomModul();
      let updatedCustom;
      if (editingModulId) {
        updatedCustom = localCustom.map((item) => {
          if (item.id === editingModulId) {
            return {
              ...item,
              ...modulFormData,
              file_nama_asli: selectedModulFile ? selectedModulFile.name : item.file_nama_asli,
              file_size: selectedModulFile ? selectedModulFile.size : item.file_size,
              file_path: selectedModulFile ? URL.createObjectURL(selectedModulFile) : item.file_path,
              file_type: selectedModulFile ? selectedModulFile.name.split('.').pop().toUpperCase() : (item.file_type || (modulFormData.tipe === 'buku_kemendikdasmen' ? 'LINK' : 'PDF')),
            };
          }
          return item;
        });

        setModulBukuList((prev) =>
          prev.map((item) => {
            if (item.id === editingModulId) {
              return {
                ...item,
                ...modulFormData,
                file_nama_asli: selectedModulFile ? selectedModulFile.name : item.file_nama_asli,
                file_size: selectedModulFile ? selectedModulFile.size : item.file_size,
                file_path: selectedModulFile ? URL.createObjectURL(selectedModulFile) : item.file_path,
                file_type: selectedModulFile ? selectedModulFile.name.split('.').pop().toUpperCase() : (item.file_type || (modulFormData.tipe === 'buku_kemendikdasmen' ? 'LINK' : 'PDF')),
              };
            }
            return item;
          })
        );
      } else {
        const newItem = {
          id: Date.now(),
          ...modulFormData,
          total_dibaca: 0,
          file_nama_asli: selectedModulFile ? selectedModulFile.name : null,
          file_size: selectedModulFile ? selectedModulFile.size : 0,
          file_type: selectedModulFile ? selectedModulFile.name.split('.').pop().toUpperCase() : (modulFormData.tipe === 'buku_kemendikdasmen' ? 'LINK' : 'PDF'),
          file_path: selectedModulFile ? URL.createObjectURL(selectedModulFile) : null,
        };
        updatedCustom = [newItem, ...localCustom];
        setModulBukuList((prev) => [newItem, ...prev]);
      }

      saveLocalCustomModul(updatedCustom);
      setShowModulModal(false);
    } catch (err) {
      console.error('Error submitting modul:', err);
      alert('Gagal menyimpan modul/buku.');
    } finally {
      setSubmittingModul(false);
    }
  };

  const handleDeleteModul = async () => {
    if (!deleteModulTarget) return;
    try {
      setDeletingModul(true);
      try {
        await ModulBukuAPI.delete(deleteModulTarget.id);
      } catch (err) {
        console.warn('Hapus modul dari backend gagal, menghapus dari lokal:', err.message);
      }

      const localCustom = getLocalCustomModul();
      const updated = localCustom.filter((m) => m.id !== deleteModulTarget.id);
      saveLocalCustomModul(updated);

      setModulBukuList((prev) => prev.filter((m) => m.id !== deleteModulTarget.id));
      setDeleteModulTarget(null);
    } catch (err) {
      console.error('Error delete modul:', err);
      alert('Gagal menghapus modul.');
    } finally {
      setDeletingModul(false);
    }
  };

  // Helper formatting sisa waktu
  const formatTimer = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0) return '00:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Ikon File Materi
  const getFileIcon = (tipe) => {
    const map = {
      video: 'bi-play-circle-fill',
      video_link: 'bi-play-circle-fill',
      dokumen: 'bi-file-earmark-pdf-fill',
      link: 'bi-link-45deg',
      link_eksternal: 'bi-link-45deg',
    };
    return map[tipe] || 'bi-file-earmark-arrow-down-fill';
  };

  // Filtered Materi List
  const filteredMateriList = allMateri.filter(m => {
    if (!materiSearch.trim()) return true;
    const q = materiSearch.toLowerCase();
    return (m.judul || '').toLowerCase().includes(q) || (m.deskripsi || '').toLowerCase().includes(q);
  });

  // Filtered Modul List
  const filteredModulList = modulBukuList.filter(b => {
    if (user.role === 'warga_belajar' && b.is_published !== undefined && Number(b.is_published) === 0) {
      return false;
    }
    if (modulCategory !== 'Semua' && b.kategori !== modulCategory && b.kategori !== 'Semua Jenjang') return false;
    if (!modulSearch.trim()) return true;
    const q = modulSearch.toLowerCase();
    return (b.judul || '').toLowerCase().includes(q) || (b.deskripsi || '').toLowerCase().includes(q);
  });

  // Filtered Tugas List (Akurat untuk Warga Belajar & Tutor/Admin)
  const filteredTugasList = allTugas.filter(t => {
    if (user.role === 'warga_belajar') {
      if (tugasFilter === 'belum') return !t.pengumpulan_saya;
      if (tugasFilter === 'terkumpul') return !!t.pengumpulan_saya && t.pengumpulan_saya.status !== 'dinilai';
      if (tugasFilter === 'dinilai') return !!t.pengumpulan_saya && t.pengumpulan_saya.status === 'dinilai';
    } else {
      if (tugasFilter === 'terkumpul') return (t.jumlah_terkumpul || 0) > 0;
      if (tugasFilter === 'belum') return (t.jumlah_terkumpul || 0) === 0;
    }
    return true;
  });

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main kelas-page-main">
        <div className="kelas-notebook-wrapper">

          {/* ══ 1. TOP SECTION (NOTEBOOK PAPER, HEADER & HERO) ══ */}
          <div className="kelas-top-section">
            <div className="kelas-top-navigation">
              <button
                type="button"
                onClick={() => navigate('/dashboard/siswa/ruang-belajar')}
                className="kelas-nav-back-link"
              >
                <i className="bi bi-arrow-left-circle-fill"></i>
                <span>Kembali ke Ruang Belajar</span>
              </button>

              <div className="kelas-nav-breadcrumb-capsules">
                <span className="cute-nav-capsule brand">
                  <i className="bi bi-mortarboard-fill"></i> PKBM Bina Mandiri
                </span>
                <span className="cute-nav-capsule rombel">
                  <i className="bi bi-people-fill"></i> {rombelDetail?.nama_rombel || rombelDetail?.nama || user.nama_rombel || 'Ruang Belajar'}
                </span>
                <span className="cute-nav-capsule sem">
                  <i className="bi bi-calendar-heart-fill"></i> Semester Ganjil 2026/2027
                </span>
              </div>
            </div>

            {/* Loading Utama */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '350px', gap: '1rem' }}>
                <div className="spinner"></div>
                <span style={{ fontFamily: 'Caveat', fontSize: '1.4rem', color: '#64748B' }}>Membuka ruang kelas...</span>
              </div>
            )}

            {/* Error Utama */}
            {!loading && error && (
              <div style={{ borderRadius: '16px', padding: '1.25rem', background: '#FEE2E2', border: '2px solid #FCA5A5', color: '#991B1B', maxWidth: 700, margin: '2rem auto', textAlign: 'center' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.75rem', fontSize: '1.4rem' }}></i>
                <span style={{ fontWeight: 700 }}>{error}</span>
              </div>
            )}

            {!loading && !error && (
              <div className="kelas-hero-showcase">
                <div className="kelas-hero-eyebrow">
                </div>

                <h1 className="kelas-hero-title">
                  {mapel?.nama || 'Mata Pelajaran'}
                </h1>

                <p className="kelas-hero-desc">
                  Ruang kelas digital khusus <strong>{rombelDetail?.nama_rombel || rombelDetail?.nama || 'rombel ini'}</strong>. Seluruh materi pembelajaran, modul & buku digital, tugas mingguan mandiri, presensi pertemuan, dan diskusi interaktif terpadu dalam satu lembar kerja.
                </p>

                {/* Unified Cute Meta Bar */}
                <div className="kelas-hero-meta-bar">
                  <div className="hero-meta-item tutor-item">
                    <div className="hero-meta-avatar yellow">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div className="hero-meta-text">
                      <span className="hero-meta-label">Tutor Pengampu</span>
                      <span className="hero-meta-val bold">
                        {pertemuanDetail?.pertemuan?.nama_tutor || mapel?.nama_tutor || 'Tutor Kelas'}
                      </span>
                    </div>
                  </div>

                  <div className="hero-meta-divider"></div>

                  <div className="hero-meta-item">
                    <div className="hero-meta-avatar mint">
                      <i className="bi bi-calendar2-check-fill"></i>
                    </div>
                    <div className="hero-meta-text">
                      <span className="hero-meta-label">Kehadiran Siswa</span>
                      <span className="hero-meta-val">
                        <strong>{rekapKehadiran?.hadir || 0}</strong>
                        <span className="hero-meta-sub"> / {rekapKehadiran?.total_pertemuan || 0} Sesi</span>
                      </span>
                    </div>
                  </div>

                  <div className="hero-meta-divider"></div>

                  <div className="hero-meta-item">
                    <div className="hero-meta-avatar lavender">
                      <i className="bi bi-journal-check"></i>
                    </div>
                    <div className="hero-meta-text">
                      <span className="hero-meta-label">Tugas Terkumpul</span>
                      <span className="hero-meta-val">
                        <strong>{tugasStats.submitted}</strong>
                        <span className="hero-meta-sub"> / {tugasStats.total || allTugas.length} Selesai</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!loading && !error && (
            /* ══ 2. FULL-SPACE SHEET SECTION (FLUSH KANAN, KIRI & BAWAH) ══ */
            <div className="kelas-sheet-section">
              <div className="retro-sheet-tabs-bar">
                <button
                  type="button"
                  onClick={() => setMainTab('pertemuan')}
                  className={`retro-sheet-tab tab-room1 ${mainTab === 'pertemuan' ? 'active' : ''}`}
                >
                  <span className="sheet-tab-dot"></span>
                  <span>ROOM 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('materi')}
                  className={`retro-sheet-tab tab-room2 ${mainTab === 'materi' ? 'active' : ''}`}
                >
                  <span className="sheet-tab-dot"></span>
                  <span>ROOM 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('modul')}
                  className={`retro-sheet-tab tab-room3 ${mainTab === 'modul' ? 'active' : ''}`}
                >
                  <span className="sheet-tab-dot"></span>
                  <span>ROOM 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('tugas')}
                  className={`retro-sheet-tab tab-room4 ${mainTab === 'tugas' ? 'active' : ''}`}
                >
                  <span className="sheet-tab-dot"></span>
                  <span>ROOM 4</span>
                </button>
              </div>

              {/* ══ 4. MAIN SHEET CONTAINER (FULL SPACE: NO KOTAK, NO GAPS) ══ */}
              <div className={`retro-sheet-container sheet-theme-${mainTab}`}>
                <div className="sheet-inner-content">

                  {/* ──────────────────────────────────────────────── */}
                  {/* TAB 1: AKTIVITAS SESI PERTEMUAN                  */}
                  {/* ──────────────────────────────────────────────── */}
                  {mainTab === 'pertemuan' && (
                    <div>
                      {/* Dropdown Pemilihan Sesi Pertemuan (Anti-Terpotong di Mobile & Desktop) */}
                      {(pertemuans.length > 0 || user.role !== 'warga_belajar') && (
                        <div className="sheet-filter-dropdown-wrapper" style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="sesi-selector" className="sheet-filter-dropdown-label">
                            <i className="bi bi-calendar2-week-fill"></i>
                            <span>Pilih Sesi Pertemuan:</span>
                            <span className="sheet-filter-dropdown-hint">(Klik dropdown untuk berpindah sesi KBM)</span>
                          </label>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {pertemuans.length > 0 ? (
                              <div style={{ flex: 1, minWidth: '260px' }}>
                                <CuteSelect
                                  id="sesi-selector"
                                  value={activePertemuanId || ''}
                                  onChange={(val) => setActivePertemuanId(Number(val))}
                                  themeColor="pink"
                                  icon="bi-calendar2-heart-fill"
                                  labelHint="Daftar Sesi Pembelajaran"
                                  options={pertemuans.map((pert) => ({
                                    value: pert.id,
                                    label: `Sesi ${String(pert.pertemuan_ke).padStart(2, '0')}: ${pert.judul}`,
                                    badge: new Date(pert.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                                    icon: 'bi-calendar-event'
                                  }))}
                                />
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.95)', fontStyle: 'italic' }}>
                                Belum ada sesi pertemuan yang dibuat.
                              </div>
                            )}

                            {user.role !== 'warga_belajar' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextKe = pertemuans.length > 0 ? Math.max(...pertemuans.map(p => p.pertemuan_ke)) + 1 : 1;
                                  setNewPertemuanKe(nextKe);
                                  setNewPertemuanJudul(`Materi Sesi ${nextKe}`);
                                  setShowAddPertemuanModal(true);
                                }}
                                className="sheet-btn-cta"
                                style={{ padding: '9px 18px' }}
                              >
                                <i className="bi bi-plus-lg"></i>
                                <span>Tambah Sesi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {loadingDetail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', gap: '1rem' }}>
                          <div className="spinner"></div>
                          <span style={{ fontFamily: 'Caveat', fontSize: '1.4rem', color: '#94A3B8' }}>Membuka catatan sesi...</span>
                        </div>
                      ) : pertemuanDetail ? (
                        <>
                          {/* Meeting Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.22)' }}>
                            <div>
                              <span className="sheet-header-pill">
                                ● {new Date(pertemuanDetail.pertemuan.tanggal_pelaksanaan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                              <h2 className="sheet-header-title">
                                Sesi {pertemuanDetail.pertemuan.pertemuan_ke}: {pertemuanDetail.pertemuan.judul}
                              </h2>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                <span className="retro-tag-pill blue" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                                  Metode: {pertemuanDetail.pertemuan.metode_belajar || 'Hybrid'}
                                </span>
                                {pertemuanDetail.pertemuan.is_published ? (
                                  <span className="retro-tag-pill mint" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                                    Publik
                                  </span>
                                ) : (
                                  <span className="retro-tag-pill pink" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                                    Draft
                                  </span>
                                )}
                              </div>
                            </div>

                            {user.role !== 'warga_belajar' && (
                              <button
                                type="button"
                                onClick={handleTogglePublishPertemuan}
                                className={`retro-btn-action ${pertemuanDetail.pertemuan.is_published ? 'neutral' : 'mint'}`}
                                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                              >
                                <i className={`bi ${pertemuanDetail.pertemuan.is_published ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                <span>{pertemuanDetail.pertemuan.is_published ? 'Sembunyikan Sesi' : 'Publikasikan Sesi'}</span>
                              </button>
                            )}
                          </div>

                          {/* Rencana Materi & Kompetensi */}
                          {pertemuanDetail.pertemuan.rencana_materi && (
                            <div className="sheet-taped-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                              <span className="retro-washi-tape top-left yellow"></span>
                              <h4 style={{ fontFamily: 'Outfit', fontSize: '0.96rem', fontWeight: 900, color: 'var(--rb-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-bookmark-star-fill" style={{ color: '#F59E0B' }}></i>
                                <span>Rencana Materi & Kompetensi Dasar</span>
                              </h4>
                              <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                                {pertemuanDetail.pertemuan.rencana_materi}
                              </p>
                            </div>
                          )}

                          {/* Grid 2 Kolom: Aktivitas & Side Rail */}
                          <div className="sheet-content-grid">
                            {/* Kolom Kiri */}
                            <div>
                              {/* 1. PRESENSI / ABSENSI MANDIRI */}
                              {(pertemuanDetail.absensi || user.role !== 'warga_belajar') && (
                                <div className="sheet-taped-card">
                                  <span className="retro-washi-tape top-left mint"></span>
                                  <div className="sheet-card-header">
                                    <span className="retro-badge-wavy mint">
                                      <i className="bi bi-clock-history"></i> Presensi Sesi
                                    </span>
                                  </div>

                                  {!pertemuanDetail.absensi ? (
                                    <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', padding: '1.25rem', borderRadius: '14px' }}>
                                      <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--rb-dark)', fontFamily: 'Outfit' }}>Presensi Belum Dibuka</strong>
                                      <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                                        Aktifkan timer presensi mandiri agar siswa dapat melakukan check-in kehadiran langsung.
                                      </p>

                                      {showAbsensiForm ? (
                                        <form onSubmit={handleCreateAbsensiSesi} style={{ background: '#F1F5F9', border: '1.5px solid #CBD5E1', padding: '12px 14px', borderRadius: '12px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Durasi:</span>
                                              <input
                                                type="number"
                                                min={5}
                                                max={180}
                                                value={absensiTimer}
                                                onChange={(e) => setAbsensiTimer(e.target.value)}
                                                style={{ width: '70px', borderRadius: '8px', border: '1.5px solid #94A3B8', background: '#FFFFFF', color: 'var(--rb-dark)', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}
                                                required
                                              />
                                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Menit</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                              <button type="button" onClick={() => setShowAbsensiForm(false)} className="retro-btn-action neutral" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                                Batal
                                              </button>
                                              <button type="submit" disabled={submittingAbsensi} className="retro-btn-action primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                                                {submittingAbsensi ? 'Mengaktifkan...' : 'Aktifkan Timer'}
                                              </button>
                                            </div>
                                          </div>
                                        </form>
                                      ) : (
                                        <button type="button" onClick={() => setShowAbsensiForm(true)} className="retro-btn-action primary">
                                          <i className="bi bi-play-circle-fill"></i>
                                          <span>Buka Timer Presensi Mandiri</span>
                                        </button>
                                      )}
                                    </div>
                                  ) : user.role !== 'warga_belajar' ? (
                                    pertemuanDetail.absensi.status_sesi === 'aktif' && sisaWaktuAbsen > 0 ? (
                                      <div style={{ background: '#EFF6FF', border: '1.5px solid #3B82F6', padding: '1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <i className="bi bi-broadcast" style={{ fontSize: '1.6rem', color: '#2563EB' }}></i>
                                        <div>
                                          <strong style={{ display: 'block', color: '#1E40AF', fontFamily: 'Outfit', fontSize: '1.05rem' }}>
                                            Sesi Presensi Mandiri Sedang Berjalan
                                          </strong>
                                          <span style={{ fontSize: '0.86rem', color: '#1E3A8A' }}>
                                            Siswa dapat check-in kehadiran (Sisa waktu: <strong>{formatTimer(sisaWaktuAbsen)}</strong>)
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1', padding: '1rem', borderRadius: '12px', color: '#64748B', fontSize: '0.88rem' }}>
                                        <i className="bi bi-info-circle" style={{ marginRight: 6 }}></i>
                                        <span>Tidak ada timer presensi mandiri aktif saat ini.</span>
                                      </div>
                                    )
                                  ) : pertemuanDetail.absensi.rekaman_saya ? (
                                    <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', padding: '1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                      <i className="bi bi-check-circle-fill" style={{ fontSize: '1.8rem', color: '#059669' }}></i>
                                      <div>
                                        <strong style={{ fontSize: '1.05rem', color: '#065F46', display: 'block', fontFamily: 'Outfit' }}>
                                          Anda Sudah Presensi
                                        </strong>
                                        <span style={{ fontSize: '0.84rem', color: '#047857' }}>
                                          Status: <strong>{pertemuanDetail.absensi.rekaman_saya.status?.toUpperCase()}</strong>
                                          {pertemuanDetail.absensi.rekaman_saya.waktu_check_in && ` (Tercatat ${new Date(pertemuanDetail.absensi.rekaman_saya.waktu_check_in).toLocaleTimeString('id-ID')})`}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {pertemuanDetail.absensi.status_sesi === 'aktif' && pertemuanDetail.absensi.mode === 'mandiri' && sisaWaktuAbsen > 0 ? (
                                        <div style={{ background: '#FEF2F2', border: '2px solid #F43F5E', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                              <span className="retro-badge-wavy pink" style={{ background: '#F43F5E', color: '#FFFFFF', border: 'none' }}>
                                                <i className="bi bi-stopwatch"></i> {formatTimer(sisaWaktuAbsen)}
                                              </span>
                                              <strong style={{ color: '#9F1239', fontFamily: 'Outfit', fontSize: '1.05rem' }}>
                                                Presensi Dibuka!
                                              </strong>
                                            </div>
                                            <span style={{ fontSize: '0.84rem', color: '#881337' }}>
                                              Klik tombol di sebelah kanan untuk merekam kehadiran Anda.
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleCheckIn(pertemuanDetail.absensi.id)}
                                            className="retro-btn-action mint"
                                            style={{ fontSize: '0.95rem' }}
                                          >
                                            <i className="bi bi-fingerprint"></i>
                                            <span>Check-in Presensi Sekarang</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ background: '#FFFBEB', border: '1.5px solid #F59E0B', padding: '1rem', borderRadius: '12px', color: '#92400E', fontSize: '0.88rem' }}>
                                          <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }}></i>
                                          <span>Tidak ada sesi presensi mandiri yang aktif saat ini.</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              {/* 2. FORUM DISKUSI SESI */}
                              <div className="sheet-taped-card">
                                <span className="retro-washi-tape top-left purple"></span>
                                <div className="sheet-card-header">
                                  <span className="retro-badge-wavy purple">
                                    <i className="bi bi-chat-dots-fill"></i> Forum Diskusi Sesi
                                  </span>
                                </div>

                                <div className="forum-thread-container">
                                  {!pertemuanDetail.komentar || pertemuanDetail.komentar.length === 0 ? (
                                    <p style={{ color: '#64748B', fontSize: '0.88rem', textAlign: 'center', margin: 0, padding: '1.5rem 1rem' }}>
                                      Belum ada komentar untuk sesi ini. Tuliskan pesan pertama Anda!
                                    </p>
                                  ) : (
                                    pertemuanDetail.komentar.map((c) => {
                                      const isMyComment = c.user_id === user.id;
                                      return (
                                        <div key={c.id} className={`forum-comment-card ${isMyComment ? 'my-comment' : ''}`}>
                                          <div className="comment-avatar">
                                            {c.foto_profil ? (
                                              <img src={toAssetUrl(c.foto_profil)} alt="" />
                                            ) : (
                                              c.nama_lengkap.charAt(0).toUpperCase()
                                            )}
                                          </div>

                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--rb-dark)' }}>
                                                {c.nama_lengkap}{' '}
                                                {c.role === 'tutor' && (
                                                  <span className="retro-tag-pill blue" style={{ padding: '1px 6px', fontSize: '0.62rem', marginLeft: 4 }}>TUTOR</span>
                                                )}
                                              </span>
                                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                {new Date(c.created_at).toLocaleDateString('id-ID')}
                                              </span>
                                            </div>
                                            <p style={{ fontSize: '0.86rem', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                              {c.isi}
                                            </p>
                                          </div>

                                          {isMyComment && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteComment(c.id)}
                                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', borderTop: '1.5px dashed #E2E8F0', paddingTop: '1rem' }}>
                                  <input
                                    type="text"
                                    placeholder="Tuliskan pertanyaan atau tanggapan..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                    style={{ flex: 1, borderRadius: '12px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: 'var(--rb-dark)', padding: '10px 14px', fontSize: '0.86rem', outline: 'none' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handlePostComment}
                                    disabled={submittingComment || !newComment.trim()}
                                    className="retro-btn-action primary"
                                    style={{ padding: '0 18px' }}
                                  >
                                    <i className="bi bi-send-fill"></i>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Kolom Kanan (Side Rail) */}
                            <div>
                              {/* Post-it Pengumuman */}
                              <div className="postit-note-dark">
                                <div className="postit-pin"></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                  <h4 style={{ fontFamily: 'Outfit', fontSize: '0.92rem', fontWeight: 900, color: '#713F12', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="bi bi-megaphone-fill" style={{ color: '#EAB308' }}></i>
                                    <span>Pengumuman Sesi</span>
                                  </h4>
                                  {user.role !== 'warga_belajar' && !editingPengumuman && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingPengumuman(true)}
                                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>

                                {editingPengumuman ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <textarea
                                      value={tempPengumuman}
                                      onChange={(e) => setTempPengumuman(e.target.value)}
                                      rows={4}
                                      style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #FCD34D', padding: '8px 10px', fontSize: '0.8rem', resize: 'vertical' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                      <button type="button" onClick={() => setEditingPengumuman(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>
                                        Batal
                                      </button>
                                      <button type="button" onClick={handleSavePengumuman} disabled={submittingPengumuman} className="retro-btn-action primary" style={{ padding: '4px 12px', fontSize: '0.76rem' }}>
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#713F12', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                    {pertemuanDetail?.pertemuan?.pengumuman || 'Tidak ada pengumuman khusus untuk sesi pembelajaran ini.'}
                                  </p>
                                )}
                              </div>

                              {/* RPS Widget */}
                              <div className="sheet-taped-card">
                                <h4 style={{ fontFamily: 'Outfit', fontSize: '0.96rem', fontWeight: 900, color: 'var(--rb-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#EF4444' }}></i>
                                  <span>Rencana Belajar (RPS)</span>
                                </h4>
                                <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                                  Panduan silabus & kurikulum pembelajaran semester ini.
                                </p>

                                {rpsPath ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <a
                                      href={toAssetUrl(rpsPath)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF6FF', border: '1.5px solid #3B82F6', borderRadius: '10px', padding: '10px 12px', color: '#1D4ED8', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none' }}
                                    >
                                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                        RPS-{mapel?.nama || 'Kelas'}.pdf
                                      </span>
                                      <i className="bi bi-download"></i>
                                    </a>
                                  </div>
                                ) : (
                                  <div style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '10px', padding: '12px', color: '#64748B', fontSize: '0.78rem', textAlign: 'center' }}>
                                    RPS belum diunggah oleh Tutor.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : pertemuans.length === 0 ? (
                        <div className="sheet-content-grid">
                          <div className="sheet-empty-state-card">
                            <span className="retro-washi-tape top-center yellow"></span>
                            <div className="empty-state-icon-box">
                              <i className="bi bi-calendar-event"></i>
                            </div>
                            <h3 className="empty-state-title">Belum Ada Sesi Pertemuan Aktif</h3>
                            <p className="empty-state-desc">
                              Tutor pengampu belum membuka sesi pertemuan pembelajaran untuk mata pelajaran ini. 
                              Agenda tatap muka, materi sesi terarah, presensi mandiri, dan forum diskusi akan muncul di Room 1 ini saat sesi dibuka.
                            </p>

                            {user.role !== 'warga_belajar' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPertemuanKe(1);
                                  setNewPertemuanJudul('Materi Sesi 01');
                                  setShowAddPertemuanModal(true);
                                }}
                                className="retro-btn-action primary"
                                style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                              >
                                <i className="bi bi-plus-circle-fill"></i>
                                <span>Buat Sesi Pertemuan Pertama</span>
                              </button>
                            )}

                            <div className="empty-state-features-grid">
                              <div className="empty-feature-item">
                                <div className="empty-feature-icon mint">
                                  <i className="bi bi-person-check-fill"></i>
                                </div>
                                <div>
                                  <strong>Presensi Mandiri</strong>
                                  <span>Absensi dibuka secara real-time oleh tutor saat KBM dimulai.</span>
                                </div>
                              </div>
                              <div className="empty-feature-item">
                                <div className="empty-feature-icon blue">
                                  <i className="bi bi-chat-dots-fill"></i>
                                </div>
                                <div>
                                  <strong>Forum Diskusi Sesi</strong>
                                  <span>Tanya jawab langsung dengan tutor & rekan sekelas per sesi.</span>
                                </div>
                              </div>
                              <div className="empty-feature-item">
                                <div className="empty-feature-icon yellow">
                                  <i className="bi bi-journal-bookmark-fill"></i>
                                </div>
                                <div>
                                  <strong>Materi & Tugas Terpadu</strong>
                                  <span>Dapat diakses juga di Room 2 (Materi) & Room 4 (Tugas).</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Side Cards: RPS & Info Tutor */}
                          <div>
                            <div className="sheet-taped-card">
                              <span className="retro-washi-tape top-right mint"></span>
                              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 900, color: 'var(--rb-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#EF4444' }}></i>
                                <span>Rencana Belajar (RPS)</span>
                              </h4>
                              <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                                Unduh silabus kurikulum pembelajaran semester ini sebagai acuan belajar Anda.
                              </p>

                              {rpsPath ? (
                                <a
                                  href={toAssetUrl(rpsPath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="retro-btn-action primary"
                                  style={{ width: '100%', justifyContent: 'center', padding: '9px 12px' }}
                                >
                                  <i className="bi bi-download"></i>
                                  <span>Unduh RPS ({mapel?.nama || 'Kelas'})</span>
                                </a>
                              ) : (
                                <div style={{ background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '14px', color: '#64748B', fontSize: '0.8rem', textAlign: 'center' }}>
                                  RPS belum diunggah oleh Tutor.
                                </div>
                              )}
                            </div>

                            <div className="sheet-taped-card">
                              <span className="retro-washi-tape top-right blue"></span>
                              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 900, color: 'var(--rb-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-person-badge-fill" style={{ color: '#2563EB' }}></i>
                                <span>Tutor Pengampu</span>
                              </h4>
                              <p style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--rb-dark)', margin: '0 0 4px 0' }}>
                                {pertemuanDetail?.pertemuan?.nama_tutor || mapel?.nama_tutor || 'Tutor PKBM Bina Mandiri'}
                              </p>
                              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                Pengampu resmi mata pelajaran {mapel?.nama || 'ini'}.
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="sheet-empty-state-card">
                          <i className="bi bi-arrow-up-circle-fill" style={{ fontSize: '2.5rem', color: '#E05D74', display: 'block', marginBottom: '0.75rem' }}></i>
                          <h4 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 900, color: 'var(--rb-dark)', margin: '0 0 6px 0' }}>Pilih Sesi Pertemuan</h4>
                          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>Silakan pilih salah satu nomor sesi pertemuan di baris atas untuk melihat detail materi dan presensi.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────── */}
                  {/* TAB 2: MATERI BELAJAR                            */}
                  {/* ──────────────────────────────────────────────── */}
                  {mainTab === 'materi' && (
                    <div>
                      {/* Materi Header & Search Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.22)' }}>
                        <div>
                          <span className="sheet-header-pill">
                            ROOM 2 • REPOSITORI MATERI
                          </span>
                          <h2 className="sheet-header-title">
                            Materi Pembelajaran: {mapel?.nama}
                          </h2>
                          <p className="sheet-header-subtitle">
                            Kumpulan dokumen teks, presentasi, modul bacaan, tautan web, dan rekaman video edukasi.
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Cari materi belajar..."
                            value={materiSearch}
                            onChange={(e) => setMateriSearch(e.target.value)}
                            className="sheet-search-input"
                          />

                          {user.role !== 'warga_belajar' && (
                            <button
                              type="button"
                              onClick={() => setShowMateriForm(true)}
                              className="sheet-btn-cta"
                            >
                              <i className="bi bi-plus-lg"></i>
                              <span>Unggah Materi Baru</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Modal Form Tambah Materi */}
                      {showMateriForm && (
                        <div style={{ background: '#FFFFFF', border: '2px solid var(--rb-dark-border)', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '4px 6px 0 var(--rb-dark-border)' }}>
                          <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--rb-dark)', margin: '0 0 12px 0' }}>
                            Formulir Unggah Materi Baru
                          </h4>
                          <form onSubmit={handleCreateMateri} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>JUDUL MATERI</label>
                              <input
                                type="text"
                                placeholder="Contoh: Modul Aljabar Dasar & Penerapan Sehari-hari"
                                value={materiJudul}
                                onChange={(e) => setMateriJudul(e.target.value)}
                                style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                                required
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>RINGKASAN DESKRIPSI</label>
                              <textarea
                                placeholder="Petunjuk ringkas untuk siswa..."
                                value={materiDeskripsi}
                                onChange={(e) => setMateriDeskripsi(e.target.value)}
                                rows={2}
                                style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', resize: 'vertical' }}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>TIPE MATERI</label>
                                <select
                                  value={materiTipe}
                                  onChange={(e) => setMateriTipe(e.target.value)}
                                  style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 12px', fontSize: '0.88rem', fontWeight: 700 }}
                                >
                                  <option value="dokumen">Dokumen (PDF/Word)</option>
                                  <option value="link">Tautan Eksternal</option>
                                  <option value="video">Tautan Video</option>
                                </select>
                              </div>
                              <div>
                                {materiTipe === 'dokumen' ? (
                                  <>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>FILE BERKAS</label>
                                    <input
                                      type="file"
                                      onChange={(e) => setMateriFile(e.target.files[0])}
                                      style={{ fontSize: '0.85rem', paddingTop: '6px' }}
                                      required
                                    />
                                  </>
                                ) : (
                                  <>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>URL LINK</label>
                                    <input
                                      type="url"
                                      placeholder="https://..."
                                      value={materiUrl}
                                      onChange={(e) => setMateriUrl(e.target.value)}
                                      style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                                      required
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                              <button type="button" onClick={() => setShowMateriForm(false)} className="retro-btn-action neutral" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                                Batal
                              </button>
                              <button type="submit" disabled={submittingMateri} className="retro-btn-action primary" style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
                                {submittingMateri ? 'Mengunggah...' : 'Simpan Materi'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Materi Grid Cards */}
                      {filteredMateriList.length === 0 ? (
                        <div className="sheet-empty-state-card">
                          <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', color: '#10B981', display: 'block', marginBottom: '0.75rem' }}></i>
                          <h4 className="empty-state-title">Materi Belum Tersedia</h4>
                          <p className="empty-state-desc">Belum ada modul atau materi pembelajaran yang diunggah untuk kelas ini.</p>
                        </div>
                      ) : (
                        <div className="sheet-materi-grid">
                          {filteredMateriList.map((m) => {
                            const materiUrl = m.url || (m.path_file ? toAssetUrl(m.path_file) : '#');
                            return (
                              <div key={m.id} className="materi-card-item">
                                <span className="retro-washi-tape top-right mint"></span>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0, border: '1.5px solid #86EFAC' }}>
                                      <i className={`bi ${getFileIcon(m.tipe)}`}></i>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                                        {m.tipe?.toUpperCase() || 'DOKUMEN'}
                                      </span>
                                      <h4 style={{ fontFamily: 'Outfit', fontSize: '1.05rem', fontWeight: 800, color: 'var(--rb-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.judul}
                                      </h4>
                                    </div>
                                  </div>

                                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem', minHeight: '40px' }}>
                                    {m.deskripsi || 'Materi pembelajaran untuk melengkapi kompetensi dan penugasan mandiri.'}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1.5px dashed #E2E8F0', paddingTop: '0.85rem' }}>
                                  <a
                                    href={materiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="retro-btn-action primary"
                                    style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                                  >
                                    <span>Buka Materi</span>
                                    <i className="bi bi-box-arrow-up-right"></i>
                                  </a>

                                  {user.role === 'warga_belajar' && (
                                    <button
                                      type="button"
                                      onClick={() => handleTandaiSelesai(m.id)}
                                      disabled={m.sudah_selesai || markingMateriId === m.id}
                                      className={`retro-btn-action ${m.sudah_selesai ? 'mint' : 'neutral'}`}
                                      style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                                    >
                                      <i className={`bi ${m.sudah_selesai ? 'bi-check2-all' : 'bi-check2'}`}></i>
                                      <span>{m.sudah_selesai ? 'Selesai' : 'Tandai'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────── */}
                  {/* TAB 3: MODUL & BUKU                              */}
                  {/* ──────────────────────────────────────────────── */}
                  {mainTab === 'modul' && (
                    <div>
                      {/* Modul Header & Search */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.22)' }}>
                        <div>
                          <span className="sheet-header-pill">
                            ROOM 3 • PERPUSTAKAAN DIGITAL
                          </span>
                          <h2 className="sheet-header-title">
                            Modul Ajar & Buku Teks Digital
                          </h2>
                          <p className="sheet-header-subtitle">
                            Koleksi buku teks utama Kurikulum Merdeka Kemendikdasmen RI dan modul ajar resmi PKBM Bina Mandiri.
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Cari buku atau modul..."
                            value={modulSearch}
                            onChange={(e) => setModulSearch(e.target.value)}
                            className="sheet-search-input"
                          />
                          {user.role !== 'warga_belajar' && (
                            <button
                              type="button"
                              onClick={handleOpenCreateModul}
                              className="sheet-btn-cta"
                            >
                              <i className="bi bi-plus-lg"></i>
                              <span>Tambah Modul / Buku</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filter Kategori Jenjang Dropdown (Cute Custom Dropdown) */}
                      <div className="sheet-filter-dropdown-wrapper" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="modul-filter-select" className="sheet-filter-dropdown-label">
                          <i className="bi bi-bookmark-heart-fill"></i>
                          <span>Pilih Kategori Jenjang:</span>
                          <span className="sheet-filter-dropdown-hint">(Klik dropdown untuk memfilter buku & modul)</span>
                        </label>
                        <div style={{ maxWidth: '380px' }}>
                          <CuteSelect
                            id="modul-filter-select"
                            value={modulCategory}
                            onChange={(val) => setModulCategory(val)}
                            themeColor="yellow"
                            icon="bi-journal-bookmark-fill"
                            labelHint="Kategori Jenjang Modul"
                            options={[
                              { value: 'Semua', label: 'Semua Jenjang Pendidikan', icon: 'bi-collection-fill', badge: `${modulBukuList?.length || 0} Modul` },
                              { value: 'Paket A', label: 'Paket A (Setara SD)', icon: 'bi-mortarboard-fill', badge: 'SD' },
                              { value: 'Paket B', label: 'Paket B (Setara SMP)', icon: 'bi-mortarboard-fill', badge: 'SMP' },
                              { value: 'Paket C', label: 'Paket C (Setara SMA)', icon: 'bi-mortarboard-fill', badge: 'SMA' },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Modul Grid Cards */}
                      {filteredModulList.length === 0 ? (
                        <div className="sheet-empty-state-card">
                          <i className="bi bi-book-half" style={{ fontSize: '2.5rem', color: '#F59E0B', display: 'block', marginBottom: '0.75rem' }}></i>
                          <h4 className="empty-state-title">Buku Tidak Ditemukan</h4>
                          <p className="empty-state-desc">Tidak ada buku atau modul pembelajaran yang cocok dengan filter atau kata kunci pencarian Anda.</p>
                        </div>
                      ) : (
                        <div className="sheet-modul-grid">
                          {filteredModulList.map((b) => {
                            const readUrl = b.url_eksternal || (b.file_path ? toAssetUrl(b.file_path) : 'https://buku.kemendikdasmen.go.id/');
                            return (
                              <div key={b.id} className="modul-card-item">
                                <span className="retro-washi-tape top-right yellow"></span>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '8px' }}>
                                    <span className="retro-tag-pill yellow" style={{ padding: '3px 10px', fontSize: '0.7rem' }}>
                                      {b.kategori}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {user.role !== 'warga_belajar' && (
                                        <span style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          padding: '2px 8px',
                                          borderRadius: '999px',
                                          backgroundColor: (b.is_published === undefined || Number(b.is_published) === 1) ? '#DCFCE7' : '#F1F5F9',
                                          color: (b.is_published === undefined || Number(b.is_published) === 1) ? '#166534' : '#64748B',
                                          border: `1px solid ${(b.is_published === undefined || Number(b.is_published) === 1) ? '#86EFAC' : '#CBD5E1'}`
                                        }}>
                                          {(b.is_published === undefined || Number(b.is_published) === 1) ? 'Published' : 'Draft'}
                                        </span>
                                      )}
                                      <span style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 800 }}>
                                        {b.file_type || (b.tipe === 'buku_kemendikdasmen' ? 'LINK' : 'PDF')}
                                      </span>
                                    </div>
                                  </div>

                                  <h4 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 900, color: 'var(--rb-dark)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                                    {b.judul}
                                  </h4>

                                  <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '0.85rem' }}>
                                    Penulis/Penerbit: <strong style={{ color: 'var(--rb-dark)' }}>{b.penulis || 'PKBM Bina Mandiri'}</strong>
                                  </span>

                                  <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, marginBottom: '1.25rem', minHeight: '44px' }}>
                                    {b.deskripsi}
                                  </p>
                                </div>

                                <div style={{ borderTop: '1.5px dashed #E2E8F0', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <a
                                    href={readUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="retro-btn-action primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontSize: '0.84rem' }}
                                  >
                                    <i className="bi bi-book-half"></i>
                                    <span>{b.tipe === 'buku_kemendikdasmen' ? 'Buka Buku Kemendikdasmen' : 'Baca Modul Pembelajaran'}</span>
                                    <i className="bi bi-box-arrow-up-right"></i>
                                  </a>

                                  {user.role !== 'warga_belajar' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModul(b)}
                                        className="retro-btn-action neutral"
                                        style={{ justifyContent: 'center', padding: '6px 10px', fontSize: '0.78rem' }}
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteModulTarget(b)}
                                        className="retro-btn-action danger"
                                        style={{ justifyContent: 'center', padding: '6px 10px', fontSize: '0.78rem' }}
                                      >
                                        <i className="bi bi-trash3"></i>
                                        <span>Hapus</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────── */}
                  {/* TAB 4: TUGAS MINGGUAN                            */}
                  {/* ──────────────────────────────────────────────── */}
                  {mainTab === 'tugas' && (
                    <div>
                      {/* Tugas Header & Filters */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.22)' }}>
                        <div>
                          <span className="sheet-header-pill">
                            ROOM 4 • PENUGASAN MINGGUAN
                          </span>
                          <h2 className="sheet-header-title">
                            Tugas Mingguan: {mapel?.nama}
                          </h2>
                          <p className="sheet-header-subtitle">
                            Selesaikan tugas mandiri, kumpulkan lembar jawaban, dan pantau koreksi nilai dari tutor.
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => fetchTugasList(null, null, true)}
                            disabled={refreshingTugas}
                            className="sheet-btn-secondary"
                            title="Segarkan daftar tugas tanpa reload browser"
                          >
                            <i className={`bi bi-arrow-clockwise ${refreshingTugas ? 'spin-icon' : ''}`}></i>
                            <span>{refreshingTugas ? 'Menyinkronkan...' : 'Segarkan Tugas'}</span>
                          </button>

                          {user.role !== 'warga_belajar' && (
                            <button
                              type="button"
                              onClick={() => setShowTugasForm(true)}
                              className="sheet-btn-cta"
                            >
                              <i className="bi bi-plus-lg"></i>
                              <span>Buat Tugas Baru</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Modal Form Tambah Tugas */}
                      {showTugasForm && (
                        <div style={{ background: '#FFFFFF', border: '2px solid var(--rb-dark-border)', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '4px 6px 0 var(--rb-dark-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-file-earmark-plus-fill" style={{ fontSize: '1.3rem', color: '#2563EB' }}></i>
                              <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--rb-dark)', margin: 0, fontSize: '1.15rem' }}>
                                Formulir Buat Tugas Belajar Baru
                              </h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="tugas-draft-indicator">
                                <span className="pulsing-dot"></span>
                                <span>Draf Tersimpan Otomatis</span>
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '6px' }}>
                                Tutor & Admin
                              </span>
                            </div>
                          </div>

                          {/* Alert jika draf berhasil dipulihkan */}
                          {hasRestoredDraft && (
                            <div className="draft-recovered-alert">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="bi bi-shield-check" style={{ fontSize: '1.2rem', color: '#16A34A' }}></i>
                                <div>
                                  <strong>Draf Tugas & Soal Dipulihkan:</strong> Draf soal PG atau isian sebelumnya otomatis dipulihkan dari memori browser agar tidak hilang saat keluar atau website error.
                                  {lastDraftSaved && (
                                    <span style={{ opacity: 0.8, fontSize: '0.75rem', marginLeft: '6px' }}>
                                      (Tersimpan: {new Date(lastDraftSaved).toLocaleTimeString('id-ID')})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearDraft}
                                className="btn-clear-draft"
                                title="Hapus draf dan kosongkan form"
                              >
                                <i className="bi bi-trash3"></i>
                                <span>Hapus Draf</span>
                              </button>
                            </div>
                          )}

                          <form onSubmit={handleCreateTugas} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Judul Tugas */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>JUDUL TUGAS *</label>
                              <input
                                type="text"
                                placeholder="Contoh: Latihan Pemahaman Bab 3 & Analisis Soal"
                                value={tugasJudul}
                                onChange={(e) => setTugasJudul(e.target.value)}
                                style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                                required
                              />
                            </div>

                            {/* PILIH JENIS / FORMAT TUGAS */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                                FORMAT & JENIS TUGAS
                              </label>
                              <div className="tugas-type-selector-grid">
                                <button
                                  type="button"
                                  className={`tugas-type-select-card ${tipeTugas === 'upload' ? 'active' : ''}`}
                                  onClick={() => setTipeTugas('upload')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '1.15rem', color: '#059669' }}></i>
                                    <span className="type-title">Upload Foto / Berkas</span>
                                  </div>
                                  <div className="type-desc">Siswa mengunggah foto lembar jawaban, PDF, dokumen Word atau Excel.</div>
                                </button>

                                <button
                                  type="button"
                                  className={`tugas-type-select-card ${tipeTugas === 'pilihan_ganda' ? 'active' : ''}`}
                                  onClick={() => setTipeTugas('pilihan_ganda')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-ui-radios-grid" style={{ fontSize: '1.15rem', color: '#7C3AED' }}></i>
                                    <span className="type-title">Pilihan Ganda (PG)</span>
                                  </div>
                                  <div className="type-desc">Kuis interaktif pilihan A, B, C, D dengan kunci jawaban otomatis di layar.</div>
                                </button>

                                <button
                                  type="button"
                                  className={`tugas-type-select-card ${tipeTugas === 'essay' ? 'active' : ''}`}
                                  onClick={() => setTipeTugas('essay')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-pencil-square" style={{ fontSize: '1.15rem', color: '#2563EB' }}></i>
                                    <span className="type-title">Tugas Essay / Uraian</span>
                                  </div>
                                  <div className="type-desc">Daftar pertanyaan uraian/essay yang dijawab teks langsung oleh siswa.</div>
                                </button>
                              </div>
                            </div>

                            {/* Petunjuk Pengerjaan */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                                PETUNJUK PENGERJAAN & DESKRIPSI TUGAS
                              </label>
                              <textarea
                                placeholder={
                                  tipeTugas === 'pilihan_ganda'
                                    ? 'Tuliskan petunjuk umum mengerjakan soal pilihan ganda...'
                                    : tipeTugas === 'essay'
                                      ? 'Tuliskan instruksi umum mengerjakan soal essay...'
                                      : 'Tuliskan petunjuk pengerjaan dan berkas yang harus diunggah siswa...'
                                }
                                value={tugasDeskripsi}
                                onChange={(e) => setTugasDeskripsi(e.target.value)}
                                rows={3}
                                style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', resize: 'vertical' }}
                              />
                            </div>

                            {/* KHUSUS: BUILDER PILIHAN GANDA */}
                            {tipeTugas === 'pilihan_ganda' && (
                              <div className="soal-builder-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-list-check" style={{ fontSize: '1.1rem' }}></i>
                                    <span>Butir Soal Pilihan Ganda ({soalPG.length} Butir)</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => setShowImportModal(true)}
                                      className="retro-btn-action secondary"
                                      style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F5F3FF', color: '#6D28D9', borderColor: '#DDD6FE' }}
                                      title="Import soal dari file Excel (.xlsx), Word (.docx), atau CSV"
                                    >
                                      <i className="bi bi-file-earmark-arrow-up-fill"></i>
                                      <span>Import File (Excel/Word)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={downloadTemplateExcelSoalPG}
                                      className="retro-btn-action secondary"
                                      style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}
                                      title="Unduh template Excel resmi untuk format soal PG"
                                    >
                                      <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                                      <span>Unduh Template Excel</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleAddSoalPG}
                                      className="retro-btn-action primary"
                                      style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <i className="bi bi-plus-lg"></i>
                                      <span>Tambah Soal</span>
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                  {soalPG.map((soal, sIdx) => (
                                    <div key={sIdx} className="soal-builder-card">
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span className="soal-builder-label">Soal Nomor {sIdx + 1}</span>
                                          <span style={{ fontSize: '0.74rem', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                                            Kunci: Opsi {(soal.kunci || 'a').toUpperCase()}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleDuplicateSoalPG(sIdx)}
                                            className="btn-duplicate-soal"
                                            title="Duplikasi butir soal ini"
                                          >
                                            <i className="bi bi-copy"></i>
                                            <span>Duplikat</span>
                                          </button>
                                          {soalPG.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSoalPG(sIdx)}
                                              className="btn-trash-soal"
                                              title="Hapus butir soal ini"
                                            >
                                              <i className="bi bi-trash3"></i>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <textarea
                                        rows={2}
                                        placeholder={`Tuliskan teks pertanyaan soal nomor ${sIdx + 1}...`}
                                        value={soal.pertanyaan}
                                        onChange={(e) => handleUpdateSoalPG(sIdx, 'pertanyaan', e.target.value)}
                                        style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.86rem', resize: 'vertical', marginBottom: '0.65rem' }}
                                        required
                                      />

                                      <div className="pg-builder-options-grid">
                                        {['a', 'b', 'c', 'd'].map((optKey) => {
                                          const isKey = (soal.kunci || 'a') === optKey;
                                          return (
                                            <div key={optKey} className={`pg-builder-opt-item ${isKey ? 'is-correct-key' : ''}`}>
                                              <span className={`opt-prefix ${isKey ? 'key-active' : ''}`}>{optKey.toUpperCase()}</span>
                                              <input
                                                type="text"
                                                className="opt-input"
                                                placeholder={`Pilihan ${optKey.toUpperCase()}`}
                                                value={soal[`opsi_${optKey}`] || ''}
                                                onChange={(e) => handleUpdateSoalPG(sIdx, `opsi_${optKey}`, e.target.value)}
                                                required
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleUpdateSoalPG(sIdx, 'kunci', optKey)}
                                                className={`btn-toggle-key ${isKey ? 'active' : ''}`}
                                                title={`Klik untuk menetapkan Opsi ${optKey.toUpperCase()} sebagai kunci jawaban`}
                                              >
                                                <i className={`bi ${isKey ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                                <span>{isKey ? 'Kunci Benar' : 'Jadikan Kunci'}</span>
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KHUSUS: BUILDER ESSAY */}
                            {tipeTugas === 'essay' && (
                              <div className="soal-builder-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-card-text" style={{ fontSize: '1.1rem' }}></i>
                                    <span>Daftar Pertanyaan Essay ({soalEssay.length} Butir)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleAddSoalEssay}
                                    className="retro-btn-action primary"
                                    style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <i className="bi bi-plus-lg"></i>
                                    <span>Tambah Pertanyaan</span>
                                  </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                  {soalEssay.map((soal, sIdx) => (
                                    <div key={sIdx} className="soal-builder-card">
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="soal-builder-label" style={{ color: '#1D4ED8', background: '#EFF6FF' }}>
                                          Pertanyaan #{sIdx + 1}
                                        </span>
                                        {soalEssay.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSoalEssay(sIdx)}
                                            className="btn-trash-soal"
                                            title="Hapus pertanyaan essay ini"
                                          >
                                            <i className="bi bi-trash3"></i>
                                          </button>
                                        )}
                                      </div>

                                      <textarea
                                        rows={2}
                                        placeholder={`Tuliskan butir pertanyaan essay nomor ${sIdx + 1}...`}
                                        value={soal.pertanyaan}
                                        onChange={(e) => handleUpdateSoalEssay(sIdx, e.target.value)}
                                        style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.86rem', resize: 'vertical' }}
                                        required
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KHUSUS: INFORMASI MODE UPLOAD */}
                            {tipeTugas === 'upload' && (
                              <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.82rem', color: '#065F46', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <i className="bi bi-info-circle-fill" style={{ fontSize: '1rem', color: '#059669', marginTop: '2px' }}></i>
                                <div>
                                  <strong>Mode Berkas / Foto:</strong> Siswa akan diminta mengunggah foto tugas, berkas PDF, dokumen Word, atau lembar kerja digital mereka. Tutor dapat menuliskan instruksi penugasan pada kolom Petunjuk Pengerjaan di atas.
                                </div>
                              </div>
                            )}

                            {/* DEADLINE & NILAI MAKSIMAL */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>BATAS WAKTU (DEADLINE) *</label>
                                <input
                                  type="datetime-local"
                                  value={tugasDeadline}
                                  onChange={(e) => setTugasDeadline(e.target.value)}
                                  style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                                  required
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>NILAI MAKSIMAL</label>
                                <input
                                  type="number"
                                  value={tugasNilaiMaks}
                                  onChange={(e) => setTugasNilaiMaks(e.target.value)}
                                  min={0}
                                  max={100}
                                  style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                                  required
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                              <button type="button" onClick={() => setShowTugasForm(false)} className="retro-btn-action neutral" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                                Batal
                              </button>
                              <button type="submit" disabled={submittingTugas} className="retro-btn-action primary" style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
                                {submittingTugas ? 'Menyimpan...' : 'Simpan Tugas'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Filter Status Tugas Dropdown (Cute Custom Dropdown) */}
                      <div className="sheet-filter-dropdown-wrapper" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="tugas-filter-select" className="sheet-filter-dropdown-label">
                          <i className="bi bi-funnel-fill"></i>
                          <span>Pilih Status Tugas:</span>
                          <span className="sheet-filter-dropdown-hint">(Klik dropdown untuk memfilter tugas)</span>
                        </label>
                        <div style={{ maxWidth: '400px' }}>
                          <CuteSelect
                            id="tugas-filter-select"
                            value={tugasFilter}
                            onChange={(val) => setTugasFilter(val)}
                            themeColor="blue"
                            icon="bi-clipboard-heart-fill"
                            labelHint="Filter Status Tugas Belajar"
                            options={[
                              { value: 'semua', label: 'Semua Tugas Belajar', icon: 'bi-card-checklist', badge: `${allTugas.length}` },
                              { value: 'belum', label: 'Belum Dikumpul', icon: 'bi-hourglass-split', badge: `${allTugas.filter(t => !t.pengumpulan_saya).length}` },
                              { value: 'terkumpul', label: 'Sudah Dikumpul', icon: 'bi-send-check', badge: `${allTugas.filter(t => !!t.pengumpulan_saya && t.pengumpulan_saya.status !== 'dinilai').length}` },
                              { value: 'dinilai', label: 'Sudah Dinilai', icon: 'bi-patch-check-fill', badge: `${allTugas.filter(t => !!t.pengumpulan_saya && t.pengumpulan_saya.status === 'dinilai').length}` },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Tugas List Sheet Cards */}
                      {filteredTugasList.length === 0 ? (
                        <div className="sheet-empty-state-card">
                          <i className="bi bi-clipboard2-check" style={{ fontSize: '2.5rem', color: '#2563EB', display: 'block', marginBottom: '0.75rem' }}></i>
                          <h4 className="empty-state-title">Tidak Ada Tugas</h4>
                          <p className="empty-state-desc">Belum ada tugas belajar yang dirilis untuk kategori atau status filter ini.</p>
                        </div>
                      ) : (
                        <div className="sheet-tugas-grid">
                          {filteredTugasList.map((t) => {
                            const { cleanDesc, meta } = parseTaskDescription(t.deskripsi);
                            const currentFile = selectedFileMap[t.id] || selectedFile;
                            const currentCatatan = catatanTugasMap[t.id] ?? catatanTugas;

                            return (
                              <div key={t.id} className="tugas-card-sheet">
                                <span className="retro-washi-tape top-left pink"></span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: '0.75rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                      <h4 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 900, color: 'var(--rb-dark)', margin: 0 }}>
                                        {t.judul}
                                      </h4>
                                      {meta.tipe === 'pilihan_ganda' && (
                                        <span className="retro-tag-pill purple">
                                          <i className="bi bi-ui-radios-grid"></i> Pilihan Ganda ({meta.soal_pg?.length || 0} Soal)
                                        </span>
                                      )}
                                      {meta.tipe === 'essay' && (
                                        <span className="retro-tag-pill blue">
                                          <i className="bi bi-pencil-square"></i> Essay ({meta.soal_essay?.length || 0} Soal)
                                        </span>
                                      )}
                                      {meta.tipe === 'upload' && (
                                        <span className="retro-tag-pill mint">
                                          <i className="bi bi-cloud-arrow-up-fill"></i> Upload Berkas (Foto/PDF)
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#BE123C', background: '#FFE4E6', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #FDA4AF' }}>
                                      <i className="bi bi-hourglass-split"></i>
                                      Deadline: {new Date(t.deadline).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  {user.role === 'warga_belajar' ? (
                                    t.pengumpulan_saya ? (
                                      <span className={`retro-tag-pill ${t.pengumpulan_saya.status === 'dinilai' ? 'mint' : 'yellow'}`}>
                                        {t.pengumpulan_saya.status === 'dinilai' ? `Dinilai: ${t.pengumpulan_saya.nilai}` : 'Terkumpul'}
                                      </span>
                                    ) : (
                                      <span className="retro-tag-pill pink">
                                        Belum Dikumpul
                                      </span>
                                    )
                                  ) : (
                                    <span className="retro-tag-pill blue" style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                      <i className="bi bi-people-fill"></i>
                                      <span>{t.jumlah_terkumpul || 0} Pengumpulan</span>
                                    </span>
                                  )}
                                </div>

                                {cleanDesc && (
                                  <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                                    {cleanDesc}
                                  </p>
                                )}

                                {/* Form Pengumpulan atau Feedback */}
                                {user.role !== 'warga_belajar' ? (
                                  <div style={{ background: '#F0F9FF', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#0369A1', fontWeight: 700 }}>
                                      <i className="bi bi-people-fill" style={{ fontSize: '1.15rem', color: '#0284C7' }}></i>
                                      <span>Pengumpulan: <strong>{t.jumlah_terkumpul || 0} Siswa</strong> telah mengumpulkan</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDetailTugas(t)}
                                        className="retro-btn-action primary"
                                        style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                      >
                                        <i className="bi bi-clipboard-check"></i>
                                        <span>Periksa & Beri Nilai</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTugas(t.id, t.judul)}
                                        className="retro-btn-action danger"
                                        style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
                                        title="Hapus tugas ini beserta pengumpulan siswa terkait"
                                      >
                                        <i className="bi bi-trash3-fill"></i>
                                        <span>Hapus Tugas</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : t.pengumpulan_saya ? (
                                  <div style={{ background: '#F0FDF4', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
                                        <i className="bi bi-check-circle-fill"></i>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.92rem', color: '#15803D', fontWeight: 800 }}>
                                          Tugas Selesai Dikumpulkan
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                          {t.pengumpulan_saya.status === 'dinilai' ? (
                                            <span>
                                              Nilai Anda: <strong style={{ fontSize: '0.98rem', color: '#15803D' }}>{t.pengumpulan_saya.nilai}</strong> / {t.nilai_maks || 100}
                                            </span>
                                          ) : (
                                            <span>Status: Menunggu Evaluasi Tutor</span>
                                          )}
                                          {t.pengumpulan_saya.submitted_at && (
                                            <span style={{ color: '#86EFAC' }}>• {new Date(t.pengumpulan_saya.submitted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setReviewTugasModal(t)}
                                      className="retro-btn-action primary"
                                      style={{ padding: '8px 18px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#FFFFFF', borderColor: '#15803D', fontWeight: 800 }}
                                    >
                                      <i className="bi bi-file-earmark-check-fill"></i>
                                      <span>Lihat Hasil & Jawaban</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                                        {meta.tipe === 'pilihan_ganda' ? <i className="bi bi-ui-radios-grid"></i> : meta.tipe === 'essay' ? <i className="bi bi-pencil-square"></i> : <i className="bi bi-cloud-arrow-up"></i>}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E293B' }}>
                                          {meta.tipe === 'pilihan_ganda' ? `${meta.soal_pg?.length || 0} Soal Pilihan Ganda` : meta.tipe === 'essay' ? `${meta.soal_essay?.length || 0} Soal Uraian / Essay` : 'Lembar Unggah Berkas'}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                                          Nilai Maksimal: {t.nilai_maks || 100} Poin
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKerjakanTugas(t)}
                                      className="retro-btn-action primary"
                                      style={{ padding: '8px 22px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                      <span>Kerjakan Tugas</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  </div>
                </div>
              </div>
            )}

          {/* ══ MODAL: IMPORT SOAL DARI EXCEL / WORD / TEKS ══ */}
          {showImportModal && (
            <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
              <div className="import-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="import-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      <i className="bi bi-file-earmark-arrow-up"></i>
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, margin: 0, fontSize: '1.1rem', color: '#1E293B' }}>
                        Import Soal Pilihan Ganda dari Berkas
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                        Unggah file Excel (.xlsx, .xls, .csv) atau Word (.docx, .txt) langsung jadi butir soal PG
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748B' }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                {/* Tabs Panduan & Upload */}
                <div className="import-modal-tabs">
                  <button
                    type="button"
                    className={`import-tab-btn ${importModeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setImportModeTab('upload')}
                  >
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>Unggah Berkas</span>
                  </button>
                  <button
                    type="button"
                    className={`import-tab-btn ${importModeTab === 'excel_guide' ? 'active' : ''}`}
                    onClick={() => setImportModeTab('excel_guide')}
                  >
                    <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                    <span>Format & Template Excel</span>
                  </button>
                  <button
                    type="button"
                    className={`import-tab-btn ${importModeTab === 'word_guide' ? 'active' : ''}`}
                    onClick={() => setImportModeTab('word_guide')}
                  >
                    <i className="bi bi-file-earmark-word-fill"></i>
                    <span>Format Word / Dokumen</span>
                  </button>
                </div>

                <div className="import-modal-body">
                  {/* TAB 1: UPLOAD FILE */}
                  {importModeTab === 'upload' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                          Pilih berkas dari komputer Anda:
                        </span>
                        <button
                          type="button"
                          onClick={downloadTemplateExcelSoalPG}
                          style={{
                            background: '#EFF6FF',
                            border: '1.5px solid #BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="bi bi-download"></i>
                          <span>Unduh Template Excel (.xlsx)</span>
                        </button>
                      </div>

                      <label className="import-dropzone" style={{ display: 'block' }}>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv,.docx,.txt"
                          onChange={handleProcessImportFile}
                          style={{ display: 'none' }}
                        />
                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.8rem' }}>
                          <i className="bi bi-cloud-arrow-up"></i>
                        </div>
                        <h5 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>
                          {importingFile ? 'Menganalisis & Mengekstrak Soal...' : 'Klik untuk Memilih File atau Seret ke Sini'}
                        </h5>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                          Mendukung: Excel (.xlsx, .xls), Word (.docx), CSV, dan Teks (.txt)
                        </p>
                      </label>

                      {importErrorMsg && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="bi bi-exclamation-triangle-fill"></i>
                          <span>{importErrorMsg}</span>
                        </div>
                      )}

                      {/* Preview Hasil Ekstraksi */}
                      {importPreviewData.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="bi bi-check-circle-fill"></i>
                              <span>Berhasil Mengekstrak {importPreviewData.length} Butir Soal!</span>
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              Pratinjau soal di bawah:
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '4px' }}>
                            {importPreviewData.slice(0, 5).map((item, idx) => (
                              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', fontSize: '0.82rem' }}>
                                <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                                  {idx + 1}. {item.pertanyaan}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                                  <div><strong>A:</strong> {item.opsi_a}</div>
                                  <div><strong>B:</strong> {item.opsi_b}</div>
                                  <div><strong>C:</strong> {item.opsi_c}</div>
                                  <div><strong>D:</strong> {item.opsi_d}</div>
                                </div>
                                <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED' }}>
                                  Kunci Jawaban: Opsi {item.kunci?.toUpperCase()}
                                </div>
                              </div>
                            ))}
                            {importPreviewData.length > 5 && (
                              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>
                                + {importPreviewData.length - 5} soal lainnya siap dimasukkan...
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleApplyImportedQuestions(false)}
                              className="retro-btn-action secondary"
                              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                            >
                              <i className="bi bi-plus-circle"></i>
                              <span>Tambahkan ke Soal Saat Ini</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyImportedQuestions(true)}
                              className="retro-btn-action primary"
                              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                            >
                              <i className="bi bi-check2-all"></i>
                              <span>Ganti Semua ({importPreviewData.length} Soal)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: PETUNJUK FORMAT EXCEL */}
                  {importModeTab === 'excel_guide' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                        <h5 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B', margin: 0 }}>
                          Panduan Struktur Kolom File Excel (.xlsx / .csv)
                        </h5>
                        <button
                          type="button"
                          onClick={downloadTemplateExcelSoalPG}
                          style={{
                            background: '#16A34A',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="bi bi-download"></i>
                          <span>Unduh Template Siap Pakai</span>
                        </button>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        File Excel wajib memiliki <strong>7 kolom</strong> pada baris pertama (Header). Sistem akan otomatis membaca nomor, pertanyaan, 4 pilihan, dan kunci jawaban.
                      </p>

                      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                        <table className="guide-table">
                          <thead>
                            <tr>
                              <th>Kolom 1 (No)</th>
                              <th>Kolom 2 (Pertanyaan)</th>
                              <th>Kolom 3 (Pilihan A)</th>
                              <th>Kolom 4 (Pilihan B)</th>
                              <th>Kolom 5 (Pilihan C)</th>
                              <th>Kolom 6 (Pilihan D)</th>
                              <th>Kolom 7 (Kunci)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>1</td>
                              <td>Ibu kota negara Indonesia saat ini adalah...</td>
                              <td>DKI Jakarta</td>
                              <td>Surabaya</td>
                              <td>Bandung</td>
                              <td>Medan</td>
                              <td><strong>A</strong></td>
                            </tr>
                            <tr>
                              <td>2</td>
                              <td>Lambang sila ke-3 Pancasila adalah...</td>
                              <td>Bintang Emas</td>
                              <td>Rantai Baja</td>
                              <td>Pohon Beringin</td>
                              <td>Padi dan Kapas</td>
                              <td><strong>C</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#1E40AF' }}>
                        <strong>Catatan Penting Kunci Jawaban:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                          <li>Kolom Kunci Jawaban dapat diisi huruf: <strong>A</strong>, <strong>B</strong>, <strong>C</strong>, atau <strong>D</strong> (huruf besar maupun kecil).</li>
                          <li>Jika kunci dikosongkan, sistem mengasumsikan default ke Opsi A (dapat diubah nanti di builder).</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PETUNJUK FORMAT WORD / DOKUMEN */}
                  {importModeTab === 'word_guide' && (
                    <div>
                      <h5 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B', marginBottom: '6px' }}>
                        Panduan Format Soal Word (.docx) & Teks (.txt)
                      </h5>
                      <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        Anda dapat menyusun soal langsung di Microsoft Word (.docx) atau Notepad (.txt) dengan penulisan standar bernomor. Contoh format penulisan yang otomatis dikenali:
                      </p>

                      <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#1E293B', whiteSpace: 'pre-line', marginBottom: '1rem' }}>
{`1. Lembaga negara pemegang kekuasaan membentuk Undang-Undang di Indonesia adalah...
A. Dewan Perwakilan Rakyat (DPR)
B. Mahkamah Agung (MA)
C. Mahkamah Konstitusi (MK)
D. Komisi Yudisial (KY)
Kunci: A

2. Gas yang sangat dibutuhkan manusia saat bernapas adalah...
A. Karbon Dioksida
B. Oksigen
C. Nitrogen
D. Metana
Kunci: B`}
                      </div>

                      <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#14532D' }}>
                        <strong>Tips Format:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                          <li>Setiap soal diawali nomor butir (contoh: <code>1.</code> atau <code>1)</code>).</li>
                          <li>Setiap opsi diawali huruf pilihan (contoh: <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code>).</li>
                          <li>Kunci jawaban ditulis di baris berikutnya dengan format <code>Kunci: A</code> atau <code>Jawaban: B</code>.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="retro-btn-action neutral"
                    style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ MODAL: TAMBAH SESI PERTEMUAN (TUTOR / ADMIN) ══ */}
          {showAddPertemuanModal && (
            <div className="retro-modal-overlay">
              <div className="retro-modal-box">
                <div className="retro-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-journal-plus" style={{ fontSize: '1.3rem' }}></i>
                    <h3>Buat Sesi Pertemuan Baru</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPertemuanModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--rb-dark)' }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <form onSubmit={handleCreatePertemuan} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 0 }}>
                  <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>PERTEMUAN KE</label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={newPertemuanKe}
                          onChange={(e) => setNewPertemuanKe(e.target.value)}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>METODE PEMBELAJARAN</label>
                        <select
                          value={newPertemuanMetode}
                          onChange={(e) => setNewPertemuanMetode(e.target.value)}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', background: 'white' }}
                        >
                          <option value="hybrid">Hybrid (Tatap Muka & Online)</option>
                          <option value="online">Online Class (Daring)</option>
                          <option value="offline">Offline Class (Luring)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>JUDUL SESI PERTEMUAN</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pengenalan Konsep & Rumus Dasar"
                        value={newPertemuanJudul}
                        onChange={(e) => setNewPertemuanJudul(e.target.value)}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>TANGGAL PELAKSANAAN</label>
                      <input
                        type="date"
                        value={newPertemuanTanggal}
                        onChange={(e) => setNewPertemuanTanggal(e.target.value)}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>RENCANA MATERI & KOMPETENSI DASAR</label>
                      <textarea
                        placeholder="Tuliskan materi dan kompetensi yang akan dicapai pada sesi ini..."
                        value={newPertemuanRencanaMateri}
                        onChange={(e) => setNewPertemuanRencanaMateri(e.target.value)}
                        rows={3}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', resize: 'vertical' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>PENGUMUMAN KHUSUS (OPSIONAL)</label>
                      <textarea
                        placeholder="Pesan atau pengumuman khusus untuk warga belajar..."
                        value={newPertemuanPengumuman}
                        onChange={(e) => setNewPertemuanPengumuman(e.target.value)}
                        rows={2}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '2px solid var(--rb-dark-border)', background: '#F8FAFC' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddPertemuanModal(false)}
                      className="retro-btn-action neutral"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPertemuan}
                      className="retro-btn-action primary"
                    >
                      {submittingPertemuan ? 'Menyimpan...' : 'Buat Sesi Pertemuan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══ MODAL: TAMBAH / EDIT MODUL & BUKU (ADMIN / TUTOR) ══ */}
          {showModulModal && (
            <div
              className="retro-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowModulModal(false);
              }}
            >
              <div className="retro-modal-box" style={{ maxWidth: '600px' }}>
                <div className="retro-modal-header" style={{ background: '#FEF08A', borderBottom: '2px solid var(--rb-dark-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-journal-plus" style={{ fontSize: '1.25rem', color: '#854D0E' }}></i>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                      {editingModulId ? 'Edit Modul / Buku' : 'Tambah Modul / Buku Baru'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModulModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--rb-dark)' }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <form onSubmit={handleSubmitModul} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 0 }}>
                  <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    
                    {/* Pilihan Sumber / Tipe */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        TIPE / SUMBER BUKU
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setModulFormData({ ...modulFormData, tipe: 'buku_kemendikdasmen' })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: modulFormData.tipe === 'buku_kemendikdasmen' ? '2px solid #EAB308' : '1.5px solid #CBD5E1',
                            background: modulFormData.tipe === 'buku_kemendikdasmen' ? '#FEF9C3' : '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: modulFormData.tipe === 'buku_kemendikdasmen' ? '#854D0E' : '#64748B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="bi bi-link-45deg"></i>
                          <span>Katalog Kemendikdasmen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModulFormData({ ...modulFormData, tipe: 'modul_upload' })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: modulFormData.tipe === 'modul_upload' ? '2px solid #EAB308' : '1.5px solid #CBD5E1',
                            background: modulFormData.tipe === 'modul_upload' ? '#FEF9C3' : '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: modulFormData.tipe === 'modul_upload' ? '#854D0E' : '#64748B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="bi bi-file-earmark-pdf"></i>
                          <span>Unggah File PDF Sendiri</span>
                        </button>
                      </div>
                    </div>

                    {/* Judul */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        JUDUL BUKU / MODUL <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Modul Bahasa Indonesia Kelas 10 Semester 1"
                        value={modulFormData.judul}
                        onChange={(e) => setModulFormData({ ...modulFormData, judul: e.target.value })}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        required
                      />
                    </div>

                    {/* Jenjang & Mapel */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          JENJANG PENDIDIKAN
                        </label>
                        <select
                          value={modulFormData.kategori}
                          onChange={(e) => setModulFormData({ ...modulFormData, kategori: e.target.value })}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 12px', fontSize: '0.88rem', fontWeight: 700 }}
                        >
                          <option value="Semua Jenjang">Semua Jenjang</option>
                          <option value="Paket A">Paket A (Setara SD)</option>
                          <option value="Paket B">Paket B (Setara SMP)</option>
                          <option value="Paket C">Paket C (Setara SMA)</option>
                          <option value="Umum / Keterampilan">Umum / Keterampilan</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          MATA PELAJARAN
                        </label>
                        <input
                          type="text"
                          placeholder="Mata pelajaran"
                          value={modulFormData.mapel}
                          onChange={(e) => setModulFormData({ ...modulFormData, mapel: e.target.value })}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    {/* Penulis / Penerbit & Semester */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          PENULIS / PENERBIT
                        </label>
                        <input
                          type="text"
                          placeholder="Kemendikdasmen / PKBM Bina Mandiri"
                          value={modulFormData.penulis}
                          onChange={(e) => setModulFormData({ ...modulFormData, penulis: e.target.value })}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          SEMESTER
                        </label>
                        <select
                          value={modulFormData.semester}
                          onChange={(e) => setModulFormData({ ...modulFormData, semester: e.target.value })}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 12px', fontSize: '0.88rem', fontWeight: 700 }}
                        >
                          <option value="Semua Semester">Semua Semester</option>
                          <option value="Semester Ganjil">Semester Ganjil</option>
                          <option value="Semester Genap">Semester Genap</option>
                        </select>
                      </div>
                    </div>

                    {/* File Upload OR External URL */}
                    {modulFormData.tipe === 'modul_upload' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          BERKAS MODUL (PDF / DOCX, MAKS. 30MB) {!editingModulId && <span style={{ color: '#EF4444' }}>*</span>}
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          ref={modulFileInputRef}
                          onChange={(e) => setSelectedModulFile(e.target.files?.[0] || null)}
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                        {existingModulFileName && !selectedModulFile && (
                          <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#64748B' }}>
                            File saat ini: <strong>{existingModulFileName}</strong> (biarkan kosong jika tidak ingin mengubah berkas)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                          TAUTAN / URL BUKU DIGITAL KEMENDIKDASMEN
                        </label>
                        <input
                          type="url"
                          placeholder="https://buku.kemendikdasmen.go.id/..."
                          value={modulFormData.url_eksternal}
                          onChange={(e) => setModulFormData({ ...modulFormData, url_eksternal: e.target.value })}
                          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem' }}
                        />
                        <div style={{ marginTop: '4px', fontSize: '0.76rem', color: '#64748B' }}>
                          Default: <a href="https://buku.kemendikdasmen.go.id/" target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>buku.kemendikdasmen.go.id</a>
                        </div>
                      </div>
                    )}

                    {/* Deskripsi */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        DESKRIPSI / RINGKASAN
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ringkasan isi buku, capaian materi, atau tujuan pembelajaran..."
                        value={modulFormData.deskripsi}
                        onChange={(e) => setModulFormData({ ...modulFormData, deskripsi: e.target.value })}
                        style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '10px 14px', fontSize: '0.88rem', resize: 'vertical' }}
                      />
                    </div>

                    {/* Status Terbit */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        STATUS PUBLIKASI
                      </label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#166534' }}>
                          <input
                            type="radio"
                            name="modul_is_published"
                            checked={Number(modulFormData.is_published) === 1}
                            onChange={() => setModulFormData({ ...modulFormData, is_published: 1 })}
                          />
                          Terbitkan (Dapat diakses Siswa)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#64748B' }}>
                          <input
                            type="radio"
                            name="modul_is_published"
                            checked={Number(modulFormData.is_published) === 0}
                            onChange={() => setModulFormData({ ...modulFormData, is_published: 0 })}
                          />
                          Draf (Hanya Admin / Pengajar)
                        </label>
                      </div>
                    </div>

                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '2px solid var(--rb-dark-border)', background: '#F8FAFC' }}>
                    <button
                      type="button"
                      onClick={() => setShowModulModal(false)}
                      className="retro-btn-action neutral"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingModul}
                      className="retro-btn-action primary"
                    >
                      {submittingModul ? 'Menyimpan...' : (editingModulId ? 'Perbarui Modul' : 'Simpan Modul')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══ MODAL: KONFIRMASI HAPUS MODUL & BUKU ══ */}
          {deleteModulTarget && (
            <div
              className="retro-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setDeleteModulTarget(null);
              }}
            >
              <div className="retro-modal-box" style={{ maxWidth: '440px' }}>
                <div className="retro-modal-header" style={{ background: '#FEE2E2', borderBottom: '2px solid var(--rb-dark-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.25rem', color: '#DC2626' }}></i>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991B1B' }}>
                      Konfirmasi Hapus
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteModulTarget(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--rb-dark)' }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
                    Apakah Anda yakin ingin menghapus buku / modul <strong>"{deleteModulTarget.judul}"</strong>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '2px solid var(--rb-dark-border)', background: '#F8FAFC' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteModulTarget(null)}
                    className="retro-btn-action neutral"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteModul}
                    disabled={deletingModul}
                    className="retro-btn-action danger"
                  >
                    {deletingModul ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ MODAL: PERIKSA & BERI NILAI PENGUMPULAN TUGAS (TUTOR / ADMIN - TEMA BIRU SENADA MOCKUP) ══ */}
          {detailTugasModal && (() => {
            const { meta: taskMeta } = parseTaskDescription(detailTugasModal.deskripsi);
            const totalPG = taskMeta.soal_pg?.length || 0;
            const totalEssay = taskMeta.soal_essay?.length || 0;

            const deadlineText = detailTugasModal.deadline && !isNaN(new Date(detailTugasModal.deadline).getTime())
              ? new Date(detailTugasModal.deadline).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'Tidak ada batas';

            return (
              <div
                className="blue-quiz-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setDetailTugasModal(null);
                }}
              >
                <div
                  className="blue-admin-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Glowing background shapes */}
                  <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: -90, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />

                  {/* ── 1. Top App Bar ── */}
                  <div className="blue-quiz-header">
                    <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.25)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                      <i className="bi bi-clipboard-check-fill"></i>
                    </div>

                    <div className="blue-quiz-title-box">
                      <div className="blue-quiz-tag">
                        Penilaian Tugas Tutor
                      </div>
                      <h3 className="blue-quiz-title">
                        {detailTugasModal.judul}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="blue-quiz-nav-btn"
                      onClick={() => setDetailTugasModal(null)}
                      title="Tutup Panel Penilaian"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  {/* ── 2. Scrollable Body ── */}
                  <div className="blue-quiz-scroll-body" style={{ paddingTop: '0.5rem' }}>
                    
                    {/* Sleek Minimal Meta Overview Strip in Pure White Card */}
                    <div style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '14px 18px',
                      boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      color: '#0F172A'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Format Tugas</div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                            {taskMeta.tipe === 'pilihan_ganda' ? `Pilihan Ganda (${totalPG} Soal)` : taskMeta.tipe === 'essay' ? `Essay (${totalEssay} Soal)` : 'Upload Berkas'}
                          </div>
                        </div>
                        <div style={{ width: 1, height: 26, background: '#E2E8F0' }} className="d-none d-sm-block" />
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batas Waktu</div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#BE123C', marginTop: 1 }}>
                            {deadlineText}
                          </div>
                        </div>
                        <div style={{ width: 1, height: 26, background: '#E2E8F0' }} className="d-none d-sm-block" />
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nilai Maksimal</div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#16A34A', marginTop: 1 }}>
                            {detailTugasModal.nilai_maks || 100} Poin
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 800, background: '#EFF6FF', padding: '6px 14px', borderRadius: 999, border: '1px solid #BFDBFE' }}>
                        {detailTugasModal.pengumpulan?.length || 0} Siswa Mengumpulkan
                      </div>
                    </div>

                    {/* Student Submissions List */}
                    {loadingDetailTugas ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', background: '#FFFFFF', borderRadius: '20px', color: '#64748B', boxShadow: '0 8px 22px rgba(15,23,42,0.08)' }}>
                        <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', fontSize: '1.75rem', display: 'inline-block', color: '#2563EB' }}></i>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>Memuat pengumpulan siswa...</p>
                      </div>
                    ) : !detailTugasModal.pengumpulan || detailTugasModal.pengumpulan.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 8px 22px rgba(15,23,42,0.08)' }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.75rem auto' }}>
                          <i className="bi bi-inbox"></i>
                        </div>
                        <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: '0.98rem' }}>Belum Ada Pengumpulan</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Belum ada warga belajar yang mengumpulkan jawaban untuk tugas ini.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {detailTugasModal.pengumpulan.map((p) => {
                          const gradingState = gradingInputMap[p.id] || { nilai: p.nilai ?? '', feedback_tutor: p.feedback_tutor ?? '' };
                          const studentAnswers = extractStudentPGAnswers(detailTugasModal, p, jawabanPGMap);

                          let benarCount = 0;
                          let salahCount = 0;
                          if (taskMeta.tipe === 'pilihan_ganda' && totalPG > 0) {
                            taskMeta.soal_pg.forEach((s, sIdx) => {
                              const qId = s.id !== undefined && s.id !== null ? s.id : (sIdx + 1);
                              const rawUser = studentAnswers[qId] || studentAnswers[String(qId)] || studentAnswers[sIdx + 1] || '';
                              const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
                              const keyAns = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
                              if (userAns && userAns === keyAns) benarCount++;
                              else salahCount++;
                            });
                          }
                          const calculatedAutoScore = totalPG > 0 ? Math.round((benarCount / totalPG) * (detailTugasModal.nilai_maks || 100)) : 100;
                          const isGraded = p.status === 'dinilai' && p.nilai !== null && p.nilai !== undefined && p.nilai !== '';

                          // Inisial avatar
                          const nameWords = (p.nama_lengkap || 'Warga Belajar').trim().split(/\s+/);
                          const initials = nameWords.length > 1 ? (nameWords[0][0] + nameWords[1][0]).toUpperCase() : nameWords[0].slice(0, 2).toUpperCase();

                          return (
                            <div
                              key={p.id}
                              style={{
                                background: '#FFFFFF',
                                borderRadius: '20px',
                                padding: '1.25rem 1.4rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.9rem',
                                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
                                color: '#0F172A'
                              }}
                            >
                              {/* 1. Header Siswa */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: '11px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.92rem', flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                                      {p.nama_lengkap || 'Warga Belajar'}
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 1 }}>
                                      <span>NIS: {p.nis || '-'}</span>
                                      <span>• Dikumpulkan: {p.submitted_at && !isNaN(new Date(p.submitted_at).getTime()) ? new Date(p.submitted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {isGraded ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                      <i className="bi bi-check-circle-fill"></i>
                                      <span>Nilai: <strong>{p.nilai} Poin</strong></span>
                                    </span>
                                  ) : taskMeta.tipe === 'pilihan_ganda' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                      <i className="bi bi-lightning-charge-fill"></i>
                                      <span>Nilai Sistem: <strong>{calculatedAutoScore}</strong></span>
                                    </span>
                                  ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 800, background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE047' }}>
                                      <i className="bi bi-hourglass-split"></i>
                                      <span>Menunggu Dinilai</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 2. Jawaban Siswa */}
                              <div>
                                {/* A. TAMPILAN JAWABAN PILIHAN GANDA (BERSIH & RAPI) */}
                                {taskMeta.tipe === 'pilihan_ganda' && taskMeta.soal_pg && taskMeta.soal_pg.length > 0 ? (
                                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ padding: '8px 14px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: '#1E40AF' }}>
                                      <span>JAWABAN PILIHAN GANDA ({benarCount} dari {totalPG} Soal Benar)</span>
                                      <span style={{ color: '#2563EB' }}>Skor Auto: {calculatedAutoScore} Poin</span>
                                    </div>
                                    <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {taskMeta.soal_pg.map((soal, sIdx) => {
                                        const qId = soal.id !== undefined && soal.id !== null ? soal.id : (sIdx + 1);
                                        const rawUser = studentAnswers[qId] || studentAnswers[String(qId)] || studentAnswers[sIdx + 1] || '';
                                        const userAns = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
                                        const keyAns = String(soal.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
                                        const isCorrect = userAns && userAns === keyAns;
                                        const userAnsText = userAns ? soal[`opsi_${userAns}`] : 'Tidak Dijawab';
                                        const keyAnsText = soal[`opsi_${keyAns}`];

                                        return (
                                          <div
                                            key={qId}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'flex-start',
                                              justifyContent: 'space-between',
                                              padding: '6px 0',
                                              borderBottom: sIdx === totalPG - 1 ? 'none' : '1px solid #E2E8F0',
                                              gap: 10
                                            }}
                                          >
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                                                <span style={{ color: '#64748B', marginRight: 6 }}>{sIdx + 1}.</span>
                                                {soal.pertanyaan}
                                              </div>
                                              <div style={{ fontSize: '0.78rem', marginTop: 3, color: '#475569' }}>
                                                Pilihan Siswa: <strong style={{ color: isCorrect ? '#16A34A' : '#DC2626' }}>{userAns ? `Opsi ${userAns.toUpperCase()} (${userAnsText})` : 'Tidak Dijawab'}</strong>
                                                {!isCorrect && (
                                                  <span style={{ color: '#64748B', marginLeft: 8 }}>
                                                    • Kunci: <strong style={{ color: '#16A34A' }}>Opsi {keyAns.toUpperCase()} ({keyAnsText})</strong>
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <span style={{
                                              fontSize: '0.74rem',
                                              fontWeight: 800,
                                              color: isCorrect ? '#15803D' : '#DC2626',
                                              background: isCorrect ? '#DCFCE7' : '#FEE2E2',
                                              border: `1px solid ${isCorrect ? '#86EFAC' : '#FECACA'}`,
                                              padding: '2px 8px',
                                              borderRadius: 6,
                                              whiteSpace: 'nowrap',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 4
                                            }}>
                                              <i className={`bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                                              <span>{isCorrect ? 'Benar' : 'Salah'}</span>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  /* B. JAWABAN TEKS / ESSAY / CATATAN */
                                  p.catatan_siswa && (
                                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '12px' }}>
                                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <i className="bi bi-journal-text" style={{ color: '#2563EB' }}></i>
                                        <span>Jawaban / Catatan Siswa:</span>
                                      </div>
                                      <div style={{ fontSize: '0.86rem', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                        {p.catatan_siswa}
                                      </div>
                                    </div>
                                  )
                                )}

                                {/* C. BERKAS FILE UPLOAD (Jika Ada) */}
                                {p.path_file && p.path_file !== 'text_submission' && (
                                  <div style={{ marginTop: '0.6rem', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#1E40AF', fontWeight: 700 }}>
                                      <i className="bi bi-file-earmark-check-fill" style={{ fontSize: '1.15rem', color: '#2563EB' }}></i>
                                      <span>{p.nama_file || 'Berkas Jawaban Siswa'}</span>
                                    </div>
                                    <a
                                      href={toAssetUrl(p.path_file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="retro-btn-action primary"
                                      style={{ padding: '5px 14px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 700 }}
                                    >
                                      Buka Berkas
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* 3. Form Penilaian & Feedback Tutor (Clean Layout) */}
                              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                                    Beri Nilai & Feedback Tutor:
                                  </span>
                                  {taskMeta.tipe === 'pilihan_ganda' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGradingInputMap(prev => ({
                                          ...prev,
                                          [p.id]: {
                                            nilai: calculatedAutoScore,
                                            feedback_tutor: calculatedAutoScore === 100 ? 'Luar biasa, nilai sempurna!' : (calculatedAutoScore >= 70 ? 'Bagus, tugas diselesaikan dengan baik.' : 'Perlu belajar lebih giat lagi.')
                                          }
                                        }));
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <i className="bi bi-lightning-charge-fill"></i>
                                      <span>Terapkan Nilai Sistem ({calculatedAutoScore})</span>
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 8, alignItems: 'center' }}>
                                  <div>
                                    <input
                                      type="number"
                                      min={0}
                                      max={detailTugasModal.nilai_maks || 100}
                                      placeholder="Nilai (0-100)"
                                      value={gradingState.nilai}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGradingInputMap(prev => ({
                                          ...prev,
                                          [p.id]: { ...(prev[p.id] || {}), nilai: val }
                                        }));
                                      }}
                                      style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '8px 10px', fontSize: '0.86rem', fontWeight: 800, background: '#FFFFFF', color: '#0F172A' }}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Catatan evaluasi untuk siswa (opsional)..."
                                      value={gradingState.feedback_tutor}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGradingInputMap(prev => ({
                                          ...prev,
                                          [p.id]: { ...(prev[p.id] || {}), feedback_tutor: val }
                                        }));
                                      }}
                                      style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.82rem', background: '#FFFFFF', color: '#0F172A' }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSimpanNilai(p.id)}
                                    disabled={savingGradeId === p.id}
                                    className="retro-btn-action primary"
                                    style={{ padding: '8px 18px', fontSize: '0.82rem', whiteSpace: 'nowrap', fontWeight: 800, background: '#2563EB', borderColor: '#1D4ED8' }}
                                  >
                                    {savingGradeId === p.id ? 'Menyimpan...' : 'Simpan Nilai'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── 3. Bottom Sticky Action Bar ── */}
                  <div className="blue-quiz-footer">
                    <button
                      type="button"
                      className="blue-quiz-btn-primary next"
                      onClick={() => setDetailTugasModal(null)}
                      style={{ width: '100%' }}
                    >
                      <i className="bi bi-check2"></i>
                      <span>Tutup Panel Penilaian</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══ MODAL / DEDICATED VIEW: LEMBAR KERJA TUGAS SISWA (TEMA BIRU SESUAI MOCKUP) ══ */}
          {kerjakanTugasModal && (() => {
            const t = kerjakanTugasModal;
            const { meta, cleanDesc } = parseTaskDescription(t.deskripsi);
            const currentFile = selectedFileMap[t.id] || selectedFile;
            const studentPG = jawabanPGMap[t.id] || {};
            const studentEssay = jawabanEssayMap[t.id] || {};
            const currentCatatan = catatanTugasMap[t.id] ?? catatanTugas ?? '';

            const isPG = meta.tipe === 'pilihan_ganda';
            const isEssay = meta.tipe === 'essay';
            const isUpload = !isPG && !isEssay;

            const questions = isPG ? (meta.soal_pg || []) : isEssay ? (meta.soal_essay || []) : [];
            const totalQuestions = questions.length;

            const curIdx = totalQuestions > 0 ? Math.min(Math.max(0, activeQuizIndex), totalQuestions - 1) : 0;
            const currentSoal = questions[curIdx] || null;

            // Answers count & progress
            const answeredPGCount = Object.keys(studentPG).length;
            const answeredEssayCount = Object.values(studentEssay).filter(v => v && String(v).trim()).length;
            const answeredCount = isPG ? answeredPGCount : isEssay ? answeredEssayCount : (currentFile ? 1 : 0);

            // Progress bar: Mockup shows Question X of Y progress!
            const progressPercent = totalQuestions > 0 ? Math.round(((curIdx + 1) / totalQuestions) * 100) : 100;

            const isLastQuestion = totalQuestions === 0 || curIdx === totalQuestions - 1;

            // Current question identifier and answer
            const currentQId = currentSoal ? (currentSoal.id !== undefined && currentSoal.id !== null ? currentSoal.id : (curIdx + 1)) : null;
            const rawSelected = isPG && currentQId ? (studentPG[currentQId] || studentPG[String(currentQId)] || studentPG[curIdx + 1]) : null;
            const selectedAns = rawSelected ? String(rawSelected).toLowerCase() : '';
            const isCurrentAnswered = isPG ? !!selectedAns : isEssay ? !!(studentEssay[curIdx] && String(studentEssay[curIdx]).trim()) : !!currentFile;

            // Deadline format
            const deadlineDate = t.deadline ? new Date(t.deadline) : null;
            const deadlineText = deadlineDate
              ? deadlineDate.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'Tidak ada batas';

            const handleCloseModal = () => {
              if ((answeredCount > 0 || currentFile) && !window.confirm('Jawaban sementara Anda tersimpan di sesi ini. Tutup lembar pengerjaan?')) return;
              setKerjakanTugasModal(null);
            };

            const handleSubmitQuiz = () => {
              if (totalQuestions > 0 && answeredCount < totalQuestions) {
                const unanswered = totalQuestions - answeredCount;
                if (!window.confirm(`Perhatian: Masih ada ${unanswered} soal yang belum Anda jawab. Yakin ingin mengumpulkan tugas sekarang?`)) {
                  return;
                }
              }
              handleKumpulTugas(t.id);
            };

            return (
              <div className="blue-quiz-overlay" onClick={handleCloseModal}>
                <div
                  className="blue-quiz-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Decorative glowing background circles */}
                  <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: -90, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />

                  {/* ── 1. Top App Bar (Back button, Title, Close button) ── */}
                  <div className="blue-quiz-header">
                    <button
                      type="button"
                      className="blue-quiz-nav-btn"
                      onClick={() => {
                        if (curIdx > 0) {
                          setActiveQuizIndex(prev => Math.max(0, prev - 1));
                        } else {
                          handleCloseModal();
                        }
                      }}
                      title={curIdx > 0 ? "Soal Sebelumnya" : "Tutup"}
                    >
                      <i className="bi bi-arrow-left"></i>
                    </button>

                    <div className="blue-quiz-title-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div className="blue-quiz-tag">
                          {mapel?.nama_mapel || mapel?.nama || 'Quiz & Tugas LMS'}
                        </div>
                        <div className="blue-quiz-autosave-badge" title="Jawaban otomatis tersimpan aman di perangkat Anda secara realtime">
                          <i className="bi bi-shield-check" style={{ color: '#4ADE80' }}></i>
                          <span>Draft Aman</span>
                        </div>
                      </div>
                      <h3 className="blue-quiz-title">
                        {t.judul}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="blue-quiz-nav-btn"
                      onClick={handleCloseModal}
                      title="Tutup Lembar Pengerjaan"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  {/* ── 2. Progress Bar & Question Counter (Like Mockup) ── */}
                  {totalQuestions > 0 && (
                    <div className="blue-quiz-progress-section">
                      {/* High-contrast Lime Progress Bar */}
                      <div className="blue-quiz-progress-track">
                        <div
                          className="blue-quiz-progress-bar"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Question meta row: "Question X of Y" and "Timer/Deadline" */}
                      <div className="blue-quiz-progress-meta">
                        <span>
                          Soal {curIdx + 1} dari {totalQuestions}
                          <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 6 }}>
                            ({answeredCount} terjawab)
                          </span>
                        </span>
                        <div className="blue-quiz-timer-pill" title={`Batas Waktu: ${deadlineText}`}>
                          <i className="bi bi-clock-fill"></i>
                          <span>{deadlineText}</span>
                        </div>
                      </div>

                      {/* Interactive Horizontal Question Pills: 1, 2, 3... */}
                      {totalQuestions > 1 && (
                        <div className="blue-quiz-numbers-strip">
                          {questions.map((q, qIndex) => {
                            const isCur = qIndex === curIdx;
                            const qIdent = q.id !== undefined && q.id !== null ? q.id : (qIndex + 1);
                            const isAns = isPG
                              ? !!(studentPG[qIdent] || studentPG[String(qIdent)] || studentPG[qIndex + 1])
                              : !!(studentEssay[qIndex] && String(studentEssay[qIndex]).trim());

                            return (
                              <button
                                key={qIndex}
                                type="button"
                                className={`blue-quiz-num-pill ${isCur ? 'active' : ''} ${isAns ? 'answered' : ''}`}
                                onClick={() => setActiveQuizIndex(qIndex)}
                                title={`Soal Nomor ${qIndex + 1}${isAns ? ' (Sudah Dijawab)' : ' (Belum Dijawab)'}`}
                              >
                                {qIndex + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 3. Scrollable Quiz Body ── */}
                  <div className="blue-quiz-scroll-body">
                    {/* Petunjuk pengerjaan (jika ada instruksi khusus) */}
                    {cleanDesc && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.16)', borderRadius: '14px', padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#FFFFFF', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', gap: 8, border: '1px solid rgba(255,255,255,0.2)' }}>
                        <i className="bi bi-info-circle-fill" style={{ color: '#FEF08A', marginTop: 1, flexShrink: 0, fontSize: '0.95rem' }}></i>
                        <div style={{ flex: 1, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{cleanDesc}</div>
                      </div>
                    )}

                    {/* A. JIKA TUGAS PILIHAN GANDA (PG) */}
                    {isPG && (!questions || questions.length === 0) && (
                      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '2rem 1.5rem', textAlign: 'center', color: '#64748B', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
                        <i className="bi bi-info-circle-fill" style={{ fontSize: '2rem', color: '#3B82F6', marginBottom: 8, display: 'block' }}></i>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>Belum Ada Butir Soal</div>
                        <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Tutor belum menambahkan butir soal pilihan ganda untuk tugas ini.</div>
                      </div>
                    )}

                    {isPG && currentSoal && (
                      <div>
                        {/* Question White Card */}
                        <div className="blue-quiz-question-box">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Soal Nomor {curIdx + 1}
                            </span>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isCurrentAnswered ? '#16A34A' : '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <i className={`bi ${isCurrentAnswered ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                              {isCurrentAnswered ? `Terpilih: Opsi ${selectedAns.toUpperCase()}` : 'Belum Dijawab'}
                            </span>
                          </div>
                          <div className="blue-quiz-question-text">
                            {currentSoal.pertanyaan}
                          </div>
                        </div>

                        {/* Options Stack (A, B, C, D) - Mockup Faithful */}
                        <div className="blue-quiz-options-list">
                          {['a', 'b', 'c', 'd'].map((optKey) => {
                            const optVal = currentSoal[`opsi_${optKey}`];
                            if (!optVal) return null;
                            const isSelected = selectedAns === optKey;

                            return (
                              <div
                                key={optKey}
                                className={`blue-quiz-option-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  const nextPG = { ...(jawabanPGMap[t.id] || {}), [currentQId]: optKey };
                                  setJawabanPGMap(prev => ({
                                    ...prev,
                                    [t.id]: nextPG
                                  }));
                                  saveQuizDraft(t.id, 'pg', nextPG);
                                }}
                              >
                                <div className="blue-quiz-opt-badge">
                                  {optKey.toUpperCase()}
                                </div>
                                <div className="blue-quiz-opt-text">
                                  {optVal}
                                </div>
                                <div className="blue-quiz-opt-indicator">
                                  {isSelected && <i className="bi bi-check-lg" style={{ strokeWidth: 2 }}></i>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* B. JIKA TUGAS ESSAY / URAIAN */}
                    {isEssay && (!questions || questions.length === 0) && (
                      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '2rem 1.5rem', textAlign: 'center', color: '#64748B', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
                        <i className="bi bi-info-circle-fill" style={{ fontSize: '2rem', color: '#3B82F6', marginBottom: 8, display: 'block' }}></i>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>Belum Ada Pertanyaan Uraian</div>
                        <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Tutor belum menambahkan butir pertanyaan essay untuk tugas ini.</div>
                      </div>
                    )}

                    {isEssay && currentSoal && (
                      <div>
                        {/* Question White Card */}
                        <div className="blue-quiz-question-box">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Soal Uraian Nomor {curIdx + 1}
                            </span>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isCurrentAnswered ? '#16A34A' : '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <i className={`bi ${isCurrentAnswered ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                              {isCurrentAnswered ? 'Sudah Diisi' : 'Belum Diisi'}
                            </span>
                          </div>
                          <div className="blue-quiz-question-text" style={{ textAlign: 'left' }}>
                            {currentSoal.pertanyaan}
                          </div>
                        </div>

                        {/* Essay Textarea Card */}
                        <div className="blue-quiz-essay-box">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
                              <i className="bi bi-pencil-fill" style={{ color: '#2563EB' }}></i>
                              <span>Lembar Jawaban Uraian Anda:</span>
                            </label>
                            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                              {(studentEssay[curIdx] || '').length} Karakter
                            </span>
                          </div>
                          <textarea
                            className="blue-quiz-essay-textarea"
                            rows={6}
                            placeholder={`Tuliskan penjelasan dan uraian lengkap jawaban nomor ${curIdx + 1} di sini...`}
                            value={studentEssay[curIdx] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const nextEssay = { ...(jawabanEssayMap[t.id] || {}), [curIdx]: val };
                              setJawabanEssayMap(prev => ({
                                ...prev,
                                [t.id]: nextEssay
                              }));
                              saveQuizDraft(t.id, 'essay', nextEssay);
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: '0.74rem', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="bi bi-check-circle-fill" style={{ color: '#16A34A', fontSize: '0.8rem' }}></i>
                              Tersimpan otomatis di sesi ini
                            </span>
                            {studentEssay[curIdx] && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextEssay = { ...(jawabanEssayMap[t.id] || {}), [curIdx]: '' };
                                  setJawabanEssayMap(prev => ({
                                    ...prev,
                                    [t.id]: nextEssay
                                  }));
                                  saveQuizDraft(t.id, 'essay', nextEssay);
                                }}
                                style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.74rem', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                              >
                                Bersihkan Jawaban
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* C. JIKA TUGAS UPLOAD BERKAS BIASA */}
                    {isUpload && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="blue-quiz-question-box">
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '3px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'flex-start', marginBottom: 10 }}>
                            Instruksi Lembar Tugas
                          </div>
                          <div className="blue-quiz-question-text" style={{ textAlign: 'left', fontSize: '0.98rem' }}>
                            {cleanDesc || 'Silakan unggah dokumen atau foto lembar kerja tugas mandiri Anda sesuai petunjuk yang diberikan tutor.'}
                          </div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 8px 24px rgba(15,23,42,0.12)', color: '#1E293B' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                            UNGGAH FOTO / BERKAS TUGAS (FOTO, PDF, WORD, EXCEL) *
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                            onChange={(e) => {
                              const f = e.target.files[0];
                              setSelectedFileMap(prev => ({ ...prev, [t.id]: f }));
                              setSelectedFile(f);
                            }}
                            style={{ fontSize: '0.85rem', width: '100%', color: '#0F172A' }}
                          />
                          {currentFile && (
                            <div style={{ marginTop: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-file-earmark-check-fill" style={{ color: '#16A34A', fontSize: '1rem' }}></i>
                                {currentFile.name} ({(currentFile.size / 1024).toFixed(1)} KB)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFileMap(prev => { const n = { ...prev }; delete n[t.id]; return n; });
                                  setSelectedFile(null);
                                }}
                                style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.95rem' }}
                                title="Hapus berkas"
                              >
                                <i className="bi bi-x-circle-fill"></i>
                              </button>
                            </div>
                          )}

                          <div style={{ marginTop: 14 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                              CATATAN UNTUK TUTOR (OPSIONAL)
                            </label>
                            <textarea
                              placeholder="Tuliskan catatan atau pesan tambahan untuk tutor pengampu jika diperlukan..."
                              value={catatanTugasMap[t.id] ?? catatanTugas ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCatatanTugasMap(prev => ({ ...prev, [t.id]: val }));
                                setCatatanTugas(val);
                                saveQuizDraft(t.id, 'catatan', val);
                              }}
                              rows={3}
                              style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* D. Collapsible Lampiran & Catatan Tambahan (Khusus PG & Essay) */}
                    {(isPG || isEssay) && (
                      <div style={{ marginTop: 6, marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => setShowQuizAttachment(!showQuizAttachment)}
                          style={{
                            width: '100%',
                            background: showQuizAttachment ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)',
                            border: '1px dashed rgba(255, 255, 255, 0.4)',
                            borderRadius: '14px',
                            padding: '10px 14px',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backdropFilter: 'blur(6px)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="bi bi-paperclip" style={{ fontSize: '0.95rem' }}></i>
                            <span>{currentFile ? `Lampiran: ${currentFile.name}` : 'Lampiran Berkas / Catatan Tutor (Opsional)'}</span>
                          </span>
                          <i className={`bi ${showQuizAttachment ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </button>

                        {showQuizAttachment && (
                          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', marginTop: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', color: '#1E293B' }}>
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                                LAMPIRKAN FOTO / BERKAS LEMBAR JAWABAN (OPSIONAL)
                              </label>
                              <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                                onChange={(e) => {
                                  const f = e.target.files[0];
                                  setSelectedFileMap(prev => ({ ...prev, [t.id]: f }));
                                  setSelectedFile(f);
                                }}
                                style={{ fontSize: '0.82rem', width: '100%' }}
                              />
                              {currentFile && (
                                <div style={{ marginTop: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="bi bi-file-earmark-check-fill" style={{ color: '#16A34A' }}></i>
                                    {currentFile.name} ({(currentFile.size / 1024).toFixed(1)} KB)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedFileMap(prev => { const n = { ...prev }; delete n[t.id]; return n; });
                                      setSelectedFile(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.9rem' }}
                                    title="Hapus file"
                                  >
                                    <i className="bi bi-x-circle-fill"></i>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                                CATATAN UNTUK TUTOR (OPSIONAL)
                              </label>
                              <textarea
                                placeholder="Tuliskan catatan tambahan jika ada..."
                                value={catatanTugasMap[t.id] ?? catatanTugas ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCatatanTugasMap(prev => ({ ...prev, [t.id]: val }));
                                  setCatatanTugas(val);
                                  saveQuizDraft(t.id, 'catatan', val);
                                }}
                                rows={2}
                                style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '6px 10px', fontSize: '0.82rem', resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── 4. Bottom Sticky Action Bar (Pill button like Mockup "Check") ── */}
                  <div className="blue-quiz-footer">
                    {/* Previous Button (if past first question) */}
                    {totalQuestions > 1 && curIdx > 0 && (
                      <button
                        type="button"
                        className="blue-quiz-btn-prev"
                        onClick={() => setActiveQuizIndex(prev => Math.max(0, prev - 1))}
                      >
                        <i className="bi bi-arrow-left"></i>
                        <span>Sebelumnya</span>
                      </button>
                    )}

                    {/* Next Question or Submit Button */}
                    {!isLastQuestion ? (
                      <button
                        type="button"
                        className="blue-quiz-btn-primary next"
                        onClick={() => setActiveQuizIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                      >
                        <span>Lanjut Soal Berikutnya</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="blue-quiz-btn-primary submit"
                        onClick={handleSubmitQuiz}
                        disabled={submittingTugasId === t.id}
                      >
                        {submittingTugasId === t.id ? (
                          <>
                            <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }}></i>
                            <span>Mengirim Jawaban...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check2-circle" style={{ fontSize: '1.15rem' }}></i>
                            <span>Kumpulkan Tugas Sekarang</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══ MODAL / DEDICATED VIEW: REVIEW HASIL & JAWABAN TUGAS SISWA (TEMA BIRU SENADA KUIS) ══ */}
          {reviewTugasModal && (() => {
            const t = reviewTugasModal;
            const localSub = getStudentLocalSubmission(t.id);
            const p = t.pengumpulan_saya || localSub || {};
            const { meta, cleanDesc } = parseTaskDescription(t.deskripsi);
            const studentAnswers = extractStudentPGAnswers(t, p, jawabanPGMap);

            const totalPG = meta.soal_pg?.length || 0;
            let benarPG = 0;
            let salahPG = 0;
            let tidakDijawabPG = 0;

            if (meta.tipe === 'pilihan_ganda' && totalPG > 0) {
              meta.soal_pg.forEach((s, idx) => {
                const qId = s.id !== undefined && s.id !== null ? s.id : (idx + 1);
                const rawUser = studentAnswers[qId] || studentAnswers[String(qId)] || studentAnswers[idx + 1] || '';
                const userChoice = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
                const keyChoice = String(s.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
                if (!userChoice) {
                  tidakDijawabPG++;
                } else if (userChoice === keyChoice) {
                  benarPG++;
                } else {
                  salahPG++;
                }
              });
            }

            const calculatedNilaiPG = totalPG > 0 ? Math.round((benarPG / totalPG) * (t.nilai_maks || 100)) : 100;
            const isDinilai = (meta.tipe === 'pilihan_ganda') || p.status === 'dinilai' || (p.nilai !== null && p.nilai !== undefined && p.nilai !== '');
            const finalNilai = (p.nilai !== null && p.nilai !== undefined && p.nilai !== '') ? Number(p.nilai) : (meta.tipe === 'pilihan_ganda' ? calculatedNilaiPG : null);

            const nilaiMaks = t.nilai_maks || 100;
            const persentaseNilai = finalNilai !== null ? Math.round((finalNilai / nilaiMaks) * 100) : 0;
            const isLulus = finalNilai !== null && finalNilai >= 70;
            const isSempurna = finalNilai !== null && finalNilai === nilaiMaks;

            const submittedDateText = p.submitted_at && !isNaN(new Date(p.submitted_at).getTime())
              ? new Date(p.submitted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'Baru saja';

            return (
              <div className="blue-quiz-overlay" onClick={() => setReviewTugasModal(null)}>
                <div
                  className="blue-result-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Glowing background shapes */}
                  <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: -90, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(96,165,250,0) 70%)', pointerEvents: 'none', zIndex: 1 }} />

                  {/* ── 1. Top App Bar ── */}
                  <div className="blue-quiz-header">
                    <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.25)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                      <i className="bi bi-award-fill"></i>
                    </div>

                    <div className="blue-quiz-title-box">
                      <div className="blue-quiz-tag">
                        Hasil & Penilaian Tugas
                      </div>
                      <h3 className="blue-quiz-title">
                        {t.judul}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="blue-quiz-nav-btn"
                      onClick={() => setReviewTugasModal(null)}
                      title="Tutup Lembar Hasil"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  {/* ── 2. Scrollable Body ── */}
                  <div className="blue-quiz-scroll-body" style={{ paddingTop: '0.5rem' }}>
                    
                    {/* ── HERO SCORE CARD (Pure White Card matching Mockup result card) ── */}
                    <div className="blue-result-score-hero">
                      {/* Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 14px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: isDinilai ? (isSempurna ? '#FEF3C7' : isLulus ? '#DCFCE7' : '#FEE2E2') : '#EFF6FF',
                          color: isDinilai ? (isSempurna ? '#B45309' : isLulus ? '#15803D' : '#DC2626') : '#1D4ED8',
                          border: `1px solid ${isDinilai ? (isSempurna ? '#FDE68A' : isLulus ? '#86EFAC' : '#FECACA') : '#BFDBFE'}`
                        }}>
                          {isDinilai ? (
                            isSempurna ? (
                              <>
                                <i className="bi bi-trophy-fill" style={{ color: '#D97706' }}></i>
                                <span>Nilai Sempurna! Sangat Memuaskan</span>
                              </>
                            ) : isLulus ? (
                              <>
                                <i className="bi bi-check-circle-fill"></i>
                                <span>Tuntas / Memenuhi KKM</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-journal-bookmark-fill"></i>
                                <span>Perlu Peningkatan Belajar</span>
                              </>
                            )
                          ) : (
                            <>
                              <i className="bi bi-hourglass-split"></i>
                              <span>Tugas Terkumpul • Menunggu Koreksi Tutor</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Score Display */}
                      <div style={{ margin: '8px 0 2px 0' }}>
                        <div style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1, fontFamily: 'Outfit, sans-serif', color: isDinilai ? '#1D4ED8' : '#D97706' }}>
                          {isDinilai ? finalNilai : 'Terkumpul'}
                        </div>
                        {isDinilai && (
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                            dari {nilaiMaks} Nilai Maksimal
                          </div>
                        )}
                      </div>

                      {/* Stat pills (khusus PG) */}
                      {meta.tipe === 'pilihan_ganda' && totalPG > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                          <span style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-check-circle-fill" style={{ color: '#16A34A' }}></i>
                            {benarPG} Benar
                          </span>
                          <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-x-circle-fill" style={{ color: '#DC2626' }}></i>
                            {salahPG} Salah
                          </span>
                          {tidakDijawabPG > 0 && (
                            <span style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-dash-circle"></i>
                              {tidakDijawabPG} Kosong
                            </span>
                          )}
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '5px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-pie-chart-fill" style={{ color: '#2563EB' }}></i>
                            Akurasi {persentaseNilai}%
                          </span>
                        </div>
                      )}

                      <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <i className="bi bi-clock-history"></i>
                        <span>Diserahkan pada: {submittedDateText}</span>
                      </div>
                    </div>

                    {/* ── Feedback Tutor (Jika Ada) ── */}
                    {p.feedback_tutor && (
                      <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '18px', padding: '12px 16px', color: '#92400E', marginBottom: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#B45309' }}>
                          <i className="bi bi-chat-quote-fill" style={{ fontSize: '1rem' }}></i>
                          <span>Catatan & Evaluasi Tutor:</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 600, fontStyle: 'italic' }}>
                          "{p.feedback_tutor}"
                        </div>
                      </div>
                    )}

                    {/* ── Berkas Unggahan Siswa (Jika Ada) ── */}
                    {p.path_file && p.path_file !== 'text_submission' && (
                      <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.06)', color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                            <i className="bi bi-file-earmark-arrow-down-fill"></i>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                              {p.nama_file || 'Berkas Lembar Jawaban'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                              Lampiran berkas siswa
                            </div>
                          </div>
                        </div>
                        <a
                          href={toAssetUrl(p.path_file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="retro-btn-action primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <i className="bi bi-download"></i>
                          <span>Unduh</span>
                        </a>
                      </div>
                    )}

                    {/* ── Section Title: Rincian Pembahasan ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px 4px', color: '#FFFFFF' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-check2-square" style={{ color: '#4ADE80', fontSize: '1.1rem' }}></i>
                        <span>
                          {meta.tipe === 'pilihan_ganda' ? `Pembahasan Soal (${totalPG} Soal)` : 'Catatan Pengerjaan Siswa'}
                        </span>
                      </div>
                      {meta.tipe === 'pilihan_ganda' && (
                        <span style={{ fontSize: '0.78rem', color: '#BFDBFE', fontWeight: 700 }}>
                          {benarPG} Benar • {salahPG} Salah
                        </span>
                      )}
                    </div>

                    {/* ── Detail Per Butir Soal PG ── */}
                    {meta.tipe === 'pilihan_ganda' && meta.soal_pg && meta.soal_pg.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {meta.soal_pg.map((soal, sIdx) => {
                          const qId = soal.id !== undefined && soal.id !== null ? soal.id : (sIdx + 1);
                          const rawUser = studentAnswers[qId] || studentAnswers[String(qId)] || studentAnswers[sIdx + 1] || '';
                          const userChoice = String(rawUser).toLowerCase().replace(/[^a-d]/g, '').slice(0, 1);
                          const keyChoice = String(soal.kunci || 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a';
                          const isCorrect = userChoice && userChoice === keyChoice;
                          const isUnanswered = !userChoice;
                          const poinPerSoal = Math.round((t.nilai_maks || 100) / meta.soal_pg.length);

                          return (
                            <div key={qId} className="blue-result-qcard">
                              {/* Header Card */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 26, height: 26, borderRadius: '8px', background: isCorrect ? '#DCFCE7' : isUnanswered ? '#F1F5F9' : '#FEE2E2', color: isCorrect ? '#15803D' : isUnanswered ? '#64748B' : '#DC2626', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sIdx + 1}
                                  </span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                                    Soal Nomor {sIdx + 1}
                                  </span>
                                </div>

                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '2px 10px',
                                  borderRadius: 999,
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  background: isCorrect ? '#DCFCE7' : isUnanswered ? '#F1F5F9' : '#FEE2E2',
                                  color: isCorrect ? '#15803D' : isUnanswered ? '#64748B' : '#DC2626',
                                  border: `1px solid ${isCorrect ? '#86EFAC' : isUnanswered ? '#E2E8F0' : '#FECACA'}`
                                }}>
                                  {isCorrect ? (
                                    <>
                                      <i className="bi bi-check-circle-fill"></i>
                                      <span>Benar (+{poinPerSoal} Poin)</span>
                                    </>
                                  ) : isUnanswered ? (
                                    <>
                                      <i className="bi bi-dash-circle"></i>
                                      <span>Tidak Dijawab (0 Poin)</span>
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-x-circle-fill"></i>
                                      <span>Kurang Tepat (0 Poin)</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Question prompt */}
                              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-line' }}>
                                {soal.pertanyaan}
                              </div>

                              {/* Options Stack */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {['a', 'b', 'c', 'd'].map((optKey) => {
                                  const optVal = soal[`opsi_${optKey}`];
                                  if (!optVal) return null;
                                  const isUserPick = userChoice === optKey;
                                  const isKeyOpt = keyChoice === optKey;

                                  let optBg = '#F8FAFC';
                                  let optBorder = '1.5px solid #E2E8F0';
                                  let badgeEl = null;

                                  if (isUserPick && isCorrect) {
                                    optBg = '#F0FDF4';
                                    optBorder = '2px solid #16A34A';
                                    badgeEl = (
                                      <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <i className="bi bi-check2"></i> Pilihan Anda (Benar)
                                      </span>
                                    );
                                  } else if (isUserPick && !isCorrect) {
                                    optBg = '#FEF2F2';
                                    optBorder = '2px solid #DC2626';
                                    badgeEl = (
                                      <span style={{ background: '#DC2626', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <i className="bi bi-x-lg"></i> Pilihan Anda (Salah)
                                      </span>
                                    );
                                  } else if (isKeyOpt && !isCorrect) {
                                    optBg = '#F0FDF4';
                                    optBorder = '2px dashed #16A34A';
                                    badgeEl = (
                                      <span style={{ background: '#059669', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <i className="bi bi-key-fill"></i> Kunci Jawaban
                                      </span>
                                    );
                                  }

                                  return (
                                    <div
                                      key={optKey}
                                      style={{
                                        background: optBg,
                                        border: optBorder,
                                        borderRadius: '12px',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        fontSize: '0.88rem'
                                      }}
                                    >
                                      <span style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '8px',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        background: isUserPick && isCorrect ? '#16A34A' : isUserPick && !isCorrect ? '#DC2626' : isKeyOpt ? '#059669' : '#E2E8F0',
                                        color: isUserPick || isKeyOpt ? '#FFFFFF' : '#475569'
                                      }}>
                                        {optKey.toUpperCase()}
                                      </span>
                                      <span style={{ flex: 1, color: isUserPick || isKeyOpt ? '#0F172A' : '#475569', fontWeight: isUserPick || isKeyOpt ? 700 : 500 }}>
                                        {optVal}
                                      </span>
                                      {badgeEl}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation Strip */}
                              <div style={{
                                marginTop: 10,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: isCorrect ? '#F0FDF4' : '#FFF7ED',
                                color: isCorrect ? '#166534' : '#9A3412',
                                border: `1px solid ${isCorrect ? '#BBF7D0' : '#FED7AA'}`
                              }}>
                                <i className={`bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}`}></i>
                                <span>
                                  {isCorrect
                                    ? `Jawaban Anda tepat memilih Opsi ${keyChoice.toUpperCase()} (${soal[`opsi_${keyChoice}`]}).`
                                    : `Kunci jawaban yang benar adalah Opsi ${keyChoice.toUpperCase()} (${soal[`opsi_${keyChoice}`]}).`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Jika Essay atau Catatan Siswa */
                      p.catatan_siswa && (
                        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '14px 16px', boxShadow: '0 6px 18px rgba(15,23,42,0.08)', color: '#0F172A' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-journal-text" style={{ color: '#2563EB' }}></i>
                            <span>Catatan / Jawaban Uraian yang Dikumpulkan:</span>
                          </div>
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', fontSize: '0.88rem', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {p.catatan_siswa}
                          </div>
                        </div>
                      )
                    )}

                  </div>

                  {/* ── 3. Bottom Sticky Action Bar ── */}
                  <div className="blue-quiz-footer">
                    <button
                      type="button"
                      className="blue-quiz-btn-primary next"
                      onClick={() => setReviewTugasModal(null)}
                      style={{ width: '100%' }}
                    >
                      <i className="bi bi-check2"></i>
                      <span>Tutup Lembar Hasil</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}

export default KelasTerpaduSiswa;
