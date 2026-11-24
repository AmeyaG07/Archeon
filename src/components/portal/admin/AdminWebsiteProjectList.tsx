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
  Image as ImageIcon,
  BookOpen,
  Phone,
  Mail,
  Building2,
  Globe,
  Trash2,
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
  socialsJson?: string;
  accentColor?: string;
}

export interface ManifestoRecord {
  id?: number;
  title: string;
  headline: string;
  paragraphsJson: string;
}

const PRESET_IMAGES = [
  { label: "Monolith Sanctuary (Basalt & Light)", url: "/projects/monolith-sanctuary.png" },
  { label: "Travertine Penthouse (Warm Minimalist)", url: "/projects/travertine-penthouse.png" },
  { label: "Terracotta Courtyard Estate (Coastal Bio-swale)", url: "/projects/terracotta-courtyard-estate.png" },
  { label: "Modern Brutalist Stone Villa", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200" },
  { label: "Minimalist Architectural Pavilion", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200" },
  { label: "Cliffside Cantilever Residence", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200" },
];

export function AdminWebsiteProjectList() {
  const [activeTab, setActiveTab] = useState<"projects" | "manifesto" | "contacts">("projects");
  const [projects, setProjects] = useState<WebsiteProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit/Create Project Modal state
  const [editingProject, setEditingProject] = useState<WebsiteProjectRecord | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields for Project
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("Residential");
  const [formLocation, setFormLocation] = useState("");
  const [formYear, setFormYear] = useState("2026");
  const [formArea, setFormArea] = useState("");
  const [formStatus, setFormStatus] = useState("Completed");
  const [formSummary, setFormSummary] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formAccentColor, setFormAccentColor] = useState("#d97706");

  // Manifesto state
  const [manifesto, setManifesto] = useState<ManifestoRecord>({
    title: "/// ARCHEON DESIGN PHILOSOPHY",
    headline: "Sculpting spaces from raw earth, monolithic stone, and controlled light. Where elemental purity meets precision execution.",
    paragraphsJson: "[]",
  });
  const [manifestoParagraphs, setManifestoParagraphs] = useState<string[]>([]);
  const [savingManifesto, setSavingManifesto] = useState(false);

  // Studio profile contact info
  const [studioPhone, setStudioPhone] = useState("+91 9834653481");
  const [studioEmail, setStudioEmail] = useState("dsarcheon@gmail.com");
  const [studioAddress, setStudioAddress] = useState(
    "1st Floor, Krishna-Kunj, 90, Dharampeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022"
  );
  const [studioPrincipal, setStudioPrincipal] = useState("Ar. Mandar Bhalekar");
  const [contactsSaved, setContactsSaved] = useState(false);

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

  const loadManifesto = useCallback(async () => {
    try {
      const res = await apiFetch("/api/manifesto");
      if (res.ok) {
        const data = await res.json();
        setManifesto(data);
        if (data.paragraphsJson) {
          try {
            setManifestoParagraphs(JSON.parse(data.paragraphsJson));
          } catch {
            setManifestoParagraphs([data.paragraphsJson]);
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadProjects();
    loadManifesto();
  }, [loadProjects, loadManifesto]);

  const handleOpenEdit = (project: WebsiteProjectRecord) => {
    setIsCreatingNew(false);
    setEditingProject(project);
    setFormId(project.id);
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

    let tagsStr = "";
    try {
      if (project.tagsJson) {
        const parsed = JSON.parse(project.tagsJson);
        if (Array.isArray(parsed)) tagsStr = parsed.join(", ");
      }
    } catch {}
    setFormTags(tagsStr);
  };

  const handleOpenCreateNew = () => {
    setIsCreatingNew(true);
    const newId = "project-" + Date.now().toString(36);
    setEditingProject({
      id: newId,
      title: "",
    });
    setFormId(newId);
    setFormTitle("");
    setFormCode(`PRJ_${new Date().getFullYear()}_${Math.floor(10 + Math.random() * 90)}`);
    setFormImage("/projects/monolith-sanctuary.png");
    setFormCategory("Residential");
    setFormLocation("Nagpur, Maharashtra");
    setFormYear(new Date().getFullYear().toString());
    setFormArea("7,200 sq.ft");
    setFormStatus("Completed");
    setFormSummary("");
    setFormTags("BRUTALIST STONE, CANTILEVER, SUSTAINABLE");
    setFormAccentColor("#d97706");
  };

  const handleCloseModal = () => {
    setEditingProject(null);
    setIsCreatingNew(false);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError("Project title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      id: formId,
      code: formCode.trim(),
      title: formTitle.trim(),
      image: formImage.trim() || "/projects/monolith-sanctuary.png",
      category: formCategory.trim(),
      location: formLocation.trim(),
      projectYear: formYear.trim(),
      year: formYear.trim(),
      releaseDate: `01/01/${formYear.trim()}`,
      area: formArea.trim(),
      status: formStatus.trim(),
      summaryTitle: `////// ${formCategory.trim().toUpperCase()} ARCHITECTURE`,
      summary: formSummary.trim(),
      tagsJson: JSON.stringify(tagsArray),
      accentColor: formAccentColor.trim(),
    };

    try {
      if (isCreatingNew) {
        const res = await apiFetch("/api/projects", {
          method: "POST",
          body: payload,
        });
        if (!res.ok) throw new Error("Failed to create new website showcase project.");
        setSuccess(`Project "${formTitle}" published successfully to the website!`);
      } else {
        const res = await apiFetch(`/api/projects/${formId}`, {
          method: "PUT",
          body: payload,
        });
        if (!res.ok) throw new Error("Failed to update project.");
        setSuccess(`Project "${formTitle}" updated successfully on the website!`);
      }
      handleCloseModal();
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManifesto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManifesto(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title: manifesto.title,
        headline: manifesto.headline,
        paragraphsJson: JSON.stringify(manifestoParagraphs),
      };

      const res = await apiFetch("/api/manifesto", {
        method: "PUT",
        body: payload,
      });

      if (!res.ok) throw new Error("Failed to update studio manifesto.");
      setSuccess("Studio Philosophy & Manifesto updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save manifesto.");
    } finally {
      setSavingManifesto(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-8 md:px-10 md:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#D8D6D0] pb-6">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
              Public Website Content Management (CMS)
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#111111] mt-1">
              Website Content &amp; Showcase Projects
            </h1>
            <p className="text-xs text-[#77736C] mt-1 max-w-2xl leading-relaxed">
              Live content management for the public ArcheOn Design Studio homepage. Any changes saved here reflect instantly on the live website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-[#33312D] hover:border-[#171717] hover:bg-[#FAF9F5] transition-colors rounded-sm"
            >
              <Globe size={12} /> View Live Website
            </a>
            {activeTab === "projects" && (
              <button
                type="button"
                onClick={handleOpenCreateNew}
                className="inline-flex items-center gap-1.5 bg-[#171717] px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors rounded-sm shadow-xs font-medium cursor-pointer"
              >
                <Plus size={13} /> Add Showcase Project
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#D8D6D0] gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "projects"
                ? "border-[#171717] text-[#171717] font-semibold"
                : "border-transparent text-[#77736C] hover:text-[#171717]"
            }`}
          >
            <FolderKanban size={13} /> Showcase Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("manifesto")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "manifesto"
                ? "border-[#171717] text-[#171717] font-semibold"
                : "border-transparent text-[#77736C] hover:text-[#171717]"
            }`}
          >
            <BookOpen size={13} /> Studio Philosophy &amp; Manifesto
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "contacts"
                ? "border-[#171717] text-[#171717] font-semibold"
                : "border-transparent text-[#77736C] hover:text-[#171717]"
            }`}
          >
            <Phone size={13} /> Studio Details &amp; Contacts
          </button>
        </div>

      {/* TAB 1: SHOWCASE PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          {loading && projects.length === 0 ? (
            <div className="py-20 text-center text-[#77736C] font-mono text-xs">
              Loading website showcase projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#D8D6D0] rounded-sm p-8">
              <FolderKanban size={36} className="mx-auto text-[#A58A64]/50 mb-3" />
              <p className="font-serif text-lg text-[#111111]">No showcase projects found</p>
              <p className="text-xs text-[#77736C] mt-1">Click &quot;Add Showcase Project&quot; above to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const imgSrc = project.image || "/projects/monolith-sanctuary.png";
                let tags: string[] = [];
                try {
                  if (project.tagsJson) tags = JSON.parse(project.tagsJson);
                } catch {
                  tags = [];
                }

                return (
                  <div
                    key={project.id}
                    className="bg-white border border-[#D8D6D0] rounded-sm p-4 sm:p-5 shadow-xs hover:border-[#A58A64] transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    {/* Left: Project Image Thumbnail */}
                    <div className="relative w-full md:w-56 h-36 shrink-0 rounded overflow-hidden bg-stone-100 border border-[#E8E6E0] group">
                      <Image
                        src={imgSrc}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white text-[9px] font-mono tracking-wider uppercase">
                        {project.category || "Architecture"}
                      </div>
                      {project.status && (
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded text-[#111111] text-[9px] font-mono tracking-wider uppercase font-semibold">
                          {project.status}
                        </div>
                      )}
                    </div>

                    {/* Middle: Details & Description */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] text-[#A58A64] bg-[#FAF8F5] px-2 py-0.5 border border-[#E8E6E0] rounded">
                          {project.code || project.id}
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl text-[#111111] font-normal truncate">
                          {project.title}
                        </h3>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-3.5 text-xs text-[#77736C] font-mono">
                        {project.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-[#A58A64]" />
                            {project.location}
                          </span>
                        )}
                        {project.area && (
                          <span className="flex items-center gap-1.5">
                            <Layers size={12} className="text-[#A58A64]" />
                            {project.area}
                          </span>
                        )}
                        {(project.projectYear || project.year) && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#A58A64]" />
                            {project.projectYear || project.year}
                          </span>
                        )}
                      </div>

                      {/* Architectural Description / Summary */}
                      <div className="text-xs text-[#44413C] leading-relaxed line-clamp-2 bg-[#FAF8F5] p-2.5 border border-[#EFECE6] rounded-sm">
                        {project.summary || "No architectural description provided for this project."}
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="font-mono text-[8.5px] px-2 py-0.5 bg-white border border-[#D8D6D0] text-[#77736C] uppercase tracking-wider rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="shrink-0 w-full md:w-auto flex md:flex-col gap-2 pt-2 md:pt-0 justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(project)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#171717] hover:bg-[#A58A64] text-white text-[9px] font-mono uppercase tracking-wider transition-colors rounded-sm shadow-xs font-medium cursor-pointer"
                      >
                        <Edit3 size={12} />
                        Edit Details
                      </button>
                      <a
                        href={`/#${project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#D8D6D0] hover:border-[#171717] text-[#55514A] hover:text-[#171717] text-[9px] font-mono uppercase tracking-wider transition-colors rounded-sm text-center"
                      >
                        <ExternalLink size={12} />
                        View Live
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDIO MANIFESTO & PHILOSOPHY */}
      {activeTab === "manifesto" && (
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 sm:p-8 space-y-6">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
              Live Homepage Section: 01 / The Studio
            </span>
            <h2 className="font-serif text-2xl text-[#111111] mt-1">
              Studio Philosophy & Architectural Manifesto
            </h2>
            <p className="text-xs text-[#77736C] mt-1">
              Edit the mission statement, headline, and philosophy paragraphs showcased in the interactive Studio 3D section on the website.
            </p>
          </div>

          <form onSubmit={handleSaveManifesto} className="space-y-5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Manifesto Section Title
              </label>
              <input
                type="text"
                value={manifesto.title}
                onChange={(e) => setManifesto({ ...manifesto, title: e.target.value })}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Primary Headline / Architectural Creed
              </label>
              <textarea
                rows={2}
                value={manifesto.headline}
                onChange={(e) => setManifesto({ ...manifesto, headline: e.target.value })}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Philosophy Paragraphs (Showcased under Approach & Principles)
              </label>
              {manifestoParagraphs.map((para, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="font-mono text-xs text-[#A58A64] pt-2">0{idx + 1}.</span>
                  <textarea
                    rows={2}
                    value={para}
                    onChange={(e) => {
                      const updated = [...manifestoParagraphs];
                      updated[idx] = e.target.value;
                      setManifestoParagraphs(updated);
                    }}
                    className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setManifestoParagraphs(manifestoParagraphs.filter((_, i) => i !== idx));
                    }}
                    className="p-2 text-[#77736C] hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setManifestoParagraphs([...manifestoParagraphs, "New architectural philosophy paragraph."])}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase text-[#A58A64] hover:underline"
              >
                <Plus size={12} /> Add Paragraph
              </button>
            </div>

            <div className="pt-4 border-t border-[#D8D6D0]">
              <button
                type="submit"
                disabled={savingManifesto}
                className="inline-flex items-center gap-2 bg-[#171717] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors rounded-sm shadow-xs"
              >
                <Save size={14} /> {savingManifesto ? "Saving..." : "Save Manifesto to Website"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: STUDIO CONTACTS & PROFILE */}
      {activeTab === "contacts" && (
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 sm:p-8 space-y-6">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
              Live Website Header & Footer Contact Channels
            </span>
            <h2 className="font-serif text-2xl text-[#111111] mt-1">
              Studio Principal & Official Contact Information
            </h2>
            <p className="text-xs text-[#77736C] mt-1">
              These details are displayed in the website header, footer, inquiry drawer, and client communication channels.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Studio Principal Architect
                </label>
                <input
                  type="text"
                  value={studioPrincipal}
                  onChange={(e) => setStudioPrincipal(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Direct Telephone / WhatsApp
                </label>
                <input
                  type="text"
                  value={studioPhone}
                  onChange={(e) => setStudioPhone(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Official Inquiries Email
                </label>
                <input
                  type="email"
                  value={studioEmail}
                  onChange={(e) => setStudioEmail(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Social Media Handle
                </label>
                <input
                  type="text"
                  defaultValue="@mbs_archeon_ds"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                Studio Headquarters Address
              </label>
              <textarea
                rows={2}
                value={studioAddress}
                onChange={(e) => setStudioAddress(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717]"
              />
            </div>

            <div className="pt-4 border-t border-[#D8D6D0]">
              <button
                type="button"
                onClick={() => {
                  setContactsSaved(true);
                  setTimeout(() => setContactsSaved(false), 3000);
                }}
                className="inline-flex items-center gap-2 bg-[#171717] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors rounded-sm shadow-xs"
              >
                <Save size={14} /> {contactsSaved ? "Saved!" : "Save Studio Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE PROJECT MODAL */}
      {editingProject && (
        <div
          data-lenis-prevent="true"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div
            data-lenis-prevent="true"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] p-6 sm:p-8 shadow-2xl"
          >
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-[#77736C] hover:text-[#171717]"
            >
              <X size={20} />
            </button>

            <div className="border-b border-[#D8D6D0] pb-4">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#9F7947] font-semibold">
                {isCreatingNew ? "Publish New Showcase Project" : "Edit Website Showcase Project"}
              </span>
              <h2 className="mt-1 font-serif text-2xl text-[#111111]">
                {isCreatingNew ? "Add New Portfolio Project" : `Edit: ${formTitle || editingProject.title}`}
              </h2>
              <p className="mt-1 text-xs text-[#77736C]">
                Configure the photograph, title, architectural details, and description displayed on the homepage.
              </p>
            </div>

            <form onSubmit={handleSaveProject} className="mt-6 space-y-4">
              {/* Photo & Image URL */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Showcase Photograph / Image URL *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    required
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="e.g. /projects/monolith-sanctuary.png or https://..."
                    className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                {/* Preset Image Shortcuts */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="font-mono text-[9px] uppercase text-[#77736C] mr-1">Presets:</span>
                  {PRESET_IMAGES.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setFormImage(preset.url)}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        formImage === preset.url
                          ? "bg-[#171717] text-white border-[#171717]"
                          : "bg-white text-[#77736C] border-[#D8D6D0] hover:text-[#171717]"
                      }`}
                    >
                      {preset.label.split("(")[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Image Live Preview */}
                {formImage && (
                  <div className="mt-3 relative w-full h-40 rounded overflow-hidden border border-[#D8D6D0] bg-stone-100">
                    <Image
                      src={formImage}
                      alt="Project Preview"
                      fill
                      className="object-cover"
                      unoptimized={formImage.startsWith("http")}
                    />
                  </div>
                )}
              </div>

              {/* Title & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. The Monolith Sanctuary"
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. PRJ_ARCH_2026_01"
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category, Year, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Discipline / Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  >
                    <option value="Residential">Residential Architecture</option>
                    <option value="Interior">Interior Architecture</option>
                    <option value="Landscape">Landscape Architecture</option>
                    <option value="Commercial">Commercial Architecture</option>
                    <option value="Hospitality">Hospitality & Resorts</option>
                    <option value="Turnkey">Turnkey Execution</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Execution Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Under Execution">Under Execution</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Design">Under Design</option>
                    <option value="Concept">Concept</option>
                  </select>
                </div>
              </div>

              {/* Location & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Site Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Khandala, Maharashtra"
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                    Built Area / Scale
                  </label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="e.g. 8,500 sq.ft or 2.5 Acres"
                    className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>
              </div>

              {/* Architectural Description / Summary */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Architectural Summary & Narrative *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Describe the architectural concept, materials, natural lighting, and site context..."
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              {/* Architectural Tags */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                  Architectural Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. BRUTALIST STONE, CANTILEVER, SUSTAINABLE GEOLOGY"
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#D8D6D0]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-sm border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:bg-[#F2F0EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : isCreatingNew ? "Publish Project" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
