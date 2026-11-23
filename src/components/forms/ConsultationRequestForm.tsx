
"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";

export interface ConsultationRequestData {
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  consultationMode: "In-person" | "Online";
  projectOverview: string;
}

interface ConsultationRequestFormProps {
  onSubmit: (
    data: ConsultationRequestData
  ) => void | Promise<void>;
}

const timeOptions = [
  "Morning (9 AM – 12 PM)",
  "Afternoon (12 PM – 3 PM)",
  "Evening (3 PM – 6 PM)",
];

export function ConsultationRequestForm({
  onSubmit,
}: ConsultationRequestFormProps) {
  const [form, setForm] = useState<ConsultationRequestData>({
    fullName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    consultationMode: "In-person",
    projectOverview: "",
  });

  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof ConsultationRequestData>(
    field: K,
    value: ConsultationRequestData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-3 w-full border-b border-[#D8D6D0] bg-transparent py-4 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#AAA69E] focus:border-[#A58A64]";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 gap-x-12 gap-y-9 md:grid-cols-2">

        <div>
          <label
            htmlFor="consultation-name"
            className="editorial-eyebrow text-[#77736C]"
          >
            Full Name *
          </label>
          <input
            id="consultation-name"
            required
            autoComplete="name"
            maxLength={120}
            value={form.fullName}
            onChange={(event) =>
              updateField("fullName", event.target.value)
            }
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="consultation-email"
            className="editorial-eyebrow text-[#77736C]"
          >
            Email Address *
          </label>
          <input
            id="consultation-email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="consultation-phone"
            className="editorial-eyebrow text-[#77736C]"
          >
            Phone Number *
          </label>
          <input
            id="consultation-phone"
            type="tel"
            required
            autoComplete="tel"
            maxLength={25}
            value={form.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            placeholder="Your contact number"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="consultation-date"
            className="editorial-eyebrow text-[#77736C]"
          >
            Preferred Date *
          </label>
          <input
            id="consultation-date"
            type="date"
            required
            value={form.preferredDate}
            onChange={(event) =>
              updateField("preferredDate", event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="consultation-time"
            className="editorial-eyebrow text-[#77736C]"
          >
            Preferred Time *
          </label>
          <select
            id="consultation-time"
            required
            value={form.preferredTime}
            onChange={(event) =>
              updateField("preferredTime", event.target.value)
            }
            className={inputClass}
          >
            <option value="" disabled>
              Select a time
            </option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="consultation-mode"
            className="editorial-eyebrow text-[#77736C]"
          >
            Consultation Mode *
          </label>
          <select
            id="consultation-mode"
            required
            value={form.consultationMode}
            onChange={(event) =>
              updateField(
                "consultationMode",
                event.target.value as ConsultationRequestData["consultationMode"]
              )
            }
            className={inputClass}
          >
            <option value="In-person">In-person</option>
            <option value="Online">Online</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="consultation-overview"
            className="editorial-eyebrow text-[#77736C]"
          >
            Brief Project Overview
          </label>
          <textarea
            id="consultation-overview"
            rows={4}
            maxLength={2000}
            value={form.projectOverview}
            onChange={(event) =>
              updateField("projectOverview", event.target.value)
            }
            placeholder="Tell us briefly about your project..."
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div className="mt-10 border-t border-[#D8D6D0] pt-7">
        <p className="max-w-xl text-xs leading-6 text-[#77736C]">
          Your preferred date and time are requests only. The
          consultation will be confirmed separately by the studio
          after checking availability.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="group mt-8 inline-flex min-h-14 w-full items-center justify-between gap-8 bg-[#111111] px-7 py-4 text-left text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-64"
      >
        <span className="text-xs uppercase tracking-widest">
          {submitting ? "Sending Request..." : "Request Consultation"}
        </span>
        <ArrowUpRight size={19} strokeWidth={1.4} />
      </button>
    </form>
  );
}
