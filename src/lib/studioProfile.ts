export interface StudioOffice {
  id: string;
  label: string;
  address: string;
  mapsUrl?: string;
  isPrimary?: boolean;
}

export interface StudioProfileData {
  principalName: string;
  phone: string;
  email: string;
  socialHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  offices: StudioOffice[];
}

export const DEFAULT_STUDIO_OFFICES: StudioOffice[] = [
  {
    id: "office-nagpur-hq",
    label: "Nagpur Headquarters",
    address:
      "1st Floor, Krishna-Kunj, 90, Dharampeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022",
    mapsUrl: "https://maps.app.goo.gl/wLidaC62gQLccoNY8",
    isPrimary: true,
  },
];

export const DEFAULT_STUDIO_PROFILE: StudioProfileData = {
  principalName: "Ar. Mandar Bhalekar",
  phone: "+91 9834653481",
  email: "dsarcheon@gmail.com",
  socialHandle: "@mbs_archeon_ds",
  instagramUrl: "https://instagram.com/dsarcheon",
  facebookUrl: "https://facebook.com/dsarcheon",
  linkedinUrl: "https://linkedin.com/company/archeon-design-studio",
  offices: DEFAULT_STUDIO_OFFICES,
};

export function parseOfficesJson(officesJson?: string | null): StudioOffice[] {
  if (!officesJson) return DEFAULT_STUDIO_OFFICES;
  try {
    const parsed = JSON.parse(officesJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: Partial<StudioOffice>, idx: number) => ({
        id: item.id || `office-${idx + 1}`,
        label: item.label || `Office ${idx + 1}`,
        address: item.address || "",
        mapsUrl: item.mapsUrl || "",
        isPrimary: typeof item.isPrimary === "boolean" ? item.isPrimary : idx === 0,
      }));
    }
  } catch {}
  return DEFAULT_STUDIO_OFFICES;
}

export function getOfficeMapsHref(office: StudioOffice): string {
  if (office.mapsUrl && office.mapsUrl.trim()) {
    return office.mapsUrl.trim();
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`;
}

export async function fetchPublicStudioProfile(): Promise<StudioProfileData> {
  try {
    const res = await fetch("/api/studio-profile");
    if (!res.ok) return DEFAULT_STUDIO_PROFILE;
    const data = await res.json();
    return {
      principalName: data.principalName || DEFAULT_STUDIO_PROFILE.principalName,
      phone: data.phone || DEFAULT_STUDIO_PROFILE.phone,
      email: data.email || DEFAULT_STUDIO_PROFILE.email,
      socialHandle: data.socialHandle || DEFAULT_STUDIO_PROFILE.socialHandle,
      instagramUrl:
        typeof data.instagramUrl === "string"
          ? data.instagramUrl
          : DEFAULT_STUDIO_PROFILE.instagramUrl,
      facebookUrl:
        typeof data.facebookUrl === "string"
          ? data.facebookUrl
          : DEFAULT_STUDIO_PROFILE.facebookUrl,
      linkedinUrl:
        typeof data.linkedinUrl === "string"
          ? data.linkedinUrl
          : DEFAULT_STUDIO_PROFILE.linkedinUrl,
      offices: parseOfficesJson(data.officesJson),
    };
  } catch {
    return DEFAULT_STUDIO_PROFILE;
  }
}
