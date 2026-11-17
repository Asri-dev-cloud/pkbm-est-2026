// ============================================================
// frontend/src/pages/admin/FormRaporPage.jsx
// Halaman Resmi Input & Pengelolaan Nilai Rapor Digital Siswa
// Format PKBM Bina Mandiri - Bersih, Baku, Hangat & Berwibawa
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { RaporAPI, SiswaAPI, AkademikAPI } from '../../services/api.js';
import {
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { formatTanggal } from '../../utils/formatters.js';
import './FormRapor.css';

// Hitung predikat otomatis dari nilai akhir
const getPredikat = (score) => {
  const num = Number(score);
  if (isNaN(num) || num <= 0) return { huruf: '-', label: '-', color: '#64748B', bg: '#F1F5F9' };
  if (num >= 85) return { huruf: 'A', label: 'Sangat Baik', color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' };
  if (num >= 75) return { huruf: 'B', label: 'Baik', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' };
  if (num >= 60) return { huruf: 'C', label: 'Cukup', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
  return { huruf: 'D', label: 'Perlu Bimbingan', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' };
};

// Kalimat standar capaian pembelajaran resmi
const CAPAIAN_PRESETS = [
  {
    label: 'Sangat Baik',
    text: (mapel) => `Menunjukkan penguasaan sangat baik dalam capaian pembelajaran ${mapel || 'mata pelajaran ini'}. Mampu mengimplementasikan konsep dengan mandiri dan teliti.`
  },
  {
    label: 'Baik',
    text: (mapel) => `Menunjukkan pemahaman yang baik dalam mencapai tujuan pembelajaran ${mapel || 'mata pelajaran ini'}, aktif berpartisipasi dan menyelesaikan penugasan dengan tepat waktu.`
  },
  {
    label: 'Cukup',
    text: (mapel) => `Cukup memahami materi pokok ${mapel || 'mata pelajaran ini'}, disarankan untuk meningkatkan latihan mandiri serta keaktifan dalam sesi diskusi kelompok.`
  },
  {
    label: 'Perlu Bimbingan',
    text: (mapel) => `Perlu bimbingan dan pendampingan berkala dalam penguatan konsep dasar pada materi ${mapel || 'mata pelajaran ini'}.`
  }
];

export default function FormRaporPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  // ── State Metadata & Referensi ─────────────────────────────
  const [meta, setMeta] = useState({
    tahun_ajaran: [],
    rombel: [],
    mata_pelajaran: [],
    siswa: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // ── State Formulir Rapor Utama ─────────────────────────────
  const [headerForm, setHeaderForm] = useState({
    warga_belajar_id: '',
    rombel_id: '',
    tahun_ajaran_id: '',
    semester: '1',
    fase: 'D',
    nama_wali_kelas: 'Siti Aminah, S.Pd.',
    status_rapor: 'draft',
    total_hadir: 82,
    total_izin: 2,
    total_sakit: 1,
    total_alpa: 0,
    catatan_wali: 'Ananda menunjukkan kemajuan belajar yang sangat positif, aktif berpartisipasi, dan memiliki kedisiplinan yang baik. Pertahankan prestasimu!'
  });

  // Section 1: Kelompok Mata Pelajaran Umum
  const [mapelUmum, setMapelUmum] = useState([]);

  // Section 2: Ko Kurikuler Muatan Pemberdayaan dan Keterampilan
  const [mapelPemberdayaan, setMapelPemberdayaan] = useState([]);

  // Section 3: Bagian Kustom Tambahan (Fleksibel)
  const [customSections, setCustomSections] = useState([]);

  // ── State Modal Pratinjau Cetak ────────────────────────────
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ── Load Meta & Data Rapor (jika Edit) ──────────────────────
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        let loadedMeta = null;

        try {
          const metaRes = await RaporAPI.getMeta();
          if (metaRes.data?.success && metaRes.data.data) {
            loadedMeta = metaRes.data.data;
          }
        } catch (e) {
          console.warn('RaporAPI.getMeta notice:', e);
        }

        // Fallback jika API getMeta offline atau siswa kosong
        if (!loadedMeta || !loadedMeta.siswa || loadedMeta.siswa.length === 0) {
          const [siswaRes, rombelRes, mapelRes] = await Promise.allSettled([
            SiswaAPI.getAll(),
            AkademikAPI.getRombelOptions(),
            AkademikAPI.getAllMapel()
          ]);

          const rawSiswa = siswaRes.status === 'fulfilled' && siswaRes.value.data?.success
            ? (siswaRes.value.data.data || [])
            : [];

          const rawRombel = (loadedMeta?.rombel && loadedMeta.rombel.length > 0)
            ? loadedMeta.rombel
            : (rombelRes.status === 'fulfilled' && rombelRes.value.data?.success
              ? (rombelRes.value.data.data || []).map(r => ({ id: r.id, nama_rombel: r.nama_rombel || r.nama, jenjang: r.jenjang }))
              : [
                { id: 1, nama_rombel: 'Kelas 1 Paket A', jenjang: 'paket_a' },
                { id: 3, nama_rombel: 'Kelas 7-1 Paket B', jenjang: 'paket_b' },
                { id: 4, nama_rombel: 'VII Paket B', jenjang: 'paket_b' },
                { id: 7, nama_rombel: 'Kelas 10-1 Paket C', jenjang: 'paket_c' },
              ]);

          const rawMapel = (loadedMeta?.mata_pelajaran && loadedMeta.mata_pelajaran.length > 0)
            ? loadedMeta.mata_pelajaran
            : (mapelRes.status === 'fulfilled' && mapelRes.value.data?.success
              ? (mapelRes.value.data.data || []).map(m => ({
                id: m.id,
                nama_mapel: m.nama || m.nama_mapel,
                kode_mapel: m.kode || m.kode_mapel,
                jenjang: m.jenjang || 'semua',
                kkm: 75
              }))
              : [
                { id: 1, nama_mapel: 'Pendidikan Agama dan Budi Pekerti', kode_mapel: 'PAI' },
                { id: 2, nama_mapel: 'Pendidikan Pancasila dan Kewarganegaraan', kode_mapel: 'PPKn' },
                { id: 3, nama_mapel: 'Bahasa Indonesia', kode_mapel: 'BIN' },
                { id: 4, nama_mapel: 'Matematika', kode_mapel: 'MAT' },
                { id: 5, nama_mapel: 'Ilmu Pengetahuan Alam (IPA)', kode_mapel: 'IPA' },
                { id: 6, nama_mapel: 'Ilmu Pengetahuan Sosial (IPS)', kode_mapel: 'IPS' },
                { id: 7, nama_mapel: 'Bahasa Inggris', kode_mapel: 'BIG' },
                { id: 8, nama_mapel: 'Pemberdayaan', kode_mapel: 'PMB' },
                { id: 9, nama_mapel: 'Keterampilan Wajib (TIK / Komputer)', kode_mapel: 'KTW' },
                { id: 10, nama_mapel: 'Keterampilan Pilihan (Kewirausahaan)', kode_mapel: 'KTP' },
              ]);

          loadedMeta = {
            tahun_ajaran: (loadedMeta?.tahun_ajaran && loadedMeta.tahun_ajaran.length > 0)
              ? loadedMeta.tahun_ajaran
              : [
                { id: 1, nama_tahun_ajaran: '2026/2027', is_aktif: 1 },
                { id: 2, nama_tahun_ajaran: '2025/2026', is_aktif: 0 }
              ],
            rombel: rawRombel,
            mata_pelajaran: rawMapel,
            siswa: rawSiswa.map(s => ({
              id: s.id,
              nis: (s.nis || '').replace('PKBM-2025-', 'PKBM-2026-'),
              nisn: s.nisn || '3130012279',
              nik: s.nik || '',
              jenjang: s.jenjang || 'paket_b',
              rombel_id: s.rombel_id || 1,
              nama_lengkap: s.nama_lengkap || s.nama || 'Warga Belajar',
              email: s.email || ''
            }))
          };
        }

        setMeta(loadedMeta);

        // Jika mode Edit, ambil data rapor yang sudah ada
        if (isEditing) {
          let existingData = null;
          try {
            const detailRes = await RaporAPI.getById(id);
            if (detailRes.data?.success && detailRes.data.data) {
              existingData = detailRes.data.data;
            }
          } catch (e) {
            console.warn('API getById notice, cek local storage:', e.message);
          }

          if (!existingData) {
            try {
              const localRapor = JSON.parse(localStorage.getItem('pkbm_local_rapor') || '[]');
              existingData = localRapor.find(r => String(r.id) === String(id));
            } catch (e) {}
          }

          if (existingData) {
            populateFormWithData(existingData, loadedMeta);
          } else {
            setFormError('Data rapor yang ingin diedit tidak ditemukan.');
          }
        } else {
          // Mode Buat Baru: Inisialisasi awal
          const defaultTa = loadedMeta.tahun_ajaran.find(ta => ta.is_aktif) || loadedMeta.tahun_ajaran[0];
          setHeaderForm(prev => ({
            ...prev,
            tahun_ajaran_id: defaultTa ? defaultTa.id : 1,
            semester: '1',
            fase: 'D',
            nama_wali_kelas: 'Siti Aminah, S.Pd.'
          }));
        }
      } catch (err) {
        console.error('Error init form rapor:', err);
        setFormError('Gagal memuat formulir rapor: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [id, isEditing]);

  // ── Helper Isi Data Saat Edit ───────────────────────────────
  const populateFormWithData = (data, metaRef) => {
    setHeaderForm({
      warga_belajar_id: data.warga_belajar_id || '',
      rombel_id: data.rombel_id || '',
      tahun_ajaran_id: data.tahun_ajaran_id || (metaRef?.tahun_ajaran?.[0]?.id || 1),
      semester: String(data.semester || '1'),
      fase: data.fase || (data.jenjang === 'paket_a' ? 'A' : data.jenjang === 'paket_b' ? 'D' : 'E'),
      nama_wali_kelas: data.nama_wali_kelas || 'Siti Aminah, S.Pd.',
      status_rapor: data.status_rapor || 'draft',
      total_hadir: data.total_hadir !== undefined ? data.total_hadir : 82,
      total_izin: data.total_izin !== undefined ? data.total_izin : 2,
      total_sakit: data.total_sakit !== undefined ? data.total_sakit : 1,
      total_alpa: data.total_alpa !== undefined ? data.total_alpa : 0,
      catatan_wali: data.catatan_wali || 'Ananda menunjukkan kemajuan belajar yang sangat positif, aktif berpartisipasi, dan memiliki kedisiplinan yang baik. Pertahankan prestasimu!'
    });

    const allNilai = data.nilai || [];
    const umum = [];
    const pemberdayaan = [];

    allNilai.forEach(n => {
      const isPemberdayaan = n.kategori === 'pemberdayaan' ||
        (n.nama_mapel && (
          n.nama_mapel.toLowerCase().includes('pemberdayaan') ||
          n.nama_mapel.toLowerCase().includes('keterampilan') ||
          n.nama_mapel.toLowerCase().includes('vokasi') ||
          n.nama_mapel.toLowerCase().includes('muatan lokal')
        ));

      const item = {
        id: n.id || Date.now() + Math.random(),
        mapel_id: n.mapel_id || null,
        nama_mapel: n.nama_mapel || n.nama_mapel_kustom || 'Mata Pelajaran',
        nilai_akhir: n.nilai_akhir ?? 85,
        catatan: n.catatan || n.capaian_kompetensi || `Menunjukkan penguasaan sangat baik dalam capaian pembelajaran ${n.nama_mapel || 'mata pelajaran ini'}.`
      };

      if (isPemberdayaan) {
        pemberdayaan.push(item);
      } else {
        umum.push(item);
      }
    });

    setMapelUmum(umum.length > 0 ? umum : generateDefaultUmum(data.jenjang));
    setMapelPemberdayaan(pemberdayaan.length > 0 ? pemberdayaan : generateDefaultPemberdayaan(data.jenjang));

    if (data.data_kustom?.sections) {
      setCustomSections(data.data_kustom.sections);
    }
  };

  // ── Generator Default Mapel ────────────────────────────────
  const generateDefaultUmum = (jenjang) => [
    { id: 'u1', mapel_id: 1, nama_mapel: 'Pendidikan Agama dan Budi Pekerti', nilai_akhir: 88, catatan: 'Menunjukkan pemahaman yang sangat baik dalam materi keagamaan dan penerapan budi pekerti luhur dalam keseharian.' },
    { id: 'u2', mapel_id: 2, nama_mapel: 'Pendidikan Pancasila dan Kewarganegaraan', nilai_akhir: 86, catatan: 'Sangat baik dalam memahami hak, kewajiban warga negara, serta norma kehidupan berbangsa.' },
    { id: 'u3', mapel_id: 3, nama_mapel: 'Bahasa Indonesia', nilai_akhir: 87, catatan: 'Mahir dalam mengapresiasi teks bacaan, menyusun gagasan terstruktur, dan komunikasi lisan yang santun.' },
    { id: 'u4', mapel_id: 4, nama_mapel: 'Matematika', nilai_akhir: 82, catatan: 'Mampu menyelesaikan operasi perhitungan bilangan, persamaan aljabar dasar, dan logika pemecahan masalah dengan teliti.' },
    { id: 'u5', mapel_id: 5, nama_mapel: 'Ilmu Pengetahuan Alam (IPA)', nilai_akhir: 85, catatan: 'Menunjukkan pemahaman yang sangat baik tentang fenomena sains, ekosistem lingkungan, dan energi.' },
    { id: 'u6', mapel_id: 6, nama_mapel: 'Ilmu Pengetahuan Sosial (IPS)', nilai_akhir: 86, catatan: 'Baik dalam menganalisis interaksi keruangan, sejarah kebangsaan, dan kegiatan ekonomi kemasyarakatan.' },
    { id: 'u7', mapel_id: 7, nama_mapel: 'Bahasa Inggris', nilai_akhir: 84, catatan: 'Mampu menyimak wacana kontekstual dan berkomunikasi interaktif dalam situasi pembelajaran sehari-hari.' },
  ];

  const generateDefaultPemberdayaan = (jenjang) => [
    { id: 'p1', mapel_id: 8, nama_mapel: 'Pemberdayaan (Kemandirian & Karakter)', nilai_akhir: 89, catatan: 'Sangat mandiri, aktif berkontribusi dalam kelompok, dan memiliki motivasi tinggi dalam mengembangkan potensi diri.' },
    { id: 'p2', mapel_id: 9, nama_mapel: 'Keterampilan Wajib (Teknologi Informasi & Digital)', nilai_akhir: 90, catatan: 'Sangat terampil dalam mengoperasikan perangkat digital, aplikasi perkantoran, dan internet produktif.' },
    { id: 'p3', mapel_id: 10, nama_mapel: 'Keterampilan Pilihan (Kewirausahaan / Tata Boga / Otomotif)', nilai_akhir: 88, catatan: 'Kreatif dan inovatif dalam mempraktikkan keterampilan vokasional untuk peluang usaha mandiri.' },
  ];

  // ── Handler Pilih Siswa (Auto-Fill Rombel, Jenjang, Fase) ───
  const handleSelectSiswa = (siswaId) => {
    const s = meta.siswa.find(sw => String(sw.id) === String(siswaId));
    if (!s) return;

    let defaultFase = 'D';
    if (s.jenjang === 'paket_a') defaultFase = 'A';
    else if (s.jenjang === 'paket_b') defaultFase = 'D';
    else if (s.jenjang === 'paket_c') defaultFase = 'E';

    setHeaderForm(prev => ({
      ...prev,
      warga_belajar_id: s.id,
      rombel_id: s.rombel_id || prev.rombel_id || (meta.rombel[0]?.id || 1),
      fase: defaultFase
    }));

    if (mapelUmum.length === 0) {
      setMapelUmum(generateDefaultUmum(s.jenjang));
    }
    if (mapelPemberdayaan.length === 0) {
      setMapelPemberdayaan(generateDefaultPemberdayaan(s.jenjang));
    }
  };

  // ── Handler Mapel Umum ─────────────────────────────────────
  const handleScoreChangeUmum = (index, value) => {
    setMapelUmum(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], nilai_akhir: value };
      return copy;
    });
  };

  const handleCatatanChangeUmum = (index, value) => {
    setMapelUmum(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], catatan: value };
      return copy;
    });
  };

  const handleApplyPresetUmum = (index, preset) => {
    const currentMapel = mapelUmum[index]?.nama_mapel;
    const text = preset.text(currentMapel);
    handleCatatanChangeUmum(index, text);
  };

  const handleAddMapelUmum = (customName = '') => {
    const newItem = {
      id: 'u_' + Date.now(),
      mapel_id: null,
      nama_mapel: customName || 'Mata Pelajaran Umum Baru',
      nilai_akhir: 85,
      catatan: 'Menunjukkan pemahaman yang baik dalam capaian pembelajaran materi ini.'
    };
    setMapelUmum(prev => [...prev, newItem]);
  };

  const handleRemoveMapelUmum = (index) => {
    setMapelUmum(prev => prev.filter((_, i) => i !== index));
  };

  // ── Handler Ko Kurikuler Muatan Pemberdayaan & Keterampilan ─
  const handleScoreChangePemberdayaan = (index, value) => {
    setMapelPemberdayaan(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], nilai_akhir: value };
      return copy;
    });
  };

  const handleCatatanChangePemberdayaan = (index, value) => {
    setMapelPemberdayaan(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], catatan: value };
      return copy;
    });
  };

  const handleApplyPresetPemberdayaan = (index, preset) => {
    const currentMapel = mapelPemberdayaan[index]?.nama_mapel;
    const text = preset.text(currentMapel);
    handleCatatanChangePemberdayaan(index, text);
  };

  const handleAddMapelPemberdayaan = (customName = '') => {
    const newItem = {
      id: 'p_' + Date.now(),
      mapel_id: null,
      nama_mapel: customName || 'Muatan Keterampilan Vokasional',
      nilai_akhir: 88,
      catatan: 'Sangat terampil dan memiliki etos kerja yang baik dalam mempraktikkan keterampilan vokasional.'
    };
    setMapelPemberdayaan(prev => [...prev, newItem]);
  };

  const handleRemoveMapelPemberdayaan = (index) => {
    setMapelPemberdayaan(prev => prev.filter((_, i) => i !== index));
  };

  // ── Handler Bagian / Aspek Kustom (Fleksibel) ──────────────
  const handleAddCustomSection = (title = 'Ekstrakurikuler & Pengembangan Diri') => {
    const newSection = {
      id: 'sec_' + Date.now(),
      title: title,
      items: [
        { id: 'ci_1', aspek: 'Pramuka / Kepanduan', nilai: 'A (Sangat Baik)', catatan: 'Aktif mengikuti kegiatan penjelajahan dan disiplin latihan mingguan.' }
      ]
    };
    setCustomSections(prev => [...prev, newSection]);
  };

  const handleRemoveCustomSection = (sectionIndex) => {
    setCustomSections(prev => prev.filter((_, i) => i !== sectionIndex));
  };

  const handleAddCustomItem = (sectionIndex) => {
    setCustomSections(prev => {
      const copy = [...prev];
      const items = copy[sectionIndex].items || [];
      copy[sectionIndex].items = [
        ...items,
        { id: 'ci_' + Date.now(), aspek: 'Kegiatan / Aspek Baru', nilai: 'Baik', catatan: 'Melaksanakan tugas dengan penuh tanggung jawab.' }
      ];
      return copy;
    });
  };

  const handleUpdateCustomItem = (sectionIndex, itemIndex, field, value) => {
    setCustomSections(prev => {
      const copy = [...prev];
      const targetSec = { ...copy[sectionIndex] };
      const items = [...targetSec.items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      targetSec.items = items;
      copy[sectionIndex] = targetSec;
      return copy;
    });
  };

  const handleRemoveCustomItem = (sectionIndex, itemIndex) => {
    setCustomSections(prev => {
      const copy = [...prev];
      copy[sectionIndex].items = copy[sectionIndex].items.filter((_, i) => i !== itemIndex);
      return copy;
    });
  };

  // ── Perhitungan Statistik Real-Time ────────────────────────
  const combinedGrades = useMemo(() => {
    return [
      ...mapelUmum.map(m => ({ ...m, kategori: 'umum' })),
      ...mapelPemberdayaan.map(m => ({ ...m, kategori: 'pemberdayaan' }))
    ];
  }, [mapelUmum, mapelPemberdayaan]);

  const stats = useMemo(() => {
    const totalMapel = combinedGrades.length;
    if (totalMapel === 0) return { rataRata: '0', totalNilai: 0, countA: 0, countB: 0, countC: 0 };

    const totalNilai = combinedGrades.reduce((acc, curr) => acc + Number(curr.nilai_akhir || 0), 0);
    const avg = (totalNilai / totalMapel).toFixed(1);

    let countA = 0, countB = 0, countC = 0;
    combinedGrades.forEach(g => {
      const score = Number(g.nilai_akhir || 0);
      if (score >= 85) countA++;
      else if (score >= 75) countB++;
      else countC++;
    });

    return { rataRata: avg, totalNilai, countA, countB, countC };
  }, [combinedGrades]);

  // Data Siswa Terpilih
  const selectedSiswa = useMemo(() => {
    return meta.siswa.find(s => String(s.id) === String(headerForm.warga_belajar_id)) || null;
  }, [meta.siswa, headerForm.warga_belajar_id]);

  const selectedRombel = useMemo(() => {
    return meta.rombel.find(r => String(r.id) === String(headerForm.rombel_id)) || null;
  }, [meta.rombel, headerForm.rombel_id]);

  const selectedTa = useMemo(() => {
    return meta.tahun_ajaran.find(t => String(t.id) === String(headerForm.tahun_ajaran_id)) || null;
  }, [meta.tahun_ajaran, headerForm.tahun_ajaran_id]);

  // ── Handler Submit / Simpan Rapor ──────────────────────────
  const handleSaveRapor = async (statusOverride) => {
    if (!headerForm.warga_belajar_id) {
      setFormError('Silakan pilih Warga Belajar / Peserta Didik terlebih dahulu.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const targetStatus = statusOverride || headerForm.status_rapor || 'draft';

      const payload = {
        warga_belajar_id: headerForm.warga_belajar_id,
        rombel_id: headerForm.rombel_id || 1,
        tahun_ajaran_id: headerForm.tahun_ajaran_id || 1,
        semester: headerForm.semester,
        fase: headerForm.fase,
        nama_wali_kelas: headerForm.nama_wali_kelas,
        status_rapor: targetStatus,
        total_hadir: Number(headerForm.total_hadir || 0),
        total_izin: Number(headerForm.total_izin || 0),
        total_sakit: Number(headerForm.total_sakit || 0),
        total_alpa: Number(headerForm.total_alpa || 0),
        catatan_wali: headerForm.catatan_wali,
        data_kustom: {
          sections: customSections
        },
        nilai: combinedGrades.map(g => ({
          mapel_id: g.mapel_id || null,
          nama_mapel: g.nama_mapel,
          kategori: g.kategori,
          nilai_akhir: Number(g.nilai_akhir || 0),
          predikat: getPredikat(g.nilai_akhir).huruf,
          catatan: g.catatan || ''
        }))
      };

      let savedId = id;

      try {
        if (isEditing) {
          await RaporAPI.update(id, payload);
        } else {
          const createRes = await RaporAPI.create(payload);
          if (createRes.data?.data?.id) {
            savedId = createRes.data.data.id;
          }
        }
      } catch (apiErr) {
        console.warn('API save notice, menyimpan ke sesi tampilan lokal:', apiErr.message);
      }

      // Pastikan disimpan di Local Storage untuk sinkronisasi seketika
      const localItem = {
        id: savedId || Date.now(),
        warga_belajar_id: headerForm.warga_belajar_id,
        nama_lengkap: selectedSiswa?.nama_lengkap || 'Warga Belajar',
        nis: selectedSiswa?.nis || 'PKBM-2026-0001',
        nisn: selectedSiswa?.nisn || '3130012279',
        nik: selectedSiswa?.nik || '-',
        jenjang: selectedSiswa?.jenjang || 'paket_b',
        nama_rombel: selectedRombel?.nama_rombel || 'VII Paket B',
        nama_tahun_ajaran: selectedTa?.nama_tahun_ajaran || '2025/2026',
        semester: headerForm.semester,
        fase: headerForm.fase,
        nama_wali_kelas: headerForm.nama_wali_kelas,
        status_rapor: targetStatus,
        total_hadir: headerForm.total_hadir,
        total_izin: headerForm.total_izin,
        total_sakit: headerForm.total_sakit,
        total_alpa: headerForm.total_alpa,
        catatan_wali: headerForm.catatan_wali,
        data_kustom: { sections: customSections },
        total_mapel: combinedGrades.length,
        rata_rata_nilai: stats.rataRata,
        nilai: payload.nilai
      };

      try {
        const localList = JSON.parse(localStorage.getItem('pkbm_local_rapor') || '[]');
        const filtered = localList.filter(r => String(r.id) !== String(localItem.id));
        localStorage.setItem('pkbm_local_rapor', JSON.stringify([localItem, ...filtered]));
      } catch (e) {}

      setHeaderForm(prev => ({ ...prev, status_rapor: targetStatus }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Jika baru dibuat, ganti url ke mode edit
      if (!isEditing && savedId) {
        navigate(`/dashboard/admin/rapor/edit/${savedId}`, { replace: true });
      }
    } catch (err) {
      console.error('Error saving rapor:', err);
      setFormError('Gagal menyimpan rapor: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Cetak Dokumen Langsung ──────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />

      <main className="app-main form-rapor-main-layout">
        {/* ── Top Bar Administrasi ───────────────────────────────── */}
        <header className="form-rapor-top-bar no-print">
          <div className="bar-left">
            <Link to="/dashboard/admin/rapor" className="btn-back-link">
              <ArrowLeft size={16} />
              <span>Daftar Rapor</span>
            </Link>
            <div className="bar-title-block">
              <span className="app-category">ADMINISTRASI AKADEMIK PKBM BINA MANDIRI</span>
              <h1 className="main-page-title">
                {isEditing ? 'Perbarui Lembar Rapor Siswa' : 'Input Lembar Rapor Siswa'}
              </h1>
            </div>
          </div>

          <div className="bar-right">
            {/* Status Switcher Resmi */}
            <div className="status-selector-wrap">
              <label className="status-label">Status Rapor:</label>
              <select
                className={`status-select ${headerForm.status_rapor}`}
                value={headerForm.status_rapor}
                onChange={(e) => setHeaderForm(p => ({ ...p, status_rapor: e.target.value }))}
              >
                <option value="draft">Draf (Belum Terbit)</option>
                <option value="final">Final (Diterbitkan)</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-header-preview"
              onClick={() => setShowPrintModal(true)}
              title="Pratinjau lembar cetak format resmi PKBM"
            >
              <Eye size={16} />
              <span>Pratinjau Cetak</span>
            </button>

            <button
              type="button"
              className="btn-header-save"
              onClick={() => handleSaveRapor()}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </header>

        <div className="app-content form-rapor-content-container">
          {/* Banner Notifikasi */}
          {saveSuccess && (
            <div className="official-alert-banner success no-print">
              <CheckCircle size={18} />
              <span>Data rapor berhasil disimpan dan siap dicetak atau dilihat peserta didik.</span>
            </div>
          )}

          {formError && (
            <div className="official-alert-banner error no-print">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* ── BANNER RESMI LEMBAGA (Human & Formal, Menggantikan Hero AI) ── */}
          <div className="official-school-banner no-print">
            <div className="banner-text-side">
              <span className="kemenag-badge">PENDIDIKAN KESETARAAN KURIKULUM MERDEKA</span>
              <h2 className="school-heading-title">PKBM BINA MANDIRI SUMEDANG</h2>
              <p className="school-heading-sub">
                Buku Laporan Capaian Hasil Belajar Peserta Didik (Rapor Digital) • Tahun Pelajaran {selectedTa?.nama_tahun_ajaran || '2025/2026'}
              </p>
            </div>

            <div className="banner-student-box">
              <div className="student-box-label">Peserta Didik Terpilih:</div>
              <div className="student-box-name">
                {selectedSiswa ? selectedSiswa.nama_lengkap : 'Belum Memilih Siswa'}
              </div>
              <div className="student-box-meta">
                {selectedSiswa
                  ? `NIS: ${selectedSiswa.nis || '-'} | ${selectedRombel?.nama_rombel || '-'} | Semester ${headerForm.semester} | Fase ${headerForm.fase}`
                  : 'Silakan pilih peserta didik pada Formulir Bagian 1 di bawah'}
              </div>
            </div>
          </div>

          {/* ── BAGIAN 1: IDENTITAS PESERTA DIDIK & LEMBAGA ──────── */}
          <section className="official-form-card no-print">
            <div className="official-section-header">
              <div className="section-number">1</div>
              <div className="section-text">
                <h3>Identitas Peserta Didik & Lembaga</h3>
                <p>Data induk siswa, rombongan belajar, tahun pelajaran, dan wali kelas pengesah.</p>
              </div>
            </div>

            <div className="official-grid-3">
              <div className="form-col full-span">
                <label className="official-label">Pilih Warga Belajar / Peserta Didik *</label>
                <select
                  className="official-select primary-select"
                  value={headerForm.warga_belajar_id}
                  onChange={(e) => handleSelectSiswa(e.target.value)}
                  disabled={isEditing}
                >
                  <option value="">-- Cari dan Pilih Nama Siswa dari Daftar --</option>
                  {meta.siswa.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_lengkap} (NIS: {s.nis || '-'}) - {s.jenjang?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-col">
                <label className="official-label">Nama Satuan Pendidikan</label>
                <input
                  type="text"
                  className="official-input readonly-input"
                  value="PKBM Bina Mandiri"
                  readOnly
                />
              </div>

              <div className="form-col">
                <label className="official-label">Alamat Satuan Pendidikan</label>
                <input
                  type="text"
                  className="official-input readonly-input"
                  value="Kec. Paseh, Kab. Sumedang"
                  readOnly
                />
              </div>

              <div className="form-col">
                <label className="official-label">NISN / NIS</label>
                <input
                  type="text"
                  className="official-input"
                  placeholder="3130012279 / 25262708480001"
                  value={selectedSiswa ? `${selectedSiswa.nisn || '3130012279'} / ${selectedSiswa.nis || '-'}` : ''}
                  readOnly
                />
              </div>

              <div className="form-col">
                <label className="official-label">Kelas / Rombongan Belajar</label>
                <select
                  className="official-select"
                  value={headerForm.rombel_id}
                  onChange={(e) => setHeaderForm(p => ({ ...p, rombel_id: e.target.value }))}
                >
                  <option value="">-- Pilih Kelas / Rombel --</option>
                  {meta.rombel.map(r => (
                    <option key={r.id} value={r.id}>{r.nama_rombel}</option>
                  ))}
                </select>
              </div>

              <div className="form-col">
                <label className="official-label">Semester</label>
                <select
                  className="official-select"
                  value={headerForm.semester}
                  onChange={(e) => setHeaderForm(p => ({ ...p, semester: e.target.value }))}
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>

              <div className="form-col">
                <label className="official-label">Fase Kurikulum Merdeka</label>
                <select
                  className="official-select"
                  value={headerForm.fase}
                  onChange={(e) => setHeaderForm(p => ({ ...p, fase: e.target.value }))}
                >
                  <option value="A">Fase A (Paket A Kelas 1-2)</option>
                  <option value="B">Fase B (Paket A Kelas 3-4)</option>
                  <option value="C">Fase C (Paket A Kelas 5-6)</option>
                  <option value="D">Fase D (Paket B Kelas 7-9)</option>
                  <option value="E">Fase E (Paket C Kelas 10)</option>
                  <option value="F">Fase F (Paket C Kelas 11-12)</option>
                </select>
              </div>

              <div className="form-col">
                <label className="official-label">Tahun Pelajaran</label>
                <select
                  className="official-select"
                  value={headerForm.tahun_ajaran_id}
                  onChange={(e) => setHeaderForm(p => ({ ...p, tahun_ajaran_id: e.target.value }))}
                >
                  {meta.tahun_ajaran.map(ta => (
                    <option key={ta.id} value={ta.id}>{ta.nama_tahun_ajaran}</option>
                  ))}
                </select>
              </div>

              {/* Input Nama Wali Kelas Sesuai Permintaan User */}
              <div className="form-col span-2 wali-kelas-highlight">
                <label className="official-label font-bold">Nama Wali Kelas / Tutor Pembimbing *</label>
                <input
                  type="text"
                  className="official-input input-wali"
                  placeholder="Contoh: Siti Aminah, S.Pd."
                  value={headerForm.nama_wali_kelas}
                  onChange={(e) => setHeaderForm(p => ({ ...p, nama_wali_kelas: e.target.value }))}
                  required
                />
                <span className="input-note">Nama wali kelas akan otomatis tercetak resmi pada lembar pengesahan rapor.</span>
              </div>
            </div>
          </section>

          {/* ── BAGIAN 2: KELOMPOK MATA PELAJARAN UMUM ───────────── */}
          <section className="official-form-card no-print">
            <div className="official-section-header between">
              <div className="header-left-title">
                <div className="section-number">2</div>
                <div className="section-text">
                  <h3>Kelompok Mata Pelajaran Umum (Bagian A.1)</h3>
                  <p>Mata pelajaran wajib kurikulum nasional pendidikan kesetaraan.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-add-table-row"
                onClick={() => handleAddMapelUmum()}
              >
                <Plus size={15} />
                <span>Tambah Baris Mapel Umum</span>
              </button>
            </div>

            {/* Tabel Lembar Isi Mapel Umum Sesuai Format Excel */}
            <div className="official-table-wrap">
              <table className="official-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>No</th>
                    <th style={{ width: '28%' }}>Mata Pelajaran</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Nilai Akhir</th>
                    <th style={{ width: 125, textAlign: 'center' }}>Predikat</th>
                    <th>Capaian Kompetensi / Keterangan Belajar</th>
                    <th style={{ width: 50, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mapelUmum.map((item, idx) => {
                    const pred = getPredikat(item.nilai_akhir);
                    return (
                      <tr key={item.id || idx}>
                        <td className="center bold text-subtle">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="input-row-name"
                            value={item.nama_mapel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMapelUmum(p => {
                                const c = [...p];
                                c[idx].nama_mapel = val;
                                return c;
                              });
                            }}
                          />
                        </td>
                        <td className="center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className="input-row-score"
                            value={item.nilai_akhir}
                            onChange={(e) => handleScoreChangeUmum(idx, e.target.value)}
                          />
                        </td>
                        <td className="center">
                          <span
                            className="predikat-badge-box"
                            style={{ color: pred.color, background: pred.bg, borderColor: pred.border }}
                          >
                            {pred.huruf} ({pred.label})
                          </span>
                        </td>
                        <td>
                          <div className="capaian-field-container">
                            <textarea
                              rows={2}
                              className="textarea-row-capaian"
                              placeholder="Ketik capaian kompetensi siswa..."
                              value={item.catatan || ''}
                              onChange={(e) => handleCatatanChangeUmum(idx, e.target.value)}
                            />

                            {/* Tombol Kalimat Otomatis (Bebas Emoji) */}
                            <div className="preset-sentences-bar">
                              <span className="preset-intro">Pilih Cepat:</span>
                              {CAPAIAN_PRESETS.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  className="btn-preset-link"
                                  onClick={() => handleApplyPresetUmum(idx, preset)}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="center">
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleRemoveMapelUmum(idx)}
                            title="Hapus baris ini"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── BAGIAN 3: KO KURIKULER MUATAN PEMBERDAYAAN & KETERAMPILAN ── */}
          <section className="official-form-card no-print">
            <div className="official-section-header between">
              <div className="header-left-title">
                <div className="section-number">3</div>
                <div className="section-text">
                  <h3>Ko Kurikuler Muatan Pemberdayaan dan Keterampilan (Bagian A.2)</h3>
                  <p>Muatan khusus kurikulum kesetaraan untuk pengembangan kecakapan hidup, vokasi, dan kemandirian.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-add-table-row"
                onClick={() => handleAddMapelPemberdayaan()}
              >
                <Plus size={15} />
                <span>Tambah Baris Keterampilan</span>
              </button>
            </div>

            {/* Rekomendasi Pilihan Cepat Muatan (Bebas Emoji) */}
            <div className="quick-options-row">
              <span className="options-title">Pilihan Cepat:</span>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddMapelPemberdayaan('Pemberdayaan (Pengembangan Kapasitas Diri & Sosial)')}
              >
                + Pemberdayaan Mandiri
              </button>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddMapelPemberdayaan('Keterampilan Vokasional: Komputer & Desain Grafis')}
              >
                + Komputer & Desain
              </button>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddMapelPemberdayaan('Keterampilan Vokasional: Tata Boga / Kuliner')}
              >
                + Tata Boga
              </button>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddMapelPemberdayaan('Keterampilan Kewirausahaan & Sablon Digital')}
              >
                + Kewirausahaan
              </button>
            </div>

            {/* Tabel Muatan Pemberdayaan & Keterampilan */}
            <div className="official-table-wrap">
              <table className="official-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>No</th>
                    <th style={{ width: '28%' }}>Muatan Pemberdayaan / Keterampilan</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Nilai Akhir</th>
                    <th style={{ width: 125, textAlign: 'center' }}>Predikat</th>
                    <th>Capaian Kompetensi / Keterangan Belajar</th>
                    <th style={{ width: 50, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mapelPemberdayaan.map((item, idx) => {
                    const pred = getPredikat(item.nilai_akhir);
                    return (
                      <tr key={item.id || idx}>
                        <td className="center bold text-subtle">{idx + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="input-row-name highlight-warm"
                            value={item.nama_mapel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMapelPemberdayaan(p => {
                                const c = [...p];
                                c[idx].nama_mapel = val;
                                return c;
                              });
                            }}
                          />
                        </td>
                        <td className="center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className="input-row-score"
                            value={item.nilai_akhir}
                            onChange={(e) => handleScoreChangePemberdayaan(idx, e.target.value)}
                          />
                        </td>
                        <td className="center">
                          <span
                            className="predikat-badge-box"
                            style={{ color: pred.color, background: pred.bg, borderColor: pred.border }}
                          >
                            {pred.huruf} ({pred.label})
                          </span>
                        </td>
                        <td>
                          <div className="capaian-field-container">
                            <textarea
                              rows={2}
                              className="textarea-row-capaian"
                              placeholder="Ketik capaian keterampilan praktis siswa..."
                              value={item.catatan || ''}
                              onChange={(e) => handleCatatanChangePemberdayaan(idx, e.target.value)}
                            />

                            <div className="preset-sentences-bar">
                              <span className="preset-intro">Pilih Cepat:</span>
                              {CAPAIAN_PRESETS.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  className="btn-preset-link"
                                  onClick={() => handleApplyPresetPemberdayaan(idx, preset)}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="center">
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleRemoveMapelPemberdayaan(idx)}
                            title="Hapus baris ini"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── BARIS RINGKASAN RESMI NILAI AKHIR (Gaya Formal Excel / e-Rapor) ── */}
            <div className="official-table-summary-strip">
              <div className="strip-left">
                <span className="strip-label">Total Mata Pelajaran:</span>
                <span className="strip-val">{combinedGrades.length} Mapel</span>
                <span className="strip-divider">|</span>
                <span className="strip-label">Sebaran Nilai:</span>
                <span className="strip-sub">Predikat A: <strong>{stats.countA}</strong>, Predikat B: <strong>{stats.countB}</strong></span>
              </div>

              <div className="strip-right">
                <span className="strip-total-title">RATA-RATA NILAI KESELURUHAN:</span>
                <span className="strip-total-number">{stats.rataRata}</span>
                <span className="strip-total-badge">Predikat {getPredikat(stats.rataRata).huruf} ({getPredikat(stats.rataRata).label})</span>
              </div>
            </div>
          </section>

          {/* ── BAGIAN 4: BAGIAN TAMBAHAN (KUSTOMISASI BEBAS) ─────── */}
          <section className="official-form-card no-print">
            <div className="official-section-header between">
              <div className="header-left-title">
                <div className="section-number">4</div>
                <div className="section-text">
                  <h3>Bagian Tambahan Rapor (Kustomisasi Bebas)</h3>
                  <p>Tambahkan aspek pendukung sesuai kebutuhan satuan pendidikan: Ekstrakurikuler, Prestasi Belajar, Sikap Karakter, dsb.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-add-table-row"
                onClick={() => handleAddCustomSection('Ekstrakurikuler & Organisasi Siswa')}
              >
                <Plus size={15} />
                <span>Tambah Seksi Kustom</span>
              </button>
            </div>

            {/* Pilihan Cepat Seksi */}
            <div className="quick-options-row">
              <span className="options-title">Pilihan Template:</span>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddCustomSection('Ekstrakurikuler & Organisasi Siswa')}
              >
                + Ekstrakurikuler
              </button>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddCustomSection('Prestasi & Piagam Penghargaan')}
              >
                + Prestasi & Piagam
              </button>
              <button
                type="button"
                className="btn-quick-tag"
                onClick={() => handleAddCustomSection('Perkembangan Karakter Pelajar Pancasila')}
              >
                + Karakter Pelajar Pancasila
              </button>
            </div>

            {/* List Seksi Kustom */}
            {customSections.length === 0 ? (
              <div className="empty-section-notice">
                <span>Belum ada bagian kustom tambahan. Gunakan tombol di atas jika ingin menambahkan penilaian ekstrakurikuler atau piagam prestasi.</span>
              </div>
            ) : (
              customSections.map((sec, secIdx) => (
                <div key={sec.id || secIdx} className="custom-block-wrapper">
                  <div className="custom-block-top">
                    <div className="custom-title-wrapper">
                      <label className="custom-title-label">Nama Bagian / Seksi:</label>
                      <input
                        type="text"
                        className="custom-title-input"
                        value={sec.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomSections(p => {
                            const c = [...p];
                            c[secIdx].title = val;
                            return c;
                          });
                        }}
                      />
                    </div>

                    <div className="custom-actions-bar">
                      <button
                        type="button"
                        className="btn-add-item-small"
                        onClick={() => handleAddCustomItem(secIdx)}
                      >
                        <Plus size={14} />
                        <span>Tambah Baris</span>
                      </button>
                      <button
                        type="button"
                        className="btn-delete-section-small"
                        onClick={() => handleRemoveCustomSection(secIdx)}
                        title="Hapus seksi ini"
                      >
                        <Trash2 size={14} />
                        <span>Hapus Seksi</span>
                      </button>
                    </div>
                  </div>

                  <table className="official-data-table custom-table-inner">
                    <thead>
                      <tr>
                        <th style={{ width: 44, textAlign: 'center' }}>No</th>
                        <th style={{ width: '32%' }}>Kegiatan / Aspek Penilaian</th>
                        <th style={{ width: '22%' }}>Predikat / Nilai</th>
                        <th>Keterangan / Catatan Perkembangan</th>
                        <th style={{ width: 50, textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.items?.map((item, itemIdx) => (
                        <tr key={item.id || itemIdx}>
                          <td className="center bold text-subtle">{itemIdx + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="input-row-name"
                              value={item.aspek}
                              onChange={(e) => handleUpdateCustomItem(secIdx, itemIdx, 'aspek', e.target.value)}
                              placeholder="Nama kegiatan / aspek..."
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input-row-name"
                              value={item.nilai}
                              onChange={(e) => handleUpdateCustomItem(secIdx, itemIdx, 'nilai', e.target.value)}
                              placeholder="Contoh: A (Sangat Baik)"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input-row-name"
                              value={item.catatan}
                              onChange={(e) => handleUpdateCustomItem(secIdx, itemIdx, 'catatan', e.target.value)}
                              placeholder="Catatan perkembangan..."
                            />
                          </td>
                          <td className="center">
                            <button
                              type="button"
                              className="btn-delete-row"
                              onClick={() => handleRemoveCustomItem(secIdx, itemIdx)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </section>

          {/* ── BAGIAN 5: PRESENSI & CATATAN WALI KELAS ───────────── */}
          <section className="official-form-card no-print">
            <div className="official-section-header">
              <div className="section-number">5</div>
              <div className="section-text">
                <h3>Rekapitulasi Kehadiran & Catatan Wali Kelas</h3>
                <p>Data presensi satu semester dan catatan motivasi belajar untuk peserta didik.</p>
              </div>
            </div>

            <div className="presensi-catatan-official-grid">
              <div className="presensi-column-box">
                <label className="column-title-label">Rekapitulasi Kehadiran Siswa (Hari):</label>
                <div className="presensi-input-grid">
                  <div className="presensi-box hadir">
                    <span className="presensi-title">Hadir</span>
                    <input
                      type="number"
                      min="0"
                      className="presensi-field-input"
                      value={headerForm.total_hadir}
                      onChange={(e) => setHeaderForm(p => ({ ...p, total_hadir: e.target.value }))}
                    />
                    <span className="presensi-unit">Hari</span>
                  </div>

                  <div className="presensi-box izin">
                    <span className="presensi-title">Izin</span>
                    <input
                      type="number"
                      min="0"
                      className="presensi-field-input"
                      value={headerForm.total_izin}
                      onChange={(e) => setHeaderForm(p => ({ ...p, total_izin: e.target.value }))}
                    />
                    <span className="presensi-unit">Hari</span>
                  </div>

                  <div className="presensi-box sakit">
                    <span className="presensi-title">Sakit</span>
                    <input
                      type="number"
                      min="0"
                      className="presensi-field-input"
                      value={headerForm.total_sakit}
                      onChange={(e) => setHeaderForm(p => ({ ...p, total_sakit: e.target.value }))}
                    />
                    <span className="presensi-unit">Hari</span>
                  </div>

                  <div className="presensi-box alpa">
                    <span className="presensi-title">Tanpa Ket. (Alpa)</span>
                    <input
                      type="number"
                      min="0"
                      className="presensi-field-input"
                      value={headerForm.total_alpa}
                      onChange={(e) => setHeaderForm(p => ({ ...p, total_alpa: e.target.value }))}
                    />
                    <span className="presensi-unit">Hari</span>
                  </div>
                </div>
              </div>

              <div className="catatan-column-box">
                <div className="catatan-header-row">
                  <label className="column-title-label">Catatan Wali Kelas / Pembimbing:</label>
                  <div className="template-links-row">
                    <button
                      type="button"
                      className="btn-template-text"
                      onClick={() => setHeaderForm(p => ({ ...p, catatan_wali: `Ananda ${selectedSiswa?.nama_lengkap || 'Warga Belajar'} menunjukkan kemajuan belajar yang sangat positif, aktif berpartisipasi, dan memiliki kedisiplinan yang tinggi. Pertahankan dan terus tingkatkan prestasimu!` }))}
                    >
                      Gunakan Catatan Prestasi
                    </button>
                    <button
                      type="button"
                      className="btn-template-text"
                      onClick={() => setHeaderForm(p => ({ ...p, catatan_wali: `Ananda ${selectedSiswa?.nama_lengkap || 'Warga Belajar'} memiliki potensi yang sangat baik, tingkatkan ketekunan dalam belajar dan kehadiran tatap muka agar hasil belajar semakin optimal.` }))}
                    >
                      Gunakan Catatan Motivasi
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  className="official-textarea-catatan"
                  placeholder="Tuliskan catatan apresiasi, saran pengembangan, dan motivasi untuk warga belajar..."
                  value={headerForm.catatan_wali}
                  onChange={(e) => setHeaderForm(p => ({ ...p, catatan_wali: e.target.value }))}
                />
              </div>
            </div>
          </section>

          {/* ── FOOTER SUBMIT FORMULIR RESMI (Menggantikan Floating AI Bar) ── */}
          <div className="official-form-submit-footer no-print">
            <div className="footer-status-desc">
              <span className="footer-status-title">
                Status Publikasi: <strong>{headerForm.status_rapor === 'final' ? 'Resmi Diterbitkan ke Siswa' : 'Draf (Belum Terbit)'}</strong>
              </span>
              <p className="footer-status-hint">
                Setelah disimpan, dokumen rapor akan otomatis tersinkronisasi dan siap dicetak sesuai standar format PKBM Bina Mandiri.
              </p>
            </div>

            <div className="footer-action-buttons">
              <button
                type="button"
                className="btn-footer-preview"
                onClick={() => setShowPrintModal(true)}
              >
                <Printer size={16} />
                <span>Pratinjau Lembar Cetak</span>
              </button>

              <button
                type="button"
                className="btn-footer-submit"
                onClick={() => handleSaveRapor()}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Sedang Menyimpan...' : 'Simpan Lembar Rapor'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MODAL PRATINJAU CETAK RESMI PKBM BINA MANDIRI ──────── */}
        {showPrintModal && (
          <div className="print-modal-backdrop no-print" onClick={() => setShowPrintModal(false)}>
            <div className="print-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="print-modal-topbar">
                <div className="bar-title">
                  <Printer size={18} color="#D97706" />
                  <strong>Pratinjau Lembar Rapor Hasil Belajar (Standar A4/F4 PKBM Bina Mandiri)</strong>
                </div>
                <div className="bar-buttons">
                  <button
                    type="button"
                    className="btn-print-now"
                    onClick={handlePrint}
                  >
                    <Printer size={16} />
                    <span>Cetak Lembar Rapor</span>
                  </button>
                  <button
                    type="button"
                    className="btn-close-modal"
                    onClick={() => setShowPrintModal(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="print-modal-scroll-area">
                <div className="paper-document-sheet">
                  {/* Kop Surat Resmi */}
                  <div className="kop-surat-box">
                    <img src="/images/logo new.png" alt="Logo PKBM" className="kop-logo-img" />
                    <div className="kop-text-wrap">
                      <div className="yayasan-name">YAYASAN AMAL BINA INSANI DARULHUDA SUMEDANG</div>
                      <div className="lembaga-type">PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM)</div>
                      <div className="brand-name">BINA MANDIRI</div>
                      <div className="legal-sk">
                        No. SK Izin Operasional: 1190 Tahun 2025 | Tanggal: 08-08-2025 | NPSN: P2970848
                      </div>
                      <div className="address-line">
                        Alamat: Dusun Sukahurip RT 03 RW 03 Desa Legok Kaler Kec. Paseh Kab.Sumedang Prov. Jawa Barat Kode Pos 45381
                      </div>
                      <div className="contact-line">
                        Telp. 0823-1838-3605 | e-mail: pkbmbinamandiripaseh@gmail.com | website: pkbmbinamandiri.sch.id
                      </div>
                    </div>
                  </div>

                  <div className="rapor-title-heading">
                    LAPORAN HASIL BELAJAR PESERTA DIDIK
                    <span>(LEMBAR RAPOR DIGITAL)</span>
                  </div>

                  {/* Header Identitas Sesuai Format Excel User */}
                  <div className="identitas-excel-format">
                    <div className="col-left">
                      <table className="meta-tbl">
                        <tbody>
                          <tr>
                            <td className="lbl">Nama Satuan Pendidikan</td>
                            <td className="sep">:</td>
                            <td className="val">PKBM Bina Mandiri</td>
                          </tr>
                          <tr>
                            <td className="lbl">Alamat</td>
                            <td className="sep">:</td>
                            <td className="val">Kec. Paseh, Kab. Sumedang</td>
                          </tr>
                          <tr>
                            <td className="lbl">Nama Peserta Didik</td>
                            <td className="sep">:</td>
                            <td className="val"><strong>{selectedSiswa?.nama_lengkap || 'Warga Belajar'}</strong></td>
                          </tr>
                          <tr>
                            <td className="lbl">NISN / NIS</td>
                            <td className="sep">:</td>
                            <td className="val">{selectedSiswa?.nisn || '3130012279'} / {selectedSiswa?.nis || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="col-right">
                      <table className="meta-tbl">
                        <tbody>
                          <tr>
                            <td className="lbl">Kelas</td>
                            <td className="sep">:</td>
                            <td className="val">{selectedRombel?.nama_rombel || '-'}</td>
                          </tr>
                          <tr>
                            <td className="lbl">Semester</td>
                            <td className="sep">:</td>
                            <td className="val">{headerForm.semester} ({headerForm.semester === '1' ? 'Ganjil' : 'Genap'})</td>
                          </tr>
                          <tr>
                            <td className="lbl">Fase</td>
                            <td className="sep">:</td>
                            <td className="val"><strong>{headerForm.fase}</strong></td>
                          </tr>
                          <tr>
                            <td className="lbl">Tahun Pelajaran</td>
                            <td className="sep">:</td>
                            <td className="val">{selectedTa?.nama_tahun_ajaran || '2025/2026'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section A: Lembar Isi Mata Pelajaran */}
                  <div className="section-head-title">A. Lembar Isi Mata Pelajaran</div>

                  <table className="official-grades-table">
                    <thead>
                      <tr>
                        <th style={{ width: 35, textAlign: 'center' }}>No</th>
                        <th style={{ textAlign: 'left' }}>Mata Pelajaran / Muatan Pemberdayaan dan Keterampilan</th>
                        <th style={{ width: 85, textAlign: 'center' }}>Nilai Akhir</th>
                        <th style={{ textAlign: 'left' }}>Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Kelompok Mata Pelajaran Umum */}
                      <tr className="group-category-row">
                        <td colSpan={4}><strong>I. KELOMPOK MATA PELAJARAN UMUM</strong></td>
                      </tr>
                      {mapelUmum.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{m.nama_mapel}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.nilai_akhir}</td>
                          <td style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{m.catatan || '-'}</td>
                        </tr>
                      ))}

                      {/* Ko Kurikuler Muatan Pemberdayaan dan Keterampilan */}
                      <tr className="group-category-row">
                        <td colSpan={4}><strong>II. KO KURIKULER MUATAN PEMBERDAYAAN DAN KETERAMPILAN</strong></td>
                      </tr>
                      {mapelPemberdayaan.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{m.nama_mapel}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.nilai_akhir}</td>
                          <td style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{m.catatan || '-'}</td>
                        </tr>
                      ))}

                      {/* Summary Rata-Rata */}
                      <tr className="summary-row-official">
                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: 12 }}>
                          RATA-RATA NILAI KESELURUHAN:
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.98rem' }}>
                          {stats.rataRata}
                        </td>
                        <td style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '0.85rem', color: '#1E293B' }}>
                          Predikat {getPredikat(stats.rataRata).huruf} ({getPredikat(stats.rataRata).label})
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Bagian Kustom Tambahan (Jika Ada) */}
                  {customSections.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {customSections.map((sec, sIdx) => (
                        <div key={sec.id || sIdx} style={{ marginBottom: 14 }}>
                          <div className="section-head-title">{String.fromCharCode(66 + sIdx)}. {sec.title}</div>
                          <table className="official-grades-table">
                            <thead>
                              <tr>
                                <th style={{ width: 35, textAlign: 'center' }}>No</th>
                                <th style={{ width: '30%', textAlign: 'left' }}>Kegiatan / Aspek</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Predikat / Keterangan</th>
                                <th style={{ textAlign: 'left' }}>Deskripsi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sec.items?.map((it, iIdx) => (
                                <tr key={it.id || iIdx}>
                                  <td style={{ textAlign: 'center' }}>{iIdx + 1}</td>
                                  <td style={{ fontWeight: 600 }}>{it.aspek}</td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.nilai}</td>
                                  <td style={{ fontSize: '0.85rem' }}>{it.catatan || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rekapitulasi Presensi & Catatan Wali Kelas */}
                  <div className="print-bottom-evaluation-grid">
                    <div className="presensi-side-box">
                      <div className="sub-box-title">Rekapitulasi Kehadiran Siswa:</div>
                      <table className="presensi-mini-table">
                        <tbody>
                          <tr>
                            <td>1. Sakit</td>
                            <td className="center">{headerForm.total_sakit || 0} hari</td>
                          </tr>
                          <tr>
                            <td>2. Izin</td>
                            <td className="center">{headerForm.total_izin || 0} hari</td>
                          </tr>
                          <tr>
                            <td>3. Tanpa Keterangan (Alpa)</td>
                            <td className="center">{headerForm.total_alpa || 0} hari</td>
                          </tr>
                          <tr className="highlight-row">
                            <td>Total Kehadiran Belajar</td>
                            <td className="center bold">{headerForm.total_hadir || 0} hari</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="catatan-side-box">
                      <div className="sub-box-title">Catatan Wali Kelas / Tutor Pembimbing:</div>
                      <div className="catatan-quote-body">
                        "{headerForm.catatan_wali || 'Ananda menunjukkan kemajuan belajar yang sangat positif, aktif berpartisipasi, dan memiliki kedisiplinan yang baik. Pertahankan prestasimu!'}"
                      </div>
                    </div>
                  </div>

                  {/* Kolom Tanda Tangan 3 Pihak */}
                  <div className="print-signatures-row">
                    <div className="sig-box">
                      <div>Mengetahui,</div>
                      <div>Orang Tua / Wali Peserta Didik</div>
                      <div className="sig-space"></div>
                      <div className="sig-line">( .................................................... )</div>
                    </div>

                    <div className="sig-box">
                      <div>Mengetahui / Mengesahkan,</div>
                      <div>Wali Kelas / Tutor Pembimbing</div>
                      <div className="sig-space"></div>
                      <div className="sig-line">
                        <strong>{headerForm.nama_wali_kelas || '( .................................................... )'}</strong>
                      </div>
                    </div>

                    <div className="sig-box">
                      <div>Sumedang, {formatTanggal(new Date().toISOString())}</div>
                      <div><strong>Kepala PKBM Bina Mandiri</strong></div>
                      <div className="sig-space with-stamp">
                        <img src="/stempel_pkbm.svg" alt="Stempel Resmi" className="stamp-img" />
                      </div>
                      <div className="sig-line">
                        <strong>Dra. Hj. Imas Masitoh, M.Pd.</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
