"use client";

import React, { useState } from "react";
import { ArrowUpRight, MapPin, Sparkles, Scan, Crosshair, Layers } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";
import {
  RevealText,
  HairlineRule,
  StaggerGrid,
  StaggerItem,
} from "@/components/motion/EditorialMotion";
import { ProjectImageCard, ProjectAnimationMode } from "./ProjectImageCard";

interface ProjectsSectionProps {
  projects: PortfolioProject[];
  onSelectProject: (project: PortfolioProject) => void;
}

export function ProjectsSection({
  projects,
  onSelectProject,
}: ProjectsSectionProps) {
  const [animationMode, setAnimationMode] = useState<ProjectAnimationMode>("combined");

  const demoModes: { id: ProjectAnimationMode; label: string; desc: string; icon: React.ElementType }[] = [
    {
      id: "tilt",
      label: "01 · 3D Tectonic Tilt",
      desc: "Interactive gyroscope tilt with dynamic specular glass reflection & depth parallax",
      icon: Sparkles,
    },
    {
      id: "blueprint",
      label: "02 · CAD Blueprint Scan",
      desc: "Laser scan sweep revealing underlying CAD gridlines, dimension strings & elevation specs",
      icon: Scan,
    },
    {
      id: "viewfinder",
      label: "03 · Cinematic Viewfinder",
      desc: "Slow aperture zoom drift with dynamic crosshair reticle tracking coordinates",
      icon: Crosshair,
    },
    {
      id: "combined",
      label: "★ All Combined (Grand Master)",
      desc: "Harmonious synergy of 3D tilt, specular sheen, CAD scan, and precision reticle",
      icon: Layers,
    },
  ];

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

        <HairlineRule color="bg-[#D8D6D0]" className="mb-10" />

        {/* Interactive Animation Demo Switcher Bar */}
        <div className="mb-14 rounded-2xl border border-[#E5E0D8] bg-[#FAF8F5]/90 p-5 sm:p-6 backdrop-blur-md shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#B68A4A] animate-ping" />
              <p className="font-mono text-xs uppercase tracking-widest text-[#B68A4A] font-semibold">
                Project Image Animation Showcase
              </p>
            </div>
            <p className="font-mono text-[11px] text-[#777777]">
              Hover your cursor over the project images below to test live motion & effects
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {demoModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = animationMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setAnimationMode(mode.id)}
                  className={`group relative flex flex-col text-left rounded-xl p-4 transition-all duration-300 border ${
                    isActive
                      ? "border-[#B68A4A] bg-[#111111] text-white shadow-lg ring-1 ring-[#B68A4A]/50 scale-[1.01]"
                      : "border-[#E5E0D8] bg-white hover:border-[#B68A4A]/50 text-[#111111] shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-semibold tracking-wider">
                      {mode.label}
                    </span>
                    <Icon
                      size={15}
                      className={isActive ? "text-[#C6A779]" : "text-[#777777] group-hover:text-[#B68A4A]"}
                    />
                  </div>
                  <p
                    className={`mt-2 text-[11px] leading-relaxed ${
                      isActive ? "text-[#D8D6D0]" : "text-[#777777]"
                    }`}
                  >
                    {mode.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

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
              <div className="block w-full text-left">
                {/* Architectural Interactive Project Image */}
                <ProjectImageCard
                  project={project}
                  index={index}
                  animationMode={animationMode}
                  onClick={() => onSelectProject(project)}
                />

                {/* Project Information */}
                <div
                  onClick={() => onSelectProject(project)}
                  className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between cursor-pointer"
                >
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
              </div>
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
