"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type LoginTarget = "admin" | "client" | "vendor";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTarget>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const user = await login(username.trim(), password);
      // Route based on role
      if (user.role === "ROLE_ADMIN" || user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "ROLE_CLIENT" || user.role === "CLIENT") {
        router.push("/client");
      } else if (user.role === "ROLE_VENDOR" || user.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/admin");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111] flex flex-col justify-between p-4 sm:p-12 font-sans selection:bg-[#A58A64] selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#77736C] hover:text-[#111111] transition-colors py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
          RESTRICTED PORTAL ACCESS
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-8 sm:my-12 bg-white border border-[#D8D6D0] p-5 sm:p-10 shadow-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="font-serif text-3xl tracking-wide text-[#111111]">ARCHEON</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#A58A64] mt-1">
            Design Studio
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="grid grid-cols-3 border border-[#D8D6D0] mb-8 p-1 bg-[#F9F8F6] text-center">
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`py-2.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${
              activeTab === "admin"
                ? "bg-white text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]"
                : "text-[#77736C] hover:text-[#111111]"
            }`}
          >
            Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("client")}
            className={`py-2.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${
              activeTab === "client"
                ? "bg-white text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]"
                : "text-[#77736C] hover:text-[#111111]"
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vendor")}
            className={`py-2.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${
              activeTab === "vendor"
                ? "bg-white text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]"
                : "text-[#77736C] hover:text-[#111111]"
            }`}
          >
            Vendor
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h1 className="font-serif text-xl text-[#111111]">
            {activeTab === "admin"
              ? "Studio Administration"
              : activeTab === "client"
              ? "Client Project Portal"
              : "Vendor & Trade Portal"}
          </h1>
          <p className="text-xs text-[#77736C] mt-1 leading-relaxed">
            {activeTab === "admin"
              ? "Authorised studio principals, architects, and project managers."
              : activeTab === "client"
              ? "Sign in to review project drawings, milestones, and GST invoices."
              : "Sign in to submit tax invoices, review payments, and cash settlements."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-2">
              {activeTab === "admin" ? "Studio Username" : "Registered Username or Email"}
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={activeTab === "admin" ? "e.g. admin" : "e.g. client@example.com"}
              className="w-full px-3.5 py-2.5 border border-[#D8D6D0] bg-transparent text-sm text-[#111111] focus:outline-none focus:border-[#A58A64] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C]">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 border border-[#D8D6D0] bg-transparent text-sm text-[#111111] focus:outline-none focus:border-[#A58A64] pr-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736C] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#111111] hover:bg-[#25221D] text-white text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Sign In to Workspace <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <p className="mt-8 text-center text-[10px] text-[#99958D] leading-relaxed">
          Access is monitored and audited. All communications are encrypted with TLS 1.3 and authenticated via signed JWT tokens.
        </p>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#77736C] font-mono uppercase tracking-wider">
        © 2026 ArcheOn Design Studio · Ar. Mandar Bhalekar
      </footer>
    </div>
  );
}
