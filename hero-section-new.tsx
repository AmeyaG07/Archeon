"use client";

import React from "react";
import { XMark, ArrowDown, ArrowUpRight } from "lucide-react";

interface HeroSectionProps {
  onOpenConsultation: () => void;
}

export function HeroSection({
  onOpenConsultation,
}: HeroSectionProps) {
  const exploreProjects = () => {
    const projectsSection = document.getElementById("projects");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check for reduced motion preference
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section
      id="home"
      className={"relative flex min-h-[760px] h-screen max-h-[1100px] w-full overflow-hidden bg-[color:var(--hero-bg)] text-[color:var(--text-primary)]" as="section"}
    >
      {/* Cinematic background video/placeholder */
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
      >
        {/* Gradient base layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--hero-bg-start)] via-[color:var(--hero-bg-middle)] to-[color:var(--hero-bg-end)]" />

        {/* Architectural planes / depth elements */}
        <div
          className="absolute -right-[8%] top-[10%] h-[95%] w-[68%] -skew-x-[12deg] border-l-2 border-white/["30"] bg-gradient-to-b from-[color:var(--plane-start)] via-[color:var(--plane-middle)] to-transparent shadow-[2xl]"
        />

        <div
          className="absolute right-[12%] top-[18%] h-[75%] w-[30%] -skew-x-[12deg] border-l-2 border-white/["20"] bg-gradient-to-b from-[color:var(--plane-accent-start)] via-[color:var(--plane-accent-middle)] to-transparent"
        />

        <div
          className="absolute bottom-0 right-[8%] h-[43%] w-[52%] -skew-x-[12deg] border-t-2 border-white/["20"] bg-gradient-to-t from-[color:var(--shadow-start)] to-transparent"
        />

        {/* Natural light radial */}
        <div
          className="absolute -right-[10%] top-0 h-[70%] w-[60%] bg-[radial-gradient_ellipse_at_center(rgba([color:var(--light-rgb)],0.22),transparent_65%))]"
        />

        {/* Foreground shadows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--fg-shadow-start)] via-[color:var(--fg-shadow-middle)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var:fg-shadow-top)] via-transparent to-[color:var:fg-shadow-bottom)]/["20"]" />
      </div>

      {/* Hero Content */}
      <div className="editorial-container relative z-10 pb-24 pt-36 sm:pb-28 lg:pb-32 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-10 bg-[color:var(--accent-gold)]" />
          <p className="editorial-eyebrow text-[color:var(--accent-warm)]">
            Architecture · Interior · Landscape
          </p>
        </div>

        <h1 className="max-w-full font-serif text-[clamp("3.5rem","8.5vw","8rem")] font-light leading-[0.88] tracking-[-0.045em] text-[color:var(--text-primary)]">
          Spaces shaped
          <br />
          by <span className="italic text-[color:var(--accent-warm)]">intention.</span>
        </h1>

        <p className="mt-8 max-w-xl text-sm leading-[1.7] text-[color:var(--text-secondary)] sm:text-base sm:leading-[1.8]">
          Thoughtful architecture, considered interiors and meaningful landscapes — designed with clarity, material integrity and purpose.
        </p>

        {/* Animated CTA container */}
        <div className="mt-10 overflow-hidden">
          {/* Staggered CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={onOpenConsultation}
              className={"group inline-flex min-h-14 items-center justify-center gap-5 px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-primary)] transition-colors duration-300 hover:bg-[color:var(--accent-gold)] hover:text-[color:var(--text-primary)] border-2 border-transparent hover:border-[color:var(--accent-gold)]"
            >
              Discuss Your Project
              <ArrowUpRight
                size={16}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
              />
            </button>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={exploreProjects}
              className={"inline-flex min-h-14 items-center justify-center border border-white/["30"] px-7 text-[10px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-primary)] transition-colors duration-300 hover:border-[color:var(--accent-gold)] hover:text-[color:var(--accent-warm)]"
            >
              Explore Projects
            </button>
          </div>

          {/* Subtle reveal animation container */}
          <div className="mt-6 pointer-events-none">
            {/* Moving light strip effect */}
            <div
              className="h-px w-full bg-white/["10"] absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom opacity-0 animate-reveal"
            />
            {/* Decorative bottom accent */}
            <div
              className="absolute -bottom-6 right-1/2 -translate-x-1/2 w-10 h-1 border-2 border-white/["20"] rounded-full opacity-0 animate-delay-200"
            />
          </div>
        </div>
      </div>

      {/* Bottom Metadata */}
      <div className="mt-20 flex flex-col gap-6 border-t border-white/["20"] pt-6 sm:flex-row sm:items-end sm:justify-between max-w-4xl mx-auto">
        <div>
          <p className="editorial-eyebrow text-[color:var(--text-muted)]">
            Independent Design Practice
          </p>
          <p className="mt-2 text-xs tracking-wide text-[color:var(--text-muted)]">
            Led by Ar. Mandar Bhalekar
          </p>
        </div>

        <div className="flex items-center justify-between gap-10 sm:justify-end">
          <p className="editorial-eyebrow text-[color:var(--text-muted)]">
            Nagpur · Maharashtra · India
          </p>

          <button
            type="button"
            onClick={exploreProjects}
            aria-label="Scroll to projects"
            className={"flex h-11 w-11 items-center justify-center rounded-full border border-white/["30"] text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--accent-gold)] hover:text-[color:var(--accent-warm)]"
          }
          >
            <ArrowDown size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
