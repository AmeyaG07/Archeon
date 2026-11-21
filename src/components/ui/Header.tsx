"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Shield, ChevronDown, Phone, Mail } from "lucide-react";

interface HeaderProps {
  lightingMode: "noon" | "sunset" | "night";
  onSelectLighting: (mode: "noon" | "sunset" | "night") => void;
  wireframeMode: boolean;
  onToggleWireframe: () => void;
  onOpenConsultation: () => void;
  onOpenClientPortal: () => void;
  onOpenVendorPortal: () => void;
}

const navigation = [
  { label: "Studio", href: "#studio", index: "01" },
  { label: "Expertise", href: "#expertise", index: "02" },
  { label: "Projects", href: "#projects", index: "03" },
  { label: "Process", href: "#process", index: "04" },
  { label: "Contact", href: "#contact", index: "05" },
];

export function Header({
  onOpenConsultation,
  onOpenClientPortal,
  onOpenVendorPortal,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setPortalDropdownOpen(false);
  };

  // Scroll listener for dynamic glassmorphic elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavigation = (href: string) => {
    closeMenu();

    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? "h-[70px] bg-[#0c0c0c]/90 border-b border-[#B68A4A]/25 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
            : "h-[80px] bg-gradient-to-b from-[#0A0A0A]/95 via-[#0E0E0E]/80 to-transparent border-b border-white/[0.08] backdrop-blur-md"
        } text-[#F2F0EB]`}
      >
        {/* Subtle top architectural ambient gold accent line */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A779]/50 to-transparent" />

        <div className="editorial-container flex h-full items-center justify-between">
          {/* Left: Brand Identity & Atelier Monogram */}
          <div className="flex items-center gap-3 xl:gap-7">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio homepage"
              className="group relative z-10 flex shrink-0 items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="relative">
                {/* Ambient glow aura */}
                <div className="absolute -inset-1.5 rounded-full bg-[#B68A4A]/25 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Image
                  src="/brand-assets/logo-transparent.png"
                  alt="ArcheOn Design Studio"
                  width={180}
                  height={52}
                  priority
                  className="relative h-8 sm:h-9 xl:h-10 w-auto object-contain transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Atelier Architectural Stamp */}
              <div className="hidden flex-col border-l border-[#B68A4A]/30 pl-2.5 xl:flex">
                <span className="font-['Cinzel',serif] text-[9.5px] font-semibold tracking-[0.24em] text-[#E0D8C3] uppercase group-hover:text-[#C6A779] transition-colors">
                  Atelier
                </span>
                <span className="font-mono text-[8px] tracking-[0.18em] text-[#B68A4A] uppercase">
                  Ar. Mandar Bhalekar
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — Luxury Classical Roman Typography with Gold Index */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-0.5 xl:gap-1.5 lg:flex"
            >
              {navigation.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigation(item.href)}
                  className="group relative px-2 xl:px-3 py-2 text-[11px] xl:text-[12px] font-['Cinzel',serif] font-medium uppercase tracking-[0.18em] xl:tracking-[0.22em] text-[#D0CBBF] hover:text-[#FFFFFF] transition-all duration-300"
                >
                  <span className="flex items-center gap-1 xl:gap-1.5">
                    <span className="font-mono text-[8.5px] xl:text-[9px] text-[#B68A4A] opacity-50 group-hover:opacity-100 group-hover:text-[#D4AF37] transition-all">
                      {item.index}
                    </span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  </span>

                  {/* Refined Gold Ambient Underline Indicator */}
                  <span className="absolute bottom-0 left-1/2 h-[1.5px] w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#C6A779] to-transparent transition-all duration-300 group-hover:w-4/5 shadow-[0_0_8px_rgba(198,167,121,0.8)]" />
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Desktop Action Suite & Portals */}
          <div className="hidden items-center gap-4 lg:flex">
            {/* Portals Access Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPortalDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 font-mono text-[10.5px] tracking-[0.16em] uppercase backdrop-blur-md ${
                  portalDropdownOpen
                    ? "border-[#B68A4A] bg-[#B68A4A]/20 text-[#E0D8C3] shadow-[0_0_15px_rgba(182,138,74,0.3)]"
                    : "border-white/15 bg-white/[0.04] text-white/75 hover:border-[#B68A4A]/60 hover:bg-[#B68A4A]/10 hover:text-white"
                }`}
              >
                <Shield size={12} className="text-[#B68A4A]" />
                <span>Portals</span>
                <ChevronDown
                  size={11}
                  className={`transition-transform duration-300 text-white/60 ${
                    portalDropdownOpen ? "rotate-180 text-[#B68A4A]" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {portalDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-sm border border-[#B68A4A]/30 bg-[#121212]/95 backdrop-blur-2xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  onMouseLeave={() => setPortalDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-[#B68A4A] border-b border-white/10 mb-1">
                    Secure Workspace
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPortalDropdownOpen(false);
                      onOpenClientPortal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-stone-300 hover:text-white hover:bg-white/10 rounded-xs transition-colors flex items-center justify-between group"
                  >
                    <span>Client Portal</span>
                    <ArrowUpRight
                      size={12}
                      className="text-[#B68A4A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPortalDropdownOpen(false);
                      onOpenVendorPortal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-stone-300 hover:text-white hover:bg-white/10 rounded-xs transition-colors flex items-center justify-between group"
                  >
                    <span>Vendor Portal</span>
                    <ArrowUpRight
                      size={12}
                      className="text-[#B68A4A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <Link
                    href="/login"
                    onClick={() => setPortalDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-[#C6A779] hover:text-white hover:bg-[#B68A4A]/25 rounded-xs transition-colors flex items-center justify-between group"
                  >
                    <span>Admin Login</span>
                    <ArrowUpRight
                      size={12}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </Link>
                </div>
              )}
            </div>

            {/* Premium Gold CTA: Start Conversation / Inquire Project */}
            <button
              type="button"
              onClick={onOpenConsultation}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#B68A4A] via-[#9F742F] to-[#B68A4A] bg-[length:200%_auto] px-5 py-2 font-['Outfit',sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111111] transition-all duration-500 hover:bg-[position:right_center] hover:shadow-[0_0_22px_rgba(182,138,74,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Inquire Project</span>
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>

          {/* Right Mobile Action: Sleek Architectural Hamburger Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="px-3 py-1.5 rounded-full border border-[#B68A4A]/70 bg-[#B68A4A]/20 font-['Outfit',sans-serif] text-[10px] font-medium uppercase tracking-[0.16em] text-[#F2F0EB] hover:bg-[#B68A4A] hover:text-[#111111] transition-all"
            >
              Inquire
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#B68A4A]/40 bg-[#161616]/80 text-[#F2F0EB] hover:border-[#B68A4A] hover:bg-[#B68A4A]/20 hover:text-[#C6A779] transition-all duration-300 shadow-md touch-target"
            >
              {mobileMenuOpen ? (
                <span className="font-mono text-sm text-[#C6A779]">✕</span>
              ) : (
                <div className="flex flex-col items-end gap-1 w-4">
                  <span className="h-[1.5px] w-full bg-current transition-all" />
                  <span className="h-[1.5px] w-2.5 bg-[#C6A779] transition-all" />
                  <span className="h-[1.5px] w-full bg-current transition-all" />
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Architectural Mobile Navigation Overlay */}
      <div
        id="mobile-navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-40 overflow-y-auto bg-[#0A0A0A]/98 backdrop-blur-2xl text-[#F2F0EB] transition-all duration-500 lg:hidden ${
          mobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex min-h-full flex-col px-6 pb-12 pt-24 sm:px-10">
          {/* Header Eyebrow */}
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="font-['Cinzel',serif] text-sm font-semibold tracking-[0.25em] text-[#C6A779] uppercase">
                ArcheOn Design Studio
              </p>
              <p className="font-mono text-[10px] text-stone-400 tracking-wider">
                Ar. Mandar Bhalekar · Architecture & Interiors
              </p>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-[#B68A4A]/40 text-[#B68A4A]">
              EST. 2026
            </span>
          </div>

          {/* Navigation Links in Luxury Serif / Roman Font */}
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {navigation.map((item) => (
              <button
                key={item.label}
                type="button"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => handleNavigation(item.href)}
                className="group flex items-center justify-between border-b border-white/[0.08] py-4 text-left font-['Cinzel',serif] text-2xl tracking-[0.16em] text-white/90 hover:text-[#C6A779] transition-all"
              >
                <span className="group-hover:translate-x-2 transition-transform duration-300">
                  {item.label}
                </span>
                <span className="font-mono text-xs text-[#B68A4A] opacity-70 group-hover:opacity-100">
                  {item.index}
                </span>
              </button>
            ))}
          </nav>

          {/* Portals & Actions */}
          <div className="mt-8 pt-4 border-t border-white/10 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B68A4A]">
              Project Access & Portals
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => {
                  closeMenu();
                  onOpenClientPortal();
                }}
                className="border border-white/15 bg-white/[0.03] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-white/80 hover:border-[#B68A4A] hover:text-[#C6A779] transition-all rounded-xs flex items-center justify-between"
              >
                <span>Client Portal</span>
                <ArrowUpRight size={13} className="text-[#B68A4A]" />
              </button>

              <button
                type="button"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => {
                  closeMenu();
                  onOpenVendorPortal();
                }}
                className="border border-white/15 bg-white/[0.03] px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-white/80 hover:border-[#B68A4A] hover:text-[#C6A779] transition-all rounded-xs flex items-center justify-between"
              >
                <span>Vendor Portal</span>
                <ArrowUpRight size={13} className="text-[#B68A4A]" />
              </button>
            </div>

            <Link
              href="/login"
              onClick={closeMenu}
              className="block w-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wider text-stone-300 hover:text-white hover:border-[#B68A4A] transition-all rounded-xs"
            >
              Studio Staff & Admin Login
            </Link>

            <button
              type="button"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                onOpenConsultation();
              }}
              className="flex w-full items-center justify-between rounded-xs border border-[#C6A779] bg-gradient-to-r from-[#B68A4A] to-[#8C6527] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#111111] shadow-[0_4px_20px_rgba(182,138,74,0.4)]"
            >
              <span>Inquire Project</span>
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Quick Studio Contacts */}
          <div className="mt-auto pt-8 flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="text-[#B68A4A]" /> +91 93224 58477
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-[#B68A4A]" /> studio@archeon.design
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
