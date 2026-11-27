"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/components/ui/Header";
import { OpeningPreloader } from "@/components/ui/OpeningPreloader";
import { ArchitecturalRevealHero } from "@/components/home/ArchitecturalRevealHero";
import { ServicesSection } from "@/components/home/ServicesSection";

const StudioSection = dynamic(
  () => import("@/components/home/StudioSection").then((m) => m.StudioSection),
  { ssr: false }
);
const ProjectsSection = dynamic(
  () => import("@/components/home/ProjectsSection").then((m) => m.ProjectsSection),
  { ssr: false }
);
const ProcessSection = dynamic(
  () => import("@/components/home/ProcessSection").then((m) => m.ProcessSection),
  { ssr: false }
);
const ContactSection = dynamic(
  () => import("@/components/home/ContactSection").then((m) => m.ContactSection),
  { ssr: false }
);
const SiteFooter = dynamic(
  () => import("@/components/home/SiteFooter").then((m) => m.SiteFooter),
  { ssr: false }
);

const ServiceModal = dynamic(
  () => import("@/components/ui/ServiceModal").then((m) => m.ServiceModal),
  { ssr: false }
);
const ProjectDetailModal = dynamic(
  () => import("@/components/ui/ProjectDetailModal").then((m) => m.ProjectDetailModal),
  { ssr: false }
);
const ConsultationModal = dynamic(
  () => import("@/components/ui/ConsultationModal").then((m) => m.ConsultationModal),
  { ssr: false }
);
const ClientPortalModal = dynamic(
  () => import("@/components/ui/ClientPortalModal").then((m) => m.ClientPortalModal),
  { ssr: false }
);
const VendorPortalModal = dynamic(
  () => import("@/components/ui/VendorPortalModal").then((m) => m.VendorPortalModal),
  { ssr: false }
);

import { AudioProvider } from "@/providers/AudioProvider";
import { SmoothScroll } from "@/providers/SmoothScroll";

import {
  siteConfig,
  ServiceItem,
  PortfolioProject,
} from "@/config/siteConfig";

export default function Home() {
  const [selectedService, setSelectedService] =
    useState<ServiceItem | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);

  const [consultationOpen, setConsultationOpen] =
    useState(false);

  const [consultationServiceId, setConsultationServiceId] =
    useState<string | null>(null);

  const [clientPortalOpen, setClientPortalOpen] =
    useState(false);

  const [vendorPortalOpen, setVendorPortalOpen] =
    useState(false);

  const [projects, setProjects] =
    useState<PortfolioProject[]>(siteConfig.projects);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PortfolioProject[] = data.map((p: any) => {
            const matchedPreset = siteConfig.projects.find((sp) => sp.id === p.id);
            let tags: string[] = matchedPreset?.tags ?? [];
            try {
              if (p.tagsJson) tags = JSON.parse(p.tagsJson);
              else if (Array.isArray(p.tags)) tags = p.tags;
            } catch {}

            const category = (p.category || matchedPreset?.category || "Residential") as PortfolioProject["category"];
            const area = p.area || matchedPreset?.area || "Custom";
            const status = (p.status || matchedPreset?.status || "Completed") as PortfolioProject["status"];
            const year = p.projectYear || p.year || matchedPreset?.year || "2026";
            const summary = p.summary || matchedPreset?.heroSummary || "";

            const dynamicMetrics =
              matchedPreset?.metrics && matchedPreset.metrics.length > 0
                ? matchedPreset.metrics.map((m, idx) =>
                    idx === 0 ? { ...m, value: area } : m
                  )
                : [
                    { label: "Built-Up Area", value: area },
                    { label: "Delivery Stage", value: status },
                    { label: "Completion Year", value: year },
                  ];

            const dynamicDeliverables = matchedPreset?.deliverables ?? [
              `${category} Concept & Planning`,
              "3D Architectural Visualisation",
              "GFC Working Drawings",
            ];

            return {
              ...(matchedPreset || siteConfig.projects[0]),
              id: p.id || matchedPreset?.id || String(Math.random()),
              code: p.code || matchedPreset?.code || "ARCHEON_PRJ",
              title: p.title || matchedPreset?.title || "Architectural Commission",
              image: p.image || matchedPreset?.image,
              category,
              location: p.location || matchedPreset?.location || "India",
              area,
              status,
              year,
              heroSummary: summary,
              brief: matchedPreset ? (p.summary || matchedPreset.brief) : summary,
              designResponse: matchedPreset ? matchedPreset.designResponse : "",
              deliverables: dynamicDeliverables,
              metrics: dynamicMetrics,
              tags: tags.length > 0 ? tags : ["Architecture", category],
              accentColor: p.accentColor || matchedPreset?.accentColor || "#A58A64",
            };
          });
          setProjects(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const openConsultationWithService = (serviceId?: string) => {
    setConsultationServiceId(serviceId || "architecture");
    setConsultationOpen(true);
  };

  return (
    <AudioProvider>
      <OpeningPreloader />
      <SmoothScroll>
        <main className="min-h-screen overflow-x-hidden bg-[#F2F0EB] text-[#111111]">
          {/* Global Header */}
          <Header
            lightingMode="noon"
            onSelectLighting={() => {}}
            wireframeMode={false}
            onToggleWireframe={() => {}}
            onOpenConsultation={() => openConsultationWithService()}
            onOpenClientPortal={() => setClientPortalOpen(true)}
            onOpenVendorPortal={() => setVendorPortalOpen(true)}
          />

          {/* 1. Architectural Reveal Hero */}
          <ArchitecturalRevealHero
            onOpenConsultation={() => openConsultationWithService()}
          />

          {/* 2. The Studio */}
          <StudioSection />

          {/* 3. Expertise & Services */}
          <ServicesSection
            services={siteConfig.services}
            onSelectService={setSelectedService}
          />

          {/* 4. Selected Projects */}
          <ProjectsSection
            projects={projects}
            onSelectProject={setSelectedProject}
          />

          {/* 5. Design Process */}
          <ProcessSection
            onOpenConsultation={() => openConsultationWithService()}
          />

          {/* 6. Contact & Consultation */}
          <ContactSection
            onOpenConsultation={() => openConsultationWithService()}
          />

          {/* 7. Website Footer */}
          <SiteFooter
            onOpenClientPortal={() => setClientPortalOpen(true)}
            onOpenVendorPortal={() => setVendorPortalOpen(true)}
            onOpenConsultation={() => openConsultationWithService()}
          />

          {/* Interactive Modals (loaded on demand when opened) */}
          {selectedService && (
            <ServiceModal
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onEnquire={(serviceId) =>
                openConsultationWithService(serviceId)
              }
            />
          )}

          {selectedProject && (
            <ProjectDetailModal
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
              onEnquire={(serviceId) => openConsultationWithService(serviceId)}
            />
          )}

          {consultationOpen && (
            <ConsultationModal
              isOpen={consultationOpen}
              onClose={() => setConsultationOpen(false)}
              defaultServiceId={consultationServiceId}
            />
          )}

          {clientPortalOpen && (
            <ClientPortalModal
              isOpen={clientPortalOpen}
              onClose={() => setClientPortalOpen(false)}
            />
          )}

          {vendorPortalOpen && (
            <VendorPortalModal
              isOpen={vendorPortalOpen}
              onClose={() => setVendorPortalOpen(false)}
            />
          )}
        </main>
      </SmoothScroll>
    </AudioProvider>
  );
}
