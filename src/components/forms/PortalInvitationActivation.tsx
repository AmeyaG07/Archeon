"use client";

import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowUpRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Shield,
  AlertCircle,
} from "lucide-react";

export interface InvitationActivationData {
  invitationToken: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  phone?: string;
}

export interface InvitationMetadata {
  email?: string;
  recipientName?: string;
  targetRole?: string;
  status?: string;
  expiresAt?: string;
}

interface PortalInvitationActivationProps {
  token: string;
  onActivate: (data: InvitationActivationData) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
  invitationValid?: boolean;
  invitationMetadata?: InvitationMetadata | null;
}

export function PortalInvitationActivation({
  token,
  onActivate,
  submitting = false,
  error,
  invitationValid = true,
  invitationMetadata,
}: PortalInvitationActivationProps) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Pre-populate fullName if recipientName is provided in invitation metadata
  useEffect(() => {
    if (invitationMetadata?.recipientName && !fullName) {
      setFullName(invitationMetadata.recipientName);
    }
  }, [invitationMetadata?.recipientName, fullName]);

  const inputClass =
    "mt-2 w-full border-b border-[#D8D6D0] bg-transparent py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#AAA69E] focus:border-[#A58A64]";

  function formatRole(role?: string): string {
    if (!role) return "Partner Portal";
    if (role === "ROLE_CLIENT") return "Client Partner";
    if (role === "ROLE_VENDOR") return "Vendor / Contractor";
    if (role === "ROLE_STAFF") return "Studio Staff";
    if (role === "ROLE_ADMIN") return "Studio Administrator";
    return role.replace("ROLE_", "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setValidationError("A username is required to complete activation.");
      return;
    }

    if (trimmedUsername.length < 3) {
      setValidationError("Username must contain at least 3 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
      setValidationError("Username may only contain letters, numbers, periods, underscores, and hyphens.");
      return;
    }

    if (password.length < 12) {
      setValidationError("Your password must contain at least 12 characters for portal security.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Your passwords do not match.");
      return;
    }

    if (!token) {
      setValidationError("The invitation token is missing or invalid.");
      return;
    }

    await onActivate({
      invitationToken: token,
      username: trimmedUsername,
      password,
      confirmPassword,
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  }

  if (!invitationValid) {
    return (
      <section className="w-full max-w-lg border border-[#E3C9C5] bg-[#FAF3F1] p-5 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center border border-[#E3C9C5] text-[#A44D42]">
          <AlertCircle size={22} strokeWidth={1.4} />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A44D42] mt-6">
          INVITATION RESTRICTED
        </p>

        <h2 className="mt-3 font-serif text-3xl text-[#773B34]">
          Invitation Unavailable
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#805B55]">
          This invitation link is invalid, has expired, was revoked, or has already been used to activate an account.
        </p>

        <div className="mt-8 pt-6 border-t border-[#E3C9C5] flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[#111111] px-6 py-3 text-xs uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors"
          >
            Go to Portal Login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#D8D6D0] bg-white px-6 py-3 text-xs uppercase tracking-widest text-[#111111] hover:bg-[#F2F0EB] transition-colors"
          >
            Return to Website
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg bg-[#F2F0EB] p-5 sm:p-7 md:p-10 border border-[#D8D6D0] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center border border-[#D8D6D0] text-[#A58A64] bg-white">
          <ShieldCheck size={22} strokeWidth={1.4} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
          RESTRICTED ONBOARDING
        </span>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64] mt-6">
        RESTRICTED ACCESS / ACCOUNT ACTIVATION
      </p>

      <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#111111]">
        Activate your account.
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#77736C]">
        Establish your studio credentials to access the verified ArcheOn enterprise portal.
      </p>

      {/* Verified Invitation Attributes (Immutable Server-Bound Badges) */}
      {invitationMetadata && (
        <div className="mt-6 border border-[#D8D6D0] bg-white p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736C] flex items-center gap-1.5 shrink-0">
              <Mail className="w-3.5 h-3.5 text-[#A58A64]" /> Invited Email:
            </span>
            <span className="font-mono font-medium text-[#111111] break-all">
              {invitationMetadata.email || "Verified Recipient"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-[#F2F0EB] pt-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736C] flex items-center gap-1.5 shrink-0">
              <Shield className="w-3.5 h-3.5 text-[#A58A64]" /> Assigned Role:
            </span>
            <span className="inline-block bg-[#F9F8F6] border border-[#D8D6D0] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#111111] self-start sm:self-auto">
              {formatRole(invitationMetadata.targetRole)}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Username */}
        <div>
          <label
            htmlFor="activation-username"
            className="font-mono text-[11px] uppercase tracking-wider text-[#77736C] flex items-center gap-1.5"
          >
            <User className="w-3 h-3 text-[#A58A64]" /> Choose Username <span className="text-[#A44D42]">*</span>
          </label>
          <input
            id="activation-username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={50}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. rohan_verma or starlight_admin"
            className={inputClass}
          />
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="activation-fullname"
            className="font-mono text-[11px] uppercase tracking-wider text-[#77736C]"
          >
            Full Name (Optional)
          </label>
          <input
            id="activation-fullname"
            type="text"
            autoComplete="name"
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rohan Verma"
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="activation-phone"
            className="font-mono text-[11px] uppercase tracking-wider text-[#77736C] flex items-center gap-1.5"
          >
            <Phone className="w-3 h-3 text-[#A58A64]" /> Phone Number (Optional)
          </label>
          <input
            id="activation-phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91-9876543200"
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="activation-password"
            className="font-mono text-[11px] uppercase tracking-wider text-[#77736C]"
          >
            Create Secure Password <span className="text-[#A44D42]">*</span>
          </label>
          <div className="relative">
            <input
              id="activation-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 12 characters"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute bottom-2.5 right-1 p-2 text-[#77736C] hover:text-[#111111]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="activation-confirm-password"
            className="font-mono text-[11px] uppercase tracking-wider text-[#77736C]"
          >
            Confirm Password <span className="text-[#A44D42]">*</span>
          </label>
          <div className="relative">
            <input
              id="activation-confirm-password"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((v) => !v)}
              aria-label={showConfirmation ? "Hide password" : "Show password"}
              className="absolute bottom-2.5 right-1 p-2 text-[#77736C] hover:text-[#111111]"
            >
              {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {(validationError || error) && (
          <div role="alert" className="border border-[#E3C9C5] bg-[#FAF3F1] p-3 text-xs text-[#A44D42] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !username.trim() || !password || !confirmPassword}
          className="group flex min-h-12 w-full items-center justify-between gap-4 bg-[#111111] px-6 py-3.5 text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xs uppercase tracking-widest font-mono">
            {submitting ? "Activating Credentials..." : "Activate Account"}
          </span>
          <ArrowUpRight size={18} strokeWidth={1.5} />
        </button>
      </form>

      <div className="mt-8 flex items-start gap-3 border-t border-[#D8D6D0] pt-6">
        <LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#A58A64]" />
        <p className="text-xs leading-5 text-[#77736C]">
          Your account is governed by strict enterprise role-based authorization. Single-use invitation tokens are consumed atomically upon activation.
        </p>
      </div>
    </section>
  );
}
