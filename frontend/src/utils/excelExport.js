// ============================================================
// src/utils/excelExport.js
// Utilitas Pembuatan & Ekspor File Excel Resmi (.xlsx)
// Laporan Hasil Penerimaan Siswa Baru PKBM Bina Mandiri
// ============================================================

import ExcelJS from 'exceljs';

/**
 * Menghitung tahun ajaran real-time berdasarkan tanggal saat ini.
 * Di Indonesia, semester ganjil dimulai bulan Juli (bulan 7).
 * Contoh: 
 *   - Bulan November 2026 -> Tahun Ajaran "2026/2027"
 *   - Bulan Mei 2027      -> Tahun Ajaran "2026/2027"
 *   - Bulan Juli 2027     -> Tahun Ajaran "2027/2028"
 */
export function getTahunAjaranRealTime(targetDate = new Date()) {
  const d = new Date(targetDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 - 12
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

/**
 * Konversi URL gambar ke Base64 untuk disematkan dalam file ExcelJS.
 */
let cachedLogoBase64 = null;
export async function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const response = await fetch('/images/logo new.png');
    if (!response.ok) throw new Error('Logo tidak ditemukan');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result;
        resolve(cachedLogoBase64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Gagal memuat logo untuk Excel, melanjutkan tanpa logo:', err);
    return null;
  }
}

/**
 * Pemformat tanggal resmi Indonesia untuk dokumen
 */
export function formatTanggalDokumen(date = new Date()) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Pemformat tanggal & waktu cetak
 */
export function formatWaktuCetak(date = new Date()) {
  const d = new Date(date);
  const tgl = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${tgl}, ${jam} WIB`;
}

const JENJANG_MAP = {
  paket_a: 'Paket A (SD)',
  paket_b: 'Paket B (SMP)',
  paket_c: 'Paket C (SMA)',
};

/**
 * Generate dan Unduh File Excel (.xlsx) Laporan Hasil Penerimaan Siswa Baru
 */
export async function generateLaporanSiswaExcel({
  data = [],
  tahunAjaran = null,
  filterInfo = 'Semua Jenjang',
  tipeLaporan = 'Data Warga Belajar', // 'Data Warga Belajar' | 'Penerimaan SPMB'
}) {
  const ta = tahunAjaran || getTahunAjaranRealTime();
  const logoBase64 = await getLogoBase64();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PKBM Bina Mandiri - Sistem Informasi Akademik';
  workbook.lastModifiedBy = 'Admin TU PKBM Bina Mandiri';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Laporan Penerimaan Siswa', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    views: [{ showGridLines: true }],
  });

  // Total kolom ada 14: Kolom A sampai Kolom N
  const LAST_COL = 'N';
  const LAST_COL_INDEX = 14;

  // Lebar kolom yang proporsional
  worksheet.columns = [
    { key: 'no', width: 6 },            // A: No
    { key: 'nis', width: 17 },           // B: NIS
    { key: 'nik', width: 19 },           // C: NIK
    { key: 'nama', width: 30 },          // D: Nama Lengkap
    { key: 'jk', width: 8 },             // E: L/P
    { key: 'tgl_lahir', width: 16 },     // F: Tgl Lahir
    { key: 'jenjang', width: 16 },       // G: Jenjang
    { key: 'rombel', width: 18 },        // H: Rombel
    { key: 'nama_wali', width: 25 },     // I: Orang Tua / Wali
    { key: 'no_telp', width: 17 },       // J: No. Telp / WA
    { key: 'alamat', width: 35 },        // K: Alamat Lengkap
    { key: 'jarak', width: 11 },         // L: Jarak (km)
    { key: 'status', width: 14 },        // M: Status
    { key: 'tgl_daftar', width: 16 },    // N: Tgl Terdaftar
  ];

  // -------------------------------------------------------------
  // 1. KOP SURAT / HEADER RESMI (Row 1 - 5)
  // Menyatukan seluruh kolom A sampai N (mergeCells)
  // -------------------------------------------------------------
  const headerRows = [
    {
      row: 1,
      text: 'PUSAT KEGIATAN BELAJAR MASYARAKAT (PKBM) BINA MANDIRI',
      font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F2C59' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      height: 24,
    },
    {
      row: 2,
      text: 'LAPORAN HASIL PENERIMAAN SISWA BARU (WARGA BELAJAR)',
      font: { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      height: 20,
    },
    {
      row: 3,
      text: `TAHUN AJARAN ${ta}`,
      font: { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1D4ED8' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      height: 20,
    },
    {
      row: 4,
      text: 'Izin Operasional: 421.1/04-Disdik/2020 | NPSN: P9962879 | Terakreditasi BAN-PAUD dan PNF',
      font: { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      height: 16,
    },
    {
      row: 5,
      text: 'Sekretariat: Jl. KH. Hasyim Ashari No. 85, Cipondoh, Kota Tangerang, Banten | Web: pkbmbinamandiri.sch.id',
      font: { name: 'Arial', size: 9, color: { argb: 'FF64748B' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      height: 16,
    },
  ];

  headerRows.forEach(hr => {
    worksheet.mergeCells(`A${hr.row}:${LAST_COL}${hr.row}`);
    const cell = worksheet.getCell(`A${hr.row}`);
    cell.value = hr.text;
    cell.font = hr.font;
    cell.alignment = hr.alignment;
    worksheet.getRow(hr.row).height = hr.height;
  });

  // Garis Pembatas Kop Surat Ganda di Row 6
  worksheet.mergeCells(`A6:${LAST_COL}6`);
  const borderCell = worksheet.getCell('A6');
  borderCell.value = '';
  worksheet.getRow(6).height = 4;
  for (let c = 1; c <= LAST_COL_INDEX; c++) {
    worksheet.getRow(6).getCell(c).border = {
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
  }

  // Sematkan Logo di Sisi Kiri Kop Surat (jika ada)
  if (logoBase64) {
    try {
      const imgId = workbook.addImage({
        base64: logoBase64,
        extension: 'png',
      });
      worksheet.addImage(imgId, {
        tl: { col: 0.15, row: 0.2 },
        ext: { width: 78, height: 78 },
        editAs: 'undefined',
      });
    } catch (e) {
      console.warn('Gagal menempelkan gambar logo ke worksheet:', e);
    }
  }

  // -------------------------------------------------------------
  // 2. META DATA INFORMASI LAPORAN (Row 7 - 9)
  // -------------------------------------------------------------
  worksheet.getRow(7).height = 10; // spasi kosong

  const infoRow1 = worksheet.getRow(8);
  infoRow1.height = 18;
  worksheet.getCell('A8').value = 'Tanggal Cetak / Ekspor:';
  worksheet.getCell('A8').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  worksheet.mergeCells('B8:E8');
  worksheet.getCell('B8').value = formatWaktuCetak();
  worksheet.getCell('B8').font = { name: 'Arial', size: 9.5, color: { argb: 'FF0F172A' } };

  worksheet.getCell('I8').value = 'Filter Kategori:';
  worksheet.getCell('I8').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  worksheet.mergeCells(`J8:${LAST_COL}8`);
  worksheet.getCell('J8').value = filterInfo;
  worksheet.getCell('J8').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF1D4ED8' } };

  const totalSiswa = data.length;
  const countPaketA = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_a').length;
  const countPaketB = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_b').length;
  const countPaketC = data.filter(d => (d.jenjang || d.jenjang_daftar) === 'paket_c').length;

  const infoRow2 = worksheet.getRow(9);
  infoRow2.height = 18;
  worksheet.getCell('A9').value = 'Total Siswa:';
  worksheet.getCell('A9').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  worksheet.mergeCells('B9:E9');
  worksheet.getCell('B9').value = `${totalSiswa} Orang (Paket A: ${countPaketA}, Paket B: ${countPaketB}, Paket C: ${countPaketC})`;
  worksheet.getCell('B9').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } };

  worksheet.getCell('I9').value = 'Status Dokumen:';
  worksheet.getCell('I9').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  worksheet.mergeCells(`J9:${LAST_COL}9`);
  worksheet.getCell('J9').value = 'DATA RESMI PENERIMAAN SISWA BARU';
  worksheet.getCell('J9').font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };

  worksheet.getRow(10).height = 8; // spasi sebelum tabel

  // -------------------------------------------------------------
  // 3. HEADER TABEL DATA (Row 11)
  // -------------------------------------------------------------
  const tableHeaders = [
    'NO',
    'NO. INDUK (NIS)',
    'NIK',
    'NAMA LENGKAP SISWA',
    'L/P',
    'TGL LAHIR',
    'JENJANG',
    'ROMBEL / KELAS',
    'ORANG TUA / WALI',
    'NO. TELP / WA',
    'ALAMAT LENGKAP',
    'JARAK (KM)',
    'STATUS',
    'TGL TERDAFTAR',
  ];

  const headerRow = worksheet.getRow(11);
  headerRow.height = 28;

  tableHeaders.forEach((text, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = text;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Royal Dark Blue
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF60A5FA' } },
      right: { style: 'thin', color: { argb: 'FF60A5FA' } },
    };
  });

  // -------------------------------------------------------------
  // 4. BARIS DATA SISWA (Row 12 dst)
  // -------------------------------------------------------------
  let currentRowIdx = 12;

  data.forEach((siswa, index) => {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 22;

    const isEven = index % 2 === 1;
    const bgPattern = isEven ? 'FFF8FAFC' : 'FFFFFFFF'; // Zebra striping

    const jenjangRaw = siswa.jenjang || siswa.jenjang_daftar || '';
    const jenjangText = JENJANG_MAP[jenjangRaw] || jenjangRaw || '-';
    
    // Tgl Lahir
    let tglLahirText = '-';
    if (siswa.tanggal_lahir) {
      try {
        tglLahirText = new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        });
      } catch {
        tglLahirText = String(siswa.tanggal_lahir);
      }
    }

    // Tgl Daftar
    let tglDaftarText = '-';
    if (siswa.created_at) {
      try {
        tglDaftarText = new Date(siswa.created_at).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
      } catch {
        tglDaftarText = String(siswa.created_at);
      }
    }

    // Status label
    let statusText = 'Aktif';
    if (siswa.is_aktif !== undefined) {
      statusText = siswa.is_aktif ? 'Aktif' : 'Nonaktif';
    } else if (siswa.status) {
      statusText = siswa.status.toUpperCase();
    }

    const rowValues = [
      index + 1,
      siswa.nis || '-',
      siswa.nik ? `'${siswa.nik}` : '-', // Kutip depan agar NIK tidak jadi angka eksponensial di Excel
      siswa.nama_lengkap || siswa.nama || '-',
      siswa.jenis_kelamin || '-',
      tglLahirText,
      jenjangText,
      siswa.nama_rombel || '-',
      siswa.nama_wali || '-',
      siswa.no_telp || '-',
      siswa.alamat || '-',
      siswa.jarak_rumah_km !== null && siswa.jarak_rumah_km !== undefined ? siswa.jarak_rumah_km : '-',
      statusText,
      tglDaftarText,
    ];

    rowValues.forEach((val, idx) => {
      const colNumber = idx + 1;
      const cell = row.getCell(colNumber);
      cell.value = val;
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgPattern },
      };

      // Alignment berdasarkan tipe kolom
      if ([1, 2, 3, 5, 6, 7, 10, 12, 13, 14].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: colNumber === 11 };
      }

      // Khusus NIS dibuat bold biru
      if (colNumber === 2 && val !== '-') {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1D4ED8' } };
      }

      // Khusus Status diberi warna tegas
      if (colNumber === 13) {
        if (statusText === 'Aktif' || statusText === 'DITERIMA') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF047857' } };
        } else if (statusText === 'DITOLAK' || statusText === 'Nonaktif') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
        } else {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFB45309' } };
        }
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    currentRowIdx++;
  });

  // -------------------------------------------------------------
  // 5. BARIS TOTAL / SUMMARY (Row Akhir Tabel)
  // -------------------------------------------------------------
  const totalRow = worksheet.getRow(currentRowIdx);
  totalRow.height = 24;
  worksheet.mergeCells(`A${currentRowIdx}:M${currentRowIdx}`);
  const totalCell = worksheet.getCell(`A${currentRowIdx}`);
  totalCell.value = `TOTAL KESELURUHAN SISWA: ${totalSiswa} Orang (Paket A: ${countPaketA} | Paket B: ${countPaketB} | Paket C: ${countPaketC})`;
  totalCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
  totalCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  
  for (let c = 1; c <= LAST_COL_INDEX; c++) {
    const cCell = totalRow.getCell(c);
    cCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cCell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // -------------------------------------------------------------
  // 6. LEMBAR PENGESAHAN / TANDA TANGAN (Kanan Bawah)
  // -------------------------------------------------------------
  const signStartRow = currentRowIdx + 2;
  worksheet.getRow(signStartRow).height = 18;
  worksheet.mergeCells(`J${signStartRow}:${LAST_COL}${signStartRow}`);
  const tglSignCell = worksheet.getCell(`J${signStartRow}`);
  tglSignCell.value = `Tangerang, ${formatTanggalDokumen()}`;
  tglSignCell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF0F172A' } };
  tglSignCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const signJabatanRow = signStartRow + 1;
  worksheet.getRow(signJabatanRow).height = 18;
  worksheet.mergeCells(`J${signJabatanRow}:${LAST_COL}${signJabatanRow}`);
  const jabatanCell = worksheet.getCell(`J${signJabatanRow}`);
  jabatanCell.value = 'Mengetahui,\nKepala PKBM Bina Mandiri';
  jabatanCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
  jabatanCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(signJabatanRow).height = 30;

  // Ruang tanda tangan kosong (3 baris)
  worksheet.getRow(signJabatanRow + 1).height = 15;
  worksheet.getRow(signJabatanRow + 2).height = 15;
  worksheet.getRow(signJabatanRow + 3).height = 15;

  const signNamaRow = signJabatanRow + 4;
  worksheet.getRow(signNamaRow).height = 18;
  worksheet.mergeCells(`J${signNamaRow}:${LAST_COL}${signNamaRow}`);
  const namaKepalaCell = worksheet.getCell(`J${signNamaRow}`);
  namaKepalaCell.value = 'Dra. Hj. Siti Rohmah, M.Pd';
  namaKepalaCell.font = { name: 'Arial', size: 10, bold: true, underline: true, color: { argb: 'FF0F172A' } };
  namaKepalaCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const signNipRow = signNamaRow + 1;
  worksheet.getRow(signNipRow).height = 16;
  worksheet.mergeCells(`J${signNipRow}:${LAST_COL}${signNipRow}`);
  const nipCell = worksheet.getCell(`J${signNipRow}`);
  nipCell.value = 'NIP / NUPTK: 197408152008012004';
  nipCell.font = { name: 'Arial', size: 8.5, color: { argb: 'FF475569' } };
  nipCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // -------------------------------------------------------------
  // 7. WRITE BUFFER & TRIGGER BROWSER DOWNLOAD
  // -------------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const safeTa = ta.replace('/', '-');
  const nowStr = new Date().toISOString().slice(0, 10);
  const fileName = `Laporan_Penerimaan_Siswa_PKBM_Bina_Mandiri_TA_${safeTa}_${nowStr}.xlsx`;

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);

  return { success: true, fileName };
}

