
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  CalendarDays,
  Download,
  FolderOpen,
} from "lucide-react";

export type ProjectDocumentCategory =
  | "Drawing"
  | "Render"
  | "Document";

export interface ClientProjectDocument {
  id: string;
  title: string;
  category: ProjectDocumentCategory;
  version: string;
  uploadedAt: string;
  approved: boolean;
  downloadUrl?: string;
}

export interface ClientProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface ClientProjectWorkspaceData {
  id: string;
  name: string;
  location: string;
  status: string;
  description?: string;
  documents: ClientProjectDocument[];
  updates: ClientProjectUpdate[];
}

type WorkspaceTab = "overview" | "drawings" | "renders" | "documents";

interface ClientProjectWorkspaceProps {
  project: ClientProjectWorkspaceData;
  loading?: boolean;
  error?: string;
  onBack: () => void;
  onDownloadDocument: (
    document: ClientProjectDocument
  ) => void | Promise<void>;
}

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "drawings", label: "Drawings" },
  { id: "renders", label: "Renders" },
  { id: "documents", label: "Documents" },
];

export function ClientProjectWorkspace({
  project,
  loading = false,
  error,
  onBack,
  onDownloadDocument,
}: ClientProjectWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("overview");

  const visibleDocuments =
    activeTab === "drawings"
      ? project.documents.filter(
          (document) =>
            document.category === "Drawing" && document.approved
        )
      : activeTab === "renders"
        ? project.documents.filter(
            (document) =>
              document.category === "Render" && document.approved
          )
        : activeTab === "documents"
          ? project.documents.filter(
              (document) =>
                document.category === "Document" && document.approved
            )
          : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] p-10">
        <p className="text-sm text-[#77736C]">
          Loading project workspace...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] p-10">
        <div role="alert" className="max-w-xl border border-[#E3C9C5] bg-[#FAF3F1] p-7">
          <h2 className="font-serif text-2xl text-[#773B34]">
            Workspace unavailable
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#805B55]">
            {error}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* Back Navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
        >
          <ArrowLeft size={15} />
          All Projects
        </button>

        {/* Project Header */}
        <header className="mt-10 border-b border-[#D8D6D0] pb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
            Private Workspace / {project.id}
          </p>

          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl text-[#111111] md:text-6xl">
                {project.name}
              </h1>

              <p className="mt-4 text-sm text-[#77736C]">
                {project.location}
              </p>
            </div>

            <span className="w-fit border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[#66635D]">
              {project.status}
            </span>
          </div>

          {project.description && (
            <p className="mt-8 max-w-3xl text-sm leading-8 text-[#66635D]">
              {project.description}
            </p>
          )}
        </header>

        {/* Workspace Navigation */}
        <nav
          aria-label="Project workspace sections"
          className="mt-8 flex gap-7 overflow-x-auto border-b border-[#D8D6D0]"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`shrink-0 border-b-2 pb-4 text-xs transition-colors ${
                activeTab === tab.id
                  ? "border-[#A58A64] text-[#171717]"
                  : "border-transparent text-[#99958D] hover:text-[#33312D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-12">
            <section className="lg:col-span-7">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Project Activity
              </p>

              <h2 className="mt-5 font-serif text-3xl text-[#171717]">
                Recent Updates
              </h2>

              {project.updates.length === 0 ? (
                <EmptyState message="Project updates will appear here when shared by the studio." />
              ) : (
                <div className="mt-8 border-t border-[#D8D6D0]">
                  {project.updates.map((update) => (
                    <article
                      key={update.id}
                      className="border-b border-[#D8D6D0] py-7"
                    >
                      <div className="flex items-center gap-3 text-[#A58A64]">
                        <CalendarDays size={15} />
                        <span className="font-mono text-[10px] uppercase tracking-widest">
                          {update.date}
                        </span>
                      </div>

                      <h3 className="mt-4 font-serif text-2xl text-[#171717]">
                        {update.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#77736C]">
                        {update.description}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="border border-[#D8D6D0] bg-white p-7">
                <FolderOpen size={23} className="text-[#A58A64]" />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  Shared Files
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#77736C]">
                  Access drawings, visualisations and documents that
                  the studio has approved for your project.
                </p>

                <p className="mt-7 border-t border-[#E5E2DC] pt-5 font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
                  {project.documents.filter((item) => item.approved).length} Approved Files
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* Document Collections */}
        {activeTab !== "overview" && (
          <section className="py-12">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Project Library
                </p>

                <h2 className="mt-4 font-serif text-3xl text-[#171717]">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
              </div>

              <span className="font-mono text-[10px] text-[#99958D]">
                {visibleDocuments.length} FILES
              </span>
            </div>

            {visibleDocuments.length === 0 ? (
              <EmptyState message="No approved files are currently available in this section." />
            ) : (
              <div className="mt-8 border-t border-[#D8D6D0]">
                {visibleDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="flex flex-col justify-between gap-5 border-b border-[#D8D6D0] py-6 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 text-[#A58A64]">
                        {document.category === "Render" ? (
                          <ImageIcon size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </span>

                      <div>
                        <h3 className="text-sm text-[#171717]">
                          {document.title}
                        </h3>

                        <p className="mt-2 font-mono text-[10px] text-[#99958D]">
                          {document.version} · {document.uploadedAt}
                        </p>

                        <span className="mt-3 inline-block text-[9px] uppercase tracking-widest text-[#547A51]">
                          Approved for client access
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDownloadDocument(document)}
                      disabled={!document.downloadUrl}
                      className="inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[#33312D] hover:text-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Download
                      <Download size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL CLIENT WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-8 border border-[#D8D6D0] bg-white px-6 py-14 text-center">
      <FolderOpen
        size={27}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
