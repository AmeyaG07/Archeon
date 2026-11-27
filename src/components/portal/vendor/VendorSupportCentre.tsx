
"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  IndianRupee,
  ShieldCheck,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useVendorLanguage } from "@/providers/VendorLanguageProvider";
import { OptionalField } from "@/components/ui/OptionalField";

export type VendorSupportCategory =
  | "Project Assignment"
  | "Invoice & Billing"
  | "Payment Issue"
  | "Cash Settlement"
  | "Dispute"
  | "Account Access"
  | "Documents"
  | "Other";

export type VendorSupportPriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

export type VendorSupportStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Awaiting Vendor Response"
  | "Resolved"
  | "Closed";

export interface VendorSupportMessage {
  id: string;
  message: string;
  senderLabel: string;
  sentAt: string;
  isVendorMessage: boolean;
}

export interface VendorSupportTicket {
  id: string;
  referenceCode: string;
  subject: string;
  category: VendorSupportCategory;
  priority: VendorSupportPriority;
  status: VendorSupportStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  relatedReference?: string;
  assignedTeam?: string;
  messages: VendorSupportMessage[];
}

export interface VendorSupportRequest {
  subject: string;
  category: VendorSupportCategory;
  priority: VendorSupportPriority;
  relatedReference: string;
  description: string;
}

interface VendorSupportCentreProps {
  tickets: VendorSupportTicket[];
  loading?: boolean;
  submitting?: boolean;
  error?: string;
  onCreateTicket: (
    request: VendorSupportRequest
  ) => void | Promise<void>;
  onOpenTicket?: (ticket: VendorSupportTicket) => void;
  onRefresh?: () => void;
}

type TicketFilter = "All" | VendorSupportStatus;

const CATEGORIES: VendorSupportCategory[] = [
  "Project Assignment",
  "Invoice & Billing",
  "Payment Issue",
  "Cash Settlement",
  "Dispute",
  "Account Access",
  "Documents",
  "Other",
];

const FILTERS: TicketFilter[] = [
  "All",
  "Open",
  "Assigned",
  "In Progress",
  "Awaiting Vendor Response",
  "Resolved",
  "Closed",
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusStyle(status: VendorSupportStatus) {
  switch (status) {
    case "Resolved":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Closed":
      return "bg-[#ECEAE5] text-[#77736C]";

    case "In Progress":
    case "Assigned":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "Awaiting Vendor Response":
      return "bg-[#F4EFE2] text-[#94743F]";

    default:
      return "bg-[#F8EAE7] text-[#9A5147]";
  }
}

function getPriorityStyle(priority: VendorSupportPriority) {
  switch (priority) {
    case "Urgent":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "High":
      return "bg-[#F4EFE2] text-[#94743F]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function renderCategoryIcon(category: VendorSupportCategory, size: number) {
  switch (category) {
    case "Project Assignment":
      return <Building2 size={size} />;

    case "Invoice & Billing":
    case "Documents":
      return <FileText size={size} />;

    case "Payment Issue":
    case "Cash Settlement":
      return <IndianRupee size={size} />;

    case "Dispute":
      return <AlertCircle size={size} />;

    case "Account Access":
      return <ShieldCheck size={size} />;

    default:
      return <LifeBuoy size={size} />;
  }
}

export function VendorSupportCentre({
  tickets,
  loading = false,
  submitting = false,
  error,
  onCreateTicket,
  onOpenTicket,
  onRefresh,
}: VendorSupportCentreProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TicketFilter>("All");

  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<VendorSupportCategory>("Other");
  const [priority, setPriority] =
    useState<VendorSupportPriority>("Normal");
  const [relatedReference, setRelatedReference] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState("");
  const { t } = useVendorLanguage();

  const openCount = tickets.filter(
    (ticket) =>
      ticket.status !== "Resolved" &&
      ticket.status !== "Closed"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.referenceCode.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        (ticket.relatedReference ?? "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" || ticket.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [tickets, search, filter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (subject.trim().length < 5) {
      setValidationError(
        "Enter a subject containing at least 5 characters."
      );
      return;
    }

    if (description.trim().length < 20) {
      setValidationError(
        "Please describe your issue in at least 20 characters."
      );
      return;
    }

    setValidationError("");

    await onCreateTicket({
      subject: subject.trim(),
      category,
      priority,
      relatedReference: relatedReference.trim(),
      description: description.trim(),
    });

    // The parent should close this form only after
    // the backend confirms successful ticket creation.
  }

  function resetForm() {
    setSubject("");
    setCategory("Other");
    setPriority("Normal");
    setRelatedReference("");
    setDescription("");
    setValidationError("");
    setShowCreateForm(false);
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          {t("loadingSupportRecords")}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            {t("supportEyebrow")}
          </p>

          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl text-[#171717] md:text-5xl">
                {t("supportPageTitle")}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
                {t("supportSubtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex w-fit items-center gap-3 bg-[#171717] px-7 py-4 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
            >
              <Plus size={16} />
              {t("createSupportTicket")}
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3">
          <SummaryCard
            label={t("totalTickets")}
            value={String(tickets.length)}
            icon={<LifeBuoy size={19} />}
          />

          <SummaryCard
            label={t("openTickets")}
            value={String(openCount)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label={t("resolvedTickets")}
            value={String(resolvedCount)}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Global Error */}
        {error && (
          <div
            role="alert"
            className="mt-7 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-[#9A5147]"
            />

            <p className="text-xs leading-6 text-[#805B55]">
              {error}
            </p>
          </div>
        )}

        {/* Create Ticket Form */}
        {showCreateForm && (
          <section className="mt-9 border border-[#D8D6D0] bg-white p-6 md:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  New Support Request
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                  Describe Your Issue
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                aria-label="Close support form"
                className="text-[#77736C] hover:text-[#171717] disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Issue Subject" required>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Briefly describe the issue"
                    maxLength={150}
                    required
                    disabled={submitting}
                    className="vendor-support-input"
                  />
                </Field>

                <Field label="Support Category" required>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value as VendorSupportCategory
                      )
                    }
                    disabled={submitting}
                    className="vendor-support-input"
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority" required>
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value as VendorSupportPriority
                      )
                    }
                    disabled={submitting}
                    className="vendor-support-input"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </Field>

                <OptionalField label="Related Reference (Optional)">
                  <input
                    value={relatedReference}
                    onChange={(event) =>
                      setRelatedReference(event.target.value)
                    }
                    placeholder="Invoice, project or settlement reference"
                    maxLength={100}
                    disabled={submitting}
                    className="vendor-support-input"
                  />
                </OptionalField>
              </div>

              <Field label="Issue Description" required>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain the problem, what happened and what assistance you need..."
                  rows={6}
                  maxLength={4000}
                  required
                  disabled={submitting}
                  className="vendor-support-input resize-y"
                />

                <p className="mt-2 text-right font-mono text-[9px] text-[#99958D]">
                  {description.length}/4000
                </p>
              </Field>

              <p className="text-xs leading-6 text-[#99958D]">
                Do not include passwords, authentication codes,
                bank credentials or unrelated client-confidential
                information in your support request.
              </p>

              {validationError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-4"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-[#9A5147]"
                  />

                  <p className="text-xs text-[#805B55]">
                    {validationError}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="border border-[#D8D6D0] px-7 py-4 text-[10px] uppercase tracking-widest text-[#77736C] disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#171717] px-8 py-4 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Support Request"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Ticket List */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                {t("supportManagement")}
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                {t("yourSupportTickets")}
              </h2>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchTicketsPlaceholder")}
              aria-label="Search support tickets"
              className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Filters */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-3">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`shrink-0 border px-4 py-3 text-[9px] uppercase tracking-widest ${
                  filter === item
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
                }`}
              >
                {item === "All" ? "All Tickets" : item}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="mt-5 space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
                <LifeBuoy
                  size={28}
                  strokeWidth={1.3}
                  className="mx-auto text-[#A58A64]"
                />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  No support tickets found
                </h3>

                <p className="mt-3 text-sm text-[#77736C]">
                  No tickets match your current search or filter.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={() => onOpenTicket?.(ticket)}
                />
              ))
            )}
          </div>
        </section>

        {/* Support Notice */}
        <div className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Support tickets are private to the authenticated vendor
            account and authorised studio personnel. Financial
            approvals, payment verification and project permissions
            must remain within their respective workflows.
          </p>
        </div>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
        {label}
        {required && <span className="ml-1 text-[#A58A64]">*</span>}
      </span>

      {children}
    </label>
  );
}

function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: VendorSupportTicket;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-6 md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            {renderCategoryIcon(ticket.category, 19)}
          </span>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              {ticket.referenceCode}
            </p>

            <h3 className="mt-3 font-serif text-2xl text-[#171717]">
              {ticket.subject}
            </h3>

            <p className="mt-2 text-xs text-[#77736C]">
              {ticket.category}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <span
            className={`w-fit px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(ticket.status)}`}
          >
            {ticket.status}
          </span>

          <span
            className={`w-fit px-3 py-2 text-[9px] uppercase tracking-widest ${getPriorityStyle(ticket.priority)}`}
          >
            {ticket.priority}
          </span>
        </div>
      </div>

      <p className="mt-6 text-xs leading-7 text-[#77736C]">
        {ticket.description}
      </p>

      {ticket.relatedReference && (
        <p className="mt-4 font-mono text-[9px] text-[#99958D]">
          Related reference: {ticket.relatedReference}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-6 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            Created
          </p>

          <p className="mt-2 text-xs text-[#33312D]">
            {formatDate(ticket.createdAt)}
          </p>
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            Last Updated
          </p>

          <p className="mt-2 text-xs text-[#33312D]">
            {formatDate(ticket.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        {ticket.assignedTeam && (
          <p className="text-[10px] text-[#99958D]">
            Assigned to: {ticket.assignedTeam}
          </p>
        )}

        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717] disabled:cursor-default disabled:opacity-50"
        >
          View Ticket
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}
