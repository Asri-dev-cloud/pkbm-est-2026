// ============================================================
// frontend/src/pages/siswa/RaporSiswa.jsx
// Halaman Rapor Siswa Digital (Tampilan Siswa: Read-Only & Print)
// ============================================================

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { RaporAPI } from '../../services/api.js';
import { Printer, X } from 'lucide-react';
import './RaporSiswa.css';
import '../admin/RaporAdmin.css';

export default function RaporSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [loading, setLoading] = useState(true);
  const [profilSiswa, setProfilSiswa] = useState(null);
  const [raporList, setRaporList] = useState([]);
  const [activeSemester, setActiveSemester] = useState('1');

  // Detail rapor semester terpilih
  const [detailRapor, setDetailRapor] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Print modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ── Ambil Data Rapor Siswa ─────────────────────────────────
  const fetchMyRapor = async () => {
    try {
      setLoading(true);
      const res = await RaporAPI.getMyRapor();
      if (res.data?.success) {
        setProfilSiswa(res.data.profil);
        const list = res.data.data || [];
        setRaporList(list);

        // Pilih semester aktif default berdasarkan rapor terbaru jika ada
        if (list.length > 0) {
          setActiveSemester(String(list[0].semester));
        }
      }
    } catch (err) {
      console.error('Error fetching student rapor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRapor();
  }, []);

  // ── Ambil Detail Nilai Saat Semester Berganti ───────────────
  useEffect(() => {
    const matching = raporList.find(r => String(r.semester) === String(activeSemester));
    if (matching) {
      loadDetail(matching.id);
    } else {
      setDetailRapor(null);
    }
  }, [activeSemester, raporList]);

  const loadDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await RaporAPI.getById(id);
      if (res.data?.success) {
        setDetailRapor(res.data.data);
      }
    } catch (err) {
      console.error('Error loading detail rapor:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Normalisasi NIS ke angkatan 2026 jika diperlukan
  const rawNis = profilSiswa?.nis || user?.nis || '';
  const displayNis = rawNis.replace('PKBM-2025-', 'PKBM-2026-');

  return (
    <div className="app-layout">
      <Sidebar user={user} />

      <main className="app-main">
        <div className="app-content rapor-siswa-page">

          {/* Top Page Header */}
          <header className="rapor-page-header">
            <h1>Rapor Siswa Digital</h1>
            <p>
              Buku laporan resmi capaian hasil belajar dan rekaman kehadiran peserta didik PKBM Bina Mandiri.
            </p>
          </header>

          {/* Strip Profil Siswa */}
          <section className="student-profile-strip">
            <div className="student-profile-left">
              <div className="student-profile-avatar">
                {(profilSiswa?.nama_lengkap || user?.nama_lengkap || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="student-profile-details">
                <h2>{profilSiswa?.nama_lengkap || user?.nama_lengkap || 'Warga Belajar'}</h2>
                <div className="student-profile-pills">
                  <span className="profile-pill nis">NIS: {displayNis || '-'}</span>
                  <span className="profile-pill">
                    {profilSiswa?.nama_rombel || (profilSiswa?.jenjang ? profilSiswa.jenjang.toUpperCase() : 'Kelas Terpadu')}
                  </span>
                  <span className="profile-pill school">PKBM Bina Mandiri Sumedang</span>
                </div>
              </div>
            </div>

            {detailRapor && detailRapor.status_rapor === 'final' && (
              <button
                type="button"
                className="rapor-btn-print"
                onClick={() => setShowPrintModal(true)}
              >
                <Printer size={16} />
                Cetak / Simpan Rapor PDF
              </button>
            )}
          </section>

          {/* Segmented Semester Tabs (Bersih Tanpa Ikon Aneh) */}
          <section className="semester-tabs-wrapper">
            <div className="semester-segmented-control">
              <button
                type="button"
                className={`semester-tab-item ${activeSemester === '1' ? 'active' : ''}`}
                onClick={() => setActiveSemester('1')}
              >
                Semester 1 (Ganjil)
              </button>
              <button
                type="button"
                className={`semester-tab-item ${activeSemester === '2' ? 'active' : ''}`}
                onClick={() => setActiveSemester('2')}
              >
                Semester 2 (Genap)
              </button>
            </div>

            {detailRapor && (
              <div className="semester-ta-info">
                Tahun Ajaran: <strong>{detailRapor.nama_tahun_ajaran || '-'}</strong>
              </div>
            )}
          </section>

          {/* Main Content Area */}
          {loading || loadingDetail ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '48px 20px', textAlign: 'center', color: '#64748B', fontSize: '0.92rem' }}>
              Memuat data rapor digital semester {activeSemester}...
            </div>
          ) : !detailRapor ? (
            /* Clean Empty State */
            <div className="rapor-clean-empty-card">
              <span className="empty-status-tag">Laporan Belajar</span>
              <h3>Rapor Semester {activeSemester} Belum Diterbitkan</h3>
              <p>
                Laporan hasil belajar untuk <strong>Semester {activeSemester} ({activeSemester === '1' ? 'Ganjil' : 'Genap'})</strong> saat ini sedang dalam proses finalisasi nilai dan verifikasi oleh tim akademik PKBM Bina Mandiri. Hasil belajar akan otomatis dapat diakses setelah resmi diterbitkan.
              </p>
            </div>
          ) : (
            /* Tampilan Nilai Rapor */
            <>
              {/* Notice jika rapor masih draf */}
              {detailRapor.status_rapor === 'draft' && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', padding: '14px 18px', borderRadius: 12, marginBottom: 20, fontSize: '0.88rem' }}>
                  <strong>Informasi Draf:</strong> Rapor semester ini masih dalam tahap peninjauan wali kelas dan belum bersifat final resmi.
                </div>
              )}

              {/* Stat Boxes Row */}
              <section className="rapor-stats-row">
                <div className="rapor-stat-box">
                  <span className="box-label">Rata-rata Nilai</span>
                  <div className="box-value">
                    {detailRapor.rata_rata || '0'}
                    <span className={`predikat-badge-lg ${detailRapor.rata_rata >= 85 ? 'A' : detailRapor.rata_rata >= 75 ? 'B' : detailRapor.rata_rata >= 60 ? 'C' : 'D'}`}>
                      {detailRapor.rata_rata >= 85 ? 'A' : detailRapor.rata_rata >= 75 ? 'B' : detailRapor.rata_rata >= 60 ? 'C' : 'D'}
                    </span>
                  </div>
                </div>

                <div className="rapor-stat-box">
                  <span className="box-label">Jumlah Mata Pelajaran</span>
                  <div className="box-value">
                    {detailRapor.nilai?.length || 0} Mapel
                  </div>
                </div>

                <div className="rapor-stat-box">
                  <span className="box-label">Kehadiran Belajar</span>
                  <div className="box-value">
                    {detailRapor.total_hadir || 0} Hari
                  </div>
                </div>

                <div className="rapor-stat-box">
                  <span className="box-label">Status Dokumen</span>
                  <div className="box-value" style={{ fontSize: '1.15rem' }}>
                    {detailRapor.status_rapor === 'final' ? 'Resmi Diterbitkan' : 'Draf Salinan'}
                  </div>
                </div>
              </section>

              {/* Tabel Capaian Nilai */}
              <section className="rapor-section-card">
                <h3>Daftar Nilai Mata Pelajaran</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="rapor-table-clean">
                    <thead>
                      <tr>
                        <th style={{ width: 45, textAlign: 'center' }}>No</th>
                        <th>Mata Pelajaran</th>
                        <th style={{ textAlign: 'center' }}>KKM</th>
                        <th style={{ textAlign: 'center' }}>Nilai Tugas</th>
                        <th style={{ textAlign: 'center' }}>Nilai UTS</th>
                        <th style={{ textAlign: 'center' }}>Nilai UAS</th>
                        <th style={{ textAlign: 'center' }}>Nilai Akhir</th>
                        <th style={{ textAlign: 'center' }}>Predikat</th>
                        <th>Catatan Capaian Belajar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRapor.nilai && detailRapor.nilai.length > 0 ? (
                        detailRapor.nilai.map((n, idx) => (
                          <tr key={n.id || idx}>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                              {idx + 1}
                            </td>
                            <td>
                              <strong style={{ color: '#0F172A', display: 'block' }}>{n.nama_mapel}</strong>
                              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Kode: {n.kode_mapel || '-'}</span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{n.kkm || 75}</td>
                            <td style={{ textAlign: 'center' }}>{n.nilai_tugas}</td>
                            <td style={{ textAlign: 'center' }}>{n.nilai_uts}</td>
                            <td style={{ textAlign: 'center' }}>{n.nilai_uas}</td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: '#1D4ED8', fontSize: '0.96rem' }}>
                              {n.nilai_akhir}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`pill-predikat ${n.predikat}`}>
                                {n.predikat}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.84rem', color: '#334155' }}>
                              {n.catatan || 'Tuntas mencapai kriteria ketercapaian tujuan pembelajaran.'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>
                            Belum ada nilai yang dimasukkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Bottom Grid: Rekap Absensi & Catatan Wali */}
              <div className="rapor-bottom-grid">
                <section className="rapor-section-card">
                  <h3>Rekapitulasi Ketidakhadiran</h3>
                  <div className="absen-list">
                    <div className="absen-row">
                      <span>1. Sakit</span>
                      <strong>{detailRapor.total_sakit || 0} hari</strong>
                    </div>
                    <div className="absen-row">
                      <span>2. Izin</span>
                      <strong>{detailRapor.total_izin || 0} hari</strong>
                    </div>
                    <div className="absen-row">
                      <span>3. Tanpa Keterangan (Alpa)</span>
                      <strong style={{ color: detailRapor.total_alpa > 0 ? '#DC2626' : 'inherit' }}>
                        {detailRapor.total_alpa || 0} hari
                      </strong>
                    </div>
                    <div className="absen-row total">
                      <span>Total Hari Hadir Belajar</span>
                      <span>{detailRapor.total_hadir || 0} hari</span>
                    </div>
                  </div>
                </section>

                <section className="rapor-section-card">
                  <h3>Catatan Perkembangan Siswa</h3>
                  <p className="wali-note-quote">
                    "{detailRapor.catatan_wali || 'Pertahankan prestasi belajar dan terus kembangkan bakat serta disiplin dalam menuntaskan materi pembelajaran.'}"
                  </p>
                </section>
              </div>
            </>
          )}

          {/* Modal Cetak Rapor Digital Siswa */}
          {showPrintModal && detailRapor && (
            <div className="rapor-modal-backdrop" onClick={() => setShowPrintModal(false)}>
              <div className="rapor-print-modal-card" onClick={e => e.stopPropagation()}>
                <div className="rapor-modal-header">
                  <h3>Pratinjau Cetak Rapor Digital Siswa</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="rapor-btn-primary"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} />
                      Cetak / Simpan PDF
                    </button>
                    <button
                      type="button"
                      className="btn-modal-close"
                      onClick={() => setShowPrintModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="rapor-modal-body" style={{ background: '#525659', padding: '24px 20px' }}>
                  <div className="rapor-print-paper">
                    {/* Kop Surat Resmi */}
                    <div className="print-kop-surat">
                      <img src="/images/logo new.png" alt="Logo PKBM" className="print-logo" />
                      <div className="print-kop-text">
                        <h2>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h2>
                        <h1>PKBM BINA MANDIRI SUMEDANG</h1>
                        <p><strong>NPSN: P9962854 • Terakreditasi Resmi</strong></p>
                        <p>Sekretariat: Sumedang, Jawa Barat | Website: pkbmbinamandiri.sch.id</p>
                      </div>
                    </div>

                    <div className="print-title">
                      LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR DIGITAL)
                    </div>

                    {/* Identitas Peserta Didik */}
                    <div className="print-identitas-grid">
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 140, padding: '3px 0' }}>Nama Warga Belajar</td>
                              <td>: <strong>{detailRapor.nama_lengkap}</strong></td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Nomor Induk Siswa (NIS)</td>
                              <td>: {displayNis || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>NIK Siswa</td>
                              <td>: {detailRapor.nik || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Program Pendidikan</td>
                              <td>: {detailRapor.jenjang ? detailRapor.jenjang.toUpperCase() : '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: 120, padding: '3px 0' }}>Kelas / Rombel</td>
                              <td>: {detailRapor.nama_rombel || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Semester</td>
                              <td>: {detailRapor.semester} ({detailRapor.semester === '1' ? 'Ganjil' : 'Genap'})</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Tahun Pelajaran</td>
                              <td>: {detailRapor.nama_tahun_ajaran || '-'}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0' }}>Status Dokumen</td>
                              <td>: {detailRapor.status_rapor === 'final' ? 'Resmi / Sah' : 'Draf'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tabel Nilai */}
                    <table className="print-table-nilai">
                      <thead>
                        <tr>
                          <th style={{ width: 35 }}>No</th>
                          <th style={{ textAlign: 'left' }}>Mata Pelajaran</th>
                          <th style={{ width: 50 }}>KKM</th>
                          <th style={{ width: 60 }}>Tugas</th>
                          <th style={{ width: 60 }}>UTS</th>
                          <th style={{ width: 60 }}>UAS</th>
                          <th style={{ width: 75 }}>Nilai Akhir</th>
                          <th style={{ width: 65 }}>Predikat</th>
                          <th>Capaian Kompetensi / Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailRapor.nilai && detailRapor.nilai.length > 0 ? (
                          detailRapor.nilai.map((n, idx) => (
                            <tr key={n.id || idx}>
                              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                              <td><strong>{n.nama_mapel}</strong></td>
                              <td style={{ textAlign: 'center' }}>{n.kkm || 75}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_tugas}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_uts}</td>
                              <td style={{ textAlign: 'center' }}>{n.nilai_uas}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n.nilai_akhir}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n.predikat}</td>
                              <td style={{ fontSize: '0.8rem' }}>{n.catatan || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '16px' }}>
                              Belum ada nilai yang dimasukkan.
                            </td>
                          </tr>
                        )}
                        <tr style={{ background: '#F8FAFC', fontWeight: 'bold' }}>
                          <td colSpan="6" style={{ textAlign: 'right', paddingRight: '12px' }}>
                            RATA-RATA NILAI KESELURUHAN:
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.95rem' }}>
                            {detailRapor.rata_rata || '0'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {detailRapor.rata_rata >= 85 ? 'A' : detailRapor.rata_rata >= 75 ? 'B' : detailRapor.rata_rata >= 60 ? 'C' : 'D'}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Rekap Kehadiran */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14 }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: 4 }}>
                          Rekapitulasi Ketidakhadiran:
                        </strong>
                        <table className="print-absen-box">
                          <tbody>
                            <tr>
                              <td style={{ width: 140 }}>1. Sakit</td>
                              <td>: {detailRapor.total_sakit || 0} hari</td>
                            </tr>
                            <tr>
                              <td>2. Izin</td>
                              <td>: {detailRapor.total_izin || 0} hari</td>
                            </tr>
                            <tr>
                              <td>3. Tanpa Keterangan</td>
                              <td>: {detailRapor.total_alpa || 0} hari</td>
                            </tr>
                            <tr>
                              <td><strong>Total Kehadiran</strong></td>
                              <td>: <strong>{detailRapor.total_hadir || 0} hari</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Catatan Wali Kelas */}
                    <div className="print-catatan-box">
                      <strong>Catatan Wali Kelas / Pembimbing:</strong>
                      <p style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>
                        "{detailRapor.catatan_wali || 'Pertahankan semangat belajar dan terus kembangkan bakat serta potensi diri.'}"
                      </p>
                    </div>

                    {/* Kolom Tanda Tangan */}
                    <div className="print-ttd-grid">
                      <div className="ttd-box">
                        <span>Mengetahui,<br />Orang Tua / Wali Siswa</span>
                        <span className="ttd-line">................................................</span>
                      </div>

                      <div className="ttd-box">
                        <span><br />Tutor Pembimbing / Wali Kelas</span>
                        <span className="ttd-line">................................................</span>
                      </div>

                      <div className="ttd-box">
                        <span>
                          Sumedang, {new Date().getFullYear()}<br />
                          <strong>Kepala PKBM Bina Mandiri</strong>
                        </span>
                        <div style={{ margin: '4px 0' }}>
                          <img
                            src="/ttd.png"
                            alt="Tanda Tangan"
                            style={{ height: 48, filter: 'invert(1) grayscale(1)', opacity: 0.85 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <span className="ttd-line">Indrayani, S.S.,M.Pd.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
