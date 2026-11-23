
"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

export type PasswordResetRequest = {
  mode: "request";
  email: string;
};

export type PasswordResetConfirmation = {
  mode: "reset";
  token: string;
  newPassword: string;
};

export type PasswordResetData =
  | PasswordResetRequest
  | PasswordResetConfirmation;

interface PasswordResetFormProps {
  mode: "request" | "reset";
  onSubmit: (data: PasswordResetData) => void | Promise<void>;
  submitting?: boolean;
  error?: string;
  successMessage?: string;
}

export function PasswordResetForm({
  mode,
  onSubmit,
  submitting = false,
  error,
  successMessage,
}: PasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const inputClass =
    "mt-3 w-full border-b border-[#D8D6D0] bg-transparent py-4 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#AAA69E] focus:border-[#A58A64]";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (mode === "request") {
      await onSubmit({
        mode: "request",
        email: email.trim(),
      });
      return;
    }

    if (password.length < 12) {
      setValidationError(
        "Your password must contain at least 12 characters."
      );
      return;
    }

    if (password !== confirmation) {
      setValidationError("Your passwords do not match.");
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setValidationError(
        "The password-reset link is missing or invalid. Request a new link."
      );
      return;
    }

    await onSubmit({
      mode: "reset",
      token,
      newPassword: password,
    });
  }

  return (
    <section className="w-full max-w-md bg-[#F2F0EB] p-7 md:p-10">
      <div className="flex h-12 w-12 items-center justify-center border border-[#D8D6D0] text-[#A58A64]">
        {mode === "request" ? (
          <Mail size={21} strokeWidth={1.4} />
        ) : (
          <LockKeyhole size={21} strokeWidth={1.4} />
        )}
      </div>

      <p className="editorial-eyebrow mt-8 text-[#A58A64]">
        Restricted Access / Account Security
      </p>

      <h1 className="mt-4 font-serif text-4xl text-[#111111]">
        {mode === "request"
          ? "Forgot your password?"
          : "Create a new password."}
      </h1>

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        {mode === "request"
          ? "Enter your registered email address. If an eligible account exists, password-reset instructions will be sent."
          : "Choose a new secure password for your ArcheOn portal account."}
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        {mode === "request" ? (
          <div>
            <label
              htmlFor="reset-email"
              className="editorial-eyebrow text-[#77736C]"
            >
              Registered Email Address
            </label>

            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="reset-password"
                className="editorial-eyebrow text-[#77736C]"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="reset-password"
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

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="editorial-eyebrow text-[#77736C]"
              >
                Confirm New Password
              </label>

              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Re-enter your password"
                className={inputClass}
              />
            </div>
          </>
        )}

        {(validationError || error) && (
          <p role="alert" className="text-sm leading-6 text-[#A44D42]">
            {validationError || error}
          </p>
        )}

        {successMessage && (
          <p role="status" className="text-sm leading-7 text-[#547A51]">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            (mode === "request" && !email.trim()) ||
            (mode === "reset" && (!password || !confirmation))
          }
          className="group flex min-h-14 w-full items-center justify-between gap-6 bg-[#111111] px-6 py-4 text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xs uppercase tracking-widest">
            {submitting
              ? "Please Wait..."
              : mode === "request"
                ? "Request Reset Link"
                : "Update Password"}
          </span>

          <ArrowUpRight size={19} strokeWidth={1.4} />
        </button>
      </form>

      <div className="mt-8 border-t border-[#D8D6D0] pt-6">
        <p className="text-xs leading-6 text-[#77736C]">
          Reset tokens must be validated server-side, expire after a
          limited period and become unusable after successful use.
          Password changes should also invalidate existing sessions
          according to the backend security policy.
        </p>
      </div>
    </section>
  );
}
