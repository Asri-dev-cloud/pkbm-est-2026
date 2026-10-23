import pool from '../config/db.js';

async function test() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Koneksi database berhasil via pool MySQL!');
    console.log(`   Host: ${process.env.DB_HOST} | DB: ${process.env.DB_NAME}`);
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Koneksi database gagal:', err.message);
    process.exit(1);
  }
}

test();
