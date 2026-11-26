
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FolderKanban,
  ArrowUpRight,
  CalendarDays,
  Users,
  MapPin,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";

export type AdminProjectStatus =
  | "Planning"
  | "Under Design"
  | "Under Execution"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export type AdminProjectCategory =
  | "Residential"
  | "Commercial"
  | "Interior"
  | "Landscape"
  | "Turnkey"
  | "Other";

export interface AdminProjectRecord {
  id: string;
  reference: string;
  name: string;
  category: AdminProjectCategory;
  clientName: string;
  location: string;
  projectManager: string;
  status: AdminProjectStatus;
  startDate?: string;
  expectedCompletion?: string;
  lastVisitDate?: string;
  lastUpdated: string;
  milestoneSummary?: {
    completed: number;
    total: number;
  };
}

interface AdminProjectManagementProps {
  projects: AdminProjectRecord[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onOpenProject: (projectId: string) => void;
  onCreateProject?: () => void;
  onAdjustMilestone?: (
    projectId: string,
    nextCompleted: number,
    total: number
  ) => Promise<void>;
}

type StatusFilter = "All" | AdminProjectStatus;
type CategoryFilter = "All" | AdminProjectCategory;

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "Planning",
  "Under Design",
  "Under Execution",
  "On Hold",
  "Completed",
  "Cancelled",
];

const CATEGORY_OPTIONS: CategoryFilter[] = [
  "All",
  "Residential",
  "Commercial",
  "Interior",
  "Landscape",
  "Turnkey",
  "Other",
];

function formatDate(value?: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusStyle(status: AdminProjectStatus) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Under Execution":
      return "bg-[#EAF0F5] text-[#58738C]";
    case "Under Design":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "On Hold":
      return "bg-[#F8EAE7] text-[#9A5147]";
    case "Cancelled":
      return "bg-[#ECEAE5] text-[#77736C]";
    default:
      return "bg-[#F0EEE9] text-[#77736C]";
  }
}

export function AdminProjectManagement({
  projects,
  loading = false,
  error,
  onRefresh,
  onOpenProject,
  onCreateProject,
  onAdjustMilestone,
}: AdminProjectManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("All");
  const [sortOrder, setSortOrder] = useState<
    "recent" | "oldest" | "name"
  >("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counts = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(
        (project) =>
          project.status === "Planning" ||
          project.status === "Under Design" ||
          project.status === "Under Execution"
      ).length,
      execution: projects.filter(
        (project) => project.status === "Under Execution"
      ).length,
      completed: projects.filter(
        (project) => project.status === "Completed"
      ).length,
      onHold: projects.filter(
        (project) => project.status === "On Hold"
      ).length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.reference.toLowerCase().includes(query) ||
        project.clientName.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query) ||
        project.projectManager.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        project.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return [...results].sort((a, b) => {
      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }

      const dateA = new Date(a.lastUpdated).getTime();
      const dateB = new Date(b.lastUpdated).getTime();

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [projects, search, statusFilter, categoryFilter, sortOrder]);

  const hasActiveFilters =
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    search.trim().length > 0;

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSortOrder("recent");
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Page Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Project Register
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Project Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review project assignments, monitor progress and access
            individual project records.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onCreateProject && (
            <button
              type="button"
              onClick={onCreateProject}
              className="bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
            >
              Create Project
            </button>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[#9A5147]"
          />
          <p className="text-xs leading-6 text-[#805B55]">
            {error}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <section className="mt-9">
        <div className="grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
          <SummaryCard label="Total Projects" value={counts.total} />
          <SummaryCard label="Active Projects" value={counts.active} />
          <SummaryCard label="In Execution" value={counts.execution} />
          <SummaryCard label="Completed" value={counts.completed} />
          <SummaryCard label="On Hold" value={counts.onHold} />
        </div>
      </section>

      {/* Search and Filters */}
      <section className="mt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search project, reference, client or location..."
              aria-label="Search projects"
              className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            className="inline-flex h-12 items-center justify-center gap-3 border border-[#D8D6D0] bg-white px-5 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
          >
            <Filter size={15} />
            Filters
            <ChevronDown
              size={14}
              className={filtersOpen ? "rotate-180" : ""}
            />
          </button>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value as "recent" | "oldest" | "name"
              )
            }
            aria-label="Sort projects"
            className="h-12 border border-[#D8D6D0] bg-white px-4 text-xs text-[#55514A] outline-none focus:border-[#A58A64]"
          >
            <option value="recent">Recently Updated</option>
            <option value="oldest">Least Recently Updated</option>
            <option value="name">Project Name</option>
          </select>
        </div>

        {filtersOpen && (
          <div className="mt-4 grid grid-cols-1 gap-4 border border-[#D8D6D0] bg-white p-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                Project Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Statuses" : status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                Project Category
              </span>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as CategoryFilter)
                }
                className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#77736C]">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
            >
              <X size={13} />
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Project Register */}
      <section className="mt-8">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Studio Records
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Project Register
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredProjects.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading project records...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <FolderKanban
              size={29}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No projects found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              There are no project records matching your current filters.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpen={() => onOpenProject(project.id)}
                onAdjustMilestone={onAdjustMilestone}
              />
            ))}
          </div>
        )}
      </section>

      {/* Governance Notice */}
      <div className="mt-12 border border-[#D8D6D0] bg-white p-5">
        <p className="text-xs leading-6 text-[#77736C]">
          Project information is restricted to authorised studio
          personnel. Changes to project ownership, status, milestones
          and client access must be validated and recorded by the
          backend.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function ProjectRow({
  project,
  onOpen,
  onAdjustMilestone,
}: {
  project: AdminProjectRecord;
  onOpen: () => void;
  onAdjustMilestone?: (
    projectId: string,
    nextCompleted: number,
    total: number
  ) => Promise<void>;
}) {
  const [savingMilestone, setSavingMilestone] = useState(false);
  const milestoneData = project.milestoneSummary;

  const validMilestones =
    milestoneData &&
    Number.isInteger(milestoneData.completed) &&
    Number.isInteger(milestoneData.total) &&
    milestoneData.total > 0 &&
    milestoneData.completed >= 0 &&
    milestoneData.completed <= milestoneData.total;

  const progress = validMilestones
    ? (milestoneData.completed / milestoneData.total) * 100
    : null;

  return (
    <article className="border border-[#D8D6D0] bg-white p-5 transition-colors hover:border-[#A58A64] md:p-7">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">

        {/* Project Identity */}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {project.reference}
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {project.name}
          </h3>

          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#99958D]">
            {project.category}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={<Users size={14} />}
              label="Client"
              value={project.clientName}
            />

            <DetailItem
              icon={<MapPin size={14} />}
              label="Location"
              value={project.location}
            />

            <DetailItem
              icon={<FolderKanban size={14} />}
              label="Project Manager"
              value={project.projectManager}
            />

            <DetailItem
              icon={<CalendarDays size={14} />}
              label="Start Date"
              value={formatDate(project.startDate)}
            />

            <DetailItem
              icon={<CalendarDays size={14} />}
              label="Last Site Visit"
              value={project.lastVisitDate ? formatDate(project.lastVisitDate) : "No visit logged yet"}
            />
          </div>
        </div>

        {/* Status and Dates */}
        <div className="flex flex-col gap-4 xl:w-[230px]">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Current Status
            </p>

            <span
              className={`inline-flex px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(project.status)}`}
            >
              {project.status}
            </span>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Expected Completion
            </p>

            <p className="mt-2 text-xs text-[#33312D]">
              {formatDate(project.expectedCompletion)}
            </p>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Last Updated
            </p>

            <p className="mt-2 text-xs text-[#33312D]">
              {formatDate(project.lastUpdated)}
            </p>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      {progress !== null && milestoneData && (
        <div className="mt-7 border-t border-[#E5E2DC] pt-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Milestone Completion ({Math.round(progress)}%)
            </p>

            <div className="flex items-center gap-2">
              {onAdjustMilestone && (
                <button
                  type="button"
                  disabled={savingMilestone || milestoneData.completed <= 0}
                  onClick={async () => {
                    if (milestoneData.completed <= 0) return;
                    setSavingMilestone(true);
                    try {
                      await onAdjustMilestone(
                        project.id,
                        milestoneData.completed - 1,
                        milestoneData.total
                      );
                    } finally {
                      setSavingMilestone(false);
                    }
                  }}
                  aria-label="Decrease milestone completion"
                  className="flex h-6 w-6 items-center justify-center border border-[#D8D6D0] bg-white text-xs font-semibold text-[#171717] transition-colors hover:border-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
              )}

              <p className="min-w-[38px] text-center font-mono text-[10px] font-semibold text-[#171717]">
                {milestoneData.completed} / {milestoneData.total}
              </p>

              {onAdjustMilestone && (
                <button
                  type="button"
                  disabled={
                    savingMilestone ||
                    milestoneData.completed >= milestoneData.total
                  }
                  onClick={async () => {
                    if (milestoneData.completed >= milestoneData.total) return;
                    setSavingMilestone(true);
                    try {
                      await onAdjustMilestone(
                        project.id,
                        milestoneData.completed + 1,
                        milestoneData.total
                      );
                    } finally {
                      setSavingMilestone(false);
                    }
                  }}
                  aria-label="Increase milestone completion"
                  className="flex h-6 w-6 items-center justify-center border border-[#D8D6D0] bg-white text-xs font-semibold text-[#171717] transition-colors hover:border-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div
            className="mt-3 grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${milestoneData.total}, minmax(0, 1fr))`,
            }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Project milestone completion"
          >
            {Array.from({ length: milestoneData.total }).map((_, idx) => {
              const step = idx + 1;
              const filled = step <= milestoneData.completed;
              return (
                <button
                  key={step}
                  type="button"
                  disabled={!onAdjustMilestone || savingMilestone}
                  onClick={async () => {
                    if (!onAdjustMilestone) return;
                    const next =
                      step === milestoneData.completed ? step - 1 : step;
                    setSavingMilestone(true);
                    try {
                      await onAdjustMilestone(
                        project.id,
                        next,
                        milestoneData.total
                      );
                    } finally {
                      setSavingMilestone(false);
                    }
                  }}
                  title={`Set milestone completion to ${step} / ${milestoneData.total}`}
                  className={`h-2 transition-colors ${
                    filled ? "bg-[#A58A64]" : "bg-[#ECEAE5]"
                  } ${
                    onAdjustMilestone
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-default"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="mt-6 flex justify-end border-t border-[#E5E2DC] pt-5">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Open Project Record
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
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
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#A58A64]">{icon}</span>

      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs text-[#55514A]">
          {value}
        </p>
      </div>
    </div>
  );
}
