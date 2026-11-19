
interface TestimonialCardProps {
  quote: string;
  clientName: string;
  projectType?: string;
  location?: string;
  featured?: boolean;
}

export function TestimonialCard({
  quote,
  clientName,
  projectType,
  location,
  featured = false,
}: TestimonialCardProps) {
  return (
    <article
      className={`flex h-full flex-col justify-between border border-[#D8D6D0] bg-[#F2F0EB] p-7 md:p-10 ${
        featured ? "md:p-14" : ""
      }`}
    >
      <div>
        <span
          aria-hidden="true"
          className="font-serif text-6xl leading-none text-[#B68A4A]"
        >
          “
        </span>

        <blockquote
          className={`mt-5 font-serif leading-relaxed text-[#22201C] ${
            featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
          }`}
        >
          {quote}
        </blockquote>
      </div>

      <div className="mt-12 border-t border-[#D8D6D0] pt-6">
        <p className="text-sm font-medium text-[#171717]">
          {clientName}
        </p>

        {(projectType || location) && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            {[projectType, location].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}
