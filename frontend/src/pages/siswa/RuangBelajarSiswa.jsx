// ============================================================
// src/pages/siswa/RuangBelajarSiswa.jsx — Ruang Belajar Terpadu
// Keputusan Kepala PKBM Bina Mandiri Kecamatan Paseh
// Nomor   : 01.010/PKBM-BM/VI/2026 | Tanggal : 30 Juni 2026
// Tahun Ajaran 2026/2027
//
// Desain Card: Retro Pop Spiral Calendar (Image 5)
// Logika Hari: Mengikuti Jadwal KBM Kalender Akademik (Sabtu & Minggu)
// Nomor Urut: Tanpa Titik (contoh: 01, 02, dst)
// Ikon Murni (Tanpa Emoji)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI } from '../../services/api.js';
import './RuangBelajar.css';

// ── 1. Data Resmi Tutor & Pengelola (Lampiran I SK) ───────────
export const OFFICIAL_TUTOR_LIST = [
  { no: 1, nama: 'Indrayani, S.S.,M.Pd. Gr.', jabatan: 'Tutor', jenjang: 'Paket A, B, dan C', ket: 'Tutor PAI-BP, B. Indonesia, B. Arab' },
  { no: 2, nama: 'Ihsani Rizkyanti, S.E.', jabatan: 'Tutor', jenjang: 'Paket A, B, dan C', ket: 'Guru Kelas Paket A, IPS, Ekonomi, Pemberdayaan' },
  { no: 3, nama: 'M. Ihsan Fadhillah, S.Kom.', jabatan: 'Tutor', jenjang: 'Paket B dan C', ket: 'Keterampilan / IT, PJOK' },
  { no: 4, nama: 'Sri Winarsih, S.Pd.', jabatan: 'Tutor', jenjang: 'Paket A, B, dan C', ket: 'Guru Kelas Paket A, Matematika' },
  { no: 5, nama: 'Ilham Maulana Yasin, S.Kom.', jabatan: 'Tutor', jenjang: 'Paket A dan B', ket: 'Pemberdayaan dan Keterampilan' },
  { no: 6, nama: 'Kurniawan, S.Sos., Gr.', jabatan: 'Tutor', jenjang: 'Paket B dan C', ket: 'Pendidikan Pancasila, Sejarah' },
  { no: 7, nama: 'M. Iqbal Fauzil Adhim, S.E.', jabatan: 'Tutor', jenjang: 'Paket A, B, dan C', ket: 'PJOK, Bahasa Inggris' },
  { no: 8, nama: 'Lia Karlia, S.Sos.', jabatan: 'Tutor', jenjang: 'Paket B dan C', ket: 'IPA, Keterampilan' },
  { no: 9, nama: 'Tarisa Aidil Alzahra, S.E.', jabatan: 'Tutor', jenjang: 'Paket B dan C', ket: 'Seni dan Budaya' },
  { no: 10, nama: 'Heryadi Safari', jabatan: 'Tata Usaha/Operator', jenjang: 'Semua Jenjang', ket: 'Administrasi & Data Dapodik' },
];

// ── 2. Data Ruang Belajar SK 2026/2027 (Jadwal Kalender) ──────
export const OFFICIAL_RUANG_BELAJAR_ITEMS = [
  // ── PAKET A ───────────────────────────────────────────────
  // Kelas 1 Paket A (Rombel ID 1)
  {
    id: 1,
    rombel_id: 1,
    nama_rombel: 'Kelas 1 Paket A',
    jenjang: 'paket_a',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '01',
    tema: 'coral',
    deskripsi: 'Penanaman akidah akhlak, tata cara ibadah harian, dan budi pekerti mulia.',
  },
  {
    id: 3,
    rombel_id: 1,
    nama_rombel: 'Kelas 1 Paket A',
    jenjang: 'paket_a',
    nama: 'Guru Kelas (Tematik)',
    kode: 'GK-A',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Sabtu',
    waktu: '08.45 – 10.30 WIB',
    nomor_urut: '02',
    tema: 'yellow',
    deskripsi: 'Pembelajaran tematik integratif mencakup Bahasa Indonesia dan Matematika dasar.',
  },
  {
    id: 2,
    rombel_id: 1,
    nama_rombel: 'Kelas 1 Paket A',
    jenjang: 'paket_a',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Sabtu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '03',
    tema: 'green',
    deskripsi: 'Aktivitas kebugaran fisik, motorik dasar, dan pembiasaan hidup sehat.',
  },

  // Kelas 2 Paket A (Rombel ID 2)
  {
    id: 3,
    rombel_id: 2,
    nama_rombel: 'Kelas 2 Paket A',
    jenjang: 'paket_a',
    nama: 'Guru Kelas (Tematik)',
    kode: 'GK-A',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '08.00 – 09.30 WIB',
    nomor_urut: '01',
    tema: 'yellow',
    deskripsi: 'Pembelajaran tematik pendalaman membaca, menulis, dan berhitung Kelas 2.',
  },
  {
    id: 1,
    rombel_id: 2,
    nama_rombel: 'Kelas 2 Paket A',
    jenjang: 'paket_a',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '02',
    tema: 'coral',
    deskripsi: 'Penguatan hafalan surat pendek, kisah keteladanan rasul, dan adab sesama.',
  },
  {
    id: 2,
    rombel_id: 2,
    nama_rombel: 'Kelas 2 Paket A',
    jenjang: 'paket_a',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Sabtu',
    waktu: '09.45 – 10.30 WIB',
    nomor_urut: '03',
    tema: 'green',
    deskripsi: 'Permainan gerak ritmik, senam kesegaran, dan kebugaran jasmani.',
  },

  // ── PAKET B ───────────────────────────────────────────────
  // Kelas 7-1 Paket B (Rombel ID 3)
  {
    id: 8,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Sabtu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '01',
    tema: 'coral',
    deskripsi: 'Nilai-nilai luhur Pancasila, konstitusi negara, dan persatuan Indonesia.',
  },
  {
    id: 10,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Sabtu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '02',
    tema: 'blue',
    deskripsi: 'Sistem organisasi kehidupan, zat dan perubahannya, serta sains alam.',
  },
  {
    id: 4,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '03',
    tema: 'yellow',
    deskripsi: 'Interaksi sosial, keragaman ruang geografis, dan aktivitas ekonomi.',
  },
  {
    id: 1,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '04',
    tema: 'coral',
    deskripsi: 'Hukum bacaan Al-Quran, ibadah fardhu, dan keteladanan akhlak mulia.',
  },
  {
    id: 6,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Sabtu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '05',
    tema: 'purple',
    deskripsi: 'Bilangan rasional, bentuk aljabar, dan persamaan linier satu variabel.',
  },
  {
    id: 9,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Inggris',
    kode: 'BING',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Minggu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '06',
    tema: 'pink',
    deskripsi: 'Greeting, self introduction, descriptive text, and daily conversation.',
  },
  {
    id: 2,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Minggu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '07',
    tema: 'green',
    deskripsi: 'Olahraga bola besar, atletik jalan cepat, dan kebugaran jasmani.',
  },
  {
    id: 11,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Minggu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '08',
    tema: 'yellow',
    deskripsi: 'Apresiasi seni rupa daerah, ragam motif hias, dan musik tradisional.',
  },
  {
    id: 7,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pemberdayaan dan Keterampilan',
    kode: 'PKT',
    nama_tutor: 'Ilham Maulana Yasin, S.Kom.',
    hari: 'Minggu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '09',
    tema: 'orange',
    deskripsi: 'Keterampilan vokasional, inovasi produk olahan, dan soft skills.',
  },
  {
    id: 5,
    rombel_id: 3,
    nama_rombel: 'Kelas 7-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '10',
    tema: 'blue',
    deskripsi: 'Teks deskripsi, cerita fantasi, dan kemampuan literasi membaca kritis.',
  },

  // Kelas 7-2 Paket B (Rombel ID 4)
  {
    id: 10,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Sabtu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '01',
    tema: 'blue',
    deskripsi: 'Sistem organisasi kehidupan, zat dan perubahannya, serta sains alam.',
  },
  {
    id: 8,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Sabtu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '02',
    tema: 'coral',
    deskripsi: 'Nilai-nilai luhur Pancasila, konstitusi negara, dan persatuan Indonesia.',
  },
  {
    id: 11,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Sabtu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '03',
    tema: 'yellow',
    deskripsi: 'Apresiasi seni rupa daerah, ragam motif hias, dan musik tradisional.',
  },
  {
    id: 6,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Sabtu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '04',
    tema: 'purple',
    deskripsi: 'Bilangan rasional, bentuk aljabar, dan persamaan linier satu variabel.',
  },
  {
    id: 1,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '05',
    tema: 'coral',
    deskripsi: 'Hukum bacaan Al-Quran, ibadah fardhu, dan keteladanan akhlak mulia.',
  },
  {
    id: 7,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Pemberdayaan dan Keterampilan',
    kode: 'PKT',
    nama_tutor: 'Ilham Maulana Yasin, S.Kom.',
    hari: 'Minggu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '06',
    tema: 'orange',
    deskripsi: 'Keterampilan vokasional, inovasi produk olahan, dan soft skills.',
  },
  {
    id: 5,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '07',
    tema: 'blue',
    deskripsi: 'Teks deskripsi, cerita fantasi, dan kemampuan literasi membaca kritis.',
  },
  {
    id: 9,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Inggris',
    kode: 'BING',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Minggu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '08',
    tema: 'pink',
    deskripsi: 'Greeting, self introduction, descriptive text, and daily conversation.',
  },
  {
    id: 2,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Minggu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '09',
    tema: 'green',
    deskripsi: 'Olahraga bola besar, atletik jalan cepat, dan kebugaran jasmani.',
  },
  {
    id: 4,
    rombel_id: 4,
    nama_rombel: 'Kelas 7-2 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '10',
    tema: 'yellow',
    deskripsi: 'Interaksi sosial, keragaman ruang geografis, dan aktivitas ekonomi.',
  },

  // Kelas 8-1 Paket B (Rombel ID 5)
  {
    id: 6,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Sabtu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '01',
    tema: 'purple',
    deskripsi: 'Teorema Pythagoras, lingkaran, bangun ruang sisi datar, dan statistika.',
  },
  {
    id: 4,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '02',
    tema: 'yellow',
    deskripsi: 'Karakteristik negara ASEAN, mobilitas sosial, dan integrasi bangsa.',
  },
  {
    id: 1,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '03',
    tema: 'coral',
    deskripsi: 'Iman kepada kitab Allah, sujud syukur & tilawah, serta sejarah kebudayaan Islam.',
  },
  {
    id: 11,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Sabtu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '04',
    tema: 'yellow',
    deskripsi: 'Gambar model, ilustrasi, ragam gerak tari tradisional, dan pantomim.',
  },
  {
    id: 9,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Inggris',
    kode: 'BING',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Sabtu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '05',
    tema: 'pink',
    deskripsi: 'Recount text, giving suggestions, simple past tense, and notices.',
  },
  {
    id: 8,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Minggu',
    waktu: '08.00 – 08.45 WIB',
    nomor_urut: '06',
    tema: 'coral',
    deskripsi: 'Kedudukan dan fungsi Pancasila serta penegakan norma hukum masyarakat.',
  },
  {
    id: 10,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Minggu',
    waktu: '08.45 – 09.30 WIB',
    nomor_urut: '07',
    tema: 'blue',
    deskripsi: 'Gerak lurus, gaya, pesawat sederhana, dan sistem pernapasan manusia.',
  },
  {
    id: 7,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pemberdayaan dan Keterampilan',
    kode: 'PKT',
    nama_tutor: 'Ilham Maulana Yasin, S.Kom.',
    hari: 'Minggu',
    waktu: '09.30 – 10.15 WIB',
    nomor_urut: '08',
    tema: 'orange',
    deskripsi: 'Budidaya tanaman obat, pengolahan bahan pangan nabati, dan wirausaha.',
  },
  {
    id: 5,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '10.30 – 11.15 WIB',
    nomor_urut: '09',
    tema: 'blue',
    deskripsi: 'Teks berita terkini, iklan, slogan, poster, dan teks eksposisi artikel.',
  },
  {
    id: 2,
    rombel_id: 5,
    nama_rombel: 'Kelas 8-1 Paket B',
    jenjang: 'paket_b',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Iqbal Fauzil Adhim, S.E.',
    hari: 'Minggu',
    waktu: '11.15 – 12.00 WIB',
    nomor_urut: '10',
    tema: 'green',
    deskripsi: 'Permainan bola voli, bulu tangkis, bela diri silat, dan kesehatan pribadi.',
  },

  // ── PAKET C ───────────────────────────────────────────────
  // Kelas 10-1 Paket C (Rombel ID 7)
  {
    id: 1,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '01',
    tema: 'coral',
    deskripsi: 'Fikih muamalah kontemporer, tadabbur ayat Al-Quran, dan toleransi sosial.',
  },
  {
    id: 6,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Sabtu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '02',
    tema: 'purple',
    deskripsi: 'Eksponen dan logaritma, persamaan kuadrat, barisan serta deret geometri.',
  },
  {
    id: 8,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Sabtu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '03',
    tema: 'coral',
    deskripsi: 'Hakikat bangsa & negara, norma konstitusi, serta integrasi nasional NKRI.',
  },
  {
    id: 4,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '04',
    tema: 'yellow',
    deskripsi: 'Dinamika sosial, geografi kebencanaan, dan interaksi spasial nusantara.',
  },
  {
    id: 10,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Sabtu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '05',
    tema: 'blue',
    deskripsi: 'Struktur sel organisme hidup, kimia lingkungan, dan mekanika klasik.',
  },
  {
    id: 2,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Sabtu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '06',
    tema: 'green',
    deskripsi: 'Permainan taktis beregu, daya tahan kardiovaskular, dan pertolongan pertama.',
  },
  {
    id: 11,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Sabtu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '07',
    tema: 'pink',
    deskripsi: 'Kritik seni rupa dua/tiga dimensi, pameran karya, dan apresiasi pertunjukan.',
  },
  {
    id: 5,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '08',
    tema: 'blue',
    deskripsi: 'Laporan observasi ilmiah, teks eksposisi artikel opini, dan resensi buku.',
  },
  {
    id: 14,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ekonomi',
    kode: 'EKO',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '09',
    tema: 'orange',
    deskripsi: 'Prinsip kelangkaan modal, akuntansi dasar, pasar modal, dan perbankan.',
  },
  {
    id: 16,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Sejarah',
    kode: 'SEJ',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Minggu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '10',
    tema: 'orange',
    deskripsi: 'Jejak peradaban kuno kepulauan nusantara dan kronologi kolonialisme.',
  },
  {
    id: 15,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Informatika)',
    kode: 'KTR-IT',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Minggu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '11',
    tema: 'blue',
    deskripsi: 'Aplikasi perkantoran modern, komputasi awan, dan literasi keamanan data.',
  },
  {
    id: 17,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Prakarya & Kewirausahaan)',
    kode: 'KTR-PKW',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Minggu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '12',
    tema: 'yellow',
    deskripsi: 'Desain kerajinan fungsional, analisis biaya produksi, dan kemasan produk.',
  },
  {
    id: 12,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Arab',
    kode: 'BARB',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '13',
    tema: 'green',
    deskripsi: 'Kaidah dasar nahwu-sharaf, percakapan taaruf harian, dan qiraah teks Arab.',
  },
  {
    id: 13,
    rombel_id: 7,
    nama_rombel: 'Kelas 10-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pemberdayaan',
    kode: 'PBD',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '14',
    tema: 'pink',
    deskripsi: 'Aksi sosial kemandirian ekonomi warga dan pembentukan kelompok usaha.',
  },

  // Kelas 11-1 Paket C (Rombel ID 9)
  {
    id: 8,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Sabtu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '01',
    tema: 'coral',
    deskripsi: 'Sistem hukum dan peradilan di Indonesia serta penegakan HAM konstitusional.',
  },
  {
    id: 4,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '02',
    tema: 'yellow',
    deskripsi: 'Struktur sosial masyarakat multikultural dan mitigasi konflik horizontal.',
  },
  {
    id: 10,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Sabtu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '03',
    tema: 'blue',
    deskripsi: 'Termodinamika, gelombang mekanik, serta metabolisme sel biokimia.',
  },
  {
    id: 2,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Sabtu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '04',
    tema: 'green',
    deskripsi: 'Pola pertahanan/penyerangan bola basket, atletik, dan pencegahan cedera.',
  },
  {
    id: 11,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Sabtu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '05',
    tema: 'pink',
    deskripsi: 'Penciptaan karya seni rupa kontemporer dan musikalisasi puisi nusantara.',
  },
  {
    id: 5,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '06',
    tema: 'blue',
    deskripsi: 'Karya ilmiah sederhana, proposal kegiatan, dan analisis naskah drama.',
  },
  {
    id: 14,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Ekonomi',
    kode: 'EKO',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '07',
    tema: 'orange',
    deskripsi: 'Kebijakan fiskal, moneter, perpajakan, dan perdagangan internasional.',
  },
  {
    id: 16,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Sejarah',
    kode: 'SEJ',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Minggu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '08',
    tema: 'orange',
    deskripsi: 'Kebangkitan nasional 1908, Sumpah Pemuda, dan proklamasi kemerdekaan RI.',
  },
  {
    id: 15,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Informatika)',
    kode: 'KTR-IT',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Minggu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '09',
    tema: 'blue',
    deskripsi: 'Desain media digital, manajemen basis data dasar, dan etika berinternet.',
  },
  {
    id: 17,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Prakarya & Kewirausahaan)',
    kode: 'KTR-PKW',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Minggu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '10',
    tema: 'yellow',
    deskripsi: 'Strategi pemasaran digital, manajemen modal awal, dan branding UMKM.',
  },
  {
    id: 12,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Arab',
    kode: 'BARB',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '11',
    tema: 'green',
    deskripsi: 'Insya (mengarang terpadu), tadribat tarkib kalimat, dan literasi kitab.',
  },
  {
    id: 13,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pemberdayaan',
    kode: 'PBD',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '12',
    tema: 'pink',
    deskripsi: 'Inkubasi bisnis rintisan warga belajar dan kolaborasi lintas komunitas.',
  },
  {
    id: 1,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '13',
    tema: 'coral',
    deskripsi: 'Kewarisan Islam (faraidh), etika bermedia sosial, dan ukhuwah wathaniyah.',
  },
  {
    id: 6,
    rombel_id: 9,
    nama_rombel: 'Kelas 11-1 Paket C',
    jenjang: 'paket_c',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Minggu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '14',
    tema: 'purple',
    deskripsi: 'Kalkulus diferensial, turunan fungsi aljabar, dan integral tak tentu.',
  },

  // Kelas 11-2 Paket C (Rombel ID 10)
  {
    id: 10,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Alam (IPA)',
    kode: 'IPA',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Sabtu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '01',
    tema: 'blue',
    deskripsi: 'Termodinamika, gelombang mekanik, serta metabolisme sel biokimia.',
  },
  {
    id: 2,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    kode: 'PJOK',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Sabtu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '02',
    tema: 'green',
    deskripsi: 'Pola pertahanan/penyerangan bola basket, atletik, dan pencegahan cedera.',
  },
  {
    id: 11,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Seni dan Budaya',
    kode: 'SBD',
    nama_tutor: 'Tarisa Aidil Alzahra, S.E.',
    hari: 'Sabtu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '03',
    tema: 'pink',
    deskripsi: 'Penciptaan karya seni rupa kontemporer dan musikalisasi puisi nusantara.',
  },
  {
    id: 5,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Indonesia',
    kode: 'BIND',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Sabtu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '04',
    tema: 'blue',
    deskripsi: 'Karya ilmiah sederhana, proposal kegiatan, dan analisis naskah drama.',
  },
  {
    id: 14,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Ekonomi',
    kode: 'EKO',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Sabtu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '05',
    tema: 'orange',
    deskripsi: 'Kebijakan fiskal, moneter, perpajakan, dan perdagangan internasional.',
  },
  {
    id: 16,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Sejarah',
    kode: 'SEJ',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Sabtu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '06',
    tema: 'orange',
    deskripsi: 'Kebangkitan nasional 1908, Sumpah Pemuda, dan proklamasi kemerdekaan RI.',
  },
  {
    id: 15,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Informatika)',
    kode: 'KTR-IT',
    nama_tutor: 'M. Ihsan Fadhillah, S.Kom.',
    hari: 'Sabtu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '07',
    tema: 'blue',
    deskripsi: 'Desain media digital, manajemen basis data dasar, dan etika berinternet.',
  },
  {
    id: 17,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Keterampilan (Prakarya & Kewirausahaan)',
    kode: 'KTR-PKW',
    nama_tutor: 'Lia Karlia, S.Sos.',
    hari: 'Minggu',
    waktu: '12.30 – 13.10 WIB',
    nomor_urut: '08',
    tema: 'yellow',
    deskripsi: 'Strategi pemasaran digital, manajemen modal awal, dan branding UMKM.',
  },
  {
    id: 12,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Bahasa Arab',
    kode: 'BARB',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '13.10 – 13.50 WIB',
    nomor_urut: '09',
    tema: 'green',
    deskripsi: 'Insya (mengarang terpadu), tadribat tarkib kalimat, dan literasi kitab.',
  },
  {
    id: 13,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Pemberdayaan',
    kode: 'PBD',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '13.50 – 14.30 WIB',
    nomor_urut: '10',
    tema: 'pink',
    deskripsi: 'Inkubasi bisnis rintisan warga belajar dan kolaborasi lintas komunitas.',
  },
  {
    id: 1,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)',
    kode: 'PAI-BP',
    nama_tutor: 'Indrayani, S.S.,M.Pd. Gr.',
    hari: 'Minggu',
    waktu: '14.30 – 15.10 WIB',
    nomor_urut: '11',
    tema: 'coral',
    deskripsi: 'Kewarisan Islam (faraidh), etika bermedia sosial, dan ukhuwah wathaniyah.',
  },
  {
    id: 6,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Matematika',
    kode: 'MTK',
    nama_tutor: 'Sri Winarsih, S.Pd.',
    hari: 'Minggu',
    waktu: '15.30 – 16.10 WIB',
    nomor_urut: '12',
    tema: 'purple',
    deskripsi: 'Kalkulus diferensial, turunan fungsi aljabar, dan integral tak tentu.',
  },
  {
    id: 8,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Pendidikan Pancasila',
    kode: 'PPKN',
    nama_tutor: 'Kurniawan, S.Sos., Gr.',
    hari: 'Minggu',
    waktu: '16.10 – 16.50 WIB',
    nomor_urut: '13',
    tema: 'coral',
    deskripsi: 'Sistem hukum dan peradilan di Indonesia serta penegakan HAM konstitusional.',
  },
  {
    id: 4,
    rombel_id: 10,
    nama_rombel: 'Kelas 11-2 Paket C',
    jenjang: 'paket_c',
    nama: 'Ilmu Pengetahuan Sosial (IPS)',
    kode: 'IPS',
    nama_tutor: 'Ihsani Rizkyanti, S.E.',
    hari: 'Minggu',
    waktu: '16.50 – 17.30 WIB',
    nomor_urut: '14',
    tema: 'yellow',
    deskripsi: 'Struktur sosial masyarakat multikultural dan mitigasi konflik horizontal.',
  },
];

function RuangBelajarSiswa() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pkbm_user') || '{}'));

  // ── States Interaktif ───────────────────────────────────────
  const [activeJenjang, setActiveJenjang] = useState('semua');
  const [activeRombel, setActiveRombel] = useState('semua');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSkModal, setShowSkModal] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  const isStudent = user?.role === 'warga_belajar';

  // ── 1. Sinkronisasi Data Profil Siswa ───────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchFreshData = async () => {
      try {
        if (isStudent) {
          const profilRes = await SiswaAPI.getProfilSaya();
          const profil = profilRes.data.data;
          if (profil && isMounted) {
            const nextUser = {
              ...user,
              rombel_id: profil.rombel_id,
              nama_rombel: profil.nama_rombel || user.nama_rombel,
              nis: profil.nis || user.nis,
              jenjang: profil.jenjang || user.jenjang,
            };
            setUser(nextUser);
            localStorage.setItem('pkbm_user', JSON.stringify(nextUser));

            if (profil.jenjang) {
              setActiveJenjang(profil.jenjang);
            }
            if (profil.rombel_id) {
              setActiveRombel(String(profil.rombel_id));
            }
          }
        }
      } catch (err) {
        console.info('[RuangBelajarSiswa] Menggunakan dataset resmi SK 2026/2027.');
      }
    };

    fetchFreshData();
    return () => { isMounted = false; };
  }, [isStudent]);

  // ── 2. Filter & Pencarian Interaktif ─────────────────────────
  const filteredItems = useMemo(() => {
    return OFFICIAL_RUANG_BELAJAR_ITEMS.filter((item) => {
      // Filter Jenjang
      if (activeJenjang !== 'semua' && item.jenjang !== activeJenjang) {
        return false;
      }
      // Filter Rombel
      if (activeRombel !== 'semua' && String(item.rombel_id) !== String(activeRombel)) {
        return false;
      }
      // Filter Keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchTitle = item.nama.toLowerCase().includes(q);
        const matchTutor = item.nama_tutor.toLowerCase().includes(q);
        const matchKode = item.kode.toLowerCase().includes(q);
        const matchRombel = item.nama_rombel.toLowerCase().includes(q);
        const matchHari = item.hari.toLowerCase().includes(q);
        if (!matchTitle && !matchTutor && !matchKode && !matchRombel && !matchHari) {
          return false;
        }
      }
      return true;
    });
  }, [activeJenjang, activeRombel, searchKeyword]);

  // ── 3. Rombel Options Dinamis ───────────────────────────────
  const rombelOptions = useMemo(() => {
    const map = new Map();
    OFFICIAL_RUANG_BELAJAR_ITEMS.forEach((it) => {
      if (activeJenjang === 'semua' || it.jenjang === activeJenjang) {
        if (!map.has(it.rombel_id)) {
          map.set(it.rombel_id, { id: it.rombel_id, nama: it.nama_rombel, jenjang: it.jenjang });
        }
      }
    });
    return Array.from(map.values());
  }, [activeJenjang]);

  // Handler Masuk Kelas LMS
  const handleMasukKelas = (item) => {
    navigate(`/dashboard/siswa/kelas/${item.id}?rombel_id=${item.rombel_id}`);
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} />

      <main className="app-main">
        <div className="ruang-belajar-container">

          {/* ══ 1. CLEAN PAGE HEADER (TANPA KOTAK BESAR) ════════ */}
          <div className="rb-clean-header">
            <div>
              <h1 className="rb-clean-title">
                Ruang Belajar
              </h1>
              <p className="rb-clean-subtitle">
                Pilih mata pelajaran untuk mengakses modul pembelajaran, presensi, tugas mingguan, dan materi LMS terintegrasi.
              </p>
            </div>

            <div className="rb-clean-actions">
              <button
                type="button"
                className="rb-btn-pop primary"
                onClick={() => setShowSkModal(true)}
              >
                <i className="bi bi-file-earmark-text-fill"></i>
                <span>SK Roster Pengajar</span>
              </button>
            </div>
          </div>

          {/* ══ 2. CONTROLS BAR (FILTER, SEARCH & ROMBEL) ═══════ */}
          <div className="rb-controls-bar">
            {/* Tab Jenjang (Dengan Icon, Tanpa Emoji) */}
            <div className="rb-filter-tabs">
              <button
                type="button"
                className={`rb-tab-btn ${activeJenjang === 'semua' ? 'active' : ''}`}
                onClick={() => {
                  setActiveJenjang('semua');
                  setActiveRombel('semua');
                }}
              >
                <i className="bi bi-grid-fill"></i>
                <span>Semua Jenjang</span>
                <span className="tab-counter">{OFFICIAL_RUANG_BELAJAR_ITEMS.length}</span>
              </button>

              <button
                type="button"
                className={`rb-tab-btn ${activeJenjang === 'paket_a' ? 'active' : ''}`}
                onClick={() => {
                  setActiveJenjang('paket_a');
                  setActiveRombel('semua');
                }}
              >
                <i className="bi bi-backpack-fill"></i>
                <span>Paket A (Kelas 1 & 2)</span>
                <span className="tab-counter">6</span>
              </button>

              <button
                type="button"
                className={`rb-tab-btn ${activeJenjang === 'paket_b' ? 'active' : ''}`}
                onClick={() => {
                  setActiveJenjang('paket_b');
                  setActiveRombel('semua');
                }}
              >
                <i className="bi bi-book-half"></i>
                <span>Paket B (Kelas 7-1, 7-2, 8-1)</span>
                <span className="tab-counter">30</span>
              </button>

              <button
                type="button"
                className={`rb-tab-btn ${activeJenjang === 'paket_c' ? 'active' : ''}`}
                onClick={() => {
                  setActiveJenjang('paket_c');
                  setActiveRombel('semua');
                }}
              >
                <i className="bi bi-mortarboard-fill"></i>
                <span>Paket C (Kelas 10-1, 11-1, 11-2)</span>
                <span className="tab-counter">42</span>
              </button>
            </div>

            {/* Baris Kedua: Pencarian & Pilihan Rombel */}
            <div className="rb-search-row">
              {/* Search Bar */}
              <div className="rb-search-input-wrap">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Cari mata pelajaran, tutor, hari, atau kode..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="rb-search-input"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="rb-search-clear"
                    onClick={() => setSearchKeyword('')}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>

              {/* Rombel Filter Pills */}
              <div className="rb-rombel-pills">
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', marginRight: '4px' }}>
                  ROMBEL:
                </span>
                <button
                  type="button"
                  className={`rb-rombel-pill ${activeRombel === 'semua' ? 'active' : ''}`}
                  onClick={() => setActiveRombel('semua')}
                >
                  Semua Kelas
                </button>
                {rombelOptions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`rb-rombel-pill ${String(activeRombel) === String(r.id) ? 'active' : ''}`}
                    onClick={() => setActiveRombel(String(r.id))}
                  >
                    {r.nama}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ══ 3. CARDS GRID (RETRO POP CALENDAR) ══════════════ */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                background: '#1E1B4B', 
                color: '#FFE600', 
                fontSize: '0.78rem', 
                fontWeight: 800, 
                padding: '4px 10px', 
                borderRadius: '8px' 
              }}>
                TOTAL {filteredItems.length} MAPEL
              </span>
              <span style={{ color: '#64748B', fontSize: '0.86rem', fontWeight: 600 }}>
                Jadwal KBM Tatap Muka & Tutorial LMS (Sabtu & Minggu)
              </span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rb-empty-state">
              <i className="bi bi-search"></i>
              <h3>Tidak Ada Kelas Ditemukan</h3>
              <p>
                Tidak ditemukan mata pelajaran yang cocok dengan filter atau kata kunci "{searchKeyword}". Silakan ubah filter atau reset pencarian.
              </p>
              <button
                type="button"
                className="rb-btn-pop primary"
                style={{ marginTop: '1.25rem' }}
                onClick={() => {
                  setActiveJenjang('semua');
                  setActiveRombel('semua');
                  setSearchKeyword('');
                }}
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            <div className="rb-cards-grid">
              {filteredItems.map((item, idx) => {
                const themeClass = `theme-${item.tema || 'yellow'}`;

                return (
                  <div
                    key={`${item.rombel_id}-${item.id}-${idx}`}
                    className={`retro-cal-card ${themeClass}`}
                  >
                    {/* Double Binder Rings on top (Image 5) */}
                    <div className="cal-binder-rings">
                      <div className="cal-binder-ring" title="Calendar Ring"></div>
                      <div className="cal-binder-ring" title="Calendar Ring"></div>
                    </div>

                    {/* Card Top Section (Header) */}
                    <div className="cal-card-header">
                      {/* Hari Berbahasa Indonesia (Sabtu / Minggu) */}
                      <span className="cal-script-day">
                        {item.hari}
                      </span>

                      {/* Class Badge */}
                      <span className="cal-class-tag">
                        {item.nama_rombel}
                      </span>
                    </div>

                    {/* Card Body Section (Vibrant Colored Body) */}
                    <div className="cal-card-body">
                      {/* Nomor Urut Murni Tanpa Titik (Contoh: "01", "02") */}
                      <div className="cal-number-container">
                        <div className="cal-retro-number">
                          {item.nomor_urut || '01'}
                        </div>
                      </div>

                      {/* Mapel Subject Name */}
                      <h3 className="cal-subject-title" title={item.nama}>
                        {item.nama}
                      </h3>

                      {/* Tutor Info Pill */}
                      <div className="cal-tutor-pill" title={`Tutor: ${item.nama_tutor}`}>
                        <div className="cal-tutor-icon">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <span className="cal-tutor-name">
                          {item.nama_tutor}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="cal-card-actions">
                        <button
                          type="button"
                          className="cal-btn-enter"
                          onClick={() => handleMasukKelas(item)}
                        >
                          <i className="bi bi-box-arrow-in-right" style={{ fontSize: '1rem', color: '#16A34A' }}></i>
                          <span>Masuk Kelas</span>
                        </button>

                        <button
                          type="button"
                          className="cal-btn-info"
                          title="Lihat Detail Mapel & Silabus"
                          onClick={() => setActiveDetailItem(item)}
                        >
                          <i className="bi bi-info-circle-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* ══ 4. MODAL: SK RESMI PEMBAGIAN TUGAS ════════════════ */}
      {showSkModal && (
        <div className="rb-modal-overlay" onClick={() => setShowSkModal(false)}>
          <div className="rb-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rb-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="bi bi-award-fill" style={{ fontSize: '1.4rem', color: '#1E1B4B' }}></i>
                <h2 className="rb-modal-title">
                  Surat Keputusan Pembagian Tugas Mengajar & Roster Tutor
                </h2>
              </div>
              <button
                type="button"
                className="rb-modal-close"
                onClick={() => setShowSkModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="rb-modal-body">
              <div className="sk-document-paper">
                <div className="sk-header-text">
                  <h3>Pusat Kegiatan Belajar Masyarakat (PKBM) Bina Mandiri</h3>
                  <p>Kecamatan Paseh, Kabupaten Bandung — Tahun Ajaran 2026/2027</p>
                  <p style={{ fontWeight: 800, color: '#1E1B4B', marginTop: '6px' }}>
                    LAMPIRAN KEPUTUSAN KEPALA PKBM BINA MANDIRI NO: 01.010/PKBM-BM/VI/2026
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Ditetapkan pada tanggal 30 Juni 2026
                  </p>
                </div>

                <h4 style={{ fontWeight: 900, color: '#1E1B4B', margin: '1.25rem 0 0.5rem 0', fontSize: '1rem' }}>
                  I. DAFTAR TUTOR & PENGELOLA KEAKSARAAN & KESETARAAN
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="sk-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>NO</th>
                        <th>NAMA LENGKAP & GELAR</th>
                        <th>JABATAN</th>
                        <th>PENUGASAN JENJANG</th>
                        <th>KETERANGAN / MAPEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OFFICIAL_TUTOR_LIST.map((t) => (
                        <tr key={t.no}>
                          <td className="center" style={{ fontWeight: 800 }}>{t.no}</td>
                          <td style={{ fontWeight: 700, color: '#1E1B4B' }}>{t.nama}</td>
                          <td className="center">{t.jabatan}</td>
                          <td className="center" style={{ fontWeight: 600 }}>{t.jenjang}</td>
                          <td>{t.ket}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ fontWeight: 900, color: '#1E1B4B', margin: '2rem 0 0.5rem 0', fontSize: '1rem' }}>
                  II. RINGKASAN PEMBAGIAN TUGAS MENGAJAR PER ROMBEL
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#FFFBEB', border: '2px solid #FCD34D', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#92400E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-backpack-fill"></i>
                      <span>Paket A (Kelas 1 & 2)</span>
                    </div>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.84rem', color: '#78350F' }}>
                      <li>Guru Kelas 1: Sri Winarsih, S.Pd.</li>
                      <li>Guru Kelas 2: Ihsani Rizkyanti, S.E.</li>
                      <li>PJOK (Kls 1 & 2): M. Iqbal Fauzil Adhim, S.E.</li>
                      <li>PAI-BP (Kls 1 & 2): Indrayani, S.S.,M.Pd. Gr.</li>
                    </ul>
                  </div>

                  <div style={{ background: '#EFF6FF', border: '2px solid #BFDBFE', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#1E40AF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-book-half"></i>
                      <span>Paket B (Kelas 7-1, 7-2, 8-1)</span>
                    </div>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.84rem', color: '#1E3A8A' }}>
                      <li>10 Mata Pelajaran terstruktur</li>
                      <li>8 Tutor spesialis pengampu</li>
                      <li>Jadwal KBM: Sabtu & Minggu</li>
                    </ul>
                  </div>

                  <div style={{ background: '#FAF5FF', border: '2px solid #E9D5FF', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#6B21A8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-mortarboard-fill"></i>
                      <span>Paket C (Kelas 10-1, 11-1, 11-2)</span>
                    </div>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.84rem', color: '#581C87' }}>
                      <li>14 Mata Pelajaran lengkap</li>
                      <li>Pendalaman vokasional & informatika</li>
                      <li>Jadwal KBM: Sabtu & Minggu</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="rb-btn-pop primary"
                    onClick={() => setShowSkModal(false)}
                  >
                    <span>Mengerti & Tutup Dokumen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ 5. MODAL: DETAIL MAPEL & QUICK VIEW ══════════════ */}
      {activeDetailItem && (
        <div className="rb-modal-overlay" onClick={() => setActiveDetailItem(null)}>
          <div className="rb-modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="rb-modal-header" style={{ background: '#FFE600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-book-half" style={{ fontSize: '1.25rem', color: '#1E1B4B' }}></i>
                <h3 className="rb-modal-title" style={{ fontSize: '1.15rem' }}>
                  Detail Mata Pelajaran
                </h3>
              </div>
              <button
                type="button"
                className="rb-modal-close"
                onClick={() => setActiveDetailItem(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="rb-modal-body" style={{ padding: '1.5rem' }}>
              <div style={{
                background: '#FFFFFF',
                border: '2.5px solid #1E1B4B',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '4px 4px 0px #1E1B4B',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    background: '#1E1B4B',
                    color: '#FFE600',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    letterSpacing: '0.04em'
                  }}>
                    {activeDetailItem.kode}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B' }}>
                    {activeDetailItem.nama_rombel}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#1E1B4B',
                  margin: '0 0 0.75rem 0',
                  lineHeight: 1.3
                }}>
                  {activeDetailItem.nama}
                </h2>

                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  {activeDetailItem.deskripsi}
                </p>
              </div>

              {/* Tutor & Info Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#FFE600',
                    border: '1.5px solid #1E1B4B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1E1B4B',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    <i className="bi bi-person-fill-check"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      TUTOR PENGAMPU
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E1B4B' }}>
                      {activeDetailItem.nama_tutor}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#DCFCE7',
                    border: '1.5px solid #1E1B4B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803D',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    <i className="bi bi-calendar-check-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      JADWAL KALENDER AKADEMIK
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E1B4B' }}>
                      Hari {activeDetailItem.hari} ({activeDetailItem.waktu})
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Action */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="rb-btn-pop secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setActiveDetailItem(null)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="rb-btn-pop primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={() => {
                    handleMasukKelas(activeDetailItem);
                    setActiveDetailItem(null);
                  }}
                >
                  <i className="bi bi-door-open-fill"></i>
                  <span>Buka Ruang Kelas LMS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default RuangBelajarSiswa;
