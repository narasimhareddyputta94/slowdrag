// app/layout.tsx
import "./globals.css";
import { offbit } from "./fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${offbit.variable} antialiased`}>{children}</body>
    </html>
  );
}
