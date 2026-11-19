
const values = [
  {
    number: "01",
    title: "Context Before Form",
    description:
      "Every design begins with understanding its surroundings, site conditions, purpose and the people who will experience it.",
  },
  {
    number: "02",
    title: "Clarity in Design",
    description:
      "We value thoughtful planning, functional spaces and architectural decisions that serve a clear purpose.",
  },
  {
    number: "03",
    title: "Material Integrity",
    description:
      "Materials, textures and finishes are considered as essential parts of the architectural experience.",
  },
  {
    number: "04",
    title: "Detail & Precision",
    description:
      "The quality of a space is shaped by the details, from the overall composition to the smallest junction.",
  },
];

export function StudioValuesSection() {
  return (
    <section className="relative overflow-hidden bg-[#111111] py-24 text-[#F2F0EB] md:py-36">
      <div className="editorial-container">
        {/* Header */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="editorial-eyebrow text-[#B68A4A]">
              02 / Our Principles
            </p>
          </div>

          <div className="lg:col-span-8">
            <h2 className="max-w-3xl font-serif text-4xl leading-tight tracking-tight md:text-6xl">
              Thoughtful decisions.
              <span className="text-[#B68A4A]">
                {" "}Meaningful spaces.
              </span>
            </h2>

            <p className="mt-8 max-w-xl text-sm leading-8 text-white/55 md:text-base">
              Architecture is a process of making considered decisions.
              These principles guide how we approach design, space and
              execution.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20 border-t border-white/15">
          {values.map((value) => (
            <article
              key={value.number}
              className="group grid grid-cols-1 gap-5 border-b border-white/15 py-9 transition-colors duration-300 hover:bg-white/[0.025] md:grid-cols-12 md:items-start md:gap-8 md:py-12"
            >
              <div className="md:col-span-1">
                <span className="font-mono text-xs tracking-wider text-[#B68A4A]">
                  {value.number}
                </span>
              </div>

              <div className="md:col-span-5">
                <h3 className="font-serif text-2xl tracking-tight text-[#F2F0EB] transition-colors duration-300 group-hover:text-[#C6A675] md:text-3xl">
                  {value.title}
                </h3>
              </div>

              <div className="md:col-span-5 md:col-start-8">
                <p className="max-w-lg text-sm leading-8 text-white/55 md:text-base">
                  {value.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Closing Statement */}
        <div className="mt-20 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <p className="max-w-2xl font-serif text-3xl leading-snug text-[#F2F0EB] md:text-4xl">
            Good architecture is experienced, not merely observed.
          </p>

          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            ARCHEON DESIGN STUDIO
          </span>
        </div>
      </div>
    </section>
  );
}
