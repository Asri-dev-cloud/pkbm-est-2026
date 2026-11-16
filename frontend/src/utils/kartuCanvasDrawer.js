// ============================================================
// frontend/src/utils/kartuCanvasDrawer.js
// Render Kartu Pelajar Digital ke HTML5 Canvas Beresolusi Tinggi (300 DPI)
// Menghasilkan Gambar PNG HD & Dokumen PDF yang 100% Persis dengan Desain Layar
// ============================================================

import { getKartuVerificationUrl } from './qrCode.jsx';

// Dimensi standar CR-80 pada 300 DPI
const CARD_WIDTH = 1012;
const CARD_HEIGHT = 638;
const BORDER_RADIUS = 36;

const formatTanggalIndo = (tgl) => {
  if (!tgl) return '—';
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

const labelJenjang = {
  paket_a: 'Paket A (Setara SD)',
  paket_b: 'Paket B (Setara SMP)',
  paket_c: 'Paket C (Setara SMA)',
};

const badgeJenjangText = {
  paket_a: 'PAKET A',
  paket_b: 'PAKET B',
  paket_c: 'PAKET C',
};

// Helper: Menggambar rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper: Memuat gambar asinkron
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── QR Code Matrix Minimalist untuk Canvas ──
const QRMode = { MODE_8BIT_BYTE: 4 };
const QRErrorCorrectLevel = { L: 1 };

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

function getRSBlocks(typeNumber) {
  const row = (typeNumber - 1) * 2;
  const entry = RS_TABLE[row] || [1, 100, 80];
  const list = [];
  for (let i = 0; i < entry[0]; i++) list.push({ totalCount: entry[1], dataCount: entry[2] });
  return list;
}

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}
QRBitBuffer.prototype = {
  put: function (num, length) {
    for (let i = 0; i < length; i++) {
      const bit = ((num >>> (length - i - 1)) & 1) === 1;
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
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
  let typeNumber = 2;
  for (let t = 2; t <= 8; t++) {
    const blocks = getRSBlocks(t);
    let totalData = 0;
    blocks.forEach((b) => { totalData += b.dataCount; });
    if (data.getLength() + 4 <= totalData) {
      typeNumber = t;
      break;
    }
  }

  const moduleCount = typeNumber * 4 + 17;
  const modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

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

  for (let r = 8; r < moduleCount - 8; r++) {
    if (modules[r][6] === null) modules[r][6] = (r % 2 === 0);
  }
  for (let c = 8; c < moduleCount - 8; c++) {
    if (modules[6][c] === null) modules[6][c] = (c % 2 === 0);
  }
  modules[4 * typeNumber + 9][8] = true;

  const buffer = new QRBitBuffer();
  buffer.put(QRMode.MODE_8BIT_BYTE, 4);
  buffer.put(data.getLength(), 8);
  data.write(buffer);

  const rsBlocks = getRSBlocks(typeNumber);
  let totalDataCount = 0;
  rsBlocks.forEach((b) => { totalDataCount += b.dataCount; });

  while (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (buffer.length < totalDataCount * 8) {
    buffer.put(0xec, 8);
    if (buffer.length < totalDataCount * 8) buffer.put(0x11, 8);
  }

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
  let maxDc = Math.max(...dcData.map((d) => d.length));
  let maxEc = Math.max(...ecData.map((e) => e.length));

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

// Menggambar QR Code pada canvas
function drawQrCodeOnCanvas(ctx, text, x, y, size) {
  try {
    const { matrix, count } = createQRCodeMatrix(text);
    const modSize = size / count;

    // Background putih QR
    drawRoundedRect(ctx, x - 6, y - 6, size + 12, size + 12, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Gambar modul hitam
    ctx.fillStyle = '#0A1128';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(x + c * modSize, y + r * modSize, modSize + 0.3, modSize + 0.3);
        }
      }
    }
  } catch (err) {
    console.error('Error drawing QR on canvas:', err);
  }
}

// ── Menggambar Sisi Depan Kartu (Canvas 300 DPI) ──
export async function drawCardFront(ctx, siswa, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 1. Clip sudut melengkung kartu (CR-80)
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  ctx.clip();

  // 2. Background Gradient Midnight Navy Mewah
  const bgGrad = ctx.createRadialGradient(
    CARD_WIDTH * 0.9, CARD_HEIGHT * 0.1, 50,
    CARD_WIDTH * 0.5, CARD_HEIGHT * 0.5, CARD_WIDTH * 0.8
  );
  bgGrad.addColorStop(0, '#1e3a8a');
  bgGrad.addColorStop(0.6, '#0d1b33');
  bgGrad.addColorStop(1, '#070e1c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Aksen Ambient Glow Emas di pojok kanan atas
  const glowGrad = ctx.createRadialGradient(CARD_WIDTH, 0, 10, CARD_WIDTH, 0, 400);
  glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 3. Kop Lembaga
  const logo = await loadImage('/images/logo new.png');
  const logoSize = 72;
  const kopY = 32;

  // Badge lingkaran logo
  ctx.beginPath();
  ctx.arc(36 + logoSize / 2, kopY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  if (logo) {
    ctx.drawImage(logo, 40, kopY + 4, logoSize - 8, logoSize - 8);
  } else {
    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BM', 36 + logoSize / 2, kopY + logoSize / 2 + 8);
  }

  // Teks Kop
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KEMENTERIAN PENDIDIKAN & KEBUDAYAAN', 124, kopY + 18);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PKBM BINA MANDIRI', 124, kopY + 46);

  ctx.fillStyle = '#FCD34D';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NPSN: P9962854 • TERAKREDITASI RESMI', 124, kopY + 68);

  // Badge Jenjang Kanan
  const jenjangBadge = badgeJenjangText[siswa.jenjang] || 'WARGA BELAJAR';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  const badgeWidth = ctx.measureText(jenjangBadge).width + 28;
  const badgeX = CARD_WIDTH - badgeWidth - 36;
  drawRoundedRect(ctx, badgeX, kopY + 18, badgeWidth, 34, 10);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'center';
  ctx.fillText(jenjangBadge, badgeX + badgeWidth / 2, kopY + 41);

  // Garis Emas Pembatas Kop
  const goldLineY = kopY + 86;
  const lineGrad = ctx.createLinearGradient(36, goldLineY, CARD_WIDTH - 36, goldLineY);
  lineGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
  lineGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
  lineGrad.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, goldLineY);
  ctx.lineTo(CARD_WIDTH - 36, goldLineY);
  ctx.stroke();

  // 4. Foto Portrait Siswa (Kiri)
  const photoX = 36;
  const photoY = goldLineY + 24;
  const photoW = 180;
  const photoH = 240;
  const photoRadius = 20;

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
  ctx.clip();

  const fotoSrc = siswa.foto_profil || siswa.pas_foto;
  const photoImg = fotoSrc ? await loadImage(fotoSrc) : null;

  if (photoImg) {
    ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
  } else {
    const photoGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    photoGrad.addColorStop(0, '#1E40AF');
    photoGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = photoGrad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 80px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((siswa.nama_lengkap || 'W').charAt(0).toUpperCase(), photoX + photoW / 2, photoY + photoH / 2 + 28);
  }
  ctx.restore();

  // Border Foto
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 5. Data Siswa Typographic (Kanan)
  const dataX = photoX + photoW + 36;
  let textCursorY = photoY + 34;

  // Nama Siswa
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
  const rawNama = (siswa.nama_lengkap || 'WARGA BELAJAR').toUpperCase();
  const namaDisplay = rawNama.length > 22 ? rawNama.substring(0, 20) + '...' : rawNama;
  ctx.fillText(namaDisplay, dataX, textCursorY);

  // NIS Subline
  textCursorY += 34;
  ctx.fillStyle = '#FCD34D';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NIS:', dataX, textCursorY);

  const displayNis = (siswa.nis || '').replace('PKBM-2025-', 'PKBM-2026-') || 'DALAM PENETAPAN';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 20px monospace';
  ctx.fillText(displayNis, dataX + 46, textCursorY);

  // Rincian Data Key-Value Bersih (NIK Penuh Tanpa Sensor)
  const metaItems = [
    ['NIK', siswa.nik || '—'],
    ['TTL', `${siswa.tempat_lahir || 'Sumedang'}, ${formatTanggalIndo(siswa.tanggal_lahir)}`],
    ['Program', labelJenjang[siswa.jenjang] || siswa.jenjang || 'Paket C'],
    ['Rombel', siswa.nama_rombel || 'Dalam Penetapan'],
  ];

  metaItems.forEach(([label, value]) => {
    textCursorY += 32;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, dataX, textCursorY);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`:  ${value}`, dataX + 90, textCursorY);
  });

  // 6. Footer Kartu Depan (Tanpa QR Code)
  const footerY = CARD_HEIGHT - 90;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, footerY);
  ctx.lineTo(CARD_WIDTH - 36, footerY);
  ctx.stroke();

  // Teks Otentikasi & Barcode
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AUTHENTIC STUDENT IDENTIFICATION • SISTEM INFORMASI AKADEMIK', 36, footerY + 34);

  ctx.restore();
}

// ── Menggambar Sisi Belakang Kartu (Canvas 300 DPI - Tanpa QR Code) ──
export async function drawCardBack(ctx, siswa, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 1. Clip sudut melengkung kartu (CR-80)
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  ctx.clip();

  // 2. Background Gradient Midnight Navy Mewah
  const bgGrad = ctx.createRadialGradient(
    CARD_WIDTH * 0.1, CARD_HEIGHT * 0.9, 50,
    CARD_WIDTH * 0.5, CARD_HEIGHT * 0.5, CARD_WIDTH * 0.8
  );
  bgGrad.addColorStop(0, '#1e3a8a');
  bgGrad.addColorStop(0.6, '#0d1b33');
  bgGrad.addColorStop(1, '#070e1c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 3. Header Ketentuan
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FCD34D';
  ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KETENTUAN PENGGUNAAN KARTU PELAJAR', CARD_WIDTH / 2, 54);

  // Garis Emas
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 74);
  ctx.lineTo(CARD_WIDTH - 40, 74);
  ctx.stroke();

  // 4. 4 Butir Ketentuan
  const clauses = [
    '1. Kartu ini adalah identitas resmi Warga Belajar PKBM Bina Mandiri.',
    '2. Wajib dibawa saat tutorial tatap muka, asesmen, dan ujian evaluasi pembelajaran.',
    '3. Kartu ini tidak dapat dipinjamkan atau dipindahtangankan kepada orang lain.',
    '4. Bila kartu ini hilang, harap segera melapor ke Sekretariat TU PKBM Bina Mandiri.'
  ];

  ctx.textAlign = 'left';
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  let clauseY = 114;
  clauses.forEach((text) => {
    ctx.fillText(text, 50, clauseY);
    clauseY += 34;
  });

  // Garis Pembatas Cluster
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, clauseY + 12);
  ctx.lineTo(CARD_WIDTH - 40, clauseY + 12);
  ctx.stroke();

  // 5. Identitas Lembaga (Kiri Bawah - Menggantikan QR)
  const qrY = clauseY + 40;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LEMBAGA PENDIDIKAN KESETARAAN', 50, qrY + 20);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PKBM BINA MANDIRI', 50, qrY + 50);

  ctx.fillStyle = '#FCD34D';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NPSN: P9962854 • SUMEDANG', 50, qrY + 76);

  // 6. Blok Pengesahan Kepala PKBM (Kanan Bawah)
  const endorseX = CARD_WIDTH - 240;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Sumedang, ${new Date().getFullYear()}`, endorseX, qrY + 10);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Kepala PKBM Bina Mandiri', endorseX, qrY + 36);

  // Gambar Tanda Tangan Resmi (ttd.png)
  const ttdImg = (await loadImage('/images/ttd.png')) || (await loadImage('/ttd.png'));
  if (ttdImg) {
    const ttdW = 140;
    const ttdH = 68;
    ctx.drawImage(ttdImg, endorseX - ttdW / 2, qrY + 41, ttdW, ttdH);
  }

  // Nama Pimpinan Resmi: Indrayani, S.S.,M.Pd.
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Indrayani, S.S.,M.Pd.', endorseX, qrY + 114);

  // Garis bawah nama
  const nameWidth = ctx.measureText('Indrayani, S.S.,M.Pd.').width;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(endorseX - nameWidth / 2, qrY + 119);
  ctx.lineTo(endorseX + nameWidth / 2, qrY + 119);
  ctx.stroke();

  // 7. Footer Alamat
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Sekretariat: PKBM Bina Mandiri, Sumedang • Laman Resmi: pkbmbinamandiri.sch.id', CARD_WIDTH / 2, CARD_HEIGHT - 22);

  ctx.restore();
}

// ── Fungsi Download Kartu Langsung sebagai Gambar PNG HD ──
export async function downloadCardImage(siswa, side = 'both') {
  const safeNis = (siswa?.nis || `siswa-${siswa?.id || 'doc'}`).replace(/[^a-zA-Z0-9_-]/g, '_');

  if (side === 'front') {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    await drawCardFront(ctx, siswa);

    const link = document.createElement('a');
    link.download = `Kartu_Pelajar_${safeNis}_Depan.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    return;
  }

  if (side === 'back') {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    await drawCardBack(ctx, siswa);

    const link = document.createElement('a');
    link.download = `Kartu_Pelajar_${safeNis}_Belakang.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    return;
  }

  // Sisi Depan & Belakang Bersama dalam 1 File HD (Berdampingan Siap Cetak/Simpan)
  const gap = 60;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH * 2 + gap + 80;
  canvas.height = CARD_HEIGHT + 80;
  const ctx = canvas.getContext('2d');

  // Latar belakang putih bersih
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await drawCardFront(ctx, siswa, 40, 40);
  await drawCardBack(ctx, siswa, 40 + CARD_WIDTH + gap, 40);

  const link = document.createElement('a');
  link.download = `Kartu_Pelajar_${safeNis}_Lengkap.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

export default {
  drawCardFront,
  drawCardBack,
  downloadCardImage,
};

