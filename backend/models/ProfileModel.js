import pool from '../config/db.js';

const ProfileModel = {
  findByUserIdAndRole: async (userId, role) => {
    if (role === 'warga_belajar') {
      const [rows] = await pool.execute(
        `
          SELECT
            u.id,
            u.nama_lengkap,
            u.email,
            u.role,
            u.is_active,
            COALESCE(bs.path_file, u.foto_profil) AS foto_profil,
            COALESCE(bs.path_file, u.foto_profil) AS pas_foto,
            bs.path_file AS foto_pendaftaran,
            bs.id AS berkas_foto_id,
            wb.id AS profil_id,
            wb.nis,
            wb.nik,
            wb.jenjang,
            wb.tanggal_lahir,
            wb.jenis_kelamin,
            wb.alamat,
            wb.jarak_rumah_km,
            wb.tinggi_badan,
            wb.berat_badan,
            wb.jumlah_saudara_kandung,
            wb.nama_wali,
            wb.no_telp,
            wb.rombel_id,
            wb.tahun_ajaran_id,
            wb.is_aktif,
            r.nama_rombel,
            ta.nama_tahun_ajaran
          FROM users u
          LEFT JOIN warga_belajar wb ON wb.user_id = u.id
          LEFT JOIN rombel r ON r.id = wb.rombel_id
          LEFT JOIN tahun_ajaran ta ON ta.id = wb.tahun_ajaran_id
          LEFT JOIN pendaftar_spmb ps ON ps.id = (
            SELECT p.id FROM pendaftar_spmb p
            WHERE p.warga_belajar_id = wb.id
               OR (wb.nik IS NOT NULL AND wb.nik != '' AND p.nik = wb.nik)
               OR (u.email IS NOT NULL AND u.email != '' AND p.email = u.email)
               OR (u.nama_lengkap IS NOT NULL AND p.nama_lengkap = u.nama_lengkap)
            ORDER BY p.id DESC
            LIMIT 1
          )
          LEFT JOIN berkas_spmb bs ON bs.id = (
            SELECT b.id FROM berkas_spmb b
            WHERE b.pendaftar_id = ps.id
              AND b.jenis_berkas IN ('foto', 'pas_foto', 'pasfoto', 'foto_profil')
            ORDER BY b.id DESC
            LIMIT 1
          )
          WHERE u.id = ?
          ORDER BY bs.id DESC
          LIMIT 1
        `,
        [userId]
      );
      return rows[0];
    }

    if (role === 'tutor') {
      const [rows] = await pool.execute(
        `
          SELECT
            u.id,
            u.nama_lengkap,
            u.email,
            u.role,
            u.is_active,
            u.foto_profil,
            t.id AS profil_id,
            t.nip,
            t.spesialisasi,
            t.no_telp
          FROM users u
          LEFT JOIN tutor t ON t.user_id = u.id
          WHERE u.id = ?
          LIMIT 1
        `,
        [userId]
      );
      return rows[0];
    }

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          nama_lengkap,
          email,
          role,
          is_active,
          foto_profil,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId]
    );
    return rows[0];
  },

  updateUserBasic: async (userId, { nama_lengkap, email }) => {
    const [result] = await pool.execute(
      `
        UPDATE users
        SET nama_lengkap = ?, email = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [nama_lengkap, email, userId]
    );
    return result.affectedRows;
  },

  updateWargaBelajarProfile: async (
    userId,
    { nik, tanggal_lahir, jenis_kelamin, alamat, jarak_rumah_km, tinggi_badan, berat_badan, jumlah_saudara_kandung, nama_wali, no_telp }
  ) => {
    const [result] = await pool.execute(
      `
        UPDATE warga_belajar
        SET
          nik = ?,
          tanggal_lahir = ?,
          jenis_kelamin = ?,
          alamat = ?,
          jarak_rumah_km = ?,
          tinggi_badan = ?,
          berat_badan = ?,
          jumlah_saudara_kandung = ?,
          nama_wali = ?,
          no_telp = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `,
      [
        nik || null,
        tanggal_lahir,
        jenis_kelamin,
        alamat || null,
        jarak_rumah_km !== undefined && jarak_rumah_km !== '' ? jarak_rumah_km : null,
        tinggi_badan !== undefined && tinggi_badan !== '' ? tinggi_badan : null,
        berat_badan !== undefined && berat_badan !== '' ? berat_badan : null,
        jumlah_saudara_kandung !== undefined && jumlah_saudara_kandung !== '' ? jumlah_saudara_kandung : null,
        nama_wali || null,
        no_telp || null,
        userId
      ]
    );
    return result.affectedRows;
  },

  upsertTutorProfile: async (userId, { nip, spesialisasi, no_telp }) => {
    const [result] = await pool.execute(
      `
        INSERT INTO tutor (user_id, nip, spesialisasi, no_telp, created_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          nip = VALUES(nip),
          spesialisasi = VALUES(spesialisasi),
          no_telp = VALUES(no_telp)
      `,
      [userId, nip || null, spesialisasi || null, no_telp || null]
    );
    return result.affectedRows;
  },

  updateFotoProfil: async (userId, foto_profil) => {
    const [result] = await pool.execute(
      `
        UPDATE users
        SET foto_profil = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [foto_profil, userId]
    );
    return result.affectedRows;
  },
};

export default ProfileModel;
