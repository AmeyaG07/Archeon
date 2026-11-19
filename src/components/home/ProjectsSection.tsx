"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";
import {
  RevealText,
  ClipReveal,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";

interface ProjectsSectionProps {
  projects: PortfolioProject[];
  onSelectProject: (project: PortfolioProject) => void;
}

const projectVisuals: Record<string, string> = {
  "the-monolith-sanctuary":
    "from-[#777064] via-[#4B4941] to-[#24231F]",
  "carrara-stone-penthouse":
    "from-[#B8AD9C] via-[#827A6D] to-[#49443D]",
  "terracotta-courtyard-estate":
    "from-[#927765] via-[#625647] to-[#302C25]",
};

export function ProjectsSection({
  projects,
  onSelectProject,
}: ProjectsSectionProps) {
  return (
    <section
      id="projects"
      className="relative overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Thematic Background: Architectural Elevation Datums, Dimension Strings & Gallery Aperture */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Soft Ambient Gallery Glow */}
        <div
          className="absolute -top-40 left-1/3 h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(182, 138, 74, 0.06) 0%, rgba(200, 98, 30, 0.02) 45%, transparent 70%)",
          }}
        />

        {/* Faint Horizontal Elevation Datum Strings */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.065]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Architectural Elevation Level Lines */}
          <line x1="0" y1="180" x2="1440" y2="180" stroke="#111111" strokeWidth="0.8" strokeDasharray="6 6" />
          <line x1="0" y1="520" x2="1440" y2="520" stroke="#B68A4A" strokeWidth="0.8" strokeDasharray="4 8" />
          <line x1="0" y1="820" x2="1440" y2="820" stroke="#111111" strokeWidth="0.8" strokeDasharray="6 6" />

          {/* Dimension Witness Lines & Ticks */}
          <g stroke="#B68A4A" strokeWidth="1">
            <line x1="120" y1="165" x2="120" y2="195" />
            <line x1="110" y1="190" x2="130" y2="170" strokeWidth="1.5" />
            <line x1="840" y1="165" x2="840" y2="195" />
            <line x1="830" y1="190" x2="850" y2="170" strokeWidth="1.5" />
            <line x1="1320" y1="165" x2="1320" y2="195" />
            <line x1="1310" y1="190" x2="1330" y2="170" strokeWidth="1.5" />
          </g>

          {/* Technical Elevation Bubbles */}
          <circle cx="120" cy="180" r="18" fill="white" stroke="#B68A4A" strokeWidth="1" />
          <text x="120" y="184" textAnchor="middle" fill="#B68A4A" fontFamily="monospace" fontSize="8" fontWeight="600">
            01
          </text>

          <circle cx="840" cy="180" r="18" fill="white" stroke="#B68A4A" strokeWidth="1" />
          <text x="840" y="184" textAnchor="middle" fill="#B68A4A" fontFamily="monospace" fontSize="8" fontWeight="600">
            02
          </text>

          <circle cx="1320" cy="180" r="18" fill="white" stroke="#B68A4A" strokeWidth="1" />
          <text x="1320" y="184" textAnchor="middle" fill="#B68A4A" fontFamily="monospace" fontSize="8" fontWeight="600">
            03
          </text>

          {/* Architectural Dimension Labels */}
          <g fill="#777777" fontFamily="monospace" fontSize="9" letterSpacing="2">
            <text x="150" y="172">ELEVATION // GROUND PLANE ±0.00M</text>
            <text x="870" y="172">PIVOT AXIS // +03.800M</text>
            <text x="140" y="512">HORIZONTAL DATUM // TRANSVERSE SECTION B-B</text>
            <text x="140" y="812">FOUNDATION LEVEL // -02.400M</text>
          </g>
        </svg>

        {/* Large Subtle Editorial Watermark Flowing Across Section */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full flex whitespace-nowrap overflow-hidden opacity-[0.03]">
          <span className="font-serif text-[130px] font-light tracking-widest text-[#111111] animate-[marquee_45s_linear_infinite]">
            ARCHEON &nbsp;·&nbsp; SELECTED WORKS &nbsp;·&nbsp; MONOLITHIC RESIDENCES &nbsp;·&nbsp; ARCHEON &nbsp;·&nbsp; SELECTED WORKS &nbsp;·&nbsp;
          </span>
        </div>
      </div>

      <div className="editorial-container relative z-10">

        {/* Section Header */}
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-eyebrow text-[#B68A4A]">
              03 / Selected Work
            </p>

            <div className="mt-6">
              <RevealText>
                <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
                  Spaces that tell
                </h2>
              </RevealText>
              <RevealText delay={0.12}>
                <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
                  <span className="italic">their own story.</span>
                </h2>
              </RevealText>
            </div>
          </div>

          <RevealText delay={0.2}>
            <p className="max-w-sm text-sm leading-8 text-[#777777]">
              A selection of architectural, interior and landscape
              projects shaped by context, material and the experience
              of inhabiting space.
            </p>
          </RevealText>
        </div>

        <HairlineRule color="bg-[#D8D6D0]" className="mb-14" />

        {/* Project Cards with Stagger & Clip-Path Curtain Reveal */}
        <StaggerGrid
          staggerDelay={0.12}
          className="grid gap-x-8 gap-y-16 md:grid-cols-2"
        >
          {projects.map((project, index) => (
            <StaggerItem
              key={project.id}
              className={`group ${index === 0 ? "md:col-span-2" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelectProject(project)}
                className="block w-full text-left"
                aria-label={`View ${project.title} project`}
              >
                {/* Architectural Clip-Path Image Reveal */}
                <ClipReveal
                  duration={1.2}
                  className={`relative overflow-hidden bg-gradient-to-br ${
                    projectVisuals[project.id] ??
                    "from-[#777064] to-[#302C25]"
                  } ${
                    index === 0 ? "aspect-[16/9] sm:aspect-[16/8]" : "aspect-[4/3]"
                  }`}
                >
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-40 transition-transform duration-700 ease-out group-hover:scale-105">
                      <div className="absolute right-[12%] top-[12%] h-[85%] w-[35%] -skew-x-12 border-l border-white/40 bg-white/10" />
                      <div className="absolute bottom-0 left-[10%] h-[45%] w-[65%] border-t border-white/30 bg-black/10" />
                      <div className="absolute right-[20%] top-[20%] h-[55%] w-[18%] border-l border-white/30 bg-white/10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 transition-opacity duration-500 group-hover:opacity-85" />

                  <div className="absolute left-5 top-5">
                    <span className="border border-white/40 bg-black/40 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur-md">
                      {project.category}
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="editorial-eyebrow text-white/80">
                        {project.code}
                      </p>
                      <p className="mt-2 text-xs text-white/90 font-light">
                        {project.image ? `${project.title} · ${project.location}` : "Architectural project visual pending"}
                      </p>
                    </div>

                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-black/30 backdrop-blur-sm text-white transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A] group-hover:text-[#111111]">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                </ClipReveal>

                {/* Project Information */}
                <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-serif text-3xl font-normal text-[#111111] transition-colors group-hover:text-[#9C7138] sm:text-4xl">
                      {project.title}
                    </h3>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-[#777777]">
                      {project.heroSummary}
                    </p>
                  </div>

                  <div className="shrink-0 space-y-2 sm:text-right">
                    <p className="flex items-center gap-2 text-xs text-[#777777] sm:justify-end">
                      <MapPin size={13} />
                      {project.location}
                    </p>

                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#AAA69D]">
                      {project.year} · {project.area}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="border border-[#D8D6D0] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#777777]">
                    {project.status}
                  </span>

                  {project.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] uppercase tracking-wider text-[#AAA69D]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* Closing Line */}
        <HairlineRule color="bg-[#D8D6D0]" className="mt-20 mb-8" />
        <div>
          <p className="font-serif text-2xl italic text-[#777777]">
            Every project begins with understanding its context.
          </p>
        </div>
      </div>
    </section>
  );
}
