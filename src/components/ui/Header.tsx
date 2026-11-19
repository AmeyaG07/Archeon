
"use client";

import React, { useState } from "react";
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
  { label: "Journal", href: "#journal" },
  { label: "Contact", href: "#contact" },
];

export function Header({
  onOpenConsultation,
  onOpenClientPortal,
  onOpenVendorPortal,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#D8D6D0]/80 bg-[#F2F0EB]/95 backdrop-blur-md">
        <div className="editorial-container flex h-[76px] items-center justify-between">
          {/* Brand & Desktop Navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              aria-label="ArcheOn Design Studio homepage"
              className="group relative z-10 mr-8 flex shrink-0 items-center rounded-sm bg-[#111111] px-2.5 py-1 shadow-sm transition-transform duration-300 hover:scale-[1.02] lg:mr-12"
            >
              <Image
                src="/brand-assets/logo.png"
                alt="ArcheOn Design Studio"
                width={160}
                height={90}
                priority
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-7 lg:flex"
            >
              {navigation.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigation(item.href)}
                  className="editorial-link text-[11px] font-medium uppercase tracking-[0.13em] text-[#55534F] hover:text-[#111111]"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-5 lg:flex">
            <button
              type="button"
              onClick={onOpenClientPortal}
              className="editorial-link text-[10px] font-medium uppercase tracking-[0.12em] text-[#55534F]"
            >
              Client Access
            </button>

            <button
              type="button"
              onClick={onOpenVendorPortal}
              className="editorial-link text-[10px] font-medium uppercase tracking-[0.12em] text-[#55534F]"
            >
              Vendor Access
            </button>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="group inline-flex items-center gap-2 border border-[#111111] bg-[#111111] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-[#B68A4A] hover:border-[#B68A4A] hover:text-[#111111]"
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
            className="relative z-10 flex h-11 w-11 items-center justify-center border border-[#D8D6D0] text-[#111111] lg:hidden"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div
        id="mobile-navigation"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-40 bg-[#F2F0EB] transition-all duration-500 lg:hidden ${
          mobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex h-full flex-col px-6 pb-10 pt-28">
          <p className="editorial-eyebrow mb-8 text-[#B68A4A]">
            ArcheOn Design Studio
          </p>

          <nav aria-label="Mobile navigation" className="flex flex-col">
            {navigation.map((item, index) => (
              <button
                key={item.label}
                type="button"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={() => handleNavigation(item.href)}
                className="flex items-center justify-between border-b border-[#D8D6D0] py-5 text-left font-serif text-3xl text-[#111111]"
              >
                <span>{item.label}</span>
                <span className="font-mono text-xs text-[#B68A4A]">
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
              className="block w-full border border-[#D8D6D0] px-5 py-4 text-left text-xs uppercase tracking-widest text-[#111111]"
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
              className="block w-full border border-[#D8D6D0] px-5 py-4 text-left text-xs uppercase tracking-widest text-[#111111]"
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
              className="flex w-full items-center justify-between bg-[#111111] px-5 py-4 text-xs uppercase tracking-widest text-white"
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
