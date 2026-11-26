"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type LoginTarget = "admin" | "client" | "vendor";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTarget>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistent login check: If already authenticated, redirect directly without re-login
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "ROLE_ADMIN" || user.role === "ADMIN") {
        router.replace("/admin");
      } else if (user.role === "ROLE_CLIENT" || user.role === "CLIENT") {
        router.replace("/client");
      } else if (user.role === "ROLE_VENDOR" || user.role === "VENDOR") {
        router.replace("/vendor");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

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
      let message = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
      if (message.includes("Session expired") || message.toLowerCase().includes("unauthorized")) {
        message = "Invalid credentials. Please verify your username and password.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111] flex flex-col justify-between p-4 sm:px-8 sm:py-5 font-sans selection:bg-[#A58A64] selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-start max-w-6xl w-full mx-auto">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5DEC9]/80 bg-white px-4 py-2 text-xs font-medium text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:bg-[#FAF8F5] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return To Website
        </button>
      </header>

      {/* Main Light Golden / White Login Card with Colourful Border & Box Shadow */}
      <div className="max-w-[390px] w-full mx-auto my-3 rounded-2xl p-[1.5px] bg-gradient-to-br from-[#F59E0B] via-[#06B6D4] to-[#8B5CF6] shadow-[0_24px_60px_-15px_rgba(17,17,17,0.18)]">
        <main className="rounded-[14.5px] bg-gradient-to-br from-[#FFFFFF] via-[#FBF6EC] to-[#F4EBD9] p-5 sm:p-7">
          {/* Brand Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src="/brand-assets/logo-light.png"
              alt="ArcheOn Design Studio"
              className="w-44 sm:w-48 h-auto object-contain"
            />
          </div>

          {/* Portal Tabs */}
          <div className="grid grid-cols-3 rounded-xl border border-white/80 mb-4 p-1 bg-white/50 backdrop-blur-md text-center">
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`py-2.5 rounded-lg text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${activeTab === "admin"
                ? "bg-white/95 text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]/70"
                : "text-[#52504B] hover:text-[#111111]"
                }`}
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("client")}
              className={`py-2.5 rounded-lg text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${activeTab === "client"
                ? "bg-white/95 text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]/70"
                : "text-[#52504B] hover:text-[#111111]"
                }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vendor")}
              className={`py-2.5 rounded-lg text-[10px] sm:text-[11px] font-mono uppercase tracking-wider transition-all ${activeTab === "vendor"
                ? "bg-white/95 text-[#111111] shadow-sm font-semibold border border-[#D8D6D0]/70"
                : "text-[#52504B] hover:text-[#111111]"
                }`}
            >
              Vendor
            </button>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#111111]">
              {activeTab === "admin"
                ? "Studio Administration"
                : activeTab === "client"
                  ? "Client Project Portal"
                  : "Vendor & Trade Portal"}
            </h1>
            <p className="text-xs text-[#4A4843] mt-1 leading-relaxed">
              {activeTab === "admin"
                ? "Authorised studio principals, architects, and project managers."
                : activeTab === "client"
                  ? "Sign in to review project drawings, milestones, and GST invoices."
                  : "Sign in to submit tax invoices, review payments, and cash settlements."}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-[#111111] mb-2">
                {activeTab === "admin" ? "Studio Username" : "Registered Username or Email"}
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeTab === "admin" ? "e.g. admin" : "e.g. client@example.com"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D6D0]/90 bg-white/80 backdrop-blur-md text-sm text-[#111111] placeholder:text-[#52504B] focus:outline-none focus:border-[#B68A4A] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-[#111111]">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D6D0]/90 bg-white/80 backdrop-blur-md text-sm text-[#111111] placeholder:text-[#52504B] focus:outline-none focus:border-[#B68A4A] pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4843] hover:text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#111111] hover:bg-[#25221D] text-white text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
          <p className="mt-4 text-center text-[10px] text-[#52504B] leading-relaxed">
            Access is monitored and audited. All communications are encrypted with TLS 1.3 and authenticated via signed JWT tokens.
          </p>
        </main>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#4A4843] font-mono uppercase tracking-wider">
        © 2026 ArcheOn Design Studio · Ar. Mandar Bhalekar
      </footer>
    </div>
  );
}
