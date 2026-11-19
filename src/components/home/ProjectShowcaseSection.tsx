
"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

interface ProjectShowcaseSectionProps {
  projects: PortfolioProject[];
  onSelectProject?: (project: PortfolioProject) => void;
}

export function ProjectShowcaseSection({
  projects,
  onSelectProject,
}: ProjectShowcaseSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!projects.length) return null;

  const activeProject = projects[activeIndex];

  return (
    <section className="bg-[#F2F0EB] py-24 md:py-36">
      <div className="editorial-container">
        {/* Heading */}
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="editorial-eyebrow text-[#A58A64]">
              03 / Selected Work
            </p>

            <h2 className="mt-6 max-w-2xl font-serif text-5xl leading-tight tracking-tight text-[#111111] md:text-7xl">
              Spaces shaped
              <br />
              by intention.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-[#777777]">
            A selection of architectural and spatial projects reflecting
            our approach to design, materiality and experience.
          </p>
        </div>

        {/* Main Project */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            <button
              type="button"
              onClick={() => onSelectProject?.(activeProject)}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-[#D8D4CC] text-left"
              aria-label={`View ${activeProject.title}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9C1B3] via-[#A69D8E] to-[#6E6A62] transition-transform duration-700 group-hover:scale-[1.03]" />

              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10">
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-[#27251F]">
                    {activeProject.code}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-[#27251F]">
                    {activeProject.category.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span className="inline-block border border-[#27251F]/40 bg-[#F2F0EB]/70 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-[#27251F]">
                    Project photography pending
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Project Information */}
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <p className="editorial-eyebrow text-[#A58A64]">
                {activeProject.status}
              </p>

              <h3 className="mt-6 font-serif text-4xl leading-tight text-[#111111] md:text-5xl">
                {activeProject.title}
              </h3>

              <p className="mt-6 text-sm leading-8 text-[#66635D]">
                {activeProject.heroSummary}
              </p>

              <div className="mt-10 space-y-5 border-t border-[#D8D6D0] pt-6">
                <Info label="Location" value={activeProject.location} />
                <Info label="Year" value={activeProject.year} />
                <Info label="Area" value={activeProject.area} />
              </div>

              <button
                type="button"
                onClick={() => onSelectProject?.(activeProject)}
                className="editorial-link mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[#111111]"
              >
                Explore Project
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Project Navigation */}
            <div className="mt-16 border-t border-[#D8D6D0] pt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-[#777777]">
                  SELECTED PROJECT
                </span>

                <span className="font-mono text-xs text-[#777777]">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(projects.length).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                {projects.map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Select project ${project.title}`}
                    aria-pressed={activeIndex === index}
                    className={`h-1 flex-1 transition-colors duration-300 ${
                      activeIndex === index
                        ? "bg-[#A58A64]"
                        : "bg-[#D8D6D0] hover:bg-[#A8A39A]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="editorial-eyebrow text-[#99958D]">{label}</span>
      <span className="text-right text-sm text-[#33312D]">{value}</span>
    </div>
  );
}
