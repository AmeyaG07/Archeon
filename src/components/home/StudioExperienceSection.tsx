
"use client";

import { ArrowUpRight } from "lucide-react";

interface StudioExperienceSectionProps {
  image?: string;
  onExplore?: () => void;
}

export function StudioExperienceSection({
  image,
  onExplore,
}: StudioExperienceSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#E8E5DE] py-24 md:py-36">
      <div className="editorial-container">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Visual */}
          <div className="relative lg:col-span-7">
            <div className="relative aspect-[5/4] overflow-hidden bg-[#C9C2B5]">
              {image ? (
                <img
                  src={image}
                  alt="Architectural space and natural light"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#D5CFC2] via-[#AAA394] to-[#777266]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#454138]">
                    Studio photography pending
                  </span>
                </div>
              )}

              <div className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-widest text-white">
                ARCHEON / SPATIAL EXPERIENCE
              </div>
            </div>

            <div className="absolute -bottom-8 -right-4 hidden h-32 w-32 border border-[#B68A4A] lg:block" />
          </div>

          {/* Content */}
          <div className="relative lg:col-span-5">
            <p className="editorial-eyebrow text-[#A58A64]">
              07 / Beyond Architecture
            </p>

            <h2 className="mt-7 font-serif text-5xl leading-[1.12] tracking-tight text-[#111111] md:text-6xl">
              Space.
              <br />
              Light.
              <br />
              <span className="text-[#A58A64]">Experience.</span>
            </h2>

            <p className="mt-8 text-sm leading-8 text-[#68645D] md:text-base">
              Architecture is more than the arrangement of walls and
              volumes. It is the experience of moving through a space,
              the quality of natural light and the relationship between
              material and atmosphere.
            </p>

            <p className="mt-5 text-sm leading-8 text-[#68645D] md:text-base">
              At ArcheOn, the intention is to approach every design with
              sensitivity to its context, purpose and spatial character.
            </p>

            <button
              type="button"
              onClick={onExplore}
              className="editorial-link mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[#111111]"
            >
              Discover Our Approach
              <ArrowUpRight size={17} strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
