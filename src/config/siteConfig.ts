export interface ServiceItem {
  id: string;
  code: string;
  title: string;
  tagline: string;
  scope: string[];
  deliverables: string[];
  enquiryFields: string[];
  accentColor: string;
  leadArchitect?: string;
  timeline?: string;
  philosophy?: string;
  phases?: {
    step: string;
    title: string;
    duration: string;
    description: string;
  }[];
  standards?: string[];
}

export interface PortfolioProject {
  id: string;
  code: string;
  title: string;
  image?: string;
  category: "Residential" | "Commercial" | "Interior" | "Landscape" | "Turnkey";
  location: string;
  year: string;
  area: string;
  status: "Completed" | "Under Execution" | "Approved Design";
  heroSummary: string;
  brief: string;
  designResponse: string;
  deliverables: string[];
  tags: string[];
  accentColor: string;
  metrics?: { label: string; value: string }[];
}

export interface SiteConfig {
  name: string;
  businessDisplayName: string;
  logo: string;
  handle: string;
  principal: string;
  registrationNote: string;
  legalEntityNote: string;
  gstinNote: string;
  tagline: string;
  philosophy: string;
  missionStatement: string;
  approvalPolicy: {
    highValueThreshold: number;
    thresholdCurrency: string;
    status: string;
  };
  about: {
    story: string;
    approach: string[];
  };
  services: ServiceItem[];
  projects: PortfolioProject[];
  alliedOrganisations: {
    name: string;
    category: string;
    relationship: string;
  }[];
  contact: {
    office: string;
    mapsUrl: string;
    directionsUrl: string;
    phone: string;
    whatsapp: string;
    email: string;
    hours: string;
  };
  copyright: string;
  rights: string;
}

export const siteConfig: SiteConfig = {
  name: "ArcheOn Design Studio",
  businessDisplayName: "MB's ArcheOn Design Studio",
  logo: "/brand-assets/logo.png",
  handle: "@mbs_archeon_ds",
  principal: "Ar. Mandar Bhalekar",
  registrationNote: "Principal Architect & Urbanist",
  legalEntityNote: "[REGISTERED LEGAL ENTITY: PENDING BUSINESS CONFIRMATION]",
  gstinNote: "[GSTIN: PENDING BUSINESS CONFIRMATION]",
  tagline: "Architecture • Interior • Landscape • 3D Visualiser • Turnkey",
  philosophy:
    "Sculpting spaces from raw earth, monolithic stone, and controlled light. Where elemental purity meets precision execution.",
  missionStatement:
    "We design and build considered spatial environments that seamlessly harmonize architectural form, interior craft, natural landscape, and turnkey engineering.",
  approvalPolicy: {
    highValueThreshold: 100000,
    thresholdCurrency: "INR",
    status: "PROVISIONAL (PENDING BUSINESS APPROVAL)"
  },
  about: {
    story:
      "ArcheOn Design Studio, founded and led by Ar. Mandar Bhalekar, is a multidisciplinary practice operating at the convergence of architectural innovation, interior styling, landscape ecology, and end-to-end turnkey delivery.",
    approach: [
      "Monolithic & Contextual: Rooting every project in its geographical landscape, climate, and stone geology.",
      "Integrated Turnkey Execution: Removing the friction between abstract concept drawings and on-site material craft.",
      "Light as Material: Carving spatial voids to harness seasonal sun paths, natural shadows, and ventilation."
    ]
  },
  services: [
    {
      id: "architecture",
      code: "STUDIO_SRV_01",
      title: "Architecture",
      tagline: "Concept, spatial planning, schematic development & consultant coordination.",
      leadArchitect: "Ar. Mandar Bhalekar",
      timeline: "8 to 16 Weeks (Concept to GFC)",
      philosophy: "Sculpting monolithic spatial geometries attuned to seasonal solar vectors, terrain topography, and enduring material purity.",
      phases: [
        {
          step: "01",
          title: "Contextual Analysis & Volumetric Massing",
          duration: "Weeks 1–3",
          description: "Site micro-climate analysis, solar orientation modeling, zoning permutations, and preliminary volume massing studies."
        },
        {
          step: "02",
          title: "Schematic & Architectural Development",
          duration: "Weeks 4–8",
          description: "3D architectural form development, tectonic facade framing, structural grid alignment, and material palette calibration."
        },
        {
          step: "03",
          title: "Statutory Approvals & GFC Documentation",
          duration: "Weeks 9–14+",
          description: "Comprehensive working drawings, MEP/structural engineering coordination, authority sanctions, and site layout handover."
        }
      ],
      standards: ["NBC 2016 Compliant", "Tectonic 1:1 Scale Detailing", "Green Building Architecture", "BIM Integrated"],
      scope: [
        "Concept & Master Spatial Planning",
        "Feasibility & Solar Orientation Studies",
        "Schematic & Design Development",
        "GFC Drawings & Statutory Support",
        "Structural & MEP Consultant Coordination"
      ],
      deliverables: ["Schematic 3D Models", "Working Drawings", "Statutory Submission Packs", "Site Supervision"],
      enquiryFields: ["Plot Location", "Land Area", "Built-up Area", "New Build vs Renovation", "Target Timeline"],
      accentColor: "#d97706"
    },
    {
      id: "interior",
      code: "STUDIO_SRV_02",
      title: "Interior Design",
      tagline: "Space planning, bespoke furniture, material moodboards & artisan styling.",
      leadArchitect: "Ar. Mandar Bhalekar",
      timeline: "6 to 12 Weeks (Design to Procurement)",
      philosophy: "Bespoke spatial ergonomics sculpted with tactile natural stones, hand-planed timbers, and calibrated architectural lighting.",
      phases: [
        {
          step: "01",
          title: "Spatial Zoning & Material Moodboards",
          duration: "Weeks 1–2",
          description: "Ergonomic circulation planning, custom finish moodboards, tactile stone/wood swatches, and conceptual spatial narratives."
        },
        {
          step: "02",
          title: "3D Photorealistic Perspectives & Millwork",
          duration: "Weeks 3–6",
          description: "Ray-traced interior renders, bespoke furniture schematics, ceiling design, and architectural lighting lux simulations."
        },
        {
          step: "03",
          title: "Detailed Joinery & Vendor Procurement",
          duration: "Weeks 7–10+",
          description: "Production-ready joinery drawings, finish schedules, artisan fabric sourcing, and turnkey procurement documentation."
        }
      ],
      standards: ["Bespoke Artisan Joinery", "High-CRI Lighting Design", "Zero-VOC Natural Finishes", "Turnkey Procurement Protocol"],
      scope: [
        "Spatial Zoning & Ergonomics",
        "Material & Finish Schedules (Stone, Timber, Metal)",
        "Custom Millwork & Lighting Engineering",
        "Detailed Joinery & Electrical Schematics",
        "Styling, Procurement & Handover"
      ],
      deliverables: ["Material Moodboards", "3D Photoreal Perspectives", "Custom Millwork Drawings", "Procurement Schedule"],
      enquiryFields: ["Property Type (Villa/Apartment/Commercial)", "Carpet Area", "Occupancy Details", "Budget Band"],
      accentColor: "#ea580c"
    },
    {
      id: "landscape",
      code: "STUDIO_SRV_03",
      title: "Landscape Architecture",
      tagline: "Outdoor zoning, climate-responsive planting, water features & hardscaping.",
      leadArchitect: "Ar. Mandar Bhalekar",
      timeline: "4 to 8 Weeks",
      philosophy: "Dissolving interior-exterior boundaries through endemic botanical micro-forests, water reflection courts, and natural stone hardscapes.",
      phases: [
        {
          step: "01",
          title: "Microclimate & Soil Topography",
          duration: "Weeks 1–2",
          description: "Slope contour analysis, drainage hydrology mapping, seasonal sun vectors, and native soil strata profiling."
        },
        {
          step: "02",
          title: "Zoning, Water Features & Hardscape",
          duration: "Weeks 3–5",
          description: "Courtyard layout, reflective infinity pools, endemic stone paving layouts, and pergolas designed for climatic shade."
        },
        {
          step: "03",
          title: "Botanical Palette & Night Illumination",
          duration: "Weeks 6–8",
          description: "Indigenous botanical selection, drip-irrigation layouts, and low-glare warm 2700K landscape illumination schematics."
        }
      ],
      standards: ["Xeriscape Water Efficiency", "Endemic Flora Taxonomy", "Sustainable Stormwater Drainage", "Zero-Glare Dark Sky Illumination"],
      scope: [
        "Site Microclimate & Soil Analysis",
        "Outdoor Circulation & Terrace Zoning",
        "Native Botanical & Xeriscape Strategy",
        "Hardscape, Paving & Pool Engineering",
        "Architectural Landscape Illumination"
      ],
      deliverables: ["Landscape Masterplan", "Grading & Drainage Layouts", "Planting Palette", "Lighting Schedule"],
      enquiryFields: ["Site Area", "Terrain Topography", "Existing Vegetation", "Maintenance Preferences"],
      accentColor: "#059669"
    },
    {
      id: "visualization",
      code: "STUDIO_SRV_04",
      title: "3D Visualisation",
      tagline: "Cinematic spatial renderings, lighting studies, VR tours & architectural film.",
      leadArchitect: "Ar. Mandar Bhalekar",
      timeline: "2 to 4 Weeks",
      philosophy: "Hyper-realistic architectural film and atmospheric imagery capturing tactile materiality, sun shadows, and cinematic spatial depth.",
      phases: [
        {
          step: "01",
          title: "BIM / CAD Ingestion & Geometry Polish",
          duration: "Week 1",
          description: "Detailed volumetric modeling, architectural bevels, chamfers, and accurate site terrain elevation alignment."
        },
        {
          step: "02",
          title: "Physically-Based Lighting & Materials",
          duration: "Weeks 2–3",
          description: "Calibrated PBR stone/metal textures, diurnal daylight simulations, ambient interior artificial lighting, and twilight atmospheres."
        },
        {
          step: "03",
          title: "Cinematic Renders & Fly-Through Film",
          duration: "Week 4",
          description: "4K ultra-high-resolution still perspectives, camera fly-through sequences, and immersive VR interactive walkthroughs."
        }
      ],
      standards: ["4K Ultra-HD Output", "ACES Color Pipeline", "Physically-Accurate IES Lighting", "VR 360° Panoramas"],
      scope: [
        "High-Fidelity 3D BIM/CAD Modeling",
        "Exterior & Interior Daylight/Twilight Studies",
        "Cinematic Camera Walkthroughs & Animation",
        "Material Tactility & Specular Calibration",
        "Revision Rounds & Ultra-High-Res Output"
      ],
      deliverables: ["4K Renders", "Camera Fly-Through Animations", "Virtual Reality Environments", "Presentation Decks"],
      enquiryFields: ["CAD/Model Availability", "Required Number of Perspectives", "Target Resolution", "Deadline"],
      accentColor: "#0284c7"
    },
    {
      id: "turnkey",
      code: "STUDIO_SRV_05",
      title: "Turnkey Execution",
      tagline: "Single-window accountability from foundation to styling and defect-free handover.",
      leadArchitect: "Ar. Mandar Bhalekar",
      timeline: "6 to 18 Months (Scale Dependent)",
      philosophy: "Uncompromising single-point accountability bridging theoretical blueprints with immaculate on-site tectonic craftsmanship.",
      phases: [
        {
          step: "01",
          title: "BOQ & Precision Cost Engineering",
          duration: "Weeks 1–3",
          description: "Comprehensive itemized quantities, vendor contracting, cashflow milestones, and critical path scheduling."
        },
        {
          step: "02",
          title: "Supervised Civil & Tectonic Assembly",
          duration: "Ongoing",
          description: "Daily on-site milestone oversight, material cube testing, structural integrity inspections, and bi-weekly client video reports."
        },
        {
          step: "03",
          title: "Defect-Free Snagging & Handover",
          duration: "Final Month",
          description: "Rigorous multi-tier quality snagging, warranty dossiers, testing certificates, and key handover ceremony."
        }
      ],
      standards: ["Milestone Escrow Assurance", "Daily On-Site QA Reports", "Vendor Transparency Protocol", "12-Month Defect Liability Guarantee"],
      scope: [
        "Comprehensive BOQ & Cost Engineering",
        "Vendor Procurement & Material Testing",
        "On-Site Schedule & Milestone Management",
        "Rigorous Multi-Tier Quality Audits",
        "Post-Handover Defect Liability Protocol"
      ],
      deliverables: ["Itemized BOQ", "Critical Path Schedule", "Bi-Weekly Progress Reports", "Final Handover Dossier"],
      enquiryFields: ["Project Location", "Approved Design Availability", "Target Handover Date", "Capital Budget Range"],
      accentColor: "#7c3aed"
    }
  ],
  projects: [
    {
      id: "the-monolith-sanctuary",
      code: "PRJ_ARCH_2026_01",
      title: "The Monolith Sanctuary",
      image: "/projects/monolith-sanctuary.png",
      category: "Residential",
      location: "Khandala, Maharashtra",
      year: "2026",
      area: "8,500 sq.ft",
      status: "Completed",
      heroSummary:
        "A subterranean cliffside retreat sculpted into basalt rock, featuring central travertine light-wells and reflecting water pools.",
      brief:
        "The client required a tranquil private sanctuary integrated directly into the steep contours of a rocky hillside without disturbing the natural terrain.",
      designResponse:
        "We carved the structure into the basalt stone strata, utilizing locally quarried stone walls and cantilevered exposed concrete slabs that frame panoramic valley vistas.",
      deliverables: ["Architectural Design", "Structural Coordination", "Interior Styling", "Turnkey Build"],
      tags: ["BRUTALIST STONE", "CANTILEVER", "SUSTAINABLE GEOLOGY"],
      accentColor: "#d97706",
      metrics: [
        { label: "Built-up Area", value: "8,500 sq.ft" },
        { label: "Energy Efficiency", value: "Net-Zero Thermal Mass" },
        { label: "Execution Timeline", value: "14 Months" }
      ]
    },
    {
      id: "carrara-stone-penthouse",
      code: "PRJ_INT_2025_04",
      title: "The Travertine Penthouse",
      image: "/projects/travertine-penthouse.png",
      category: "Interior",
      location: "Worli, Mumbai",
      year: "2025",
      area: "4,200 sq.ft",
      status: "Completed",
      heroSummary:
        "A minimalist coastal residence finished with monolithic travertine wall planes, brushed bronze joinery, and concealed lighting channels.",
      brief:
        "Transform an expansive bare-shell luxury apartment into a warm minimalist home celebrating raw materiality and unobstructed Arabian Sea views.",
      designResponse:
        "Custom acoustic plaster ceilings combined with fluted natural travertine partitions create serene spatial transitions between living and private suites.",
      deliverables: ["Full Interior Architecture", "Custom Millwork", "Smart Lighting Automation", "Procurement"],
      tags: ["WARM MINIMALISM", "TRAVERTINE", "BESPOKE JOINERY"],
      accentColor: "#ea580c",
      metrics: [
        { label: "Carpet Area", value: "4,200 sq.ft" },
        { label: "Custom Millwork", value: "100% Handcrafted" },
        { label: "Lighting Scenes", value: "Dynamic Circadian" }
      ]
    },
    {
      id: "terracotta-courtyard-estate",
      code: "PRJ_LAND_2026_02",
      title: "Terracotta Courtyard Estate",
      image: "/projects/terracotta-courtyard-estate.png",
      category: "Landscape",
      location: "Alibaug, Maharashtra",
      year: "2026",
      area: "2.5 Acres",
      status: "Under Execution",
      heroSummary:
        "A multi-tiered landscape ecosystem with stepped rainwater bio-swales, endemic tropical groves, and earthen water bodies.",
      brief:
        "Develop the surrounding 2.5-acre estate of an ancestral bungalow to withstand coastal monsoon deluges while providing lush, low-maintenance outdoor living.",
      designResponse:
        "Engineered stepped earth retaining walls, permeable gravel pathways, and shade-yielding palm groves connected by a linear stone reflection canal.",
      deliverables: ["Landscape Masterplan", "Hydro-Zoning", "Hardscape Construction", "Planting"],
      tags: ["ECO-LANDSCAPE", "RAINWATER HARVESTING", "NATIVE FLORA"],
      accentColor: "#059669",
      metrics: [
        { label: "Estate Area", value: "2.5 Acres" },
        { label: "Water Retention", value: "100% On-Site" },
        { label: "Plant Species", value: "48 Native Varieties" }
      ]
    }
  ],
  alliedOrganisations: [
    { name: "Apex Structural Engineers", category: "Consultants", relationship: "Structural Engineering Partner" },
    { name: "Terra MEP Solutions", category: "Consultants", relationship: "HVAC & Electrical Design" },
    { name: "Vedic Stone Quarry", category: "Material Partners", relationship: "Basalt & Travertine Supplier" },
    { name: "Urban Steel Fabricators", category: "Contractors", relationship: "Custom Architectural Steelwork" }
  ],
  contact: {
    office: "1st Floor, Krishna-Kunj, 90, Dharempeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022, India.",
    mapsUrl: "https://maps.app.goo.gl/wLidaC62gQLccoNY8",
    directionsUrl: "https://maps.app.goo.gl/wLidaC62gQLccoNY8",
    phone: "[OFFICIAL PHONE: PENDING BUSINESS CONFIRMATION]",
    whatsapp: "[OFFICIAL WHATSAPP: PENDING BUSINESS CONFIRMATION]",
    email: "contact@archeon-ds.com",
    hours: "Monday – Saturday: 10:00 AM – 7:00 PM IST"
  },
  copyright: "© 2026 ArcheOn Design Studio",
  rights: "All Rights Reserved. Architecture • Interior • Landscape • Turnkey."
};
