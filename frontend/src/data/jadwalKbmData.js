// ============================================================
// frontend/src/data/jadwalKbmData.js
// Data Master Jadwal Pelajaran Tatap Muka PKBM Bina Mandiri
// Dasar: Lampiran SK Kepala PKBM Bina Mandiri No: 01.010/PKBM-BM/VI/2026
// Warna Resmi:
// - SD  (Paket A) : MERAH  (#EF4444)
// - SMP (Paket B) : HIJAU  (#22C55E)
// - SMA (Paket C) : BIRU   (#3B82F6)
// ============================================================

export const JADWAL_SKBM_INFO = {
  nomorSK: '01.010/PKBM-BM/VI/2026',
  tanggalSK: '30 Juni 2026',
  tahunAjaran: '2026/2027',
  lembaga: 'PKBM BINA MANDIRI',
  yayasan: 'YAYASAN AMAL BINA INSANI DARULHUDA SUMEDANG',
  izinOperasional: '1190 Tahun 2025',
  tanggalIzin: '08-08-2025',
  npsn: 'P2970848',
  alamat: 'Dusun Sukahurip RT 03 RW 03 Desa Legok Kaler Kec. Paseh Kab. Sumedang Prov. Jawa Barat Kode Pos 5381',
  kontak: '0823-1838-3605 | pkbminamandiripaseh@gmail.com',
  website: 'pkbminamandiri.sch.id',
  kepalaPKBM: 'INDRAYANI, S.S., M.Pd.',
};

export const JENJANG_COLOR_CONFIG = {
  sd: {
    key: 'sd',
    name: 'Paket A (Setara SD)',
    shortName: 'Paket A (SD)',
    colorName: 'Merah',
    hex: '#EF4444',
    badgeClass: 'jenjang-badge-sd',
    cardClass: 'journal-jenjang-sd',
    borderClass: 'border-red-500',
    timeRange: '08.00 – 11.15 WIB',
    sesi: 'Sesi Pagi',
    alokasi: '4 JP per hari @ 45 menit (Istirahat: 09.30 – 09.45 WIB)',
    hari: 'Sabtu & Minggu',
    rombelList: ['Kelas 1', 'Kelas 2'],
    guruKelas: {
      'Kelas 1': 'Sri Winarsih, S.Pd.',
      'Kelas 2': 'Ihsani Rizkyanti, S.E.',
    },
    ringkasan: 'Pembelajaran Tematik Terpadu Guru Kelas, dilengkapi PAI-BP dan PJOK.',
  },
  smp: {
    key: 'smp',
    name: 'Paket B (Setara SMP)',
    shortName: 'Paket B (SMP)',
    colorName: 'Hijau',
    hex: '#22C55E',
    badgeClass: 'jenjang-badge-smp',
    cardClass: 'journal-jenjang-smp',
    borderClass: 'border-green-500',
    timeRange: '08.00 – 12.00 WIB',
    sesi: 'Sesi Pagi – Siang',
    alokasi: '5 JP per hari @ 45 menit (Istirahat: 10.15 – 10.30 WIB)',
    hari: 'Sabtu & Minggu',
    rombelList: ['Kelas 7-1', 'Kelas 7-2', 'Kelas 8-1'],
    guruKelas: null,
    ringkasan: 'Mata pelajaran bidang studi pokok (IPA, IPS, Pend. Pancasila, Mat, PAI, B.Inggris, B.Indo, PJOK, Seni Budaya, Pemberdayaan).',
  },
  sma: {
    key: 'sma',
    name: 'Paket C (Setara SMA/MA)',
    shortName: 'Paket C (SMA)',
    colorName: 'Biru',
    hex: '#3B82F6',
    badgeClass: 'jenjang-badge-sma',
    cardClass: 'journal-jenjang-sma',
    borderClass: 'border-blue-500',
    timeRange: '12.30 – 17.30 WIB',
    sesi: 'Sesi Siang – Sore',
    alokasi: '7 JP per hari @ 40 menit (Istirahat & Shalat Ashar: 15.10 – 15.30 WIB)',
    hari: 'Sabtu & Minggu',
    rombelList: ['Kelas 10-1', 'Kelas 11-1', 'Kelas 11-2'],
    guruKelas: null,
    ringkasan: 'Mata pelajaran peminatan & vokasi (Ekonomi, Sejarah, TIK, Prakarya, Bahasa Arab) disertai jeda ibadah Shalat Ashar berjamaah.',
  },
};

export const JADWAL_DETAIL_DATA = {
  sd: {
    sabtu: {
      'Kelas 1': {
        guruKelas: 'Sri Winarsih, S.Pd.',
        sesi: 'Sesi Pagi (08.00 – 11.15 WIB)',
        istirahat: '09.30 – 09.45 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Bahasa Indonesia (Guru Kelas)', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: '-', waktu: '09.30 – 09.45', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 3, waktu: '09.45 – 10.30', mapel: 'Matematika (Guru Kelas)', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
        ],
      },
      'Kelas 2': {
        guruKelas: 'Ihsani Rizkyanti, S.E.',
        sesi: 'Sesi Pagi (08.00 – 11.15 WIB)',
        istirahat: '09.30 – 09.45 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Bahasa Indonesia (Guru Kelas)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: '-', waktu: '09.30 – 09.45', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 3, waktu: '09.45 – 10.30', mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Matematika (Guru Kelas)', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
    },
    minggu: {
      'Kelas 1': {
        guruKelas: 'Sri Winarsih, S.Pd.',
        sesi: 'Sesi Pagi (08.00 – 11.15 WIB)',
        istirahat: '09.30 – 09.45 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pendidikan Pancasila (Guru Kelas)', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Ilmu Pengetahuan Alam dan Sosial / IPAS (Guru Kelas)', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: '-', waktu: '09.30 – 09.45', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 3, waktu: '09.45 – 10.30', mapel: 'Seni Budaya dan Prakarya (Guru Kelas)', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Penguatan Literasi, Numerasi & Pemberdayaan', tutor: 'Sri Winarsih, S.Pd.' },
        ],
      },
      'Kelas 2': {
        guruKelas: 'Ihsani Rizkyanti, S.E.',
        sesi: 'Sesi Pagi (08.00 – 11.15 WIB)',
        istirahat: '09.30 – 09.45 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pendidikan Pancasila (Guru Kelas)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Ilmu Pengetahuan Alam dan Sosial / IPAS (Guru Kelas)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: '-', waktu: '09.30 – 09.45', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 3, waktu: '09.45 – 10.30', mapel: 'Seni Budaya dan Prakarya (Guru Kelas)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Penguatan Literasi, Numerasi & Pemberdayaan', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
    },
  },

  smp: {
    sabtu: {
      'Kelas 7-1': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Ilmu Pengetahuan Alam (IPA)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Ilmu Pengetahuan Sosial (IPS)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
        ],
      },
      'Kelas 7-2': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Ilmu Pengetahuan Alam (IPA)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
        ],
      },
      'Kelas 8-1': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Ilmu Pengetahuan Sosial (IPS)', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Pendidikan Agama Islam dan Budi Pekerti (PAI-BP)', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Bahasa Inggris', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
        ],
      },
    },
    minggu: {
      'Kelas 7-1': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Bahasa Inggris', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Pemberdayaan dan Keterampilan', tutor: 'Ilham Maulana Yasin, S.Kom.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
        ],
      },
      'Kelas 7-2': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pemberdayaan dan Keterampilan', tutor: 'Ilham Maulana Yasin, S.Kom.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Bahasa Inggris', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Ilmu Pengetahuan Sosial (IPS)', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
      'Kelas 8-1': {
        sesi: 'Sesi Pagi – Siang (08.00 – 12.00 WIB)',
        istirahat: '10.15 – 10.30 WIB',
        pelajaran: [
          { jam: 1, waktu: '08.00 – 08.45', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 2, waktu: '08.45 – 09.30', mapel: 'Ilmu Pengetahuan Alam (IPA)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 3, waktu: '09.30 – 10.15', mapel: 'Pemberdayaan dan Keterampilan', tutor: 'Ilham Maulana Yasin, S.Kom.' },
          { jam: '-', waktu: '10.15 – 10.30', mapel: 'ISTIRAHAT', tutor: '-', isBreak: true },
          { jam: 4, waktu: '10.30 – 11.15', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 5, waktu: '11.15 – 12.00', mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', tutor: 'M. Iqbal Fauzil Adhim, S.E.' },
        ],
      },
    },
  },

  sma: {
    sabtu: {
      'Kelas 10-1': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'PAI-BP', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'IPS', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'IPA', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'PJOK', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
        ],
      },
      'Kelas 11-1': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'IPS', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'IPA', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'PJOK', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'Ekonomi', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
      'Kelas 11-2': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'IPA', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'PJOK', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'Seni dan Budaya', tutor: 'Tarisa Aidil Alzahra, S.E.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'Ekonomi', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'Sejarah', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'Keterampilan (TIK)', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
        ],
      },
    },
    minggu: {
      'Kelas 10-1': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'Bahasa Indonesia', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'Ekonomi', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'Sejarah', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'Keterampilan (TIK)', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'Keterampilan (Prakarya)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'Bahasa Arab', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'Pemberdayaan', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
      'Kelas 11-1': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'Sejarah', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'Keterampilan (TIK)', tutor: 'M. Ihsan Fadhillah, S.Kom.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'Keterampilan (Prakarya)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'Bahasa Arab', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'Pemberdayaan', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'PAI-BP', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
        ],
      },
      'Kelas 11-2': {
        sesi: 'Sesi Siang – Sore (12.30 – 17.30 WIB)',
        istirahat: '15.10 – 15.30 WIB (Istirahat & Shalat Ashar)',
        pelajaran: [
          { jam: 1, waktu: '12.30 – 13.10', mapel: 'Keterampilan (Prakarya)', tutor: 'Lia Karlia, S.Sos.' },
          { jam: 2, waktu: '13.10 – 13.50', mapel: 'Bahasa Arab', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: 3, waktu: '13.50 – 14.30', mapel: 'Pemberdayaan', tutor: 'Ihsani Rizkyanti, S.E.' },
          { jam: 4, waktu: '14.30 – 15.10', mapel: 'PAI-BP', tutor: 'Indrayani, S.S., M.Pd. Gr.' },
          { jam: '-', waktu: '15.10 – 15.30', mapel: 'ISTIRAHAT & SHALAT ASHAR', tutor: '-', isBreak: true },
          { jam: 5, waktu: '15.30 – 16.10', mapel: 'Matematika', tutor: 'Sri Winarsih, S.Pd.' },
          { jam: 6, waktu: '16.10 – 16.50', mapel: 'Pendidikan Pancasila', tutor: 'Kurniawan, S.Sos., Gr.' },
          { jam: 7, waktu: '16.50 – 17.30', mapel: 'IPS', tutor: 'Ihsani Rizkyanti, S.E.' },
        ],
      },
    },
  },
};

