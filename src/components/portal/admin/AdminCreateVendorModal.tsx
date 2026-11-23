"use client";

import React, { useState, useRef } from "react";
import { X, UserPlus, Mail, Phone, Building2, MapPin, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, QrCode, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/api";

const TRADE_CATEGORIES = [
  { value: "CIVIL_WORK", label: "Civil & Structural" },
  { value: "CARPENTRY", label: "Carpentry & Architectural Millwork" },
  { value: "ELECTRICAL", label: "Electrical Systems & Automation" },
  { value: "PLUMBING", label: "Plumbing & Sanitary" },
  { value: "HVAC", label: "HVAC & Climate Systems" },
  { value: "MASONRY", label: "Stone, Marble & Masonry" },
  { value: "FABRICATION", label: "Structural Glass & Metal Fabrication" },
  { value: "FINISHING", label: "Finishing & Decorative Hardware" },
  { value: "OTHER", label: "Others (Custom Trade)" },
];

interface AdminCreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated: () => void;
}

export function AdminCreateVendorModal({
  isOpen,
  onClose,
  onVendorCreated,
}: AdminCreateVendorModalProps) {
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("CIVIL_WORK");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");

  // Payment details (optional initial setup)
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrPhotoPreview, setQrPhotoPreview] = useState<string | null>(null);
  const [qrFileName, setQrFileName] = useState<string | null>(null);

  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);

  // Auto-derived credentials state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isCredentialsCustom, setIsCredentialsCustom] = useState(false);

  const deriveFirstname = (name: string) => {
    return name
      .trim()
      .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+/i, "")
      .split(/\s+/)[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  const handleContactPersonChange = (val: string) => {
    setContactPerson(val);
    if (!isCredentialsCustom) {
      const first = deriveFirstname(val) || deriveFirstname(businessName);
      if (first) {
        setUsername(first);
        setPassword(`${first}123`);
      }
    }
  };

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!isCredentialsCustom && !contactPerson) {
      const first = deriveFirstname(val);
      if (first) {
        setUsername(first);
        setPassword(`${first}123`);
      }
    }
  };

  if (!isOpen) return null;

  const handleQrPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setQrPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQrPhoto = () => {
    setQrPhotoPreview(null);
    setQrFileName(null);
    if (qrInputRef.current) {
      qrInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      setError("Business name, contact person, email address, and phone number are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedCategory =
        category === "OTHER"
          ? (customCategory.trim() || "OTHER")
          : category;

      // 1. Create vendor record (without GSTIN as requested)
      const res = await apiFetch("/api/vendors", {
        method: "POST",
        body: {
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          category: resolvedCategory,
          location: location.trim() || undefined,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Vendor creation failed (HTTP ${res.status})`);
      }

      const vendor = await res.json();

      // 2. If banking details or QR provided, save payment method for vendor
      if (vendor.id && (accountNumber.trim() || upiId.trim() || qrPhotoPreview)) {
        try {
          await apiFetch(`/api/vendor-payment-methods/vendor/${vendor.id}`, {
            method: "PUT",
            body: {
              accountHolderName: accountHolderName.trim() || businessName.trim(),
              bankName: bankName.trim() || undefined,
              accountNumber: accountNumber.trim() || undefined,
              ifscCode: ifscCode.trim() || undefined,
              upiId: upiId.trim() || undefined,
              qrCodeUrl: qrPhotoPreview || undefined,
            },
          });
        } catch {
          // Non-fatal
        }
      }

      // 3. Auto-provision portal credentials: username = firstname, password = firstname123
      const finalUsername = username.trim() || deriveFirstname(contactPerson || businessName) || "vendor";
      const finalPassword = password.trim() || `${finalUsername}123`;

      if (vendor.id) {
        try {
          await apiFetch(`/api/vendors/${vendor.id}/portal-account`, {
            method: "POST",
            body: {
              username: finalUsername,
              password: finalPassword,
            },
          });
        } catch (accErr) {
          console.warn("Could not auto-provision vendor credentials:", accErr);
        }
      }

      // 4. Optionally dispatch vendor invitation
      if (sendInvite && vendor.id) {
        try {
          await apiFetch(`/api/vendors/${vendor.id}/invite`, {
            method: "POST",
          });
        } catch {
          // Non-fatal
        }
      }

      setCreatedCredentials({ username: finalUsername, password: finalPassword });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-6 sm:p-8 shadow-2xl"
      >
        {createdCredentials ? (
          <div className="py-6 text-center font-mono">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="mt-4 font-serif text-2xl text-[#171717]">Vendor Portal Account Created!</h3>
            <p className="mt-1 text-xs text-[#77736C]">
              Default login credentials have been provisioned and linked:
            </p>

            <div className="mt-6 border border-[#D8D6D0] bg-white p-5 text-left space-y-3 text-xs rounded-sm">
              <div className="flex justify-between items-center border-b border-[#E5E2DC] pb-2">
                <span className="text-[#888] text-[10px] uppercase">Default Username</span>
                <strong className="text-[#111] font-mono text-sm">{createdCredentials.username}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#888] text-[10px] uppercase">Default Password</span>
                <strong className="text-[#A58A64] font-mono text-sm">{createdCredentials.password}</strong>
              </div>
            </div>

            <p className="mt-4 text-[10px] text-[#888] leading-relaxed">
              The vendor / contractor can now log in immediately at <code>/login</code> using these credentials.
            </p>

            <button
              onClick={() => {
                setCreatedCredentials(null);
                onVendorCreated();
                onClose();
                setBusinessName("");
                setContactPerson("");
                setEmail("");
                setPhone("");
                setLocation("");
                setAccountHolderName("");
                setBankName("");
                setAccountNumber("");
                setIfscCode("");
                setUpiId("");
                setQrPhotoPreview(null);
                setQrFileName(null);
                setUsername("");
                setPassword("");
                setIsCredentialsCustom(false);
                setSuccess(false);
              }}
              className="mt-6 w-full bg-[#171717] py-3 text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors"
            >
              Done · Return to Vendor Directory
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              disabled={submitting}
              className="absolute top-5 right-5 p-1 text-[#77736C] hover:text-[#171717] transition-colors"
            >
              <X size={20} />
            </button>

            <div className="border-b border-[#D8D6D0] pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
                <UserPlus size={14} /> Trade Partner Registration
              </div>
              <h2 className="mt-1 font-serif text-2xl text-[#171717]">
                Register New Vendor
              </h2>
              <p className="mt-1 font-mono text-xs text-[#77736C]">
                Register a contractor or trade specialist. Default login will be auto-set to <strong>firstname</strong> / <strong>firstname123</strong>.
              </p>
            </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-300 bg-red-50 p-3 font-mono text-xs text-red-800">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 p-3 font-mono text-xs text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>Vendor registered successfully! {sendInvite && "Portal invitation dispatched."}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Business Name & Trade Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Business / Enterprise Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="e.g. Paramount Millwork & Joinery"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Trade Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              >
                {TRADE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {category === "OTHER" && (
                <input
                  type="text"
                  required
                  placeholder="Specify custom trade discipline (e.g. Glass Inlay, Copper Flashing)..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full rounded-sm border border-[#A58A64] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:ring-1 focus:ring-[#A58A64] focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Contact Person & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => handleContactPersonChange(e.target.value)}
                placeholder="e.g. Rajesh S. Parmar"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <MapPin size={12} /> Workshop / Base City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Mumbai, Maharashtra"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Phone (GSTIN / Tax ID removed as requested) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Mail size={12} /> Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                <Phone size={12} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 55443"
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-Provisioned Credentials Section */}
          <div className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#A58A64]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#171717] font-semibold">
                  Portal Login Credentials (Auto-Generated)
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] bg-white border border-[#D8D6D0] px-2 py-0.5">
                Default: firstname / firstname123
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  Portal Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setIsCredentialsCustom(true);
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                  }}
                  placeholder="e.g. rajesh"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
                <span className="font-mono text-[8px] text-[#888] mt-0.5 block">Auto-derived from first name</span>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  Initial Portal Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => {
                    setIsCredentialsCustom(true);
                    setPassword(e.target.value);
                  }}
                  placeholder="e.g. rajesh123"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
                <span className="font-mono text-[8px] text-[#888] mt-0.5 block">Auto-derived as firstname123</span>
              </div>
            </div>
          </div>

          {/* Initial Banking, UPI & Payment QR Section */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                <CreditCard size={13} /> Direct Settlement & Payment Settings (Optional)
              </div>
              
              {/* Option to Add QR Photo */}
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-[#A58A64] hover:text-[#171717] transition-colors cursor-pointer"
              >
                <QrCode size={13} />
                <span>{qrPhotoPreview ? "Change QR Photo" : "+ Add QR Photo"}</span>
              </button>
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrPhotoChange}
                className="hidden"
              />
            </div>

            {/* QR Photo Preview Card */}
            {qrPhotoPreview && (
              <div className="mt-3 flex items-center justify-between rounded-sm border border-[#C6A779]/40 bg-[#FAF8F5] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xs border border-[#D8D6D0] bg-white p-1">
                    <img
                      src={qrPhotoPreview}
                      alt="Vendor Payment QR Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#171717]">
                      <QrCode size={13} className="text-[#A58A64]" />
                      <span>{qrFileName || "Vendor Payment QR Code"}</span>
                    </div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] mt-0.5">
                      Ready for Direct UPI / Escrow Disbursements
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveQrPhoto}
                  className="rounded-xs p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove QR code"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Paramount Millwork LLP"
                  className="mt-1 w-full rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-[#171717]"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="HDFC Bank"
                  className="mt-1 w-full rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-[#171717]"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="50200012345678"
                  className="mt-1 w-full rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-[#171717]"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0000123"
                  className="mt-1 w-full rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-[#171717]"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                UPI ID (Virtual Payment Address)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="vendor@okhdfcbank"
                className="mt-1 w-full rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-[#171717]"
              />
            </div>
          </div>

          {/* Instant Portal Invitation */}
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="rounded border-[#D8D6D0] text-[#A58A64] focus:ring-[#A58A64]"
              />
              <span className="font-mono text-xs font-semibold text-[#171717]">
                Dispatch Secure Vendor Portal Invitation Immediately
              </span>
            </label>
            <p className="mt-1 ml-5 font-mono text-[11px] text-[#77736C]">
              Generates an onboarding token and delivers invitation credentials for vendor bill submissions and payment tracking.
            </p>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#D8D6D0] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-sm border border-[#D8D6D0] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:bg-[#FAF9F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50 transition-colors shadow-xs"
            >
              <UserPlus size={14} />
              {submitting ? "Registering Vendor..." : "Register Vendor"}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
