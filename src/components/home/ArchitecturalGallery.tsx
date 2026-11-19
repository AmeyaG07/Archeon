
"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export interface ArchitecturalGalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
}

interface ArchitecturalGalleryProps {
  items: ArchitecturalGalleryItem[];
  onSelect?: (item: ArchitecturalGalleryItem) => void;
}

export function ArchitecturalGallery({
  items,
  onSelect,
}: ArchitecturalGalleryProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <section className="overflow-hidden bg-[#E8E5DE] py-24 md:py-36">
      <div className="editorial-container">
        {/* Section Heading */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="editorial-eyebrow text-[#A58A64]">
              04 / Visual Perspectives
            </p>

            <h2 className="mt-6 font-serif text-5xl leading-tight tracking-tight text-[#111111] md:text-7xl">
              The art of
              <br />
              spatial experience.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-8 text-[#6F6B63] md:col-span-4">
            Architecture comes alive through light, proportion, material
            and the relationship between spaces.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-7">
          {items.map((item, index) => {
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveItem(item.id);
                  onSelect?.(item);
                }}
                onMouseEnter={() => setActiveItem(item.id)}
                onMouseLeave={() => setActiveItem(null)}
                className={`group relative block w-full overflow-hidden bg-[#CFCAC0] text-left ${
                  index % 3 === 1
                    ? "md:col-span-5 md:mt-20"
                    : "md:col-span-7"
                }`}
                aria-label={`Explore ${item.title}`}
              >
                <div
                  role="img"
                  aria-label={item.title}
                  className={`relative aspect-[4/3] w-full bg-cover bg-center transition-transform duration-700 ${
                    isActive ? "scale-[1.035]" : "scale-100"
                  }`}
                  style={{
                    backgroundImage: `url("${item.image}")`,
                  }}
                >
                  {!item.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#55514A]">
                        Image pending
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
                </div>

                <div className="flex items-start justify-between gap-4 py-5">
                  <div>
                    <p className="editorial-eyebrow text-[#A58A64]">
                      {item.category}
                    </p>

                    <h3 className="mt-2 font-serif text-2xl text-[#171717]">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="mt-2 max-w-md text-sm leading-7 text-[#77736C]">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <span className="mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#B8B2A8] transition-all duration-300 group-hover:border-[#A58A64] group-hover:bg-[#A58A64] group-hover:text-white">
                    <ArrowUpRight size={17} strokeWidth={1.4} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-[#CFCBC2] pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736C]">
            ARCHEON DESIGN STUDIO / SPATIAL STUDIES
          </p>
        </div>
      </div>
    </section>
  );
}
