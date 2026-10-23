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
