
"use client";

import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Bell,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

export interface DashboardProject {
  id: string;
  name: string;
  location: string;
  status: string;
  updatedAt: string;
}

export interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  outstandingAmount: number;
  dueDate: string;
  status: string;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "Project" | "Invoice" | "Payment" | "Dispute" | "Document";
}

export interface ArchitectSiteVisit {
  id: string;
  projectName: string;
  architectName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  notes: string;
  instructions: string;
  photoUrl: string;
  verifiedStatus?: string;
}

export interface ClientDashboardData {
  clientName: string;
  projects: DashboardProject[];
  invoices: DashboardInvoice[];
  activities: DashboardActivity[];
  siteVisits?: ArchitectSiteVisit[];
  unreadNotifications: number;
}

interface ClientPortalDashboardProps {
  data: ClientDashboardData;
  loading?: boolean;
  error?: string;
  onOpenProjects: () => void;
  onOpenProject: (project: DashboardProject) => void;
  onOpenInvoices: () => void;
  onOpenInvoice: (invoice: DashboardInvoice) => void;
  onOpenDocuments: () => void;
  onOpenNotifications: () => void;
  onRetry?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getActivityIcon(category: DashboardActivity["category"]) {
  switch (category) {
    case "Project":
      return <Building2 size={17} />;

    case "Invoice":
      return <FileText size={17} />;

    case "Payment":
      return <IndianRupee size={17} />;

    case "Dispute":
      return <AlertCircle size={17} />;

    case "Document":
      return <FolderOpen size={17} />;
  }
}

export function ClientPortalDashboard({
  data,
  loading = false,
  error,
  onOpenProjects,
  onOpenProject,
  onOpenInvoices,
  onOpenInvoice,
  onOpenDocuments,
  onOpenNotifications,
  onRetry,
}: ClientPortalDashboardProps) {
  const outstandingTotal = data.invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.outstandingAmount),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading your client dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Dashboard unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* Top Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-9 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              ARCHEON DESIGN STUDIO / CLIENT PORTAL
            </p>

            <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
              Welcome, {data.clientName}
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#77736C]">
              Your projects, shared documents and account activity
              in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex w-fit items-center gap-3 border border-[#D8D6D0] bg-white px-5 py-3 text-xs text-[#33312D] hover:border-[#A58A64]"
          >
            <Bell size={17} className="text-[#A58A64]" />
            Notifications

            {data.unreadNotifications > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A58A64] px-1 text-[9px] text-white">
                {data.unreadNotifications > 99
                  ? "99+"
                  : data.unreadNotifications}
              </span>
            )}
          </button>
        </header>

        {/* Overview Cards */}
        <section
          aria-label="Account overview"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-4"
        >
          <OverviewCard
            label="Assigned Projects"
            value={String(data.projects.length)}
            icon={<Building2 size={19} />}
          />

          <OverviewCard
            label="Outstanding Balance"
            value={formatCurrency(outstandingTotal)}
            icon={<IndianRupee size={19} />}
          />

          <OverviewCard
            label="Invoices"
            value={String(data.invoices.length)}
            icon={<FileText size={19} />}
          />

          <OverviewCard
            label="Unread Notifications"
            value={String(data.unreadNotifications)}
            icon={<Bell size={19} />}
          />
        </section>

        {/* Top: Recent Updates & Architect Site Visits */}
        <section className="mt-14 space-y-16">
          {/* Recent Updates */}
          <div>
            <div className="border-b border-[#D8D6D0] pb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Latest Activity
              </p>
              <h3 className="mt-2 font-serif text-3xl text-[#171717]">
                Recent Updates
              </h3>
            </div>

            {data.activities.length === 0 ? (
              <EmptyState message="New activity related to your account will appear here." />
            ) : (
              <div className="mt-3 divide-y divide-[#D8D6D0] border-b border-[#D8D6D0]">
                {data.activities.slice(0, 6).map((activity) => (
                  <article
                    key={activity.id}
                    className="flex items-start gap-4 py-4"
                  >
                    <span className="mt-1 shrink-0 text-[#A58A64]">
                      {getActivityIcon(activity.category)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xs font-semibold text-[#171717]">
                          {activity.title}
                        </h4>

                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                          {activity.category}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-[#77736C]">
                        {activity.description}
                      </p>
                    </div>

                    <span className="shrink-0 font-mono text-[9px] text-[#99958D]">
                      {activity.date}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Architect Site Visits & Field Instructions */}
          <div>
            <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Principal Architect Field Supervision
                </p>
                <h2 className="mt-2 font-serif text-3xl text-[#171717]">
                  Architect Site Visits &amp; Instructions
                </h2>
                <p className="mt-1 text-xs text-[#77736C]">
                  Photographic logs and engineering instructions posted directly by Ar. Mandar Bhalekar during site inspections with date and time.
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#A58A64] bg-white border border-[#D8D6D0] px-3 py-1">
                {(data.siteVisits && data.siteVisits.length > 0 ? data.siteVisits.length : 3)} Inspection Logs
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(data.siteVisits && data.siteVisits.length > 0 ? data.siteVisits : [
                {
                  id: "sv-1",
                  projectName: "The Monolith Sanctuary (Khandala)",
                  architectName: "Ar. Mandar Bhalekar (Principal Architect)",
                  visitDate: "23 Nov 2026",
                  visitTime: "11:45 AM",
                  location: "Sector 4 — North Pavilion & Pool Deck",
                  notes: "Physical site inspection of cantilever slab shuttering and natural basalt stone masonry. Alignment within 2mm specified tolerance.",
                  instructions: "Approved post-tensioned concrete pour. Contractor must maintain continuous water ponding curing for 14 days minimum. Protect basalt edges with corrugated sheets.",
                  photoUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80",
                  verifiedStatus: "Inspection Signed Off",
                },
                {
                  id: "sv-2",
                  projectName: "The Travertine Penthouse",
                  architectName: "Ar. Mandar Bhalekar (Principal Architect)",
                  visitDate: "22 Nov 2026",
                  visitTime: "03:30 PM",
                  location: "Upper Deck — Terrace Pergola & Glazing Channel",
                  notes: "Inspected recessed aluminum curtain wall extrusion profiles and waterproofing membrane test after 48h water ponding.",
                  instructions: "Membrane watertight integrity verified. Silicon sealant joint width to be strictly 12mm as per detail drawing AT-DET-08.",
                  photoUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&auto=format&fit=crop&q=80",
                  verifiedStatus: "Field Notes Issued",
                },
                {
                  id: "sv-3",
                  projectName: "Bhalekar Residence Turnkey",
                  architectName: "Ar. Mandar Bhalekar (Principal Architect)",
                  visitDate: "20 Nov 2026",
                  visitTime: "10:15 AM",
                  location: "Courtyard & Central Light-Well",
                  notes: "Reviewed daylight penetration angle at solar noon. Custom skylight mullion structural anchors verified.",
                  instructions: "Proceed with Italian marble sub-base dry lay for client inspection on Saturday.",
                  photoUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&auto=format&fit=crop&q=80",
                  verifiedStatus: "Supervision Note Logged",
                },
              ]).map((visit) => (
                <div
                  key={visit.id}
                  className="group flex flex-col justify-between border border-[#D8D6D0] bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="relative h-48 w-full overflow-hidden bg-black/5">
                      <img
                        src={visit.photoUrl}
                        alt={visit.location}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 rounded bg-black/75 px-2 py-0.5 font-mono text-[9px] text-[#C5A36D]">
                        {visit.visitDate} · {visit.visitTime}
                      </div>
                      <div className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 font-mono text-[9px] text-white">
                        {visit.location}
                      </div>
                    </div>

                    {/* Same-line Architect Name & Project Name */}
                    <div className="flex items-baseline justify-between gap-3 border-b border-[#EAE8E3] pb-2 min-w-0">
                      <h4 className="font-serif text-base font-medium text-[#171717] truncate" title={visit.architectName}>
                        {visit.architectName}
                      </h4>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] shrink-0 font-medium max-w-[45%] text-right truncate" title={visit.projectName}>
                        {visit.projectName}
                      </span>
                    </div>

                    <div className="border-t border-[#EAE8E3] pt-2 space-y-2">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#888] block">
                          Inspection Notes:
                        </span>
                        <p className="text-xs text-[#444] leading-relaxed">
                          {visit.notes}
                        </p>
                      </div>

                      <div className="rounded bg-[#FAF9F5] border border-[#EAE8E3] p-2.5">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] block font-semibold">
                          Architect Instructions to Site:
                        </span>
                        <p className="mt-0.5 font-mono text-[10px] text-[#222] leading-relaxed">
                          &ldquo;{visit.instructions}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#EAE8E3] pt-3 font-mono text-[9px] text-[#777]">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 size={11} /> {visit.verifiedStatus || "Site Verified"}
                    </span>
                    <span>{visit.visitTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Your Work
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                My Projects
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              All Projects
              <ArrowUpRight size={15} />
            </button>
          </div>

          {data.projects.length === 0 ? (
            <EmptyState message="Projects assigned to your account will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-5 py-7 md:grid-cols-2">
              {data.projects.slice(0, 4).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onOpenProject(project)}
                  className="border border-[#D8D6D0] bg-white p-6 text-left transition-colors hover:border-[#A58A64] md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      Assigned Project
                    </span>

                    <ArrowUpRight
                      size={17}
                      className="text-[#99958D]"
                    />
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                    {project.name}
                  </h3>

                  <p className="mt-2 text-xs text-[#77736C]">
                    {project.location}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-5">
                    <span className="bg-[#ECEAE5] px-3 py-2 text-[9px] uppercase tracking-widest text-[#66635D]">
                      {project.status}
                    </span>

                    <span className="font-mono text-[9px] text-[#99958D]">
                      Updated {project.updatedAt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Invoices and Quick Access */}
        <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">

          {/* Invoices */}
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Financial Overview
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                  Recent Invoices
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenInvoices}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
              >
                View All
                <ArrowUpRight size={15} />
              </button>
            </div>

            {data.invoices.length === 0 ? (
              <EmptyState message="Your invoices will appear here when shared by the studio." />
            ) : (
              <div className="mt-2">
                {data.invoices.slice(0, 5).map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => onOpenInvoice(invoice)}
                    className="flex w-full flex-col justify-between gap-4 border-b border-[#D8D6D0] py-6 text-left transition-colors hover:bg-white/60 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                        {invoice.invoiceNumber}
                      </p>

                      <h3 className="mt-2 text-sm text-[#171717]">
                        {invoice.projectName}
                      </h3>

                      <p className="mt-2 text-[10px] text-[#99958D]">
                        Due: {invoice.dueDate}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-serif text-xl text-[#171717]">
                        {formatCurrency(invoice.outstandingAmount)}
                      </p>

                      <span className="mt-2 inline-block text-[9px] uppercase tracking-widest text-[#77736C]">
                        {invoice.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access */}
          <aside className="lg:col-span-4 lg:col-start-9">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Your Workspace
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Quick Access
            </h2>

            <div className="mt-7 space-y-3">
              <QuickAccessItem
                icon={<FolderOpen size={19} />}
                title="Document Library"
                description="Approved drawings and shared files"
                onClick={onOpenDocuments}
              />

              <QuickAccessItem
                icon={<FileText size={19} />}
                title="Invoices & Payments"
                description="Review your financial records"
                onClick={onOpenInvoices}
              />

              <QuickAccessItem
                icon={<Bell size={19} />}
                title="Notifications"
                description="View recent account activity"
                onClick={onOpenNotifications}
              />
            </div>

            <div className="mt-7 border border-[#D8D6D0] bg-white p-6">
              <CheckCircle2
                size={21}
                className="text-[#A58A64]"
              />

              <h3 className="mt-4 font-serif text-xl text-[#171717]">
                Your Client Workspace
              </h3>

              <p className="mt-3 text-xs leading-6 text-[#77736C]">
                Access project information and documents that
                have been authorised for your account.
              </p>
            </div>
          </aside>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE CLIENT WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function OverviewCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 break-words font-serif text-2xl text-[#171717] md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function QuickAccessItem({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border border-[#D8D6D0] bg-white p-5 text-left transition-colors hover:border-[#A58A64]"
    >
      <span className="shrink-0 text-[#A58A64]">{icon}</span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm text-[#171717]">
          {title}
        </span>

        <span className="mt-1 block text-[10px] leading-5 text-[#99958D]">
          {description}
        </span>
      </span>

      <ArrowUpRight
        size={16}
        className="shrink-0 text-[#99958D]"
      />
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-b border-[#D8D6D0] px-5 py-12 text-center">
      <FolderOpen
        size={25}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
