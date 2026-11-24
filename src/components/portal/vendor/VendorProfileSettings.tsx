
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Bell,
  LockKeyhole,
  Save,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  CreditCard,
  QrCode,
  Building,
} from "lucide-react";
import { DualImageUpload } from "@/components/ui/DualImageUpload";

export interface VendorProfileData {
  businessName: string;
  vendorCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  businessAddress: string;
  gstin?: string;
  businessType?: string;
}

export interface VendorNotificationPreferences {
  projectUpdates: boolean;
  invoiceUpdates: boolean;
  paymentUpdates: boolean;
  studioAnnouncements: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

interface VendorProfileSettingsProps {
  profile: VendorProfileData;
  preferences: VendorNotificationPreferences;
  loading?: boolean;
  saving?: boolean;
  error?: string;
  successMessage?: string;
  onSaveProfile: (
    profile: Pick<
      VendorProfileData,
      | "contactPerson"
      | "email"
      | "phone"
      | "alternatePhone"
      | "businessAddress"
    >
  ) => void | Promise<void>;
  onSavePreferences: (
    preferences: VendorNotificationPreferences
  ) => void | Promise<void>;
  paymentDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    qrCodeUrl?: string;
  };
  onSavePaymentDetails?: (details: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    qrCodeUrl?: string;
  }) => void | Promise<void>;
  onChangePassword: () => void;
  onRequestEmailChange: (newEmail: string) => void | Promise<void>;
}

type SettingsTab = "profile" | "payment" | "notifications" | "security";

export function VendorProfileSettings({
  profile,
  preferences,
  loading = false,
  saving = false,
  error,
  successMessage,
  onSaveProfile,
  onSavePreferences,
  paymentDetails,
  onSavePaymentDetails,
  onChangePassword,
  onRequestEmailChange,
}: VendorProfileSettingsProps) {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("profile");

  const [contactPerson, setContactPerson] =
    useState(profile.contactPerson);

  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);

  const [alternatePhone, setAlternatePhone] =
    useState(profile.alternatePhone ?? "");

  const [businessAddress, setBusinessAddress] =
    useState(profile.businessAddress);

  const [notificationPreferences, setNotificationPreferences] =
    useState(preferences);

  // Payment Methods state
  const [accountHolderName, setAccountHolderName] = useState(paymentDetails?.accountHolderName || "");
  const [bankName, setBankName] = useState(paymentDetails?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(paymentDetails?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(paymentDetails?.ifscCode || "");
  const [upiId, setUpiId] = useState(paymentDetails?.upiId || "");
  const [qrCodeUrl, setQrCodeUrl] = useState(paymentDetails?.qrCodeUrl || "");
  const [paymentSavedMessage, setPaymentSavedMessage] = useState<string | null>(null);

  const [validationError, setValidationError] = useState("");

  function updatePreference(
    key: keyof VendorNotificationPreferences,
    value: boolean
  ) {
    setNotificationPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    if (contactPerson.trim().length < 2) {
      setValidationError("Enter a valid contact person name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      setValidationError("Enter a valid phone number.");
      return;
    }

    if (
      alternatePhone.trim() &&
      !/^[0-9+\-\s()]{7,20}$/.test(alternatePhone.trim())
    ) {
      setValidationError("Enter a valid alternate phone number.");
      return;
    }

    if (businessAddress.trim().length < 5) {
      setValidationError("Enter a valid business address.");
      return;
    }

    setValidationError("");

    await onSaveProfile({
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      businessAddress: businessAddress.trim(),
    });
  }

  async function handlePreferencesSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setValidationError("");
    await onSavePreferences(notificationPreferences);
  }

  async function handleEmailChange() {
    if (saving) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError("Enter a valid email address.");
      return;
    }

    if (email.trim().toLowerCase() === profile.email.toLowerCase()) {
      setValidationError("Enter a different email address.");
      return;
    }

    setValidationError("");
    await onRequestEmailChange(email.trim());
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading vendor account settings...
        </p>
      </div>
    );
  }

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "profile",
      label: "Business Profile",
      icon: <Building2 size={16} />,
    },
    {
      id: "payment",
      label: "Payment Details & QR",
      icon: <CreditCard size={16} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={16} />,
    },
    {
      id: "security",
      label: "Account Security",
      icon: <ShieldCheck size={16} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Account
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Account Settings
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Manage your business information, authorised contact
            details, communication preferences and account security.
          </p>
        </header>

        {/* Account Identity */}
        <section className="mt-8 flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-6 md:flex-row md:items-center md:p-8">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#F2F0EB] text-[#A58A64]">
              <Building2 size={25} />
            </div>

            <div>
              <h2 className="font-serif text-2xl text-[#171717]">
                {profile.businessName}
              </h2>

              <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Vendor Reference: {profile.vendorCode}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 border border-[#D7E2D2] bg-[#F0F5EE] px-4 py-2 text-[9px] uppercase tracking-widest text-[#547A51]">
            <ShieldCheck size={14} />
            Account Workspace
          </span>
        </section>

        {/* Tabs */}
        <nav
          aria-label="Account settings sections"
          className="mt-8 flex gap-2 overflow-x-auto border-b border-[#D8D6D0] pb-3"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setValidationError("");
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border px-5 py-3 text-[10px] uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Profile */}
        {activeTab === "profile" && (
          <section className="mt-8">
            <div className="border border-[#D8D6D0] bg-white p-6 md:p-9">
              <SectionHeading
                icon={<Building2 size={19} />}
                title="Business Information"
              />

              <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ReadOnlyField
                  label="Registered Business Name"
                  value={profile.businessName}
                />

                <ReadOnlyField
                  label="Vendor Reference"
                  value={profile.vendorCode}
                />

                <ReadOnlyField
                  label="Business Type"
                  value={profile.businessType || "Not provided"}
                />

                <ReadOnlyField
                  label="GSTIN"
                  value={profile.gstin || "Not provided"}
                />
              </div>

              <div className="mt-9 border-t border-[#E5E2DC] pt-8">
                <SectionHeading
                  icon={<User size={19} />}
                  title="Authorised Contact Details"
                />

                <form
                  onSubmit={handleProfileSubmit}
                  className="mt-7 space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Field label="Contact Person">
                      <input
                        value={contactPerson}
                        onChange={(event) =>
                          setContactPerson(event.target.value)
                        }
                        maxLength={120}
                        required
                        disabled={saving}
                        className="vendor-settings-input"
                      />
                    </Field>

                    <Field label="Registered Email">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        maxLength={254}
                        required
                        disabled={saving}
                        className="vendor-settings-input"
                      />
                    </Field>

                    <Field label="Primary Phone">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        maxLength={20}
                        required
                        disabled={saving}
                        className="vendor-settings-input"
                      />
                    </Field>

                    <Field label="Alternate Phone">
                      <input
                        type="tel"
                        value={alternatePhone}
                        onChange={(event) =>
                          setAlternatePhone(event.target.value)
                        }
                        maxLength={20}
                        disabled={saving}
                        className="vendor-settings-input"
                      />
                    </Field>
                  </div>

                  <Field label="Business Address">
                    <textarea
                      value={businessAddress}
                      onChange={(event) =>
                        setBusinessAddress(event.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      required
                      disabled={saving}
                      className="vendor-settings-input resize-y"
                    />
                  </Field>

                  <p className="text-xs leading-6 text-[#99958D]">
                    Changes to registered business identity, GSTIN
                    or legal details must follow the studio&apos;s
                    verification process. They cannot be changed
                    through this contact-details form.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-3 bg-[#171717] px-7 py-4 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? "Saving..." : "Save Contact Details"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Payment Details & QR */}
        {activeTab === "payment" && (
          <section className="mt-8 border border-[#D8D6D0] bg-white p-6 md:p-9">
            <SectionHeading
              icon={<CreditCard size={19} />}
              title="Vendor Payment Methods & QR Code"
            />

            <p className="mt-4 text-xs leading-7 text-[#77736C]">
              Configure your bank account and upload your UPI QR code. These details are securely displayed to clients on their portal so they can pay your bills directly via NEFT, RTGS, IMPS or instant UPI.
            </p>

            {paymentSavedMessage && (
              <div className="mt-4 flex items-center gap-2 border border-[#D7E2D2] bg-[#F0F5EE] p-4 text-xs text-[#547A51]">
                <CheckCircle2 size={16} /> {paymentSavedMessage}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onSavePaymentDetails) {
                  await onSavePaymentDetails({
                    accountHolderName,
                    bankName,
                    accountNumber,
                    ifscCode,
                    upiId,
                    qrCodeUrl,
                  });
                  setPaymentSavedMessage("Payment details and QR code updated successfully.");
                  setTimeout(() => setPaymentSavedMessage(null), 4000);
                }
              }}
              className="mt-8 space-y-8"
            >
              {/* Bank Account Section */}
              <div className="border border-[#E5E2DC] bg-[#FAF9F5] p-6">
                <h3 className="font-serif text-lg text-[#171717] mb-4">
                  Bank Account Information (NEFT / RTGS / IMPS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Account Holder Name">
                    <input
                      type="text"
                      placeholder="e.g. Mandar Ceramic Works Ltd."
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="vendor-settings-input"
                    />
                  </Field>
                  <Field label="Bank Name">
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="vendor-settings-input"
                    />
                  </Field>
                  <Field label="Account Number">
                    <input
                      type="text"
                      placeholder="e.g. 50200088912441"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="vendor-settings-input"
                    />
                  </Field>
                  <Field label="IFSC Code">
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="vendor-settings-input uppercase"
                    />
                  </Field>
                </div>
              </div>

              {/* QR Code & UPI Section */}
              <div className="border border-[#E5E2DC] bg-[#FAF9F5] p-6">
                <h3 className="font-serif text-lg text-[#171717] mb-4">
                  Instant UPI & QR Code
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div>
                    <Field label="UPI ID (VPA)">
                      <input
                        type="text"
                        placeholder="e.g. vendor@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="vendor-settings-input"
                      />
                    </Field>
                    <div className="mt-4">
                      <DualImageUpload
                        label="Payment QR Code (Device or Drive)"
                        value={qrCodeUrl}
                        onChange={setQrCodeUrl}
                        placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 border border-[#D8D6D0] bg-white rounded-sm min-h-[160px]">
                    {qrCodeUrl ? (
                      <div className="text-center">
                        <img
                          src={qrCodeUrl}
                          alt="QR Code Preview"
                          className="w-32 h-32 object-contain mx-auto border border-[#E5E2DC] p-1"
                        />
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-[#10B981] mt-2">
                          Live QR Code Preview
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-[#77736C]">
                        <QrCode size={36} className="mx-auto mb-2 text-[#99958D]" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#99958D]">
                          No QR Code Configured
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-3 bg-[#171717] px-7 py-4 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Saving Payment Details..." : "Save Payment Details"}
              </button>
            </form>
          </section>
        )}
        {activeTab === "notifications" && (
          <section className="mt-8 border border-[#D8D6D0] bg-white p-6 md:p-9">
            <SectionHeading
              icon={<Bell size={19} />}
              title="Notification Preferences"
            />

            <p className="mt-4 text-xs leading-7 text-[#77736C]">
              Choose which account updates you want to receive.
              Essential security and account notices may still be
              delivered when necessary.
            </p>

            <form
              onSubmit={handlePreferencesSubmit}
              className="mt-8"
            >
              <div className="space-y-1">
                <PreferenceRow
                  label="Project Updates"
                  description="New assignments, changes in scope and project status."
                  checked={notificationPreferences.projectUpdates}
                  disabled={saving}
                  onChange={(value) =>
                    updatePreference("projectUpdates", value)
                  }
                />

                <PreferenceRow
                  label="Invoice Updates"
                  description="Invoice submissions, review decisions and rejections."
                  checked={notificationPreferences.invoiceUpdates}
                  disabled={saving}
                  onChange={(value) =>
                    updatePreference("invoiceUpdates", value)
                  }
                />

                <PreferenceRow
                  label="Payment Updates"
                  description="Verified payments and remittance notifications."
                  checked={notificationPreferences.paymentUpdates}
                  disabled={saving}
                  onChange={(value) =>
                    updatePreference("paymentUpdates", value)
                  }
                />

                <PreferenceRow
                  label="Studio Announcements"
                  description="Operational updates and relevant studio notices."
                  checked={notificationPreferences.studioAnnouncements}
                  disabled={saving}
                  onChange={(value) =>
                    updatePreference("studioAnnouncements", value)
                  }
                />
              </div>

              <div className="mt-9 border-t border-[#E5E2DC] pt-8">
                <h3 className="font-serif text-xl text-[#171717]">
                  Delivery Channels
                </h3>

                <div className="mt-5 space-y-1">
                  <PreferenceRow
                    label="Email Notifications"
                    description="Receive supported account notifications by email."
                    checked={notificationPreferences.emailNotifications}
                    disabled={saving}
                    onChange={(value) =>
                      updatePreference("emailNotifications", value)
                    }
                  />

                  <PreferenceRow
                    label="WhatsApp Notifications"
                    description="Receive eligible notifications through the official business messaging channel."
                    checked={notificationPreferences.whatsappNotifications}
                    disabled={saving}
                    onChange={(value) =>
                      updatePreference("whatsappNotifications", value)
                    }
                  />
                </div>

                <p className="mt-5 text-xs leading-6 text-[#99958D]">
                  WhatsApp delivery requires valid consent and
                  an active, approved messaging integration.
                  Enabling this preference does not itself create
                  consent or guarantee message delivery.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-8 inline-flex items-center gap-3 bg-[#171717] px-7 py-4 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </form>
          </section>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <section className="mt-8 space-y-6">
            <div className="border border-[#D8D6D0] bg-white p-6 md:p-9">
              <SectionHeading
                icon={<LockKeyhole size={19} />}
                title="Account Security"
              />

              <p className="mt-4 text-xs leading-7 text-[#77736C]">
                Protect your vendor account by keeping your
                credentials private and updating your password
                when necessary.
              </p>

              <div className="mt-7 flex flex-col justify-between gap-5 border-t border-[#E5E2DC] pt-7 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <KeyRound
                    size={20}
                    className="mt-1 text-[#A58A64]"
                  />

                  <div>
                    <h3 className="text-sm text-[#33312D]">
                      Password
                    </h3>

                    <p className="mt-2 text-xs text-[#99958D]">
                      Update your account password securely.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onChangePassword}
                  className="w-fit border border-[#D8D6D0] px-6 py-3 text-[10px] uppercase tracking-widest text-[#77736C] hover:border-[#A58A64] hover:text-[#A58A64]"
                >
                  Change Password
                </button>
              </div>

              <div className="mt-7 border-t border-[#E5E2DC] pt-7">
                <h3 className="text-sm text-[#33312D]">
                  Email Address Verification
                </h3>

                <p className="mt-2 text-xs leading-6 text-[#77736C]">
                  Your registered email is used for important
                  account communication. Changing it should require
                  verification of the new address.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleEmailChange()}
                    disabled={saving}
                    className="w-fit bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                  >
                    Request Email Change
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 border border-[#D8D6D0] bg-white p-6">
              <ShieldCheck
                size={21}
                className="mt-1 shrink-0 text-[#A58A64]"
              />

              <div>
                <h3 className="text-sm text-[#33312D]">
                  Account Access Protection
                </h3>

                <p className="mt-2 text-xs leading-7 text-[#77736C]">
                  Account authentication, session expiry, access
                  revocation and vendor permissions must be
                  enforced by the backend.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Feedback */}
        {(validationError || error || successMessage) && (
          <div
            role={error || validationError ? "alert" : "status"}
            className={`mt-7 flex items-start gap-3 border p-5 ${
              error || validationError
                ? "border-[#E3C9C5] bg-[#FAF3F1] text-[#805B55]"
                : "border-[#D7E2D2] bg-[#F0F5EE] text-[#547A51]"
            }`}
          >
            {error || validationError ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            )}

            <p className="text-xs leading-6">
              {validationError || error || successMessage}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[#A58A64]">{icon}</span>

      <h2 className="font-serif text-2xl text-[#171717]">
        {title}
      </h2>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
        {label}
      </span>

      {children}
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-3 break-words text-sm text-[#33312D]">
        {value}
      </p>
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 border-b border-[#E5E2DC] py-5 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-sm text-[#33312D]">
          {label}
        </span>

        <span className="mt-2 block text-xs leading-6 text-[#99958D]">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#A58A64]"
      />
    </label>
  );
}
