"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

const FooterClockEmblem = dynamic(
  () => import("@/components/home/FooterClockEmblem").then((m) => m.FooterClockEmblem),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-[260px] rounded-full border border-white/10 bg-white/[0.02] animate-pulse" />
    ),
  }
);

interface SiteFooterProps {
  onOpenClientPortal: () => void;
  onOpenVendorPortal: () => void;
  onOpenConsultation?: () => void;
}

const exploreLinks = [
  { label: "Studio", href: "#studio" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

const disciplines = [
  "Architecture",
  "Interior Design",
  "Landscape Architecture",
  "3D Visualisation",
  "Turnkey Execution",
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/dsarcheon",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/dsarcheon",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/archeon-design-studio",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export function SiteFooter({
  onOpenClientPortal,
  onOpenVendorPortal,
  onOpenConsultation,
}: SiteFooterProps) {
  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden bg-[#000000] text-[#F2F0EB] border-t border-white/10">
      <div className="editorial-container relative z-10 pt-10 lg:pt-12 pb-6 lg:pb-8">
        
        {/* Main Section: Left (Clock Animation) & Right (4 Columns) */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14 items-start">
          
          {/* Left Side: Clock Animation Logo (Background seamlessly matching pure black #000) */}
          <div className="w-full lg:w-[260px] shrink-0 flex flex-col items-center lg:items-start">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio home"
              className="inline-block transition-transform duration-300 hover:scale-[1.02]"
            >
              <FooterClockEmblem />
            </Link>
          </div>

          {/* Right Side: 4-Column Content with Left Vertical Divider & Compact Spacing */}
          <div className="flex-1 min-w-0 w-full lg:border-l lg:border-white/15 lg:pl-10 xl:pl-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-6 xl:gap-8">
              
              {/* Column 1: EXPLORE */}
              <div className="flex flex-col">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5">
                  EXPLORE
                </p>
                <nav className="flex flex-col gap-3">
                  {exploreLinks.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => scrollToSection(link.href)}
                      className="text-left font-['Outfit',sans-serif] text-[13.5px] text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Column 2: DISCIPLINES */}
              <div className="flex flex-col">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5">
                  DISCIPLINES
                </p>
                <div className="flex flex-col gap-3">
                  {disciplines.map((item) => (
                    <span
                      key={item}
                      className="font-['Outfit',sans-serif] text-[13.5px] text-white/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Column 3: PRIVATE ACCESS */}
              <div className="flex flex-col">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5">
                  PRIVATE ACCESS
                </p>
                
                {/* Portal Cards */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={onOpenClientPortal}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-white/30 text-[13px] font-['Outfit',sans-serif] text-white/90 hover:text-white transition-all group shadow-sm cursor-pointer"
                  >
                    <span>Client Portal</span>
                    <ArrowUpRight
                      size={13}
                      className="text-white/60 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenVendorPortal}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 hover:border-white/30 text-[13px] font-['Outfit',sans-serif] text-white/90 hover:text-white transition-all group shadow-sm cursor-pointer"
                  >
                    <span>Vendor Portal</span>
                    <ArrowUpRight
                      size={13}
                      className="text-white/60 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </button>
                </div>
              </div>

              {/* Column 4: STUDIO INQUIRIES & FOLLOW US (Only Logos) */}
              <div className="flex flex-col">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-5">
                  STUDIO INQUIRIES
                </p>
                <div className="flex flex-col gap-2 font-['Outfit',sans-serif] text-[13px] text-white/80">
                  <a
                    href="mailto:dsarcheon@gmail.com"
                    className="hover:text-white transition-colors truncate"
                    title="dsarcheon@gmail.com"
                  >
                    dsarcheon@gmail.com
                  </a>
                  <a
                    href="tel:+919834653481"
                    className="hover:text-white transition-colors tracking-wide"
                  >
                    +91 9834653481
                  </a>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onOpenConsultation || (() => scrollToSection("#contact"))}
                    className="inline-flex items-center gap-1.5 font-['Outfit',sans-serif] text-[12.5px] font-medium text-[#C6A779] hover:text-[#E0D8C3] transition-colors cursor-pointer group"
                  >
                    <span>Schedule a Consultation</span>
                    <ArrowUpRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </button>
                </div>

                {/* Follow Us - Only Logos */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6A779] font-medium mb-3">
                    FOLLOW US
                  </p>
                  <div className="flex items-center gap-2">
                    {socialLinks.map((s) => (
                      <a
                        key={s.name}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.name}
                        title={s.name}
                        className="w-8 h-8 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-white/10 hover:border-[#C6A779]/60 text-white/70 hover:text-[#C6A779] flex items-center justify-center transition-all shadow-sm group"
                      >
                        <span className="transition-transform duration-200 group-hover:scale-110">
                          {s.icon}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-8 lg:mt-10 border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-white/40 tracking-wider">
          <p>© 2026 ARCHEON DESIGN STUDIO</p>
          <p className="text-center sm:text-left text-[9.5px]">
            All Rights Reserved. Architecture · Interior · Landscape · Turnkey.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-[#C6A779] hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
