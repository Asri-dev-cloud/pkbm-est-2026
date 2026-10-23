import UjianAdministrasiModel from '../models/UjianAdministrasiModel.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKartuUjianPdf } from '../utils/kartuUjianPdf.js';

const VALID_JENIS_UJIAN = ['uts', 'uas'];
const VALID_SEMESTER = ['ganjil', 'genap'];
const VALID_STATUS_PEMBAYARAN = ['belum_bayar', 'menunggu_verifikasi', 'ditolak', 'lunas'];
const VALID_STATUS_KELAYAKAN = ['belum_layak', 'layak'];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');

const toPublicFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/${normalized}`;
};

const withKartuUrl = (req, payload) => {
  if (!payload) return payload;
  return {
    ...payload,
    kartu_ujian_url: toPublicFileUrl(req, payload.kartu_ujian_file),
  };
};

export const PeriodeUjianController = {
  getAll: async (req, res) => {
    try {
      const { is_active, tahun_ajaran_id } = req.query;
      const data = await UjianAdministrasiModel.findAllPeriode({
        is_active: is_active !== undefined && is_active !== '' ? parseInt(is_active) : null,
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[PeriodeUjianController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data periode ujian.' });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await UjianAdministrasiModel.findPeriodeById(parseInt(req.params.id));
      if (!data) {
        return res.status(404).json({ success: false, message: 'Periode ujian tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[PeriodeUjianController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail periode ujian.' });
    }
  },

  create: async (req, res) => {
    try {
      const { nama_periode, jenis_ujian, semester, tahun_ajaran_id, tanggal_mulai, tanggal_selesai, is_active = true } = req.body;
      if (!nama_periode || !jenis_ujian || !semester || !tahun_ajaran_id || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ success: false, message: 'Semua field periode ujian wajib diisi.' });
      }
      if (!VALID_JENIS_UJIAN.includes(jenis_ujian)) {
        return res.status(400).json({ success: false, message: 'jenis_ujian harus uts atau uas.' });
      }
      if (!VALID_SEMESTER.includes(semester)) {
        return res.status(400).json({ success: false, message: 'semester harus ganjil atau genap.' });
      }

      const id = await UjianAdministrasiModel.createPeriode({
        nama_periode: String(nama_periode).trim(),
        jenis_ujian,
        semester,
        tahun_ajaran_id: parseInt(tahun_ajaran_id),
        tanggal_mulai,
        tanggal_selesai,
        is_active: Boolean(is_active),
      });

      return res.status(201).json({ success: true, message: 'Periode ujian berhasil dibuat.', data: { id } });
    } catch (error) {
      console.error('[PeriodeUjianController.create] Error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Periode ujian untuk jenis, semester, dan tahun ajaran tersebut sudah ada.' });
      }
      return res.status(500).json({ success: false, message: 'Gagal membuat periode ujian.' });
    }
  },

  update: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nama_periode, jenis_ujian, semester, tahun_ajaran_id, tanggal_mulai, tanggal_selesai, is_active = true } = req.body;
      if (!nama_periode || !jenis_ujian || !semester || !tahun_ajaran_id || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ success: false, message: 'Semua field periode ujian wajib diisi.' });
      }
      if (!VALID_JENIS_UJIAN.includes(jenis_ujian)) {
        return res.status(400).json({ success: false, message: 'jenis_ujian harus uts atau uas.' });
      }
      if (!VALID_SEMESTER.includes(semester)) {
        return res.status(400).json({ success: false, message: 'semester harus ganjil atau genap.' });
      }

      const affected = await UjianAdministrasiModel.updatePeriode(id, {
        nama_periode: String(nama_periode).trim(),
        jenis_ujian,
        semester,
        tahun_ajaran_id: parseInt(tahun_ajaran_id),
        tanggal_mulai,
        tanggal_selesai,
        is_active: Boolean(is_active),
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Periode ujian tidak ditemukan.' });
      }

      return res.status(200).json({ success: true, message: 'Periode ujian berhasil diperbarui.' });
    } catch (error) {
      console.error('[PeriodeUjianController.update] Error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Periode ujian untuk jenis, semester, dan tahun ajaran tersebut sudah ada.' });
      }
      return res.status(500).json({ success: false, message: 'Gagal memperbarui periode ujian.' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { is_active } = req.body;
      if (is_active === undefined) {
        return res.status(400).json({ success: false, message: 'Status aktif wajib diisi.' });
      }
      const affected = await UjianAdministrasiModel.updatePeriodeStatus(parseInt(req.params.id), Boolean(is_active));
      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Periode ujian tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, message: 'Status periode ujian berhasil diperbarui.' });
    } catch (error) {
      console.error('[PeriodeUjianController.updateStatus] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui status periode ujian.' });
    }
  },
};

export const PesertaUjianController = {
  getAll: async (req, res) => {
    try {
      const { periode_ujian_id, rombel_id, status_pembayaran, status_kelayakan } = req.query;
      const data = await UjianAdministrasiModel.findAllPesertaUjian({
        periode_ujian_id: periode_ujian_id ? parseInt(periode_ujian_id) : null,
        rombel_id: rombel_id ? parseInt(rombel_id) : null,
        status_pembayaran: status_pembayaran || null,
        status_kelayakan: status_kelayakan || null,
      });
      return res.status(200).json({ success: true, data: data.map((item) => withKartuUrl(req, item)) });
    } catch (error) {
      console.error('[PesertaUjianController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil daftar peserta ujian.' });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await UjianAdministrasiModel.findPesertaUjianById(parseInt(req.params.id));
      if (!data) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }
      const mapel = await UjianAdministrasiModel.findPesertaUjianMapel(data.id);
      return res.status(200).json({ success: true, data: withKartuUrl(req, { ...data, mapel }) });
    } catch (error) {
      console.error('[PesertaUjianController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail peserta ujian.' });
    }
  },

  getMine: async (req, res) => {
    try {
      const data = await UjianAdministrasiModel.findPesertaUjianByUserId(req.user.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Data peserta ujian aktif belum tersedia untuk akun Anda.' });
      }
      const mapel = await UjianAdministrasiModel.findPesertaUjianMapel(data.id);
      return res.status(200).json({ success: true, data: withKartuUrl(req, { ...data, mapel }) });
    } catch (error) {
      console.error('[PesertaUjianController.getMine] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data peserta ujian Anda.' });
    }
  },

  getMyMapel: async (req, res) => {
    try {
      const data = await UjianAdministrasiModel.findPesertaUjianByUserId(req.user.id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Data peserta ujian aktif belum tersedia untuk akun Anda.' });
      }
      const mapel = await UjianAdministrasiModel.findPesertaUjianMapel(data.id);
      return res.status(200).json({ success: true, data: mapel });
    } catch (error) {
      console.error('[PesertaUjianController.getMyMapel] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil mapel ujian Anda.' });
    }
  },

  generatePeserta: async (req, res) => {
    try {
      const { periode_ujian_id } = req.body;
      if (!periode_ujian_id) {
        return res.status(400).json({ success: false, message: 'periode_ujian_id wajib diisi.' });
      }

      const periode = await UjianAdministrasiModel.findPeriodeById(parseInt(periode_ujian_id));
      if (!periode) {
        return res.status(404).json({ success: false, message: 'Periode ujian tidak ditemukan.' });
      }

      const paketList = await UjianAdministrasiModel.findActivePaketForPeriode(parseInt(periode_ujian_id));
      if (paketList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Belum ada paket ujian aktif yang sesuai dengan periode ujian ini.',
        });
      }

      const paketByRombel = paketList.reduce((acc, item) => {
        if (!item.mapel_id) return acc;
        const key = String(item.rombel_id);
        if (!acc[key]) acc[key] = [];
        if (!acc[key].some((row) => row.mapel_id === item.mapel_id && row.paket_ujian_id === item.paket_ujian_id)) {
          acc[key].push(item);
        }
        return acc;
      }, {});

      let pesertaCreated = 0;
      let pesertaReused = 0;
      let mapelAttached = 0;

      for (const [rombelId, paketRombel] of Object.entries(paketByRombel)) {
        const siswaList = await UjianAdministrasiModel.findActiveWargaBelajarByRombel(parseInt(rombelId));
        for (const siswa of siswaList) {
          let peserta = await UjianAdministrasiModel.findPesertaUjianByWbAndPeriode(siswa.id, parseInt(periode_ujian_id));

          if (!peserta) {
            const pesertaId = await UjianAdministrasiModel.createPesertaUjian({
              warga_belajar_id: siswa.id,
              rombel_id: parseInt(rombelId),
              periode_ujian_id: parseInt(periode_ujian_id),
            });
            peserta = {
              id: pesertaId,
              warga_belajar_id: siswa.id,
              rombel_id: parseInt(rombelId),
              periode_ujian_id: parseInt(periode_ujian_id),
            };
            pesertaCreated += 1;
          } else {
            pesertaReused += 1;
          }

          for (const paket of paketRombel) {
            const exists = await UjianAdministrasiModel.findPesertaUjianMapelRow(peserta.id, paket.mapel_id);
            if (exists) continue;

            await UjianAdministrasiModel.createPesertaUjianMapel({
              peserta_ujian_id: peserta.id,
              mapel_id: paket.mapel_id,
              paket_ujian_id: paket.paket_ujian_id,
            });
            mapelAttached += 1;
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Peserta ujian berhasil didaftarkan.',
        data: {
          periode_ujian_id: parseInt(periode_ujian_id),
          peserta_created: pesertaCreated,
          peserta_reused: pesertaReused,
          mapel_attached: mapelAttached,
        },
      });
    } catch (error) {
      console.error('[PesertaUjianController.generatePeserta] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mendaftarkan peserta ujian.' });
    }
  },

  verifyPembayaran: async (req, res) => {
    try {
      const { status_pembayaran, catatan_verifikasi } = req.body;
      if (!status_pembayaran || !VALID_STATUS_PEMBAYARAN.includes(status_pembayaran)) {
        return res.status(400).json({ success: false, message: 'status_pembayaran tidak valid.' });
      }

      const peserta = await UjianAdministrasiModel.findPesertaUjianById(parseInt(req.params.id));
      if (!peserta) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }

      const affected = await UjianAdministrasiModel.updateStatusPembayaran(parseInt(req.params.id), {
        status_pembayaran,
        catatan_verifikasi,
        verified_by: req.user.id,
        verified_at: new Date(),
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Status pembayaran peserta ujian berhasil diperbarui.',
      });
    } catch (error) {
      console.error('[PesertaUjianController.verifyPembayaran] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memverifikasi pembayaran ujian.' });
    }
  },

  updateKelayakan: async (req, res) => {
    try {
      const { status_kelayakan } = req.body;
      if (!status_kelayakan || !VALID_STATUS_KELAYAKAN.includes(status_kelayakan)) {
        return res.status(400).json({ success: false, message: 'status_kelayakan tidak valid.' });
      }

      const peserta = await UjianAdministrasiModel.findPesertaUjianById(parseInt(req.params.id));
      if (!peserta) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }

      if (status_kelayakan === 'layak' && peserta.status_pembayaran !== 'lunas') {
        return res.status(400).json({
          success: false,
          message: 'Peserta hanya bisa dinyatakan layak jika status pembayaran sudah lunas.',
        });
      }

      const affected = await UjianAdministrasiModel.updateStatusKelayakan(parseInt(req.params.id), status_kelayakan);
      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Status kelayakan peserta ujian berhasil diperbarui.',
      });
    } catch (error) {
      console.error('[PesertaUjianController.updateKelayakan] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui status kelayakan peserta ujian.' });
    }
  },

  generateKartu: async (req, res) => {
    try {
      const peserta = await UjianAdministrasiModel.findPesertaUjianById(parseInt(req.params.id));
      if (!peserta) {
        return res.status(404).json({ success: false, message: 'Peserta ujian tidak ditemukan.' });
      }

      if (peserta.status_pembayaran !== 'lunas') {
        return res.status(400).json({ success: false, message: 'Kartu ujian hanya bisa dibuat jika pembayaran sudah lunas.' });
      }
      if (peserta.status_kelayakan !== 'layak') {
        return res.status(400).json({ success: false, message: 'Kartu ujian hanya bisa dibuat jika peserta sudah dinyatakan layak.' });
      }

      const mapel = await UjianAdministrasiModel.findPesertaUjianMapel(peserta.id);
      if (!mapel.length) {
        return res.status(400).json({ success: false, message: 'Peserta ini belum memiliki mapel ujian.' });
      }

      const fileName = `kartu-ujian-${peserta.nis}-${peserta.id}.pdf`;
      const relativePath = path.posix.join('uploads', 'kartu_ujian', fileName);
      const absolutePath = path.resolve(backendRootDir, relativePath);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await buildKartuUjianPdf({ peserta, mapel, outputPath: absolutePath });
      await UjianAdministrasiModel.updateKartuUjianFile(peserta.id, relativePath);

      return res.status(200).json({
        success: true,
        message: 'Kartu ujian berhasil dibuat.',
        data: {
          peserta_ujian_id: peserta.id,
          kartu_ujian_file: relativePath,
          kartu_ujian_url: toPublicFileUrl(req, relativePath),
        },
      });
    } catch (error) {
      console.error('[PesertaUjianController.generateKartu] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat kartu ujian PDF.' });
    }
  },
};
