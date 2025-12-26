// app/layout.tsx
import "./globals.css";
import { offBit101, offbit } from "./fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${offbit.variable} ${offBit101.variable} antialiased`}>{children}</body>
    </html>
  );
}
