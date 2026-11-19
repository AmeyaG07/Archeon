"use client";

import React, { useState } from "react";

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
            projects={siteConfig.projects}
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
