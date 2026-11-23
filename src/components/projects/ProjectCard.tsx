
"use client";

import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

interface ProjectCardProps {
  project: PortfolioProject;
  image?: string;
  onSelect?: (project: PortfolioProject) => void;
  featured?: boolean;
}

export function ProjectCard({
  project,
  image,
  onSelect,
  featured = false,
}: ProjectCardProps) {
  return (
    <article className="group">
      <button
        type="button"
        onClick={() => onSelect?.(project)}
        className="block w-full text-left"
        aria-label={`View project: ${project.title}`}
      >
        {/* Project Image */}
        <div
          className={`relative overflow-hidden bg-[#D8D4CC] ${
            featured ? "aspect-[5/4]" : "aspect-[4/3]"
          }`}
        >
          {image ? (
            <img
              src={image}
              alt={`${project.title} — ${project.category}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#D5CFC2] to-[#A69D8E]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#55514A]">
                Photography pending
              </span>
            </div>
          )}

          <span className="absolute left-5 top-5 bg-[#F2F0EB]/90 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-[#33312D]">
            {project.category}
          </span>

          <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-black/10 text-white transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A]">
            <ArrowUpRight size={18} strokeWidth={1.4} />
          </span>
        </div>

        {/* Project Information */}
        <div className="flex items-start justify-between gap-5 border-b border-[#D8D6D0] py-6">
          <div>
            <p className="editorial-eyebrow text-[#A58A64]">
              {project.code} / {project.year}
            </p>

            <h3 className="mt-3 font-serif text-2xl leading-tight text-[#171717] transition-colors group-hover:text-[#A58A64] md:text-3xl">
              {project.title}
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              {project.location}
            </p>
          </div>

          <span className="mt-1 shrink-0 font-mono text-[9px] uppercase tracking-wider text-[#99958D]">
            {project.status}
          </span>
        </div>

        {/* Summary */}
        <p className="mt-5 max-w-xl text-sm leading-7 text-[#77736C]">
          {project.heroSummary}
        </p>
      </button>
    </article>
  );
}
