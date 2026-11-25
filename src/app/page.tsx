"use client";

import React, { useState, useEffect } from "react";

import { Header } from "@/components/ui/Header";
import { OpeningPreloader } from "@/components/ui/OpeningPreloader";
import { ArchitecturalRevealHero } from "@/components/home/ArchitecturalRevealHero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { StudioSection } from "@/components/home/StudioSection";
import { ContactSection } from "@/components/home/ContactSection";
import { SiteFooter } from "@/components/home/SiteFooter";

import { ServiceModal } from "@/components/ui/ServiceModal";
import { ProjectDetailModal } from "@/components/ui/ProjectDetailModal";
import { ConsultationModal } from "@/components/ui/ConsultationModal";
import { ClientPortalModal } from "@/components/ui/ClientPortalModal";
import { VendorPortalModal } from "@/components/ui/VendorPortalModal";

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

          {/* Interactive Modals */}
          <ServiceModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onEnquire={(serviceId) =>
              openConsultationWithService(serviceId)
            }
          />

          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onEnquire={(serviceId) => openConsultationWithService(serviceId)}
          />

          <ConsultationModal
            isOpen={consultationOpen}
            onClose={() => setConsultationOpen(false)}
            defaultServiceId={consultationServiceId}
          />

          <ClientPortalModal
            isOpen={clientPortalOpen}
            onClose={() => setClientPortalOpen(false)}
          />

          <VendorPortalModal
            isOpen={vendorPortalOpen}
            onClose={() => setVendorPortalOpen(false)}
          />
        </main>
      </SmoothScroll>
    </AudioProvider>
  );
}
