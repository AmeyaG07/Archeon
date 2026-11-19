
"use client";

import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export interface InvitationActivationData {
  invitationToken: string;
  password: string;
  confirmPassword: string;
}

interface PortalInvitationActivationProps {
  onActivate: (
    data: InvitationActivationData
  ) => void | Promise<void>;
  submitting?: boolean;
  error?: string;
  invitationValid?: boolean;
}

export function PortalInvitationActivation({
  onActivate,
  submitting = false,
  error,
  invitationValid = true,
}: PortalInvitationActivationProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState("");

  const inputClass =
    "mt-3 w-full border-b border-[#D8D6D0] bg-transparent py-4 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#AAA69E] focus:border-[#A58A64]";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (password.length < 12) {
      setValidationError(
        "Your password must contain at least 12 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Your passwords do not match.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const invitationToken = params.get("token");

    if (!invitationToken) {
      setValidationError("The invitation token is missing.");
      return;
    }

    await onActivate({
      invitationToken,
      password,
      confirmPassword,
    });
  }

  if (!invitationValid) {
    return (
      <section className="w-full max-w-md border border-[#E3C9C5] bg-[#FAF3F1] p-8">
        <p className="editorial-eyebrow text-[#A44D42]">
          Invitation Access
        </p>

        <h2 className="mt-5 font-serif text-3xl text-[#773B34]">
          Invitation unavailable
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#805B55]">
          This invitation is invalid, expired or has already been used.
          Contact the studio administrator for assistance.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md bg-[#F2F0EB] p-7 md:p-10">
      <div className="flex h-12 w-12 items-center justify-center border border-[#D8D6D0] text-[#A58A64]">
        <ShieldCheck size={22} strokeWidth={1.4} />
      </div>

      <p className="editorial-eyebrow mt-8 text-[#A58A64]">
        Restricted Access / Account Activation
      </p>

      <h1 className="mt-4 font-serif text-4xl text-[#111111]">
        Activate your account.
      </h1>

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        Create a secure password to activate the account associated
        with your studio invitation.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        {/* Password */}
        <div>
          <label
            htmlFor="activation-password"
            className="editorial-eyebrow text-[#77736C]"
          >
            Create Password
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 12 characters"
              className={`${inputClass} pr-12`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute bottom-3 right-1 p-2 text-[#77736C]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="activation-confirm-password"
            className="editorial-eyebrow text-[#77736C]"
          >
            Confirm Password
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
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Re-enter your password"
              className={`${inputClass} pr-12`}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmation((value) => !value)
              }
              aria-label={
                showConfirmation ? "Hide password" : "Show password"
              }
              className="absolute bottom-3 right-1 p-2 text-[#77736C]"
            >
              {showConfirmation ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {(validationError || error) && (
          <p role="alert" className="text-sm leading-6 text-[#A44D42]">
            {validationError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !password || !confirmPassword}
          className="group flex min-h-14 w-full items-center justify-between gap-6 bg-[#111111] px-6 py-4 text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xs uppercase tracking-widest">
            {submitting ? "Activating..." : "Activate Account"}
          </span>

          <ArrowUpRight size={19} strokeWidth={1.4} />
        </button>
      </form>

      <div className="mt-8 flex items-start gap-3 border-t border-[#D8D6D0] pt-6">
        <LockKeyhole
          size={16}
          className="mt-1 shrink-0 text-[#A58A64]"
        />

        <p className="text-xs leading-6 text-[#77736C]">
          Your invitation must be validated by the server. Password
          hashing, token expiry, single-use enforcement and account
          activation must be handled by the backend.
        </p>
      </div>
    </section>
  );
}
