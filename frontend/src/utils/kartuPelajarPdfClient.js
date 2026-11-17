// ============================================================
// frontend/src/utils/kartuPelajarPdfClient.js
// Generator PDF Kartu Pelajar Digital Resmi Beresolusi Tinggi (300 DPI)
// Output: Dokumen PDF Standar Cetak Kartu ID CR-80 (2 Halaman)
// Halaman 1: Sisi Depan (Front)
// Halaman 2: Sisi Belakang (Back)
// Format Standar untuk Mesin Cetak Kartu PVC (Fargo, Zebra, Evolis) & Duplex
// ============================================================

import { drawCardFront, drawCardBack } from './kartuCanvasDrawer.js';

// Dimensi standar kartu CR-80 (85.60 mm x 53.98 mm -> ~243 pt x 153 pt)
const CARD_W = 243;
const CARD_H = 153;

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

// ── Bangun Dokumen PDF Pixel-Perfect 2 Halaman (CR-80 Sisi Depan & Sisi Belakang) ──
export async function buildKartuPelajarPixelPerfectPdfBlob(siswa) {
  const encoder = new TextEncoder();

  // 1. Render Sisi Depan ke Canvas HD (1012 x 638 px @ 300 DPI)
  const canvasFront = document.createElement('canvas');
  canvasFront.width = 1012;
  canvasFront.height = 638;
  const ctxF = canvasFront.getContext('2d');
  await drawCardFront(ctxF, siswa);
  const jpegFrontB64 = canvasFront.toDataURL('image/jpeg', 0.95).split(',')[1];
  const jpegFrontBytes = b64ToUint8(jpegFrontB64);

  // 2. Render Sisi Belakang ke Canvas HD (1012 x 638 px @ 300 DPI)
  const canvasBack = document.createElement('canvas');
  canvasBack.width = 1012;
  canvasBack.height = 638;
  const ctxB = canvasBack.getContext('2d');
  await drawCardBack(ctxB, siswa);
  const jpegBackB64 = canvasBack.toDataURL('image/jpeg', 0.95).split(',')[1];
  const jpegBackBytes = b64ToUint8(jpegBackB64);

  // 3. Stream Konten Halaman 1 (Sisi Depan) & Halaman 2 (Sisi Belakang)
  const content1Str = `q ${CARD_W} 0 0 ${CARD_H} 0 0 cm /ImFront Do Q\n`;
  const content1Bytes = encoder.encode(content1Str);

  const content2Str = `q ${CARD_W} 0 0 ${CARD_H} 0 0 cm /ImBack Do Q\n`;
  const content2Bytes = encoder.encode(content2Str);

  // 4. Struktur Objek PDF-1.4 (2 Pages CR-80)
  // 1 0 obj: Catalog
  // 2 0 obj: Pages (/Count 2)
  // 3 0 obj: Page 1 (Front)
  // 4 0 obj: Page 2 (Back)
  // 5 0 obj: ImFront (XObject Image)
  // 6 0 obj: Page 1 Contents Stream
  // 7 0 obj: ImBack (XObject Image)
  // 8 0 obj: Page 2 Contents Stream

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Count 2 /Kids [3 0 R 4 0 R] >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${CARD_W} ${CARD_H}] /Resources << /XObject << /ImFront 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${CARD_W} ${CARD_H}] /Resources << /XObject << /ImBack 7 0 R >> >> /Contents 8 0 R >>\nendobj\n`;

  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width 1012 /Height 638 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegFrontBytes.length} >>\nstream\n`;
  const obj5Footer = '\nendstream\nendobj\n';

  const obj6 = `6 0 obj\n<< /Length ${content1Bytes.length} >>\nstream\n${content1Str}endstream\nendobj\n`;

  const obj7Header = `7 0 obj\n<< /Type /XObject /Subtype /Image /Width 1012 /Height 638 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBackBytes.length} >>\nstream\n`;
  const obj7Footer = '\nendstream\nendobj\n';

  const obj8 = `8 0 obj\n<< /Length ${content2Bytes.length} >>\nstream\n${content2Str}endstream\nendobj\n`;

  // 5. Hitung Offset XRef Secara Presisi
  const headerStr = '%PDF-1.4\n';
  const offsets = [0];

  const part1 = encoder.encode(headerStr);
  offsets.push(part1.length); // 1 0 obj offset

  const part2 = encoder.encode(obj1);
  offsets.push(offsets[1] + part2.length); // 2 0 obj offset

  const part3 = encoder.encode(obj2);
  offsets.push(offsets[2] + part3.length); // 3 0 obj offset

  const part4 = encoder.encode(obj3);
  offsets.push(offsets[3] + part4.length); // 4 0 obj offset

  const part5 = encoder.encode(obj4);
  offsets.push(offsets[4] + part5.length); // 5 0 obj offset

  const part5A = encoder.encode(obj5Header);
  const part5C = encoder.encode(obj5Footer);
  const obj5TotalLen = part5A.length + jpegFrontBytes.length + part5C.length;
  offsets.push(offsets[5] + obj5TotalLen); // 6 0 obj offset

  const part6 = encoder.encode(obj6);
  offsets.push(offsets[6] + part6.length); // 7 0 obj offset

  const part7A = encoder.encode(obj7Header);
  const part7C = encoder.encode(obj7Footer);
  const obj7TotalLen = part7A.length + jpegBackBytes.length + part7C.length;
  offsets.push(offsets[7] + obj7TotalLen); // 8 0 obj offset

  const part8 = encoder.encode(obj8);
  const xrefOffset = offsets[8] + part8.length;

  let xrefStr = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xrefStr += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const partXref = encoder.encode(xrefStr);

  const pdfBytes = concatBytes([
    part1,
    part2,
    part3,
    part4,
    part5,
    part5A,
    jpegFrontBytes,
    part5C,
    part6,
    part7A,
    jpegBackBytes,
    part7C,
    part8,
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
