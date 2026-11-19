
import { ArrowLeft, Clock3 } from "lucide-react";
import type { JournalArticle } from "./JournalArticleCard";

export interface JournalContentBlock {
  id: string;
  type: "paragraph" | "heading" | "image" | "quote";
  content: string;
  imageAlt?: string;
}

interface JournalArticleDetailProps {
  article: JournalArticle;
  author: string;
  content: JournalContentBlock[];
  onBack?: () => void;
}

export function JournalArticleDetail({
  article,
  author,
  content,
  onBack,
}: JournalArticleDetailProps) {
  return (
    <main className="min-h-screen bg-[#F2F0EB] text-[#111111]">
      {/* Back Navigation */}
      <div className="editorial-container pt-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] transition-colors hover:text-[#A58A64]"
        >
          <ArrowLeft size={15} strokeWidth={1.4} />
          Back to Journal
        </button>
      </div>

      {/* Article Header */}
      <header className="editorial-container pb-16 pt-20 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-4">
            <span className="editorial-eyebrow text-[#A58A64]">
              {article.category}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#B68A4A]" />

            <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              {article.publishedAt}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#B68A4A]" />

            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              <Clock3 size={13} />
              {article.readingTime} read
            </span>
          </div>

          <h1 className="mt-10 font-serif text-5xl leading-[1.1] tracking-tight text-[#111111] md:text-7xl">
            {article.title}
          </h1>

          <p className="mt-8 max-w-3xl font-serif text-xl leading-relaxed text-[#77736C] md:text-2xl">
            {article.excerpt}
          </p>

          <div className="mt-10 border-t border-[#D8D6D0] pt-6">
            <p className="editorial-eyebrow text-[#99958D]">
              Written by
            </p>
            <p className="mt-2 text-sm text-[#33312D]">{author}</p>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.image && (
        <div className="editorial-container">
          <div className="aspect-[16/8] overflow-hidden bg-[#D8D4CC]">
            <img
              src={article.image}
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="editorial-container py-20 md:py-32">
        <div className="mx-auto max-w-3xl space-y-10">
          {content.map((block) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={block.id}
                    className="pt-8 font-serif text-3xl leading-tight text-[#171717] md:text-4xl"
                  >
                    {block.content}
                  </h2>
                );

              case "quote":
                return (
                  <blockquote
                    key={block.id}
                    className="border-l-2 border-[#B68A4A] py-2 pl-7 font-serif text-2xl leading-relaxed text-[#55514A] md:text-3xl"
                  >
                    {block.content}
                  </blockquote>
                );

              case "image":
                return (
                  <figure key={block.id}>
                    <img
                      src={block.content}
                      alt={block.imageAlt || ""}
                      loading="lazy"
                      className="w-full object-cover"
                    />
                    {block.imageAlt && (
                      <figcaption className="mt-3 font-mono text-[10px] tracking-wider text-[#99958D]">
                        {block.imageAlt}
                      </figcaption>
                    )}
                  </figure>
                );

              default:
                return (
                  <p
                    key={block.id}
                    className="text-base leading-9 text-[#55514A] md:text-lg"
                  >
                    {block.content}
                  </p>
                );
            }
          })}
        </div>
      </article>

      {/* Article Footer */}
      <footer className="border-t border-[#D8D6D0] bg-white py-12">
        <div className="editorial-container flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / JOURNAL
          </span>

          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64] hover:text-[#111111]"
          >
            Return to Journal
          </button>
        </div>
      </footer>
    </main>
  );
}
