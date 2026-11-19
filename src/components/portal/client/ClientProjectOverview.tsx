
"use client";

import {
  ArrowUpRight,
  MapPin,
  CalendarDays,
  FolderOpen,
  FileText,
} from "lucide-react";

export type ClientProjectStatus =
  | "Planning"
  | "Under Design"
  | "Under Execution"
  | "On Hold"
  | "Completed";

export interface ClientProject {
  id: string;
  projectName: string;
  projectType: string;
  location: string;
  status: ClientProjectStatus;
  startDate?: string;
  expectedCompletion?: string;
  projectManager?: string;
  description?: string;
}

interface ClientProjectOverviewProps {
  projects: ClientProject[];
  loading?: boolean;
  error?: string;
  onOpenProject: (project: ClientProject) => void;
  onRetry?: () => void;
}

const statusStyles: Record<ClientProjectStatus, string> = {
  Planning: "bg-[#EAE7DF] text-[#71664F]",
  "Under Design": "bg-[#E7EDF2] text-[#526B80]",
  "Under Execution": "bg-[#E9EFE6] text-[#58724F]",
  "On Hold": "bg-[#F5EAE5] text-[#99634F]",
  Completed: "bg-[#E7ECE8] text-[#526D5A]",
};

export function ClientProjectOverview({
  projects,
  loading = false,
  error,
  onOpenProject,
  onRetry,
}: ClientProjectOverviewProps) {
  return (
    <section className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-9 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A58A64]">
              Client Workspace / Projects
            </p>

            <h1 className="mt-5 font-serif text-4xl text-[#111111] md:text-6xl">
              Your Projects
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#77736C]">
              View your assigned projects, access project information
              and follow the latest updates from the studio.
            </p>
          </div>

          <span className="font-mono text-xs text-[#77736C]">
            {projects.length} {projects.length === 1 ? "PROJECT" : "PROJECTS"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D8D6D0] border-t-[#A58A64]" />
            <p className="mt-5 text-sm text-[#77736C]">
              Loading your projects...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-10 border border-[#E3C9C5] bg-[#FAF3F1] p-7"
          >
            <h2 className="font-serif text-2xl text-[#773B34]">
              Projects could not be loaded
            </h2>

            <p className="mt-3 text-sm text-[#805B55]">{error}</p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-6 text-xs uppercase tracking-widest text-[#773B34] underline underline-offset-4"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="mt-10 border border-[#D8D6D0] bg-white px-6 py-20 text-center">
            <FolderOpen
              size={34}
              strokeWidth={1.2}
              className="mx-auto text-[#A58A64]"
            />

            <h2 className="mt-6 font-serif text-2xl text-[#171717]">
              No projects assigned
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77736C]">
              Projects assigned to your account will appear here.
              Contact the studio if you believe something is missing.
            </p>
          </div>
        )}

        {/* Project Cards */}
        {!loading && !error && projects.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="border border-[#D8D6D0] bg-white p-7 transition-colors duration-300 hover:border-[#B68A4A] md:p-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                    Project / {project.id}
                  </span>

                  <span
                    className={`px-3 py-2 text-[9px] uppercase tracking-widest ${statusStyles[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>

                <h2 className="mt-7 font-serif text-3xl leading-tight text-[#171717] md:text-4xl">
                  {project.projectName}
                </h2>

                <p className="mt-3 text-sm text-[#77736C]">
                  {project.projectType}
                </p>

                {project.description && (
                  <p className="mt-5 text-sm leading-7 text-[#77736C]">
                    {project.description}
                  </p>
                )}

                <div className="mt-8 space-y-5 border-t border-[#E5E2DC] pt-6">
                  <Metadata
                    icon={<MapPin size={16} />}
                    label="Location"
                    value={project.location}
                  />

                  {project.startDate && (
                    <Metadata
                      icon={<CalendarDays size={16} />}
                      label="Start Date"
                      value={project.startDate}
                    />
                  )}

                  {project.expectedCompletion && (
                    <Metadata
                      icon={<CalendarDays size={16} />}
                      label="Expected Completion"
                      value={project.expectedCompletion}
                    />
                  )}

                  {project.projectManager && (
                    <Metadata
                      icon={<FileText size={16} />}
                      label="Project Manager"
                      value={project.projectManager}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProject(project)}
                  className="mt-9 flex w-full items-center justify-between border-t border-[#E5E2DC] pt-6 text-left"
                >
                  <span className="text-xs uppercase tracking-widest text-[#171717]">
                    Open Project Workspace
                  </span>

                  <ArrowUpRight
                    size={19}
                    strokeWidth={1.4}
                    className="text-[#A58A64]"
                  />
                </button>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE CLIENT WORKSPACE
          </p>
        </div>
      </div>
    </section>
  );
}

function Metadata({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 text-[#A58A64]">{icon}</span>

      <div className="flex flex-1 items-start justify-between gap-4">
        <span className="text-xs text-[#99958D]">{label}</span>
        <span className="text-right text-xs text-[#33312D]">
          {value}
        </span>
      </div>
    </div>
  );
}
