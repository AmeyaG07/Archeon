"use client";

import { useVendorLanguage } from "@/providers/VendorLanguageProvider";

export default function VendorUnavailablePage() {
  const { t } = useVendorLanguage();

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      <main className="max-w-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-800 bg-[#171717] p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-800 mb-4">
            <span className="text-orange-500">!</span>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[#F2F0EB]">{t("featureNotAvailable")}</h2>
          <p className="mt-3 max-w-sm mx-auto text-sm leading-relaxed text-[#A3A199]">
            {t("featureNotAvailableDesc")}
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => { window.location.href = "/vendor"; }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
            >
              <span className="text-[10px]">{t("returnToVendorWorkspace")}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
