"use client";

import React, { useState, useEffect } from "react";
import { X, FolderPlus, Building2, Calendar, MapPin, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ClientOption {
  id: string;
  fullName: string;
  clientReference: string;
  organization?: string;
}

interface AdminCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function AdminCreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: AdminCreateProjectModalProps) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectType, setProjectType] = useState("RESIDENTIAL_ARCHITECTURE");
  const [siteAddress, setSiteAddress] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [budgetAllocated, setBudgetAllocated] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [lastVisitDate, setLastVisitDate] = useState("");
  const [notes, setNotes] = useState("");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setLoadingClients(true);
      apiFetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setClients(data);
            if (data.length > 0 && !clientId) {
              setClientId(data[0].id);
            }
          }
        })
        .catch(() => setError("Failed to load registered clients"))
        .finally(() => setLoadingClients(false));
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (!clientId) {
      setError("Please select an active client");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        clientId,
        projectType,
        siteAddress: siteAddress.trim() || undefined,
        contractValue: contractValue ? parseFloat(contractValue) : undefined,
        budgetAllocated: budgetAllocated ? parseFloat(budgetAllocated) : undefined,
        startDate: startDate || undefined,
        expectedCompletionDate: expectedCompletionDate || undefined,
        lastVisitDate: lastVisitDate || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await apiFetch("/api/operational-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onProjectCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl border border-[#D8D6D0] bg-[#FAF9F6] p-6 shadow-2xl md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-[#77736C] hover:text-[#171717] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#171717] text-[#A58A64]">
            <FolderPlus size={20} />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              Studio Administration
            </p>
            <h2 className="font-serif text-2xl text-[#171717]">
              Create New Architectural Project
            </h2>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 border border-green-200 bg-green-50 p-3 text-xs text-green-700">
            <CheckCircle2 size={15} />
            <span>Project registered successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Villa Lumière - Private Residence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Client Organization / Owner *
              </label>
              {loadingClients ? (
                <div className="py-2 text-xs text-[#99958D]">Loading client directory...</div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.clientReference})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Project Category *
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              >
                <option value="RESIDENTIAL_ARCHITECTURE">Residential Architecture</option>
                <option value="COMMERCIAL_INTERIOR">Commercial Interior</option>
                <option value="LANDSCAPE_DESIGN">Landscape Architecture</option>
                <option value="TURNKEY_EXECUTION">Turnkey Execution</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
              Site Address / Location
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Plot 42, Civil Lines, Nagpur, Maharashtra"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="w-full border border-[#D8D6D0] bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              />
              <MapPin size={14} className="absolute left-2.5 top-2.5 text-[#99958D]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Contract Value (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 8500000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-[#A58A64]"
                />
                <IndianRupee size={14} className="absolute left-2.5 top-2.5 text-[#99958D]" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Allocated Budget (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 7200000"
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-[#A58A64]"
                />
                <IndianRupee size={14} className="absolute left-2.5 top-2.5 text-[#99958D]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Project Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
                Expected Completion
              </label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#A58A64] font-semibold mb-1">
                Initial Site Visit Date
              </label>
              <input
                type="date"
                value={lastVisitDate}
                onChange={(e) => setLastVisitDate(e.target.value)}
                className="w-full border border-[#A58A64] bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#A58A64]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1">
              Project Brief / Architectural Notes
            </label>
            <textarea
              rows={3}
              placeholder="Architectural scope, initial site condition, client expectations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#D8D6D0] bg-white p-3 text-xs outline-none focus:border-[#A58A64]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D8D6D0]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-[#D8D6D0] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:bg-[#EAE8E3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#171717] px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors disabled:opacity-50"
            >
              {submitting ? "Registering Project..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
