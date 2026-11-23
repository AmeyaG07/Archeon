
"use client";

import { useState, type FormEvent } from "react";
import type { ServiceItem } from "@/config/siteConfig";
import { ArrowUpRight } from "lucide-react";

export interface ProjectEnquiryData {
  fullName: string;
  email: string;
  phone: string;
  serviceId: string;
  projectLocation: string;
  projectDescription: string;
  whatsappConsent: boolean;
}

interface ProjectEnquiryFormProps {
  services: ServiceItem[];
  initialServiceId?: string;
  onSubmit: (data: ProjectEnquiryData) => void | Promise<void>;
}

export function ProjectEnquiryForm({
  services,
  initialServiceId = "",
  onSubmit,
}: ProjectEnquiryFormProps) {
  const [form, setForm] = useState<ProjectEnquiryData>({
    fullName: "",
    email: "",
    phone: "",
    serviceId: initialServiceId,
    projectLocation: "",
    projectDescription: "",
    whatsappConsent: false,
  });

  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof ProjectEnquiryData>(
    field: K,
    value: ProjectEnquiryData[K]
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
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">

        {/* Full Name */}
        <div>
          <label
            htmlFor="enquiry-name"
            className="editorial-eyebrow text-[#77736C]"
          >
            Full Name *
          </label>

          <input
            id="enquiry-name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={form.fullName}
            onChange={(event) =>
              updateField("fullName", event.target.value)
            }
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="enquiry-email"
            className="editorial-eyebrow text-[#77736C]"
          >
            Email Address *
          </label>

          <input
            id="enquiry-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="enquiry-phone"
            className="editorial-eyebrow text-[#77736C]"
          >
            Phone Number *
          </label>

          <input
            id="enquiry-phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={25}
            value={form.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            placeholder="Your contact number"
            className={inputClass}
          />
        </div>

        {/* Service */}
        <div>
          <label
            htmlFor="enquiry-service"
            className="editorial-eyebrow text-[#77736C]"
          >
            Service Required *
          </label>

          <select
            id="enquiry-service"
            required
            value={form.serviceId}
            onChange={(event) =>
              updateField("serviceId", event.target.value)
            }
            className={inputClass}
          >
            <option value="" disabled>
              Select a service
            </option>

            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </div>

        {/* Project Location */}
        <div className="md:col-span-2">
          <label
            htmlFor="enquiry-location"
            className="editorial-eyebrow text-[#77736C]"
          >
            Project Location
          </label>

          <input
            id="enquiry-location"
            type="text"
            maxLength={200}
            value={form.projectLocation}
            onChange={(event) =>
              updateField("projectLocation", event.target.value)
            }
            placeholder="City or project location"
            className={inputClass}
          />
        </div>

        {/* Project Description */}
        <div className="md:col-span-2">
          <label
            htmlFor="enquiry-description"
            className="editorial-eyebrow text-[#77736C]"
          >
            Tell Us About Your Project *
          </label>

          <textarea
            id="enquiry-description"
            required
            rows={5}
            maxLength={3000}
            value={form.projectDescription}
            onChange={(event) =>
              updateField("projectDescription", event.target.value)
            }
            placeholder="Describe your ideas, requirements and expectations..."
            className={`${inputClass} resize-y`}
          />

          <p className="mt-2 text-right font-mono text-[10px] text-[#99958D]">
            {form.projectDescription.length}/3000
          </p>
        </div>
      </div>

      {/* WhatsApp Consent */}
      <div className="mt-10 border-t border-[#D8D6D0] pt-7">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.whatsappConsent}
            onChange={(event) =>
              updateField("whatsappConsent", event.target.checked)
            }
            className="mt-1 h-4 w-4 accent-[#A58A64]"
          />

          <span className="max-w-2xl text-xs leading-6 text-[#77736C]">
            I agree to receive project-related communication through
            WhatsApp. This consent is optional and can be withdrawn.
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="mt-10">
        <button
          type="submit"
          disabled={submitting || services.length === 0}
          className="group inline-flex min-h-14 w-full items-center justify-between gap-6 bg-[#111111] px-7 py-4 text-left text-[#F2F0EB] transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-64"
        >
          <span className="text-xs uppercase tracking-[0.16em]">
            {submitting ? "Submitting..." : "Submit Enquiry"}
          </span>

          <ArrowUpRight size={19} strokeWidth={1.4} />
        </button>
      </div>
    </form>
  );
}
