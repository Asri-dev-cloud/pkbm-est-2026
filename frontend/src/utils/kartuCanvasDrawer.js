// ============================================================
// frontend/src/utils/kartuCanvasDrawer.js
// Render Kartu Pelajar Digital ke HTML5 Canvas Beresolusi Tinggi (300 DPI)
// Menghasilkan Gambar PNG HD & Dokumen PDF yang 100% Persis dengan Desain Layar
// ============================================================

import { getKartuVerificationUrl } from './qrCode.jsx';
import { toAssetUrl } from '../services/api.js';

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

// Motif Batik Ceplok Kasumedangan Geometris (Base64 SVG - Aman & Valid di Semua Mesin Canvas)
const BATIK_SVG_DATA_URI = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSdNIDE2IDAgTCAzMiAxNiBMIDE2IDMyIEwgMCAxNiBaJyBzdHJva2U9JyMwRjJCNjknIHN0cm9rZS13aWR0aD0nMS4yJyBzdHJva2Utb3BhY2l0eT0nMC40NScnIGZpbGw9J25vbmUnLz48cGF0aCBkPSdNIDE2IDQgTCAyOCAxNiBMIDE2IDI4IEwgNCAxNiBaJyBzdHJva2U9JyNENTlFMEInIHN0cm9rZS13aWR0aD0nMS4xJyBzdHJva2Utb3BhY2l0eT0nMC41NScnIGZpbGw9J25vbmUnLz48cGF0aCBkPSdNIDE2IDggTCAyNCAxNiBMIDE2IDI0IEwgOCAxNiBaJyBzdHJva2U9JyMxRDRFRDgnIHN0cm9rZS13aWR0aD0nMC45JyBzdHJva2Utb3BhY2l0eT0nMC40MCcgZmlsbD0nbm9uZScvPjxwYXRoIGQ9J00gMjEuMCAxNi4wIEwgMTcuOCAxNy44IEwgMTYuMCAyMS4wIEwgMTQuMiAxNy44IEwgMTEuMCAxNi4wIEwgMTQuMiAxNC4yIEwgMTYuMCAxMS4wIEwgMTcuOCAxNC4yIFonIHN0cm9rZT0nI0Q5NzcwNicgc3Ryb2tlLXdpZHRoPScxLjAnIHN0cm9rZS1vcGFjaXR5PScwLjY1JyBmaWxsPSdub25lJy8+PGNpcmNsZSBjeD0nMTYnIGN5PScxNicgcj0nMS4zJyBmaWxsPScjRjU5RTBCJyBmaWxsLW9wYWNpdHk9JzAuNzUnLz48Y2lyY2xlIGN4PScwJyBjeT0nMCcgcj0nMycgc3Ryb2tlPScjMEYyQjY5JyBzdHJva2Utd2lkdGg9JzAuOScgc3Ryb2tlLW9wYWNpdHk9JzAuNDAnIGZpbGw9J25vbmUnLz48Y2lyY2xlIGN4PScwJyBjeT0nMCcgcj0nMS4yJyBmaWxsPScjMUQ0RUQ4JyBmaWxsLW9wYWNpdHk9JzAuNTAnLz48Y2lyY2xlIGN4PSczMicgY3k9JzAnIHI9JzMnIHN0cm9rZT0nIzBGMkI2OScgc3Ryb2tlLXdpZHRoPScwLjknIHN0cm9rZS1vcGFjaXR5PScwLjQwJyBmaWxsPSdub25lJy8+PGNpcmNsZSBjeD0nMzInIGN5PScwJyByPScxLjInIGZpbGw9JyMxRDRFRDgnIGZpbGwtb3BhY2l0eT0nMC41MCcvPjxjaXJjbGUgY3g9JzAnIGN5PSczMicgcj0nMycgc3Ryb2tlPScjMEYyQjY5JyBzdHJva2Utd2lkdGg9JzAuOScgc3Ryb2tlLW9wYWNpdHk9JzAuNDAnIGZpbGw9J25vbmUnLz48Y2lyY2xlIGN4PScwJyBjeT0nMzInIHI9JzEuMicgZmlsbD0nIzFENEVEOCcgZmlsbC1vcGFjaXR5PScwLjUwJy8+PGNpcmNsZSBjeD0nMzInIGN5PSczMicgcj0nMycgc3Ryb2tlPScjMEYyQjY5JyBzdHJva2Utd2lkdGg9JzAuOScgc3Ryb2tlLW9wYWNpdHk9JzAuNDAnIGZpbGw9J25vbmUnLz48Y2lyY2xlIGN4PSczMicgY3k9JzMyJyByPScxLjInIGZpbGw9JyMxRDRFRDgnIGZpbGwtb3BhY2l0eT0nMC41MCcvPjwvc3ZnPg==";

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

// Helper: Membuat tile pattern Batik Ceplok Kasumedangan langsung di Canvas (100% Bebas Bug SVG Browser)
function createBatikTileCanvas() {
  const S = 64;
  const half = 32;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Outer Diamond in Navy
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(S, half);
  ctx.lineTo(half, S);
  ctx.lineTo(0, half);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(15, 43, 105, 0.45)';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Middle Diamond in Amber Gold
  ctx.beginPath();
  ctx.moveTo(half, 8);
  ctx.lineTo(S - 8, half);
  ctx.lineTo(half, S - 8);
  ctx.lineTo(8, half);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Innermost Diamond in Royal Blue
  ctx.beginPath();
  ctx.moveTo(half, 16);
  ctx.lineTo(S - 16, half);
  ctx.lineTo(half, S - 16);
  ctx.lineTo(16, half);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(29, 78, 216, 0.40)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Center 8-pointed star in Gold
  const rL = 10, rS = 5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = (i % 2 === 0) ? rL : rS;
    const x = half + Math.cos(a) * r;
    const y = half + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(half, half, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
  ctx.fill();

  // Corner Florets
  const corners = [[0, 0], [S, 0], [0, S], [S, S]];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(15, 43, 105, 0.40)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(29, 78, 216, 0.50)';
    ctx.fill();
  }

  return canvas;
}

// Helper: Memuat gambar asinkron dengan penanganan CORS & data URI yang aman
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback tanpa crossOrigin jika browser memblokir CORS
      if (img.crossOrigin) {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = src;
      } else {
        resolve(null);
      }
    };
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

// ── Menggambar Sisi Depan Kartu (Canvas 300 DPI - Standar Resmi PVC) ──
export async function drawCardFront(ctx, siswa, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 1. Clip sudut melengkung kartu (CR-80)
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  ctx.clip();

  // 2. Background Bawah: Gradient Biru Royal ke Midnight Blue yang Elegan
  const kopH = 136;
  const titleBarH = 28;
  const bodyGrad = ctx.createLinearGradient(0, kopH + titleBarH, CARD_WIDTH, CARD_HEIGHT);
  bodyGrad.addColorStop(0, '#1D4ED8');
  bodyGrad.addColorStop(0.35, '#1E3A8A');
  bodyGrad.addColorStop(0.70, '#172554');
  bodyGrad.addColorStop(1, '#0B1120');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 3. Kop Lembaga: Header PUTIH Bersih + Motif Batik Ceplok Kasumedangan Geometris
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CARD_WIDTH, kopH);

  // Terapkan Motif Batik Kasumedangan Langsung via Canvas Pattern Tile (Instan & 100% Reliable)
  try {
    const tileCanvas = createBatikTileCanvas();
    const pattern = ctx.createPattern(tileCanvas, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, CARD_WIDTH, kopH);
      ctx.restore();
    }
  } catch (err) {
    console.warn('[KartuPelajar] Gagal membuat pattern tile kop depan:', err);
  }

  // Garis Emas Pembatas Kop
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, kopH - 3.5, CARD_WIDTH, 3.5);

  // Logo PKBM dalam Lingkaran Halus di Kop Putih
  const logo = await loadImage('/images/logo new.png');
  const logoSize = 76;
  const logoX = 36;
  const logoY = 28;

  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (logo) {
    ctx.drawImage(logo, logoX + 4, logoY + 4, logoSize - 8, logoSize - 8);
  }

  // Teks Kop Resmi di atas Header Putih
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET & TEKNOLOGI', 130, 44);

  ctx.fillStyle = '#0F2B69';
  ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PKBM BINA MANDIRI SUMEDANG', 130, 78);

  ctx.fillStyle = '#0284C7';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`NPSN: ${siswa.npsn || 'P2970848'}`, 130, 104);

  // Badge Jenjang Kanan Kop (Pill Biru Navy dengan Huruf Emas)
  const jenjangBadge = badgeJenjangText[siswa.jenjang] || 'WARGA BELAJAR';
  ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
  const badgeW = ctx.measureText(jenjangBadge).width + 32;
  const badgeH = 36;
  const badgeX = CARD_WIDTH - badgeW - 36;
  const badgeY = 50;

  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fillStyle = '#0F2B69';
  ctx.fill();

  ctx.fillStyle = '#FCD34D';
  ctx.textAlign = 'center';
  ctx.fillText(jenjangBadge, badgeX + badgeW / 2, badgeY + 23);

  // 4. Baris Judul Kartu Tanda Pelajar (Pita Emas Megah)
  const titleBarY = kopH;
  const goldGrad = ctx.createLinearGradient(0, titleBarY, CARD_WIDTH, titleBarY);
  goldGrad.addColorStop(0, '#FDE68A');
  goldGrad.addColorStop(0.5, '#F59E0B');
  goldGrad.addColorStop(1, '#FDE68A');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, titleBarY, CARD_WIDTH, titleBarH);

  ctx.fillStyle = '#78350F';
  ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KARTU TANDA PELAJAR', CARD_WIDTH / 2, titleBarY + 19);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.fillRect(0, titleBarY + titleBarH - 1.5, CARD_WIDTH, 1.5);

  // 5. Watermark Logo PKBM di Kanan Bawah (Jelas, Terang & Menyala Anggun di atas Biru Gradient)
  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.globalCompositeOperation = 'screen';
    const wmSize = 310;
    const wmX = CARD_WIDTH - wmSize - 16;
    const wmY = CARD_HEIGHT - wmSize - 36;
    ctx.drawImage(logo, wmX, wmY, wmSize, wmSize);
    ctx.restore();
  }

  // 6. Pas Foto Siswa Resmi (3x4) dengan Border Putih Tegas
  const photoX = 40;
  const photoY = titleBarY + titleBarH + 20;
  const photoW = 180;
  const photoH = 240;
  const photoRadius = 6;

  // Muat foto siswa dengan multi-strategy failover
  let photoImg = null;

  // 1. Coba dari photoDataUrl jika sudah berhasil diekstrak di client
  if (siswa.photoDataUrl && siswa.photoDataUrl.startsWith('data:')) {
    photoImg = await loadImage(siswa.photoDataUrl);
  }

  // 2. Coba dari elemen DOM langsung jika tersedia
  if (!photoImg && typeof document !== 'undefined') {
    const domImg = document.querySelector('.student-official-photo');
    if (domImg && domImg.complete && domImg.naturalWidth > 0) {
      photoImg = domImg;
    }
  }

  // 3. Coba dari daftar URL kandidat foto
  if (!photoImg) {
    const rawList = [
      siswa.fotoUrl,
      ...(Array.isArray(siswa.photoCandidates) ? siswa.photoCandidates : []),
      siswa.foto_pendaftaran,
      siswa.pas_foto,
      siswa.foto_profil,
      siswa.foto,
    ].filter(Boolean);

    const candidates = [];
    for (const raw of rawList) {
      if (typeof raw !== 'string') continue;
      if (raw.startsWith('data:') || raw.startsWith('blob:')) {
        candidates.push(raw);
        continue;
      }
      if (/^https?:\/\//i.test(raw)) {
        candidates.push(raw);
      } else {
        const clean = raw.replace(/\\/g, '/').replace(/^\/+/, '');
        const sub = clean.replace(/^uploads\//, '');
        candidates.push(`/api/uploads/${sub}`);
        candidates.push(`/uploads/${sub}`);
        candidates.push(`https://pkbmbinamandiri.sch.id/uploads/${sub}`);
        candidates.push(`https://pkbmbinamandiri.sch.id/api/uploads/${sub}`);
        candidates.push(`/${clean}`);
      }
    }

    if (siswa.berkas_foto_id) {
      candidates.push(`/api/spmb/berkas/${siswa.berkas_foto_id}/file`);
      candidates.push(`https://pkbmbinamandiri.sch.id/api/spmb/berkas/${siswa.berkas_foto_id}/file`);
    }

    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    for (const src of uniqueCandidates) {
      const loaded = await loadImage(src);
      if (loaded && loaded.naturalWidth > 0) {
        photoImg = loaded;
        break;
      }
    }
  }

  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
  ctx.clip();

  if (photoImg && (photoImg.naturalWidth > 0 || photoImg.width > 0)) {
    // Terapkan object-fit: cover agar foto siswa tidak gepeng/terdistorsi
    const imgW = photoImg.naturalWidth || photoImg.width;
    const imgH = photoImg.naturalHeight || photoImg.height;
    const imgRatio = imgW / imgH;
    const targetRatio = photoW / photoH;

    let sx = 0, sy = 0, sw = imgW, sh = imgH;
    if (imgRatio > targetRatio) {
      sw = imgH * targetRatio;
      sx = (imgW - sw) / 2;
    } else {
      sh = imgW / targetRatio;
      sy = (imgH - sh) / 2;
    }

    ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
  } else {
    // Fallback inisial jika foto belum ada
    ctx.fillStyle = '#0F2B69';
    ctx.fillRect(photoX, photoY, photoW, photoH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 80px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((siswa.nama_lengkap || 'W').charAt(0).toUpperCase(), photoX + photoW / 2, photoY + photoH / 2 + 28);
  }
  ctx.restore();

  // Border Foto Putih Tegas
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 7. Tabel Identitas Siswa di atas Gradient Biru
  const dataX = photoX + photoW + 36;
  const nameY = photoY + 28;

  // Nama Lengkap Siswa (Putih Terang)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 28px "Plus Jakarta Sans", sans-serif';
  const rawNama = (siswa.nama_lengkap || 'WARGA BELAJAR').toUpperCase();
  const namaDisplay = rawNama.length > 25 ? rawNama.substring(0, 23) + '...' : rawNama;
  ctx.fillText(namaDisplay, dataX, nameY);

  // Baris Data Identitas Terstruktur
  const displayNis = (siswa.nis || '').replace('PKBM-2025-', 'PKBM-2026-') || 'DALAM PENETAPAN';
  const metaItems = [
    ['NIS', displayNis, true],
    ['NIK', siswa.nik || '—', false],
    ['TTL', `${siswa.tempat_lahir || 'Sumedang'}, ${formatTanggalIndo(siswa.tanggal_lahir)}`, false],
    ['Program', labelJenjang[siswa.jenjang] || siswa.jenjang || 'Paket C (Setara SMA)', false],
    ['Rombel', siswa.nama_rombel || 'Dalam Penetapan', false],
    ['Masa Berlaku', 'Selama Menjadi Warga Belajar', false],
  ];

  let metaY = nameY + 12;
  metaItems.forEach(([label, value, isNis]) => {
    metaY += 31;
    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, dataX, metaY);

    ctx.fillStyle = '#93C5FD';
    ctx.fillText(':', dataX + 150, metaY);

    if (isNis) {
      ctx.fillStyle = '#FCD34D';
      ctx.font = '800 20px "Space Mono", monospace';
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    }
    const valDisplay = value.length > 32 ? value.substring(0, 30) + '...' : value;
    ctx.fillText(valDisplay, dataX + 172, metaY);
  });

  // 8. Footer Kartu Depan
  const footerY = CARD_HEIGHT - 66;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, footerY);
  ctx.lineTo(CARD_WIDTH - 36, footerY);
  ctx.stroke();

  // Barcode Putih di atas Gradient Biru (Presisi Lurus Sempurna dengan Teks NIS)
  ctx.save();
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '700 12px "Space Mono", monospace';
  const nisWidth = ctx.measureText(displayNis).width;
  ctx.fillText(displayNis, 40, footerY + 50);

  ctx.fillStyle = '#FFFFFF';
  const pattern = [2, 1, 3, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 3, 2, 1, 3, 1, 2, 2, 1, 3, 1];
  const totalUnits = pattern.reduce((a, b) => a + b, 0);
  const barUnitW = nisWidth / totalUnits;
  let curX = 40;
  for (let i = 0; i < pattern.length; i++) {
    const barW = pattern[i] * barUnitW;
    if (i % 2 === 0) {
      ctx.fillRect(curX, footerY + 12, barW, 26);
    }
    curX += barW;
  }
  ctx.restore();

  // Teks Resmi di Kanan Footer
  ctx.textAlign = 'right';
  ctx.fillStyle = '#93C5FD';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PKBM BINA MANDIRI • KABUPATEN SUMEDANG', CARD_WIDTH - 40, footerY + 32);

  ctx.restore();
}

// ── Menggambar Sisi Belakang Kartu (Canvas 300 DPI - Standar Resmi PVC) ──
export async function drawCardBack(ctx, siswa, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 1. Clip sudut melengkung kartu (CR-80)
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  ctx.clip();

  // 2. Background Bawah: Gradient Biru Pekat Elegan
  const backHeaderH = 62;
  const bodyGrad = ctx.createLinearGradient(0, backHeaderH, CARD_WIDTH, CARD_HEIGHT);
  bodyGrad.addColorStop(0, '#133B85');
  bodyGrad.addColorStop(0.25, '#0C265E');
  bodyGrad.addColorStop(0.55, '#071940');
  bodyGrad.addColorStop(1, '#030C22');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 3. Header Sisi Belakang: PUTIH Bersih + Motif Batik Ceplok Kasumedangan & Garis Emas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CARD_WIDTH, backHeaderH);

  // Terapkan Motif Batik Kasumedangan Langsung via Canvas Pattern Tile
  try {
    const tileCanvas = createBatikTileCanvas();
    const pattern = ctx.createPattern(tileCanvas, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, CARD_WIDTH, backHeaderH);
      ctx.restore();
    }
  } catch (err) {
    console.warn('[KartuPelajar] Gagal membuat pattern tile kop belakang:', err);
  }

  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, backHeaderH - 3, CARD_WIDTH, 3);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0F2B69';
  ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KETENTUAN PENGGUNAAN KARTU PELAJAR', CARD_WIDTH / 2, 39);

  // 4. Sisi Belakang Tanpa Logo Watermark di Bawah Kanan (Sesuai Permintaan)

  // 5. 4 Butir Ketentuan
  const clauses = [
    '1. Kartu ini adalah tanda bukti identitas sah Warga Belajar PKBM Bina Mandiri yang diakui.',
    '2. Wajib dibawa saat mengikuti tutorial tatap muka, asesmen sumatif, dan ujian evaluasi pembelajaran.',
    '3. Kartu ini tidak dapat dipinjamkan, digandakan, atau dipindahtangankan kepada orang lain.',
    '4. Bila kartu ini hilang atau rusak, segera melapor ke Sekretariat TU PKBM Bina Mandiri.'
  ];

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F1F5F9';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  let clauseY = 118;
  clauses.forEach((text) => {
    ctx.fillText(text, 50, clauseY);
    clauseY += 44;
  });

  // 6. Cluster Identitas Lembaga & Pengesahan Kepala Lembaga (Tepat di Bawah, Selaras Web)
  const bottomY = CARD_HEIGHT - 148;
  const clusterLineY = bottomY - 18;

  // Garis Pembatas Cluster
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, clusterLineY);
  ctx.lineTo(CARD_WIDTH - 40, clusterLineY);
  ctx.stroke();

  // Lembaga Info (Kiri Bawah)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#93C5FD';
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PUSAT KEGIATAN BELAJAR MASYARAKAT', 50, bottomY + 16);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PKBM BINA MANDIRI', 50, bottomY + 44);

  ctx.fillStyle = '#FCD34D';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`NPSN: ${siswa.npsn || 'P2970848'}`, 50, bottomY + 68);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Alamat: Dusun Sukahurip RT 03 RW 03 Desa Legok Kaler Kec. Paseh Kab. Sumedang Prov. Jawa Barat Kode Pos 5381', 50, bottomY + 88);

  ctx.fillStyle = '#93C5FD';
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Laman Resmi: pkbmbinamandiri.sch.id', 50, bottomY + 108);

  // Blok Pengesahan (Kanan Bawah - Posisi Selaras Web)
  const endorseX = CARD_WIDTH - 200;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#93C5FD';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Sumedang, ${new Date().getFullYear()}`, endorseX, bottomY + 10);

  ctx.fillStyle = '#F1F5F9';
  ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Kepala PKBM Bina Mandiri,', endorseX, bottomY + 30);

  // Gambar Tanda Tangan Resmi (ttd.png) dibuat putih bersih agar kontras sempurna di atas gradient biru
  const ttdImg = (await loadImage('/images/ttd.png')) || (await loadImage('/ttd.png'));
  if (ttdImg) {
    const ttdW = 140;
    const ttdH = 65;
    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = ttdW;
      offCanvas.height = ttdH;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(ttdImg, 0, 0, ttdW, ttdH);
      const imgData = offCtx.getImageData(0, 0, ttdW, ttdH);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 20) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(offCanvas, endorseX - ttdW / 2, bottomY + 34);
    } catch {
      ctx.drawImage(ttdImg, endorseX - ttdW / 2, bottomY + 34, ttdW, ttdH);
    }
  }

  // Nama Pimpinan Resmi: Indrayani, S.S.,M.Pd.
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Indrayani, S.S.,M.Pd.', endorseX, bottomY + 108);

  // Garis bawah nama (Aksen Emas)
  const nameWidth = ctx.measureText('Indrayani, S.S.,M.Pd.').width;
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(endorseX - nameWidth / 2, bottomY + 114);
  ctx.lineTo(endorseX + nameWidth / 2, bottomY + 114);
  ctx.stroke();

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

