import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('--- Memulai Seeding Ruang Belajar SK 2026/2027 ---');
  const sqlPath = path.resolve(__dirname, '../migrations/update_ruang_belajar_2026.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const statements = sqlContent
    .split(/;\s*[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    if (stmt) {
      await pool.query(stmt);
    }
  }

  console.log('✅ Seeding Ruang Belajar SK 2026/2027 berhasil diselesaikan!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Gagal seeding Ruang Belajar:', err);
  process.exit(1);
});

