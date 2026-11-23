
interface EditorialPageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  index?: string;
}

export function EditorialPageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "Architectural visual",
  index,
}: EditorialPageHeroProps) {
  return (
    <section className="overflow-hidden bg-[#F2F0EB] pb-16 pt-24 md:pb-24 md:pt-36">
      <div className="editorial-container">
        {/* Heading */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-9">
            <div className="flex items-center gap-4">
              <span className="editorial-eyebrow text-[#A58A64]">
                {eyebrow}
              </span>

              {index && (
                <>
                  <span className="h-px w-8 bg-[#B68A4A]" />
                  <span className="font-mono text-[10px] tracking-widest text-[#99958D]">
                    {index}
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-8 max-w-5xl whitespace-pre-line font-serif text-5xl leading-[1.08] tracking-tight text-[#111111] md:text-7xl lg:text-8xl">
              {title}
            </h1>
          </div>

          {description && (
            <div className="lg:col-span-3">
              <p className="max-w-sm text-sm leading-8 text-[#77736C] md:text-base">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Optional Image */}
        {image && (
          <div className="mt-16 aspect-[16/7] overflow-hidden bg-[#D8D4CC] md:mt-20">
            <img
              src={image}
              alt={imageAlt}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
        )}

        <div className="mt-12 h-px w-full bg-[#D8D6D0]" />
      </div>
    </section>
  );
}
