
"use client";

import { PortalDashboardSkeleton } from "@/components/portal/shared/PortalSkeleton";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
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
  category: "Project" | "Invoice" | "Payment" | "Document";
}

export interface ClientDashboardData {
  clientName: string;
  projects: DashboardProject[];
  invoices: DashboardInvoice[];
  activities: DashboardActivity[];
}

interface ClientPortalDashboardProps {
  data: ClientDashboardData;
  loading?: boolean;
  error?: string;
  onOpenProjects: () => void;
  onOpenProject: (project: DashboardProject) => void;
  onOpenInvoices: () => void;
  onOpenInvoice: (invoice: DashboardInvoice) => void;
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
  onRetry,
}: ClientPortalDashboardProps) {
  const outstandingTotal = data.invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.outstandingAmount),
    0
  );

  if (loading) {
    return <PortalDashboardSkeleton label="Loading your client dashboard..." />;
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
        <header className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A6D43]">
              ARCHEON DESIGN STUDIO / CLIENT PORTAL
            </p>

            <h1 className="mt-2.5 font-serif text-3xl text-[#171717] md:text-4xl">
              Welcome, {data.clientName}
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#66625B]">
              Your projects, shared documents and account activity
              in one place.
            </p>
          </div>
        </header>

        {/* Overview Cards */}
        <section
          aria-label="Account overview"
          className="mt-7 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3"
        >
          <OverviewCard
            label="Assigned Projects"
            value={String(data.projects.length)}
            icon={<Building2 size={18} />}
          />

          <OverviewCard
            label="Outstanding Balance"
            value={formatCurrency(outstandingTotal)}
            icon={<IndianRupee size={18} />}
          />

          <OverviewCard
            label="Invoices"
            value={String(data.invoices.length)}
            icon={<FileText size={18} />}
          />
        </section>

        {/* Projects */}
        <section className="mt-9">
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D43]">
                Your Work
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#171717] md:text-3xl">
                My Projects
              </h2>
            </div>

            <button
              type="button"
              onClick={onOpenProjects}
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[#66625B] hover:text-[#A58A64]"
            >
              All Projects
              <ArrowUpRight size={15} />
            </button>
          </div>

          {data.projects.length === 0 ? (
            <EmptyState message="Projects assigned to your account will appear here." />
          ) : (
            <div
              className={`grid gap-5 py-7 ${
                data.projects.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
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

        {/* Invoices */}
        <section className="mt-10">
          <div>
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
        </section>

        {/* Recent Activity */}
        <section className="mt-16">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Latest Activity
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Recent Updates
            </h2>
          </div>

          {data.activities.length === 0 ? (
            <EmptyState message="New activity related to your account will appear here." />
          ) : (
            <div className="mt-3">
              {data.activities.slice(0, 6).map((activity) => (
                <article
                  key={activity.id}
                  className="flex items-start gap-4 border-b border-[#D8D6D0] py-6"
                >
                  <span className="mt-1 shrink-0 text-[#A58A64]">
                    {getActivityIcon(activity.category)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-sm text-[#171717]">
                        {activity.title}
                      </h3>

                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                        {activity.category}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-[#77736C]">
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
    <div className="bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#55514A]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-3 break-words font-serif text-2xl text-[#171717] sm:text-3xl">
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
