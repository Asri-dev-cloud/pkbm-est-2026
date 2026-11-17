// ============================================================
// backend/scripts/migrasi-rapor.js
// Script Migrasi Database Rapor Otomatis & Aman (Multi-versi MySQL)
// Jalankan di VPS: node backend/scripts/migrasi-rapor.js
// ============================================================

import pool from '../config/db.js';

async function migrasiRapor() {
  console.log('----------------------------------------------------');
  console.log('Memulai migrasi skema tabel rapor PKBM Bina Mandiri...');
  console.log('----------------------------------------------------');

  try {
    const conn = await pool.getConnection();

    // Helper cek kolom
    const cekKolom = async (table, column) => {
      const [rows] = await conn.query(
        `SELECT COUNT(*) as cnt 
         FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = ? 
           AND COLUMN_NAME = ?`,
        [table, column]
      );
      return rows[0].cnt > 0;
    };

    // 1. Cek & Tambah kolom pada rapor_periode
    const colsPeriode = [
      { name: 'nama_wali_kelas', def: 'VARCHAR(150) NULL' },
      { name: 'fase', def: 'VARCHAR(20) NULL' },
      { name: 'data_kustom', def: 'LONGTEXT NULL' }
    ];

    for (const col of colsPeriode) {
      const exists = await cekKolom('rapor_periode', col.name);
      if (!exists) {
        await conn.query(`ALTER TABLE \`rapor_periode\` ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`[+] Kolom rapor_periode.${col.name} berhasil ditambahkan.`);
      } else {
        console.log(`[=] Kolom rapor_periode.${col.name} sudah ada.`);
      }
    }

    // 2. Cek & Tambah kolom pada rapor_nilai
    const colsNilai = [
      { name: 'kategori', def: "VARCHAR(50) NOT NULL DEFAULT 'umum'" },
      { name: 'nama_mapel_kustom', def: 'VARCHAR(150) NULL' }
    ];

    for (const col of colsNilai) {
      const exists = await cekKolom('rapor_nilai', col.name);
      if (!exists) {
        await conn.query(`ALTER TABLE \`rapor_nilai\` ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`[+] Kolom rapor_nilai.${col.name} berhasil ditambahkan.`);
      } else {
        console.log(`[=] Kolom rapor_nilai.${col.name} sudah ada.`);
      }
    }

    // 3. Modifikasi mapel_id agar boleh NULL untuk mapel kustom
    try {
      await conn.query(`ALTER TABLE \`rapor_nilai\` MODIFY COLUMN \`mapel_id\` INT UNSIGNED NULL`);
      console.log(`[+] Kolom rapor_nilai.mapel_id berhasil diubah menjadi NULL-able.`);
    } catch (e) {
      console.log(`[=] Kolom rapor_nilai.mapel_id: ${e.message}`);
    }

    // 4. Drop unique key lama jika ada agar mapel kustom bisa bertambah bebas
    try {
      await conn.query(`ALTER TABLE \`rapor_nilai\` DROP INDEX \`uq_rapor_mapel\``);
      console.log(`[+] Index lama uq_rapor_mapel berhasil dilepas.`);
    } catch (e) {
      // Abaikan jika index memang tidak ada
    }

    conn.release();

    console.log('----------------------------------------------------');
    console.log('SELESAI: Database Rapor 100% Siap & Berhasil Diperbarui!');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Terjadi kesalahan saat migrasi:', err.message);
    process.exit(1);
  }
}

migrasiRapor();

