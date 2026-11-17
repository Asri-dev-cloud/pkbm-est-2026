// ============================================================
// frontend/src/utils/pdfExport.js
// Utility Direct PDF Download (html2pdf.js)
// Mengunduh langsung file .pdf 1 lembar utuh A4/F4 tanpa dialog print
// ============================================================

import html2pdf from 'html2pdf.js';

/**
 * Unduh elemen HTML langsung sebagai file PDF
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
  const formatOption = isF4 ? [215, 330] : 'a4';

  const opt = {
    margin: [4, 6, 4, 6], // margin [atas, kiri, bawah, kanan] dalam mm
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      windowWidth: el.scrollWidth || 800,
    },
    jsPDF: {
      unit: 'mm',
      format: formatOption,
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
    },
  };

  return html2pdf().set(opt).from(el).save();
};

