
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
      <div className="h-[200px] w-[200px] rounded-full border border-white/10 bg-white/[0.02] animate-pulse" />
    ),
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
    <footer className="relative overflow-hidden bg-[#0c0c0e] text-[#F2F0EB]">
      {/* =================================================================== */}
      {/* FULL-SECTION AMBIENT COLORFUL SHADE & ARCHITECTURAL AURA            */}
      {/* =================================================================== */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden select-none">
        {/* Primary Radiant Terracotta & Amber Core (Spreading across the whole footer) */}
        <div
          className="absolute -top-24 left-1/4 h-[550px] w-[900px] -translate-x-1/2 rounded-full blur-[140px] opacity-35 animate-[pulse_8s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200, 98, 30, 0.45) 0%, rgba(217, 119, 36, 0.25) 45%, rgba(245, 158, 11, 0.12) 70%, transparent 100%)",
          }}
        />

        {/* Ambient Clock Backlight Aura (Underneath ArcheOn Clock Dial) */}
        <div
          className="absolute top-10 left-8 sm:left-16 h-[400px] w-[400px] rounded-full blur-[110px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(200, 98, 30, 0.2) 50%, transparent 75%)",
          }}
        />

        {/* Secondary Warm Bronze & Gold Diffusion (Right Columns) */}
        <div
          className="absolute -top-10 right-[10%] h-[450px] w-[650px] rounded-full blur-[130px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(184, 137, 74, 0.3) 0%, rgba(217, 119, 36, 0.15) 50%, transparent 80%)",
          }}
        />

        {/* Deep Horizon Floor Glow (Bottom Wash) */}
        <div className="absolute -bottom-20 left-0 right-0 h-[280px] bg-gradient-to-t from-[#C8621E]/18 via-[#B8894A]/08 to-transparent blur-[80px]" />

        {/* Full-bleed Architectural Vignette Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundSize: "36px 36px",
            backgroundImage:
              "linear-gradient(to right, rgba(245, 158, 11, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 158, 11, 0.25) 1px, transparent 1px)",
          }}
        />
      </div>

      <div className="editorial-container relative z-10">
        <div className="grid gap-12 border-t border-white/15 py-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Signature Chronometer Emblem */}
          <div className="flex flex-col items-start">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio home"
              className="inline-block transition-transform duration-300 hover:scale-[1.02]"
            >
              <FooterClockEmblem compact />
            </Link>

            <p className="mt-5 max-w-xs text-xs leading-7 text-white/50">
              {siteConfig.tagline}
            </p>
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
        <div className="flex flex-col gap-5 border-t border-white/15 py-7 sm:flex-row sm:items-center sm:justify-between">
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
