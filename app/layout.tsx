import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slow Drag | Stories That Refuse to Rush",
  description: "Photography, branding, and storytelling studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}