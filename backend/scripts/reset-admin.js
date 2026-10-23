import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const newPassword = process.argv[2] || 'Admin1234!';
const email = process.argv[3] || 'admin@pkbm-binamandiri.sch.id';

async function resetPassword() {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hash, email]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Berhasil mereset password untuk user: ${email}`);
      console.log(`   Password baru: ${newPassword}`);
    } else {
      console.log(`⚠️ User dengan email ${email} tidak ditemukan di database.`);
      // Tampilkan list users yang ada
      const [users] = await pool.query('SELECT id, nama_lengkap, email, role FROM users LIMIT 10');
      console.log('Daftar user di database:', users);
    }
  } catch (err) {
    console.error('❌ Gagal mereset password:', err.message);
  } finally {
    process.exit(0);
  }
}

resetPassword();
