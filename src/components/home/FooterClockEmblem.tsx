"use client";

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => { };
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

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

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Fast continuous sweeping angles (degrees)
  const [angles, setAngles] = useState({
    fastSeconds: 0,
    cyan: 45,
    amber: 120,
    magenta: 210,
    ringClockwise: 0,
    ringCounter: 0,
    p1: 0,
    p2: 90,
    p3: 180,
    p4: 270,
  });

  const [formattedTime, setFormattedTime] = useState("12:00:00 IST");

  // Fast continuous dynamic clock animation using requestAnimationFrame
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;
    let startTime: number | null = null;

    const animateClock = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Real-time IST string for digital readout
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 3600000 * 5.5);
      const hh = String(istTime.getHours()).padStart(2, "0");
      const mm = String(istTime.getMinutes()).padStart(2, "0");
      const ss = String(istTime.getSeconds()).padStart(2, "0");
      setFormattedTime(`${hh}:${mm}:${ss} IST`);

      // Dynamic FAST high-energy sweeps:
      // - Fast seconds needle: 1 full 360 deg spin every 3.2s
      const fastSeconds = (elapsed / 3200) * 360;
      // - Electric Cyan sweep: 1 full spin every 7.5s
      const cyan = (elapsed / 7500) * 360;
      // - Solar Amber sweep: 1 full spin every 16.0s
      const amber = (elapsed / 16000) * 360;
      // - Neon Magenta laser hand: 1 full spin every 2.4s
      const magenta = (elapsed / 2400) * 360;

      // - Rotating technical dials
      const ringClockwise = (elapsed / 22000) * 360;
      const ringCounter = -(elapsed / 16000) * 360;

      // - Fast orbiting colorful photon satellites:
      const p1 = (elapsed / 2600) * 360;      // Amber: r=148, clockwise 2.6s
      const p2 = -(elapsed / 1900) * 360;     // Cyan: r=130, counter 1.9s
      const p3 = (elapsed / 1400) * 360;      // Magenta: r=114, clockwise 1.4s
      const p4 = -(elapsed / 2100) * 360;     // Emerald: r=96, counter 2.1s

      setAngles({
        fastSeconds: fastSeconds % 360,
        cyan: cyan % 360,
        amber: amber % 360,
        magenta: magenta % 360,
        ringClockwise: ringClockwise % 360,
        ringCounter: ringCounter % 360,
        p1: p1 % 360,
        p2: p2 % 360,
        p3: p3 % 360,
        p4: p4 % 360,
      });

      rafId = requestAnimationFrame(animateClock);
    };

    rafId = requestAnimationFrame(animateClock);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  // Interactive 3D tilt tracking
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

  // Compute position of orbiting particle
  const getOrbitPos = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: 180 + radius * Math.cos(rad),
      y: 180 + radius * Math.sin(rad),
    };
  };

  const orbAmber = getOrbitPos(angles.p1, 148);
  const orbCyan = getOrbitPos(angles.p2, 130);
  const orbMagenta = getOrbitPos(angles.p3, 114);
  const orbEmerald = getOrbitPos(angles.p4, 96);

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
      className={`relative select-none ${compact
        ? `flex flex-col items-start justify-start py-1 overflow-visible ${className}`
        : `w-full flex flex-col items-center justify-center py-10 overflow-hidden ${className}`
        }`}
    >
      {/* ================================================================= */}
      {/* 1. FAST VIBRANT CHROMATIC AURORA BEAMS & CONIC HALOS               */}
      {/* ================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-visible">
        {/* Fast Spinning Multi-Color Conic Aura (Clockwise) */}
        <div
          className={`absolute rounded-full transition-opacity duration-700 ${compact ? "w-[240px] h-[240px] blur-[36px]" : "w-[380px] h-[380px] blur-[50px]"
            }`}
          style={{
            background:
              "conic-gradient(from 0deg, #F59E0B 0%, #EC4899 22%, #8B5CF6 44%, #06B6D4 66%, #10B981 85%, #F59E0B 100%)",
            opacity: isHovered ? 0.75 : 0.5,
            animation: "spin 5s linear infinite",
          }}
        />

        {/* Counter-Spinning Chromatic Secondary Halo */}
        <div
          className={`absolute rounded-full transition-opacity duration-700 ${compact ? "w-[260px] h-[260px] blur-[42px]" : "w-[420px] h-[420px] blur-[60px]"
            }`}
          style={{
            background:
              "conic-gradient(from 180deg, #06B6D4 0%, #8B5CF6 25%, #EC4899 50%, #F59E0B 75%, #10B981 100%)",
            opacity: isHovered ? 0.6 : 0.4,
            animation: "spin 8s linear infinite reverse",
          }}
        />

        {/* Ambient Radial Core Light */}
        <div
          className={`absolute rounded-full ${compact ? "w-[190px] h-[190px] blur-[24px]" : "w-[300px] h-[300px] blur-[32px]"
            }`}
          style={{
            background:
              "radial-gradient(circle at center, rgba(245, 158, 11, 0.28) 0%, rgba(6, 182, 212, 0.2) 40%, rgba(236, 72, 153, 0.15) 70%, transparent 85%)",
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
            ? "w-[240px] h-[240px] sm:w-[270px] sm:h-[270px]"
            : "w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]"
        }`}
        style={{
          transform: reducedMotion
            ? "none"
            : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.04 : 1
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

            {/* Radiant Ambient Gold Backlight for Centered Logo */}
            <radialGradient id="center-pod-gold-ambient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.28)" />
              <stop offset="45%" stopColor="rgba(217, 119, 36, 0.14)" />
              <stop offset="80%" stopColor="#141312" />
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
          {/* ROTATING OUTER CALIBRATION DEGREES (FAST CLOCKWISE)           */}
          {/* ============================================================= */}
          <g transform={`rotate(${angles.ringClockwise} 180 180)`} opacity="0.65">
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
          {/* ROTATING INNER PRECISION TICKS (COUNTER-CLOCKWISE)            */}
          {/* ============================================================= */}
          <g transform={`rotate(${angles.ringCounter} 180 180)`} opacity="0.55">
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

          {/* 12 Hour Numerals */}
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
          {/* FAST SWEEPING COLORFUL HANDS & LUMINOUS ARCS                  */}
          {/* ============================================================= */}

          {/* 1. SOLAR AMBER SWEEP HAND (Primary, Warm Gold Glow) */}
          <g transform={`rotate(${angles.amber} 180 180)`}>
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

          {/* 2. ELECTRIC CYAN SWEEP HAND (Secondary, Neon Blue Glow) */}
          <g transform={`rotate(${angles.cyan} 180 180)`}>
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

          {/* 3. NEON MAGENTA LASER HAND (Fast ~2.4s rotation) */}
          <g transform={`rotate(${angles.magenta} 180 180)`}>
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

          {/* 4. ULTRA-FAST HAIRLINE SECOND NEEDLE (3.2s Revolution) */}
          <g transform={`rotate(${angles.fastSeconds} 180 180)`}>
            <line x1="180" y1="216" x2="180" y2="180" stroke="#F59E0B" strokeWidth="1.2" opacity="0.8" />
            <line x1="180" y1="180" x2="180" y2="30" stroke="#FFFFFF" strokeWidth="0.9" />
            <circle cx="180" cy="32" r="2.5" fill="#F59E0B" filter="url(#amber-glow)" />
          </g>

          {/* ============================================================= */}
          {/* FAST ORBITING COLORFUL PHOTON SATELLITES (PARTICLES)          */}
          {/* ============================================================= */}
          {/* Orbiting Solar Amber Photon */}
          <circle cx={orbAmber.x} cy={orbAmber.y} r="4.5" fill="#F59E0B" filter="url(#amber-glow)" />
          <circle cx={orbAmber.x} cy={orbAmber.y} r="2" fill="#FFFFFF" />

          {/* Orbiting Electric Cyan Photon */}
          <circle cx={orbCyan.x} cy={orbCyan.y} r="4" fill="#06B6D4" filter="url(#cyan-glow)" />
          <circle cx={orbCyan.x} cy={orbCyan.y} r="1.8" fill="#FFFFFF" />

          {/* Orbiting Neon Magenta Photon */}
          <circle cx={orbMagenta.x} cy={orbMagenta.y} r="3.5" fill="#EC4899" filter="url(#magenta-glow)" />

          {/* Orbiting Neon Emerald Photon */}
          <circle cx={orbEmerald.x} cy={orbEmerald.y} r="3" fill="#10B981" filter="url(#emerald-glow)" />

          {/* ============================================================= */}
          {/* CENTER CIRCULAR POD HOUSING THE ORIGINAL ARCHEON LOGO (EXPANDED) */}
          {/* ============================================================= */}
          <g className="filter drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)]">
            {/* Concentric Pulsing Chromatic Ring */}
            <circle
              cx="180"
              cy="180"
              r="82"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              className="animate-spin"
              style={{ animationDuration: "16s" }}
              opacity="0.75"
            />

            {/* Heavy Beveled Metallic Outer Rim (Expanded to r = 76) */}
            <circle
              cx="180"
              cy="180"
              r="76"
              fill="url(#center-glass-pod)"
              stroke="#D97724"
              strokeWidth="2.5"
            />

            {/* Radiant Ambient Gold Backlight for Maximum Luminance & Contrast */}
            <circle
              cx="180"
              cy="180"
              r="73"
              fill="url(#center-pod-gold-ambient)"
            />

            {/* Precision Gold Perimeter Bevel */}
            <circle
              cx="180"
              cy="180"
              r="74"
              fill="none"
              stroke="rgba(245, 158, 11, 0.45)"
              strokeWidth="1"
            />
            <circle
              cx="180"
              cy="180"
              r="71"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="0.8"
            />

            {/* =========================================================== */}
            {/* THE ORIGINAL ARCHEON BRAND LOGO (EXPANDED & RADIANT GOLD)   */}
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
                filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.5)) drop-shadow(0 2px 8px rgba(0,0,0,0.95))",
              }}
            />
          </g>
        </svg>
      </div>

      {/* ================================================================= */}
      {/* 3. TECHNICAL METADATA READOUT BADGE                               */}
      {/* ================================================================= */}
      <div
        className={`mt-4 flex flex-col items-center gap-1.5 transition-opacity duration-300 ${compact ? "items-start mt-3" : "items-center"
          }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06B6D4] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#F2F0EB]/90 font-medium">
            {formattedTime}
          </span>
        </div>

        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-[#C6A779]/85">
          NAGPUR STUDIO // 21.1458° N, 79.0882° E
        </p>
      </div>
    </div>
  );
}
