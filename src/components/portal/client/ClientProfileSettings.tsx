
"use client";

import { useState, type FormEvent } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Bell,
  Save,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";

export interface ClientProfile {
  fullName: string;
  email: string;
  phone: string;
  organisation?: string;
  preferredContact: "Email" | "Phone" | "WhatsApp";
  projectUpdateNotifications: boolean;
  invoiceNotifications: boolean;
  disputeNotifications: boolean;
  announcementNotifications: boolean;
}

export interface ClientProfileUpdate {
  fullName: string;
  phone: string;
  organisation: string;
  preferredContact: ClientProfile["preferredContact"];
  projectUpdateNotifications: boolean;
  invoiceNotifications: boolean;
  disputeNotifications: boolean;
  announcementNotifications: boolean;
}

interface ClientProfileSettingsProps {
  profile: ClientProfile;
  loading?: boolean;
  saving?: boolean;
  error?: string;
  successMessage?: string;
  onSave: (data: ClientProfileUpdate) => void | Promise<void>;
  onChangePassword: () => void;
  onRequestEmailChange: () => void;
}

export function ClientProfileSettings({
  profile,
  loading = false,
  saving = false,
  error,
  successMessage,
  onSave,
  onChangePassword,
  onRequestEmailChange,
}: ClientProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [organisation, setOrganisation] = useState(
    profile.organisation ?? ""
  );

  const [preferredContact, setPreferredContact] =
    useState<ClientProfile["preferredContact"]>(
      profile.preferredContact
    );

  const [preferences, setPreferences] = useState({
    projectUpdateNotifications:
      profile.projectUpdateNotifications,
    invoiceNotifications: profile.invoiceNotifications,
    disputeNotifications: profile.disputeNotifications,
    announcementNotifications:
      profile.announcementNotifications,
  });

  const [validationError, setValidationError] = useState("");

  function updatePreference(
    key: keyof typeof preferences,
    value: boolean
  ) {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanOrganisation = organisation.trim();

    if (cleanName.length < 2 || cleanName.length > 120) {
      setValidationError("Enter a valid full name.");
      return;
    }

    if (!/^[0-9+()\-\s]{7,20}$/.test(cleanPhone)) {
      setValidationError("Enter a valid contact number.");
      return;
    }

    if (cleanOrganisation.length > 150) {
      setValidationError(
        "Organisation name cannot exceed 150 characters."
      );
      return;
    }

    await onSave({
      fullName: cleanName,
      phone: cleanPhone,
      organisation: cleanOrganisation,
      preferredContact,
      ...preferences,
    });
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading account settings...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Account
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Profile & Settings
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Manage your account details and choose how you receive
            updates from the studio.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">

          {/* Personal Information */}
          <section>
            <SectionHeading
              icon={<UserRound size={19} />}
              title="Personal Information"
              description="Your registered client account details."
            />

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">

              <Field label="Full Name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  maxLength={120}
                  required
                  disabled={saving}
                  className="settings-input"
                />
              </Field>

              <Field label="Organisation (Optional)">
                <input
                  type="text"
                  value={organisation}
                  onChange={(event) =>
                    setOrganisation(event.target.value)
                  }
                  maxLength={150}
                  disabled={saving}
                  placeholder="Company or organisation"
                  className="settings-input"
                />
              </Field>

              <Field label="Registered Email">
                <div className="flex gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3 border border-[#D8D6D0] bg-[#ECEAE5] px-4">
                    <Mail
                      size={16}
                      className="shrink-0 text-[#A58A64]"
                    />
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      aria-label="Registered email address"
                      className="w-full min-w-0 bg-transparent py-4 text-sm text-[#77736C] outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={onRequestEmailChange}
                    disabled={saving}
                    className="shrink-0 text-[10px] uppercase tracking-widest text-[#A58A64] underline underline-offset-4"
                  >
                    Change
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-[#99958D]">
                  Email changes require verification.
                </p>
              </Field>

              <Field label="Contact Number">
                <div className="flex items-center gap-3 border border-[#D8D6D0] bg-white px-4">
                  <Phone
                    size={16}
                    className="shrink-0 text-[#A58A64]"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    maxLength={20}
                    required
                    disabled={saving}
                    className="w-full bg-transparent py-4 text-sm text-[#171717] outline-none"
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* Contact Preference */}
          <section className="border-t border-[#D8D6D0] pt-10">
            <SectionHeading
              icon={<Bell size={19} />}
              title="Contact Preferences"
              description="Choose your preferred communication channel."
            />

            <div className="mt-7 max-w-md">
              <Field label="Preferred Contact Method">
                <select
                  value={preferredContact}
                  onChange={(event) =>
                    setPreferredContact(
                      event.target.value as ClientProfile["preferredContact"]
                    )
                  }
                  disabled={saving}
                  className="settings-input"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </Field>
            </div>

            <div className="mt-8 border border-[#D8D6D0] bg-white p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Notification Preferences
              </p>

              <div className="mt-5 divide-y divide-[#E5E2DC]">
                <PreferenceToggle
                  label="Project Updates"
                  description="Progress updates and project milestones."
                  checked={preferences.projectUpdateNotifications}
                  onChange={(value) =>
                    updatePreference("projectUpdateNotifications", value)
                  }
                  disabled={saving}
                />

                <PreferenceToggle
                  label="Invoice Notifications"
                  description="New invoices and payment-related updates."
                  checked={preferences.invoiceNotifications}
                  onChange={(value) =>
                    updatePreference("invoiceNotifications", value)
                  }
                  disabled={saving}
                />

                <PreferenceToggle
                  label="Dispute Notifications"
                  description="Responses and status changes for your disputes."
                  checked={preferences.disputeNotifications}
                  onChange={(value) =>
                    updatePreference("disputeNotifications", value)
                  }
                  disabled={saving}
                />

                <PreferenceToggle
                  label="Studio Announcements"
                  description="Important notices and studio communications."
                  checked={preferences.announcementNotifications}
                  onChange={(value) =>
                    updatePreference("announcementNotifications", value)
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {/* Account Security */}
          <section className="border-t border-[#D8D6D0] pt-10">
            <SectionHeading
              icon={<ShieldCheck size={19} />}
              title="Account Security"
              description="Manage your login credentials and account protection."
            />

            <div className="mt-7 flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <LockKeyhole
                  size={21}
                  className="mt-1 shrink-0 text-[#A58A64]"
                />

                <div>
                  <h3 className="text-sm text-[#171717]">
                    Password & Login
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-[#77736C]">
                    Change your password through the secure account
                    verification process.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onChangePassword}
                disabled={saving}
                className="shrink-0 border border-[#D8D6D0] px-5 py-3 text-[10px] uppercase tracking-widest text-[#33312D] hover:border-[#A58A64]"
              >
                Change Password
              </button>
            </div>
          </section>

          {/* Feedback */}
          {(validationError || error) && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-4"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[#9A5147]"
              />

              <p className="text-xs leading-6 text-[#805B55]">
                {validationError || error}
              </p>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="border border-[#D2DFCE] bg-[#F0F5EE] p-4"
            >
              <p className="text-xs leading-6 text-[#547A51]">
                {successMessage}
              </p>
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end border-t border-[#D8D6D0] pt-7">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-3 bg-[#171717] px-8 py-4 text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE ACCOUNT SETTINGS
          </p>
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 text-[#A58A64]">{icon}</span>

      <div>
        <h2 className="font-serif text-2xl text-[#171717]">
          {title}
        </h2>

        <p className="mt-2 text-xs leading-6 text-[#77736C]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-3 block text-xs font-medium text-[#33312D]">
        {label}
      </label>
      {children}
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div>
        <p className="text-sm text-[#33312D]">{label}</p>
        <p className="mt-1 text-xs leading-6 text-[#99958D]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-[#A58A64]" : "bg-[#D8D6D0]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
