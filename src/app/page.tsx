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
import { apiFetch } from "@/lib/api";

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
    apiFetch("/api/operational-projects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PortfolioProject[] = data.map((p: any) => {
            const base = siteConfig.projects.find((sp) => sp.id === p.id) || siteConfig.projects[0];
            let tags: string[] = base.tags;
            try {
              if (p.tagsJson) tags = JSON.parse(p.tagsJson);
              else if (Array.isArray(p.tags)) tags = p.tags;
            } catch {}

            return {
              ...base,
              id: p.id || base.id,
              code: p.code || base.code,
              title: p.title || base.title,
              image: p.image || base.image,
              category: (p.category || base.category) as any,
              location: p.location || base.location,
              area: p.area || base.area,
              status: (p.status || base.status) as any,
              year: p.projectYear || p.year || base.year,
              heroSummary: p.summary || base.heroSummary,
              brief: p.summary || base.brief,
              designResponse: p.summary || base.designResponse,
              tags: tags.length > 0 ? tags : base.tags,
              accentColor: p.accentColor || base.accentColor,
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
            onEnquire={() => openConsultationWithService()}
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
