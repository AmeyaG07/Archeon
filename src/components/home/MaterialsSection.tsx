
"use client";

import { ArrowUpRight } from "lucide-react";

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
}

interface MaterialsSectionProps {
  materials: MaterialItem[];
  onSelectMaterial?: (material: MaterialItem) => void;
}

export function MaterialsSection({
  materials,
  onSelectMaterial,
}: MaterialsSectionProps) {
  if (!materials.length) return null;

  return (
    <section className="overflow-hidden bg-[#111111] py-24 text-[#F2F0EB] md:py-36">
      <div className="editorial-container">
        {/* Heading */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="editorial-eyebrow text-[#B68A4A]">
              06 / Material & Craft
            </p>

            <h2 className="mt-6 max-w-3xl font-serif text-5xl leading-tight tracking-tight md:text-7xl">
              The character
              <br />
              of materials.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-8 text-white/55 md:col-span-4">
            Material, texture and light contribute to the identity of
            every architectural space.
          </p>
        </div>

        {/* Material Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material, index) => (
            <article key={material.id} className="group">
              <button
                type="button"
                onClick={() => onSelectMaterial?.(material)}
                className="block w-full text-left"
                aria-label={`Explore ${material.name}`}
              >
                <div
                  className={`relative aspect-[4/5] overflow-hidden bg-[#292824] ${
                    index === 1 ? "lg:mt-16" : ""
                  }`}
                >
                  {material.image ? (
                    <img
                      src={material.image}
                      alt={material.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Material image pending
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />

                  <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/10 text-white transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A]">
                    <ArrowUpRight size={18} strokeWidth={1.4} />
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="editorial-eyebrow text-[#B68A4A]">
                      {material.category}
                    </p>

                    <h3 className="mt-3 font-serif text-2xl text-[#F2F0EB]">
                      {material.name}
                    </h3>
                  </div>

                  <span className="font-mono text-[10px] text-white/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="mt-3 max-w-sm text-sm leading-7 text-white/50">
                  {material.description}
                </p>
              </button>
            </article>
          ))}
        </div>

        {/* Closing Line */}
        <div className="mt-20 border-t border-white/15 pt-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            ARCHEON DESIGN STUDIO / MATERIAL STUDIES
          </p>
        </div>
      </div>
    </section>
  );
}
