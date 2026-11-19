
"use client";

import React, { useState } from "react";

import { Header } from "@/components/ui/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ContactSection } from "@/components/home/ContactSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { StudioSection } from "@/components/home/StudioSection";


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
      <SmoothScroll>
        <main className="min-h-screen overflow-x-hidden bg-[#F2F0EB] text-[#111111]">
          <Header
            lightingMode="noon"
            onSelectLighting={() => {}}
            wireframeMode={false}
            onToggleWireframe={() => {}}
            onOpenConsultation={() => openConsultationWithService()}
            onOpenClientPortal={() => setClientPortalOpen(true)}
            onOpenVendorPortal={() => setVendorPortalOpen(true)}
          />

          <HeroSection
            onOpenConsultation={() => openConsultationWithService()}
          />

{/* Expertise and Services */}
<ServicesSection
  services={siteConfig.services}
  onSelectService={setSelectedService}
/>

{/* Selected Projects */}
<ProjectsSection
  projects={siteConfig.projects}
  onSelectProject={setSelectedProject}
/>

{/* Design Process */}
<ProcessSection
  onOpenConsultation={() => openConsultationWithService()}
/>

{/* Contact */}
<ContactSection
  onOpenConsultation={() => openConsultationWithService()}
/>

{/* Website Footer */}
<SiteFooter
  onOpenClientPortal={() => setClientPortalOpen(true)}
  onOpenVendorPortal={() => setVendorPortalOpen(true)}
/>
          <section
            id="studio"
            className="editorial-container py-24 sm:py-32"
          >
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <p className="editorial-eyebrow text-[#B68A4A]">
                  01 / The Studio
                </p>
                <h2 className="mt-5 font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl">
                  Design with
                  <br />
                  <span className="italic">purpose.</span>
                </h2>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <p className="text-xl font-light leading-relaxed text-[#33312D] sm:text-2xl">
                  {siteConfig.missionStatement}
                </p>

                <p className="mt-8 max-w-2xl text-sm leading-8 text-[#777777]">
                  {siteConfig.about.story}
                </p>

                <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-[#B68A4A]">
                  {siteConfig.principal}
                </p>
              </div>
            </div>
          </section>

          {/* Existing Service Modal */}
          <ServiceModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onEnquire={(serviceId) =>
              openConsultationWithService(serviceId)
            }
          />

          {/* Existing Project Modal */}
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onEnquire={() => openConsultationWithService()}
          />

          {/* Existing Consultation Modal */}
          <ConsultationModal
            isOpen={consultationOpen}
            onClose={() => setConsultationOpen(false)}
            defaultServiceId={consultationServiceId}
          />

          {/* Existing Client Portal Modal */}
          <ClientPortalModal
            isOpen={clientPortalOpen}
            onClose={() => setClientPortalOpen(false)}
          />

          {/* Existing Vendor Portal Modal */}
          <VendorPortalModal
            isOpen={vendorPortalOpen}
            onClose={() => setVendorPortalOpen(false)}
          />
        </main>
      </SmoothScroll>
    </AudioProvider>

    
  );
}
