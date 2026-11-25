"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

interface ProjectImageCardProps {
  project: PortfolioProject;
  index: number;
  onClick: () => void;
}

export function ProjectImageCard({
  project,
  index,
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

  return (
    <div
      ref={containerRef}
      data-cursor-label="View"
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
      {/* =========================================================================
          CONTINUOUSLY MOVING GOLDEN LINE BORDER (Always streaming around perimeter)
         ========================================================================= */}
      <style>{`
        @keyframes svgBorderMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }
        .moving-golden-border-path {
          animation: svgBorderMove 4s linear infinite !important;
        }
        @keyframes continuousCadLaserScan {
          0% { transform: translateX(-100%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(1100%); opacity: 0; }
        }
        .cad-laser-scanner {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 12%;
          pointer-events: none;
          z-index: 15;
          animation: continuousCadLaserScan 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-30 rounded-sm overflow-hidden">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`goldBorderGrad-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C6A779" stopOpacity="0.08" />
              <stop offset="25%" stopColor="#E6CA9E" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="75%" stopColor="#C6A779" stopOpacity="1" />
              <stop offset="100%" stopColor="#9C7138" stopOpacity="0.1" />
            </linearGradient>
            <filter id={`goldGlow-${project.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Static structural base outline */}
          <path
            d="M 0.5 0.5 L 99.5 0.5 L 99.5 99.5 L 0.5 99.5 Z"
            fill="none"
            stroke="#C6A779"
            strokeWidth="1"
            strokeOpacity="0.22"
            vectorEffect="non-scaling-stroke"
          />

          {/* Continuously traveling golden beam line (SMIL native + CSS keyframe dual-engine) */}
          <path
            d="M 0.5 0.5 L 99.5 0.5 L 99.5 99.5 L 0.5 99.5 Z"
            fill="none"
            stroke={`url(#goldBorderGrad-${project.id})`}
            strokeWidth="3"
            pathLength="100"
            strokeDasharray="25 75"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#goldGlow-${project.id})`}
            className="moving-golden-border-path"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-100"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      {/* 3D Tilted Inner Wrapper */}
      <div
        className="relative h-full w-full transition-transform ease-out"
        style={{
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.025, 1.025, 1.025)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transitionDuration: isHovered ? "150ms" : "600ms",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Base Project Image with Smooth Lens Drift */}
        {project.image ? (
          <div
            className={`relative h-full w-full overflow-hidden transition-transform duration-700 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          >
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority={index === 0}
              unoptimized={project.image.startsWith("http") || project.image.startsWith("data:")}
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

        {/* 1. Specular Light Sheen / Glass Glare (Follows mouse dynamically across facade) */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 380px at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.24) 0%, rgba(198, 167, 121, 0.16) 25%, rgba(0, 0, 0, 0) 65%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* 2. CAD Blueprint Subtle Grid Overlay & Continuous Laser Scanner Sweep (No Text Labels) */}
        {/* Subtle Architectural Blueprint Grid (Continuous with hover enhancement) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
          style={{
            opacity: isHovered ? 0.35 : 0.18,
            backgroundImage: `
              linear-gradient(to right, rgba(198, 167, 121, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(198, 167, 121, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Continuous Sweeping Laser Scanner Bar (Always active across facade) */}
        <div
          className="cad-laser-scanner"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(198, 167, 121, 0.05) 30%, rgba(230, 202, 158, 0.3) 80%, rgba(255, 255, 255, 0.85) 96%, rgba(198, 167, 121, 1) 100%)",
            boxShadow: "0 0 24px rgba(198, 167, 121, 0.6), 0 0 45px rgba(198, 167, 121, 0.25)",
          }}
        >
          {/* Razor-sharp vertical laser line at leading edge */}
          <div className="absolute right-0 top-0 bottom-0 w-[2.5px] bg-white shadow-[0_0_12px_#FFF,0_0_22px_#E6CA9E]" />
        </div>

        {/* 3. Cinematic Viewfinder Corner Brackets & Crosshair Reticle (Clean, No Text Readouts) */}
        {isHovered && (
          <>
            {/* Viewfinder 4 Outer Corner Framing Brackets */}
            <div className="pointer-events-none absolute inset-4 transition-all duration-300 z-10">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#C6A779]/80" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#C6A779]/80" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#C6A779]/80" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#C6A779]/80" />
            </div>

            {/* Mouse-Tracking Pure Geometric Reticle (No labels/readouts) */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out z-10"
              style={{
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
              }}
            >
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-[#C6A779]/60 border-dashed animate-[spin_12s_linear_infinite]" />
                <div className="absolute h-1.5 w-1.5 rounded-full bg-[#E6CA9E] shadow-[0_0_8px_#E6CA9E]" />
                <div className="absolute h-full w-[1px] bg-[#C6A779]/35" />
                <div className="absolute w-full h-[1px] bg-[#C6A779]/35" />
              </div>
            </div>
          </>
        )}

        {/* Interactive Floating Arrow Badge (With 3D Z-Depth translation) */}
        <div
          className="absolute bottom-5 right-5 z-20 transition-transform duration-300"
          style={{
            transform: isHovered ? "translateZ(35px)" : "translateZ(0px)",
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
      </div>
    </div>
  );
}
