// ============================================================
// controllers/SpmbController.js
// Menangani semua alur SPMB (Seleksi Penerimaan Murid/Warga Baru):
// - Pendaftaran publik (tanpa login)
// - Upload berkas calon WB
// - Verifikasi & keputusan Admin TU
// - Pipeline otomatis saat status = 'diterima'
// ============================================================

import SpmbModel from '../models/SpmbModel.js';
import UserModel from '../models/UserModel.js';
import SiswaModel from '../models/SiswaModel.js';
import { hashPassword, generateNIS } from '../utils/helpers.js';
import pool from '../config/db.js';

const SpmbController = {

  // -----------------------------------------------------------
  // POST /api/spmb/daftar  [PUBLIK — tanpa login]
  // Calon WB mengisi & submit form pendaftaran online
  // Body: { nama_lengkap, email, no_telp, jenjang_daftar,
  //         tanggal_lahir, jenis_kelamin, alamat, nama_wali }
  // -----------------------------------------------------------
  daftar: async (req, res) => {
    try {
      const {
        nama_lengkap, email, nik, no_telp, jenjang_daftar,
        tanggal_lahir, jenis_kelamin, alamat, nama_wali, password,
      } = req.body;

      // Validasi field wajib
      if (!nama_lengkap || !email || !no_telp || !jenjang_daftar ||
          !tanggal_lahir || !jenis_kelamin || !alamat || !nama_wali || !password) {
        return res.status(400).json({
          success: false,
          message: 'Semua field wajib diisi. Pastikan tidak ada yang kosong.',
        });
      }

      if (String(password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 8 karakter.',
        });
      }

      // Validasi format jenjang
      const jenjangValid = ['paket_a', 'paket_b', 'paket_c'];
      if (!jenjangValid.includes(jenjang_daftar)) {
        return res.status(400).json({
          success: false,
          message: 'Jenjang tidak valid. Pilih: paket_a, paket_b, atau paket_c.',
        });
      }

      // Ambil tahun ajaran aktif dari database
      const [taRows] = await pool.execute(
        `SELECT id FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
      );
      if (!taRows[0]) {
        return res.status(503).json({
          success: false,
          message: 'Pendaftaran belum dibuka. Tahun ajaran aktif belum dikonfigurasi.',
        });
      }
      const tahun_ajaran_id = taRows[0].id;

      const password_hash = await hashPassword(password);

      // Cek duplikasi: email yang sama di tahun ajaran yang sama
      const sudahDaftar = await SpmbModel.cekEmailTerdaftar(email, tahun_ajaran_id);
      if (sudahDaftar) {
        return res.status(409).json({
          success: false,
          message: 'Email ini sudah pernah mendaftar pada tahun ajaran aktif. ' +
                   'Silakan hubungi staf TU untuk informasi lebih lanjut.',
        });
      }

      // Simpan data pendaftaran ke database (status awal: 'pending')
      const pendaftarId = await SpmbModel.create({
        nama_lengkap, email, nik, no_telp, jenjang_daftar,
        tanggal_lahir, jenis_kelamin, alamat, nama_wali, password_hash, tahun_ajaran_id,
      });

      return res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil dikirim! Silakan upload berkas pendukung.',
        data: {
          pendaftar_id: pendaftarId,
          // Kembalikan ID agar frontend bisa langsung redirect ke halaman upload berkas
          pesan: 'Simpan nomor pendaftaran Anda: #' + pendaftarId,
        },
      });

    } catch (error) {
      console.error('[SpmbController.daftar] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan pendaftaran.' });
    }
  },

  // -----------------------------------------------------------
  // POST /api/spmb/:id/berkas  [PUBLIK — tanpa login]
  // Upload berkas pendukung (KK, ijazah, foto) untuk satu pendaftar
  // Menggunakan Multer — file sudah tersimpan ke disk oleh middleware
  // -----------------------------------------------------------
  uploadBerkas: async (req, res) => {
    try {
      const { id } = req.params;
      const { jenis_berkas } = req.body;

      // Pastikan file benar-benar terupload oleh Multer
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada file yang diupload.',
        });
      }

      // Validasi jenis berkas
      const jenisValid = ['kk', 'ijazah', 'foto', 'dokumen_lain'];
      if (!jenis_berkas || !jenisValid.includes(jenis_berkas)) {
        return res.status(400).json({
          success: false,
          message: 'Jenis berkas tidak valid. Pilih: kk, ijazah, foto, atau dokumen_lain.',
        });
      }

      // Pastikan pendaftar dengan ID ini memang ada
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      // Simpan info berkas ke database
      const berkasId = await SpmbModel.tambahBerkas({
        pendaftar_id: parseInt(id),
        jenis_berkas,
        nama_file: req.file.originalname,
        // Path disimpan relatif dari root backend, akses via /uploads/spmb/namafile
        path_file: req.file.path,
      });

      return res.status(201).json({
        success: true,
        message: `Berkas '${jenis_berkas}' berhasil diupload.`,
        data: { berkas_id: berkasId, path: req.file.path },
      });

    } catch (error) {
      console.error('[SpmbController.uploadBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengupload berkas.' });
    }
  },

  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // GET /api/spmb/cek-status  [PUBLIK — tanpa login]
  // Mengecek status pendaftaran calon WB berdasarkan email, ID, atau nama
  // -----------------------------------------------------------
  cekStatusPublik: async (req, res) => {
    try {
      const q = req.query.q || req.query.email || req.query.id || req.query.nama;
      if (!q || !String(q).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Harap masukkan alamat email, nomor pendaftaran, atau nama lengkap Anda.',
        });
      }

      const keyword = String(q).trim();
      const searchNum = (!isNaN(keyword) && !keyword.includes('@')) ? parseInt(keyword) : -1;
      const searchLike = `%${keyword}%`;

      const sql = `
        SELECT p.id, p.nama_lengkap, p.email, p.nik, p.no_telp, p.jenjang_daftar, p.status,
               p.catatan_verifikasi, p.warga_belajar_id, p.created_at,
               ta.nama_tahun_ajaran,
               wb.nis,
               r.nama_rombel
        FROM pendaftar_spmb p
        LEFT JOIN tahun_ajaran ta ON ta.id = p.tahun_ajaran_id
        LEFT JOIN warga_belajar wb ON wb.id = p.warga_belajar_id
        LEFT JOIN rombel r ON r.id = wb.rombel_id
        WHERE p.id = ?
           OR LOWER(p.email) = LOWER(?)
           OR LOWER(p.nama_lengkap) LIKE LOWER(?)
           OR p.nik = ?
           OR p.no_telp LIKE ?
        ORDER BY p.id DESC
        LIMIT 1
      `;
      const params = [searchNum, keyword, searchLike, keyword, searchLike];

      const [rows] = await pool.execute(sql, params);

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: `Data pendaftaran tidak ditemukan untuk "${keyword}". Pastikan nama lengkap, email, atau nomor pendaftaran Anda sudah sesuai.`,
        });
      }

      const p = rows[0];

      // Jika pendaftar sudah diterima namun akun WB belum tersinkron, jalankan auto-sync
      if (p.status === 'diterima' && !p.warga_belajar_id) {
        try {
          const syncResult = await ensureWargaBelajarAccount(p.id, null, null);
          if (syncResult) {
            p.warga_belajar_id = syncResult.wbId;
            p.nis = syncResult.nis;
          }
        } catch (syncErr) {
          console.warn('[SpmbController.cekStatusPublik] Auto-sync WB failed:', syncErr.message);
        }
      }

      // Ambil berkas-berkas pendukung
      const [berkasRows] = await pool.execute(
        `SELECT id, jenis_berkas, nama_file, status_verifikasi, catatan FROM berkas_spmb WHERE pendaftar_id = ?`,
        [p.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Status pendaftaran berhasil ditemukan.',
        data: {
          id: p.id,
          nama_lengkap: p.nama_lengkap,
          email: p.email,
          email_masked: p.email ? p.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length))) : '',
          jenjang_daftar: p.jenjang_daftar,
          tahun_ajaran: p.nama_tahun_ajaran || '2025/2026',
          status: p.status, // 'pending', 'diterima', 'ditolak'
          catatan_verifikasi: p.catatan_verifikasi,
          warga_belajar_id: p.warga_belajar_id,
          nis: p.nis || (p.status === 'diterima' ? 'Terdaftar Resmi' : null),
          nama_rombel: p.nama_rombel || (p.status === 'diterima' ? 'Dalam Penetapan' : null),
          created_at: p.created_at,
          berkas: berkasRows || [],
        },
      });
    } catch (error) {
      console.error('[SpmbController.cekStatusPublik] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memeriksa status pendaftaran.',
      });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb  [Admin, Super Admin]
  // Ambil semua pendaftar untuk antrian verifikasi
  // Query params opsional: ?status=pending&tahun_ajaran_id=1
  // -----------------------------------------------------------
  getAll: async (req, res) => {
    try {
      const { status, tahun_ajaran_id } = req.query;
      let pendaftar = await SpmbModel.findAll({
        status: status || null,
        tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
      });

      // Auto-heal pendaftar 'diterima' yang belum punya warga_belajar_id
      let needsRefresh = false;
      for (const p of pendaftar) {
        if (p.status === 'diterima' && !p.warga_belajar_id) {
          try {
            await ensureWargaBelajarAccount(p.id, null, p.diverifikasi_oleh);
            needsRefresh = true;
          } catch (healErr) {
            console.warn(`[SpmbController.getAll] Auto-heal WB failed for ID ${p.id}:`, healErr.message);
          }
        }
      }

      if (needsRefresh) {
        pendaftar = await SpmbModel.findAll({
          status: status || null,
          tahun_ajaran_id: tahun_ajaran_id ? parseInt(tahun_ajaran_id) : null,
        });
      }

      return res.status(200).json({
        success: true,
        message: `${pendaftar.length} data pendaftar ditemukan.`,
        data: pendaftar,
      });
    } catch (error) {
      console.error('[SpmbController.getAll] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // GET /api/spmb/statistik  [Admin, Pimpinan, Super Admin]
  // Widget angka ringkasan: total, pending, diterima, ditolak
  // -----------------------------------------------------------
  getStatistik: async (req, res) => {
    try {
      const statistik = await SpmbModel.getStatistik();
      return res.status(200).json({ success: true, data: statistik });
    } catch (error) {
      console.error('[SpmbController.getStatistik] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil statistik SPMB.' });
    }
  },

  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // GET /api/spmb/:id  [Admin, Super Admin]
  // Detail satu pendaftar beserta semua berkas yang diupload
  // -----------------------------------------------------------
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      let pendaftar = await SpmbModel.findById(parseInt(id));

      if (!pendaftar) {
        return res.status(404).json({
          success: false,
          message: `Pendaftar dengan ID ${id} tidak ditemukan.`,
        });
      }

      // Self-healing: jika status diterima tapi warga_belajar_id masih null, sinkronkan otomatis
      if (pendaftar.status === 'diterima' && !pendaftar.warga_belajar_id) {
        try {
          const syncResult = await ensureWargaBelajarAccount(pendaftar.id, null, pendaftar.diverifikasi_oleh);
          if (syncResult) {
            pendaftar = await SpmbModel.findById(parseInt(id));
          }
        } catch (repairErr) {
          console.warn('[SpmbController.getById] Auto-repair WB failed:', repairErr.message);
        }
      }

      return res.status(200).json({ success: true, data: pendaftar });
    } catch (error) {
      console.error('[SpmbController.getById] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil detail pendaftar.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/berkas/:berkasId/verifikasi  [Admin]
  // Admin memverifikasi satu berkas: valid atau tidak_valid
  // Body: { status_verifikasi: 'valid'|'tidak_valid', catatan }
  // -----------------------------------------------------------
  verifikasiBerkas: async (req, res) => {
    try {
      const { berkasId } = req.params;
      const { status_verifikasi, catatan } = req.body;

      const statusValid = ['valid', 'tidak_valid'];
      if (!status_verifikasi || !statusValid.includes(status_verifikasi)) {
        return res.status(400).json({
          success: false,
          message: 'Status verifikasi harus "valid" atau "tidak_valid".',
        });
      }

      const affected = await SpmbModel.updateStatusBerkas(parseInt(berkasId), {
        status_verifikasi,
        catatan: catatan || null,
      });

      if (affected === 0) {
        return res.status(404).json({ success: false, message: 'Berkas tidak ditemukan.' });
      }

      return res.status(200).json({
        success: true,
        message: `Berkas berhasil ditandai sebagai '${status_verifikasi}'.`,
      });
    } catch (error) {
      console.error('[SpmbController.verifikasiBerkas] Error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memverifikasi berkas.' });
    }
  },

  // -----------------------------------------------------------
  // PUT /api/spmb/:id/keputusan  [Admin]
  // Keputusan akhir: TERIMA atau TOLAK pendaftar
  // Body: { status: 'diterima'|'ditolak', catatan_verifikasi, rombel_id }
  // -----------------------------------------------------------
  buatKeputusan: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, catatan_verifikasi, rombel_id } = req.body;

      // Validasi input
      const statusValid = ['diterima', 'ditolak'];
      if (!status || !statusValid.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus "diterima" atau "ditolak".',
        });
      }

      // Ambil data pendaftar
      const pendaftar = await SpmbModel.findById(parseInt(id));
      if (!pendaftar) {
        return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan.' });
      }

      // Jika pendaftar sudah diterima dan sudah punya akun WB, izinkan update rombel / catatan
      if (status === 'diterima') {
        const syncResult = await ensureWargaBelajarAccount(
          parseInt(id),
          rombel_id,
          req.user?.id || pendaftar.diverifikasi_oleh
        );

        if (catatan_verifikasi) {
          await pool.execute(
            `UPDATE pendaftar_spmb SET catatan_verifikasi = ? WHERE id = ?`,
            [catatan_verifikasi, parseInt(id)]
          );
        }

        return res.status(200).json({
          success: true,
          message: `Pendaftar '${pendaftar.nama_lengkap}' berhasil DITERIMA. Akun Warga Belajar telah aktif. NIS: ${syncResult.nis}.`,
          data: {
            warga_belajar_id: syncResult.wbId,
            nis: syncResult.nis,
            user_id: syncResult.userId,
            rombel_id: syncResult.rombelId,
          },
        });
      }

      // Jika ditolak
      await pool.execute(
        `UPDATE pendaftar_spmb
         SET status = 'ditolak',
             catatan_verifikasi = ?,
             diverifikasi_oleh = ?,
             tanggal_verifikasi = NOW()
         WHERE id = ?`,
        [catatan_verifikasi || null, req.user?.id || 1, parseInt(id)]
      );

      return res.status(200).json({
        success: true,
        message: `Pendaftar '${pendaftar.nama_lengkap}' telah DITOLAK.`,
      });

    } catch (error) {
      console.error('[SpmbController.buatKeputusan] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses keputusan SPMB. Error: ' + error.message,
      });
    }
  },
};

// -----------------------------------------------------------
// Helper universal sinkronisasi / pembuatan akun Warga Belajar
// -----------------------------------------------------------
export const ensureWargaBelajarAccount = async (pendaftarId, rombelIdParam = null, adminUserId = null) => {
  const [pRows] = await pool.execute(`SELECT * FROM pendaftar_spmb WHERE id = ? LIMIT 1`, [pendaftarId]);
  if (!pRows.length) return null;
  const pendaftar = pRows[0];

  // 1. Dapatkan atau pilih rombel yang tepat
  let chosenRombelId = rombelIdParam ? parseInt(rombelIdParam) : null;
  if (!chosenRombelId) {
    const [rombelRows] = await pool.execute(
      `SELECT r.id FROM rombel r JOIN tahun_ajaran ta ON ta.id = r.tahun_ajaran_id WHERE ta.is_aktif = 1 AND r.jenjang = ? LIMIT 1`,
      [pendaftar.jenjang_daftar]
    );
    if (rombelRows.length > 0) {
      chosenRombelId = rombelRows[0].id;
    } else {
      const [anyRombel] = await pool.execute(`SELECT id FROM rombel LIMIT 1`);
      if (anyRombel.length > 0) chosenRombelId = anyRombel[0].id;
    }
  }

  // 2. Tahun ajaran aktif
  const [taRows] = await pool.execute(
    `SELECT id, nama_tahun_ajaran FROM tahun_ajaran WHERE is_aktif = 1 LIMIT 1`
  );
  const tahunAjaranAktif = taRows[0];
  const tahun_ajaran_id = tahunAjaranAktif?.id || pendaftar.tahun_ajaran_id || 1;

  // 3. User account (cek duplikasi email)
  let userId;
  const existingUser = await UserModel.findByEmail(pendaftar.email);
  if (existingUser) {
    userId = existingUser.id;
    if (existingUser.role !== 'warga_belajar') {
      await pool.execute(`UPDATE users SET role = 'warga_belajar' WHERE id = ?`, [userId]);
    }
  } else {
    const password_hash = pendaftar.password_hash || await hashPassword(pendaftar.no_telp || '12345678');
    const [uResult] = await pool.execute(
      `INSERT INTO users (nama_lengkap, email, password_hash, role, is_active, created_at)
       VALUES (?, ?, ?, 'warga_belajar', 1, NOW())`,
      [pendaftar.nama_lengkap, pendaftar.email, password_hash]
    );
    userId = uResult.insertId;
  }

  // 4. Profil Warga Belajar
  let wbId;
  let nis;
  const [wbRows] = await pool.execute(
    `SELECT id, nis, rombel_id FROM warga_belajar WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (wbRows.length > 0) {
    wbId = wbRows[0].id;
    nis = wbRows[0].nis;
    if (chosenRombelId && wbRows[0].rombel_id !== chosenRombelId) {
      await pool.execute(`UPDATE warga_belajar SET rombel_id = ? WHERE id = ?`, [chosenRombelId, wbId]);
    }
  } else {
    const [cntRows] = await pool.execute(`SELECT COUNT(*) AS total FROM warga_belajar`);
    const totalWb = cntRows[0]?.total || 0;
    nis = generateNIS(totalWb + 1, tahunAjaranAktif?.nama_tahun_ajaran || '2025/2026');

    const [wbResult] = await pool.execute(
      `INSERT INTO warga_belajar
        (user_id, nis, nik, jenjang, tanggal_lahir, jenis_kelamin, alamat, nama_wali, no_telp, rombel_id, tahun_ajaran_id, is_aktif, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        userId,
        nis,
        pendaftar.nik || null,
        pendaftar.jenjang_daftar,
        pendaftar.tanggal_lahir,
        pendaftar.jenis_kelamin,
        pendaftar.alamat,
        pendaftar.nama_wali,
        pendaftar.no_telp,
        chosenRombelId,
        tahun_ajaran_id,
      ]
    );
    wbId = wbResult.insertId;
  }

  // 5. Update pendaftar_spmb dengan id warga_belajar
  await pool.execute(
    `UPDATE pendaftar_spmb
     SET status = 'diterima',
         warga_belajar_id = ?,
         diverifikasi_oleh = COALESCE(?, diverifikasi_oleh, 1),
         tanggal_verifikasi = COALESCE(tanggal_verifikasi, NOW())
     WHERE id = ?`,
    [wbId, adminUserId, pendaftarId]
  );

  // 6. Validasi berkas pendukung yang telah diunggah
  await pool.execute(
    `UPDATE berkas_spmb SET status_verifikasi = 'valid' WHERE pendaftar_id = ? AND status_verifikasi != 'tidak_valid'`,
    [pendaftarId]
  );

  return { userId, wbId, nis, rombelId: chosenRombelId };
};

export default SpmbController;
