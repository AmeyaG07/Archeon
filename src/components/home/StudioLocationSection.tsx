
import { ArrowUpRight, MapPin } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

export function StudioLocationSection() {
  return (
    <section className="bg-[#E8E5DE] py-24 md:py-32">
      <div className="editorial-container">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">

          {/* Introduction */}
          <div className="lg:col-span-5">
            <p className="editorial-eyebrow text-[#A58A64]">
              09 / Find the Studio
            </p>

            <h2 className="mt-7 font-serif text-5xl leading-tight text-[#111111] md:text-7xl">
              A place to
              <br />
              begin.
            </h2>

            <p className="mt-8 max-w-md text-sm leading-8 text-[#6F6B63] md:text-base">
              Have a project in mind? Connect with our studio to
              discuss your ideas and explore the possibilities.
            </p>

            <div className="mt-12 border-t border-[#CCC8BF] pt-8">
              <div className="flex items-start gap-4">
                <MapPin
                  size={19}
                  strokeWidth={1.4}
                  className="mt-1 shrink-0 text-[#A58A64]"
                />

                <div>
                  <p className="editorial-eyebrow text-[#A58A64]">
                    Studio Address
                  </p>

                  <address className="mt-4 max-w-sm not-italic text-sm leading-8 text-[#33312D]">
                    {siteConfig.contact.office}
                  </address>
                </div>
              </div>
            </div>

            <a
              href={siteConfig.contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-link mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[#111111]"
            >
              Get Directions
              <ArrowUpRight size={17} strokeWidth={1.4} />
            </a>
          </div>

          {/* Location Visual */}
          <div className="lg:col-span-7">
            <a
              href={siteConfig.contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open ArcheOn Design Studio location in Google Maps"
              className="group relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-[#D1CDC4]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, transparent 48%, #99948A 49%, #99948A 50%, transparent 51%), linear-gradient(-45deg, transparent 48%, #99948A 49%, #99948A 50%, transparent 51%)",
                  backgroundSize: "55px 55px",
                }}
              />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#A58A64] bg-[#F2F0EB] text-[#A58A64] transition-transform duration-500 group-hover:-translate-y-2">
                  <MapPin size={26} strokeWidth={1.3} />
                </div>

                <p className="mt-6 font-serif text-2xl text-[#22201C]">
                  ArcheOn Design Studio
                </p>

                <span className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                  Nagpur, Maharashtra
                </span>

                <span className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Open Google Maps
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </a>

            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                ARCHEON / NAGPUR
              </span>

              <span className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                STUDIO LOCATION
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
