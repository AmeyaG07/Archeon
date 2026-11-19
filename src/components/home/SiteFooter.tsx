
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { FooterClockEmblem } from "@/components/home/FooterClockEmblem";

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
    <footer className="bg-[#111111] text-[#F2F0EB]">
      <div className="editorial-container">
        {/* Signature Luxury Chronometer Emblem */}
        <div className="border-t border-white/10 pt-16 pb-12 flex flex-col items-center justify-center">
          <FooterClockEmblem />
        </div>

        <div className="grid gap-12 border-t border-white/15 py-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="ArcheOn Design Studio home" className="inline-flex items-center">
              <Image
                src={siteConfig.logo}
                alt={siteConfig.name}
                width={160}
                height={90}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="mt-6 max-w-xs text-xs leading-7 text-white/50">
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
