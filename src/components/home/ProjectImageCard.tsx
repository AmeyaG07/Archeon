"use client";

import React from "react";
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View project ${project.title}`}
      data-cursor-label="View"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-pointer select-none overflow-hidden rounded-sm bg-[#111111] shadow-md transition-shadow duration-300 hover:shadow-xl ${
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

      {/* Static Inner Wrapper (hover tilt/zoom removed) */}
      <div className="relative h-full w-full">
        {/* Base Project Image */}
        {project.image ? (
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority={index === 0}
              unoptimized={project.image.startsWith("http") || project.image.startsWith("data:")}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              className="object-contain sm:object-cover object-center"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}

        {/* CAD Blueprint Subtle Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.18]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(198, 167, 121, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(198, 167, 121, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Continuous Sweeping Laser Scanner Bar */}
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

        {/* Floating Arrow Badge */}
        <div className="absolute bottom-5 right-5 z-20">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-black/50 text-white shadow-lg backdrop-blur-md transition-colors duration-300 group-hover:border-[#C6A779] group-hover:bg-[#C6A779] group-hover:text-[#111111]">
            <ArrowUpRight size={19} />
          </span>
        </div>
      </div>
    </div>
  );
}
