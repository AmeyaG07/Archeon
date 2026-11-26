
"use client";

import {
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { PortalDashboardSkeleton } from "@/components/portal/shared/PortalSkeleton";

import {
  LayoutDashboard,
  Building2,
  FileText,
  IndianRupee,
  MessageSquareWarning,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export type VendorPortalSection =
  | "dashboard"
  | "projects"
  | "invoices"
  | "cash-settlements"
  | "support"
  | "settings";

interface VendorPortalLayoutProps {
  children: ReactNode;

  activeSection: VendorPortalSection;

  vendorName: string;
  businessName: string;
  vendorReference: string;

  onNavigate: (section: VendorPortalSection) => void;
  onLogout: () => void;

  pageTitle?: string;
  pageDescription?: string;

  loading?: boolean;
}

interface NavigationItem {
  id: VendorPortalSection;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const NAVIGATION: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    description: "Your workspace",
    icon: LayoutDashboard,
  },
  {
    id: "projects",
    label: "Assigned Projects",
    description: "Project assignments",
    icon: Building2,
  },
  {
    id: "invoices",
    label: "Invoices",
    description: "Invoice submissions",
    icon: FileText,
  },
  {
    id: "cash-settlements",
    label: "Cash Settlements",
    description: "Settlement acknowledgements",
    icon: IndianRupee,
  },
  {
    id: "support",
    label: "Help & Support",
    description: "Support requests",
    icon: LifeBuoy,
  },
  {
    id: "settings",
    label: "Account Settings",
    description: "Profile and security",
    icon: Settings,
  },
];

export function VendorPortalLayout({
  children,
  activeSection,
  vendorName,
  businessName,
  vendorReference,
  onNavigate,
  onLogout,
  pageTitle,
  pageDescription,
  loading = false,
}: VendorPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Lock body scroll when mobile drawer is open
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

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const activeItem = NAVIGATION.find(
    (item) => item.id === activeSection
  );

  function handleNavigate(section: VendorPortalSection) {
    onNavigate(section);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    setLogoutConfirmation(false);
    setMobileMenuOpen(false);
    onLogout();
  }

  return (
    <div className="vendor-portal-root min-h-screen bg-[#F2F0EB] text-[#171717]">

      {/* Mobile Header */}
      <header className="vendor-mobile-header sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-[#343434] bg-[#111111] px-5 lg:hidden">
        <div>
          <p className="font-serif text-xl tracking-wide text-[#F2F0EB]">
            ARCHEON
          </p>

          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Workspace
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label={
            mobileMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 items-center justify-center border border-[#343434] text-white"
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      <div className="flex min-h-screen">

        {/* Desktop Sidebar (collapses to logo/icon rail when cursor is on dashboard; expands on hover) */}
        <aside
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={`vendor-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#111111] text-white transition-all duration-300 ease-out lg:flex ${
            sidebarHovered ? "w-[270px] shadow-[12px_0_40px_rgba(0,0,0,0.35)]" : "w-[76px]"
          }`}
        >

          {/* Brand */}
          <div className={`border-b border-[#343434] transition-all duration-300 ${sidebarHovered ? "px-7 py-7" : "flex justify-center px-2 py-6"}`}>
            {sidebarHovered ? (
              <>
                <div className="flex items-center gap-3">
                  <img
                    src="/brand-assets/logo-transparent.png"
                    alt="ArcheOn Design Studio"
                    className="h-10 w-auto shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-wide text-[#F2F0EB]">
                      ArcheOn Studio
                    </p>
                    <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-[#A58A64]">
                      Architecture &amp; Design
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#343434] pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#777777]">
                    Private Workspace
                  </p>

                  <p className="mt-1.5 text-xs text-[#D8D6D0]">
                    Vendor Portal
                  </p>
                </div>
              </>
            ) : (
              <img
                src="/brand-assets/logo-transparent.png"
                alt="ArcheOn Design Studio"
                title="ArcheOn Design Studio — Vendor Portal"
                className="h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              />
            )}
          </div>

          {/* Navigation */}
          <nav
            aria-label="Vendor navigation"
            className={`flex-1 overflow-y-auto py-6 ${sidebarHovered ? "px-4" : "px-2.5"}`}
          >
            {sidebarHovered && (
              <p className="mb-4 px-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#777777]">
                Workspace
              </p>
            )}

            <div className="space-y-1">
              {NAVIGATION.map((item) => (
                <NavigationButton
                  key={item.id}
                  item={item}
                  active={activeSection === item.id}
                  collapsed={!sidebarHovered}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </div>
          </nav>

          {/* Vendor Identity */}
          <div className={`border-t border-[#343434] ${sidebarHovered ? "p-5" : "flex flex-col items-center gap-3 p-3"}`}>
            <div className={`flex items-center ${sidebarHovered ? "gap-3" : "justify-center"}`}>
              <div
                title={vendorName}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A58A64]/40 bg-[#25221D] text-[#C5A36D]"
              >
                <UserRound size={18} />
              </div>

              {sidebarHovered && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">
                    {vendorName}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-[#99958D]">
                    {businessName}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLogoutConfirmation(true)}
              title="Sign Out"
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#2c2c2c] bg-[#161616] font-mono text-[9px] uppercase tracking-wider text-[#8e8a83] transition-colors hover:border-[#A58A64]/60 hover:bg-[#1f1e1a] hover:text-white ${
                sidebarHovered ? "mt-3.5 px-2.5 py-1.5" : "h-9 w-9"
              }`}
            >
              <LogOut size={13} />
              {sidebarHovered && "Sign Out"}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-[#111111] pt-[70px] lg:hidden">
            <div className="flex h-full flex-col overflow-y-auto px-5 py-7">

              <div className="mb-7 border-b border-[#343434] pb-6">
                <p className="text-sm font-medium text-white">
                  {vendorName}
                </p>

                <p className="mt-2 text-xs text-[#99958D]">
                  {businessName}
                </p>

                <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  {vendorReference}
                </p>
              </div>

              <nav
                aria-label="Mobile vendor navigation"
                className="space-y-2"
              >
                {NAVIGATION.map((item) => (
                  <NavigationButton
                    key={item.id}
                    item={item}
                    active={activeSection === item.id}
                    onClick={() => handleNavigate(item.id)}
                    mobile
                  />
                ))}
              </nav>

              <button
                type="button"
                onClick={() => setLogoutConfirmation(true)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded border border-[#2c2c2c] bg-[#161616] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8a83] transition-colors hover:text-white"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div
          className={`portal-main-column min-w-0 flex-1 transition-all duration-300 ease-out ${
            sidebarHovered ? "lg:ml-[270px]" : "lg:ml-[76px]"
          }`}
        >

          {/* Desktop Topbar */}
          <header className="hidden h-[76px] items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-8 md:px-10 lg:flex">

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[#99958D]">
              <span>Vendor Portal</span>
              <ChevronRight size={13} />

              <span className="text-[#33312D]">
                {activeItem?.label ?? "Workspace"}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs font-medium text-[#33312D]">
                  {vendorName}
                </p>

                <p className="mt-1 font-mono text-[9px] text-[#99958D]">
                  {vendorReference}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center border border-[#D8D6D0] bg-white text-[#A58A64]">
                <UserRound size={16} />
              </div>
            </div>
          </header>

          {/* Page Heading */}
          {(pageTitle || pageDescription) && (
            <div className="border-b border-[#D8D6D0] px-5 py-7 md:px-10 lg:px-12">
              {pageTitle && (
                <h1 className="font-serif text-2xl text-[#171717] md:text-3xl">
                  {pageTitle}
                </h1>
              )}

              {pageDescription && (
                <p className="mt-2 max-w-2xl text-xs leading-6 text-[#77736C]">
                  {pageDescription}
                </p>
              )}
            </div>
          )}

          {/* Page Content */}
          <main className="min-h-[calc(100vh-76px)]">
            {loading ? (
              <PortalDashboardSkeleton label="Loading workspace..." />
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#D8D6D0] px-5 py-6 md:px-10 lg:px-12">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                ARCHEON DESIGN STUDIO
              </p>

              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                <ShieldCheck size={13} />
                Private Vendor Workspace
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Logout Confirmation */}
      {logoutConfirmation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLogoutConfirmation(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-logout-title"
            className="w-full max-w-xs border border-[#D8D6D0] bg-[#F2F0EB] p-5 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#D8D6D0] bg-white text-[#A58A64]">
                <LogOut size={14} />
              </div>
              <h2
                id="vendor-logout-title"
                className="font-serif text-lg text-[#171717]"
              >
                Sign out?
              </h2>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#77736C]">
              Are you sure you want to leave your vendor workspace?
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmation(false)}
                className="flex-1 border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[#77736C] hover:bg-[#e8e6e1]"
              >
                Stay
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-[#171717] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-[#A58A64]"
              >
                Sign Out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function NavigationButton({
  item,
  active,
  onClick,
  mobile = false,
  collapsed = false,
}: {
  item: NavigationItem;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group flex w-full items-center text-left transition-colors ${
        collapsed ? "justify-center px-0 py-3.5" : "gap-4 px-4 py-3.5"
      } ${
        mobile ? "min-h-[58px]" : "min-h-[52px]"
      } ${
        active
          ? "border-l-2 border-[#B68A4A] bg-[#24221E] text-white"
          : "border-l-2 border-transparent text-[#99958D] hover:bg-[#1D1D1D] hover:text-white"
      }`}
    >
      <Icon
        size={collapsed ? 18 : 17}
        strokeWidth={1.6}
        className={
          active
            ? "shrink-0 text-[#C5A36D]"
            : "shrink-0 text-[#777777] group-hover:text-[#C5A36D]"
        }
      />

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] tracking-wide">
              {item.label}
            </span>

            {!mobile && (
              <span className="mt-1 block text-[9px] text-[#777777]">
                {item.description}
              </span>
            )}
          </span>

          {active && (
            <ChevronRight
              size={14}
              className="shrink-0 text-[#A58A64]"
            />
          )}
        </>
      )}
    </button>
  );
}
