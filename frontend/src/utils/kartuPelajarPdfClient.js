// ============================================================
// frontend/src/utils/kartuPelajarPdfClient.js
// Generator PDF Kartu Pelajar Digital Resmi Beresolusi Tinggi (300 DPI)
// Memanfaatkan Canvas Renderer untuk Hasil PDF 100% Presisi & Rapi
// ============================================================

import { drawCardFront, drawCardBack } from './kartuCanvasDrawer.js';

const PAGE_WIDTH = 595;   // A4 Width in pt
const PAGE_HEIGHT = 842;  // A4 Height in pt

const CARD_W = 243; // CR-80 width in pt (~85.6 mm)
const CARD_H = 153; // CR-80 height in pt (~53.98 mm)

// Mengonversi string base64 menjadi Uint8Array
function b64ToUint8(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

// Menggabungkan byte-chunks menjadi satu Uint8Array
function concatBytes(arrays) {
  const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

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

// ── Bangun Dokumen PDF Pixel-Perfect dengan Image XObject ──
export async function buildKartuPelajarPixelPerfectPdfBlob(siswa) {
  const encoder = new TextEncoder();

  // 1. Render Sisi Depan ke Canvas HD (1012 x 638 px)
  const canvasFront = document.createElement('canvas');
  canvasFront.width = 1012;
  canvasFront.height = 638;
  const ctxF = canvasFront.getContext('2d');
  await drawCardFront(ctxF, siswa);
  const jpegFrontB64 = canvasFront.toDataURL('image/jpeg', 0.94).split(',')[1];
  const jpegFrontBytes = b64ToUint8(jpegFrontB64);

  // 2. Render Sisi Belakang ke Canvas HD (1012 x 638 px)
  const canvasBack = document.createElement('canvas');
  canvasBack.width = 1012;
  canvasBack.height = 638;
  const ctxB = canvasBack.getContext('2d');
  await drawCardBack(ctxB, siswa);
  const jpegBackB64 = canvasBack.toDataURL('image/jpeg', 0.94).split(',')[1];
  const jpegBackBytes = b64ToUint8(jpegBackB64);

  // 3. Perintah Stream Konten Halaman PDF
  const cardY = 600;
  const frontX = 42;
  const backX = 309;

  const contentCommands = [
    // Label teks sisi
    textLine('F2', 8, frontX + 2, cardY + CARD_H + 9, 'SISI DEPAN (FRONT)', 0.35, 0.42, 0.52),
    textLine('F2', 8, backX + 2, cardY + CARD_H + 9, 'SISI BELAKANG (BACK)', 0.35, 0.42, 0.52),

    // Garis putus-putus panduan potong CR-80 di sekeliling kartu
    `0.7 0.75 0.82 RG [3 3] 0 d 0.75 w ${frontX} ${cardY} ${CARD_W} ${CARD_H} re S [] 0 d`,
    `0.7 0.75 0.82 RG [3 3] 0 d 0.75 w ${backX} ${cardY} ${CARD_W} ${CARD_H} re S [] 0 d`,

    // Render Gambar Sisi Depan
    `q ${CARD_W} 0 0 ${CARD_H} ${frontX} ${cardY} cm /ImFront Do Q`,

    // Render Gambar Sisi Belakang
    `q ${CARD_W} 0 0 ${CARD_H} ${backX} ${cardY} cm /ImBack Do Q`,

    // Panduan potong halus di bawah kartu
    textLine('F1', 7, 130, cardY - 18, '- - - Gunting mengikuti garis putus-putus * Standar ID Card CR-80 (85.6 mm x 53.98 mm) - - -', 0.55, 0.6, 0.68)
  ].join('\n');

  const contentStreamBytes = encoder.encode(contentCommands);

  // 4. Struktur Objek PDF-1.4
  // 1 0 obj: Catalog
  // 2 0 obj: Pages
  // 3 0 obj: Page
  // 4 0 obj: Font Helvetica
  // 5 0 obj: Font Helvetica-Bold
  // 6 0 obj: ImFront (XObject Image)
  // 7 0 obj: ImBack (XObject Image)
  // 8 0 obj: Contents Stream

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /ImFront 6 0 R /ImBack 7 0 R >> >> /Contents 8 0 R >>\nendobj\n`;
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  const obj6Header = `6 0 obj\n<< /Type /XObject /Subtype /Image /Width 1012 /Height 638 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegFrontBytes.length} >>\nstream\n`;
  const obj6Footer = '\nendstream\nendobj\n';

  const obj7Header = `7 0 obj\n<< /Type /XObject /Subtype /Image /Width 1012 /Height 638 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBackBytes.length} >>\nstream\n`;
  const obj7Footer = '\nendstream\nendobj\n';

  const obj8 = `8 0 obj\n<< /Length ${contentStreamBytes.length} >>\nstream\n${contentCommands}\nendstream\nendobj\n`;

  // Hitung offset xref
  const headerStr = '%PDF-1.4\n';
  const offsets = [0];

  const part1 = encoder.encode(headerStr);
  offsets.push(part1.length); // 1 0 obj offset

  const part2 = encoder.encode(obj1);
  offsets.push(part1.length + part2.length); // 2 0 obj offset

  const part3 = encoder.encode(obj2);
  offsets.push(part1.length + part2.length + part3.length); // 3 0 obj offset

  const part4 = encoder.encode(obj3);
  offsets.push(part1.length + part2.length + part3.length + part4.length); // 4 0 obj offset

  const part5 = encoder.encode(obj4);
  offsets.push(part1.length + part2.length + part3.length + part4.length + part5.length); // 5 0 obj offset

  const part6 = encoder.encode(obj5);
  offsets.push(part1.length + part2.length + part3.length + part4.length + part5.length + part6.length); // 6 0 obj offset

  const part7A = encoder.encode(obj6Header);
  const part7C = encoder.encode(obj6Footer);
  const obj6TotalLen = part7A.length + jpegFrontBytes.length + part7C.length;

  const offset7 = offsets[6] + obj6TotalLen; // 7 0 obj offset
  offsets.push(offset7);

  const part8A = encoder.encode(obj7Header);
  const part8C = encoder.encode(obj7Footer);
  const obj7TotalLen = part8A.length + jpegBackBytes.length + part8C.length;

  const offset8 = offset7 + obj7TotalLen; // 8 0 obj offset
  offsets.push(offset8);

  const part9 = encoder.encode(obj8);
  const xrefOffset = offset8 + part9.length;

  let xrefStr = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xrefStr += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const partXref = encoder.encode(xrefStr);

  const pdfBytes = concatBytes([
    part1,
    part2,
    part3,
    part4,
    part5,
    part6,
    part7A,
    jpegFrontBytes,
    part7C,
    part8A,
    jpegBackBytes,
    part8C,
    part9,
    partXref,
  ]);

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// Download PDF Langsung
export async function triggerDownloadKartuPelajarPdf(siswa) {
  const blob = await buildKartuPelajarPixelPerfectPdfBlob(siswa);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeNis = (siswa?.nis || `siswa-${siswa?.id || 'doc'}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  link.download = `Kartu_Pelajar_${safeNis}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}

export default {
  buildKartuPelajarPixelPerfectPdfBlob,
  triggerDownloadKartuPelajarPdf,
};
