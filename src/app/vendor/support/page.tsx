"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorSupportCentre,
  type VendorSupportTicket,
  type VendorSupportRequest,
} from "@/components/portal/vendor/VendorSupportCentre";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<VendorSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTickets(data);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load support tickets");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadTickets();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadTickets, router]);

  const handleCreateTicket = async (request: VendorSupportRequest) => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/support/tickets", {
        method: "POST",
        body: request,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create support ticket");
      }
      await loadTickets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit support ticket");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VendorSupportCentre
      tickets={tickets}
      loading={loading}
      submitting={submitting}
      error={error || undefined}
      onCreateTicket={handleCreateTicket}
      onRefresh={loadTickets}
    />
  );
}
