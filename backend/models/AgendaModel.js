// ============================================================
// models/AgendaModel.js
// Model untuk Agenda & Kalender Kegiatan Admin PKBM
// ============================================================

import pool from '../config/db.js';

let tableChecked = false;
const ensureTable = async () => {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agenda_admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date_str VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL DEFAULT '',
        badge VARCHAR(50) NULL DEFAULT '',
        category VARCHAR(50) NULL DEFAULT 'rapat',
        time_range VARCHAR(50) NULL DEFAULT '',
        time VARCHAR(50) NULL DEFAULT '',
        location VARCHAR(255) NULL DEFAULT '',
        card_style VARCHAR(50) NULL DEFAULT 'sticky-yellow',
        notes TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch (err) {
    console.error('Error ensuring agenda_admin table:', err.message);
  }
};

const AgendaModel = {
  findAll: async () => {
    await ensureTable();
    const [rows] = await pool.execute(
      `SELECT * FROM agenda_admin ORDER BY date_str ASC, id ASC`
    );
    return rows;
  },

  findById: async (id) => {
    await ensureTable();
    const [rows] = await pool.execute(
      `SELECT * FROM agenda_admin WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  create: async (data) => {
    await ensureTable();
    const {
      date_str,
      title,
      subtitle = '',
      badge = '',
      category = 'rapat',
      time_range = '',
      time = '',
      location = '',
      card_style = 'sticky-yellow',
      notes = '',
      created_by = null
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO agenda_admin 
       (date_str, title, subtitle, badge, category, time_range, time, location, card_style, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date_str,
        title,
        subtitle,
        badge || category.toUpperCase(),
        category,
        time_range,
        time,
        location,
        card_style,
        notes,
        created_by
      ]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    await ensureTable();
    const {
      date_str,
      title,
      subtitle = '',
      badge = '',
      category = 'rapat',
      time_range = '',
      time = '',
      location = '',
      card_style = 'sticky-yellow',
      notes = ''
    } = data;

    await pool.execute(
      `UPDATE agenda_admin SET
         date_str = ?,
         title = ?,
         subtitle = ?,
         badge = ?,
         category = ?,
         time_range = ?,
         time = ?,
         location = ?,
         card_style = ?,
         notes = ?
       WHERE id = ?`,
      [
        date_str,
        title,
        subtitle,
        badge || category.toUpperCase(),
        category,
        time_range,
        time,
        location,
        card_style,
        notes,
        id
      ]
    );
    return id;
  },

  delete: async (id) => {
    await ensureTable();
    const [result] = await pool.execute(
      `DELETE FROM agenda_admin WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};

export default AgendaModel;
