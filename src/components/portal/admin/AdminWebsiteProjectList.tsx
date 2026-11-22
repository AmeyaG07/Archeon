"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FolderKanban,
  Edit3,
  Plus,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Image as ImageIcon
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export interface WebsiteProjectRecord {
  id: string;
  code?: string;
  title: string;
  image?: string;
  category?: string;
  location?: string;
  year?: string;
  projectYear?: string;
  area?: string;
  status?: string;
  summaryTitle?: string;
  summary?: string;
  tagsJson?: string;
  linksJson?: string;
  accentColor?: string;
}

export function AdminWebsiteProjectList() {
  const [projects, setProjects] = useState<WebsiteProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit modal state
  const [editingProject, setEditingProject] = useState<WebsiteProjectRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("Residential");
  const [formLocation, setFormLocation] = useState("");
  const [formYear, setFormYear] = useState("2026");
  const [formArea, setFormArea] = useState("");
  const [formStatus, setFormStatus] = useState("Completed");
  const [formSummary, setFormSummary] = useState("");
  const [formAccentColor, setFormAccentColor] = useState("#d97706");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/projects");
      const list = await res.json();
      if (Array.isArray(list)) {
        setProjects(list);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load showcase website projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenEdit = (project: WebsiteProjectRecord) => {
    setEditingProject(project);
    setFormTitle(project.title || "");
    setFormCode(project.code || "");
    setFormImage(project.image || "/projects/monolith-sanctuary.png");
    setFormCategory(project.category || "Residential");
    setFormLocation(project.location || "Maharashtra");
    setFormYear(project.projectYear || project.year || "2026");
    setFormArea(project.area || "8,500 sq.ft");
    setFormStatus(project.status || "Completed");
    setFormSummary(project.summary || "");
    setFormAccentColor(project.accentColor || "#d97706");
  };

  const handleCloseEdit = () => {
    setEditingProject(null);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...editingProject,
        title: formTitle.trim(),
        code: formCode.trim(),
        image: formImage.trim(),
        category: formCategory.trim(),
        location: formLocation.trim(),
        year: formYear.trim(),
        projectYear: formYear.trim(),
        area: formArea.trim(),
        status: formStatus.trim(),
        summary: formSummary.trim(),
        accentColor: formAccentColor.trim(),
      };

      const res = await apiFetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        body: payload,
      });

      if (!res.ok) {
        throw new Error("Failed to save project updates.");
      }

      setSuccess(`Project "${formTitle}" updated successfully!`);
      handleCloseEdit();
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update showcase project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8D6D0] pb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
            Public Website Content Management
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#111111] mt-1">
            Website Portfolio Showcase Projects
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Manage the hero projects, photographs, and architectural descriptions featured on the public Studio ArcheOn website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-[#55514A] hover:border-[#A58A64] transition-colors rounded-sm shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Projects List with Photos and Descriptions */}
      {loading && projects.length === 0 ? (
        <div className="py-20 text-center text-[#77736C] font-mono text-xs">
          Loading website showcase projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#D8D6D0] rounded-sm p-8">
          <FolderKanban size={36} className="mx-auto text-[#A58A64]/50 mb-3" />
          <p className="font-serif text-lg text-[#111111]">No showcase projects found</p>
          <p className="text-xs text-[#77736C] mt-1">Projects will appear here once seeded or created.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const imgSrc = project.image || "/projects/monolith-sanctuary.png";
            let tags: string[] = [];
            try {
              if (project.tagsJson) {
                tags = JSON.parse(project.tagsJson);
              }
            } catch {
              tags = [];
            }

            return (
              <div
                key={project.id}
                className="bg-white border border-[#D8D6D0] rounded-sm p-5 sm:p-6 shadow-xs hover:border-[#A58A64] transition-all flex flex-col lg:flex-row gap-6 items-start justify-between"
              >
                {/* Left: Project Image Thumbnail */}
                <div className="relative w-full lg:w-72 h-48 lg:h-44 shrink-0 rounded overflow-hidden bg-stone-100 border border-[#E8E6E0] group">
                  <Image
                    src={imgSrc}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-white text-[9.5px] font-mono tracking-wider uppercase">
                    {project.category || "Architecture"}
                  </div>
                  {project.status && (
                    <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded text-[#111111] text-[9.5px] font-mono tracking-wider uppercase font-semibold">
                      {project.status}
                    </div>
                  )}
                </div>

                {/* Middle: Details & Description */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[10px] text-[#A58A64] bg-[#FAF8F5] px-2 py-0.5 border border-[#E8E6E0] rounded">
                      {project.code || project.id}
                    </span>
                    <h3 className="font-serif text-2xl text-[#111111] font-normal truncate">
                      {project.title}
                    </h3>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#77736C] font-mono">
                    {project.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#A58A64]" />
                        {project.location}
                      </span>
                    )}
                    {project.area && (
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} className="text-[#A58A64]" />
                        {project.area}
                      </span>
                    )}
                    {project.year && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#A58A64]" />
                        {project.year}
                      </span>
                    )}
                  </div>

                  {/* Architectural Description / Summary */}
                  <div className="text-xs text-[#44413C] leading-relaxed line-clamp-3 bg-[#FAF8F5] p-3.5 border border-[#EFECE6] rounded-sm">
                    {project.summary || "No architectural description provided for this project."}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono text-[9px] px-2 py-0.5 bg-white border border-[#D8D6D0] text-[#77736C] uppercase tracking-wider rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="shrink-0 w-full lg:w-auto flex lg:flex-col gap-2.5 pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#171717] hover:bg-[#A58A64] text-white text-xs font-mono uppercase tracking-wider transition-colors rounded-sm shadow-xs font-semibold cursor-pointer"
                  >
                    <Edit3 size={14} />
                    Edit Project
                  </button>
                  <a
                    href={`/#${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#D8D6D0] bg-white hover:bg-[#FAF8F5] text-[#55514A] text-xs font-mono uppercase tracking-wider transition-colors rounded-sm"
                  >
                    <ExternalLink size={13} />
                    View on Site
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Showcase Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#FCFBF8] border border-[#D8D6D0] shadow-2xl p-6 sm:p-8 rounded-sm my-8">
            <div className="flex items-center justify-between border-b border-[#E8E6E0] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F5] text-[#A58A64] border border-[#D8D6D0]">
                  <Edit3 size={18} />
                </span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64] font-semibold">
                    Studio Architectural Showcase CMS
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#171717]">
                    Edit Website Project: {editingProject.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                type="button"
                className="p-2 text-[#77736C] hover:text-[#171717] hover:bg-[#F2F0EB] transition-colors rounded-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Project Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Project Code:
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  />
                </div>
              </div>

              {/* Photo / Image URL */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                  Project Photo / Image URL or Asset Path:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="e.g. /projects/monolith-sanctuary.png or https://..."
                      className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm pr-9"
                    />
                    <ImageIcon size={14} className="absolute right-3 top-2.5 text-[#A58A64]" />
                  </div>
                </div>
                <p className="text-[10.5px] text-[#77736C] mt-1 font-mono">
                  Default showcase paths: /projects/monolith-sanctuary.png, /projects/travertine-penthouse.png, /projects/terracotta-courtyard-estate.png
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Category:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Interior">Interior</option>
                    <option value="Landscape">Landscape</option>
                    <option value="Turnkey">Turnkey</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Status:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Under Execution">Under Execution</option>
                    <option value="Planning">Planning</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Year:
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Location:
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                    Area:
                  </label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white px-3.5 py-2 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm"
                  />
                </div>
              </div>

              {/* Architectural Description / Summary */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A] mb-1.5 font-medium">
                  Architectural Description / Narrative:
                </label>
                <textarea
                  rows={4}
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white p-3 text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none rounded-sm leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E6E0]">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-5 py-2.5 border border-[#D8D6D0] text-[#55514A] hover:bg-[#F2F0EB] text-xs font-mono uppercase tracking-wider transition-colors rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#171717] hover:bg-[#A58A64] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-colors rounded-sm shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  {saving ? "Saving Changes..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
