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
  const heroSectionRef = useRef<HTMLElement>(null);

  const [videoReady, setVideoReady] = useState(false);
  const [loadLabel, setLoadLabel] = useState("LOAD VIDEO");
  const [activeObjectUrl, setActiveObjectUrl] = useState<string | null>(null);

  // Play video on mount and when source updates
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (video.readyState >= 2) {
        setVideoReady(true);
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Handled gracefully if autoplay blocked
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

  // ---------------------------------------------------------------------------
  // OPTIONAL LOCAL VIDEO TESTER (LOAD VIDEO BUTTON)
  // ---------------------------------------------------------------------------
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
        // Fall back gracefully
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
    <section
      ref={heroSectionRef}
      id="heroSection"
      className="relative w-full min-h-[calc(100vh-76px)] pt-[76px] overflow-hidden bg-[#0A0A0A] text-[#F2EFE9] flex flex-col justify-between select-none"
    >
      {/* =================================================================== */}
      {/* 1. FULL-BLEED BACKGROUND ARCHITECTURAL VIDEO LAYER                  */}
      {/* =================================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#080808]">
        {/* Autoplaying, Looping, Muted Full-Viewport Hero Architectural Video */}
        <video
          ref={videoRef}
          id="bgHeroVideo"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          src={activeObjectUrl || "/hero-architectural-video.mp4"}
          onCanPlay={handleVideoCanPlay}
          onPlaying={handleVideoCanPlay}
          onLoadedData={handleVideoCanPlay}
        >
          <source
            src={activeObjectUrl || "/hero-architectural-video.mp4"}
            type="video/mp4"
          />
        </video>

        {/* Refined Dark Architectural Scrim / Vignette: High Contrast on Left, Open Clarity on Right */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `
              linear-gradient(
                90deg,
                rgba(8, 8, 8, 0.94) 0%,
                rgba(8, 8, 8, 0.82) 32%,
                rgba(8, 8, 8, 0.35) 58%,
                rgba(8, 8, 8, 0.12) 80%,
                rgba(8, 8, 8, 0.05) 100%
              ),
              linear-gradient(
                180deg,
                rgba(8, 8, 8, 0.72) 0%,
                rgba(8, 8, 8, 0.15) 20%,
                rgba(8, 8, 8, 0.15) 75%,
                rgba(8, 8, 8, 0.88) 100%
              )
            `,
          }}
        />
      </div>

      {/* =================================================================== */}
      {/* 2. SUB-HEADER METADATA BAR                                         */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 font-mono text-[10px] tracking-[0.22em] uppercase text-[#9A948A]">
          {/* Left Studio Location */}
          <div className="flex items-center gap-2.5 text-[#B8894A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] inline-block animate-pulse" />
            <span>ARCHEON STUDIO // NAGPUR</span>
          </div>

          {/* Center Coordinates & Tectonic Specs */}
          <div className="hidden lg:flex items-center gap-8 text-[#8D8880]">
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
                <circle cx="12" cy="12" r="9" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              21.1458° N, 79.0882° E
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 12 12 17 22 12" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
              FORM · STRUCTURE · MATERIALITY
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B8894A"
                strokeWidth="1.6"
              >
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
      {/* 3. MAIN LEFT HERO CONTENT                                           */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 my-auto py-8 lg:py-10">
        <div className="max-w-[660px]">
          {/* Eyebrow */}
          <p className="font-mono text-[10px] sm:text-[10.5px] tracking-[0.24em] sm:tracking-[0.26em] uppercase text-[#B8894A] mb-4 sm:mb-5">
            ARCHITECTURE &nbsp;·&nbsp; INTERIOR ENVIRONMENTS &nbsp;·&nbsp; LANDSCAPE
          </p>

          {/* Display Serif Headline */}
          <h1 className="font-serif font-normal text-[38px] xs:text-[46px] sm:text-[68px] lg:text-[90px] leading-[0.98] sm:leading-[0.94] tracking-[-0.02em] text-[#F2EFE9]">
            Spaces shaped by<br />
            <span className="italic text-[#C8621E] font-normal">intention.</span>
          </h1>

          {/* Editorial Subcopy */}
          <p className="mt-5 sm:mt-7 max-w-[520px] text-[14px] sm:text-[16px] leading-[1.68] font-light text-[#B8B4AC]">
            A multidisciplinary architecture and spatial design practice crafting
            monolithic, light-sculpted residences and bespoke environments with quiet
            precision in Nagpur, India.
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM ROW: DOWNWARD CTA BUTTONS & ARCHITECTURAL DISCIPLINES     */}
      {/* =================================================================== */}
      <div className="relative z-10 w-full px-4 sm:px-10 lg:px-14 pb-8 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Bottom-Left: Downward CTA Buttons + Discreet Local Video Tester */}
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="w-full sm:w-auto justify-center px-6 sm:px-7 py-3.5 sm:py-4 bg-[#F2EFE9] text-[#0A0A0A] hover:bg-white transition-all font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3 font-medium shadow-xl hover:shadow-2xl hover:-translate-y-0.5 touch-target"
            >
              <span>DISCUSS YOUR PROJECT</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={scrollToProjects}
              className="w-full sm:w-auto justify-center px-6 sm:px-7 py-3.5 sm:py-4 bg-black/60 backdrop-blur-md border border-white/25 text-[#F2EFE9] hover:border-white/55 hover:bg-white/[0.08] transition-all font-mono text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-3 shadow-xl hover:-translate-y-0.5 touch-target"
            >
              <span>EXPLORE PROJECTS</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>

          {/* Discreet Local Video Tester */}
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
              className="group inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-black/75 border border-white/15 hover:border-[#B8894A]/60 transition-colors focus:outline-none cursor-pointer backdrop-blur-sm"
            >
              <span className="w-5 h-5 rounded-full bg-white/[0.07] flex items-center justify-center text-[#F2EFE9]/80 group-hover:text-[#B8894A] transition-colors">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
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
        </div>

        {/* Bottom-Right: Architectural Disciplines Block with Solid Dark Background */}
        <aside className="rounded-xl border border-white/15 bg-black/80 p-4 sm:p-5 backdrop-blur-md shadow-2xl self-start md:self-end max-w-sm">
          <div className="flex items-center justify-between gap-4 mb-2.5">
            <p className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-[#B8894A]">
              ARCHITECTURAL DISCIPLINES
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8621E] inline-block animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#C8C3BA]">
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

          <div className="mt-3 pt-2.5 border-t border-white/10 font-mono text-[9px] tracking-[0.14em] text-[#8D8880]">
            Nagpur Studio · Full Turnkey Execution
          </div>
        </aside>
      </div>
    </section>
  );
}
