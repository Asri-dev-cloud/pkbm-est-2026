import { useState, useEffect, useRef } from "react";

/**
 * LedDisplayBoard.jsx
 * Slogan Marquee Wavy Ribbon PKBM Bina Mandiri: "Ramah Bakat, Kaya Karya"
 * Desain: Teks Mengikuti Lekukan Gelombang (Curved TextPath Marquee)
 * - Teks bergelombang secara organik mengikuti kontur gelombang pita (bukan lurus horizontal)
 * - Ukuran teks kompak, manis, rapi, dan berada tepat di tengah koridor pita gelombang
 * - Latar belakang: Putih Bersih Minimalis (#FFFFFF) dengan motif asli Batik Kawung Nusantara
 * - Garis wave atas dan bawah: Biru Gelap Tegas (#1E3A8A)
 * - Pemisah slogan: Ikon perisai emas PKBM (⬟) bersinar hangat
 * - Animasi: 60fps hardware-accelerated seamless marquee di sepanjang kurva SVG
 */

export default function LedDisplayBoard() {
  const containerRef = useRef(null);
  const textPathRef = useRef(null);
  const offsetRef = useRef(0);
  const animIdRef = useRef(null);
  const unitWidthRef = useRef(330);

  const [isPaused, setIsPaused] = useState(false);
  const [dims, setDims] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: 96
  });

  // Palet Warna Khas PKBM Bina Mandiri
  const BLUE_COLOR = "#1D4ED8";       // Deep Royal Blue
  const YELLOW_COLOR = "#D97706";     // Warm Sun Amber Gold
  const DARK_BLUE_WAVE = "#1E3A8A";   // Navy Blue Kontras

  // Pantau ukuran kontainer layar agar viewBox selalu 1:1 tanpa distorsi aspek rasio
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.round(rect.width) || window.innerWidth || 1440;
        const h = Math.round(rect.height) || 96;
        setDims({ width: w, height: h });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Hitung geometri gelombang proporsional terhadap ukuran layar
  const W = dims.width || 1440;
  const H = dims.height || 96;

  // Ketebalan pita (T) dan amplitudo gelombang (A) yang lembut & elegan
  const T = Math.round(Math.min(H * 0.52, 48));
  const A = Math.round(Math.min(H * 0.16, 14));
  const Ymid = Math.round(H * 0.44); // Posisi tengah pita
  const Ytop = Ymid - Math.round(T / 2);
  const Ybot = Ymid + Math.round(T / 2);

  // Kurva gelombang atas & bawah sepanjang lebar layar W
  const topWave = `M 0,${Ytop} C ${W * 0.19},${Ytop + A} ${W * 0.35},${Ytop - A} ${W * 0.5},${Ytop} C ${W * 0.69},${Ytop + A} ${W * 0.85},${Ytop - A} ${W},${Ytop}`;
  const botWave = `M 0,${Ybot} C ${W * 0.19},${Ybot + A} ${W * 0.35},${Ybot - A} ${W * 0.5},${Ybot} C ${W * 0.69},${Ybot + A} ${W * 0.85},${Ybot - A} ${W},${Ybot}`;
  const botWaveRev = `L ${W},${Ybot} C ${W * 0.85},${Ybot - A} ${W * 0.69},${Ybot + A} ${W * 0.5},${Ybot} C ${W * 0.35},${Ybot - A} ${W * 0.19},${Ybot + A} 0,${Ybot}`;
  const closedRibbon = `${topWave} ${botWaveRev} Z`;
  const bottomFill = `${botWave} L ${W},${H} L 0,${H} Z`;

  // Kurva lintasan teks 3-siklus (dari -W sampai +2W) agar teks bergelombang tanpa henti
  const cMid = (startX) => `C ${startX + W * 0.19},${Ymid + A} ${startX + W * 0.35},${Ymid - A} ${startX + W * 0.5},${Ymid} C ${startX + W * 0.69},${Ymid + A} ${startX + W * 0.85},${Ymid - A} ${startX + W},${Ymid}`;
  const centerTrack = `M ${-W},${Ymid} ${cMid(-W)} ${cMid(0)} ${cMid(W)}`;

  // Animasi marquee bergelombang menggunakan requestAnimationFrame (Mulus 60fps, Tanpa Beban Re-render)
  useEffect(() => {
    const speed = 0.82; // Kecepatan gerak nyaman dibaca

    const animate = () => {
      if (!isPaused && textPathRef.current) {
        offsetRef.current -= speed;
        // Reset offset seamless saat 1 unit slogan terlewati
        if (offsetRef.current <= -unitWidthRef.current) {
          offsetRef.current += unitWidthRef.current;
        }
        textPathRef.current.setAttribute("startOffset", `${offsetRef.current}px`);
      }
      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPaused]);

  // Template unit slogan berulang
  const REPEAT_COUNT = 18; // Menjamin teks terisi penuh di semua lebar layar (hingga 4K ultrawide)

  return (
    <section
      id="slogan-wavy-ribbon"
      ref={containerRef}
      aria-label="Running Text Slogan Resmi PKBM Bina Mandiri: Ramah Bakat, Kaya Karya"
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(72px, 8.8vw, 104px)",
        marginTop: "calc(-1 * clamp(24px, 3.2vw, 42px))",
        background: "transparent",
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        padding: 0,
        overflow: "hidden",
        zIndex: 10,
        cursor: "pointer",
        border: "none",
        outline: "none"
      }}
      onClick={() => setIsPaused(!isPaused)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      title="Klik atau arahkan kursor untuk menjeda / memutar running text"
    >
      <style>{`
        /* Font Signature Estetik Mengikuti Kurva Gelombang */
        .curved-slogan-text {
          font-family: 'Satisfy', 'Caveat', 'Courgette', cursive, sans-serif;
          font-size: clamp(15px, 1.45vw, 18px);
          font-weight: 600;
          letter-spacing: 0.03em;
          user-select: none;
        }

        /* Ikon Perisai Emas PKBM */
        .curved-logo-lamp {
          font-size: clamp(13px, 1.3vw, 16px);
          fill: #D97706;
          filter: drop-shadow(0 0 5px #FFFFFF) drop-shadow(0 1px 3px rgba(217, 119, 6, 0.45));
        }

        /* Teks Biru: Ramah Bakat, */
        .curved-text-blue {
          fill: ${BLUE_COLOR};
          filter: drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 14px #FFFFFF);
        }

        /* Teks Kuning Emas: Kaya Karya */
        .curved-text-yellow {
          fill: ${YELLOW_COLOR};
          filter: drop-shadow(0 0 6px #FFFFFF) drop-shadow(0 0 14px #FFFFFF);
        }
      `}</style>

      {/* ── SVG LAYER UTAMA: PITA BATIK & TEKS MENGIKUTI GELOMBANG SECARA REAL-TIME ── */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          border: "none",
          outline: "none"
        }}
      >
        <defs>
          {/* Poligon kliping pita bergelombang */}
          <clipPath id="ribbonClipMask">
            <path d={closedRibbon} />
          </clipPath>

          {/* Lintasan tengah gelombang untuk rute gerak teks */}
          <path id="centerTrackWave" d={centerTrack} fill="none" />

          {/* Motif Asli Batik Kawung Nusantara */}
          <pattern id="batikKawungSvgPattern" width="56" height="56" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#1E3A8A" strokeWidth="1.5">
              <circle cx="0" cy="0" r="20" />
              <circle cx="28" cy="0" r="20" />
              <circle cx="56" cy="0" r="20" />
              <circle cx="0" cy="28" r="20" />
              <circle cx="28" cy="28" r="20" />
              <circle cx="56" cy="28" r="20" />
              <circle cx="0" cy="56" r="20" />
              <circle cx="28" cy="56" r="20" />
              <circle cx="56" cy="56" r="20" />
              <circle cx="0" cy="0" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="28" cy="0" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="56" cy="0" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="0" cy="28" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="28" cy="28" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="56" cy="28" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="0" cy="56" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="28" cy="56" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="56" cy="56" r="11" strokeDasharray="1.5,2.5" />
              <circle cx="14" cy="14" r="2.8" fill="#D97706" stroke="none" />
              <circle cx="42" cy="14" r="2.8" fill="#D97706" stroke="none" />
              <circle cx="14" cy="42" r="2.8" fill="#D97706" stroke="none" />
              <circle cx="42" cy="42" r="2.8" fill="#D97706" stroke="none" />
              <circle cx="28" cy="28" r="2.2" fill="#1E3A8A" stroke="none" />
              <circle cx="0" cy="28" r="2.2" fill="#1E3A8A" stroke="none" />
              <circle cx="56" cy="28" r="2.2" fill="#1E3A8A" stroke="none" />
              <circle cx="28" cy="0" r="2.2" fill="#1E3A8A" stroke="none" />
              <circle cx="28" cy="56" r="2.2" fill="#1E3A8A" stroke="none" />
            </g>
          </pattern>
        </defs>

        {/* ── 1. DASAR PUTIH BERSIH PITA GELOMBANG ── */}
        <path d={closedRibbon} fill="#FFFFFF" />

        {/* ── 2. LAPISAN MOTIF BATIK KAWUNG NUSANTARA (MENYATU SEMPURNA MENGIKUTI LEKUKAN) ── */}
        <rect
          x="0"
          y="0"
          width={W}
          height={H}
          fill="url(#batikKawungSvgPattern)"
          opacity="0.40"
          clipPath="url(#ribbonClipMask)"
          pointerEvents="none"
        />

        {/* ── 3. LATAR PUTIH DI BAWAH PITA (MENYAMBUNG MULUS KE SECTION TUTORIAL) ── */}
        <path d={bottomFill} fill="#FFFFFF" />

        {/* ── 4. GARIS WAVE ATAS & BAWAH WARNA BIRU GELAP TEGAS ── */}
        <path
          d={topWave}
          stroke={DARK_BLUE_WAVE}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={botWave}
          stroke={DARK_BLUE_WAVE}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── 5. TEKS SLOGAN RUNNING MARQUEE MENGIKUTI LEKUKAN WAVE (CURVED TEXTPATH) ── */}
        <text className="curved-slogan-text" dominantBaseline="central">
          <textPath
            ref={textPathRef}
            href="#centerTrackWave"
            startOffset="0"
          >
            {Array.from({ length: REPEAT_COUNT }).map((_, idx) => (
              <tspan key={idx}>
                {/* Ikon Perisai Emas PKBM (⬟) */}
                <tspan className="curved-logo-lamp">⬟</tspan>
                <tspan>&nbsp;&nbsp;</tspan>

                {/* Ramah Bakat, */}
                <tspan className="curved-text-blue">Ramah Bakat,</tspan>
                <tspan>&nbsp;</tspan>

                {/* Kaya Karya */}
                <tspan className="curved-text-yellow">Kaya Karya</tspan>
                <tspan>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</tspan>
              </tspan>
            ))}
          </textPath>
        </text>
      </svg>
    </section>
  );
}
