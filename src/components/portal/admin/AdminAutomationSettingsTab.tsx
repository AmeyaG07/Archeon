"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Phone,
  KeyRound,
  FileText,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface AutomationSettingsState {
  id?: number;
  whatsappEnabled: boolean;
  whatsappSenderNumber: string;
  whatsappSenderName: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappAccessToken: string;
  whatsappWebhookVerifyToken: string;
  whatsappReminderDays: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  invitationTemplate: string;
  newBillTemplate: string;
  reminderTemplate: string;

  emailEnabled: boolean;
  emailFromAddress: string;
  emailFromName: string;
  emailReplyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;

  updatedAt?: string;
  updatedBy?: string;
  recentDispatches?: RecentDispatchItem[];
}

export interface RecentDispatchItem {
  id: string;
  recipient: string;
  channel: string;
  messageType: string;
  status: string;
  sender: string;
  dispatchedAt: string;
  previewText: string;
}

export function AdminAutomationSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [settings, setSettings] = useState<AutomationSettingsState>({
    whatsappEnabled: true,
    whatsappSenderNumber: "+91 9876543210",
    whatsappSenderName: "MB's ArcheOn Design Studio (Ar. Mandar Bhalekar)",
    whatsappPhoneNumberId: "104829384918234",
    whatsappBusinessAccountId: "102938475619283",
    whatsappAccessToken: "EAAGm0PXq1Z...[MASKED]",
    whatsappWebhookVerifyToken: "archeon_secure_webhook_token_2026",
    whatsappReminderDays: 3,
    quietHoursStart: "21:00",
    quietHoursEnd: "09:00",
    invitationTemplate:
      "Namaste {{name}}, Welcome to MB's ArcheOn Design Studio! Your private project portal is ready. Activate your secure account here: {{link}} (Valid for 7 days).",
    newBillTemplate:
      "Hello {{name}}, A new contractor bill of ₹{{amount}} has been submitted by {{vendor}} for {{project}}. Review details here: {{link}}.",
    reminderTemplate:
      "Hello {{name}}, This is a polite reminder from MB's ArcheOn Design Studio regarding pending invoice #{{invoice}} for ₹{{amount}}. Please review: {{link}}.",
    emailEnabled: true,
    emailFromAddress: "invitations@archeon.design",
    emailFromName: "MB's ArcheOn Design Studio",
    emailReplyTo: "support@archeon.design",
    smtpHost: "smtp.archeon.design",
    smtpPort: 587,
    smtpUsername: "notifications@archeon.design",
    recentDispatches: [],
  });

  // Test dispatch state
  const [testChannel, setTestChannel] = useState<"WHATSAPP" | "EMAIL">("WHATSAPP");
  const [testRecipient, setTestRecipient] = useState("+91 9011228363");
  const [testingDispatch, setTestingDispatch] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sender: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/api/settings/automation");
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load automation settings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/api/settings/automation", {
        method: "PUT",
        body: settings,
      });
      const data = await res.json();
      setFeedback({
        type: "success",
        message: data.message || "Automation configuration successfully saved and updated.",
      });
      await loadSettings();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    if (!testRecipient.trim()) return;
    setTestingDispatch(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/settings/automation/test-dispatch", {
        method: "POST",
        body: {
          channel: testChannel,
          recipient: testRecipient.trim(),
          messageType: "INVITATION",
        },
      });
      const data = await res.json();
      setTestResult({
        success: true,
        message: data.message,
        sender: data.sender,
      });
      await loadSettings();
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to execute test dispatch",
        sender: settings.whatsappSenderName,
      });
    } finally {
      setTestingDispatch(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-xs uppercase tracking-widest text-[#77736C]">
        <RefreshCw size={20} className="mx-auto mb-3 animate-spin text-[#A58A64]" />
        Loading Automation &amp; Communication Configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Status & Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border font-mono text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-[#25221D] text-[#E0D8C3] border-[#B68A4A]"
              : "bg-red-950/40 text-red-300 border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-white uppercase text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Banner */}
      <div className="border border-[#D8D6D0] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#A58A64]">
              <Sliders size={15} /> Studio Communication Gateway
            </div>
            <h2 className="mt-1 font-serif text-2xl text-[#171717]">
              WhatsApp &amp; Email Automation Controls
            </h2>
            <p className="mt-1 text-xs text-[#77736C] max-w-2xl">
              Control the exact phone numbers, business accounts, API keys, quiet hours, and message templates used to dispatch client onboarding links, contractor invitations, and billing alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadSettings}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
            >
              <RefreshCw size={13} /> Reload
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#171717] px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: WhatsApp & Email Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Official WhatsApp Business Configuration */}
        <div className="border border-[#D8D6D0] bg-white p-6 space-y-6">
          <div className="border-b border-[#E5E2DC] pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#171717]">WhatsApp Business API</h3>
                <p className="text-[11px] text-[#77736C]">Meta Cloud API Outbound Messaging</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsappEnabled}
                onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                className="h-4 w-4 rounded accent-[#A58A64]"
              />
              <span className="font-mono text-xs uppercase tracking-wider text-[#171717]">
                {settings.whatsappEnabled ? "Active" : "Paused"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                Official Sender Phone Number (Whose number message is sent from)
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A58A64]" />
                <input
                  type="text"
                  value={settings.whatsappSenderNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappSenderNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full border border-[#D8D6D0] bg-white pl-9 pr-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#888]">
                This is the verified WhatsApp Business Number registered under Ar. Mandar Bhalekar / MB&apos;s ArcheOn Design Studio.
              </p>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                Sender Business Display Name
              </label>
              <input
                type="text"
                value={settings.whatsappSenderName}
                onChange={(e) => setSettings({ ...settings, whatsappSenderName: e.target.value })}
                placeholder="MB's ArcheOn Design Studio"
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Meta Phone Number ID
                </label>
                <input
                  type="text"
                  value={settings.whatsappPhoneNumberId}
                  onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                  placeholder="104829384918234"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  WhatsApp Business Account ID
                </label>
                <input
                  type="text"
                  value={settings.whatsappBusinessAccountId}
                  onChange={(e) => setSettings({ ...settings, whatsappBusinessAccountId: e.target.value })}
                  placeholder="102938475619283"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                Meta Cloud API Permanent Access Token
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A58A64]" />
                <input
                  type="password"
                  value={settings.whatsappAccessToken}
                  onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                  placeholder="EAAGm0PXq1Z..."
                  className="w-full border border-[#D8D6D0] bg-white pl-9 pr-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E2DC]">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Automated Reminder Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={settings.whatsappReminderDays}
                    onChange={(e) => setSettings({ ...settings, whatsappReminderDays: parseInt(e.target.value) || 3 })}
                    className="w-20 border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                  />
                  <span className="text-xs text-[#77736C]">Days after bill submission</span>
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Quiet Hours (No automated alerts)
                </label>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <input
                    type="text"
                    value={settings.quietHoursStart}
                    onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                    placeholder="21:00"
                    className="w-16 border border-[#D8D6D0] bg-white px-2 py-2 text-center text-xs font-mono focus:border-[#A58A64] focus:outline-none"
                  />
                  <span className="text-stone-400">to</span>
                  <input
                    type="text"
                    value={settings.quietHoursEnd}
                    onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                    placeholder="09:00"
                    className="w-16 border border-[#D8D6D0] bg-white px-2 py-2 text-center text-xs font-mono focus:border-[#A58A64] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Official Email & SMTP Dispatch Gateway */}
        <div className="border border-[#D8D6D0] bg-white p-6 space-y-6">
          <div className="border-b border-[#E5E2DC] pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#171717]">Corporate Email Gateway</h3>
                <p className="text-[11px] text-[#77736C]">Authenticated SMTP Delivery</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                className="h-4 w-4 rounded accent-[#A58A64]"
              />
              <span className="font-mono text-xs uppercase tracking-wider text-[#171717]">
                {settings.emailEnabled ? "Active" : "Paused"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                From Email Address (Whose account invitation is sent from)
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A58A64]" />
                <input
                  type="email"
                  value={settings.emailFromAddress}
                  onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                  placeholder="invitations@archeon.design"
                  className="w-full border border-[#D8D6D0] bg-white pl-9 pr-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                  placeholder="MB's ArcheOn Design Studio"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Reply-To Email Address
                </label>
                <input
                  type="email"
                  value={settings.emailReplyTo}
                  onChange={(e) => setSettings({ ...settings, emailReplyTo: e.target.value })}
                  placeholder="support@archeon.design"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#E5E2DC]">
              <div className="col-span-2">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.archeon.design"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                  className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C] mb-1">
                SMTP Authentication Username
              </label>
              <input
                type="text"
                value={settings.smtpUsername}
                onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                placeholder="notifications@archeon.design"
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono text-[#111] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editable Templates Section */}
      <div className="border border-[#D8D6D0] bg-white p-6 space-y-5">
        <div className="border-b border-[#E5E2DC] pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-[#171717]">Outbound Message Templates</h3>
            <p className="text-[11px] text-[#77736C]">
              Edit the exact message copy sent to clients and vendors. Tokens: <code className="bg-[#FAF9F5] px-1 py-0.5 border border-[#E5E2DC] text-[#A58A64]">&#123;&#123;name&#125;&#125;</code>, <code className="bg-[#FAF9F5] px-1 py-0.5 border border-[#E5E2DC] text-[#A58A64]">&#123;&#123;link&#125;&#125;</code>, <code className="bg-[#FAF9F5] px-1 py-0.5 border border-[#E5E2DC] text-[#A58A64]">&#123;&#123;amount&#125;&#125;</code>, <code className="bg-[#FAF9F5] px-1 py-0.5 border border-[#E5E2DC] text-[#A58A64]">&#123;&#123;vendor&#125;&#125;</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              1. Portal Invitation Template
            </label>
            <textarea
              rows={4}
              value={settings.invitationTemplate}
              onChange={(e) => setSettings({ ...settings, invitationTemplate: e.target.value })}
              className="w-full border border-[#D8D6D0] bg-white p-3 text-xs font-mono text-[#111] leading-relaxed focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              2. New Bill Submission Alert
            </label>
            <textarea
              rows={4}
              value={settings.newBillTemplate}
              onChange={(e) => setSettings({ ...settings, newBillTemplate: e.target.value })}
              className="w-full border border-[#D8D6D0] bg-white p-3 text-xs font-mono text-[#111] leading-relaxed focus:border-[#A58A64] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
              3. 3-Day Pending Bill Reminder
            </label>
            <textarea
              rows={4}
              value={settings.reminderTemplate}
              onChange={(e) => setSettings({ ...settings, reminderTemplate: e.target.value })}
              className="w-full border border-[#D8D6D0] bg-white p-3 text-xs font-mono text-[#111] leading-relaxed focus:border-[#A58A64] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Test Dispatch & Proof of Work */}
      <div className="border border-[#A58A64]/40 bg-[#FAF9F5] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DC] pb-3">
          <div>
            <h3 className="font-serif text-lg text-[#171717] flex items-center gap-2">
              <Send size={16} className="text-[#A58A64]" /> Live Test Dispatch Console
            </h3>
            <p className="text-[11px] text-[#77736C]">
              Verify outgoing automation channels by triggering a live simulation to a specific phone or email.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={testChannel}
            onChange={(e) => setTestChannel(e.target.value as any)}
            className="border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono focus:border-[#A58A64] focus:outline-none"
          >
            <option value="WHATSAPP">WhatsApp Message</option>
            <option value="EMAIL">Email (SMTP)</option>
          </select>

          <input
            type="text"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder={testChannel === "WHATSAPP" ? "+91 9011228363" : "client@studioarcheon.com"}
            className="flex-1 min-w-[240px] border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono focus:border-[#A58A64] focus:outline-none"
          />

          <button
            type="button"
            disabled={testingDispatch || !testRecipient.trim()}
            onClick={handleTestDispatch}
            className="inline-flex items-center gap-2 bg-[#A58A64] px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-[#8A704C] disabled:opacity-40 transition-colors"
          >
            <Send size={13} /> {testingDispatch ? "Dispatching..." : "Send Test Message"}
          </button>
        </div>

        {testResult && (
          <div className="mt-3 p-4 border border-emerald-300 bg-emerald-50 text-emerald-950 font-mono text-xs rounded-sm space-y-1">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 size={16} /> TEST DISPATCH DELIVERED SUCCESSFULLY
            </div>
            <div><strong>Sender:</strong> {testResult.sender}</div>
            <div><strong>Recipient:</strong> {testRecipient}</div>
            <div><strong>Channel:</strong> {testChannel}</div>
            <div className="text-[11px] text-emerald-700 mt-1">{testResult.message}</div>
          </div>
        )}
      </div>

      {/* Dispatches Proof Table */}
      <div className="border border-[#D8D6D0] bg-white p-6 space-y-4">
        <div className="border-b border-[#E5E2DC] pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-[#171717]">Recent Automated Dispatches &amp; Evidence Log</h3>
            <p className="text-[11px] text-[#77736C]">
              Actual invitations and alerts dispatched by the system with sender verification and cryptographic token hashes.
            </p>
          </div>
          <span className="font-mono text-xs text-[#A58A64] font-semibold">
            {settings.recentDispatches?.length || 0} Records Dispatched
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#FAF9F5] text-[10px] uppercase tracking-wider text-[#77736C]">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Message Type</th>
                <th className="p-3">Sender Account</th>
                <th className="p-3">Dispatched At</th>
                <th className="p-3">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DC]">
              {settings.recentDispatches && settings.recentDispatches.length > 0 ? (
                settings.recentDispatches.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF9F5]">
                    <td className="p-3 font-semibold text-[#171717]">{item.id}</td>
                    <td className="p-3 text-[#111]">{item.recipient}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{item.channel}</td>
                    <td className="p-3 text-[#555]">{item.messageType}</td>
                    <td className="p-3 text-[#77736C] text-[11px] max-w-[200px] truncate" title={item.sender}>
                      {item.sender}
                    </td>
                    <td className="p-3 text-[#77736C]">
                      {new Date(item.dispatchedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={11} /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#77736C]">
                    No invitations or alerts dispatched yet. Send an invitation to populate the log.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
