
import { ArrowUpRight } from "lucide-react";

export interface JournalArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
  image?: string;
  href: string;
}

interface JournalArticleCardProps {
  article: JournalArticle;
  featured?: boolean;
}

export function JournalArticleCard({
  article,
  featured = false,
}: JournalArticleCardProps) {
  return (
    <article className="group h-full">
      <a
        href={article.href}
        className="block h-full"
        aria-label={`Read article: ${article.title}`}
      >
        {/* Article Image */}
        <div
          className={`relative overflow-hidden bg-[#D8D4CC] ${
            featured ? "aspect-[16/9]" : "aspect-[4/3]"
          }`}
        >
          {article.image ? (
            <img
              src={article.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
                Editorial image pending
              </span>
            </div>
          )}

          <span className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-black/10 text-white transition-all duration-300 group-hover:border-[#B68A4A] group-hover:bg-[#B68A4A]">
            <ArrowUpRight size={18} strokeWidth={1.4} />
          </span>
        </div>

        {/* Article Information */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="editorial-eyebrow text-[#A58A64]">
              {article.category}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#B68A4A]" />

            <span className="font-mono text-[9px] uppercase tracking-wider text-[#99958D]">
              {article.publishedAt}
            </span>
          </div>

          <h3
            className={`mt-4 font-serif leading-tight text-[#171717] transition-colors duration-300 group-hover:text-[#A58A64] ${
              featured ? "text-3xl md:text-4xl" : "text-2xl"
            }`}
          >
            {article.title}
          </h3>

          <p className="mt-4 text-sm leading-7 text-[#77736C]">
            {article.excerpt}
          </p>

          <div className="mt-6 border-t border-[#D8D6D0] pt-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              {article.readingTime} read
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

