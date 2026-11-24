
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Download,
  Filter,
  ShieldCheck,
  AlertCircle,
  File,
} from "lucide-react";

export type ClientLibraryCategory =
  | "Drawing"
  | "Render"
  | "Agreement"
  | "Invoice"
  | "Other";

export interface ClientLibraryDocument {
  id: string;
  title: string;
  projectName: string;
  category: ClientLibraryCategory;
  fileType: "PDF" | "IMAGE" | "OTHER";
  fileSizeLabel: string;
  uploadedAt: string;
  version?: string;
}

interface ClientDocumentLibraryProps {
  documents: ClientLibraryDocument[];
  loading?: boolean;
  error?: string;
  onOpenDocument: (
    document: ClientLibraryDocument
  ) => void | Promise<void>;
  onRetry?: () => void;
}

type CategoryFilter = "All" | ClientLibraryCategory;

const categories: CategoryFilter[] = [
  "All",
  "Drawing",
  "Render",
  "Agreement",
  "Invoice",
  "Other",
];

function DocumentIcon({
  document,
}: {
  document: ClientLibraryDocument;
}) {
  if (document.category === "Render" || document.fileType === "IMAGE") {
    return <ImageIcon size={21} />;
  }

  if (document.category === "Drawing") {
    return <FileText size={21} />;
  }

  return <File size={21} />;
}

export function ClientDocumentLibrary({
  documents,
  loading = false,
  error,
  onOpenDocument,
  onRetry,
}: ClientDocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All");
  const [activeProject, setActiveProject] = useState("All");

  const projects = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(documents.map((document) => document.projectName))
      ).sort(),
    ],
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.title.toLowerCase().includes(query) ||
        document.projectName.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "All" ||
        document.category === activeCategory;

      const matchesProject =
        activeProject === "All" ||
        document.projectName === activeProject;

      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [documents, searchQuery, activeCategory, activeProject]);

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading your document library...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Document library unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Shared Resources
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Document Library
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Find and access drawings, visualisations, agreements
            and other documents shared with you by the studio.
          </p>
        </header>

        {/* Library Summary */}
        <section className="mt-8 flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-[#F2F0EB] text-[#A58A64]">
              <FolderOpen size={23} />
            </div>

            <div>
              <p className="font-serif text-2xl text-[#171717]">
                {documents.length} Shared Files
              </p>

              <p className="mt-1 text-xs text-[#99958D]">
                Across {projects.length - 1} assigned projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#77736C]">
            <ShieldCheck size={17} className="text-[#A58A64]" />
            <span className="font-mono text-[9px] uppercase tracking-widest">
              Client-authorised documents
            </span>
          </div>
        </section>

        {/* Search */}
        <section className="mt-10">
          <label
            htmlFor="document-search"
            className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
          >
            Search Library
          </label>

          <div className="flex items-center gap-3 border border-[#D8D6D0] bg-white px-5">
            <Search size={19} className="shrink-0 text-[#A58A64]" />

            <input
              id="document-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by document or project name..."
              className="w-full bg-transparent py-5 text-sm text-[#171717] outline-none placeholder:text-[#AAA69E]"
            />
          </div>
        </section>

        {/* Filters */}
        <section className="mt-7 space-y-5">
          <div className="flex items-center gap-3">
            <Filter size={15} className="text-[#A58A64]" />

            <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Filter by Category
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`border px-4 py-2.5 text-[10px] uppercase tracking-widest transition-colors ${
                  activeCategory === category
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {projects.length > 2 && (
            <div className="max-w-md">
              <label
                htmlFor="project-filter"
                className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-[#99958D]"
              >
                Filter by Project
              </label>

              <select
                id="project-filter"
                value={activeProject}
                onChange={(event) => setActiveProject(event.target.value)}
                className="w-full border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#33312D] outline-none focus:border-[#A58A64]"
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Available Resources
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                Shared Documents
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {filteredDocuments.length} RESULTS
            </span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="mt-8 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
              <FolderOpen
                size={29}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                No documents found
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#77736C]">
                Try another search term or change your filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                  setActiveProject("All");
                }}
                className="mt-6 text-xs uppercase tracking-widest text-[#A58A64] underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="mt-2">
              {filteredDocuments.map((document) => (
                <article
                  key={document.id}
                  className="flex flex-col justify-between gap-5 border-b border-[#D8D6D0] py-6 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-1 shrink-0 text-[#A58A64]">
                      <DocumentIcon document={document} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm text-[#171717]">
                        {document.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#77736C]">
                        {document.projectName}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                        <span>{document.category}</span>
                        <span>{document.fileType}</span>
                        <span>{document.fileSizeLabel}</span>
                        {document.version && (
                          <span>{document.version}</span>
                        )}
                      </div>

                      <p className="mt-2 text-[10px] text-[#99958D]">
                        Shared: {document.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDocument(document)}
                    className="inline-flex shrink-0 items-center gap-3 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#33312D] transition-colors hover:border-[#A58A64] hover:text-[#A58A64]"
                  >
                    Open Document
                    <Download size={15} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Security Notice */}
        <div className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Documents are made available according to your project
            access permissions. Access is verified by the server
            whenever a document is opened.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE DOCUMENT LIBRARY
          </p>
        </footer>
      </div>
    </main>
  );
}
