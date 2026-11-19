"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";

const FooterClockEmblem = dynamic(
  () => import("@/components/home/FooterClockEmblem").then((m) => m.FooterClockEmblem),
  {
    ssr: false,
    loading: () => null,
  }
);

interface SiteFooterProps {
  onOpenClientPortal: () => void;
  onOpenVendorPortal: () => void;
}

const footerLinks = [
  { label: "Studio", href: "#studio" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export function SiteFooter({
  onOpenClientPortal,
  onOpenVendorPortal,
}: SiteFooterProps) {
  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden bg-[#0A0A0A] min-h-[85vh] flex flex-col justify-between text-[#F2F0EB] py-14 sm:py-20">
      {/* =================================================================== */}
      {/* 1. FULL-BLEED DRAMATIC BACKGROUND CHRONOMETER CENTERPIECE           */}
      {/* =================================================================== */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <FooterClockEmblem variant="background" />
      </div>

      {/* =================================================================== */}
      {/* 2. SUBTLE RADIAL READABILITY SCRIM                                   */}
      {/* =================================================================== */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none select-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,10,10,0.58) 0%, rgba(10,10,10,0.85) 65%, #0A0A0A 100%)",
        }}
      />

      {/* =================================================================== */}
      {/* 3. FOREGROUND EDITORIAL FOOTER CONTENT                               */}
      {/* =================================================================== */}
      <div className="editorial-container relative z-10 flex flex-col justify-between flex-1 gap-16">
        {/* Main 4-Column Grid */}
        <div className="grid gap-12 border-t border-white/15 pt-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column with Clean Badge */}
          <div className="flex flex-col items-start">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio home"
              className="inline-flex items-center rounded-sm bg-[#111111] px-2.5 py-1.5 shadow-sm border border-white/10 transition-transform duration-300 hover:scale-[1.02]"
            >
              <Image
                src="/brand-assets/logo.png"
                alt="ArcheOn Design Studio"
                width={160}
                height={90}
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </Link>

            <p className="mt-6 max-w-xs text-xs leading-7 text-white/60">
              {siteConfig.tagline}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97724] animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A779]">
                NAGPUR STUDIO // 21.1458° N, 79.0882° E
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="editorial-eyebrow text-[#B68A4A]">
              Explore
            </p>

            <nav className="mt-6 flex flex-col items-start gap-4">
              {footerLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToSection(link.href)}
                  className="editorial-link text-xs text-white/65 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Disciplines */}
          <div>
            <p className="editorial-eyebrow text-[#B68A4A]">
              Disciplines
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {siteConfig.services.map((service) => (
                <p
                  key={service.id}
                  className="text-xs text-white/65"
                >
                  {service.title}
                </p>
              ))}
            </div>
          </div>

          {/* Private Access */}
          <div>
            <p className="editorial-eyebrow text-[#B68A4A]">
              Private Access
            </p>

            <div className="mt-6 flex flex-col items-start gap-4">
              <button
                type="button"
                onClick={onOpenClientPortal}
                className="editorial-link flex items-center gap-2 text-xs text-white/65 hover:text-white"
              >
                Client Portal
                <ArrowUpRight size={12} />
              </button>

              <button
                type="button"
                onClick={onOpenVendorPortal}
                className="editorial-link flex items-center gap-2 text-xs text-white/65 hover:text-white"
              >
                Vendor Portal
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-5 border-t border-white/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9px] uppercase tracking-wider text-white/40">
            {siteConfig.copyright}
          </p>

          <p className="text-[10px] text-white/40">
            {siteConfig.rights}
          </p>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="editorial-link text-[10px] uppercase tracking-widest text-[#C6A779]"
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
