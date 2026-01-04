import type { Metadata } from "next";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Slow Drag Studios — a design and film studio that honours process, people, and stories that don't arrive neatly packaged. We work across advertisements, short films, and documentaries.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us — Slow Drag Studios",
    description:
      "Learn about Slow Drag Studios — a design and film studio that honours process, people, and stories.",
    url: "/about",
    images: [
      {
        url: "/og/og-home.png",
        width: 1200,
        height: 630,
        alt: "About Slow Drag Studios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us — Slow Drag Studios",
    description:
      "Learn about Slow Drag Studios — a design and film studio that honours process, people, and stories.",
    images: ["/og/og-home.png"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
