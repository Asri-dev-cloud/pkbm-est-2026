// ============================================================
// controllers/AgendaController.js
// Controller untuk CRUD Agenda Kegiatan PKBM (Admin)
// ============================================================

import AgendaModel from '../models/AgendaModel.js';

const AgendaController = {
  // GET /api/agenda — Ambil semua agenda kegiatan
  getAll: async (req, res) => {
    try {
      const data = await AgendaModel.findAll();
      return res.json({ success: true, data });
    } catch (e) {
      console.error('[AgendaController.getAll]', e);
      return res.status(500).json({ success: false, message: 'Gagal memuat data agenda.' });
    }
  },

  // GET /api/agenda/:id
  getById: async (req, res) => {
    try {
      const item = await AgendaModel.findById(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan.' });
      }
      return res.json({ success: true, data: item });
    } catch (e) {
      console.error('[AgendaController.getById]', e);
      return res.status(500).json({ success: false, message: 'Gagal memuat detail agenda.' });
    }
  },

  // POST /api/agenda — Tambah agenda baru
  create: async (req, res) => {
    try {
      const {
        date_str,
        title,
        subtitle,
        badge,
        category,
        time_range,
        time,
        location,
        card_style,
        notes
      } = req.body;

      if (!date_str || !title) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal (date_str) dan Judul Kegiatan (title) wajib diisi.'
        });
      }

      const newId = await AgendaModel.create({
        date_str,
        title,
        subtitle,
        badge,
        category,
        time_range,
        time,
        location,
        card_style,
        notes,
        created_by: req.user?.id || null
      });

      const createdItem = await AgendaModel.findById(newId);
      return res.status(201).json({
        success: true,
        message: 'Jadwal agenda berhasil ditambahkan.',
        data: createdItem
      });
    } catch (e) {
      console.error('[AgendaController.create]', e);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan agenda baru.' });
    }
  },

  // PUT /api/agenda/:id — Update agenda
  update: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await AgendaModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan.' });
      }

      const {
        date_str,
        title,
        subtitle,
        badge,
        category,
        time_range,
        time,
        location,
        card_style,
        notes
      } = req.body;

      if (!date_str || !title) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal (date_str) dan Judul Kegiatan (title) wajib diisi.'
        });
      }

      await AgendaModel.update(id, {
        date_str,
        title,
        subtitle,
        badge,
        category,
        time_range,
        time,
        location,
        card_style,
        notes
      });

      const updatedItem = await AgendaModel.findById(id);
      return res.json({
        success: true,
        message: 'Jadwal agenda berhasil diperbarui.',
        data: updatedItem
      });
    } catch (e) {
      console.error('[AgendaController.update]', e);
      return res.status(500).json({ success: false, message: 'Gagal memperbarui agenda.' });
    }
  },

  // DELETE /api/agenda/:id — Hapus agenda
  delete: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await AgendaModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Agenda tidak ditemukan.' });
      }

      await AgendaModel.delete(id);
      return res.json({ success: true, message: 'Jadwal agenda berhasil dihapus.' });
    } catch (e) {
      console.error('[AgendaController.delete]', e);
      return res.status(500).json({ success: false, message: 'Gagal menghapus agenda.' });
    }
  }
};

export default AgendaController;
