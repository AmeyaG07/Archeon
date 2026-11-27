"use client";

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Send, ExternalLink, CheckCircle2, AlertCircle, Phone, Receipt, Users, Clock3 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ClientOption {
  id: string;
  fullName: string;
  phone?: string;
  reference?: string;
}

interface AdminNotifyBillsWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientsList: ClientOption[];
  selectedClientId?: string;
}

export function AdminNotifyBillsWhatsAppModal({
  isOpen,
  onClose,
  clientsList,
  selectedClientId,
}: AdminNotifyBillsWhatsAppModalProps) {
  const [clientId, setClientId] = useState<string>(selectedClientId || "all");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dispatchedItems, setDispatchedItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setDispatchedItems([]);
      setClientId(selectedClientId || "all");
    }
  }, [isOpen, selectedClientId]);

  if (!isOpen) return null;

  const activeClient = clientsList.find((c) => c.id === clientId);

  const handleSendBroadcast = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload: Record<string, any> = {};
      if (clientId && clientId !== "all") {
        payload.clientId = clientId;
      }

      const res = await apiFetch("/api/billing/notify-whatsapp", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setDispatchedItems(data);
        if (data.length > 0) {
          setSuccessMessage(`WhatsApp bill notifications prepared & dispatched for ${data.length} client(s).`);
        } else {
          setSuccessMessage("No pending bills found requiring client notification.");
        }
      } else {
        setSuccessMessage("Notification dispatched successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch WhatsApp bill notification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunThreeDayReminders = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch("/api/billing/reminders/run-3day", {
        method: "POST",
      });
      const data = await res.json();
      const dispatches = Array.isArray(data?.dispatches) ? data.dispatches : [];
      setDispatchedItems(dispatches);
      if (dispatches.length > 0) {
        setSuccessMessage(
          `3-day automated reminders dispatched for ${data.clientsNotified ?? dispatches.length} client(s) across ${data.remindersDispatched ?? dispatches.length} pending vendor bill(s).`
        );
      } else {
        setSuccessMessage(
          `3-day automated schedule active (every ${data?.reminderIntervalDays ?? 3} days). No pending vendor bills are currently overdue for a reminder.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run 3-day automated reminders.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain bg-[#FCFBF8] border border-[#D8D6D0] shadow-2xl p-6 sm:p-8 rounded-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E6E0] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F8EE] text-[#128C7E] border border-[#25D366]/40">
              <MessageSquare size={18} />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#128C7E] font-semibold">
                Studio Communications · WhatsApp Direct
              </p>
              <h2 className="font-serif text-xl sm:text-2xl text-[#171717]">
                Notify Clients About Bills
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-[#77736C] hover:text-[#171717] hover:bg-[#F2F0EB] transition-colors rounded-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#E8F8EE] border border-[#25D366]/40 text-[#128C7E] text-xs rounded-sm">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Client Selector */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-2 font-medium">
              Target Client Recipient:
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2.5 text-xs text-[#171717] focus:border-[#128C7E] focus:outline-none rounded-sm transition-colors"
            >
              <option value="all">★ All Clients with Pending / Outstanding Bills</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.reference ? `(${c.reference})` : ""} {c.phone ? `· ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Message Preview Box */}
          <div className="rounded-sm border border-[#25D366]/30 bg-[#F4FBF6] p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#128C7E] font-semibold flex items-center gap-1.5">
                <Receipt size={13} />
                Automated WhatsApp Template Preview
              </span>
              <span className="font-mono text-[9px] text-[#55514A]">Studio Official Channel</span>
            </div>
            <div className="bg-white p-3 border border-[#E0EFE6] rounded font-sans text-[#23211E] space-y-2 text-[11.5px] leading-relaxed shadow-2xs">
              <p className="font-medium">
                Studio ArcheOn · Billing Update for {activeClient ? activeClient.fullName : "Client Organization"}
              </p>
              <p className="text-[#55514A]">
                Dear {activeClient ? activeClient.fullName : "Client"},
                <br />
                Your project account has pending bills on record. Itemized contractor vouchers, measurements, and tax invoices are ready for your review and settlement approval.
              </p>
              <p className="font-mono text-[10.5px] text-[#128C7E] bg-[#F7FCF9] p-2 border border-[#E0EFE6] rounded">
                Review and approve vouchers in your portal:
                <br />
                <strong>http://localhost:3000/client/invoices</strong>
              </p>
              <p className="text-[10.5px] text-[#88857E] italic">— MB&apos;s ArcheOn Design Studio (Ar. Mandar Bhalekar)</p>
            </div>
          </div>

          {/* Dispatched Results / Direct Web Links */}
          {dispatchedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E8E6E0]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#128C7E] font-bold">
                Direct WhatsApp Links ({dispatchedItems.length}):
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {dispatchedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#D8D6D0] rounded-sm text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#171717]">{item.clientName}</p>
                      <p className="font-mono text-[10px] text-[#77736C]">
                        {item.phone} · ₹{Number(item.totalOutstanding || 0).toLocaleString()} ({item.billCount} bills)
                      </p>
                    </div>
                    {item.whatsappLink && (
                      <a
                        href={item.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded text-[11px] font-mono hover:bg-[#128C7E] transition-colors"
                      >
                        <ExternalLink size={12} />
                        Open Chat
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-Day Automated Schedule Info + On-Demand Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] p-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock3 size={15} className="shrink-0 mt-0.5 text-[#A58A64]" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#171717] font-semibold">
                  Automated 3-Day Pending Bill Reminder · Active (Daily 9:00 AM)
                </p>
                <p className="text-[11px] text-[#55514A] mt-0.5">
                  Automatically sends a WhatsApp reminder every 3 days to clients with unpaid vendor bills.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunThreeDayReminders}
              disabled={submitting}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[#128C7E] bg-white text-[#128C7E] hover:bg-[#E8F8EE] font-mono text-[10px] uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Clock3 size={12} />
              Run 3-Day Due Now
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E8E6E0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border border-[#D8D6D0] text-[#55514A] hover:bg-[#F2F0EB] text-xs font-mono uppercase tracking-wider transition-colors rounded-sm"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#128C7E] hover:bg-[#25D366] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-colors rounded-sm shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              {submitting ? "Sending WhatsApp..." : "Send WhatsApp Notification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
