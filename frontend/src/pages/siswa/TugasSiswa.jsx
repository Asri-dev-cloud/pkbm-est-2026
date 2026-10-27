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
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ListChecks,
  HelpCircle,
  Edit3,
  Camera,
  Layers,
  CheckSquare,
  Users,
  FileCheck,
  GraduationCap
} from 'lucide-react';
import './TugasSiswa.css';

// Helper parser metadata tugas
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

  const canManage = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'tutor';

  // State Modal Buat Tugas (Khusus Admin / Tutor / Guru)
  const [modalBuatOpen, setModalBuatOpen] = useState(false);
  const [formBuat, setFormBuat] = useState({
    rombel_id: '',
    mapel_id: '',
    judul: '',
    deskripsi: '',
    tipe_tugas: 'upload', // 'upload' | 'essay' | 'pilihan_ganda'
    deadline: '',
    nilai_maks: 100,
    soal_pg: [
      { id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }
    ],
    soal_essay: [
      { id: 1, pertanyaan: '' }
    ]
  });
  const [buatMapelList, setBuatMapelList] = useState([]);
  const [creatingTugas, setCreatingTugas] = useState(false);
  const [createError, setCreateError] = useState('');

  // State modal upload & pengerjaan siswa
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [fileUpload, setFileUpload] = useState(null);
  const [catatanSiswa, setCatatanSiswa] = useState('');
  const [jawabanPG, setJawabanPG] = useState({});
  const [jawabanEssay, setJawabanEssay] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // State Modal Penilaian / Koreksi Jawaban Siswa (Khusus Admin / Tutor)
  const [modalSubmissionsOpen, setModalSubmissionsOpen] = useState(false);
  const [selectedTugasSubmissions, setSelectedTugasSubmissions] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingState, setGradingState] = useState({});
  const [savingGradeId, setSavingGradeId] = useState(null);

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
    let totalPengumpulan = 0;

    tugasList.forEach((t) => {
      const isSubmitted = !!t.pengumpulan_saya;
      const dl = getDeadlineInfo(t.deadline);
      totalPengumpulan += parseInt(t.jumlah_terkumpul || 0, 10);

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
      totalPengumpulan,
      rataNilai,
      percentSelesai,
    };
  }, [tugasList]);

  // Objek Rombel terpilih saat ini
  const selectedRombelObj = useMemo(() => {
    return rombelOptions.find((r) => String(r.id) === String(selectedRombelId));
  }, [rombelOptions, selectedRombelId]);

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

  // ── 6. Handler Buat Tugas Baru (Tutor / Admin / Guru) ───────
  const fetchMapelForBuat = async (rombelId) => {
    if (!rombelId) return;
    try {
      const res = await SiswaAPI.getMapelOptions({ rombel_id: rombelId });
      const list = res.data.data || [];
      setBuatMapelList(list);
      if (list.length > 0 && !formBuat.mapel_id) {
        setFormBuat((prev) => ({ ...prev, mapel_id: list[0].id }));
      }
    } catch {
      setBuatMapelList([]);
    }
  };

  const handleOpenBuatModal = () => {
    const targetRombel = selectedRombelId || (rombelOptions.length > 0 ? rombelOptions[0].id : '');
    setFormBuat({
      rombel_id: targetRombel,
      mapel_id: '',
      judul: '',
      deskripsi: '',
      tipe_tugas: 'upload',
      deadline: '',
      nilai_maks: 100,
      soal_pg: [
        { id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', kunci: 'a' }
      ],
      soal_essay: [
        { id: 1, pertanyaan: '' }
      ]
    });
    setCreateError('');
    if (targetRombel) {
      fetchMapelForBuat(targetRombel);
    }
    setModalBuatOpen(true);
  };

  const handleCloseBuatModal = () => {
    if (creatingTugas) return;
    setModalBuatOpen(false);
    setCreateError('');
  };

  const handleBuatRombelChange = (e) => {
    const rId = e.target.value;
    setFormBuat((prev) => ({ ...prev, rombel_id: rId, mapel_id: '' }));
    fetchMapelForBuat(rId);
  };

  const handleAddSoalPG = () => {
    setFormBuat((prev) => ({
      ...prev,
      soal_pg: [
        ...prev.soal_pg,
        {
          id: prev.soal_pg.length + 1,
          pertanyaan: '',
          opsi_a: '',
          opsi_b: '',
          opsi_c: '',
          opsi_d: '',
          kunci: 'a'
        }
      ]
    }));
  };

  const handleRemoveSoalPG = (idx) => {
    if (formBuat.soal_pg.length <= 1) return;
    setFormBuat((prev) => ({
      ...prev,
      soal_pg: prev.soal_pg.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateSoalPG = (idx, field, val) => {
    setFormBuat((prev) => {
      const updated = [...prev.soal_pg];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, soal_pg: updated };
    });
  };

  const handleAddSoalEssay = () => {
    setFormBuat((prev) => ({
      ...prev,
      soal_essay: [
        ...prev.soal_essay,
        { id: prev.soal_essay.length + 1, pertanyaan: '' }
      ]
    }));
  };

  const handleRemoveSoalEssay = (idx) => {
    if (formBuat.soal_essay.length <= 1) return;
    setFormBuat((prev) => ({
      ...prev,
      soal_essay: prev.soal_essay.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateSoalEssay = (idx, val) => {
    setFormBuat((prev) => {
      const updated = [...prev.soal_essay];
      updated[idx] = { ...updated[idx], pertanyaan: val };
      return { ...prev, soal_essay: updated };
    });
  };

  const handleCreateTugas = async (e) => {
    e.preventDefault();
    if (!formBuat.rombel_id || !formBuat.mapel_id || !formBuat.judul || !formBuat.deadline) {
      setCreateError('Rombel, Mata Pelajaran, Judul, dan Batas Waktu wajib diisi.');
      return;
    }

    if (formBuat.tipe_tugas === 'pilihan_ganda') {
      const validPG = formBuat.soal_pg.filter(s => s.pertanyaan.trim() && s.opsi_a.trim() && s.opsi_b.trim());
      if (validPG.length === 0) {
        setCreateError('Minimal isi 1 soal Pilihan Ganda lengkap dengan pertanyaan dan opsi pilihan.');
        return;
      }
    }

    if (formBuat.tipe_tugas === 'essay') {
      const validEssay = formBuat.soal_essay.filter(s => s.pertanyaan.trim());
      if (validEssay.length === 0 && !formBuat.deskripsi.trim()) {
        setCreateError('Harap tuliskan pertanyaan essay atau petunjuk tugas.');
        return;
      }
    }

    setCreatingTugas(true);
    setCreateError('');

    try {
      await LmsAPI.createTugas({
        rombel_id: parseInt(formBuat.rombel_id),
        mapel_id: parseInt(formBuat.mapel_id),
        judul: formBuat.judul,
        deskripsi: formBuat.deskripsi || 'Silakan kerjakan tugas sesuai instruksi yang diberikan.',
        deadline: formBuat.deadline,
        nilai_maks: parseFloat(formBuat.nilai_maks) || 100,
        tipe_tugas: formBuat.tipe_tugas,
        soal_pg: formBuat.tipe_tugas === 'pilihan_ganda' ? formBuat.soal_pg : [],
        soal_essay: formBuat.tipe_tugas === 'essay' ? formBuat.soal_essay : []
      });

      showToast('🎉 Berhasil! Tugas mingguan baru telah diterbitkan ke database.');
      handleCloseBuatModal();
      await loadTugas(selectedRombelId || formBuat.rombel_id);
    } catch (err) {
      console.error('[handleCreateTugas]', err);
      setCreateError(err.response?.data?.message || 'Gagal membuat tugas. Silakan periksa kembali data input.');
    } finally {
      setCreatingTugas(false);
    }
  };

  // ── 7. Handler Modal Upload & Pengerjaan Siswa ───────────────
  const handleOpenUploadModal = (tugas) => {
    setSelectedTugas(tugas);
    setFileUpload(null);
    setCatatanSiswa(tugas.pengumpulan_saya?.catatan_siswa || '');
    setUploadError('');
    setJawabanPG({});
    setJawabanEssay({});
    setModalUploadOpen(true);
  };

  const handleCloseUploadModal = () => {
    if (submitting) return;
    setModalUploadOpen(false);
    setSelectedTugas(null);
    setFileUpload(null);
    setCatatanSiswa('');
    setJawabanPG({});
    setJawabanEssay({});
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
    const { meta } = parseTaskDescription(selectedTugas.deskripsi);

    // Validasi sesuai tipe tugas
    if (meta.tipe === 'pilihan_ganda') {
      const dijawab = Object.keys(jawabanPG).length;
      if (dijawab === 0 && !fileUpload) {
        setUploadError('Harap pilih jawaban soal pilihan ganda atau unggah foto lembar jawaban Anda.');
        return;
      }
    } else if (meta.tipe === 'essay') {
      const adaTeks = Object.values(jawabanEssay).some(v => v && v.trim());
      if (!adaTeks && !catatanSiswa.trim() && !fileUpload && !selectedTugas.pengumpulan_saya?.path_file) {
        setUploadError('Harap ketik jawaban essay Anda atau unggah berkas/foto lembar jawaban.');
        return;
      }
    } else {
      if (!fileUpload && !selectedTugas.pengumpulan_saya?.path_file) {
        setUploadError('Pilih berkas tugas (Foto / PDF / Dokumen) terlebih dahulu.');
        return;
      }
    }

    setSubmitting(true);
    setUploadError('');

    try {
      const fd = new FormData();
      if (fileUpload) {
        fd.append('file', fileUpload);
      }
      fd.append('catatan_siswa', catatanSiswa);
      if (meta.tipe === 'pilihan_ganda' && Object.keys(jawabanPG).length > 0) {
        fd.append('jawaban_pg', JSON.stringify(jawabanPG));
      }
      if (meta.tipe === 'essay' && Object.keys(jawabanEssay).length > 0) {
        const textArr = Object.entries(jawabanEssay).map(([idx, ans]) => `Soal #${Number(idx) + 1}:\n${ans}`);
        fd.append('jawaban_essay', textArr.join('\n\n'));
      }

      const res = await LmsAPI.kumpulkanTugas(selectedTugas.id, fd);
      const updatedPengumpulan = res.data.data;

      // Update state lokal
      setTugasList((prev) =>
        prev.map((t) =>
          t.id === selectedTugas.id
            ? { ...t, pengumpulan_saya: updatedPengumpulan || { path_file: fileUpload ? 'uploaded' : 'text_submission', nama_file: fileUpload?.name || 'Jawaban Online', catatan_siswa: catatanSiswa, submitted_at: new Date().toISOString() } }
            : t
        )
      );

      handleCloseUploadModal();
      showToast('🎉 Berhasil! Tugas Anda telah tersimpan ke database.');
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

  // ── 6. Handler Pengumpulan & Koreksi Nilai Siswa (Admin / Tutor) ──
  const handleOpenSubmissionsModal = async (tugas) => {
    setSelectedTugasSubmissions(tugas);
    setModalSubmissionsOpen(true);
    setLoadingSubmissions(true);
    try {
      const res = await LmsAPI.getTugasById(tugas.id);
      const detail = res.data.data;
      const list = detail.pengumpulan || [];
      setSubmissionsList(list);

      // Inisialisasi form koreksi nilai & feedback
      const initialGrading = {};
      list.forEach((p) => {
        initialGrading[p.id] = {
          nilai: p.nilai != null ? p.nilai : '',
          feedback_tutor: p.feedback_tutor || ''
        };
      });
      setGradingState(initialGrading);
    } catch (err) {
      console.error('[handleOpenSubmissionsModal] Error:', err);
      showToast('Gagal memuat daftar jawaban siswa untuk tugas ini.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCloseSubmissionsModal = () => {
    setModalSubmissionsOpen(false);
    setSelectedTugasSubmissions(null);
    setSubmissionsList([]);
  };

  const handleGradingChange = (pengumpulanId, field, val) => {
    setGradingState((prev) => ({
      ...prev,
      [pengumpulanId]: {
        ...prev[pengumpulanId],
        [field]: val
      }
    }));
  };

  const handleSaveGrade = async (pengumpulanId) => {
    const data = gradingState[pengumpulanId];
    if (!data || data.nilai === '') {
      showToast('Harap masukkan angka nilai tugas (0 - 100).');
      return;
    }
    setSavingGradeId(pengumpulanId);
    try {
      await LmsAPI.nilaiTugas(pengumpulanId, {
        nilai: parseFloat(data.nilai),
        feedback_tutor: data.feedback_tutor || ''
      });
      setSubmissionsList((prev) =>
        prev.map((p) =>
          p.id === pengumpulanId
            ? { ...p, nilai: parseFloat(data.nilai), feedback_tutor: data.feedback_tutor }
            : p
        )
      );
      showToast('🎉 Berhasil! Nilai dan ulasan tugas siswa telah tersimpan.');
    } catch (err) {
      console.error('[handleSaveGrade] Error:', err);
      showToast(err.response?.data?.message || 'Gagal menyimpan penilaian.');
    } finally {
      setSavingGradeId(null);
    }
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
                  <div className="tugas-hero-badge">
                    <BookOpen size={14} />
                    <span>{isStudent ? 'Portal Tugas Warga Belajar' : 'Panel Manajemen Tugas Tutor & Admin'}</span>
                  </div>
                  <h1 className="tugas-hero-title">
                    {isStudent
                      ? `Halo, ${user?.nama_lengkap || 'Warga Belajar'}!`
                      : 'Manajemen & Monitoring Tugas Mingguan'}
                  </h1>
                  <p className="tugas-hero-desc">
                    {isStudent
                      ? `Kelola dan kumpulkan seluruh tugas mingguan Anda tepat waktu. Dapatkan umpan balik langsung dari tutor untuk memaksimalkan capaian belajar Anda.`
                      : `Kelola penugasan mingguan: terbitkan tugas baru (Berkas, Essay, atau Pilihan Ganda), pantau respon pengumpulan siswa, dan berikan evaluasi nilai secara realtime.`}
                  </p>
                  {canManage && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        className="btn-tambah-tugas-hero"
                        onClick={handleOpenBuatModal}
                      >
                        <Plus size={18} />
                        <span>Buat Tugas Mingguan Baru</span>
                      </button>
                    </div>
                  )}
                </div>

                {isStudent ? (
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
                ) : (
                  <div className="tugas-hero-admin-badge-box">
                    <div className="hero-admin-badge-header">
                      <span className="hero-admin-tag">Status Monitoring</span>
                      <span className="hero-admin-status-dot">● Aktif</span>
                    </div>
                    <div className="hero-admin-stat-main">
                      <div className="hero-admin-stat-num">{stats.totalPengumpulan}</div>
                      <div className="hero-admin-stat-label">Jawaban Siswa Masuk</div>
                    </div>
                    <div className="hero-admin-rombel-summary">
                      <Users size={14} />
                      <span>Rombel: <strong>{selectedRombelObj ? `${selectedRombelObj.nama}` : 'Pilih Rombel'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══ KONTROL ROMBEL KHUSUS TUTOR / ADMIN ═══════════════ */}
            {!isStudent && (
              <div className="tugas-admin-control-card">
                <div className="tugas-admin-control-left">
                  <div className="tugas-admin-icon-pill">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="tugas-admin-control-title">Rombongan Belajar (Rombel) Aktif</div>
                    <div className="tugas-admin-control-subtitle">
                      Pilih rombel untuk menerbitkan tugas baru, melihat tugas aktif, atau mengoreksi nilai siswa.
                    </div>
                  </div>
                </div>
                <div className="tugas-admin-control-right">
                  <div className="tugas-admin-select-wrapper">
                    <label htmlFor="select-rombel" className="tugas-admin-select-label">
                      Rombel:
                    </label>
                    <select
                      id="select-rombel"
                      className="tugas-admin-select"
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
                  <button
                    type="button"
                    className="btn-admin-quick-refresh"
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    title="Segarkan daftar tugas rombel ini"
                  >
                    <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
                    <span>Segarkan Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* ══ 2. RINGKASAN METRIK KARTU ════════════════════════ */}
            {isStudent ? (
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
            ) : (
              <div className="tugas-stats-grid">
                {/* Total Tugas Terbit */}
                <div className="tugas-stat-card">
                  <div className="tugas-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <BookOpen size={22} />
                  </div>
                  <div className="tugas-stat-info">
                    <span className="tugas-stat-val">{stats.total}</span>
                    <span className="tugas-stat-label">Total Tugas Diterbitkan</span>
                  </div>
                </div>

                {/* Jawaban Siswa Masuk */}
                <div className="tugas-stat-card">
                  <div className="tugas-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <FileCheck size={22} />
                  </div>
                  <div className="tugas-stat-info">
                    <span className="tugas-stat-val">{stats.totalPengumpulan}</span>
                    <span className="tugas-stat-label">Jawaban Siswa Masuk</span>
                  </div>
                </div>

                {/* Tipe Penugasan */}
                <div className="tugas-stat-card">
                  <div className="tugas-stat-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                    <Layers size={22} />
                  </div>
                  <div className="tugas-stat-info">
                    <span className="tugas-stat-val">3 Format</span>
                    <span className="tugas-stat-label">Berkas, Essay & PG</span>
                  </div>
                </div>

                {/* Target Rombel */}
                <div className="tugas-stat-card">
                  <div className="tugas-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                    <GraduationCap size={22} />
                  </div>
                  <div className="tugas-stat-info">
                    <span className="tugas-stat-val" style={{ fontSize: '1.2rem' }}>
                      {selectedRombelObj ? selectedRombelObj.nama : '-'}
                    </span>
                    <span className="tugas-stat-label">
                      Jenjang {selectedRombelObj?.jenjang?.toUpperCase() || 'Rombel'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                  const { cleanDesc, meta } = parseTaskDescription(t.deskripsi);

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

                          {/* Chip Tipe Tugas */}
                          {meta.tipe === 'pilihan_ganda' ? (
                            <span className="tugas-type-chip pg">
                              <ListChecks size={13} />
                              <span>Pilihan Ganda ({meta.soal_pg?.length || 0} Soal)</span>
                            </span>
                          ) : meta.tipe === 'essay' ? (
                            <span className="tugas-type-chip essay">
                              <Edit3 size={13} />
                              <span>Tugas Essay</span>
                            </span>
                          ) : (
                            <span className="tugas-type-chip upload">
                              <UploadCloud size={13} />
                              <span>Upload Berkas / Foto</span>
                            </span>
                          )}

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
                      {cleanDesc && (
                        <div className="tugas-desc-box">
                          {isDescOpen || cleanDesc.length <= 220
                            ? cleanDesc
                            : `${cleanDesc.substring(0, 220)}...`}

                          {cleanDesc.length > 220 && (
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

                      {/* Info Pengumpulan Tugas (Khusus Siswa yang Telah Mengumpulkan) */}
                      {isStudent && isSubmitted && (
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
                          {t.pengumpulan_saya.path_file && t.pengumpulan_saya.path_file !== 'text_submission' && (
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
                            <div className="tugas-student-note" style={{ whiteSpace: 'pre-line' }}>
                              {t.pengumpulan_saya.catatan_siswa}
                            </div>
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
                        {!isStudent ? (
                          <div className="tugas-card-admin-actions">
                            <button
                              type="button"
                              className="btn-admin-view-submissions"
                              onClick={() => handleOpenSubmissionsModal(t)}
                            >
                              <Eye size={16} />
                              <span>Lihat Jawaban Siswa ({t.jumlah_terkumpul || 0} Terkumpul)</span>
                            </button>
                            <button
                              type="button"
                              className="btn-admin-preview-test"
                              onClick={() => handleOpenUploadModal(t)}
                              title="Buka form pengerjaan untuk menguji pratinjau dari sudut pandang siswa"
                            >
                              <Sparkles size={15} />
                              <span>Pratinjau Siswa</span>
                            </button>
                          </div>
                        ) : !isSubmitted ? (
                          <button
                            type="button"
                            className="btn-upload-tugas"
                            onClick={() => handleOpenUploadModal(t)}
                          >
                            {meta.tipe === 'pilihan_ganda' ? (
                              <>
                                <ListChecks size={16} />
                                <span>Kerjakan Pilihan Ganda</span>
                              </>
                            ) : meta.tipe === 'essay' ? (
                              <>
                                <Edit3 size={16} />
                                <span>Kerjakan Tugas Essay</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={16} />
                                <span>Kumpulkan Berkas / Foto</span>
                              </>
                            )}
                          </button>
                        ) : !isGraded ? (
                          <button
                            type="button"
                            className="btn-reupload-tugas"
                            onClick={() => handleOpenUploadModal(t)}
                          >
                            <UploadCloud size={15} />
                            <span>Perbarui Jawaban / Berkas</span>
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

            {/* ══ 5. MODAL PENGERJAAN & PENGUMPULAN TUGAS (SISWA) ═════ */}
            {modalUploadOpen && selectedTugas && (() => {
              const { cleanDesc, meta } = parseTaskDescription(selectedTugas.deskripsi);
              return (
                <div
                  className="tugas-modal-overlay"
                  onClick={handleCloseUploadModal}
                  role="dialog"
                  aria-modal="true"
                >
                  <div
                    className="tugas-modal-container"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: meta.tipe === 'pilihan_ganda' ? '760px' : '680px' }}
                  >
                    {/* Modal Header */}
                    <div className="tugas-modal-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          {meta.tipe === 'pilihan_ganda' ? (
                            <span className="tugas-type-chip pg">
                              <ListChecks size={13} />
                              <span>Soal Pilihan Ganda</span>
                            </span>
                          ) : meta.tipe === 'essay' ? (
                            <span className="tugas-type-chip essay">
                              <Edit3 size={13} />
                              <span>Tugas Essay</span>
                            </span>
                          ) : (
                            <span className="tugas-type-chip upload">
                              <UploadCloud size={13} />
                              <span>Upload Berkas / Foto</span>
                            </span>
                          )}
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            Tenggat: {getDeadlineInfo(selectedTugas.deadline).formatted}
                          </span>
                        </div>
                        <h3 className="tugas-modal-title">
                          {meta.tipe === 'pilihan_ganda'
                            ? `Kerjakan Soal Pilihan Ganda`
                            : meta.tipe === 'essay'
                            ? `Kerjakan Tugas Essay`
                            : selectedTugas.pengumpulan_saya ? 'Perbarui Pengumpulan Tugas' : 'Unggah Jawaban Tugas'}
                        </h3>
                        <p className="tugas-modal-sub">
                          {selectedTugas.nama_mapel} • {selectedTugas.judul} (Maks: {Math.round(selectedTugas.nilai_maks || 100)} Poin)
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
                    <div className="tugas-modal-body" style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
                      {uploadError && (
                        <div className="alert alert-danger" style={{ padding: '0.65rem 0.85rem', fontSize: 'var(--text-xs)' }}>
                          <AlertTriangle size={16} />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {/* Instruksi Tugas */}
                      {cleanDesc && (
                        <div className="tugas-instructions-alert">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, marginBottom: '0.35rem', color: '#1E3A8A' }}>
                            <HelpCircle size={15} />
                            <span>Petunjuk Pengerjaan:</span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {cleanDesc}
                          </div>
                        </div>
                      )}

                      {/* MODE 1: PILIHAN GANDA (INTERAKTIF) */}
                      {meta.tipe === 'pilihan_ganda' && meta.soal_pg && meta.soal_pg.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ListChecks size={16} color="#7C3AED" />
                            <span>Daftar Soal Pilihan Ganda ({meta.soal_pg.length} Butir):</span>
                          </div>

                          {meta.soal_pg.map((soal, sIdx) => (
                            <div key={soal.id || sIdx} className="pg-quiz-card">
                              <div className="pg-quiz-question">
                                <span className="pg-number-badge">{sIdx + 1}</span>
                                <span style={{ flex: 1, fontWeight: 700, color: '#1E293B' }}>{soal.pertanyaan}</span>
                              </div>
                              <div className="pg-options-grid">
                                {['a', 'b', 'c', 'd'].map((optKey) => {
                                  const optVal = soal[`opsi_${optKey}`];
                                  if (!optVal) return null;
                                  const isSelected = jawabanPG[soal.id || sIdx + 1] === optKey;
                                  return (
                                    <label
                                      key={optKey}
                                      className={`pg-option-item ${isSelected ? 'selected' : ''}`}
                                      onClick={() => setJawabanPG((prev) => ({ ...prev, [soal.id || sIdx + 1]: optKey }))}
                                    >
                                      <span className="pg-option-letter">{optKey.toUpperCase()}</span>
                                      <span className="pg-option-text">{optVal}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* MODE 2: TUGAS ESSAY */}
                      {meta.tipe === 'essay' && meta.soal_essay && meta.soal_essay.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Edit3 size={16} color="#2563EB" />
                            <span>Pertanyaan Essay:</span>
                          </div>
                          {meta.soal_essay.map((soal, sIdx) => (
                            <div key={soal.id || sIdx} className="essay-question-item">
                              <div className="essay-question-prompt">
                                <span className="essay-number-badge">{sIdx + 1}</span>
                                <span style={{ flex: 1, fontWeight: 700 }}>{soal.pertanyaan}</span>
                              </div>
                              <textarea
                                className="form-input"
                                rows={3}
                                placeholder={`Tuliskan jawaban essay Anda untuk pertanyaan nomor ${sIdx + 1} di sini...`}
                                value={jawabanEssay[sIdx] || ''}
                                onChange={(e) => setJawabanEssay((prev) => ({ ...prev, [sIdx]: e.target.value }))}
                                style={{ fontSize: '0.85rem', marginTop: '0.5rem', resize: 'vertical' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AREA UPLOAD FILE (FOTO/PDF/DOKUMEN) */}
                      <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Camera size={16} color="#059669" />
                          <span>
                            {meta.tipe === 'upload'
                              ? 'Unggah Berkas Tugas (Foto / PDF / Dokumen):'
                              : 'Lampirkan Foto Lembar Jawaban / Berkas PDF (Opsional / Jika Diperlukan):'}
                          </span>
                        </div>

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
                            Tarik & lepaskan file / foto jawaban Anda di sini, atau <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Pilih File</span>
                          </div>
                          <div className="tugas-dropzone-hint">
                            Bisa berupa Foto (.jpg, .jpeg, .png), PDF, Word (.docx), atau Excel. Maksimal 15 MB.
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
                          <div className="tugas-file-preview-card" style={{ marginTop: '0.75rem' }}>
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
                      </div>

                      {/* Catatan untuk Tutor */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                          Catatan Tambahan untuk Tutor (Opsional)
                        </label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Tuliskan catatan tambahan jika ada..."
                          value={catatanSiswa}
                          onChange={(e) => setCatatanSiswa(e.target.value)}
                          disabled={submitting}
                          style={{ fontSize: 'var(--text-xs)', resize: 'vertical' }}
                        />
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
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="spinner-sm" />
                            <span>Menyimpan ke Database...</span>
                          </>
                        ) : (
                          <>
                            <Send size={15} />
                            <span>Kirim & Simpan Jawaban</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══ 6. MODAL BUAT TUGAS BARU (TUTOR / ADMIN / GURU) ═══════ */}
            {modalBuatOpen && (
              <div
                className="tugas-modal-overlay"
                onClick={handleCloseBuatModal}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="tugas-modal-container"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '820px' }}
                >
                  {/* Modal Header */}
                  <div className="tugas-modal-header">
                    <div>
                      <h3 className="tugas-modal-title">
                        + Buat Tugas Mingguan Baru
                      </h3>
                      <p className="tugas-modal-sub">
                        Tugas akan tersimpan langsung di database dan dapat diakses siswa dari HP maupun desktop.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tugas-modal-close"
                      onClick={handleCloseBuatModal}
                      aria-label="Tutup jendela"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleCreateTugas}>
                    <div className="tugas-modal-body" style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
                      {createError && (
                        <div className="alert alert-danger" style={{ padding: '0.65rem 0.85rem', fontSize: 'var(--text-xs)' }}>
                          <AlertTriangle size={16} />
                          <span>{createError}</span>
                        </div>
                      )}

                      {/* Baris 1: Rombel & Mata Pelajaran */}
                      <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                            Target Rombel Belajar *
                          </label>
                          <select
                            className="form-input"
                            value={formBuat.rombel_id}
                            onChange={handleBuatRombelChange}
                            required
                          >
                            <option value="">-- Pilih Rombel --</option>
                            {rombelOptions.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nama} ({r.jenjang?.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                            Mata Pelajaran *
                          </label>
                          <select
                            className="form-input"
                            value={formBuat.mapel_id}
                            onChange={(e) => setFormBuat((prev) => ({ ...prev, mapel_id: e.target.value }))}
                            required
                          >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {buatMapelList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nama}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Baris 2: Judul Tugas */}
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                          Judul Tugas Mingguan *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: Tugas Minggu 3: Analisis Ekosistem & Keanekaragaman Hayati"
                          value={formBuat.judul}
                          onChange={(e) => setFormBuat((prev) => ({ ...prev, judul: e.target.value }))}
                          required
                        />
                      </div>

                      {/* Baris 3: Deadline & Nilai Maksimal */}
                      <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                            Batas Waktu Pengumpulan (Deadline) *
                          </label>
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={formBuat.deadline}
                            onChange={(e) => setFormBuat((prev) => ({ ...prev, deadline: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                            Bobot Nilai Maksimal
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            className="form-input"
                            value={formBuat.nilai_maks}
                            onChange={(e) => setFormBuat((prev) => ({ ...prev, nilai_maks: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Baris 4: Pemilihan Tipe Tugas */}
                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', marginBottom: '0.5rem', display: 'block' }}>
                          Pilih Jenis / Format Tugas:
                        </label>
                        <div className="tugas-type-selector-grid">
                          <button
                            type="button"
                            className={`tugas-type-select-card ${formBuat.tipe_tugas === 'upload' ? 'active' : ''}`}
                            onClick={() => setFormBuat((prev) => ({ ...prev, tipe_tugas: 'upload' }))}
                          >
                            <UploadCloud size={22} className="type-icon" />
                            <div className="type-title">Upload Berkas / Foto</div>
                            <div className="type-desc">Siswa mengunggah foto lembar tugas, PDF, Word, atau Excel.</div>
                          </button>

                          <button
                            type="button"
                            className={`tugas-type-select-card ${formBuat.tipe_tugas === 'essay' ? 'active' : ''}`}
                            onClick={() => setFormBuat((prev) => ({ ...prev, tipe_tugas: 'essay' }))}
                          >
                            <Edit3 size={22} className="type-icon" />
                            <div className="type-title">Tugas Essay</div>
                            <div className="type-desc">Siswa menjawab teks pertanyaan essay dan/atau melampirkan foto.</div>
                          </button>

                          <button
                            type="button"
                            className={`tugas-type-select-card ${formBuat.tipe_tugas === 'pilihan_ganda' ? 'active' : ''}`}
                            onClick={() => setFormBuat((prev) => ({ ...prev, tipe_tugas: 'pilihan_ganda' }))}
                          >
                            <ListChecks size={22} className="type-icon" />
                            <div className="type-title">Pilihan Ganda</div>
                            <div className="type-desc">Kuis interaktif pilihan ganda A, B, C, D di layar siswa.</div>
                          </button>
                        </div>
                      </div>

                      {/* Deskripsi / Petunjuk Umum */}
                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                          Petunjuk & Instruksi Tugas *
                        </label>
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="Jelaskan petunjuk pengerjaan tugas secara rinci untuk warga belajar..."
                          value={formBuat.deskripsi}
                          onChange={(e) => setFormBuat((prev) => ({ ...prev, deskripsi: e.target.value }))}
                          required
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      {/* KHUSUS: BUILDER SOAL PILIHAN GANDA */}
                      {formBuat.tipe_tugas === 'pilihan_ganda' && (
                        <div className="builder-section">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ListChecks size={18} />
                              <span>Butir Soal Pilihan Ganda ({formBuat.soal_pg.length})</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={handleAddSoalPG}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Plus size={14} />
                              <span>Tambah Soal</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formBuat.soal_pg.map((soal, sIdx) => (
                              <div key={sIdx} className="soal-builder-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span className="soal-builder-label">Nomor {sIdx + 1}</span>
                                  {formBuat.soal_pg.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSoalPG(sIdx)}
                                      className="btn-trash-soal"
                                      title="Hapus butir soal ini"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                <textarea
                                  className="form-input"
                                  rows={2}
                                  placeholder={`Tuliskan teks pertanyaan soal nomor ${sIdx + 1}...`}
                                  value={soal.pertanyaan}
                                  onChange={(e) => handleUpdateSoalPG(sIdx, 'pertanyaan', e.target.value)}
                                  required
                                  style={{ marginBottom: '0.65rem' }}
                                />

                                <div className="pg-builder-options-grid">
                                  {['a', 'b', 'c', 'd'].map((optKey) => (
                                    <div key={optKey} className="pg-builder-opt-item">
                                      <span className="opt-prefix">{optKey.toUpperCase()}</span>
                                      <input
                                        type="text"
                                        className="form-input opt-input"
                                        placeholder={`Teks pilihan ${optKey.toUpperCase()}`}
                                        value={soal[`opsi_${optKey}`]}
                                        onChange={(e) => handleUpdateSoalPG(sIdx, `opsi_${optKey}`, e.target.value)}
                                        required
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.65rem', fontSize: 'var(--text-xs)' }}>
                                  <span style={{ fontWeight: 700, color: '#475569' }}>Kunci Jawaban Benar:</span>
                                  <select
                                    className="form-input"
                                    style={{ width: 'auto', padding: '4px 10px', fontSize: 'var(--text-xs)', height: 'auto' }}
                                    value={soal.kunci}
                                    onChange={(e) => handleUpdateSoalPG(sIdx, 'kunci', e.target.value)}
                                  >
                                    <option value="a">A</option>
                                    <option value="b">B</option>
                                    <option value="c">C</option>
                                    <option value="d">D</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KHUSUS: BUILDER SOAL ESSAY */}
                      {formBuat.tipe_tugas === 'essay' && (
                        <div className="builder-section">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Edit3 size={18} />
                              <span>Pertanyaan Essay ({formBuat.soal_essay.length})</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={handleAddSoalEssay}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Plus size={14} />
                              <span>Tambah Pertanyaan</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {formBuat.soal_essay.map((soal, sIdx) => (
                              <div key={sIdx} className="soal-builder-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span className="soal-builder-label">Pertanyaan #{sIdx + 1}</span>
                                  {formBuat.soal_essay.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSoalEssay(sIdx)}
                                      className="btn-trash-soal"
                                      title="Hapus pertanyaan ini"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  className="form-input"
                                  rows={2}
                                  placeholder={`Tuliskan instruksi pertanyaan essay nomor ${sIdx + 1}...`}
                                  value={soal.pertanyaan}
                                  onChange={(e) => handleUpdateSoalEssay(sIdx, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="tugas-modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCloseBuatModal}
                        disabled={creatingTugas}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={creatingTugas}
                      >
                        {creatingTugas ? (
                          <>
                            <div className="spinner-sm" />
                            <span>Menerbitkan Tugas...</span>
                          </>
                        ) : (
                          <>
                            <Send size={15} />
                            <span>Terbitkan Tugas Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ══ 6. MODAL DAFTAR PENGUMPULAN & KOREKSI NILAI (ADMIN/TUTOR) ══ */}
            {modalSubmissionsOpen && selectedTugasSubmissions && (
              <div
                className="tugas-modal-overlay"
                onClick={handleCloseSubmissionsModal}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="tugas-modal-container submissions-modal-container"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '840px' }}
                >
                  {/* Modal Header */}
                  <div className="tugas-modal-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span className="tugas-subject-chip">
                          <BookOpen size={13} />
                          <span>{selectedTugasSubmissions.nama_mapel}</span>
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          Tenggat: {getDeadlineInfo(selectedTugasSubmissions.deadline).formatted}
                        </span>
                      </div>
                      <h3 className="tugas-modal-title">
                        Evaluasi Pengumpulan Siswa
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        Tugas: <strong>{selectedTugasSubmissions.judul}</strong> &bull; Nilai Maks: <strong>{selectedTugasSubmissions.nilai_maks || 100}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tugas-modal-close"
                      onClick={handleCloseSubmissionsModal}
                      aria-label="Tutup modal pengumpulan"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="tugas-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                    {loadingSubmissions ? (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          Memuat data pengumpulan tugas dari siswa...
                        </p>
                      </div>
                    ) : submissionsList.length === 0 ? (
                      <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px dashed #CBD5E1' }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: '#EFF6FF',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                          }}
                        >
                          <Users size={30} />
                        </div>
                        <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: '0.4rem', fontSize: '1.1rem' }}>
                          Belum Ada Siswa Mengumpulkan
                        </h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: 440, margin: '0 auto' }}>
                          Belum ada kiriman berkas atau lembar jawaban masuk dari siswa rombel ini. Jawaban yang dikirimkan siswa akan langsung muncul di sini secara otomatis.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#334155' }}>
                            Daftar Pengumpulan ({submissionsList.length} Siswa)
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {submissionsList.filter(s => s.nilai != null).length} dari {submissionsList.length} telah dinilai
                          </span>
                        </div>

                        {submissionsList.map((sub, sIdx) => {
                          const isGraded = sub.nilai != null;
                          const currentGrading = gradingState[sub.id] || { nilai: '', feedback_tutor: '' };
                          const isSaving = savingGradeId === sub.id;

                          return (
                            <div key={sub.id || sIdx} className="submission-student-card">
                              {/* Header Baris Siswa */}
                              <div className="submission-student-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div className="student-avatar-badge">
                                    {(sub.nama_lengkap || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="student-name-text">{sub.nama_lengkap || 'Warga Belajar'}</div>
                                    <div className="student-nis-text">NIS: {sub.nis || '-'}</div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  {isGraded ? (
                                    <span className="badge-grade-status graded">
                                      <CheckCircle2 size={13} />
                                      <span>Ternilai: {sub.nilai}</span>
                                    </span>
                                  ) : (
                                    <span className="badge-grade-status pending">
                                      <Clock size={13} />
                                      <span>Menunggu Koreksi</span>
                                    </span>
                                  )}
                                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                    {sub.submitted_at
                                      ? new Date(sub.submitted_at).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                      : '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Isi Pengumpulan: Berkas / Teks / Catatan */}
                              <div className="submission-content-area">
                                {sub.path_file && sub.path_file !== 'text_submission' && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                                      Berkas / Foto Jawaban Siswa:
                                    </span>
                                    <a
                                      href={toAssetUrl(sub.path_file)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="tugas-file-badge"
                                      style={{ display: 'inline-flex' }}
                                      title="Klik untuk membuka/mengunduh berkas jawaban"
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                        {renderFileIcon(sub.nama_file)}
                                        <span>{sub.nama_file || 'Unduh Berkas Siswa'}</span>
                                      </div>
                                      <Download size={14} />
                                    </a>
                                  </div>
                                )}

                                {sub.catatan_siswa && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                                      Jawaban Teks / Catatan Pengumpulan:
                                    </span>
                                    <div className="submission-text-display">
                                      {sub.catatan_siswa}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Form Koreksi Nilai & Catatan Evaluasi Inline */}
                              <div className="submission-grade-action-box">
                                <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: '#1E293B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Award size={14} color="#059669" />
                                  <span>Penilaian & Ulasan Tutor</span>
                                </div>

                                <div className="grade-inputs-grid">
                                  <div style={{ width: '130px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>
                                      Nilai (Maks {selectedTugasSubmissions.nilai_maks || 100}):
                                    </label>
                                    <input
                                      type="number"
                                      className="form-input"
                                      placeholder="0 - 100"
                                      min={0}
                                      max={selectedTugasSubmissions.nilai_maks || 100}
                                      value={currentGrading.nilai}
                                      onChange={(e) => handleGradingChange(sub.id, 'nilai', e.target.value)}
                                      style={{ fontWeight: 800, fontSize: '0.95rem' }}
                                    />
                                  </div>

                                  <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>
                                      Ulasan / Masukan Perbaikan Tutor:
                                    </label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="Tuliskan apresiasi atau poin saran perbaikan untuk siswa..."
                                      value={currentGrading.feedback_tutor}
                                      onChange={(e) => handleGradingChange(sub.id, 'feedback_tutor', e.target.value)}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handleSaveGrade(sub.id)}
                                      disabled={isSaving}
                                      style={{ height: '38px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                    >
                                      {isSaving ? (
                                        <>
                                          <div className="spinner-sm" />
                                          <span>Menyimpan...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check size={14} />
                                          <span>Simpan Nilai</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="tugas-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCloseSubmissionsModal}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ 7. TOAST NOTIFIKASI SUKSES ══════════════════════ */}
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
