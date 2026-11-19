"use client";

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
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

export function FooterClockEmblem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Continuous hand angles (degrees)
  const [angles, setAngles] = useState({
    amber: 304, // default elegant aesthetic pose (~10:08)
    blue: 50,
    seconds: 180,
  });

  const [formattedTime, setFormattedTime] = useState("12:00:00 IST");

  // Smooth continuous sweeping animation using requestAnimationFrame
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;

    const animateClock = () => {
      const now = new Date();

      // Compute Indian Standard Time (IST = UTC + 5h 30m)
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 3600000 * 5.5);

      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const seconds = istTime.getSeconds();
      const ms = istTime.getMilliseconds();

      // Formatted digital time string
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");
      setFormattedTime(`${hh}:${mm}:${ss} IST`);

      // Smooth fractional analog rotations
      const secFraction = seconds + ms / 1000;
      const minFraction = minutes + secFraction / 60;
      const hourFraction = (hours % 12) + minFraction / 60;

      // Seconds: 360 deg in 60s -> 6 deg/sec
      const secAngle = secFraction * 6;
      // Blue (minute/harmonic): 6 deg/min
      const blueAngle = minFraction * 6;
      // Amber (hour/primary): 30 deg/hour
      const amberAngle = hourFraction * 30;

      setAngles({
        amber: amberAngle,
        blue: blueAngle,
        seconds: secAngle,
      });

      rafId = requestAnimationFrame(animateClock);
    };

    rafId = requestAnimationFrame(animateClock);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  // Interactive 3D tilt tracking on desktop
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Max 10 degrees tilt
    setTilt({
      x: -y * 10,
      y: x * 10,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // 12 Hour indices calculation (r = 118, cx = 160, cy = 160)
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
    <div className="relative w-full flex flex-col items-center justify-center py-12 select-none overflow-hidden">
      {/* ================================================================= */}
      {/* 1. DIAGONAL AMBIENT LIGHT BEAMS (BEHIND THE CIRCULAR DIAL)         */}
      {/* ================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        {/* Upper-Left Beam: Warm Amber/Bronze (rgba(217, 119, 36, 0.35)) */}
        <div
          className="absolute w-[360px] sm:w-[460px] h-[75px] -translate-x-[45%] -translate-y-[45%] rotate-[-42deg] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(217, 119, 36, 0.38) 0%, rgba(182, 138, 74, 0.16) 55%, transparent 100%)",
            filter: "blur(42px)",
            opacity: isHovered ? 0.95 : 0.75,
            transition: "opacity 0.6s ease",
          }}
        />

        {/* Lower-Right Beam: Cool Electric/Sapphire Blue (rgba(59, 130, 246, 0.35)) */}
        <div
          className="absolute w-[360px] sm:w-[460px] h-[75px] translate-x-[45%] translate-y-[45%] rotate-[138deg] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(59, 130, 246, 0.36) 0%, rgba(96, 165, 250, 0.14) 55%, transparent 100%)",
            filter: "blur(42px)",
            opacity: isHovered ? 0.95 : 0.75,
            transition: "opacity 0.6s ease",
          }}
        />

        {/* Center Ambient Core Glow */}
        <div
          className="absolute w-[280px] h-[280px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(217,119,36,0.18) 0%, rgba(59,130,246,0.12) 45%, transparent 72%)",
            filter: "blur(28px)",
          }}
        />
      </div>

      {/* ================================================================= */}
      {/* 2. METALLIC CIRCULAR BEZEL & CLOCK DIAL (GPU-ACCELERATED)         */}
      {/* ================================================================= */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] transition-transform duration-200 ease-out"
        style={{
          transform: reducedMotion
            ? "none"
            : `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
                isHovered ? 1.025 : 1
              }, ${isHovered ? 1.025 : 1}, 1)`,
          transformStyle: "preserve-3d",
        }}
      >
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full overflow-visible drop-shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
          aria-label="ArcheOn Studio Chronometer"
          role="img"
        >
          <defs>
            {/* Outer Bezel Specular Metallic Gradient */}
            <linearGradient
              id="outer-bezel-rim"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#4A4742" />
              <stop offset="35%" stopColor="#1E1E1E" />
              <stop offset="70%" stopColor="#121212" />
              <stop offset="100%" stopColor="#383530" />
            </linearGradient>

            {/* Specular Highlight Arc */}
            <linearGradient
              id="specular-highlight"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="30%" stopColor="rgba(255, 255, 255, 0.12)" />
              <stop offset="65%" stopColor="rgba(255, 255, 255, 0.01)" />
              <stop offset="100%" stopColor="rgba(217, 119, 36, 0.25)" />
            </linearGradient>

            {/* Dial Face Dark Texture Gradient */}
            <radialGradient
              id="dial-face-bg"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor="#181716" />
              <stop offset="70%" stopColor="#111111" />
              <stop offset="100%" stopColor="#0B0B0B" />
            </radialGradient>

            {/* Recessed Center Dark-Glass Capsule */}
            <radialGradient
              id="center-glass-pod"
              cx="45%"
              cy="45%"
              r="60%"
              fx="45%"
              fy="45%"
            >
              <stop offset="0%" stopColor="#252422" />
              <stop offset="65%" stopColor="#121211" />
              <stop offset="100%" stopColor="#080808" />
            </radialGradient>

            {/* Amber Hand Glow Filter */}
            <filter
              id="amber-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Sapphire Blue Hand Glow Filter */}
            <filter id="blue-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Amber Trailing Arc Gradient */}
            <linearGradient id="amber-arc-fade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#D97724" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#D97724" stopOpacity="0" />
            </linearGradient>

            {/* Sapphire Trailing Arc Gradient */}
            <linearGradient id="blue-arc-fade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>

            {/* Architectural Dot-Matrix Pattern */}
            <pattern
              id="dial-dots"
              x="0"
              y="0"
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="8" cy="8" r="0.75" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>

          {/* ============================================================= */}
          {/* BEZEL BASE RINGS                                              */}
          {/* ============================================================= */}
          {/* Outer Bezel Shadow Ring */}
          <circle cx="160" cy="160" r="158" fill="#0D0D0D" stroke="#252422" strokeWidth="2" />

          {/* Brushed Obsidian Outer Rim */}
          <circle
            cx="160"
            cy="160"
            r="154"
            fill="url(#outer-bezel-rim)"
            stroke="url(#specular-highlight)"
            strokeWidth="1.5"
          />

          {/* Inner Bezel Inset Step */}
          <circle
            cx="160"
            cy="160"
            r="144"
            fill="none"
            stroke="#1B1A19"
            strokeWidth="2"
          />

          {/* Dial Face Background */}
          <circle
            cx="160"
            cy="160"
            r="142"
            fill="url(#dial-face-bg)"
            stroke="#262523"
            strokeWidth="1"
          />

          {/* Dot Matrix Architectural Grid Overlay */}
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="url(#dial-dots)"
            opacity="0.85"
          />

          {/* Concentric Architectural Altitude Rings */}
          <circle
            cx="160"
            cy="160"
            r="126"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.75"
          />
          <circle
            cx="160"
            cy="160"
            r="104"
            fill="none"
            stroke="rgba(217, 119, 36, 0.08)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />
          <circle
            cx="160"
            cy="160"
            r="78"
            fill="none"
            stroke="rgba(59, 130, 246, 0.08)"
            strokeWidth="0.75"
            strokeDasharray="4 6"
          />

          {/* ============================================================= */}
          {/* 60 MINUTE TICKS & CARDINAL HOUR GAUGES                         */}
          {/* ============================================================= */}
          {Array.from({ length: 60 }).map((_, i) => {
            const isMajor = i % 5 === 0;
            const angle = (i * 6 * Math.PI) / 180;
            const rInner = isMajor ? 132 : 137;
            const rOuter = 141;
            const x1 = 160 + Math.sin(angle) * rInner;
            const y1 = 160 - Math.cos(angle) * rInner;
            const x2 = 160 + Math.sin(angle) * rOuter;
            const y2 = 160 - Math.cos(angle) * rOuter;

            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "#D8D6D0" : "rgba(255,255,255,0.18)"}
                strokeWidth={isMajor ? 1.75 : 0.8}
                opacity={isMajor ? 0.9 : 0.5}
              />
            );
          })}

          {/* ============================================================= */}
          {/* 1-12 HOUR INDICES (IBM PLEX MONO)                              */}
          {/* ============================================================= */}
          {hourIndices.map(({ num, deg }) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x = 160 + Math.cos(rad) * 118;
            const y = 160 + Math.sin(rad) * 118;
            const isCardinal = ["12", "03", "06", "09"].includes(num);

            return (
              <text
                key={`hour-${num}`}
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                className="font-mono select-none"
                style={{
                  fontSize: isCardinal ? "10px" : "8px",
                  fontWeight: isCardinal ? 600 : 400,
                  fill: isCardinal ? "#F2F0EB" : "#8A8780",
                  letterSpacing: "0.08em",
                }}
              >
                {num}
              </text>
            );
          })}

          {/* ============================================================= */}
          {/* 3. DUAL SWEEPING LUMINOUS HANDS & TRAILING ARCS               */}
          {/* ============================================================= */}

          {/* AMBER / BRONZE HAND & TRAILING ARC (PRIMARY) */}
          <g
            transform={`rotate(${angles.amber} 160 160)`}
            className="transition-transform duration-75 ease-linear"
          >
            {/* Trailing Luminous Arc at r = 104 (~85 degrees backward) */}
            <path
              d="M 160 56 A 104 104 0 0 0 78 98"
              fill="none"
              stroke="url(#amber-arc-fade)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#amber-glow)"
              opacity="0.88"
            />

            {/* Amber Hand Counterweight */}
            <circle cx="160" cy="184" r="5" fill="#D97724" opacity="0.8" />
            <line
              x1="160"
              y1="184"
              x2="160"
              y2="160"
              stroke="#D97724"
              strokeWidth="2.5"
            />

            {/* Tapered Amber Hand Needle */}
            <polygon
              points="158,160 162,160 160.8,62 159.2,62"
              fill="#F59E0B"
              filter="url(#amber-glow)"
            />
            {/* Diamond Needle Head */}
            <polygon
              points="160,54 163.5,63 160,67 156.5,63"
              fill="#FBBF24"
              filter="url(#amber-glow)"
            />
          </g>

          {/* SAPPHIRE / ELECTRIC BLUE HAND & TRAILING ARC (HARMONIC) */}
          <g
            transform={`rotate(${angles.blue} 160 160)`}
            className="transition-transform duration-75 ease-linear"
          >
            {/* Trailing Luminous Arc at r = 124 (~75 degrees backward) */}
            <path
              d="M 160 36 A 124 124 0 0 0 66 84"
              fill="none"
              stroke="url(#blue-arc-fade)"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#blue-glow)"
              opacity="0.88"
            />

            {/* Sapphire Blue Counterweight */}
            <circle cx="160" cy="188" r="4" fill="#3B82F6" opacity="0.8" />
            <line
              x1="160"
              y1="188"
              x2="160"
              y2="160"
              stroke="#3B82F6"
              strokeWidth="2"
            />

            {/* Tapered Sapphire Needle */}
            <polygon
              points="158.4,160 161.6,160 160.6,42 159.4,42"
              fill="#60A5FA"
              filter="url(#blue-glow)"
            />
            {/* Arrowhead Indicator */}
            <polygon
              points="160,34 163,43 160,46 157,43"
              fill="#93C5FD"
              filter="url(#blue-glow)"
            />
          </g>

          {/* SECONDS HAIRLINE NEEDLE */}
          <g
            transform={`rotate(${angles.seconds} 160 160)`}
            className="transition-transform duration-75 ease-linear"
          >
            {/* Counterbalance tail */}
            <line
              x1="160"
              y1="192"
              x2="160"
              y2="160"
              stroke="#B68A4A"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Extended Hairline Needle */}
            <line
              x1="160"
              y1="160"
              x2="160"
              y2="28"
              stroke="#E2E8F0"
              strokeWidth="0.85"
            />
            {/* Luminous Gold Tip */}
            <circle cx="160" cy="30" r="2" fill="#F59E0B" />
          </g>

          {/* ============================================================= */}
          {/* 4. RECESSED DARK-GLASS CAPSULE & CENTER ARCHEON LOGO          */}
          {/* ============================================================= */}
          <g className="filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
            {/* Center Recessed Outer Ring */}
            <circle
              cx="160"
              cy="160"
              r="48"
              fill="url(#center-glass-pod)"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.5"
            />

            {/* Specular Diagonal Sheen on Glass */}
            <path
              d="M 126 136 Q 160 124 194 136 A 48 48 0 0 1 126 136 Z"
              fill="rgba(255, 255, 255, 0.06)"
            />

            {/* Inner Precision Bevel */}
            <circle
              cx="160"
              cy="160"
              r="44"
              fill="none"
              stroke="rgba(217, 119, 36, 0.28)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            {/* ArcheOn Architectural Monogram "A" */}
            <path
              d="M 148 172 L 160 144 L 172 172"
              fill="none"
              stroke="#D97724"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="152"
              y1="164"
              x2="168"
              y2="164"
              stroke="#D97724"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle
              cx="160"
              cy="164"
              r="3.5"
              fill="#F59E0B"
              fillOpacity="0.4"
              stroke="#F59E0B"
              strokeWidth="1"
            />

            {/* Studio Wordmark */}
            <text
              x="160"
              y="184"
              textAnchor="middle"
              className="font-mono text-[7px] uppercase tracking-[0.3em] font-semibold select-none fill-[#F2F0EB]"
            >
              ARCHEON
            </text>
            <text
              x="160"
              y="192"
              textAnchor="middle"
              className="font-mono text-[5.5px] uppercase tracking-[0.22em] select-none fill-[#B68A4A]"
            >
              NAGPUR
            </text>

            {/* Center Pivot Jewel Cap */}
            <circle
              cx="160"
              cy="160"
              r="5.5"
              fill="#181716"
              stroke="#D97724"
              strokeWidth="1.5"
            />
            <circle cx="160" cy="160" r="2.5" fill="#F59E0B" />
          </g>
        </svg>

        {/* Crisp Watermark Logo Overlay for Brand Precision */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 mix-blend-screen">
          <Image
            src="/brand-assets/logo.png"
            alt=""
            width={100}
            height={60}
            className="w-16 h-auto object-contain"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. STUDIO CHRONOMETER TELEMETRY & COORDINATES                      */}
      {/* ================================================================= */}
      <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97724] animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#D8D6D0]">
            NAGPUR STUDIO // {formattedTime}
          </span>
        </div>

        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/40">
          21.1458° N, 79.0882° E • DUAL LUMINOUS CHRONOMETER
        </p>
      </div>
    </div>
  );
}
