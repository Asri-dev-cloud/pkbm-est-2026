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
              <i className="bi bi-sparkles"></i> {labelHint || 'Pilih Opsi'}
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

  // State Tutor / Admin Melihat & Menilai Pengumpulan Tugas
  const [detailTugasModal, setDetailTugasModal] = useState(null);
  const [loadingDetailTugas, setLoadingDetailTugas] = useState(false);
  const [gradingInputMap, setGradingInputMap] = useState({});
  const [savingGradeId, setSavingGradeId] = useState(null);

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

  // ── 1. Fetch Daftar Pertemuan, Materi, Modul & Tugas ───────
  useEffect(() => {
    const fetchKelasData = async () => {
      try {
        setLoading(true);
        setError('');

        let rombelId = searchParams.get('rombel_id');

        if (!rombelId && user.role === 'warga_belajar') {
          const profilRes = await SiswaAPI.getProfilSaya();
          const profil = profilRes.data.data;
          rombelId = profil?.rombel_id;
        }

        if (!rombelId) {
          setError('Data Rombel tidak ditemukan. Silakan masuk kembali dari halaman Ruang Belajar.');
          return;
        }

        // Ambil info rombel
        try {
          const rRes = await SiswaAPI.getRombelOptions();
          const foundR = (rRes.data?.data || []).find(r => String(r.id) === String(rombelId));
          if (foundR) {
            setRombelDetail(foundR);
          } else {
            const paramRombel = searchParams.get('nama_rombel') || user.nama_rombel;
            if (paramRombel) setRombelDetail({ id: rombelId, nama_rombel: paramRombel, nama: paramRombel });
          }
        } catch {
          const paramRombel = searchParams.get('nama_rombel') || user.nama_rombel;
          if (paramRombel) setRombelDetail({ id: rombelId, nama_rombel: paramRombel, nama: paramRombel });
        }

        // Ambil info mapel spesifik
        const mapelRes = await SiswaAPI.getMapelOptions({ rombel_id: rombelId });
        const currentMapel = mapelRes.data.data?.find(m => String(m.id) === String(mapelId));
        setMapel(currentMapel || { nama: 'Kelas Belajar', kode: 'LMS' });

        // Rekap kehadiran siswa
        if (user.role === 'warga_belajar') {
          await syncRekapKehadiran();
        }

        // 1. Ambil Pertemuan
        const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
        const listPertemuan = pertRes.data.data || [];
        setPertemuans(listPertemuan);
        if (listPertemuan.length > 0) {
          setActivePertemuanId(listPertemuan[0].id);
        }

        // 2. Ambil Semua Materi Belajar Rombel (Diisolasi per Mapel & Rombel Ruang Belajar)
        try {
          const matRes = await LmsAPI.getMateriByRombel(rombelId, { mapel_id: mapelId });
          const matData = matRes.data.data || [];
          setAllMateri(matData);
        } catch {
          setAllMateri([]);
        }

        // 3. Ambil Semua Tugas Mingguan Rombel (Diisolasi per Mapel & Rombel Ruang Belajar)
        try {
          const tugRes = await LmsAPI.getTugasByRombel(rombelId, { mapel_id: mapelId });
          const tugData = tugRes.data.data || [];
          setAllTugas(tugData);
          if (user.role === 'warga_belajar') {
            setTugasStats({
              submitted: tugData.filter(t => !!t.pengumpulan_saya).length,
              total: tugData.length
            });
          }
        } catch {
          setAllTugas([]);
        }

        // 4. Ambil Modul & Buku (Diisolasi per Mapel & Rombel Ruang Belajar)
        try {
          const modRes = user.role !== 'warga_belajar'
            ? await ModulBukuAPI.getAllAdmin({ rombel_id: rombelId, mapel_id: mapelId })
            : await ModulBukuAPI.getPublished({ rombel_id: rombelId, mapel_id: mapelId });
          if (modRes.data?.success && Array.isArray(modRes.data.data) && modRes.data.data.length > 0) {
            setModulBukuList(modRes.data.data);
          } else {
            const localCustom = getLocalCustomModul();
            const merged = [...localCustom, ...DEFAULT_MODUL_BUKU];
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            setModulBukuList(unique);
          }
        } catch {
          const localCustom = getLocalCustomModul();
          const merged = [...localCustom, ...DEFAULT_MODUL_BUKU];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          setModulBukuList(unique);
        }

        // 5. Fetch RPS
        await fetchRps(rombelId);
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

  const handleRemoveSoalPG = (idx) => {
    if (soalPG.length <= 1) return;
    setSoalPG(prev => prev.filter((_, i) => i !== idx));
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

    let rombelId = searchParams.get('rombel_id');
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

      setTugasJudul('');
      setTugasDeskripsi('');
      setTugasDeadline('');
      setTugasNilaiMaks(100);
      setTipeTugas('upload');
      setSoalPG([{ id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }]);
      setSoalEssay([{ id: 1, pertanyaan: '' }]);

      // Refresh list tugas
      const tugRes = await LmsAPI.getTugasByRombel(rombelId, { mapel_id: mapelId });
      setAllTugas(tugRes.data.data || []);

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
    const targetTugas = allTugas.find(t => t.id === tugasId);
    const { meta } = parseTaskDescription(targetTugas?.deskripsi);

    const file = selectedFileMap[tugasId] || selectedFile;
    const catatan = catatanTugasMap[tugasId] || catatanTugas || '';
    const pgAnswers = jawabanPGMap[tugasId] || {};
    const essayAnswers = jawabanEssayMap[tugasId] || {};

    if (meta.tipe === 'pilihan_ganda') {
      const countAnswered = Object.keys(pgAnswers).length;
      if (countAnswered === 0 && !file) {
        alert('Harap pilih jawaban soal pilihan ganda atau unggah foto lembar jawaban Anda.');
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

    setSubmittingTugasId(tugasId);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('catatan_siswa', catatan);

      if (meta.tipe === 'pilihan_ganda' && Object.keys(pgAnswers).length > 0) {
        formData.append('jawaban_pg', JSON.stringify(pgAnswers));
      }
      if (meta.tipe === 'essay' && Object.keys(essayAnswers).length > 0) {
        const textArr = Object.entries(essayAnswers).map(([idx, ans]) => `Soal #${Number(idx) + 1}:\n${ans}`);
        formData.append('jawaban_essay', textArr.join('\n\n'));
      }

      await LmsAPI.kumpulkanTugas(tugasId, formData);
      alert('Tugas Anda berhasil dikumpulkan!');
      
      let rombelId = searchParams.get('rombel_id');
      if (rombelId) {
        const tugRes = await LmsAPI.getTugasByRombel(rombelId, { mapel_id: mapelId });
        const tugData = tugRes.data.data || [];
        setAllTugas(tugData);
        setTugasStats({
          submitted: tugData.filter(t => !!t.pengumpulan_saya).length,
          total: tugData.length
        });
      }

      if (activePertemuanId) {
        const res = await PertemuanAPI.getDetail(activePertemuanId);
        setPertemuanDetail(res.data.data);
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
      setDetailTugasModal(fullTugas);

      const initGrading = {};
      (fullTugas.pengumpulan || []).forEach(p => {
        initGrading[p.id] = {
          nilai: p.nilai ?? '',
          feedback_tutor: p.feedback_tutor ?? ''
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

      // Refresh list allTugas
      let rombelId = searchParams.get('rombel_id');
      if (rombelId) {
        const tugRes = await LmsAPI.getTugasByRombel(rombelId, { mapel_id: mapelId });
        setAllTugas(tugRes.data.data || []);
      }
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

  // Filtered Tugas List
  const filteredTugasList = allTugas.filter(t => {
    if (tugasFilter === 'belum') return !t.pengumpulan_saya;
    if (tugasFilter === 'terkumpul') return !!t.pengumpulan_saya && t.pengumpulan_saya.status !== 'dinilai';
    if (tugasFilter === 'dinilai') return !!t.pengumpulan_saya && t.pengumpulan_saya.status === 'dinilai';
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

                      {/* Modal Form Tambah Tugas */}
                      {showTugasForm && (
                        <div style={{ background: '#FFFFFF', border: '2px solid var(--rb-dark-border)', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '4px 6px 0 var(--rb-dark-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-file-earmark-plus-fill" style={{ fontSize: '1.3rem', color: '#2563EB' }}></i>
                              <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--rb-dark)', margin: 0, fontSize: '1.15rem' }}>
                                Formulir Buat Tugas Belajar Baru
                              </h4>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '6px' }}>
                              Tutor & Admin
                            </span>
                          </div>

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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="bi bi-list-check" style={{ fontSize: '1.1rem' }}></i>
                                    <span>Butir Soal Pilihan Ganda ({soalPG.length} Butir)</span>
                                  </div>
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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                  {soalPG.map((soal, sIdx) => (
                                    <div key={sIdx} className="soal-builder-card">
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="soal-builder-label">Soal Nomor {sIdx + 1}</span>
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

                                      <textarea
                                        rows={2}
                                        placeholder={`Tuliskan teks pertanyaan soal nomor ${sIdx + 1}...`}
                                        value={soal.pertanyaan}
                                        onChange={(e) => handleUpdateSoalPG(sIdx, 'pertanyaan', e.target.value)}
                                        style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.86rem', resize: 'vertical', marginBottom: '0.65rem' }}
                                        required
                                      />

                                      <div className="pg-builder-options-grid">
                                        {['a', 'b', 'c', 'd'].map((optKey) => (
                                          <div key={optKey} className="pg-builder-opt-item">
                                            <span className="opt-prefix">{optKey.toUpperCase()}</span>
                                            <input
                                              type="text"
                                              className="opt-input"
                                              placeholder={`Pilihan ${optKey.toUpperCase()}`}
                                              value={soal[`opsi_${optKey}`] || ''}
                                              onChange={(e) => handleUpdateSoalPG(sIdx, `opsi_${optKey}`, e.target.value)}
                                              required
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.65rem', fontSize: '0.8rem' }}>
                                        <span style={{ fontWeight: 800, color: '#475569' }}>Kunci Jawaban Benar:</span>
                                        <select
                                          value={soal.kunci || 'a'}
                                          onChange={(e) => handleUpdateSoalPG(sIdx, 'kunci', e.target.value)}
                                          style={{ borderRadius: '6px', border: '1.5px solid #CBD5E1', padding: '4px 10px', fontSize: '0.8rem', background: '#FFFFFF', fontWeight: 800, color: '#7C3AED' }}
                                        >
                                          <option value="a">Opsi A</option>
                                          <option value="b">Opsi B</option>
                                          <option value="c">Opsi C</option>
                                          <option value="d">Opsi D</option>
                                        </select>
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

                                  {user.role === 'warga_belajar' && (
                                    t.pengumpulan_saya ? (
                                      <span className={`retro-tag-pill ${t.pengumpulan_saya.status === 'dinilai' ? 'mint' : 'yellow'}`}>
                                        {t.pengumpulan_saya.status === 'dinilai' ? `Dinilai: ${t.pengumpulan_saya.nilai}` : 'Terkumpul'}
                                      </span>
                                    ) : (
                                      <span className="retro-tag-pill pink">
                                        Belum Dikumpul
                                      </span>
                                    )
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
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDetailTugas(t)}
                                      className="retro-btn-action primary"
                                      style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    >
                                      <i className="bi bi-clipboard-check"></i>
                                      <span>Periksa & Beri Nilai</span>
                                    </button>
                                  </div>
                                ) : t.pengumpulan_saya ? (
                                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.86rem' }}>
                                    {t.pengumpulan_saya.path_file && t.pengumpulan_saya.path_file !== 'text_submission' && (
                                      <div style={{ marginBottom: 6 }}>
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>Berkas Jawaban:</span>{' '}
                                        <a href={toAssetUrl(t.pengumpulan_saya.path_file)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          <i className="bi bi-file-earmark-arrow-down-fill"></i>
                                          {t.pengumpulan_saya.nama_file || 'Lihat / Unduh Berkas'}
                                        </a>
                                      </div>
                                    )}
                                    {t.pengumpulan_saya.catatan_siswa && (
                                      <div style={{ marginTop: 6, background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Catatan / Jawaban Anda:</div>
                                        <div style={{ color: 'var(--rb-dark)', whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: '0.85rem' }}>
                                          {t.pengumpulan_saya.catatan_siswa}
                                        </div>
                                      </div>
                                    )}
                                    {t.pengumpulan_saya.feedback_tutor && (
                                      <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', padding: '10px 12px', borderRadius: '10px', marginTop: '8px', color: '#92400E' }}>
                                        <i className="bi bi-chat-quote-fill" style={{ marginRight: 6 }}></i>
                                        <strong>Catatan Evaluasi Tutor:</strong>{' '}
                                        <span>"{t.pengumpulan_saya.feedback_tutor}"</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1.5px dashed #CBD5E1' }}>
                                    {/* 1. TAMPILAN INTERAKTIF PILIHAN GANDA */}
                                    {meta.tipe === 'pilihan_ganda' && meta.soal_pg && meta.soal_pg.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <i className="bi bi-ui-radios-grid"></i>
                                          <span>Lembar Soal Pilihan Ganda ({meta.soal_pg.length} Butir):</span>
                                        </div>
                                        {meta.soal_pg.map((soal, sIdx) => {
                                          const selectedAns = (jawabanPGMap[t.id] || {})[soal.id || sIdx + 1];
                                          return (
                                            <div key={soal.id || sIdx} className="pg-quiz-card">
                                              <div className="pg-quiz-question">
                                                <span className="pg-number-badge">{sIdx + 1}</span>
                                                <span style={{ flex: 1, fontWeight: 700, color: '#1E293B' }}>{soal.pertanyaan}</span>
                                              </div>
                                              <div className="pg-options-grid">
                                                {['a', 'b', 'c', 'd'].map((optKey) => {
                                                  const optVal = soal[`opsi_${optKey}`];
                                                  if (!optVal) return null;
                                                  const isSelected = selectedAns === optKey;
                                                  return (
                                                    <div
                                                      key={optKey}
                                                      className={`pg-option-item ${isSelected ? 'selected' : ''}`}
                                                      onClick={() => {
                                                        setJawabanPGMap(prev => ({
                                                          ...prev,
                                                          [t.id]: { ...(prev[t.id] || {}), [soal.id || sIdx + 1]: optKey }
                                                        }));
                                                      }}
                                                    >
                                                      <span className="pg-option-letter">{optKey.toUpperCase()}</span>
                                                      <span className="pg-option-text">{optVal}</span>
                                                      {isSelected && <i className="bi bi-check-circle-fill" style={{ marginLeft: 'auto', color: '#7C3AED' }}></i>}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* 2. TAMPILAN INTERAKTIF ESSAY */}
                                    {meta.tipe === 'essay' && meta.soal_essay && meta.soal_essay.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <i className="bi bi-pencil-square"></i>
                                          <span>Pertanyaan Essay ({meta.soal_essay.length} Butir):</span>
                                        </div>
                                        {meta.soal_essay.map((soal, sIdx) => (
                                          <div key={soal.id || sIdx} className="essay-question-item">
                                            <div className="essay-question-prompt">
                                              <span className="essay-number-badge">{sIdx + 1}</span>
                                              <span style={{ flex: 1, fontWeight: 700 }}>{soal.pertanyaan}</span>
                                            </div>
                                            <textarea
                                              rows={3}
                                              placeholder={`Ketikkan uraian jawaban nomor ${sIdx + 1} di sini...`}
                                              value={(jawabanEssayMap[t.id] || {})[sIdx] || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setJawabanEssayMap(prev => ({
                                                  ...prev,
                                                  [t.id]: { ...(prev[t.id] || {}), [sIdx]: val }
                                                }));
                                              }}
                                              style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', padding: '8px 12px', fontSize: '0.86rem', resize: 'vertical' }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* 3. INPUT BERKAS (FOTO/PDF/DOC) */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                                        {meta.tipe === 'upload' ? 'UNGGAH BERKAS LEMBAR KERJA (FOTO / PDF / DOKUMEN) *' : 'LAMPIRKAN FOTO / BERKAS LEMBAR JAWABAN (OPSIONAL)'}
                                      </label>
                                      <input
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                                        onChange={(e) => {
                                          const f = e.target.files[0];
                                          setSelectedFileMap(prev => ({ ...prev, [t.id]: f }));
                                          setSelectedFile(f);
                                        }}
                                        style={{ fontSize: '0.85rem', width: '100%', color: 'var(--rb-dark)' }}
                                      />
                                      {currentFile && (
                                        <div className="tugas-file-selected-box">
                                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="bi bi-file-earmark-check-fill" style={{ color: '#059669' }}></i>
                                            {currentFile.name} ({(currentFile.size / 1024).toFixed(1)} KB)
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedFileMap(prev => { const n = { ...prev }; delete n[t.id]; return n; });
                                              setSelectedFile(null);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                                            title="Hapus file"
                                          >
                                            <i className="bi bi-x-circle-fill"></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* CATATAN SISWA */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                      <textarea
                                        placeholder="Tambahkan catatan untuk tutor (opsional)..."
                                        value={catatanTugasMap[t.id] ?? catatanTugas}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCatatanTugasMap(prev => ({ ...prev, [t.id]: val }));
                                          setCatatanTugas(val);
                                        }}
                                        rows={2}
                                        style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: 'var(--rb-dark)', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                                      />
                                    </div>

                                    {/* SUBMIT BUTTON */}
                                    <button
                                      type="button"
                                      onClick={() => handleKumpulTugas(t.id)}
                                      disabled={submittingTugasId === t.id}
                                      className="retro-btn-action primary"
                                      style={{ alignSelf: 'flex-start', padding: '8px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    >
                                      <i className="bi bi-cloud-arrow-up-fill"></i>
                                      <span>
                                        {submittingTugasId === t.id
                                          ? 'Mengirim...'
                                          : meta.tipe === 'pilihan_ganda'
                                            ? 'Kirim Lembar Jawaban PG'
                                            : meta.tipe === 'essay'
                                              ? 'Kirim Jawaban Essay'
                                              : 'Submit Tugas'}
                                      </span>
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

          {/* ══ MODAL: PERIKSA & BERI NILAI PENGUMPULAN TUGAS (TUTOR / ADMIN) ══ */}
          {detailTugasModal && (
            <div
              className="retro-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setDetailTugasModal(null);
              }}
            >
              <div className="retro-modal-box" style={{ maxWidth: '780px', maxHeight: '92vh' }}>
                <div className="retro-modal-header" style={{ background: '#E0F2FE', borderBottom: '2px solid var(--rb-dark-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-clipboard2-check-fill" style={{ fontSize: '1.35rem', color: '#0369A1' }}></i>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0C4A6E' }}>
                        Pengumpulan & Penilaian Tugas
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: 600 }}>
                        {detailTugasModal.judul}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailTugasModal(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--rb-dark)' }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(92vh - 120px)' }}>
                  {/* Task Meta Brief */}
                  <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Format Tugas</div>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                        {(() => {
                          const { meta } = parseTaskDescription(detailTugasModal.deskripsi);
                          if (meta.tipe === 'pilihan_ganda') return `Pilihan Ganda (${meta.soal_pg?.length || 0} Soal)`;
                          if (meta.tipe === 'essay') return `Tugas Essay (${meta.soal_essay?.length || 0} Soal)`;
                          return 'Upload File / Foto';
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Batas Waktu (Deadline)</div>
                      <div style={{ fontWeight: 800, color: '#BE123C', fontSize: '0.88rem' }}>
                        {new Date(detailTugasModal.deadline).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Nilai Maksimal</div>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>
                        {detailTugasModal.nilai_maks || 100} Poin
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Mengumpulkan</div>
                      <div style={{ fontWeight: 800, color: '#2563EB', fontSize: '0.88rem' }}>
                        {detailTugasModal.pengumpulan?.length || 0} Warga Belajar
                      </div>
                    </div>
                  </div>

                  {/* Student Submissions List */}
                  {loadingDetailTugas ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', fontSize: '1.75rem', display: 'inline-block' }}></i>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.86rem' }}>Memuat data pengumpulan siswa...</p>
                    </div>
                  ) : !detailTugasModal.pengumpulan || detailTugasModal.pengumpulan.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1.5px dashed #CBD5E1' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}></i>
                      <h4 style={{ margin: 0, fontWeight: 800, color: '#475569', fontSize: '1rem' }}>Belum Ada Pengumpulan</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Belum ada warga belajar yang mengumpulkan lembar jawaban untuk tugas ini.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {detailTugasModal.pengumpulan.map((p, pIdx) => {
                        const gradingState = gradingInputMap[p.id] || { nilai: p.nilai ?? '', feedback_tutor: p.feedback_tutor ?? '' };
                        return (
                          <div key={p.id} className="grading-student-card">
                            {/* Student Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingBottom: '0.65rem', borderBottom: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                                  {pIdx + 1}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                                    {p.nama_lengkap || 'Warga Belajar'}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                    NIS: {p.nis || '-'} • Dikumpulkan: {p.submitted_at ? new Date(p.submitted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </div>
                                </div>
                              </div>

                              <span className={`retro-tag-pill ${p.status === 'dinilai' ? 'mint' : 'yellow'}`}>
                                {p.status === 'dinilai' ? `Sudah Dinilai: ${p.nilai}` : 'Menunggu Dinilai'}
                              </span>
                            </div>

                            {/* Submitted Content */}
                            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {/* Berkas Upload */}
                              {p.path_file && p.path_file !== 'text_submission' && (
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#1E40AF', fontWeight: 700 }}>
                                    <i className="bi bi-file-earmark-arrow-down-fill" style={{ fontSize: '1.1rem', color: '#2563EB' }}></i>
                                    <span>{p.nama_file || 'Berkas Jawaban Siswa'}</span>
                                  </div>
                                  <a
                                    href={toAssetUrl(p.path_file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="retro-btn-action primary"
                                    style={{ padding: '4px 12px', fontSize: '0.76rem', textDecoration: 'none' }}
                                  >
                                    Buka / Unduh Berkas
                                  </a>
                                </div>
                              )}

                              {/* Teks Jawaban / Catatan Siswa */}
                              {p.catatan_siswa && (
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                                    Jawaban Teks / Catatan Siswa:
                                  </div>
                                  <div style={{ fontSize: '0.84rem', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                    {p.catatan_siswa}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Grading Input Form */}
                            <div style={{ marginTop: '1rem', background: '#FEFCE8', border: '1.5px solid #FEF08A', padding: '10px 14px', borderRadius: '10px' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#854D0E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="bi bi-award-fill"></i>
                                <span>Form Penilaian & Catatan Evaluasi Tutor</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '8px', alignItems: 'center' }}>
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
                                    style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #FCD34D', padding: '7px 10px', fontSize: '0.85rem', fontWeight: 800, background: '#FFFFFF', color: '#713F12' }}
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Tuliskan catatan evaluasi / feedback untuk siswa..."
                                    value={gradingState.feedback_tutor}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setGradingInputMap(prev => ({
                                        ...prev,
                                        [p.id]: { ...(prev[p.id] || {}), feedback_tutor: val }
                                      }));
                                    }}
                                    style={{ width: '100%', borderRadius: '8px', border: '1.5px solid #FCD34D', padding: '7px 12px', fontSize: '0.85rem', background: '#FFFFFF' }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSimpanNilai(p.id)}
                                  disabled={savingGradeId === p.id}
                                  className="retro-btn-action primary"
                                  style={{ padding: '7px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
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
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default KelasTerpaduSiswa;
