
"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ArrowUpRight, LockKeyhole } from "lucide-react";

export interface PortalCredentials {
  email: string;
  password: string;
}

interface PortalAccessFormProps {
  portalName: "Client" | "Vendor";
  onSubmit: (
    credentials: PortalCredentials
  ) => void | Promise<void>;
  submitting?: boolean;
  error?: string;
}

export function PortalAccessForm({
  portalName,
  onSubmit,
  submitting = false,
  error,
}: PortalAccessFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    await onSubmit({
      email: email.trim(),
      password,
    });
  }

  const inputClass =
    "mt-3 w-full border-b border-[#D8D6D0] bg-transparent py-4 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#AAA69E] focus:border-[#A58A64]";

  return (
    <section className="w-full max-w-md bg-[#F2F0EB] p-7 md:p-10">
      <div className="flex h-12 w-12 items-center justify-center border border-[#D8D6D0] text-[#A58A64]">
        <LockKeyhole size={21} strokeWidth={1.4} />
      </div>

      <p className="editorial-eyebrow mt-8 text-[#A58A64]">
        Restricted Access / {portalName} Portal
      </p>

      <h1 className="mt-4 font-serif text-4xl text-[#111111]">
        Welcome back.
      </h1>

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        Sign in using the credentials provided by the studio.
        Portal access is available to authorised {portalName.toLowerCase()}s only.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <label
            htmlFor="portal-email"
            className="editorial-eyebrow text-[#77736C]"
          >
            Email Address
          </label>

          <input
            id="portal-email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your registered email"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="portal-password"
            className="editorial-eyebrow text-[#77736C]"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="portal-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className={`${inputClass} pr-12`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute bottom-3 right-1 p-2 text-[#77736C] hover:text-[#A58A64]"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm leading-6 text-[#A44D42]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !email.trim() || !password}
          className="group flex min-h-14 w-full items-center justify-between gap-6 bg-[#111111] px-6 py-4 text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xs uppercase tracking-widest">
            {submitting ? "Authenticating..." : "Access Portal"}
          </span>

          <ArrowUpRight size={19} strokeWidth={1.4} />
        </button>
      </form>

      <p className="mt-8 border-t border-[#D8D6D0] pt-6 text-xs leading-6 text-[#77736C]">
        Need access or assistance? Contact the studio administrator.
        Account activation and password recovery must follow the
        studio&apos;s approved authentication process.
      </p>
    </section>
  );
}
