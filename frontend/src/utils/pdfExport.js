// ============================================================
// frontend/src/utils/pdfExport.js
// Utility Direct PDF Download (html2pdf.js)
// Mengunduh langsung file .pdf 1 lembar utuh A4/F4 tanpa dialog print
// ============================================================

import html2pdf from 'html2pdf.js';

/**
 * Unduh elemen HTML langsung sebagai file PDF resmi 1 lembar utuh
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

  // Simpan inline styles asli sebelum optimasi tangkapan
  const originalWidth = el.style.width;
  const originalMaxWidth = el.style.maxWidth;
  const originalBoxShadow = el.style.boxShadow;
  const originalBorder = el.style.border;
  const originalBorderRadius = el.style.borderRadius;
  const originalBackground = el.style.backgroundColor;
  const originalMargin = el.style.margin;
  const originalPadding = el.style.padding;

  // Terapkan penyesuaian khusus capture PDF agar 100% pas dalam 1 lembar
  el.style.width = '790px';
  el.style.maxWidth = '790px';
  el.style.boxShadow = 'none';
  el.style.border = 'none';
  el.style.borderRadius = '0';
  el.style.backgroundColor = '#ffffff';
  el.style.margin = '0';
  el.style.padding = '8px 14px';

  const opt = {
    margin: [4, 6, 4, 6], // margin tipis (mm) [atas, kiri, bawah, kanan]
    filename: finalFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 800,
      backgroundColor: '#ffffff',
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

  try {
    await html2pdf().set(opt).from(el).save();
    return true;
  } catch (error) {
    console.error('[pdfExport] Gagal mengekspor PDF:', error);
    throw error;
  } finally {
    // Kembalikan style elemen ke tampilan layar awal
    el.style.width = originalWidth;
    el.style.maxWidth = originalMaxWidth;
    el.style.boxShadow = originalBoxShadow;
    el.style.border = originalBorder;
    el.style.borderRadius = originalBorderRadius;
    el.style.backgroundColor = originalBackground;
    el.style.margin = originalMargin;
    el.style.padding = originalPadding;
  }
};
