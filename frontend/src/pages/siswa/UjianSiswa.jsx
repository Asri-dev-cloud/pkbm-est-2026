import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { SiswaAPI, UjianAPI } from '../../services/api.js';

function UjianSiswa() {
  const user = JSON.parse(localStorage.getItem('pkbm_user') || '{}');

  const [profil, setProfil] = useState(null);
  const [mode, setMode] = useState('daftar');
  const [paketList, setPaketList] = useState([]);
  const [pesertaUjian, setPesertaUjian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sesi, setSesi] = useState(null);
  const [soalIndex, setSoalIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hasilAkhir, setHasilAkhir] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const profilRes = await SiswaAPI.getProfilSaya();
        const profilSaya = profilRes.data.data || null;
        setProfil(profilSaya);

        if (!profilSaya?.rombel_id) {
          setPaketList([]);
          return;
        }

        try {
          const pesertaRes = await UjianAPI.getPesertaUjianSaya();
          setPesertaUjian(pesertaRes.data.data || null);
        } catch {
          setPesertaUjian(null);
        }

        localStorage.setItem('pkbm_user', JSON.stringify({
          ...user,
          rombel_id: profilSaya.rombel_id,
          nama_rombel: profilSaya.nama_rombel,
        }));

        const paketRes = await UjianAPI.getPaketByRombel(profilSaya.rombel_id);
        setPaketList(paketRes.data.data || []);
      } catch {
        setError('Gagal memuat daftar ujian.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitUjian = useCallback(async () => {
    if (!sesi?.id || submitting) return;
    setSubmitting(true);
    try {
      const res = await UjianAPI.submitUjian(sesi.id);
      setHasilAkhir(res.data.data);
      setMode('selesai');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal submit ujian.');
    } finally {
      setSubmitting(false);
    }
  }, [sesi, submitting]);

  useEffect(() => {
    if (mode !== 'kerjakan' || sisaWaktu <= 0) return;

    const tick = setInterval(() => {
      setSisaWaktu((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          handleSubmitUjian();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [mode, sisaWaktu, handleSubmitUjian]);

  const handleMulaiUjian = async (paketId, durasiMenit) => {
    try {
      const res = await UjianAPI.mulaiUjian(paketId);
      const data = res.data.data;
      setSesi(data);
      setJawaban(data.jawaban || {});
      setSoalIndex(0);
      setSisaWaktu(Number(data.durasi_menit || durasiMenit || 0) * 60);
      setMode('kerjakan');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memulai ujian.');
    }
  };

  const handleJawab = async (soalId, jawab) => {
    setJawaban((prev) => ({ ...prev, [soalId]: jawab }));
    try {
      await UjianAPI.simpanJawaban(sesi.id, { soal_id: soalId, jawaban: jawab });
    } catch {
      // Simpan lokal dulu jika request gagal.
    }
  };

  const formatTimer = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const warnaTimer = sisaWaktu > 300 ? 'var(--color-success)'
    : sisaWaktu > 60 ? 'var(--color-warning)'
      : 'var(--color-danger)';

  if (mode === 'daftar') {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', paddingTop: '0.5rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  background: '#5CB8FF',
                  color: '#0F172A',
                  fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '4px 14px 5px',
                  borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
                  display: 'inline-block',
                  transform: 'rotate(-1.5deg)'
                }}>
                  CBT ASESMEN ONLINE
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '2.15rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Ujian Online
              </h1>
              <p style={{ color: '#64748B', marginTop: 6, fontSize: '0.96rem' }}>
                Pilih dan kerjakan paket asesmen aktif{profil?.nama_rombel ? ` untuk ${profil.nama_rombel}` : ''}.
              </p>
            </div>

            {pesertaUjian && (
              <div style={{ marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.4rem 1.6rem', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>Status Administrasi Ujian</div>
                    <div style={{ color: '#64748B', fontSize: '0.86rem' }}>
                      {pesertaUjian.nama_periode} • {String(pesertaUjian.jenis_ujian || '').toUpperCase()} {pesertaUjian.semester}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge ${badgePembayaranPeserta(pesertaUjian.status_pembayaran)}`}>
                      Pembayaran: {formatBadgeLabel(pesertaUjian.status_pembayaran)}
                    </span>
                    <span className={`badge ${pesertaUjian.status_kelayakan === 'layak' ? 'badge-success' : 'badge-warning'}`}>
                      Kelayakan: {formatBadgeLabel(pesertaUjian.status_kelayakan)}
                    </span>
                    {pesertaUjian.kartu_ujian_url && (
                      <a
                        href={pesertaUjian.kartu_ujian_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#5CB8FF',
                          color: '#0F172A',
                          padding: '7px 16px',
                          borderRadius: '9999px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(92, 184, 255, 0.25)'
                        }}
                      >
                        <i className="bi bi-file-earmark-pdf"></i> Kartu Ujian
                      </a>
                    )}
                  </div>
                </div>
                {pesertaUjian.status_kelayakan !== 'layak' && (
                  <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                    <i className="bi bi-exclamation-circle-fill"></i>
                    <span>
                      Anda belum dapat mengikuti ujian sebelum pembayaran diverifikasi dan status Anda dinyatakan layak oleh Admin TU.
                    </span>
                  </div>
                )}
                {pesertaUjian.status_kelayakan === 'layak' && !pesertaUjian.kartu_ujian_url && (
                  <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                    <i className="bi bi-info-circle-fill"></i>
                    <span>
                      Anda sudah layak mengikuti ujian. Kartu ujian PDF akan muncul di sini setelah dibuat oleh Admin TU.
                    </span>
                  </div>
                )}
              </div>
            )}

            {loading && <div className="loading-container"><div className="spinner"></div></div>}
            {!loading && error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

            {!loading && !error && (
              paketList.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '3rem 2rem', textAlign: 'center' }}>
                  <div className="empty-state">
                    <i className="bi bi-clipboard" style={{ fontSize: '3rem', color: '#CBD5E1' }}></i>
                    <h3 style={{ marginTop: '1rem', fontWeight: 800 }}>Belum Ada Ujian</h3>
                    <p style={{ color: '#64748B' }}>Tutor belum membuat paket ujian aktif untuk rombel Anda.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {paketList.map((paket) => (
                    <div
                      key={paket.id}
                      style={{
                        background: 'white',
                        borderRadius: '20px',
                        border: '1px solid #E2E8F0',
                        padding: '1.4rem 1.6rem',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(92, 184, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(92, 184, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.02)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '16px', flexShrink: 0,
                          background: paket.sesi_saya ? '#D1FAE5' : '#EBF6FF',
                          color: paket.sesi_saya ? '#059669' : '#0284C7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                        }}>
                          <i className={`bi ${paket.sesi_saya ? 'bi-patch-check-fill' : 'bi-file-earmark-text'}`}></i>
                        </div>

                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A' }}>{paket.judul}</span>
                            <span className={`badge ${paket.sumber_ujian === 'google_form' ? 'badge-warning' : 'badge-success'}`}>
                              {paket.sumber_ujian === 'google_form' ? 'Google Form' : 'Internal'}
                            </span>
                            {paket.sesi_saya && (
                              <span style={{
                                background: '#D1FAE5',
                                color: '#065F46',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '9999px'
                              }}>
                                {paket.sesi_saya.nilai_total != null
                                  ? `Nilai: ${paket.sesi_saya.nilai_total}`
                                  : 'Sudah Dikerjakan'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                            <span><i className="bi bi-question-circle"></i> {paket.jumlah_soal} soal</span>
                            <span><i className="bi bi-clock"></i> {paket.durasi_menit} menit</span>
                            {paket.jenis && <span><i className="bi bi-tag"></i> {paket.jenis.toUpperCase()}</span>}
                            {paket.nama_mapel && <span><i className="bi bi-book"></i> {paket.nama_mapel}</span>}
                          </div>
                        </div>

                        {paket.sesi_saya ? (
                          <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <i className="bi bi-check-circle-fill"></i> Selesai
                          </span>
                        ) : pesertaUjian && pesertaUjian.status_kelayakan !== 'layak' ? (
                          <button className="btn btn-secondary" style={{ flexShrink: 0, borderRadius: '9999px' }} disabled title="Selesaikan administrasi ujian terlebih dahulu">
                            <i className="bi bi-lock-fill"></i> Terkunci
                          </button>
                        ) : paket.sumber_ujian === 'google_form' ? (
                          <a
                            style={{
                              flexShrink: 0,
                              background: '#5CB8FF',
                              color: '#0F172A',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              padding: '10px 22px',
                              borderRadius: '9999px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 4px 14px rgba(92, 184, 255, 0.28)'
                            }}
                            href={paket.link_google_form}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-box-arrow-up-right"></i> Buka Form
                          </a>
                        ) : (
                          <button
                            style={{
                              flexShrink: 0,
                              background: '#5CB8FF',
                              color: '#0F172A',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              padding: '10px 24px',
                              borderRadius: '9999px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 4px 14px rgba(92, 184, 255, 0.28)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#3A9BF0';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#5CB8FF';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onClick={() => {
                              if (window.confirm(`Mulai ujian "${paket.judul}"?\nDurasi: ${paket.durasi_menit} menit.\n\nPastikan koneksi internet Anda stabil.`)) {
                                handleMulaiUjian(paket.id, paket.durasi_menit);
                              }
                            }}
                          >
                            <i className="bi bi-play-fill" style={{ fontSize: '1.1rem' }}></i> Mulai Ujian
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'kerjakan' && sesi) {
    const soalList = sesi.soal || [];
    const soalAktif = soalList[soalIndex];
    const totalSoal = soalList.length;
    const sudahJawab = Object.keys(jawaban).filter((key) => {
      const nilai = jawaban[key];
      return nilai !== undefined && nilai !== null && String(nilai).trim() !== '';
    }).length;

    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'white', borderBottom: '1px solid #E2E8F0',
          padding: '0.85rem 2rem',
          display: 'flex', alignItems: 'center', gap: '1.25rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}>
          <span style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', flex: 1 }}>
            {sesi.judul || 'Ujian Sedang Berlangsung'}
          </span>

          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700 }}>
            <strong style={{ color: '#0F172A' }}>{sudahJawab}</strong> dari {totalSoal} dijawab
          </span>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: sisaWaktu <= 60 ? '#FEE2E2' : '#EBF6FF',
            color: sisaWaktu <= 60 ? '#EF4444' : '#0284C7',
            padding: '0.45rem 1rem', borderRadius: '9999px',
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 900, fontSize: '1rem',
            border: `1.5px solid ${sisaWaktu <= 60 ? '#FCA5A5' : '#5CB8FF'}`
          }}>
            <i className="bi bi-clock-fill"></i>
            {formatTimer(sisaWaktu)}
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 760, margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: '1.5rem' }}>
            {soalList.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSoalIndex(index)}
                style={{
                  width: 36, height: 36, borderRadius: '10px',
                  border: `2px solid ${index === soalIndex ? '#5CB8FF' : jawaban[item.id] ? '#10B981' : '#E2E8F0'}`,
                  background: index === soalIndex ? '#5CB8FF' : jawaban[item.id] ? '#D1FAE5' : 'white',
                  color: index === soalIndex ? '#0F172A' : jawaban[item.id] ? '#065F46' : '#475569',
                  fontWeight: 800, fontSize: '0.82rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: index === soalIndex ? '0 4px 10px rgba(92, 184, 255, 0.35)' : 'none'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {soalAktif && (
            <div style={{ background: 'white', borderRadius: '22px', border: '1px solid #E2E8F0', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                    Soal {soalIndex + 1} dari {totalSoal}
                  </span>
                  <span style={{ background: '#EBF6FF', color: '#0284C7', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {soalAktif.tipe === 'essay' ? 'Uraian' : 'Pilihan Ganda'}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1E293B', lineHeight: 1.7, margin: 0 }}>
                  {soalAktif.pertanyaan}
                </p>
              </div>

              {soalAktif.tipe === 'pilihan_ganda' && soalAktif.pilihan?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {soalAktif.pilihan.map((opsi, index) => {
                    const huruf = opsi.kunci || 'ABCDE'[index];
                    const dipilih = jawaban[soalAktif.id] === huruf;
                    return (
                      <button
                        key={huruf}
                        onClick={() => handleJawab(soalAktif.id, huruf)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.85rem',
                          padding: '0.9rem 1.15rem', borderRadius: '14px',
                          border: `2px solid ${dipilih ? '#5CB8FF' : '#E2E8F0'}`,
                          background: dipilih ? '#EBF6FF' : 'white',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s', fontSize: '0.92rem',
                          color: dipilih ? '#0F172A' : '#334155',
                          fontWeight: dipilih ? 700 : 500
                        }}
                      >
                        <span style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: dipilih ? '#5CB8FF' : '#F1F5F9',
                          color: dipilih ? '#0F172A' : '#64748B',
                          fontWeight: 900, fontSize: '0.82rem',
                        }}>
                          {huruf}
                        </span>
                        <span>{opsi.teks || opsi}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {soalAktif.tipe === 'essay' && (
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder="Tulis uraian jawaban Anda di sini secara lengkap..."
                  value={jawaban[soalAktif.id] || ''}
                  onChange={(e) => handleJawab(soalAktif.id, e.target.value)}
                  style={{ resize: 'vertical', borderRadius: '14px', padding: '1rem', border: '1.5px solid #CBD5E1', fontSize: '0.92rem' }}
                />
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                padding: '9px 20px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: soalIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: soalIndex === 0 ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={() => setSoalIndex((index) => Math.max(0, index - 1))}
              disabled={soalIndex === 0}
            >
              <i className="bi bi-arrow-left"></i> Sebelumnya
            </button>

            {soalIndex < totalSoal - 1 ? (
              <button
                style={{
                  background: '#5CB8FF',
                  color: '#0F172A',
                  border: 'none',
                  padding: '9px 22px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(92, 184, 255, 0.28)'
                }}
                onClick={() => setSoalIndex((index) => Math.min(totalSoal - 1, index + 1))}
              >
                Berikutnya <i className="bi bi-arrow-right"></i>
              </button>
            ) : (
              <button
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
                onClick={() => {
                  const belum = totalSoal - sudahJawab;
                  if (belum > 0 && !window.confirm(`Masih ada ${belum} soal yang belum dijawab. Submit sekarang?`)) {
                    return;
                  }
                  handleSubmitUjian();
                }}
                disabled={submitting}
              >
                {submitting ? <><span className="spinner-sm"></span> Menyimpan...</> : <><i className="bi bi-send-fill"></i> Submit Ujian</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'selesai') {
    const nilai = hasilAkhir?.nilai_akhir ?? hasilAkhir?.nilai_total;
    const isLulus = hasilAkhir?.is_lulus;
    const lulus = isLulus == null ? nilai != null && nilai >= 70 : Number(isLulus) === 1;

    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <main className="app-main">
          <div className="app-content" style={{ maxWidth: 560, margin: '2rem auto' }}>
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: lulus ? '#D1FAE5' : '#FEE2E2',
                color: lulus ? '#059669' : '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', margin: '0 auto 1.5rem',
              }}>
                <i className={`bi ${lulus ? 'bi-award-fill' : 'bi-shield-exclamation'}`}></i>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 900, fontSize: '1.75rem', color: '#0F172A', marginBottom: '0.5rem' }}>
                Ujian Selesai!
              </h2>
              <p style={{ color: '#64748B', marginBottom: '2rem', fontSize: '0.94rem' }}>
                Jawaban Anda telah berhasil disimpan ke database.
              </p>

              {nilai != null && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nilai Akhir Anda</p>
                  <div style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontSize: '4.5rem', fontWeight: 900, color: lulus ? '#059669' : '#EF4444', lineHeight: 1 }}>
                    {nilai}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span style={{
                      background: lulus ? '#D1FAE5' : '#FEE2E2',
                      color: lulus ? '#065F46' : '#991B1B',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      padding: '5px 14px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <i className={`bi ${lulus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                      <span>{lulus ? 'Lulus KKM' : 'Belum mencapai KKM'}</span>
                    </span>
                  </div>
                </div>
              )}

              {nilai == null && (
                <div className="alert alert-info" style={{ marginBottom: '1.75rem', borderRadius: '12px' }}>
                  <i className="bi bi-info-circle-fill"></i>
                  <span>Nilai akan muncul setelah Tutor selesai mengoreksi soal uraian.</span>
                </div>
              )}

              <button
                style={{
                  background: '#5CB8FF',
                  color: '#0F172A',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(92, 184, 255, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3A9BF0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#5CB8FF';
                }}
                onClick={() => { setMode('daftar'); setHasilAkhir(null); }}
              >
                <i className="bi bi-arrow-left"></i> Kembali ke Daftar Ujian
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

function badgePembayaranPeserta(status) {
  const map = {
    belum_bayar: 'badge-warning',
    menunggu_verifikasi: 'badge-info',
    ditolak: 'badge-danger',
    lunas: 'badge-success',
  };
  return map[status] || 'badge-neutral';
}

function formatBadgeLabel(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default UjianSiswa;
