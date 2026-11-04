import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    console.log('Running migrations...');
    
    // Migration 1: RPS File
    try {
      const sql1 = fs.readFileSync(path.join(__dirname, 'add_rps_file_to_rombel_mapel.sql'), 'utf8');
      await pool.query(sql1);
      console.log('✅ Migration add_rps_file_to_rombel_mapel completed!');
    } catch (err1) {
      if (err1.code === 'ER_DUP_COLUMN_NAME') {
        console.log('ℹ️ Column rps_file_path already exists. Skipped.');
      } else {
        console.warn('⚠️ Warning on add_rps_file_to_rombel_mapel:', err1.message);
      }
    }

    // Migration 2: Dapodik Fields
    const dapodikCols = [
      { table: 'pendaftar_spmb', col: 'jarak_rumah_km', def: 'DECIMAL(5,1) NULL DEFAULT NULL COMMENT "Jarak rumah ke sekolah (km)"' },
      { table: 'pendaftar_spmb', col: 'tinggi_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Tinggi badan (cm)"' },
      { table: 'pendaftar_spmb', col: 'berat_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Berat badan (kg)"' },
      { table: 'pendaftar_spmb', col: 'jumlah_saudara_kandung', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Jumlah saudara kandung"' },
      { table: 'warga_belajar', col: 'jarak_rumah_km', def: 'DECIMAL(5,1) NULL DEFAULT NULL COMMENT "Jarak rumah ke sekolah (km)"' },
      { table: 'warga_belajar', col: 'tinggi_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Tinggi badan (cm)"' },
      { table: 'warga_belajar', col: 'berat_badan', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Berat badan (kg)"' },
      { table: 'warga_belajar', col: 'jumlah_saudara_kandung', def: 'INT UNSIGNED NULL DEFAULT NULL COMMENT "Jumlah saudara kandung"' },
    ];

    for (const item of dapodikCols) {
      try {
        await pool.query(`ALTER TABLE \`${item.table}\` ADD COLUMN \`${item.col}\` ${item.def}`);
        console.log(`✅ Kolom ${item.col} berhasil ditambahkan ke tabel ${item.table}.`);
      } catch (colErr) {
        if (colErr.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`ℹ️ Kolom ${item.col} pada tabel ${item.table} sudah ada. Skipped.`);
        } else {
          console.warn(`⚠️ Warning adding ${item.col} to ${item.table}:`, colErr.message);
        }
      }
    }

    // Migration 3: Update Classes Rombel
    try {
      const sql3 = fs.readFileSync(path.join(__dirname, 'update_classes_rombel.sql'), 'utf8');
      await pool.query(sql3);
      console.log('✅ Migration update_classes_rombel (10 kelas baru) completed!');
    } catch (err3) {
      console.warn('⚠️ Warning on update_classes_rombel:', err3.message);
    }

    console.log('All migrations completed!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
