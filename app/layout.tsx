import "./globals.css";
import { offBit101, offbit } from "./fonts";
import type { Metadata } from "next";
import PerfLoggerGate from "@/components/perf/PerfLoggerGate";
import PerfDiagnosticsGate from "@/components/perf/PerfDiagnosticsGate";

const siteUrl = "https://www.slowdragstudio.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Slow Drag Studios",
    template: "%s — Slow Drag Studios",
  },

  description:
    "Slow Drag Studios is a creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",

  applicationName: "Slow Drag Studios",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Slow Drag Studios",
    title: "Slow Drag Studios",
    description:
      "A creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",
    images: [
      {
        url: "/og/og-home.png", // create this
        width: 1200,
        height: 630,
        alt: "Slow Drag Studios",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Slow Drag Studios",
    description:
      "A creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",
    images: ["/og/og-home.png"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },

  // Optional: if you want PWA-ish polish
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // themeColor: "#000000", // optional
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical hero images for faster LCP */}
        <link
          rel="preload"
          as="image"
          href="/images/titleimage-1920.webp"
          type="image/webp"
          media="(min-width: 769px)"
        />
        <link
          rel="preload"
          as="image"
          href="/images/titleimage-1200.webp"
          type="image/webp"
          media="(max-width: 768px)"
        />
      </head>
      <body className={`${offbit.variable} ${offBit101.variable} antialiased`}>
        {/* Make sure these gates are NO-OP or super lightweight in production */}
        <PerfLoggerGate />
        <PerfDiagnosticsGate />
        {children}
      </body>
    </html>
  );
}
