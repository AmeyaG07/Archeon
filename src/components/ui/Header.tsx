
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowUpRight } from "lucide-react";

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
  { label: "Studio", href: "#studio" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export function Header({
  onOpenConsultation,
  onOpenClientPortal,
  onOpenVendorPortal,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

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
      if (e.key === "Escape" && mobileMenuOpen) {
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111111]/92 backdrop-blur-md text-[#F2F0EB]">
        <div className="editorial-container flex h-[76px] items-center justify-between">
          {/* Brand & Desktop Navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio homepage"
              className="relative z-10 mr-8 flex shrink-0 items-center transition-transform duration-300 hover:scale-[1.02] lg:mr-14"
            >
              <Image
                src="/brand-assets/logo-transparent.png"
                alt="ArcheOn Design Studio"
                width={180}
                height={52}
                priority
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-8 lg:flex"
            >
              {navigation.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigation(item.href)}
                  className="group relative py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/70 transition-colors duration-300 hover:text-[#C6A779]"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[#C6A779] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-6 lg:flex">
            <button
              type="button"
              onClick={onOpenClientPortal}
              className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 transition-colors duration-300 hover:text-white"
            >
              Client Access
            </button>

            <button
              type="button"
              onClick={onOpenVendorPortal}
              className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 transition-colors duration-300 hover:text-white"
            >
              Vendor Access
            </button>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="group inline-flex items-center gap-2 border border-[#C6A779]/70 bg-[#C6A779]/15 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#F2F0EB] transition-all duration-300 hover:border-[#C6A779] hover:bg-[#C6A779] hover:text-[#111111]"
            >
              Start a Conversation
              <ArrowUpRight
                size={13}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="relative z-10 flex h-11 w-11 items-center justify-center border border-white/20 text-white lg:hidden touch-target"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div
        id="mobile-navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-40 overflow-y-auto bg-[#111111] text-[#F2F0EB] transition-all duration-500 lg:hidden ${
          mobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex min-h-full flex-col px-6 pb-10 pt-20 sm:pt-24">
          <p className="editorial-eyebrow mb-8 text-[#C6A779]">
            ArcheOn Design Studio
          </p>

          <nav aria-label="Mobile navigation" className="flex flex-col">
            {navigation.map((item, index) => (
              <button
                key={item.label}
                type="button"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => handleNavigation(item.href)}
                className="flex items-center justify-between border-b border-white/10 py-5 text-left font-serif text-3xl text-white"
              >
                <span>{item.label}</span>
                <span className="font-mono text-xs text-[#C6A779]">
                  0{index + 1}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <button
              type="button"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                onOpenClientPortal();
              }}
              className="block w-full border border-white/20 px-5 py-4 text-left text-xs uppercase tracking-widest text-white/80"
            >
              Client Access
            </button>

            <button
              type="button"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                onOpenVendorPortal();
              }}
              className="block w-full border border-white/20 px-5 py-4 text-left text-xs uppercase tracking-widest text-white/80"
            >
              Vendor Access
            </button>

            <button
              type="button"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => {
                closeMenu();
                onOpenConsultation();
              }}
              className="flex w-full items-center justify-between border border-[#C6A779] bg-[#C6A779] px-5 py-4 text-xs uppercase tracking-widest text-[#111111]"
            >
              Start a Conversation
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
