// ============================================================
// config/db.js
// Konfigurasi koneksi ke database MySQL menggunakan mysql2
// Menggunakan Pool Connection agar koneksi efisien dan bisa
// digunakan bersamaan oleh banyak request secara paralel.
// ============================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Muat variabel dari file .env
dotenv.config();

// Buat pool koneksi (kumpulan koneksi siap pakai)
// Pool lebih efisien daripada membuka-tutup koneksi baru tiap request
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'pkbm_bina_mandiri',

  // Jumlah maksimum koneksi dalam pool
  connectionLimit: 10,

  // Kembalikan BigInt sebagai string agar aman di JSON
  supportBigNumbers: true,
  bigNumberStrings:  true,

  // Otomatis reconnect jika koneksi terputus
  waitForConnections: true,
  queueLimit: 0,
});

// Fungsi untuk menguji koneksi saat server pertama kali berjalan
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Koneksi database MySQL berhasil!');
    console.log(`   Host: ${process.env.DB_HOST} | DB: ${process.env.DB_NAME}`);
    connection.release(); // Kembalikan koneksi ke pool setelah selesai diuji

    // Otomatis pastikan kolom schema baru tersedia
    try {
      await pool.query(
        'ALTER TABLE rombel_mapel ADD COLUMN rps_file_path VARCHAR(255) NULL DEFAULT NULL AFTER urutan'
      );
      console.log('✅ Kolom rps_file_path berhasil ditambahkan ke tabel rombel_mapel.');
    } catch (migErr) {
      if (migErr.code !== 'ER_DUP_COLUMN_NAME') {
        // Abaikan jika sudah ada (ER_DUP_COLUMN_NAME)
      }
    }

    // Otomatis pastikan kolom Dapodik tersedia di pendaftar_spmb & warga_belajar
    const dapodikColumns = [
      { table: 'pendaftar_spmb', col: 'jarak_rumah_km', def: 'DECIMAL(5,1) NULL DEFAULT NULL COMMENT "Jarak rumah ke sekolah (km)"' },
      { table: 'pendaftar_spmb', col: 'tinggi_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Tinggi badan (cm)"' },
      { table: 'pendaftar_spmb', col: 'berat_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Berat badan (kg)"' },
      { table: 'pendaftar_spmb', col: 'jumlah_saudara_kandung', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Jumlah saudara kandung"' },
      { table: 'warga_belajar', col: 'jarak_rumah_km', def: 'DECIMAL(5,1) NULL DEFAULT NULL COMMENT "Jarak rumah ke sekolah (km)"' },
      { table: 'warga_belajar', col: 'tinggi_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Tinggi badan (cm)"' },
      { table: 'warga_belajar', col: 'berat_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Berat badan (kg)"' },
      { table: 'warga_belajar', col: 'jumlah_saudara_kandung', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Jumlah saudara kandung"' },
      { table: 'rekaman_kehadiran', col: 'catatan', def: 'VARCHAR(255) NULL DEFAULT NULL COMMENT "Keterangan alasan izin/sakit/presensi"' },
      { table: 'sesi_absensi', col: 'pertemuan_ke', def: 'INT UNSIGNED NULL DEFAULT 1 COMMENT "Nomor pertemuan belajar (1-16)"' },
    ];

    for (const item of dapodikColumns) {
      try {
        await pool.query(`ALTER TABLE \`${item.table}\` ADD COLUMN \`${item.col}\` ${item.def}`);
      } catch (colErr) {
        if (colErr.code !== 'ER_DUP_COLUMN_NAME') {
          // Abaikan jika sudah ada
        }
      }
    }

    // Otomatis pastikan 10 Rombel Baru tersedia
    try {
      const [checkNew] = await pool.query("SELECT COUNT(*) AS total FROM rombel WHERE nama_rombel = 'Kelas 1 Paket A'");
      if (!checkNew[0] || checkNew[0].total === 0) {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('DELETE FROM rombel_mapel');
        await pool.query('DELETE FROM rombel');

        const rombelData = [
          [1, 'Kelas 1 Paket A', 'paket_a', 1, 30],
          [2, 'Kelas 2 Paket A', 'paket_a', 1, 30],
          [3, 'Kelas 7-1 Paket B', 'paket_b', 1, 30],
          [4, 'Kelas 7-2 Paket B', 'paket_b', 1, 30],
          [5, 'Kelas 8-1 Paket B', 'paket_b', 1, 30],
          [6, 'Kelas 8-2 Paket B', 'paket_b', 1, 30],
          [7, 'Kelas 10-1 Paket C', 'paket_c', 1, 30],
          [8, 'Kelas 10-2 Paket C', 'paket_c', 1, 30],
          [9, 'Kelas 11-1 Paket C', 'paket_c', 1, 30],
          [10, 'Kelas 11-2 Paket C', 'paket_c', 1, 30],
        ];

        for (const [rId, rNama, rJenjang, rTaId, rKap] of rombelData) {
          await pool.query(
            `INSERT INTO rombel (id, nama_rombel, jenjang, tahun_ajaran_id, kapasitas, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [rId, rNama, rJenjang, rTaId, rKap]
          );
        }

        // Relasikan mapel ke rombel
        await pool.query(`
          INSERT INTO rombel_mapel (rombel_id, mapel_id, tutor_id, is_visible, urutan, created_at)
          SELECT r.id, mp.id, 2, 1, mp.id, NOW()
          FROM rombel r
          JOIN mata_pelajaran mp ON (mp.jenjang = 'semua' OR mp.jenjang = r.jenjang)
          WHERE mp.is_active = 1
        `);

        // Update relasi rombel siswa default
        await pool.query("UPDATE warga_belajar SET rombel_id = 1 WHERE jenjang = 'paket_a'");
        await pool.query("UPDATE warga_belajar SET rombel_id = 3 WHERE jenjang = 'paket_b'");
        await pool.query("UPDATE warga_belajar SET rombel_id = 7 WHERE jenjang = 'paket_c'");

        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ 10 Rombel baru berhasil disinkronisasi ke database.');
      }
    } catch (rErr) {
      // Abaikan jika tabel belum siap
    }
  } catch (error) {
    console.error('\n❌ Gagal konek ke database MySQL:', error.message);
    console.error('💡 Solusi:');
    console.error(`   1. Pastikan service MySQL/MariaDB (XAMPP / Laragon) sudah berjalan di ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}.`);
    console.error(`   2. Pastikan database "${process.env.DB_NAME}" sudah dibuat dan file "pkbm_bina_mandiri.sql" sudah di-import.`);
    console.error('   3. Catatan: Database dump siap pakai tersedia di folder backend/pkbm_bina_mandiri.sql.');
    console.error('   4. Jika hanya ingin mengembangkan Frontend, Anda dapat menggunakan server live:');
    console.error('      Ubah VITE_API_URL=https://pkbmbinamandiri.sch.id/api pada frontend/.env\n');
    process.exit(1);
  }
};

// Export pool agar bisa dipakai di semua file model
export default pool;
