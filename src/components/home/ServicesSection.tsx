"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
}

export function ServicesSection({
  services,
  onSelectService,
}: ServicesSectionProps) {
  return (
    <section
      id="expertise"
      className="relative overflow-hidden bg-[#F2F0EB] py-24 sm:py-32"
    >
      {/* Thematic Background: Axonometric Isometric Grid & Volumetric Spatial Wireframes */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Soft Ambient Depth Light */}
        <div
          className="absolute top-1/4 -left-28 h-[550px] w-[550px] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(217, 119, 36, 0.08) 0%, rgba(182, 138, 74, 0.03) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute -bottom-20 right-10 h-[500px] w-[500px] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(182, 138, 74, 0.04) 50%, transparent 75%)",
          }}
        />

        {/* Isometric 3D Axonometric Mesh & Floating Geometric Wireframes */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.075]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="services-isometric-grid"
              width="80"
              height="46.188"
              patternUnits="userSpaceOnUse"
            >
              {/* Isometric 30° Rhombus Grid */}
              <path
                d="M 40 0 L 80 23.094 L 40 46.188 L 0 23.094 Z"
                fill="none"
                stroke="#888888"
                strokeWidth="0.5"
              />
              <path
                d="M 0 23.094 L 80 23.094"
                stroke="#B68A4A"
                strokeWidth="0.3"
                strokeDasharray="2 4"
              />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#services-isometric-grid)" />

          {/* Floating Isometric Wireframe Cube in Top-Right */}
          <g transform="translate(1120, 140)" className="animate-[pulse_8s_ease-in-out_infinite]">
            <polygon
              points="0,-60 52,-30 0,0 -52,-30"
              stroke="#B68A4A"
              strokeWidth="1.2"
              fill="rgba(182,138,74,0.04)"
            />
            <polygon
              points="0,0 52,-30 52,30 0,60"
              stroke="#B68A4A"
              strokeWidth="1.2"
              fill="rgba(182,138,74,0.02)"
            />
            <polygon
              points="0,0 -52,-30 -52,30 0,60"
              stroke="#B68A4A"
              strokeWidth="1.2"
              fill="rgba(182,138,74,0.06)"
            />
            <line x1="0" y1="0" x2="0" y2="60" stroke="#D97724" strokeWidth="1" />
          </g>

          {/* Floating Landscape Contour Curves in Bottom-Left */}
          <g transform="translate(120, 680)" opacity="0.8">
            <path
              d="M -60 40 Q 60 -40 180 20 T 380 0"
              fill="none"
              stroke="#B68A4A"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              d="M -80 70 Q 50 -10 190 50 T 400 30"
              fill="none"
              stroke="#777777"
              strokeWidth="0.8"
            />
            <path
              d="M -100 100 Q 40 20 200 80 T 420 60"
              fill="none"
              stroke="#B68A4A"
              strokeWidth="0.6"
              strokeDasharray="2 4"
            />
          </g>

          {/* Technical Spatial Discipline Readouts */}
          <g
            fill="#B68A4A"
            fontFamily="monospace"
            fontSize="9"
            letterSpacing="2.5"
            opacity="0.75"
          >
            <text x="1060" y="240">AXONOMETRIC MATRIX // 30°</text>
            <text x="1060" y="258">SPATIAL ENVELOPE // 3D</text>
            <text x="140" y="650">TOPOGRAPHIC CONTOUR // 0.50M</text>
          </g>
        </svg>
      </div>

      <div className="editorial-container relative z-10">

        {/* Section Introduction */}
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="editorial-eyebrow text-[#B68A4A]">
              02 / Our Expertise
            </p>

            <div className="mt-6">
              <RevealText>
                <h2 className="max-w-3xl font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
                  A considered approach
                </h2>
              </RevealText>
              <RevealText delay={0.12}>
                <h2 className="max-w-3xl font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
                  to <span className="italic">every space.</span>
                </h2>
              </RevealText>
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <RevealText delay={0.2}>
              <p className="max-w-md text-sm leading-8 text-[#777777]">
                From the first architectural idea to the final
                material detail, our disciplines work together
                to create cohesive spatial environments.
              </p>
            </RevealText>
          </div>
        </div>

        <HairlineRule color="bg-[#D8D6D0]" className="mb-0" />

        {/* Services Staggered Grid */}
        <StaggerGrid
          staggerDelay={0.08}
          className="grid border-l border-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service, index) => (
            <StaggerItem
              key={service.id}
              className={`border-b border-r border-[#D8D6D0] ${index === 0 || index === 4 ? "lg:col-span-1" : ""
                }`}
            >
              <button
                type="button"
                onClick={() => onSelectService(service)}
                className="group relative flex min-h-[300px] w-full flex-col justify-between overflow-hidden p-7 text-left transition-all duration-500 hover:-translate-y-1.5 hover:bg-white hover:shadow-xl hover:shadow-black/[0.04] sm:p-9"
              >
                {/* Chromatic Edge Sweep Line on Hover */}
                <div className="absolute left-0 top-0 h-[2px] w-0 bg-gradient-to-r from-[#D97724] via-[#C6A779] to-[#F59E0B] transition-all duration-500 ease-out group-hover:w-full" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="editorial-eyebrow text-[#B68A4A]">
                      {service.code}
                    </span>

                    <span className="font-mono text-xs text-[#AAA69D]">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-12 max-w-xs font-serif text-4xl font-normal leading-[1.05] text-[#111111] transition-transform duration-500 group-hover:translate-x-1 sm:text-[2.7rem]">
                    {service.title}
                  </h3>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-[#777777]">
                    {service.tagline}
                  </p>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-[#D8D6D0] pt-5">
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#55534F] transition-colors group-hover:text-[#B68A4A]">
                    Explore Discipline
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8D6D0] text-[#111111] transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A] group-hover:text-white">
                    <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* Closing Statement */}
        <HairlineRule color="bg-[#D8D6D0]" className="mt-12" />
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-2xl italic text-[#777777]">
            One vision. Multiple disciplines. A cohesive result.
          </p>

          <span className="editorial-eyebrow text-[#AAA69D]">
            Architecture / Interiors / Landscape / Execution
          </span>
        </div>
      </div>
    </section>
  );
}
