content = '''use client;

import React from "react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-800 bg-[#171717] p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-800 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="mt-4 font-serif text-3xl text-[#171717]">Admin Portal — Access Restricted</h2>
          <p className="mt-3 max-w-sm mx-auto text-sm leading-relaxed text-[#66625B]">
            This administrative route requires an authorised studio session.
            Portal access, financial records, bill approvals, cash settlements,
            audit logs, and export controls are available only to authenticated
            admin users through the verified backend session/RBAC contract.
            No financial data is shown on this public page.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Homepage
            </button>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-[#77736C]">
            Backend session enforcement required · No client-side auth fallback
          </p>
        </div>
      </main>
    </div>
  );
}
'''
with open('d:/WEBUI/frontend/src/app/admin/page.tsx', 'w') as f:
    f.write(content.replace('use client;', '"use client";'))
print('Done')