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
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('pkbmbinamandiri.sch.id')) {
      return '/api';
    }
  }
  const rawBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();
  const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
  return cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;
};

const baseURL = getBaseUrl();

const apiClient = axios.create({
  baseURL,
  timeout: 12000,
});

// Helper universal untuk membuat URL file/asset yang aman untuk browser
export const toAssetUrl = (filePath, fallbackBerkasId = null) => {
  if (!filePath) {
    if (fallbackBerkasId) return `/api/spmb/berkas/${fallbackBerkasId}/file`;
    return '';
  }
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const isUpload = normalized.startsWith('uploads/');
  const uploadSubPath = isUpload ? normalized.replace(/^uploads\//, '') : normalized;

  // Standar: gunakan /uploads/... yang dilayani langsung oleh Nginx & diproxy oleh Vite
  return `/uploads/${uploadSubPath}`;
};

// Helper untuk menyediakan daftar kandidat URL untuk failover/fallback otomatis
export const getAssetUrlCandidates = (filePath, berkasId = null) => {
  const list = [];
  if (filePath && /^https?:\/\//i.test(filePath)) {
    list.push(filePath);
  } else if (filePath) {
    const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
    const uploadSubPath = normalized.replace(/^uploads\//, '');

    // Kandidat 1: /api/uploads/... (diteruskan Nginx lewat proxy /api/)
    list.push(`/api/uploads/${uploadSubPath}`);
    // Kandidat 2: /uploads/... (akses langsung jika Nginx punya alias static)
    list.push(`/uploads/${uploadSubPath}`);
    // Kandidat 3: Path dinormalisasi
    list.push(`/${normalized}`);
  }

  // Kandidat 4: Endpoint streaming backend terproteksi/khusus
  if (berkasId) {
    list.push(`/api/spmb/berkas/${berkasId}/file`);
  }

  return [...new Set(list.filter(Boolean))];
};


// ── 2. REQUEST INTERCEPTOR ────────────────────────────────────
// Menyisipkan token JWT dari localStorage ke header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pkbm_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Jika data adalah FormData, hapus Content-Type bawaan agar browser/axios
    // membuat header multipart/form-data beserta boundary unik secara otomatis
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
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
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isAlreadyOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        localStorage.removeItem('pkbm_token');
        localStorage.removeItem('pkbm_user');
        // Arahkan ke halaman login hanya jika sesi expired saat berada di halaman lain
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// ============================================================
// ── 3B. SMART SWR CLIENT-SIDE CACHE & REQUEST DEDUPLICATION ──
// Mempercepat navigasi hingga 0ms, menghilangkan spinner berulang,
// dan mencegah error/blank saat berpindah antar-halaman.
// ============================================================
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 menit
const memoryCache = new Map();
const inFlightRequests = new Map();

export const clearApiCache = (pattern = null) => {
  if (!pattern) {
    memoryCache.clear();
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('pkbm_cache_')) sessionStorage.removeItem(key);
      });
    } catch {}
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('pkbm_cache_') && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};

const getCachedData = (key) => {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data;
  }
  try {
    const raw = sessionStorage.getItem(`pkbm_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {}
  return null;
};

const setCachedData = (key, data) => {
  if (!data || data.status >= 400 || (data.data && data.data.success === false)) return;
  if (typeof Blob !== 'undefined' && data.data instanceof Blob) return;
  if (typeof ArrayBuffer !== 'undefined' && data.data instanceof ArrayBuffer) return;

  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`pkbm_cache_${key}`, JSON.stringify(entry));
  } catch {}
};

const rawGet = apiClient.get.bind(apiClient);

apiClient.get = async (url, config = {}) => {
  if (config.noCache || config.responseType === 'blob' || config.responseType === 'arraybuffer') {
    return rawGet(url, config);
  }

  const cacheKey = `${url}::${JSON.stringify(config.params || {})}`;

  // 1. Deduplikasi request yang sedang berjalan bersamaan
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 2. Cek Cache (SWR - Stale-While-Revalidate)
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    // Jalankan background revalidation secara senyap agar data selalu up-to-date
    rawGet(url, config)
      .then((fresh) => {
        setCachedData(cacheKey, fresh);
      })
      .catch(() => {
        // Abaikan error background revalidation agar UX pengguna tidak terganggu
      });
    return cachedData;
  }

  // 3. Fetch jika belum ada di cache, dengan auto-fallback jika server sementara sibuk
  const fetchPromise = (async () => {
    try {
      const response = await rawGet(url, config);
      setCachedData(cacheKey, response);
      return response;
    } catch (err) {
      const stale = memoryCache.get(cacheKey)?.data;
      if (stale) {
        console.warn(`[SWR Fallback] Memakai data cache lokal untuk ${url}:`, err.message);
        return stale;
      }
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

// Invalidate cache secara otomatis saat ada mutasi data (POST / PUT / DELETE / PATCH)
['post', 'put', 'patch', 'delete'].forEach((method) => {
  const originalMethod = apiClient[method].bind(apiClient);
  apiClient[method] = async (...args) => {
    const res = await originalMethod(...args);
    const url = String(args[0] || '');
    if (url.includes('/siswa')) clearApiCache('/siswa');
    if (url.includes('/auth')) clearApiCache('/auth');
    if (url.includes('/akademik')) {
      clearApiCache('/akademik');
      clearApiCache('/siswa/mapel');
    }
    if (url.includes('/spmb')) clearApiCache('/spmb');
    if (url.includes('/tagihan')) clearApiCache('/tagihan');
    if (url.includes('/absensi')) clearApiCache('/absensi');
    if (url.includes('/ujian')) clearApiCache('/ujian');
    if (url.includes('/pertemuan')) clearApiCache('/pertemuan');
    if (url.includes('/klub')) clearApiCache('/klub');
    if (url.includes('/berita')) clearApiCache('/berita');
    if (url.includes('/modul-buku')) clearApiCache('/modul-buku');
    if (url.includes('/rapor')) clearApiCache('/rapor');
    return res;
  };
});


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

  // GET /api/siswa/kartu/verifikasi/:nis (Publik)
  verifikasiKartuPublik: (nis) =>
    apiClient.get(`/siswa/kartu/verifikasi/${encodeURIComponent(nis)}`),

  // GET /api/siswa/kartu-pelajar-pdf atau /api/siswa/:id/kartu-pelajar-pdf (Blob)
  downloadKartuPelajarPdf: (id) => {
    const url = id ? `/siswa/${id}/kartu-pelajar-pdf` : '/siswa/kartu-pelajar-pdf';
    return apiClient.get(url, { responseType: 'blob' });
  },

  // POST /api/siswa/:id/foto
  // Upload atau perbarui pas foto siswa (Admin/Super Admin)
  uploadFoto: (id, formData) =>
    apiClient.post(`/siswa/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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

  // POST /api/spmb/daftar — PUBLIK, tidak butuh token
  // Menggunakan native fetch untuk FormData murni sehingga boundary dibuat otomatis oleh browser
  daftar: async (payload) => {
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      const url = `${baseURL}/spmb/daftar`;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pkbm_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: payload
      });

      let json = null;
      try {
        json = await res.json();
      } catch (e) {}

      if (!res.ok) {
        const error = new Error(json?.message || `Gagal menghubungi server (HTTP ${res.status})`);
        error.response = { status: res.status, data: json };
        throw error;
      }

      return { data: json };
    }
    return apiClient.post('/spmb/daftar', payload);
  },

  // GET /api/spmb/cek-email?email=... — PUBLIK, validasi ketersediaan email instan
  cekEmail: (email) =>
    apiClient.get('/spmb/cek-email', { params: { email } }),

  // GET /api/spmb/cek-status?q=keyword — PUBLIK, cek status pendaftaran
  cekStatusPublik: (keyword) =>
    apiClient.get('/spmb/cek-status', { params: { q: keyword } }),

  // POST /api/spmb/:id/berkas — Upload berkas (FormData)
  uploadBerkas: async (id, formData) => {
    if (typeof FormData !== 'undefined' && formData instanceof FormData) {
      const url = `${baseURL}/spmb/${id}/berkas`;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pkbm_token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      let json = null;
      try {
        json = await res.json();
      } catch (e) {}

      if (!res.ok) {
        const error = new Error(json?.message || `Gagal unggah berkas (HTTP ${res.status})`);
        error.response = { status: res.status, data: json };
        throw error;
      }

      return { data: json };
    }
    return apiClient.post(`/spmb/${id}/berkas`, formData);
  },

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
  // DELETE /api/spmb/berkas/:berkasId - Hapus berkas pendukung (Admin)
  hapusBerkas: (berkasId) =>
    apiClient.delete('/spmb/berkas/' + berkasId),

  // GET /api/spmb/berkas/:berkasId/file - Dapatkan URL streaming file berkas
  getBerkasFileUrl: (berkasId) =>
    `${baseURL}/spmb/berkas/${berkasId}/file`,

  buatKeputusan: (id, payload) =>
    apiClient.put(`/spmb/${id}/keputusan`, payload),

  // PUT /api/spmb/:id - Update data pendaftar (Admin)
  update: (id, payload) =>
    apiClient.put(`/spmb/${id}`, payload),

  // PUT /api/spmb/:id/batal-terima - Batalkan penerimaan calon siswa & kembalikan ke pending (Admin)
  batalkanPenerimaan: (id, payload = {}) =>
    apiClient.put(`/spmb/${id}/batal-terima`, payload),

  // POST /api/spmb/:id/sinkron-akun - Sinkronisasi paksa akun Warga Belajar (Admin)
  sinkronAkun: (id, payload = {}) =>
    apiClient.post(`/spmb/${id}/sinkron-akun`, payload),
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

  // POST /api/absensi/sesi/:sesiId/checkin — WB check-in mandiri (status & catatan)
  checkIn: (sesiId, payload = {}) =>
    apiClient.post('/absensi/sesi/' + sesiId + '/checkin', payload),

  // GET /api/absensi/rekap/saya — Rekap kehadiran pribadi WB
  getRekapSaya: () =>
    apiClient.get('/absensi/rekap/saya'),

  // GET /api/absensi/rekap-matriks — Rekapitulasi Matriks Presensi LMS
  getRekapMatriks: (params = {}) =>
    apiClient.get('/absensi/rekap-matriks', { params }),

  // PUT /api/absensi/sesi/:sesiId/siswa/:wbId — Update status presensi siswa (Admin/Tutor)
  updateStatusSiswa: (sesiId, wbId, payload) =>
    apiClient.put('/absensi/sesi/' + sesiId + '/siswa/' + wbId, payload),

  // DELETE /api/absensi/sesi/:sesiId — Hapus sesi absensi
  hapusSesi: (sesiId) =>
    apiClient.delete('/absensi/sesi/' + sesiId),

  // GET /api/absensi/siswa/pertemuan — Riwayat pertemuan & presensi LMS siswa
  getRiwayatSiswaLms: (params = {}) =>
    apiClient.get('/absensi/siswa/pertemuan', { params }),
};


// ÔöÇÔöÇ LMS: MATERI, TUGAS, JADWAL ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export const LmsAPI = {

  // MATERI
  getMateriByRombel: (rombelId, params = {}) =>
    apiClient.get(`/lms/materi/rombel/${rombelId}`, { params }),

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
  getTugasByRombel: (rombelId, params = {}) =>
    apiClient.get(`/lms/tugas/rombel/${rombelId}`, { params }),

  getTugasById: (id) =>
    apiClient.get(`/lms/tugas/${id}`),

  createTugas: (payload) =>
    apiClient.post('/lms/tugas', payload),

  deleteTugas: (id) =>
    apiClient.delete(`/lms/tugas/${id}`).catch(err => {
      if (err.response?.status === 404 || err.response?.status === 405) {
        return apiClient.post(`/lms/tugas/${id}/delete`).catch(() => apiClient.delete(`/tugas/${id}`));
      }
      throw err;
    }),

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

  // RPS (Rencana Pembelajaran Semester)
  getRps: (rombelId, mapelId) =>
    apiClient.get('/akademik/rps', { params: { rombel_id: rombelId, mapel_id: mapelId } }),

  uploadRps: (formData) =>
    apiClient.post('/akademik/rps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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


// ── AGENDA & KALENDER KEGIATAN (ADMIN) ───────────────────────
export const AgendaAPI = {
  getAll: () =>
    apiClient.get('/agenda'),

  getById: (id) =>
    apiClient.get(`/agenda/${id}`),

  create: (payload) =>
    apiClient.post('/agenda', payload),

  update: (id, payload) =>
    apiClient.put(`/agenda/${id}`, payload),

  delete: (id) =>
    apiClient.delete(`/agenda/${id}`),
};

// Export instance Axios mentah juga, untuk kebutuhan custom request

// Berita & Dokumentasi Kegiatan PKBM
export const BeritaAPI = {
  getPublished: (params) => apiClient.get('/berita', { params }),
  getAllAdmin: (params) => apiClient.get('/berita/admin', { params }),
  getStats: () => apiClient.get('/berita/stats'),
  getDetail: (idOrSlug) => apiClient.get('/berita/' + idOrSlug),
  create: (formData) => apiClient.post('/berita', formData),
  update: (id, formData) => apiClient.put('/berita/' + id, formData),
  delete: (id) => apiClient.delete('/berita/' + id),
};

// ── MODUL & BUKU DIGITAL (ADMIN & SISWA) ─────────────────────
export const ModulBukuAPI = {
  // Siswa & Publik: Ambil daftar modul yang terbit
  getPublished: (params) => apiClient.get('/modul-buku', { params }),
  
  // Ambil detail modul & increment counter baca
  getDetail: (id, increment = false) =>
    apiClient.get(`/modul-buku/${id}`, { params: { increment: increment ? 1 : 0 } }),
  
  // Admin: Ambil semua data (termasuk draft)
  getAllAdmin: (params) => apiClient.get('/modul-buku/admin', { params }),
  
  // Admin: Ambil statistik modul & buku
  getStats: () => apiClient.get('/modul-buku/stats'),
  
  // Admin: Upload modul baru (FormData)
  create: (formData) => apiClient.post('/modul-buku', formData),
  
  // Admin: Update modul (FormData)
  update: (id, formData) => apiClient.put(`/modul-buku/${id}`, formData),
  
  // Admin: Hapus modul
  delete: (id) => apiClient.delete(`/modul-buku/${id}`),
};

// ── RAPOR SISWA DIGITAL (ADMIN CRUD & SISWA READ-ONLY) ─────────
export const RaporAPI = {
  // Ambil referensi meta (tahun ajaran, rombel, mapel, siswa)
  getMeta: () => apiClient.get('/rapor/meta'),

  // Admin: Ambil daftar seluruh rapor siswa (bisa filter tahun ajaran, semester, rombel, search)
  getAll: (params) => apiClient.get('/rapor', { params }),

  // Siswa: Ambil rapor milik siswa yang sedang login (Read-Only)
  getMyRapor: (params) => apiClient.get('/rapor/siswa/me', { params }),

  // Ambil detail satu rapor (header + detail nilai mata pelajaran)
  getById: (id) => apiClient.get(`/rapor/${id}`),

  // Admin: Buat rapor baru (Create)
  create: (data) => apiClient.post('/rapor', data),

  // Admin: Perbarui rapor (Update)
  update: (id, data) => apiClient.put(`/rapor/${id}`, data),

  // Admin: Hapus rapor (Delete)
  delete: (id) => apiClient.delete(`/rapor/${id}`),
};

export default apiClient;

