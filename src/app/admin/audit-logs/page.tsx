"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminAuditLogViewer,
  type AdminAuditEvent,
  type AuditLogSummary,
  type AuditEventCategory,
  type AuditEventSeverity,
  type AuditEventOutcome,
} from "@/components/portal/admin/AdminAuditLogViewer";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/audit?page=${page - 1}&size=30`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.content || [];

      let critical = 0;
      let failed = 0;
      let denied = 0;

      const records: AdminAuditEvent[] = list.map((ev: any) => {
        const action = ev.action || "UNKNOWN";
        const isFail = action.includes("REJECT") || action.includes("FAIL");
        const isDeny = action.includes("DENIED") || action.includes("REVOKE");
        const isCrit = isFail || isDeny || action.includes("SECURITY");

        if (isCrit) critical++;
        if (isFail) failed++;
        if (isDeny) denied++;

        const outcome: AuditEventOutcome = isFail ? "Failed" : isDeny ? "Denied" : "Success";
        const severity: AuditEventSeverity = isCrit ? "Critical" : "Informational";

        let category: AuditEventCategory = "Other";
        if (ev.entityName?.toLowerCase().includes("user") || ev.entityName?.toLowerCase().includes("auth")) {
          category = "Authentication";
        } else if (ev.entityName?.toLowerCase().includes("client")) {
          category = "Client Management";
        } else if (ev.entityName?.toLowerCase().includes("vendor")) {
          category = "Vendor Management";
        } else if (ev.entityName?.toLowerCase().includes("project")) {
          category = "Project Management";
        } else if (ev.entityName?.toLowerCase().includes("invoice")) {
          category = "Invoice Management";
        } else if (ev.entityName?.toLowerCase().includes("approval")) {
          category = "Financial Approval";
        } else if (ev.entityName?.toLowerCase().includes("cash")) {
          category = "Cash Settlement";
        } else if (ev.entityName?.toLowerCase().includes("doc")) {
          category = "Document Access";
        }

        return {
          id: ev.id ? String(ev.id) : String(Math.random()),
          eventReference: ev.id ? `AUD-${String(ev.id).slice(0, 8).toUpperCase()}` : "AUD-LOG",
          occurredAt: ev.timestamp || new Date().toISOString(),
          actorId: ev.actorId,
          actorName: ev.actorId || "System",
          actorRole: ev.actorRole || "User",
          action: ev.action || "AUDIT_EVENT",
          category,
          severity,
          outcome,
          entityType: ev.entityName,
          entityReference: ev.entityId,
          description: ev.details || `${ev.action} on ${ev.entityName || "entity"}`,
          ipAddress: ev.ipAddress || "127.0.0.1",
        };
      });

      setEvents(records);
      setCurrentPage(page);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalElements || records.length);
      setSummary({
        totalEvents: data.totalElements || records.length,
        criticalEvents: critical,
        failedEvents: failed,
        deniedEvents: denied,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadAuditLogs(currentPage);
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadAuditLogs, currentPage, router]);

  return (
    <div className="p-4 sm:p-8">
      <AdminAuditLogViewer
        events={events}
        summary={summary}
        loading={loading}
        error={error ?? undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onRefresh={() => loadAuditLogs(currentPage)}
        onPageChange={(p) => loadAuditLogs(p)}
      />
    </div>
  );
}
