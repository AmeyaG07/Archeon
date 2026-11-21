"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ArrowUpRight, Crosshair, Scan, Sparkles, Layers } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

export type ProjectAnimationMode = "tilt" | "blueprint" | "viewfinder" | "combined";

interface ProjectImageCardProps {
  project: PortfolioProject;
  index: number;
  animationMode: ProjectAnimationMode;
  onClick: () => void;
}

export function ProjectImageCard({
  project,
  index,
  animationMode,
  onClick,
}: ProjectImageCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentage
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); // degrees

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
    setMousePos({ x: xPercent, y: yPercent });

    // Calculate 3D tilt: max ±8 deg on Y, ±6 deg on X for tangible depth
    const tiltY = ((x / rect.width) - 0.5) * 16;
    const tiltX = -((y / rect.height) - 0.5) * 12;
    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  const isTiltActive = animationMode === "tilt" || animationMode === "combined";
  const isBlueprintActive = animationMode === "blueprint" || animationMode === "combined";
  const isViewfinderActive = animationMode === "viewfinder" || animationMode === "combined";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: "1200px",
      }}
      className={`group relative cursor-pointer select-none overflow-hidden rounded-sm bg-[#111111] shadow-md transition-all duration-500 hover:shadow-2xl ${
        index === 0 ? "aspect-[3/2] w-full" : "aspect-[16/9] w-full"
      }`}
    >
      {/* 3D Tilted Inner Wrapper */}
      <div
        className="relative h-full w-full transition-transform ease-out"
        style={{
          transform: isTiltActive && isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.025, 1.025, 1.025)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transitionDuration: isHovered ? "150ms" : "600ms",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Base Project Image */}
        {project.image ? (
          <div
            className={`relative h-full w-full overflow-hidden transition-transform duration-700 ease-out ${
              isViewfinderActive && isHovered ? "scale-110" : isHovered ? "scale-105" : "scale-100"
            }`}
          >
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              className={`object-contain sm:object-cover object-center transition-all duration-700 ${
                isHovered
                  ? "contrast-[1.06] brightness-[1.03] saturate-[1.08]"
                  : "contrast-100 brightness-100"
              }`}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}

        {/* 1. ANIMATION LAYER: Specular Light Sheen / Glass Glare (3D Tectonic Tilt Mode) */}
        {isTiltActive && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(circle 380px at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.22) 0%, rgba(198, 167, 121, 0.14) 25%, rgba(0, 0, 0, 0) 65%)`,
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* 2. ANIMATION LAYER: CAD Blueprint Scanner Wipe (Blueprint Mode) */}
        {isBlueprintActive && isHovered && (
          <>
            {/* Blueprint Grid Overlay */}
            <div
              className="pointer-events-none absolute inset-0 animate-in fade-in duration-500"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(182, 138, 74, 0.12) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(182, 138, 74, 0.12) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Sweeping Laser Scanner Bar */}
            <div
              className="pointer-events-none absolute inset-y-0 w-32 -translate-x-full animate-[laserSweep_2.4s_cubic-bezier(0.4,0,0.2,1)_infinite]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(198, 167, 121, 0.08) 40%, rgba(255, 240, 200, 0.45) 90%, rgba(198, 167, 121, 0.8) 100%)",
                boxShadow: "0 0 24px rgba(198, 167, 121, 0.5)",
              }}
            />

            {/* Technical CAD Annotations & Dimension Ticks */}
            <div className="pointer-events-none absolute inset-0 p-5 sm:p-6 flex flex-col justify-between font-mono text-[9px] uppercase tracking-widest text-[#C6A779] select-none">
              <div className="flex justify-between items-start gap-2">
                <div className="rounded bg-black/75 px-2.5 py-1 backdrop-blur-md border border-[#C6A779]/40 flex items-center gap-1.5 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C6A779] animate-pulse" />
                  <span>CAD LEVEL: +14.200M · AXIS {index === 0 ? "A-01" : `B-0${index + 1}`}</span>
                </div>
                <div className="rounded bg-black/75 px-2.5 py-1 backdrop-blur-md border border-[#C6A779]/40 shadow-sm">
                  STRUCTURAL SPAN: 24.8M
                </div>
              </div>

              <div className="flex justify-between items-end gap-2">
                <div className="rounded bg-black/75 px-2.5 py-1 backdrop-blur-md border border-[#C6A779]/40 shadow-sm">
                  <span className="text-white/90">PROJECT {project.code}</span> · {project.category}
                </div>

                <div className="rounded bg-black/75 px-2.5 py-1 backdrop-blur-md border border-[#C6A779]/40 shadow-sm">
                  RASTER SCALE: 1:100
                </div>
              </div>
            </div>
          </>
        )}

        {/* 3. ANIMATION LAYER: Cinematic Viewfinder Reticle (Viewfinder Mode) */}
        {isViewfinderActive && isHovered && (
          <>
            {/* Viewfinder Outer Corner Brackets */}
            <div className="pointer-events-none absolute inset-4 transition-all duration-300">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#C6A779]" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#C6A779]" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#C6A779]" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#C6A779]" />
            </div>

            {/* Mouse-Tracking Viewfinder Reticle */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
              style={{
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
              }}
            >
              {/* Circular Reticle with Crosshairs */}
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#C6A779]/60 border-dashed animate-[spin_12s_linear_infinite]" />
                <div className="absolute h-2 w-2 rounded-full bg-[#C6A779]" />
                <div className="absolute h-full w-[1px] bg-[#C6A779]/40" />
                <div className="absolute w-full h-[1px] bg-[#C6A779]/40" />

                {/* Reticle Realtime Readout Pill */}
                <div className="absolute left-10 top-0 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 font-mono text-[8px] tracking-wider text-[#C6A779] backdrop-blur-md border border-[#C6A779]/30">
                  X: {mousePos.x.toFixed(0)}% · Y: {mousePos.y.toFixed(0)}% · 50MM F/1.4
                </div>
              </div>
            </div>
          </>
        )}

        {/* Dynamic Perimeter Golden Accent Line on Hover */}
        <div
          className={`pointer-events-none absolute inset-0 border transition-all duration-500 ${
            isHovered ? "border-[#C6A779]/60" : "border-transparent"
          }`}
        />

        {/* Interactive Floating Arrow Badge (With 3D Z-Depth translation) */}
        <div
          className="absolute bottom-5 right-5 z-20 transition-transform duration-300"
          style={{
            transform: isTiltActive && isHovered ? "translateZ(35px)" : "translateZ(0px)",
          }}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 ${
              isHovered
                ? "border-[#C6A779] bg-[#C6A779] text-[#111111] scale-110 shadow-[0_0_20px_rgba(198,167,121,0.5)]"
                : "border-white/70 bg-black/50 text-white"
            }`}
          >
            <ArrowUpRight size={19} />
          </span>
        </div>

        {/* Category Pill Tag (With 3D Z-Depth translation) */}
        <div
          className="absolute top-5 left-5 z-20 transition-transform duration-300"
          style={{
            transform: isTiltActive && isHovered ? "translateZ(25px)" : "translateZ(0px)",
          }}
        >
          <span className="rounded-sm border border-white/30 bg-black/60 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-[#E8E6E1] backdrop-blur-md">
            {project.category}
          </span>
        </div>
      </div>
    </div>
  );
}
