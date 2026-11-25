"use client";

import React, { useState, useMemo } from "react";
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
  Phone,
  Mail,
  Send,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export type ClientSupportCategory =
  | "Project Milestone"
  | "Drawings & Renders"
  | "Invoicing & Billing"
  | "Site Inspection"
  | "Material Selection"
  | "General Inquiry"
  | "Other";

export type ClientSupportPriority = "Low" | "Normal" | "High" | "Urgent";
export type ClientSupportStatus = "Open" | "In Progress" | "Awaiting Response" | "Resolved" | "Closed";

export interface ClientSupportMessage {
  id: string;
  message: string;
  senderLabel: string;
  sentAt: string;
  isStaff?: boolean;
}

export interface ClientSupportTicket {
  id: string;
  referenceCode: string;
  subject: string;
  category: ClientSupportCategory;
  priority: ClientSupportPriority;
  status: ClientSupportStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  relatedReference?: string;
  assignedTeam?: string;
  messages: ClientSupportMessage[];
}

export interface ClientSupportRequest {
  subject: string;
  category: ClientSupportCategory;
  priority: ClientSupportPriority;
  relatedReference: string;
  description: string;
}

interface ClientSupportCentreProps {
  tickets: ClientSupportTicket[];
  loading?: boolean;
  submitting?: boolean;
  error?: string;
  onCreateTicket: (request: ClientSupportRequest) => Promise<void>;
  onReplyTicket?: (ticketId: string, message: string) => Promise<void>;
  onRefresh?: () => void;
}

const CATEGORIES: ClientSupportCategory[] = [
  "Project Milestone",
  "Drawings & Renders",
  "Invoicing & Billing",
  "Site Inspection",
  "Material Selection",
  "General Inquiry",
  "Other",
];

export function ClientSupportCentre({
  tickets,
  loading,
  submitting,
  error,
  onCreateTicket,
  onReplyTicket,
  onRefresh,
}: ClientSupportCentreProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ClientSupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ClientSupportCategory>("General Inquiry");
  const [priority, setPriority] = useState<ClientSupportPriority>("Normal");
  const [relatedReference, setRelatedReference] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  // Reply states
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const openCount = useMemo(
    () => tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed").length,
    [tickets]
  );
  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length,
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchSearch =
        !q ||
        t.referenceCode.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.relatedReference && t.relatedReference.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Open" && t.status !== "Resolved" && t.status !== "Closed") ||
        (statusFilter === "Resolved" && (t.status === "Resolved" || t.status === "Closed"));
      return matchSearch && matchStatus;
    });
  }, [tickets, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (subject.trim().length < 5) {
      setFormError("Please enter a subject with at least 5 characters.");
      return;
    }
    if (description.trim().length < 15) {
      setFormError("Please describe your query in at least 15 characters.");
      return;
    }

    try {
      await onCreateTicket({
        subject: subject.trim(),
        category,
        priority,
        relatedReference: relatedReference.trim(),
        description: description.trim(),
      });
      setShowCreateModal(false);
      setSubject("");
      setCategory("General Inquiry");
      setPriority("Normal");
      setRelatedReference("");
      setDescription("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create ticket");
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !onReplyTicket) return;
    setSendingReply(true);
    try {
      await onReplyTicket(selectedTicket.id, replyMessage.trim());
      setReplyMessage("");
    } catch {
      // Handled in parent
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-5 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              <LifeBuoy size={14} /> Client Portal / Help &amp; Support
            </p>
            <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
              Help &amp; Client Support
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77736C]">
              Direct liaison with ArcheOn Studio management for project queries, milestone updates, drawing reviews, and billing clarifications.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#A58A64]"
            >
              <Plus size={14} /> New Support Inquiry
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-800">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#77736C]">Total Inquiries</p>
            <p className="mt-2 font-serif text-3xl text-[#171717]">{tickets.length}</p>
          </div>
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700">Active / In Progress</p>
            <p className="mt-2 font-serif text-3xl text-amber-800">{openCount}</p>
          </div>
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">Resolved</p>
            <p className="mt-2 font-serif text-3xl text-emerald-800">{resolvedCount}</p>
          </div>
        </div>

        {/* Studio Concierge Direct Contacts */}
        <div className="rounded-sm border border-[#D8D6D0] bg-[#FBF9F5] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A58A64]">Direct Studio Concierge</p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFECE6] text-[#A58A64]">
                <Phone size={15} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">Studio Principal Call</p>
                <a href="tel:+919834653481" className="mt-0.5 block font-mono text-xs font-semibold text-[#171717] hover:underline">
                  +91 9834653481
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFECE6] text-[#A58A64]">
                <Mail size={15} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">Studio Desk Email</p>
                <a href="mailto:dsarcheon@gmail.com" className="mt-0.5 block break-all font-mono text-xs font-semibold text-[#171717] hover:underline">
                  dsarcheon@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFECE6] text-[#A58A64]">
                <Building2 size={15} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">Studio Headquarters</p>
                <p className="mt-0.5 font-mono text-xs text-[#171717]">Krishna-Kunj, Dharampeth, Nagpur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Open", "Resolved"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-sm px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  statusFilter === filter
                    ? "bg-[#171717] text-white"
                    : "border border-[#D8D6D0] bg-white text-[#77736C] hover:text-[#171717]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77736C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inquiries..."
              className="h-10 w-full rounded-sm border border-[#D8D6D0] bg-white pl-9 pr-3 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
            />
          </div>
        </div>

        {/* Ticket List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-sm border border-[#D8D6D0] bg-white p-12 text-center font-mono text-xs text-[#77736C]">Loading support inquiries...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="rounded-sm border border-dashed border-[#D8D6D0] bg-white p-12 text-center">
              <LifeBuoy size={32} className="mx-auto text-[#A58A64] opacity-50" />
              <h3 className="mt-3 font-serif text-lg text-[#171717]">No support inquiries found</h3>
              <p className="mt-1 font-mono text-xs text-[#77736C]">
                {search || statusFilter !== "All"
                  ? "No inquiries match your filter criteria."
                  : "You haven't submitted any inquiries yet. Click 'New Support Inquiry' above for any project questions."}
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isResolved = ticket.status === "Resolved" || ticket.status === "Closed";
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group cursor-pointer rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm transition-all hover:border-[#A58A64]"
                >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-wider text-[#A58A64] font-semibold">
                        {ticket.referenceCode}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-xs bg-[#F2F0EB] text-[#77736C]">
                        {ticket.category}
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-xs ${
                          ticket.priority === "Urgent"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "High"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#F2F0EB] text-[#77736C]"
                        }`}
                      >
                        {ticket.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-serif text-lg text-[#171717] group-hover:text-[#A58A64] transition-colors">
                      {ticket.subject}
                    </h3>

                    <p className="line-clamp-2 text-xs text-[#77736C]">
                      {ticket.description}
                    </p>

                    {ticket.relatedReference && (
                      <p className="font-mono text-[10px] text-[#A58A64]">
                        Reference: {ticket.relatedReference}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded-xs tracking-wider ${
                        isResolved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : ticket.status === "Awaiting Response"
                          ? "bg-purple-50 text-purple-800 border border-purple-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isResolved ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                      {ticket.status}
                    </span>

                    <span className="font-mono text-[10px] text-[#A58A64]">
                      {ticket.messages ? ticket.messages.length : 1} message(s)
                    </span>

                    <span className="font-mono text-[9px] text-[#77736C]">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Conversation Detail Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] p-6 shadow-2xl">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute right-4 top-4 text-[#77736C] hover:text-[#171717]"
            >
              <X size={20} />
            </button>

            <div className="border-b border-[#EAE8E3] pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                <span>{selectedTicket.referenceCode}</span>
                <span>•</span>
                <span>{selectedTicket.category}</span>
                <span>•</span>
                <span className="font-semibold">{selectedTicket.status}</span>
              </div>
              <h2 className="mt-1 font-serif text-2xl text-[#171717]">{selectedTicket.subject}</h2>
              {selectedTicket.relatedReference && (
                <p className="mt-1 font-mono text-xs text-[#77736C]">
                  Reference: <span className="text-[#171717]">{selectedTicket.relatedReference}</span>
                </p>
              )}
            </div>

            {/* Conversation Thread */}
            <div className="my-6 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#77736C]">Conversation Thread</p>

              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m, idx) => {
                  const isStaff = m.isStaff || m.senderLabel.includes("Studio");
                  return (
                    <div
                      key={m.id || idx}
                      className={`rounded-sm p-4 text-xs ${
                        isStaff
                          ? "border border-[#E5E0D8] bg-[#F2F0EB] text-[#171717]"
                          : "border border-amber-200 bg-amber-50/50 text-[#171717]"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#D8D6D0]/50 pb-2 mb-2 font-mono text-[10px] text-[#77736C]">
                        <span className="font-semibold text-[#171717]">
                          {isStaff ? "ArcheOn Studio Concierge" : m.senderLabel || "Client"}
                        </span>
                        <span>{m.sentAt ? new Date(m.sentAt).toLocaleString("en-IN") : ""}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-sm border border-[#EAE8E3] bg-white p-4 text-xs text-[#171717]">
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>
              )}
            </div>

            {/* Reply Input */}
            {onReplyTicket && selectedTicket.status !== "Closed" && (
              <div className="border-t border-[#EAE8E3] pt-4">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Add Message to Thread
                </label>
                <div className="mt-2 flex gap-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the studio..."
                    className="w-full rounded-sm border border-[#D8D6D0] bg-white p-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="flex shrink-0 items-center justify-center rounded-sm bg-[#171717] px-4 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] p-6 shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-[#77736C] hover:text-[#171717]"
            >
              <X size={20} />
            </button>

            <div className="border-b border-[#EAE8E3] pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
                <LifeBuoy size={14} /> Direct Inquiry
              </div>
              <h2 className="mt-1 font-serif text-2xl text-[#171717]">New Support Inquiry</h2>
              <p className="mt-1 font-mono text-xs text-[#77736C]">
                Submit your query to the ArcheOn studio team.
              </p>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 p-3 font-mono text-xs text-red-800">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Clarification on Living Room Travertine finish"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClientSupportCategory)}
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ClientSupportPriority)}
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Related Project or Reference (Optional)
                </label>
                <input
                  type="text"
                  value={relatedReference}
                  onChange={(e) => setRelatedReference(e.target.value)}
                  placeholder="e.g. The Monolith Sanctuary / Milestone 2"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specific details about your query or requested changes..."
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-sm border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#77736C] hover:bg-[#F2F0EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-[#171717] px-6 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
