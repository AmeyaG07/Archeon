"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";

interface ArchitecturalRevealHeroProps {
  onOpenConsultation?: () => void;
}

export function ArchitecturalRevealHero({
  onOpenConsultation,
}: ArchitecturalRevealHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [loadLabel, setLoadLabel] = useState("LOAD VIDEO");
  const [activeObjectUrl, setActiveObjectUrl] = useState<string | null>(null);

  // Attempt video autoplay on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Keep graceful Ken Burns image fallback if autoplay blocked
        });
      }
    }

    return () => {
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [activeObjectUrl]);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  // Discreet bottom-left custom video loader
  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !videoRef.current) return;

      try {
        if (activeObjectUrl) {
          URL.revokeObjectURL(activeObjectUrl);
        }
        const newUrl = URL.createObjectURL(file);
        setActiveObjectUrl(newUrl);

        const video = videoRef.current;
        video.pause();
        video.removeAttribute("src");
        video.querySelectorAll("source").forEach((s) => s.remove());
        video.src = newUrl;
        video.load();

        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }

        const shortName = file.name
          .replace(/\.[^/.]+$/, "")
          .slice(0, 14)
          .toUpperCase();
        setLoadLabel(shortName || "CUSTOM VIDEO");
        setVideoReady(true);
      } catch {
        // Keep existing fallback gracefully if file read fails
      }
    },
    [activeObjectUrl]
  );

  const scrollToProjects = useCallback(() => {
    const el = document.getElementById("projects");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      {/* Inline Scoped Styles for Ken Burns Fallback Animation */}
      <style jsx>{`
        @keyframes nightPanFallback {
          0% {
            transform: scale(1.04) translate3d(1.2%, 0.4%, 0);
          }
          50% {
            transform: scale(1.12) translate3d(-1.6%, -0.8%, 0);
          }
          100% {
            transform: scale(1.04) translate3d(1.2%, 0.4%, 0);
          }
        }
        .night-fallback-motion {
          animation: nightPanFallback 26s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      <section
        id="heroSection"
        className="relative w-full min-h-[calc(100vh-76px)] pt-[76px] overflow-hidden bg-[#0A0A0A] text-[#F2EFE9] flex flex-col justify-between"
      >
        {/* =================================================================== */}
        {/* 1. FULL-BLEED BACKGROUND NIGHT EXTERIOR ARCHITECTURE VIDEO LAYER    */}
        {/* =================================================================== */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
          {/* Graceful Fallback: High-Res Night Monolithic Residence with Slow Pan */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="videoFallbackImg"
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=85"
            alt="Modern monolithic residence exterior illuminated at night"
            className={`night-fallback-motion absolute inset-0 w-full h-full object-cover object-center brightness-[0.62] contrast-[1.12] saturate-[0.85] transition-opacity duration-1000 ${
              videoReady ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Full-Viewport Autoplaying, Looping, Muted Night Exterior Architecture Video */}
          <video
            ref={videoRef}
            id="bgHeroVideo"
            className={`relative z-[1] w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
            onCanPlay={handleVideoCanPlay}
            onPlaying={handleVideoCanPlay}
          >
            <source
              src="https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4"
              type="video/mp4"
            />
            <source
              src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
              type="video/mp4"
            />
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-modern-building-facade-at-night-43828-large.mp4"
              type="video/mp4"
            />
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-buildings-at-night-40997-large.mp4"
              type="video/mp4"
            />
          </video>

          {/* Refined Dark Architectural Scrim / Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              background: `
                linear-gradient(
                  90deg,
                  rgba(10, 10, 10, 0.88) 0%,
                  rgba(10, 10, 10, 0.78) 34%,
                  rgba(10, 10, 10, 0.52) 64%,
                  rgba(10, 10, 10, 0.38) 100%
                ),
                linear-gradient(
                  180deg,
                  rgba(10, 10, 10, 0.72) 0%,
                  rgba(10, 10, 10, 0.08) 22%,
                  rgba(10, 10, 10, 0.12) 76%,
                  rgba(10, 10, 10, 0.82) 100%
                )
              `,
            }}
          />
        </div>

        {/* =================================================================== */}
        {/* 2. ULTRA-FAINT CENTER ARCHITECTURAL DATUM WIREFRAME SVG            */}
        {/* =================================================================== */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 820"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 z-[3] w-full h-full opacity-[0.09]"
        >
          <g stroke="#C89B54" strokeWidth="0.9" fill="none">
            {/* Outer architectural pyramid / apex geometry */}
            <polygon points="720,135 415,635 1025,635" />
            {/* Inner elevation triangle */}
            <polygon points="720,235 495,635 945,635" />
            {/* Central vertical datum axis */}
            <line x1="720" y1="115" x2="720" y2="660" />
            {/* Left & right vertical axis lines */}
            <line x1="538" y1="360" x2="538" y2="635" />
            <line x1="902" y1="360" x2="902" y2="635" />
            {/* Horizontal datum reference lines */}
            <line x1="360" y1="435" x2="1080" y2="435" strokeDasharray="4 6" />
            <line x1="380" y1="635" x2="1060" y2="635" />
            {/* Subtle cross diagonals */}
            <line x1="538" y1="435" x2="902" y2="635" strokeOpacity="0.5" />
            <line x1="902" y1="435" x2="538" y2="635" strokeOpacity="0.5" />
          </g>

          {/* Ultra-faint CAD Datum Labels */}
          <g
            fill="#D8B070"
            fontFamily="'JetBrains Mono', 'IBM Plex Mono', monospace"
            fontSize="9.5"
            letterSpacing="2.2"
          >
            <text x="728" y="128">ZENITH APERTURE // +14.600M</text>
            <text x="546" y="388">AXIS // 01-A</text>
            <text x="730" y="388">CTR // DATUM 00</text>
            <text x="910" y="388">AXIS // 02-B</text>
          </g>
        </svg>

        {/* =================================================================== */}
        {/* 3. SUB-HEADER METADATA BAR                                         */}
        {/* =================================================================== */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 pt-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 font-mono text-[10px] tracking-[0.22em] uppercase text-[#9A948A]">
            {/* Left Studio Location */}
            <div className="flex items-center gap-2.5 text-[#B8894A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] inline-block animate-pulse" />
              <span>ARCHEON STUDIO // NAGPUR</span>
            </div>

            {/* Center Coordinates & Tectonic Specs */}
            <div className="hidden lg:flex items-center gap-8 text-[#8D8880]">
              <span className="flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8894A" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="9" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                21.1458° N, 79.0882° E
              </span>
              <span className="flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8894A" strokeWidth="1.6">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 12 12 17 22 12" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
                FORM · STRUCTURE · MATERIALITY
              </span>
              <span className="flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8894A" strokeWidth="1.6">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                1:1 TECTONIC SCALE
              </span>
            </div>

            {/* Right Established Year */}
            <div className="text-[#B8894A]">EST. 2024</div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. MAIN LEFT HERO CONTENT                                           */}
        {/* =================================================================== */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 my-auto py-8 lg:py-10">
          <div className="max-w-[660px]">
            {/* Eyebrow */}
            <p className="font-mono text-[10.5px] tracking-[0.26em] uppercase text-[#B8894A] mb-5">
              ARCHITECTURE &nbsp;·&nbsp; INTERIOR ENVIRONMENTS &nbsp;·&nbsp; LANDSCAPE
            </p>

            {/* Display Serif Headline */}
            <h1 className="font-serif font-normal text-[52px] sm:text-[72px] lg:text-[90px] leading-[0.94] tracking-[-0.02em] text-[#F2EFE9]">
              Spaces shaped by<br />
              <span className="italic text-[#C8621E] font-normal">intention.</span>
            </h1>

            {/* Editorial Subcopy */}
            <p className="mt-7 max-w-[520px] text-[15px] sm:text-[16px] leading-[1.68] font-light text-[#B8B4AC]">
              A multidisciplinary architecture and spatial design practice crafting
              monolithic, light-sculpted residences and bespoke environments with quiet
              precision in Nagpur, India.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="px-7 py-4 bg-[#F2EFE9] text-[#0A0A0A] hover:bg-white transition-colors font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3 font-medium"
              >
                <span>DISCUSS YOUR PROJECT</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={scrollToProjects}
                className="px-7 py-4 bg-transparent border border-white/25 text-[#F2EFE9] hover:border-white/55 hover:bg-white/[0.04] transition-colors font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3"
              >
                <span>EXPLORE PROJECTS</span>
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 5. BOTTOM ROW: LOCAL VIDEO TESTER & ARCHITECTURAL DISCIPLINES       */}
        {/* =================================================================== */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-14 pb-8 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          {/* Bottom-Left: Discreet Local Video Tester */}
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              id="localVideoInput"
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              id="loadVideoBtn"
              type="button"
              title="Load a local .mp4 or .webm night architecture video"
              onClick={handleLoadClick}
              className="group inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/65 border border-white/15 hover:border-[#B8894A]/60 transition-colors focus:outline-none cursor-pointer backdrop-blur-sm"
            >
              <span className="w-5 h-5 rounded-full bg-white/[0.07] flex items-center justify-center text-[#F2EFE9]/80 group-hover:text-[#B8894A] transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </span>
              <span
                id="loadVideoLabel"
                className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#F2EFE9]/65 group-hover:text-[#F2EFE9] pr-1 transition-colors"
              >
                {loadLabel}
              </span>
            </button>
          </div>

          {/* Bottom-Right: Static Architectural Disciplines Block */}
          <aside className="border-l border-white/15 pl-5 py-0.5 self-start sm:self-end">
            <p className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-[#B8894A] mb-2.5">
              ARCHITECTURAL DISCIPLINES
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#C8C3BA]">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
                <span>01. FORM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
                <span>02. STRUCTURE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
                <span>03. MATERIALITY</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#C8621E] inline-block" />
                <span>04. LANDSCAPE</span>
              </div>
            </div>

            <p className="mt-3 font-mono text-[9px] tracking-[0.14em] text-[#7D7870]">
              Nagpur Studio · Full Turnkey Execution
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
