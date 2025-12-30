import "./contact.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Slow Drag Studios. Let's create films, images, and design systems that stay long after the scroll ends.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact — Slow Drag Studios",
    description:
      "Get in touch with Slow Drag Studios. Let's create films, images, and design systems that stay.",
    url: "/contact",
    images: [
      {
        url: "/og/og-home.png",
        width: 1200,
        height: 630,
        alt: "Contact Slow Drag Studios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Slow Drag Studios",
    description:
      "Get in touch with Slow Drag Studios. Let's create films, images, and design systems that stay.",
    images: ["/og/og-home.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
