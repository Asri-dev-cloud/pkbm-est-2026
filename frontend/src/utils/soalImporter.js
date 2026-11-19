// ============================================================
// src/utils/soalImporter.js — Parser & Template Generator Soal PG
// ============================================================
// Mendukung import dari:
// 1. File Excel (.xlsx, .xls) menggunakan exceljs
// 2. File CSV (.csv)
// 3. File Word (.docx) menggunakan jszip (ekstrak word/document.xml)
// 4. File Teks (.txt)
// Serta pembuatan & unduh template resmi Excel untuk Pilihan Ganda.
// ============================================================

import JSZip from 'jszip';

let ExcelJSModule = null;
async function getExcelJS() {
  if (!ExcelJSModule) {
    const mod = await import('exceljs');
    ExcelJSModule = mod.default || mod;
  }
  return ExcelJSModule;
}

/**
 * Buat dan unduh file Template Excel Soal Pilihan Ganda (.xlsx)
 */
export async function downloadTemplateExcelSoalPG() {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PKBM Bina Mandiri';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Template Soal PG', {
    views: [{ showGridLines: true }]
  });

  // Header Kolom
  sheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'Pertanyaan', key: 'pertanyaan', width: 50 },
    { header: 'Pilihan A', key: 'opsi_a', width: 26 },
    { header: 'Pilihan B', key: 'opsi_b', width: 26 },
    { header: 'Pilihan C', key: 'opsi_c', width: 26 },
    { header: 'Pilihan D', key: 'opsi_d', width: 26 },
    { header: 'Kunci Jawaban', key: 'kunci', width: 16 }
  ];

  // Styling Header (Baris 1)
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' } // Indigo modern
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'medium', color: { argb: 'FF4338CA' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  });

  // Contoh Data
  const sampleData = [
    {
      no: 1,
      pertanyaan: 'Ibu kota negara Republik Indonesia saat ini berkedudukan di...',
      opsi_a: 'DKI Jakarta',
      opsi_b: 'Surabaya',
      opsi_c: 'Bandung',
      opsi_d: 'Medan',
      kunci: 'A'
    },
    {
      no: 2,
      pertanyaan: 'Lambang sila ke-3 Pancasila (Persatuan Indonesia) adalah...',
      opsi_a: 'Bintang Emas',
      opsi_b: 'Rantai Baja',
      opsi_c: 'Pohon Beringin',
      opsi_d: 'Padi dan Kapas',
      kunci: 'C'
    },
    {
      no: 3,
      pertanyaan: 'Lembaga tinggi negara pemegang kekuasaan membentuk Undang-Undang di Indonesia adalah...',
      opsi_a: 'Dewan Perwakilan Rakyat (DPR)',
      opsi_b: 'Mahkamah Agung (MA)',
      opsi_c: 'Mahkamah Konstitusi (MK)',
      opsi_d: 'Komisi Yudisial (KY)',
      kunci: 'A'
    },
    {
      no: 4,
      pertanyaan: 'Hasil perhitungan dari 15 + 25 x 2 adalah...',
      opsi_a: '80',
      opsi_b: '65',
      opsi_c: '70',
      opsi_d: '55',
      kunci: 'B'
    },
    {
      no: 5,
      pertanyaan: 'Gas yang sangat dibutuhkan manusia untuk proses pernapasan adalah...',
      opsi_a: 'Karbon Dioksida (CO2)',
      opsi_b: 'Oksigen (O2)',
      opsi_c: 'Nitrogen (N2)',
      opsi_d: 'Metana (CH4)',
      kunci: 'B'
    }
  ];

  sampleData.forEach((item) => {
    const row = sheet.addRow(item);
    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 1 || colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Soal_Pilihan_Ganda_PKBM.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Normalisasi kunci jawaban ke format 'a' | 'b' | 'c' | 'd'
 */
function normalizeKunci(val) {
  if (!val) return 'a';
  const str = String(val).trim().toLowerCase();
  if (str.includes('a') || str === '1') return 'a';
  if (str.includes('b') || str === '2') return 'b';
  if (str.includes('c') || str === '3') return 'c';
  if (str.includes('d') || str === '4') return 'd';
  return 'a';
}

/**
 * Parser teks bebas / Word menjadi butir soal PG
 */
export function parseTextToSoalPG(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Cari pemecah butir soal (misal: "1.", "1)", "Soal 1", "No 1")
  const questionBlocks = [];
  let currentBlock = [];

  const isQuestionStart = (line) => {
    return /^(\d+[\.\)]|soal\s*\d+|no[\.\s]*\d+)/i.test(line);
  };

  for (const line of lines) {
    if (isQuestionStart(line)) {
      if (currentBlock.length > 0) {
        questionBlocks.push(currentBlock);
      }
      currentBlock = [line];
    } else {
      if (currentBlock.length > 0) {
        currentBlock.push(line);
      } else {
        currentBlock = [line];
      }
    }
  }
  if (currentBlock.length > 0) {
    questionBlocks.push(currentBlock);
  }

  const parsedQuestions = [];

  questionBlocks.forEach((block, idx) => {
    let pertanyaan = '';
    let opsi_a = '';
    let opsi_b = '';
    let opsi_c = '';
    let opsi_d = '';
    let kunci = 'a';

    let readingPertanyaan = true;

    block.forEach((line) => {
      // Cek apakah line adalah opsi jawaban
      const matchA = line.match(/^[aA][\.\)\:\-]\s*(.*)$/);
      const matchB = line.match(/^[bB][\.\)\:\-]\s*(.*)$/);
      const matchC = line.match(/^[cC][\.\)\:\-]\s*(.*)$/);
      const matchD = line.match(/^[dD][\.\)\:\-]\s*(.*)$/);
      const matchKunci = line.match(/^(?:kunci(?:\s*jawaban)?|jawaban|ans(?:wer)?)\s*[\:\=]\s*([a-dA-D])/i);

      if (matchKunci) {
        kunci = normalizeKunci(matchKunci[1]);
        readingPertanyaan = false;
      } else if (matchA) {
        opsi_a = matchA[1].trim();
        readingPertanyaan = false;
      } else if (matchB) {
        opsi_b = matchB[1].trim();
        readingPertanyaan = false;
      } else if (matchC) {
        opsi_c = matchC[1].trim();
        readingPertanyaan = false;
      } else if (matchD) {
        opsi_d = matchD[1].trim();
        readingPertanyaan = false;
      } else if (readingPertanyaan) {
        // Hilangkan nomor di awal pertanyaan pertama
        const cleanLine = pertanyaan ? line : line.replace(/^(\d+[\.\)]|soal\s*\d+[\.\:\-]?|no[\.\s]*\d+[\.\:\-]?)\s*/i, '');
        pertanyaan = (pertanyaan ? pertanyaan + ' ' : '') + cleanLine;
      }
    });

    if (pertanyaan.trim()) {
      parsedQuestions.push({
        id: idx + 1,
        pertanyaan: pertanyaan.trim(),
        opsi_a: opsi_a.trim() || 'Pilihan A',
        opsi_b: opsi_b.trim() || 'Pilihan B',
        opsi_c: opsi_c.trim() || 'Pilihan C',
        opsi_d: opsi_d.trim() || 'Pilihan D',
        kunci: kunci || 'a'
      });
    }
  });

  return parsedQuestions;
}

/**
 * Parser file Word (.docx) langsung di browser via JSZip
 */
export async function parseDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('Berkas Word tidak valid atau tidak memiliki file word/document.xml.');
  }

  const xmlText = await documentXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  // Ambil teks dari setiap paragraf <w:p>
  const paragraphs = xmlDoc.getElementsByTagName('w:p');
  const lines = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const textNodes = paragraphs[i].getElementsByTagName('w:t');
    let pText = '';
    for (let j = 0; j < textNodes.length; j++) {
      pText += textNodes[j].textContent || '';
    }
    if (pText.trim()) {
      lines.push(pText.trim());
    }
  }

  return parseTextToSoalPG(lines.join('\n'));
}

/**
 * Parser file Excel (.xlsx / .xls) via ExcelJS
 */
export async function parseExcelFile(file) {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Lembar kerja Excel kosong.');
  }

  // Cari mapping kolom dari baris 1
  let colMap = {
    no: -1,
    pertanyaan: -1,
    opsi_a: -1,
    opsi_b: -1,
    opsi_c: -1,
    opsi_d: -1,
    kunci: -1
  };

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.value || '').trim().toLowerCase();
    if (text === 'no' || text === 'nomor') colMap.no = colNumber;
    else if (text.includes('soal') || text.includes('pertanyaan') || text.includes('question')) colMap.pertanyaan = colNumber;
    else if (text.includes('pilihan a') || text.includes('opsi a') || text === 'a' || text === 'opsi_a') colMap.opsi_a = colNumber;
    else if (text.includes('pilihan b') || text.includes('opsi b') || text === 'b' || text === 'opsi_b') colMap.opsi_b = colNumber;
    else if (text.includes('pilihan c') || text.includes('opsi c') || text === 'c' || text === 'opsi_c') colMap.opsi_c = colNumber;
    else if (text.includes('pilihan d') || text.includes('opsi d') || text === 'd' || text === 'opsi_d') colMap.opsi_d = colNumber;
    else if (text.includes('kunci') || text.includes('jawaban') || text.includes('key')) colMap.kunci = colNumber;
  });

  // Fallback jika header tidak terdeteksi rapi (asumsikan urutan standar: No, Soal, A, B, C, D, Kunci)
  if (colMap.pertanyaan === -1) {
    colMap = { no: 1, pertanyaan: 2, opsi_a: 3, opsi_b: 4, opsi_c: 5, opsi_d: 6, kunci: 7 };
  }

  const results = [];
  let indexCounter = 1;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Lewati header

    const cellVal = (idx) => {
      if (idx <= 0) return '';
      const c = row.getCell(idx);
      if (!c) return '';
      // Support jika c.value adalah object format ExcelJS (misal richText atau formula)
      if (typeof c.value === 'object' && c.value !== null) {
        if (c.value.richText) {
          return c.value.richText.map((rt) => rt.text).join('').trim();
        }
        if (c.value.result !== undefined) {
          return String(c.value.result).trim();
        }
      }
      return String(c.value || '').trim();
    };

    const pertanyaan = cellVal(colMap.pertanyaan);
    if (!pertanyaan) return;

    const opsi_a = cellVal(colMap.opsi_a);
    const opsi_b = cellVal(colMap.opsi_b);
    const opsi_c = cellVal(colMap.opsi_c);
    const opsi_d = cellVal(colMap.opsi_d);
    const kunci = normalizeKunci(cellVal(colMap.kunci));

    results.push({
      id: indexCounter++,
      pertanyaan,
      opsi_a: opsi_a || 'Pilihan A',
      opsi_b: opsi_b || 'Pilihan B',
      opsi_c: opsi_c || 'Pilihan C',
      opsi_d: opsi_d || 'Pilihan D',
      kunci: kunci || 'a'
    });
  });

  return results;
}

/**
 * Parser file CSV (.csv) via FileReader
 */
export async function parseCsvFile(file) {
  const text = await file.text();
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  // Parse header
  const separator = rows[0].includes(';') ? ';' : ',';
  const headers = rows[0].split(separator).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  let colMap = {
    no: headers.findIndex((h) => h === 'no' || h === 'nomor'),
    pertanyaan: headers.findIndex((h) => h.includes('soal') || h.includes('pertanyaan')),
    opsi_a: headers.findIndex((h) => h.includes('a') || h.includes('opsi a')),
    opsi_b: headers.findIndex((h) => h.includes('b') || h.includes('opsi b')),
    opsi_c: headers.findIndex((h) => h.includes('c') || h.includes('opsi c')),
    opsi_d: headers.findIndex((h) => h.includes('d') || h.includes('opsi d')),
    kunci: headers.findIndex((h) => h.includes('kunci') || h.includes('jawaban'))
  };

  if (colMap.pertanyaan === -1) {
    colMap = { no: 0, pertanyaan: 1, opsi_a: 2, opsi_b: 3, opsi_c: 4, opsi_d: 5, kunci: 6 };
  }

  const results = [];
  let indexCounter = 1;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(separator).map((c) => c.replace(/^["']|["']$/g, '').trim());
    const pertanyaan = cols[colMap.pertanyaan] || '';
    if (!pertanyaan) continue;

    results.push({
      id: indexCounter++,
      pertanyaan,
      opsi_a: cols[colMap.opsi_a] || 'Pilihan A',
      opsi_b: cols[colMap.opsi_b] || 'Pilihan B',
      opsi_c: cols[colMap.opsi_c] || 'Pilihan C',
      opsi_d: cols[colMap.opsi_d] || 'Pilihan D',
      kunci: normalizeKunci(cols[colMap.kunci])
    });
  }

  return results;
}

/**
 * Universal file importer untuk soal PG
 */
export async function importSoalPGFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    return await parseExcelFile(file);
  } else if (ext === 'docx') {
    return await parseDocxFile(file);
  } else if (ext === 'csv') {
    return await parseCsvFile(file);
  } else if (ext === 'txt') {
    const text = await file.text();
    return parseTextToSoalPG(text);
  } else {
    throw new Error('Format file tidak didukung. Harap unggah file .xlsx, .docx, .csv, atau .txt.');
  }
}
