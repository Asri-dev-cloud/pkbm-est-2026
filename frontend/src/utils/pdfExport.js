// ============================================================
// frontend/src/utils/pdfExport.js
// Utility Direct PDF Download (html2canvas + jsPDF)
// Menjamin dokumen rapor SELALU 1 LEMBAR UTUH (A4 / F4)
// Tampilan rapi, tajam, presisi tanpa garis menimpa teks & tanpa halaman kedua
// ============================================================

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Unduh elemen HTML langsung sebagai file PDF 1 Halaman Utuh
 * @param {HTMLElement|string} targetEl - Elemen atau ID elemen yang akan diunduh
 * @param {string} filename - Nama file hasil unduhan (.pdf)
 * @param {string} paperSize - Ukuran kertas: 'a4' (default) atau 'f4'
 */
export const downloadElementAsPdf = async (targetEl, filename = 'Rapor_PKBM_Bina_Mandiri.pdf', paperSize = 'a4') => {
  const el = typeof targetEl === 'string' ? document.getElementById(targetEl) : targetEl;
  if (!el) {
    throw new Error('Elemen dokumen tidak ditemukan untuk konversi PDF');
  }

  // Pastikan nama file berakhiran .pdf
  const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Ukuran kertas (mm): A4: 210 x 297 mm, F4 / Folio: 215 x 330 mm
  const isF4 = String(paperSize).toLowerCase() === 'f4';
  const pageWidth = isF4 ? 215 : 210;
  const pageHeight = isF4 ? 330 : 297;

  // Margin dokumen rapor resmi (mm)
  const marginX = 6;
  const marginY = 6;
  const printableWidth = pageWidth - (marginX * 2);
  const printableHeight = pageHeight - (marginY * 2);

  // Buat kloning elemen yang terisolasi di posisi (0, 0)
  // Menjamin Kop Surat dan bagian atas dokumen TIDAK AKAN PERNAH terpotong
  // meskipun user sedang scroll ke bawah saat menekan tombol download
  const clone = el.cloneNode(true);
  clone.id = 'rapor-pdf-isolated-clone';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minWidth = '794px';
  clone.style.margin = '0';
  clone.style.padding = '18px 22px';
  clone.style.boxSizing = 'border-box';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '9999999';
  clone.style.backgroundColor = '#ffffff';

  document.body.appendChild(clone);

  // Berikan waktu mikro bagi DOM clone untuk memastikan layout stabil
  await new Promise((resolve) => setTimeout(resolve, 80));

  let canvas;
  try {
    canvas = await html2canvas(clone, {
      scale: 2, // 2x resolusi untuk ketajaman teks & cetak
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      x: 0,
      y: 0,
      width: clone.offsetWidth || 794,
      height: clone.offsetHeight,
    });
  } finally {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isF4 ? [215, 330] : 'a4',
    compress: true,
  });

  // Hitung rasio gambar agar TEPAT PAS 1 HALAMAN (TIDAK PERNAH JADI 2 HALAMAN)
  const canvasRatio = canvas.width / canvas.height;
  let renderWidth = printableWidth;
  let renderHeight = renderWidth / canvasRatio;

  // Jika tinggi melebihi area cetak 1 halaman, skala proporsional agar 100% muat di 1 lembar
  if (renderHeight > printableHeight) {
    renderHeight = printableHeight;
    renderWidth = renderHeight * canvasRatio;
  }

  // Posisikan di tengah kertas secara horizontal
  const posX = marginX + (printableWidth - renderWidth) / 2;
  const posY = marginY;

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
  pdf.save(finalFilename);
};



