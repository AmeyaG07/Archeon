
"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@/config/siteConfig";

interface ProjectDetailViewProps {
  project: PortfolioProject;
  heroImage?: string;
  onBack?: () => void;
  onEnquire?: () => void;
}

export function ProjectDetailView({
  project,
  heroImage,
  onBack,
  onEnquire,
}: ProjectDetailViewProps) {
  return (
    <main className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      {/* Navigation */}
      <div className="editorial-container pt-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] transition-colors hover:text-[#A58A64]"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </button>
      </div>

      {/* Project Introduction */}
      <section className="editorial-container pb-16 pt-20 md:pb-24 md:pt-28">
        <p className="editorial-eyebrow text-[#A58A64]">
          {project.code} / {project.category}
        </p>

        <h1 className="mt-8 max-w-5xl font-serif text-5xl leading-[1.08] tracking-tight md:text-7xl lg:text-8xl">
          {project.title}
        </h1>

        <p className="mt-8 max-w-3xl font-serif text-xl leading-relaxed text-[#77736C] md:text-2xl">
          {project.heroSummary}
        </p>

        {/* Project Metadata */}
        <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-[#D8D6D0] pt-8 md:grid-cols-4">
          <Metadata label="Location" value={project.location} />
          <Metadata label="Year" value={project.year} />
          <Metadata label="Area" value={project.area} />
          <Metadata label="Status" value={project.status} />
        </div>
      </section>

      {/* Hero Visual */}
      <section className="editorial-container">
        <div className="relative aspect-[16/9] overflow-hidden bg-[#D4CFC5]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${project.title} architectural visual`}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                Project photography pending
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Project Narrative */}
      <section className="editorial-container py-24 md:py-36">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <p className="editorial-eyebrow text-[#A58A64]">
              Project Narrative
            </p>

            <h2 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">
              The thinking
              <br />
              behind the space.
            </h2>
          </div>

          <div className="space-y-14 lg:col-span-7 lg:col-start-6">
            <Narrative
              number="01"
              title="The Brief"
              description={project.brief}
            />

            <Narrative
              number="02"
              title="Design Response"
              description={project.designResponse}
            />
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="bg-white py-24 md:py-32">
        <div className="editorial-container">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="editorial-eyebrow text-[#A58A64]">
                Project Scope
              </p>

              <h2 className="mt-6 font-serif text-4xl md:text-5xl">
                Project
                <br />
                Deliverables
              </h2>
            </div>

            <div className="md:col-span-7 md:col-start-6">
              <div className="border-t border-[#D8D6D0]">
                {project.deliverables.map((item, index) => (
                  <div
                    key={`${index}-${item}`}
                    className="flex items-start justify-between gap-6 border-b border-[#D8D6D0] py-6"
                  >
                    <span className="font-mono text-xs text-[#A58A64]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="flex-1 text-sm leading-7 text-[#44413B]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Tags */}
      {project.tags.length > 0 && (
        <section className="editorial-container py-16">
          <p className="editorial-eyebrow text-[#A58A64]">
            Design Keywords
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="border border-[#D8D6D0] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#55514A]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="bg-[#111111] py-24 text-[#F2F0EB] md:py-32">
        <div className="editorial-container">
          <p className="editorial-eyebrow text-[#B68A4A]">
            Your Project Starts Here
          </p>

          <div className="mt-8 flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <h2 className="max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
              Have an idea worth
              <br />
              bringing to life?
            </h2>

            <button
              type="button"
              onClick={onEnquire}
              className="inline-flex min-h-14 items-center justify-between gap-8 border border-[#B68A4A] px-6 py-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#B68A4A]"
            >
              Start a Conversation
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metadata({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="pr-4">
      <p className="editorial-eyebrow text-[#99958D]">{label}</p>
      <p className="mt-3 text-sm text-[#33312D]">{value}</p>
    </div>
  );
}

function Narrative({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="border-t border-[#D8D6D0] pt-6">
      <span className="font-mono text-xs text-[#A58A64]">
        {number}
      </span>

      <h3 className="mt-5 font-serif text-3xl text-[#171717]">
        {title}
      </h3>

      <p className="mt-5 text-sm leading-8 text-[#68645D] md:text-base">
        {description}
      </p>
    </article>
  );
}
