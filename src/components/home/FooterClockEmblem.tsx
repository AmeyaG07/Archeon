"use client";

import React, { useRef, useState, useCallback } from "react";

interface FooterClockEmblemProps {
  compact?: boolean;
  className?: string;
}

export function FooterClockEmblem({
  compact = false,
  className = "",
}: FooterClockEmblemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Interactive 3D tilt tracking on mouse hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: -y * 14,
      y: x * 14,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // 12 Hour indices calculation (r = 135, cx = 180, cy = 180)
  const hourIndices = [
    { num: "12", deg: 0 },
    { num: "01", deg: 30 },
    { num: "02", deg: 60 },
    { num: "03", deg: 90 },
    { num: "04", deg: 120 },
    { num: "05", deg: 150 },
    { num: "06", deg: 180 },
    { num: "07", deg: 210 },
    { num: "08", deg: 240 },
    { num: "09", deg: 270 },
    { num: "10", deg: 300 },
    { num: "11", deg: 330 },
  ];

  return (
    <div
      className={`relative select-none bg-black ${
        compact
          ? `flex flex-col items-start justify-start py-1 overflow-visible ${className}`
          : `w-full flex flex-col items-center justify-center py-2 overflow-visible ${className}`
      }`}
    >
      {/* ================================================================= */}
      {/* 1. SEAMLESS SOLID BLACK AMBIENT BACKGROUND (MATCHES FOOTER #000)  */}
      {/* ================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
        {/* Subtle Warm Amber Core Glow blending seamlessly into pure black */}
        <div
          className={`absolute rounded-full ${
            compact ? "w-[180px] h-[180px] blur-[30px]" : "w-[240px] h-[240px] blur-[40px]"
          }`}
          style={{
            background:
              "radial-gradient(circle at center, rgba(198, 167, 121, 0.12) 0%, rgba(200, 98, 30, 0.05) 45%, transparent 75%)",
          }}
        />
      </div>

      {/* ================================================================= */}
      {/* 2. CIRCULAR TIMEPIECE CASING WITH 3D TILT                         */}
      {/* ================================================================= */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative transition-transform duration-200 ease-out cursor-pointer ${
          compact
            ? "w-[220px] h-[220px] sm:w-[240px] sm:h-[240px]"
            : "w-[240px] h-[240px] sm:w-[260px] sm:h-[260px]"
        }`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
            isHovered ? 1.04 : 1
          }, ${isHovered ? 1.04 : 1}, 1)`,
          transformStyle: "preserve-3d",
        }}
      >
        <svg
          viewBox="0 0 360 360"
          className="w-full h-full overflow-visible drop-shadow-[0_25px_65px_rgba(0,0,0,0.9)]"
          aria-label="ArcheOn Chronometer Emblem with Original Brand Logo"
          role="img"
        >
          <defs>
            {/* Metallic Outer Bezel */}
            <linearGradient id="outer-bezel-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5A554E" />
              <stop offset="25%" stopColor="#252422" />
              <stop offset="50%" stopColor="#141312" />
              <stop offset="75%" stopColor="#3A3732" />
              <stop offset="100%" stopColor="#554E45" />
            </linearGradient>

            {/* Specular Highlight Arc */}
            <linearGradient id="specular-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
              <stop offset="25%" stopColor="rgba(255, 255, 255, 0.12)" />
              <stop offset="65%" stopColor="rgba(255, 255, 255, 0.01)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.3)" />
            </linearGradient>

            {/* Dark Crystal Glass Disc */}
            <radialGradient id="dial-face-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#181615" />
              <stop offset="55%" stopColor="#100F0E" />
              <stop offset="88%" stopColor="#0A0A09" />
              <stop offset="100%" stopColor="#1E1B18" />
            </radialGradient>

            {/* Center Recessed Pod Gradient */}
            <radialGradient id="center-glass-pod" cx="42%" cy="40%" r="58%">
              <stop offset="0%" stopColor="#22201D" />
              <stop offset="45%" stopColor="#141312" />
              <stop offset="85%" stopColor="#0B0B0A" />
              <stop offset="100%" stopColor="#1F1C18" />
            </radialGradient>

            {/* Deep Onyx Neutral Glass Pod Gradient (Zero Golden Shade) */}
            <radialGradient id="center-pod-neutral-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#161514" />
              <stop offset="60%" stopColor="#100F0E" />
              <stop offset="100%" stopColor="#0B0B0A" />
            </radialGradient>

            {/* Circular Clip Path for Centering Original Logo (Expanded) */}
            <clipPath id="center-circle-logo-clip">
              <circle cx="180" cy="180" r="74" />
            </clipPath>

            {/* Colorful Glow Filters */}
            <filter id="amber-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#F59E0B" floodOpacity="0.95" />
            </filter>

            <filter id="cyan-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#06B6D4" floodOpacity="0.95" />
            </filter>

            <filter id="magenta-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EC4899" floodOpacity="0.95" />
            </filter>

            <filter id="emerald-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.95" />
            </filter>

            {/* Fast Sweeping Trailing Arc Gradients */}
            <linearGradient id="amber-arc-fade" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#D97724" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#B68A4A" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="cyan-arc-fade" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="magenta-arc-fade" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ============================================================= */}
          {/* BEZEL RIM & DIAL BACKGROUND                                   */}
          {/* ============================================================= */}
          {/* Outer Bezel Rim */}
          <circle cx="180" cy="180" r="174" fill="url(#outer-bezel-rim)" stroke="#111111" strokeWidth="2" />
          <circle cx="180" cy="180" r="171" fill="none" stroke="url(#specular-highlight)" strokeWidth="1.2" opacity="0.85" />
          {/* Dial Face */}
          <circle cx="180" cy="180" r="168" fill="url(#dial-face-bg)" stroke="#2C2A26" strokeWidth="1" />

          {/* Concentric Calibration Tracks */}
          <circle cx="180" cy="180" r="156" fill="none" stroke="rgba(245, 158, 11, 0.18)" strokeWidth="0.8" strokeDasharray="3 4" />
          <circle cx="180" cy="180" r="148" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.6" />
          <circle cx="180" cy="180" r="130" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="0.6" strokeDasharray="2 3" />
          <circle cx="180" cy="180" r="114" fill="none" stroke="rgba(236, 72, 153, 0.15)" strokeWidth="0.6" strokeDasharray="2 4" />
          <circle cx="180" cy="180" r="96" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.6" />

          {/* ============================================================= */}
          {/* ROTATING OUTER CALIBRATION DEGREES (CONTINUOUS CLOCKWISE)     */}
          {/* ============================================================= */}
          <g opacity="0.65">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 180 180"
              to="360 180 180"
              dur="22s"
              repeatCount="indefinite"
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={`deg-${deg}`} transform={`rotate(${deg} 180 180)`}>
                <line x1="180" y1="12" x2="180" y2="18" stroke="#F59E0B" strokeWidth="1.2" />
                <text x="180" y="24" textAnchor="middle" className="font-mono text-[5px] fill-[#F59E0B]/80 font-semibold tracking-wider">
                  {deg}°
                </text>
              </g>
            ))}
          </g>

          {/* ============================================================= */}
          {/* ROTATING INNER PRECISION TICKS (CONTINUOUS COUNTER-CLOCKWISE) */}
          {/* ============================================================= */}
          <g opacity="0.55">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 180 180"
              to="0 180 180"
              dur="16s"
              repeatCount="indefinite"
            />
            {Array.from({ length: 60 }).map((_, i) => (
              <line
                key={`tick-${i}`}
                x1="180"
                y1="28"
                x2="180"
                y2={i % 5 === 0 ? "35" : "31"}
                stroke={i % 5 === 0 ? "#06B6D4" : "rgba(255, 255, 255, 0.25)"}
                strokeWidth={i % 5 === 0 ? "1.2" : "0.6"}
                transform={`rotate(${i * 6} 180 180)`}
              />
            ))}
          </g>

          {/* 12 Hour Numerals (Static Dial Markers) */}
          {hourIndices.map(({ num, deg }) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x = 180 + 135 * Math.cos(rad);
            const y = 180 + 135 * Math.sin(rad);
            const isCardinal = ["12", "03", "06", "09"].includes(num);

            return (
              <text
                key={`num-${num}`}
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                className="font-mono text-[9px] font-semibold select-none"
                style={{
                  fill: isCardinal ? "#F2F0EB" : "#8A8780",
                  letterSpacing: "0.08em",
                }}
              >
                {num}
              </text>
            );
          })}

          {/* ============================================================= */}
          {/* CONTINUOUS SWEEPING COLORFUL HANDS & LUMINOUS ARCS            */}
          {/* (Native GPU-Accelerated 60/120fps Smooth Compositing)         */}
          {/* ============================================================= */}

          {/* 1. SOLAR AMBER SWEEP HAND (Primary, Warm Gold Glow, 16s Rev) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 180 180"
              to="360 180 180"
              dur="16s"
              repeatCount="indefinite"
            />
            {/* Trailing Amber Arc at r = 118 (~85 degrees sweep) */}
            <path
              d="M 180 62 A 118 118 0 0 0 86 110"
              fill="none"
              stroke="url(#amber-arc-fade)"
              strokeWidth="2.8"
              strokeLinecap="round"
              filter="url(#amber-glow)"
            />
            {/* Counterweight */}
            <circle cx="180" cy="206" r="5" fill="#D97724" opacity="0.85" />
            <line x1="180" y1="206" x2="180" y2="180" stroke="#D97724" strokeWidth="2.5" />
            {/* Tapered Needle */}
            <polygon points="178,180 182,180 180.8,68 179.2,68" fill="#F59E0B" filter="url(#amber-glow)" />
            {/* Diamond Arrowhead */}
            <polygon points="180,60 183.5,69 180,73 176.5,69" fill="#FBBF24" filter="url(#amber-glow)" />
          </g>

          {/* 2. ELECTRIC CYAN SWEEP HAND (Secondary, Neon Blue Glow, 7.5s Rev) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="45 180 180"
              to="405 180 180"
              dur="7.5s"
              repeatCount="indefinite"
            />
            {/* Trailing Cyan Arc at r = 138 (~75 degrees sweep) */}
            <path
              d="M 180 42 A 138 138 0 0 0 76 96"
              fill="none"
              stroke="url(#cyan-arc-fade)"
              strokeWidth="2.4"
              strokeLinecap="round"
              filter="url(#cyan-glow)"
            />
            {/* Cyan Counterweight */}
            <circle cx="180" cy="210" r="4" fill="#06B6D4" opacity="0.85" />
            <line x1="180" y1="210" x2="180" y2="180" stroke="#06B6D4" strokeWidth="2" />
            {/* Tapered Cyan Needle */}
            <polygon points="178.5,180 181.5,180 180.6,48 179.4,48" fill="#38BDF8" filter="url(#cyan-glow)" />
            {/* Triangle Tip */}
            <polygon points="180,40 183.5,49 180,52 176.5,49" fill="#06B6D4" filter="url(#cyan-glow)" />
          </g>

          {/* 3. NEON MAGENTA LASER HAND (Fast 2.4s Rotation) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="210 180 180"
              to="570 180 180"
              dur="2.4s"
              repeatCount="indefinite"
            />
            {/* Trailing Magenta Arc at r = 100 (~60 degrees sweep) */}
            <path
              d="M 180 80 A 100 100 0 0 0 110 110"
              fill="none"
              stroke="url(#magenta-arc-fade)"
              strokeWidth="1.8"
              strokeLinecap="round"
              filter="url(#magenta-glow)"
            />
            <line x1="180" y1="180" x2="180" y2="82" stroke="#EC4899" strokeWidth="1.4" filter="url(#magenta-glow)" />
            <circle cx="180" cy="82" r="2.5" fill="#F472B6" />
          </g>

          {/* 4. ULTRA-FAST HAIRLINE SECONDS NEEDLE (3.2s Revolution) */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 180 180"
              to="360 180 180"
              dur="3.2s"
              repeatCount="indefinite"
            />
            <line x1="180" y1="216" x2="180" y2="180" stroke="#F59E0B" strokeWidth="1.2" opacity="0.8" />
            <line x1="180" y1="180" x2="180" y2="30" stroke="#FFFFFF" strokeWidth="0.9" />
            <circle cx="180" cy="32" r="2.5" fill="#F59E0B" filter="url(#amber-glow)" />
          </g>

          {/* ============================================================= */}
          {/* CONTINUOUS ORBITING COLORFUL PHOTON SATELLITES (PARTICLES)   */}
          {/* ============================================================= */}

          {/* 1. Orbiting Solar Amber Photon: r = 148, clockwise 2.6s */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 180 180"
              to="360 180 180"
              dur="2.6s"
              repeatCount="indefinite"
            />
            <circle cx="180" cy={180 - 148} r="4.5" fill="#F59E0B" filter="url(#amber-glow)" />
            <circle cx="180" cy={180 - 148} r="2" fill="#FFFFFF" />
          </g>

          {/* 2. Orbiting Electric Cyan Photon: r = 130, counter-clockwise 1.9s */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 180 180"
              to="0 180 180"
              dur="1.9s"
              repeatCount="indefinite"
            />
            <circle cx="180" cy={180 - 130} r="4" fill="#06B6D4" filter="url(#cyan-glow)" />
            <circle cx="180" cy={180 - 130} r="1.8" fill="#FFFFFF" />
          </g>

          {/* 3. Orbiting Neon Magenta Photon: r = 114, clockwise 1.4s */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 180 180"
              to="360 180 180"
              dur="1.4s"
              repeatCount="indefinite"
            />
            <circle cx="180" cy={180 - 114} r="3.5" fill="#EC4899" filter="url(#magenta-glow)" />
          </g>

          {/* 4. Orbiting Neon Emerald Photon: r = 96, counter-clockwise 2.1s */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 180 180"
              to="0 180 180"
              dur="2.1s"
              repeatCount="indefinite"
            />
            <circle cx="180" cy={180 - 96} r="3" fill="#10B981" filter="url(#emerald-glow)" />
          </g>

          {/* ============================================================= */}
          {/* CENTER CIRCULAR POD HOUSING THE ORIGINAL ARCHEON LOGO (CLEAN) */}
          {/* ============================================================= */}
          <g className="filter drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)]">
            {/* Concentric Rotating Chromatic Ring */}
            <circle
              cx="180"
              cy="180"
              r="82"
              fill="none"
              stroke="#B68A4A"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.45"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 180 180"
                to="360 180 180"
                dur="16s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Precision Beveled Warm Amber Outer Rim */}
            <circle
              cx="180"
              cy="180"
              r="76"
              fill="url(#dial-face-bg)"
              stroke="#D97724"
              strokeWidth="2.2"
            />

            {/* Clean Seamless Dark Obsidian Disc - Exactly Matches Dial Face */}
            <circle
              cx="180"
              cy="180"
              r="74"
              fill="url(#dial-face-bg)"
            />

            {/* Precision Hairline Bevel Rings */}
            <circle
              cx="180"
              cy="180"
              r="74"
              fill="none"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="0.8"
            />
            <circle
              cx="180"
              cy="180"
              r="71"
              fill="none"
              stroke="rgba(0, 0, 0, 0.6)"
              strokeWidth="0.8"
            />

            {/* =========================================================== */}
            {/* THE ORIGINAL ARCHEON BRAND LOGO (CLEAN TRUE COLORS)         */}
            {/* =========================================================== */}
            <image
              href="/brand-assets/logo-clock-center.png"
              x="106"
              y="106"
              width="148"
              height="148"
              preserveAspectRatio="xMidYMid meet"
              clipPath="url(#center-circle-logo-clip)"
              style={{
                mixBlendMode: "screen",
              }}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
