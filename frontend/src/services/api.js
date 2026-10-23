// ============================================================
// src/services/api.js ÔÇö Konfigurasi Axios & Semua Fungsi API
// ============================================================
// File ini adalah "jembatan" antara frontend React dan backend
// Express. Semua pemanggilan HTTP ke backend HARUS melalui file
// ini ÔÇö jangan pernah menulis fetch/axios langsung di komponen.
//
// Kenapa pakai Axios?
//   - Auto-parse JSON response
//   - Bisa pasang interceptor (sisipkan token di semua request)
//   - Penanganan error lebih mudah
// ============================================================

import axios from 'axios';

// ── 1. NORMALISASI BASE URL & BUAT INSTANCE AXIOS ─────────────
// baseURL diambil dari .env (VITE_API_URL).
// Otomatis menormalisasi akhiran '/api' agar tidak 404 pada VPS/hosting.
const rawBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const baseURL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Batas waktu request: 15 detik
});

// Helper universal untuk membuat URL file/asset yang aman untuk browser
export const toAssetUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const apiUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (/^https?:\/\//i.test(apiUrl)) {
    const origin = apiUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
    return `${origin}/${normalized}`;
  }
  return `/${normalized}`;
};


// ── 2. REQUEST INTERCEPTOR ────────────────────────────────────
// Menyisipkan token JWT dari localStorage ke header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pkbm_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// ── 3. RESPONSE INTERCEPTOR ───────────────────────────────────
// Menangani token expired / 401 Unauthorized secara terpusat
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pkbm_token');
      localStorage.removeItem('pkbm_user');
      // Arahkan ke halaman login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// ============================================================
// ÔöÇÔöÇ 4. FUNGSI-FUNGSI API (dikelompokkan per modul) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
// ============================================================
// Setiap fungsi mengembalikan Promise.
// Gunakan async/await saat memanggilnya di komponen.
// Contoh: const { data } = await AuthAPI.login(email, pass);
// ============================================================


// ÔöÇÔöÇ AUTH ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const AuthAPI = {

  // POST /api/auth/login
  // Payload: { email, password }
  // Response: { success, data: { token, user } }
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  // GET /api/auth/me
  // Ambil profil user yang sedang login (berdasarkan token di header)
  getMe: () =>
    apiClient.get('/auth/me'),

  // PUT /api/auth/me
  updateMe: (payload) =>
    apiClient.put('/auth/me', payload),

  changeMyPassword: (payload) =>
    apiClient.put('/auth/me/password', payload),

  // POST /api/auth/me/foto
  uploadFotoProfil: (formData) =>
    apiClient.post('/auth/me/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


// ÔöÇÔöÇ SISWA (Warga Belajar) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const SiswaAPI = {

  // GET /api/siswa?jenjang=paket_a&is_aktif=1
  // params: objek opsional { jenjang, is_aktif }
  // Response: { success, data: [ ...listSiswa ] }
  getAll: (params = {}) =>
    apiClient.get('/siswa', { params }),

  // GET /api/siswa/:id
  // Response: { success, data: { ...dataSiswa } }
  getById: (id) =>
    apiClient.get(`/siswa/${id}`),

  // GET /api/siswa/profil/saya
  // Khusus WB ÔÇö mengambil profilnya sendiri
  getProfilSaya: () =>
    apiClient.get('/siswa/profil/saya'),

  // GET /api/siswa/statistik/per-jenjang
  // Khusus Admin & Pimpinan
  getStatistikPerJenjang: () =>
    apiClient.get('/siswa/statistik/per-jenjang'),

  // GET /api/siswa/rombel/options?jenjang=paket_c
  // Untuk dropdown penempatan rombel saat SPMB diterima
  getRombelOptions: (params = {}) =>
    apiClient.get('/siswa/rombel/options', { params }),

  getMapelOptions: (params = {}) =>
    apiClient.get('/siswa/mapel/options', { params }),

  // PUT /api/siswa/:id
  // Payload: { alamat, nama_wali, no_telp, rombel_id }
  update: (id, payload) =>
    apiClient.put(`/siswa/${id}`, payload),
};


// ÔöÇÔöÇ USER (Manajemen Akun oleh Super Admin) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const UserAPI = {

  // GET /api/users
  getAll: () =>
    apiClient.get('/users'),

  // POST /api/users
  // Payload: { nama, email, password, role }
  create: (payload) =>
    apiClient.post('/users', payload),

  // PUT /api/users/:id/status
  // Payload: { is_aktif: true/false }
  updateStatus: (id, is_aktif) =>
    apiClient.put(`/users/${id}/status`, { is_aktif }),

  // PUT /api/users/:id/password
  // Payload: { password_baru }
  resetPassword: (id, password_baru) =>
    apiClient.put(`/users/${id}/password`, { password_baru }),
};


// ÔöÇÔöÇ SPMB (Penerimaan Siswa Baru) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const SpmbAPI = {

  // POST /api/spmb/daftar ÔÇö PUBLIK, tidak butuh token
  // Payload: { nama_lengkap, nik, tanggal_lahir, jenjang_dituju, ... }
  daftar: (payload) =>
    apiClient.post('/spmb/daftar', payload),

  // POST /api/spmb/:id/berkas ÔÇö Upload berkas (FormData)
  // Gunakan FormData karena ini multipart/form-data
  uploadBerkas: (id, formData) =>
    apiClient.post(`/spmb/${id}/berkas`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // GET /api/spmb ÔÇö Daftar semua pendaftar (Admin)
  getAll: (params = {}) =>
    apiClient.get('/spmb', { params }),

  // GET /api/spmb/statistik
  getStatistik: () =>
    apiClient.get('/spmb/statistik'),

  // GET /api/spmb/:id ÔÇö Detail pendaftar
  getById: (id) =>
    apiClient.get(`/spmb/${id}`),

  // PUT /api/spmb/berkas/:berkasId/verifikasi
  // Payload: { status_verifikasi: 'valid'/'tidak_valid', catatan }
  verifikasiBerkas: (berkasId, payload) =>
    apiClient.put(`/spmb/berkas/${berkasId}/verifikasi`, payload),

  // PUT /api/spmb/:id/keputusan
  // Payload: { status: 'diterima'/'ditolak', catatan_verifikasi, rombel_id }
  buatKeputusan: (id, payload) =>
    apiClient.put(`/spmb/${id}/keputusan`, payload),
};


// ÔöÇÔöÇ TAGIHAN & KEUANGAN ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const TagihanAPI = {

  // GET /api/tagihan
  getAll: (params = {}) =>
    apiClient.get('/tagihan', { params }),

  // GET /api/tagihan/tunggakan
  getTunggakan: () =>
    apiClient.get('/tagihan/tunggakan'),

  // GET /api/tagihan/ringkasan-bulanan
  getRingkasanBulanan: () =>
    apiClient.get('/tagihan/ringkasan-bulanan'),

  // GET /api/tagihan/:id
  getById: (id) =>
    apiClient.get(`/tagihan/${id}`),

  // POST /api/tagihan
  // Payload: { siswa_id, jenis, jumlah, bulan, tahun }
  create: (payload) =>
    apiClient.post('/tagihan', payload),

  // POST /api/tagihan/massal
  // Payload: { jenjang, jenis, jumlah, bulan, tahun }
  createMassal: (payload) =>
    apiClient.post('/tagihan/massal', payload),

  // POST /api/tagihan/:id/bayar ÔÇö Catat pembayaran (bisa + bukti)
  catatPembayaran: (id, formData) =>
    apiClient.post(`/tagihan/${id}/bayar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


// ÔöÇÔöÇ ABSENSI ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const AbsensiAPI = {

  // POST /api/absensi/sesi ÔÇö Tutor buka sesi baru
  // Payload: { rombel_id, mode: 'manual'/'mandiri', durasi_timer }
  bukaSesi: (payload) =>
    apiClient.post('/absensi/sesi', payload),

  // GET /api/absensi/sesi-aktif ÔÇö Tutor cek sesi yang sedang berjalan
  getSesiAktif: () =>
    apiClient.get('/absensi/sesi-aktif'),

  // PUT /api/absensi/sesi/:sesiId/tutup
  tutupSesi: (sesiId) =>
    apiClient.put(`/absensi/sesi/${sesiId}/tutup`),

  // GET /api/absensi/sesi/:sesiId ÔÇö Detail sesi
  getSesiById: (sesiId) =>
    apiClient.get(`/absensi/sesi/${sesiId}`),

  // GET /api/absensi/sesi/:sesiId/daftar-wb ÔÇö Real-time list WB
  getDaftarWbDiSesi: (sesiId) =>
    apiClient.get(`/absensi/sesi/${sesiId}/daftar-wb`),

  // POST /api/absensi/sesi/:sesiId/submit-manual ÔÇö Absensi manual
  submitManual: (sesiId, payload) =>
    apiClient.post(`/absensi/sesi/${sesiId}/submit-manual`, payload),

  // GET /api/absensi/rombel/:rombelId ÔÇö Riwayat sesi rombel
  getSesiByRombel: (rombelId) =>
    apiClient.get(`/absensi/rombel/${rombelId}`),

  // POST /api/absensi/sesi/:sesiId/checkin ÔÇö WB check-in mandiri
  checkIn: (sesiId) =>
    apiClient.post(`/absensi/sesi/${sesiId}/checkin`),

  // GET /api/absensi/rekap/saya ÔÇö Rekap kehadiran pribadi WB
  getRekapSaya: () =>
    apiClient.get('/absensi/rekap/saya'),
};


// ÔöÇÔöÇ LMS: MATERI, TUGAS, JADWAL ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const LmsAPI = {

  // MATERI
  getMateriByRombel: (rombelId) =>
    apiClient.get(`/lms/materi/rombel/${rombelId}`),

  getMateriById: (id) =>
    apiClient.get(`/lms/materi/${id}`),

  createMateri: (formData) =>
    apiClient.post('/lms/materi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  togglePublishMateri: (id, is_published) =>
    apiClient.put(`/lms/materi/${id}/publish`, { is_published }),

  tandaiMateriSelesai: (id) =>
    apiClient.put(`/lms/materi/${id}/selesai`),

  // TUGAS
  getTugasByRombel: (rombelId) =>
    apiClient.get(`/lms/tugas/rombel/${rombelId}`),

  getTugasById: (id) =>
    apiClient.get(`/lms/tugas/${id}`),

  createTugas: (payload) =>
    apiClient.post('/lms/tugas', payload),

  kumpulkanTugas: (id, formData) =>
    apiClient.post(`/lms/tugas/${id}/kumpulkan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  nilaiTugas: (pengumpulanId, payload) =>
    apiClient.put(`/lms/tugas/pengumpulan/${pengumpulanId}/nilai`, payload),

  // JADWAL KBM
  getJadwalByRombel: (rombelId) =>
    apiClient.get(`/lms/jadwal/rombel/${rombelId}`),

  createJadwal: (payload) =>
    apiClient.post('/lms/jadwal', payload),
};


// ÔöÇÔöÇ UJIAN ONLINE ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const UjianAPI = {
  // Periode Ujian
  getAllPeriode: (params = {}) =>
    apiClient.get('/periode-ujian', { params }),

  getPeriodeById: (id) =>
    apiClient.get(`/periode-ujian/${id}`),

  createPeriode: (payload) =>
    apiClient.post('/periode-ujian', payload),

  updatePeriode: (id, payload) =>
    apiClient.put(`/periode-ujian/${id}`, payload),

  updatePeriodeStatus: (id, is_active) =>
    apiClient.patch(`/periode-ujian/${id}/status`, { is_active }),

  // Peserta Ujian Administratif
  getPesertaUjian: (params = {}) =>
    apiClient.get('/ujian/peserta', { params }),

  getPesertaUjianById: (id) =>
    apiClient.get(`/ujian/peserta/${id}`),

  generatePesertaUjian: (payload) =>
    apiClient.post('/ujian/peserta/generate', payload),

  verifyPembayaranUjian: (id, payload) =>
    apiClient.put(`/ujian/peserta/${id}/verifikasi-pembayaran`, payload),

  updateKelayakanUjian: (id, payload) =>
    apiClient.put(`/ujian/peserta/${id}/kelayakan`, payload),

  generateKartuUjian: (id) =>
    apiClient.post(`/ujian/peserta/${id}/generate-kartu`),

  getPesertaUjianSaya: () =>
    apiClient.get('/ujian/peserta/saya'),

  getPesertaUjianMapelSaya: () =>
    apiClient.get('/ujian/peserta/saya/mapel'),

  // Bank Soal
  getAllSoal: (params = {}) =>
    apiClient.get('/ujian/soal', { params }),

  getSoalById: (id) =>
    apiClient.get(`/ujian/soal/${id}`),

  createSoal: (payload) =>
    apiClient.post('/ujian/soal', payload),

  updateSoal: (id, payload) =>
    apiClient.put(`/ujian/soal/${id}`, payload),

  deleteSoal: (id) =>
    apiClient.delete(`/ujian/soal/${id}`),

  // Paket Ujian
  getPaketByRombel: (rombelId) =>
    apiClient.get(`/ujian/paket/rombel/${rombelId}`),

  getPaketById: (id) =>
    apiClient.get(`/ujian/paket/${id}`),

  createPaket: (payload) =>
    apiClient.post('/ujian/paket', payload),

  getRekapPaket: (id) =>
    apiClient.get(`/ujian/paket/${id}/rekap`),

  simpanNilaiManualPaket: (id, payload) =>
    apiClient.put(`/ujian/paket/${id}/nilai-manual`, payload),

  // Sesi Ujian (WB mengerjakan)
  mulaiUjian: (paketId) =>
    apiClient.post(`/ujian/sesi/mulai/${paketId}`),

  simpanJawaban: (sesiId, payload) =>
    apiClient.post(`/ujian/sesi/${sesiId}/jawaban`, payload),

  submitUjian: (sesiId) =>
    apiClient.post(`/ujian/sesi/${sesiId}/submit`),

  nilaiEssay: (sesiId, payload) =>
    apiClient.put(`/ujian/sesi/${sesiId}/nilai-essay`, payload),
};


// ÔöÇÔöÇ KLUB MINAT BAKAT ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const KlubAPI = {

  // ÔöÇÔöÇ Endpoint Siswa ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  // GET /api/klub ÔÇö Semua klub aktif (untuk siswa)
  getAll: () =>
    apiClient.get('/klub'),

  // GET /api/klub/saya ÔÇö Klub yang diikuti WB
  getKlubSaya: () =>
    apiClient.get('/klub/saya'),

  // GET /api/klub/:id ÔÇö Detail klub + anggota
  getById: (id) =>
    apiClient.get(`/klub/${id}`),

  // POST /api/klub/:id/daftar ÔÇö WB mendaftar ke klub
  daftar: (id) =>
    apiClient.post(`/klub/${id}/daftar`),

  // DELETE /api/klub/:id/keluar ÔÇö WB keluar dari klub
  keluar: (id) =>
    apiClient.delete(`/klub/${id}/keluar`),

  // ÔöÇÔöÇ Endpoint Admin CRUD ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  // GET /api/klub/admin/semua ÔÇö Semua klub termasuk nonaktif
  getAllAdmin: () =>
    apiClient.get('/klub/admin/semua'),

  // POST /api/klub ÔÇö Buat klub baru
  // Payload: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  create: (payload) =>
    apiClient.post('/klub', payload),

  // PUT /api/klub/:id ÔÇö Edit klub
  // Payload: { nama_klub, deskripsi, kategori, pembimbing_id, kapasitas }
  update: (id, payload) =>
    apiClient.put(`/klub/${id}`, payload),

  // PATCH /api/klub/:id/toggle ÔÇö Toggle aktif/nonaktif
  // Payload: { is_aktif: true/false }
  toggleAktif: (id, is_aktif) =>
    apiClient.patch(`/klub/${id}/toggle`, { is_aktif }),

  // DELETE /api/klub/:id ÔÇö Hapus klub
  hapus: (id) =>
    apiClient.delete(`/klub/${id}`),
};


// ÔöÇÔöÇ AKADEMIK: MASTER MAPEL & MAPEL PER ROMBEL ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const AkademikAPI = {
  getAllMapel: (params = {}) =>
    apiClient.get('/akademik/mapel', { params }),

  getMapelById: (id) =>
    apiClient.get(`/akademik/mapel/${id}`),

  createMapel: (payload) =>
    apiClient.post('/akademik/mapel', payload),

  updateMapel: (id, payload) =>
    apiClient.put(`/akademik/mapel/${id}`, payload),

  updateMapelStatus: (id, is_active) =>
    apiClient.patch(`/akademik/mapel/${id}/status`, { is_active }),

  getRombelMapel: (params = {}) =>
    apiClient.get('/akademik/rombel-mapel', { params }),

  createRombelMapel: (payload) =>
    apiClient.post('/akademik/rombel-mapel', payload),

  updateRombelMapel: (id, payload) =>
    apiClient.put(`/akademik/rombel-mapel/${id}`, payload),

  updateRombelMapelVisibility: (id, is_visible) =>
    apiClient.patch(`/akademik/rombel-mapel/${id}/visibility`, { is_visible }),

  deleteRombelMapel: (id) =>
    apiClient.delete(`/akademik/rombel-mapel/${id}`),

  getRombelOptions: (params = {}) =>
    apiClient.get('/akademik/options/rombel', { params }),

  getTutorOptions: () =>
    apiClient.get('/akademik/options/tutor'),
};


// ÔöÇÔöÇ PERTEMUAN TERPADU (LMS-STYLE) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const PertemuanAPI = {

  // GET /api/pertemuan
  getAll: (rombelId, mapelId) =>
    apiClient.get('/pertemuan', { params: { rombel_id: rombelId, mapel_id: mapelId } }),

  // GET /api/pertemuan/:id
  getDetail: (id) =>
    apiClient.get(`/pertemuan/${id}`),

  // POST /api/pertemuan
  create: (payload) =>
    apiClient.post('/pertemuan', payload),

  // PUT /api/pertemuan/:id
  update: (id, payload) =>
    apiClient.put(`/pertemuan/${id}`, payload),

  // PUT /api/pertemuan/:id/publish
  togglePublish: (id, is_published) =>
    apiClient.put(`/pertemuan/${id}/publish`, { is_published }),

  // DELETE /api/pertemuan/:id
  delete: (id) =>
    apiClient.delete(`/pertemuan/${id}`),

  // POST /api/pertemuan/:id/komentar
  addComment: (id, isi) =>
    apiClient.post(`/pertemuan/${id}/komentar`, { isi }),

  // DELETE /api/pertemuan/komentar/:commentId
  deleteComment: (commentId) =>
    apiClient.delete(`/pertemuan/komentar/${commentId}`),
};


// Export instance Axios mentah juga, untuk kebutuhan custom request
export default apiClient;
