
"use client";

import { PortalDashboardSkeleton } from "@/components/portal/shared/PortalSkeleton";
import {
  ArrowUpRight,
  Building2,
  FileText,
  IndianRupee,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
  FolderOpen,
} from "lucide-react";

export type VendorInvoiceStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Partially Paid"
  | "Paid"
  | "Rejected";

export interface VendorDashboardProject {
  id: string;
  name: string;
  location: string;
  assignment: string;
  status: string;
  updatedAt: string;
}

export interface VendorDashboardInvoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  status: VendorInvoiceStatus;
  submittedAt: string;
}

export interface VendorDashboardActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "Project" | "Invoice" | "Payment" | "Announcement";
}

export interface VendorDashboardData {
  vendorName: string;
  organisationName?: string;
  projects: VendorDashboardProject[];
  invoices: VendorDashboardInvoice[];
  activities: VendorDashboardActivity[];
}

interface VendorPortalDashboardProps {
  data: VendorDashboardData;
  loading?: boolean;
  error?: string;

  onOpenProjects: () => void;
  onOpenProject: (project: VendorDashboardProject) => void;

  onOpenInvoices: () => void;
  onOpenInvoice: (invoice: VendorDashboardInvoice) => void;

  onCreateInvoice: () => void;
  onOpenDocuments: () => void;

  onRetry?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInvoiceStatusStyle(status: VendorInvoiceStatus) {
  switch (status) {
    case "Paid":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Approved":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Partially Paid":
      return "bg-[#EAF0F5] text-[#58738C]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getActivityIcon(
  category: VendorDashboardActivity["category"]
) {
  switch (category) {
    case "Project":
      return <Building2 size={17} />;

    case "Invoice":
      return <FileText size={17} />;

    case "Payment":
      return <IndianRupee size={17} />;

    case "Announcement":
      return <FileText size={17} />;
  }
}

export function VendorPortalDashboard({
  data,
  loading = false,
  error,
  onOpenProjects,
  onOpenProject,
  onOpenInvoices,
  onOpenInvoice,
  onCreateInvoice,
  onOpenDocuments,
  onRetry,
}: VendorPortalDashboardProps) {
  const submittedTotal = data.invoices.reduce(
    (total, invoice) => total + Math.max(0, invoice.submittedAmount),
    0
  );

  const paidTotal = data.invoices.reduce(
    (total, invoice) => total + Math.max(0, invoice.paidAmount),
    0
  );

  const pendingInvoices = data.invoices.filter(
    (invoice) =>
      invoice.status === "Submitted" ||
      invoice.status === "Under Review"
  ).length;

  if (loading) {
    return <PortalDashboardSkeleton label="Loading your vendor dashboard..." />;
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Vendor dashboard unavailable
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

        {/* Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-9 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              ARCHEON DESIGN STUDIO / VENDOR PORTAL
            </p>

            <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
              Welcome, {data.vendorName}
            </h1>

            {data.organisationName && (
              <p className="mt-2 text-sm text-[#77736C]">
                {data.organisationName}
              </p>
            )}

            <p className="mt-4 text-sm leading-7 text-[#77736C]">
              Manage your project assignments, invoices and
              payment records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateInvoice}
              className="bg-[#171717] px-5 py-3 text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64]"
            >
              Submit Invoice
            </button>
          </div>
        </header>

        {/* Overview */}
        <section
          aria-label="Vendor account overview"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-4"
        >
          <OverviewCard
            label="Assigned Projects"
            value={String(data.projects.length)}
            icon={<Building2 size={19} />}
          />

          <OverviewCard
            label="Submitted Invoice Value"
            value={formatCurrency(submittedTotal)}
            icon={<Receipt size={19} />}
          />

          <OverviewCard
            label="Payments Recorded"
            value={formatCurrency(paidTotal)}
            icon={<Wallet size={19} />}
          />

          <OverviewCard
            label="Pending Invoices"
            value={String(pendingInvoices)}
            icon={<Clock3 size={19} />}
          />
        </section>

        {/* Project Assignments */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Work Assignments
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
            <EmptyState message="Project assignments will appear here when the studio assigns work to your account." />
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
                      Work Assignment
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

                  <div className="mt-5 border-t border-[#E5E2DC] pt-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      Assigned Scope
                    </p>

                    <p className="mt-2 text-sm text-[#33312D]">
                      {project.assignment}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
                  Financial Records
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
              <EmptyState message="Invoices submitted by your account will appear here." />
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
                        Submitted: {invoice.submittedAt}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-serif text-xl text-[#171717]">
                        {formatCurrency(invoice.submittedAmount)}
                      </p>

                      <span
                        className={`mt-2 inline-block px-3 py-1 text-[9px] uppercase tracking-widest ${getInvoiceStatusStyle(invoice.status)}`}
                      >
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
            <EmptyState message="New project and account activity will appear here." />
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
            ARCHEON DESIGN STUDIO / PRIVATE VENDOR WORKSPACE
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
