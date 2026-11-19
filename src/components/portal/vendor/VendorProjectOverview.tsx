
"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  FolderOpen,
  MapPin,
  ShieldCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";

export type VendorProjectStatus =
  | "Assigned"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export interface VendorProjectDocument {
  id: string;
  title: string;
  category: "Drawing" | "Specification" | "Work Order" | "Other";
  version?: string;
  uploadedAt: string;
}

export interface VendorProjectRecord {
  id: string;
  projectName: string;
  location: string;
  assignment: string;
  scopeDescription: string;
  status: VendorProjectStatus;
  assignedAt: string;
  expectedCompletion?: string;
  projectManager?: string;
  instructions?: string;
  documents: VendorProjectDocument[];
}

interface VendorProjectOverviewProps {
  projects: VendorProjectRecord[];
  loading?: boolean;
  error?: string;
  onOpenProject: (project: VendorProjectRecord) => void;
  onOpenDocument: (
    document: VendorProjectDocument,
    project: VendorProjectRecord
  ) => void | Promise<void>;
  onRetry?: () => void;
  onBack?: () => void;
}

function getStatusStyle(status: VendorProjectStatus) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "In Progress":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "On Hold":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Cancelled":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function VendorProjectOverview({
  projects,
  loading = false,
  error,
  onOpenProject,
  onOpenDocument,
  onRetry,
  onBack,
}: VendorProjectOverviewProps) {
  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading assigned projects...
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
          Project information unavailable
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

  const activeProjects = projects.filter(
    (project) =>
      project.status === "Assigned" ||
      project.status === "In Progress"
  );

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-8 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              <ArrowLeft size={15} />
              Vendor Dashboard
            </button>
          )}

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Work Assignments
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Assigned Projects
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Review your work assignments, project responsibilities
            and documents shared by the studio.
          </p>
        </header>

        {/* Summary */}
        <section
          aria-label="Project summary"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3"
        >
          <SummaryCard
            label="Total Assignments"
            value={String(projects.length)}
            icon={<Building2 size={19} />}
          />

          <SummaryCard
            label="Active Projects"
            value={String(activeProjects.length)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label="Completed Projects"
            value={String(
              projects.filter(
                (project) => project.status === "Completed"
              ).length
            )}
            icon={<FolderOpen size={19} />}
          />
        </section>

        {/* Project List */}
        <section className="mt-14">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Work Portfolio
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Project Assignments
            </h2>
          </div>

          {projects.length === 0 ? (
            <EmptyState message="No projects have been assigned to your vendor account yet." />
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="border border-[#D8D6D0] bg-white p-6 md:p-8"
                >
                  {/* Project Title */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      Vendor Assignment
                    </span>

                    <span
                      className={`px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-2xl text-[#171717]">
                    {project.projectName}
                  </h3>

                  <p className="mt-3 flex items-center gap-2 text-xs text-[#77736C]">
                    <MapPin size={14} className="text-[#A58A64]" />
                    {project.location}
                  </p>

                  {/* Assignment */}
                  <div className="mt-7 border-t border-[#E5E2DC] pt-6">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      Assigned Scope
                    </p>

                    <p className="mt-3 text-sm font-medium text-[#33312D]">
                      {project.assignment}
                    </p>

                    <p className="mt-3 text-xs leading-7 text-[#77736C]">
                      {project.scopeDescription}
                    </p>
                  </div>

                  {/* Project Details */}
                  <div className="mt-7 grid grid-cols-1 gap-5 border-t border-[#E5E2DC] pt-6 sm:grid-cols-2">
                    <DetailItem
                      icon={<CalendarDays size={15} />}
                      label="Assigned On"
                      value={project.assignedAt}
                    />

                    <DetailItem
                      icon={<Clock3 size={15} />}
                      label="Expected Completion"
                      value={project.expectedCompletion || "Not specified"}
                    />
                  </div>

                  {project.projectManager && (
                    <div className="mt-5">
                      <DetailItem
                        icon={<Building2 size={15} />}
                        label="Project Manager"
                        value={project.projectManager}
                      />
                    </div>
                  )}

                  {/* Instructions */}
                  {project.instructions && (
                    <div className="mt-7 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#94743F]">
                        Project Instructions
                      </p>

                      <p className="mt-3 text-xs leading-7 text-[#6F5C39]">
                        {project.instructions}
                      </p>
                    </div>
                  )}

                  {/* Documents */}
                  <div className="mt-7 border-t border-[#E5E2DC] pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                        Shared Project Documents
                      </p>

                      <span className="font-mono text-[9px] text-[#99958D]">
                        {project.documents.length} FILES
                      </span>
                    </div>

                    {project.documents.length === 0 ? (
                      <p className="mt-4 text-xs text-[#99958D]">
                        No documents shared for this assignment.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {project.documents.map((document) => (
                          <button
                            key={document.id}
                            type="button"
                            onClick={() =>
                              void onOpenDocument(document, project)
                            }
                            className="flex w-full items-center gap-3 border border-[#E5E2DC] px-4 py-3 text-left transition-colors hover:border-[#A58A64]"
                          >
                            <FileText
                              size={17}
                              className="shrink-0 text-[#A58A64]"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs text-[#33312D]">
                                {document.title}
                              </span>

                              <span className="mt-1 block font-mono text-[9px] text-[#99958D]">
                                {document.category}
                                {document.version
                                  ? ` · ${document.version}`
                                  : ""}
                              </span>
                            </span>

                            <ArrowUpRight
                              size={15}
                              className="shrink-0 text-[#99958D]"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="mt-7 inline-flex items-center gap-3 border-b border-[#A58A64] pb-2 text-[10px] uppercase tracking-widest text-[#33312D] hover:text-[#A58A64]"
                  >
                    Open Project Details
                    <ArrowUpRight size={15} />
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
            Project assignments and shared documents are restricted
            to authorised vendor accounts. Access permissions are
            enforced by the server.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        <span className="text-[#A58A64]">{icon}</span>
        {label}
      </p>

      <p className="mt-2 text-xs text-[#33312D]">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-b border-[#D8D6D0] px-5 py-14 text-center">
      <FolderOpen
        size={27}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
