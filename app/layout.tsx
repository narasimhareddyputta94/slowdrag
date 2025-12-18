import "./globals.css";

export const metadata = {
  title: "SLOW DRAG",
  description: "SLOW DRAG STUDIO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
