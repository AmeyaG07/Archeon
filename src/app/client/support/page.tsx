"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientSupportCentre,
  type ClientSupportTicket,
  type ClientSupportRequest,
} from "@/components/portal/client/ClientSupportCentre";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<ClientSupportTicket[]>([]);
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
        setError(err.error || "Failed to load support inquiries");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load support inquiries");
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

  const handleCreateTicket = async (request: ClientSupportRequest) => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/support/tickets", {
        method: "POST",
        body: request,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit support inquiry");
      }
      await loadTickets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit support inquiry");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyTicket = async (ticketId: string, message: string) => {
    try {
      const res = await apiFetch(`/api/support/tickets/${ticketId}/reply`, {
        method: "POST",
        body: { message },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send reply");
      }
      await loadTickets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
      throw err;
    }
  };

  return (
    <ClientSupportCentre
      tickets={tickets}
      loading={loading}
      submitting={submitting}
      error={error || undefined}
      onCreateTicket={handleCreateTicket}
      onReplyTicket={handleReplyTicket}
      onRefresh={loadTickets}
    />
  );
}
