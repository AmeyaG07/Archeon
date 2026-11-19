
"use client";

import React from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

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
      className="bg-white py-24 sm:py-32"
    >
      <div className="editorial-container">

        {/* Section Header */}
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-eyebrow text-[#B68A4A]">
              03 / Selected Work
            </p>

            <h2 className="mt-6 font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#111111] sm:text-7xl">
              Spaces that tell
              <br />
              <span className="italic">their own story.</span>
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-8 text-[#777777]">
            A selection of architectural, interior and landscape
            projects shaped by context, material and the experience
            of inhabiting space.
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className={`group ${
                index === 0 ? "md:col-span-2" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectProject(project)}
                className="block w-full text-left"
                aria-label={`View ${project.title} project`}
              >
                {/* Honest Image Placeholder */}
                <div
                  className={`relative overflow-hidden bg-gradient-to-br ${
                    projectVisuals[project.id] ??
                    "from-[#777064] to-[#302C25]"
                  } ${
                    index === 0
                      ? "aspect-[16/8]"
                      : "aspect-[4/3]"
                  }`}
                >
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute right-[12%] top-[12%] h-[85%] w-[35%] -skew-x-12 border-l border-white/40 bg-white/10" />
                    <div className="absolute bottom-0 left-[10%] h-[45%] w-[65%] border-t border-white/30 bg-black/10" />
                    <div className="absolute right-[20%] top-[20%] h-[55%] w-[18%] border-l border-white/30 bg-white/10" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                  <div className="absolute left-5 top-5">
                    <span className="border border-white/40 bg-black/15 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur-sm">
                      {project.category}
                    </span>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="editorial-eyebrow text-white/65">
                        {project.code}
                      </p>
                      <p className="mt-2 text-xs text-white/85">
                        Architectural project visual pending
                      </p>
                    </div>

                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 text-white transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A] group-hover:text-[#111111]">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                </div>

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
            </article>
          ))}
        </div>

        {/* Closing Line */}
        <div className="mt-20 border-t border-[#D8D6D0] pt-8">
          <p className="font-serif text-2xl italic text-[#777777]">
            Every project begins with understanding its context.
          </p>
        </div>
      </div>
    </section>
  );
}
