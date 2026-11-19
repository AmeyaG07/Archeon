"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import {
  PortalInvitationActivation,
  type InvitationActivationData,
  type InvitationMetadata,
} from "@/components/forms/PortalInvitationActivation";
import {
  validateInvitationApi,
  acceptInvitationApi,
  loginApi,
  type InvitationValidationResult,
} from "@/lib/api";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [metadata, setMetadata] = useState<InvitationMetadata | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState(false);
  const [assignedRole, setAssignedRole] = useState<string | null>(null);

  // 1. Capture token on mount, validate with backend, and scrub from browser URL history
  useEffect(() => {
    let capturedToken = searchParams?.get("token");
    if (!capturedToken && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      capturedToken = urlParams.get("token");
    }

    if (capturedToken) {
      setToken(capturedToken);

      // P3: Scrub token parameter from visible browser URL to reduce exposure in history & referrers
      if (typeof window !== "undefined") {
        try {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has("token")) {
            currentUrl.searchParams.delete("token");
            const cleanSearch = currentUrl.searchParams.toString();
            const cleanUrl = currentUrl.pathname + (cleanSearch ? `?${cleanSearch}` : "") + currentUrl.hash;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch {
          // Gracefully fallback if History API is restricted
        }
      }

      // Validate token with backend
      validateInvitationApi(capturedToken)
        .then((res: InvitationValidationResult) => {
          if (res.valid) {
            setInvitationValid(true);
            setMetadata({
              email: res.email,
              recipientName: res.recipientName,
              targetRole: res.targetRole,
              status: res.status,
              expiresAt: res.expiresAt,
            });
            setAssignedRole(res.targetRole || null);
          } else {
            setInvitationValid(false);
            setError(res.message || "This invitation is invalid, expired, or has already been used.");
          }
        })
        .catch(() => {
          setInvitationValid(false);
          setError("Failed to validate invitation with studio server. Please check your network connection.");
        })
        .finally(() => {
          setValidating(false);
        });
    } else {
      setValidating(false);
      setInvitationValid(false);
      setError("Invitation token is missing. Please access this page using the link provided in your invitation.");
    }
  }, [searchParams]);

  // 2. Handle activation submission
  const handleActivate = useCallback(
    async (data: InvitationActivationData) => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await acceptInvitationApi({
          token: data.invitationToken,
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
        });

        setActivatedSuccess(true);
        const role = response.user.role || assignedRole || "ROLE_CLIENT";

        // Attempt automatic login to provide seamless single-step entry
        try {
          await loginApi(data.username, data.password);
          setTimeout(() => {
            if (role === "ROLE_CLIENT") {
              router.push("/client");
            } else if (role === "ROLE_VENDOR") {
              router.push("/vendor");
            } else if (role === "ROLE_ADMIN" || role === "ROLE_STAFF") {
              router.push("/admin");
            } else {
              router.push("/client");
            }
          }, 1500);
        } catch {
          // If auto-login fails, redirect cleanly to login page
          setTimeout(() => {
            router.push(`/login?activated=true&username=${encodeURIComponent(data.username)}`);
          }, 2000);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Account activation failed. Please try again.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [assignedRole, router]
  );

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#A58A64] selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#77736C] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
          SECURE ONBOARDING PORTAL
        </span>
      </header>

      {/* Main Activation Area */}
      <main className="max-w-xl w-full mx-auto my-10 flex flex-col items-center">
        {validating ? (
          <div className="bg-white border border-[#D8D6D0] p-12 text-center max-w-md w-full shadow-sm">
            <Loader2 className="w-8 h-8 text-[#A58A64] animate-spin mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-[#111111]">Verifying Invitation</h2>
            <p className="text-xs text-[#77736C] mt-2 font-mono uppercase tracking-wider">
              Cryptographic Token Validation in Progress...
            </p>
          </div>
        ) : activatedSuccess ? (
          <div className="bg-white border border-[#D8D6D0] p-10 sm:p-12 text-center max-w-lg w-full shadow-sm">
            <div className="w-14 h-14 bg-[#F2F0EB] border border-[#D8D6D0] text-[#A58A64] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              ACTIVATION COMPLETE
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#111111]">
              Account Verified & Active
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#77736C]">
              Your credentials have been securely established. Establishing encrypted session and redirecting to your dedicated enterprise portal...
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#A58A64] font-mono uppercase tracking-wider">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to portal...</span>
            </div>
          </div>
        ) : (
          <PortalInvitationActivation
            token={token || ""}
            onActivate={handleActivate}
            submitting={submitting}
            error={error}
            invitationValid={invitationValid}
            invitationMetadata={metadata}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center border-t border-[#D8D6D0] pt-6">
        <p className="text-[11px] font-mono text-[#77736C] uppercase tracking-widest">
          ArcheOn Design Studio &bull; Krishna-Kunj, Nagpur, Maharashtra &bull; Strict Role-Based Enterprise Access
        </p>
      </footer>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
          <div className="text-center font-mono text-xs uppercase tracking-widest text-[#77736C]">
            Loading Invitation Portal...
          </div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
