// ============================================================
// backend/utils/kartuPelajarPdf.js
// Generator Dokumen PDF Resmi Kartu Pelajar Digital PKBM Bina Mandiri
// Output: Standar PDF-1.4 murni (0 dependency) siap cetak A4 & potong CR-80
// ============================================================

import fs from 'fs/promises';
import path from 'path';

const PAGE_WIDTH = 595;   // A4 Width in pt
const PAGE_HEIGHT = 842;  // A4 Height in pt

// Dimensi standar CR-80 (85.60 mm x 53.98 mm -> ~243 pt x 153 pt)
const CARD_W = 243;
const CARD_H = 153;

const sanitizeText = (value) => {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ')
    .trim();
};

const textLine = (font, size, x, y, text, r = 0, g = 0, b = 0) =>
  `${r} ${g} ${b} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${sanitizeText(text)}) Tj ET`;

const rectFill = (x, y, width, height, r, g, b) =>
  `${r} ${g} ${b} rg ${x} ${y} ${width} ${height} re f`;

const rectStroke = (x, y, width, height, r, g, b, lineWidth = 1) =>
  `${lineWidth} w [] 0 d ${r} ${g} ${b} RG ${x} ${y} ${width} ${height} re S`;

const rectDashedStroke = (x, y, width, height, r, g, b, lineWidth = 1, dash = '[3 3] 0 d') =>
  `${lineWidth} w ${dash} ${r} ${g} ${b} RG ${x} ${y} ${width} ${height} re S [] 0 d`;

const lineStroke = (x1, y1, x2, y2, r, g, b, lineWidth = 1) =>
  `${lineWidth} w [] 0 d ${r} ${g} ${b} RG ${x1} ${y1} m ${x2} ${y2} l S`;

// ── QR Code Generator Murni (Minimalist Model 2 Byte Mode) ──
const QRMode = { MODE_8BIT_BYTE: 4 };
const QRErrorCorrectLevel = { L: 1, M: 0 };

function QR8BitByte(data) {
  this.mode = QRMode.MODE_8BIT_BYTE;
  this.data = data;
}
QR8BitByte.prototype = {
  getLength: function () { return this.data.length; },
  write: function (buffer) {
    for (let i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }
  }
};

const QRMath = {
  glog: (n) => {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRMath.LOG_TABLE[n];
  },
  gexp: (n) => {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};
for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

function QRPolynomial(num, shift) {
  let offset = 0;
  while (offset < num.length && num[offset] === 0) offset++;
  this.num = new Array(num.length - offset + shift);
  for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
}
QRPolynomial.prototype = {
  get: function (i) { return this.num[i]; },
  getLength: function () { return this.num.length; },
  multiply: function (e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  },
  mod: function (e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
};

const RS_TABLE = [
  [1, 26, 19], [1, 26, 16],
  [1, 44, 34], [1, 44, 28],
  [1, 70, 55], [1, 70, 44],
  [1, 100, 80], [2, 50, 32],
  [1, 134, 108], [2, 67, 43],
  [2, 86, 68], [4, 43, 27],
  [2, 98, 78], [4, 49, 31],
  [2, 121, 97], [2, 60, 38],
  [2, 146, 116], [3, 58, 36],
  [2, 86, 68], [4, 69, 43]
];

function getRSBlocks(typeNumber, errorLevel) {
  const row = (typeNumber - 1) * 2 + (errorLevel === QRErrorCorrectLevel.L ? 0 : 1);
  const entry = RS_TABLE[row] || [1, 100, 80];
  const count = entry[0];
  const totalCount = entry[1];
  const dataCount = entry[2];
  const list = [];
  for (let i = 0; i < count; i++) list.push({ totalCount, dataCount });
  return list;
}

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}
QRBitBuffer.prototype = {
  get: function (index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  },
  put: function (num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  },
  putBit: function (bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
};

function createQRCodeMatrix(text) {
  const data = new QR8BitByte(text);
  // Coba type 2 s/d 6
  let typeNumber = 2;
  for (let t = 2; t <= 8; t++) {
    const blocks = getRSBlocks(t, QRErrorCorrectLevel.L);
    let totalData = 0;
    blocks.forEach((b) => { totalData += b.dataCount; });
    if (data.getLength() + 4 <= totalData) {
      typeNumber = t;
      break;
    }
  }

  const moduleCount = typeNumber * 4 + 17;
  const modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

  // Position detection pattern
  const setupPosPattern = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  };

  setupPosPattern(0, 0);
  setupPosPattern(0, moduleCount - 7);
  setupPosPattern(moduleCount - 7, 0);

  // Timing pattern
  for (let r = 8; r < moduleCount - 8; r++) {
    if (modules[r][6] === null) modules[r][6] = (r % 2 === 0);
  }
  for (let c = 8; c < moduleCount - 8; c++) {
    if (modules[6][c] === null) modules[6][c] = (c % 2 === 0);
  }

  // Dark module
  modules[4 * typeNumber + 9][8] = true;

  // Buffer data
  const buffer = new QRBitBuffer();
  buffer.put(QRMode.MODE_8BIT_BYTE, 4);
  buffer.put(data.getLength(), 8);
  data.write(buffer);

  const rsBlocks = getRSBlocks(typeNumber, QRErrorCorrectLevel.L);
  let totalDataCount = 0;
  rsBlocks.forEach((b) => { totalDataCount += b.dataCount; });

  while (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (buffer.length < totalDataCount * 8) {
    buffer.put(0xec, 8);
    if (buffer.length < totalDataCount * 8) buffer.put(0x11, 8);
  }

  // Reed solomon
  const rawData = buffer.buffer;
  let offset = 0;
  const dcData = [];
  const ecData = [];

  for (let r = 0; r < rsBlocks.length; r++) {
    const dcCount = rsBlocks[r].dataCount;
    const ecCount = rsBlocks[r].totalCount - dcCount;
    const item = rawData.slice(offset, offset + dcCount);
    offset += dcCount;
    dcData.push(item);

    let rsPoly = new QRPolynomial([1], 0);
    for (let i = 0; i < ecCount; i++) {
      rsPoly = rsPoly.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    const rawPoly = new QRPolynomial(item, rsPoly.getLength() - 1);
    const modPoly = rawPoly.mod(rsPoly);
    const ec = new Array(rsPoly.getLength() - 1).fill(0);
    for (let i = 0; i < ec.length; i++) {
      const modIndex = i + modPoly.getLength() - ec.length;
      ec[i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
    }
    ecData.push(ec);
  }

  const finalData = [];
  let maxDc = 0;
  let maxEc = 0;
  dcData.forEach((d) => { if (d.length > maxDc) maxDc = d.length; });
  ecData.forEach((e) => { if (e.length > maxEc) maxEc = e.length; });

  for (let i = 0; i < maxDc; i++) {
    for (let r = 0; r < dcData.length; r++) {
      if (i < dcData[r].length) finalData.push(dcData[r][i]);
    }
  }
  for (let i = 0; i < maxEc; i++) {
    for (let r = 0; r < ecData.length; r++) {
      if (i < ecData[r].length) finalData.push(ecData[r][i]);
    }
  }

  // Interleave to modules
  let bitIndex = 7;
  let byteIndex = 0;
  let inc = -1;
  let row = moduleCount - 1;

  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          let dark = false;
          if (byteIndex < finalData.length) {
            dark = (((finalData[byteIndex] >>> bitIndex) & 1) === 1);
          }
          // Mask pattern 0: (row + col) % 2 === 0
          if ((row + (col - c)) % 2 === 0) dark = !dark;
          modules[row][col - c] = dark;
          bitIndex--;
          if (bitIndex === -1) {
            byteIndex++;
            bitIndex = 7;
          }
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  return { matrix: modules, count: moduleCount };
}

// Render QR Matrix ke instruksi PDF
const renderQrCodeToPdf = (text, startX, startY, size) => {
  try {
    const { matrix, count } = createQRCodeMatrix(text);
    const modSize = size / count;
    const lines = [];

    // Latar belakang putih QR Code
    lines.push(rectFill(startX - 2, startY - 2, size + 4, size + 4, 1, 1, 1));

    // Gambar modul hitam (gabungkan baris kontinu agar stream efisien)
    for (let r = 0; r < count; r++) {
      const y = startY + (count - 1 - r) * modSize;
      let c = 0;
      while (c < count) {
        if (matrix[r][c]) {
          let span = 1;
          while (c + span < count && matrix[r][c + span]) {
            span++;
          }
          const x = startX + c * modSize;
          lines.push(rectFill(x, y, modSize * span, modSize, 0.06, 0.09, 0.16));
          c += span;
        } else {
          c++;
        }
      }
    }
    return lines.join('\n');
  } catch (err) {
    // Fallback jika terjadi error pada string
    return rectFill(startX, startY, size, size, 0.9, 0.9, 0.9);
  }
};

const buildPdfBuffer = (commands) => {
  const content = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

const formatTanggalIndo = (tgl) => {
  if (!tgl) return '-';
  try {
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(tgl);
  }
};

// ============================================================
// Main Builder: buildKartuPelajarPdf
// ============================================================
export const buildKartuPelajarPdf = async ({ siswa, outputPath = null }) => {
  const lines = [];

  const namaLengkap = (siswa.nama_lengkap || 'WARGA BELAJAR').toUpperCase();
  const rawNis = siswa.nis || 'DALAM PENETAPAN';
  const nis = rawNis.replace('PKBM-2025-', 'PKBM-2026-');
  const nik = siswa.nik || '-';
  const jenjangRaw = String(siswa.jenjang || 'paket_c').toLowerCase();
  const jenjangLabel = jenjangRaw === 'paket_a' ? 'Paket A (Setara SD)' :
                       jenjangRaw === 'paket_b' ? 'Paket B (Setara SMP)' :
                       'Paket C (Setara SMA)';
  const rombel = siswa.nama_rombel || 'Dalam Penetapan Rombel';
  const ttl = `${siswa.tempat_lahir || 'Sumedang'}, ${formatTanggalIndo(siswa.tanggal_lahir)}`;

  // URL verifikasi resmi
  const verifyUrl = `https://pkbmbinamandiri.sch.id/verifikasi-kartu?nis=${encodeURIComponent(nis)}`;

  // ── POSISI DUA SISI KARTU CR-80 (85.6mm x 53.98mm) ──
  const cardY = 600;
  const frontX = 42;
  const backX = frontX + CARD_W + 24;

  // Label Sisi Minimalis
  lines.push(textLine('F2', 8, frontX + 2, cardY + CARD_H + 8, 'SISI DEPAN (FRONT)', 0.35, 0.42, 0.52));
  lines.push(textLine('F2', 8, backX + 2, cardY + CARD_H + 8, 'SISI BELAKANG (BACK)', 0.35, 0.42, 0.52));

  // Garis putus-putus panduan potong presisi CR-80
  lines.push(rectDashedStroke(frontX, cardY, CARD_W, CARD_H, 0.7, 0.75, 0.82, 0.75));
  lines.push(rectDashedStroke(backX, cardY, CARD_W, CARD_H, 0.7, 0.75, 0.82, 0.75));

  // ── 1. SISI DEPAN (FRONT FACE) ──
  lines.push(rectFill(frontX, cardY, CARD_W, CARD_H, 0.06, 0.12, 0.25));
  lines.push(rectFill(frontX, cardY + CARD_H - 26, CARD_W, 26, 0.09, 0.18, 0.36));
  lines.push(rectFill(frontX, cardY + CARD_H - 28, CARD_W, 2, 0.96, 0.65, 0.12));

  lines.push(textLine('F2', 8, frontX + 12, cardY + CARD_H - 12, 'PKBM BINA MANDIRI', 1, 1, 1));
  lines.push(textLine('F1', 5.5, frontX + 12, cardY + CARD_H - 20, 'KARTU TANDA PELAJAR * NPSN P9962854', 0.9, 0.8, 0.4));
  lines.push(textLine('F2', 6.5, frontX + CARD_W - 54, cardY + CARD_H - 16, jenjangRaw.toUpperCase(), 0.98, 0.85, 0.35));

  const photoX = frontX + 12;
  const photoY = cardY + 28;
  const photoW = 48;
  const photoH = 74;

  lines.push(rectFill(photoX, photoY, photoW, photoH, 0.12, 0.22, 0.42));
  lines.push(rectStroke(photoX, photoY, photoW, photoH, 0.96, 0.65, 0.12, 1));
  lines.push(textLine('F2', 20, photoX + 16, photoY + 30, namaLengkap.charAt(0) || 'W', 1, 1, 1));

  const dataX = frontX + 68;
  let textY = cardY + CARD_H - 42;

  const displayName = namaLengkap.length > 22 ? namaLengkap.substring(0, 20) + '...' : namaLengkap;
  lines.push(textLine('F2', 9, dataX, textY, displayName, 1, 1, 1));

  textY -= 12;
  lines.push(textLine('F2', 7, dataX, textY, `NIS: ${nis}`, 0.98, 0.82, 0.35));

  textY -= 13;
  lines.push(textLine('F1', 6, dataX, textY, `NIK           : ${nik}`, 0.82, 0.88, 0.95));
  textY -= 10;
  lines.push(textLine('F1', 6, dataX, textY, `TTL           : ${ttl.length > 24 ? ttl.substring(0, 22) + '..' : ttl}`, 0.82, 0.88, 0.95));
  textY -= 10;
  lines.push(textLine('F1', 6, dataX, textY, `Jenjang    : ${jenjangLabel}`, 0.82, 0.88, 0.95));
  textY -= 10;
  lines.push(textLine('F1', 6, dataX, textY, `Rombel     : ${rombel}`, 0.82, 0.88, 0.95));
  textY -= 10;
  lines.push(textLine('F1', 6, dataX, textY, `Berlaku     : Selama Menjadi Warga Belajar`, 0.82, 0.88, 0.95));

  lines.push(lineStroke(frontX + 12, cardY + 16, frontX + CARD_W - 12, cardY + 16, 0.2, 0.3, 0.45, 0.5));
  lines.push(textLine('F1', 5, frontX + 12, cardY + 8, 'AUTHENTIC STUDENT IDENTIFICATION * PKBM BINA MANDIRI SUMEDANG', 0.65, 0.72, 0.82));

  // ── 2. SISI BELAKANG (BACK FACE) ──
  lines.push(rectFill(backX, cardY, CARD_W, CARD_H, 0.06, 0.12, 0.25));
  lines.push(rectFill(backX, cardY + CARD_H - 22, CARD_W, 22, 0.09, 0.18, 0.36));
  lines.push(rectFill(backX, cardY + CARD_H - 24, CARD_W, 2, 0.96, 0.65, 0.12));

  lines.push(textLine('F2', 7.5, backX + 38, cardY + CARD_H - 14, 'KETENTUAN PENGGUNAAN KARTU', 0.98, 0.85, 0.35));

  let ruleY = cardY + CARD_H - 36;
  const rules = [
    '1. Kartu ini adalah tanda pengenal sah Warga Belajar PKBM.',
    '2. Wajib dibawa saat pembelajaran tatap muka dan evaluasi / asesmen.',
    '3. Tidak dapat dipindahtangankan kepada orang lain.',
    '4. Bila kartu ini hilang, segera lapor ke Sekretariat TU PKBM Bina Mandiri.'
  ];
  rules.forEach((r) => {
    lines.push(textLine('F1', 5.5, backX + 10, ruleY, r, 0.9, 0.93, 0.98));
    ruleY -= 9;
  });

  lines.push(lineStroke(backX + 10, ruleY - 1, backX + CARD_W - 10, ruleY - 1, 0.2, 0.3, 0.45, 0.5));

  // Identitas Lembaga (Kiri Bawah)
  const instX = backX + 12;
  lines.push(textLine('F1', 4.5, instX, cardY + 44, 'LEMBAGA PENDIDIKAN KESETARAAN', 0.65, 0.72, 0.82));
  lines.push(textLine('F2', 7, instX, cardY + 34, 'PKBM BINA MANDIRI', 1, 1, 1));
  lines.push(textLine('F2', 5, instX, cardY + 25, 'NPSN: P9962854 * SUMEDANG', 0.98, 0.85, 0.35));
  lines.push(textLine('F1', 4.5, instX, cardY + 14, 'Sekretariat: Sumedang, Jawa Barat', 0.65, 0.72, 0.82));

  // Kepala Lembaga resmi: Indrayani, S.S.,M.Pd. (Kanan Bawah)
  const sigX = backX + 130;
  const currentYear = new Date().getFullYear();
  lines.push(textLine('F1', 5.5, sigX, cardY + 54, `Sumedang, ${currentYear}`, 0.85, 0.9, 0.95));
  lines.push(textLine('F2', 6, sigX - 5, cardY + 44, 'Kepala PKBM Bina Mandiri', 1, 1, 1));

  lines.push(rectStroke(sigX + 10, cardY + 22, 26, 18, 0.25, 0.55, 0.9, 0.8));
  lines.push(textLine('F2', 4.5, sigX + 12, cardY + 31, 'TERVERIFIKASI', 0.4, 0.7, 1));
  lines.push(textLine('F1', 4, sigX + 14, cardY + 25, 'DIGITAL SAH', 0.4, 0.7, 1));

  lines.push(textLine('F2', 6.5, sigX - 10, cardY + 12, 'Indrayani, S.S.,M.Pd.', 1, 1, 1));
  lines.push(lineStroke(sigX - 10, cardY + 10, sigX + 80, cardY + 10, 0.96, 0.65, 0.12, 0.8));

  // Panduan potong halus di bawah kartu
  lines.push(textLine('F1', 7, 130, cardY - 18, '- - - Gunting mengikuti garis putus-putus * Standar ID Card CR-80 (85.6 mm x 53.98 mm) - - -', 0.55, 0.6, 0.68));

  // Build Buffer
  const buffer = buildPdfBuffer(lines);

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, buffer);
  }

  return buffer;
};

export default {
  buildKartuPelajarPdf,
};
