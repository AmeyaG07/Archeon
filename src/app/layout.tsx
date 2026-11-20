
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ArchitecturalCursor } from "@/components/ui/ArchitecturalCursor";

export const metadata: Metadata = {
  title: {
    default: "ArcheOn Design Studio | Architecture & Interior Design",
    template: "%s | ArcheOn Design Studio",
  },
  description:
    "ArcheOn Design Studio, led by Ar. Mandar Bhalekar, offers architecture, interior design, landscape architecture, 3D visualisation and turnkey execution.",
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "ArcheOn Design Studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F0EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#F2F0EB]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen bg-[#F2F0EB] text-[#111111] antialiased">
        <ArchitecturalCursor />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
