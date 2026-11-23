
"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Images,
  FileText,
  CreditCard,
  MessageSquareWarning,
  Bell,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export type ClientPortalSection =
  | "dashboard"
  | "invoices"
  | "projects"
  | "documents"
  | "notifications"
  | "support"
  | "settings";

interface ClientPortalLayoutProps {
  children: ReactNode;

  activeSection: ClientPortalSection;

  clientName: string;
  clientReference: string;

  unreadNotifications?: number;

  onNavigate: (section: ClientPortalSection) => void;
  onLogout: () => void;

  pageTitle?: string;
  pageDescription?: string;

  loading?: boolean;
}

interface NavigationItem {
  id: ClientPortalSection;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}

const NAVIGATION: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    description: "Your project summary",
    icon: LayoutDashboard,
  },
  {
    id: "invoices",
    label: "Bills & Invoices",
    description: "Review and settle your bills",
    icon: CreditCard,
  },
  {
    id: "projects",
    label: "My Projects",
    description: "Project progress and details",
    icon: Building2,
  },
  {
    id: "documents",
    label: "Document Library",
    description: "Your project documents",
    icon: FileText,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Important updates",
    icon: Bell,
    badge: true,
  },
  {
    id: "support",
    label: "Help & Support",
    description: "Contact the studio",
    icon: LifeBuoy,
  },
  {
    id: "settings",
    label: "Account Settings",
    description: "Profile and security",
    icon: Settings,
  },
];

export function ClientPortalLayout({
  children,
  activeSection,
  clientName,
  clientReference,
  unreadNotifications = 0,
  onNavigate,
  onLogout,
  pageTitle,
  pageDescription,
  loading = false,
}: ClientPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);

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

  function handleNavigate(section: ClientPortalSection) {
    onNavigate(section);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    setLogoutConfirmation(false);
    setMobileMenuOpen(false);
    onLogout();
  }

  return (
    <div className="client-portal-root min-h-screen bg-[#F2F0EB] text-[#171717]">

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-[#343434] bg-[#111111] px-5 lg:hidden">
        <div>
          <p className="font-serif text-xl tracking-wide text-[#F2F0EB]">
            ARCHEON
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Workspace
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

        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] flex-col bg-[#111111] text-white lg:flex">

          {/* Brand */}
          <div className="border-b border-[#343434] px-8 py-8">
            <p className="font-serif text-2xl tracking-wide text-[#F2F0EB]">
              ARCHEON
            </p>

            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#A58A64]">
              Design Studio
            </p>

            <div className="mt-7 border-t border-[#343434] pt-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#777777]">
                Private Workspace
              </p>
              <p className="mt-2 text-xs text-[#D8D6D0]">
                Client Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Client navigation"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <p className="mb-4 px-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#777777]">
              My Workspace
            </p>

            <div className="space-y-1">
              {NAVIGATION.map((item) => (
                <NavigationButton
                  key={item.id}
                  item={item}
                  active={activeSection === item.id}
                  unreadCount={
                    item.id === "notifications"
                      ? unreadNotifications
                      : 0
                  }
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </div>
          </nav>

          {/* Client Identity */}
          <div className="border-t border-[#343434] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#A58A64]/40 bg-[#25221D] text-[#C5A36D]">
                <UserRound size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">
                  {clientName}
                </p>
                <p className="mt-1 truncate font-mono text-[9px] text-[#99958D]">
                  {clientReference}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLogoutConfirmation(true)}
              className="mt-3.5 inline-flex items-center gap-2 rounded border border-[#2c2c2c] bg-[#161616] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8e8a83] transition-colors hover:border-[#A58A64]/60 hover:bg-[#1f1e1a] hover:text-white"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-[#111111] pt-[70px] lg:hidden">
            <div className="flex h-full flex-col overflow-y-auto px-5 py-7">

              <div className="mb-7 border-b border-[#343434] pb-6">
                <p className="text-sm font-medium text-white">
                  {clientName}
                </p>

                <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  {clientReference}
                </p>
              </div>

              <nav
                aria-label="Mobile client navigation"
                className="space-y-2"
              >
                {NAVIGATION.map((item) => (
                  <NavigationButton
                    key={item.id}
                    item={item}
                    active={activeSection === item.id}
                    unreadCount={
                      item.id === "notifications"
                        ? unreadNotifications
                        : 0
                    }
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
        <div className="min-w-0 flex-1 lg:ml-[270px]">

          {/* Desktop Topbar */}
          <header className="hidden h-[76px] items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-8 md:px-10 lg:flex">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[#99958D]">
              <span>Client Portal</span>
              <ChevronRight size={13} />
              <span className="text-[#33312D]">
                {activeItem?.label ?? "Workspace"}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-xs font-medium text-[#33312D]">
                  {clientName}
                </p>
                <p className="mt-1 font-mono text-[9px] text-[#99958D]">
                  {clientReference}
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
              <div className="flex min-h-80 items-center justify-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
                  Loading workspace...
                </p>
              </div>
            ) : (
              children
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
                Private Client Workspace
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
            aria-labelledby="client-logout-title"
            className="w-full max-w-xs border border-[#D8D6D0] bg-[#F2F0EB] p-5 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#D8D6D0] bg-white text-[#A58A64]">
                <LogOut size={14} />
              </div>
              <h2
                id="client-logout-title"
                className="font-serif text-lg text-[#171717]"
              >
                Sign out?
              </h2>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#77736C]">
              Are you sure you want to leave your client workspace?
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmation(false)}
                className="flex-1 border border-[#D8D6D0] bg-white px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-[#77736C] hover:bg-[#e8e6e1]"
              >
                Stay
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-[#171717] px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-white hover:bg-[#A58A64]"
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
  unreadCount = 0,
  onClick,
  mobile = false,
}: {
  item: NavigationItem;
  active: boolean;
  unreadCount?: number;
  onClick: () => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${
        mobile ? "min-h-[58px]" : "min-h-[52px]"
      } ${
        active
          ? "border-l-2 border-[#B68A4A] bg-[#24221E] text-white"
          : "border-l-2 border-transparent text-[#99958D] hover:bg-[#1D1D1D] hover:text-white"
      }`}
    >
      <Icon
        size={17}
        strokeWidth={1.6}
        className={
          active
            ? "shrink-0 text-[#C5A36D]"
            : "shrink-0 text-[#777777] group-hover:text-[#C5A36D]"
        }
      />

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

      {item.badge && unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} unread notifications`}
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A58A64] px-1.5 font-mono text-[9px] text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {active && (
        <ChevronRight
          size={14}
          className="shrink-0 text-[#A58A64]"
        />
      )}
    </button>
  );
}
