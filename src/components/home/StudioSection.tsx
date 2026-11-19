"use client";

import React from "react";
import { Compass } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

export function StudioSection() {
  return (
    <section
      id="studio"
      className="relative overflow-hidden bg-[#F2F0EB] py-24 md:py-36"
    >
      {/* Thematic Background: Architectural Drafting Grid & Golden Ratio Blueprint Spiral */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Shifting Warm Travertine Radial Light */}
        <div
          className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(182, 138, 74, 0.12) 0%, rgba(217, 119, 36, 0.04) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute -bottom-40 left-10 h-[500px] w-[500px] rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, rgba(165, 138, 100, 0.09) 0%, transparent 70%)",
          }}
        />

        {/* SVG Drafting Grid & Rotating Compass Arcs */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="studio-drafting-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#777777"
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              <circle cx="60" cy="60" r="1" fill="#B68A4A" fillOpacity="0.6" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#studio-drafting-grid)" />

          {/* Rotating Golden Section / Compass Rings */}
          <g className="animate-[spin_60s_linear_infinite] origin-[1100px_350px]">
            <circle
              cx="1100"
              cy="350"
              r="280"
              stroke="#B68A4A"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
            <circle
              cx="1100"
              cy="350"
              r="210"
              stroke="#B68A4A"
              strokeWidth="0.8"
              strokeDasharray="3 5"
            />
            <circle
              cx="1100"
              cy="350"
              r="140"
              stroke="#777777"
              strokeWidth="0.6"
              strokeDasharray="4 6"
            />
            <line
              x1="820"
              y1="350"
              x2="1380"
              y2="350"
              stroke="#B68A4A"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
            <line
              x1="1100"
              y1="70"
              x2="1100"
              y2="630"
              stroke="#B68A4A"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
          </g>

          {/* Drafting Crosshairs & Datum Lines */}
          <g
            stroke="#B68A4A"
            strokeWidth="0.8"
            strokeDasharray="4 6"
            strokeOpacity="0.6"
          >
            <line x1="0" y1="280" x2="1440" y2="280" />
            <line x1="0" y1="640" x2="1440" y2="640" />
            <line x1="380" y1="0" x2="380" y2="900" />
            <line x1="1060" y1="0" x2="1060" y2="900" />
          </g>

          {/* CAD Dimension Markers */}
          <g
            fill="#A58A64"
            fontFamily="monospace"
            fontSize="9"
            letterSpacing="2"
            opacity="0.75"
          >
            <text x="390" y="272">DATUM // ATELIER 01</text>
            <text x="390" y="632">SECTION // PHILOSOPHY A-A</text>
            <text x="1070" y="272">GOLDEN RATIO φ // 1.618</text>
            <text x="1070" y="632">ELEVATION // +03.400M</text>
          </g>
        </svg>
      </div>

      <div className="editorial-container relative z-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">

          {/* Section Label with Signature Drafting Compass Animation */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#B68A4A]/40 text-[#B68A4A]">
                <Compass size={13} className="animate-[spin_20s_linear_infinite]" />
              </span>
              <p className="editorial-eyebrow text-[#777777]">
                01 / The Studio
              </p>
            </div>

            <HairlineRule
              color="bg-[#B68A4A]"
              className="mt-8 hidden w-20 lg:block"
            />
          </div>

          {/* Main Introduction */}
          <div className="lg:col-span-9">
            <div className="max-w-4xl">
              <RevealText>
                <h2 className="font-serif text-4xl leading-[1.15] tracking-tight text-[#111111] md:text-6xl lg:text-7xl">
                  Design is not just about spaces.
                </h2>
              </RevealText>
              <RevealText delay={0.1}>
                <h2 className="font-serif text-4xl leading-[1.15] tracking-tight text-[#A58A64] md:text-6xl lg:text-7xl">
                  It is about how we experience them.
                </h2>
              </RevealText>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <p className="editorial-eyebrow text-[#A58A64] mb-4">
                  Our Philosophy
                </p>

                <RevealText delay={0.12}>
                  <p className="text-base leading-8 text-[#44423E] md:text-lg">
                    {siteConfig.philosophy}
                  </p>
                </RevealText>
              </div>

              <div>
                <p className="editorial-eyebrow text-[#A58A64] mb-4">
                  Our Approach
                </p>

                <RevealText delay={0.16}>
                  <p className="text-base leading-8 text-[#44423E] md:text-lg">
                    {siteConfig.about.story}
                  </p>
                </RevealText>
              </div>
            </div>

            {/* Approach Principles */}
            <div className="mt-16">
              <HairlineRule color="bg-[#D8D6D0]" className="mb-8" />
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="editorial-eyebrow text-[#777777]">
                  Design Principles
                </p>

                <span className="font-mono text-[10px] tracking-widest text-[#99958D]">
                  ARCHEON / DS
                </span>
              </div>

              <StaggerGrid
                staggerDelay={0.08}
                className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3"
              >
                {siteConfig.about.approach.map((principle, index) => (
                  <StaggerItem
                    key={`${index}-${principle}`}
                    className="group border-t border-[#D8D6D0] py-6 pr-6 transition-all duration-300 hover:border-l-2 hover:border-l-[#B68A4A] hover:pl-4"
                  >
                    <span className="font-mono text-xs font-semibold text-[#A58A64] transition-colors duration-300 group-hover:text-[#D97724]">
                      0{index + 1}
                    </span>

                    <p className="mt-4 text-base leading-7 text-[#222222] transition-transform duration-300 group-hover:translate-x-1">
                      {principle}
                    </p>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>

            {/* Principal */}
            <div className="mt-16">
              <HairlineRule color="bg-[#D8D6D0]" className="mb-8" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="editorial-eyebrow text-[#777777]">
                    Principal Architect
                  </p>

                  <p className="mt-3 font-serif text-2xl text-[#111111]">
                    {siteConfig.principal}
                  </p>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-widest text-[#777777]">
                  {siteConfig.businessDisplayName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
