content = '''"use client";

export default function ClientUnavailablePage() {
  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      <main className="max-w-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-800 bg-[#171717] p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-800 mb-4">
            <span className="text-orange-500">!</span>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[#171717]">Feature Not Available</h2>
          <p className="mt-3 max-w-sm mx-auto text-sm leading-relaxed text-[#66625B]">
            This feature is not yet available in the public client portal.
            Please contact the studio for access or return to the client workspace.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => { window.location.href = "/client"; }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
            >
              <span className="text-[10px]">Return to Client Workspace</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
'''
with open('d:/WEBUI/frontend/src/app/client/unavailable/page.tsx', 'w') as f:
    f.write(content)
print('Done')