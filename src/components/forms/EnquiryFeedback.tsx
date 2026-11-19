
import { CheckCircle2, AlertCircle, LoaderCircle } from "lucide-react";

export type EnquiryStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

interface EnquiryFeedbackProps {
  status: EnquiryStatus;
  message?: string;
  referenceId?: string;
  onRetry?: () => void;
}

export function EnquiryFeedback({
  status,
  message,
  referenceId,
  onRetry,
}: EnquiryFeedbackProps) {
  if (status === "idle") return null;

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className="w-full"
    >
      {status === "submitting" && (
        <div className="flex items-start gap-4 border border-[#D8D6D0] bg-white p-6">
          <LoaderCircle
            size={21}
            className="mt-1 shrink-0 animate-spin text-[#A58A64]"
          />

          <div>
            <h3 className="font-serif text-xl text-[#171717]">
              Sending your enquiry
            </h3>

            <p className="mt-2 text-sm leading-7 text-[#77736C]">
              Please wait while we process your request.
            </p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="border border-[#C8D5C5] bg-[#F3F6F1] p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2
              size={22}
              className="mt-1 shrink-0 text-[#547A51]"
            />

            <div>
              <h3 className="font-serif text-xl text-[#263C25]">
                Enquiry received
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#52634F]">
                {message ||
                  "Your enquiry has been successfully received. Our team will review your request."}
              </p>

              {referenceId && (
                <div className="mt-5 border-t border-[#C8D5C5] pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#547A51]">
                    Enquiry Reference
                  </span>

                  <p className="mt-2 font-mono text-sm text-[#263C25]">
                    {referenceId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="border border-[#E3C9C5] bg-[#FAF3F1] p-6">
          <div className="flex items-start gap-4">
            <AlertCircle
              size={22}
              className="mt-1 shrink-0 text-[#A44D42]"
            />

            <div className="flex-1">
              <h3 className="font-serif text-xl text-[#773B34]">
                Enquiry could not be submitted
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#805B55]">
                {message ||
                  "Something went wrong while submitting your enquiry. Please try again."}
              </p>

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-5 border-b border-[#A44D42] pb-1 text-xs uppercase tracking-widest text-[#773B34] transition-colors hover:text-[#A44D42]"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
