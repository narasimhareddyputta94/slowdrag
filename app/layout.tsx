import "./globals.css";
import { offBit101, offbit } from "./fonts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Slow Drag Studios",
    template: "%s — Slow Drag Studios",
  },
  description:
    "Slow Drag Studios is a creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",
  metadataBase: new URL("https://www.slowdragstudio.com"),
  openGraph: {
    title: "Slow Drag Studios",
    description:
      "A creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",
    url: "https://www.slowdragstudio.com",
    siteName: "Slow Drag Studios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slow Drag Studios",
    description:
      "A creative design and film studio built against haste — films, images, and design systems that stay long after the scroll ends.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${offbit.variable} ${offBit101.variable} antialiased`}>{children}</body>
    </html>
  );
}
