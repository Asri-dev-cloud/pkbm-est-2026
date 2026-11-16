// ============================================================
// backend/scripts/migrasi-nis-2026.js
// Script Migrasi Pembaruan Angkatan NIS Warga Belajar ke 2026
// Mengubah semua NIS PKBM-2025-XXXX menjadi PKBM-2026-XXXX
// Jalankan di server: node backend/scripts/migrasi-nis-2026.js
// ============================================================

import pool from '../config/db.js';

async function migrasiNis() {
  console.log('🚀 Memulai proses pembaruan NIS warga belajar angkatan 2026...');

  try {
    const conn = await pool.getConnection();

    // 1. Cek jumlah siswa yang masih menggunakan awalan PKBM-2025-
    const [checkRows] = await conn.execute(
      `SELECT COUNT(*) AS total FROM warga_belajar WHERE nis LIKE 'PKBM-2025-%'`
    );
    const totalOld = checkRows[0]?.total || 0;
    console.log(`ℹ️ Ditemukan ${totalOld} warga belajar dengan NIS format PKBM-2025-`);

    if (totalOld > 0) {
      // 2. Lakukan update NIS dari 2025 ke 2026
      const [updateResult] = await conn.execute(
        `UPDATE warga_belajar 
         SET nis = REPLACE(nis, 'PKBM-2025-', 'PKBM-2026-') 
         WHERE nis LIKE 'PKBM-2025-%'`
      );
      console.log(`✅ Berhasil memperbarui ${updateResult.affectedRows} NIS warga belajar menjadi PKBM-2026-XXXX!`);
    } else {
      console.log('✨ Semua warga belajar sudah menggunakan format NIS PKBM-2026-XXXX atau sesuai angkatannya.');
    }

    // 3. Pastikan Tahun Ajaran 2026/2027 aktif
    const [taRows] = await conn.execute(
      `SELECT id, nama_tahun_ajaran, is_aktif FROM tahun_ajaran WHERE nama_tahun_ajaran = '2026/2027'`
    );

    if (taRows.length > 0) {
      await conn.execute(`UPDATE tahun_ajaran SET is_aktif = 0`);
      await conn.execute(`UPDATE tahun_ajaran SET is_aktif = 1 WHERE nama_tahun_ajaran = '2026/2027'`);
      console.log('✅ Tahun ajaran 2026/2027 telah diatur sebagai tahun ajaran aktif.');
    } else {
      // Buat tahun ajaran baru 2026/2027 jika belum ada
      await conn.execute(`UPDATE tahun_ajaran SET is_aktif = 0`);
      await conn.execute(
        `INSERT INTO tahun_ajaran (nama_tahun_ajaran, is_aktif, tanggal_mulai, tanggal_selesai, created_at)
         VALUES ('2026/2027', 1, '2026-07-13', '2027-06-30', NOW())`
      );
      console.log('✅ Berhasil membuat dan mengaktifkan Tahun Ajaran 2026/2027.');
    }

    conn.release();
    console.log('🎉 Migrasi data NIS 2026 selesai dengan sukses!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi NIS:', err.message);
    process.exit(1);
  }
}

migrasiNis();

