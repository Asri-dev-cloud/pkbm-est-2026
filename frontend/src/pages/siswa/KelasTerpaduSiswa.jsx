// ============================================================
// src/pages/siswa/KelasTerpaduSiswa.jsx — Kelas Terpadu LMS-Style
// ============================================================
// Halaman utama Level 2: Kelas terpadu yang menyatukan Materi,
// Tugas, Absensi, dan Forum Diskusi untuk tiap Pertemuan.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import apiClient, { PertemuanAPI, LmsAPI, AbsensiAPI, SiswaAPI, UjianAPI, AkademikAPI, toAssetUrl } from '../../services/api.js';

function KelasTerpaduSiswa() {
  const { mapelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  
  // Data Kelas
  const [mapel, setMapel] = useState(null);
  const [pertemuans, setPertemuans] = useState([]);
  const [activePertemuanId, setActivePertemuanId] = useState(null);

  // Detail Pertemuan Terpadu
  const [pertemuanDetail, setPertemuanDetail] = useState(null);

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

  // State for Editing Meeting
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
  const [submittingTugas, setSubmittingTugas] = useState(false);

  // State for opening Absensi timer
  const [showAbsensiForm, setShowAbsensiForm] = useState(false);
  const [absensiTimer, setAbsensiTimer] = useState(15);
  const [submittingAbsensi, setSubmittingAbsensi] = useState(false);

  // RPS (Rencana Pembelajaran Semester) States
  const [rpsPath, setRpsPath] = useState(null);
  const [loadingRps, setLoadingRps] = useState(false);
  const [uploadingRps, setUploadingRps] = useState(false);
  const [rpsFile, setRpsFile] = useState(null);
  const [rpsMessage, setRpsMessage] = useState('');

  const fetchRps = async (rombelId) => {
    if (!rombelId || !mapelId) return;
    try {
      setLoadingRps(true);
      const res = await AkademikAPI.getRps(rombelId, mapelId);
      if (res.data && res.data.success) {
        setRpsPath(res.data.data.rps_file_path);
      }
    } catch (e) {
      console.warn('Gagal memuat RPS:', e);
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
        // Clear message after 3 seconds
        setTimeout(() => setRpsMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error uploading RPS:', err);
      setRpsMessage(err.response?.data?.message || 'Gagal mengunggah RPS.');
    } finally {
      setUploadingRps(false);
    }
  };

  const syncRekapKehadiran = async () => {
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
  };

  const fetchUjian = async () => {
    let rombelId = searchParams.get('rombel_id');
    if (!rombelId && user.role === 'warga_belajar') {
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        rombelId = profilRes.data.data?.rombel_id;
      } catch (e) {
        console.warn('Gagal memuat profil untuk rombelId', e);
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

  // ── 1. Fetch Daftar Pertemuan & Profile ────────────────────
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

        // Ambil info mapel spesifik dari daftar mapel
        const mapelRes = await SiswaAPI.getMapelOptions({ rombel_id: rombelId });
        const currentMapel = mapelRes.data.data?.find(m => String(m.id) === String(mapelId));
        setMapel(currentMapel || { nama: 'Kelas Belajar', kode: 'LMS' });

        // Ambil rekap kehadiran umum siswa jika dia warga belajar
        if (user.role === 'warga_belajar') {
          try {
            await syncRekapKehadiran();
          } catch (e) {
            console.warn('Gagal memuat rekap kehadiran');
          }
        }

        // Ambil semua pertemuan yang sudah dipublish
        const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
        const listPertemuan = pertRes.data.data || [];
        setPertemuans(listPertemuan);

        // Otomatis aktifkan pertemuan pertama jika ada
        if (listPertemuan.length > 0) {
          setActivePertemuanId(listPertemuan[0].id);
        }

        // Fetch RPS
        await fetchRps(rombelId);
      } catch (err) {
        console.error('[KelasTerpaduSiswa] Error:', err);
        setError(err.response?.data?.message || 'Gagal memuat kelas belajar.');
      } finally {
        setLoading(false);
      }
    };

    fetchKelasData();
  }, [mapelId, searchParams]);

  // ── 2. Fetch Detail Pertemuan Terintegrasi ─────────────────
  useEffect(() => {
    if (!activePertemuanId) return;

    const fetchPertemuanDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await PertemuanAPI.getDetail(activePertemuanId);
        setPertemuanDetail(res.data.data);
        setTempPengumuman(res.data.data.pertemuan?.pengumuman || '');

        if (user.role === 'warga_belajar') {
          const daftarTugas = res.data.data?.tugas || [];
          setTugasStats({
            submitted: daftarTugas.filter((item) => !!item.pengumpulan_saya).length,
            total: daftarTugas.length,
          });
        }
        
        // Reset form input tugas
        setSelectedFile(null);
        setCatatanTugas('');
        
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
      alert('Selamat! Check-in absensi Anda berhasil tercatat.');
      // Refetch detail pertemuan untuk update status absensi
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
      // Refetch rekap kehadiran samping
      await syncRekapKehadiran();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal melakukan check-in absensi.');
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
      
      // Reset forms
      setNewPertemuanKe('');
      setNewPertemuanJudul('');
      setNewPertemuanRencanaMateri('');
      setNewPertemuanMetode('hybrid');
      setNewPertemuanTanggal(new Date().toISOString().split('T')[0]);
      setNewPertemuanPengumuman('');

      // Refresh pertemuans list
      const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
      const listPertemuan = pertRes.data.data || [];
      setPertemuans(listPertemuan);
      
      // Activate the new meeting if present
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
      
      // Refresh detail
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);

      // Refresh side list to update checkmarks
      let rombelId = searchParams.get('rombel_id');
      if (rombelId) {
        const pertRes = await PertemuanAPI.getAll(rombelId, mapelId);
        setPertemuans(pertRes.data.data || []);
      }
    } catch (err) {
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

      // Refresh detail
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
    } catch (err) {
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
      formData.append('pertemuan_id', activePertemuanId);
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

      // Reset form
      setMateriJudul('');
      setMateriDeskripsi('');
      setMateriTipe('dokumen');
      setMateriUrl('');
      setMateriFile(null);

      // Refetch detail pertemuan
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
    } catch (err) {
      alert('Gagal mengunggah materi.');
    } finally {
      setSubmittingMateri(false);
    }
  };

  // ── Tutor Action: Create Tugas Pembelajaran ─────────────────
  const handleCreateTugas = async (e) => {
    e.preventDefault();
    if (!tugasJudul || !tugasDeskripsi || !tugasDeadline) {
      alert('Judul, deskripsi, dan deadline tugas wajib diisi.');
      return;
    }

    let rombelId = searchParams.get('rombel_id');
    if (!rombelId) {
      alert('Rombel ID tidak ditemukan.');
      return;
    }

    setSubmittingTugas(true);
    try {
      await LmsAPI.createTugas({
        rombel_id: parseInt(rombelId),
        mapel_id: parseInt(mapelId),
        pertemuan_id: parseInt(activePertemuanId),
        judul: tugasJudul,
        deskripsi: tugasDeskripsi,
        deadline: tugasDeadline,
        nilai_maks: parseInt(tugasNilaiMaks)
      });

      alert('Tugas berhasil dibuat!');
      setShowTugasForm(false);

      // Reset form
      setTugasJudul('');
      setTugasDeskripsi('');
      setTugasDeadline('');
      setTugasNilaiMaks(100);

      // Refetch detail
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
    } catch (err) {
      alert('Gagal membuat tugas.');
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

      // Refetch detail
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
      
      // Restart the local timer countdown
      const absensi = res.data.data.absensi;
      if (absensi && absensi.status_sesi === 'aktif' && absensi.sisa_timer_detik > 0) {
        setSisaWaktuAbsen(Math.round(absensi.sisa_timer_detik));
      }
    } catch (err) {
      alert('Gagal mengaktifkan presensi.');
    } finally {
      setSubmittingAbsensi(false);
    }
  };

  // ── Action: Kumpulkan Tugas ──────────────────────────────────
  const handleKumpulTugas = async (tugasId) => {
    if (!selectedFile) {
      alert('Silakan pilih file tugas terlebih dahulu.');
      return;
    }

    setSubmittingTugasId(tugasId);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('catatan_siswa', catatanTugas);

      await LmsAPI.kumpulkanTugas(tugasId, formData);
      alert('Tugas Anda berhasil dikumpulkan!');
      
      // Refetch detail pertemuan untuk perbarui status pengumpulan
      const res = await PertemuanAPI.getDetail(activePertemuanId);
      setPertemuanDetail(res.data.data);
      const daftarTugas = res.data.data?.tugas || [];
      setTugasStats({
        submitted: daftarTugas.filter((item) => !!item.pengumpulan_saya).length,
        total: daftarTugas.length,
      });
      setSelectedFile(null);
      setCatatanTugas('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengumpulkan tugas.');
    } finally {
      setSubmittingTugasId(null);
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
        komentar: res.data.data // Endpoint mengembalikan daftar komentar terupdate
      }));
      setNewComment('');
    } catch (err) {
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
      // Update state lokal untuk langsung hapus dari list komentar
      setPertemuanDetail(prev => ({
        ...prev,
        komentar: prev.komentar.filter(c => c.id !== commentId)
      }));
    } catch (err) {
      alert('Gagal menghapus komentar.');
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

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-content kelas-terpadu-page" style={{ padding: '1.5rem' }}>

          {/* Loading Utama */}
          {loading && (
            <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <div className="spinner"></div>
            </div>
          )}

          {/* Error Utama */}
          {!loading && error && (
            <div className="alert alert-danger" style={{ borderRadius: '12px', padding: '1.25rem', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.75rem' }}></i>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* BANNER UTAMA (HEADER KELAS) */}
              <div className="kelas-terpadu-hero" style={{
                background: 'linear-gradient(135deg, #5CB8FF 0%, #3A9BF0 50%, #0284C7 100%)',
                borderRadius: '24px',
                padding: '2.5rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 16px 36px rgba(92, 184, 255, 0.28)',
                marginBottom: '2rem'
              }}>
                <div className="kelas-terpadu-hero-inner" style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                  
                  {/* Left Side: Title & Tutor */}
                  <div className="kelas-terpadu-hero-main" style={{ flex: '1 1 500px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '6px 14px',
                      borderRadius: '99px',
                      letterSpacing: '1px',
                      display: 'inline-block',
                      marginBottom: '10px'
                    }}>
                      Kelas Aktif Warga Belajar
                    </span>
                    
                    <h1 className="kelas-terpadu-title" style={{
                      fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: 'white',
                      marginTop: '0.5rem',
                      marginBottom: '0.5rem',
                      lineHeight: 1.2
                    }}>
                      {mapel?.nama || 'Mata Pelajaran'} ({mapel?.kode || 'KS2026'})
                    </h1>
                    
                    <p className="kelas-terpadu-subtitle" style={{ opacity: 0.9, fontSize: '0.95rem', margin: '0 0 1.5rem 0', maxWidth: '600px' }}>
                      Pantau materi pembelajaran, kehadiran, tugas, forum diskusi, dan pengumuman kelas dalam satu halaman.
                    </p>

                    <div className="kelas-terpadu-tutor-chip" style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="bi bi-book" style={{ fontSize: '1.2rem', color: 'white' }}></i>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TUTOR PENGAMPU</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{pertemuanDetail?.pertemuan?.nama_tutor || mapel?.nama_tutor || 'Tutor Kelas'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Stats Grid */}
                  <div className="kelas-terpadu-stats" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                    
                    {/* Kehadiran */}
                    <div className="kelas-terpadu-stat" style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      minWidth: '140px',
                      flex: '1 1 0'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>KEHADIRAN</span>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', display: 'block', lineHeight: 1.1 }}>
                        {rekapKehadiran?.hadir || 0}/{rekapKehadiran?.total_pertemuan || 0}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px', display: 'block' }}>Total hadir semester ini</span>
                    </div>

                    {/* Submitted Tugas */}
                    <div className="kelas-terpadu-stat" style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      minWidth: '140px',
                      flex: '1 1 0'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>SUBMITTED TUGAS</span>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', display: 'block', lineHeight: 1.1 }}>
                        {tugasStats?.submitted || 0}/{tugasStats?.total || 0}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px', display: 'block' }}>Tugas sudah dikumpulkan</span>
                    </div>

                    {/* Total Pertemuan */}
                    <div className="kelas-terpadu-stat" style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      minWidth: '140px',
                      flex: '1 1 0'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>TOTAL PERTEMUAN</span>
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', display: 'block', lineHeight: 1.1 }}>
                        {pertemuans.length || 16}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px', display: 'block' }}>Jumlah sesi pembelajaran</span>
                    </div>

                  </div>

                </div>
                {/* Decorative background shape */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-10%',
                  width: '350px',
                  height: '350px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  zIndex: 1
                }} />
              </div>

              {/* THREE COLUMN / SPLIT PANE LAYOUT */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr 300px',
                gap: '1.5rem',
                alignItems: 'start'
              }} className="lms-split-layout">
                
                {/* 1. SIDEBAR KIRI: TAB PERTEMUAN 1-16 */}
                <div className="lms-left-rail" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bi bi-bell"></i>
                    Aktivitas Pertemuan
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                    Pilih pertemuan untuk melihat materi, tugas, forum diskusi, dan aktivitas belajar.
                  </p>

                  {pertemuans.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      Belum ada sesi pertemuan aktif.
                    </p>
                  ) : (
                    <div className="lms-pertemuan-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}>
                      {pertemuans.map((pert) => {
                        const isActive = pert.id === activePertemuanId;
                        return (
                          <button
                            key={pert.id}
                            onClick={() => setActivePertemuanId(pert.id)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '12px 20px',
                              borderRadius: '99px',
                              border: isActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                              background: isActive ? '#EFF6FF' : 'white',
                              color: isActive ? '#2563EB' : '#475569',
                              fontWeight: isActive ? 700 : 500,
                              fontSize: '0.9rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            Pertemuan {pert.pertemuan_ke}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {user.role !== 'warga_belajar' && (
                    <button
                      onClick={() => {
                        const nextKe = pertemuans.length > 0 ? Math.max(...pertemuans.map(p => p.pertemuan_ke)) + 1 : 1;
                        setNewPertemuanKe(nextKe);
                        setNewPertemuanJudul(`Materi Sesi ${nextKe}`);
                        setShowAddPertemuanModal(true);
                      }}
                      style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '99px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                      <span>Tambah Sesi</span>
                    </button>
                  )}
                </div>

                {/* 2. KONTEN UTAMA: DETAIL AKTIVITAS PERTEMUAN */}
                <div className="lms-main-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white', borderRadius: '20px', minHeight: '300px', border: '1px solid #E2E8F0' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : pertemuanDetail ? (
                    <>
                      {/* DETAIL PERTEMUAN INDUK */}
                      <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <h2 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                              Pertemuan {pertemuanDetail.pertemuan.pertemuan_ke}: {pertemuanDetail.pertemuan.judul}
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <i className="bi bi-calendar4-week"></i>
                              <span>
                                Pelaksanaan: {new Date(pertemuanDetail.pertemuan.tanggal_pelaksanaan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user.role !== 'warga_belajar' && (
                              <button
                                onClick={handleTogglePublishPertemuan}
                                style={{
                                  background: pertemuanDetail.pertemuan.is_published ? '#FEE2E2' : '#D1FAE5',
                                  color: pertemuanDetail.pertemuan.is_published ? '#991B1B' : '#065F46',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <i className={`bi ${pertemuanDetail.pertemuan.is_published ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                                <span>{pertemuanDetail.pertemuan.is_published ? 'Sembunyikan Sesi' : 'Publikasikan Sesi'}</span>
                              </button>
                            )}

                            {/* Badge Metode Belajar */}
                            <span style={{
                              background: '#EFF6FF',
                              color: '#2563EB',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '6px 12px',
                              borderRadius: '8px',
                              textTransform: 'uppercase'
                            }}>
                              Metode: {pertemuanDetail.pertemuan.metode_belajar || 'Hybrid'}
                            </span>
                          </div>
                        </div>

                        {/* Rencana Materi */}
                        {pertemuanDetail.pertemuan.rencana_materi && (
                          <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.5rem' }}>
                              Rencana Materi & Kompetensi
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                              {pertemuanDetail.pertemuan.rencana_materi}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* WIDGET ABSENSI MANDIRI (INTEGRATED BUTTON) */}
                      {(pertemuanDetail.absensi || user.role !== 'warga_belajar') && (
                        <div style={{
                          background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                        }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-clock-history" style={{ color: '#2563EB' }}></i>
                            <span>Sesi Presensi / Absensi</span>
                          </h4>

                          {!pertemuanDetail.absensi ? (
                            <div style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              padding: '1.25rem',
                              borderRadius: '12px',
                              color: '#1E40AF',
                              fontSize: '0.9rem'
                            }}>
                              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Presensi Mandiri Belum Diaktifkan</strong>
                              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.4 }}>
                                Aktifkan sesi presensi mandiri warga belajar agar mereka dapat melakukan check-in kehadiran langsung dari akun mereka.
                              </p>
                              
                              {showAbsensiForm ? (
                                <form onSubmit={handleCreateAbsensiSesi} style={{ background: 'white', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: '10px', color: '#334155' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Durasi Timer:</span>
                                      <input
                                        type="number"
                                        min={5}
                                        max={180}
                                        value={absensiTimer}
                                        onChange={(e) => setAbsensiTimer(e.target.value)}
                                        style={{ width: '60px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '4px 6px', textAlign: 'center', fontSize: '0.8rem' }}
                                        required
                                      />
                                      <span style={{ fontSize: '0.8rem' }}>Menit</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                      <button
                                        type="button"
                                        onClick={() => setShowAbsensiForm(false)}
                                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                      >
                                        Batal
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={submittingAbsensi}
                                        style={{
                                          background: '#2563EB',
                                          color: 'white',
                                          border: 'none',
                                          padding: '4px 12px',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {submittingAbsensi ? 'Mengaktifkan...' : 'Aktifkan'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => setShowAbsensiForm(true)}
                                  style={{
                                    background: '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                  }}
                                >
                                  Aktifkan Presensi Mandiri
                                </button>
                              )}
                            </div>
                          ) : user.role !== 'warga_belajar' ? (
                            // Non-student View
                            pertemuanDetail.absensi.status_sesi === 'aktif' && sisaWaktuAbsen > 0 ? (
                              <div style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                padding: '1rem 1.25rem',
                                borderRadius: '12px',
                                color: '#1E40AF',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                              }}>
                                <i className="bi bi-info-circle-fill" style={{ fontSize: '1.2rem' }}></i>
                                <div>
                                  <strong style={{ display: 'block', marginBottom: 2 }}>Sesi Absensi Mandiri Sedang Berjalan</strong>
                                  <span>Siswa dapat melakukan check-in (Sisa waktu: <strong>{formatTimer(sisaWaktuAbsen)}</strong>)</span>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                padding: '1rem',
                                borderRadius: '12px',
                                color: '#64748B',
                                fontSize: '0.9rem'
                              }}>
                                <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }}></i>
                                <span>Tidak ada sesi absensi mandiri aktif untuk kelas ini pada pertemuan ini.</span>
                              </div>
                            )
                          ) : pertemuanDetail.absensi.rekaman_saya ? (
                            // WB Sudah Absen
                            <div style={{
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              padding: '1rem',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              color: '#065F46'
                            }}>
                              <i className="bi bi-check-circle-fill" style={{ fontSize: '1.5rem' }}></i>
                              <div>
                                <strong style={{ fontSize: '0.95rem', display: 'block' }}>Anda Sudah Presensi</strong>
                                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                  Status: <strong style={{ textTransform: 'uppercase' }}>{pertemuanDetail.absensi.rekaman_saya.status}</strong> 
                                  {pertemuanDetail.absensi.rekaman_saya.waktu_check_in && ` (Check-in pada ${new Date(pertemuanDetail.absensi.rekaman_saya.waktu_check_in).toLocaleTimeString('id-ID')})`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            // WB Belum Absen
                            <>
                              {pertemuanDetail.absensi.status_sesi === 'aktif' && pertemuanDetail.absensi.mode === 'mandiri' && sisaWaktuAbsen > 0 ? (
                                <div style={{
                                  background: '#FEF3C7',
                                  border: '1px solid #FCD34D',
                                  padding: '1.25rem',
                                  borderRadius: '12px',
                                  textAlign: 'center'
                                }}>
                                  <p style={{ fontWeight: 600, color: '#92400E', margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                                    Sesi Absensi Mandiri Sedang Berjalan!
                                  </p>
                                  <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    color: '#B45309',
                                    fontFamily: 'monospace',
                                    marginBottom: '1rem'
                                  }}>
                                    {formatTimer(sisaWaktuAbsen)}
                                  </div>
                                  <button
                                    onClick={() => handleCheckIn(pertemuanDetail.absensi.id)}
                                    style={{
                                      background: '#D97706',
                                      color: 'white',
                                      border: 'none',
                                      padding: '10px 24px',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    KLIK UNTUK CHECK-IN ABSENSI
                                  </button>
                                </div>
                              ) : (
                                <div style={{
                                  background: '#F1F5F9',
                                  border: '1px solid #E2E8F0',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  color: '#64748B',
                                  fontSize: '0.9rem'
                                }}>
                                  <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }}></i>
                                  <span>Tidak ada sesi absensi mandiri aktif untuk Anda saat ini pada pertemuan ini.</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* TUGAS PERTEMUAN (INTEGRATED SUBMISSION FORM) */}
                      {(pertemuanDetail.tugas?.length > 0 || user.role !== 'warga_belajar') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'white',
                        borderRadius: '12px',
                        padding: '1rem 1.5rem',
                        border: '1px solid #E2E8F0'
                          }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-pencil-square" style={{ color: '#E11D48' }}></i>
                              <span>Tugas Pertemuan</span>
                            </h4>
                            
                            {user.role !== 'warga_belajar' && !showTugasForm && (
                              <button
                                onClick={() => setShowTugasForm(true)}
                                style={{
                                  background: '#FFF1F2',
                                  color: '#E11D48',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <i className="bi bi-plus-circle"></i>
                                <span>Buat Tugas</span>
                              </button>
                            )}
                          </div>

                          {showTugasForm && (
                            <form onSubmit={handleCreateTugas} style={{
                              background: 'white',
                              border: '1px solid #E2E8F0',
                              borderRadius: '20px',
                              padding: '1.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                            }}>
                              <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>Buat Tugas Baru</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Judul Tugas</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Latihan Pemahaman Fungsi Aljabar"
                                    value={tugasJudul}
                                    onChange={(e) => setTugasJudul(e.target.value)}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem' }}
                                    required
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Instruksi Tugas</label>
                                  <textarea
                                    placeholder="Tuliskan petunjuk pengerjaan tugas secara rinci..."
                                    value={tugasDeskripsi}
                                    onChange={(e) => setTugasDeskripsi(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                                    required
                                  />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Batas Pengumpulan (Deadline)</label>
                                    <input
                                      type="datetime-local"
                                      value={tugasDeadline}
                                      onChange={(e) => setTugasDeadline(e.target.value)}
                                      style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem' }}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Nilai Maksimal</label>
                                    <input
                                      type="number"
                                      value={tugasNilaiMaks}
                                      onChange={(e) => setTugasNilaiMaks(e.target.value)}
                                      min={0}
                                      max={100}
                                      style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem' }}
                                      required
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => setShowTugasForm(false)}
                                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingTugas}
                                    style={{
                                      background: '#E11D48',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 20px',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {submittingTugas ? 'Menyimpan...' : 'Simpan Tugas'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}

                          {pertemuanDetail.tugas?.length === 0 ? (
                            <div style={{
                              background: 'white',
                              borderRadius: '20px',
                              padding: '1.5rem',
                              border: '1px solid #E2E8F0',
                              textAlign: 'center',
                              color: '#64748B',
                              width: '100%'
                            }}>
                              <p style={{ margin: 0, fontSize: '0.85rem' }}>Belum ada tugas belajar yang dirilis untuk sesi pertemuan ini.</p>
                            </div>
                          ) : (
                            pertemuanDetail.tugas.map((t) => (
                            <div key={t.id} style={{
                              background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                                <div>
                                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="bi bi-pencil-square" style={{ color: '#E11D48' }}></i>
                                    <span>Tugas: {t.judul}</span>
                                  </h4>
                                  <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, display: 'block', marginTop: 4 }}>
                                    Batas Pengumpulan: {new Date(t.deadline).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                
                                {/* Status Tugas Badge */}
                                {user.role === 'warga_belajar' && (
                                  t.pengumpulan_saya ? (
                                    <span style={{
                                      background: t.pengumpulan_saya.status === 'dinilai' ? '#D1FAE5' : '#FEF3C7',
                                      color: t.pengumpulan_saya.status === 'dinilai' ? '#065F46' : '#92400E',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase'
                                    }}>
                                      {t.pengumpulan_saya.status === 'dinilai' ? `Dinilai: ${t.pengumpulan_saya.nilai}` : 'Terkumpul'}
                                    </span>
                                  ) : (
                                    <span style={{
                                      background: '#FEE2E2',
                                      color: '#991B1B',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase'
                                    }}>
                                      Belum Dikumpul
                                    </span>
                                  )
                                )}
                              </div>

                              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                                {t.deskripsi}
                              </p>

                              {/* Form Pengumpulan atau Feedback */}
                              {user.role !== 'warga_belajar' ? (
                                <div style={{
                                  background: '#EFF6FF',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: '1px solid #BFDBFE',
                                  fontSize: '0.85rem',
                                  color: '#1E40AF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <i className="bi bi-info-circle-fill"></i>
                                  <span>Mode Tutor/Admin: Silakan buka menu <strong>"Kelas Saya" → "Tugas"</strong> di sidebar untuk meninjau dan menilai hasil pekerjaan siswa.</span>
                                </div>
                              ) : t.pengumpulan_saya ? (
                                <div style={{
                                  background: '#F8FAFC',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: '1px solid #E2E8F0',
                                  fontSize: '0.85rem'
                                }}>
                                  <div style={{ marginBottom: 6 }}>
                                    <span style={{ color: '#64748B' }}>File Terkumpul:</span>{' '}
                                    <a href={toAssetUrl(t.pengumpulan_saya.path_file)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                      {t.pengumpulan_saya.nama_file || 'Lihat Jawaban'}
                                    </a>
                                  </div>
                                  {t.pengumpulan_saya.catatan_siswa && (
                                    <div style={{ marginBottom: 6 }}>
                                      <span style={{ color: '#64748B' }}>Catatan Anda:</span>{' '}
                                      <span style={{ color: '#334155' }}>"{t.pengumpulan_saya.catatan_siswa}"</span>
                                    </div>
                                  )}
                                  {t.pengumpulan_saya.feedback_tutor && (
                                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: '0.5rem', color: '#0F172A' }}>
                                      <i className="bi bi-chat-left-text" style={{ marginRight: 6, color: '#3B82F6' }}></i>
                                      <strong>Komentar Tutor:</strong>{' '}
                                      <span>"{t.pengumpulan_saya.feedback_tutor}"</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{
                                  background: '#F8FAFC',
                                  padding: '1.25rem',
                                  borderRadius: '12px',
                                  border: '1px solid #E2E8F0',
                                }}>
                                  <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Form Upload Tugas</h5>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <input 
                                      type="file" 
                                      onChange={(e) => setSelectedFile(e.target.files[0])}
                                      style={{ fontSize: '0.85rem', width: '100%' }}
                                    />
                                    <textarea
                                      placeholder="Tambahkan catatan untuk tutor (opsional)..."
                                      value={catatanTugas}
                                      onChange={(e) => setCatatanTugas(e.target.value)}
                                      rows={2}
                                      style={{
                                        width: '100%',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        padding: '8px 12px',
                                        fontSize: '0.85rem',
                                        resize: 'vertical'
                                      }}
                                    />
                                    <button
                                      onClick={() => handleKumpulTugas(t.id)}
                                      disabled={submittingTugasId === t.id}
                                      style={{
                                        alignSelf: 'flex-start',
                                        background: '#1E293B',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6
                                      }}
                                    >
                                      {submittingTugasId === t.id ? 'Mengunggah...' : 'Submit Tugas'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )))}
                        </div>
                      )}

                      {/* MATERI BELAJAR */}
                      {(pertemuanDetail.materi?.length > 0 || user.role !== 'warga_belajar') && (
                        <div style={{
                          background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-journal-album" style={{ color: '#2563EB' }}></i>
                              <span>Materi Belajar</span>
                            </h4>
                            
                            {user.role !== 'warga_belajar' && !showMateriForm && (
                              <button
                                onClick={() => setShowMateriForm(true)}
                                style={{
                                  background: '#EFF6FF',
                                  color: '#2563EB',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <i className="bi bi-plus-circle"></i>
                                <span>Unggah Materi</span>
                              </button>
                            )}
                          </div>

                          {showMateriForm && (
                            <form onSubmit={handleCreateMateri} style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '1rem',
                              marginBottom: '1rem'
                            }}>
                              <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Unggah Materi Baru</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Judul Materi</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Modul Pembelajaran Aljabar"
                                    value={materiJudul}
                                    onChange={(e) => setMateriJudul(e.target.value)}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem' }}
                                    required
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Deskripsi Materi (Opsional)</label>
                                  <textarea
                                    placeholder="Ringkasan materi singkat..."
                                    value={materiDeskripsi}
                                    onChange={(e) => setMateriDeskripsi(e.target.value)}
                                    rows={2}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
                                  />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Tipe Materi</label>
                                    <select
                                      value={materiTipe}
                                      onChange={(e) => setMateriTipe(e.target.value)}
                                      style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px', fontSize: '0.85rem', background: 'white' }}
                                    >
                                      <option value="dokumen">Dokumen (PDF/Office)</option>
                                      <option value="link">Link Eksternal</option>
                                      <option value="video">Video URL (Youtube/Drive)</option>
                                    </select>
                                  </div>
                                  <div>
                                    {materiTipe === 'dokumen' ? (
                                      <>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>Pilih File</label>
                                        <input
                                          type="file"
                                          onChange={(e) => setMateriFile(e.target.files[0])}
                                          style={{ fontSize: '0.85rem', paddingTop: '4px' }}
                                          required
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>URL Link / Video</label>
                                        <input
                                          type="url"
                                          placeholder="https://example.com/materi"
                                          value={materiUrl}
                                          onChange={(e) => setMateriUrl(e.target.value)}
                                          style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.85rem' }}
                                          required
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => setShowMateriForm(false)}
                                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={submittingMateri}
                                    style={{
                                      background: '#2563EB',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 16px',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {submittingMateri ? 'Mengunggah...' : 'Simpan Materi'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}

                          {pertemuanDetail.materi?.length === 0 ? (
                            <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', margin: 0, padding: '1rem' }}>
                              Belum ada materi belajar yang diunggah untuk sesi pertemuan ini.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {pertemuanDetail.materi.map((m) => {
                                const materiUrl = m.url || (m.path_file ? toAssetUrl(m.path_file) : '#');
                                return (
                                  <div key={m.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#F8FAFC',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    border: '1px solid #F1F5F9'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                      <i className={`bi ${getFileIcon(m.tipe)}`} style={{ color: '#2563EB', fontSize: '1.2rem', flexShrink: 0 }}></i>
                                      <div style={{ minWidth: 0 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                          {m.judul}
                                        </span>
                                        {m.deskripsi && (
                                          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {m.deskripsi}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <a 
                                      href={materiUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{
                                        background: 'white',
                                        color: '#2563EB',
                                        border: '1px solid #E2E8F0',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      <i className="bi bi-download"></i>
                                      <span>Buka</span>
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FORUM DISKUSI (COMMENTS COMPONENT) */}
                      <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                      }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-chat-right-text-fill" style={{ color: '#3B82F6' }}></i>
                          <span>Forum Diskusi Pertemuan</span>
                        </h4>

                        {/* List Comments */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                          {pertemuanDetail.komentar?.length === 0 ? (
                            <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                              Belum ada diskusi untuk pertemuan ini. Jadilah yang pertama memberikan pertanyaan atau komentar!
                            </p>
                          ) : (
                            pertemuanDetail.komentar?.map((c) => {
                              const isMyComment = c.user_id === user.id;
                              return (
                                <div key={c.id} style={{
                                  display: 'flex',
                                  gap: '0.75rem',
                                  background: isMyComment ? '#F0F9FF' : '#F8FAFC',
                                  padding: '10px 12px',
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  borderColor: isMyComment ? '#BAE6FD' : '#E2E8F0'
                                }}>
                                  {/* Avatar */}
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#CBD5E1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    flexShrink: 0,
                                    overflow: 'hidden'
                                  }}>
                                    {c.foto_profil ? (
                                      <img src={toAssetUrl(c.foto_profil)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      c.nama_lengkap.charAt(0).toUpperCase()
                                    )}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>
                                        {c.nama_lengkap}{' '}
                                        {c.role === 'tutor' && (
                                          <span style={{ fontSize: '0.65rem', background: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, marginLeft: 4 }}>TUTOR</span>
                                        )}
                                      </span>
                                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                        {new Date(c.created_at).toLocaleDateString('id-ID')}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                      {c.isi}
                                    </p>
                                  </div>

                                  {/* Delete own comment */}
                                  {isMyComment && (
                                    <button
                                      onClick={() => handleDeleteComment(c.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#EF4444',
                                        cursor: 'pointer',
                                        alignSelf: 'flex-start',
                                        padding: '2px',
                                        opacity: 0.6
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Add Comment Input */}
                        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                          <input
                            type="text"
                            placeholder="Tulis pesan atau pertanyaan Anda di forum..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            style={{
                              flex: 1,
                              borderRadius: '10px',
                              border: '1px solid #CBD5E1',
                              padding: '10px 14px',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={handlePostComment}
                            disabled={submittingComment || !newComment.trim()}
                            style={{
                              background: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              padding: '0 16px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-send-fill" style={{ fontSize: '0.9rem' }}></i>
                          </button>
                        </div>
                      </div>

                      {/* UJIAN & ASESMEN KELAS */}
                      <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #E2E8F0'
                      }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-file-earmark-text-fill" style={{ color: '#F59E0B' }}></i>
                          <span>Ujian & Asesmen Kelas</span>
                        </h4>

                        {user.role !== 'warga_belajar' ? (
                          <div style={{
                            background: '#FEF3C7',
                            border: '1px solid #FCD34D',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            color: '#92400E',
                            fontSize: '0.85rem'
                          }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <i className="bi bi-info-circle-fill" style={{ fontSize: '1.1rem', marginTop: '2px' }}></i>
                              <div>
                                <strong style={{ display: 'block', marginBottom: '2px' }}>Panel Manajemen Ujian & Asesmen</strong>
                                <p style={{ margin: 0, lineHeight: 1.4 }}>
                                  Sebagai Tutor/Admin, Anda dapat mengelola, memantau nilai, serta merilis jadwal paket ujian kelas melalui menu utama <strong>"Ujian & Asesmen"</strong> yang terdapat di sidebar kiri portal dashboard.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {ujianList.length === 0 ? (
                              <div style={{
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                textAlign: 'center',
                                color: '#64748B'
                              }}>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>Tidak ada paket ujian aktif atau terjadwal untuk mata pelajaran ini saat ini.</p>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ujianList.map((paket) => (
                                  <div key={paket.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#FFFBEB',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #FDE68A'
                                  }}>
                                    <div>
                                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#78350F', display: 'block' }}>
                                        {paket.nama_paket}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', color: '#92400E', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <i className="bi bi-clock"></i>
                                        <span>Durasi: {paket.durasi} Menit | KKM: {paket.kkm || 75}</span>
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => window.location.href = `/siswa/ujian/${paket.id}`}
                                      style={{
                                        background: '#D97706',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                                      }}
                                    >
                                      Mulai Ujian
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                    </>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                      <i className="bi bi-arrow-left-circle" style={{ fontSize: '3rem', color: '#CBD5E1' }}></i>
                      <h4 style={{ marginTop: '1rem', fontWeight: 700 }}>Pilih Pertemuan</h4>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>Silakan pilih sesi pertemuan di sidebar kiri untuk mulai belajar.</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* 3. WIDGET KANAN: RINGKASAN AKADEMIK KELAS */}
                <div className="lms-right-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* WIDGET 1: DOKUMEN RPS */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0'
                  }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-file-earmark-text" style={{ color: '#2563EB' }}></i>
                      <span>Rencana Belajar (RPS)</span>
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                      {user.role === 'tutor' || user.role === 'admin' || user.role === 'super_admin'
                        ? 'Unggah atau kelola file Rencana Pembelajaran Semester (RPS) untuk mata pelajaran ini.'
                        : 'Unduh Rencana Pembelajaran Semester (RPS) mata pelajaran ini sebagai acuan kurikulum Anda.'}
                    </p>

                    {loadingRps ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', fontSize: '0.75rem', color: '#64748B' }}>
                        <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '1rem', height: '1rem' }}></div>
                        <span>Memuat dokumen...</span>
                      </div>
                    ) : (
                      <>
                        {/* Jika RPS sudah diunggah */}
                        {rpsPath ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a
                              href={toAssetUrl(rpsPath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                color: '#1E40AF',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="bi bi-file-pdf-fill" style={{ color: '#EF4444', fontSize: '1rem' }}></i>
                                RPS-{mapel?.nama || 'Kelas'}.pdf
                              </span>
                              <i className="bi bi-download" style={{ color: '#1E40AF' }}></i>
                            </a>

                            {/* Tombol ganti RPS untuk Tutor/Admin */}
                            {(user.role === 'tutor' || user.role === 'admin' || user.role === 'super_admin') && (
                              <form onSubmit={handleUploadRps} style={{ marginTop: '8px', borderTop: '1px dashed #E2E8F0', paddingTop: '10px' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>GANTI DENGAN RPS BARU (PDF):</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setRpsFile(e.target.files[0])}
                                    style={{ fontSize: '0.75rem', width: '100%', padding: '4px 0' }}
                                    required
                                  />
                                </div>
                                {rpsFile && (
                                  <button
                                    type="submit"
                                    disabled={uploadingRps}
                                    style={{
                                      marginTop: '8px',
                                      width: '100%',
                                      background: '#2563EB',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {uploadingRps ? 'Mengunggah...' : 'Perbarui RPS'}
                                  </button>
                                )}
                              </form>
                            )}
                          </div>
                        ) : (
                          /* Jika RPS belum diunggah */
                          <>
                            {user.role === 'tutor' || user.role === 'admin' || user.role === 'super_admin' ? (
                              <form onSubmit={handleUploadRps} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{
                                  border: '2px dashed #CBD5E1',
                                  borderRadius: '10px',
                                  padding: '12px',
                                  textAlign: 'center',
                                  background: '#F8FAFC',
                                  cursor: 'pointer',
                                  position: 'relative'
                                }}>
                                  <i className="bi bi-cloud-upload-fill" style={{ fontSize: '1.5rem', color: '#64748B' }}></i>
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pilih File RPS (PDF)</p>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setRpsFile(e.target.files[0])}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      opacity: 0,
                                      cursor: 'pointer'
                                    }}
                                    required
                                  />
                                </div>
                                {rpsFile && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F1F5F9', padding: '6px 10px', borderRadius: '8px', fontSize: '0.7rem', color: '#475569' }}>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>{rpsFile.name}</span>
                                    <button type="button" onClick={() => setRpsFile(null)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}><i className="bi bi-trash"></i></button>
                                  </div>
                                )}
                                <button
                                  type="submit"
                                  disabled={uploadingRps || !rpsFile}
                                  style={{
                                    width: '100%',
                                    background: '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                  }}
                                >
                                  {uploadingRps ? 'Mengunggah...' : 'Unggah RPS'}
                                </button>
                              </form>
                            ) : (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#F8FAFC',
                                  border: '1px dashed #E2E8F0',
                                  borderRadius: '10px',
                                  padding: '12px',
                                  color: '#94A3B8',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  textAlign: 'center'
                                }}
                              >
                                <i className="bi bi-info-circle" style={{ marginRight: 6 }}></i>
                                RPS belum diunggah oleh Tutor.
                              </div>
                            )}
                          </>
                        )}

                        {/* Tampilkan pesan feedback sukses/error */}
                        {rpsMessage && (
                          <div style={{
                            marginTop: '8px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            background: rpsMessage.includes('berhasil') ? '#DCFCE7' : '#FEE2E2',
                            color: rpsMessage.includes('berhasil') ? '#15803D' : '#B91C1C',
                            border: `1px solid ${rpsMessage.includes('berhasil') ? '#86EFAC' : '#FCA5A5'}`
                          }}>
                            {rpsMessage}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* WIDGET 2: RINGKASAN KEHADIRAN MAPEL */}
                  {user.role === 'warga_belajar' && (
                    <div style={{
                      background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: '1px solid #E2E8F0'
                    }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-calendar-check" style={{ color: '#10B981' }}></i>
                        <span>Ringkasan Kehadiran</span>
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 12px 0' }}>
                        Ringkasan rekapitulasi presensi Anda sepanjang semester ini.
                      </p>

                      {/* Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>Hadir</span>
                          <strong style={{ fontSize: '1.5rem', color: '#1E293B' }}>{rekapKehadiran.hadir}</strong>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>Alfa</span>
                          <strong style={{ fontSize: '1.5rem', color: '#1E293B' }}>{rekapKehadiran.alpa}</strong>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>Izin</span>
                          <strong style={{ fontSize: '1.5rem', color: '#1E293B' }}>{rekapKehadiran.izin}</strong>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>Sakit</span>
                          <strong style={{ fontSize: '1.5rem', color: '#1E293B' }}>{rekapKehadiran.sakit}</strong>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate('/dashboard/siswa/absensi')}
                        style={{
                          width: '100%',
                          background: '#F1F5F9',
                          color: '#475569',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        Lihat Detail Presensi
                      </button>
                    </div>
                  )}

                  {/* WIDGET 3: ANNOUNCEMENT PENGUMUMAN */}
                  <div style={{
                    background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: '1px solid #E2E8F0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-megaphone" style={{ color: '#F59E0B' }}></i>
                        <span>Pengumuman Sesi</span>
                      </h4>
                      {user.role !== 'warga_belajar' && !editingPengumuman && (
                        <button
                          onClick={() => setEditingPengumuman(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editingPengumuman ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea
                          placeholder="Tuliskan pengumuman atau pesan kelas terbaru untuk sesi ini..."
                          value={tempPengumuman}
                          onChange={(e) => setTempPengumuman(e.target.value)}
                          rows={4}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setTempPengumuman(pertemuanDetail?.pertemuan?.pengumuman || '');
                              setEditingPengumuman(false);
                            }}
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleSavePengumuman}
                            disabled={submittingPengumuman}
                            style={{
                              background: '#2563EB',
                              color: 'white',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {submittingPengumuman ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: pertemuanDetail?.pertemuan?.pengumuman ? '#EFF6FF' : '#FFFBEB',
                        border: '1px solid',
                        borderColor: pertemuanDetail?.pertemuan?.pengumuman ? '#BFDBFE' : '#FEF3C7',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: pertemuanDetail?.pertemuan?.pengumuman ? '#1E40AF' : '#B45309',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-line'
                      }}>
                        {pertemuanDetail?.pertemuan?.pengumuman ? (
                          <>
                            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="bi bi-info-circle-fill"></i>
                              <span>Pesan Dari Tutor:</span>
                            </div>
                            {pertemuanDetail.pertemuan.pengumuman}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-info-circle-fill" style={{ marginRight: 4 }}></i>
                            <span>Tidak ada pengumuman kelas terbaru saat ini.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </>
          )}

          {/* MODAL: TAMBAH SESI PERTEMUAN */}
          {showAddPertemuanModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              padding: '1.5rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '90vh',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Modal Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                  padding: '1.25rem 1.75rem',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="bi bi-journal-plus" style={{ fontSize: '1.1rem' }}></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, fontFamily: '"Outfit", sans-serif', letterSpacing: '0.3px' }}>
                      Buat Sesi Pertemuan Baru
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddPertemuanModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: 'white',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      padding: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: '0.9rem' }}></i>
                  </button>
                </div>

                {/* Modal Scrollable Form Body */}
                <form onSubmit={handleCreatePertemuan} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden', 
                  margin: 0 
                }}>
                  <div style={{ 
                    padding: '1.75rem', 
                    overflowY: 'auto', 
                    maxHeight: 'calc(90vh - 150px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pertemuan Ke</label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={newPertemuanKe}
                          onChange={(e) => setNewPertemuanKe(e.target.value)}
                          style={{
                            width: '100%',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            outline: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3B82F6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#CBD5E1';
                            e.target.style.boxShadow = 'none';
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metode Pembelajaran</label>
                        <select
                          value={newPertemuanMetode}
                          onChange={(e) => setNewPertemuanMetode(e.target.value)}
                          style={{
                            width: '100%',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            padding: '10px 14px',
                            fontSize: '0.85rem',
                            outline: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, box-shadow 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3B82F6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#CBD5E1';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <option value="hybrid">Hybrid (Tatap Muka & Online)</option>
                          <option value="online">Online Class (Daring)</option>
                          <option value="offline">Offline Class (Luring)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Judul Sesi Pertemuan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pengenalan Sintaks SQL Dasar"
                        value={newPertemuanJudul}
                        onChange={(e) => setNewPertemuanJudul(e.target.value)}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#CBD5E1';
                          e.target.style.boxShadow = 'none';
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal Pelaksanaan Sesi</label>
                      <input
                        type="date"
                        value={newPertemuanTanggal}
                        onChange={(e) => setNewPertemuanTanggal(e.target.value)}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#CBD5E1';
                          e.target.style.boxShadow = 'none';
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rencana Materi & Kompetensi</label>
                      <textarea
                        placeholder="Deskripsikan poin kompetensi dan pokok bahasan yang akan dipelajari..."
                        value={newPertemuanRencanaMateri}
                        onChange={(e) => setNewPertemuanRencanaMateri(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#CBD5E1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengumuman Awal Sesi (Opsional)</label>
                      <textarea
                        placeholder="Pesan penting pembuka yang akan dipasang di panel kanan siswa..."
                        value={newPertemuanPengumuman}
                        onChange={(e) => setNewPertemuanPengumuman(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          outline: 'none',
                          resize: 'vertical',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3B82F6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#CBD5E1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Fixed Modal Action Buttons Footer */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    justifyContent: 'flex-end', 
                    padding: '1.25rem 1.75rem', 
                    borderTop: '1px solid #F1F5F9',
                    background: '#F8FAFC',
                    flexShrink: 0
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowAddPertemuanModal(false)}
                      style={{
                        background: 'white',
                        border: '1px solid #CBD5E1',
                        color: '#64748B',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPertemuan}
                      style={{
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {submittingPertemuan ? 'Menyimpan...' : 'Buat Sesi Pertemuan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
        <style>{`
          @media (max-width: 768px) {
            .kelas-terpadu-page {
              padding: 1rem !important;
            }

            .kelas-terpadu-back-link {
              padding-top: 4.25rem !important;
              margin-bottom: 1rem !important;
              font-size: 0.95rem !important;
            }

            .kelas-terpadu-hero {
              padding: 1.25rem !important;
              border-radius: 20px !important;
              margin-bottom: 1.25rem !important;
            }

            .kelas-terpadu-hero-inner {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 1.25rem !important;
            }

            .kelas-terpadu-hero-main {
              flex: none !important;
              min-width: 0 !important;
            }

            .kelas-terpadu-title {
              font-size: 1.75rem !important;
              line-height: 1.15 !important;
            }

            .kelas-terpadu-subtitle {
              font-size: 0.95rem !important;
              line-height: 1.6 !important;
              margin-bottom: 1rem !important;
            }

            .kelas-terpadu-tutor-chip {
              width: 100% !important;
              padding: 12px 14px !important;
            }

            .kelas-terpadu-stats {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 0.85rem !important;
              width: 100% !important;
            }

            .kelas-terpadu-stat {
              min-width: 0 !important;
              width: 100% !important;
              padding: 14px 16px !important;
            }

            .lms-split-layout {
              grid-template-columns: 1fr !important;
              gap: 1rem !important;
            }

            .lms-left-rail,
            .lms-main-column,
            .lms-right-column {
              min-width: 0 !important;
            }

            .lms-pertemuan-list {
              flex-direction: row !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              max-height: none !important;
              padding-right: 0 !important;
              padding-bottom: 0.25rem !important;
              margin-right: -0.25rem !important;
            }

            .lms-pertemuan-list button {
              width: auto !important;
              min-width: 148px !important;
              white-space: nowrap !important;
              flex: 0 0 auto !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

export default KelasTerpaduSiswa;
